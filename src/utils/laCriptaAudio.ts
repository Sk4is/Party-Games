class LaCriptaAudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined' || this.muted) return null;
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

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  public playStoneClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(72, now + 0.065);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  public playCharacterSelect() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const freqs = [220, 277.18, 329.63];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.055;
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.34);
    });
  }

  public playHeroSelect() {
    this.playCharacterSelect();
  }

  public playDoorHover() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(165, now + 0.14);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playDoorVote() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Heavy stone seal thud + iron ring
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(145, now);
    thud.frequency.exponentialRampToValueAtTime(48, now + 0.16);
    thudGain.gain.setValueAtTime(0.24, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.18);

    const ring = ctx.createOscillator();
    const ringGain = ctx.createGain();
    ring.type = 'sine';
    ring.frequency.setValueAtTime(392, now + 0.03);
    ring.frequency.exponentialRampToValueAtTime(293.66, now + 0.28);
    ringGain.gain.setValueAtTime(0.09, now + 0.03);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    ring.connect(ringGain);
    ringGain.connect(ctx.destination);
    ring.start(now + 0.03);
    ring.stop(now + 0.31);
  }

  public playDoorOpeningSequence() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Deep ancient stone grinding drone (0s -> 3.6s)
    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(52, now);
    rumble.frequency.linearRampToValueAtTime(64, now + 1.8);
    rumble.frequency.exponentialRampToValueAtTime(38, now + 3.6);

    rumbleGain.gain.setValueAtTime(0.001, now);
    rumbleGain.gain.linearRampToValueAtTime(0.14, now + 0.4);
    rumbleGain.gain.setValueAtTime(0.14, now + 2.6);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 3.7);

    rumble.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);
    rumble.start(now);
    rumble.stop(now + 3.8);

    // 2. Iron chain clanks along the opening
    [0.25, 0.75, 1.35, 1.95, 2.55].forEach((offset, idx) => {
      const clank = ctx.createOscillator();
      const clankGain = ctx.createGain();
      clank.type = 'triangle';
      const t = now + offset;
      clank.frequency.setValueAtTime(280 + (idx % 2) * 45, t);
      clank.frequency.exponentialRampToValueAtTime(95, t + 0.11);
      clankGain.gain.setValueAtTime(0.12, t);
      clankGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      clank.connect(clankGain);
      clankGain.connect(ctx.destination);
      clank.start(t);
      clank.stop(t + 0.13);
    });

    // 3. Solemn dark-fantasy chord when the threshold reveals Floor I
    const chord = [146.83, 220.0, 261.63, 329.63]; // D minor / ninth atmosphere
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + 2.1;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.075, t + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 2.05);
    });
  }

  public playSwordSlash(isCrit = false) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Sharp metallic blade sweep
    const blade = ctx.createOscillator();
    const bladeGain = ctx.createGain();
    blade.type = 'sawtooth';
    blade.frequency.setValueAtTime(isCrit ? 620 : 440, now);
    blade.frequency.exponentialRampToValueAtTime(95, now + (isCrit ? 0.19 : 0.13));

    bladeGain.gain.setValueAtTime(isCrit ? 0.22 : 0.16, now);
    bladeGain.gain.exponentialRampToValueAtTime(0.001, now + (isCrit ? 0.2 : 0.14));

    blade.connect(bladeGain);
    bladeGain.connect(ctx.destination);
    blade.start(now);
    blade.stop(now + (isCrit ? 0.21 : 0.15));

    // Heavy impact thud
    const impact = ctx.createOscillator();
    const impactGain = ctx.createGain();
    impact.type = 'triangle';
    impact.frequency.setValueAtTime(isCrit ? 185 : 130, now + 0.03);
    impact.frequency.exponentialRampToValueAtTime(38, now + 0.18);
    impactGain.gain.setValueAtTime(isCrit ? 0.28 : 0.2, now + 0.03);
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    impact.connect(impactGain);
    impactGain.connect(ctx.destination);
    impact.start(now + 0.03);
    impact.stop(now + 0.2);

    if (isCrit) {
      // Critical gold ring
      const ring = ctx.createOscillator();
      const ringGain = ctx.createGain();
      ring.type = 'sine';
      ring.frequency.setValueAtTime(880, now + 0.04);
      ring.frequency.exponentialRampToValueAtTime(587.33, now + 0.28);
      ringGain.gain.setValueAtTime(0.14, now + 0.04);
      ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      ring.connect(ringGain);
      ringGain.connect(ctx.destination);
      ring.start(now + 0.04);
      ring.stop(now + 0.31);
    }
  }

  public playMagicCast() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [293.66, 369.99, 440, 587.33];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.035;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.15, t + 0.16);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.21);
    });
  }

  public playShieldGuard() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Steel shield clang + resonant harmonic
    [196, 392].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.88, now + 0.22);
      gain.gain.setValueAtTime(idx === 0 ? 0.18 : 0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    });
  }

  public playEnemyDeath() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const crumble = ctx.createOscillator();
    const gain = ctx.createGain();
    crumble.type = 'sawtooth';
    crumble.frequency.setValueAtTime(165, now);
    crumble.frequency.exponentialRampToValueAtTime(34, now + 0.32);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    crumble.connect(gain);
    gain.connect(ctx.destination);
    crumble.start(now);
    crumble.stop(now + 0.35);
  }

  public playHealChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    [329.63, 440, 659.25].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.045;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public playGoldChange(isPositive = true) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const freqs = isPositive ? [587.33, 880] : [440, 293.66];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.05;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.17);
    });
  }

  public playReviveFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const chord = [261.63, 329.63, 392.0, 523.25];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.05;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.46);
    });
  }

  /**
   * Heavy stone door grinding shut + iron seal lock thud (Room Transition Close)
   */
  public playRoomDoorClose() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Low stone slide rumble
    const slide = ctx.createOscillator();
    const slideGain = ctx.createGain();
    slide.type = 'sawtooth';
    slide.frequency.setValueAtTime(78, now);
    slide.frequency.linearRampToValueAtTime(52, now + 0.36);
    slideGain.gain.setValueAtTime(0.001, now);
    slideGain.gain.linearRampToValueAtTime(0.14, now + 0.05);
    slideGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    slide.connect(slideGain);
    slideGain.connect(ctx.destination);
    slide.start(now);
    slide.stop(now + 0.42);

    // Heavy central seal slam at 0.34s
    const slam = ctx.createOscillator();
    const slamGain = ctx.createGain();
    slam.type = 'triangle';
    const tSlam = now + 0.34;
    slam.frequency.setValueAtTime(110, tSlam);
    slam.frequency.exponentialRampToValueAtTime(28, tSlam + 0.22);
    slamGain.gain.setValueAtTime(0.24, tSlam);
    slamGain.gain.exponentialRampToValueAtTime(0.001, tSlam + 0.24);
    slam.connect(slamGain);
    slamGain.connect(ctx.destination);
    slam.start(tSlam);
    slam.stop(tSlam + 0.25);
  }

  /**
   * Heavy stone door parting open to reveal the next chamber (with ominous horn if entering Miniboss)
   */
  public playRoomDoorOpen(isMiniboss = false) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Unlatch metallic click + stone parting
    const unlatch = ctx.createOscillator();
    const unlatchGain = ctx.createGain();
    unlatch.type = 'triangle';
    unlatch.frequency.setValueAtTime(160, now);
    unlatch.frequency.exponentialRampToValueAtTime(92, now + 0.18);
    unlatchGain.gain.setValueAtTime(0.15, now);
    unlatchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    unlatch.connect(unlatchGain);
    unlatchGain.connect(ctx.destination);
    unlatch.start(now);
    unlatch.stop(now + 0.21);

    if (isMiniboss) {
      // Ominous low brass war-horn chord for Miniboss chamber reveal
      [110, 130.81, 164.81].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'sawtooth' : 'triangle';
        const t = now + 0.1 + idx * 0.04;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.68);
      });
    }
  }

  /**
   * Miniboss 50% HP Enrage roar / power surge
   */
  public playMinibossEnrage() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    [98, 146.83, 196].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + idx * 0.05;
      osc.frequency.setValueAtTime(freq * 0.85, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.15, t + 0.35);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.13, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.44);
    });
  }

  public playRuneCorrect(stepIndex = 0) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const scale = [329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
    const freq = scale[stepIndex % scale.length];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.06, now + 0.16);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  public playRuneWrong() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    [155.56, 110].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + idx * 0.06;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(62, t + 0.18);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.21);
    });
  }

  public playRouletteTick() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.028);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  public playRouletteResult(isPositive = true) {
    if (isPositive) {
      this.playPuzzleSuccess();
    } else {
      this.playDebuffGained();
    }
  }

  public playPuzzleSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [293.66, 369.99, 440.0, 587.33];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.065;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  public playPuzzleFailure() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [196, 155.56, 116.54].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + idx * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.82, t + 0.22);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  public playMechanismRotate() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(210, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.11);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playLockOpen() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [261.63, 392.0, 523.25].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.05;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  public playBuffGained() {
    this.playHealChime();
  }

  public playDebuffGained() {
    this.playRuneWrong();
  }
}

export const laCriptaAudio = new LaCriptaAudioEngine();
