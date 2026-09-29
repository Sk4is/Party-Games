import { FortunariumWinTier } from '../types/fortunarium';

export interface FortunariumAudioSettings {
  masterVolume: number; // 0..100
  effectsVolume: number; // 0..100
  machineVolume: number; // 0..100
  muted: boolean;
}

const STORAGE_KEY = 'fam2play_fortunarium_audio_v1';

const DEFAULT_SETTINGS: FortunariumAudioSettings = {
  masterVolume: 80,
  effectsVolume: 85,
  machineVolume: 80,
  muted: false,
};

class FortunariumAudioEngine {
  private ctx: AudioContext | null = null;
  private settings: FortunariumAudioSettings = { ...DEFAULT_SETTINGS };
  private listeners = new Set<(s: FortunariumAudioSettings) => void>();
  private reelTickTimer: ReturnType<typeof setInterval> | null = null;
  private reelTickStep = 0;

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

  private loadSettings() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.settings = {
          masterVolume:
            typeof parsed.masterVolume === 'number'
              ? Math.max(0, Math.min(100, parsed.masterVolume))
              : DEFAULT_SETTINGS.masterVolume,
          effectsVolume:
            typeof parsed.effectsVolume === 'number'
              ? Math.max(0, Math.min(100, parsed.effectsVolume))
              : DEFAULT_SETTINGS.effectsVolume,
          machineVolume:
            typeof parsed.machineVolume === 'number'
              ? Math.max(0, Math.min(100, parsed.machineVolume))
              : DEFAULT_SETTINGS.machineVolume,
          muted: Boolean(parsed.muted),
        };
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  private saveSettings() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {}
    this.listeners.forEach((cb) => cb({ ...this.settings }));
  }

  public getSettings(): FortunariumAudioSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<FortunariumAudioSettings>) {
    this.settings = {
      ...this.settings,
      ...partial,
    };
    this.saveSettings();
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
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getChannelGain(channel: 'machine' | 'effects' | 'ui'): number {
    if (this.settings.muted) return 0;
    const master = this.settings.masterVolume / 100;
    const sub =
      channel === 'machine'
        ? this.settings.machineVolume / 100
        : this.settings.effectsVolume / 100;
    return master * sub;
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
