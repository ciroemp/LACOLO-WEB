(() => {
  const ids = ['inicio','proyectos','menu','paquetes','contacto'];
  const names = ['Inicio','Proyectos','Menú','Paquetes','Contacto'];
  const N = ids.length;
  const app = document.getElementById('app'), cam = document.getElementById('cam'), strip = document.getElementById('strip');
  const far = document.getElementById('far'), near = document.getElementById('near');
  const fctx = far.getContext('2d'), nctx = near.getContext('2d');
  const sts = [...document.querySelectorAll('.st')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, dpr = 1, roofPx = 120, curbPx = 100;
  let x = 0, cur = 0, anim = null, lampOn = reduce ? 1 : 0;

  // navegación
  const nav = document.getElementById('nav');
  ids.forEach((id, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" data-go="${id}"><span class="dot"></span><span class="txt">${names[i]}</span></button>`;
    nav.appendChild(li);
  });

  function updateUI() {
    nav.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-current', i === cur ? 'true' : 'false'));
    sts.forEach((s, i) => { s.inert = i !== cur; });
    document.getElementById('aqui').textContent = names[cur];
    document.getElementById('prev').disabled = cur === 0;
    document.getElementById('next').disabled = cur === N - 1;
    try { history.replaceState(null, '', '#' + ids[cur]); } catch (e) {}
  }

  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function go(i, instant) {
    i = Math.max(0, Math.min(N - 1, i));
    if (i === cur && !instant) return;
    cur = i; updateUI();
    if (anim) cancelAnimationFrame(anim);
    if (instant || reduce) { x = i; cam.style.transform = ''; render(); anim = null; return; }
    const from = x, to = i, dur = 1250 + Math.abs(to - from) * 260, t0 = performance.now();
    const step = now => {
      const t = Math.min(1, (now - t0) / dur);
      x = from + (to - from) * ease(t);
      cam.style.transform = `scale(${1 - 0.075 * Math.sin(Math.PI * t)})`;
      render();
      if (t < 1) anim = requestAnimationFrame(step); else { anim = null; cam.style.transform = ''; }
    };
    anim = requestAnimationFrame(step);
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    const s = b.getAttribute('data-servicio');
    if (s) { sel.value = s; updateLink(); }
    go(ids.indexOf(b.dataset.go));
  });
  document.getElementById('prev').onclick = () => go(cur - 1);
  document.getElementById('next').onclick = () => go(cur + 1);

  // rueda, teclado, gestos
  let acc = 0, lockUntil = 0;
  app.addEventListener('wheel', e => {
    if (e.ctrlKey || e.target.closest('textarea,select')) return;
    const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    const d = horiz ? e.deltaX : e.deltaY;
    const sc = sts[cur].querySelector('.inner');
    if (!horiz) {
      if (d > 0 && sc.scrollTop + sc.clientHeight < sc.scrollHeight - 2) return;
      if (d < 0 && sc.scrollTop > 2) return;
    }
    e.preventDefault();
    const now = performance.now();
    if (anim || now < lockUntil) { acc = 0; return; }
    acc += d;
    if (Math.abs(acc) > 40) { go(cur + (acc > 0 ? 1 : -1)); acc = 0; lockUntil = now + 650; }
  }, { passive: false });
  addEventListener('keydown', e => {
    if (e.target.closest('input,textarea,select')) return;
    if (['ArrowRight','PageDown'].includes(e.key)) { e.preventDefault(); go(cur + 1); }
    else if (['ArrowLeft','PageUp'].includes(e.key)) { e.preventDefault(); go(cur - 1); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(N - 1);
  });
  let tx = 0, ty = 0;
  app.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  app.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) go(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // escena: cielo, volcán y techos (capa lejana)
  function rng(seed) { return () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646); }
  let blds = [], stars = [], drops = [];
  const FAR = 0.32, NEAR = 1.3;
  function buildScene() {
    const r = rng(11); blds = [];
    let wx = -60; const total = W * (1 + (N - 1) * FAR) + 120;
    while (wx < total) {
      const w = 26 + r() * 96;
      blds.push({ x: wx, w, h: 10 + r() * 62, sh: r(), tin: r() < .38, tx: r(), ant: r() < .28, ax: r(), win: r() < .35, wx2: r() });
      wx += w + (r() < .18 ? 6 + r() * 26 : 0);
    }
    const s = rng(5); stars = [];
    for (let i = 0; i < 70; i++) stars.push({ x: s() * W * 1.4, y: s() * roofPx * .8, a: .25 + s() * .6 });
    const d = rng(3); drops = [];
    const count = Math.round(W * H / 9000);
    for (let i = 0; i < count; i++) drops.push({ x: d() * W * 1.2, y: d() * H, l: 8 + d() * 14, v: .55 + d() * .5 });
  }

  function drawFar() {
    const c = fctx; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    const base = roofPx + 30;
    const g = c.createLinearGradient(0, 0, 0, base);
    g.addColorStop(0, '#05070e'); g.addColorStop(.7, '#111729'); g.addColorStop(1, '#2a2430');
    c.fillStyle = g; c.fillRect(0, 0, W, base + 40);
    for (const s of stars) { c.fillStyle = `rgba(239,230,211,${s.a})`; c.fillRect(s.x - x * W * .04, s.y, 1.4, 1.4); }
    // luna
    const mx = W * .78 - x * W * .05, my = Math.max(70, roofPx * .5);
    c.fillStyle = 'rgba(239,230,211,.08)'; c.beginPath(); c.arc(mx, my, 34, 0, 7); c.fill();
    c.fillStyle = '#e9e2cf'; c.beginPath(); c.arc(mx, my, 15, 0, 7); c.fill();
    // volcán con cráter
    const vx = W * 1.55 - x * W * .12, vw = Math.max(W * .42, 360), peak = Math.max(58, roofPx * .38);
    c.fillStyle = '#121a2d'; c.beginPath();
    c.moveTo(vx - vw * 1.5, base);
    c.quadraticCurveTo(vx - vw * .5, peak + (base - peak) * .35, vx - vw * .14, peak);
    c.lineTo(vx - vw * .04, peak + 5); c.lineTo(vx + vw * .07, peak + 4); c.lineTo(vx + vw * .16, peak);
    c.quadraticCurveTo(vx + vw * .6, peak + (base - peak) * .4, vx + vw * 1.7, base);
    c.closePath(); c.fill();
    // bruma naranja de la ciudad
    const hz = c.createLinearGradient(0, roofPx - 60, 0, base);
    hz.addColorStop(0, 'rgba(255,150,60,0)'); hz.addColorStop(1, 'rgba(255,150,60,.16)');
    c.fillStyle = hz; c.fillRect(0, roofPx - 60, W, 90);
    // techos de la colonia
    const off = -x * W * FAR, top0 = roofPx + 4;
    for (const b of blds) {
      const bx = b.x + off; if (bx > W || bx + b.w < 0) continue;
      const ty = top0 - b.h;
      c.fillStyle = `rgb(${12 + b.sh * 8},${16 + b.sh * 9},${28 + b.sh * 12})`;
      c.fillRect(bx, ty, b.w, b.h + 60);
      c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(bx, ty, b.w, 2);
      if (b.tin) { const tx = bx + 6 + b.tx * (b.w - 24); c.fillStyle = '#0a0d16'; c.fillRect(tx, ty - 15, 14, 15); c.beginPath(); c.ellipse(tx + 7, ty - 15, 7, 3, 0, 0, 7); c.fill(); }
      if (b.ant) { const ax = bx + 4 + b.ax * (b.w - 8); c.strokeStyle = '#0a0d16'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(ax, ty); c.lineTo(ax, ty - 22); c.moveTo(ax - 7, ty - 16); c.lineTo(ax + 7, ty - 16); c.moveTo(ax - 4, ty - 10); c.lineTo(ax + 4, ty - 10); c.stroke(); }
      if (b.win) { c.fillStyle = 'rgba(255,207,122,.75)'; c.fillRect(bx + 6 + b.wx2 * (b.w - 18), ty + 8, 7, 5); }
    }
  }

  // escena: postes, cables, zapatos colgados y lluvia (capa cercana)
  function quad(p0, p1, p2, t) { const u = 1 - t; return u * u * p0 + 2 * u * t * p1 + t * t * p2; }
  function drawNear(now) {
    const c = nctx; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    const y0 = Math.max(64, roofPx * .5), foot = H - curbPx * .42;
    const poles = [];
    for (let k = 0; k <= N; k++) poles.push((k - x) * W * NEAR + 4);
    // cables
    c.strokeStyle = 'rgba(4,5,9,.95)'; c.lineWidth = 1.6;
    for (let k = 0; k < N; k++) {
      const a = poles[k], b = poles[k + 1];
      if (b < -50 || a > W + 50) continue;
      for (let j = 0; j < 3; j++) {
        const ya = y0 - 14 + j * 8, sag = 26 + j * 10;
        c.beginPath(); c.moveTo(a, ya); c.quadraticCurveTo((a + b) / 2, ya + sag * 2, b, ya); c.stroke();
        if (k === 1 && j === 1) {
          // zapatos colgados del cable
          const t = .58, sx = quad(a, (a + b) / 2, b, t), sy = quad(ya, ya + sag * 2, ya, t);
          const sw = reduce ? 0 : Math.sin(now / 900) * .12;
          c.save(); c.translate(sx, sy); c.rotate(sw);
          c.strokeStyle = 'rgba(239,230,211,.55)'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(0, 0); c.lineTo(-7, 30); c.moveTo(0, 0); c.lineTo(8, 36); c.stroke();
          c.fillStyle = '#d8412f'; c.beginPath(); c.roundRect(-16, 30, 18, 9, 4); c.fill();
          c.fillStyle = '#efe6d3'; c.fillRect(-16, 37, 18, 3);
          c.fillStyle = '#d8412f'; c.beginPath(); c.roundRect(2, 36, 18, 9, 4); c.fill();
          c.fillStyle = '#efe6d3'; c.fillRect(2, 43, 18, 3);
          c.restore(); c.strokeStyle = 'rgba(4,5,9,.95)'; c.lineWidth = 1.6;
        }
      }
    }
    // postes y lámparas
    for (const p of poles) {
      if (p < -260 || p > W + 40) continue;
      c.fillStyle = '#06080d'; c.fillRect(p - 4, y0 - 32, 8, foot - y0 + 32);
      c.fillRect(p - 18, y0 - 22, 36, 4);
      c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(p - 4, y0 - 32, 2, foot - y0 + 32);
      // brazo + lámpara
      c.strokeStyle = '#06080d'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(p, y0 + 14); c.quadraticCurveTo(p + 40, y0 - 6, p + 74, y0 + 2); c.stroke();
      c.fillStyle = '#06080d'; c.beginPath(); c.ellipse(p + 78, y0 + 4, 14, 5, 0, 0, 7); c.fill();
      if (lampOn > 0) {
        c.save(); c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(p + 78, y0 + 8, 2, p + 78, y0 + 8, 240);
        g.addColorStop(0, `rgba(255,190,90,${.55 * lampOn})`); g.addColorStop(.25, `rgba(255,170,70,${.16 * lampOn})`); g.addColorStop(1, 'rgba(255,150,60,0)');
        c.fillStyle = g; c.fillRect(p - 170, y0 - 240, 500, 500);
        c.fillStyle = `rgba(255,220,150,${.95 * lampOn})`; c.beginPath(); c.ellipse(p + 78, y0 + 8, 9, 2.5, 0, 0, 7); c.fill();
        const pool = c.createRadialGradient(p + 90, H - curbPx * .78, 4, p + 90, H - curbPx * .78, 160);
        pool.addColorStop(0, `rgba(255,180,80,${.22 * lampOn})`); pool.addColorStop(1, 'rgba(255,180,80,0)');
        c.fillStyle = pool; c.fillRect(p - 80, H - curbPx * 1.2, 340, curbPx);
        c.restore();
      }
    }
    // lluvia
    c.strokeStyle = 'rgba(200,212,238,.26)'; c.lineWidth = 1; c.beginPath();
    for (const d of drops) { c.moveTo(d.x, d.y); c.lineTo(d.x - d.l * .22, d.y + d.l); }
    c.stroke();
  }

  let last = 0;
  function loop(now) {
    const dt = Math.min(50, now - (last || now)); last = now;
    if (lampOn < 1) lampOn = Math.min(1, lampOn + dt / 900 * (Math.random() < .12 ? -.6 : 1));
    for (const d of drops) {
      d.y += d.v * dt; d.x -= d.v * dt * .22;
      if (d.y > H) { d.y = -20; d.x = Math.random() * W * 1.2; }
      if (d.x < -20) d.x += W * 1.2;
    }
    drawNear(now);
    if (!document.hidden) requestAnimationFrame(loop); else last = 0;
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduce) requestAnimationFrame(loop); });

  function render() {
    strip.style.transform = `translate3d(${-x * W}px,0,0)`;
    drawFar();
    if (reduce) drawNear(0);
  }

  function measure() {
    W = app.clientWidth; H = app.clientHeight; dpr = Math.min(2, devicePixelRatio || 1);
    app.style.setProperty('--W', W + 'px');
    for (const cv of [far, near]) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const wall = sts[0].querySelector('.wall');
    roofPx = wall.offsetTop; curbPx = H - (wall.offsetTop + wall.offsetHeight);
    buildScene(); render();
  }
  addEventListener('resize', measure);

  // formulario → WhatsApp
  const TEL = '50377471010';
  const sel = document.getElementById('f-servicio'), enviar = document.getElementById('enviar'), err = document.getElementById('error');
  const val = id => document.getElementById(id).value.trim();
  function updateLink() {
    const partes = ['¡Hola LACOLO!'];
    if (val('f-nombre')) partes.push(`Soy ${val('f-nombre')}.`);
    if (sel.value) partes.push(`Me interesa: ${sel.value}.`);
    if (val('f-fecha')) partes.push(`Fecha que me gustaría: ${val('f-fecha')}.`);
    if (val('f-msg')) partes.push(val('f-msg'));
    enviar.href = `https://wa.me/${TEL}?text=${encodeURIComponent(partes.join(' '))}`;
    if (sel.value) err.textContent = '';
  }
  document.getElementById('form').addEventListener('input', updateLink);
  document.getElementById('form').addEventListener('submit', e => e.preventDefault());
  enviar.addEventListener('click', e => {
    if (!sel.value) { e.preventDefault(); err.textContent = 'Elegí un servicio para saber qué cotizarte.'; sel.focus(); }
  });
  document.getElementById('copiar').addEventListener('click', e => {
    const btn = e.currentTarget;
    const ok = () => { btn.textContent = 'Copiado'; setTimeout(() => btn.textContent = 'Copiar', 1600); };
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(document.getElementById('numero')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText('+503 7747-1010').then(ok, fallback); } catch (_) { fallback(); }
  });

  // beat de la casa (Web Audio, 88 BPM, boom bap)
  const radio = document.getElementById('radio'), beatBtn = document.getElementById('beat'), beatTxt = document.getElementById('beat-txt');
  let ac = null, master, noiseBuf, timer = null, nextT = 0, stepN = 0, crackle = null;
  const BPM = 88, S16 = 60 / BPM / 4;
  const KICK = [0, 3, 10], SNARE = [4, 12];
  const CHORDS = [[220, 261.63, 329.63, 392], [174.61, 220, 261.63, 329.63]];
  function initAudio() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ac.createDynamicsCompressor(); master = ac.createGain(); master.gain.value = 0;
    master.connect(comp); comp.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function env(g, t, peak, dec) { g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(.0008, t + dec); }
  function kick(t) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + .14); env(g, t, .95, .42); o.connect(g).connect(master); o.start(t); o.stop(t + .45); }
  function noiseHit(t, type, f, peak, dec) { const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; fl.type = type; fl.frequency.value = f; env(g, t, peak, dec); s.connect(fl).connect(g).connect(master); s.start(t); s.stop(t + dec + .02); }
  function snare(t) { noiseHit(t, 'bandpass', 1900, .55, .2); const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = 185; env(g, t, .3, .1); o.connect(g).connect(master); o.start(t); o.stop(t + .12); }
  function chord(t, notes) {
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300; lp.connect(master);
    notes.forEach(f => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = Math.random() * 10 - 5;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.07, t + .05); g.gain.exponentialRampToValueAtTime(.001, t + S16 * 15); o.connect(g).connect(lp); o.start(t); o.stop(t + S16 * 16); });
    const b = ac.createOscillator(), bg = ac.createGain(); b.frequency.value = notes[0] / 4; env(bg, t, .45, S16 * 7); b.connect(bg).connect(master); b.start(t); b.stop(t + S16 * 8);
  }
  function schedule() {
    while (nextT < ac.currentTime + .12) {
      const s = stepN % 16, swing = s % 2 ? S16 * .16 : 0, t = nextT + swing;
      if (KICK.includes(s)) kick(t);
      if (SNARE.includes(s)) snare(t);
      if (s % 2 === 0) noiseHit(t, 'highpass', 7200, s % 4 ? .09 : .14, .045);
      if (s === 0) chord(t, CHORDS[Math.floor(stepN / 16) % 2]);
      nextT += S16; stepN++;
    }
  }
  function startCrackle() { const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; s.loop = true; fl.type = 'highpass'; fl.frequency.value = 3500; g.gain.value = .012; s.connect(fl).connect(g).connect(master); s.start(); crackle = s; }
  beatBtn.addEventListener('click', async () => {
    const on = beatBtn.getAttribute('aria-pressed') !== 'true';
    try {
      if (on) {
        if (!ac) initAudio();
        await ac.resume();
        master.gain.cancelScheduledValues(ac.currentTime); master.gain.setTargetAtTime(.55, ac.currentTime, .15);
        nextT = ac.currentTime + .05; stepN = 0; if (!crackle) startCrackle();
        timer = setInterval(schedule, 25);
        beatTxt.textContent = 'Beat de la casa · 88 BPM';
      } else {
        clearInterval(timer); timer = null;
        master.gain.setTargetAtTime(0, ac.currentTime, .12);
        beatTxt.textContent = 'Beat apagado · tocá para encender';
      }
      beatBtn.setAttribute('aria-pressed', on); beatBtn.setAttribute('aria-label', on ? 'Apagar beat' : 'Encender beat');
      radio.classList.toggle('on', on);
    } catch (e) { beatTxt.textContent = 'Este navegador no deja reproducir audio'; }
  });

  // arranque
  measure();
  const start = Math.max(0, ids.indexOf(location.hash.slice(1)));
  go(start, true); updateUI();
  addEventListener('hashchange', () => { const i = ids.indexOf(location.hash.slice(1)); if (i >= 0) go(i); });
  if (!reduce) requestAnimationFrame(loop); else drawNear(0);
  if (document.fonts) document.fonts.ready.then(measure);
})();
