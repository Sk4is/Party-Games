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
  CharacterAnimState,
  HealthState,
} from '../../../types/darkProtocol';
import {
  SOURCE_ROOM_WIDTH,
  SOURCE_ROOM_HEIGHT,
  ROOM_COMPOSITIONS,
  FACILITY_ROOMS,
  FACILITY_LIGHTS,
  FACILITY_INTERACTABLES,
  HIDING_SPOTS,
  FACILITY_PROPS,
  roomToWorldX,
  roomToWorldY,
  worldToRoomNormX,
  worldToRoomNormY,
} from '../../../data/darkProtocol/facilityMap';
import { getCharacterById } from '../../../data/darkProtocol/characters';
import { darkProtocolAudio } from '../../../utils/darkProtocolAudio';
import { darkProtocolAssets, DARK_PROTOCOL_ASSETS } from '../../../utils/darkProtocolAssetManager';

export const ROOM_BACKGROUND_MAP: Record<string, string> = {
  control_room: '/assets/dark-protocol/sala1.png',
  security: '/assets/dark-protocol/sala2.png',
  laboratory: '/assets/dark-protocol/sala3.png',
  electrical_room: '/assets/dark-protocol/sala4.png',
  maintenance: '/assets/dark-protocol/sala5.png',
  generators: '/assets/dark-protocol/sala6.png',
  communications: '/assets/dark-protocol/sala7.png',
  archive: '/assets/dark-protocol/sala8.png',
  infirmary: '/assets/dark-protocol/sala9.png',
  evacuation: '/assets/dark-protocol/sala10.png',
};

export const DOOR_ASSETS = {
  closed: '/assets/dark-protocol/puerta_cerrada.png',
  partial: '/assets/dark-protocol/puerta_entreabierta.png',
  open: '/assets/dark-protocol/puerta_abierta.png',
  evac: '/assets/dark-protocol/salida_evacuacion.png',
};

export interface ActiveSurvivorEntity {
  id: string;
  name: string;
  characterId: string;
  room: string;
  x: number;
  facing: 'left' | 'right';
  vx: number;
  health: HealthState;
  flashlightOn: boolean;
  flashlightAngle: number;
  isHiding: boolean;
  animState: CharacterAnimState;
  animTimer: number;
  isControlled: boolean;
}

export interface RendererDebugOptions {
  showInteractionZones: boolean;
  showCameraFOV: boolean;
  showLightBounds: boolean;
  showCollisionBounds: boolean;
  showAuthoringOverlay?: boolean;
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

  // Camera & Viewport Scaling (Contain-by-height, ZERO vertical cropping)
  public cameraX: number = 0;
  private targetCameraX: number = 0;
  public viewportWidth: number = 1200;
  public viewportHeight: number = 600;
  public roomScale: number = 1.0;
  public roomOffsetY: number = 44;

  // Single Room Coordinate Tracking
  public mouseX: number = 0;
  public mouseY: number = 0;
  public worldMouseX: number = 0;
  public worldMouseY: number = 0;
  public normMouseX: number = 0;
  public normMouseY: number = 0;

  // Input
  private keys: Record<string, boolean> = {};

  // Physics & Animation
  private playerVx: number = 0;
  private animTimer: number = 0;
  private footstepTimer: number = 0;
  private transitionCooldownTimer: number = 0;

  // Animated door progression: 0 = closed, 0.5 = partial, 1.0 = fully open
  private doorAnimProgress: Record<string, number> = {};

  // Ambient simulation
  private particles: Particle[] = [];
  private sparkTimer: number = 0;
  private fanAngle: number = 0;

  // Remote multiplayer players kinematics & animation tracking
  private remotePlayerAnim: Record<
    string,
    {
      x: number;
      targetX: number;
      vx: number;
      facing: 'left' | 'right';
      animState: CharacterAnimState;
      lastUpdate: number;
    }
  > = {};

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
    showAuthoringOverlay: false,
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
   * REQUIREMENT 2: NEVER CROP THE BOTTOM OF THE ROOM
   * Calculate room scale using available gameplay height between top HUD and bottom HUD.
   * Contain-by-height world scaling preserves the complete vertical authored room PNG.
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

    // Available gameplay height between top HUD (~46px) and bottom HUD (~52px)
    const topHUDHeight = 44;
    const bottomHUDHeight = 48;
    const availableHeight = Math.max(320, this.viewportHeight - topHUDHeight - bottomHUDHeight);

    this.roomScale = availableHeight / SOURCE_ROOM_HEIGHT;
    this.roomOffsetY = topHUDHeight;

    this.ctx.imageSmoothingEnabled = false;
    this.lightCtx.imageSmoothingEnabled = true;
  }

  private initDustParticles() {
    this.particles = [];
    for (let i = 0; i < 45; i++) {
      this.particles.push({
        x: Math.random() * SOURCE_ROOM_WIDTH,
        y: Math.random() * 600,
        vx: (Math.random() - 0.5) * 10,
        vy: -3 - Math.random() * 8,
        size: 1.5 + Math.random() * 1.5,
        alpha: 0.12 + Math.random() * 0.2,
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
    // F8: Room Authoring Debug Mode Toggle
    if (e.key === 'F8') {
      e.preventDefault();
      this.debugOptions.showAuthoringOverlay = !this.debugOptions.showAuthoringOverlay;
      return;
    }

    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }

    const state = this.getState();
    const canMove = state.inputContext === 'WORLD' || state.inputContext === 'INFORMATIONAL';

    // REQUIREMENT 26: Physical modal locks movement
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

  /**
   * REQUIREMENT 16: FLASHLIGHT MUST FOLLOW THE MOUSE
   * Converts screen mouse coordinates through canvas room scale and camera transform
   * to true world coordinates. Continuously updates flashlight aim in real time.
   */
  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;

    // Convert screen coordinates to world source coordinates (0..1983, 0..793)
    this.worldMouseX = (this.mouseX / this.roomScale) + this.cameraX;
    this.worldMouseY = (this.mouseY - this.roomOffsetY) / this.roomScale;

    // Normalized room coordinates (0.0 .. 1.0) for authoring & alignment
    this.normMouseX = worldToRoomNormX(this.worldMouseX);
    this.normMouseY = worldToRoomNormY(this.worldMouseY);

    const state = this.getState();
    const canAim = state.inputContext === 'WORLD' || state.inputContext === 'INFORMATIONAL';

    if (canAim && state.activeRole === 'EXPLORADOR') {
      const room = FACILITY_ROOMS[state.explorer.room] || FACILITY_ROOMS.control_room;
      // Character hand origin: anchored relative to floorY
      const handX = state.explorer.x + (state.explorer.facing === 'right' ? 8 : -8);
      const handY = room.floorY - 78;

      const dx = this.worldMouseX - handX;
      const dy = this.worldMouseY - handY;
      const angle = Math.atan2(dy, dx);

      // Facing naturally follows pointer aim
      const newFacing = dx >= 0 ? 'right' : 'left';

      this.updateState((prev) => ({
        ...prev,
        explorer: {
          ...prev.explorer,
          flashlightAngle: angle,
          facing: newFacing,
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
    this.render(dt);

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
        this.sabotageTimers[sector] = 1.8;
        darkProtocolAudio.playLightBuzz();
      }
      this.prevSectorPowered[sector] = isNowPowered;
    }

    // Advance sabotage failure timers
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

        const charData = getCharacterById(state.selectedCharacterId);
        const speedMult = charData.stats.speed / 75;

        const speed = (isRunning ? 240 : 150) * speedMult;
        const accel = 1400;
        const friction = 1000;

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
        // REQUIREMENT 30: Constrain character to room walkable boundaries
        characterX = Math.max(60, Math.min(characterX, SOURCE_ROOM_WIDTH - 60));

        if (isMoving && Math.abs(this.playerVx) > 30) {
          this.footstepTimer += dt;
          const stepCadence = isRunning ? 0.25 : 0.38;
          if (this.footstepTimer >= stepCadence) {
            this.footstepTimer = 0;
            darkProtocolAudio.playFootstep(isRunning);
          }
        }

        // When not aiming with mouse, face moving direction
        let facing = state.explorer.facing;
        if (Math.abs(this.playerVx) > 10 && !this.keys['KeyF']) {
          facing = this.playerVx < 0 ? 'left' : 'right';
        }

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
        const speed = 140;

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
        characterX = Math.max(60, Math.min(characterX, SOURCE_ROOM_WIDTH - 60));

        if (isMoving) {
          this.footstepTimer += dt;
          if (this.footstepTimer >= 0.42) {
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
      const speed = 210;

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
      characterX = Math.max(60, Math.min(characterX, SOURCE_ROOM_WIDTH - 60));

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

    // 2. SMOOTH CAMERA TRACKING WITH WORLD SCALING
    const targetCharX =
      activeRole === 'EXPLORADOR'
        ? state.explorer.x
        : activeRole === 'OPERADOR'
        ? state.operator.x
        : state.entity.isManifested
        ? state.entity.x
        : SOURCE_ROOM_WIDTH / 2;

    const viewSourceW = this.viewportWidth / this.roomScale;

    if (viewSourceW >= SOURCE_ROOM_WIDTH) {
      // Room fits inside viewport -> center room
      this.targetCameraX = -(viewSourceW - SOURCE_ROOM_WIDTH) / 2;
    } else {
      // Horizontal camera panning clamped to source room edges
      this.targetCameraX = targetCharX - viewSourceW / 2;
      const maxCameraX = SOURCE_ROOM_WIDTH - viewSourceW;
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

    // 6. Closest Interactable Targeting
    this.checkInteractionPrompt(characterX, currentRoom.id);
  }

  private updateParticles(dt: number, room: RoomZone) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;

      if (p.x < 0) p.x = SOURCE_ROOM_WIDTH;
      if (p.x > SOURCE_ROOM_WIDTH) p.x = 0;
      if (p.y < 0) p.y = 560;
      if (p.y > 560) p.y = 0;

      if (p.life >= p.maxLife) {
        p.life = 0;
        p.x = Math.random() * SOURCE_ROOM_WIDTH;
        p.y = 100 + Math.random() * 420;
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
            x: 380,
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
   * Emits precise screen coordinates for contextual HUD prompt.
   */
  private checkInteractionPrompt(charX: number, roomId: string) {
    const state = this.getState();
    const activeRole = state.activeRole;

    if (this.transitionCooldownTimer > 0) {
      this.onInteractPrompt(null);
      return;
    }

    const room = FACILITY_ROOMS[roomId] || FACILITY_ROOMS.control_room;

    if (state.explorer.isHiding) {
      const screenX = (charX - this.cameraX) * this.roomScale;
      const screenY = this.roomOffsetY + (room.floorY - 90) * this.roomScale;
      this.onInteractPrompt({
        id: 'exit_hide',
        name: 'ESCONDITE',
        actionText: `SALIR (${Math.ceil(state.explorer.hideTimeRemaining)}s)`,
        worldX: charX,
        worldY: room.floorY - 90,
        screenX,
        screenY,
        type: 'exit_hide',
      });
      return;
    }

    let closestTarget: InteractionPromptTarget | null = null;
    let minDistance = 85;

    // 1. Check Traversal Doors
    for (const door of Object.values(state.doors)) {
      if (door.fromRoom === roomId) {
        const dist = Math.abs(charX - door.fromX);
        if (dist <= 75 && dist < minDistance) {
          minDistance = dist;
          const screenX = (door.fromX - this.cameraX) * this.roomScale;
          const screenY = this.roomOffsetY + (room.floorY - 140) * this.roomScale;
          closestTarget = {
            id: door.id,
            name: door.name,
            actionText: door.lockedByEntity ? 'BLOQUEADA' : 'ENTRAR',
            worldX: door.fromX,
            worldY: room.floorY - 140,
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
        if (dist <= 80 && dist < minDistance) {
          minDistance = dist;
          const screenX = (spot.x - this.cameraX) * this.roomScale;
          const screenY = this.roomOffsetY + (spot.y - 40) * this.roomScale;

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

    // 3. Check Interactable Objects / Machines
    for (const obj of FACILITY_INTERACTABLES) {
      if (obj.room === roomId) {
        const dist = Math.abs(charX - obj.x);
        if (dist <= obj.radius && dist < minDistance) {
          minDistance = dist;
          const screenX = (obj.x - this.cameraX) * this.roomScale;
          const screenY = this.roomOffsetY + (obj.y - 40) * this.roomScale;

          let actionVerb = 'INTERACTUAR';
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
      if (door.fromRoom === currentRoom && Math.abs(charX - door.fromX) <= 75) {
        if (door.lockedByEntity) {
          darkProtocolAudio.playMinigameFail();
          return { actionType: 'door_locked', targetId: door.id };
        }

        // Traversed door!
        darkProtocolAudio.playDoorSlide();
        this.transitionCooldownTimer = 0.6;
        this.onRoomChange(door.toRoom, door.spawnX, door.spawnFacing);
        return { actionType: 'door_enter', targetId: door.toRoom };
      }
    }

    // C. Check Hiding Spots
    for (const spot of HIDING_SPOTS) {
      if (spot.room === currentRoom && Math.abs(charX - spot.x) <= 80) {
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
  // RENDERING PIPELINE (2-PASS COMPOSITING WITH AUTHORED ROOM COMPOSITION)
  // =========================================================================
  private render(dt: number) {
    const state = this.getState();
    const room = FACILITY_ROOMS[state.activeRoom] || FACILITY_ROOMS.control_room;
    const isSectorPowered = Boolean(state.circuits[room.sector]?.powered);

    // Pass 1: World Scene (Authored Background -> Doors -> Props -> Characters -> Particles)
    this.ctx.save();
    this.ctx.translate(-Math.floor(this.cameraX * this.roomScale), Math.floor(this.roomOffsetY));
    this.ctx.scale(this.roomScale, this.roomScale);

    this.renderRoomBackground(room, isSectorPowered);
    this.renderDoors(room, state, dt);
    this.renderHidingSpots(room);
    this.renderMachinesAndInteractables(room, isSectorPowered);
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

    // Pass 4: Atmospheric Light Bloom (NO floating dots) & CCTV / Debug Visuals
    this.ctx.save();
    this.ctx.translate(-Math.floor(this.cameraX * this.roomScale), Math.floor(this.roomOffsetY));
    this.ctx.scale(this.roomScale, this.roomScale);

    this.renderLightBloom(state, room, isSectorPowered);
    this.renderCameras(room, state);

    if (
      this.debugOptions.showAuthoringOverlay ||
      this.debugOptions.showInteractionZones ||
      this.debugOptions.showCameraFOV ||
      this.debugOptions.showLightBounds ||
      this.debugOptions.showCollisionBounds
    ) {
      this.renderDebugVisuals(room, state);
    }

    this.ctx.restore();

    // Vignette & CRT Scanlines
    this.renderVignette();

    // F8 Authoring Overlay (Screen-space OSD)
    if (this.debugOptions.showAuthoringOverlay) {
      this.renderAuthoringOsd(room);
    }
  }

  /**
   * REQUIREMENT 1 & 2: THE BACKGROUND PNG DEFINES THE ROOM
   * Renders the true authored room PNG at exactly (0, 0, 1983, 793).
   * Extends floor seamlessly so widescreen displays never show void borders.
   */
  private renderRoomBackground(room: RoomZone, isPowered: boolean) {
    const ctx = this.ctx;
    const w = SOURCE_ROOM_WIDTH;
    const h = SOURCE_ROOM_HEIGHT;

    const failureState = this.getSectorFailureFactor(room.sector);
    const effectivePowered = isPowered && (!failureState.inFailureSequence || failureState.strobe > 0.35);

    // 1. Draw Authored Room PNG
    const bgImg = darkProtocolAssets.getImage(room.background);
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, w, h);
    } else {
      ctx.fillStyle = effectivePowered ? '#0b111e' : '#030508';
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Seamless floor extension outside [0, w] for widescreen margins
    const extLeft = -2500;
    const extRight = w + 2500;
    const floorY = room.floorY;
    const floorH = h - floorY;

    // Dark void for outer walls
    ctx.fillStyle = '#020408';
    ctx.fillRect(extLeft, 0, -extLeft, floorY);
    ctx.fillRect(w, 0, extRight - w, floorY);

    // Concrete floor extension
    ctx.fillStyle = effectivePowered ? '#141d2b' : '#090e17';
    ctx.fillRect(extLeft, floorY, -extLeft, floorH);
    ctx.fillRect(w, floorY, extRight - w, floorH);

    // Hazard stripe continuation
    ctx.fillStyle = effectivePowered ? '#92400e' : '#451a03';
    ctx.fillRect(extLeft, floorY - 4, -extLeft, 4);
    ctx.fillRect(w, floorY - 4, extRight - w, 4);
  }

  /**
   * REQUIREMENT 6, 7, 8, 9: EXACTLY TWO TRAVERSAL DOORS PER ROOM + SALA 10 ESCAPE GATE
   * Overlays puerta_cerrada.png, puerta_entreabierta.png, and puerta_abierta.png
   * EXACTLY over the painted doorways in the artwork.
   * Smooth state transitions: cerrada -> entreabierta -> abierta.
   */
  private renderDoors(room: RoomZone, state: DarkProtocolGameState, dt: number) {
    const ctx = this.ctx;
    const floorY = room.floorY;
    const comp = ROOM_COMPOSITIONS[room.id];

    // Standard Door Dimensions matching painted doorway openings
    const doorW = 154;
    const doorH = 236;

    for (const door of Object.values(state.doors)) {
      if (door.fromRoom === room.id) {
        const x = door.fromX;
        const isPowered = !door.requiresPower || (door.circuitId && state.circuits[door.circuitId]?.powered);

        // Smooth door animation tracking: 0 = closed, 0.5 = partial, 1.0 = open
        const targetOpen = door.state === 'OPEN' ? 1.0 : door.state === 'AJAR' || door.state === 'OPENING_STAGE_1' ? 0.5 : 0.0;
        const currentProgress = this.doorAnimProgress[door.id] ?? 0.0;
        const nextProgress = currentProgress + (targetOpen - currentProgress) * Math.min(1, dt * 6);
        this.doorAnimProgress[door.id] = nextProgress;

        // Select door state asset based on animated progression
        let doorAsset = DOOR_ASSETS.closed;
        if (door.lockedByEntity) {
          doorAsset = DOOR_ASSETS.closed;
        } else if (nextProgress > 0.65) {
          doorAsset = DOOR_ASSETS.open;
        } else if (nextProgress > 0.2) {
          doorAsset = DOOR_ASSETS.partial;
        }

        const img = darkProtocolAssets.getImage(doorAsset);
        const doorX = x - doorW / 2;
        const doorY = floorY - doorH;

        if (img) {
          ctx.drawImage(img, doorX, doorY, doorW, doorH);
        } else {
          ctx.fillStyle = isPowered ? '#1e293b' : '#0f172a';
          ctx.fillRect(doorX, doorY, doorW, doorH);
        }

        // Status LED Indicator above door frame
        let ledColor = '#10b981';
        if (!isPowered) ledColor = '#475569';
        if (door.lockedByEntity) ledColor = '#ef4444';

        ctx.fillStyle = ledColor;
        ctx.beginPath();
        ctx.arc(x, doorY - 8, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Architectural Door Label
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(door.name.replace('Acceso a ', '').toUpperCase(), x, doorY - 14);
      }
    }

    // REQUIREMENT 9 & 31: SALA 10 SPECIAL CENTRAL EVACUATION BLAST GATE
    // Placed EXACTLY over the large central "SALIDA DE EMERGENCIA" in sala10.png
    if (room.id === 'evacuation' && comp?.escapeExit) {
      const gate = comp.escapeExit;
      const evacImg = darkProtocolAssets.getImage(DARK_PROTOCOL_ASSETS.salida_evacuacion);
      const gateX = gate.x - gate.width / 2;
      const gateY = gate.y - gate.height;

      if (evacImg) {
        ctx.drawImage(evacImg, gateX, gateY, gate.width, gate.height);
      }

      // Emergency Beacon above Central Escape Exit
      const isUnlocked = state.escapeUnlocked;
      const beaconFlicker = Math.floor(this.animTimer * 4) % 2 === 0;
      const beaconColor = isUnlocked ? (beaconFlicker ? '#10b981' : '#047857') : (beaconFlicker ? '#ef4444' : '#7f1d1d');

      ctx.fillStyle = beaconColor;
      ctx.beginPath();
      ctx.arc(gate.x, gateY + 22, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * REQUIREMENT 4: SURVIVOR VISUAL SCALE (~150px tall, 63.7% of standard door opening)
   * Scaled from BOTTOM CENTER: feet remain attached to floorY.
   */
  private renderSurvivorBody(
    x: number,
    y: number,
    facing: 'left' | 'right',
    animState: CharacterAnimState,
    health: HealthState,
    characterId: string,
    flashlightOn: boolean,
    flashlightAngle: number
  ) {
    const ctx = this.ctx;
    const char = getCharacterById(characterId);

    const isWalking = animState === 'WALK' || animState === 'WALK_FLASHLIGHT';
    const isRunning = animState === 'RUN' || animState === 'RUN_FLASHLIGHT';
    const isWorking = animState === 'WORKING' || animState === 'INTERACT';
    const isDowned = health === 'AGONIZANDO' || health === 'MUERTO';
    const isMoving = isWalking || isRunning;

    // Kinematics & Breathing
    const breathBob = isMoving ? 0 : Math.sin(this.animTimer * 2.6) * 1.6;
    const breathChest = isMoving ? 0 : Math.sin(this.animTimer * 2.6) * 0.8;

    let strideAngle = 0;
    let kneeFlex = 0;
    let torsoLean = 0;
    let walkBob = 0;

    if (isRunning) {
      strideAngle = Math.sin(this.animTimer * 15) * 0.52;
      kneeFlex = Math.abs(Math.cos(this.animTimer * 15)) * 0.35;
      torsoLean = 0.12;
      walkBob = Math.abs(Math.sin(this.animTimer * 15)) * 2.5;
    } else if (isWalking) {
      strideAngle = Math.sin(this.animTimer * 9) * 0.36;
      kneeFlex = Math.abs(Math.cos(this.animTimer * 9)) * 0.22;
      walkBob = Math.abs(Math.sin(this.animTimer * 9)) * 1.5;
    }

    ctx.save();
    // Anchor at BOTTOM CENTER: feet stay firmly attached to floorY
    ctx.translate(x, y);
    // Scale 2.35x brings 64px character height to 150.4px (~64% of 236px door height)
    ctx.scale(2.35, 2.35);
    if (facing === 'left') ctx.scale(-1, 1);

    // Contact shadow on floor
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 0, isRunning ? 16 : 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isDowned) {
      // Downed pose on floor
      const crawlBob = Math.sin(this.animTimer * 2) * 1.5;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-22, -12, 14, 8);
      ctx.fillStyle = char.primaryColor;
      ctx.fillRect(-10, -18 + crawlBob, 22, 14);
      ctx.fillStyle = '#334155';
      ctx.fillRect(10, -22 + crawlBob, 12, 12);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(16, -18 + crawlBob, 5, 3);
      ctx.fillStyle = '#475569';
      ctx.fillRect(18, -10 + crawlBob, 12, 5);
    } else {
      // BACK ARM
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
      ctx.fillRect(-3, 0, 6, 11);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-2.5, 9, 5, 10);
      ctx.fillStyle = '#475569';
      ctx.fillRect(-2.5, 17, 5, 4);
      ctx.restore();

      // LEGS & BOOTS
      if (!isMoving) {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(-9, -23, 7, 15);
        ctx.fillStyle = '#020617';
        ctx.fillRect(-11, -8, 10, 8);
        ctx.fillStyle = '#334155';
        ctx.fillRect(-11, -3, 10, 3);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(2, -23, 7, 15);
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, -8, 10, 8);
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, -3, 10, 3);
      } else {
        ctx.save();
        ctx.translate(-3, -23);
        ctx.rotate(strideAngle);
        ctx.fillStyle = '#090d16';
        ctx.fillRect(-3, 0, 6, 12);
        ctx.translate(0, 10);
        ctx.rotate(kneeFlex);
        ctx.fillRect(-3, 0, 6, 11);
        ctx.fillStyle = '#020617';
        ctx.fillRect(-3, 7, 9, 7);
        ctx.fillStyle = '#334155';
        ctx.fillRect(-3, 12, 9, 2);
        ctx.restore();

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

      // TORSO & CHEST
      ctx.save();
      ctx.translate(0, -breathBob + walkBob);
      if (torsoLean > 0) ctx.rotate(torsoLean);

      ctx.fillStyle = char.primaryColor;
      ctx.fillRect(-11 - breathChest / 2, -48, 22 + breathChest, 27);

      // Character-specific details
      if (char.id === 'mara_velasco') {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -27, 24, 5);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(8, -25, 4, 11);
      } else if (char.id === 'hector_gaona') {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-10, -48, 7, 25);
        ctx.fillRect(3, -48, 7, 25);
      } else if (char.id === 'valeria_cruz') {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(-10, -47, 20, 20);
      } else if (char.id === 'sergio_prada') {
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(-15, -46, 6, 21);
      } else if (char.id === 'operator') {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-10, -46, 8, 24);
        ctx.fillRect(2, -46, 8, 24);
      }

      // HEAD & HELMET
      ctx.fillStyle = '#475569';
      ctx.fillRect(-4, -51, 8, 4);

      ctx.fillStyle = '#334155';
      ctx.fillRect(-9, -64, 18, 15);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-10, -62, 2, 10);

      // Visor
      ctx.fillStyle = char.id === 'mara_velasco' ? '#fbbf24' : char.id === 'valeria_cruz' ? '#e11d48' : '#38bdf8';
      ctx.fillRect(2, -59, 7, 5);

      // FRONT ARM & FLASHLIGHT
      let frontArmAngle = isRunning
        ? Math.sin(this.animTimer * 15) * 0.6
        : isWalking
        ? Math.sin(this.animTimer * 9) * 0.4
        : -0.05;

      if (isWorking) {
        frontArmAngle = -0.75 + Math.sin(this.animTimer * 6) * 0.08;
      } else if (flashlightOn) {
        // Arm seamlessly rotates towards aim direction
        let aimAngle = flashlightAngle;
        if (facing === 'left') {
          aimAngle = Math.PI - aimAngle;
          if (aimAngle > Math.PI) aimAngle -= Math.PI * 2;
          if (aimAngle < -Math.PI) aimAngle += Math.PI * 2;
        }
        frontArmAngle = Math.max(-1.4, Math.min(1.2, aimAngle));
      }

      ctx.save();
      ctx.translate(4, -38);
      ctx.rotate(frontArmAngle);

      ctx.fillStyle = char.primaryColor;
      ctx.fillRect(-3, 0, 6, 10);
      ctx.fillStyle = char.secondaryColor || '#1e293b';
      ctx.fillRect(-2.5, 8, 5, 9);
      ctx.fillStyle = '#475569';
      ctx.fillRect(-3, 15, 6, 5);

      if (flashlightOn) {
        // Flashlight barrel & lens glow
        ctx.fillStyle = '#64748b';
        ctx.fillRect(0, 13, 14, 5);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(3, 12, 4, 7);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(14, 12, 3, 7);
        ctx.fillStyle = 'rgba(255, 248, 225, 0.85)';
        ctx.fillRect(17, 11, 3, 9);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(0, 13, 14, 5);
        ctx.fillStyle = '#334155';
        ctx.fillRect(14, 12, 3, 7);
      }

      ctx.restore(); // Front arm
      ctx.restore(); // Torso
    }

    ctx.restore(); // Character
  }

  /**
   * CHARACTERS RENDERING (Explorer, Operator, Entity, Multiplayer)
   */
  private renderCharacters(state: DarkProtocolGameState, currentRoom: RoomZone) {
    const floorY = currentRoom.floorY;
    const renderedPlayerIds = new Set<string>();

    // 1. Explorer
    if (state.explorer.room === currentRoom.id && !state.explorer.isHiding) {
      renderedPlayerIds.add('player_explorer');
      this.renderSurvivorBody(
        state.explorer.x,
        floorY,
        state.explorer.facing,
        state.explorer.animState || 'IDLE',
        state.explorer.health,
        state.selectedCharacterId,
        state.explorer.flashlightOn,
        state.explorer.flashlightAngle
      );
    }

    // 2. Operator
    if (state.operator.room === currentRoom.id) {
      renderedPlayerIds.add('player_operator');
      const isOperatorMoving = state.activeRole === 'OPERADOR' && Math.abs(this.playerVx) > 5;
      const opAnim: CharacterAnimState = isOperatorMoving ? 'WALK' : (state.operator.animState || 'IDLE');
      this.renderSurvivorBody(
        state.operator.x,
        floorY,
        state.operator.facing,
        opAnim,
        'SANO',
        'operator',
        false,
        0
      );
    }

    // 3. Multiplayer remote players
    if (state.players) {
      for (const [playerId, pData] of Object.entries(state.players)) {
        if (renderedPlayerIds.has(playerId)) continue;
        if (pData.roomId === currentRoom.id && pData.role !== 'ENTE') {
          renderedPlayerIds.add(playerId);
          const targetX = pData.normalizedRoomPosition * SOURCE_ROOM_WIDTH;

          if (!this.remotePlayerAnim[playerId]) {
            this.remotePlayerAnim[playerId] = {
              x: targetX,
              targetX,
              vx: 0,
              facing: 'right',
              animState: 'IDLE',
              lastUpdate: performance.now(),
            };
          }

          const rAnim = this.remotePlayerAnim[playerId];
          const prevX = rAnim.x;
          rAnim.x += (targetX - rAnim.x) * 0.15;
          const deltaX = rAnim.x - prevX;
          rAnim.vx = deltaX * 60;

          if (Math.abs(deltaX) > 0.4) {
            rAnim.facing = deltaX < 0 ? 'left' : 'right';
            rAnim.animState = Math.abs(deltaX) > 2.5 ? 'RUN' : 'WALK';
          } else {
            rAnim.animState = 'IDLE';
          }

          let charId = 'mara_velasco';
          if (pData.role === 'OPERADOR') charId = 'operator';

          this.renderSurvivorBody(
            rAnim.x,
            floorY,
            rAnim.facing,
            rAnim.animState,
            'SANO',
            charId,
            pData.role === 'EXPLORADOR',
            rAnim.facing === 'left' ? Math.PI : 0
          );
        }
      }
    }

    // 4. Manifested Entity
    if (state.entity.isManifested && state.entity.room === currentRoom.id) {
      this.renderEntity(state.entity.x, floorY, state.entity.animState || 'IDLE');
    }
  }

  private renderEntity(x: number, floorY: number, animState: string) {
    const ctx = this.ctx;
    const levitate = Math.sin(this.animTimer * 4) * 8;
    const y = floorY - 32 + levitate;

    ctx.save();
    ctx.translate(x, y);

    // Deep Shadow floor portal
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    ctx.ellipse(0, 32 - levitate, 40, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Void Core
    ctx.fillStyle = '#05010a';
    ctx.beginPath();
    ctx.arc(0, -55, 36, 0, Math.PI * 2);
    ctx.fill();

    // Purple nebula pulse
    const corePulse = 0.5 + Math.sin(this.animTimer * 6) * 0.25;
    ctx.fillStyle = `rgba(147, 51, 234, ${corePulse})`;
    ctx.beginPath();
    ctx.arc(0, -55, 26, 0, Math.PI * 2);
    ctx.fill();

    // Obsidian Horned Skull
    ctx.fillStyle = '#020005';
    ctx.beginPath();
    ctx.moveTo(-18, -62);
    ctx.lineTo(-26, -96);
    ctx.lineTo(-11, -76);
    ctx.lineTo(0, -86);
    ctx.lineTo(11, -76);
    ctx.lineTo(26, -96);
    ctx.lineTo(18, -62);
    ctx.closePath();
    ctx.fill();

    // Crimson Eyes
    const eyeFlicker = 0.85 + Math.random() * 0.15;
    ctx.fillStyle = `rgba(239, 68, 68, ${eyeFlicker})`;
    ctx.fillRect(-11, -64, 7, 5);
    ctx.fillRect(4, -64, 7, 5);

    ctx.restore();
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

  /**
   * REQUIREMENT 5, 22-25: INTERACTIVE PROPS & VISIBLE PHYSICAL TASK ANCHORS
   * Renders props only where required (mesa, taquilla, valvula, trampilla).
   * Displays subtle pixel shimmer / state indicator for nearby active tasks.
   */
  private renderMachinesAndInteractables(room: RoomZone, isPowered: boolean) {
    const ctx = this.ctx;
    const state = this.getState();
    const floorY = room.floorY;

    // Render interactive overlay props configured for this room
    for (const prop of FACILITY_PROPS) {
      if (prop.room === room.id) {
        // Skip camera (rendered in renderCameras) and evac_gate in non-evac room
        if (prop.type === 'camera') continue;
        if (prop.type === 'evac_door' && room.id !== 'evacuation') continue;

        const img = darkProtocolAssets.getImage(prop.asset);
        if (img) {
          const naturalW = img.naturalWidth || 800;
          const naturalH = img.naturalHeight || 800;
          const drawW = naturalW * prop.scale;
          const drawH = naturalH * prop.scale;
          const drawX = prop.x - drawW * prop.anchorX;
          const drawY = prop.y - drawH * prop.anchorY;

          ctx.save();
          if (prop.flipX) {
            ctx.translate(prop.x, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(img, -drawW * prop.anchorX, drawY, drawW, drawH);
          } else {
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
          }
          ctx.restore();
        }
      }
    }

    // REQUIREMENT 24 & 25: Subtle pixel feedback for interactive machines
    for (const obj of FACILITY_INTERACTABLES) {
      if (obj.room === room.id) {
        const distToPlayer = Math.abs(state.explorer.x - obj.x);
        const inRange = distToPlayer <= obj.radius;

        if (inRange) {
          // Subtle technical pixel pulse indicator
          const pulse = (Math.sin(this.animTimer * 5) + 1) / 2;
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + pulse * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);

          // Bounding frame bracket around the machine
          const frameW = 60;
          const frameH = 50;
          const fx = obj.x - frameW / 2;
          const fy = obj.y - frameH / 2;

          ctx.strokeRect(fx, fy, frameW, frameH);
          ctx.setLineDash([]);
        }
      }
    }

    // Room-specific hardware feedback
    if (room.id === 'evacuation') {
      // Keypad LCD status
      ctx.fillStyle = '#020617';
      ctx.fillRect(715, 620, 50, 20);
      ctx.fillStyle = state.coopSolved ? '#22c55e' : '#f59e0b';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(state.coopSolved ? 'OK' : '****', 740, 634);
    }
  }

  private renderHidingSpots(_room: RoomZone) {
    // Rendered cleanly via FACILITY_PROPS
  }

  /**
   * REQUIREMENT 10 & 11: CCTV CAMERA SPRITE RENDERING
   * Actually renders /assets/dark-protocol/camara.png high on walls.
   * Surveillance cone originates exactly from the camera lens.
   */
  private renderCameras(room: RoomZone, state: DarkProtocolGameState) {
    const ctx = this.ctx;
    const camImg = darkProtocolAssets.getImage(DARK_PROTOCOL_ASSETS.camara);

    for (const cam of Object.values(state.cameras)) {
      if (cam.room === room.id) {
        const isPowered = Boolean(state.circuits[cam.circuitId]?.powered);
        const isOnline = cam.state === 'ONLINE' && isPowered;

        const camW = 72;
        const camH = 48;
        const drawX = cam.x - camW / 2;
        const drawY = cam.y - camH / 2;

        ctx.save();
        if (cam.facing === 'left') {
          ctx.translate(cam.x, 0);
          ctx.scale(-1, 1);
          if (camImg) {
            ctx.drawImage(camImg, -camW / 2, drawY, camW, camH);
          }
        } else {
          if (camImg) {
            ctx.drawImage(camImg, drawX, drawY, camW, camH);
          }
        }
        ctx.restore();

        // Operational LED status on camera chassis
        let ledColor = '#10b981';
        if (!isPowered) ledColor = '#475569';
        else if (cam.state === 'INTERFERENCE') ledColor = '#f59e0b';
        else if (cam.state !== 'ONLINE') ledColor = '#ef4444';

        ctx.fillStyle = ledColor;
        ctx.beginPath();
        ctx.arc(cam.x + (cam.facing === 'right' ? 14 : -14), cam.y + 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * REQUIREMENT 16, 17, 18, 19, 20, 21: VOLUMETRIC FLASHLIGHT CONE & LIGHT MAP
   * Layered soft light cone: bright soft core + medium cone + very soft feathered falloff.
   * Warm-neutral 4100K color. Darkness/light-mask composited via multiply.
   */
  private renderLightMap(state: DarkProtocolGameState, room: RoomZone, isPowered: boolean) {
    const lCtx = this.lightCtx;
    const w = this.viewportWidth;
    const h = this.viewportHeight;

    lCtx.save();
    lCtx.clearRect(0, 0, w, h);

    // Ambient darkness based on power state and room identity
    let ambientDarkness = 'rgb(44, 52, 64)';
    if (!isPowered) {
      ambientDarkness = 'rgb(8, 10, 16)';
    }
    lCtx.fillStyle = ambientDarkness;
    lCtx.fillRect(0, 0, w, h);

    lCtx.globalCompositeOperation = 'lighter';
    // Translate and scale to match world scene
    lCtx.translate(-Math.floor(this.cameraX * this.roomScale), Math.floor(this.roomOffsetY));
    lCtx.scale(this.roomScale, this.roomScale);

    const failureState = this.getSectorFailureFactor(room.sector);

    // 1. Environmental Lights matching visible artwork fixtures
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
        grad.addColorStop(0.45, this.hexToRgba(light.color, 0.45 * light.intensity));
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        lCtx.fillStyle = grad;
        lCtx.beginPath();
        lCtx.arc(light.x, light.y, radius, 0, Math.PI * 2);
        lCtx.fill();
      }
    }

    // 2. Volumetric Soft Flashlight Cone (originates from character's HAND)
    if (
      state.explorer.room === room.id &&
      !state.explorer.isHiding &&
      state.explorer.flashlightOn
    ) {
      const char = getCharacterById(state.selectedCharacterId);
      const isHector = char.id === 'hector_gaona';

      // Hand position in source space
      const handX = state.explorer.x + (state.explorer.facing === 'right' ? 18 : -18);
      const handY = room.floorY - 78;
      const angle = state.explorer.flashlightAngle;

      // REQUIREMENT 19 & 20: Beam angles (inner ~20°, middle ~32°, outer ~48°)
      const outerSpread = isHector ? 0.48 : 0.42; // ~48°
      const middleSpread = isHector ? 0.32 : 0.28; // ~32°
      const innerSpread = isHector ? 0.20 : 0.16; // ~18-20°

      const maxDist = isHector ? 520 : 470;

      // Flashlight color: warm-neutral 4100K
      const coreColor = '#fffdf5';
      const midColor = 'rgba(255, 248, 225, 0.65)';
      const outerColor = 'rgba(254, 240, 138, 0.25)';

      // Layer 1: Outer Feathered Light Cone
      const outerGrad = lCtx.createRadialGradient(
        handX,
        handY,
        20,
        handX + Math.cos(angle) * maxDist * 0.7,
        handY + Math.sin(angle) * maxDist * 0.7,
        maxDist
      );
      outerGrad.addColorStop(0, midColor);
      outerGrad.addColorStop(0.5, outerColor);
      outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      lCtx.fillStyle = outerGrad;
      lCtx.beginPath();
      lCtx.moveTo(handX, handY);
      lCtx.arc(handX, handY, maxDist, angle - outerSpread, angle + outerSpread);
      lCtx.closePath();
      lCtx.fill();

      // Layer 2: Medium-Intensity Mid Cone
      const midGrad = lCtx.createRadialGradient(
        handX,
        handY,
        15,
        handX + Math.cos(angle) * maxDist * 0.5,
        handY + Math.sin(angle) * maxDist * 0.5,
        maxDist * 0.85
      );
      midGrad.addColorStop(0, coreColor);
      midGrad.addColorStop(0.4, midColor);
      midGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      lCtx.fillStyle = midGrad;
      lCtx.beginPath();
      lCtx.moveTo(handX, handY);
      lCtx.arc(handX, handY, maxDist * 0.85, angle - middleSpread, angle + middleSpread);
      lCtx.closePath();
      lCtx.fill();

      // Layer 3: Bright Soft Core
      const coreGrad = lCtx.createRadialGradient(
        handX,
        handY,
        5,
        handX + Math.cos(angle) * maxDist * 0.35,
        handY + Math.sin(angle) * maxDist * 0.35,
        maxDist * 0.65
      );
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, coreColor);
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      lCtx.fillStyle = coreGrad;
      lCtx.beginPath();
      lCtx.moveTo(handX, handY);
      lCtx.arc(handX, handY, maxDist * 0.65, angle - innerSpread, angle + innerSpread);
      lCtx.closePath();
      lCtx.fill();

      // Layer 4: Soft 360° Hand Halo
      const haloGrad = lCtx.createRadialGradient(handX, handY, 2, handX, handY, 65);
      haloGrad.addColorStop(0, 'rgba(255, 250, 230, 0.65)');
      haloGrad.addColorStop(0.6, 'rgba(254, 240, 138, 0.25)');
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      lCtx.fillStyle = haloGrad;
      lCtx.beginPath();
      lCtx.arc(handX, handY, 65, 0, Math.PI * 2);
      lCtx.fill();
    }

    lCtx.restore();
  }

  /**
   * REQUIREMENT 12: REMOVE FLOATING LIGHT DOTS
   * Atmospheric Bloom: enhances ambient glow with soft screen blending.
   * NO circular opaque dots are drawn at light origins!
   */
  private renderLightBloom(state: DarkProtocolGameState, room: RoomZone, isPowered: boolean) {
    const ctx = this.ctx;
    ctx.save();
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

        // Soft, diffused ambient flare (NO hard dots)
        const bloomRadius = 24;
        const bGrad = ctx.createRadialGradient(light.x, light.y, 2, light.x, light.y, bloomRadius);
        bGrad.addColorStop(0, this.hexToRgba(light.color, 0.25));
        bGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(light.x, light.y, bloomRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private renderVignette() {
    const ctx = this.ctx;
    const w = this.viewportWidth;
    const h = this.viewportHeight;

    const vGrad = ctx.createRadialGradient(
      w / 2,
      h / 2,
      w * 0.38,
      w / 2,
      h / 2,
      w * 0.68
    );
    vGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vGrad.addColorStop(1, 'rgba(0, 0, 0, 0.6)');

    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle CRT scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1.2);
    }
  }

  /**
   * REQUIREMENT 33 & 34: F8 AUTHORING DEBUG MODE
   * In F8 mode ONLY: displays normalized grid, live mouse room coordinate,
   * floorY, door bounds, camera mounts, light origins with radii, and task anchors.
   */
  private renderDebugVisuals(room: RoomZone, state: DarkProtocolGameState) {
    const ctx = this.ctx;
    const comp = ROOM_COMPOSITIONS[room.id];

    // Normalized coordinate grid (every 0.1)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;
    for (let xNorm = 0.1; xNorm < 1.0; xNorm += 0.1) {
      const wx = roomToWorldX(xNorm);
      ctx.beginPath();
      ctx.moveTo(wx, 0);
      ctx.lineTo(wx, SOURCE_ROOM_HEIGHT);
      ctx.stroke();
    }
    for (let yNorm = 0.1; yNorm < 1.0; yNorm += 0.1) {
      const wy = roomToWorldY(yNorm);
      ctx.beginPath();
      ctx.moveTo(0, wy);
      ctx.lineTo(SOURCE_ROOM_WIDTH, wy);
      ctx.stroke();
    }

    // Authored floorY line
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, room.floorY);
    ctx.lineTo(SOURCE_ROOM_WIDTH, room.floorY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Door Bounds & Labels
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
    ctx.lineWidth = 1.5;
    for (const door of Object.values(state.doors)) {
      if (door.fromRoom === room.id) {
        ctx.strokeRect(door.fromX - 77, room.floorY - 236, 154, 236);
        ctx.fillStyle = '#10b981';
        ctx.font = '10px monospace';
        ctx.fillText(`DOOR: ${door.toRoom} (${(door.fromX / SOURCE_ROOM_WIDTH).toFixed(3)})`, door.fromX - 60, room.floorY - 242);
      }
    }

    // Evacuation Central Escape Gate Bounds
    if (room.id === 'evacuation' && comp?.escapeExit) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.strokeRect(comp.escapeExit.x - comp.escapeExit.width / 2, comp.escapeExit.y - comp.escapeExit.height, comp.escapeExit.width, comp.escapeExit.height);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`CENTRAL ESCAPE GATE (${comp.escapeExit.normX.toFixed(3)})`, comp.escapeExit.x - 80, comp.escapeExit.y - comp.escapeExit.height - 8);
    }

    // REQUIREMENT 34: Debug Light Visualization in F8 Mode ONLY
    for (const l of FACILITY_LIGHTS) {
      if (l.room === room.id) {
        ctx.strokeStyle = l.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(l.x, l.y, l.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = l.color;
        ctx.beginPath();
        ctx.arc(l.x, l.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '9px monospace';
        ctx.fillText(`${l.type}: ${l.id} (${(l.x / SOURCE_ROOM_WIDTH).toFixed(3)}, ${(l.y / SOURCE_ROOM_HEIGHT).toFixed(3)})`, l.x + 8, l.y - 4);
      }
    }

    // Task Anchors & Interaction Zones
    for (const obj of FACILITY_INTERACTABLES) {
      if (obj.room === room.id) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px monospace';
        ctx.fillText(`TASK: ${obj.id}`, obj.x - 40, obj.y - obj.radius - 4);
      }
    }

    // CCTV Camera Mount & Cones
    for (const cam of Object.values(state.cameras)) {
      if (cam.room === room.id) {
        const centerAngle = cam.facing === 'right' ? 0.35 : Math.PI - 0.35;
        const halfFov = (cam.fovAngle * Math.PI) / 360;

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
        ctx.beginPath();
        ctx.moveTo(cam.x, cam.y);
        ctx.arc(cam.x, cam.y, cam.range, centerAngle - halfFov, centerAngle + halfFov);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  /**
   * REQUIREMENT 33: Screen-space OSD for F8 Authoring Mode
   * Displays live mouse normalized coordinates: ROOM X: 0.438  ROOM Y: 0.721
   */
  private renderAuthoringOsd(room: RoomZone) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
    ctx.fillRect(16, this.viewportHeight - 70, 360, 48);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(16, this.viewportHeight - 70, 360, 48);

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`[F8 ROOM AUTHORING MODE] ${room.name}`, 26, this.viewportHeight - 52);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(
      `ROOM X: ${this.normMouseX.toFixed(3)}  ROOM Y: ${this.normMouseY.toFixed(3)} | floorY: ${(room.floorY / SOURCE_ROOM_HEIGHT).toFixed(3)}`,
      26,
      this.viewportHeight - 34
    );
    ctx.restore();
  }

  /**
   * REAL CCTV FEED RENDERER
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

    if (!isOnline && !isInterfered) {
      targetCtx.fillStyle = '#05070c';
      targetCtx.fillRect(0, 0, tw, th);

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

      targetCtx.fillStyle = '#ef4444';
      targetCtx.font = 'bold 12px monospace';
      targetCtx.textAlign = 'center';
      targetCtx.fillText('SIN SEÑAL // CORTE DE ENERGÍA', tw / 2, th / 2);
      return;
    }

    targetCtx.save();
    const scale = th / SOURCE_ROOM_HEIGHT;
    targetCtx.scale(scale, scale);

    const camTargetX = Math.max(0, Math.min(cam.x - (tw / scale) / 2, SOURCE_ROOM_WIDTH - tw / scale));
    targetCtx.translate(-camTargetX, 0);

    this.renderRoomBackground(room, isPowered);
    this.renderMachinesAndInteractables(room, isPowered);
    this.renderHidingSpots(room);
    this.renderDoors(room, state, 0.016);

    if (state.explorer.room === cam.room && !state.explorer.isHiding) {
      const charX = state.explorer.x;
      const dist = Math.abs(charX - cam.x);
      const isFacingTowards = (cam.facing === 'right' && charX >= cam.x - 50) || (cam.facing === 'left' && charX <= cam.x + 50);

      if (dist <= cam.range && isFacingTowards) {
        this.renderCharacters(state, room);
      }
    }

    if (state.entity.isManifested && state.entity.room === cam.room) {
      this.renderCharacters(state, room);
    }

    targetCtx.restore();

    // CCTV Video Overlay
    targetCtx.save();
    targetCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    for (let y = 0; y < th; y += 3) {
      targetCtx.fillRect(0, y, tw, 1);
    }

    targetCtx.fillStyle = '#10b981';
    targetCtx.font = 'bold 10px monospace';
    targetCtx.textAlign = 'left';
    targetCtx.fillText(`● REC [${cam.name.split(':')[0]}]`, 10, 16);

    targetCtx.textAlign = 'right';
    const dateStr = new Date().toLocaleTimeString();
    targetCtx.fillText(`2026-10-05 ${dateStr}`, tw - 10, 16);
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
