/* Play sounds/name.wav. Volume is 0 to 1 and applies to every sound. */
window.Idle = window.Idle || {};
Idle.systems = Idle.systems || {};

Idle.systems.sound = {
  volume: Number(localStorage.getItem("idle-volume") || 0.7),
  active: [],

  play(name, loop) {
    const audio = new Audio(`sounds/${name}.wav`);
    audio.loop = Boolean(loop);
    audio.volume = this.volume;
    this.active.push(audio);
    audio.addEventListener("ended", () => {
      this.active = this.active.filter((item) => item !== audio);
    });
    audio.play().catch(() => {});
    return audio;
  },

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, Number(value) || 0));
    localStorage.setItem("idle-volume", String(this.volume));
    this.active.forEach((audio) => { audio.volume = this.volume; });
  },
};
