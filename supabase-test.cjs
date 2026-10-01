const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { SupabaseStore } = require('./supabase-store.cjs');
const { configuration } = require('./supabase-connection.cjs');
const nativeFetch = global.fetch;
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'isopan-cloud-test-'));
process.env.ISOPAN_STORAGE = 'supabase';
process.env.SUPABASE_URL = 'https://fixture.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'sb_secret_fixture';
process.env.ISOPAN_DATA_DIR = temporary;
process.env.PORT = '0';
process.env.HOST = '127.0.0.1';
let saved, revision = 0, failSave = false, conflict = false;
global.fetch = async (url, options = {}) => {
  if (!String(url).startsWith(process.env.SUPABASE_URL)) return nativeFetch(url, options);
  assert.equal(options.headers.apikey, 'sb_secret_fixture');
  if (!saved) saved = JSON.parse(fs.readFileSync(path.join(temporary, 'store.json')));
  if (options.method === 'PATCH') {
    if (failSave) throw new Error('Fallo simulado con una clave secreta que no debe aparecer.');
    if (conflict) return new Response('[]', { status: 200 });
    assert(String(url).endsWith('revision=eq.' + revision));
    const body = JSON.parse(options.body);
    assert.equal(body.revision, revision + 1);
    saved = structuredClone(body.payload); revision = body.revision;
  }
  return new Response(JSON.stringify([{ payload: saved, revision }]), { status: 200 });
};
const server = require('./server.cjs');
async function main() {
  await server.ready;
  if (!server.listening) await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(route, method = 'GET', body, session = {}) {
    const r = await nativeFetch(base + route, {
      method, headers: { 'Content-Type': 'application/json', Cookie: session.cookie || '', 'X-CSRF-Token': session.csrf || '' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    return { status: r.status, body: await r.json(), cookie: r.headers.get('set-cookie')?.split(';')[0] };
  }
  const setup = await request('/api/setup', 'POST', { username: 'cloud-admin', password: 'clave-ficticia-de-pruebas' });
  assert.equal(setup.status, 200);
  const admin = { cookie: setup.cookie, csrf: setup.body.csrf };
  assert.equal(saved.users.length, 1);
  assert(!JSON.stringify(saved).includes('clave-ficticia-de-pruebas'));
  assert.equal((await request('/api/users', 'POST', { username: 'cloud-reader', password: 'otra-clave-ficticia-larga', role: 'reader' }, admin)).status, 201);
  const login = await request('/api/login', 'POST', { username: 'cloud-reader', password: 'otra-clave-ficticia-larga' });
  const reader = { cookie: login.cookie, csrf: login.body.csrf };
  assert.equal((await request('/api/users', 'GET', undefined, reader)).status, 403);
  assert.equal((await request('/api/inventory', 'GET', undefined, reader)).status, 403);
  assert.equal((await request('/.env.supabase')).status, 404);
  const text = (await request('/api/content', 'GET', undefined, reader));
  assert.equal(text.status, 200);
  assert(!JSON.stringify(text.body).includes('sb_secret'));
  failSave = true;
  const failed = await request('/api/news', 'POST', { title: 'No guardar', body: 'Texto de prueba', category: 'General', eventDate: '2026-10-01' }, admin);
  assert.equal(failed.status, 503);
  assert(!JSON.stringify(failed.body).includes('clave secreta'));
  assert.equal(saved.news.length, 0);
  failSave = false;
  conflict = true;
  assert.equal((await request('/api/news', 'POST', { title: 'Conflicto', body: 'Texto de prueba', category: 'General', eventDate: '2026-10-01' }, admin)).status, 409);
  assert.equal(saved.news.length, 0);
  conflict = false;
  const writes = await Promise.all(['Primera','Segunda'].map(title => request('/api/news', 'POST', { title, body: 'Texto de prueba', category: 'General', eventDate: '2026-10-01' }, admin)));
  assert(writes.every(result => result.status === 201));
  assert.equal(saved.news.length, 2);
  assert.equal(JSON.parse(fs.readFileSync(path.join(temporary, 'store.json'))).news.length, 2);
  // Un cambio externo se recoge al consultar, sin iniciar de nuevo el servidor.
  saved.users.find(user => user.username === 'cloud-reader').role = 'admin'; revision++;
  assert.equal((await request('/api/users', 'GET', undefined, reader)).status, 200);
  saved.users = saved.users.filter(user => user.username !== 'cloud-reader'); revision++;
  const document = await nativeFetch(base + '/docs/ruido-insst.pdf', { headers: { Cookie: reader.cookie } });
  assert.equal(document.status, 401, 'Una cuenta eliminada en Supabase pierde también el acceso a documentos');
  const badConfig = process.env.SUPABASE_SECRET_KEY;
  process.env.SUPABASE_SECRET_KEY = 'sbp_token_personal';
  assert.throws(configuration, /no un token personal/);
  process.env.SUPABASE_SECRET_KEY = badConfig;
  const store = new SupabaseStore(configuration(), async () => { throw new Error('No hay red'); });
  await assert.rejects(store.load(), { status: 503 });
  console.log('Supabase: permisos, secretos, copia local, concurrencia, conflictos y fallos de red correctos con datos ficticios.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  server.close(); global.fetch = nativeFetch;
  if (temporary.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(temporary).startsWith('isopan-cloud-test-')) fs.rmSync(temporary, { recursive: true, force: true });
});
