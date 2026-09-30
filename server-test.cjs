const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'isopan-server-test-'));
process.env.PORT = '0';
process.env.HOST = '127.0.0.1';
process.env.ISOPAN_DATA_DIR = dataDir;
let server = require('./server.cjs');

async function main() {
  if (!server.listening) await new Promise(resolve => server.once('listening',resolve));
  let base = `http://127.0.0.1:${server.address().port}`;
  const page=await fetch(base+'/');
  assert.equal(page.status,200);
  assert.match(page.headers.get('content-security-policy'),/script-src 'self'/);
  assert.equal(page.headers.get('x-frame-options'),'DENY');
  assert.equal((await fetch(base+'/data/store.json')).status,404);
  const foreignHostStatus=await new Promise((resolve,reject)=>{http.get(base+'/api/bootstrap',{headers:{Host:'dominio-ajeno.invalid'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));}).on('error',reject);});
  assert.equal(foreignHostStatus,403);
  const malformed=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'null'});
  assert.equal(malformed.status,400);
  const oversized=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({padding:'x'.repeat(1_000_001)})});
  assert.equal(oversized.status,413);
  async function request(route, method='GET', body, session={}) {
    const response = await fetch(base+route, {
      method,
      headers: {
        ...(method==='GET'?{}:{'Content-Type':'application/json','X-CSRF-Token':session.csrf||''}),
        ...(session.cookie?{'Cookie':session.cookie}:{})
      },
      body: body===undefined?undefined:JSON.stringify(body)
    });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  assert.equal((await request('/api/bootstrap')).body.setupRequired, true);
  const setupAttempts=await Promise.all([
    request('/api/setup','POST',{username:'administracion',password:'una-clave-de-prueba-123'}),
    request('/api/setup','POST',{username:'administracion2',password:'otra-clave-inicial-123'})
  ]);
  assert.deepEqual(setupAttempts.map(result=>result.status).sort(),[200,409]);
  const admin=setupAttempts.find(result=>result.status===200);
  const adminSession={cookie:admin.cookie,csrf:admin.body.csrf};
  const externalOrigin=await fetch(base+'/api/users',{method:'POST',headers:{'Content-Type':'application/json','Cookie':admin.cookie,'X-CSRF-Token':admin.body.csrf,Origin:'https://dominio-ajeno.invalid'},body:'{}'});
  assert.equal(externalOrigin.status,403);
  const differentScheme=await fetch(base+'/api/users',{method:'POST',headers:{'Content-Type':'application/json','Cookie':admin.cookie,'X-CSRF-Token':admin.body.csrf,Origin:base.replace('http:','https:')},body:'{}'});
  assert.equal(differentScheme.status,403);
  const created=await request('/api/users','POST',{username:'lector',password:'otra-clave-de-prueba-123',role:'reader'},adminSession);
  assert.equal(created.status,201);
  for(let i=0;i<5;i++)assert.equal((await request('/api/login','POST',{username:'intruso',password:'clave-incorrecta'})).status,401);
  assert.equal((await request('/api/login','POST',{username:'intruso',password:'clave-incorrecta'})).status,429);
  const reader=await request('/api/login','POST',{username:'lector',password:'otra-clave-de-prueba-123'});
  assert.equal(reader.status,200);
  const readerSession={cookie:reader.cookie,csrf:reader.body.csrf};
  assert.equal((await request('/api/users','GET',undefined,readerSession)).status,403);
  assert.equal((await request('/api/home','PUT',{intro:'Intento de cambio'},readerSession)).status,403);
  assert.equal((await request('/api/home','PUT',{intro:'Intento de cambio'},{cookie:admin.cookie})).status,403);
  assert.equal((await request('/api/inventory','GET',undefined,readerSession)).status,403);
  assert.equal((await request('/api/handovers?month=2026-09','GET',undefined,readerSession)).status,403);
  const inventory={name:'Rodillo',category:'Nastros',quantity:12,unit:'ud.',area:'perfiladora',location:'Almacén',notes:''};
  assert.equal((await request('/api/inventory','POST',{...inventory,category:'Otra'},adminSession)).status,400);
  const savedInventory=await request('/api/inventory','POST',inventory,adminSession);
  assert.equal(savedInventory.status,201);
  assert.equal((await request('/api/inventory','GET',undefined,adminSession)).body.items.length,1);
  assert.equal((await request(`/api/inventory/${savedInventory.body.item.id}`,'PUT',{...inventory,quantity:9},adminSession)).body.item.quantity,9);
  assert.equal((await request('/api/inventory','POST',inventory,readerSession)).status,403);
  const notes={perfiladora:'Revisar el rodillo',espuma:'', 'lana-de-roca':'',cortadora:'',embaladora:''};
  assert.equal((await request('/api/handovers/2026-09-28/1','PUT',{notes},adminSession)).status,200);
  assert.equal((await request('/api/handovers?date=2026-09-28&shift=1','GET',undefined,adminSession)).body.item.notes.perfiladora,'Revisar el rodillo');
  assert.equal((await request('/api/handovers?month=2026-09','GET',undefined,adminSession)).body.items.length,1);
  assert.equal((await request('/api/handovers/2026-09-28/1','PUT',{notes},readerSession)).status,403);
  const qualityTemplate={name:'Control de primera pieza',area:'espuma',line:'Verde',status:'published',pages:[
    {type:'questions',title:'Comprobaciones iniciales',questions:Array.from({length:10},(_,i)=>({prompt:`Pregunta ${i+1} sobre el panel`,options:['Correcto','Revisar',...(i%2?['No aplica']:[])]}))},
    ...[1,2,3].map(i=>({type:'photo',title:`Pantalla ${i}`,prompt:`Haz una foto de la pantalla ${i}`,required:true}))
  ]};
  assert.equal((await request('/api/quality/templates','POST',qualityTemplate,readerSession)).status,403);
  assert.equal((await request('/api/quality/templates','POST',{...qualityTemplate,pages:[{type:'photo',title:'Corta',prompt:'',required:true}]},adminSession)).status,400);
  const savedTemplate=await request('/api/quality/templates','POST',qualityTemplate,adminSession);
  assert.equal(savedTemplate.status,201);
  assert.equal(savedTemplate.body.item.pages.length,4);
  assert.equal((await request('/api/quality/templates','GET',undefined,readerSession)).body.items.length,1);
  const fakeJpeg=Buffer.concat([Buffer.from([0xff,0xd8,0xff]),Buffer.alloc(115),Buffer.from([0xff,0xd9])]);
  const photoData=`data:image/jpeg;base64,${fakeJpeg.toString('base64')}`;
  const qualityAnswers=[{selected:Array(10).fill(0)},...Array.from({length:3},()=>({photoData}))];
  assert.equal((await request('/api/quality/records','POST',{templateId:savedTemplate.body.item.id,answers:[{selected:[0]}]},readerSession)).status,400);
  const qualityRecord=await request('/api/quality/records','POST',{templateId:savedTemplate.body.item.id,revision:1,answers:qualityAnswers},readerSession);
  assert.equal(qualityRecord.status,201);
  assert.equal(qualityRecord.body.item.answers.length,4);
  const firstPhoto=qualityRecord.body.item.answers[1].photoId;
  assert.equal((await fetch(base+`/api/quality/photos/${firstPhoto}`)).status,401);
  const storedPhoto=await fetch(base+`/api/quality/photos/${firstPhoto}`,{headers:{Cookie:reader.cookie}});
  assert.equal(storedPhoto.status,200);
  assert.equal(storedPhoto.headers.get('content-type'),'image/jpeg');
  assert.equal(Buffer.compare(Buffer.from(await storedPhoto.arrayBuffer()),fakeJpeg),0);
  assert.equal((await request('/api/quality/records','GET',undefined,adminSession)).body.items.length,1);
  const templateUpdate=await request(`/api/quality/templates/${savedTemplate.body.item.id}`,'PUT',{...qualityTemplate,revision:1,name:'Control actualizado'},adminSession);
  assert.equal(templateUpdate.body.item.revision,2);
  assert.equal((await request('/api/quality/records','POST',{templateId:savedTemplate.body.item.id,revision:1,answers:qualityAnswers},readerSession)).status,409);
  assert.equal((await request(`/api/quality/templates/${savedTemplate.body.item.id}`,'PUT',{...qualityTemplate,revision:1},adminSession)).status,409);
  const optionalTemplate=await request('/api/quality/templates','POST',{name:'Control con foto opcional',area:'cortadora',line:'Azul',status:'draft',pages:[{type:'photo',title:'Foto opcional',prompt:'Adjunta una foto si procede',required:false}]},adminSession);
  assert.equal((await request('/api/quality/templates','GET',undefined,readerSession)).body.items.some(item=>item.id===optionalTemplate.body.item.id),false);
  assert.equal((await request('/api/quality/records','POST',{templateId:optionalTemplate.body.item.id,revision:1,answers:[{}]},readerSession)).status,404);
  const publishedOptional=await request(`/api/quality/templates/${optionalTemplate.body.item.id}`,'PUT',{...optionalTemplate.body.item,status:'published'},adminSession);
  assert.equal(publishedOptional.status,200);
  const optionalRecord=await request('/api/quality/records','POST',{templateId:optionalTemplate.body.item.id,revision:2,answers:[{}]},readerSession);
  assert.equal(optionalRecord.status,201);
  assert.equal(optionalRecord.body.item.answers[0].photoId,null);
  assert.equal((await request('/api/quality/records','GET',undefined,readerSession)).body.items.find(item=>item.templateId===savedTemplate.body.item.id).templateName,'Control de primera pieza');
  const issue={area:'espuma',priority:'Alta',title:'Fuga por revisar',description:'Revisar el equipo antes del próximo arranque.',assignee:'Mantenimiento'};
  assert.equal((await request('/api/issues','GET',undefined,readerSession)).status,403);
  assert.equal((await request('/api/issues','POST',issue,readerSession)).status,403);
  assert.equal((await request('/api/issues','POST',{...issue,area:'desconocida'},adminSession)).status,400);
  const savedIssue=await request('/api/issues','POST',issue,adminSession);
  assert.equal(savedIssue.status,201);
  assert.equal(savedIssue.body.item.status,'open');
  const forecast={repairDate:'2026-10-08',materialDate:'2026-10-07',maintenanceNote:'Pendiente de material del proveedor'};
  assert.equal((await request(`/api/issues/${savedIssue.body.item.id}`,'PUT',forecast,readerSession)).status,403);
  assert.equal((await request(`/api/issues/${savedIssue.body.item.id}`,'PUT',{...forecast,materialDate:'2026-02-30'},adminSession)).status,400);
  const planned=await request(`/api/issues/${savedIssue.body.item.id}`,'PUT',forecast,adminSession);
  assert.equal(planned.status,200);
  assert.equal(planned.body.item.status,'open');
  assert.equal(planned.body.item.materialDate,forecast.materialDate);
  assert.equal((await request('/api/issues','GET',undefined,adminSession)).body.items[0].title,issue.title);
  assert.equal((await request(`/api/issues/${savedIssue.body.item.id}`,'PUT',{status:'resolved'},readerSession)).status,403);
  assert.equal((await request(`/api/issues/${savedIssue.body.item.id}`,'PUT',{status:'resolved'},adminSession)).body.item.status,'resolved');
  assert.equal((await request(`/api/issues/${savedIssue.body.item.id}`,'PUT',{status:'open'},adminSession)).body.item.status,'open');
  const home={
    intro:'Portada de prueba',heroTitle:'Título de prueba',heroBody:'Texto de prueba',
    companyTitle:'Empresa de prueba',companyBody:'Contenido de prueba',
    nextTitle:'Próximo contenido',nextBody:'Texto adicional'
  };
  assert.equal((await request('/api/home','PUT',home,adminSession)).status,200);
  const news={category:'Evento',title:'Jornada de puertas abiertas',body:'El viernes nos reunimos en la sala principal.',eventDate:'2026-10-02'};
  assert.equal((await request('/api/news','POST',news,readerSession)).status,403);
  assert.equal((await request('/api/news','POST',{...news,eventDate:'2026-02-30'},adminSession)).status,400);
  const savedNews=await request('/api/news','POST',news,adminSession);
  assert.equal(savedNews.status,201);
  assert.equal((await request(`/api/news/${savedNews.body.item.id}`,'PUT',{...news,title:'Evento actualizado'},adminSession)).body.item.title,'Evento actualizado');
  const suggestion={category:'Mejora',title:'Mejorar el portal',body:'Sería útil ampliar los avisos internos.'};
  assert.equal((await request('/api/suggestions','POST',{...suggestion,body:'corto'},readerSession)).status,400);
  const savedSuggestion=await request('/api/suggestions','POST',suggestion,readerSession);
  assert.equal(savedSuggestion.status,201);
  assert.equal((await request('/api/suggestions','GET',undefined,readerSession)).status,403);
  assert.equal((await request('/api/suggestions','GET',undefined,adminSession)).body.items.length,1);
  assert.equal((await request(`/api/suggestions/${savedSuggestion.body.item.id}`,'PUT',{status:'Resuelta'},readerSession)).status,403);
  assert.equal((await request(`/api/suggestions/${savedSuggestion.body.item.id}`,'PUT',{status:'Resuelta'},adminSession)).body.item.status,'Resuelta');
  const question={area:'perfiladora',prompt:'Pregunta de prueba',options:['A','B'],correctIndex:0,
    explanation:'Explicación de prueba',source:'Documento de prueba',validatedBy:'Revisión de prueba',status:'approved'};
  assert.equal((await request('/api/questions','POST',question,adminSession)).status,201);
  const procedure={area:'espuma',line:'Azul',fromPanel:'REF-1',toPanel:'REF-2',title:'Guía de prueba',
    source:'Documento de prueba',validatedBy:'Revisión de prueba',status:'approved',
    steps:[{title:'Paso de prueba',instruction:'Instrucción de prueba'}]};
  assert.equal((await request('/api/procedures','POST',procedure,adminSession)).status,201);
  const content=await request('/api/content','GET',undefined,readerSession);
  assert.equal(content.status,200);
  assert.equal(content.body.home.intro,'Portada de prueba');
  assert.equal(content.body.news[0].title,'Evento actualizado');
  assert.equal(content.body.mySuggestions[0].status,'Resuelta');
  assert.equal((await request('/api/content','GET',undefined,adminSession)).body.mySuggestions.length,0);
  const second=await request('/api/users','POST',{username:'lectora2',password:'tercera-clave-de-prueba-123',role:'reader'},adminSession);
  assert.equal(second.status,201);
  const secondLogin=await request('/api/login','POST',{username:'lectora2',password:'tercera-clave-de-prueba-123'});
  assert.equal((await request('/api/content','GET',undefined,{cookie:secondLogin.cookie,csrf:secondLogin.body.csrf})).body.mySuggestions.length,0);
  assert.equal((await request('/api/quality/records','GET',undefined,{cookie:secondLogin.cookie,csrf:secondLogin.body.csrf})).body.items.length,0);
  assert.equal((await fetch(base+`/api/quality/photos/${firstPhoto}`,{headers:{Cookie:secondLogin.cookie}})).status,404);
  assert.equal(content.body.questions.length,1);
  assert.equal(content.body.procedures.length,1);
  assert.equal(content.body.foamGreenCatalog.length,32);
  assert.equal(content.body.foamGreenCatalog.find(item=>item.id==='ev25').width,1155);
  assert.equal(content.body.foamGreenCatalog.find(item=>item.id==='ev24').width,null);
  assert.equal(content.body.foamGreenCatalog.find(item=>item.id==='ev25').settings.sx.height,'109');
  assert.equal(content.body.foamGreenCatalog.find(item=>item.id==='ev25').settings.dx.depth,'61,00');
  assert.equal(content.body.foamGreenCatalog.find(item=>item.id==='ev29').settings.dx.depth,null);
  assert.equal((await request(`/api/news/${savedNews.body.item.id}`,'DELETE',{},readerSession)).status,403);
  assert.equal((await request(`/api/news/${savedNews.body.item.id}`,'DELETE',{},adminSession)).status,200);
  assert.equal((await fetch(base+'/api/foam-green/photo/ev03',{headers:{Cookie:reader.cookie}})).status,404);
  assert.equal((await fetch(base+'/docs/pentano-insst.pdf')).status,401);
  const pdf=await fetch(base+'/docs/pentano-insst.pdf',{headers:{Cookie:reader.cookie}});
  assert.equal(pdf.status,200);
  assert.equal(pdf.headers.get('content-type'),'application/pdf');
  for(const name of ['diisocianatos-insst.pdf','cargas-insst.pdf','perfiladora-accidente-insst.pdf','cizalla-accidente-insst.pdf','lugares-insst.pdf','ruido-insst.pdf']){
    const document=await fetch(base+'/docs/'+name,{headers:{Cookie:reader.cookie}});
    assert.equal(document.status,200,name);
    assert.equal(document.headers.get('content-type'),'application/pdf',name);
    await document.arrayBuffer();
  }
  assert.equal((await request('/api/account/password','POST',{
    currentPassword:'otra-clave-de-prueba-123',newPassword:'nueva-clave-de-prueba-123'
  },readerSession)).status,200);
  assert.equal((await request('/api/content','GET',undefined,readerSession)).status,401);
  assert.equal((await request('/api/login','POST',{
    username:'lector',password:'nueva-clave-de-prueba-123'
  })).status,200);
  assert.equal((await request('/api/login','POST',{username:{unexpected:true},password:'clave'})).status,401);
  // A request whose body is still arriving must respect revoked permissions.
  async function pendingRequest(route, session, method='POST') {
    let incomingResolve;
    const incoming=new Promise(resolve=>{incomingResolve=resolve;});
    const observe=req=>{if(req.url===route){server.off('request',observe);incomingResolve(req);}};
    server.on('request',observe);
    let outgoing;
    const response=new Promise((resolve,reject)=>{
      outgoing=http.request(base+route,{method,headers:{'Content-Type':'application/json','Cookie':session.cookie,'X-CSRF-Token':session.csrf}},res=>{
        const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(Buffer.concat(chunks).toString('utf8'))}));
      });outgoing.on('error',reject);outgoing.flushHeaders();
    });
    const incomingRequest=await incoming;
    return {outgoing,response,incoming:incomingRequest};
  }
  const temporaryAdmin=await request('/api/users','POST',{username:'admin_temporal',password:'clave-temporal-revision-123',role:'admin'},adminSession);
  const temporaryLogin=await request('/api/login','POST',{username:'admin_temporal',password:'clave-temporal-revision-123'});
  const slow=await pendingRequest('/api/inventory',{cookie:temporaryLogin.cookie,csrf:temporaryLogin.body.csrf});
  assert.equal((await request(`/api/users/${temporaryAdmin.body.user.id}`,'PUT',{role:'reader'},adminSession)).status,200);
  slow.outgoing.end(JSON.stringify({...inventory,name:'No debe guardarse'}));
  assert.equal((await slow.response).status,401,'Una sesión revocada no debe terminar una escritura pendiente');
  const firstUser=await request('/api/users','POST',{username:'revision_a',password:'clave-temporal-revision-123',role:'reader'},adminSession);
  const targetUser=await request('/api/users','POST',{username:'revision_b',password:'clave-temporal-revision-123',role:'reader'},adminSession);
  const nextUser=await request('/api/users','POST',{username:'revision_c',password:'clave-temporal-revision-123',role:'reader'},adminSession);
  const userEdit=await pendingRequest(`/api/users/${targetUser.body.user.id}`,adminSession,'PUT');
  assert.equal((await request(`/api/users/${firstUser.body.user.id}`,'DELETE',{},adminSession)).status,200);
  userEdit.outgoing.end(JSON.stringify({role:'admin'}));
  assert.equal((await userEdit.response).status,200);
  const updatedUsers=(await request('/api/users','GET',undefined,adminSession)).body.users;
  assert.equal(updatedUsers.find(user=>user.id===targetUser.body.user.id).role,'admin');
  assert.equal(updatedUsers.find(user=>user.id===nextUser.body.user.id).role,'reader','No se debe cambiar el rol de otra cuenta por un cambio de posición');
  const unicodeBody=Buffer.from(JSON.stringify({...suggestion,title:'Revisión técnica'}));
  const cut=unicodeBody.indexOf(Buffer.from('ó'))+1;
  const unicodeRequest=await pendingRequest('/api/suggestions',adminSession);
  const firstChunk=new Promise(resolve=>unicodeRequest.incoming.once('data',resolve));
  unicodeRequest.outgoing.write(unicodeBody.subarray(0,cut));await firstChunk;
  unicodeRequest.outgoing.end(unicodeBody.subarray(cut));
  assert.equal((await unicodeRequest.response).body.item.title,'Revisión técnica');
  const photoPath=path.join(dataDir,'quality-photos',`${firstPhoto}.jpg`);
  fs.unlinkSync(photoPath);fs.mkdirSync(photoPath);
  assert.equal((await fetch(base+`/api/quality/photos/${firstPhoto}`,{headers:{Cookie:admin.cookie}})).status,404);
  fs.rmdirSync(photoPath);fs.writeFileSync(photoPath,fakeJpeg);
  const storePath=path.join(dataDir,'store.json');const blockedStore=storePath+'.tmp';
  fs.mkdirSync(blockedStore);const logError=console.error;
  try{console.error=()=>{};assert.equal((await request('/api/inventory','POST',{...inventory,name:'Escritura fallida'},adminSession)).status,500);}
  finally{console.error=logError;fs.rmdirSync(blockedStore);}
  assert.equal((await request('/api/inventory','GET',undefined,adminSession)).body.items.some(item=>item.name==='Escritura fallida'),false);
  assert.equal((await request('/api/inventory','POST',{...inventory,name:'Escritura correcta'},adminSession)).status,201);
  assert.equal(JSON.parse(fs.readFileSync(storePath,'utf8')).inventory.some(item=>item.name==='Escritura fallida'),false);
  await new Promise(resolve=>server.close(resolve));process.env.PORT='0';
  delete require.cache[require.resolve('./server.cjs')];server=require('./server.cjs');
  if(!server.listening)await new Promise(resolve=>server.once('listening',resolve));
  base=`http://127.0.0.1:${server.address().port}`;
  assert.equal((await request('/api/bootstrap')).body.setupRequired,false);
  assert.equal((await request('/api/bootstrap')).body.user,null);
  const restartedLogin=await request('/api/login','POST',{username:admin.body.user.username,password:admin.body.user.username==='administracion'?'una-clave-de-prueba-123':'otra-clave-inicial-123'});
  const restartSession={cookie:restartedLogin.cookie,csrf:restartedLogin.body.csrf};
  assert.equal((await request('/api/inventory','GET',undefined,restartSession)).body.items.some(item=>item.name==='Escritura correcta'),true);
  assert.equal((await request('/api/issues','GET',undefined,restartSession)).body.items[0].materialDate,forecast.materialDate);
  assert.equal((await request('/api/quality/records','GET',undefined,restartSession)).body.items.find(item=>item.templateId===savedTemplate.body.item.id).revision,1);
  assert.equal((await fetch(base+`/api/quality/photos/${firstPhoto}`,{headers:{Cookie:restartedLogin.cookie}})).status,200);
  for(let i=0;i<50;i++)await request('/api/login','POST',{username:`desconocido${i}`,password:'clave-incorrecta'});
  assert.equal((await request('/api/login','POST',{username:'otro-desconocido',password:'clave-incorrecta'})).status,429);
  const stored=fs.readFileSync(path.join(dataDir,'store.json'),'utf8');
  assert.doesNotMatch(stored,/una-clave-de-prueba-123|otra-clave-inicial-123|otra-clave-de-prueba-123|nueva-clave-de-prueba-123/);
  console.log('Servidor, permisos, calidad, mantenimiento y conservación de datos tras reiniciar: correctos.');
}

main().catch(error => { console.error(error); process.exitCode=1; }).finally(() => {
  server.close();
  const resolved=path.resolve(dataDir);
  if (resolved.startsWith(path.resolve(os.tmpdir())+path.sep) && path.basename(resolved).startsWith('isopan-server-test-')) {
    fs.rmSync(resolved,{recursive:true,force:true});
  }
});
