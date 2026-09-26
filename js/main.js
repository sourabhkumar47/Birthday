/* Chapter flow + interactions */
(function () {
  const CFG = window.BIRTHDAY;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const { rand, pick } = FX;

  document.querySelectorAll("[data-name]").forEach((el) => (el.textContent = CFG.name));
  // shrink the big name titles if a long name would run off the screen
  function fitNames() {
    document.querySelectorAll("[data-name]").forEach((el) => {
      el.style.fontSize = "";
      const cs = getComputedStyle(el);
      const probe = document.createElement("span");
      probe.style.cssText = `position:absolute;left:-9999px;top:0;white-space:nowrap;font-family:${cs.fontFamily};font-size:${cs.fontSize};font-weight:${cs.fontWeight};font-style:${cs.fontStyle};letter-spacing:${cs.letterSpacing}`;
      probe.textContent = el.textContent;
      document.body.appendChild(probe);
      const w = probe.getBoundingClientRect().width, max = Math.min(innerWidth - 40, 1000);
      if (w > max) el.style.fontSize = (parseFloat(cs.fontSize) * max) / w + "px";
      probe.remove();
    });
  }
  fitNames();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNames);
  addEventListener("resize", fitNames);
  document.title = `Happy Birthday ${CFG.name} 💖`;

  /* ---------------- chapter manager ---------------- */
  const chapters = $$(".chapter");
  const ids = chapters.map((c) => c.dataset.ch);
  const icons = { intro: "🎉", play: "🎈", memories: "📸", reasons: "🫙", cake: "🎂", wishes: "🏮", letter: "💌", finale: "💖" };
  let current = 0, busy = false;
  const visited = new Set([0]);

  const nav = $("#progress");
  ids.forEach((id, i) => {
    if (i === 0) return;
    const b = document.createElement("button");
    b.textContent = icons[id];
    b.title = id;
    b.onclick = () => visited.has(i) && i !== current && goTo(i);
    nav.appendChild(b);
  });
  function paintNav() {
    Array.from(nav.children).forEach((b, k) => {
      const i = k + 1;
      b.classList.toggle("visited", visited.has(i));
      b.classList.toggle("current", i === current);
      b.disabled = !visited.has(i);
    });
    nav.classList.toggle("show", current > 0);
  }

  const enter = {}, leave = {};

  function goTo(i) {
    if (busy || i === current || i < 0 || i >= chapters.length) return;
    busy = true;
    FX.audio.whoosh();
    const wipe = $("#heartWipe");
    const cover = Math.max(innerWidth, innerHeight) / 18;
    gsap.set(wipe, { scale: 0, opacity: 1 });
    gsap.to(wipe, {
      scale: cover, duration: 0.7, ease: "power2.in",
      onComplete() {
        const from = ids[current];
        leave[from] && leave[from]();
        chapters[current].classList.remove("active");
        current = i;
        visited.add(i);
        chapters[i].classList.add("active");
        paintNav();
        enter[ids[i]] && enter[ids[i]]();
        gsap.to(wipe, { opacity: 0, duration: 0.6, delay: 0.1, onComplete() { gsap.set(wipe, { scale: 0 }); busy = false; } });
      },
    });
  }
  const next = () => goTo(current + 1);
  $$("[data-next]").forEach((b) => b.addEventListener("click", next));

  /* ---------------- photo gallery ---------------- */
  // Finds each gallery photo (tries .jpg/.jpeg/.png/.webp when no extension is given)
  const EXTS = [".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP"];
  const loadImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(src); i.onerror = () => res(null); i.src = src; });
  async function resolvePhoto(p, verify = true) {
    if (!p) return null;
    // gallery files are listed exactly, so skip the check and let each photo load only when shown
    if (/\.[a-z0-9]{3,4}$/i.test(p)) return verify ? loadImg(p) : p;
    for (const e of EXTS) { const ok = await loadImg(p + e); if (ok) return ok; }
    return null;
  }
  let pool = [];
  const poolReady = Promise.all((CFG.gallery || []).map((p) => resolvePhoto(p, false))).then((list) => (pool = list.filter(Boolean)));
  const recent = [];
  function randomPhoto(avoid = []) {
    if (!pool.length) return null;
    let choices = pool.filter((p) => !avoid.includes(p) && !recent.includes(p));
    if (!choices.length) choices = pool.filter((p) => !avoid.includes(p));
    if (!choices.length) choices = pool;
    const p = pick(choices);
    recent.push(p);
    if (recent.length > Math.min(8, Math.floor(pool.length / 2))) recent.shift();
    return p;
  }

  // ---- fast photo loading: small thumbnails everywhere, full size only in the big viewer ----
  const thumb = (src) => (src && src.includes("/gallery/") ? src.replace("/gallery/", "/thumbs/") : src);
  const imgCache = new Map(), readySet = new Set(), keepAlive = [];
  function preload(src) {
    if (!src) return Promise.resolve(false);
    if (!imgCache.has(src)) {
      imgCache.set(src, new Promise((res) => {
        const im = new Image();
        im.decoding = "async";
        im.onload = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(() => { readySet.add(src); res(true); });
        im.onerror = () => res(false);
        im.src = src;
        keepAlive.push(im); // keep decoded images in memory so they show instantly
      }));
    }
    return imgCache.get(src);
  }
  // quietly download all thumbnails in the background (4 at a time), memory photos first
  let warmed = false;
  function warmPhotos() {
    if (warmed) return;
    warmed = true;
    poolReady.then(() => {
      const queue = [...new Set([...CFG.memories.map((m) => thumb(m.photo)), ...pool.map(thumb)])];
      let i = 0;
      const nextOne = () => { if (i < queue.length) preload(queue[i++]).then(nextOne); };
      for (let k = 0; k < 4; k++) nextOne();
    });
  }
  // prefer photos that are already downloaded, so nothing flips to an empty frame
  function randomReadyPhoto(avoid = []) {
    const ready = pool.filter((p) => readySet.has(thumb(p)) && !avoid.includes(p) && !recent.includes(p));
    if (!ready.length) return randomPhoto(avoid);
    const p = pick(ready);
    recent.push(p);
    if (recent.length > Math.min(8, Math.floor(pool.length / 2))) recent.shift();
    return p;
  }

  /* ---------------- modal ---------------- */
  let modalCb = null;
  const popIn = (el) => gsap.fromTo(el, { scale: 0.4, rotation: -8, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.7, ease: "elastic.out(1,0.6)" });
  function showModal({ tag = "", emoji = "", text = "", btn = "aww 🥹", onClose = null, photo = null, theme = null, anim = popIn, highlight = false }) {
    const card = $("#modalCard");
    card.className = "modal-card" + (theme !== null ? ` theme-${theme}` : "") + (photo ? " has-photo" : "");
    $("#modalTag").textContent = tag;
    $("#modalEmoji").textContent = emoji;
    const t = $("#modalText");
    t.textContent = "";
    if (highlight) { const m = document.createElement("mark"); m.textContent = text; t.appendChild(m); }
    else t.textContent = text;
    t.classList.toggle("long", text.length > 170);
    $("#modalBtn").textContent = btn;
    $("#modalPhoto").hidden = !photo;
    if (photo) $("#modalImg").src = thumb(photo);
    modalCb = onClose;
    $("#modal").hidden = false;
    $("#modal").scrollTop = 0;
    gsap.killTweensOf(card);
    gsap.set(card, { clearProps: "all" });
    anim(card);
    FX.audio.chime();
  }
  function closeModal() {
    gsap.to("#modalCard", { scale: 0.6, opacity: 0, duration: 0.25, onComplete() {
      $("#modal").hidden = true;
      const cb = modalCb; modalCb = null;
      cb && cb();
    } });
  }
  $("#modalBtn").onclick = closeModal;
  $("#modal").addEventListener("click", (e) => e.target.id === "modal" && closeModal());
  $("#modalImg").onerror = () => ($("#modalPhoto").hidden = true);

  /* ---------------- music button ---------------- */
  const musicBtn = $("#musicBtn");
  musicBtn.onclick = (e) => { e.stopPropagation(); musicBtn.classList.toggle("off", !FX.audio.toggle()); };

  /* ================= 0 · GATE ================= */
  gsap.from(".gate-inner > *", { y: 40, opacity: 0, stagger: 0.15, duration: 1, ease: "back.out(1.7)" });
  gsap.from("#ch-gate .hint", { opacity: 0, duration: 1, delay: 1 });
  $("#startBtn").onclick = (e) => {
    FX.audio.start();
    warmPhotos();
    musicBtn.hidden = false;
    const r = e.currentTarget.getBoundingClientRect();
    FX.floatEmoji(r.left + r.width / 2, r.top + r.height / 2, ["💖", "💗", "💕", "✨"], 14);
    // stop the CSS heartbeat so the burst animation can take over
    $$("#startBtn, .heart-glow, .heart-ripple, .orbit").forEach((el) => (el.style.animation = "none"));
    gsap.to("#startBtn", { scale: 1.6, opacity: 0, duration: 0.5, ease: "back.in(2)" });
    gsap.to(".heart-glow, .orbit", { scale: 2.5, opacity: 0, duration: 0.6, ease: "power2.out" });
    gsap.fromTo(".heart-ripple", { scale: 1, opacity: 1 }, { scale: 3.2, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power2.out" });
    // preview shortcut: open index.html?jump=cake (or memories, reasons, wishes, letter, finale…)
    const jump = ids.indexOf(new URLSearchParams(location.search).get("jump"));
    if (jump > 0) for (let k = 1; k < jump; k++) visited.add(k);
    setTimeout(() => goTo(jump > 0 ? jump : 1), 450);
  };
  $("#secretStar").onclick = (e) => {
    e.stopPropagation();
    FX.audio.start();
    showModal({ tag: "secret found", emoji: "🌟", text: CFG.hiddenNote, btn: "hehe 🙈" });
  };

  /* ================= 1 · INTRO ================= */
  function splitChars(el) {
    el.innerHTML = Array.from(el.textContent).map((c) => `<span class="ch">${c}</span>`).join("");
    return el.querySelectorAll(".ch");
  }
  function typeText(el, text, speed = 38, done) {
    el.innerHTML = "";
    const span = document.createElement("span");
    const caret = document.createElement("span");
    caret.className = "caret";
    el.append(span, caret);
    let i = 0, finished = false;
    const finish = () => { if (finished) return; finished = true; clearInterval(iv); span.textContent = text; done && done(); };
    const iv = setInterval(() => {
      span.textContent = text.slice(0, ++i);
      el.scrollTop = el.scrollHeight;
      if (i >= text.length) finish();
    }, speed);
    return finish;
  }
  let introPlayed = false;
  enter.intro = () => {
    if (introPlayed) return;
    introPlayed = true;
    const cd = $("#countdown");
    const tl = gsap.timeline();
    ["3", "2", "1"].forEach((n) => {
      tl.call(() => { cd.textContent = n; FX.audio.chime([660 + +n * 110]); })
        .fromTo(cd, { scale: 2.6, opacity: 0, rotation: -15 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.45, ease: "back.out(2)" })
        .to(cd, { scale: 0.4, opacity: 0, duration: 0.35, delay: 0.25 });
    });
    tl.call(() => {
      cd.remove();
      FX.celebrate(true);
      FX.audio.chime([523, 659, 784, 1047, 1319]);
      gsap.set("#introContent", { opacity: 1 });
      gsap.from(splitChars($("#hbLine1")), { y: -120, opacity: 0, rotation: () => rand(-60, 60), stagger: 0.05, duration: 0.9, ease: "bounce.out" });
      gsap.from(splitChars($("#hbLine2")), { scale: 0, opacity: 0, stagger: 0.08, duration: 0.8, delay: 0.7, ease: "elastic.out(1,0.5)" });
      setTimeout(() => {
        $("#introTyped").classList.toggle("long", CFG.introLine.length > 220);
        const speed = Math.max(11, Math.min(34, 9000 / CFG.introLine.length));
        const skip = typeText($("#introTyped"), CFG.introLine, speed, () => {
          gsap.to("#introNext", { opacity: 1, y: 0, duration: 0.6, ease: "back.out(2)" });
        });
        $("#introTyped").onclick = skip;
      }, 1700);
      setTimeout(() => FX.heartRain(2500), 1200);
    });
  };

  /* ================= 2 · PLAYGROUND ================= */
  let play = null;
  enter.play = () => {
    if (!play) {
      $("#popTotal").textContent = CFG.balloonNotes.length;
      play = Scenes.createPlayground({
        notes: CFG.balloonNotes,
        onPop(idx, count, total) {
          $("#popCount").textContent = count;
          gsap.fromTo(".counter", { scale: 1.3 }, { scale: 1, duration: 0.5, ease: "elastic.out(1,0.4)" });
          $("#playHint").textContent = count < total ? `${total - count} more to go 🎈` : "wait for it… 👀";
          setTimeout(() => showModal({ tag: `love note ${count} of ${total}`, emoji: "💌", text: CFG.balloonNotes[count - 1], photo: randomReadyPhoto(), btn: count < total ? "keep popping 🎈" : "yay! 💖" }), 350);
        },
        onGiftShown() { $("#playHint").textContent = "a gift just landed… tap it! 🎁"; FX.audio.chime([523, 784, 1047]); },
        onGiftOpened() {
          FX.celebrate(true);
          $("#playHint").textContent = "🎁 surprise unlocked!";
          setTimeout(() => showModal({ tag: "surprise unlocked", emoji: "🎁", text: "You found the gift! Inside it: every memory we've made together. Come see… 📸", photo: randomReadyPhoto(), btn: "take me there 💞", onClose: next }), 1200);
        },
      });
    }
    Scenes.Engine.mount(play, $("#playMount"));
    poolReady.then(startFloaters);
  };
  leave.play = () => { Scenes.Engine.unmount(); stopFloaters(); };

  // her photos drifting around the balloon world (3 on phones, 4 on bigger screens)
  const floatLayer = $("#floatPhotos");
  let floatTimers = [], floatOn = false;
  function startFloaters() {
    if (floatOn || ids[current] !== "play" || !pool.length) return;
    floatOn = true;
    const n = innerWidth < 700 ? 3 : 4;
    for (let k = 0; k < n; k++) floatTimers.push(setTimeout(() => spawnFloater(k), k * 1300 + 500));
  }
  function stopFloaters() {
    floatOn = false;
    floatTimers.forEach(clearTimeout);
    floatTimers = [];
    floatLayer.querySelectorAll(".float-photo").forEach((el) => { gsap.killTweensOf(el); el.remove(); });
  }
  function spawnFloater(slot) {
    if (!floatOn) return;
    const shown = Array.from(floatLayer.children).map((e) => e.dataset.src);
    const src = randomReadyPhoto(shown);
    preload(thumb(src)).then((ok) => {
      if (!floatOn) return;
      if (!ok) return floatTimers.push(setTimeout(() => spawnFloater(slot), 800));
      showFloater(slot, src);
    });
  }
  function showFloater(slot, src) {
    const small = innerWidth < 700;
    const el = document.createElement("button");
    el.className = "float-photo";
    el.dataset.src = src;
    el.innerHTML = '<img alt="" />';
    el.querySelector("img").src = thumb(src);
    el.querySelector("img").onerror = () => el.remove();
    el.style.width = (small ? 92 : 150) + "px";
    const left = slot % 2 === 0;
    el.style.left = (left ? rand(2, small ? 6 : 14) : rand(small ? 68 : 74, small ? 73 : 86)) + "%";
    el.style.top = 26 + Math.floor(slot / 2) * 25 + rand(0, 12) + "%";
    floatLayer.appendChild(el);
    const rot = rand(-14, 14);
    gsap.fromTo(el, { scale: 0, rotation: rot - 30, opacity: 0 }, { scale: 1, rotation: rot, opacity: 1, duration: 0.9, ease: "back.out(1.8)" });
    gsap.to(el, { x: rand(-30, 30), y: rand(-50, 20), duration: rand(3, 4.5), yoyo: true, repeat: -1, ease: "sine.inOut" });
    el.onclick = (e) => { e.stopPropagation(); openPhotoViewer(src, el.getBoundingClientRect()); };
    floatTimers.push(setTimeout(() => {
      gsap.to(el, { scale: 0.2, opacity: 0, rotation: rot + 40, duration: 0.6, ease: "back.in(1.6)", onComplete: () => { gsap.killTweensOf(el); el.remove(); } });
      floatTimers.push(setTimeout(() => spawnFloater(slot), 500));
    }, rand(5500, 7500)));
  }

  /* ================= 3 · MEMORIES ================= */
  const ring = $("#carouselRing"), stage = $("#carouselStage");
  const mems = CFG.memories;
  let angle = 0, vel = 0, memRaf = 0, dragging = false, radius = 300;
  function buildCarousel() {
    const small = innerWidth < 700;
    const cw = small ? Math.min(230, innerWidth * 0.58) : 300, ch = cw * 1.3;
    ring.style.setProperty("--cw", cw + "px");
    ring.style.setProperty("--chh", ch + "px");
    radius = Math.round(cw / 2 / Math.tan(Math.PI / mems.length)) + (small ? 30 : 60);
    ring.innerHTML = "";
    mems.forEach((m, i) => {
      const card = document.createElement("div");
      card.className = "polaroid";
      card.style.transform = `rotateY(${(i * 360) / mems.length}deg) translateZ(${radius}px)`;
      card.innerHTML = `<div class="polaroid-img"></div><p></p>`;
      card.querySelector("p").textContent = m.title;
      setPhoto(card.querySelector(".polaroid-img"), m);
      card.dataset.i = i;
      ring.appendChild(card);
    });
  }
  function setPhoto(el, m, full = false) {
    el.classList.remove("placeholder");
    el.innerHTML = "";
    const tok = (el._tok = (el._tok || 0) + 1);
    const t = thumb(m.photo);
    const show = (src) => { el.style.backgroundImage = `url("${src}")`; el.classList.remove("cooking"); };
    if (readySet.has(t)) show(t);
    else { el.style.backgroundImage = ""; el.classList.add("cooking"); }   // "cooking" gradient while it downloads
    preload(t).then((ok) => {
      if (el._tok !== tok) return;
      if (!ok) { el.classList.remove("cooking"); el.classList.add("placeholder"); el.innerHTML = `<span>${m.emoji || "💗"}</span>`; return; }
      show(t);
      if (full && t !== m.photo) preload(m.photo).then((ok2) => { if (ok2 && el._tok === tok) show(m.photo); }); // sharpen in the big viewer
    });
  }
  function memLoop() {
    if (!dragging) { vel *= 0.95; angle += vel + (Math.abs(vel) < 0.05 ? 0.12 : 0); }
    ring.style.transform = `translateZ(${-radius}px) rotateX(-6deg) rotateY(${angle}deg)`;
    memRaf = requestAnimationFrame(memLoop);
  }
  let lastX = 0, moved = 0;
  stage.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; moved = 0; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    moved += Math.abs(dx);
    angle += dx * 0.35;
    vel = dx * 0.35;
  });
  stage.addEventListener("pointerup", (e) => {
    dragging = false;
    if (moved < 8) {
      stage.releasePointerCapture(e.pointerId);
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const card = el && el.closest(".polaroid");
      if (card) openLightbox(memItems(), +card.dataset.i, card.getBoundingClientRect());
    }
  });

  // side frames: extra photos in the empty space that flip to a new one every second
  const sideWrap = $("#sideFrames");
  let sideTimers = [];
  const PLACEHOLDER_EMOJI = ["💖", "🌸", "✨", "🦋", "🌷", "💕", "🎀", "🌙"];
  let sideOn = false;
  function buildSideFrames() {
    sideWrap.innerHTML = "";
    const small = innerWidth < 700;
    const spots = small ? [[4, 19], [72, 20], [5, 73], [71, 72]] : [[3, 19], [3, 45], [3, 70], [86, 17], [86, 43], [86, 68]];
    spots.forEach(([x, y]) => {
      const f = document.createElement("button");
      f.className = "mini-frame";
      f.style.left = x + "%";
      f.style.top = y + "%";
      f.innerHTML = '<div class="mini-img cooking"></div>';
      gsap.set(f, { rotation: rand(-10, 10) });
      sideWrap.appendChild(f);
      f.onclick = (e) => { e.stopPropagation(); if (f.dataset.src) openPhotoViewer(f.dataset.src, f.getBoundingClientRect()); };
    });
  }
  function cycleMini(f) {
    if (!sideOn || !f.isConnected) return;
    const img = f.querySelector(".mini-img");
    const nextFlip = () => sideTimers.push(setTimeout(() => cycleMini(f), rand(1000, 1400)));
    const flip = (mid, done) => gsap.to(f, { rotationY: 90, duration: 0.18, ease: "power1.in", onComplete() {
      mid();
      gsap.to(f, { rotationY: 0, duration: 0.25, ease: "back.out(2)", onComplete: done });
    } });
    const shown = Array.from(sideWrap.children).map((e) => e.dataset.src);
    const src = randomReadyPhoto(shown);
    if (!src) { img.classList.remove("cooking"); img.classList.add("placeholder"); img.textContent = pick(PLACEHOLDER_EMOJI); return nextFlip(); }
    const t = thumb(src);
    const setImg = () => { img.classList.remove("placeholder", "cooking"); img.textContent = ""; img.style.backgroundImage = `url("${t}")`; f.dataset.src = src; };
    if (readySet.has(t)) return flip(setImg, nextFlip);        // already downloaded: flip straight to it
    // not downloaded yet: flip to the "cooking" gradient, reveal the photo once it arrives, then wait before the next flip
    flip(() => { img.style.backgroundImage = ""; img.textContent = ""; img.classList.add("cooking"); f.dataset.src = ""; }, () => {
      preload(t).then((ok) => {
        if (!sideOn || !f.isConnected) return;
        if (ok) { setImg(); gsap.fromTo(img, { opacity: 0.2, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.5 }); }
        nextFlip();
      });
    });
  }
  function startSideFrames() {
    stopSideFrames();
    sideOn = true;
    Array.from(sideWrap.children).forEach((f, i) => sideTimers.push(setTimeout(() => cycleMini(f), 300 + i * 220)));
  }
  function stopSideFrames() {
    sideOn = false;
    sideTimers.forEach(clearTimeout);
    sideTimers = [];
    gsap.killTweensOf(".mini-frame");
  }

  enter.memories = () => {
    FX.audio.play(CFG.memoriesMusic);
    if (!ring.children.length) buildCarousel();
    warmPhotos();
    poolReady.then(() => { if (ids[current] !== "memories") return; buildSideFrames(); startSideFrames(); gsap.from(".mini-frame", { scale: 0, opacity: 0, stagger: 0.1, duration: 0.6, ease: "back.out(2)" }); });
    gsap.from(ring, { scale: 0.3, opacity: 0, duration: 1.2, ease: "back.out(1.4)" });
    angle -= 180; vel = 6;
    cancelAnimationFrame(memRaf);
    memLoop();
  };
  leave.memories = () => { cancelAnimationFrame(memRaf); stopSideFrames(); FX.audio.play(CFG.music); };
  addEventListener("resize", () => { if (ids[current] === "memories") { buildCarousel(); buildSideFrames(); startSideFrames(); } });

  /* ---------------- big photo lightbox ---------------- */
  const PHOTO_TITLES = ["My favourite view", "Look at you 😍", "Cutest human alive", "Heart = stolen", "Pure sunshine ☀️", "My whole world"];
  const memItems = () => mems.map((m) => ({ ...m }));
  function openPhotoViewer(src, rect) {
    const items = pool.map((p) => ({ photo: p, emoji: "💖", title: pick(PHOTO_TITLES), date: "💖 you 💖", caption: pick(CFG.photoLines || ["You are beautiful."]) }));
    openLightbox(items, Math.max(0, pool.indexOf(src)), rect);
  }
  let lbItems = [], lbIndex = 0;
  function fillLightbox(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    const m = lbItems[lbIndex];
    setPhoto($("#lbImg"), m, true);
    $("#lbTitle").textContent = m.title;
    $("#lbDate").textContent = m.date;
    $("#lbCaption").textContent = m.caption;
    $("#lbCaption").classList.toggle("long", (m.caption || "").length > 110);
    $("#flipCard").classList.remove("flipped");
  }
  function openLightbox(items, i, rect) {
    lbItems = items;
    fillLightbox(i);
    $("#lightbox").hidden = false;
    const fc = $("#flipCard");
    gsap.killTweensOf(fc);
    gsap.set(fc, { clearProps: "transform,opacity" });
    const from = { scale: 0.2, opacity: 0, rotation: -12, x: 0, y: 0 };
    if (rect) {
      const fr = fc.getBoundingClientRect();
      from.x = rect.left + rect.width / 2 - (fr.left + fr.width / 2);
      from.y = rect.top + rect.height / 2 - (fr.top + fr.height / 2);
      from.scale = Math.max(0.15, rect.width / fr.width);
      from.opacity = 1;
    }
    gsap.fromTo(fc, from, { x: 0, y: 0, scale: 1, opacity: 1, rotation: 0, duration: 0.8, ease: "back.out(1.3)" });
    FX.birthdayBurst();
    FX.sparkleRain(3500);
    FX.audio.chime([784, 988, 1319, 1568]);
  }
  $("#flipCard").onclick = () => { $("#flipCard").classList.toggle("flipped"); FX.audio.chime([1175, 1568]); };
  $("#lbClose").onclick = () => gsap.to("#flipCard", { scale: 0.5, opacity: 0, duration: 0.25, onComplete: () => ($("#lightbox").hidden = true) });
  const lbStep = (d) => gsap.to("#flipCard", { x: -d * 60, opacity: 0, duration: 0.18, onComplete() {
    fillLightbox(lbIndex + d);
    gsap.fromTo("#flipCard", { x: d * 60 }, { x: 0, opacity: 1, duration: 0.3 });
    FX.sparkleRain(1200);
  } });
  $("#lbPrev").onclick = () => lbStep(-1);
  $("#lbNext").onclick = () => lbStep(1);

  /* ================= 4 · REASONS JAR ================= */
  const reasons = CFG.reasons.slice().sort(() => Math.random() - 0.5);
  let reasonIdx = 0, jarBusy = false;
  $("#reasonTotal").textContent = reasons.length;
  const jarBody = $("#jarBody");
  for (let i = 0; i < 26; i++) {
    const h = document.createElement("span");
    h.className = "jar-heart";
    h.textContent = pick(["💗", "💖", "💕", "💓", "💞", "❤️", "🩷"]);
    h.style.left = rand(4, 80) + "%";
    h.style.bottom = Math.pow(Math.random(), 1.6) * 62 + "%";
    h.style.animationDelay = rand(0, 3) + "s";
    jarBody.appendChild(h);
  }
  gsap.set("#reasonsNext", { opacity: 0.35 });

  // every reason card enters with its own animation
  const W = () => innerWidth, H = () => innerHeight;
  const ENTRANCES = [
    (el) => gsap.fromTo(el, { rotationY: -180, scale: 0.6, opacity: 0 }, { rotationY: 0, scale: 1, opacity: 1, duration: 0.9, ease: "back.out(1.4)" }),
    (el) => gsap.fromTo(el, { y: -H(), rotation: -15 }, { y: 0, rotation: 0, duration: 1.1, ease: "bounce.out" }),
    (el) => gsap.fromTo(el, { scale: 0, rotation: -540, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 1, ease: "power3.out" }),
    (el) => gsap.fromTo(el, { x: -W(), skewX: 30, opacity: 0 }, { x: 0, skewX: 0, opacity: 1, duration: 1, ease: "elastic.out(1,0.6)" }),
    (el) => gsap.fromTo(el, { rotationX: -100, transformOrigin: "50% 0%", opacity: 0 }, { rotationX: 0, opacity: 1, duration: 1.2, ease: "elastic.out(1,0.5)" }),
    (el) => gsap.fromTo(el, { scaleX: 0.1, scaleY: 1.8, opacity: 0 }, { scaleX: 1, scaleY: 1, opacity: 1, duration: 0.9, ease: "elastic.out(1,0.4)" }),
    (el) => gsap.fromTo(el, { y: H(), rotation: 25, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.9, ease: "back.out(1.6)" }),
    (el) => gsap.fromTo(el, { x: W(), rotationY: 90, opacity: 0 }, { x: 0, rotationY: 0, opacity: 1, duration: 1, ease: "power4.out" }),
    (el) => gsap.fromTo(el, { scale: 2.6, opacity: 0, filter: "blur(14px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: "power2.out" }),
    (el) => gsap.fromTo(el, { rotation: -80, transformOrigin: "0% 0%", opacity: 0 }, { rotation: 0, opacity: 1, duration: 1.3, ease: "elastic.out(1,0.45)" }),
  ];
  const REASON_EMOJI = ["💗", "🌷", "✨", "🦋", "🌸", "🍓", "🎀", "🌙", "☀️", "🫶"];

  $("#jar").onclick = () => {
    if (jarBusy) return;
    jarBusy = true;
    const jar = $("#jar");
    FX.audio.lidPop();
    gsap.to(".jar-lid", { y: -46, x: -22, rotation: -28, duration: 0.35, ease: "back.out(2)" });
    const r = jar.getBoundingClientRect();
    const fh = document.createElement("div");
    fh.className = "flying-heart";
    fh.textContent = "💖";
    fh.style.left = r.left + r.width / 2 - 20 + "px";
    fh.style.top = r.top + 30 + "px";
    document.body.appendChild(fh);
    gsap.to(fh, { y: -150, scale: 3, rotation: 360, duration: 0.7, delay: 0.15, ease: "power2.out", onComplete() {
      fh.remove();
      const done = reasonIdx >= reasons.length;
      const text = done ? "…and a million more reasons that could never fit in a jar. 💞" : reasons[reasonIdx];
      const n = reasonIdx;
      if (!done) reasonIdx++;
      $("#reasonCount").textContent = reasonIdx;
      if (reasonIdx >= 3) gsap.to("#reasonsNext", { opacity: 1, duration: 0.5 });
      showModal({
        tag: done ? "infinity ♾️" : `reason #${reasonIdx}`, emoji: REASON_EMOJI[n % REASON_EMOJI.length], text,
        btn: done ? "🥹💞" : "another one 💗", theme: n % 8, anim: ENTRANCES[n % ENTRANCES.length], highlight: true, onClose: closeJar,
      });
    } });
  };
  // lid snaps shut, hearts tumble and the jar rattles, ready for a fresh reason
  function closeJar() {
    const jar = $("#jar");
    gsap.to(".jar-lid", { y: 0, x: 0, rotation: 0, duration: 0.45, ease: "bounce.out" });
    setTimeout(() => FX.audio.lidClose(), 200);
    setTimeout(() => {
      jar.classList.remove("shake");
      void jar.offsetWidth;
      jar.classList.add("shake");
      FX.audio.rattle();
      const hearts = $$(".jar-heart");
      hearts.forEach((h) => (h.style.animation = "none"));
      gsap.fromTo(hearts, { y: 0 }, { y: () => -rand(10, 45), x: () => rand(-12, 12), duration: 0.18, yoyo: true, repeat: 3, stagger: { each: 0.01, from: "random" }, ease: "sine.inOut",
        onComplete() { hearts.forEach((h) => { h.style.transform = ""; h.style.animation = ""; }); } });
    }, 350);
    setTimeout(() => (jarBusy = false), 900);
  }

  /* ================= 5 · CAKE ================= */
  let cake = null, blowIv = 0, micStream = null, micRaf = 0;
  // soft out-of-focus candle lights behind the cake
  for (let i = 0; i < 16; i++) {
    const b = document.createElement("span");
    b.className = "bokeh";
    const sz = rand(20, 90);
    Object.assign(b.style, { width: sz + "px", height: sz + "px", left: rand(0, 100) + "%", top: rand(0, 70) + "%", animationDelay: rand(0, 6) + "s", opacity: rand(0.25, 0.6),
      background: `radial-gradient(circle, ${pick(["rgba(255,190,120,.9)", "rgba(255,150,190,.8)", "rgba(255,225,170,.8)"])}, transparent 70%)` });
    $("#bokeh").appendChild(b);
  }
  // ---- birthday song + sing-along lyrics ----
  let stopSong = null, songTimer = 0;
  const LYRICS = [["Happy", "birthday", "to", "you"], ["Happy", "birthday", "to", "you"], ["Happy", "birthday", "dear", CFG.name], ["Happy", "birthday", "to", "you"]];
  function showLyricLine(line, word) {
    const k = $("#karaoke");
    if (k.dataset.line !== String(line)) {
      k.dataset.line = line;
      k.innerHTML = `<span class="note">🎶 sing along 🎶</span>` + LYRICS[line].map((w) => `<span class="w">${w.replace(/</g, "&lt;")}</span>`).join(" ");
      gsap.fromTo(k, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35 });
    }
    k.querySelectorAll(".w").forEach((el, i) => { el.classList.toggle("on", i === word); el.classList.toggle("sung", i < word); });
    if (line === 2 && word === 3) FX.floatEmoji(innerWidth / 2, innerHeight * 0.26, ["💖", "🎂", "✨"], 6);
  }
  function endSong() {
    stopSong = null;
    FX.audio.hush(false);
    gsap.to("#karaoke", { opacity: 0, duration: 0.8, onComplete: () => { $("#karaoke").innerHTML = ""; delete $("#karaoke").dataset.line; } });
    if (!$("#wishReady").hidden) $("#cakeSub").textContent = "now close your eyes… make a wish… 🤍";
  }
  function playBirthdaySong() {
    if (stopSong) return;
    FX.audio.hush(true);
    $("#cakeSub").textContent = "🎶 happy birthday to youuu 🎶";
    if (CFG.cakeSong) {
      // your own recording, with sing-along lines timed to it
      const a = new Audio(CFG.cakeSong);
      a.volume = FX.audio.on ? 1 : 0;
      a.onerror = () => { stopSong = null; FX.audio.hush(false); stopSong = FX.audio.birthdaySong({ onWord: showLyricLine, onEnd: endSong }); };
      const cues = CFG.cakeSongLyrics || [[0, `Happy birthday dear ${CFG.name}`]];
      const k = $("#karaoke");
      let shown = -1, raf = 0;
      const tick = () => {
        let i = -1;
        cues.forEach(([at], j) => { if (a.currentTime >= at) i = j; });
        if (i !== shown && i >= 0) {
          shown = i;
          k.innerHTML = `<span class="note">🎶 sing along 🎶</span><span class="w on">${String(cues[i][1]).replace(/</g, "&lt;")}</span>`;
          gsap.fromTo(k.querySelector(".w"), { opacity: 0, y: 14, scale: 0.9 }, { opacity: 1, y: 0, scale: 1.08, duration: 0.45, ease: "back.out(2)" });
          if (/anshika/i.test(cues[i][1])) FX.floatEmoji(innerWidth / 2, innerHeight * 0.26, ["💖", "🎂", "✨"], 6);
        }
        raf = requestAnimationFrame(tick);
      };
      gsap.set(k, { opacity: 1 });
      a.onended = () => { cancelAnimationFrame(raf); FX.audio.songEl = null; endSong(); };
      a.play().then(() => (raf = requestAnimationFrame(tick))).catch(() => {});
      FX.audio.songEl = a;
      stopSong = () => { cancelAnimationFrame(raf); a.pause(); FX.audio.songEl = null; };
      return;
    }
    stopSong = FX.audio.birthdaySong({ onWord: showLyricLine, onEnd: endSong });
  }
  // "Happy Birthday Anshika" posters hanging in the empty side areas
  const posterName = (CFG.posterName || CFG.name).replace(/(.)\1{2,}$/, "$1"); // "Anshikaaaaaa" → "Anshika"
  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  $("#posters").innerHTML = `
    ${["HAPPY", "BIRTHDAY"].map((word, g) => `<div class="garland ${g ? "g-right" : "g-left"}">${word.split("").map((ch, i) => `<span class="flag f${(i + g * 2) % 5}">${ch}</span>`).join("")}</div>`).join("")}
    <div class="poster neon p-left"><i class="pin"></i><b>Happy</b><b>Birthday</b><small>${esc(posterName)} ✨</small></div>
    <div class="poster gold p-right"><i class="pin"></i><small>happy birthday</small><strong>${esc(posterName).toUpperCase()}</strong><em>${esc(CFG.age || "")}</em><small>👑 birthday queen 👑</small></div>
    <div class="poster ribbon p-left2"><i class="pin"></i><span>🎀</span><b>Birthday</b><b>Girl</b><span>🎀</span></div>
    <div class="poster neon-star p-right2"><i class="pin"></i><span class="wish-star">🌟</span><b>make a wish</b><small>${esc(posterName)}</small></div>`;
  enter.cake = () => {
    FX.setAmbient(0.2);
    gsap.fromTo("#posters .poster", { y: -260, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.15, ease: "bounce.out", delay: 0.3 });
    gsap.fromTo("#posters .flag", { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.04, ease: "back.out(2)", delay: 0.2 });
    clearTimeout(songTimer);
    songTimer = setTimeout(playBirthdaySong, 900);
    if (!cake) {
      cake = Scenes.createCake({
        age: CFG.age,
        onCandle(out, total) { $("#cakeSub").textContent = out < total ? `just ${total - out} more… blow! 💨` : "✨✨✨"; },
        onAllOut() {
          stopBlowing();
          stopMic();
          $("#cakeControls").hidden = true;
          FX.celebrate(true);
          FX.heartRain(3000);
          FX.audio.chime([523, 659, 784, 1047, 1319, 1568]);
          $("#cakeSub").textContent = "Happy birthday, my love 🎂";
          setTimeout(() => { $("#cakeDone").hidden = false; gsap.from("#cakeDone > *", { y: 40, opacity: 0, stagger: 0.2, duration: 0.8, ease: "back.out(2)" }); }, 900);
        },
      });
    }
    Scenes.Engine.mount(cake, $("#cakeMount"));
  };
  leave.cake = () => {
    Scenes.Engine.unmount(); stopBlowing(); stopMic(); FX.setAmbient(1);
    clearTimeout(songTimer);
    if (stopSong) { const s = stopSong; stopSong = null; s(); }
    FX.audio.hush(false);
  };
  $("#wishReady").onclick = () => {
    cake.setCanBlow(true);
    $("#wishReady").hidden = true;
    $("#blowControls").hidden = false;
    gsap.from("#blowControls > *", { y: 20, opacity: 0, stagger: 0.1, duration: 0.5 });
    $("#cakeSub").textContent = `now blow out your ${cake.digits.join(" & ")} candles! 🕯️`;
  };
  const blowBtn = $("#blowBtn");
  function startBlowing(e) {
    e.preventDefault();
    blowBtn.classList.add("blowing");
    FX.audio.whoosh();
    cake.blowOne();
    clearInterval(blowIv);
    blowIv = setInterval(() => { cake.blowOne(); FX.audio.whoosh(); }, 750);
  }
  function stopBlowing() { blowBtn.classList.remove("blowing"); clearInterval(blowIv); }
  blowBtn.addEventListener("pointerdown", startBlowing);
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => blowBtn.addEventListener(ev, stopBlowing));

  $("#micBtn").onclick = async () => {
    if (micStream) return;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = FX.audio.ctx || new AudioContext();
      const src = ctx.createMediaStreamSource(micStream);
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      const data = new Uint8Array(an.fftSize);
      let loud = 0;
      $("#micBtn").textContent = "🎤 listening… blow!";
      FX.audio.music && gsap.to(FX.audio.music, { volume: 0.15, duration: 0.5 });
      (function listen() {
        an.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / data.length);
        if (rms > 0.18) { loud++; if (loud % 8 === 0) cake.blowOne(); } else loud = 0;
        micRaf = requestAnimationFrame(listen);
      })();
    } catch (err) {
      FX.toast("Mic not available. Hold the blow button instead 💨");
    }
  };
  function stopMic() {
    cancelAnimationFrame(micRaf);
    if (micStream) { micStream.getTracks().forEach((t) => t.stop()); micStream = null; }
    FX.audio.music && gsap.to(FX.audio.music, { volume: FX.audio.on && !FX.audio.songActive ? 0.55 : 0, duration: 0.8 });
  }

  /* ================= 6 · LANTERNS ================= */
  const sky = $("#sky");
  for (let i = 0; i < 90; i++) {
    const s = document.createElement("span");
    s.className = "star";
    s.style.left = rand(0, 100) + "%";
    s.style.top = Math.pow(Math.random(), 1.4) * 85 + "%";
    const sz = rand(1, 3);
    s.style.width = s.style.height = sz + "px";
    s.style.animationDelay = rand(0, 3) + "s";
    s.style.opacity = rand(0.4, 1);
    sky.appendChild(s);
  }
  const wishes = CFG.wishes;
  let wishIdx = 0, wishTween = null;
  const updateWishCount = () => ($("#wishCount").textContent = `(${Math.min(wishIdx + 1, wishes.length)}/${wishes.length})`);
  updateWishCount();
  enter.wishes = () => FX.setAmbient(0.3);
  leave.wishes = () => FX.setAmbient(1);
  $("#releaseBtn").onclick = () => {
    if (wishIdx >= wishes.length) return;
    const layer = $("#lanternLayer");
    const l = document.createElement("div");
    l.className = "lantern";
    l.innerHTML = '<div class="body"></div>';
    const x = rand(15, 80);
    l.style.left = x + "%";
    layer.appendChild(l);
    const H = innerHeight;
    const topStop = rand(0.06, 0.4) * H;
    gsap.to(l, { y: -(H - topStop), scale: rand(0.35, 0.55), duration: rand(9, 13), ease: "sine.out" });
    gsap.to(l, { x: rand(-50, 50), duration: rand(2.5, 4), yoyo: true, repeat: -1, ease: "sine.inOut" });
    FX.audio.chime([784, 988, 1175]);

    const wt = $("#wishText");
    wt.textContent = wishes[wishIdx];
    wishTween && wishTween.kill();
    wishTween = gsap.timeline()
      .fromTo(wt, { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power2.out" })
      .to(wt, { opacity: 0, y: -30, duration: 1, delay: Math.max(4.5, 2.5 + wishes[wishIdx].length / 22) });
    wishIdx++;
    updateWishCount();
    if (wishIdx >= wishes.length) {
      $("#releaseBtn").hidden = true;
      setTimeout(() => {
        wishTween && wishTween.kill();
        wt.textContent = "Every lantern is a promise: I'll be right here, helping each wish come true. 💫";
        gsap.fromTo(wt, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.2 });
        $("#wishesNext").hidden = false;
        gsap.from("#wishesNext", { y: 30, opacity: 0, duration: 0.6, ease: "back.out(2)" });
        FX.celebrate();
      }, 5200);
    }
  };
  let moonTaps = 0;
  $("#moon").onclick = (e) => {
    e.stopPropagation();
    moonTaps++;
    gsap.fromTo("#moon", { scale: 1.25 }, { scale: 1, duration: 0.6, ease: "elastic.out(1,0.3)" });
    if (moonTaps === 3) showModal({ tag: "secret found", emoji: "🌙", text: "Even the moon is a little jealous of how you glow. 🌙✨", btn: "stop it 🙈" });
  };

  /* ================= 7 · LETTER ================= */
  let letterOpened = false;
  $("#envSeal").onclick = () => {
    if (letterOpened) return;
    letterOpened = true;
    FX.audio.chime([659, 880, 1109]);
    gsap.to("#envSeal", { scale: 0, rotation: 180, duration: 0.4, ease: "back.in(2)" });
    $("#envelope").classList.add("open");
    gsap.to(".env-letter", { y: -90, duration: 0.8, delay: 0.7, ease: "power2.out" });
    setTimeout(openPaper, 1700);
  };
  function openPaper() {
    $("#paperOverlay").hidden = false;
    gsap.fromTo("#paper", { y: 200, scale: 0.6, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.9, ease: "back.out(1.3)" });
    const body = $("#paperBody");
    body.innerHTML = "";
    let p = 0, c = 0, skip = false, el = null;
    const paras = CFG.letter;
    function done() {
      $("#signature").textContent = `Forever yours, ${CFG.from} 💗`;
      gsap.from("#signature", { opacity: 0, x: 30, duration: 0.8 });
      $("#letterNext").hidden = false;
      gsap.from("#letterNext", { opacity: 0, y: 20, duration: 0.6, delay: 0.4 });
    }
    function step() {
      if (skip) {
        body.innerHTML = "";
        paras.forEach((t) => { const x = document.createElement("p"); x.textContent = t; body.appendChild(x); });
        return done();
      }
      if (p >= paras.length) return done();
      if (!el) { el = document.createElement("p"); body.appendChild(el); }
      el.textContent = paras[p].slice(0, ++c);
      const paper = $("#paper");
      paper.scrollTop = paper.scrollHeight;
      if (c >= paras[p].length) { p++; c = 0; el = null; setTimeout(step, 380); }
      else setTimeout(step, 18);
    }
    setTimeout(step, 700);
    $("#paper").onclick = () => { if (p < paras.length) skip = true; };
  }

  /* ================= 8 · FINALE ================= */
  let togetherIv = 0;
  enter.finale = () => {
    FX.setAmbient(0.25);
    FX.Fireworks.start($("#fireworks"));
    FX.celebrate(true);
    FX.heartRain(4000);
    gsap.from(".finale-content > *", { y: 50, opacity: 0, stagger: 0.25, duration: 1, ease: "back.out(1.6)" });
    if (CFG.togetherSince) {
      const since = new Date(CFG.togetherSince + "T00:00:00");
      if (!isNaN(since)) {
        $("#together").hidden = false;
        const paint = () => {
          let s = Math.max(0, Math.floor((Date.now() - since) / 1000));
          const d = Math.floor(s / 86400); s %= 86400;
          const h = Math.floor(s / 3600); s %= 3600;
          const m = Math.floor(s / 60); s %= 60;
          $("#togetherGrid").innerHTML = [[d, "days"], [h, "hours"], [m, "mins"], [s, "secs"]].map(([v, l]) => `<div><b>${v}</b><small>${l}</small></div>`).join("");
        };
        paint();
        clearInterval(togetherIv);
        togetherIv = setInterval(paint, 1000);
      }
    }
    setTimeout(() => {
      $("#secretBtn").hidden = false;
      gsap.fromTo("#secretBtn", { scale: 0 }, { scale: 1, duration: 0.8, ease: "elastic.out(1,0.5)" });
    }, 4000);
  };
  leave.finale = () => { FX.Fireworks.stop(); clearInterval(togetherIv); FX.setAmbient(1); };
  $("#secretBtn").onclick = () => {
    FX.celebrate(true);
    showModal({ tag: "the secret", emoji: "🤫", text: CFG.secretMessage, btn: "💖💖💖" });
  };
  $("#replayBtn").onclick = () => location.reload();

  // shayari cards, one after another
  const shayari = CFG.shayari || [];
  if (!shayari.length) $("#shayariBtn").hidden = true;
  function showShayari(i) {
    const last = i >= shayari.length - 1;
    showModal({
      tag: `shayari ${i + 1} / ${shayari.length}`, emoji: "🌸", text: shayari[i], highlight: true,
      theme: (i + 3) % 8, anim: ENTRANCES[(i * 3) % ENTRANCES.length],
      btn: last ? "❤️❤️❤️" : "agli shayari 🌸",
      onClose: last ? () => FX.heartRain(2500) : () => setTimeout(() => showShayari(i + 1), 150),
    });
  }
  $("#shayariBtn").onclick = () => shayari.length && showShayari(0);

  paintNav();
})();
