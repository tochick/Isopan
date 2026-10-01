const { configuration } = require('./supabase-connection.cjs');

function unavailable(message = 'Supabase no está disponible. No se ha confirmado el guardado; vuelve a cargar antes de intentarlo de nuevo.', status = 503) {
  return Object.assign(new Error(message), { status });
}

class SupabaseStore {
  constructor(config = configuration(), request = fetch) {
    this.config = config;
    this.request = request;
    this.revision = null;
  }

  async call(route, { method = 'GET', body, headers = {} } = {}) {
    let response;
    try {
      response = await this.request(`${this.config.url}${route}`, {
        method,
        headers: { apikey: this.config.key, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'error', signal: AbortSignal.timeout(15000)
      });
    } catch { throw unavailable(); }
    if (!response.ok) {
      await response.body?.cancel();
      throw unavailable('No se pudo acceder al almacenamiento de Isopan en Supabase. Comprueba su configuración.');
    }
    try { return await response.json(); } catch { throw unavailable(); }
  }

  async load() {
    const rows = await this.call('/rest/v1/isopan_state?id=eq.main&select=payload,revision');
    if (!Array.isArray(rows) || rows.length !== 1) throw unavailable('Falta importar los datos iniciales de Isopan en Supabase.');
    const { payload, revision } = rows[0];
    const collections = ['users','procedures','questions','inventory','handovers','issues','news','suggestions','qualityTemplates','qualityRecords'];
    if (!payload || typeof payload !== 'object' || !payload.home || !collections.every(name => Array.isArray(payload[name])) || !Number.isSafeInteger(revision) || revision < 0) throw unavailable('Los datos de Supabase no tienen el formato de Isopan.');
    this.revision = revision;
    return payload;
  }

  async save(payload) {
    if (!Number.isSafeInteger(this.revision) || this.revision < 0 || this.revision >= Number.MAX_SAFE_INTEGER) throw unavailable();
    const revision = this.revision + 1;
    const rows = await this.call(`/rest/v1/isopan_state?id=eq.main&revision=eq.${this.revision}`, {
      method: 'PATCH', body: { payload, revision, updated_at: new Date().toISOString() }, headers: { Prefer: 'return=representation' }
    });
    if (!Array.isArray(rows) || rows.length !== 1 || rows[0].revision !== revision) throw unavailable('Otra sesión ha guardado cambios. Vuelve a cargar la página antes de guardar.', 409);
    this.revision = revision;
  }

  async loginAllowed(key) {
    return (await this.call('/rest/v1/rpc/isopan_check_login_attempt', { method:'POST',body:{p_key:key} })) === true;
  }
  async clearLoginAttempts(key) {
    const response = await this.request(`${this.config.url}/rest/v1/isopan_login_attempts?key=eq.${key}`, {
      method:'DELETE',headers:{apikey:this.config.key},redirect:'error',signal:AbortSignal.timeout(15000)
    }).catch(()=>{throw unavailable();});
    if(!response.ok){await response.body?.cancel();throw unavailable();}await response.body?.cancel();
  }

  async fileRequest(object, { method = 'GET', bytes, type } = {}) {
    if (!/^(?:references|documents|quality)\/[a-z0-9./_-]+$/.test(object) || object.includes('..')) throw unavailable('Referencia de archivo no válida.');
    let response;
    try {
      response = await this.request(`${this.config.url}/storage/v1/object/${method === 'GET' ? 'authenticated/' : ''}isopan-private/${object}`, {
        method, headers: { apikey: this.config.key, Authorization: `Bearer ${this.config.key}`, ...(bytes ? { 'Content-Type': type } : {}) },
        body: bytes, redirect: 'error', signal: AbortSignal.timeout(30000)
      });
    } catch { throw unavailable('No se pudo acceder al archivo de Supabase.'); }
    if (!response.ok) {
      await response.body?.cancel();
      throw unavailable(response.status === 404 ? 'Archivo no disponible.' : 'No se pudo acceder al archivo de Supabase.', response.status === 404 ? 404 : 503);
    }
    return response;
  }

  async uploadFile(object, bytes, type) {
    const response = await this.fileRequest(object, { method: 'POST', bytes, type });
    await response.body?.cancel();
  }

  async downloadFile(object) {
    const response = await this.fileRequest(object);
    try { return Buffer.from(await response.arrayBuffer()); } catch { throw unavailable('No se pudo descargar el archivo de Supabase.'); }
  }
}

module.exports = { SupabaseStore };
