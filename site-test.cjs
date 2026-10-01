const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
require('./build-site.cjs');
const files=fs.readdirSync('site-dist');
assert(!files.includes('demo-data.js'));
assert(!files.some(file=>/^(data|Base de datos|server|\.env|\.qa)/i.test(file)));
assert.match(fs.readFileSync('site-dist/site-config.js','utf8'),/https:\/\/bqjdtwrgtwgqyegbevtq\.supabase\.co\/functions\/v1\/isopan/);
const page=fs.readFileSync('site-dist/index.html','utf8');
assert(!page.includes('demo-data.js'));
assert(page.indexOf('site-config.js')<page.indexOf('app.js'));
for(const file of files){if(fs.statSync(path.join('site-dist',file)).isFile()&&/\.(js|html|css|json)$/.test(file))assert(!/sbp_[a-f0-9]{40,}|sb_secret_[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}/.test(fs.readFileSync(path.join('site-dist',file),'utf8')),'Clave privada en '+file);}
console.log('Publicación: app real, conexión protegida y ausencia de claves o archivos internos correctas.');
