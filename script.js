// =========================================================
// 1. PARALLAX: la "cámara" sigue al mouse
//    Cada .layer se mueve según su data-depth (negativo = se mueve al revés,
//    se siente más cerca). El movimiento se suaviza para que se sienta pesado.
// =========================================================
const layers = [...document.querySelectorAll(".layer")];
const scene = document.getElementById("scene");
const glare = document.getElementById("glare");

const MAX_MOVE = 34;     // px que se desplaza una capa con depth = 1
const MAX_ROTATE = 3;    // grados de giro de la escena
const EASE = 0.055;      // 0.02 = muy suave · 0.15 = rápido

const target = { x: 0, y: 0 };
const current = { x: 0, y: 0 };

window.addEventListener("pointermove", (e) => {
  target.x = (e.clientX / innerWidth) * 2 - 1;     // -1 … 1
  target.y = (e.clientY / innerHeight) * 2 - 1;
});
document.addEventListener("pointerleave", () => { target.x = 0; target.y = 0; });

// En celular: inclinación del teléfono
window.addEventListener("deviceorientation", (e) => {
  if (e.gamma == null) return;
  target.x = Math.max(-1, Math.min(1, e.gamma / 25));
  target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
});

function tick() {
  current.x += (target.x - current.x) * EASE;
  current.y += (target.y - current.y) * EASE;

  for (const layer of layers) {
    const d = parseFloat(layer.dataset.depth);
    layer.style.transform =
      `translate3d(${-current.x * MAX_MOVE * d}px, ${-current.y * MAX_MOVE * 0.45 * d}px, 0)`;
  }
  scene.style.transform =
    `rotateY(${current.x * MAX_ROTATE}deg) rotateX(${-current.y * MAX_ROTATE * 0.5}deg)`;

  // el brillo del vidrio se mueve al lado contrario del mouse (como un reflejo real)
  glare.style.setProperty("--gx", `${48 - current.x * 9}%`);
  glare.style.setProperty("--gy", `${30 - current.y * 6}%`);

  requestAnimationFrame(tick);
}
tick();

// =========================================================
// 2. Letras de PORTFOLIO: retraso escalonado
// =========================================================
document.querySelectorAll(".crt-title span").forEach((s, i) => s.style.setProperty("--i", i));

// =========================================================
// 3. Efecto "scramble" en la navegación
// =========================================================
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@$/\\<>*+=";
document.querySelectorAll(".nav a").forEach((link) => {
  const label = link.querySelector("span");
  const text = link.dataset.text;
  let timer;
  link.addEventListener("mouseenter", () => {
    clearInterval(timer);
    let frame = 0;
    blip(1200 + Math.random() * 300, 0.03);
    timer = setInterval(() => {
      label.textContent = [...text]
        .map((ch, i) => (ch === " " || i < frame / 2 ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
        .join("");
      if (frame / 2 >= text.length) clearInterval(timer);
      frame++;
    }, 28);
  });
});

// =========================================================
// 4. Acciones
// =========================================================
const projectsBtn = document.getElementById("projectsBtn");
const cta = document.getElementById("cta");
const tvPhoto = document.querySelector(".tv-photo");
const aboutEl = document.getElementById("about");
const barFill = document.getElementById("barFill");
const pctEl = document.getElementById("pct");
const loadingLabel = document.getElementById("loadingLabel");
const paragraphs = [...aboutEl.querySelectorAll(".about-text p")];
const loadingEl = aboutEl.querySelector(".loading");
const crtEl = document.getElementById("crt");
const warpEl = document.querySelector(".warp");

// al terminar la entrada, liberamos la animación para poder hacer zoom con transición
function releaseIntro() {
  tvPhoto.style.animation = "none";
  tvPhoto.style.opacity = "1";
}
tvPhoto.addEventListener("animationend", (e) => {
  if (e.animationName === "dollyIn") releaseIntro();
});

projectsBtn.addEventListener("mouseenter", () => blip(660, 0.06));
projectsBtn.addEventListener("click", (e) => {
  e.preventDefault();
  showAbout();
});

cta.addEventListener("mouseenter", () => blip(520, 0.07));
// CONTÁCTAME: la TV se apaga igual que al entrar a proyectos y abre la página de contacto
cta.addEventListener("click", (e) => {
  e.preventDefault();
  if (state === "leaving") return;
  blip(990, 0.12);
  enterProjects("contacto.html");
});

// ---------- Pantallas: home → about → projects ----------
// estados: home → about (escribiendo) → ready (espera un clic) → leaving
let state = "home";
let typer = null;
let clickableAt = 0;
const skipEl = document.getElementById("skip");
const inAbout = () => state === "about" || state === "ready";

window.addEventListener("keydown", (e) => {
  if (state === "home" && e.key === "Enter" && document.activeElement === document.body) showAbout();
  else if (inAbout() && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); advanceAbout(); }
  else if (inAbout() && e.key === "Escape") backHome();
});
// en "sobre mí" un clic en cualquier parte avanza:
// el primero completa el texto, y ya con todo listo entra a proyectos
document.addEventListener("click", () => {
  if (!inAbout() || performance.now() < clickableAt) return;   // ignora el mismo clic que abrió la pantalla
  advanceAbout();
});

function advanceAbout() {
  if (state === "ready") enterProjects();
  else skipAbout();
}

function staticBurst() {
  document.body.classList.remove("switching");
  void document.body.offsetWidth;                   // reinicia la animación
  document.body.classList.add("switching");
  blip(180, 0.18);
}

// home → about: la interfaz sale, la cámara se acerca, la portada se corta
// en franjas, ráfaga de estática y el texto se enciende desde una línea
function showAbout() {
  if (state !== "home") return;
  state = "about";
  releaseIntro();
  resetLoading();
  blip(880, 0.08);
  setTimeout(() => blip(1320, 0.1), 90);
  document.body.classList.add("about");
  clickableAt = performance.now() + 700;
  setTimeout(staticBurst, 430);
  setTimeout(startTyping, 1250);
}

function backHome() {
  clearInterval(typer);
  clearInterval(loader);
  state = "home";
  document.body.classList.add("returning");        // la portada vuelve sin la espera inicial
  staticBurst();
  document.body.classList.remove("about");
}

function resetLoading() {
  finishing = false;
  typed = 0;
  loadingEl.classList.remove("done");
  aboutEl.classList.remove("ready");
  loadingLabel.innerHTML = 'Cargando<span class="dots"></span>';
  skipEl.textContent = "CLIC PARA SALTAR";
  render();
}

// Escribe los párrafos letra por letra. El texto pendiente queda invisible
// (span .rest) para que nada salte de lugar mientras se escribe.
const texts = paragraphs.map((p) => p.dataset.text);
const total = texts.reduce((n, t) => n + t.length, 0);
let typed = 0;

function render() {
  let start = 0;
  paragraphs.forEach((p, i) => {
    const t = texts[i];
    const k = Math.max(0, Math.min(t.length, typed - start));
    // el cursor va en el párrafo que se está escribiendo ahora
    const typing = typed < total && typed >= start && typed < start + t.length;
    start += t.length;
    p.innerHTML = `<span class="${typing ? "typing" : ""}">${t.slice(0, k)}</span><span class="rest">${t.slice(k)}</span>`;
  });
  setProgress((typed / total) * 85);               // la escritura llena el 85% de la barra
}

function setProgress(p) {
  const v = Math.min(100, Math.round(p));
  barFill.style.setProperty("--p", v + "%");
  pctEl.textContent = v + "%";
}

function startTyping() {
  if (state !== "about" || typed >= total) return;  // volvió al inicio o ya saltó el texto
  typed = 0;
  render();
  clearInterval(typer);
  typer = setInterval(() => {
    typed += 2;
    if (typed % 6 === 0) blip(1500 + Math.random() * 400, 0.015);
    if (typed >= total) {
      typed = total;
      clearInterval(typer);
      render();
      finishLoading();
      return;
    }
    render();
  }, 32);
}

function skipAbout() {
  if (state !== "about" || typed >= total) return;
  clearInterval(typer);
  typed = total;
  render();
  finishLoading(true);
}

// completa el 15% que falta y queda esperando un clic para entrar a proyectos
let finishing = false;
let loader = null;
function finishLoading(fast) {
  if (finishing) return;
  finishing = true;
  let p = 85;
  clearInterval(loader);
  loader = setInterval(() => {
    p += fast ? 5 : 1.5;
    setProgress(p);
    if (p >= 100) {
      clearInterval(loader);
      if (state !== "about") return;
      state = "ready";                              // no avanza solo: da tiempo de leer
      loadingEl.classList.add("done");             // "¡Listo!" salta y la barra destella
      aboutEl.classList.add("ready");
      loadingLabel.innerHTML = "¡Listo!";
      skipEl.innerHTML = '<span class="go">▶</span>CLIC PARA CONTINUAR';
      blip(990, 0.1);
      setTimeout(() => blip(1480, 0.14), 110);
    }
  }, 40);
}

// about → projects: toda la pantalla se apaga como un CRT (destello → línea → punto),
// la cámara empuja hacia el punto y su luz se expande hasta llenar la ventana
function enterProjects(destino = "proyectos.html") {
  state = "leaving";
  blip(1320, 0.08);
  const r = crtEl.getBoundingClientRect();         // el punto queda en el centro del vidrio
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  warpEl.style.setProperty("--cx", `${cx}px`);
  warpEl.style.setProperty("--cy", `${cy}px`);
  // la página de proyectos arranca con la luz en el mismo punto (transición sin salto)
  try {
    sessionStorage.setItem("warp", JSON.stringify({ x: (cx / innerWidth) * 100, y: (cy / innerHeight) * 100 }));
  } catch {}
  document.body.classList.add("shutdown");
  sweep(900, 60, 0.5);                              // sonido de apagado
  setTimeout(() => {
    document.body.classList.add("warping");
    sweep(140, 1800, 0.55, "sawtooth");             // la luz se expande
  }, 850);
  setTimeout(() => (location.href = destino), 1480);
}

// si el usuario vuelve con el botón "atrás" del navegador, reinicia todo
window.addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  document.body.classList.remove("about", "shutdown", "warping", "switching");
  document.body.classList.add("returning");
  aboutEl.classList.remove("ready");
  state = "home";
  finishing = false;
});

// =========================================================
// 5. Sonido 8-bit generado (sin archivos)
// =========================================================
const soundBtn = document.getElementById("soundBtn");
let soundOn = true;
let audio;

soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  soundBtn.setAttribute("aria-pressed", soundOn);
  if (soundOn) blip(880, 0.08);
});

function blip(freq = 660, dur = 0.08) {
  if (!soundOn) return;
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

// barrido de frecuencia: apagado (de agudo a grave) o "whoosh" (de grave a agudo)
function sweep(from, to, dur, type = "square") {
  if (!soundOn) return;
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
