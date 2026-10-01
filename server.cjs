const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const cloudEnabled = require('./supabase-connection.cjs').settings().ISOPAN_STORAGE === 'supabase';
const cloudStore = cloudEnabled ? new (require('./supabase-store.cjs').SupabaseStore)() : null;
const foamGreenRecipes=require('./foam-recipes.cjs').loadRecipes();
const boxPhotoDir = path.join(root, 'Base de datos', 'Datos espuma verde', 'Fotos Box');
const boxPhotos = [['dx','Dx.jpeg'],['dx','Dx1.jpeg'],['dx','dx2.jpeg'],['sx','sx.jpeg'],['sx','sx1.jpeg']].map(([side,file],index)=>({id:`box-${index+1}`,side,file}));
const foamGreenReadings = JSON.parse(fs.readFileSync(path.join(root, 'foam-green-readings.json'), 'utf8'));
const foamGreenCatalog = JSON.parse(fs.readFileSync(path.join(root, 'foam-green-catalog.json'), 'utf8')).map(item => {
  const reading = foamGreenReadings[item.id];
  return reading ? { ...item, settings: { sx: reading.sx, dx: reading.dx }, review: reading.review || 'Datos transcritos de una ficha histórica; confirmar con el responsable antes de utilizarlos.' } : item;
});
const dataDir = path.resolve(process.env.ISOPAN_DATA_DIR || path.join(root, 'data'));
const dataFile = path.join(dataDir, 'store.json');
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const tlsEnabled = Boolean(process.env.TLS_KEY && process.env.TLS_CERT);
const secureCookie = tlsEnabled || process.env.PUBLIC_HTTPS === '1';
if (!['127.0.0.1','localhost'].includes(host) && !tlsEnabled) {
  throw new Error('El acceso de red requiere TLS_KEY y TLS_CERT. Para un proxy HTTPS, deja HOST en 127.0.0.1.');
}
const sessions = new Map();
const failedLogins = new Map();
const mutationAuthorization = Symbol('mutationAuthorization');
const sessionLife = 7 * 24 * 60 * 60 * 1000;
const defaultHome = {
  intro: 'Información de la empresa y acceso a los espacios internos.',
  heroTitle: 'Un mismo punto de encuentro para toda la plantilla.',
  heroBody: 'Consulta las noticias internas, comparte sugerencias y encuentra información de la empresa en un mismo lugar.',
  companyTitle: 'Construimos soluciones para edificios.',
  companyBody: 'Isopan desarrolla y fabrica paneles metálicos aislantes para cubiertas y fachadas. Este espacio acercará la actividad de la empresa a quienes trabajan en ella.',
  nextTitle: 'Esta portada crecerá contigo.',
  nextBody: 'Este espacio reúne información de la empresa y seguirá creciendo con nuevos recursos para toda la plantilla.'
};

function loadDb() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    const initial = { users: [], home: defaultHome, procedures: [], questions: [], inventory: [], handovers: [], issues: [], news: [], suggestions: [], qualityTemplates: [], qualityRecords: [] };
    fs.writeFileSync(dataFile, JSON.stringify(initial, null, 2));
    return initial;
  }
  const saved = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const home = { ...defaultHome, ...(saved.home || {}) };
  if (home.heroBody === 'Esta portada reunirá noticias, información de la empresa y recursos comunes. Iremos incorporando su contenido en las próximas fases.') home.heroBody = defaultHome.heroBody;
  if (home.nextBody === 'Aquí se añadirán novedades, información de los centros y recursos para toda la plantilla.') home.nextBody = defaultHome.nextBody;
  return {
    users: Array.isArray(saved.users) ? saved.users : [],
    home,
    procedures: Array.isArray(saved.procedures) ? saved.procedures : [],
    questions: Array.isArray(saved.questions) ? saved.questions : [],
    inventory: Array.isArray(saved.inventory) ? saved.inventory : [],
    handovers: Array.isArray(saved.handovers) ? saved.handovers : [],
    issues: Array.isArray(saved.issues) ? saved.issues : [],
    news: Array.isArray(saved.news) ? saved.news : [],
    suggestions: Array.isArray(saved.suggestions) ? saved.suggestions : [],
    qualityTemplates: Array.isArray(saved.qualityTemplates) ? saved.qualityTemplates : [],
    qualityRecords: Array.isArray(saved.qualityRecords) ? saved.qualityRecords : []
  };
}
let db = loadDb();
let committedDb = JSON.stringify(db);
function saveLocalCopy() {
  const temporary = `${dataFile}.tmp`;
  try {
    const serialized = JSON.stringify(db, null, 2);
    fs.writeFileSync(temporary, serialized);
    fs.renameSync(temporary, dataFile);
    if (!cloudEnabled) committedDb = serialized;
  } catch (caught) {
    if (!cloudEnabled) db = JSON.parse(committedDb);
    throw caught;
  }
}
async function saveDb() {
  if (!cloudEnabled) { saveLocalCopy(); return; }
  try {
    await cloudStore.save(db);
    committedDb = JSON.stringify(db);
  } catch (caught) {
    db = JSON.parse(committedDb);
    throw caught;
  }
  // La copia local nunca sustituye a Supabase si el servicio está caído.
  try { saveLocalCopy(); } catch { console.error('El guardado en Supabase se confirmó, pero la copia local no pudo actualizarse.'); }
}
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'",
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
  ...(secureCookie ? {'Strict-Transport-Security':'max-age=31536000'} : {})
};
function json(res, status, value, extra = {}) {
  res.writeHead(status, { ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra });
  res.end(JSON.stringify(value));
}
function error(res, status, message) { json(res, status, { error: message }); }
function readBody(req, maxBytes = 1_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let stopped = false;
    req.on('data', chunk => {
      if (stopped) return;
      size += chunk.length;
      if (size > maxBytes) { stopped = true; chunks.length=0; reject(Object.assign(new Error('Solicitud demasiado grande.'), {status:413})); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (stopped) return;
      let parsed;
      try {
        const body=Buffer.concat(chunks).toString('utf8');chunks.length=0;
        parsed = body ? JSON.parse(body) : {};
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Se espera un objeto JSON.');
      } catch { reject(Object.assign(new Error('JSON no válido.'), {status:400})); return; }
      const policy=req[mutationAuthorization];
      if(policy){
        const current=currentSession(req);
        if(!current||current.user.id!==policy.userId){reject(Object.assign(new Error('La sesión ha terminado.'),{status:401}));return;}
        if((policy.admin&&current.user.role!=='admin')||req.headers['x-csrf-token']!==current.session.csrf){reject(Object.assign(new Error('Esta acción ya no está permitida.'),{status:403}));return;}
      }
      resolve(parsed);
    });
    req.on('error', reject);
  });
}
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password, stored) {
  try {
    const [salt, hex] = stored.split(':');
    const actual = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hex, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch { return false; }
}
function cookieToken(req) {
  const match = (req.headers.cookie || '').match(/(?:^|;\s*)isopan_session=([^;]+)/);
  return match?.[1] || '';
}
function currentSession(req) {
  const token = cookieToken(req);
  if (!token) return null;
  const key = crypto.createHash('sha256').update(token).digest('hex');
  const session = sessions.get(key);
  if (!session) return null;
  if (session.expires < Date.now()) { sessions.delete(key); return null; }
  const user = db.users.find(u => u.id === session.userId);
  return user ? { session, user, token } : null;
}
function revokeSessions(userId) {
  for (const [key, session] of sessions) if (session.userId === userId) sessions.delete(key);
}
function publicUser(user) { return { id: user.id, username: user.username, role: user.role, createdAt: user.createdAt }; }
function startSession(res, user) {
  const token = crypto.randomBytes(32).toString('hex');
  const csrf = crypto.randomBytes(24).toString('hex');
  sessions.set(crypto.createHash('sha256').update(token).digest('hex'), { userId: user.id, csrf, expires: Date.now() + sessionLife });
  const cookie = `isopan_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(sessionLife/1000)}${secureCookie?'; Secure':''}`;
  json(res, 200, { user: publicUser(user), csrf }, { 'Set-Cookie': cookie });
}
function requireSession(req, res, admin = false, mutation = false) {
  const current = currentSession(req);
  if (!current) { error(res, 401, 'Inicia sesión para continuar.'); return null; }
  if (admin && current.user.role !== 'admin') { error(res, 403, 'Esta acción requiere una cuenta administradora.'); return null; }
  if (mutation && req.headers['x-csrf-token'] !== current.session.csrf) { error(res, 403, 'La sesión necesita renovarse.'); return null; }
  if (mutation) req[mutationAuthorization]={userId:current.user.id,admin};
  return current;
}
function validCredentials(username, password) {
  return typeof username === 'string' && /^[a-zA-Z0-9._-]{3,32}$/.test(username) &&
    typeof password === 'string' && password.length >= 12 && password.length <= 200;
}
function validHome(home) {
  return home && typeof home === 'object' && Object.keys(defaultHome).every(key =>
    typeof home[key] === 'string' && home[key].trim() && home[key].length <= 1200);
}
function validProcedure(p) {
  return p && typeof p === 'object' && ['draft','approved'].includes(p.status) &&
    ['perfiladora','espuma','lana-de-roca','cortadora','embaladora'].includes(p.area) &&
    (['lana-de-roca','embaladora'].includes(p.area) ? p.line === 'Única' : ['Verde','Azul'].includes(p.line)) &&
    ['fromPanel','toPanel','title','source','validatedBy'].every(key => typeof p[key] === 'string' && p[key].trim() && p[key].length <= 500) &&
    Array.isArray(p.steps) && p.steps.length > 0 && p.steps.length <= 50 && p.steps.every(step =>
      step && typeof step.title === 'string' && step.title.trim() && step.title.length <= 250 &&
      typeof step.instruction === 'string' && step.instruction.trim() && step.instruction.length <= 4000);
}
function validQuestion(q) {
  return q && typeof q === 'object' && ['draft','approved'].includes(q.status) &&
    ['perfiladora','espuma','lana-de-roca','cortadora','embaladora'].includes(q.area) &&
    ['prompt','explanation','source','validatedBy'].every(key => typeof q[key] === 'string' && q[key].trim() && q[key].length <= 2000) &&
    Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 6 && q.options.every(option => typeof option === 'string' && option.trim() && option.length <= 500) &&
    Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.options.length;
}
const areaIds = ['perfiladora','espuma','lana-de-roca','cortadora','embaladora'];
function validIssue(item) {
  return item && typeof item === 'object' && areaIds.includes(item.area) &&
    ['Normal','Alta','Urgente'].includes(item.priority) &&
    typeof item.title === 'string' && item.title.trim().length >= 3 && item.title.length <= 120 &&
    typeof item.description === 'string' && item.description.trim().length >= 5 && item.description.length <= 2000 &&
    typeof item.assignee === 'string' && item.assignee.length <= 100;
}
const inventoryCategories = ['Nastros','Guarnicion','Pelabiles','Peines espuma','Peines cola','Mezcladores cola','Mezcladores promotor','Bobinas'];
function validInventory(item) {
  return item && typeof item === 'object' &&
    ['name','unit','location'].every(key => typeof item[key] === 'string' && item[key].trim() && item[key].length <= 200) &&
    inventoryCategories.includes(item.category) &&
    typeof item.notes === 'string' && item.notes.length <= 2000 &&
    (item.area === '' || areaIds.includes(item.area)) &&
    typeof item.quantity === 'number' && Number.isFinite(item.quantity) && item.quantity >= 0 && item.quantity <= 1_000_000_000;
}
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === value;
}
const newsCategories = ['Cumpleaños','Evento','Comunicado','General'];
const suggestionCategories = ['Mejora','Seguridad','Otro'];
const suggestionStatuses = ['Nueva','En revisión','Resuelta'];
function validNews(item) {
  return item && typeof item === 'object' && newsCategories.includes(item.category) &&
    typeof item.title === 'string' && item.title.trim().length >= 3 && item.title.length <= 120 &&
    typeof item.body === 'string' && item.body.trim().length >= 3 && item.body.length <= 3000 &&
    typeof item.eventDate === 'string' && (!item.eventDate || validDate(item.eventDate));
}
function validSuggestion(item) {
  return item && typeof item === 'object' && suggestionCategories.includes(item.category) &&
    typeof item.title === 'string' && item.title.trim().length >= 3 && item.title.length <= 120 &&
    typeof item.body === 'string' && item.body.trim().length >= 10 && item.body.length <= 3000;
}
function validNotes(notes) {
  return notes && typeof notes === 'object' && !Array.isArray(notes) && areaIds.every(id =>
    typeof notes[id] === 'string' && notes[id].length <= 2000);
}
function validQualityTemplate(item) {
  if (!item || typeof item !== 'object' || !areaIds.includes(item.area) ||
    !(['lana-de-roca','embaladora'].includes(item.area) ? item.line === 'Única' : ['Verde','Azul'].includes(item.line)) ||
    !['draft','published'].includes(item.status) || typeof item.name !== 'string' ||
    item.name.trim().length < 3 || item.name.length > 120 || !Array.isArray(item.pages) ||
    item.pages.length < 1 || item.pages.length > 20 || item.pages.filter(p => p?.type === 'photo').length > 8) return false;
  return item.pages.every(page => {
    if (!page || typeof page.title !== 'string' || page.title.trim().length < 3 || page.title.length > 120) return false;
    if (page.type === 'questions') return Array.isArray(page.questions) && page.questions.length >= 1 && page.questions.length <= 20 &&
      page.questions.every(q => q && typeof q.prompt === 'string' && q.prompt.trim().length >= 3 && q.prompt.length <= 240 &&
        Array.isArray(q.options) && [2,3].includes(q.options.length) && q.options.every(option => typeof option === 'string' && option.trim() && option.length <= 100));
    return page.type === 'photo' && typeof page.prompt === 'string' && page.prompt.trim().length >= 3 && page.prompt.length <= 300 && typeof page.required === 'boolean';
  });
}
function qualityTemplateData(item) {
  return { name:item.name.trim(), area:item.area, line:item.line, status:item.status,
    pages:item.pages.map(page => page.type === 'questions'
      ? {type:'questions',title:page.title.trim(),questions:page.questions.map(q=>({prompt:q.prompt.trim(),options:q.options.map(o=>o.trim())}))}
      : {type:'photo',title:page.title.trim(),prompt:page.prompt.trim(),required:page.required}) };
}
function parseQualityRecord(template, answers) {
  if (!Array.isArray(answers) || answers.length !== template.pages.length) return null;
  const photos=[];const savedAnswers=[];
  for (let i=0;i<template.pages.length;i++) {
    const page=template.pages[i],answer=answers[i];
    if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return null;
    if (page.type === 'questions') {
      if (!Array.isArray(answer.selected) || answer.selected.length !== page.questions.length ||
        !answer.selected.every((value,j)=>Number.isInteger(value)&&value>=0&&value<page.questions[j].options.length)) return null;
      savedAnswers.push({selected:answer.selected});continue;
    }
    if (!answer.photoData && !page.required) {savedAnswers.push({photoId:null});continue;}
    if (typeof answer.photoData !== 'string' || answer.photoData.length > 1_500_000) return null;
    const match=answer.photoData.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match) return null;
    const bytes=Buffer.from(match[1],'base64');
    if (bytes.length<100 || bytes.length>1_000_000 || bytes[0]!==0xff || bytes[1]!==0xd8 || bytes[2]!==0xff ||
      bytes[bytes.length-2]!==0xff || bytes[bytes.length-1]!==0xd9) return null;
    const photoId=crypto.randomUUID();photos.push({photoId,bytes});savedAnswers.push({photoId});
  }
  return {photos,savedAnswers};
}
function contentFor(user) {
  const admin = user.role === 'admin';
  return { home: db.home, news: [...db.news].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),
    mySuggestions: [...db.suggestions].filter(item=>item.authorId===user.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),
    foamGreenCatalog: [...foamGreenCatalog.map(({file, ...item}) => item),...foamGreenRecipes.flatMap(recipe=>recipe.rows.filter(row=>!foamGreenCatalog.some(item=>item.family===recipe.family&&item.width===recipe.width&&item.thickness===row.thickness)).map(row=>({id:`recipe-${recipe.family}-${recipe.width}-${row.thickness}`,family:recipe.family,width:recipe.width,thickness:row.thickness,note:'Variante identificada en las tablas de recetas; ajustes de tapones pendientes.'})))].filter((item,index,list)=>list.findIndex(other=>other.id===item.id)===index),
    foamGreenBoxPhotos: boxPhotos.filter(item=>fs.existsSync(path.join(boxPhotoDir,item.file))).map(({id,side})=>({id,side,url:`/api/foam-green/box-photos/${id}`})),
    foamGreenRecipes,
    procedures: admin ? db.procedures : db.procedures.filter(p => p.status === 'approved'),
    questions: admin ? db.questions : db.questions.filter(q => q.status === 'approved') };
}
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { const source=new URL(origin);return source.host===String(req.headers.host).toLowerCase()&&source.protocol===(secureCookie?'https:':'http:'); } catch { return false; }
}

async function api(req, res, url) {
  if (req.method !== 'GET' && (!sameOrigin(req) || !String(req.headers['content-type'] || '').startsWith('application/json'))) {
    error(res, 403, 'Solicitud no permitida.'); return;
  }
  const pathname = url.pathname;
  if (pathname === '/api/bootstrap' && req.method === 'GET') {
    const current = currentSession(req);
    json(res, 200, { setupRequired: db.users.length === 0, user: current ? publicUser(current.user) : null, csrf: current?.session.csrf || null });
    return;
  }
  if (pathname === '/api/setup' && req.method === 'POST') {
    if (db.users.length) { error(res, 409, 'La cuenta inicial ya existe.'); return; }
    const { username, password } = await readBody(req);
    if (db.users.length) { error(res, 409, 'La cuenta inicial ya existe.'); return; }
    if (!validCredentials(username, password)) { error(res, 400, 'Usa un usuario de 3 a 32 caracteres y una contraseña de al menos 12.'); return; }
    const user = { id: crypto.randomUUID(), username, role: 'admin', passwordHash: hashPassword(password), createdAt: new Date().toISOString() };
    db.users.push(user); await saveDb(); startSession(res, user); return;
  }
  if (pathname === '/api/login' && req.method === 'POST') {
    const ip = req.socket.remoteAddress || 'local';
    const { username, password } = await readBody(req);
    if (typeof username !== 'string' || username.length > 32 || typeof password !== 'string' || password.length > 200) { error(res,401,'Usuario o contraseña incorrectos.'); return; }
    const loginKey = `${ip}:${username.toLowerCase()}`;
    const ipKey = `ip:${ip}`;
    const prior = failedLogins.get(loginKey);
    const attempts = prior && prior.until > Date.now() ? prior : { count: 0, until: 0 };
    const priorIp=failedLogins.get(ipKey);
    const ipAttempts=priorIp && priorIp.until > Date.now() ? priorIp : {count:0,until:0};
    if ((attempts.count >= 5 && attempts.until > Date.now()) || (ipAttempts.count >= 50 && ipAttempts.until > Date.now())) { error(res, 429, 'Demasiados intentos. Vuelve a probar en unos minutos.'); return; }
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      failedLogins.set(loginKey, { count: attempts.count + 1, until: Date.now() + 15*60*1000 });
      failedLogins.set(ipKey,{count:ipAttempts.count+1,until:Date.now()+5*60*1000});
      error(res, 401, 'Usuario o contraseña incorrectos.'); return;
    }
    failedLogins.delete(loginKey); failedLogins.delete(ipKey); startSession(res, user); return;
  }
  if (pathname === '/api/logout' && req.method === 'POST') {
    const current = requireSession(req, res, false, true); if (!current) return;
    sessions.delete(crypto.createHash('sha256').update(current.token).digest('hex'));
    json(res, 200, { ok: true }, { 'Set-Cookie': `isopan_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureCookie?'; Secure':''}` }); return;
  }
  if (pathname === '/api/account/password' && req.method === 'POST') {
    const current = requireSession(req,res,false,true); if (!current) return;
    const { currentPassword, newPassword } = await readBody(req);
    if (!verifyPassword(String(currentPassword || ''), current.user.passwordHash)) { error(res,400,'La contraseña actual no es correcta.'); return; }
    if (typeof newPassword !== 'string' || newPassword.length < 12 || newPassword.length > 200) { error(res,400,'La nueva contraseña debe tener al menos 12 caracteres.'); return; }
    current.user.passwordHash = hashPassword(newPassword);
    await saveDb(); revokeSessions(current.user.id);
    json(res,200,{ok:true},{ 'Set-Cookie': `isopan_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureCookie?'; Secure':''}` }); return;
  }
  if (pathname === '/api/content' && req.method === 'GET') {
    const current = requireSession(req, res); if (!current) return;
    json(res, 200, contentFor(current.user)); return;
  }
  if (pathname.startsWith('/api/foam-green/box-photos/') && req.method === 'GET') {
    if (!requireSession(req,res)) return;
    const photo=boxPhotos.find(item=>pathname===`/api/foam-green/box-photos/${item.id}`);
    if(!photo){error(res,404,'Fotografía no encontrada.');return;}
    await sendFile(res,path.join(boxPhotoDir,photo.file),'image/jpeg');return;
  }
  if (pathname === '/api/quality/templates' && req.method === 'GET') {
    const current=requireSession(req,res);if(!current)return;
    json(res,200,{items:current.user.role==='admin'?db.qualityTemplates:db.qualityTemplates.filter(item=>item.status==='published')});return;
  }
  if (pathname === '/api/quality/templates' && req.method === 'POST') {
    if(!requireSession(req,res,true,true))return;
    const item=await readBody(req);if(!validQualityTemplate(item)){error(res,400,'Revisa las páginas y preguntas del control.');return;}
    const saved={...qualityTemplateData(item),id:crypto.randomUUID(),revision:1,updatedAt:new Date().toISOString()};
    db.qualityTemplates.push(saved);await saveDb();json(res,201,{item:saved});return;
  }
  const qualityTemplateMatch=pathname.match(/^\/api\/quality\/templates\/([0-9a-f-]{36})$/);
  if(qualityTemplateMatch && req.method==='PUT'){
    if(!requireSession(req,res,true,true))return;
    const item=await readBody(req);
    const index=db.qualityTemplates.findIndex(item=>item.id===qualityTemplateMatch[1]);
    if(index<0){error(res,404,'Control no encontrado.');return;}
    if(!validQualityTemplate(item)){error(res,400,'Revisa las páginas y preguntas del control.');return;}
    if(item.revision!==db.qualityTemplates[index].revision){error(res,409,'Otra persona ha actualizado el control. Vuelve a abrirlo antes de guardar.');return;}
    const saved={...qualityTemplateData(item),id:qualityTemplateMatch[1],revision:db.qualityTemplates[index].revision+1,updatedAt:new Date().toISOString()};
    db.qualityTemplates[index]=saved;await saveDb();json(res,200,{item:saved});return;
  }
  if(pathname==='/api/quality/records' && req.method==='GET'){
    const current=requireSession(req,res);if(!current)return;
    const items=current.user.role==='admin'?db.qualityRecords:db.qualityRecords.filter(item=>item.authorId===current.user.id);
    json(res,200,{items:[...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt))});return;
  }
  if(pathname==='/api/quality/records' && req.method==='POST'){
    const current=requireSession(req,res,false,true);if(!current)return;
    const entry=await readBody(req,12_000_000);
    const template=db.qualityTemplates.find(item=>item.id===entry.templateId&&item.status==='published');
    if(!template){error(res,404,'El control no está publicado.');return;}
    if(!Number.isInteger(entry.revision)||entry.revision<1){error(res,400,'Actualiza la aplicación y vuelve a abrir el control.');return;}
    if(entry.revision!==template.revision){error(res,409,'El control ha cambiado. Vuelve a abrirlo para contestar la versión actual.');return;}
    const parsed=parseQualityRecord(template,entry.answers);
    if(!parsed){error(res,400,'Completa las respuestas y fotos solicitadas.');return;}
    const saved={id:crypto.randomUUID(),templateId:template.id,templateName:template.name,revision:template.revision,area:template.area,line:template.line,
      pages:template.pages,answers:parsed.savedAnswers,authorId:current.user.id,author:current.user.username,createdAt:new Date().toISOString()};
    const photoDir=path.join(dataDir,'quality-photos');const written=[];
    try{if(parsed.photos.length)fs.mkdirSync(photoDir,{recursive:true});for(const photo of parsed.photos){const file=path.join(photoDir,`${photo.photoId}.jpg`);fs.writeFileSync(file,photo.bytes,{flag:'wx'});written.push(file);}db.qualityRecords.push(saved);await saveDb();}
    catch(caught){db.qualityRecords=db.qualityRecords.filter(item=>item!==saved);for(const file of written)fs.rmSync(file,{force:true});throw caught;}
    json(res,201,{item:saved});return;
  }
  const qualityPhotoMatch=pathname.match(/^\/api\/quality\/photos\/([0-9a-f-]{36})$/);
  if(qualityPhotoMatch&&req.method==='GET'){
    const current=requireSession(req,res);if(!current)return;
    const record=db.qualityRecords.find(item=>item.answers.some(answer=>answer.photoId===qualityPhotoMatch[1])&&
      (current.user.role==='admin'||item.authorId===current.user.id));
    if(!record){error(res,404,'Foto no encontrada.');return;}
    const file=path.join(dataDir,'quality-photos',`${qualityPhotoMatch[1]}.jpg`);
    if(!fs.existsSync(file)){error(res,404,'Foto no disponible.');return;}
    await sendFile(res,file,'image/jpeg');return;
  }
  if (pathname === '/api/home' && req.method === 'PUT') {
    if (!requireSession(req,res,true,true)) return;
    const home = await readBody(req);
    if (!validHome(home)) { error(res,400,'Revisa los textos de Inicio.'); return; }
    db.home = Object.fromEntries(Object.keys(defaultHome).map(key => [key,home[key].trim()]));
    await saveDb(); json(res,200,{home:db.home}); return;
  }
  if (pathname === '/api/news' && req.method === 'POST') {
    const current = requireSession(req,res,true,true); if (!current) return;
    const item = await readBody(req);
    if (!validNews(item)) { error(res,400,'Revisa el título, el texto, la categoría y la fecha.'); return; }
    const saved = {id:crypto.randomUUID(), category:item.category, title:item.title.trim(), body:item.body.trim(), eventDate:item.eventDate, author:current.user.username, createdAt:new Date().toISOString()};
    db.news.push(saved); await saveDb(); json(res,201,{item:saved}); return;
  }
  const newsMatch=pathname.match(/^\/api\/news\/([0-9a-f-]{36})$/);
  if (newsMatch && ['PUT','DELETE'].includes(req.method)) {
    if (!requireSession(req,res,true,true)) return;
    const item=req.method==='PUT'?await readBody(req):null;
    const index=db.news.findIndex(item=>item.id===newsMatch[1]);
    if (index<0) { error(res,404,'Noticia no encontrada.'); return; }
    if (req.method==='DELETE') { db.news.splice(index,1); await saveDb(); json(res,200,{ok:true}); return; }
    if (!validNews(item)) { error(res,400,'Revisa el título, el texto, la categoría y la fecha.'); return; }
    const saved={...db.news[index], category:item.category, title:item.title.trim(), body:item.body.trim(), eventDate:item.eventDate, updatedAt:new Date().toISOString()};
    db.news[index]=saved; await saveDb(); json(res,200,{item:saved}); return;
  }
  if (pathname==='/api/suggestions' && req.method==='GET') {
    if (!requireSession(req,res,true)) return;
    json(res,200,{items:[...db.suggestions].sort((a,b)=>b.createdAt.localeCompare(a.createdAt))}); return;
  }
  if (pathname==='/api/suggestions' && req.method==='POST') {
    const current=requireSession(req,res,false,true); if (!current) return;
    const item=await readBody(req);
    if (!validSuggestion(item)) { error(res,400,'Escribe un título y una sugerencia de al menos 10 caracteres.'); return; }
    const saved={id:crypto.randomUUID(),category:item.category,title:item.title.trim(),body:item.body.trim(),status:'Nueva',authorId:current.user.id,author:current.user.username,createdAt:new Date().toISOString()};
    db.suggestions.push(saved); await saveDb(); json(res,201,{item:saved}); return;
  }
  const suggestionMatch=pathname.match(/^\/api\/suggestions\/([0-9a-f-]{36})$/);
  if (suggestionMatch && req.method==='PUT') {
    if (!requireSession(req,res,true,true)) return;
    const item=db.suggestions.find(entry=>entry.id===suggestionMatch[1]);
    if (!item) { error(res,404,'Sugerencia no encontrada.'); return; }
    const {status}=await readBody(req);
    if (!suggestionStatuses.includes(status)) { error(res,400,'Estado no válido.'); return; }
    item.status=status; item.updatedAt=new Date().toISOString(); await saveDb(); json(res,200,{item}); return;
  }
  for (const [segment, collection, validate] of [['procedures','procedures',validProcedure],['questions','questions',validQuestion]]) {
    if (pathname === `/api/${segment}` && req.method === 'POST') {
      if (!requireSession(req,res,true,true)) return;
      const entry = await readBody(req);
      if (!validate(entry)) { error(res,400,'Revisa los campos antes de guardar.'); return; }
      const saved = { ...entry, id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
      db[collection].push(saved); await saveDb(); json(res,201,{item:saved}); return;
    }
    const match = pathname.match(new RegExp(`^/api/${segment}/([0-9a-f-]{36})$`));
    if (match && ['PUT','DELETE'].includes(req.method)) {
      if (!requireSession(req,res,true,true)) return;
      const entry=req.method==='PUT'?await readBody(req):null;
      const index = db[collection].findIndex(item => item.id === match[1]);
      if (index < 0) { error(res,404,'Contenido no encontrado.'); return; }
      if (req.method === 'DELETE') { db[collection].splice(index,1); await saveDb(); json(res,200,{ok:true}); return; }
      if (!validate(entry)) { error(res,400,'Revisa los campos antes de guardar.'); return; }
      const saved = { ...entry, id: match[1], updatedAt: new Date().toISOString() };
      db[collection][index] = saved; await saveDb(); json(res,200,{item:saved}); return;
    }
  }
  if (pathname === '/api/users' && req.method === 'GET') {
    if (!requireSession(req,res,true)) return;
    json(res,200,{users:db.users.map(publicUser)}); return;
  }
  if (pathname === '/api/inventory' && req.method === 'GET') {
    if (!requireSession(req,res,true)) return;
    json(res,200,{items:db.inventory}); return;
  }
  if (pathname === '/api/inventory' && req.method === 'POST') {
    if (!requireSession(req,res,true,true)) return;
    const item=await readBody(req);
    if (!validInventory(item)) { error(res,400,'Revisa los datos del inventario.'); return; }
    const saved={...item,id:crypto.randomUUID(),updatedAt:new Date().toISOString()};
    db.inventory.push(saved);await saveDb();json(res,201,{item:saved});return;
  }
  const inventoryMatch=pathname.match(/^\/api\/inventory\/([0-9a-f-]{36})$/);
  if(inventoryMatch && ['PUT','DELETE'].includes(req.method)){
    if (!requireSession(req,res,true,true)) return;
    const item=req.method==='PUT'?await readBody(req):null;
    const index=db.inventory.findIndex(item=>item.id===inventoryMatch[1]);
    if(index<0){error(res,404,'Artículo no encontrado.');return;}
    if(req.method==='DELETE'){db.inventory.splice(index,1);await saveDb();json(res,200,{ok:true});return;}
    if(!validInventory(item)){error(res,400,'Revisa los datos del inventario.');return;}
    const saved={...item,id:inventoryMatch[1],updatedAt:new Date().toISOString()};
    db.inventory[index]=saved;await saveDb();json(res,200,{item:saved});return;
  }
  if(pathname==='/api/handovers' && req.method==='GET'){
    if(!requireSession(req,res,true))return;
    const month=url.searchParams.get('month');
    const date=url.searchParams.get('date');
    const shift=Number(url.searchParams.get('shift'));
    if(month){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)){error(res,400,'Mes no válido.');return;}
      json(res,200,{items:db.handovers.filter(item=>item.date.startsWith(month))});return;}
    if(date){if(!validDate(date)||![1,2,3].includes(shift)){error(res,400,'Fecha o turno no válido.');return;}
      json(res,200,{item:db.handovers.find(item=>item.date===date&&item.shift===shift)||null});return;}
    error(res,400,'Indica un mes o una fecha y turno.');return;
  }
  if(pathname==='/api/issues' && req.method==='GET'){
    if(!requireSession(req,res,true))return;
    json(res,200,{items:[...db.issues].sort((a,b)=>(a.status==='open'?0:1)-(b.status==='open'?0:1)||b.createdAt.localeCompare(a.createdAt))});return;
  }
  if(pathname==='/api/issues' && req.method==='POST'){
    const current=requireSession(req,res,true,true);if(!current)return;
    const item=await readBody(req);
    if(!validIssue(item)){error(res,400,'Revisa los datos de la incidencia.');return;}
    const saved={id:crypto.randomUUID(),area:item.area,priority:item.priority,title:item.title.trim(),description:item.description.trim(),assignee:item.assignee.trim(),status:'open',author:current.user.username,createdAt:new Date().toISOString(),resolvedAt:null};
    db.issues.push(saved);await saveDb();json(res,201,{item:saved});return;
  }
  const issueMatch=pathname.match(/^\/api\/issues\/([0-9a-f-]{36})$/);
  if(issueMatch&&req.method==='PUT'){
    const current=requireSession(req,res,true,true);if(!current)return;
    const item=db.issues.find(entry=>entry.id===issueMatch[1]);
    if(!item){error(res,404,'Incidencia no encontrada.');return;}
    const update=await readBody(req);
    const hasStatus=Object.hasOwn(update,'status');
    const hasForecast=['repairDate','materialDate','maintenanceNote'].some(key=>Object.hasOwn(update,key));
    if((!hasStatus&&!hasForecast)||(hasStatus&&!['open','resolved'].includes(update.status))){error(res,400,'Estado de incidencia no válido.');return;}
    if(hasForecast&&(!['repairDate','materialDate'].every(key=>typeof update[key]==='string'&&(update[key]===''||validDate(update[key])))||typeof update.maintenanceNote!=='string'||update.maintenanceNote.length>2000)){error(res,400,'Revisa las fechas y la nota de mantenimiento.');return;}
    if(hasStatus){item.status=update.status;item.resolvedAt=update.status==='resolved'?new Date().toISOString():null;}
    if(hasForecast){item.repairDate=update.repairDate;item.materialDate=update.materialDate;item.maintenanceNote=update.maintenanceNote.trim();}
    item.updatedBy=current.user.username;item.updatedAt=new Date().toISOString();
    await saveDb();json(res,200,{item});return;
  }
  const handoverMatch=pathname.match(/^\/api\/handovers\/(\d{4}-\d{2}-\d{2})\/(1|2|3)$/);
  if(handoverMatch && req.method==='PUT'){
    const current=requireSession(req,res,true,true);if(!current)return;
    const date=handoverMatch[1],shift=Number(handoverMatch[2]);
    if(!validDate(date)){error(res,400,'Fecha no válida.');return;}
    const {notes}=await readBody(req);
    if(!validNotes(notes)){error(res,400,'Revisa los comentarios de las áreas.');return;}
    const saved={date,shift,notes:Object.fromEntries(areaIds.map(id=>[id,notes[id].trim()])),author:current.user.username,updatedAt:new Date().toISOString()};
    const index=db.handovers.findIndex(item=>item.date===date&&item.shift===shift);
    if(index<0)db.handovers.push(saved);else db.handovers[index]=saved;
    await saveDb();json(res,200,{item:saved});return;
  }
  if (pathname === '/api/users' && req.method === 'POST') {
    if (!requireSession(req,res,true,true)) return;
    const { username, password, role } = await readBody(req);
    if (!validCredentials(username,password) || !['admin','reader'].includes(role) || db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      error(res,400,'Revisa el usuario, la contraseña y el rol. El usuario debe ser único.'); return;
    }
    const user = { id: crypto.randomUUID(), username, role, passwordHash: hashPassword(password), createdAt: new Date().toISOString() };
    db.users.push(user); await saveDb(); json(res,201,{user:publicUser(user)}); return;
  }
  const userMatch = pathname.match(/^\/api\/users\/([0-9a-f-]{36})$/);
  if (userMatch && ['PUT','DELETE'].includes(req.method)) {
    const current = requireSession(req,res,true,true); if (!current) return;
    const update=req.method==='PUT'?await readBody(req):null;
    const index = db.users.findIndex(u => u.id === userMatch[1]);
    if (index < 0) { error(res,404,'Cuenta no encontrada.'); return; }
    if (current.user.id === userMatch[1]) { error(res,400,'No puedes modificar tu propia cuenta desde aquí.'); return; }
    if (req.method === 'DELETE') { revokeSessions(db.users[index].id); db.users.splice(index,1); await saveDb(); json(res,200,{ok:true}); return; }
    const { role, password } = update;
    if (role !== undefined && !['admin','reader'].includes(role)) { error(res,400,'Rol no válido.'); return; }
    if (password !== undefined && (typeof password !== 'string' || password.length < 12 || password.length > 200)) { error(res,400,'La contraseña debe tener al menos 12 caracteres.'); return; }
    if (role !== undefined) db.users[index].role = role;
    if (password) db.users[index].passwordHash = hashPassword(password);
    if (role !== undefined || password) revokeSessions(db.users[index].id);
    await saveDb(); json(res,200,{user:publicUser(db.users[index])}); return;
  }
  error(res,404,'Ruta no encontrada.');
}

const files = new Map([
  ['/', ['index.html','text/html; charset=utf-8']],
  ['/index.html', ['index.html','text/html; charset=utf-8']],
  ['/styles.css', ['styles.css','text/css; charset=utf-8']],
  ['/app.js', ['app.js','text/javascript; charset=utf-8']],
  ['/foam-green.js', ['foam-green.js','text/javascript; charset=utf-8']],
  ['/quality.js', ['quality.js','text/javascript; charset=utf-8']],
  ['/learning-content.js', ['learning-content.js','text/javascript; charset=utf-8']],
  ['/learning-expanded.js', ['learning-expanded.js','text/javascript; charset=utf-8']],
  ['/procedures.js', ['procedures.js','text/javascript; charset=utf-8']],
  ['/test-questions.js', ['test-questions.js','text/javascript; charset=utf-8']],
  ['/isopan-logo-official.png', ['isopan-logo-official.png','image/png']],
  ['/isopan-icon.png', ['isopan-icon.png','image/png']],
  ['/manifest.webmanifest', ['manifest.webmanifest','application/manifest+json']],
  ['/isopan-app-192.png', ['isopan-app-192.png','image/png']],
  ['/isopan-app-512.png', ['isopan-app-512.png','image/png']],
  ['/isopan-apple-touch.png', ['isopan-apple-touch.png','image/png']],
  ['/docs/pentano-insst.pdf',['docs/pentano-insst.pdf','application/pdf']],
  ['/docs/diisocianatos-insst.pdf',['docs/diisocianatos-insst.pdf','application/pdf']],
  ['/docs/cargas-insst.pdf',['docs/cargas-insst.pdf','application/pdf']],
  ['/docs/perfiladora-accidente-insst.pdf',['docs/perfiladora-accidente-insst.pdf','application/pdf']],
  ['/docs/cizalla-accidente-insst.pdf',['docs/cizalla-accidente-insst.pdf','application/pdf']],
  ['/docs/lugares-insst.pdf',['docs/lugares-insst.pdf','application/pdf']],
  ['/docs/ruido-insst.pdf',['docs/ruido-insst.pdf','application/pdf']]
]);
async function sendFile(res,file,type){
  try{if(!(await fs.promises.stat(file)).isFile()){error(res,404,'Archivo no encontrado.');return;}}
  catch(caught){error(res,caught.code==='ENOENT'?404:500,'No se pudo abrir el archivo.');return;}
  const stream=fs.createReadStream(file);
  stream.once('open',()=>{
    if(res.destroyed){stream.destroy();return;}
    res.writeHead(200,{...securityHeaders,'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    stream.pipe(res);
  });
  stream.on('error',()=>{if(!res.headersSent)error(res,500,'No se pudo leer el archivo.');else res.destroy();});
  res.once('close',()=>stream.destroy());
}
async function withCloudState(req,res,action) {
  if (pendingCloudRequests >= 64) { error(res,503,'El servidor está ocupado. Vuelve a intentarlo.'); return; }
  pendingCloudRequests++;
  const previous = cloudQueue;
  let release;
  cloudQueue = new Promise(resolve => { release = resolve; });
  await previous;
  try {
    if (req.destroyed) return;
    db = await cloudStore.load();
    committedDb = JSON.stringify(db);
    await action();
  } finally { pendingCloudRequests--; release(); }
}
const handler = async (req,res) => {
  try {
    let origin;
    try{origin=new URL(`http://${req.headers.host||''}`);if(origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash||!req.url.startsWith('/')||req.url.startsWith('//'))throw new Error();}
    catch{error(res,400,'Dirección de solicitud no válida.');return;}
    if(!secureCookie&&!['127.0.0.1','localhost','localhost.'].includes(origin.hostname)){error(res,403,'El acceso local requiere localhost o 127.0.0.1.');return;}
    const url = new URL(req.url, origin);
    if (url.pathname.startsWith('/api/')) {
      if (!cloudEnabled) { await api(req,res,url); return; }
      await withCloudState(req,res,() => api(req,res,url));
      return;
    }
    const entry = files.get(url.pathname);
    if (!entry || req.method !== 'GET') { error(res,404,'Archivo no encontrado.'); return; }
    const [name,type] = entry;
    if (url.pathname.startsWith('/docs/')) {
      const serveDocument = async () => {
        if (!currentSession(req)) { error(res,401,'Inicia sesión para consultar el documento.'); return; }
        await sendFile(res,path.join(root,name),type);
      };
      if (cloudEnabled) await withCloudState(req,res,serveDocument); else await serveDocument();
      return;
    }
    await sendFile(res,path.join(root,name),type);
  } catch (caught) {
    if (!caught.status) console.error(caught);
    if (!res.headersSent) error(res,caught.status||500,caught.status?caught.message:'No se pudo completar la solicitud.');
  }
};
let cloudQueue = Promise.resolve();
let pendingCloudRequests = 0;
const server = tlsEnabled
  ? https.createServer({ key: fs.readFileSync(process.env.TLS_KEY), cert: fs.readFileSync(process.env.TLS_CERT) }, handler)
  : http.createServer(handler);
server.headersTimeout = 10_000;
server.requestTimeout = 120_000;
function listen() { server.listen(port,host,() => {
  console.log(`Isopan disponible en ${tlsEnabled?'https':'http'}://${host}:${server.address().port}`);
}); }
server.ready = (async () => {
  if (cloudEnabled) {
    db = await cloudStore.load();
    committedDb = JSON.stringify(db);
    console.log('Almacenamiento de Isopan: Supabase.');
  }
  listen();
})();
server.ready.catch(caught => { console.error(caught.status ? caught.message : 'No se pudo iniciar Isopan.'); process.exitCode = 1; });
module.exports = server;
