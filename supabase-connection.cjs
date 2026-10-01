const runtimeEnv = require('./runtime-env.cjs');
const fs = require('node:fs');
const path = require('node:path');

function settings() {
  const file = path.join(__dirname, '.env.supabase');
  const values = {};
  if (runtimeEnv.ISOPAN_EDGE !== '1' && fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*(SUPABASE_URL|SUPABASE_SECRET_KEY|ISOPAN_STORAGE)\s*=\s*(.*?)\s*$/);
      if (!match) continue;
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      values[match[1]] = value;
    }
  }
  return { ...values, ...Object.fromEntries(['SUPABASE_URL','SUPABASE_SECRET_KEY','ISOPAN_STORAGE'].filter(name => runtimeEnv[name] !== undefined).map(name => [name,runtimeEnv[name]])) };
}

function configuration() {
  const values = settings();
  const url = values.SUPABASE_URL;
  const key = values.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Falta la clave secreta del proyecto en el archivo privado .env.supabase.');
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('La dirección del proyecto no es válida.'); }
  if (parsed.protocol !== 'https:' || !/^[a-z0-9]+\.supabase\.co$/.test(parsed.hostname) || parsed.port || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('Usa la dirección HTTPS del proyecto de Supabase, sin rutas ni parámetros.');
  }
  if (!/^sb_secret_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Se necesita una clave de proyecto de tipo Secret key; no un token personal ni una clave pública.');
  return { url: parsed.origin, key };
}

async function checkConnection() {
  const { url, key } = configuration();
  let response;
  try {
    response = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key, Accept: 'application/openapi+json' },
      redirect: 'error',
      signal: AbortSignal.timeout(10000)
    });
  } catch {
    throw new Error('No se pudo contactar con Supabase. Comprueba la conexión y que el proyecto esté activo.');
  }
  await response.body?.cancel();
  if ([401, 403].includes(response.status)) throw new Error('Supabase rechazó la clave. Comprueba que pertenezca a este proyecto y siga activa.');
  if (!response.ok) throw new Error(`Supabase no está disponible para la conexión (HTTP ${response.status}).`);
  return true;
}

if (require.main === module) checkConnection().then(() => {
  console.log('Acceso a Supabase comprobado. Esta comprobación no modifica ni migra datos y todavía no activa la integración de la app.');
}).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = { configuration, checkConnection, settings };

