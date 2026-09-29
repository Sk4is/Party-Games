import { FortunariumWinTier } from '../types/fortunarium';

export interface FortunariumAudioSettings {
  /** Canonical internal volume representation: 0.0 ... 1.0 */
  masterVolume: number;
  /** Ambient / workshop background volume: 0.0 ... 1.0 */
  musicVolume: number;
  /** Mechanical & UI SFX volume: 0.0 ... 1.0 */
  sfxVolume: number;
  /** Backwards-compatible aliases (0.0 ... 1.0) */
  effectsVolume: number;
  machineVolume: number;
  muted: boolean;
}

const STORAGE_KEY = 'fam2play_fortunarium_audio_v1';

export const DEFAULT_FORTUNARIUM_AUDIO_SETTINGS: FortunariumAudioSettings = {
  masterVolume: 0.8,
  musicVolume: 0.45,
  sfxVolume: 0.55,
  effectsVolume: 0.55,
  machineVolume: 0.55,
  muted: false,
};

/**
 * Safely normalizes any volume input (number, string, stale percentage, or malformed value)
 * into a canonical finite number clamped between 0.0 and 1.0.
 * - Rejects NaN, Infinity, -Infinity, null, undefined, booleans, objects, empty strings
 * - Rejects absurd values (> 100 such as "8000" or < 0) by returning fallback
 * - Converts legacy 1..100 percentage values only when explicitly migrating v1 storage
 */
export function normalizeVolume(
  value: unknown,
  fallback = 0.8,
  allowLegacyPercentageConversion = false
): number {
  const safeFallback =
    typeof fallback === 'number' && Number.isFinite(fallback)
      ? Math.max(0, Math.min(1, fallback))
      : 0.8;

  if (
    value === null ||
    value === undefined ||
    typeof value === 'boolean' ||
    typeof value === 'object'
  ) {
    return safeFallback;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return safeFallback;
  }

  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed) || parsed < 0) {
    return safeFallback;
  }

  // Reject out-of-range values like "8000"
  if (parsed > 1) {
    if (allowLegacyPercentageConversion && parsed <= 100) {
      return Math.max(0, Math.min(1, Number((parsed / 100).toFixed(4))));
    }
    return safeFallback;
  }

  return Math.max(0, Math.min(1, Number(parsed.toFixed(4))));
}

/**
 * Always returns a finite integer percentage (0..100) for UI display.
 */
export function formatVolumePercentage(value: unknown, fallback = 0.8): number {
  const normalized = normalizeVolume(value, fallback, false);
  const pct = Math.round(normalized * 100);
  return Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : Math.round(fallback * 100);
}

class FortunariumAudioEngine {
  private ctx: AudioContext | null = null;
  private settings: FortunariumAudioSettings = { ...DEFAULT_FORTUNARIUM_AUDIO_SETTINGS };
  private listeners = new Set<(s: FortunariumAudioSettings) => void>();
  private reelTickTimer: ReturnType<typeof setInterval> | null = null;
  private reelTickStep = 0;

  // Ambient workshop synthesizer nodes
  private ambientGainNode: GainNode | null = null;
  private ambientOscA: OscillatorNode | null = null;
  private ambientOscB: OscillatorNode | null = null;
  private isAmbientWanted = false;

  constructor() {
    this.loadSettings();
  }

  public startReelSpinLoop() {
    this.stopReelSpinLoop();
    this.reelTickStep = 0;
    this.reelTickTimer = setInterval(() => {
      this.playReelTick(this.reelTickStep++);
    }, 85);
  }

  public stopReelSpinLoop() {
    if (this.reelTickTimer) {
      clearInterval(this.reelTickTimer);
      this.reelTickTimer = null;
    }
  }

  public startMusicLoop(_mode: 'lobby' | 'gameplay' = 'lobby') {
    this.isAmbientWanted = true;
    this.syncAmbientDrone();
  }

  public stopMusicLoop() {
    this.isAmbientWanted = false;
    this.teardownAmbientDrone();
  }

  private teardownAmbientDrone() {
    try {
      if (this.ambientOscA) {
        this.ambientOscA.stop();
        this.ambientOscA.disconnect();
      }
    } catch {}
    try {
      if (this.ambientOscB) {
        this.ambientOscB.stop();
        this.ambientOscB.disconnect();
      }
    } catch {}
    try {
      if (this.ambientGainNode) {
        this.ambientGainNode.disconnect();
      }
    } catch {}
    this.ambientOscA = null;
    this.ambientOscB = null;
    this.ambientGainNode = null;
  }

  private syncAmbientDrone() {
    const targetGain = this.getChannelGain('ambient') * 0.045;
    if (!this.isAmbientWanted || targetGain <= 0.0005) {
      if (this.ambientGainNode && this.ctx) {
        this.ambientGainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      return;
    }

    if (!this.ctx) {
      // Do not force-create AudioContext until user gesture or existing context is available
      return;
    }

    if (!this.ambientGainNode || !this.ambientOscA || !this.ambientOscB) {
      try {
        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(targetGain, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(160, now);

        const oscA = this.ctx.createOscillator();
        oscA.type = 'sine';
        oscA.frequency.setValueAtTime(55, now);

        const oscB = this.ctx.createOscillator();
        oscB.type = 'triangle';
        oscB.frequency.setValueAtTime(110.2, now);

        oscA.connect(filter);
        oscB.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        oscA.start(now);
        oscB.start(now);

        this.ambientGainNode = gain;
        this.ambientOscA = oscA;
        this.ambientOscB = oscB;
      } catch {}
    } else {
      try {
        this.ambientGainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.04);
      } catch {}
    }
  }

  public playLeverPull() {
    this.playLeverAndMotorStart();
  }

  public playCoinCountTick(step = 0, _total = 10) {
    this.playCounterTick(step);
  }

  public playQuotaCompleted() {
    this.playWinTierSting('HUGE');
  }

  public playNoWinThud() {
    this.playWinTierSting('NONE');
  }

  public playBombExplosion() {
    this.playSpecialSymbolCue('negative');
  }

  public playSkullCurse() {
    this.playSpecialSymbolCue('negative');
  }

  public playElectricZap() {
    this.playSpecialSymbolCue('positive');
  }

  public playRepairClank() {
    this.playSpecialSymbolCue('positive');
  }

  public playUpgradeBought() {
    this.playPatternChime(2);
  }

  public playPatternRevealStep(stepIdx = 0, _totalSteps = 1, _amount = 25) {
    this.playPatternChime(stepIdx);
  }

  public playWinFanfare(tier: FortunariumWinTier) {
    this.playWinTierSting(tier);
  }

  public playUpgradeInstall() {
    this.playUpgradeBoltInstall();
  }

  public playLeverRelease() {
    this.playLeverAndMotorStart();
  }

  public playHeroSpinPress() {
    this.playLeverAndMotorStart();
  }

  public playLeverDragTick(progress: number) {
    this.playLeverRatchetTick(progress);
  }

  public playLeverSpringBack() {
    this.playLeverRatchetTick(0.2);
  }

  public playSkullPenalty() {
    this.playSpecialSymbolSound('calavera');
  }

  public playLightningCharge() {
    this.playSpecialSymbolSound('rayo');
  }

  public playKeyRepairChime() {
    this.playSpecialSymbolSound('llave');
  }

  public playCoinClink() {
    this.playSpecialSymbolSound('moneda');
  }

  public playMysteryJingle() {
    this.playSpecialSymbolSound('interrogacion');
  }

  public playWildTransform() {
    this.playSpecialSymbolSound('comodin');
  }

  public playLeverThresholdClick() {
    const vol = this.getChannelGain('machine');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.03);
    gain.gain.setValueAtTime(0.2 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playFinalReelClunk() {
    const vol = this.getChannelGain('machine');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.14);
    gain.gain.setValueAtTime(0.45 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playBankruptcyPowerDown() {
    const vol = this.getChannelGain('effects');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.75);
    gain.gain.setValueAtTime(0.28 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.82);
  }

  public normalizeSettingsObject(rawObj: unknown): FortunariumAudioSettings {
    if (!rawObj || typeof rawObj !== 'object') {
      return { ...DEFAULT_FORTUNARIUM_AUDIO_SETTINGS };
    }
    const parsed = rawObj as Record<string, unknown>;
    const isLegacyV1 =
      parsed.version !== 2 &&
      parsed.musicVolume === undefined &&
      parsed.sfxVolume === undefined;

    const masterVolume = normalizeVolume(
      parsed.masterVolume,
      DEFAULT_FORTUNARIUM_AUDIO_SETTINGS.masterVolume,
      isLegacyV1
    );
    const musicVolume = normalizeVolume(
      parsed.musicVolume,
      DEFAULT_FORTUNARIUM_AUDIO_SETTINGS.musicVolume,
      isLegacyV1
    );
    const sfxFallbackSource =
      parsed.sfxVolume !== undefined
        ? parsed.sfxVolume
        : parsed.machineVolume !== undefined
        ? parsed.machineVolume
        : parsed.effectsVolume;
    const sfxVolume = normalizeVolume(
      sfxFallbackSource,
      DEFAULT_FORTUNARIUM_AUDIO_SETTINGS.sfxVolume,
      isLegacyV1
    );

    return {
      masterVolume,
      musicVolume,
      sfxVolume,
      effectsVolume: sfxVolume,
      machineVolume: sfxVolume,
      muted: Boolean(parsed.muted),
    };
  }

  public loadSettings() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.settings = this.normalizeSettingsObject(parsed);
      } else {
        this.settings = { ...DEFAULT_FORTUNARIUM_AUDIO_SETTINGS };
      }
    } catch {
      this.settings = { ...DEFAULT_FORTUNARIUM_AUDIO_SETTINGS };
    }
  }

  public saveSettings() {
    this.settings = this.normalizeSettingsObject({
      ...this.settings,
      version: 2,
    });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            version: 2,
            masterVolume: this.settings.masterVolume,
            musicVolume: this.settings.musicVolume,
            sfxVolume: this.settings.sfxVolume,
            effectsVolume: this.settings.sfxVolume,
            machineVolume: this.settings.sfxVolume,
            muted: this.settings.muted,
          })
        );
      } catch {}
    }
    this.syncAmbientDrone();
    this.listeners.forEach((cb) => cb({ ...this.settings }));
  }

  public getSettings(): FortunariumAudioSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<FortunariumAudioSettings>) {
    const next = {
      ...this.settings,
      ...partial,
      version: 2,
    };
    this.settings = this.normalizeSettingsObject(next);
    this.saveSettings();
  }

  public setMasterVolume(value: unknown) {
    const masterVolume = normalizeVolume(
      value,
      DEFAULT_FORTUNARIUM_AUDIO_SETTINGS.masterVolume,
      false
    );
    this.settings = {
      ...this.settings,
      masterVolume,
    };
    this.saveSettings();
  }

  public setMusicVolume(value: unknown) {
    const musicVolume = normalizeVolume(
      value,
      DEFAULT_FORTUNARIUM_AUDIO_SETTINGS.musicVolume,
      false
    );
    this.settings = {
      ...this.settings,
      musicVolume,
    };
    // Ensure AudioContext starts on user slider interaction so ambient workshop audio is audible
    if (this.isAmbientWanted && !this.settings.muted && musicVolume > 0.001) {
      this.getContext();
    }
    this.saveSettings();
  }

  public setSfxVolume(value: unknown) {
    const sfxVolume = normalizeVolume(
      value,
      DEFAULT_FORTUNARIUM_AUDIO_SETTINGS.sfxVolume,
      false
    );
    this.settings = {
      ...this.settings,
      sfxVolume,
      effectsVolume: sfxVolume,
      machineVolume: sfxVolume,
    };
    this.saveSettings();
  }

  public setMuted(muted: boolean) {
    this.settings = {
      ...this.settings,
      muted: Boolean(muted),
    };
    this.saveSettings();
  }

  public toggleMute(): boolean {
    const nextMuted = !this.settings.muted;
    this.setMuted(nextMuted);
    return nextMuted;
  }

  public subscribe(cb: (s: FortunariumAudioSettings) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getChannelGain(channel: 'machine' | 'effects' | 'ui' | 'ambient'): number {
    if (this.settings.muted) return 0;
    const master = normalizeVolume(
      this.settings.masterVolume,
      DEFAULT_FORTUNARIUM_AUDIO_SETTINGS.masterVolume,
      false
    );
    if (channel === 'ambient') {
      const ambient = normalizeVolume(
        this.settings.musicVolume,
        DEFAULT_FORTUNARIUM_AUDIO_SETTINGS.musicVolume,
        false
      );
      return master * ambient;
    }
    const sfx = normalizeVolume(
      this.settings.sfxVolume,
      DEFAULT_FORTUNARIUM_AUDIO_SETTINGS.sfxVolume,
      false
    );
    return master * sfx;
  }

  // 1. Mechanical Button Click (MÁQUINA channel)
  public playButtonClick() {
    const vol = this.getChannelGain('machine');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.045);

    gain.gain.setValueAtTime(0.22 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 2. Heavy Lever Pull & Motor Spin Start (MÁQUINA channel)
  public playLeverAndMotorStart() {
    const vol = this.getChannelGain('machine');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Lever latch clunk
    const latchOsc = ctx.createOscillator();
    const latchGain = ctx.createGain();
    latchOsc.type = 'sawtooth';
    latchOsc.frequency.setValueAtTime(190, now);
    latchOsc.frequency.exponentialRampToValueAtTime(65, now + 0.11);
    latchGain.gain.setValueAtTime(0.28 * vol, now);
    latchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    latchOsc.connect(latchGain);
    latchGain.connect(ctx.destination);
    latchOsc.start(now);
    latchOsc.stop(now + 0.12);

    // Motor spin-up hum
    const motorOsc = ctx.createOscillator();
    const motorGain = ctx.createGain();
    motorOsc.type = 'triangle';
    motorOsc.frequency.setValueAtTime(85, now + 0.06);
    motorOsc.frequency.exponentialRampToValueAtTime(215, now + 0.28);
    motorOsc.frequency.exponentialRampToValueAtTime(135, now + 0.45);
    motorGain.gain.setValueAtTime(0.001, now + 0.06);
    motorGain.gain.linearRampToValueAtTime(0.18 * vol, now + 0.16);
    motorGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    motorOsc.connect(motorGain);
    motorGain.connect(ctx.destination);
    motorOsc.start(now + 0.06);
    motorOsc.stop(now + 0.5);
  }

  // 3. Soft repeating reel tick during downward movement (MÁQUINA channel)
  public playReelTick(step = 0) {
    const vol = this.getChannelGain('machine');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 290 + (step % 4) * 18;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.024);

    gain.gain.setValueAtTime(0.075 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.028);
  }

  public playReelStopClack(colIndex = 0) {
    this.playReelLockClack(colIndex);
  }

  // 4. Heavy Column Lock CLACK (MÁQUINA channel)
  public playReelLockClack(colIndex: number) {
    const vol = this.getChannelGain('machine');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Low mechanical thud
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = 'triangle';
    const pitch = 135 + colIndex * 14;
    thudOsc.frequency.setValueAtTime(pitch, now);
    thudOsc.frequency.exponentialRampToValueAtTime(48, now + 0.09);

    thudGain.gain.setValueAtTime(0.34 * vol, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudOsc.start(now);
    thudOsc.stop(now + 0.1);

    // Metallic escapement click
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(720 + colIndex * 55, now);
    clickOsc.frequency.exponentialRampToValueAtTime(220, now + 0.03);

    clickGain.gain.setValueAtTime(0.14 * vol, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.035);
  }

  // 5. Final Mechanical Settle after 5th column locks (MÁQUINA channel)
  public playMechanicalSettle() {
    const vol = this.getChannelGain('machine');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(62, now + 0.12);

    gain.gain.setValueAtTime(0.18 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  // 6. Distinctive Musical/Mechanical Pattern Chime (EFECTOS channel)
  public playPatternChime(patternIndex = 0) {
    const vol = this.getChannelGain('effects');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Escalate semitones slightly for consecutive patterns
    const pitchMult = Math.pow(1.06, Math.min(5, patternIndex));
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.055;
      osc.frequency.setValueAtTime(freq * pitchMult, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.2 * vol, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  // 7. Special Symbol Activation Cue (EFECTOS channel)
  public playSpecialSymbolCue(variant: 'positive' | 'negative' | 'neutral' | 'jackpot') {
    const vol = this.getChannelGain('effects');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    if (variant === 'negative') {
      const freqs = [240, 185];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        const t = now + idx * 0.11;
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 0.72, t + 0.16);
        gain.gain.setValueAtTime(0.22 * vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
      });
    } else {
      const freqs = variant === 'jackpot' ? [587.33, 783.99, 1174.66] : [440, 659.25];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const t = now + idx * 0.065;
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.22 * vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    }
  }

  // 8. Win Intensity Tier Stings (EFECTOS channel)
  public playWinTierSting(tier: FortunariumWinTier) {
    const vol = this.getChannelGain('effects');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (tier === 'NONE') {
      // Subtle low settle
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(175, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
      gain.gain.setValueAtTime(0.12 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
      return;
    }

    if (tier === 'LOSS') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(195, now);
      osc.frequency.exponentialRampToValueAtTime(98, now + 0.26);
      gain.gain.setValueAtTime(0.24 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
      return;
    }

    const chordMap: Record<Exclude<FortunariumWinTier, 'NONE' | 'LOSS'>, number[]> = {
      SMALL: [523.25, 659.25],
      MEDIUM: [523.25, 659.25, 783.99],
      BIG: [523.25, 659.25, 783.99, 1046.5],
      HUGE: [523.25, 659.25, 783.99, 987.77, 1318.5],
      JACKPOT: [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98],
    };

    const notes = chordMap[tier] || chordMap.SMALL;
    const duration = tier === 'JACKPOT' ? 0.55 : tier === 'HUGE' ? 0.45 : 0.32;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = tier === 'JACKPOT' || tier === 'HUGE' ? 'triangle' : 'sine';
      const t = now + idx * 0.06;
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.24 * vol, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.02);
    });
  }

  // 9. Cash Counter Climbing Tick (MÁQUINA channel)
  public playCounterTick(step = 0) {
    const vol = this.getChannelGain('machine');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const freq = Math.min(1400, 660 + step * 22);
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.11 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.032);
  }

  // 10. Garage Shutter Lift (MÁQUINA channel)
  public playGarageDoorOpen() {
    const vol = this.getChannelGain('machine');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Chain ratchet clicks while rolling up
    for (let i = 0; i < 11; i++) {
      const t = now + i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110 + i * 14, t);
      osc.frequency.exponentialRampToValueAtTime(65, t + 0.055);
      gain.gain.setValueAtTime(0.18 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.065);
    }

    // Final top latch clunk
    const latchTime = now + 0.92;
    const oscLatch = ctx.createOscillator();
    const gainLatch = ctx.createGain();
    oscLatch.type = 'square';
    oscLatch.frequency.setValueAtTime(190, latchTime);
    oscLatch.frequency.exponentialRampToValueAtTime(58, latchTime + 0.14);
    gainLatch.gain.setValueAtTime(0.28 * vol, latchTime);
    gainLatch.gain.exponentialRampToValueAtTime(0.001, latchTime + 0.15);
    oscLatch.connect(gainLatch);
    gainLatch.connect(ctx.destination);
    oscLatch.start(latchTime);
    oscLatch.stop(latchTime + 0.16);
  }

  // 10b. Garage Shutter Close Impact
  public playGarageDoorClose() {
    const vol = this.getChannelGain('machine');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const t = now + i * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 - i * 12, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.045);
      gain.gain.setValueAtTime(0.14 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.055);
    }

    const impactTime = now + 0.38;
    const oscImpact = ctx.createOscillator();
    const gainImpact = ctx.createGain();
    oscImpact.type = 'triangle';
    oscImpact.frequency.setValueAtTime(95, impactTime);
    oscImpact.frequency.exponentialRampToValueAtTime(32, impactTime + 0.12);
    gainImpact.gain.setValueAtTime(0.24 * vol, impactTime);
    gainImpact.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.13);
    oscImpact.connect(gainImpact);
    gainImpact.connect(ctx.destination);
    oscImpact.start(impactTime);
    oscImpact.stop(impactTime + 0.14);
  }

  // 11. Machine Power-On Ignition (MÁQUINA channel)
  public playMachinePowerOn() {
    const vol = this.getChannelGain('machine');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Warm transformer hum rising
    const hum = ctx.createOscillator();
    const humGain = ctx.createGain();
    hum.type = 'sawtooth';
    hum.frequency.setValueAtTime(60, now);
    hum.frequency.exponentialRampToValueAtTime(180, now + 0.55);
    humGain.gain.setValueAtTime(0.01, now);
    humGain.gain.linearRampToValueAtTime(0.16 * vol, now + 0.25);
    humGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    hum.connect(humGain);
    humGain.connect(ctx.destination);
    hum.start(now);
    hum.stop(now + 0.68);

    // Bulb ignition & counter boot chime
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, idx) => {
      const t = now + 0.22 + idx * 0.085;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.18 * vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.24);
    });
  }

  // 11c. Heavy Rubber Stamp / Quota Seal CLACK (EFECTOS + MÁQUINA)
  public playQuotaStamp() {
    const vol = this.getChannelGain('effects');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Heavy mechanical slap
    const slap = ctx.createOscillator();
    const slapGain = ctx.createGain();
    slap.type = 'triangle';
    slap.frequency.setValueAtTime(240, now);
    slap.frequency.exponentialRampToValueAtTime(45, now + 0.12);
    slapGain.gain.setValueAtTime(0.38 * vol, now);
    slapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    slap.connect(slapGain);
    slapGain.connect(ctx.destination);
    slap.start(now);
    slap.stop(now + 0.15);

    // Resonant metallic ring
    const ring = ctx.createOscillator();
    const ringGain = ctx.createGain();
    ring.type = 'sine';
    ring.frequency.setValueAtTime(880, now + 0.02);
    ring.frequency.exponentialRampToValueAtTime(440, now + 0.35);
    ringGain.gain.setValueAtTime(0.18 * vol, now + 0.02);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    ring.connect(ringGain);
    ringGain.connect(ctx.destination);
    ring.start(now + 0.02);
    ring.stop(now + 0.4);
  }

  // 12. Bet Selector Mechanical Switch (INTERFAZ + MÁQUINA)
  public playBetSelectorClick(mode: 'normal' | 'doble' | 'sobrecarga') {
    const vol = this.getChannelGain('ui');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseFreq = mode === 'sobrecarga' ? 520 : mode === 'doble' ? 390 : 290;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.055);
    gain.gain.setValueAtTime(0.22 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  // 13. Lever Ratchet Drag Tick (MÁQUINA channel)
  public playLeverRatchetTick(progress: number) {
    const vol = this.getChannelGain('machine');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const freq = 180 + Math.round(progress * 260);
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.035);
    gain.gain.setValueAtTime(0.18 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  // 14. Special Symbol Specific Reactions (MÁQUINA channel)
  public playSpecialSymbolSound(
    symbolId:
      | 'bomba'
      | 'llave'
      | 'rayo'
      | 'calavera'
      | 'moneda'
      | 'interrogacion'
      | 'comodin'
      | 'synergy'
  ) {
    const vol = this.getChannelGain('machine');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (symbolId) {
      case 'bomba': {
        // Fuse sizzle + deep cabinet thud
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(36, now + 0.34);
        gain.gain.setValueAtTime(0.36 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.38);
        break;
      }
      case 'llave':
      case 'synergy': {
        // Metallic ratchet turn + positive repair chime
        const freqs = [380, 520, 760];
        freqs.forEach((f, i) => {
          const t = now + i * 0.07;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(f, t);
          g.gain.setValueAtTime(0.24 * vol, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(t);
          o.stop(t + 0.18);
        });
        break;
      }
      case 'rayo': {
        // Electrical arc + rising capacitor charge
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(980, now + 0.28);
        gain.gain.setValueAtTime(0.22 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
        break;
      }
      case 'calavera': {
        // Dark descending drain
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.32);
        gain.gain.setValueAtTime(0.28 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
        break;
      }
      case 'moneda': {
        // Multi-coin metallic clink
        const coins = [1046.5, 1318.5, 1567.98];
        coins.forEach((f, i) => {
          const t = now + i * 0.055;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, t);
          g.gain.setValueAtTime(0.25 * vol, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(t);
          o.stop(t + 0.2);
        });
        break;
      }
      case 'interrogacion':
      case 'comodin': {
        // Suspenseful mystery arpeggio
        const notes = [440, 587.33, 698.46, 880];
        notes.forEach((f, i) => {
          const t = now + i * 0.06;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(f, t);
          g.gain.setValueAtTime(0.22 * vol, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(t);
          o.stop(t + 0.21);
        });
        break;
      }
    }
  }

  // 15. Paper Note Taped to Board (INTERFAZ channel)
  public playPaperTapeNote() {
    const vol = this.getChannelGain('ui');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.09);
    gain.gain.setValueAtTime(0.22 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  // 16. Upgrade Bolt Installation (MÁQUINA channel)
  public playUpgradeBoltInstall() {
    const vol = this.getChannelGain('machine');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const steps = [260, 340, 523.25, 783.99];
    steps.forEach((f, idx) => {
      const t = now + idx * 0.065;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = idx < 2 ? 'square' : 'triangle';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.24 * vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.2);
    });
  }

  // 17. Machine Power-Down on Bankruptcy / Breakdown (MÁQUINA channel)
  public playMachinePowerDown() {
    const vol = this.getChannelGain('machine');
    if (vol <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.65);
    gain.gain.setValueAtTime(0.28 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  }
}

export const fortunariumAudio = new FortunariumAudioEngine();
