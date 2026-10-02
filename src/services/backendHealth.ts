/**
 * FAM2PLAY Backend Health & Cold-Start Connection Service
 *
 * Handles detection and graceful UX for Render Free Web Service cold starts
 * without blocking initial frontend rendering or duplicating room actions.
 */

import { getApiUrl } from '../config/network';
import { LA_CRIPTA_SCHEMA_VERSION } from '../data/la-cripta/criptaCatalog';

export interface BackendConnectionState {

  isOverlayVisible: boolean;
  statusTitle: string;
  subText: string;
  stepText: string;
  elapsedSeconds: number;
  isTimedOut: boolean;
  errorMessage: string | null;
}

type StateListener = (state: BackendConnectionState) => void;

class BackendHealthService {
  private lastHealthyTimestamp: number = 0;
  private readonly HEALTH_CACHE_TTL_MS = 25000; // 25s cache if already warm
  private readonly OVERLAY_DELAY_MS = 900; // 900ms wait before showing overlay
  private readonly MAX_WAIT_MS = 60000; // 60s max wait for Render cold start

  private inFlightPromise: Promise<boolean> | null = null;
  private abortController: AbortController | null = null;
  private overlayTimer: ReturnType<typeof setTimeout> | null = null;
  private elapsedInterval: ReturnType<typeof setInterval> | null = null;

  private listeners = new Set<StateListener>();

  private state: BackendConnectionState = {
    isOverlayVisible: false,
    statusTitle: 'CONECTANDO CON LOS SERVICIOS EN LÍNEA…',
    subText: 'Estamos preparando el servidor para tu partida.\nPuede tardar unos segundos.',
    stepText: 'CONECTANDO…',
    elapsedSeconds: 0,
    isTimedOut: false,
    errorMessage: null,
  };

  /**
   * Subscribe to connection state updates.
   */
  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): BackendConnectionState {
    return this.state;
  }

  private updateState(partial: Partial<BackendConnectionState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (e) {
        console.error('[BackendHealth] Error notifying listener:', e);
      }
    });
  }

  /**
   * Mark backend as confirmed healthy right now (e.g. after successful WS connect or REST call).
   */
  public markHealthy(): void {
    this.lastHealthyTimestamp = Date.now();
    if (this.state.isOverlayVisible) {
      this.updateState({
        stepText: '¡LISTO!',
      });
      setTimeout(() => {
        this.resetOverlay();
      }, 400);
    }
  }

  /**
   * Checks if backend is currently known to be awake.
   */
  public isWarm(): boolean {
    return Date.now() - this.lastHealthyTimestamp < this.HEALTH_CACHE_TTL_MS;
  }

  /**
   * Single probe attempt to /api/health or /health.
   */
  private async probeHealth(signal?: AbortSignal): Promise<boolean> {
    const healthUrl = getApiUrl('/api/health');
    try {
      const probeController = new AbortController();
      const probeTimeout = setTimeout(() => probeController.abort(), 6000);

      // Link external abort signal if provided
      if (signal) {
        signal.addEventListener('abort', () => probeController.abort(), { once: true });
      }

      const res = await fetch(healthUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: probeController.signal,
      });

      clearTimeout(probeTimeout);

      if (res.ok) {
        this.lastHealthyTimestamp = Date.now();
        res
          .json()
          .then((data) => {
            if (data?.laCriptaSchemaVersion !== undefined) {
              if (
                typeof data.laCriptaSchemaVersion === 'number' &&
                data.laCriptaSchemaVersion < LA_CRIPTA_SCHEMA_VERSION
              ) {
                console.warn(
                  `[LaCripta] Production backend version mismatch! Remote server schema is v${data.laCriptaSchemaVersion} (${data.laCriptaCharactersCount || 6} characters), but client requires schema v${LA_CRIPTA_SCHEMA_VERSION} (9 characters). Please redeploy the Render Web Service with latest backend build.`
                );
              }
            }
          })
          .catch(() => {});
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Ensures backend is ready before proceeding with an online operation.
   * If backend is already awake, resolves immediately without flashing any modal.
   * If waking up, reveals the polished connecting overlay after ~900ms.
   *
   * Deduplicates concurrent calls to avoid duplicate server probes.
   */
  public async ensureBackendAvailable(options?: {
    customActionName?: string;
  }): Promise<boolean> {
    // 1. Fast path: recently confirmed healthy
    if (this.isWarm()) {
      return true;
    }

    // 2. Return existing in-flight check if one is already running
    if (this.inFlightPromise) {
      return this.inFlightPromise;
    }

    this.abortController = new AbortController();
    const currentSignal = this.abortController.signal;
    const startTime = Date.now();

    this.inFlightPromise = new Promise<boolean>(async (resolve, reject) => {
      let isResolved = false;

      const cleanup = () => {
        if (this.overlayTimer) {
          clearTimeout(this.overlayTimer);
          this.overlayTimer = null;
        }
        if (this.elapsedInterval) {
          clearInterval(this.elapsedInterval);
          this.elapsedInterval = null;
        }
        this.inFlightPromise = null;
        this.abortController = null;
      };

      const handleAbort = () => {
        if (isResolved) return;
        isResolved = true;
        cleanup();
        this.resetOverlay();
        const err = new Error('OPERATION_CANCELLED');
        err.name = 'AbortError';
        reject(err);
      };

      currentSignal.addEventListener('abort', handleAbort, { once: true });

      // Start elapsed timer and overlay reveal timer
      this.overlayTimer = setTimeout(() => {
        if (!isResolved) {
          this.updateState({
            isOverlayVisible: true,
            statusTitle: 'CONECTANDO CON LOS SERVICIOS EN LÍNEA…',
            subText: 'Estamos preparando el servidor para tu partida.\nPuede tardar unos segundos.',
            stepText: 'CONECTANDO…',
            elapsedSeconds: Math.floor((Date.now() - startTime) / 1000),
            isTimedOut: false,
            errorMessage: null,
          });

          this.elapsedInterval = setInterval(() => {
            if (isResolved) return;
            const elapsed = Math.floor((Date.now() - startTime) / 1000);

            let step = 'CONECTANDO…';
            if (elapsed >= 18) {
              step = 'CASI LISTO…';
            } else if (elapsed >= 10) {
              step = 'PREPARANDO LA SALA…';
            } else if (elapsed >= 4) {
              step = 'INICIANDO SERVIDOR…';
            }

            this.updateState({
              elapsedSeconds: elapsed,
              stepText: step,
            });

            // Check max wait timeout
            if (elapsed * 1000 >= this.MAX_WAIT_MS) {
              this.updateState({
                isTimedOut: true,
                errorMessage:
                  'El servidor está tardando más de lo habitual en despertar. Puedes reintentar ahora o esperar unos instantes.',
              });
            }
          }, 1000);
        }
      }, this.OVERLAY_DELAY_MS);

      // Probe loop
      while (!isResolved && !currentSignal.aborted) {
        const isHealthy = await this.probeHealth(currentSignal);

        if (isHealthy) {
          isResolved = true;
          cleanup();

          if (this.state.isOverlayVisible) {
            this.updateState({ stepText: '¡CONECTADO!' });
            setTimeout(() => {
              this.resetOverlay();
              resolve(true);
            }, 350);
          } else {
            this.resetOverlay();
            resolve(true);
          }
          return;
        }

        // Check if timed out
        if (Date.now() - startTime >= this.MAX_WAIT_MS) {
          // Allow loop to pause and wait for user retry or cancel
          break;
        }

        // Wait before next probe (2.2 seconds between probes)
        try {
          await new Promise<void>((res, rej) => {
            const timer = setTimeout(res, 2200);
            currentSignal.addEventListener(
              'abort',
              () => {
                clearTimeout(timer);
                rej(new Error('ABORTED'));
              },
              { once: true }
            );
          });
        } catch {
          if (!isResolved) {
            handleAbort();
          }
          return;
        }
      }

      if (!isResolved && !currentSignal.aborted) {
        // Did not succeed within max wait time
        this.updateState({
          isTimedOut: true,
          errorMessage:
            'El servidor está tardando más de lo habitual en responder. Los servidores gratuitos pueden requerir hasta 50 segundos para arrancar.',
        });
      }
    });

    return this.inFlightPromise;
  }

  /**
   * User manually clicked "Reintentar" in the modal.
   */
  public retry(): void {
    this.cancelWait();
    this.ensureBackendAvailable();
  }

  /**
   * Cancel connection wait and close modal.
   */
  public cancelWait(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.resetOverlay();
  }

  private resetOverlay(): void {
    if (this.overlayTimer) {
      clearTimeout(this.overlayTimer);
      this.overlayTimer = null;
    }
    if (this.elapsedInterval) {
      clearInterval(this.elapsedInterval);
      this.elapsedInterval = null;
    }
    this.inFlightPromise = null;
    this.abortController = null;

    this.updateState({
      isOverlayVisible: false,
      stepText: 'CONECTANDO…',
      elapsedSeconds: 0,
      isTimedOut: false,
      errorMessage: null,
    });
  }
}

export const backendHealth = new BackendHealthService();
