const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const dir = path.join(__dirname, 'demo-dist');
const app = { innerHTML: '' };
const listeners = {};
const storage = new Map();
const context = {
  document: { documentElement: { dataset: {} }, getElementById: id => id === 'app' ? app : null, querySelectorAll: () => [], addEventListener: (name, callback) => { listeners[name] = callback; } },
  window: { addEventListener: (name, callback) => { listeners[name] = callback; }, scrollTo() {} },
  location: { hash: '' },
  localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  fetch: () => { throw new Error('La demostración no debe llamar al servidor.'); },
  Intl, Date
};
vm.createContext(context);
for (const name of ['procedures.js', 'test-questions.js', 'learning-content.js', 'learning-expanded.js', 'foam-green.js', 'quality.js', 'demo-data.js', 'app.js']) vm.runInContext(fs.readFileSync(path.join(dir, name), 'utf8'), context);
(async () => {
  await new Promise(resolve => setImmediate(resolve));
  assert.match(app.innerHTML, /Encuentro de equipo/);
  for (const route of ['inicio', 'produccion', 'produccion/espuma/Verde/cambio', 'oficinas', 'oficinas/inventarios', 'oficinas/jefes-turno', 'mantenimiento', 'calidad', 'calidad/perfiladora/Verde', 'calidad/administrar', 'aprendizaje', 'test', 'admin', 'mi-cuenta']) {
    context.location.hash = '#/' + route;
    listeners.hashchange();
    assert.match(app.innerHTML, /class="app-shell"/, route);
    assert.doesNotMatch(app.innerHTML, /No se puede conectar/, route);
  }
  for (const tab of ['portada', 'noticias', 'sugerencias', 'guias', 'preguntas', 'cuentas']) {
    context.location.hash = '#/admin';
    vm.runInContext(`state.adminTab=${JSON.stringify(tab)};render()`, context);
  }
  await assert.rejects(context.window.ISOPAN_DEMO_API('/api/users', 'POST'), /no se guardan cambios/);
  assert(!fs.existsSync(path.join(dir, 'data')));
  assert(!fs.existsSync(path.join(dir, 'server.cjs')));
  assert(!fs.existsSync(path.join(dir, 'foam-green-readings.json')));
  assert(!fs.existsSync(path.join(dir, 'foam-green-catalog.json')));
  assert.match(fs.readFileSync(path.join(dir, 'index.html'), 'utf8'), /DEMOSTRACIÓN VISUAL/);
  for (const name of ['learning-content.js', 'learning-expanded.js']) assert.doesNotMatch(fs.readFileSync(path.join(dir, name), 'utf8'), /local='\/docs\/|local:'\/docs\//);
  console.log('Demostración: navegación, datos ficticios y bloqueo de escrituras correctos.');
})().catch(error => { console.error(error); process.exitCode = 1; });
