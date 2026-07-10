// Musik chiptune prosedural via WebAudio — tanpa file audio eksternal.
// Loop progresi Am–F–C–G: bass + arpeggio + pad. Dua mood:
//   'prep'  = kalem (96 BPM, arpeggio jarang)
//   'fight' = tegang (132 BPM, arpeggio rapat + tick perkusi)
// Juga menyediakan SFX kecil (place/upgrade/sell/send/wave/win/lose).

const CHORDS = [
  { tones: [220.00, 261.63, 329.63], bass: 110.00 }, // Am
  { tones: [174.61, 220.00, 261.63], bass: 87.31 },  // F
  { tones: [261.63, 329.63, 392.00], bass: 130.81 }, // C
  { tones: [196.00, 246.94, 293.66], bass: 98.00 }   // G
];
const STEPS_PER_CHORD = 16; // 8th notes, 2 bar per chord
const TOTAL_STEPS = CHORDS.length * STEPS_PER_CHORD;

class MusicManager {
  constructor() {
    this.ctx = null;
    this.mood = 'prep';
    this.muted = false;
    try { this.muted = localStorage.getItem('ltd_mute') === '1'; } catch (e) { /* abaikan */ }
  }

  // Panggil dari event input user (kebijakan autoplay browser). Aman dipanggil berulang.
  start() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.15;
      this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.muted ? 0 : 0.3;
      this.sfxGain.connect(this.ctx.destination);
      this.step = 0;
      this.nextTime = this.ctx.currentTime + 0.1;
      setInterval(() => this._schedule(), 100);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    try { localStorage.setItem('ltd_mute', this.muted ? '1' : '0'); } catch (e) { /* abaikan */ }
    if (this.ctx) {
      const t = this.ctx.currentTime;
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.15, t, 0.05);
      this.sfxGain.gain.setTargetAtTime(this.muted ? 0 : 0.3, t, 0.05);
    }
    return this.muted;
  }

  setMood(mood) { this.mood = mood; }

  // ---------- internal ----------
  _note(freq, t, dur, type = 'triangle', vol = 0.3, dest) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(dest || this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  _schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    while (this.nextTime < this.ctx.currentTime + 0.35) {
      this._playStep(this.step, this.nextTime);
      const bpm = this.mood === 'fight' ? 132 : 96;
      this.nextTime += 60 / bpm / 2; // langkah = 8th note
      this.step = (this.step + 1) % TOTAL_STEPS;
    }
  }

  _playStep(s, t) {
    const chord = CHORDS[Math.floor(s / STEPS_PER_CHORD)];
    const local = s % STEPS_PER_CHORD;
    const fight = this.mood === 'fight';

    // pad lembut di awal tiap chord
    if (local === 0) {
      const bpm = fight ? 132 : 96;
      const chordDur = (60 / bpm / 2) * STEPS_PER_CHORD;
      for (const f of chord.tones) this._note(f, t, chordDur * 0.95, 'sine', 0.05);
    }
    // bass tiap ketukan (quarter note)
    if (local % 4 === 0) this._note(chord.bass, t, 0.28, fight ? 'square' : 'sawtooth', fight ? 0.14 : 0.1);
    // arpeggio: prep = jarang & lembut, fight = rapat + oktaf naik
    if (fight) {
      const seq = [0, 1, 2, 1];
      const tone = chord.tones[seq[local % 4]] * (local % 8 === 6 ? 2 : 1);
      this._note(tone, t, 0.14, 'square', 0.07);
      if (local % 2 === 1) this._note(3600, t, 0.03, 'square', 0.02); // tick perkusi halus
    } else if (local % 2 === 0) {
      this._note(chord.tones[(local / 2) % 3], t, 0.3, 'triangle', 0.08);
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
