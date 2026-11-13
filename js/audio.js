/**
 * PrimDom Ambient 3D Sound Engine (Optional & Muted by default)
 * Creates a subtle, soothing nature breeze / harmonic ambient sound when explicitly turned on by visitor.
 */

export class AmbientAudio {
  constructor(toggleBtnId, dotId, labelId) {
    this.btn = document.getElementById(toggleBtnId);
    this.dot = document.getElementById(dotId);
    this.label = document.getElementById(labelId);
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.filter = null;
  }

  init() {
    if (!this.btn) return;

    this.btn.addEventListener('click', () => {
      this.toggle();
    });
  }

  toggle() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.0001;

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 450;

      // Soothing harmonic chords (nature ambient drone)
      const notes = [130.81, 164.81, 196.00, 261.63];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        g.gain.value = 0.025 / (1 + idx * 0.4);

        osc.connect(g);
        g.connect(this.filter);
        osc.start();
      });

      this.filter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = !this.isPlaying;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.isPlaying ? 0.35 : 0.0001, now, 0.3);

    if (this.dot) {
      this.dot.classList.toggle('active', this.isPlaying);
    }
    if (this.label) {
      this.label.textContent = this.isPlaying ? 'Звук природы: ВКЛ' : 'Звук природы: ВЫКЛ';
    }
    if (this.btn) {
      this.btn.classList.toggle('active', this.isPlaying);
    }
  }
}
