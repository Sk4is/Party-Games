/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DarkProtocolGameState,
  RoomZone,
  LightSource,
  DoorDefinition,
  InteractableObject,
  HidingSpot,
  CameraDefinition,
} from '../../../types/darkProtocol';
import {
  FACILITY_ROOMS,
  FACILITY_LIGHTS,
  FACILITY_INTERACTABLES,
  HIDING_SPOTS,
} from '../../../data/darkProtocol/facilityMap';
import { getCharacterById } from '../../../data/darkProtocol/characters';
import { darkProtocolAudio } from '../../../utils/darkProtocolAudio';

export interface RendererDebugOptions {
  showInteractionZones: boolean;
  showCameraFOV: boolean;
  showLightBounds: boolean;
  showCollisionBounds: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
  color: string;
  type: 'steam' | 'spark' | 'dust' | 'void';
}

export interface InteractionPromptTarget {
  id: string;
  name: string;
  actionText: string;
  worldX: number;
  worldY: number;
  screenX: number;
  screenY: number;
  type: 'door' | 'hiding_spot' | 'machine' | 'exit_hide';
}

export class DarkProtocolCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lightCanvas: HTMLCanvasElement;
  private lightCtx: CanvasRenderingContext2D;

  private running: boolean = false;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Camera & Viewport
  public cameraX: number = 0;
  private targetCameraX: number = 0;
  public viewportWidth: number = 1200;
  public viewportHeight: number = 600;

  // Input
  private keys: Record<string, boolean> = {};
  public mouseX: number = 0;
  public mouseY: number = 0;
  public worldMouseX: number = 0;
  public worldMouseY: number = 0;

  // Physics & Animation
  private playerVx: number = 0;
  private animTimer: number = 0;
  private footstepTimer: number = 0;
  private transitionCooldownTimer: number = 0;

  // Ambient simulation
  private particles: Particle[] = [];
  private sparkTimer: number = 0;
  private fanAngle: number = 0;

  // State reference & callbacks
  private getState: () => DarkProtocolGameState;
  private updateState: (updater: (prev: DarkProtocolGameState) => DarkProtocolGameState) => void;
  private onInteractPrompt: (prompt: InteractionPromptTarget | null) => void;
  private onRoomChange: (newRoom: string, targetX: number, facing: 'left' | 'right') => void;
  private onOpenMinigame: (minigameId: string) => void;

  private sabotageTimers: Record<string, number> = {};
  private prevSectorPowered: Record<string, boolean> = {
    sector_a: true,
    sector_b: true,
    sector_c: false,
  };

  public debugOptions: RendererDebugOptions = {
    showInteractionZones: false,
    showCameraFOV: false,
    showLightBounds: false,
    showCollisionBounds: false,
  };

  constructor(
    canvas: HTMLCanvasElement,
    getState: () => DarkProtocolGameState,
    updateState: (updater: (prev: DarkProtocolGameState) => DarkProtocolGameState) => void,
    onInteractPrompt: (prompt: InteractionPromptTarget | null) => void,
    onRoomChange: (newRoom: string, targetX: number, facing: 'left' | 'right') => void,
    onOpenMinigame: (minigameId: string) => void
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;

    this.lightCanvas = document.createElement('canvas');
    const lCtx = this.lightCanvas.getContext('2d');
    if (!lCtx) throw new Error('Could not get light canvas context');
    this.lightCtx = lCtx;

    this.getState = getState;
    this.updateState = updateState;
    this.onInteractPrompt = onInteractPrompt;
    this.onRoomChange = onRoomChange;
    this.onOpenMinigame = onOpenMinigame;

    this.handleResize();
    this.initDustParticles();
    this.setupListeners();
  }

  /**
   * CRITICAL BUG FIX: Viewport Resizing
   * Fills 100% of available screen without black vertical gaps.
   */
  public handleResize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : this.canvas.getBoundingClientRect();

    this.viewportWidth = Math.max(640, Math.floor(rect.width || window.innerWidth));
    this.viewportHeight = Math.max(480, Math.floor(rect.height || window.innerHeight));

    this.canvas.width = this.viewportWidth;
    this.canvas.height = this.viewportHeight;

    this.lightCanvas.width = this.viewportWidth;
    this.lightCanvas.height = this.viewportHeight;

    this.ctx.imageSmoothingEnabled = false;
    this.lightCtx.imageSmoothingEnabled = true;
  }

  private initDustParticles() {
    this.particles = [];
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: Math.random() * 2000 - 300,
        y: Math.random() * 520,
        vx: (Math.random() - 0.5) * 12,
        vy: -4 - Math.random() * 10,
        size: 1.5 + Math.random() * 1.5,
        alpha: 0.12 + Math.random() * 0.25,
        maxLife: 6 + Math.random() * 6,
        life: Math.random() * 5,
        color: '#94a3b8',
        type: 'dust',
      });
    }
  }

  private setupListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
  }

  public destroy() {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.handleMouseMove);
      this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }

    const state = this.getState();
    const canMove = state.inputContext === 'WORLD' || state.inputContext === 'INFORMATIONAL';

    // Strictly disable physical world inputs when any machine/terminal modal is open
    if (!canMove) {
      return;
    }

    this.keys[e.code] = true;
    this.keys[e.key.toLowerCase()] = true;

    // Flashlight toggle on F
    if (e.code === 'KeyF' || e.key.toLowerCase() === 'f') {
      if (state.activeRole === 'EXPLORADOR' && !state.explorer.isHiding) {
        darkProtocolAudio.playFlashlightClick();
        this.updateState((prev) => ({
          ...prev,
          explorer: {
            ...prev.explorer,
            flashlightOn: !prev.explorer.flashlightOn,
          },
        }));
      }
    }

    // Interaction on E
    if (e.code === 'KeyE' || e.key.toLowerCase() === 'e') {
      const res = this.triggerInteraction();
      if (res && res.actionType === 'minigame') {
        this.onOpenMinigame(res.targetId);
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
    this.keys[e.key.toLowerCase()] = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
    this.worldMouseX = this.mouseX + this.cameraX;
    this.worldMouseY = this.mouseY;

    // Flashlight direction follows mouse only when movement/world input is allowed
    const state = this.getState();
    const canAim = state.inputContext === 'WORLD' || state.inputContext === 'INFORMATIONAL';

    if (canAim && state.activeRole === 'EXPLORADOR') {
      const charX = state.explorer.x;
      const charY = 440;
      const dx = this.worldMouseX - charX;
      const dy = this.worldMouseY - charY;
      const angle = Math.atan2(dy, dx);

      this.updateState((prev) => ({
        ...prev,
        explorer: {
          ...prev.explorer,
          flashlightAngle: angle,
          facing: dx >= 0 ? 'right' : 'left',
        },
      }));
    }
  };

  private handleMouseDown = (e: MouseEvent) => {
    darkProtocolAudio.resume();
    const state = this.getState();

    // If Manifested Entity attacks with left click
    if (state.activeRole === 'ENTE' && state.entity.isManifested) {
      this.triggerEntityAttack();
    }
  };

  public triggerEntityAttack() {
    const state = this.getState();
    if (state.activeRole !== 'ENTE' || !state.entity.isManifested) return;

    if (state.entity.room === state.explorer.room && !state.explorer.isHiding) {
      const dist = Math.abs(state.entity.x - state.explorer.x);
      if (dist < 90) {
        darkProtocolAudio.playMinigameFail();
        this.updateState((prev) => {
          let nextHealth = prev.explorer.health;
          if (prev.explorer.health === 'SANO') nextHealth = 'HERIDO';
          else if (prev.explorer.health === 'HERIDO') nextHealth = 'AGONIZANDO';
          else if (prev.explorer.health === 'AGONIZANDO') nextHealth = 'MUERTO';

          return {
            ...prev,
            explorer: {
              ...prev.explorer,
              health: nextHealth,
              animState: 'HURT',
            },
            entity: {
              ...prev.entity,
              animState: 'ATTACK',
            },
            alerts: [
              {
                id: 'attack_' + Date.now(),
                text: '¡El Ente ha atacado físicamente al Explorador!',
                room: prev.entity.room,
                time: Date.now(),
                type: 'detection',
              },
              ...prev.alerts.slice(0, 8),
            ],
          };
        });

        setTimeout(() => {
          this.updateState((prev) => ({
            ...prev,
            entity: { ...prev.entity, animState: 'IDLE' },
          }));
        }, 500);
      }
    }
  }

  public start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private loop = (currentTime: number) => {
    if (!this.running) return;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private spawnSparks(y: number) {
    const currentRoom = FACILITY_ROOMS[this.getState().activeRoom] || FACILITY_ROOMS.control_room;
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x: Math.random() * currentRoom.width,
        y: y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 180,
        vy: -Math.random() * 120,
        size: 2 + Math.random() * 2.5,
        alpha: 1,
        maxLife: 0.35 + Math.random() * 0.3,
        life: 0,
        color: '#fef08a',
        type: 'spark',
      });
    }
  }

  public getSectorFailureFactor(sector: string): {
    strobe: number;
    inFailureSequence: boolean;
    emergencyReady: boolean;
  } {
    const timer = this.sabotageTimers[sector];
    if (timer === undefined || timer <= 0) {
      return { strobe: 1.0, inFailureSequence: false, emergencyReady: true };
    }

    // 1.8s staged failure breakdown sequence:
    // 1.8 - 1.4s: STUTTER (rapid erratic flicker)
    if (timer > 1.4) {
      const strobe = Math.random() > 0.35 ? 0.95 : 0.15;
      return { strobe, inFailureSequence: true, emergencyReady: false };
    }
    // 1.4 - 1.0s: BROWNOUT (dim low-voltage glow)
    if (timer > 1.0) {
      const strobe = Math.random() > 0.6 ? 0.45 : 0.05;
      return { strobe, inFailureSequence: true, emergencyReady: false };
    }
    // 1.0 - 0.5s: VIOLENT BURST / ARCING
    if (timer > 0.5) {
      const strobe = Math.random() > 0.75 ? 1.0 : 0.0;
      return { strobe, inFailureSequence: true, emergencyReady: false };
    }
    // 0.5 - 0.15s: TOTAL BLACKOUT
    if (timer > 0.15) {
      return { strobe: 0.0, inFailureSequence: true, emergencyReady: false };
    }
    // 0.15 - 0.0s: EMERGENCY RELAY CLICKS ON
    return { strobe: 0.0, inFailureSequence: true, emergencyReady: true };
  }

  // =========================================================================
  // UPDATE / SIMULATION STEP
  // =========================================================================
  private update(dt: number) {
    const state = this.getState();
    const activeRole = state.activeRole;
    const currentRoom = FACILITY_ROOMS[state.activeRoom] || FACILITY_ROOMS.control_room;

    this.animTimer += dt;
    this.fanAngle = (this.fanAngle + dt * 4.5) % (Math.PI * 2);

    if (this.transitionCooldownTimer > 0) {
      this.transitionCooldownTimer = Math.max(0, this.transitionCooldownTimer - dt);
    }

    // Check sector power changes and trigger staged failure sequence
    for (const [sector, circuit] of Object.entries(state.circuits)) {
      const isNowPowered = circuit.powered;
      const wasPowered = this.prevSectorPowered[sector] ?? true;
      if (wasPowered && !isNowPowered) {
        // Start 1.8s physical failure breakdown sequence!
        this.sabotageTimers[sector] = 1.8;
        darkProtocolAudio.playLightBuzz();
      }
      this.prevSectorPowered[sector] = isNowPowered;
    }

    // Advance sabotage failure timers and trigger synchronized sound hooks
    for (const sector of Object.keys(this.sabotageTimers)) {
      if (this.sabotageTimers[sector] > 0) {
        const prevT = this.sabotageTimers[sector];
        this.sabotageTimers[sector] = Math.max(0, this.sabotageTimers[sector] - dt);
        const curT = this.sabotageTimers[sector];

        if (prevT > 1.3 && curT <= 1.3) {
          darkProtocolAudio.playLightBuzz();
          this.spawnSparks(currentRoom.floorY - 140);
        } else if (prevT > 0.9 && curT <= 0.9) {
          darkProtocolAudio.playRelayClick();
        } else if (prevT > 0.4 && curT <= 0.4) {
          darkProtocolAudio.playPowerDownHum();
        } else if (prevT > 0 && curT <= 0) {
          darkProtocolAudio.playRelayClick();
        }
      }
    }

    const canMove = state.inputContext === 'WORLD' || state.inputContext === 'INFORMATIONAL';

    // 1. Move character if role has physical avatar
    let characterX = 0;
    let isMoving = false;
    let isRunning = false;

    if (activeRole === 'EXPLORADOR' && !state.explorer.isHiding) {
      characterX = state.explorer.x;

      if (!canMove) {
        // Strictly frozen at machine when physical modal is open
        this.playerVx = 0;
        if (state.explorer.animState !== 'WORKING') {
          this.updateState((prev) => ({
            ...prev,
            explorer: { ...prev.explorer, animState: 'WORKING' },
          }));
        }
      } else {
        const left = this.keys['KeyA'] || this.keys['a'] || this.keys['ArrowLeft'];
        const right = this.keys['KeyD'] || this.keys['d'] || this.keys['ArrowRight'];
        isRunning = Boolean(this.keys['ShiftLeft'] || this.keys['ShiftRight']);

        // Character trait speed modifier
        const charData = getCharacterById(state.selectedCharacterId);
        const speedMult = charData.stats.speed / 75; // Baseline normalized

        const speed = (isRunning ? 230 : 140) * speedMult;
        const accel = 1300;
        const friction = 950;

        if (left && !right) {
          this.playerVx = Math.max(this.playerVx - accel * dt, -speed);
          isMoving = true;
        } else if (right && !left) {
          this.playerVx = Math.min(this.playerVx + accel * dt, speed);
          isMoving = true;
        } else {
          if (this.playerVx > 0) {
            this.playerVx = Math.max(0, this.playerVx - friction * dt);
          } else if (this.playerVx < 0) {
            this.playerVx = Math.min(0, this.playerVx + friction * dt);
          }
        }

        characterX += this.playerVx * dt;
        characterX = Math.max(45, Math.min(characterX, currentRoom.width - 45));

        // Footstep audio cadence
        if (isMoving && Math.abs(this.playerVx) > 30) {
          this.footstepTimer += dt;
          const stepCadence = isRunning ? 0.26 : 0.40;
          if (this.footstepTimer >= stepCadence) {
            this.footstepTimer = 0;
            darkProtocolAudio.playFootstep(isRunning);
          }
        }

        const facing = this.playerVx < -5 ? 'left' : this.playerVx > 5 ? 'right' : state.explorer.facing;
        const currentAnim = isMoving
          ? isRunning
            ? state.explorer.flashlightOn
              ? 'RUN_FLASHLIGHT'
              : 'RUN'
            : state.explorer.flashlightOn
            ? 'WALK_FLASHLIGHT'
            : 'WALK'
          : state.explorer.flashlightOn
          ? 'IDLE_FLASHLIGHT'
          : 'IDLE';

        this.updateState((prev) => ({
          ...prev,
          explorer: {
            ...prev.explorer,
            x: characterX,
            facing,
            animState: currentAnim,
          },
        }));
      }
    } else if (activeRole === 'OPERADOR') {
      characterX = state.operator.x;
      if (!canMove) {
        this.playerVx = 0;
      } else {
        const left = this.keys['KeyA'] || this.keys['a'] || this.keys['ArrowLeft'];
        const right = this.keys['KeyD'] || this.keys['d'] || this.keys['ArrowRight'];
        const speed = 130;

        if (left && !right) {
          this.playerVx = -speed;
          isMoving = true;
        } else if (right && !left) {
          this.playerVx = speed;
          isMoving = true;
        } else {
          this.playerVx = 0;
        }

        characterX += this.playerVx * dt;
        characterX = Math.max(60, Math.min(characterX, currentRoom.width - 60));

        if (isMoving) {
          this.footstepTimer += dt;
          if (this.footstepTimer >= 0.45) {
            this.footstepTimer = 0;
            darkProtocolAudio.playFootstep(false);
          }
        }

        const facing = this.playerVx < 0 ? 'left' : this.playerVx > 0 ? 'right' : state.operator.facing;

        this.updateState((prev) => ({
          ...prev,
          operator: {
            ...prev.operator,
            x: characterX,
            facing,
          },
        }));
      }
    } else if (activeRole === 'ENTE' && state.entity.isManifested) {
      characterX = state.entity.x;
      const left = this.keys['KeyA'] || this.keys['a'] || this.keys['ArrowLeft'];
      const right = this.keys['KeyD'] || this.keys['d'] || this.keys['ArrowRight'];
      const speed = 200;

      if (left && !right) {
        this.playerVx = -speed;
        isMoving = true;
      } else if (right && !left) {
        this.playerVx = speed;
        isMoving = true;
      } else {
        this.playerVx = 0;
      }

      characterX += this.playerVx * dt;
      characterX = Math.max(50, Math.min(characterX, currentRoom.width - 50));

      const facing = this.playerVx < 0 ? 'left' : this.playerVx > 0 ? 'right' : state.entity.facing;
      const entityAnim = isMoving ? 'MOVE' : 'IDLE';

      this.updateState((prev) => ({
        ...prev,
        entity: {
          ...prev.entity,
          x: characterX,
          facing,
          animState: entityAnim,
        },
      }));
    }

    // 2. CRITICAL BUG FIX: Smooth Camera Framing & Clamping
    // When room width < viewport width, center the room!
    // When room width > viewport width, smoothly track character!
    const targetCharX =
      activeRole === 'EXPLORADOR'
        ? state.explorer.x
        : activeRole === 'OPERADOR'
        ? state.operator.x
        : state.entity.isManifested
        ? state.entity.x
        : currentRoom.width / 2;

    if (this.viewportWidth >= currentRoom.width) {
      // Room is narrower than viewport -> Center the room perfectly!
      this.targetCameraX = -Math.floor((this.viewportWidth - currentRoom.width) / 2);
    } else {
      // Room is wider than viewport -> Horizontal camera tracking clamped to room boundaries
      this.targetCameraX = targetCharX - this.viewportWidth / 2;
      const maxCameraX = currentRoom.width - this.viewportWidth;
      this.targetCameraX = Math.max(0, Math.min(this.targetCameraX, maxCameraX));
    }

    this.cameraX += (this.targetCameraX - this.cameraX) * Math.min(1, dt * 8);

    // 3. Update Hiding timer
    if (state.explorer.isHiding) {
      const newRemain = Math.max(0, state.explorer.hideTimeRemaining - dt);
      if (newRemain <= 0) {
        this.exitHiding(state.explorer.hidingSpotId);
      } else {
        this.updateState((prev) => ({
          ...prev,
          explorer: {
            ...prev.explorer,
            hideTimeRemaining: newRemain,
          },
        }));
      }
    }

    // 4. Update Manifestation timer
    if (state.entity.isManifested) {
      const newRemain = Math.max(0, state.entity.manifestationTimeRemaining - dt);
      if (newRemain <= 0) {
        darkProtocolAudio.playEntityManifestation();
        this.updateState((prev) => ({
          ...prev,
          entity: {
            ...prev.entity,
            isManifested: false,
            manifestationMeter: 0,
            manifestationTimeRemaining: 50,
          },
          alerts: [
            {
              id: 'entity_dematerialized_' + Date.now(),
              text: 'La Manifestación del Ente ha expirado. Retornando a la red de seguridad.',
              room: prev.entity.room,
              time: Date.now(),
              type: 'alarm',
            },
            ...prev.alerts.slice(0, 8),
          ],
        }));
      } else {
        this.updateState((prev) => ({
          ...prev,
          entity: {
            ...prev.entity,
            manifestationTimeRemaining: newRemain,
          },
        }));
      }
    }

    // 5. Update Ambient Particles
    this.updateParticles(dt, currentRoom);

    // 6. Closest Interactable Targeting (No Flickering!)
    this.checkInteractionPrompt(characterX, currentRoom.id);
  }

  private updateParticles(dt: number, room: RoomZone) {
    const leftBound = Math.min(0, this.cameraX - 100);
    const rightBound = Math.max(room.width, this.cameraX + this.viewportWidth + 100);

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;

      if (p.x < leftBound) p.x = rightBound;
      if (p.x > rightBound) p.x = leftBound;
      if (p.y < 0) p.y = 520;
      if (p.y > 520) p.y = 0;

      if (p.life >= p.maxLife) {
        p.life = 0;
        p.x = leftBound + Math.random() * (rightBound - leftBound);
        p.y = 100 + Math.random() * 380;
      }
    }

    // Occasional sparks in Electrical Room
    if (room.id === 'electrical_room') {
      this.sparkTimer += dt;
      if (this.sparkTimer > 3.0) {
        this.sparkTimer = 0;
        darkProtocolAudio.playElectricSpark();
        for (let i = 0; i < 8; i++) {
          this.particles.push({
            x: 250,
            y: 280,
            vx: (Math.random() - 0.5) * 120,
            vy: -40 - Math.random() * 80,
            size: 2,
            alpha: 1,
            maxLife: 0.35,
            life: 0,
            color: '#93c5fd',
            type: 'spark',
          });
        }
      }
    }
  }

  /**
   * Targets the single closest valid interactable.
   * Emits precise screen coordinates for minimal contextual HUD badge.
   */
  private checkInteractionPrompt(charX: number, roomId: string) {
    const state = this.getState();
    const activeRole = state.activeRole;

    if (this.transitionCooldownTimer > 0) {
      this.onInteractPrompt(null);
      return;
    }

    if (state.explorer.isHiding) {
      const screenX = charX - this.cameraX;
      const screenY = 380;
      this.onInteractPrompt({
        id: 'exit_hide',
        name: 'ESCONDITE',
        actionText: `SALIR (${Math.ceil(state.explorer.hideTimeRemaining)}s)`,
        worldX: charX,
        worldY: 440,
        screenX,
        screenY,
        type: 'exit_hide',
      });
      return;
    }

    let closestTarget: InteractionPromptTarget | null = null;
    let minDistance = 75; // Proximity threshold

    // 1. Check Doors
    for (const door of Object.values(state.doors)) {
      if (door.fromRoom === roomId) {
        const dist = Math.abs(charX - door.fromX);
        if (dist <= 60 && dist < minDistance) {
          minDistance = dist;
          const screenX = door.fromX - this.cameraX;
          const screenY = 360;
          closestTarget = {
            id: door.id,
            name: door.name,
            actionText: door.lockedByEntity ? 'BLOQUEADA' : 'ENTRAR',
            worldX: door.fromX,
            worldY: 360,
            screenX,
            screenY,
            type: 'door',
          };
        }
      }
    }

    // 2. Check Hiding Spots
    for (const spot of HIDING_SPOTS) {
      if (spot.room === roomId) {
        const dist = Math.abs(charX - spot.x);
        if (dist <= 65 && dist < minDistance) {
          minDistance = dist;
          const screenX = spot.x - this.cameraX;
          const screenY = spot.y - 20;

          if (activeRole === 'ENTE' && state.entity.isManifested) {
            closestTarget = {
              id: 'search_' + spot.id,
              name: spot.name,
              actionText: `REGISTRAR (${state.entity.searchCharges})`,
              worldX: spot.x,
              worldY: spot.y,
              screenX,
              screenY,
              type: 'hiding_spot',
            };
          } else if (activeRole === 'EXPLORADOR') {
            const cooldown = state.explorer.reentryCooldowns[spot.id] || 0;
            const isCooling = Date.now() < cooldown;
            closestTarget = {
              id: spot.id,
              name: spot.name,
              actionText: isCooling ? 'ENFRIANDO' : 'ESCONDERSE',
              worldX: spot.x,
              worldY: spot.y,
              screenX,
              screenY,
              type: 'hiding_spot',
            };
          }
        }
      }
    }

    // 3. Check Interactable Objects
    for (const obj of FACILITY_INTERACTABLES) {
      if (obj.room === roomId) {
        const dist = Math.abs(charX - obj.x);
        if (dist <= obj.radius && dist < minDistance) {
          minDistance = dist;
          const screenX = obj.x - this.cameraX;
          const screenY = obj.y - 35;

          let actionVerb = 'USAR';
          if (obj.id === 'electrical_main_panel') {
            actionVerb = state.electricalPuzzleSolved ? 'CIRCUITO OK' : 'REPARAR CIRCUITO';
          } else if (obj.id === 'lab_pressure_valves') {
            actionVerb = state.valvesState.stabilized ? 'PRESIÓN OK' : 'REGULAR VÁLVULAS';
          } else if (obj.id === 'comms_frequency_radio') {
            actionVerb = state.frequencyState.aligned ? 'FRECUENCIA OK' : 'SINTONIZAR SOCORRO';
          } else if (obj.id === 'archive_records_terminal') {
            actionVerb = state.coopSolved ? 'ARCHIVOS CONSULTADOS' : 'CONSULTAR CÓDIGOS';
          } else if (obj.id === 'infirmary_med_station') {
            actionVerb = state.explorer.health === 'SANO' ? 'BOTIQUÍN LISTO' : 'TRATAR HERIDAS';
          } else if (obj.id === 'maint_steam_purge') {
            actionVerb = 'PURGAR VÁLVULA';
          } else if (obj.id === 'gen_turbine_console') {
            actionVerb = 'IGNICIÓN TURBINA';
          } else if (obj.id === 'evacuation_keypad') {
            actionVerb = state.coopSolved ? 'CLAVE VALIDADA' : 'INTRODUCIR CLAVE';
          } else if (obj.id === 'evacuation_blast_gate') {
            actionVerb = state.escapeUnlocked ? 'ACTIVAR EVACUACIÓN' : 'BLOQUEADA (SIN CLAVE)';
          } else if (obj.id === 'terminal_cctv_station') {
            actionVerb = 'MONITOR CCTV';
          } else if (obj.id === 'terminal_map_station') {
            actionVerb = 'PLANO TÁCTICO';
          } else if (obj.id === 'control_status_board') {
            actionVerb = 'DIAGNÓSTICO RED';
          } else if (obj.id === 'security_network_router') {
            actionVerb = 'CONMUTADOR RED';
          } else if (obj.id === 'security_door_override') {
            actionVerb = 'ESCLUSAS SEGURIDAD';
          }

          closestTarget = {
            id: obj.id,
            name: obj.name,
            actionText: actionVerb,
            worldX: obj.x,
            worldY: obj.y,
            screenX,
            screenY,
            type: 'machine',
          };
        }
      }
    }

    this.onInteractPrompt(closestTarget);
  }

  public triggerInteraction(): { actionType: string; targetId: string } | null {
    const state = this.getState();
    const activeRole = state.activeRole;
    const currentRoom = state.activeRoom;

    let charX =
      activeRole === 'EXPLORADOR'
        ? state.explorer.x
        : activeRole === 'OPERADOR'
        ? state.operator.x
        : state.entity.x;

    // A. If already hiding -> Exit
    if (state.explorer.isHiding) {
      this.exitHiding(state.explorer.hidingSpotId);
      return { actionType: 'exit_hide', targetId: state.explorer.hidingSpotId || '' };
    }

    // B. Check Doors with bidirectional safe spawn
    for (const door of Object.values(state.doors)) {
      if (door.fromRoom === currentRoom && Math.abs(charX - door.fromX) <= 65) {
        if (door.lockedByEntity) {
          darkProtocolAudio.playMinigameFail();
          return { actionType: 'door_locked', targetId: door.id };
        }

        // Traversed door!
        darkProtocolAudio.playDoorSlide();
        this.transitionCooldownTimer = 0.6; // 0.6s cooldown eliminates instant bounce
        this.onRoomChange(door.toRoom, door.spawnX, door.spawnFacing);
        return { actionType: 'door_enter', targetId: door.toRoom };
      }
    }

    // C. Check Hiding Spots
    for (const spot of HIDING_SPOTS) {
      if (spot.room === currentRoom && Math.abs(charX - spot.x) <= 65) {
        if (activeRole === 'ENTE' && state.entity.isManifested) {
          this.entitySearchHidingSpot(spot);
          return { actionType: 'entity_search', targetId: spot.id };
        } else if (activeRole === 'EXPLORADOR') {
          const cooldown = state.explorer.reentryCooldowns[spot.id] || 0;
          if (Date.now() >= cooldown) {
            this.enterHiding(spot);
            return { actionType: 'enter_hide', targetId: spot.id };
          }
        }
      }
    }

    // D. Check Machine Interactables
    for (const obj of FACILITY_INTERACTABLES) {
      if (obj.room === currentRoom && Math.abs(charX - obj.x) <= obj.radius) {
        darkProtocolAudio.playSwitchClick();
        return { actionType: 'minigame', targetId: obj.id };
      }
    }

    return null;
  }

  private enterHiding(spot: HidingSpot) {
    darkProtocolAudio.playSwitchClick();
    this.updateState((prev) => ({
      ...prev,
      explorer: {
        ...prev.explorer,
        isHiding: true,
        hidingSpotId: spot.id,
        hideTimeRemaining: 15,
        animState: 'HIDE_IDLE',
      },
    }));
  }

  private exitHiding(spotId: string | null) {
    darkProtocolAudio.playDoorSlide();
    this.updateState((prev) => {
      const newCooldowns = { ...prev.explorer.reentryCooldowns };
      if (spotId) {
        newCooldowns[spotId] = Date.now() + 8000;
      }
      return {
        ...prev,
        explorer: {
          ...prev.explorer,
          isHiding: false,
          hidingSpotId: null,
          reentryCooldowns: newCooldowns,
          animState: 'IDLE',
        },
      };
    });
  }

  private entitySearchHidingSpot(spot: HidingSpot) {
    const state = this.getState();
    if (state.entity.searchCharges <= 0) {
      darkProtocolAudio.playMinigameFail();
      return;
    }

    darkProtocolAudio.playDoorSlide();
    const isSurvivorInside =
      state.explorer.isHiding && state.explorer.hidingSpotId === spot.id;

    this.updateState((prev) => {
      const remainingCharges = Math.max(0, prev.entity.searchCharges - 1);
      let alertMsg = `El Ente registró ${spot.name}: ¡Estaba VACÍO!`;
      let nextHealth = prev.explorer.health;

      if (isSurvivorInside) {
        alertMsg = `¡El Ente descubrió al Explorador dentro de ${spot.name}!`;
        if (prev.explorer.health === 'SANO') nextHealth = 'HERIDO';
        else if (prev.explorer.health === 'HERIDO') nextHealth = 'AGONIZANDO';
      }

      return {
        ...prev,
        entity: {
          ...prev.entity,
          searchCharges: remainingCharges,
          animState: 'SEARCH',
        },
        explorer: isSurvivorInside
          ? {
              ...prev.explorer,
              isHiding: false,
              hidingSpotId: null,
              health: nextHealth,
              animState: 'HURT',
            }
          : prev.explorer,
        alerts: [
          {
            id: 'search_' + Date.now(),
            text: alertMsg,
            room: spot.room,
            time: Date.now(),
            type: isSurvivorInside ? 'detection' : 'sabotage',
          },
          ...prev.alerts.slice(0, 8),
        ],
      };
    });
  }

  // =========================================================================
  // RENDERING PIPELINE (2-PASS COMPOSITING WITH DYNAMIC LIGHTING)
  // =========================================================================
  private render() {
    const state = this.getState();
    const room = FACILITY_ROOMS[state.activeRoom] || FACILITY_ROOMS.control_room;
    const isSectorPowered = Boolean(state.circuits[room.sector]?.powered);

    this.ctx.save();
    this.ctx.translate(-Math.floor(this.cameraX), 0);

    // Pass 1: World Scene
    this.renderRoomBackground(room, isSectorPowered);
    this.renderMachinesAndInteractables(room, isSectorPowered);
    this.renderHidingSpots(room);
    this.renderDoors(room, state);
    this.renderCharacters(state, room);
    this.renderParticles();

    this.ctx.restore();

    // Pass 2: Light Map Offscreen Canvas
    this.renderLightMap(state, room, isSectorPowered);

    // Pass 3: Composite Light Map via Multiply
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'multiply';
    this.ctx.drawImage(this.lightCanvas, 0, 0);
    this.ctx.restore();

    // Pass 4: Bloom Halos & Lens Flare
    this.renderLightBloom(state, room, isSectorPowered);

    // Pass 5: Cameras & Debug Visuals
    this.ctx.save();
    this.ctx.translate(-Math.floor(this.cameraX), 0);
    this.renderCameras(room, state);
    if (
      this.debugOptions.showInteractionZones ||
      this.debugOptions.showCameraFOV ||
      this.debugOptions.showLightBounds
    ) {
      this.renderDebugVisuals(room, state);
    }
    this.ctx.restore();

    // Vignette & Subtle CRT Scanlines
    this.renderVignette();
  }

  /**
   * CRITICAL BUG FIX: Seamless room background extension.
   * Renders from -2000 to room.width + 2000 so no resolution or aspect ratio
   * can ever show an empty black strip on the right or left!
   */
  private renderRoomBackground(room: RoomZone, isPowered: boolean) {
    const ctx = this.ctx;
    const w = room.width;
    const h = this.viewportHeight;

    const extLeft = -2500;
    const extRight = w + 2500;
    const extWidth = extRight - extLeft;

    const failureState = this.getSectorFailureFactor(room.sector);
    const effectivePowered = isPowered && (!failureState.inFailureSequence || failureState.strobe > 0.35);

    // Back wall base color
    ctx.fillStyle = effectivePowered ? '#0b111e' : '#030508';
    ctx.fillRect(extLeft, 0, extWidth, h);

    // Industrial wall panels & seams across the extended space
    ctx.strokeStyle = effectivePowered ? '#141d2f' : '#070b12';
    ctx.lineWidth = 2;
    for (let x = extLeft; x <= extRight; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, room.floorY);
      ctx.stroke();

      ctx.fillStyle = effectivePowered ? '#1e293b' : '#0a0f18';
      ctx.fillRect(x - 2, 80, 4, 4);
      ctx.fillRect(x - 2, 220, 4, 4);
      ctx.fillRect(x - 2, 360, 4, 4);
    }

    // Concrete floor & hazard stripe extending seamlessly
    ctx.fillStyle = effectivePowered ? '#1e293b' : '#0d131d';
    ctx.fillRect(extLeft, room.floorY, extWidth, h - room.floorY);

    ctx.fillStyle = effectivePowered ? '#b45309' : '#451a03';
    ctx.fillRect(extLeft, room.floorY - 6, extWidth, 6);

    // Ceiling industrial girders
    ctx.fillStyle = effectivePowered ? '#0f172a' : '#050811';
    ctx.fillRect(extLeft, 0, extWidth, 40);

    // Overhead Cable bundles across the room
    ctx.strokeStyle = effectivePowered ? '#334155' : '#111827';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 25);
    ctx.bezierCurveTo(w * 0.25, 45, w * 0.75, 45, w, 25);
    ctx.stroke();

    // Ceiling ventilation fans
    ctx.save();
    ctx.translate(w * 0.5, 30);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(this.fanAngle);
    ctx.fillStyle = effectivePowered ? '#475569' : '#1e293b';
    for (let b = 0; b < 4; b++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillRect(-3, -18, 6, 36);
    }
    ctx.restore();
  }

  private renderMachinesAndInteractables(room: RoomZone, isPowered: boolean) {
    const ctx = this.ctx;
    const floorY = room.floorY;

    if (room.id === 'control_room') {
      // Station 1: CCTV Array (x: 340)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(295, floorY - 110, 90, 110);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(302, floorY - 102, 76, 56);
      if (isPowered) {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(306, floorY - 98, 68, 48);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let sx = 0; sx < 64; sx += 8) {
          const sy = Math.sin(this.animTimer * 5 + sx * 0.3) * 6;
          if (sx === 0) ctx.moveTo(308 + sx, floorY - 74 + sy);
          else ctx.lineTo(308 + sx, floorY - 74 + sy);
        }
        ctx.stroke();
      } else {
        ctx.fillStyle = '#030712';
        ctx.fillRect(306, floorY - 98, 68, 48);
      }
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CCTV ARRAY', 340, floorY - 26);
      ctx.fillText('[E] MONITOR', 340, floorY - 12);

      // Station 2: Bunker Tactical Map (x: 700)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(650, floorY - 95, 100, 95);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(658, floorY - 88, 84, 52);
      if (isPowered) {
        ctx.fillStyle = '#042f2e';
        ctx.fillRect(662, floorY - 84, 76, 44);
        ctx.strokeStyle = '#2dd4bf';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(668, floorY - 78, 22, 14);
        ctx.strokeRect(694, floorY - 78, 22, 14);
        ctx.strokeRect(682, floorY - 60, 24, 14);
      }
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PLANO TÁCTICO', 700, floorY - 22);
      ctx.fillText('[E] MAPA', 700, floorY - 10);

      // Station 3: Network Diagnosis Board (x: 1000)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(955, floorY - 105, 90, 105);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(962, floorY - 98, 76, 75);
      // Status LEDs
      const sectors = [
        { label: 'SEC-A', powered: Boolean(this.getState().circuits['sector_a']?.powered), y: -85 },
        { label: 'SEC-B', powered: Boolean(this.getState().circuits['sector_b']?.powered), y: -68 },
        { label: 'SEC-C', powered: Boolean(this.getState().circuits['sector_c']?.powered), y: -51 },
      ];
      for (const s of sectors) {
        ctx.fillStyle = s.powered ? '#10b981' : '#ef4444';
        ctx.beginPath();
        ctx.arc(975, floorY + s.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '8px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(s.label + (s.powered ? ' [OK]' : ' [FAIL]'), 985, floorY + s.y + 3);
      }
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DIAGNÓSTICO', 1000, floorY - 10);

    } else if (room.id === 'security') {
      // Station 1: Network Router Rack (x: 380)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(335, floorY - 145, 90, 145);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(338, floorY - 142, 84, 140);
      for (let slot = 0; slot < 5; slot++) {
        const sy = floorY - 132 + slot * 24;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(344, sy, 72, 18);
        for (let led = 0; led < 4; led++) {
          const blink = isPowered && ((slot + led + Math.floor(this.animTimer * 6)) % 3 === 0);
          ctx.fillStyle = blink ? '#22c55e' : '#eab308';
          ctx.fillRect(348 + led * 7, sy + 6, 3, 5);
        }
      }
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ROUTER CCTV', 380, floorY - 148);

      // Station 2: Security Lock Bypass (x: 860)
      ctx.fillStyle = '#334155';
      ctx.fillRect(820, floorY - 110, 80, 110);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(828, floorY - 100, 64, 45);
      ctx.fillStyle = isPowered ? '#ef4444' : '#7f1d1d';
      ctx.fillRect(845, floorY - 88, 30, 20); // Emergency lockout switch
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(825, floorY - 105, 70, 70);
      ctx.fillStyle = '#fbbf24';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ESCLUSAS', 860, floorY - 30);

    } else if (room.id === 'archive') {
      // Tape server racks & classified archive terminal (x: 560)
      // Reel-to-reel server racks on left and right
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(460, floorY - 150, 70, 150);
      ctx.fillRect(630, floorY - 150, 70, 150);
      for (const rx of [475, 645]) {
        for (let reel = 0; reel < 2; reel++) {
          const ry = floorY - 130 + reel * 55;
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(rx + 20, ry + 20, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = isPowered ? '#94a3b8' : '#334155';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Spinning reel hub
          ctx.save();
          ctx.translate(rx + 20, ry + 20);
          if (isPowered) ctx.rotate(this.animTimer * (reel === 0 ? 3 : -2));
          ctx.strokeStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(-14, 0);
          ctx.lineTo(14, 0);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Center CRT Terminal (x: 560)
      ctx.fillStyle = '#334155';
      ctx.fillRect(525, floorY - 105, 70, 105);
      ctx.fillStyle = '#022c22';
      ctx.fillRect(532, floorY - 98, 56, 46);
      if (isPowered) {
        ctx.fillStyle = '#22c55e';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('REC-03', 560, floorY - 80);
        ctx.fillText('CLAVE', 560, floorY - 68);
      }
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ARCHIVO CLAVE', 560, floorY - 20);

    } else if (room.id === 'laboratory') {
      // Cryo pod on left (x: 300)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(270, floorY - 155, 65, 155);
      ctx.fillStyle = isPowered ? 'rgba(16, 185, 129, 0.45)' : 'rgba(5, 40, 25, 0.3)';
      ctx.fillRect(278, floorY - 145, 49, 135);
      // Floating bubble particles inside cryo chamber
      if (isPowered) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let b = 0; b < 4; b++) {
          const by = floorY - 30 - ((this.animTimer * 30 + b * 28) % 110);
          const bx = 286 + (b * 9);
          ctx.fillRect(bx, by, 3, 3);
        }
      }

      // Valve Station (x: 920)
      ctx.fillStyle = '#334155';
      ctx.fillRect(870, floorY - 120, 100, 120);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.strokeRect(874, floorY - 116, 92, 112);
      // 3 Brass Pressure Gauges
      for (let i = 0; i < 3; i++) {
        const gx = 890 + i * 30;
        const gy = floorY - 85;
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(gx, gy, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isPowered ? '#06b6d4' : '#1e293b';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Needle
        ctx.save();
        ctx.translate(gx, gy);
        const needleAngle = isPowered ? Math.sin(this.animTimer * 2 + i * 1.5) * 1.2 : -1.2;
        ctx.rotate(needleAngle);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -9);
        ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = '#38bdf8';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VÁLVULAS CRYO', 920, floorY - 30);
      ctx.fillText('(OBJ 2)', 920, floorY - 16);

    } else if (room.id === 'infirmary') {
      // First aid medical station (x: 620)
      // Crash cart & heart monitor
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(580, floorY - 95, 80, 95);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(590, floorY - 88, 60, 42);
      // EKG Heartbeat waveform line
      if (isPowered) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < 54; x += 3) {
          let yOffset = 0;
          const phase = (x + this.animTimer * 60) % 54;
          if (phase > 22 && phase < 26) yOffset = -14;
          else if (phase >= 26 && phase < 30) yOffset = 10;
          if (x === 0) ctx.moveTo(593 + x, floorY - 67 + yOffset);
          else ctx.lineTo(593 + x, floorY - 67 + yOffset);
        }
        ctx.stroke();
      }
      // Medical Red Cross emblem
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(615, floorY - 35, 10, 24);
      ctx.fillRect(608, floorY - 28, 24, 10);
      ctx.fillStyle = '#0f172a';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TRIAGE', 620, floorY - 6);

    } else if (room.id === 'communications') {
      // Radio frequency station (x: 680)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(625, floorY - 135, 110, 135);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.strokeRect(629, floorY - 131, 102, 127);
      // Oscilloscope screen
      ctx.fillStyle = '#022c22';
      ctx.fillRect(640, floorY - 120, 80, 50);
      if (isPowered) {
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let sx = 0; sx < 74; sx += 4) {
          const sy = Math.sin(this.animTimer * 10 + sx * 0.25) * 14;
          if (sx === 0) ctx.moveTo(643 + sx, floorY - 95 + sy);
          else ctx.lineTo(643 + sx, floorY - 95 + sy);
        }
        ctx.stroke();
      }
      // Tuning dial knob
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(680, floorY - 45, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('RADIO SOS (OBJ 3)', 680, floorY - 14);

    } else if (room.id === 'electrical_room') {
      // Main High-Voltage Substation (x: 820)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(765, floorY - 145, 110, 145);
      ctx.strokeStyle = isPowered ? '#38bdf8' : '#e11d48';
      ctx.lineWidth = 3;
      ctx.strokeRect(770, floorY - 140, 100, 135);
      // Ceramic Fuse Banks
      for (let f = 0; f < 3; f++) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(785 + f * 24, floorY - 125, 14, 38);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(785 + f * 24, floorY - 128, 14, 5);
        ctx.fillRect(785 + f * 24, floorY - 90, 14, 5);
      }
      // High Voltage Warning Stencil
      ctx.fillStyle = '#fbbf24';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', 820, floorY - 45);
      ctx.font = '9px monospace';
      ctx.fillText('380V SUBESTACIÓN', 820, floorY - 20);

    } else if (room.id === 'maintenance') {
      // Steam valve purge station (x: 620)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(575, floorY - 120, 90, 120);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      // Main steam piping
      ctx.beginPath();
      ctx.moveTo(620, 0);
      ctx.lineTo(620, floorY - 70);
      ctx.lineTo(650, floorY - 70);
      ctx.stroke();
      // Rotary Wheel Valve
      ctx.save();
      ctx.translate(620, floorY - 70);
      ctx.rotate(this.animTimer * 1.5);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.moveTo(-16, 0); ctx.lineTo(16, 0);
      ctx.moveTo(0, -16); ctx.lineTo(0, 16);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PURGA VAPOR', 620, floorY - 20);

    } else if (room.id === 'generators') {
      // Giant Industrial Combustion Turbine (x: 600)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(490, floorY - 165, 220, 165);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.strokeRect(495, floorY - 160, 210, 155);
      // Large Flywheel rotor
      ctx.save();
      ctx.translate(600, floorY - 85);
      if (isPowered) ctx.rotate(this.animTimer * 8);
      ctx.strokeStyle = isPowered ? '#f59e0b' : '#334155';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 45, 0, Math.PI * 2);
      ctx.stroke();
      for (let s = 0; s < 6; s++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(45, 0);
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = '#f59e0b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TURBINA DE COMBUSTIÓN', 600, floorY - 18);

    } else if (room.id === 'evacuation') {
      // Station 1: Armored 4-digit code authorization keypad (x: 650)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(615, floorY - 110, 70, 110);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(618, floorY - 107, 64, 104);
      // Illuminated LCD code display
      ctx.fillStyle = '#020617';
      ctx.fillRect(625, floorY - 98, 50, 24);
      ctx.fillStyle = this.getState().coopSolved ? '#22c55e' : '#f59e0b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.getState().coopSolved ? 'OK' : '****', 650, floorY - 82);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '8px monospace';
      ctx.fillText('TECLADO', 650, floorY - 45);
      ctx.fillText('(OBJ 5)', 650, floorY - 32);

      // Station 2: Final Hydraulic Blast Gate (x: 1050)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(990, floorY - 190, 120, 190);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.strokeRect(995, floorY - 185, 110, 185);
      // Hazard diagonal stripes
      ctx.fillStyle = '#eab308';
      for (let stripe = 0; stripe < 8; stripe++) {
        ctx.beginPath();
        ctx.moveTo(995 + stripe * 14, floorY);
        ctx.lineTo(1015 + stripe * 14, floorY);
        ctx.lineTo(1005 + stripe * 14, floorY - 20);
        ctx.lineTo(985 + stripe * 14, floorY - 20);
        ctx.fill();
      }
      // Red Rotary Beacon
      const beaconOn = Math.floor(this.animTimer * 4) % 2 === 0;
      ctx.fillStyle = beaconOn ? '#ef4444' : '#7f1d1d';
      ctx.beginPath();
      ctx.arc(1050, floorY - 198, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('COMPUERTA EXTERIOR', 1050, floorY - 150);
      ctx.fillText(this.getState().escapeUnlocked ? '[ABIERTA]' : '[CERRADA]', 1050, floorY - 135);
    }
  }

  private renderHidingSpots(room: RoomZone) {
    const ctx = this.ctx;
    for (const spot of HIDING_SPOTS) {
      if (spot.room === room.id) {
        if (spot.type === 'TAQUILLA') {
          ctx.fillStyle = '#334155';
          ctx.fillRect(spot.x - spot.width / 2, spot.y - 10, spot.width, spot.height);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2;
          ctx.strokeRect(spot.x - spot.width / 2, spot.y - 10, spot.width, spot.height);

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(spot.x - 12, spot.y + 10, 24, 3);
          ctx.fillRect(spot.x - 12, spot.y + 18, 24, 3);
          ctx.fillRect(spot.x - 12, spot.y + 26, 24, 3);
        } else if (spot.type === 'BAJO_MESA') {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(spot.x - spot.width / 2, spot.y, spot.width, 8);
          ctx.fillRect(spot.x - spot.width / 2 + 5, spot.y + 8, 8, spot.height - 8);
          ctx.fillRect(spot.x + spot.width / 2 - 13, spot.y + 8, 8, spot.height - 8);
        } else if (spot.type === 'COMPARTIMENTO_TECNICO') {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(spot.x - spot.width / 2, spot.y, spot.width, spot.height);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2;
          ctx.strokeRect(spot.x - spot.width / 2, spot.y, spot.width, spot.height);
          for (let gx = spot.x - spot.width / 2 + 6; gx < spot.x + spot.width / 2 - 6; gx += 8) {
            ctx.beginPath();
            ctx.moveTo(gx, spot.y + 4);
            ctx.lineTo(gx, spot.y + spot.height - 4);
            ctx.stroke();
          }
        }
      }
    }
  }

  private renderDoors(room: RoomZone, state: DarkProtocolGameState) {
    const ctx = this.ctx;
    const floorY = room.floorY;

    for (const door of Object.values(state.doors)) {
      if (door.fromRoom === room.id) {
        const x = door.fromX;
        const isPowered = !door.requiresPower || (door.circuitId && state.circuits[door.circuitId]?.powered);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x - 30, floorY - 120, 60, 120);

        ctx.fillStyle = isPowered ? '#334155' : '#0f172a';
        ctx.fillRect(x - 24, floorY - 114, 48, 114);

        let ledColor = '#10b981';
        if (!isPowered) ledColor = '#334155';
        if (door.lockedByEntity) ledColor = '#ef4444';

        ctx.fillStyle = ledColor;
        ctx.beginPath();
        ctx.arc(x, floorY - 128, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(door.name.replace('Acceso a ', '').toUpperCase(), x, floorY - 136);
      }
    }
  }

  /**
   * ANIMATED PIXEL-ART CHARACTERS
   * Full articulated skeletal/pixel kinematics:
   * - Alternating leg strides with foot contact and lift
   * - Idle breathing cycle (torso/chest expand, feet strictly planted)
   * - Running forward lean and energetic stride
   * - Front arm dynamically holding & aiming the steel flashlight toward mouse
   * - Working/interacting machine poses
   * - Distinct silhouette and equipment per character
   * - Demonic manifested Entity with void tendrils and crimson eyes
   */
  private renderCharacters(state: DarkProtocolGameState, currentRoom: RoomZone) {
    const ctx = this.ctx;
    const floorY = currentRoom.floorY;

    // 1. Render Explorer if in current room and NOT hiding
    if (state.explorer.room === currentRoom.id && !state.explorer.isHiding) {
      const char = getCharacterById(state.selectedCharacterId);
      const x = state.explorer.x;
      const y = floorY;
      const facing = state.explorer.facing;
      const animState = state.explorer.animState || 'IDLE';

      const isWalking = animState === 'WALK' || animState === 'WALK_FLASHLIGHT';
      const isRunning = animState === 'RUN' || animState === 'RUN_FLASHLIGHT';
      const isWorking = animState === 'WORKING' || animState === 'INTERACT';
      const isDowned = state.explorer.health === 'AGONIZANDO' || state.explorer.health === 'MUERTO';
      const isMoving = isWalking || isRunning;

      // Kinematic calculations
      const breathBob = isMoving ? 0 : Math.sin(this.animTimer * 2.6) * 1.6;
      const breathChest = isMoving ? 0 : Math.sin(this.animTimer * 2.6) * 0.8;

      let strideAngle = 0;
      let kneeFlex = 0;
      let torsoLean = 0;
      let walkBob = 0;

      if (isRunning) {
        strideAngle = Math.sin(this.animTimer * 15) * 0.52;
        kneeFlex = Math.abs(Math.cos(this.animTimer * 15)) * 0.35;
        torsoLean = 0.12; // Forward lean
        walkBob = Math.abs(Math.sin(this.animTimer * 15)) * 2.5;
      } else if (isWalking) {
        strideAngle = Math.sin(this.animTimer * 9) * 0.36;
        kneeFlex = Math.abs(Math.cos(this.animTimer * 9)) * 0.22;
        walkBob = Math.abs(Math.sin(this.animTimer * 9)) * 1.5;
      }

      ctx.save();
      ctx.translate(x, y);
      if (facing === 'left') ctx.scale(-1, 1);

      // Contact shadow on floor
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 0, isRunning ? 22 : 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (isDowned) {
        // Agonizing crawling pose on the floor
        const crawlBob = Math.sin(this.animTimer * 2) * 1.5;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-22, -12, 14, 8); // Legs trailing
        ctx.fillStyle = char.primaryColor;
        ctx.fillRect(-10, -18 + crawlBob, 22, 14); // Torso
        ctx.fillStyle = '#334155';
        ctx.fillRect(10, -22 + crawlBob, 12, 12); // Head
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(16, -18 + crawlBob, 5, 3); // Visor alert
        ctx.fillStyle = '#475569';
        ctx.fillRect(18, -10 + crawlBob, 12, 5); // Outstretched arm
      } else {
        // =====================================================================
        // BACK ARM (swings counter to front leg)
        // =====================================================================
        const backArmAngle = isWorking
          ? -0.6 + Math.sin(this.animTimer * 6) * 0.08
          : isRunning
          ? -Math.sin(this.animTimer * 15) * 0.6
          : isWalking
          ? -Math.sin(this.animTimer * 9) * 0.4
          : 0.1;

        ctx.save();
        ctx.translate(-4, -38 + breathBob - walkBob);
        ctx.rotate(backArmAngle);
        ctx.fillStyle = char.secondaryColor || '#1e293b';
        ctx.fillRect(-3, 0, 6, 11); // Upper arm
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-2.5, 9, 5, 10); // Forearm
        ctx.fillStyle = '#475569';
        ctx.fillRect(-2.5, 17, 5, 4); // Hand / Glove
        ctx.restore();

        // =====================================================================
        // LEGS & BOOTS (Articulated Kinematics)
        // =====================================================================
        if (!isMoving) {
          // Idle: Feet firmly planted on the floor
          // Back leg
          ctx.fillStyle = '#090d16';
          ctx.fillRect(-9, -23, 7, 15); // Thigh & shin
          ctx.fillStyle = '#020617';
          ctx.fillRect(-11, -8, 10, 8); // Heavy boot
          ctx.fillStyle = '#334155';
          ctx.fillRect(-11, -3, 10, 3); // Boot sole

          // Front leg
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(2, -23, 7, 15);
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, -8, 10, 8);
          ctx.fillStyle = '#334155';
          ctx.fillRect(0, -3, 10, 3);
        } else {
          // Walking/Running: Alternating leg strides
          // Back Leg (strideAngle)
          ctx.save();
          ctx.translate(-3, -23);
          ctx.rotate(strideAngle);
          ctx.fillStyle = '#090d16';
          ctx.fillRect(-3, 0, 6, 12); // Thigh
          ctx.translate(0, 10);
          ctx.rotate(kneeFlex);
          ctx.fillRect(-3, 0, 6, 11); // Shin
          ctx.fillStyle = '#020617';
          ctx.fillRect(-3, 7, 9, 7); // Boot
          ctx.fillStyle = '#334155';
          ctx.fillRect(-3, 12, 9, 2); // Sole
          ctx.restore();

          // Front Leg (-strideAngle)
          ctx.save();
          ctx.translate(3, -23);
          ctx.rotate(-strideAngle);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-3, 0, 6, 12);
          ctx.translate(0, 10);
          ctx.rotate(-kneeFlex * 0.5);
          ctx.fillRect(-3, 0, 6, 11);
          ctx.fillStyle = '#020617';
          ctx.fillRect(-3, 7, 9, 7);
          ctx.fillStyle = '#334155';
          ctx.fillRect(-3, 12, 9, 2);
          ctx.restore();
        }

        // =====================================================================
        // TORSO & UPPER BODY (Chest, Suit, Harness)
        // =====================================================================
        ctx.save();
        ctx.translate(0, -breathBob + walkBob);
        if (torsoLean > 0) ctx.rotate(torsoLean);

        // Base protective jumpsuit
        ctx.fillStyle = char.primaryColor;
        ctx.fillRect(-11 - breathChest / 2, -48, 22 + breathChest, 27);

        // Character-specific pixel accessories
        if (char.id === 'mara_velasco') {
          // Mechanic: Heavy leather toolbelt & wrench holster
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-12, -27, 24, 5);
          ctx.fillStyle = '#d97706';
          ctx.fillRect(8, -25, 4, 11); // Steel pipe wrench
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(7, -19, 6, 3); // Wrench jaw
          ctx.fillStyle = '#451a03';
          ctx.fillRect(-9, -46, 18, 5); // Suspenders
        } else if (char.id === 'hector_gaona') {
          // Doctor: Crisp white labcoat lapels & cold cryo container
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-10, -48, 7, 25);
          ctx.fillRect(3, -48, 7, 25);
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(-14, -42, 4, 13); // Cryo vial
          ctx.fillStyle = '#a5f3fc';
          ctx.fillRect(-14, -40, 4, 2); // Glow indicator
        } else if (char.id === 'valeria_cruz') {
          // Guard: Reinforced ballistic plate carrier & crimson military epaulettes
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(-10, -47, 20, 20);
          ctx.fillStyle = '#312e81';
          ctx.fillRect(-8, -45, 16, 15); // Ceramic plate
          ctx.fillStyle = '#e11d48';
          ctx.fillRect(-13, -48, 5, 5); // Left epaulette
          ctx.fillRect(8, -48, 5, 5); // Right epaulette
        } else if (char.id === 'sergio_prada') {
          // Tech: Communications harness & radio backpack with tall antenna
          ctx.fillStyle = '#064e3b';
          ctx.fillRect(-15, -46, 6, 21); // Radio pack
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-12, -46);
          // Antenna sways gently with movement
          const antennaSway = isMoving ? Math.sin(this.animTimer * 12) * 3 : 0;
          ctx.lineTo(-12 + antennaSway, -68);
          ctx.stroke();
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-13 + antennaSway, -70, 3, 3); // LED tip
        }

        // =====================================================================
        // HEAD, HELMET & VISOR
        // =====================================================================
        // Neck
        ctx.fillStyle = '#475569';
        ctx.fillRect(-4, -51, 8, 4);

        // Helmet / Head
        ctx.fillStyle = '#334155';
        ctx.fillRect(-9, -64, 18, 15);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-10, -62, 2, 10); // Brow protection

        // Visor / Optics
        if (char.id === 'mara_velasco') {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(2, -59, 7, 5); // Golden welder shield
        } else if (char.id === 'hector_gaona') {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(1, -59, 4, 4); // Optical loupe
          ctx.fillRect(6, -59, 4, 4);
        } else if (char.id === 'valeria_cruz') {
          ctx.fillStyle = '#e11d48';
          ctx.fillRect(2, -59, 7, 4); // Crimson tactical visor
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(2, -59, 7, 5); // Blue HUD visor
          ctx.fillStyle = '#065f46';
          ctx.fillRect(-8, -58, 3, 5); // Headset earcup
          ctx.fillRect(-6, -55, 6, 2); // Boom mic
        }

        // =====================================================================
        // FRONT ARM & HELD FLASHLIGHT / WORKING POSE
        // =====================================================================
        let frontArmAngle = isRunning
          ? Math.sin(this.animTimer * 15) * 0.6
          : isWalking
          ? Math.sin(this.animTimer * 9) * 0.4
          : -0.05;

        if (isWorking) {
          // Reaching toward machine faceplate, hands actively manipulating knobs
          frontArmAngle = -0.75 + Math.sin(this.animTimer * 6) * 0.08;
        } else if (state.explorer.flashlightOn) {
          // Front arm aims toward mouse cursor
          let targetAngle = state.explorer.flashlightAngle;
          if (facing === 'left') {
            targetAngle = Math.PI - targetAngle;
            if (targetAngle > Math.PI) targetAngle -= Math.PI * 2;
          }
          frontArmAngle = Math.max(-1.1, Math.min(0.9, targetAngle));
        }

        ctx.save();
        ctx.translate(4, -38);
        ctx.rotate(frontArmAngle);

        // Shoulder & Upper Arm
        ctx.fillStyle = char.primaryColor;
        ctx.fillRect(-3, 0, 6, 10);
        // Forearm
        ctx.fillStyle = char.secondaryColor || '#1e293b';
        ctx.fillRect(-2.5, 8, 5, 9);
        // Hand / Glove
        ctx.fillStyle = '#475569';
        ctx.fillRect(-3, 15, 6, 5);

        // Steel Flashlight held in hand
        ctx.fillStyle = '#64748b';
        ctx.fillRect(0, 13, 14, 5); // Metal barrel
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(3, 12, 4, 7); // Grip knurling
        ctx.fillStyle = '#475569';
        ctx.fillRect(12, 11, 4, 9); // Bezel reflector

        if (state.explorer.flashlightOn) {
          // Glowing lens cap
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(16, 12, 2, 7);
          ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
          ctx.fillRect(17, 10, 3, 11);
        } else {
          ctx.fillStyle = '#334155';
          ctx.fillRect(16, 12, 2, 7);
        }

        ctx.restore(); // Front arm

        ctx.restore(); // Torso
      }

      ctx.restore(); // Character
    }

    // 2. Render Operator if in current room (Control Room)
    if (state.operator.room === currentRoom.id) {
      const x = state.operator.x;
      const y = floorY;
      const facing = state.operator.facing;

      ctx.save();
      ctx.translate(x, y);
      if (facing === 'left') ctx.scale(-1, 1);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Boots
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-8, -8, 7, 8);
      ctx.fillRect(1, -8, 7, 8);
      ctx.fillRect(-7, -22, 5, 15);
      ctx.fillRect(2, -22, 5, 15);

      // White Labcoat
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(-10, -48, 20, 28);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(2, -42, 4, 7); // Operator ID badge

      // Arms & console clipboard
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-12, -44, 4, 16);
      ctx.fillRect(8, -44, 4, 16);
      ctx.fillStyle = '#334155';
      ctx.fillRect(2, -36, 10, 12); // Tactical tablet

      // Head & Operator Headset
      ctx.fillStyle = '#fbcfe8';
      ctx.fillRect(-7, -62, 14, 14); // Face
      ctx.fillStyle = '#334155';
      ctx.fillRect(-8, -64, 16, 5); // Hair
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-9, -65, 18, 3); // Headband
      ctx.fillRect(-9, -58, 3, 6); // Left earcup
      ctx.fillRect(-7, -54, 7, 2); // Mic boom

      ctx.restore();
    }

    // 3. Render Manifested Entity if in current room
    if (state.entity.isManifested && state.entity.room === currentRoom.id) {
      const x = state.entity.x;
      const levitate = Math.sin(this.animTimer * 4) * 8;
      const y = floorY - 18 + levitate;
      const animState = state.entity.animState || 'IDLE';

      ctx.save();
      ctx.translate(x, y);

      // Deep Shadow floor portal
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      ctx.ellipse(0, 18 - levitate, 28, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing Abyssal Core
      ctx.fillStyle = '#05010a';
      ctx.beginPath();
      ctx.arc(0, -38, 26, 0, Math.PI * 2);
      ctx.fill();

      // Purple void nebula
      const corePulse = 0.5 + Math.sin(this.animTimer * 6) * 0.25;
      ctx.fillStyle = `rgba(147, 51, 234, ${corePulse})`;
      ctx.beginPath();
      ctx.arc(0, -38, 18, 0, Math.PI * 2);
      ctx.fill();

      // 6 Procedural Undulating Void Tendrils
      ctx.strokeStyle = '#05010a';
      ctx.lineWidth = 4;
      for (let t = 0; t < 6; t++) {
        const tAngle = (t / 6) * Math.PI * 2;
        const wave = Math.sin(this.animTimer * 7 + t * 1.2) * 12;
        ctx.beginPath();
        ctx.moveTo(Math.cos(tAngle) * 18, -38 + Math.sin(tAngle) * 18);
        ctx.quadraticCurveTo(
          Math.cos(tAngle) * 36 + wave,
          -38 + Math.sin(tAngle) * 36 - wave,
          Math.cos(tAngle) * 48 + wave * 1.5,
          -38 + Math.sin(tAngle) * 48
        );
        ctx.stroke();
      }

      // Obsidian Horned Skull
      ctx.fillStyle = '#020005';
      ctx.beginPath();
      ctx.moveTo(-12, -45);
      ctx.lineTo(-18, -68); // Left horn
      ctx.lineTo(-7, -55);
      ctx.lineTo(0, -62);
      ctx.lineTo(7, -55);
      ctx.lineTo(18, -68); // Right horn
      ctx.lineTo(12, -45);
      ctx.closePath();
      ctx.fill();

      // Glowing Crimson Eyes
      const eyeFlicker = 0.85 + Math.random() * 0.15;
      ctx.fillStyle = `rgba(239, 68, 68, ${eyeFlicker})`;
      ctx.fillRect(-7, -46, 5, 3);
      ctx.fillRect(2, -46, 5, 3);

      // Violet distortion shockwave aura
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -38, 36 + Math.sin(this.animTimer * 8) * 5, 0, Math.PI * 2);
      ctx.stroke();

      // Attack lashing claws
      if (animState === 'ATTACK') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(15, -40);
        ctx.lineTo(55, -48);
        ctx.lineTo(75, -35);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(35, -40, 25, -0.6, 0.6);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private renderParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha * (1 - p.life / p.maxLife);
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // =========================================================================
  // LIGHT MAP OFFSCREEN RENDERING
  // =========================================================================
  private renderLightMap(state: DarkProtocolGameState, room: RoomZone, isPowered: boolean) {
    const lCtx = this.lightCtx;
    const w = this.viewportWidth;
    const h = this.viewportHeight;

    lCtx.save();
    lCtx.clearRect(0, 0, w, h);

    let ambientDarkness = 'rgb(40, 48, 60)';
    if (!isPowered) {
      ambientDarkness = 'rgb(8, 10, 16)';
    }
    lCtx.fillStyle = ambientDarkness;
    lCtx.fillRect(0, 0, w, h);

    lCtx.globalCompositeOperation = 'lighter';
    lCtx.translate(-Math.floor(this.cameraX), 0);

    const failureState = this.getSectorFailureFactor(room.sector);

    for (const light of FACILITY_LIGHTS) {
      if (light.room === room.id) {
        let active = true;
        if (light.circuitId === 'emergency') {
          active = (!isPowered && failureState.emergencyReady) || (light.flicker && Math.sin(this.animTimer * 6) > -0.2);
        } else if (light.circuitId && light.circuitId !== 'permanent') {
          active = Boolean(state.circuits[light.circuitId]?.powered) || failureState.inFailureSequence;
        }

        if (!active) continue;

        let flickerMultiplier = light.flicker
          ? 0.75 + Math.sin(this.animTimer * 14 + light.x) * 0.25
          : 1.0;

        if (failureState.inFailureSequence && light.circuitId !== 'emergency') {
          flickerMultiplier *= failureState.strobe;
        }

        const radius = light.radius * Math.max(0.05, flickerMultiplier);
        const grad = lCtx.createRadialGradient(
          light.x,
          light.y,
          5,
          light.x,
          light.y,
          radius
        );

        grad.addColorStop(0, light.color);
        grad.addColorStop(0.5, this.hexToRgba(light.color, 0.45 * light.intensity));
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        lCtx.fillStyle = grad;
        lCtx.beginPath();
        lCtx.arc(light.x, light.y, radius, 0, Math.PI * 2);
        lCtx.fill();
      }
    }

    // Directional Flashlight Cone (originates physically from the hand-held flashlight lens!)
    if (
      state.explorer.room === room.id &&
      !state.explorer.isHiding &&
      state.explorer.flashlightOn
    ) {
      const char = getCharacterById(state.selectedCharacterId);
      const isHector = char.id === 'hector_gaona'; // Doctor has 35% wider cone
      const coneHalfAngle = isHector ? 0.52 : 0.38;
      const coneLength = isHector ? 430 : 390;

      const charFacing = state.explorer.facing;
      const breathBob = Math.sin(this.animTimer * 2.6) * 1.6;
      const shoulderX = state.explorer.x + (charFacing === 'right' ? 4 : -4);
      const shoulderY = room.floorY - 38 + breathBob;

      let targetAngle = state.explorer.flashlightAngle;
      if (charFacing === 'left') {
        targetAngle = Math.PI - targetAngle;
        if (targetAngle > Math.PI) targetAngle -= Math.PI * 2;
      }
      const clampedAngle = Math.max(-1.1, Math.min(0.9, targetAngle));
      const effectiveAim = charFacing === 'right' ? clampedAngle : Math.PI - clampedAngle;

      const handX = shoulderX + Math.cos(effectiveAim) * 18;
      const handY = shoulderY + Math.sin(effectiveAim) * 18;
      const angle = effectiveAim;

      const grad = lCtx.createRadialGradient(
        handX,
        handY,
        15,
        handX + Math.cos(angle) * coneLength * 0.7,
        handY + Math.sin(angle) * coneLength * 0.7,
        coneLength
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.2, '#fef08a');
      grad.addColorStop(0.65, 'rgba(254, 240, 138, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      lCtx.fillStyle = grad;
      lCtx.beginPath();
      lCtx.moveTo(handX, handY);
      lCtx.arc(handX, handY, coneLength, angle - coneHalfAngle, angle + coneHalfAngle);
      lCtx.closePath();
      lCtx.fill();

      const haloGrad = lCtx.createRadialGradient(handX, handY, 5, handX, handY, 70);
      haloGrad.addColorStop(0, 'rgba(254, 240, 138, 0.5)');
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lCtx.fillStyle = haloGrad;
      lCtx.beginPath();
      lCtx.arc(handX, handY, 70, 0, Math.PI * 2);
      lCtx.fill();
    }

    lCtx.restore();
  }

  private renderLightBloom(state: DarkProtocolGameState, room: RoomZone, isPowered: boolean) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(-Math.floor(this.cameraX), 0);
    ctx.globalCompositeOperation = 'screen';

    for (const light of FACILITY_LIGHTS) {
      if (light.room === room.id) {
        let active = true;
        if (light.circuitId === 'emergency') {
          active = !isPowered;
        } else if (light.circuitId && light.circuitId !== 'permanent') {
          active = Boolean(state.circuits[light.circuitId]?.powered);
        }
        if (!active) continue;

        ctx.fillStyle = light.color;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.arc(light.x, light.y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private renderCameras(room: RoomZone, state: DarkProtocolGameState) {
    const ctx = this.ctx;

    for (const cam of Object.values(state.cameras)) {
      if (cam.room === room.id) {
        const isOnline = cam.state === 'ONLINE' && Boolean(state.circuits[cam.circuitId]?.powered);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cam.x - 10, cam.y - 12, 20, 8);

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(cam.x, cam.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = isOnline ? '#10b981' : cam.state === 'INTERFERENCE' ? '#f59e0b' : '#ef4444';
        ctx.beginPath();
        ctx.arc(cam.x + (cam.facing === 'right' ? 6 : -6), cam.y + 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderDebugVisuals(room: RoomZone, state: DarkProtocolGameState) {
    const ctx = this.ctx;

    if (this.debugOptions.showInteractionZones) {
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
      ctx.setLineDash([4, 4]);
      for (const obj of FACILITY_INTERACTABLES) {
        if (obj.room === room.id) {
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(234, 179, 8, 0.8)';
          ctx.font = '10px monospace';
          ctx.fillText(obj.id, obj.x - 30, obj.y - obj.radius - 4);
        }
      }
      ctx.setLineDash([]);
    }

    if (this.debugOptions.showCameraFOV) {
      for (const cam of Object.values(state.cameras)) {
        if (cam.room === room.id) {
          const isOnline = cam.state === 'ONLINE' && Boolean(state.circuits[cam.circuitId]?.powered);
          ctx.strokeStyle = isOnline ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.4)';
          ctx.fillStyle = isOnline ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.04)';

          const centerAngle = cam.facing === 'right' ? 0.35 : Math.PI - 0.35;
          const halfFov = (cam.fovAngle * Math.PI) / 360;

          ctx.beginPath();
          ctx.moveTo(cam.x, cam.y);
          ctx.arc(cam.x, cam.y, cam.range, centerAngle - halfFov, centerAngle + halfFov);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    if (this.debugOptions.showLightBounds) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      for (const l of FACILITY_LIGHTS) {
        if (l.room === room.id) {
          ctx.beginPath();
          ctx.arc(l.x, l.y, l.radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }

  private renderVignette() {
    const ctx = this.ctx;
    const w = this.viewportWidth;
    const h = this.viewportHeight;

    const vGrad = ctx.createRadialGradient(
      w / 2,
      h / 2,
      w * 0.35,
      w / 2,
      h / 2,
      w * 0.65
    );
    vGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vGrad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');

    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1.5);
    }
  }

  /**
   * CRITICAL REQUIREMENT 24 & 25: REAL CCTV FEED RENDERER
   * Renders the ACTUAL GAME WORLD from the camera's true viewpoint!
   * Shows real room geometry, lights, doors, animated objects,
   * and the Survivor if inside the camera's FOV!
   */
  public renderCctvSnapshot(targetCanvas: HTMLCanvasElement, camId: string, now: number) {
    const targetCtx = targetCanvas.getContext('2d');
    if (!targetCtx) return;

    const state = this.getState();
    const cam = state.cameras[camId];
    if (!cam) return;

    const room = FACILITY_ROOMS[cam.room];
    if (!room) return;

    const isPowered = Boolean(state.circuits[cam.circuitId]?.powered);
    const isOnline = cam.state === 'ONLINE' && isPowered;
    const isInterfered = cam.state === 'INTERFERENCE';

    const tw = targetCanvas.width;
    const th = targetCanvas.height;

    // 1. If Offline or Unpowered -> Static noise screen
    if (!isOnline && !isInterfered) {
      targetCtx.fillStyle = '#05070c';
      targetCtx.fillRect(0, 0, tw, th);

      // Static noise
      const imgData = targetCtx.createImageData(tw, th);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() < 0.15 ? Math.floor(Math.random() * 80) : 0;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
      targetCtx.putImageData(imgData, 0, 0);

      // Warning text
      targetCtx.fillStyle = '#ef4444';
      targetCtx.font = 'bold 12px monospace';
      targetCtx.textAlign = 'center';
      targetCtx.fillText('SIN SEÑAL // CORTE DE ENERGÍA', tw / 2, th / 2);
      targetCtx.fillStyle = '#94a3b8';
      targetCtx.font = '10px monospace';
      targetCtx.fillText(`${cam.name.toUpperCase()}`, tw / 2, th / 2 + 18);
      return;
    }

    // 2. Camera is Online / Feed is active -> Render the REAL WORLD!
    targetCtx.save();

    // Scale world to fit CCTV viewport
    const scale = th / 600; // Room height is 600
    targetCtx.scale(scale, scale);

    // Center camera view around camera position or target region
    const camTargetX = Math.max(0, Math.min(cam.x - (tw / scale) / 2, room.width - tw / scale));
    targetCtx.translate(-camTargetX, 0);

    // Render Room Geometry
    this.renderRoomBackground(room, isPowered);
    this.renderMachinesAndInteractables(room, isPowered);
    this.renderHidingSpots(room);
    this.renderDoors(room, state);

    // Check if Survivor is in this room & within Camera FOV!
    if (state.explorer.room === cam.room && !state.explorer.isHiding) {
      const charX = state.explorer.x;
      const dist = Math.abs(charX - cam.x);
      const isFacingTowards = (cam.facing === 'right' && charX >= cam.x - 50) || (cam.facing === 'left' && charX <= cam.x + 50);

      if (dist <= cam.range && isFacingTowards) {
        // Draw the real Survivor in the feed!
        this.renderCharacters(state, room);
      }
    }

    // If Manifested Entity is in this room, draw it!
    if (state.entity.isManifested && state.entity.room === cam.room) {
      this.renderCharacters(state, room);
    }

    targetCtx.restore();

    // 3. CCTV Authentic Video Overlay (Timestamp, REC, Scanlines, Noise)
    targetCtx.save();

    if (isInterfered) {
      // Interference glitch bands
      targetCtx.fillStyle = 'rgba(234, 179, 8, 0.15)';
      for (let i = 0; i < 6; i++) {
        const gy = Math.random() * th;
        targetCtx.fillRect(0, gy, tw, 8);
      }
    }

    // CRT Scanlines
    targetCtx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let y = 0; y < th; y += 3) {
      targetCtx.fillRect(0, y, tw, 1);
    }

    // Header OSD
    targetCtx.fillStyle = '#10b981';
    targetCtx.font = 'bold 10px monospace';
    targetCtx.textAlign = 'left';
    targetCtx.fillText(`● REC [${cam.name.split(':')[0]}]`, 10, 16);

    targetCtx.textAlign = 'right';
    const dateStr = new Date().toLocaleTimeString();
    targetCtx.fillText(`2026-10-05 ${dateStr}`, tw - 10, 16);

    targetCtx.textAlign = 'left';
    targetCtx.fillStyle = '#38bdf8';
    targetCtx.fillText(`${room.name} // SECTOR ${room.sector.split('_')[1].toUpperCase()}`, 10, th - 10);

    targetCtx.restore();
  }

  private hexToRgba(hex: string, alpha: number): string {
    const cleanHex = hex.replace('#', '');
    let r = 0, g = 0, b = 0;
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6) {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
