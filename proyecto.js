// =========================================================
// PÁGINAS DE PROYECTO (compartido)
// Los componentes se activan con atributos data-*:
//   data-lineas    diagrama con líneas entre nodos      data-scrubber  recorrido por etapas
//   data-lupa      lupa que sigue al mouse               data-arrastre  carrusel que se arrastra
//   data-barcode   "código de barras" de color de cine   data-paleta    colores dominantes
//   data-filtros   pestañas que filtran tarjetas         data-preview   nodos que cambian una pantalla
//   data-video     reproductor con portada               data-salir     enlaces con apagado CRT
//   data-comparar  antes / después con divisor
// =========================================================
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ---------- sonido 8-bit ----------
let audio;
function tono(freq = 660, dur = 0.07, tipo = "square", hasta = null) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime, osc = audio.createOscillator(), g = audio.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, t);
    if (hasta) osc.frequency.exponentialRampToValueAtTime(hasta, t + dur);
    g.gain.setValueAtTime(0.03, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(audio.destination);
    osc.start(t); osc.stop(t + dur);
  } catch {}
}

// ---------- botón flotante "CONTÁCTAME" (en todas las páginas menos la de contacto) ----------
const SOBRE = `<svg viewBox="0 0 9 7" aria-hidden="true"><path fill="currentColor" d="M0 0h9v1H0zM0 6h9v1H0zM0 1h1v5H0zM8 1h1v5H8zM1 1h1v1H1zM2 2h1v1H2zM3 3h1v1H3zM4 4h1v1H4zM5 3h1v1H5zM6 2h1v1H6zM7 1h1v1H7z"/></svg>`;
let fab = null;
if (!document.body.classList.contains("p-contacto")) {
  fab = document.createElement("a");
  fab.className = "fab-contacto";
  fab.href = "contacto.html";
  fab.setAttribute("data-salir", "");
  fab.setAttribute("aria-label", "Contáctame");
  fab.innerHTML = `${SOBRE}<span>CONTÁCTAME</span>`;
  document.body.appendChild(fab);
  // al llegar al final de la página el botón muestra su texto (sin moverse de lugar)
  addEventListener("scroll", () => {
    const fin = scrollY + innerHeight > document.documentElement.scrollHeight - 260;
    fab.classList.toggle("abierto", fin);
  }, { passive: true });
}

// ---------- tildes en Press Start 2P ----------
// La fuente no tiene mayúsculas con tilde (dibuja «í», «ñ» en minúscula):
// esas letras se reemplazan por la misma letra en Silkscreen, que sí las tiene.
const TILDES = /[ÁÉÍÓÚÜÑ]/;
$$("body *").forEach((el) => {
  const css = getComputedStyle(el);
  if (!css.fontFamily.includes("Press Start")) return;
  [...el.childNodes].forEach((n) => {
    if (n.nodeType !== 3 || !TILDES.test(n.data)) return;
    // en contenedores flex/grid todo va en un solo span para que siga siendo un único elemento
    const frag = /flex|grid/.test(css.display) ? document.createElement("span") : document.createDocumentFragment();
    n.data.split(/([ÁÉÍÓÚÜÑ])/).forEach((parte) => {
      if (!parte) return;
      if (TILDES.test(parte)) {
        const s = document.createElement("span");
        s.className = "px-tilde";
        s.textContent = parte;
        frag.appendChild(s);
      } else frag.appendChild(document.createTextNode(parte));
    });
    n.replaceWith(frag);
  });
});

// =========================================================
// 1. CARGA: "insertando cartucho" → la página se enciende como un CRT
// =========================================================
const boot = $(".boot");
const pagina = $(".pagina");
function encender() {
  if (!boot || boot.classList.contains("listo")) return;
  boot.classList.add("listo");
  tono(900, 0.08); setTimeout(() => tono(1350, 0.1), 90);
  setTimeout(() => {
    boot.classList.add("fuera");
    document.body.classList.remove("cargando");
    pagina.classList.add("encendida");
    setTimeout(() => fab?.classList.add("visible"), 900);   // el botón de contacto entra después de la página
    revisarVisibles();
  }, 480);
}
if (boot) {
  const barra = $(".boot-bar i", boot);
  let p = 0;
  const carga = setInterval(() => {
    p = Math.min(100, p + 7 + Math.random() * 9);
    barra.style.width = p + "%";
    if (Math.random() < .5) tono(1200 + p * 6, 0.02);
    if (p >= 100) { clearInterval(carga); setTimeout(encender, 180); }
  }, 70);
  boot.addEventListener("click", () => { clearInterval(carga); encender(); });   // clic = saltar
} else {
  pagina?.classList.add("encendida");
  setTimeout(() => fab?.classList.add("visible"), 900);
}

// =========================================================
// 2. BARRA EXP (progreso de lectura) y NIVELES laterales
// =========================================================
const xp = $(".xp-bar");
function alScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  xp?.style.setProperty("--xp", `${Math.min(100, (scrollY / Math.max(1, max)) * 100)}%`);
}
addEventListener("scroll", alScroll, { passive: true });
alScroll();

const secciones = $$("[data-nivel]");
const niveles = $(".niveles");
if (niveles) {
  secciones.forEach((s) => {
    const a = document.createElement("a");
    a.href = "#" + s.id;
    a.innerHTML = `<span>${s.dataset.nivel}</span><i></i>`;
    niveles.appendChild(a);
  });
  const enlaces = $$("a", niveles);
  const obsNivel = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = secciones.indexOf(e.target);
      enlaces.forEach((a, j) => a.classList.toggle("activo", i === j));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  secciones.forEach((s) => obsNivel.observe(s));
}

// =========================================================
// 3. APARICIÓN AL HACER SCROLL (.rv y diagramas)
// =========================================================
// al terminar, se quitan .rv/.in para que el elemento vuelva a sus transiciones normales (hovers rápidos)
function revelar(el) {
  el.classList.add("in");
  if (!el.classList.contains("rv")) return;
  const d = parseFloat(el.style.getPropertyValue("--d")) || 0;
  clearTimeout(el._rv);
  el._rv = setTimeout(() => {
    el.classList.remove("rv");
    if (!el.classList.contains("diagrama")) el.classList.remove("in");
  }, (d + 1.3) * 1000);
}
const obsVer = new IntersectionObserver((ents) => {
  ents.forEach((e) => {
    if (!e.isIntersecting) return;
    revelar(e.target);
    obsVer.unobserve(e.target);
  });
  // umbral 0 + margen: las imágenes empiezan recortadas a una línea (área 0), así que no sirve un porcentaje visible
}, { threshold: 0, rootMargin: "0px 0px -12% 0px" });
function revisarVisibles() { $$(".rv, .diagrama").forEach((el) => obsVer.observe(el)); }
if (!boot) revisarVisibles();

// =========================================================
// 4. CARTUCHO DEL HERO: se inclina con el mouse
// =========================================================
const heroCart = $(".hero-cart");
if (heroCart) {
  addEventListener("pointermove", (e) => {
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    heroCart.style.setProperty("--ry", `${x * 18}deg`);
    heroCart.style.setProperty("--rx", `${-y * 12}deg`);
  });
}

// =========================================================
// 5. LIGHTBOX: clic en una imagen .shot (se recorre por grupo)
// =========================================================
const lb = document.createElement("div");
lb.className = "lb";
lb.innerHTML = `<figure><img alt=""><figcaption></figcaption></figure>
  <button class="lb-btn lb-cerrar" aria-label="Cerrar">✕ ESC</button>
  <button class="lb-btn lb-ant" aria-label="Anterior">◀</button>
  <button class="lb-btn lb-sig" aria-label="Siguiente">▶</button>`;
document.body.appendChild(lb);
let grupo = [], idx = 0;
function mostrar(i) {
  idx = (i + grupo.length) % grupo.length;
  const fig = grupo[idx], img = $("img", fig);
  const lbImg = $("img", lb);
  lbImg.style.animation = "none"; void lbImg.offsetWidth; lbImg.style.animation = "";
  lbImg.src = img.dataset.grande || img.currentSrc || img.src;
  lbImg.alt = img.alt;
  $("figcaption", lb).innerHTML = fig.closest("figure")?.querySelector("figcaption")?.innerHTML || img.alt;
  $(".lb-ant", lb).style.display = $(".lb-sig", lb).style.display = grupo.length > 1 ? "" : "none";
}
function abrir(fig) {
  const g = fig.dataset.grupo;
  grupo = g ? $$(`.shot[data-grupo="${g}"]`).filter((x) => x.offsetParent) : [fig];   // sin los ocultos por un filtro
  lb.classList.add("abierto");
  document.body.style.overflow = "hidden";
  tono(700, 0.06, "square", 1100);
  mostrar(grupo.indexOf(fig));
}
function cerrar() { lb.classList.remove("abierto"); document.body.style.overflow = ""; tono(500, 0.06, "square", 260); }
document.addEventListener("click", (e) => {
  const fig = e.target.closest(".shot");
  if (fig && !fig.hasAttribute("data-sin-zoom")) abrir(fig);
});
$(".lb-cerrar", lb).addEventListener("click", cerrar);
$(".lb-ant", lb).addEventListener("click", () => { mostrar(idx - 1); tono(600, 0.04); });
$(".lb-sig", lb).addEventListener("click", () => { mostrar(idx + 1); tono(800, 0.04); });
lb.addEventListener("click", (e) => { if (e.target === lb) cerrar(); });
addEventListener("keydown", (e) => {
  if (!lb.classList.contains("abierto")) return;
  if (e.key === "Escape") cerrar();
  if (e.key === "ArrowLeft") mostrar(idx - 1);
  if (e.key === "ArrowRight") mostrar(idx + 1);
});

// =========================================================
// 6. SALIR CON APAGADO CRT (volver, siguiente cartucho)
// =========================================================
$$("[data-salir]").forEach((a) => a.addEventListener("click", (e) => {
  e.preventDefault();
  const url = a.getAttribute("href") || a.dataset.salir;
  tono(900, 0.5, "square", 60);
  document.body.classList.add("saliendo");
  setTimeout(() => (location.href = url), 650);
}));
addEventListener("pageshow", (e) => { if (e.persisted) document.body.classList.remove("saliendo"); });

// =========================================================
// 7. COMPONENTES
// =========================================================

// --- Diagrama: líneas curvas entre nodos. data-lineas="a>b, a>c"  (data-orient="h" para horizontal)
function dibujarLineas(d) {
  let svg = $("svg.lineas", d);
  if (!svg) { svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.classList.add("lineas"); d.prepend(svg); }
  svg.innerHTML = "";
  const horiz = d.dataset.orient === "h";
  // posición dentro del diagrama sin contar translate/scale (los nodos pueden estar animándose)
  const caja = (el) => {
    let x = 0, y = 0, e = el;
    while (e && e !== d) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { left: x, top: y, right: x + el.offsetWidth, bottom: y + el.offsetHeight, width: el.offsetWidth, height: el.offsetHeight };
  };
  d.dataset.lineas.split(",").map((s) => s.trim()).filter(Boolean).forEach((par, k) => {
    const punteada = par.includes("~");
    const [a, b] = par.split(/[>~]/).map((s) => $("#" + s.trim(), d));
    if (!a || !b || !a.offsetParent || !b.offsetParent) return;
    const ra = caja(a), rb = caja(b);
    let x1, y1, x2, y2, dpath;
    if (horiz) {
      x1 = ra.right; y1 = ra.top + ra.height / 2;
      x2 = rb.left; y2 = rb.top + rb.height / 2;
      const m = (x1 + x2) / 2;
      dpath = `M${x1} ${y1} C${m} ${y1} ${m} ${y2} ${x2} ${y2}`;
    } else {
      x1 = ra.left + ra.width / 2; y1 = ra.bottom;
      x2 = rb.left + rb.width / 2; y2 = rb.top;
      const m = (y1 + y2) / 2;
      dpath = `M${x1} ${y1} C${x1} ${m} ${x2} ${m} ${x2} ${y2}`;
    }
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", dpath);
    if (punteada) p.classList.add("punteada");
    svg.appendChild(p);
    const len = p.getTotalLength();
    p.style.setProperty("--len", len);
    p.style.setProperty("--d", `${.15 + k * .08}s`);
  });
}
// se redibujan cuando el diagrama cambia de tamaño (ventana, fuentes o imágenes que terminan de cargar)
const obsTam = new ResizeObserver((ents) => ents.forEach((e) => dibujarLineas(e.target)));
$$("[data-lineas]").forEach((d) => obsTam.observe(d));
document.fonts?.ready.then(() => $$("[data-lineas]").forEach(dibujarLineas));

// --- Scrubber: recorrer etapas de un proceso con un control deslizante
$$("[data-scrubber]").forEach((sc) => {
  const capas = $$(".scrub-capa", sc), rango = $("input[type=range]", sc);
  const titulo = $(".scrub-titulo", sc), texto = $(".scrub-texto", sc), marcas = $$(".scrub-marcas button", sc);
  const play = $(".scrub-play", sc);
  rango.max = capas.length - 1;
  let actual = -1, timer = null;
  function ir(i, sonar = true) {
    i = Math.max(0, Math.min(capas.length - 1, i));
    if (i === actual) return;
    actual = i;
    rango.value = i;
    capas.forEach((c, j) => c.classList.toggle("activa", j === i));
    marcas.forEach((m, j) => m.classList.toggle("activa", j <= i));
    titulo.textContent = capas[i].dataset.titulo;
    texto.textContent = capas[i].dataset.texto;
    sc.style.setProperty("--avance", `${(i / (capas.length - 1)) * 100}%`);
    sc.classList.remove("glitch"); void sc.offsetWidth; sc.classList.add("glitch");
    if (sonar) tono(440 + i * 120, 0.05);
  }
  rango.addEventListener("input", () => ir(+rango.value));
  marcas.forEach((m, j) => m.addEventListener("click", () => { parar(); ir(j); }));
  function parar() { clearInterval(timer); timer = null; play.classList.remove("on"); play.textContent = "▶ REPRODUCIR"; }
  play.addEventListener("click", () => {
    if (timer) return parar();
    play.classList.add("on"); play.textContent = "❚❚ PAUSA";
    if (actual === capas.length - 1) ir(0);
    timer = setInterval(() => { if (actual >= capas.length - 1) return parar(); ir(actual + 1); }, 1700);
  });
  ir(0, false);
});

// --- Lupa: muestra la imagen ampliada bajo el mouse
$$("[data-lupa]").forEach((fig) => {
  const img = $("img", fig);
  const lupa = document.createElement("div");
  lupa.className = "lupa";
  fig.appendChild(lupa);
  const zoom = +fig.dataset.lupa || 2.4;
  fig.addEventListener("pointermove", (e) => {
    const r = fig.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    lupa.style.left = x + "px"; lupa.style.top = y + "px";
    lupa.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
    lupa.style.backgroundSize = `${r.width * zoom}px ${r.height * zoom}px`;
    lupa.style.backgroundPosition = `${-x * zoom + 80}px ${-y * zoom + 80}px`;
  });
});

// --- Carrusel que se arrastra con el mouse (y con la rueda en horizontal)
$$("[data-arrastre]").forEach((el) => {
  let x0 = 0, s0 = 0, arrastrando = false, movido = false;
  el.addEventListener("pointerdown", (e) => { arrastrando = true; movido = false; x0 = e.clientX; s0 = el.scrollLeft; el.classList.add("arrastrando"); });
  addEventListener("pointermove", (e) => {
    if (!arrastrando) return;
    const dx = e.clientX - x0;
    if (Math.abs(dx) > 5) movido = true;
    el.scrollLeft = s0 - dx;
  });
  addEventListener("pointerup", () => { arrastrando = false; el.classList.remove("arrastrando"); });
  el.addEventListener("click", (e) => { if (movido) { e.stopPropagation(); e.preventDefault(); } }, true);
});

// --- Código de barras de color: cada franja es el color promedio de una columna del fotograma
$$("canvas[data-barcode]").forEach((cv) => {
  const img = new Image();
  img.src = cv.dataset.barcode;
  img.onload = () => {
    const t = document.createElement("canvas"), n = 120;
    t.width = n; t.height = 40;
    const c = t.getContext("2d", { willReadFrequently: true });
    c.drawImage(img, 0, 0, n, 40);
    const d = c.getImageData(0, 0, n, 40).data;
    cv.width = n; cv.height = 1;
    const o = cv.getContext("2d");
    for (let x = 0; x < n; x++) {
      let r = 0, g = 0, b = 0;
      for (let y = 0; y < 40; y++) { const i = (y * n + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      o.fillStyle = `rgb(${r / 40 | 0},${g / 40 | 0},${b / 40 | 0})`;
      o.fillRect(x, 0, 1, 1);
    }
  };
});

// --- Paleta: 5 colores dominantes de una imagen (cuantización simple por cubos de color)
$$("[data-paleta]").forEach((cont) => {
  const img = new Image();
  img.src = cont.dataset.paleta;
  img.onload = () => {
    const t = document.createElement("canvas"); t.width = 80; t.height = 45;
    const c = t.getContext("2d", { willReadFrequently: true });
    c.drawImage(img, 0, 0, 80, 45);
    const d = c.getImageData(0, 0, 80, 45).data, cubos = new Map();
    for (let i = 0; i < d.length; i += 4) {
      const k = (d[i] >> 5) << 6 | (d[i + 1] >> 5) << 3 | (d[i + 2] >> 5);
      const v = cubos.get(k) || [0, 0, 0, 0];
      v[0] += d[i]; v[1] += d[i + 1]; v[2] += d[i + 2]; v[3]++;
      cubos.set(k, v);
    }
    // data-vivos: descarta los grises (p. ej. el fondo del viewport) y se queda con los colores saturados
    const sat = ([r, g, b, n]) => (Math.max(r, g, b) - Math.min(r, g, b)) / n / 255;
    let lista = [...cubos.values()];
    if (cont.hasAttribute("data-vivos")) {
      const vivos = lista.filter((c) => sat(c) > .16);
      if (vivos.length >= 5) lista = vivos;
    }
    const top = lista.sort((a, b) => b[3] - a[3]).slice(0, 5)
      .map(([r, g, b, n]) => [r / n | 0, g / n | 0, b / n | 0])
      .sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
    cont.innerHTML = top.map(([r, g, b]) => {
      const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
      return `<span style="--c:${hex}" title="${hex}"><i></i><small>${hex.toUpperCase()}</small></span>`;
    }).join("");
  };
});

// --- Pestañas que filtran tarjetas: botones [data-f] y tarjetas [data-cat]
$$("[data-filtros]").forEach((cont) => {
  const btns = $$("[data-f]", cont), items = $$("[data-cat]", cont);
  btns.forEach((b) => b.addEventListener("click", () => {
    btns.forEach((x) => x.classList.toggle("activo", x === b));
    let k = 0;
    items.forEach((it) => {
      const ver = b.dataset.f === "todos" || it.dataset.cat === b.dataset.f;
      it.classList.toggle("oculto", !ver);
      if (ver) {                      // vuelve a aparecer con la animación de entrada
        it.style.setProperty("--d", `${Math.min(k++, 10) * .05}s`);
        it.classList.remove("in"); it.classList.add("rv");
        void it.offsetWidth;
        requestAnimationFrame(() => revelar(it));
      }
    });
    tono(620, 0.05);
  }));
});

// --- Nodos que cambian la pantalla de un teléfono al pasar el mouse
$$("[data-preview]").forEach((cont) => {
  const destino = $(cont.dataset.preview);
  const etiqueta = $(cont.dataset.previewLabel || "#nada");
  $$("[data-pantalla]", cont).forEach((n) => n.addEventListener("pointerenter", () => {
    if (destino.getAttribute("src") === n.dataset.pantalla) return;
    $$("[data-pantalla]", cont).forEach((x) => x.classList.toggle("activo", x === n));
    destino.classList.remove("cambia"); void destino.offsetWidth; destino.classList.add("cambia");
    destino.src = n.dataset.pantalla;
    if (etiqueta) etiqueta.textContent = n.dataset.nombre || n.textContent.trim();
    tono(760, 0.04);
  }));
});

// --- Comparador antes/después: se arrastra el divisor (o se mueve con el mouse)
$$("[data-comparar]").forEach((cmp) => {
  let activo = false;
  const mover = (e) => {
    const r = cmp.getBoundingClientRect();
    const p = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    cmp.style.setProperty("--pos", p + "%");
  };
  cmp.addEventListener("pointerdown", (e) => { activo = true; cmp.setPointerCapture(e.pointerId); mover(e); tono(540, 0.04); });
  cmp.addEventListener("pointermove", (e) => { if (activo || e.pointerType === "mouse") mover(e); });
  cmp.addEventListener("pointerup", () => (activo = false));
});

// --- Reproductor con portada: el botón enciende el video
$$("[data-video]").forEach((cont) => {
  const v = $("video", cont), btn = $(".play", cont);
  btn.addEventListener("click", () => {
    cont.classList.add("reproduciendo");
    v.controls = true;
    v.play();
    tono(500, 0.3, "square", 1400);
  });
});
