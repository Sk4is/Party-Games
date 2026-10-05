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
    this.keys[e.code] = true;
    this.keys[e.key.toLowerCase()] = true;

    // Flashlight toggle on F
    if (e.code === 'KeyF' || e.key.toLowerCase() === 'f') {
      const state = this.getState();
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

    // Flashlight direction follows mouse
    const state = this.getState();
    if (state.activeRole === 'EXPLORADOR') {
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

    // 1. Move character if role has physical avatar
    let characterX = 0;
    let isMoving = false;
    let isRunning = false;

    if (activeRole === 'EXPLORADOR' && !state.explorer.isHiding) {
      characterX = state.explorer.x;
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
      const currentAnim = isMoving ? (isRunning ? 'RUN' : 'WALK') : 'IDLE';

      this.updateState((prev) => ({
        ...prev,
        explorer: {
          ...prev.explorer,
          x: characterX,
          facing,
          animState: currentAnim,
        },
      }));
    } else if (activeRole === 'OPERADOR') {
      characterX = state.operator.x;
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
          } else if (obj.id === 'maint_radio_station') {
            actionVerb = state.frequencyState.aligned ? 'FRECUENCIA OK' : 'SINTONIZAR SOCORRO';
          } else if (obj.id === 'gen_coop_keypad') {
            actionVerb = state.coopSolved ? 'CLAVE VALIDADA' : 'INTRODUCIR CLAVE';
          } else if (obj.id === 'gen_escape_console') {
            actionVerb = state.escapeUnlocked ? 'ACTIVAR EVACUACIÓN' : 'BLOQUEADA (SIN CLAVE)';
          } else if (obj.id === 'terminal_cctv_station') {
            actionVerb = 'MONITOR CCTV';
          } else if (obj.id === 'terminal_electric_station') {
            actionVerb = 'TABLERO ELÉCTRICO';
          } else if (obj.id === 'terminal_map_station') {
            actionVerb = 'PLANO TÁCTICO';
          } else if (obj.id === 'terminal_comms_station') {
            actionVerb = 'MATRIZ DE CIFRADO';
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

    // Back wall base color
    ctx.fillStyle = isPowered ? '#0b111e' : '#030508';
    ctx.fillRect(extLeft, 0, extWidth, h);

    // Industrial wall panels & seams across the extended space
    ctx.strokeStyle = isPowered ? '#141d2f' : '#070b12';
    ctx.lineWidth = 2;
    for (let x = extLeft; x <= extRight; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, room.floorY);
      ctx.stroke();

      ctx.fillStyle = isPowered ? '#1e293b' : '#0a0f18';
      ctx.fillRect(x - 2, 80, 4, 4);
      ctx.fillRect(x - 2, 220, 4, 4);
      ctx.fillRect(x - 2, 360, 4, 4);
    }

    // Concrete floor & hazard stripe extending seamlessly
    ctx.fillStyle = isPowered ? '#1e293b' : '#0d131d';
    ctx.fillRect(extLeft, room.floorY, extWidth, h - room.floorY);

    ctx.fillStyle = isPowered ? '#b45309' : '#451a03';
    ctx.fillRect(extLeft, room.floorY - 6, extWidth, 6);

    // Ceiling industrial girders
    ctx.fillStyle = isPowered ? '#0f172a' : '#050811';
    ctx.fillRect(extLeft, 0, extWidth, 40);

    // Overhead Cable bundles across the room
    ctx.strokeStyle = isPowered ? '#334155' : '#111827';
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
    ctx.fillStyle = isPowered ? '#475569' : '#1e293b';
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
      const terminals = [
        { x: 280, label: 'CCTV ARRAY', icon: '📹' },
        { x: 500, label: 'RED ELÉCTRICA', icon: '⚡' },
        { x: 740, label: 'PLANO TÁCTICO', icon: '🗺️' },
        { x: 960, label: 'COMUNICACIONES', icon: '📡' },
      ];

      for (const t of terminals) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(t.x - 45, floorY - 90, 90, 90);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(t.x - 40, floorY - 85, 80, 50);

        if (isPowered) {
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(t.x - 36, floorY - 82, 72, 44);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let sx = 0; sx < 68; sx += 6) {
            const sy = Math.sin(this.animTimer * 4 + sx * 0.2) * 8;
            if (sx === 0) ctx.moveTo(t.x - 34 + sx, floorY - 60 + sy);
            else ctx.lineTo(t.x - 34 + sx, floorY - 60 + sy);
          }
          ctx.stroke();
        } else {
          ctx.fillStyle = '#050c18';
          ctx.fillRect(t.x - 36, floorY - 82, 72, 44);
        }

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.label, t.x, floorY - 18);
      }
    } else if (room.id === 'laboratory') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(300, floorY - 140, 70, 140);
      ctx.fillStyle = isPowered ? 'rgba(16, 185, 129, 0.45)' : 'rgba(5, 40, 25, 0.3)';
      ctx.fillRect(308, floorY - 130, 54, 120);

      ctx.fillStyle = '#334155';
      ctx.fillRect(1000, floorY - 110, 100, 110);
      for (let i = 0; i < 3; i++) {
        const gx = 1020 + i * 30;
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(gx, floorY - 80, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isPowered ? '#06b6d4' : '#1e293b';
        ctx.stroke();
      }
    } else if (room.id === 'generators') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(400, floorY - 160, 220, 160);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.strokeRect(405, floorY - 155, 210, 150);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(1130, floorY - 150, 100, 150);
      ctx.strokeStyle = isPowered ? '#f97316' : '#334155';
      ctx.lineWidth = 6;
      ctx.strokeRect(1135, floorY - 145, 90, 145);
      ctx.fillStyle = isPowered ? '#ea580c' : '#475569';
      ctx.beginPath();
      ctx.arc(1180, floorY - 75, 22, 0, Math.PI * 2);
      ctx.fill();
    } else if (room.id === 'maintenance') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(420, floorY - 110, 80, 110);
      ctx.fillStyle = isPowered ? '#15803d' : '#052e16';
      ctx.fillRect(430, floorY - 95, 60, 45);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(460, floorY - 110);
      ctx.lineTo(460, floorY - 160);
      ctx.stroke();
    } else if (room.id === 'electrical_room') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(840, floorY - 130, 90, 130);
      ctx.strokeStyle = isPowered ? '#38bdf8' : '#e11d48';
      ctx.lineWidth = 3;
      ctx.strokeRect(845, floorY - 125, 80, 120);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', 885, floorY - 70);
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
   * Renders the 4 distinct characters with stride kinematics, breathing,
   * flashlight holding, and damage states.
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

      // Animation calculations
      const isWalking = animState === 'WALK';
      const isRunning = animState === 'RUN';
      const isDowned = state.explorer.health === 'AGONIZANDO' || state.explorer.health === 'MUERTO';

      const strideFreq = isRunning ? 16 : 10;
      const strideAmp = isRunning ? 9 : isWalking ? 6 : 0;
      const walkCycle = Math.sin(this.animTimer * strideFreq) * strideAmp;
      const breathBob = Math.sin(this.animTimer * 3) * 1.5;

      ctx.save();
      ctx.translate(x, y);
      if (facing === 'left') ctx.scale(-1, 1);

      // Contact shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (isDowned) {
        // Agonizing / Downed crawling pose
        ctx.fillStyle = char.secondaryColor;
        ctx.fillRect(-22, -14, 40, 12);
        ctx.fillStyle = char.primaryColor;
        ctx.fillRect(-10, -22, 22, 14);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(10, -26, 12, 12);
      } else {
        // Legs & Boots
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-10, -22 + walkCycle, 8, 22 - walkCycle);
        ctx.fillRect(2, -22 - walkCycle, 8, 22 + walkCycle);

        // Torso / Character Suit
        ctx.fillStyle = char.primaryColor;
        ctx.fillRect(-12, -48 + breathBob, 24, 28);

        // Character-specific silhouette details
        if (char.id === 'mara_velasco') {
          // Toolbelt & Harness
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-13, -28 + breathBob, 26, 6);
          ctx.fillStyle = '#d97706';
          ctx.fillRect(8, -26 + breathBob, 4, 10); // Wrench
        } else if (char.id === 'hector_gaona') {
          // Labcoat lapels & Cryo flask
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-10, -48 + breathBob, 8, 24);
          ctx.fillRect(2, -48 + breathBob, 8, 24);
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(-15, -42 + breathBob, 4, 14);
        } else if (char.id === 'valeria_cruz') {
          // Tactical plate carrier & Crimson epaulettes
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(-11, -47 + breathBob, 22, 22);
          ctx.fillStyle = '#e11d48';
          ctx.fillRect(-13, -48 + breathBob, 5, 6);
          ctx.fillRect(8, -48 + breathBob, 5, 6);
        } else if (char.id === 'sergio_prada') {
          // Radio pack & antenna
          ctx.fillStyle = '#064e3b';
          ctx.fillRect(-16, -46 + breathBob, 6, 20);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-13, -46 + breathBob);
          ctx.lineTo(-13, -68 + breathBob);
          ctx.stroke();
        }

        // Head / Helmet / Face
        ctx.fillStyle = '#334155';
        ctx.fillRect(-9, -62 + breathBob, 18, 15);
        // Visor / Eye slit
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(2, -58 + breathBob, 7, 6);

        // Lantern in hand
        ctx.fillStyle = '#64748b';
        ctx.fillRect(10, -32 + breathBob, 6, 10);
        if (state.explorer.flashlightOn) {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(14, -30 + breathBob, 4, 6);
        }
      }

      ctx.restore();
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

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-8, -20, 6, 20);
      ctx.fillRect(2, -20, 6, 20);

      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(-10, -46, 20, 28);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(2, -40, 4, 6);

      ctx.fillStyle = '#fbcfe8';
      ctx.fillRect(-8, -60, 16, 16);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-10, -62, 20, 4);
      ctx.fillRect(-10, -56, 4, 8);

      ctx.restore();
    }

    // 3. Render Manifested Entity if in current room
    if (state.entity.isManifested && state.entity.room === currentRoom.id) {
      const x = state.entity.x;
      const y = floorY - 12 + Math.sin(this.animTimer * 5) * 8;
      const animState = state.entity.animState || 'IDLE';

      ctx.save();
      ctx.translate(x, y);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.ellipse(0, 12, 26, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Void tendrils & amorphous silhouette
      ctx.fillStyle = '#08010f';
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.quadraticCurveTo(-28, -32, -15, -68);
      ctx.quadraticCurveTo(0, -82, 15, -68);
      ctx.quadraticCurveTo(28, -32, 18, 0);
      ctx.closePath();
      ctx.fill();

      // Glowing crimson eyes
      const eyeFlicker = 0.8 + Math.random() * 0.2;
      ctx.fillStyle = `rgba(239, 68, 68, ${eyeFlicker})`;
      ctx.fillRect(-7, -56, 5, 4);
      ctx.fillRect(2, -56, 5, 4);

      // Attack tendril lash
      if (animState === 'ATTACK') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(10, -40);
        ctx.lineTo(45, -45);
        ctx.lineTo(60, -35);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -38, 38 + Math.sin(this.animTimer * 8) * 4, 0, Math.PI * 2);
      ctx.stroke();

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

    for (const light of FACILITY_LIGHTS) {
      if (light.room === room.id) {
        let active = true;
        if (light.circuitId === 'emergency') {
          active = !isPowered || (light.flicker && Math.sin(this.animTimer * 6) > -0.2);
        } else if (light.circuitId && light.circuitId !== 'permanent') {
          active = Boolean(state.circuits[light.circuitId]?.powered);
        }

        if (!active) continue;

        const flickerMultiplier = light.flicker
          ? 0.75 + Math.sin(this.animTimer * 14 + light.x) * 0.25
          : 1.0;

        const radius = light.radius * flickerMultiplier;
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

    // Directional Flashlight Cone
    if (
      state.explorer.room === room.id &&
      !state.explorer.isHiding &&
      state.explorer.flashlightOn
    ) {
      const char = getCharacterById(state.selectedCharacterId);
      const isHector = char.id === 'hector_gaona'; // Doctor has 35% wider cone
      const coneHalfAngle = isHector ? 0.52 : 0.38;
      const coneLength = isHector ? 430 : 390;

      const handX = state.explorer.x + (state.explorer.facing === 'right' ? 14 : -14);
      const handY = 440;
      const angle = state.explorer.flashlightAngle;

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
