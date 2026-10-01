const fs=require('node:fs');const path=require('node:path');
const output=path.join(__dirname,'site-dist');fs.mkdirSync(output,{recursive:true});
const assets=['index.html','styles.css','app.js','foam-green.js','quality.js','learning-content.js','learning-expanded.js','procedures.js','test-questions.js','isopan-icon.png','isopan-logo-official.png','manifest.webmanifest','isopan-app-192.png','isopan-app-512.png','isopan-apple-touch.png'];
for(const file of assets)fs.copyFileSync(path.join(__dirname,file),path.join(output,file));
const api='https://bqjdtwrgtwgqyegbevtq.supabase.co/functions/v1/isopan';
fs.writeFileSync(path.join(output,'site-config.js'),'window.ISOPAN_API_BASE='+JSON.stringify(api)+';\n');
fs.writeFileSync(path.join(output,'.nojekyll'),'');
console.log('Aplicación pública preparada con inicio de sesión y conexión a Supabase.');
