const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const output = path.join(root, 'demo-dist');
fs.mkdirSync(output, { recursive: true });
// Solo estos archivos públicos forman la demostración. No se lee data/.
const assets = ['procedures.js', 'test-questions.js', 'learning-content.js', 'learning-expanded.js', 'foam-green.js', 'quality.js', 'isopan-icon.png', 'isopan-logo-official.png', 'demo-data.js'];
for (const name of assets) {
  if (name.endsWith('.js')) fs.writeFileSync(path.join(output, name), fs.readFileSync(path.join(root, name), 'utf8').replaceAll("'/docs/", "'./docs/"));
  else fs.copyFileSync(path.join(root, name), path.join(output, name));
}
fs.cpSync(path.join(root, 'docs'), path.join(output, 'docs'), { recursive: true });
let app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const signature = "async function apiRequest(url, method='GET', body) {";
if (!app.includes(signature)) throw new Error('Revisar la integración de la demostración: ha cambiado apiRequest.');
app = app.replace(signature, signature + '\n  return window.ISOPAN_DEMO_API(url, method, body);\n');
app = app.replaceAll('data-nav="mi-cuenta"', 'data-nav="inicio"').replaceAll("navLink('mi-cuenta','Mi cuenta','user',active)", "navLink('inicio','Volver al inicio','home',active)");
app = app.replace('<button class="signout" data-logout>Cerrar sesión</button>', '<button class="signout" data-nav="inicio">Volver al inicio</button>');
app += '\nconst demoRender = render; render = function(){ demoRender(); for(const input of document.querySelectorAll("input[type=password]")){ input.disabled=true; input.placeholder="No disponible en la demostración"; } };\n';
fs.writeFileSync(path.join(output, 'app.js'), app);
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace('<body>', '<body><div class="demo-banner" role="status">DEMOSTRACIÓN VISUAL · Datos ficticios · No introduzcas contraseñas ni información interna</div>');
html = html.replace('<script src="./app.js" defer>', '<script src="./demo-data.js" defer></script>\n    <script src="./app.js" defer>');
fs.writeFileSync(path.join(output, 'index.html'), html);
fs.writeFileSync(path.join(output, '.nojekyll'), '');
fs.writeFileSync(path.join(output, 'styles.css'), fs.readFileSync(path.join(root, 'styles.css'), 'utf8') + '\n.demo-banner{position:relative;z-index:100;background:#153e36;color:#fff;padding:12px 20px;text-align:center;font:600 13px/1.5 system-ui}.app-shell{min-height:calc(100vh - 44px)}\n');
console.log('Demostración generada en demo-dist, con datos ficticios.');
