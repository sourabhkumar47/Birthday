/* Three.js worlds: balloon playground + birthday cake */
(function () {
  const { rand, pick } = FX;

  // treat hex colours as sRGB so pastels stay pastel (not washed out)
  if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;

  /* ---------------- shared renderer ---------------- */
  const Engine = {
    renderer: null, world: null, raf: 0, last: 0,
    ensure() {
      if (this.renderer) return;
      const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      r.outputEncoding = THREE.sRGBEncoding;
      r.shadowMap.enabled = true;
      r.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer = r;
      addEventListener("resize", () => this.resize());
      this.bindPointer(r.domElement);
    },
    mount(world, el) {
      this.ensure();
      el.appendChild(this.renderer.domElement);
      this.world = world;
      const rs = world.render || {};
      this.renderer.toneMapping = rs.toneMapping || THREE.NoToneMapping;
      this.renderer.toneMappingExposure = rs.exposure || 1;
      this.resize();
      cancelAnimationFrame(this.raf);
      this.last = performance.now();
      const loop = (now) => {
        const dt = Math.min(0.05, (now - this.last) / 1000);
        this.last = now;
        world.update(dt, now / 1000);
        this.renderer.render(world.scene, world.camera);
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    },
    unmount() { cancelAnimationFrame(this.raf); this.world = null; },
    resize() {
      if (!this.world) return;
      const el = this.renderer.domElement.parentElement;
      const w = el.clientWidth, h = el.clientHeight;
      this.renderer.setSize(w, h, false);
      this.world.resize(w, h);
    },
    bindPointer(cv) {
      let down = null, moved = false;
      cv.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; moved = false; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener("pointermove", (e) => {
        if (!down || !this.world) return;
        const dx = e.clientX - down.x, dy = e.clientY - down.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
        if (moved) { this.world.onDrag && this.world.onDrag(dx, dy); down = { x: e.clientX, y: e.clientY }; }
      });
      cv.addEventListener("pointerup", (e) => {
        if (down && !moved && this.world && this.world.onTap) {
          const r = cv.getBoundingClientRect();
          const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
          this.world.onTap(ndc, e);
        }
        down = null;
      });
    },
  };

  /* ---------------- helpers ---------------- */
  function heartGeometry(size = 1, depth = 0.4) {
    const s = new THREE.Shape();
    s.moveTo(5, 5);
    s.bezierCurveTo(5, 5, 4, 0, 0, 0);
    s.bezierCurveTo(-6, 0, -6, 7, -6, 7);
    s.bezierCurveTo(-6, 11, -3, 15.4, 5, 19);
    s.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
    s.bezierCurveTo(16, 7, 16, 0, 10, 0);
    s.bezierCurveTo(7, 0, 5, 5, 5, 5);
    const g = new THREE.ExtrudeGeometry(s, { depth: depth * 10, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: 1.2, bevelThickness: 1.2, curveSegments: 16 });
    g.center();
    g.rotateZ(Math.PI);
    g.scale(size / 20, size / 20, size / 20);
    return g;
  }

  let glowTex;
  function glowTexture() {
    if (glowTex) return glowTex;
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,.8)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    glowTex = new THREE.CanvasTexture(c);
    return glowTex;
  }

  function sparkles(n, spread, color = 0xffffff, size = 0.15) {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = rand(-spread, spread);
      pos[i * 3 + 1] = rand(-spread * 0.5, spread * 0.8);
      pos[i * 3 + 2] = rand(-spread, spread * 0.6);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ size, map: glowTexture(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    return new THREE.Points(g, m);
  }

  function portraitZ(aspect, base) { return aspect < 1 ? base + (1 - aspect) * base * 1.1 : base; }

  // flying mini-hearts burst (shared by both worlds)
  const miniHeart = heartGeometry(0.28, 0.25);
  function makeBurst(scene, pos, color, list, n = 18) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(miniHeart, new THREE.MeshStandardMaterial({ color: i % 3 ? color : 0xffffff, transparent: true, roughness: 0.4 }));
      m.position.copy(pos);
      const v = new THREE.Vector3(rand(-1, 1), rand(-0.4, 1.2), rand(-1, 1)).normalize().multiplyScalar(rand(3, 7));
      m.userData = { v, spin: rand(-6, 6), life: 1 };
      scene.add(m);
      list.push(m);
    }
  }
  function updateBurst(scene, list, dt) {
    for (let i = list.length - 1; i >= 0; i--) {
      const m = list[i], d = m.userData;
      d.v.y -= 6 * dt;
      m.position.addScaledVector(d.v, dt);
      m.rotation.y += d.spin * dt;
      d.life -= dt * 0.8;
      m.material.opacity = Math.max(0, d.life);
      if (d.life <= 0) { scene.remove(m); m.material.dispose(); list.splice(i, 1); }
    }
  }

  /* =========================================================
     WORLD 1 · BALLOON PLAYGROUND
     ========================================================= */
  function createPlayground(opts) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffd6e7, 18, 40);
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    const baseZ = 13;

    scene.add(new THREE.HemisphereLight(0xfff0f6, 0xd4b8ff, 0.95));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(5, 10, 8);
    scene.add(sun);
    const pinkL = new THREE.PointLight(0xff7eb3, 0.9, 30);
    pinkL.position.set(-6, 2, 6);
    scene.add(pinkL);

    const world = new THREE.Group();
    scene.add(world);

    // floor: soft pastel cloud island
    const island = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 6, 0.8, 48), new THREE.MeshStandardMaterial({ color: 0xffe3ef, roughness: 0.9 }));
    island.position.y = -3.6;
    world.add(island);
    const grass = new THREE.Mesh(new THREE.CylinderGeometry(7.55, 7.55, 0.12, 48), new THREE.MeshStandardMaterial({ color: 0xffc2da, roughness: 0.8 }));
    grass.position.y = -3.16;
    world.add(grass);
    // little flowers on the island
    const petalG = new THREE.SphereGeometry(0.12, 10, 8), centerG = new THREE.SphereGeometry(0.09, 10, 8);
    for (let i = 0; i < 26; i++) {
      const f = new THREE.Group();
      const col = pick([0xffffff, 0xffd27a, 0xc9b6ff, 0xff8fb8]);
      for (let k = 0; k < 5; k++) {
        const p = new THREE.Mesh(petalG, new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 }));
        p.position.set(Math.cos((k / 5) * 6.28) * 0.14, 0, Math.sin((k / 5) * 6.28) * 0.14);
        f.add(p);
      }
      f.add(new THREE.Mesh(centerG, new THREE.MeshStandardMaterial({ color: 0xffb347 })));
      const a = rand(0, 6.28), r = rand(1.5, 7);
      f.position.set(Math.cos(a) * r, -3.05, Math.sin(a) * r);
      f.scale.setScalar(rand(0.8, 1.4));
      world.add(f);
    }

    // clouds
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.95 });
    const cloudG = new THREE.SphereGeometry(1, 16, 12);
    const clouds = [];
    for (let i = 0; i < 7; i++) {
      const c = new THREE.Group();
      for (let k = 0; k < 5; k++) {
        const s = new THREE.Mesh(cloudG, cloudMat);
        s.position.set(k * 0.9 - 1.8, Math.sin(k) * 0.3, rand(-0.3, 0.3));
        s.scale.setScalar(k === 2 ? 1.3 : rand(0.7, 1));
        c.add(s);
      }
      const a = rand(0, 6.28), r = rand(10, 16);
      c.position.set(Math.cos(a) * r, rand(2, 7), Math.sin(a) * r);
      c.scale.setScalar(rand(0.6, 1.1));
      c.userData.sp = rand(0.02, 0.06);
      world.add(c);
      clouds.push(c);
    }

    // floating 3D hearts (tap for a surprise)
    const hearts = [];
    const hGeo = heartGeometry(1, 0.45);
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(hGeo, new THREE.MeshPhysicalMaterial({ color: pick([0xff5c97, 0xff8fb8, 0xe0457b, 0xffb3d1]), roughness: 0.25, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.1 }));
      const a = (i / 12) * 6.28 + rand(-0.2, 0.2), r = rand(5.5, 7.5);
      m.position.set(Math.cos(a) * r, rand(1.5, 5), Math.sin(a) * r);
      m.scale.setScalar(rand(0.5, 0.9));
      m.userData = { kind: "heart", baseY: m.position.y, ph: rand(0, 6.28), spin: rand(0.4, 1) };
      world.add(m);
      hearts.push(m);
    }

    world.add(sparkles(260, 14, 0xffffff, 0.18));

    // balloons
    const notes = opts.notes;
    const colors = [0xff8fb8, 0xc7a6ff, 0xffd27a, 0x9fe3ff, 0xff5c97, 0xb8f2c9, 0xffb38a, 0xe8a6ff, 0xff9eb5, 0x8fd3ff];
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI, k = (1 - Math.cos(a)) / 2;
      pts.push(new THREE.Vector2(Math.max(0.001, Math.sin(a) * (0.72 + 0.28 * k)), -Math.cos(a) * 1.25));
    }
    const balloonGeo = new THREE.LatheGeometry(pts, 40);
    const knotGeo = new THREE.ConeGeometry(0.13, 0.22, 12);
    const balloons = [], clickable = [];
    const n = notes.length;
    for (let i = 0; i < n; i++) {
      const g = new THREE.Group();
      const col = colors[i % colors.length];
      const mat = new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.18, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 1, sheenColor: new THREE.Color(0xffffff) });
      const body = new THREE.Mesh(balloonGeo, mat);
      body.userData.group = g;
      g.add(body);
      const knot = new THREE.Mesh(knotGeo, mat);
      knot.position.y = -1.32;
      g.add(knot);
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -1.4, 0), new THREE.Vector3(0.15, -2.2, 0.05), new THREE.Vector3(-0.15, -3, -0.05), new THREE.Vector3(0.1, -3.8, 0)]);
      const str = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(24)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
      g.add(str);
      // tiny heart tag
      const tag = new THREE.Mesh(miniHeart, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }));
      tag.position.set(0.1, -3.85, 0);
      g.add(tag);
      const a = (i / n) * Math.PI * 2, r = i % 2 ? 3.2 : 5;
      g.position.set(Math.cos(a) * r, rand(-0.3, 2.2), Math.sin(a) * r);
      g.scale.setScalar(0.85);
      g.userData = { idx: i, baseY: g.position.y, ph: rand(0, 6.28), color: col, popped: false };
      world.add(g);
      balloons.push(g);
      clickable.push(body);
    }

    // gift box (appears when all balloons popped)
    const gift = new THREE.Group();
    const boxMat = new THREE.MeshPhysicalMaterial({ color: 0xff5c97, roughness: 0.35, clearcoat: 0.6 });
    const ribMat = new THREE.MeshPhysicalMaterial({ color: 0xffd27a, roughness: 0.25, metalness: 0.4, clearcoat: 1 });
    const boxBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 2.2), boxMat);
    gift.add(boxBody);
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(2.24, 1.82, 0.36), ribMat); gift.add(r1);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.82, 2.24), ribMat); gift.add(r2);
    const lid = new THREE.Group();
    lid.add(new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.45, 2.45), boxMat));
    lid.add(new THREE.Mesh(new THREE.BoxGeometry(2.49, 0.47, 0.38), ribMat));
    lid.add(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.47, 2.49), ribMat));
    const loopG = new THREE.TorusGeometry(0.42, 0.13, 12, 32);
    const l1 = new THREE.Mesh(loopG, ribMat); l1.position.set(-0.4, 0.55, 0); l1.rotation.set(0, 0, 0.5); lid.add(l1);
    const l2 = new THREE.Mesh(loopG, ribMat); l2.position.set(0.4, 0.55, 0); l2.rotation.set(0, 0, -0.5); lid.add(l2);
    const kn = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), ribMat); kn.position.y = 0.4; lid.add(kn);
    lid.position.y = 1.12;
    gift.add(lid);
    const giftGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xfff0a8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    giftGlow.scale.set(8, 8, 1);
    giftGlow.position.y = 1.2;
    gift.add(giftGlow);
    gift.visible = false;
    gift.userData.kind = "gift";
    gift.traverse((o) => (o.userData.gift = true));
    scene.add(gift);
    let giftReady = false, giftOpened = false;

    const bursts = [];
    let rotY = 0, rotX = 0.12, targetY = 0, idle = 0;
    const ray = new THREE.Raycaster();
    let popped = 0;

    function showGift() {
      gift.visible = true;
      gift.position.set(0, 12, 2);
      gift.rotation.set(0, -0.5, 0);
      gsap.to(gift.position, { y: -2.05, duration: 1.6, ease: "bounce.out", onComplete: () => (giftReady = true) });
      gsap.to(gift.rotation, { y: 0.35, duration: 1.6 });
      opts.onGiftShown && opts.onGiftShown();
    }

    function openGift() {
      giftOpened = true;
      gsap.timeline()
        .to(gift.scale, { x: 1.15, y: 0.85, z: 1.15, duration: 0.15, yoyo: true, repeat: 3 })
        .to(lid.position, { y: 5, duration: 0.8, ease: "power2.out" })
        .to(lid.rotation, { x: 1.2, z: -0.8, duration: 0.8 }, "<")
        .to(giftGlow.material, { opacity: 1, duration: 0.5 }, "<");
      setTimeout(() => {
        makeBurst(scene, new THREE.Vector3(0, -0.5, 2), 0xff5c97, bursts, 40);
        opts.onGiftOpened && opts.onGiftOpened();
      }, 700);
    }

    function pop(g) {
      const d = g.userData;
      if (d.popped) return;
      d.popped = true;
      FX.audio.pop();
      gsap.to(g.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.09, onComplete: () => {
        const wp = new THREE.Vector3();
        g.children[0].getWorldPosition(wp);
        makeBurst(scene, wp, d.color, bursts, 22);
        g.visible = false;
        popped++;
        opts.onPop && opts.onPop(d.idx, popped, n);
        if (popped === n) setTimeout(showGift, 900);
      } });
    }

    return {
      scene, camera,
      showGift,
      resize(w, h) { camera.aspect = w / h; camera.position.set(0, 1.2, portraitZ(camera.aspect, baseZ)); camera.lookAt(0, 0.3, 0); camera.updateProjectionMatrix(); },
      onDrag(dx, dy) { targetY += dx * 0.008; rotX = THREE.MathUtils.clamp(rotX + dy * 0.002, -0.1, 0.35); idle = 0; },
      onTap(ndc) {
        ray.setFromCamera(ndc, camera);
        if (gift.visible && giftReady && !giftOpened) {
          if (ray.intersectObject(gift, true).length) return openGift();
        }
        const hit = ray.intersectObjects(clickable.filter((c) => c.userData.group.visible), false)[0];
        if (hit) return pop(hit.object.userData.group);
        const hh = ray.intersectObjects(hearts, false)[0];
        if (hh) {
          const m = hh.object;
          gsap.to(m.rotation, { y: m.rotation.y + Math.PI * 4, duration: 1.2, ease: "power2.out" });
          gsap.fromTo(m.scale, { x: m.scale.x * 1.3, y: m.scale.y * 1.3, z: m.scale.z * 1.3 }, { x: m.scale.x, y: m.scale.y, z: m.scale.z, duration: 0.6, ease: "elastic.out(1,0.4)" });
          FX.audio.chime([1319, 1760]);
        }
      },
      update(dt, t) {
        idle += dt;
        if (idle > 2.5) targetY += dt * 0.12;
        rotY += (targetY - rotY) * 0.08;
        world.rotation.y = rotY;
        world.rotation.x = rotX;
        for (const b of balloons) {
          const d = b.userData;
          b.position.y = d.baseY + Math.sin(t * 1.1 + d.ph) * 0.35;
          b.rotation.z = Math.sin(t * 0.9 + d.ph) * 0.08;
          b.rotation.y += dt * 0.3;
        }
        for (const h of hearts) {
          const d = h.userData;
          h.position.y = d.baseY + Math.sin(t + d.ph) * 0.5;
          h.rotation.y += dt * d.spin;
        }
        for (const c of clouds) c.position.x += Math.sin(t * c.userData.sp) * 0.004;
        if (gift.visible && !giftOpened && giftReady) gift.rotation.y += dt * 0.4;
        if (giftOpened) giftGlow.material.opacity = 0.7 + Math.sin(t * 4) * 0.3;
        updateBurst(scene, bursts, dt);
      },
    };
  }

  /* =========================================================
     WORLD 2 · REALISTIC RED VELVET CAKE + NUMBER CANDLES
     ========================================================= */
  function canvasTex(w, h, draw, color = true) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    if (color) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    return t;
  }

  // red velvet sponge: deep red crumb with darker pockets and lighter specks
  function paintCrumb(x, X, Y, w, h) {
    x.fillStyle = "#7a1320";
    x.fillRect(X, Y, w, h);
    const n = (w * h) / 5;
    for (let i = 0; i < n; i++) {
      const r = Math.random();
      x.fillStyle = r < 0.45 ? `rgba(50,3,10,${rand(0.15, 0.5)})` : r < 0.85 ? `rgba(165,34,46,${rand(0.15, 0.45)})` : `rgba(210,85,92,${rand(0.1, 0.3)})`;
      const s = rand(0.8, 2.6);
      x.fillRect(X + Math.random() * w, Y + Math.random() * h, s, s);
    }
    for (let i = 0; i < n / 60; i++) {
      x.fillStyle = `rgba(35,0,6,${rand(0.35, 0.6)})`;
      x.beginPath();
      x.ellipse(X + Math.random() * w, Y + Math.random() * h, rand(1, 3.5), rand(0.8, 2.5), rand(0, 3), 0, 7);
      x.fill();
    }
  }
  // cream cheese frosting: warm off-white with soft grain
  function paintCream(x, X, Y, w, h) {
    x.fillStyle = "#f6efe4";
    x.fillRect(X, Y, w, h);
    for (let i = 0; i < (w * h) / 14; i++) {
      x.fillStyle = Math.random() < 0.5 ? `rgba(255,255,255,${rand(0.2, 0.6)})` : `rgba(205,188,168,${rand(0.08, 0.22)})`;
      x.fillRect(X + Math.random() * w, Y + Math.random() * h, rand(1, 3), rand(1, 2));
    }
  }
  // three sponge layers with frosting between them (fractions from the top)
  const LAYERS = [[0.07, "cream"], [0.25, "crumb"], [0.065, "cream"], [0.25, "crumb"], [0.065, "cream"], [0.3, "crumb"]];
  function paintLayers(x, w, h) {
    let y = 0;
    for (const [f, k] of LAYERS) {
      (k === "crumb" ? paintCrumb : paintCream)(x, 0, y, w, f * h + 1);
      y += f * h;
    }
  }

  let texCache = null;
  function cakeTextures() {
    if (texCache) return texCache;
    // outside: "semi-naked" finish, a thin scraped coat with red sponge peeking through
    const side = canvasTex(1024, 512, (x, w, h) => {
      const mk = (cw, ch) => { const c = document.createElement("canvas"); c.width = cw; c.height = ch; return c; };
      const layers = mk(w, h);
      paintLayers(layers.getContext("2d"), w, h);
      // scrape mask: painted at 1/4 size then scaled up, so every edge stays soft
      const bands = [];
      let y = 0;
      for (const [f, k] of LAYERS) { if (k === "crumb") bands.push([y, f * h]); y += f * h; }
      const small = mk(w / 4, h / 4), sc = small.getContext("2d");
      for (let i = 0; i < 340; i++) {
        const [by, bh] = pick(bands);
        const sh = rand(0.6, 2.8);
        sc.fillStyle = `rgba(255,255,255,${rand(0.25, 0.8)})`;
        sc.fillRect(rand(-20, w / 4), (by + bh * rand(0.08, 0.92)) / 4 - sh / 2, rand(10, 70), sh);
      }
      const lc = layers.getContext("2d");
      lc.globalCompositeOperation = "destination-in";
      lc.imageSmoothingEnabled = true;
      lc.drawImage(small, 0, 0, w, h);
      // white coat first, then the sponge showing through the scraped parts
      paintCream(x, 0, 0, w, h);
      x.drawImage(layers, 0, 0);
      for (let i = 0; i < 90; i++) {
        x.fillStyle = `rgba(255,255,255,${rand(0.08, 0.22)})`;
        x.fillRect(rand(-100, w), rand(0, h), rand(80, 400), rand(1, 3));
      }
    });
    side.wrapS = THREE.RepeatWrapping;
    // cut face: clean layers plus the thin outer frosting on the edge
    const cut = canvasTex(512, 512, (x, w, h) => { paintLayers(x, w, h); paintCream(x, w * 0.965, 0, w * 0.035, h); });
    // top: smooth frosting with faint spatula swirls
    const top = canvasTex(512, 512, (x, w, h) => {
      paintCream(x, 0, 0, w, h);
      x.lineWidth = 3;
      for (let i = 0; i < 28; i++) {
        x.strokeStyle = `rgba(185,165,140,${rand(0.05, 0.13)})`;
        x.beginPath();
        const a = rand(0, 6);
        x.arc(w / 2 + rand(-8, 8), h / 2 + rand(-8, 8), rand(20, 250), a, a + rand(1, 3));
        x.stroke();
      }
    });
    // wooden table
    const wood = canvasTex(1024, 1024, (x, w, h) => {
      const plank = h / 6;
      for (let p = 0; p < 6; p++) {
        x.fillStyle = ["#553322", "#4b2d1e", "#5c3a26", "#462a1b"][p % 4];
        x.fillRect(0, p * plank, w, plank);
        for (let i = 0; i < 70; i++) {
          x.strokeStyle = Math.random() < 0.5 ? `rgba(28,14,7,${rand(0.1, 0.35)})` : `rgba(125,85,52,${rand(0.08, 0.25)})`;
          x.lineWidth = rand(0.5, 2.5);
          const y0 = p * plank + Math.random() * plank, amp = rand(1, 6), fr = rand(0.002, 0.01), ph = rand(0, 6);
          x.beginPath();
          for (let X = 0; X <= w; X += 16) x.lineTo(X, y0 + Math.sin(X * fr + ph) * amp);
          x.stroke();
        }
        x.fillStyle = "rgba(15,8,4,.85)";
        x.fillRect(0, (p + 1) * plank - 3, w, 3);
      }
    });
    wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
    wood.repeat.set(2, 2);
    const fade = canvasTex(256, 256, (x, w, h) => {
      const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "#fff"); g.addColorStop(0.5, "#fff"); g.addColorStop(1, "#000");
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    }, false);
    // glitter for the number candles
    const glitter = canvasTex(256, 256, (x, w, h) => {
      x.fillStyle = "#808080"; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 6000; i++) { const v = (Math.random() * 255) | 0; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    }, false);
    glitter.wrapS = glitter.wrapT = THREE.RepeatWrapping;
    glitter.repeat.set(5, 5);
    return (texCache = { side, cut, top, wood, fade, glitter });
  }

  // soft studio reflections so frosting, porcelain and glitter look real
  function makeEnvironment(renderer) {
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x1c0e14, side: THREE.BackSide })));
    const panel = (hex, k, pos, w, h) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(...pos);
      m.lookAt(0, 0, 0);
      s.add(m);
    };
    panel(0xfff1e0, 5, [0, 12, 2], 10, 10);
    panel(0xffd6e6, 2.5, [-12, 4, 5], 6, 8);
    panel(0xffb070, 3, [10, 3, -4], 5, 5);
    panel(0xffffff, 1.5, [0, 3, 13], 10, 4);
    const pm = new THREE.PMREMGenerator(renderer);
    const env = pm.fromScene(s, 0.04).texture;
    pm.dispose();
    return env;
  }

  // digit outlines (units: 1 tall) built from smooth strokes; tubes give the rounded wax look
  class Ellipse3 extends THREE.Curve {
    constructor(cx, cy, rx, ry) { super(); Object.assign(this, { cx, cy, rx, ry }); this.closed = true; }
    getPoint(t, v = new THREE.Vector3()) { return v.set(this.cx + this.rx * Math.cos(t * Math.PI * 2), this.cy + this.ry * Math.sin(t * Math.PI * 2), 0); }
  }
  const V = (x, y) => new THREE.Vector3(x, y, 0);
  const L = (a, b) => new THREE.LineCurve3(V(...a), V(...b));
  const C = (a, b, c, d) => new THREE.CubicBezierCurve3(V(...a), V(...b), V(...c), V(...d));
  const P = (...curves) => { const p = new THREE.CurvePath(); curves.forEach((c) => p.add(c)); return p; };
  const DIGITS = {
    0: () => [new Ellipse3(0.31, 0.5, 0.25, 0.46)],
    1: () => [L([0.36, 0.03], [0.36, 0.97]), L([0.36, 0.97], [0.14, 0.78])],
    2: () => [P(C([0.07, 0.72], [0.07, 0.98], [0.56, 0.99], [0.56, 0.72]), C([0.56, 0.72], [0.56, 0.52], [0.2, 0.3], [0.05, 0.05])), L([0.05, 0.05], [0.6, 0.05])],
    3: () => [P(C([0.07, 0.8], [0.13, 1.01], [0.53, 1.02], [0.53, 0.78]), C([0.53, 0.78], [0.53, 0.58], [0.36, 0.54], [0.24, 0.53])),
              P(C([0.24, 0.53], [0.4, 0.53], [0.59, 0.46], [0.59, 0.28]), C([0.59, 0.28], [0.59, 0.02], [0.14, -0.02], [0.04, 0.16]))],
    4: () => [L([0.44, 0.03], [0.44, 0.97]), L([0.44, 0.97], [0.04, 0.33]), L([0.04, 0.33], [0.62, 0.33])],
    5: () => [L([0.55, 0.96], [0.13, 0.96]), L([0.13, 0.96], [0.09, 0.58]), P(C([0.09, 0.58], [0.3, 0.66], [0.6, 0.6], [0.59, 0.3]), C([0.59, 0.3], [0.57, 0.0], [0.16, -0.02], [0.05, 0.16]))],
    6: () => [C([0.53, 0.95], [0.2, 0.9], [0.06, 0.62], [0.08, 0.3]), new Ellipse3(0.32, 0.29, 0.25, 0.27)],
    7: () => [L([0.04, 0.96], [0.6, 0.96]), L([0.6, 0.96], [0.22, 0.03])],
    8: () => [new Ellipse3(0.31, 0.75, 0.2, 0.21), new Ellipse3(0.31, 0.28, 0.26, 0.27)],
    9: () => [new Ellipse3(0.3, 0.7, 0.25, 0.27), C([0.55, 0.7], [0.56, 0.3], [0.42, 0.03], [0.1, 0.05])],
  };

  function flameGeometry(h, r) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      pts.push(new THREE.Vector2(Math.max(0.0001, r * Math.sin(Math.PI * Math.pow(t, 0.55)) * (1 - 0.35 * t)), t * h));
    }
    const g = new THREE.LatheGeometry(pts, 24);
    const pos = g.attributes.position, col = [];
    const blue = new THREE.Color(0.25, 0.35, 1), orange = new THREE.Color(1, 0.5, 0.12), yellow = new THREE.Color(1, 0.9, 0.6);
    for (let i = 0; i < pos.count; i++) {
      const t = pos.getY(i) / h;
      const c = t < 0.18 ? blue.clone().lerp(orange, t / 0.18) : orange.clone().lerp(yellow, Math.min(1, (t - 0.18) / 0.5));
      col.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    return g;
  }

  // piped rosette: a swirled star-tip dollop of frosting
  function rosetteGeometry() {
    const pts = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      pts.push(new THREE.Vector2(Math.max(0.001, 0.21 * Math.pow(1 - t, 0.75) * (1 + 0.2 * Math.sin(t * Math.PI))), t * 0.34));
    }
    const g = new THREE.LatheGeometry(pts, 64);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x), r = Math.hypot(x, z) * (1 + 0.16 * Math.cos(a * 8 + y * 22));
      p.setXYZ(i, Math.cos(a) * r, y, Math.sin(a) * r);
    }
    g.computeVertexNormals();
    return g;
  }

  function createCake(opts) {
    Engine.ensure();
    const T = cakeTextures();
    const scene = new THREE.Scene();
    scene.environment = makeEnvironment(Engine.renderer);
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);

    const hemi = new THREE.HemisphereLight(0xffe8f0, 0x2a1220, 0.25);
    scene.add(hemi);
    const key = new THREE.SpotLight(0xfff0e0, 1.5, 40, 0.5, 0.6, 1.2);
    key.position.set(4, 11, 7);
    key.target.position.set(0, 1.5, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    scene.add(key, key.target);
    const rim = new THREE.PointLight(0xff8fc8, 0.6, 25);
    rim.position.set(-6, 5, -6);
    scene.add(rim);

    // table that fades into the dark room
    const table = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ map: T.wood, roughness: 0.55, alphaMap: T.fade, transparent: true, envMapIntensity: 0.5 }));
    table.rotation.x = -Math.PI / 2;
    table.receiveShadow = true;
    scene.add(table);

    const cake = new THREE.Group();
    scene.add(cake);
    const shadowy = (o) => o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });

    // porcelain cake stand
    const porcelain = new THREE.MeshPhysicalMaterial({ color: 0xfbf8f4, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.06 });
    const stem = new THREE.Mesh(new THREE.LatheGeometry([[0.001, 0], [1.3, 0], [1.35, 0.04], [1.28, 0.1], [0.6, 0.22], [0.3, 0.42], [0.24, 0.75], [0.32, 0.9], [0.6, 0.98], [0.001, 0.98]].map(([r, y]) => new THREE.Vector2(r, y)), 64), porcelain);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 2.95, 0.1, 96), porcelain);
    plate.position.y = 1.03;
    const lip = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.05, 12, 96), porcelain);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = 1.08;
    cake.add(stem, plate, lip);
    shadowy(cake);

    // cake body with a slice cut out (so the red layers show)
    const R = 2, H = 1.8, Y0 = 1.08, GAP = 0.62;
    const sideMat = new THREE.MeshStandardMaterial({ map: T.side, bumpMap: T.side, bumpScale: 0.015, roughness: 0.78 });
    const topMat = new THREE.MeshStandardMaterial({ map: T.top, bumpMap: T.top, bumpScale: 0.01, roughness: 0.6 });
    const cutMat = new THREE.MeshStandardMaterial({ map: T.cut, bumpMap: T.cut, bumpScale: 0.03, roughness: 0.92, side: THREE.DoubleSide });
    const creamMat = new THREE.MeshPhysicalMaterial({ color: 0xf8f1e6, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.5, sheen: 0.4, sheenColor: new THREE.Color(0xffffff) });
    function wedge(start, len) {
      const g = new THREE.Group();
      // the texture wraps the full circle, so each piece only uses its share of it
      const tex = T.side.clone();
      tex.needsUpdate = true;
      tex.repeat.x = len / (Math.PI * 2);
      tex.offset.x = start >= 0 ? start / (Math.PI * 2) : 0.4; // avoid the texture seam
      const mat = sideMat.clone();
      mat.map = mat.bumpMap = tex;
      const side = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 128, 1, true, start, len), mat);
      side.position.y = H / 2;
      const topG = new THREE.CircleGeometry(R, 128, start - Math.PI / 2, len);
      topG.rotateX(-Math.PI / 2);
      const top = new THREE.Mesh(topG, topMat);
      top.position.y = H;
      const rimG = new THREE.TorusGeometry(R - 0.03, 0.05, 10, 128, len);
      rimG.rotateX(-Math.PI / 2);
      rimG.rotateY(start - Math.PI / 2);
      const rimM = new THREE.Mesh(rimG, creamMat);
      rimM.position.y = H - 0.01;
      g.add(side, top, rimM);
      for (const a of [start, start + len]) {
        const pg = new THREE.PlaneGeometry(R, H);
        pg.translate(R / 2, H / 2, 0);
        pg.rotateY(a - Math.PI / 2);
        g.add(new THREE.Mesh(pg, cutMat));
      }
      shadowy(g);
      return g;
    }
    const body = wedge(GAP / 2, Math.PI * 2 - GAP);
    body.position.y = Y0;
    cake.add(body);
    const slice = wedge(-GAP / 2, GAP);
    slice.position.set(0, Y0, 0.9);
    cake.add(slice);

    // rosettes, raspberries, mint and red velvet crumbs on top
    const rosG = rosetteGeometry();
    const inGap = (a) => Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < GAP / 2 + 0.14;
    const berrySpots = [];
    const addRosette = (parent, a, r, y) => {
      const m = new THREE.Mesh(rosG, creamMat);
      m.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
      m.rotation.y = rand(0, 6);
      m.castShadow = true;
      parent.add(m);
      return m.position;
    };
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + 0.2;
      if (inGap(a)) continue;
      const p = addRosette(body, a, R - 0.3, H);
      if (i % 2 === 0) berrySpots.push({ parent: body, p: p.clone().setY(H + 0.36) });
    }
    const sp = addRosette(slice, 0, R - 0.3, H);
    berrySpots.push({ parent: slice, p: sp.clone().setY(H + 0.36) });

    // raspberries: little clusters of glossy drupelets (instanced for speed)
    const drupeG = new THREE.SphereGeometry(0.038, 10, 8);
    const berryMat = new THREE.MeshPhysicalMaterial({ color: 0xa3102a, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    const perBerry = 46;
    berrySpots.forEach(({ parent, p }) => {
      const inst = new THREE.InstancedMesh(drupeG, berryMat, perBerry);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1);
      for (let k = 0; k < perBerry; k++) {
        const yv = 1 - (k / (perBerry - 1)) * 1.7;
        const rr = Math.sqrt(Math.max(0, 1 - yv * yv)), th = k * 2.39996;
        m4.compose(new THREE.Vector3(Math.cos(th) * rr * 0.11, yv * 0.13, Math.sin(th) * rr * 0.11), q, s);
        inst.setMatrixAt(k, m4);
      }
      inst.position.copy(p);
      inst.castShadow = true;
      parent.add(inst);
    });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f8f3a, roughness: 0.5 });
    const leafG = new THREE.SphereGeometry(1, 12, 8);
    berrySpots.slice(0, 4).forEach(({ parent, p }, i) => {
      const leaf = new THREE.Mesh(leafG, leafMat);
      leaf.scale.set(0.11, 0.015, 0.05);
      leaf.position.copy(p).add(new THREE.Vector3(0.12, 0.02, 0.05));
      leaf.rotation.set(0.3, i * 1.3, 0.4);
      parent.add(leaf);
    });
    const crumbG = new THREE.IcosahedronGeometry(0.032, 0);
    const crumbMat = new THREE.MeshStandardMaterial({ color: 0x74121e, roughness: 0.95 });
    const crumbs = new THREE.InstancedMesh(crumbG, crumbMat, 260);
    {
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      let k = 0;
      while (k < 260) {
        const a = rand(0, Math.PI * 2);
        const onTop = k < 170;
        if (onTop && inGap(a)) continue;
        const r = onTop ? rand(R - 0.55, R - 0.06) : rand(R + 0.1, 2.85);
        if (!onTop && Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.5) continue;
        const y = onTop ? Y0 + H + 0.012 : Y0 + 0.01;
        q.setFromEuler(e.set(rand(0, 6), rand(0, 6), rand(0, 6)));
        const sc = rand(0.5, 1.4);
        m4.compose(new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r), q, new THREE.Vector3(sc, sc * 0.7, sc));
        crumbs.setMatrixAt(k++, m4);
      }
    }
    cake.add(crumbs);

    // ---- glittery number candles ----
    const digits = (String(opts.age || "23").replace(/\D/g, "").slice(0, 3) || "23").split("");
    const candleMat = new THREE.MeshPhysicalMaterial({ color: 0xf6a2bd, metalness: 0.6, roughness: 0.32, roughnessMap: T.glitter, bumpMap: T.glitter, bumpScale: 0.004, clearcoat: 0.7, clearcoatRoughness: 0.15, envMapIntensity: 1.5 });
    const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xffcf6e, metalness: 1, roughness: 0.22, envMapIntensity: 1.6 });
    const pearlMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.12, clearcoat: 1, sheen: 1, sheenColor: new THREE.Color(0xffd6ea) });
    const TUBE = 0.09, FLAT = 0.55, DS = 1.05;
    const capG = new THREE.SphereGeometry(TUBE, 20, 14);
    capG.scale(1, 1, FLAT);
    const pearlG = new THREE.SphereGeometry(0.024, 12, 10);
    const outerFlameG = flameGeometry(0.36, 0.085), coreFlameG = flameGeometry(0.2, 0.04);
    const outerFlameM = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    const coreFlameM = new THREE.MeshBasicMaterial({ color: 0xfff4d6, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    const candles = [], flameTargets = [], glints = [];
    const spacing = 0.74 * DS;
    digits.forEach((d, i) => {
      const g = new THREE.Group();
      const pts = [];
      DIGITS[d]().forEach((curve) => {
        const closed = !!curve.closed;
        const tg = new THREE.TubeGeometry(curve, 120, TUBE, 20, closed);
        tg.scale(1, 1, FLAT);
        g.add(new THREE.Mesh(tg, candleMat));
        if (!closed) for (const t of [0, 1]) { const cap = new THREE.Mesh(capG, candleMat); cap.position.copy(curve.getPoint(t)); g.add(cap); }
        // sugar pearls + gold beads along the front and back
        const n = Math.max(3, Math.floor(curve.getLength() / 0.1));
        for (let k = 0; k < n; k++) {
          const p = curve.getPointAt((k + 0.5) / n);
          for (const z of [TUBE * FLAT, -TUBE * FLAT]) {
            const b = new THREE.Mesh(pearlG, k % 2 ? goldMat : pearlMat);
            b.position.set(p.x, p.y, z);
            g.add(b);
          }
        }
        for (let k = 0; k <= 40; k++) pts.push(curve.getPoint(k / 40));
      });
      const top = pts.reduce((a, b) => (b.y > a.y ? b : a));
      const bottom = pts.reduce((a, b) => (b.y < a.y ? b : a));
      // gold holder stick into the cake
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 12), goldMat);
      stick.position.set(bottom.x, bottom.y - 0.2, 0);
      g.add(stick);
      // wick + flame
      const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0x1a0d08, roughness: 1 }));
      wick.position.set(top.x, top.y + TUBE + 0.04, 0);
      g.add(wick);
      const flame = new THREE.Group();
      flame.position.set(top.x, top.y + TUBE + 0.08, 0);
      flame.add(new THREE.Mesh(outerFlameG, outerFlameM));
      const core = new THREE.Mesh(coreFlameG, coreFlameM);
      core.position.y = 0.02;
      flame.add(core);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffa040, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
      glow.scale.set(0.9, 0.9, 1);
      glow.position.y = 0.16;
      flame.add(glow);
      const halo = new THREE.Sprite(glow.material.clone());
      halo.material.opacity = 0.16;
      halo.scale.set(2.6, 2.6, 1);
      halo.position.y = 0.16;
      flame.add(halo);
      g.add(flame);
      const light = new THREE.PointLight(0xffa24d, 1.1, 9, 2);
      light.position.set(top.x, top.y + 0.35, 0.1);
      g.add(light);
      const hit = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.copy(flame.position).add(new THREE.Vector3(0, 0.15, 0));
      g.add(hit);
      // twinkling glints around the candle
      for (let k = 0; k < 6; k++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xfff2c0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
        s.position.set(rand(-0.1, 0.7), rand(0.1, 1.0), rand(-0.15, 0.15));
        s.userData.ph = rand(0, 6.28);
        g.add(s);
        glints.push(s);
      }
      g.scale.setScalar(DS);
      g.position.set((i - (digits.length - 1) / 2) * spacing - 0.31 * DS, Y0 + H + 0.42, -0.35);
      g.traverse((o) => { if (o.isMesh) { o.userData.candle = g; if (o !== hit && o.material.blending !== THREE.AdditiveBlending) o.castShadow = true; } });
      g.userData = { lit: true, flame, light, ph: rand(0, 6.28) };
      flameTargets.push(g);
      cake.add(g);
      candles.push(g);
    });

    scene.add(sparkles(160, 12, 0xffd9b0, 0.1));

    // smoke
    const smoke = [];
    const smokeMat = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xbbbbbb, transparent: true, opacity: 0.4, depthWrite: false });
    function puff(pos) {
      for (let i = 0; i < 8; i++) {
        const s = new THREE.Sprite(smokeMat.clone());
        s.position.copy(pos);
        s.scale.setScalar(0.15);
        s.userData = { v: new THREE.Vector3(rand(-0.12, 0.12), rand(0.45, 0.85), rand(-0.12, 0.12)), life: 1 + i * 0.12 };
        scene.add(s);
        smoke.push(s);
      }
    }

    const bursts = [];
    let rotY = -0.35, targetY = -0.35, idle = 0, canBlow = false, litCount = candles.length;
    const ray = new THREE.Raycaster();

    function extinguish(g) {
      const d = g.userData;
      if (!d.lit) return;
      d.lit = false;
      litCount--;
      gsap.to(d.flame.scale, { x: 0, y: 0, z: 0, duration: 0.25, ease: "power2.in" });
      gsap.to(d.light, { intensity: 0, duration: 0.35 });
      const wp = new THREE.Vector3();
      d.flame.getWorldPosition(wp);
      puff(wp);
      opts.onCandle && opts.onCandle(candles.length - litCount, candles.length);
      if (litCount === 0) {
        setTimeout(() => {
          gsap.to(hemi, { intensity: 0.7, duration: 1.5 });
          gsap.to(key, { intensity: 2.1, duration: 1.5 });
          makeBurst(scene, new THREE.Vector3(0, 4.2, 0), 0xff5c97, bursts, 50);
          opts.onAllOut && opts.onAllOut();
        }, 600);
      }
    }

    return {
      scene, camera,
      render: { toneMapping: THREE.ACESFilmicToneMapping, exposure: 1.15 },
      digits,
      setCanBlow(v) { canBlow = v; },
      blowOne() {
        const lit = candles.filter((c) => c.userData.lit);
        if (lit.length) extinguish(pick(lit));
      },
      resize(w, h) {
        camera.aspect = w / h;
        const z = camera.aspect < 1 ? 11.5 / Math.max(camera.aspect * 1.25, 0.55) : 11.5;
        camera.position.set(0, 5.4 + (z - 11.5) * 0.25, z);
        camera.lookAt(0, 2.4, 0);
        camera.updateProjectionMatrix();
      },
      onDrag(dx) { targetY += dx * 0.01; idle = 0; },
      onTap(ndc) {
        if (!canBlow) return FX.toast("Make your wish first ✨");
        ray.setFromCamera(ndc, camera);
        const hit = ray.intersectObjects(flameTargets, true).find((h) => h.object.userData.candle);
        if (hit) extinguish(hit.object.userData.candle);
      },
      update(dt, t) {
        idle += dt;
        if (idle > 2.5) targetY += dt * 0.12;
        rotY += (targetY - rotY) * 0.08;
        cake.rotation.y = rotY;
        for (const c of candles) {
          const d = c.userData;
          if (!d.lit) continue;
          const f = 1 + Math.sin(t * 17 + d.ph) * 0.06 + Math.sin(t * 6.3 + d.ph) * 0.05;
          d.flame.scale.set(1 - (f - 1) * 0.5, f, 1 - (f - 1) * 0.5);
          d.flame.rotation.z = Math.sin(t * 4.2 + d.ph) * 0.07;
          d.light.intensity = 1.0 + Math.sin(t * 14 + d.ph) * 0.15 + Math.sin(t * 31 + d.ph) * 0.06;
        }
        for (const s of glints) {
          const k = Math.max(0, Math.sin(t * 2.2 + s.userData.ph));
          s.material.opacity = Math.pow(k, 8) * 0.9;
          s.scale.setScalar(0.08 + Math.pow(k, 8) * 0.18);
        }
        for (let i = smoke.length - 1; i >= 0; i--) {
          const s = smoke[i], d = s.userData;
          s.position.addScaledVector(d.v, dt);
          s.scale.addScalar(dt * 0.5);
          d.life -= dt * 0.45;
          s.material.opacity = Math.max(0, d.life * 0.3);
          if (d.life <= 0) { scene.remove(s); smoke.splice(i, 1); }
        }
        updateBurst(scene, bursts, dt);
      },
    };
  }

  window.Scenes = { Engine, createPlayground, createCake };
})();
