const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const storage = new Map();
const listeners = {};
const requests = [];
const app = { innerHTML: '' };
const context = {
  document: {
    documentElement: { dataset: {} },
    getElementById(id) { return ({ app })[id]; },
    addEventListener(name, handler) { listeners[name] = handler; }
  },
  window: { addEventListener(name, handler) { listeners[name] = handler; }, scrollTo() {} },
  location: { hash: '' },
  localStorage: {
    getItem(key) { return storage.get(key) ?? null; },
    setItem(key, value) { storage.set(key, value); }
  },
  fetch: async (url) => { requests.push(url); return ({ ok: true, json: async () => url === '/api/bootstrap'
    ? { setupRequired: false, user: { id: 'admin', username: 'prueba', role: 'admin' }, csrf: 'prueba' }
    : url === '/api/content' ? { home: {}, procedures: [], questions: [], foamGreenCatalog: JSON.parse(fs.readFileSync('foam-green-catalog.json','utf8')).map(item=>{const reading=JSON.parse(fs.readFileSync('foam-green-readings.json','utf8'))[item.id];return reading?{...item,settings:{sx:reading.sx,dx:reading.dx},review:reading.review}:item;}) }
    : url === '/api/inventory' || url === '/api/issues' || url === '/api/quality/templates' || url === '/api/quality/records' || url.startsWith('/api/handovers?month=') ? { items: [] }
    : url.startsWith('/api/handovers?date=') ? { item: null } : { users: [] } }); },
  Intl,
  Date
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('learning-content.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('learning-expanded.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('test-questions.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('foam-green.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('quality.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);

async function main() {
await new Promise(resolve => setImmediate(resolve));
assert.match(app.innerHTML,/Iniciar sesión/,'Abrir la app pide la cuenta aunque exista una sesión anterior');
assert(requests.includes('/api/logout'),'La sesión anterior se cierra al abrir la app');
assert(!requests.includes('/api/content'),'No se carga contenido privado antes de iniciar sesión');
await vm.runInContext("(async()=>{state.auth={loading:false,setupRequired:false,user:{id:'admin',username:'prueba',role:'admin'},csrf:'prueba',error:''};await loadContent();await loadQualityData();await loadUsers();await loadOfficeData();render();})()",context);
const incomplete=vm.runInContext("qualityPageComplete({pages:[{type:'questions',questions:[{options:['Sí','No']},{options:['Sí','No']}]}]},0,{selected:[,0]})",context);
assert.equal(incomplete,false,'La última respuesta no debe permitir saltar preguntas sin contestar');

function visit(route, expected) {
  context.location.hash = `#/${route}`;
  listeners.hashchange();
  assert.match(app.innerHTML, expected);
}

assert.match(app.innerHTML, /isopan-logo-official\.png/);
assert.match(app.innerHTML, /class="brand" href="#\/inicio"/);
assert.doesNotMatch(app.innerHTML, /Áreas de producción/);
assert.doesNotMatch(app.innerHTML, /Tu espacio de trabajo/);
assert.match(app.innerHTML, /Tablero de noticias/);
assert.match(app.innerHTML, /Buzón de sugerencias/);
assert.match(app.innerHTML, /Mis sugerencias/);
vm.runInContext("state.news=[{id:'n',category:'Evento',title:'Encuentro de equipo',body:'El viernes',createdAt:'2026-09-29T10:00:00Z',eventDate:'2026-10-02'}];state.mySuggestions=[{id:'s',category:'Mejora',title:'Una idea',body:'Mejorar el portal',status:'En revisión',createdAt:'2026-09-29T10:00:00Z'}];render()",context);
assert.match(app.innerHTML, /Encuentro de equipo/);
assert.match(app.innerHTML, /En revisión/);
vm.runInContext("state.news=[{id:'n',category:'General',title:'<img src=x onerror=alert(1)>',body:'<script>alert(1)</script>',createdAt:'2026-09-29T10:00:00Z',eventDate:''}];state.mySuggestions=[{id:'s',category:'Mejora',title:'<b>prueba</b>',body:'<svg onload=alert(1)>',status:'Nueva',createdAt:'2026-09-29T10:00:00Z'}];render()",context);
assert.doesNotMatch(app.innerHTML, /<script>alert\(1\)<\/script>|<img src=x onerror=alert\(1\)>|<svg onload=alert\(1\)>/);
assert.match(app.innerHTML, /&lt;script&gt;/);
assert.match(app.innerHTML, /&lt;svg/);
visit('admin', /Noticias/);
assert.doesNotMatch(app.innerHTML,/data-admin-tab="calidad"/);
vm.runInContext("state.adminTab='noticias';render()",context);
assert.match(app.innerHTML, /Nueva noticia/);
vm.runInContext("state.adminTab='sugerencias';render()",context);
assert.match(app.innerHTML, /Sugerencias recibidas/);
visit('produccion', /Selecciona un área/);
visit('produccion/perfiladora', /Línea Verde/);
visit('produccion/perfiladora/Verde', /Preparar un cambio/);
assert.doesNotMatch(app.innerHTML,/Abrir controles/);
visit('calidad', /Selecciona un área/);
assert.match(app.innerHTML,/Controles de calidad/);
assert.match(app.innerHTML,/data-nav="calidad\/administrar"/);
visit('calidad/administrar',/Administrar controles/);
vm.runInContext("state.quality.editor=qualityBlankTemplate();render()",context);
assert.match(app.innerHTML,/Añadir página de foto/);
visit('calidad/perfiladora', /Línea Verde/);
visit('calidad/perfiladora/Verde',/Aún no hay un control publicado/);
vm.runInContext("state.quality.templates=[{id:'t',name:'Control inicial',area:'perfiladora',line:'Verde',status:'published',revision:1,pages:[{type:'questions',title:'Primera página',questions:[{prompt:'¿Aspecto correcto?',options:['Sí','No']}]},{type:'photo',title:'Pantalla',prompt:'Fotografía la pantalla de control',required:true}]}];render()",context);
assert.match(app.innerHTML,/Control inicial/);
vm.runInContext("state.quality.run={templateId:'t',page:0,answers:[{selected:[0]}]};render()",context);
assert.match(app.innerHTML,/Primera página/);
vm.runInContext("state.quality.run.page=1;render()",context);
assert.match(app.innerHTML,/Fotografía la pantalla de control/);
vm.runInContext("state.quality.run=null;render()",context);
vm.runInContext("setTheme('dark');render()",context);
assert.match(app.innerHTML,/aria-checked="true" aria-label="Modo oscuro"/);
assert.equal(storage.get('isopan-theme'),'dark');
vm.runInContext("setTheme('light');state.auth.user.role='reader';render()",context);
visit('calidad/perfiladora/Verde',/Control inicial/);
assert.doesNotMatch(app.innerHTML,/data-nav="calidad\/administrar"/);
visit('calidad/administrar',/Inicio/);
vm.runInContext("state.auth.user.role='admin';render()",context);
assert.doesNotMatch(app.innerHTML, /Datos del cambio/);
visit('produccion/perfiladora/Verde/cambio', /Datos del cambio/);
visit('produccion/lana-de-roca', /Línea única/);
visit('aprendizaje', /Elige tu puesto/);
assert.doesNotMatch(app.innerHTML, /Mapa de producción|Elegir la línea|Documentación validada/);
vm.runInContext("state.learningArea='general';state.lesson=0;render()",context);
assert.match(app.innerHTML, /PRL en el sector del metal/);
assert.match(app.innerHTML, /Antes de empezar/);
assert.match(app.innerHTML, /TEMA 05/);
vm.runInContext("state.learningArea='perfiladora';state.lesson=1;render()",context);
assert.match(app.innerHTML, /TEMA 06/);
vm.runInContext("state.learningArea='cortadora';state.lesson=2;render()",context);
assert.match(app.innerHTML, /TEMA 07/);
vm.runInContext("state.learningArea='espuma';state.lesson=5;render()",context);
assert.match(app.innerHTML, /Pentano y riesgo de incendio/);
assert.match(app.innerHTML, /Atmósferas explosivas/);
assert.match(app.innerHTML, /docs\/pentano-insst\.pdf/);
vm.runInContext("state.learningArea='general';state.lesson=8;render()",context);
assert.match(app.innerHTML,/Caídas al mismo y a distinto nivel/);
assert.match(app.innerHTML,/docs\/lugares-insst\.pdf/);
vm.runInContext("state.learningArea='lana-de-roca';state.lesson=20;render()",context);
assert.match(app.innerHTML,/Lana de roca|lana mineral/);
vm.runInContext("state.learningArea='embaladora';state.lesson=23;render()",context);
assert.match(app.innerHTML,/Apilado y formación del paquete/);
const topicCount=vm.runInContext('LESSONS.length',context);
assert.equal(topicCount,25);
for(let i=0;i<topicCount;i++){
  vm.runInContext(`state.learningArea=lessonArea(LESSONS[${i}]);state.lesson=${i};render()`,context);
  assert.match(app.innerHTML,/Documentos de referencia/);
}
visit('test', /Elige el contenido/);
assert.match(app.innerHTML,/PRL general/);
assert.match(app.innerHTML,/Lana de roca/);
assert.equal(vm.runInContext("window.ISOPAN_STUDY_QUESTIONS.length",context),31);
assert.equal(vm.runInContext("approvedQuestions().length",context),31);
visit('oficinas', /Áreas jefes de turno/);
visit('oficinas/inventarios', /Nuevo artículo/);
assert.match(app.innerHTML, /Nastros/);
assert.match(app.innerHTML, /Mezcladores promotor/);
assert.match(app.innerHTML, /Bobinas/);
visit('oficinas/jefes-turno', /Guardar relevo/);
assert.match(app.innerHTML,/Incidencias abiertas/);
assert.match(app.innerHTML,/Registrar incidencia/);
vm.runInContext("state.office.issues=[{id:'i',area:'perfiladora',priority:'Alta',title:'Rodillo pendiente',description:'Revisar el rodillo',assignee:'Mantenimiento',status:'open',author:'prueba',createdAt:'2026-09-29T10:00:00Z'}];render()",context);
assert.match(app.innerHTML,/Rodillo pendiente/);
assert.match(app.innerHTML,/Incidencia abierta/);
visit('mantenimiento',/Editar previsión/);
assert.match(app.innerHTML,/Rodillo pendiente/);
assert.match(app.innerHTML,/Fecha prevista de llegada del material/);
assert.match(app.innerHTML,/Marcar resuelta/);
vm.runInContext("state.office.issues[0].materialDate='2026-10-07';state.office.issues[0].maintenanceNote='Pendiente del proveedor';render()",context);
assert.match(app.innerHTML,/Pendiente del proveedor/);
visit('oficinas/jefes-turno',/Pendiente del proveedor/);
assert.match(app.innerHTML, /Turno 1/);
assert.match(app.innerHTML, /Perfiladora/);
assert.match(app.innerHTML, /Relevo anterior sin registrar/);
vm.runInContext("state.office.incoming={notes:{perfiladora:'',espuma:'','lana-de-roca':'',cortadora:'',embaladora:''}};render()",context);
assert.match(app.innerHTML, /Sin comentario del turno anterior/);
vm.runInContext("state.office.incoming.notes.perfiladora='Incidencia';state.office.drafts[`${state.office.date}/${state.office.shift}`]={perfiladora:'Nota sin guardar'};render()",context);
assert.match(app.innerHTML, /Incidencia/);
assert.match(app.innerHTML, /Nota sin guardar/);
assert.match(app.innerHTML, /Hay cambios sin guardar/);

visit('produccion/espuma/Azul/cambio', /Datos del cambio/);
listeners.submit({
  target: {
    id: 'draft-form', dataset: { key: 'espuma-Azul' },
    querySelector(selector) { return selector === '[name="current"]' ? { value: 'REF-1' } : { value: 'REF-2' }; }
  },
  preventDefault() {}
});
assert.equal(JSON.parse(storage.get('isopan-draft-admin-espuma-Azul')).next, 'REF-2');
assert.match(app.innerHTML, /id="summary-current">REF-1/);
assert.match(app.innerHTML, /id="summary-next">REF-2/);
assert.match(app.innerHTML, /Borrador guardado/);
visit('produccion/espuma/Azul/cambio', /value="REF-1"/);
vm.runInContext("state.auth.user={id:'other',username:'otra-persona',role:'admin'};render()",context);
assert.doesNotMatch(app.innerHTML, /value="REF-1"/);
vm.runInContext("state.auth.user={id:'admin',username:'prueba',role:'admin'};render()",context);

context.window.ISOPAN_PROCEDURES = [{
  id: 'smoke-guide', area: 'espuma', line: 'Azul', fromPanel: 'REF-1', toPanel: 'REF-2',
  title: 'Guía de prueba automatizada', source: 'Prueba local', validatedBy: 'Prueba local',
  status: 'approved', steps: [{ title: 'Paso de prueba', instruction: 'Texto de prueba' }]
}];
visit('produccion/espuma/Azul/cambio', /Guía de prueba automatizada/);
visit('produccion/espuma/Verde/cambio', /Tipo de formulado/);
assert.match(app.innerHTML, /KIMPUR/);
vm.runInContext("state.foamGreen={formulation:'FP1',current:{family:'forzen',thickness:120,width:1150},next:{family:'box',thickness:60,width:1155}};render()",context);
assert.match(app.innerHTML, /Receta de FP1/);
assert.match(app.innerHTML, /Forzen 120 · 1150 mm/);
assert.match(app.innerHTML, /Box 60 · 1155 mm/);
assert.match(app.innerHTML, /Ver ficha de preparación/);
assert.match(app.innerHTML, /Variantes pendientes de clasificar/);
assert.doesNotMatch(app.innerHTML, /api\/foam-green\/photo|foam-photo|<img[^>]+WhatsApp/);
vm.runInContext("state.foamGreenBoxPhotos=[{side:'dx',url:'/api/foam-green/box-photos/box-1'},{side:'sx',url:'/api/foam-green/box-photos/box-4'}];render()",context);
assert.match(app.innerHTML,/Fotos de referencia · Box 1155/);
assert.match(app.innerHTML,/Lado DX/);
assert.match(app.innerHTML,/Lado SX/);
assert.match(app.innerHTML,/box-photos\/box-1/);
assert.match(vm.runInContext("foamGreenBoxPhotos({family:'box',width:1000})",context),/Box 1000/);
assert.equal(vm.runInContext("foamGreenBoxPhotos({family:'box',width:1150})",context),'');
assert.equal(vm.runInContext("foamGreenBoxPhotos({family:'forzen',width:1000})",context),'');
vm.runInContext("state.foamGreen={formulation:'FP1',current:{family:'box',thickness:60,width:1000},next:{family:'forzen',thickness:120,width:1150}};render()",context);
assert.doesNotMatch(app.innerHTML,/foam-box-photos|box-photos\/box-/,'Box en el panel actual no debe mostrar las fotos');
vm.runInContext("state.foamGreen.next={family:'box',thickness:60,width:1155};render()",context);
assert.match(app.innerHTML,/Fotos de referencia · Box 1155/);
vm.runInContext("state.foamGreen.next={family:'isoparette'};render()",context);
assert.doesNotMatch(app.innerHTML,/foam-box-photos|box-photos\/box-/,'Cambiar el tipo del panel siguiente debe ocultar las fotos');
vm.runInContext("state.foamGreen={formulation:'FP1',current:{family:'forzen',thickness:120,width:1150},next:{family:'box',thickness:60,width:1155}};render()",context);
context.foamGreenClick({target:{closest(selector){return selector.includes('[data-foam-show-result]')?{dataset:{foamShowResult:''}}:null;}}});
assert.match(app.innerHTML,/Fotos de referencia · Box 1155/);
assert.match(app.innerHTML, /Ficha de preparación/);
assert.match(app.innerHTML, /Profundidad del tapón/);
assert.match(app.innerHTML, /Guarnición/);
assert.match(app.innerHTML, /109/);
vm.runInContext("state.foamGreen.next={family:'forzen',thickness:80,width:1120};state.foamGreen.view='result';render()",context);
assert.match(app.innerHTML, /Anónimo 38/);
assert.match(app.innerHTML, /65,20/);
vm.runInContext("state.foamGreen.next={family:'forzen',thickness:120,width:1150};state.foamGreen.recordId=null;render()",context);
assert.match(app.innerHTML, /dos fichas|2 fichas/);
assert.match(app.innerHTML, /184/);
context.foamGreenClick({target:{closest(selector){return selector.includes('[data-foam-record]')?{dataset:{foamRecord:'ev31'}}:null;}}});
assert.match(app.innerHTML, /180,0/);
context.foamGreenClick({target:{closest(selector){return selector.includes('[data-foam-edit]')?{dataset:{foamEdit:''}}:null;}}});
assert.match(app.innerHTML, /Ver ficha de preparación/);

context.window.ISOPAN_QUESTIONS = [{
  id: 'smoke-only', area: 'perfiladora', prompt: 'Pregunta de prueba automatizada',
  options: ['Opción de prueba A', 'Opción de prueba B'], correctIndex: 0,
  explanation: 'Explicación de prueba', source: 'Prueba local', validatedBy: 'Prueba local', status: 'approved'
}];
visit('test', /Elige el contenido/);
assert.equal(vm.runInContext("approvedQuestions().some(q=>q.id==='smoke-only')",context),true);
function click(attribute, value = '') {
  listeners.click({ target: { closest(selector) { return selector === `[${attribute}]` ? { dataset: { [attribute.slice(5)]: value } } : null; } } });
}
click('data-start');
assert.match(app.innerHTML, /secuencia general de una línea continua/);
vm.runInContext("state.quiz.items=[state.quiz.items[0]];render()",context);
click('data-option', '0');
click('data-check');
assert.match(app.innerHTML, /Respuesta correcta/);
click('data-next');
assert.match(app.innerHTML, /Respuestas correctas/);
vm.runInContext("state.auth.user.role='reader'; render()", context);
assert.doesNotMatch(app.innerHTML, /Panel de administración/);
assert.doesNotMatch(app.innerHTML, /Oficinas PRÓX/);
assert.doesNotMatch(app.innerHTML, /Mi cuenta/);
visit('oficinas', /Bienvenido a Isopan/);
assert.equal(context.location.hash, '#/inicio');
visit('produccion/%E0%A4',/Bienvenido a Isopan/);
const previousFetch=context.fetch;
context.fetch=async()=>({ok:false,status:500,json:async()=>({error:'Servidor no disponible'})});
await listeners.click({target:{closest(selector){return selector==='[data-logout]'?{}:null;}}});
assert.equal(vm.runInContext('state.auth.user.role',context),'reader');
assert.match(app.innerHTML,/No se pudo cerrar la sesión/);
context.fetch=previousFetch;
vm.runInContext("state.auth.user.role='admin';state.quality.templates=[{id:'photo-test',area:'perfiladora',line:'Verde',status:'published',name:'Control de foto',revision:1,pages:[{type:'photo',title:'Foto opcional',prompt:'Foto de la pantalla',required:false},{type:'questions',title:'Pregunta',questions:[{prompt:'¿Correcto?',options:['Sí','No']}]}]}];state.quality.run={templateId:'photo-test',page:0,answers:[]};location.hash='#/calidad/perfiladora/Verde';render()",context);
const originalImageData=context.qualityImageData;let finishPhoto;
context.qualityImageData=()=>new Promise(resolve=>{finishPhoto=resolve;});
const photoPromise=context.qualityChange({target:{id:'quality-photo',files:[{}],matches:selector=>selector==='[data-quality-photo]'}});
context.qualityClick({target:{closest(){return {dataset:{qualityNext:''}};}}});
assert.equal(vm.runInContext('state.quality.run.page',context),0,'No se debe avanzar mientras se prepara una foto');
finishPhoto('data:image/jpeg;base64,foto-de-prueba');await photoPromise;
assert.equal(vm.runInContext('state.quality.run.answers[0].photoData',context),'data:image/jpeg;base64,foto-de-prueba');
context.qualityImageData=originalImageData;
vm.runInContext("state.quality.run=null;state.quality.records=Array.from({length:9},(_,i)=>({id:'history-'+i,templateName:'Registro '+i,area:'perfiladora',line:'Verde',authorId:state.auth.user.id,author:'Prueba',createdAt:'2026-09-30T12:00:00Z'}));render()",context);
assert.match(app.innerHTML,/Registro 8/,'El historial no debe ocultar los controles más antiguos');
vm.runInContext("state.office.issues=[{id:'draft-issue',area:'perfiladora',priority:'Alta',title:'Incidencia de prueba',description:'Revisión pendiente',status:'open',createdAt:'2026-09-30T12:00:00Z',author:'Prueba'}];state.office.maintenanceDrafts={'draft-issue':{repairDate:'2026-10-08',materialDate:'',maintenanceNote:'Nota sin guardar'}};state.office.issueDraft={title:'Incidencia sin guardar',description:'Descripción pendiente'};location.hash='#/mantenimiento';render()",context);
assert.match(app.innerHTML,/Nota sin guardar/);
assert.match(app.innerHTML,/Incidencia sin guardar/);
context.location.hash='#main';listeners.hashchange();
assert.match(app.innerHTML,/Nota sin guardar/,'Saltar al contenido debe conservar la página y sus campos');
context.FormData=class{constructor(form){this.values=form.values;}entries(){return Object.entries(this.values);}};
let savedQuestion;
context.fetch=async(url,options)=>{
  if(url==='/api/questions'){savedQuestion=JSON.parse(options.body);return {ok:true,json:async()=>({item:{id:'new-question'}})};}
  return previousFetch(url,options);
};
const questionForm={id:'admin-question-form',dataset:{},values:{area:'perfiladora',status:'draft',prompt:'Pregunta de prueba',option0:'Respuesta A',option1:'Respuesta B',option2:'',option3:'Respuesta D',correctIndex:'2',explanation:'Explicación',source:'Documento',validatedBy:'Responsable'}};
await listeners.submit({target:questionForm,preventDefault(){}});
assert.equal(savedQuestion,undefined,'Una opción vacía no debe convertirse en otra respuesta correcta');
questionForm.values.correctIndex='3';await listeners.submit({target:questionForm,preventDefault(){}});
assert.equal(savedQuestion.options[savedQuestion.correctIndex],'Respuesta D');
context.fetch=previousFetch;
vm.runInContext("state.office.inventory=[{name:'Dato privado'}];state.users=[{username:'Dato privado'}];state.auth.user=null;resetPersonalState()",context);
assert.equal(vm.runInContext('state.office.inventory.length+state.users.length+state.quality.records.length',context),0);
console.log('Navegación, borradores, calidad, mantenimiento, guías y test: correctos.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
