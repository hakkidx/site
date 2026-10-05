/* ============ AYARLAR (CONFIG) — buradan değiştir ============ */
const CONFIG = {
  girlfriendName: "Aleyna",
  myName: "Hakkı",
  meetingDate: "14 Mayıs 2026",
  songUrl: "https://youtu.be/rUKMIsDOT4Y", // boşsa şarkı butonu görünmez
  finalMessage: "Sen benim için çok değerlisin.",
  storyTexts: {
    firstMeeting: "14.05.2026 tarihinde ilk kez oyun oynadık.",
    firstMemory: "Birbirimize açıldığımız ilk anı hala unutmadım. Senin de unutmadığını biliyorum. Yaşadığımız her an benim için çok değerli",
    today: "Kavga ettiysek bile hatırlamıyorum. Anlaşamadığımız anlar da olsa önemli değil bunların hepsi ilişkide olabilecek şeyler, senden ayrı olmak istemiyorum fakat seni özlemeyi bile seviyorum."
  },
  romanticMessage:
    "Hayatıma girdiğin günden beri birçok şey daha güzel.\n" +
    "Seninle güldüğüm, konuştuğum ve geçirdiğim her an benim için çok değerli.\n" +
    "Belki bunu her zaman söylemiyorum ama seni gerçekten çok seviyorum.\n" +
    "İyi ki varsın. ❤️",
  scratchMessage: "Aramızda kilometreler olsa da kalbim hep yanında ❤️",
  coupons: [
    "Bir gün senin seçtiğin bir filmi izleriz",
    "Bir gün benden istediğin bir şeyi 'hayır' demeden yaparım",
    "Bir gece sabaha kadar seninle sohbet ederim",
    "Bir akşam sadece senin zevkine göre müzik dinleriz",
    "Bir gün boyunca sadece senin sevdiğin şeylerden konuşuruz",
    "Sana bir şiir yazarım",
  ],
  photos: [
    { src: "images/spidey-love.jpg", alt: "Spider-Man", caption: "Bütün evrenlerdeki en favori insanımsın" },
    { src: "images/foto1.jpg", alt: "Birlikte fotoğrafımız 1", caption: "İlk oynadığımız oyun" },
    { src: "images/foto2.jpg", alt: "Birlikte fotoğrafımız 2", caption: "İlk tek çiftimiz" },
    { src: "images/foto3.jpg", alt: "Birlikte fotoğrafımız 3", caption: "Minecrafttan bazı fotoğraflar..." },
    { src: "images/foto4.jpg", alt: "Birlikte fotoğrafımız 4", caption: "Sana özel bir websitede spiderman olmadan olur mu?" }
  ]
};
/* ============================================================ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rand = (a, b) => a + Math.random() * (b - a);
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const K = RM ? 0.25 : 1;
const CHAR_MS = RM ? 6 : 45;
const NO_LINES = ["Emin misin? 🥺", "Bir daha düşün... 👉👈", "Bence cevabını biliyorsun... ❤️", "Hayır demene izin vermiyorum artık 😭", "Ben hallederim. 🕸️🐼"];
const FX = { gallery: 0.8, scratch: 0.7, coupons: 0.7, message: 0.6, surprise: 0.45, final: 0.6 };

let current = "intro", noCount = 0;
const noBtn = $("#noBtn");

/* ---------- Scoped timers ---------- */
const scoped = {};
function later(fn, ms, scope = "nav") {
  const set = (scoped[scope] ||= new Set());
  const id = setTimeout(() => { set.delete(id); fn(); }, ms);
  set.add(id);
}
function clearScope(scope) { scoped[scope]?.forEach(clearTimeout); scoped[scope]?.clear(); }
const clearAllTimers = () => Object.keys(scoped).forEach(clearScope);

/* ---------- Config'i sayfaya yaz ---------- */
function fillConfig() {
  $$("[data-cfg]").forEach(e => {
    e.textContent = e.dataset.cfg.split(".").reduce((o, k) => o[k], CONFIG);
  });
  if (CONFIG.songUrl) { $("#songBtn").href = CONFIG.songUrl; $("#songBtn").hidden = false; }
}

/* ---------- Panda ---------- */
function buildPandas() {
  $$("[data-panda]").forEach(c => c.appendChild($("#pandaT").content.cloneNode(true)));
}
function setMood(m) { $$(".panda").forEach(p => (p.dataset.mood = m)); }

/* ---------- Canvas particles ---------- */
const cv = $("#fx"), cx = cv.getContext("2d");
let W, H, D = 1, SMALL = false, MAX = 110, MIN_DT = 0, lastT = 0, ambLevel = 1;
let parts = [], typing = null, emitFinal = false, nextEmit = 0;
const sprites = new Map();

function resize() {
  W = innerWidth; H = innerHeight; SMALL = W < 600;
  const d = Math.min(devicePixelRatio || 1, SMALL ? 1.5 : 2);
  if (d !== D) { D = d; sprites.clear(); parts.forEach(p => (p.sp = null)); }
  MAX = SMALL ? 55 : 110; MIN_DT = SMALL ? 30 : 0;
  cv.width = Math.round(W * D); cv.height = Math.round(H * D);
  if (noBtn && noBtn.classList.contains("fly")) clampNo();
}

function sprite(p) {
  const key = (p.e || p.c) + "|" + p.q;
  let s = sprites.get(key);
  if (!s) {
    const side = Math.ceil(p.q * 1.6), c = document.createElement("canvas"), g = c.getContext("2d");
    c.width = c.height = Math.ceil(side * D); g.scale(D, D);
    if (p.e) { g.font = p.q + "px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(p.e, side / 2, side / 2); }
    else {
      g.fillStyle = p.c; g.globalAlpha = 0.3; g.beginPath(); g.arc(side / 2, side / 2, p.q / 2, 0, 6.28); g.fill();
      g.globalAlpha = 1; g.beginPath(); g.arc(side / 2, side / 2, p.q / 5, 0, 6.28); g.fill();
    }
    s = { c, side }; sprites.set(key, s);
  }
  return s;
}

function spawn(e, x, y, o = {}) {
  if (parts.length >= MAX) return;
  const s = o.s || rand(14, 26);
  parts.push({ e, x, y, s, q: Math.max(4, Math.round(s / 2) * 2), sp: null,
    vx: o.vx ?? rand(-0.4, 0.4) * K, vy: o.vy ?? rand(0.4, 1) * K,
    r: rand(0, 6), vr: o.vr ?? rand(-0.02, 0.02) * K, a: o.a ?? 0.85, life: o.life || 0, max: o.life || 0, g: o.g || 0,
    amb: !!o.amb, c: o.c || "#fff4d6", t: rand(0, 6.28), sw: o.sw || 0, sf: o.sf || 0, k: Math.random() });
}
const createPetal = (x, y, o) => spawn(Math.random() < 0.5 ? "🌸" : "🌷", x, y, o);
const createHeart = (x, y, o) => spawn(Math.random() < 0.5 ? "❤️" : "💗", x, y, { s: rand(12, 22), ...o });
const createSpark = (x, y, o) => spawn("", x, y, { s: rand(3, 7), vr: 0.03, ...o });

function seedAmbient() {
  parts = [];
  const n = (RM ? 3 : 1) * (SMALL ? 2 : 1), sway = () => ({ sw: rand(0.15, 0.45), sf: rand(0.006, 0.016) });
  const cols = ["#fff4d6", "#ff9db5", "#a9bcff"];
  for (let i = 0; i < 10 / n; i++) createPetal(rand(0, W), rand(0, H), { amb: 1, vx: rand(-0.08, 0.08), vy: rand(0.12, 0.34) * K, vr: rand(-0.008, 0.008) * K, ...sway() });
  for (let i = 0; i < 7 / n; i++) createHeart(rand(0, W), rand(0, H), { amb: 1, vx: rand(-0.05, 0.05), vy: -rand(0.1, 0.28) * K, vr: rand(-0.005, 0.005) * K, a: 0.55, ...sway() });
  for (let i = 0; i < 14 / n; i++) createSpark(rand(0, W), rand(0, H), { amb: 1, vx: 0, vy: rand(-0.06, 0.1) * K, vr: rand(0.01, 0.025) * K, a: 0.8, c: cols[i % 3], ...sway() });
}
const PALS = [["#ffb3c9", "#ff8fb1", "#fff"], ["#ff4d6d", "#ff8fb1", "#d1103a"], ["#ff2d4f", "#3a5bd9", "#1b2a6b", "#9db4ff"]];
function confetti(x, y, n = 40, pal = PALS[0]) {
  n = Math.round(n * (SMALL ? 0.45 : 0.75)) / (RM ? 4 : 1);
  for (let i = 0; i < n; i++) {
    const a = rand(0, 6.28), s = rand(2, 7), o = { vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, g: 0.08, life: rand(90, 160), a: 1 }, k = i % 5;
    if (k === 0) createHeart(x, y, o);
    else if (k === 1) createPetal(x, y, o);
    else if (k === 2) spawn("🕸️️", x, y, { ...o, s: rand(14, 20) });
    else createSpark(x, y, { ...o, s: rand(10, 16), c: pal[i % pal.length] });
  }
}
function fadeTemp() { parts.forEach(p => { if (!p.amb) { p.life = Math.min(p.life, 40); p.max = 100; } }); }

function frame(t) {
  requestAnimationFrame(frame);
  const dt = t - lastT;
  if (dt < MIN_DT) return;
  lastT = t;
  const k = Math.min(dt, 50) / 16.67;
  if (typing) stepTyping(t);
  if (emitFinal && t >= nextEmit) emitFinalParticles(t);
  cx.setTransform(1, 0, 0, 1, 0, 0);
  cx.clearRect(0, 0, cv.width, cv.height);
  for (let i = parts.length; i--;) {
    const p = parts[i];
    if (p.amb) { if (p.k > ambLevel) continue; }
    else if ((p.life -= k) <= 0) { parts.splice(i, 1); continue; }
    p.vy += p.g * k; p.x += p.vx * k; p.y += p.vy * k; p.r += p.vr * k;
    if (p.sf) { p.t += p.sf * k; p.x += Math.sin(p.t) * p.sw * k; }
    if (p.amb) {
      if (p.y > H + 30) p.y = -30; else if (p.y < -30) p.y = H + 30;
      if (p.x < -30) p.x = W + 30; else if (p.x > W + 30) p.x = -30;
    } else if (p.x < -50 || p.x > W + 50 || p.y > H + 50 || p.y < -80) { parts.splice(i, 1); continue; }
    let a = p.a * (p.max ? Math.min(1, p.life / (p.max * 0.4)) : 1);
    if (p.amb) a *= 0.7 + 0.3 * Math.sin(p.t * 0.6 + 1);
    if (!p.e) a *= 0.6 + 0.4 * Math.sin(p.r);
    if (a < 0.02) continue;
    const s = p.sp || (p.sp = sprite(p)), c = Math.cos(p.r) * D, n = Math.sin(p.r) * D, h = s.side / 2;
    cx.globalAlpha = a;
    cx.setTransform(c, n, -n, c, p.x * D, p.y * D);
    cx.drawImage(s.c, -h, -h, s.side, s.side);
  }
}

/* ---------- Typewriter ---------- */
function startTypewriter() {
  const el = $("#typed");
  if (!el) return;
  const node = document.createTextNode("");
  el.textContent = ""; el.appendChild(node); el.classList.add("typing");
  typing = { el, node, msg: CONFIG.romanticMessage, i: 0, start: performance.now() + 900 };
}
function stepTyping(t) {
  const T = typing;
  if (t < T.start) return;
  const n = Math.min(T.msg.length, Math.floor((t - T.start) / CHAR_MS) + 1);
  if (n > T.i) { T.node.appendData(T.msg.slice(T.i, n)); T.i = n; }
  if (n >= T.msg.length) { T.el.classList.remove("typing"); $("#nextMsg")?.classList.add("show"); typing = null; }
}
function stopTypewriter() { if (typing) typing.el.classList.remove("typing"); typing = null; }

/* ---------- Final Screen Emitter ---------- */
function emitFinalParticles(t) {
  nextEmit = t + (SMALL ? 1400 : 800);
  const v = rand(0.5, 1.1) * K;
  createHeart(rand(0, W), H + 10, { vx: 0, vy: -v, sw: rand(0.2, 0.5), sf: rand(0.006, 0.014), life: (H + 40) / v, a: 0.9 });
  createSpark(W / 2 + rand(-150, 150), H * 0.3 + rand(-100, 100), { vx: 0, vy: 0, life: 120, a: 1 });
  if (!SMALL) createSpark(W / 2 + rand(-150, 150), H * 0.3 + rand(-100, 100), { vx: 0, vy: 0, life: 120, a: 1 });
}
function startFinal() {
  emitFinal = true; nextEmit = 0;
  later(() => document.body.classList.add("settled"), 5300, "final");
}
function stopFinal() { emitFinal = false; clearScope("final"); }

/* ---------- Bölüm geçişleri ---------- */
const hooks = { message: startTypewriter, final: startFinal, scratch: initScratch };
const leaves = {
  intro: () => clearScope("intro"),
  q1: () => { clearScope("q1"); $$(".bubble,.sling").forEach(e => e.remove()); fadeTemp(); },
  message: stopTypewriter,
  final: stopFinal
};
function hideSection(id) { $("#" + id)?.classList.remove("active"); }
function showSection(id) {
  if (id === current) return;
  (leaves[current] || (() => {}))();
  hideSection(current); current = id;
  clearScope("nav");
  later(() => { $("#" + id)?.classList.add("active"); ambLevel = FX[id] ?? 1; (hooks[id] || (() => {}))(); }, 450);
}

/* ---------- Giriş ---------- */
function startIntro() {
  later(() => $("#intro")?.classList.add("active"), 300, "intro");
  later(() => $("#t1")?.classList.add("show"), 1200, "intro");
  later(() => $("#t2")?.classList.add("show"), 3600, "intro");
  later(() => $("#t3")?.classList.add("show"), 4800, "intro");
}

/* ---------- Comic bubble ---------- */
function bubble(text, x, y) {
  const b = document.createElement("div"); b.className = "bubble"; b.textContent = text;
  b.style.left = Math.max(80, Math.min(x, W - 80)) + "px"; b.style.top = Math.max(50, y) + "px";
  b.addEventListener("animationend", () => b.remove(), { once: true });
  document.body.appendChild(b);
}

/* ---------- HAYIR butonu ---------- */
const answersGone = () => $("#answers")?.classList.contains("gone");
function clampNo() {
  if (!noBtn) return;
  const r = noBtn.getBoundingClientRect();
  noBtn.style.left = Math.max(8, Math.min(r.left, W - r.width - 8)) + "px";
  noBtn.style.top = Math.max(8, Math.min(r.top, H - r.height - 8)) + "px";
}
function moveNo(f = 1) {
  if (!noBtn) return;
  const r = noBtn.getBoundingClientRect(), w = r.width, h = r.height;
  if (!noBtn.classList.contains("fly")) {
    noBtn.style.left = r.left + "px"; noBtn.style.top = r.top + "px";
    noBtn.classList.add("fly"); void noBtn.offsetWidth;
  }
  const reach = (W < 600 ? 130 : 320) * f, yes = $("#yesBtn").getBoundingClientRect();
  const cl = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
  let x = r.left, y = r.top;
  for (let i = 0; i < 14; i++) {
    const nx = cl(r.left + rand(-reach, reach), 8, W - w - 8), ny = cl(r.top + rand(-reach, reach), 8, H - h - 8);
    const hit = nx < yes.right + 12 && nx + w > yes.left - 12 && ny < yes.bottom + 12 && ny + h > yes.top - 12;
    if (!hit && Math.abs(nx - r.left) + Math.abs(ny - r.top) > 40 * f) { x = nx; y = ny; break; }
  }
  noBtn.style.left = x + "px"; noBtn.style.top = y + "px";
}
function resetNo() {
  if (!noBtn) return;
  noBtn.classList.remove("fly"); noBtn.removeAttribute("style");
  noBtn.disabled = false; noBtn.textContent = "HAYIR 🥺";
}
function handleNo() {
  if (noCount >= 5 || answersGone()) return;
  noCount++;
  const r = $("#reply"); if (r) { r.textContent = NO_LINES[noCount - 1]; r.classList.add("show"); }
  const p = $("#q1 .panda").getBoundingClientRect(), pd = $("#q1 [data-panda]");
  const b = noBtn.getBoundingClientRect(), px = p.left + p.width / 2;
  if (noCount === 1) {
    setMood("sad");
    for (let i = 0; i < 7; i++) spawn("💔", rand(p.left, p.right), p.top + 10, { s: rand(12, 16), vx: rand(-0.2, 0.2), vy: rand(0.8, 1.4), g: 0.01, life: 130, a: 0.9 });
  } else if (noCount === 2) {
    setMood("shy"); moveNo(0.45);
    bubble("VIIIU! 🕸️", b.left + b.width / 2, b.top);
    for (let i = 0; i < 4; i++) spawn("🕸️", b.left + b.width / 2, b.top + 10, { s: 20, vx: rand(-1.5, 1.5), vy: rand(-1.5, 0), g: 0.03, life: 60, a: 1 });
  } else if (noCount === 3) {
    setMood("shy"); moveNo(1);
    pd?.classList.add("shake"); pd?.addEventListener("animationend", () => pd.classList.remove("shake"), { once: true });
    bubble("Kaçamazsın! 😭", px, p.top);
  } else if (noCount === 4) {
    setMood("sad"); noBtn.style.scale = ".78"; moveNo(0.4);
    bubble("NOPE! 🥺", px, p.top);
    for (let i = 0; i < 8; i++) spawn("💧", px + rand(-40, 40), p.top + p.height * 0.45, { s: 14, vx: rand(-0.3, 0.3), vy: rand(1, 1.8), g: 0.02, life: 90, a: 0.9 });
  } else sling(p, b);
}
function sling(p, b) {
  noBtn.disabled = true; noBtn.style.pointerEvents = "none";
  $$(".panda").forEach(x => (x.dataset.hero = "1")); setMood("normal");
  const pd = $("#q1 [data-panda]"); pd?.classList.add("pop");
  const x1 = p.left + p.width / 2, y1 = p.top + p.height * 0.6, x2 = b.left + b.width / 2, y2 = b.top + b.height / 2;
  bubble("Ben hallederim. 🕸️🐼", x1, p.top);
  let svg, line;
  later(() => {
    if (answersGone()) return;
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("class", "sling");
    svg.innerHTML = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    document.body.appendChild(svg); line = svg.firstChild;
    const len = Math.hypot(x2 - x1, y2 - y1);
    line.style.strokeDasharray = len; line.style.strokeDashoffset = len; void line.getBoundingClientRect();
    line.style.transition = "stroke-dashoffset .45s ease-out"; line.style.strokeDashoffset = 0;
  }, 1100, "q1");
  later(() => {
    if (answersGone()) return;
    noBtn.style.transition = "transform .7s ease-in,opacity .7s";
    noBtn.style.transform = `translate(${x1 - x2}px,${y1 - y2}px) scale(.05) rotate(360deg)`; noBtn.style.opacity = 0;
    if (line) line.style.opacity = 0;
  }, 1700, "q1");
  later(() => {
    if (svg) svg.remove();
    if (answersGone()) return;
    noBtn.style.visibility = "hidden"; bubble("POOF! ✨", x2, y2); setMood("happy");
    $("#giveIn")?.classList.add("show");
  }, 2500, "q1");
}

/* ---------- EVET ---------- */
function handleYes() {
  if (answersGone()) return;
  $("#answers")?.classList.add("gone"); $("#giveIn")?.classList.remove("show");
  resetNo(); setMood("happy");
  const r = $("#reply"); if (r) { r.textContent = "Biliyordum! 🥰"; r.classList.add("show"); }
  for (let k = 0; k < 9; k++) later(() => confetti(rand(W * 0.2, W * 0.8), rand(H * 0.25, H * 0.5), 30, PALS[Math.min(2, Math.floor(k / 3))]), k * 450, "q1");
  later(() => $("#reply2")?.classList.add("show"), 1800, "q1");
  later(() => $("#next1")?.classList.add("show"), 3600, "q1");
}

/* ---------- Galeri & Lightbox ---------- */
const lb = $("#lb"), lbImg = $("#lbImg");
function buildGallery() {
  const grid = $("#grid"); if (!grid) return;
  CONFIG.photos.forEach((p, i) => {
    const item = document.createElement("div"); item.className = "item";
    const b = document.createElement("button"); b.className = "ph"; b.setAttribute("aria-label", p.caption + " — büyüt");
    const img = new Image(); img.src = p.src; img.alt = p.alt; img.loading = "lazy";
    img.onerror = () => item.classList.add("missing");
    const empty = document.createElement("span"); empty.className = "empty"; empty.textContent = "Fotoğraf burada olacak ❤️";
    b.append(img, empty); b.onclick = () => showLightbox(i, item.classList.contains("missing"));
    const cap = document.createElement("p"); cap.className = "cap"; cap.textContent = p.caption;
    item.append(b, cap); grid.appendChild(item);
  });
}
function showLightbox(i, missing) {
  if (!lb || !lbImg) return;
  const p = CONFIG.photos[i];
  if (missing) lbImg.removeAttribute("src"); else lbImg.src = p.src;
  lbImg.alt = p.alt; $("#lbCap").textContent = p.caption;
  lb.classList.toggle("missing", missing); lb.hidden = false;
  requestAnimationFrame(() => lb.classList.add("open")); $("#lbClose")?.focus();
}
function closeLightbox() {
  if (!lb) return;
  lb.classList.remove("open"); setTimeout(() => { if (!lb.classList.contains("open")) lb.hidden = true; }, 350);
}

/* ---------- Köşe ağları ---------- */
function buildWeb() {
  const cs = [1, 0.924, 0.707, 0.383, 0], sn = [0, 0.383, 0.707, 0.924, 1]; let d = "";
  for (const r of [45, 85, 125, 165]) {
    d += `M${r} 0`;
    for (let k = 1; k < 5; k++) {
      const mx = ((cs[k - 1] + cs[k]) / 2) * r * 0.86, my = ((sn[k - 1] + sn[k]) / 2) * r * 0.86;
      d += `Q${mx.toFixed(1)} ${my.toFixed(1)} ${(cs[k] * r).toFixed(1)} ${(sn[k] * r).toFixed(1)}`;
    }
  }
  for (let k = 0; k < 5; k++) d += `M0 0L${(cs[k] * 190).toFixed(1)} ${(sn[k] * 190).toFixed(1)}`;
  $$(".web").forEach(s => (s.innerHTML = `<path d="${d}"/>`));
}

/* ---------- Sürpriz ---------- */
function handleSurprise() {
  document.body.classList.add("final");
  hideSection("surprise");
  later(() => showSection("final"), 1400);
}

/* ---------- Baştan başla ---------- */
function resetExperience() {
  $$(".coupon.open").forEach(c => c.classList.remove("open")); pandaBase = null;
  clearAllTimers(); stopTypewriter(); stopFinal();
  noCount = 0; ambLevel = 1;
  document.body.classList.remove("final", "settled");
  $$(".screen").forEach(s => s.classList.remove("active"));   $$
(".fade").forEach(e => e.classList.remove("show"));
  $("#answers")?.classList.remove("gone"); 
  const r = $("#reply"); if (r) r.textContent = "";
  const t = $("#typed"); if (t) t.textContent = "";    resetNo(); setMood("normal"); closeLightbox();   $$(".panda").forEach(p => delete p.dataset.hero);
  $$(".bubble,.sling").forEach(e => e.remove());   $$
("[data-panda]").forEach(e => e.classList.remove("pop", "shake"));
  seedAmbient(); current = "intro"; startIntro();
}

/* ---------- Canlı Sayaç ---------- */
function startLiveCounter() {
  const startDate = new Date(2026, 4, 14, 15, 30, 0); // 14 Mayıs 2026
  function updateCounter() {
    const now = new Date();
    const diff = now - startDate;
    const counterEl = document.getElementById("counter");
    if (!counterEl) return;

    if (diff < 0) {
      counterEl.textContent = "O güzel güne henüz ulaşmadık! ✨";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    counterEl.textContent = `${days} gün ${hours} saat ${minutes} dk ${seconds} sn ❤️`;
  }
  updateCounter();
  setInterval(updateCounter, 1000);
}

/* ---------- Kazı kazan ---------- */
let scratchDone = false, scratchDraw = false, scratchLast = null, scratchTick = 0;
function buildScratch() {
  const c = $("#scratchCv"); if (!c) return;
  c.addEventListener("pointerdown", e => { scratchDraw = true; scratchLast = null; c.setPointerCapture(e.pointerId); scratchAt(e); });
  c.addEventListener("pointermove", e => { if (scratchDraw) scratchAt(e); });
  const end = () => { scratchDraw = false; scratchLast = null; if (!scratchDone) checkScratch(c); };
  c.addEventListener("pointerup", end); c.addEventListener("pointercancel", end);
}
function initScratch() {
  const box = $("#scratchBox"), c = $("#scratchCv"); if (!box || !c) return;
  $("#scratchText").textContent = CONFIG.scratchMessage;
  scratchDone = false; box.classList.remove("done");
  const w = box.clientWidth, h = box.clientHeight, d = Math.min(devicePixelRatio || 1, 2);
  c.width = w * d; c.height = h * d;
  const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0); g.globalCompositeOperation = "source-over";
  const grad = g.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#ffb3c9"); grad.addColorStop(0.5, "#e6d9ff"); grad.addColorStop(1, "#ff8fb1");
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(255,255,255,.8)"; g.font = "700 22px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("✨ Kazı ✨", w / 2, h / 2);
  later(() => $("#scratchNext").classList.add("show"), 12000, "scratch"); // so nobody gets stuck
}
function scratchAt(e) {
  if (scratchDone) return;
  const c = e.currentTarget, r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, g = c.getContext("2d");
  g.globalCompositeOperation = "destination-out"; g.lineWidth = 36; g.lineCap = "round"; g.beginPath();
  const p = scratchLast || { x, y }; g.moveTo(p.x, p.y); g.lineTo(x, y); g.stroke(); scratchLast = { x, y };
  const now = performance.now();
  if (now - scratchTick > 200) { scratchTick = now; checkScratch(c); }
}
function checkScratch(c) {
  const data = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let clear = 0, total = 0;
  for (let i = 3; i < data.length; i += 64) { total++; if (data[i] < 128) clear++; }
  if (clear / total > 0.5) revealScratch();
}
function revealScratch() {
  if (scratchDone) return; scratchDone = true;
  const box = $("#scratchBox"), r = box.getBoundingClientRect();
  box.classList.add("done"); confetti(r.left + r.width / 2, r.top + r.height / 2, 36, PALS[1]);
  later(() => $("#scratchNext").classList.add("show"), 1200, "scratch");
}

/* ---------- Kupon kitapçığı ---------- */
function buildCoupons() {
  const grid = $("#couponGrid"); if (!grid) return;
  CONFIG.coupons.forEach((text, i) => {
    const b = document.createElement("button"); b.className = "coupon"; b.type = "button";
    b.setAttribute("aria-expanded", "false");
    b.innerHTML = '<span class="cf"><b>🎟️</b>Kupon ' + (i + 1) + '<small>Açmak için dokun</small></span><span class="cb"></span>';
    b.querySelector(".cb").textContent = text;
    b.onclick = () => {
      const open = b.classList.toggle("open"); b.setAttribute("aria-expanded", open);
      if (open) { const r = b.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2, 12, PALS[0]); }
    };
    grid.appendChild(b);
  });
}

/* ---------- Pandaya dokununca tepki ---------- */
const TAPS = [["shy", "Hihi, gıdıklanıyorum! 🙈"], ["happy", "Bana dokunmaya bayılıyorsun 😌"], ["happy", "Seni çok seviyorum ❤️"], ["sad", "Yeter ama... 🥺"], ["normal", "Zzz... 💤"]];
let pandaTaps = 0, pandaBase = null;
function handlePandaTap(e) {
  const panda = e.target.closest(".panda"); if (!panda) return;
  if (current === "q1" && noCount > 0 && !answersGone()) return; // HAYIR sırasında karışmasın
  const r = panda.getBoundingClientRect(), x = r.left + r.width / 2, i = pandaTaps++ % TAPS.length;
  if (pandaBase === null) pandaBase = panda.dataset.mood;
  setMood(TAPS[i][0]); bubble(TAPS[i][1], x, r.top);
  const box = panda.parentElement; box.classList.remove("tapwig"); void box.offsetWidth; box.classList.add("tapwig");
  box.addEventListener("animationend", () => box.classList.remove("tapwig"), { once: true });
  if (i === 2) for (let k = 0; k < 6; k++) createHeart(x + rand(-40, 40), r.top + 30, { vx: rand(-0.4, 0.4), vy: -rand(0.6, 1.2), life: 90, a: 0.9 });
  if (i === 4) spawn("💤", x + 36, r.top + 24, { s: 22, vx: 0.2, vy: -0.5, life: 100, a: 0.9 });
  clearScope("panda");
  later(() => { setMood(pandaBase || "normal"); pandaBase = null; }, 1500, "panda");
}

/* ---------- Uygulama Başlatma ---------- */
function init() {
  buildWeb(); fillConfig(); buildPandas(); buildGallery(); buildCoupons(); buildScratch(); resize(); seedAmbient(); requestAnimationFrame(frame); startIntro(); startLiveCounter();

  document.addEventListener("click", handlePandaTap);
  $$("[data-go]").forEach(b => b.addEventListener("click", () => showSection(b.dataset.go)));
  $("#yesBtn")?.addEventListener("click", handleYes);
  $("#giveIn")?.addEventListener("click", handleYes);
  noBtn?.addEventListener("click", handleNo);
  $("#surpriseBtn")?.addEventListener("click", handleSurprise);
  $("#restartBtn")?.addEventListener("click", resetExperience);
  $("#lbClose")?.addEventListener("click", closeLightbox);
  lb?.addEventListener("click", e => { if (e.target === lb) closeLightbox(); });
  addEventListener("keydown", e => { if (e.key === "Escape") closeLightbox(); });
  let rz; addEventListener("resize", () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(resize); });

  // MÜZİK VE SES AYARLARI
  const mBtn = document.getElementById("musicBtn");
  const mAudio = document.getElementById("bgMusic");
  const vSlider = document.getElementById("volumeSlider");

  if (mBtn && mAudio) {
    mAudio.volume = vSlider ? parseFloat(vSlider.value) : 0.8;

    mBtn.onclick = function() {
      if (mAudio.paused) {
        mAudio.play().then(() => {
          mBtn.textContent = "🎶 Çalıyor";
        }).catch(err => {
          console.error("Ses çalma hatası:", err);
          alert("Müzik oynatılamadı. Lütfen 'sarki.mp3' dosyasının doğru yerde olduğundan emin olun.");
        });
      } else {
        mAudio.pause();
        mBtn.textContent = "🎵 Müzik Çal";
      }
    };

    if (vSlider) {
      vSlider.oninput = function(e) {
        mAudio.volume = parseFloat(e.target.value);
        if (mAudio.volume === 0) {
          mBtn.textContent = "🔇 Sessiz";
        } else if (!mAudio.paused) {
          mBtn.textContent = "🎶 Çalıyor";
        }
      };
    }
  }
}

addEventListener("DOMContentLoaded", init);