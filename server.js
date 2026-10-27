// Servidor local mínimo: node server.js  →  http://localhost:5500
const http = require("http");
const fs = require("fs");
const path = require("path");

const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml", ".mp4": "video/mp4" };

http.createServer((req, res) => {
  const ruta = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
  const file = path.join(__dirname, ruta === "/" ? "index.html" : ruta);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("404"); }
    const tipo = types[path.extname(file).toLowerCase()] || "application/octet-stream";
    // el video necesita respuestas por rangos para poder adelantar/reproducir
    const rango = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
    if (rango) {
      const ini = rango[1] ? +rango[1] : 0;
      const fin = rango[2] ? Math.min(+rango[2], data.length - 1) : data.length - 1;
      res.writeHead(206, { "Content-Type": tipo, "Content-Range": `bytes ${ini}-${fin}/${data.length}`, "Accept-Ranges": "bytes", "Content-Length": fin - ini + 1 });
      return res.end(data.subarray(ini, fin + 1));
    }
    res.writeHead(200, { "Content-Type": tipo, "Accept-Ranges": "bytes" });
    res.end(data);
  });
}).listen(5500, () => console.log("http://localhost:5500"));
