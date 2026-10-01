const assert=require('node:assert/strict');
const crypto=require('node:crypto');
Object.assign(process.env,{ISOPAN_EDGE:'1',PUBLIC_HTTPS:'1',ISOPAN_STORAGE:'supabase',SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_fixture',ISOPAN_ALLOWED_ORIGIN:'https://portal.example'});
const password='clave-ficticia-de-prueba';
const salt='test-salt';
const passwordHash=salt+':'+crypto.scryptSync(password,salt,64).toString('hex');
let saved={users:[{id:crypto.randomUUID(),username:'admin',role:'admin',passwordHash},{id:crypto.randomUUID(),username:'lector',role:'reader',passwordHash}],home:{},procedures:[],questions:[],inventory:[],handovers:[],issues:[],news:[],suggestions:[],qualityTemplates:[],qualityRecords:[],plantContent:{}};
let revision=0,conflict=false;
const attempts=new Map();
global.fetch=async(url,options={})=>{
  assert.equal(options.headers.apikey,'sb_secret_fixture');
  if(url.includes('/rpc/isopan_check_login_attempt')){const key=JSON.parse(options.body).p_key;attempts.set(key,(attempts.get(key)||0)+1);return Response.json(attempts.get(key)<=5);}
  if(url.includes('/isopan_login_attempts?')){attempts.delete(url.split('eq.')[1]);return new Response(null,{status:204});}
  if(options.method==='PATCH'){
    if(conflict)return Response.json([]);
    assert(url.endsWith('revision=eq.'+revision));const body=JSON.parse(options.body);saved=structuredClone(body.payload);revision=body.revision;
  }
  return Response.json([{payload:structuredClone(saved),revision}]);
};
let edge=require('./edge-entry.cjs');
async function request(route,method='GET',body,session,origin=process.env.ISOPAN_ALLOWED_ORIGIN){
  const response=await edge.edgeRequest(new Request('https://fixture.supabase.co/functions/v1/isopan'+route,{method,headers:{Origin:origin,'Content-Type':'application/json',...(session?{Authorization:'Bearer '+session.sessionToken,'X-CSRF-Token':session.csrf}:{})},body:body===undefined?undefined:JSON.stringify(body)}));
  return {status:response.status,headers:response.headers,data:response.status===204?null:await response.json()};
}
(async()=>{
  assert.equal((await request('/api/bootstrap')).data.user,null);
  assert.equal((await request('/api/content')).status,401);
  assert.equal((await request('/api/bootstrap','GET',undefined,undefined,'https://foreign.example')).status,403);
  assert.equal((await request('/api/login','OPTIONS')).headers.get('access-control-allow-origin'),process.env.ISOPAN_ALLOWED_ORIGIN);
  assert.equal((await request('/api/login','POST',null)).status,400);
  const admin=(await request('/api/login','POST',{username:'admin',password})).data;
  assert(admin.sessionToken);assert.equal(saved.loginSessions.length,1);assert(!JSON.stringify(saved).includes(admin.sessionToken));
  // Un nuevo proceso debe reconocer la sesión sin depender de memoria anterior.
  delete require.cache[require.resolve('./edge-entry.cjs')];delete require.cache[require.resolve('./server.cjs')];edge=require('./edge-entry.cjs');
  assert.equal((await request('/api/content','GET',undefined,admin)).status,200);
  const issue=await request('/api/issues','POST',{area:'espuma',priority:'Alta',title:'Prueba incidencia',description:'Descripción de prueba',assignee:''},admin);assert.equal(issue.status,201);
  const route='/api/issues/'+issue.data.item.id;
  assert.equal((await request(route,'PUT',{status:'resolved'},{...admin,csrf:''})).status,403);
  assert.equal((await request(route,'PUT',{status:'resolved'},admin)).data.item.status,'resolved');
  assert.equal(saved.issues[0].status,'resolved');
  conflict=true;assert.equal((await request(route,'PUT',{status:'open'},admin)).status,409);assert.equal(saved.issues[0].status,'resolved');conflict=false;
  const reader=(await request('/api/login','POST',{username:'lector',password})).data;
  assert.equal((await request('/api/issues','GET',undefined,reader)).status,403);
  assert.equal((await request(route,'PUT',{status:'open'},reader)).status,403);
  for(let i=0;i<5;i++)assert.equal((await request('/api/login','POST',{username:'intruso',password})).status,401);
  assert.equal((await request('/api/login','POST',{username:'intruso',password})).status,429);
  await request('/api/logout','POST',{},admin);assert.equal((await request('/api/content','GET',undefined,admin)).status,401);
  console.log('Servidor publicado: sesiones entre procesos, incidencias, permisos, origen, conflictos y límite de intentos correctos.');
})().catch(error=>{console.error(error);process.exitCode=1;});

