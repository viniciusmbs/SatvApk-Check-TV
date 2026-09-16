/**
 * Audio feedback service for SATV IPTV.
 * Two distinct dedicated sound channels:
 * 1. Cursor movement / scrolling / browsing: 'clicksan.mp3'
 * 2. OK / Enter / Channel selection / Action click: 'BotaoRadio.mp3'
 */

class SoundService {
  private static instance: SoundService;
  private audioCtx: AudioContext | null = null;
  private navBuffer: AudioBuffer | null = null; // clicksan.mp3 (cursor andar/descer)
  private selectBuffer: AudioBuffer | null = null; // BotaoRadio.mp3 (clicar no meio / OK / entrar no canal)
  private isNavLoading = false;
  private isSelectLoading = false;
  private lastScrollPlayTime = 0;
  private lastNavPlayTime = 0;
  private isMuted = false;
  private fallbackAudios: Record<string, HTMLAudioElement> = {};

  private constructor() {
    this.initAudio();
  }

  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  private async initAudio() {
    if (typeof window === 'undefined') return;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    // Load both sounds in background
    this.loadNavAudio();
    this.loadSelectAudio();

    // Auto-unlock AudioContext on first user interaction
    const unlock = () => {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('click', unlock, { passive: true, once: true });
    window.addEventListener('keydown', unlock, { passive: true, once: true });
    window.addEventListener('touchstart', unlock, { passive: true, once: true });
  }

  private getAudioContext(): AudioContext | null {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * 1. Loads clicksan.mp3 for cursor movement and scrolling
   */
  private async loadNavAudio() {
    if (this.isNavLoading || this.navBuffer) return;
    this.isNavLoading = true;

    try {
      const ctx = this.getAudioContext();
      const urls = [
        '/clicksan.mp3',
        'https://raw.githubusercontent.com/viniciusmbs/SatvApk/main/src/clicksan.mp3',
      ];

      let audioData: ArrayBuffer | null = null;
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            audioData = await res.arrayBuffer();
            break;
          }
        } catch {
          // try next
        }
      }

      if (audioData && ctx) {
        this.navBuffer = await ctx.decodeAudioData(audioData);
      }
    } catch (err) {
      console.warn('SoundService: unable to decode clicksan.mp3', err);
    } finally {
      this.isNavLoading = false;
    }
  }

  /**
   * 2. Loads BotaoRadio.mp3 for OK / Enter / Click on channel / button confirmation
   */
  private async loadSelectAudio() {
    if (this.isSelectLoading || this.selectBuffer) return;
    this.isSelectLoading = true;

    try {
      const ctx = this.getAudioContext();
      const urls = [
        '/BotaoRadio.mp3',
        'https://raw.githubusercontent.com/viniciusmbs/SatvApk/main/src/BotaoRadio.mp3',
      ];

      let audioData: ArrayBuffer | null = null;
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            audioData = await res.arrayBuffer();
            break;
          }
        } catch {
          // try next
        }
      }

      if (audioData && ctx) {
        this.selectBuffer = await ctx.decodeAudioData(audioData);
      }
    } catch (err) {
      console.warn('SoundService: unable to decode BotaoRadio.mp3', err);
    } finally {
      this.isSelectLoading = false;
    }
  }

  /**
   * SOM 1: Som ao navegar com o cursor / D-Pad (clicksan.mp3)
   */
  public playNav(volume = 0.5) {
    if (this.isMuted) return;
    const now = performance.now();
    if (now - this.lastNavPlayTime < 40) return;
    this.lastNavPlayTime = now;

    this.playBuffer(this.navBuffer, volume, 800, 140, '/clicksan.mp3');
  }

  /**
   * SOM 1 (Scroll): Som ao descer/subir a tela (clicksan.mp3)
   */
  public playScroll(volume = 0.4) {
    if (this.isMuted) return;
    const now = performance.now();
    if (now - this.lastScrollPlayTime < 80) return;
    this.lastScrollPlayTime = now;

    this.playBuffer(this.navBuffer, volume, 800, 140, '/clicksan.mp3');
  }

  /**
   * SOM 2: Som ao clicar no canal, dar OK no meio do controle (BotaoRadio.mp3)
   */
  public playSelect(volume = 0.65) {
    if (this.isMuted) return;
    this.playBuffer(this.selectBuffer, volume, 520, 220, '/BotaoRadio.mp3');
  }

  /**
   * Alias para playSelect (clique / confirmação com BotaoRadio.mp3)
   */
  public playClick(volume = 0.65) {
    this.playSelect(volume);
  }

  /**
   * Universal buffer player with synthetic audio fallback
   */
  private playBuffer(
    buffer: AudioBuffer | null,
    volume: number,
    synthFreqStart: number,
    synthFreqEnd: number,
    audioFallbackPath?: string
  ) {
    try {
      const ctx = this.getAudioContext();

      if (ctx && buffer) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
        return;
      }

      // If Web Audio buffer is not yet decoded, use cached Audio fallback directly
      if (audioFallbackPath && typeof Audio !== 'undefined') {
        try {
          if (!this.fallbackAudios[audioFallbackPath]) {
            this.fallbackAudios[audioFallbackPath] = new Audio(audioFallbackPath);
          }
          const snd = this.fallbackAudios[audioFallbackPath];
          snd.volume = volume;
          snd.currentTime = 0;
          snd.play().catch(() => {});
          return;
        } catch {
          // fallback to synth
        }
      }

      if (!ctx) return;

      // Synth fallback if audio file still downloading
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(synthFreqStart, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(synthFreqEnd, ctx.currentTime + 0.02);

      gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.02);
    } catch {
      // ignore
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const soundService = SoundService.getInstance();