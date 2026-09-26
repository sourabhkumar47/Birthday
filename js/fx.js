/* Shared effects: audio, ambient hearts, tap bursts, toast, confetti, fireworks */
(function () {
  const CFG = window.BIRTHDAY;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const PINKS = ["#ff8fb8", "#ff5c97", "#ffb3d1", "#c9b6ff", "#ffc6a8", "#ffd27a", "#e8a6ff"];

  /* ---------------- audio ---------------- */
  const BASE_VOL = 0.55;
  const Audio_ = {
    music: null,
    ctx: null,
    on: true,
    tracks: {},
    track(src) {
      if (this.tracks[src]) return this.tracks[src];
      const a = new Audio(src);
      a.loop = true;
      a.preload = "auto";
      a.addEventListener("error", () => {
        a.failed = true;
        if (src === CFG.music) FX.toast("🎵 Add your song at " + src);
        else if (this.music === a) this.play(CFG.music); // optional song missing → back to main
      });
      return (this.tracks[src] = a);
    },
    init() {
      this.music = this.track(CFG.music);
      this.music.volume = BASE_VOL;
      if (CFG.memoriesMusic) this.track(CFG.memoriesMusic).preload = "metadata"; // just check it exists; stream it later
      this.popEl = new Audio("assets/sfx/pop.mp3");
      this.popEl.volume = 0.35;
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    },
    start() {
      if (!this.music) this.init();
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
      this.music.play().catch(() => {});
    },
    // cross-fade to another song (the main song resumes where it left off)
    play(src) {
      if (!this.music) this.init();
      src = src || CFG.music;
      const next = this.track(src);
      if (next.failed) return src !== CFG.music && this.play(CFG.music);
      const prev = this.music;
      if (next === prev) return;
      this.music = next;
      gsap.killTweensOf(prev);
      gsap.to(prev, { volume: 0, duration: 0.8, onComplete: () => prev.pause() });
      if (src !== CFG.music) next.currentTime = 0;
      gsap.killTweensOf(next);
      next.volume = 0;
      if (this.on) {
        next.play().catch(() => {});
        gsap.to(next, { volume: BASE_VOL, duration: 1.2 });
      }
    },
    toggle() {
      this.on = !this.on;
      if (this.on) { this.music.volume = this.songActive ? 0 : BASE_VOL; this.music.play().catch(() => {}); }
      else this.music.pause();
      if (this.songMaster) this.songMaster.gain.value = this.on ? 0.5 : 0;
      if (this.songEl) this.songEl.volume = this.on ? 1 : 0;
      return this.on;
    },
    // fade the current background song down (during the birthday song) and back up
    hush(on) {
      if (!this.music) return;
      this.songActive = on;
      gsap.killTweensOf(this.music);
      gsap.to(this.music, { volume: on ? 0 : BASE_VOL, duration: on ? 0.8 : 1.5 });
    },
    /* Happy Birthday on a music box + soft piano waltz, generated live.
       onWord(line, word) fires as each word is "sung", so lyrics can light up in time. */
    birthdaySong({ onWord, onEnd } = {}) {
      const c = this.ctx;
      if (!c) { onEnd && onEnd(); return () => {}; }
      if (c.state === "suspended") c.resume();
      const F = { F2: 87.31, G2: 98, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196, A3: 220, B3: 246.94, C4: 261.63,
                  G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, C6: 1046.5 };
      const master = c.createGain();
      master.gain.value = this.on ? 0.5 : 0;
      const echo = c.createDelay(); echo.delayTime.value = 0.27;
      const fb = c.createGain(); fb.gain.value = 0.22;
      master.connect(c.destination);
      master.connect(echo); echo.connect(fb); fb.connect(echo); echo.connect(c.destination);
      this.songMaster = master;
      const note = (f, t, len, vol, bright = 1) => {
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.7, len * 1.5));
        g.connect(master);
        [[1, 1], [2, 0.28 * bright], [3, 0.1 * bright], [4.2, 0.05 * bright]].forEach(([m, a]) => {
          const o = c.createOscillator(), og = c.createGain();
          o.type = "sine";
          o.frequency.value = f * m;
          og.gain.value = a;
          o.connect(og).connect(g);
          o.start(t);
          o.stop(t + Math.max(0.8, len * 1.6));
        });
      };
      const beat = 60 / 100;
      // [note, beats, line, word]  ("Hap-py birth-day to you", line 3 = "…dear <name>")
      const MEL = [
        ["G4", .75, 0, 0], ["G4", .25, 0, 0], ["A4", 1, 0, 1], ["G4", 1, 0, 1], ["C5", 1, 0, 2], ["B4", 2, 0, 3],
        ["G4", .75, 1, 0], ["G4", .25, 1, 0], ["A4", 1, 1, 1], ["G4", 1, 1, 1], ["D5", 1, 1, 2], ["C5", 2, 1, 3],
        ["G4", .75, 2, 0], ["G4", .25, 2, 0], ["G5", 1, 2, 1], ["E5", 1, 2, 1], ["C5", 1, 2, 2], ["B4", 1, 2, 3], ["A4", 2, 2, 3],
        ["F5", .75, 3, 0], ["F5", .25, 3, 0], ["E5", 1, 3, 1], ["C5", 1, 3, 1], ["D5", 1, 3, 2], ["C5", 3, 3, 3],
      ];
      // waltz accompaniment: one chord per 3-beat bar after the 1-beat pickup
      const BARS = [["C3", "E3", "G3"], ["G2", "D3", "F3"], ["G2", "D3", "F3"], ["C3", "E3", "G3"], ["C3", "E3", "G3"], ["F2", "A3", "C4"], ["G2", "D3", "F3"], ["C3", "E3", "G3"]];
      const t0 = c.currentTime + 0.3, timers = [];
      let t = t0, last = "";
      MEL.forEach(([n, b, line, word]) => {
        note(F[n], t, b * beat, 0.22);
        const key = line + ":" + word;
        if (key !== last && onWord) timers.push(setTimeout(() => onWord(line, word), (t - c.currentTime) * 1000));
        last = key;
        t += b * beat;
      });
      BARS.forEach(([bass, c1, c2], i) => {
        const bt = t0 + beat * (1 + i * 3);
        note(F[bass], bt, beat * 2, 0.16, 0.4);
        note(F[c1], bt + beat, beat, 0.06, 0.3); note(F[c2], bt + beat, beat, 0.06, 0.3);
        note(F[c1], bt + beat * 2, beat, 0.06, 0.3); note(F[c2], bt + beat * 2, beat, 0.06, 0.3);
      });
      // sparkly finish
      ["C5", "E5", "G5", "C6"].forEach((n, i) => note(F[n], t + 0.1 + i * 0.09, 0.8, 0.1));
      timers.push(setTimeout(() => { onEnd && onEnd(); }, (t - c.currentTime + 1.6) * 1000));
      return () => {
        timers.forEach(clearTimeout);
        master.gain.setTargetAtTime(0, c.currentTime, 0.1);
        setTimeout(() => { master.disconnect(); echo.disconnect(); }, 600);
        if (this.songMaster === master) this.songMaster = null;
      };
    },
    duck(v = 0.2, ms = 1200) {
      if (!this.music) return;
      gsap.to(this.music, { volume: v, duration: 0.3 });
      gsap.to(this.music, { volume: BASE_VOL, duration: 1, delay: ms / 1000 });
    },
    tone(type, f0, f1, dur, vol, delay = 0) {
      const c = this.ctx;
      if (!c) return;
      const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.7);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    // jar sounds
    lidPop() { this.tone("sine", 220, 1100, 0.14, 0.25); this.chime([1568, 2093]); },
    lidClose() { this.tone("sine", 320, 110, 0.18, 0.25); },
    rattle() {
      for (let i = 0; i < 10; i++) this.tone("triangle", rand(1500, 3400), rand(1500, 3400), 0.12, 0.08, i * 0.05 + Math.random() * 0.03);
      this.tone("sine", 150, 60, 0.25, 0.18);
    },
    pop() {
      if (!this.popEl) return;
      const s = this.popEl.cloneNode();
      s.volume = 0.3;
      s.play().catch(() => {});
    },
    // soft synthesized sparkle "ding"
    chime(notes = [880, 1109, 1319, 1760]) {
      const c = this.ctx;
      if (!c) return;
      notes.forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = "sine";
        o.frequency.value = f;
        const t = c.currentTime + i * 0.07;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.12, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        o.connect(g).connect(c.destination);
        o.start(t);
        o.stop(t + 1);
      });
    },
    whoosh() {
      const c = this.ctx;
      if (!c) return;
      const len = c.sampleRate * 0.6, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = buf; f.type = "bandpass"; f.frequency.value = 900; g.gain.value = 0.18;
      src.connect(f).connect(g).connect(c.destination);
      src.start();
    },
  };

  /* ---------------- ambient floating hearts ---------------- */
  const amb = document.getElementById("ambient");
  const actx = amb.getContext("2d");
  let W = 0, H = 0, DPR = Math.min(devicePixelRatio || 1, 2);
  const floaters = [], sparks = [];
  let ambientLevel = 1;

  function resize() {
    W = innerWidth; H = innerHeight;
    amb.width = W * DPR; amb.height = H * DPR;
    actx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  addEventListener("resize", resize);
  resize();

  function heartPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
    ctx.closePath();
  }

  const count = Math.min(34, Math.round((innerWidth * innerHeight) / 32000) + 10);
  for (let i = 0; i < count; i++) floaters.push(newFloater(true));
  function newFloater(anywhere) {
    return {
      x: rand(0, W), y: anywhere ? rand(0, H) : H + 30,
      s: rand(8, 22), vy: rand(0.25, 0.8), sway: rand(0.5, 1.5), ph: rand(0, 6.28),
      c: pick(PINKS), a: rand(0.25, 0.6), star: Math.random() < 0.3,
    };
  }

  function burst(x, y, n = 12, emojiMode = false) {
    for (let i = 0; i < n; i++) {
      const ang = rand(0, Math.PI * 2), sp = rand(2, 6);
      sparks.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 2, s: rand(6, 14), c: pick(PINKS), life: 1, star: Math.random() < 0.4 });
    }
  }

  function drawStar(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 ? r * 0.35 : r, a = (i * Math.PI) / 4;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  let t = 0;
  function tick() {
    t += 0.016;
    actx.clearRect(0, 0, W, H);
    for (const f of floaters) {
      f.y -= f.vy;
      const x = f.x + Math.sin(t * f.sway + f.ph) * 14;
      if (f.y < -40) Object.assign(f, newFloater(false));
      actx.globalAlpha = f.a * ambientLevel;
      actx.fillStyle = f.c;
      if (f.star) { drawStar(actx, x, f.y, f.s * 0.45 * (0.8 + 0.2 * Math.sin(t * 3 + f.ph))); }
      else heartPath(actx, x, f.y, f.s);
      actx.fill();
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.vx *= 0.98; p.life -= 0.02;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      actx.globalAlpha = p.life;
      actx.fillStyle = p.c;
      p.star ? drawStar(actx, p.x, p.y, p.s * 0.5) : heartPath(actx, p.x, p.y, p.s);
      actx.fill();
    }
    actx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }
  tick();

  // tap anywhere → little heart burst; double tap → kisses
  let lastTap = 0;
  addEventListener("pointerdown", (e) => {
    burst(e.clientX, e.clientY, 8);
    const now = Date.now();
    if (now - lastTap < 300) floatEmoji(e.clientX, e.clientY, ["💋", "😘", "💕"], 6);
    lastTap = now;
  });

  function floatEmoji(x, y, list, n = 5) {
    for (let i = 0; i < n; i++) {
      const el = document.createElement("div");
      el.className = "float-emoji";
      el.textContent = pick(list);
      el.style.left = x - 13 + "px";
      el.style.top = y - 13 + "px";
      document.body.appendChild(el);
      gsap.to(el, {
        x: rand(-90, 90), y: rand(-200, -120), rotation: rand(-40, 40), opacity: 0, scale: rand(0.8, 1.6),
        duration: rand(1.2, 2), ease: "power1.out", onComplete: () => el.remove(),
      });
    }
  }

  /* ---------------- toast ---------------- */
  let toastTimer;
  function toast(msg, ms = 3200) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), ms);
  }

  /* ---------------- confetti helpers ---------------- */
  const heartShape = window.confetti && confetti.shapeFromPath
    ? confetti.shapeFromPath({ path: "M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z" })
    : null;
  const confettiColors = ["#ff5c97", "#ff8fb8", "#ffd27a", "#c9b6ff", "#ffffff", "#ffb3d1"];
  function celebrate(big = false) {
    if (!window.confetti) return;
    const base = { colors: confettiColors, zIndex: 85, disableForReducedMotion: true };
    confetti({ ...base, particleCount: big ? 160 : 90, spread: 100, origin: { y: 0.6 }, scalar: 1.1 });
    if (heartShape) confetti({ ...base, particleCount: big ? 40 : 20, spread: 120, origin: { y: 0.55 }, shapes: [heartShape], scalar: 2 });
    if (big) {
      setTimeout(() => confetti({ ...base, particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.7 } }), 250);
      setTimeout(() => confetti({ ...base, particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.7 } }), 400);
    }
  }
  // gold sparkles drifting down from the top of the screen
  let sparkleEnd = 0;
  function sparkleRain(ms = 2500) {
    if (!window.confetti) return;
    const running = Date.now() < sparkleEnd;
    sparkleEnd = Math.max(sparkleEnd, Date.now() + ms);
    if (running) return; // already falling: just keep it going longer
    (function frame() {
      confetti({ particleCount: 2, startVelocity: 0, ticks: 280, gravity: 0.45, drift: rand(-0.4, 0.4), origin: { x: Math.random(), y: -0.05 }, shapes: ["star"], colors: ["#ffd27a", "#fff3b0", "#ffffff", "#ffc2e0"], scalar: rand(0.7, 1.3), zIndex: 90 });
      if (Date.now() < sparkleEnd) requestAnimationFrame(frame);
    })();
  }
  // confetti cannons firing from every edge towards the middle
  function birthdayBurst() {
    if (!window.confetti) return;
    const spots = [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 1], [0, 0.5], [1, 0.5], [0.5, 0]];
    spots.forEach(([x, y], i) => setTimeout(() => {
      const angle = (Math.atan2(y - 0.5, 0.5 - x) * 180) / Math.PI;
      confetti({ particleCount: 45, spread: 70, startVelocity: 55, angle, origin: { x, y }, colors: confettiColors, zIndex: 90 });
    }, i * 60));
    confetti({ particleCount: 60, spread: 360, startVelocity: 30, origin: { x: 0.5, y: 0.5 }, shapes: ["star"], colors: ["#ffd27a", "#fff3b0", "#ffffff"], scalar: 1.3, zIndex: 90 });
    if (heartShape) confetti({ particleCount: 25, spread: 360, startVelocity: 25, origin: { x: 0.5, y: 0.5 }, shapes: [heartShape], colors: confettiColors, scalar: 2, zIndex: 90 });
  }
  function heartRain(ms = 2500) {
    if (!window.confetti || !heartShape) return;
    const end = Date.now() + ms;
    (function frame() {
      confetti({ particleCount: 3, startVelocity: 0, ticks: 300, gravity: 0.6, origin: { x: Math.random(), y: -0.1 }, shapes: [heartShape], colors: confettiColors, scalar: 2, zIndex: 85 });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  /* ---------------- fireworks (finale) ---------------- */
  const Fireworks = {
    running: false,
    start(canvas) {
      this.cv = canvas;
      this.ctx = canvas.getContext("2d");
      this.parts = [];
      this.rockets = [];
      this.running = true;
      this.fit();
      this._fit = () => this.fit();
      addEventListener("resize", this._fit);
      this.cv.onpointerdown = (e) => this.explode(e.clientX, e.clientY, Math.random() < 0.5);
      this.timer = setInterval(() => this.launch(), 700);
      this.loop();
    },
    stop() {
      this.running = false;
      clearInterval(this.timer);
      removeEventListener("resize", this._fit);
    },
    fit() {
      const r = this.cv.getBoundingClientRect();
      this.w = r.width; this.h = r.height;
      this.cv.width = this.w * DPR; this.cv.height = this.h * DPR;
      this.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    },
    launch() {
      const x = rand(this.w * 0.15, this.w * 0.85);
      this.rockets.push({ x, y: this.h, vx: rand(-1, 1), vy: -rand(this.h / 70, this.h / 55), ty: rand(this.h * 0.12, this.h * 0.45), c: pick(PINKS) });
    },
    explode(x, y, heart) {
      const c = pick(PINKS), c2 = pick(PINKS);
      const n = heart ? 70 : 60;
      for (let i = 0; i < n; i++) {
        let vx, vy;
        if (heart) {
          const tt = (i / n) * Math.PI * 2;
          vx = 16 * Math.pow(Math.sin(tt), 3);
          vy = -(13 * Math.cos(tt) - 5 * Math.cos(2 * tt) - 2 * Math.cos(3 * tt) - Math.cos(4 * tt));
          vx *= 0.28; vy *= 0.28;
        } else {
          const a = rand(0, Math.PI * 2), s = rand(1, 5.5);
          vx = Math.cos(a) * s; vy = Math.sin(a) * s;
        }
        this.parts.push({ x, y, vx, vy, life: 1, c: i % 3 ? c : c2, r: rand(1.4, 2.6) });
      }
    },
    loop() {
      if (!this.running) return;
      const { ctx } = this;
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.globalCompositeOperation = "lighter";
      for (let i = this.rockets.length - 1; i >= 0; i--) {
        const r = this.rockets[i];
        r.x += r.vx; r.y += r.vy; r.vy *= 0.985;
        ctx.fillStyle = "#fff3d6";
        ctx.beginPath(); ctx.arc(r.x, r.y, 2, 0, 7); ctx.fill();
        if (r.y <= r.ty || r.vy > -1) { this.explode(r.x, r.y, Math.random() < 0.45); this.rockets.splice(i, 1); }
      }
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.045; p.vx *= 0.985; p.vy *= 0.985; p.life -= 0.011;
        if (p.life <= 0) { this.parts.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      requestAnimationFrame(() => this.loop());
    },
  };

  window.FX = {
    rand, pick, PINKS,
    audio: Audio_,
    burst, floatEmoji, toast, celebrate, heartRain, sparkleRain, birthdayBurst, Fireworks,
    setAmbient(v) { gsap.to({ v: ambientLevel }, { v, duration: 1, onUpdate() { ambientLevel = this.targets()[0].v; } }); },
  };
})();
