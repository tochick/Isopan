const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const app={innerHTML:''},listeners={};let fail=true,requested;
const context={document:{documentElement:{dataset:{}},getElementById:()=>app,addEventListener:(name,handler)=>listeners[name]=handler},window:{ISOPAN_API_BASE:'',addEventListener(){},scrollTo(){}},location:{hostname:'tochick.github.io',protocol:'https:',hash:''},localStorage:{getItem:()=>null,setItem(){}},fetch:async url=>{requested=url;if(fail)throw new Error('Conexión interrumpida');return {ok:true,json:async()=>({setupRequired:false,user:null,csrf:null})};},Intl,Date};
vm.createContext(context);
for(const file of ['learning-content.js','learning-expanded.js','test-questions.js','foam-green.js','quality.js','app.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
(async()=>{
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(requested,'https://bqjdtwrgtwgqyegbevtq.supabase.co/functions/v1/isopan/api/bootstrap','La configuración local antigua no debe desviar el enlace público');
 assert.match(app.innerHTML,/Volver a intentar/);assert(!app.innerHTML.includes('archivo index.html'));
 fail=false;await listeners.click({target:{closest:selector=>selector==='[data-retry-connection]'?{}:null}});
 assert.match(app.innerHTML,/id="login-form"/);assert(!app.innerHTML.includes('auth-error'));
 console.log('Acceso online: configuración antigua, fallo de red y recuperación sin recargar correctos.');
})().catch(e=>{console.error(e);process.exitCode=1;});
