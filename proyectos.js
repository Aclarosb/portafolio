// =========================================================
// MY PROJECTS: carrusel de cartuchos
// =========================================================
const carts = [...document.querySelectorAll(".cart")];
const catLinks = [...document.querySelectorAll(".cats a")];
const hand = document.getElementById("hand");
const stage = document.getElementById("stage");
const cartsBox = document.getElementById("carts");
const title = document.querySelector(".title");

// al volver de un proyecto (proyectos.html#short-film, etc.) queda activo ese cartucho
let active = Math.max(0, carts.findIndex((c) => "#" + c.dataset.slug === location.hash));

// si venimos de la TV, el destello de llegada arranca donde quedó el punto de luz
try {
  const warp = JSON.parse(sessionStorage.getItem("warp"));
  if (warp) {
    const fade = document.getElementById("fade");
    fade.style.setProperty("--cx", `${warp.x}%`);
    fade.style.setProperty("--cy", `${warp.y}%`);
    sessionStorage.removeItem("warp");
  }
} catch {}

// letras del título escalonadas + orden de entrada de los cartuchos
document.querySelectorAll(".title-main span").forEach((s, i) => s.style.setProperty("--i", i));
carts.forEach((c, i) => c.style.setProperty("--i", i));

// ---------- Abanico ----------
// Cada cartucho tiene un lugar fijo en el abanico (como en la referencia);
// el activo sube, crece y queda adelante.
function layout() {
  const n = carts.length;
  const cw = carts[0].offsetWidth;
  const spread = innerWidth < 760 ? 0.66 : 0.84;   // cuánto se separan entre sí
  carts.forEach((c, i) => {
    const slot = i - (n - 1) / 2;                   // -1.5, -0.5, 0.5, 1.5
    c.style.setProperty("--x", `${slot * cw * spread}px`);
    c.style.setProperty("--y", `${Math.abs(slot) * 12}px`);   // arco suave
    c.style.setProperty("--r", `${slot * 4}deg`);
    c.style.zIndex = i === active ? 10 : i + 1;
    c.classList.toggle("is-active", i === active);
    c.setAttribute("aria-current", i === active ? "true" : "false");
  });
  // la mano se pone encima del cartucho activo
  const slot = active - (n - 1) / 2;
  hand.style.translate = `${slot * cw * spread}px 0`;
  catLinks.forEach((a, i) => a.classList.toggle("is-active", i === active));
}

// ---------- Nombre del proyecto activo ----------
// se escribe letra por letra con caracteres al azar que se "resuelven", como en un juego
const infoName = document.getElementById("infoName");
const GLIFOS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*";
let tipeo;
function showInfo() {
  const c = carts[active];
  const name = c.dataset.title;
  clearInterval(tipeo);
  let f = 0;
  tipeo = setInterval(() => {
    infoName.textContent = [...name]
      .map((ch, k) => (ch === " " || k < f / 2 ? ch : GLIFOS[(Math.random() * GLIFOS.length) | 0]))
      .join("");
    if (f / 2 >= name.length) clearInterval(tipeo);
    f++;
  }, 26);
}

function setActive(i) {
  const next = (i + carts.length) % carts.length;
  if (next === active) return;
  active = next;
  blip(520 + active * 110, 0.06);
  layout();
  showInfo();
  history.replaceState(null, "", "#" + carts[active].dataset.slug);   // "atrás" vuelve a este cartucho
}

infoName.textContent = carts[active].dataset.title;
layout();
addEventListener("resize", layout);

// ---------- Controles ----------
document.getElementById("prev").addEventListener("click", () => setActive(active - 1));
document.getElementById("next").addEventListener("click", () => setActive(active + 1));

addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") setActive(active - 1);
  if (e.key === "ArrowRight") setActive(active + 1);
  if (e.key === "Enter") open(active);
  if (e.key === "Escape") leave("index.html");
});

carts.forEach((c, i) => {
  c.addEventListener("click", () => (i === active ? open(i) : setActive(i)));

  // inclinación 3D siguiendo el mouse
  c.addEventListener("pointermove", (e) => {
    const r = c.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    c.style.setProperty("--ry", `${px * 18}deg`);
    c.style.setProperty("--rx", `${-py * 14}deg`);
  });
  c.addEventListener("pointerleave", () => {
    c.style.setProperty("--ry", "0deg");
    c.style.setProperty("--rx", "0deg");
  });
});

catLinks.forEach((a, i) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    i === active ? open(i) : setActive(i);
  })
);

document.getElementById("back").addEventListener("click", (e) => {
  e.preventDefault();
  leave("index.html");
});

// botón flotante de contacto: entra cuando ya aparecieron los cartuchos
const fab = document.getElementById("fab");
setTimeout(() => fab.classList.add("visible"), 2200);
fab.addEventListener("mouseenter", () => blip(520, 0.05));
fab.addEventListener("click", (e) => {
  e.preventDefault();
  leave("contacto.html");
});

// ---------- Abrir un cartucho ----------
function open(i) {
  const cart = carts[i];
  if (cart.classList.contains("inserting")) return;
  blip(660, 0.08);
  setTimeout(() => blip(990, 0.12), 110);
  cartsBox.classList.add("opening");               // los demás cartuchos caen
  cart.classList.add("inserting");                  // el elegido sube a la consola
  const href = cart.dataset.href;
  setTimeout(() => {
    document.body.classList.add("leaving");         // la página se apaga como un CRT
    sweep(900, 60, 0.5);
  }, 520);
  setTimeout(() => {
    // data-href = página del proyecto (nextmove.html, emotions.html…)
    if (href && !href.startsWith("#")) return (location.href = href);
    // demo: aún no hay página de categoría → la pantalla se vuelve a encender
    cartsBox.classList.remove("opening");
    cart.classList.remove("inserting");
    document.body.classList.remove("leaving");
  }, 1250);
}

function leave(url) {
  blip(440, 0.08);
  sweep(900, 60, 0.5);
  document.body.classList.add("leaving");          // apagado CRT y luego al inicio
  setTimeout(() => (location.href = url), 700);
}

// si vuelven con el botón "atrás" del navegador, quita el fundido a negro
addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  document.body.classList.remove("leaving");
  cartsBox.classList.remove("opening");             // el cartucho insertado vuelve a su lugar
  carts.forEach((c) => c.classList.remove("inserting"));
});

// ---------- Parallax suave ----------
const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
addEventListener("pointermove", (e) => {
  target.x = (e.clientX / innerWidth) * 2 - 1;
  target.y = (e.clientY / innerHeight) * 2 - 1;
});
(function tick() {
  cur.x += (target.x - cur.x) * 0.06;
  cur.y += (target.y - cur.y) * 0.06;
  cartsBox.style.transform = `translate3d(${-cur.x * 18}px, ${-cur.y * 10}px, 0)`;
  title.style.transform = `translate3d(${cur.x * 10}px, ${cur.y * 6}px, 0)`;
  requestAnimationFrame(tick);
})();

// ---------- Sonido 8-bit ----------
let audio;
function blip(freq = 660, dur = 0.08) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + dur);
  } catch {}
}

// barrido de frecuencia (sonido de apagado de la TV)
function sweep(from, to, dur, type = "square") {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(0.03, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + dur);
  } catch {}
}
