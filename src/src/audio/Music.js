// Musik chiptune prosedural via WebAudio — tanpa file audio eksternal.
// Loop progresi Am–F–C–G: bass + pad + arpeggio + lead melodi + perkusi, plus delay/lowpass tipis buat kedalaman.
// Dua mood:
//   'prep'  = kalem (96 BPM, arpeggio jarang, lead lembut, shaker halus)
//   'fight' = tegang (132 BPM, arpeggio rapat + kick/hihat + lead square)
// Melodi lead berselang-seling urutan nada tiap loop (variant) biar gak monoton didengar lama.
// Juga menyediakan SFX kecil (place/upgrade/sell/send/wave/win/lose).

const CHORDS = [
  { tones: [220.00, 261.63, 329.63], bass: 110.00 }, // Am
  { tones: [174.61, 220.00, 261.63], bass: 87.31 },  // F
  { tones: [261.63, 329.63, 392.00], bass: 130.81 }, // C
  { tones: [196.00, 246.94, 293.66], bass: 98.00 }   // G
];
const STEPS_PER_CHORD = 16; // 8th notes, 2 bar per chord
const TOTAL_STEPS = CHORDS.length * STEPS_PER_CHORD;
const FILTER_FREQ = { prep: 2200, fight: 4200 };

class MusicManager {
  constructor() {
    this.ctx = null;
    this.scheduleTimer = null;
    this.mood = 'prep';
    this.muted = false;
    this.loopCount = 0;
    try { this.muted = localStorage.getItem('ltd_mute') === '1'; } catch (e) { /* abaikan */ }
    window.addEventListener('pagehide', () => this.stop());
  }

  // Panggil dari event input user (kebijakan autoplay browser). Aman dipanggil berulang.
  start() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();

      // bus melodi (pad/bass/arpeggio/lead) — lewat lowpass biar mood terasa (kalem vs terang)
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.15;
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = FILTER_FREQ[this.mood];
      this.filter.Q.value = 0.6;
      this.master.connect(this.filter);
      this.filter.connect(this.ctx.destination);

      // delay/echo tipis buat kedalaman ruang, feed dari master
      this.delay = this.ctx.createDelay(1.0);
      this.delay.delayTime.value = 0.27;
      this.delayFeedback = this.ctx.createGain();
      this.delayFeedback.gain.value = 0.22;
      this.delayWet = this.ctx.createGain();
      this.delayWet.gain.value = 0.15;
      this.master.connect(this.delay);
      this.delay.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delay);
      this.delay.connect(this.delayWet);
      this.delayWet.connect(this.filter);

      // bus perkusi — tanpa lowpass supaya hihat tetap kedengaran renyah
      this.percGain = this.ctx.createGain();
      this.percGain.gain.value = this.muted ? 0 : 0.15;
      this.percGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.muted ? 0 : 0.3;
      this.sfxGain.connect(this.ctx.destination);

      // buffer noise putih utk hihat/shaker
      const bufSize = Math.floor(this.ctx.sampleRate * 0.2);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;

      this.step = 0;
      this.nextTime = this.ctx.currentTime + 0.1;
    }
    if (!this.scheduleTimer) {
      this.scheduleTimer = setInterval(() => this._schedule(), 100);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  stop() {
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
      this.scheduleTimer = null;
    }
    if (this.ctx?.state === 'running') this.ctx.suspend();
  }

  toggleMute() {
    this.muted = !this.muted;
    try { localStorage.setItem('ltd_mute', this.muted ? '1' : '0'); } catch (e) { /* abaikan */ }
    if (this.ctx) {
      const t = this.ctx.currentTime;
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.15, t, 0.05);
      this.percGain.gain.setTargetAtTime(this.muted ? 0 : 0.15, t, 0.05);
      this.sfxGain.gain.setTargetAtTime(this.muted ? 0 : 0.3, t, 0.05);
    }
    return this.muted;
  }

  setMood(mood) {
    if (this.mood === mood) return;
    this.mood = mood;
    if (this.ctx && this.filter) {
      // ramp halus, bukan lompatan mendadak, biar transisi prep<->fight enak didengar
      this.filter.frequency.setTargetAtTime(FILTER_FREQ[mood], this.ctx.currentTime, 0.4);
    }
  }

  // ---------- internal ----------
  _note(freq, t, dur, type = 'triangle', vol = 0.3, dest, pan = 0) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    let out = g;
    if (pan) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = pan;
      g.connect(p);
      out = p;
    }
    out.connect(dest || this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  _kick(t, vol = 0.3) {
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g);
    g.connect(this.percGain);
    o.start(t);
    o.stop(t + 0.16);
  }

  _hihat(t, vol = 0.05) {
    if (!this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6500;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(hp);
    hp.connect(g);
    g.connect(this.percGain);
    src.start(t);
    src.stop(t + 0.06);
  }

  _schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    while (this.nextTime < this.ctx.currentTime + 0.35) {
      this._playStep(this.step, this.nextTime);
      const bpm = this.mood === 'fight' ? 132 : 96;
      this.nextTime += 60 / bpm / 2; // langkah = 8th note
      this.step += 1;
      if (this.step >= TOTAL_STEPS) {
        this.step = 0;
        this.loopCount += 1;
      }
    }
  }

  _playStep(s, t) {
    const chordIdx = Math.floor(s / STEPS_PER_CHORD);
    const chord = CHORDS[chordIdx];
    const next = CHORDS[(chordIdx + 1) % CHORDS.length];
    const local = s % STEPS_PER_CHORD;
    const fight = this.mood === 'fight';
    const variant = this.loopCount % 2; // urutan lead dibalik tiap loop biar gak monoton

    // pad lembut di awal tiap chord, disebar kiri-tengah-kanan
    if (local === 0) {
      const bpm = fight ? 132 : 96;
      const chordDur = (60 / bpm / 2) * STEPS_PER_CHORD;
      chord.tones.forEach((f, i) => this._note(f, t, chordDur * 0.95, 'sine', 0.045, undefined, (i - 1) * 0.25));
    }
    // bass tiap ketukan (quarter note)
    if (local % 4 === 0) this._note(chord.bass, t, 0.28, fight ? 'square' : 'sawtooth', fight ? 0.14 : 0.1);
    // nada penghubung ke root chord berikutnya, di ujung progresi tiap chord
    if (local === 14) this._note(next.bass * 2, t, 0.2, 'triangle', 0.06);

    // arpeggio: prep = jarang & lembut, fight = rapat + oktaf naik
    if (fight) {
      const seq = [0, 1, 2, 1];
      const tone = chord.tones[seq[local % 4]] * (local % 8 === 6 ? 2 : 1);
      this._note(tone, t, 0.14, 'square', 0.07);
    } else if (local % 2 === 0) {
      this._note(chord.tones[(local / 2) % 3], t, 0.3, 'triangle', 0.08);
    }

    // lead melodi: satu oktaf di atas, ritme lebih jarang dari arpeggio, panning gantian kiri/kanan
    const leadStep = fight ? 4 : 8;
    if (local % leadStep === leadStep / 2) {
      const order = variant === 0 ? [0, 1, 2] : [2, 1, 0];
      const idx = order[Math.floor(local / leadStep) % 3];
      const tone = chord.tones[idx] * 2;
      const pan = Math.floor(local / leadStep) % 2 === 0 ? -0.35 : 0.35;
      this._note(tone, t, fight ? 0.18 : 0.4, fight ? 'square' : 'sine', fight ? 0.06 : 0.08, undefined, pan);
    }

    // perkusi: fight = kick tiap 2 ketukan + hihat tiap 8th, prep = shaker halus sesekali
    if (fight) {
      if (local % 8 === 0) this._kick(t);
      if (local % 2 === 1) this._hihat(t, 0.05);
    } else if (local % 8 === 4) {
      this._hihat(t, 0.025);
    }
  }

  // ---------- SFX ----------
  _sfxSeq(freqs, gap, dur, type = 'triangle', vol = 0.25) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t0 = this.ctx.currentTime + 0.01;
    freqs.forEach((f, i) => this._note(f, t0 + i * gap, dur, type, vol, this.sfxGain));
  }

  sfxPlace()   { this._sfxSeq([523.25, 783.99], 0.06, 0.1, 'triangle', 0.3); }
  sfxUpgrade() { this._sfxSeq([523.25, 659.25, 880.00], 0.07, 0.12, 'triangle', 0.3); }
  sfxSell()    { this._sfxSeq([440.00, 293.66], 0.07, 0.12, 'triangle', 0.25); }
  sfxSend()    { this._sfxSeq([196.00, 155.56, 123.47], 0.05, 0.15, 'sawtooth', 0.2); }
  sfxWave()    { this._sfxSeq([329.63, 392.00], 0.1, 0.35, 'square', 0.12); }
  sfxWin()     { this._sfxSeq([523.25, 659.25, 783.99, 1046.50], 0.13, 0.4, 'triangle', 0.3); }
  sfxLose()    { this._sfxSeq([392.00, 349.23, 311.13, 261.63], 0.22, 0.5, 'sine', 0.3); }
}

// singleton — dipakai semua scene
export const music = new MusicManager();
