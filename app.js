const AREAS = [
  { id: 'perfiladora', name: 'Perfiladora', lines: ['Verde', 'Azul'], icon: 'layers' },
  { id: 'espuma', name: 'Espuma', lines: ['Verde', 'Azul'], icon: 'drop' },
  { id: 'lana-de-roca', name: 'Lana de roca', lines: ['Única'], icon: 'grid' },
  { id: 'cortadora', name: 'Cortadora', lines: ['Verde', 'Azul'], icon: 'cut' },
  { id: 'embaladora', name: 'Embaladora', lines: ['Única'], icon: 'package' }
];
const INVENTORY_CATEGORIES = ['Nastros','Guarnicion','Pelabiles','Peines espuma','Peines cola','Mezcladores cola','Mezcladores promotor','Bobinas'];

const ICONS = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
  factory: '<path d="M3 21V9l6 3V9l6 3V4h6v17z"/><path d="M7 17h1m4 0h1m4 0h1"/>',
  office: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2m4 0h2M8 11h2m4 0h2M9 21v-5h6v5"/>',
  switch: '<path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/>',
  book: '<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1z"/><path d="M12 6v14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  alert: '<path d="m12 3 10 18H2z"/><path d="M12 9v5m0 3h.01"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  drop: '<path d="M12 3c-3 4-7 8-7 12a7 7 0 0 0 14 0c0-4-4-8-7-12z"/>',
  grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18m6-18v18M3 9h18M3 15h18"/>',
  cut: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M8.5 15.5 20 4M15.5 15.5 4 4"/>',
  package: '<path d="m3 7 9-4 9 4v10l-9 4-9-4z"/><path d="m3 7 9 4 9-4M12 11v10M7.5 5l9 4"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  clipboard: '<rect x="5" y="5" width="14" height="17" rx="2"/><path d="M9 5V3h6v2M9 11h6m-6 4h6"/>',
  tools: '<path d="M14 6a5 5 0 0 0-6 6L3 17l4 4 5-5a5 5 0 0 0 6-6l-3 3-4-4z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const app = document.getElementById('app');
function savedTheme(){try{return localStorage.getItem('isopan-theme')==='dark'?'dark':'light';}catch{return 'light';}}
function setTheme(theme){document.documentElement.dataset.theme=theme;try{localStorage.setItem('isopan-theme',theme);}catch{}}
setTheme(savedTheme());
const state = { route: '', menu: false, lesson: 0, learningArea: null, completed: [], quiz: { area: 'all', items: [], index: 0, answers: [], chosen: null, checked: false, phase: 'setup' }, auth: { loading: true, setupRequired: false, user: null, csrf: null, error: '' }, home: null, news: [], mySuggestions: [], suggestions: [], homeMessage: '', adminTab: 'portada', editNews: null, foamGreenCatalog: [], foamGreen: null, quality:{templates:[],records:[],editor:null,run:null,viewRecord:null,message:'',saving:false} };
const today=new Date();
const todayKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
state.office={inventory:[],handovers:[],issues:[],month:todayKey.slice(0,7),date:todayKey,shift:1,incoming:null,message:'',drafts:{}};

function learningKey() { return `isopan-learning-${state.auth.user?.id || 'sin-cuenta'}`; }
function readCompleted() { try { const value=JSON.parse(localStorage.getItem(learningKey()) || '[]'); return Array.isArray(value)?value:[]; } catch { return []; } }
function resetPersonalState() {
  state.completed=state.auth.user?readCompleted():[];state.lesson=0;state.learningArea=null;
  state.quiz={area:'all',items:[],index:0,answers:[],chosen:null,checked:false,phase:'setup'};
  Object.assign(state.office,{inventory:[],handovers:[],issues:[],incoming:null,message:'',drafts:{},maintenanceDrafts:{},issueDraft:null});
  state.home=null;state.news=[];state.mySuggestions=[];state.suggestions=[];state.users=[];state.foamGreenCatalog=[];state.foamGreen=null;
  window.ISOPAN_PROCEDURES=[];window.ISOPAN_QUESTIONS=[];
  state.adminTab='portada';state.editNews=null;state.editGuide=null;state.editQuestion=null;state.editInventory=null;state.resetUser=null;
  state.adminMessage='';state.accountMessage='';state.homeMessage='';state.globalMessage='';
  state.quality={templates:[],records:[],editor:null,run:null,viewRecord:null,message:'',saving:false};
}
function changeDraftKey(key) { return `isopan-draft-${state.auth.user?.id || 'sin-cuenta'}-${key}`; }
function getDraft(key) { try { return JSON.parse(localStorage.getItem(changeDraftKey(key)) || 'null'); } catch { return null; } }
function saveLocal(key,value) { try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch { return false; } }
function approvedProcedure(a,line,current,next) {
  const entries = Array.isArray(window.ISOPAN_PROCEDURES) ? window.ISOPAN_PROCEDURES : [];
  const same = (left,right) => String(left ?? '').trim().toLocaleLowerCase('es') === String(right ?? '').trim().toLocaleLowerCase('es');
  return entries.find(p => p && p.status === 'approved' && p.area === a.id && p.line === line &&
    same(p.fromPanel,current) && same(p.toPanel,next) &&
    typeof p.title === 'string' && p.title.trim() &&
    typeof p.source === 'string' && p.source.trim() &&
    typeof p.validatedBy === 'string' && p.validatedBy.trim() &&
    Array.isArray(p.steps) && p.steps.length && p.steps.every(step =>
      step && typeof step.title === 'string' && step.title.trim() &&
      typeof step.instruction === 'string' && step.instruction.trim()));
}
function routeParts() {if(location.hash==='#main')return (state.route||'inicio').split('/');try{return (location.hash.replace(/^#\/?/, '') || 'inicio').split('/').map(decodeURIComponent);}catch{return ['inicio'];}}
function navigate(path) { location.hash = `#/${path}`; if (state.route === path) render(); }
function area(id) { return AREAS.find(a => a.id === id); }
function lineLabel(a, line) { return line === 'Única' ? a.name : `${a.name} · Línea ${line}`; }
function pageHead(label, title, description) { return `<div class="page-head"><div><div class="eyebrow">${label}</div><h1>${title}</h1><p>${description}</p></div><div class="date">${new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long',year:'numeric'}).format(new Date())}</div></div>`; }
function back(to, label) { return `<button class="breadcrumb-back" data-nav="${to}">${icon('back')}${label}</button>`; }

function shell(content, crumbs, active) {
  return `<div class="app-shell"><div class="overlay ${state.menu?'open':''}" data-close-menu></div><aside class="sidebar ${state.menu?'open':''}">
    <a class="brand" href="#/inicio" aria-label="Isopan, volver a Inicio"><img class="brand-logo" src="./isopan-logo-official.png" alt="Isopan"><span class="brand-sub">Portal interno</span></a>
    <nav class="nav-group" aria-label="Inicio">${navLink('inicio','Inicio','home',active)}</nav>
    <div class="nav-label">Espacio de trabajo</div><nav class="nav-group" aria-label="Navegación principal">
    ${navLink('produccion','Producción','factory',active)}${state.auth.user?.role==='admin'?navLink('oficinas','Oficinas','office',active)+navLink('mantenimiento','Mantenimiento','tools',active):''}</nav>
    <div class="nav-label">Controles de calidad</div><nav class="nav-group" aria-label="Controles de calidad">
    ${navLink('calidad','Controles de calidad','clipboard',active)}</nav>
    <div class="nav-label">Formación</div><nav class="nav-group" aria-label="Formación">
    ${navLink('aprendizaje','Aprendizaje','book',active)}${navLink('test','Test de conocimientos','check',active)}</nav>
    ${state.auth.user?.role==='admin'?`<div class="nav-label">Administración</div><nav class="nav-group" aria-label="Administración">${navLink('admin','Panel de administración','grid',active)}</nav>`:''}
    ${state.auth.user?.role==='admin'?`<div class="nav-label">Cuenta</div><nav class="nav-group" aria-label="Cuenta">${navLink('mi-cuenta','Mi cuenta','user',active)}</nav>`:''}
    <div class="side-footer"><strong>Isopan · uso interno</strong>Consulta siempre la documentación vigente de planta.</div></aside>
    <div class="workspace"><header class="topbar"><button class="mobile-menu" data-menu aria-expanded="${state.menu}" aria-label="Abrir menú">${icon('menu')}</button><div class="crumbs"><span>Portal interno</span><span>/</span><strong>${crumbs}</strong></div><div class="top-right">${state.auth.user?.role==='admin'?`<button class="account-name" data-nav="mi-cuenta">${escapeHtml(state.auth.user.username)}</button>`:`<span class="account-name">${escapeHtml(state.auth.user?.username || '')}</span>`}<span class="version-tag">${state.auth.user?.role==='admin'?'ADMINISTRADOR':'LECTURA'}</span><button type="button" class="theme-toggle" data-theme-toggle role="switch" aria-checked="${document.documentElement.dataset.theme==='dark'}" aria-label="Modo oscuro"><span class="theme-label-light">Claro</span><span class="theme-track"><span class="theme-thumb"></span></span><span class="theme-label-dark">Oscuro</span></button><button class="signout" data-logout>Cerrar sesión</button></div></header><main id="main" class="main">${state.globalMessage?`<div class="auth-error" role="alert">${escapeHtml(state.globalMessage)}</div>`:""}${content}<div class="footer-note">Isopan · Portal interno · Consulta la documentación vigente de planta</div></main></div></div>`;
}
function navLink(path,label,svg,active,soon=false) { return `<a href="#/${path}" class="nav-link ${active===path?'active':''}" ${active===path?'aria-current="page"':''}>${icon(svg)}<span>${label}</span>${soon?'<span class="soon">PRÓX.</span>':''}</a>`; }
function areaCard(a) { return `<button class="area-card" data-nav="produccion/${a.id}"><span class="area-icon">${icon(a.icon)}</span><strong>${a.name}</strong><span>${a.lines.length===1?'1 línea':'Líneas Verde y Azul'}</span></button>`; }

function home() {
  const h=state.home || {};
  const news=state.news||[];
  const mine=state.mySuggestions||[];
  return pageHead('Inicio','Bienvenido a Isopan.',escapeHtml(h.intro || 'Información de la empresa y acceso a los espacios internos.'))+
  `<section class="hero home-hero"><div class="hero-content"><div class="eyebrow">ISOPAN / PORTAL INTERNO</div><h2>${escapeHtml(h.heroTitle || 'Un mismo punto de encuentro para toda la plantilla.')}</h2><p>${escapeHtml(h.heroBody || 'Noticias, información de la empresa y recursos comunes.')}</p></div><div class="hero-art" aria-hidden="true"></div></section>
  <section class="home-section" aria-labelledby="news-title"><div class="home-section-head"><div><div class="eyebrow">ACTUALIDAD INTERNA</div><h2 id="news-title">Tablero de noticias</h2><p>Celebraciones, eventos y avisos para toda la plantilla.</p></div>${state.auth.user?.role==='admin'?'<button class="btn btn-outline" data-nav="admin" data-news-admin>Publicar noticia</button>':''}</div><div class="news-grid">${news.length?news.map(item=>`<article class="panel news-card"><div class="news-card-top"><span class="news-category">${escapeHtml(item.category)}</span><time datetime="${escapeHtml(item.createdAt)}">${formatPortalDate(item.createdAt)}</time></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p>${item.eventDate?`<div class="news-event">${icon('info')} Fecha: ${formatPortalDate(item.eventDate)}</div>`:''}</article>`).join(''):'<div class="panel empty-state news-empty">Todavía no hay noticias publicadas. Aparecerán aquí cuando administración publique la primera.</div>'}</div></section>
  <section class="home-section" aria-labelledby="suggestions-title"><div class="home-section-head"><div><div class="eyebrow">TU VOZ</div><h2 id="suggestions-title">Buzón de sugerencias</h2><p>Comparte una idea para mejorar el trabajo o el portal.</p></div></div><div class="suggestions-layout"><div class="panel suggestion-panel">${state.homeMessage?`<div class="admin-message" role="status">${escapeHtml(state.homeMessage)}</div>`:''}<form id="suggestion-form" class="admin-form"><div class="field"><label for="suggestion-category">Categoría</label><select id="suggestion-category" name="category"><option>Mejora</option><option>Seguridad</option><option>Otro</option></select></div><div class="field"><label for="suggestion-title">Título</label><input id="suggestion-title" name="title" maxlength="120" minlength="3" placeholder="Resume tu idea" required></div><div class="field"><label for="suggestion-body">Sugerencia</label><textarea id="suggestion-body" name="body" rows="5" maxlength="3000" minlength="10" placeholder="Explica qué propones y por qué" required></textarea></div><p class="muted">La sugerencia se enviará con tu usuario. Solo tú y administración podréis verla.</p><button class="btn btn-primary" type="submit">Enviar sugerencia ${icon('arrow')}</button></form></div><div class="panel suggestion-panel"><h3>Mis sugerencias</h3>${mine.length?`<div class="my-suggestions">${mine.map(item=>`<div class="my-suggestion"><div><strong>${escapeHtml(item.title)}</strong><span class="suggestion-status">${escapeHtml(item.status)}</span></div><small>${escapeHtml(item.category)} · ${formatPortalDate(item.createdAt)}</small><p>${escapeHtml(item.body)}</p></div>`).join('')}</div>`:'<p class="muted">Aún no has enviado ninguna sugerencia.</p>'}</div></div></section>
  <section class="home-company"><div class="panel home-company-main"><div class="eyebrow">LA EMPRESA</div><h2>${escapeHtml(h.companyTitle || 'Construimos soluciones para edificios.')}</h2><p>${escapeHtml(h.companyBody || 'Isopan desarrolla y fabrica paneles metálicos aislantes para cubiertas y fachadas.')}</p></div><div class="panel home-company-next"><span class="area-icon">${icon('office')}</span><h2>${escapeHtml(h.nextTitle || 'Esta portada crecerá contigo.')}</h2><p>${escapeHtml(h.nextBody || 'Aquí se añadirán novedades y recursos para toda la plantilla.')}</p></div></section>`;
}
function formatPortalDate(value) { const date=new Date(value);return Number.isNaN(date.getTime())?'':escapeHtml(new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long',year:'numeric'}).format(date)); }

function production() {
  return pageHead('Producción','Áreas de producción','Selecciona el área en la que trabajas.')+
  `<div class="production-layout"><section class="panel"><div class="panel-head"><h2>Selecciona un área</h2><div class="muted">Cada área muestra sus líneas disponibles.</div></div><div class="zone-list">${AREAS.map(a=>`<button class="zone-row" data-nav="produccion/${a.id}"><span class="area-icon">${icon(a.icon)}</span><span class="zone-copy"><strong>${a.name}</strong><small>${a.lines.length===1?'Una línea':'Líneas Verde y Azul'}</small></span><span class="arrow">${icon('chevron')}</span></button>`).join('')}</div></section>
  <aside class="panel"><div class="eyebrow">PRODUCCIÓN</div><h2 style="margin-top:18px">Tu área, tu línea.</h2><p class="muted">La información se organiza por área de producción y, cuando corresponde, por línea Verde o Azul. Entra en la línea adecuada para acceder a sus funciones.</p><div class="aside-block"><strong>Documentación de planta</strong><p>Los contenidos operativos específicos se incorporarán tras revisar los documentos de cada línea.</p></div></aside></div>`;
}

function areaPage(a) {
  const count = a.lines.length;
  return back('produccion','Volver a Producción')+pageHead('Producción / Área',a.name, count===1?'Esta área tiene una única línea.':'Selecciona la línea Verde o Azul.')+
  `<section class="panel"><div class="panel-head"><h2>${count===1?'Línea de '+a.name:'Líneas disponibles'}</h2><div class="muted">Accede a la línea en la que trabajas.</div></div><div class="line-grid">${a.lines.map(line=>`<button class="line-card ${line==='Azul'?'blue':line==='Única'?'neutral':''}" data-nav="produccion/${a.id}/${encodeURIComponent(line)}"><span class="line-swatch"></span><strong>${line==='Única'?'Línea única':'Línea '+line}</strong><span>Entrar en la línea →</span></button>`).join('')}</div></section>`;
}

function linePage(a,line) {
  return back(`produccion/${a.id}`,'Volver a '+a.name)+pageHead('Producción / Línea',lineLabel(a,line),'Funciones y documentación de esta línea de producción.')+
  `<section class="line-home-grid"><div class="panel line-home-primary"><span class="feature-icon">${icon('switch')}</span><div class="eyebrow">OPERACIONES</div><h2>Preparar un cambio</h2><p>Identifica el panel actual y el siguiente para consultar la guía específica de esta línea, cuando esté validada.</p><button class="btn btn-primary" data-nav="produccion/${a.id}/${encodeURIComponent(line)}/cambio">Preparar un cambio ${icon('arrow')}</button></div><aside class="panel line-home-aside"><span class="status-pill">DOCUMENTACIÓN EN PREPARACIÓN</span><h2>Información de la línea</h2><p class="muted">Las instrucciones de ${a.name.toLowerCase()} para ${line==='Única'?'esta línea':'la línea '+line} se incorporarán a partir de los documentos de producción revisados.</p><div class="aside-block"><strong>Antes de operar</strong><p>Consulta siempre el procedimiento vigente de planta y las indicaciones del responsable.</p></div></aside></section>`;
}

function draftPage(a,line) {
  if (a.id === 'espuma' && line === 'Verde') return foamGreenPage(a,line);
  const key = `${a.id}-${line}`;
  const draft = getDraft(key);
  const procedure = draft && approvedProcedure(a,line,draft.current,draft.next);
  return back(`produccion/${a.id}/${encodeURIComponent(line)}`,'Volver a la línea')+pageHead('Producción / Preparar cambio',lineLabel(a,line),'Identifica las referencias implicadas para dejar preparado el contexto de este cambio.')+
  `<div class="draft-grid"><section class="panel"><div class="panel-head"><span class="status-pill">${procedure?'GUÍA VALIDADA':'GUÍA OPERATIVA PENDIENTE'}</span><h2 style="margin-top:17px">Datos del cambio</h2><div class="muted">Anota las referencias tal como aparecen en la orden de producción.</div></div><form id="draft-form" data-key="${escapeHtml(key)}"><div class="form-grid"><div class="field"><label for="current-panel">Panel actual</label><input id="current-panel" name="current" maxlength="100" autocomplete="off" placeholder="Referencia actual" value="${escapeHtml(draft?.current || '')}" required><small>Consulta la orden de producción.</small></div><div class="field"><label for="next-panel">Panel siguiente</label><input id="next-panel" name="next" maxlength="100" autocomplete="off" placeholder="Referencia siguiente" value="${escapeHtml(draft?.next || '')}" required><small>Consulta la orden de producción.</small></div></div><div class="form-actions"><button class="btn btn-primary" type="submit">Guardar y consultar guía ${icon('arrow')}</button><span class="saved-status" role="status">${draft?'Borrador guardado en este navegador.':''}</span></div></form>${procedure?'':`<div class="warning-panel">${icon('alert')}<div><strong>Procedimiento aún no disponible</strong><p>No hay una guía validada para este par de referencias en esta línea. Sigue las instrucciones vigentes en planta y consulta al responsable antes de efectuar el cambio.</p></div></div>`}</section>
  <aside class="panel"><h2>Resumen de la ficha</h2><p class="muted">Los datos se guardan únicamente en este navegador.</p><div class="summary-list"><div class="summary-item"><span>Zona</span><strong>${a.name}</strong></div><div class="summary-item"><span>Línea</span><strong>${line==='Única'?'Única':line}</strong></div><div class="summary-item"><span>Panel actual</span><strong id="summary-current">${escapeHtml(draft?.current || 'Sin indicar')}</strong></div><div class="summary-item"><span>Panel siguiente</span><strong id="summary-next">${escapeHtml(draft?.next || 'Sin indicar')}</strong></div><div class="summary-item"><span>Guía</span><strong>${procedure?'Validada':'No disponible'}</strong></div></div><div class="aside-block"><strong>${procedure?'Documento de referencia':'Próximo paso'}</strong><p>${procedure?escapeHtml(procedure.source):`Incorporar el procedimiento real de ${a.name.toLowerCase()} a partir de la documentación facilitada por producción.`}</p></div></aside></div>${procedure?`<section class="panel guide-panel"><div class="eyebrow">PROCEDIMIENTO VALIDADO</div><h2>${escapeHtml(procedure.title)}</h2><p class="muted">Fuente: ${escapeHtml(procedure.source)} · Validado por: ${escapeHtml(procedure.validatedBy)}</p><ol class="guide-steps">${procedure.steps.map((step,i)=>`<li><span class="guide-step-number">${String(i+1).padStart(2,'0')}</span><div><strong>${escapeHtml(step.title)}</strong><p>${escapeHtml(step.instruction)}</p></div></li>`).join('')}</ol></section>`:''}`;
}

const LESSONS = window.ISOPAN_LEARNING_TOPICS || [];
const LEARNING_AREAS=[{id:'general',name:'PRL general',icon:'book'},{id:'perfiladora',name:'Perfiladora',icon:'layers'},{id:'cortadora',name:'Cortadora',icon:'cut'},{id:'espuma',name:'Espuma',icon:'drop'},{id:'lana-de-roca',name:'Lana de roca',icon:'grid'},{id:'embaladora',name:'Embaladora',icon:'package'}];
function lessonArea(item){return item.area || (item.group==='PRL GENERAL'?'general':item.group==='PERFILADORA'?'perfiladora':item.group==='CORTADORA'?'cortadora':'espuma');}
function learning() {
  if(!state.learningArea)return pageHead('Formación','Aprendizaje','Elige tu puesto para ver los temas de formación.')+`<h2 class="learning-choose-title">Elige tu puesto</h2><div class="learning-area-grid">${LEARNING_AREAS.map(area=>{const count=LESSONS.filter(item=>lessonArea(item)===area.id).length;return `<button type="button" class="panel learning-area-card" data-learning-area="${area.id}"><span class="feature-icon blue">${icon(area.icon)}</span><strong>${area.name}</strong><small>${count?`${count} ${count===1?'tema':'temas'}`:'Temario por incorporar'}</small><span>Abrir ${icon('arrow')}</span></button>`;}).join('')}</div>`;
  const indices=LESSONS.map((item,i)=>lessonArea(item)===state.learningArea?i:null).filter(i=>i!==null);
  const area=LEARNING_AREAS.find(item=>item.id===state.learningArea);
  const l=LESSONS[state.lesson];
  const tabs=indices.map(i=>`<button class="lesson-tab ${state.lesson===i?'active':''}" data-lesson="${i}" aria-current="${state.lesson===i?'step':'false'}"><span class="step-num">${state.completed.includes(i+4)?icon('check'):String(i+5).padStart(2,'0')}</span>${escapeHtml(LESSONS[i].title)}</button>`).join('');
  const body=l&&indices.includes(state.lesson)?`<div class="lesson-sections">${l.sections.map((section,i)=>`<section class="lesson-section"><div class="lesson-section-number">${String(i+1).padStart(2,'0')}</div><div><h3>${escapeHtml(section.title)}</h3><ul>${section.points.map(point=>`<li>${escapeHtml(point)}</li>`).join('')}</ul></div></section>`).join('')}</div>${l.extraSections?`<div class="lesson-sections lesson-more">${l.extraSections.map((section,i)=>`<section class="lesson-section"><div class="lesson-section-number">${String(l.sections.length+i+1).padStart(2,'0')}</div><div><h3>${escapeHtml(section.title)}</h3><ul>${section.points.map(point=>`<li>${escapeHtml(point)}</li>`).join('')}</ul></div></section>`).join('')}</div>`:''}<div class="lesson-sources"><strong>Documentos de referencia</strong><div>${l.sources.map(source=>`<a href="${escapeHtml(source.local||source.url)}" ${source.local?'download':'target="_blank" rel="noopener noreferrer"'}>${escapeHtml(source.label)} ${source.local?'↓':'↗'}</a>`).join('')}</div></div>`:'';
  return `<button type="button" class="back-link" data-learning-back>${icon('back')} Elegir otro puesto</button>`+pageHead('Aprendizaje',area?.name||'Aprendizaje',indices.length?'Temario de prevención y seguridad del puesto.':'Este puesto todavía no tiene temario específico. Puedes consultar PRL general.')+(indices.length?`<div class="learning-layout"><aside class="lesson-list" aria-label="Temas de aprendizaje">${tabs}</aside><section class="panel lesson-content"><div class="eyebrow">${escapeHtml(l.group)} · TEMA ${String(state.lesson+5).padStart(2,'0')}</div><h2>${escapeHtml(l.title)}</h2><p class="lesson-intro">${escapeHtml(l.text)}</p>${body}<div class="lesson-bottom"><div class="progress">${indices.filter(i=>state.completed.includes(i+4)).length} de ${indices.length} temas leídos<div class="progress-track"><i style="width:${indices.filter(i=>state.completed.includes(i+4)).length/indices.length*100}%"></i></div></div><button class="btn ${state.completed.includes(state.lesson+4)?'btn-ghost':'btn-primary'}" data-complete="${state.lesson}">${state.completed.includes(state.lesson+4)?'Tema leído':'Marcar como leído'} ${icon('check')}</button></div></section></div>`:'<div class="panel foam-empty">El temario específico de este puesto está pendiente de incorporar.</div>')+`<div class="notice lesson-notice">${icon('info')}<span>Estos temas no sustituyen la formación obligatoria, la evaluación de riesgos ni los procedimientos vigentes de planta.</span></div>`;
}
function officePage() {
  return pageHead('Espacios / Oficinas','Oficinas','Herramientas internas para inventarios y relevos de turno.')+
  `<section class="office-hub"><button class="panel office-hub-card" data-nav="oficinas/inventarios"><span class="feature-icon blue">${icon('package')}</span><div class="eyebrow">CONTROL INTERNO</div><h2>Inventarios</h2><p>Consulta y actualiza existencias, ubicación y observaciones de cada artículo.</p><span class="office-hub-link">Abrir inventarios ${icon('arrow')}</span></button><button class="panel office-hub-card" data-nav="oficinas/jefes-turno"><span class="feature-icon blue">${icon('clipboard')}</span><div class="eyebrow">RELEVOS</div><h2>Áreas jefes de turno</h2><p>Consulta el calendario y comunica incidencias por área al turno siguiente.</p><span class="office-hub-link">Abrir calendario ${icon('arrow')}</span></button></section>`;
}
function inventoryPage() {
  const items=state.office.inventory || [];
  const selected=items.find(item=>item.id===state.editInventory);
  return back('oficinas','Volver a Oficinas')+pageHead('Oficinas / Inventarios','Inventarios','Registro compartido de existencias y ubicaciones.')+
  `${state.office.message?`<div class="admin-message" role="status">${escapeHtml(state.office.message)}</div>`:''}<div class="admin-layout"><section class="panel admin-panel"><div class="admin-panel-head"><div><h2>Artículos</h2><p class="muted">${items.length} ${items.length===1?'artículo registrado':'artículos registrados'}</p></div><button class="btn btn-outline" data-new-inventory>Nuevo</button></div><div class="field inventory-search"><label for="inventory-search">Buscar</label><input id="inventory-search" placeholder="Nombre, categoría, ubicación o área" autocomplete="off"></div><div class="field inventory-category-filter"><label for="inventory-category-filter">Filtrar por categoría</label><select id="inventory-category-filter"><option value="">Todas las categorías</option>${INVENTORY_CATEGORIES.map(category=>`<option value="${category}">${category}</option>`).join('')}</select></div><div class="admin-list" id="inventory-list">${items.length?items.map(item=>`<button class="admin-list-item inventory-row ${state.editInventory===item.id?'active':''}" data-edit-inventory="${item.id}" data-category="${escapeHtml(item.category)}" data-search="${escapeHtml(`${item.name} ${item.category} ${item.location} ${area(item.area)?.name||''}`.toLocaleLowerCase('es'))}"><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category)} · ${escapeHtml(item.location)}${item.area?' · '+escapeHtml(area(item.area)?.name||''):''}</small></span><em>${escapeHtml(String(item.quantity))} ${escapeHtml(item.unit)}</em></button>`).join(''):'<div class="empty-state">No hay artículos registrados todavía.</div>'}</div></section><section class="panel admin-panel"><div class="admin-panel-head"><div><h2>${selected?'Editar artículo':'Nuevo artículo'}</h2><p class="muted">Registra la cantidad y dónde se encuentra.</p></div></div><form id="inventory-form" data-id="${selected?.id||''}" class="admin-form"><div class="admin-form-grid">${adminField('name','Nombre del artículo',selected?.name)}<div class="field"><label for="inventory-category">Categoría</label><select id="inventory-category" name="category" required><option value="" ${selected?.category?'':'selected'} disabled>Selecciona una categoría</option>${INVENTORY_CATEGORIES.map(category=>`<option value="${category}" ${selected?.category===category?'selected':''}>${category}</option>`).join('')}</select></div><div class="field"><label for="inventory-quantity">Cantidad</label><input id="inventory-quantity" name="quantity" type="number" min="0" step="any" value="${escapeHtml(selected?.quantity??0)}" required></div>${adminField('unit','Unidad',selected?.unit||'ud.')}<div class="field"><label for="inventory-area">Área relacionada</label><select id="inventory-area" name="area"><option value="">General</option>${AREAS.map(a=>`<option value="${a.id}" ${selected?.area===a.id?'selected':''}>${a.name}</option>`).join('')}</select></div>${adminField('location','Ubicación',selected?.location)}</div>${adminField('notes','Observaciones',selected?.notes||'',true,false)}<div class="admin-form-actions"><button class="btn btn-primary" type="submit">Guardar artículo ${icon('check')}</button>${selected?'<button class="btn btn-outline" type="button" data-delete-inventory>Eliminar artículo</button>':''}</div></form></section></div>`;
}
function dateShiftBefore(date,shift) {
  if(shift>1)return {date,shift:shift-1};
  const previous=new Date(`${date}T00:00:00Z`);previous.setUTCDate(previous.getUTCDate()-1);
  return {date:previous.toISOString().slice(0,10),shift:3};
}
function monthDays(month) {
  const [year,number]=month.split('-').map(Number);
  const first=(new Date(Date.UTC(year,number-1,1)).getUTCDay()+6)%7;
  const count=new Date(Date.UTC(year,number,0)).getUTCDate();
  return {first,count};
}
function maintenancePage(){
  return pageHead('Espacio de trabajo / Mantenimiento','Mantenimiento','Seguimiento compartido de incidencias y previsión de reparación o llegada de material.')+
    (state.office.message?'<div class="admin-message" role="status">'+escapeHtml(state.office.message)+'</div>':'')+issueBoard(true);
}
function issueBoard(maintenance=false){
  const draft=state.office.issueDraft||{};const items=state.office.issues||[];const open=items.filter(item=>item.status==='open');const resolved=items.filter(item=>item.status==='resolved');
  const card=item=>{const values=state.office.maintenanceDrafts?.[item.id]||item;return `<article class="issue-card ${item.status==='resolved'?'is-resolved':''}"><div class="issue-card-head"><span class="news-category">${escapeHtml(AREAS.find(a=>a.id===item.area)?.name||item.area)}</span><span class="issue-priority">${escapeHtml(item.priority)}</span></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p><div class="maintenance-forecast"><strong>Previsión de mantenimiento</strong><p>Reparación: ${item.repairDate?formatPortalDate(item.repairDate+'T12:00:00'):'Sin fecha prevista'}<br>Llegada de material: ${item.materialDate?formatPortalDate(item.materialDate+'T12:00:00'):'Sin fecha prevista'}</p>${item.maintenanceNote?'<p>'+escapeHtml(item.maintenanceNote)+'</p>':''}${item.updatedBy?'<small>Última actualización: '+escapeHtml(item.updatedBy)+'</small>':''}</div>${maintenance?`<details class="maintenance-editor" ${state.office.maintenanceDrafts?.[item.id]?"open":""}><summary>Editar previsión</summary><form class="admin-form" data-maintenance-form data-issue-id="${item.id}"><div class="field"><label for="repair-${item.id}">Fecha prevista de reparación</label><input type="date" id="repair-${item.id}" name="repairDate" value="${escapeHtml(values.repairDate||'')}"></div><div class="field"><label for="material-${item.id}">Fecha prevista de llegada del material</label><input type="date" id="material-${item.id}" name="materialDate" value="${escapeHtml(values.materialDate||'')}"></div><div class="field"><label for="note-${item.id}">Nota de mantenimiento</label><textarea id="note-${item.id}" name="maintenanceNote" rows="3" maxlength="2000" placeholder="Por ejemplo: pendiente de material del proveedor">${escapeHtml(values.maintenanceNote||'')}</textarea></div><button type="submit" class="btn btn-primary">Guardar previsión ${icon('check')}</button></form></details>`:''}<div class="issue-card-foot"><small>${item.assignee?`Responsable: ${escapeHtml(item.assignee)} · `:''}${formatPortalDate(item.createdAt)} · ${escapeHtml(item.author)}${item.resolvedAt?' · Resuelta: '+formatPortalDate(item.resolvedAt):''}</small><button type="button" class="btn btn-outline" data-issue-status="${item.id}" data-next-status="${item.status==='open'?'resolved':'open'}">${item.status==='open'?'Marcar resuelta':'Reabrir'}</button></div></article>`;};
  return `<section class="panel issue-board" aria-labelledby="issue-board-title"><div class="admin-panel-head"><div><div class="eyebrow">SEGUIMIENTO ENTRE TURNOS</div><h2 id="issue-board-title">Incidencias abiertas <span class="issue-count">${open.length}</span></h2><p class="muted">Siguen visibles hasta que se resuelvan, aunque cambie el turno.</p></div><button type="button" class="btn btn-outline" data-refresh-issues>Actualizar incidencias</button></div><div class="issue-grid"><div><h3>En seguimiento</h3>${open.length?`<div class="issue-list">${open.map(card).join('')}</div>`:'<div class="empty-state">No hay incidencias abiertas.</div>'}${resolved.length?`<details class="issue-resolved"><summary>Resueltas (${resolved.length})</summary><div class="issue-list">${resolved.map(card).join('')}</div></details>`:''}</div><form id="issue-form" class="admin-form issue-form"><h3>Registrar incidencia</h3><div class="field"><label for="issue-area">Área</label><select id="issue-area" name="area">${AREAS.map(a=>`<option value="${a.id}" ${draft.area===a.id?"selected":""}>${a.name}</option>`).join('')}</select></div><div class="field"><label for="issue-priority">Prioridad</label><select id="issue-priority" name="priority">${["Normal","Alta","Urgente"].map(priority=>`<option ${draft.priority===priority?"selected":""}>${priority}</option>`).join("")}</select></div><div class="field"><label for="issue-title">Qué ocurre</label><input id="issue-title" name="title" value="${escapeHtml(draft.title||'')}" minlength="3" maxlength="120" required></div><div class="field"><label for="issue-description">Detalle</label><textarea id="issue-description" name="description" rows="4" minlength="5" maxlength="2000" required>${escapeHtml(draft.description||'')}</textarea></div><div class="field"><label for="issue-assignee">Responsable (opcional)</label><input id="issue-assignee" name="assignee" value="${escapeHtml(draft.assignee||'')}" maxlength="100"></div><button class="btn btn-primary" type="submit">Guardar incidencia ${icon('check')}</button></form></div></section>`;
}
function handoverPage() {
  const office=state.office;const {first,count}=monthDays(office.month);
  const monthTitle=new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(new Date(`${office.month}-01T12:00:00`));
  const selected=office.handovers.find(item=>item.date===office.date&&item.shift===office.shift);
  const draftKey=`${office.date}/${office.shift}`;
  const draft=office.drafts[draftKey];
  const incoming=office.incoming;
  const prev=dateShiftBefore(office.date,office.shift);
  const cells=Array.from({length:first},()=>'<span class="calendar-empty"></span>').concat(Array.from({length:count},(_,index)=>{
    const day=index+1;const date=`${office.month}-${String(day).padStart(2,'0')}`;
    const records=office.handovers.filter(item=>item.date===date);
    const incident=records.some(item=>Object.values(item.notes||{}).some(Boolean));
    return `<button class="calendar-day ${office.date===date?'active':''}" data-handover-date="${date}" aria-label="${day} de ${monthTitle}"><span>${day}</span>${records.length?`<i class="${incident?'issue':''}"></i>`:''}</button>`;
  })).join('');
  return back('oficinas','Volver a Oficinas')+pageHead('Oficinas / Jefes de turno','Áreas jefes de turno','Calendario de relevos y estado comunicado por cada área.')+
  `${office.message?`<div class="admin-message" role="status">${escapeHtml(office.message)}</div>`:''}<div class="handover-layout"><aside class="panel calendar-panel"><div class="calendar-head"><h2>${escapeHtml(monthTitle)}</h2><div><button data-month="-1" aria-label="Mes anterior">‹</button><button data-month="1" aria-label="Mes siguiente">›</button></div></div><div class="calendar-grid calendar-weekdays">${['L','M','X','J','V','S','D'].map(day=>`<span>${day}</span>`).join('')}</div><div class="calendar-grid">${cells}</div><div class="calendar-legend"><span><i></i> Relevo registrado</span><span><i class="issue"></i> Con comentario</span></div></aside><section class="panel handover-panel"><div class="handover-top"><div><div class="eyebrow">RELEVO DE TURNO</div><h2>${new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long',year:'numeric'}).format(new Date(`${office.date}T12:00:00`))}</h2></div><div class="shift-tabs" role="group" aria-label="Seleccionar turno">${[1,2,3].map(shift=>`<button class="${office.shift===shift?'active':''}" data-handover-shift="${shift}">Turno ${shift}</button>`).join('')}</div></div><p class="muted">Estado recibido del Turno ${prev.shift}${prev.date!==office.date?' del día anterior':''}. ${incoming?'Un comentario pendiente se marca con una X roja.':'El relevo anterior aún no se ha registrado; su estado se muestra con un signo de interrogación.'}</p><form id="handover-form"><div class="handover-areas">${AREAS.map(a=>{const note=incoming?.notes?.[a.id]?.trim()||'';const ongoing=office.issues.some(item=>item.status==='open'&&item.area===a.id);return `<div class="handover-area"><div class="handover-area-head"><span class="handover-status ${ongoing||note?'issue':!incoming?'unknown':'okay'}">${ongoing||note?'×':!incoming?'?':'✓'}</span><div><strong>${a.name}</strong><small>${ongoing?'Incidencia abierta':!incoming?'Relevo anterior sin registrar':note?'Comentario del turno anterior':'Sin comentario del turno anterior'}</small></div></div>${note?`<div class="incoming-note">${escapeHtml(note)}</div>`:''}<div class="field"><label for="handover-${a.id}">Comentario para el turno siguiente</label><textarea id="handover-${a.id}" name="${a.id}" rows="2" placeholder="Dejar vacío si no hay incidencias">${escapeHtml(draft?.[a.id]??selected?.notes?.[a.id]??'')}</textarea></div></div>`;}).join('')}</div><div class="handover-actions"><button class="btn btn-primary" type="submit">Guardar relevo ${icon('check')}</button><span class="muted" id="handover-draft-status" role="status">${draft?'Hay cambios sin guardar.':selected?`Último registro: ${escapeHtml(selected.author)}`:'Aún no se ha guardado este relevo.'}</span></div></form></section></div>`+issueBoard();
}

async function apiRequest(url, method='GET', body) {
  const actingUser=state.auth.user?.id;
  const sessionBound=!['/api/login','/api/setup','/api/bootstrap'].includes(url);
  const response = await fetch(url, {
    method, credentials: 'same-origin',
    headers: method==='GET'?{}:{ 'Content-Type': 'application/json', 'X-CSRF-Token': state.auth.csrf || '' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const result = await response.json().catch(() => ({}));
  if(sessionBound&&actingUser!==state.auth.user?.id)throw new Error('La cuenta ha cambiado. Vuelve a abrir esta sección.');
  if(response.status===401 && !['/api/login','/api/setup'].includes(url) && state.auth.user){
    state.auth.user=null;state.auth.csrf=null;state.auth.notice='La sesión ha terminado. Inicia sesión de nuevo.';resetPersonalState();
    location.hash='#/inicio';render();
  }
  if (!response.ok) throw new Error(result.error || 'No se pudo completar la solicitud.');
  return result;
}
async function loadContent() {
  const content = await apiRequest('/api/content');
  state.home = content.home;
  state.news = Array.isArray(content.news) ? content.news : [];
  state.mySuggestions = Array.isArray(content.mySuggestions) ? content.mySuggestions : [];
  state.foamGreenCatalog = Array.isArray(content.foamGreenCatalog) ? content.foamGreenCatalog : [];
  window.ISOPAN_PROCEDURES = content.procedures;
  window.ISOPAN_QUESTIONS = content.questions;
}
async function loadQualityData(){const [templates,records]=await Promise.all([apiRequest('/api/quality/templates'),apiRequest('/api/quality/records')]);state.quality.templates=templates.items||[];state.quality.records=records.items||[];}
async function loadUsers() { state.users=(await apiRequest('/api/users')).users; }
async function loadSuggestions() { state.suggestions=(await apiRequest('/api/suggestions')).items; }
async function loadOfficeData() {
  state.office.inventory=(await apiRequest('/api/inventory')).items;
  await loadIssues();
  await loadHandoverMonth();
  await loadIncoming();
}
async function loadIssues(){const response=await apiRequest('/api/issues');state.office.issues=Array.isArray(response.items)?response.items:[];}
async function loadHandoverMonth() {
  state.office.handovers=(await apiRequest(`/api/handovers?month=${state.office.month}`)).items;
}
async function loadIncoming() {
  const previous=dateShiftBefore(state.office.date,state.office.shift);
  state.office.incoming=(await apiRequest(`/api/handovers?date=${previous.date}&shift=${previous.shift}`)).item;
}
async function initialize() {
  try {
    const bootstrap = await apiRequest('/api/bootstrap');
    state.auth = { loading:false, setupRequired:bootstrap.setupRequired, user:bootstrap.user, csrf:bootstrap.csrf, error:'' };
    resetPersonalState();
    if (bootstrap.user) { await loadContent(); await loadQualityData(); if (bootstrap.user.role==='admin') { await loadUsers(); await loadOfficeData(); } }
  } catch {
    state.auth = { loading:false, setupRequired:false, user:null, csrf:null, error:'No se puede conectar con el servidor de Isopan. Abre la aplicación desde la dirección del servidor, no desde el archivo index.html.' };
    resetPersonalState();
  }
  render();
}
function authPage() {
  if (state.auth.loading) return `<div class="auth-loading">Cargando portal interno…</div>`;
  const setup=state.auth.setupRequired;
  return `<div class="auth-shell"><div class="auth-side"><img src="./isopan-logo-official.png" alt="Isopan"><div><div class="eyebrow">PORTAL INTERNO</div><h1>Un acceso para cada persona.</h1><p>Producción, aprendizaje y contenidos de la empresa en un mismo espacio.</p></div><span>Isopan · Uso interno</span></div><main class="auth-main"><div class="auth-card"><div class="eyebrow">${setup?'CONFIGURACIÓN INICIAL':'ACCESO'}</div><h2>${setup?'Crear cuenta administradora':'Iniciar sesión'}</h2><p>${setup?'Esta cuenta inicial administrará usuarios y contenidos. Créala ahora para probar la aplicación; en el servidor de la empresa se configurará su propia instalación.':'Introduce tu cuenta para acceder al portal interno.'}</p>${state.auth.notice?`<div class="admin-message" role="status">${escapeHtml(state.auth.notice)}</div>`:''}${state.auth.error?`<div class="auth-error" role="alert">${escapeHtml(state.auth.error)}</div>`:''}${state.auth.error && state.auth.error.startsWith('No se puede conectar')?'':`<form id="${setup?'setup-form':'login-form'}" class="auth-form"><div class="field"><label for="auth-username">Usuario</label><input id="auth-username" name="username" autocomplete="username" minlength="3" maxlength="32" required></div><div class="field"><label for="auth-password">Contraseña</label><input id="auth-password" type="password" name="password" autocomplete="${setup?'new-password':'current-password'}" minlength="12" required></div>${setup?`<div class="field"><label for="auth-confirm">Repite la contraseña</label><input id="auth-confirm" type="password" name="confirm" autocomplete="new-password" minlength="12" required></div>`:''}<button class="btn btn-primary" type="submit">${setup?'Crear administrador':'Entrar'} ${icon('arrow')}</button></form>`}</div></main></div>`;
}
function accountPage() {
  return pageHead('Cuenta','Mi cuenta','Consulta tu acceso y actualiza tu contraseña.')+
    `<div class="draft-grid"><section class="panel"><h2>Cambiar contraseña</h2><p class="muted">Al guardar la nueva contraseña tendrás que iniciar sesión de nuevo.</p>${state.accountMessage?`<div class="auth-error" role="alert">${escapeHtml(state.accountMessage)}</div>`:''}<form id="account-password-form" class="auth-form"><div class="field"><label for="current-password">Contraseña actual</label><input id="current-password" name="currentPassword" type="password" autocomplete="current-password" required></div><div class="field"><label for="new-password">Nueva contraseña</label><input id="new-password" name="newPassword" type="password" minlength="12" autocomplete="new-password" required></div><div class="field"><label for="new-password-confirm">Repite la nueva contraseña</label><input id="new-password-confirm" name="confirm" type="password" minlength="12" autocomplete="new-password" required></div><button class="btn btn-primary" type="submit">Actualizar contraseña ${icon('check')}</button></form></section><aside class="panel"><h2>Datos de acceso</h2><div class="summary-list"><div class="summary-item"><span>Usuario</span><strong>${escapeHtml(state.auth.user.username)}</strong></div><div class="summary-item"><span>Rol</span><strong>${state.auth.user.role==='admin'?'Administrador':'Solo lectura'}</strong></div></div></aside></div>`;
}
function adminPage() {
  const tabs=[['portada','Portada'],['noticias','Noticias'],['sugerencias','Sugerencias'],['guias','Guías de cambio'],['preguntas','Preguntas'],['cuentas','Cuentas']];
  const body=state.adminTab==='noticias'?adminNews():state.adminTab==='sugerencias'?adminSuggestions():state.adminTab==='guias'?adminGuides():state.adminTab==='preguntas'?adminQuestions():state.adminTab==='cuentas'?adminUsers():adminHome();
  return pageHead('Administración','Panel de administración','Gestiona el contenido y las cuentas del portal.')+
    `<div class="admin-tabs" role="tablist" aria-label="Secciones de administración">${tabs.map(([id,label])=>`<button class="admin-tab ${state.adminTab===id?'active':''}" data-admin-tab="${id}" role="tab" aria-selected="${state.adminTab===id}">${label}</button>`).join('')}</div>${state.adminMessage?`<div class="admin-message" role="status">${escapeHtml(state.adminMessage)}</div>`:''}${body}`;
}
function adminNews() {
  const items=state.news||[];const selected=items.find(item=>item.id===state.editNews);
  return `<div class="admin-layout"><section class="panel admin-panel"><div class="admin-panel-head"><div><h2>Noticias publicadas</h2><p class="muted">Visibles en Inicio para todas las cuentas.</p></div><button class="btn btn-outline" data-new-news>Nueva noticia</button></div><div class="admin-list">${items.length?items.map(item=>`<button class="admin-list-item ${selected?.id===item.id?'active':''}" data-edit-news="${item.id}"><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.category)} · ${formatPortalDate(item.createdAt)}</small></span></button>`).join(''):'<div class="empty-state">No hay noticias publicadas.</div>'}</div></section><section class="panel admin-panel"><h2>${selected?'Editar noticia':'Nueva noticia'}</h2><form id="admin-news-form" class="admin-form" data-id="${selected?.id||''}"><div class="field"><label for="news-category">Categoría</label><select id="news-category" name="category">${['Cumpleaños','Evento','Comunicado','General'].map(category=>`<option ${selected?.category===category?'selected':''}>${category}</option>`).join('')}</select></div><div class="field"><label for="news-title">Título</label><input id="news-title" name="title" maxlength="120" minlength="3" value="${escapeHtml(selected?.title||'')}" required></div><div class="field"><label for="news-body">Contenido</label><textarea id="news-body" name="body" maxlength="3000" minlength="3" rows="6" required>${escapeHtml(selected?.body||'')}</textarea></div><div class="field"><label for="news-date">Fecha del evento (opcional)</label><input id="news-date" name="eventDate" type="date" value="${escapeHtml(selected?.eventDate||'')}"></div><div class="admin-form-actions"><button class="btn btn-primary" type="submit">${selected?'Guardar cambios':'Publicar noticia'} ${icon('check')}</button>${selected?'<button class="btn btn-outline" type="button" data-delete-news>Eliminar noticia</button>':''}</div></form></section></div>`;
}
function adminSuggestions() {
  const items=state.suggestions||[];
  return `<section class="panel admin-panel"><div class="admin-panel-head"><div><h2>Sugerencias recibidas</h2><p class="muted">Solo administración y la persona que envió cada sugerencia pueden verla.</p></div></div>${items.length?`<div class="suggestion-admin-list">${items.map(item=>`<article class="suggestion-admin-item"><div class="suggestion-admin-top"><div><span class="news-category">${escapeHtml(item.category)}</span><h3>${escapeHtml(item.title)}</h3><small>${escapeHtml(item.author)} · ${formatPortalDate(item.createdAt)}</small></div><div class="field"><label for="suggestion-status-${item.id}">Estado</label><select id="suggestion-status-${item.id}" data-suggestion-status="${item.id}">${['Nueva','En revisión','Resuelta'].map(status=>`<option ${item.status===status?'selected':''}>${status}</option>`).join('')}</select></div></div><p>${escapeHtml(item.body)}</p></article>`).join('')}</div>`:'<div class="empty-state">No se han recibido sugerencias todavía.</div>'}</section>`;
}
function adminField(name,label,value='',large=false,required=true) {
  return `<div class="field"><label for="admin-${name}">${label}</label>${large?`<textarea id="admin-${name}" name="${name}" rows="4" ${required?'required':''}>${escapeHtml(value)}</textarea>`:`<input id="admin-${name}" name="${name}" value="${escapeHtml(value)}" ${required?'required':''}>`}</div>`;
}
function adminHome() {
  const h=state.home || {};
  return `<section class="panel admin-panel"><div class="admin-panel-head"><div><h2>Portada de Inicio</h2><p class="muted">Estos textos son visibles para todas las cuentas.</p></div></div><form id="admin-home-form" class="admin-form"><div class="admin-form-grid">${adminField('intro','Descripción de la portada',h.intro)}${adminField('heroTitle','Título principal',h.heroTitle)}${adminField('heroBody','Texto principal',h.heroBody,true)}${adminField('companyTitle','Título sobre la empresa',h.companyTitle)}${adminField('companyBody','Texto sobre la empresa',h.companyBody,true)}${adminField('nextTitle','Título del bloque adicional',h.nextTitle)}${adminField('nextBody','Texto del bloque adicional',h.nextBody,true)}</div><button class="btn btn-primary" type="submit">Guardar portada ${icon('check')}</button></form></section>`;
}
function adminGuideStep(step={},index=0) {
  return `<div class="admin-step" data-step-index="${index}"><div class="admin-step-head"><strong>Paso ${index+1}</strong><button type="button" class="text-link" data-remove-step>Quitar</button></div><div class="admin-form-grid">${adminField(`step-title-${index}`,'Título del paso',step.title||'')}${adminField(`step-instruction-${index}`,'Instrucción validada',step.instruction||'',true)}</div></div>`;
}
function adminGuides() {
  const items=window.ISOPAN_PROCEDURES || [];
  const selected=items.find(p=>p.id===state.editGuide);
  const a=AREAS.find(item=>item.id===selected?.area) || AREAS[0];
  const line=selected?.line || a.lines[0];
  return `<div class="admin-layout"><section class="panel admin-panel"><div class="admin-panel-head"><div><h2>Guías de cambio</h2><p class="muted">Una guía corresponde a un área, una línea y dos referencias concretas.</p></div><button class="btn btn-outline" data-new-guide>Nueva guía</button></div><div class="admin-list">${items.length?items.map(p=>`<button class="admin-list-item ${state.editGuide===p.id?'active':''}" data-edit-guide="${p.id}"><span><strong>${escapeHtml(p.title)}</strong><small>${escapeHtml(area(p.area)?.name || p.area)} · ${escapeHtml(p.line)} · ${escapeHtml(p.fromPanel)} → ${escapeHtml(p.toPanel)}</small></span><em class="${p.status==='approved'?'approved':''}">${p.status==='approved'?'Aprobada':'Borrador'}</em></button>`).join(''):'<div class="empty-state">Aún no hay guías. Crea una cuando el procedimiento esté documentado.</div>'}</div></section><section class="panel admin-panel"><div class="admin-panel-head"><div><h2>${selected?'Editar guía':'Nueva guía'}</h2><p class="muted">Publica solo pasos revisados y aprobados.</p></div></div><form id="admin-guide-form" data-id="${selected?.id || ''}" class="admin-form"><div class="admin-form-grid"><div class="field"><label for="guide-area">Área</label><select id="guide-area" name="area">${AREAS.map(item=>`<option value="${item.id}" ${a.id===item.id?'selected':''}>${item.name}</option>`).join('')}</select></div><div class="field"><label for="guide-line">Línea</label><select id="guide-line" name="line">${a.lines.map(item=>`<option value="${item}" ${line===item?'selected':''}>${item==='Única'?'Única':item}</option>`).join('')}</select></div>${adminField('fromPanel','Panel actual',selected?.fromPanel)}${adminField('toPanel','Panel siguiente',selected?.toPanel)}${adminField('title','Título de la guía',selected?.title)}${adminField('source','Documento y versión de origen',selected?.source)}${adminField('validatedBy','Responsable de validación',selected?.validatedBy)}<div class="field"><label for="guide-status">Estado</label><select id="guide-status" name="status"><option value="draft" ${selected?.status!=='approved'?'selected':''}>Borrador</option><option value="approved" ${selected?.status==='approved'?'selected':''}>Aprobada y visible</option></select></div></div><div class="admin-subhead"><h3>Pasos</h3><button type="button" class="btn btn-ghost" data-add-step>Añadir paso</button></div><div id="admin-steps">${(selected?.steps?.length?selected.steps:[{}]).map(adminGuideStep).join('')}</div><div class="admin-form-actions"><button class="btn btn-primary" type="submit">Guardar guía ${icon('check')}</button>${selected?'<button class="btn btn-outline" type="button" data-delete-guide>Eliminar guía</button>':''}</div></form></section></div>`;
}
function adminQuestions() {
  const items=window.ISOPAN_QUESTIONS || [];
  const selected=items.find(q=>q.id===state.editQuestion);
  return `<div class="admin-layout"><section class="panel admin-panel"><div class="admin-panel-head"><div><h2>Preguntas del test</h2><p class="muted">Cada pregunta debe tener una fuente y una explicación validadas.</p></div><button class="btn btn-outline" data-new-question>Nueva pregunta</button></div><div class="admin-list">${items.length?items.map(q=>`<button class="admin-list-item ${state.editQuestion===q.id?'active':''}" data-edit-question="${q.id}"><span><strong>${escapeHtml(q.prompt)}</strong><small>${escapeHtml(area(q.area)?.name || q.area)}</small></span><em class="${q.status==='approved'?'approved':''}">${q.status==='approved'?'Aprobada':'Borrador'}</em></button>`).join(''):'<div class="empty-state">Aún no hay preguntas. Podrás añadirlas a partir de los documentos aprobados.</div>'}</div></section><section class="panel admin-panel"><div class="admin-panel-head"><div><h2>${selected?'Editar pregunta':'Nueva pregunta'}</h2><p class="muted">El test solo muestra preguntas aprobadas.</p></div></div><form id="admin-question-form" data-id="${selected?.id || ''}" class="admin-form"><div class="admin-form-grid"><div class="field"><label for="question-area">Área</label><select id="question-area" name="area">${AREAS.map(a=>`<option value="${a.id}" ${selected?.area===a.id?'selected':''}>${a.name}</option>`).join('')}</select></div><div class="field"><label for="question-status">Estado</label><select id="question-status" name="status"><option value="draft" ${selected?.status!=='approved'?'selected':''}>Borrador</option><option value="approved" ${selected?.status==='approved'?'selected':''}>Aprobada y visible</option></select></div></div>${adminField('prompt','Pregunta',selected?.prompt,true)}<div class="admin-options">${[0,1,2,3].map(i=>`<div class="field"><label for="option-${i}">Opción ${String.fromCharCode(65+i)}${i>=2?' (opcional)':''}</label><input id="option-${i}" name="option${i}" value="${escapeHtml(selected?.options?.[i]||'')}" ${i<2?'required':''}></div>`).join('')}</div><div class="admin-form-grid"><div class="field"><label for="correct-index">Respuesta correcta</label><select id="correct-index" name="correctIndex">${[0,1,2,3].map(i=>`<option value="${i}" ${selected?.correctIndex===i?'selected':''}>Opción ${String.fromCharCode(65+i)}</option>`).join('')}</select></div>${adminField('source','Documento y versión de origen',selected?.source)}${adminField('validatedBy','Responsable de validación',selected?.validatedBy)}</div>${adminField('explanation','Explicación de la respuesta',selected?.explanation,true)}<div class="admin-form-actions"><button class="btn btn-primary" type="submit">Guardar pregunta ${icon('check')}</button>${selected?'<button class="btn btn-outline" type="button" data-delete-question>Eliminar pregunta</button>':''}</div></form></section></div>`;
}
function adminUsers() {
  const users=state.users || [];
  return `<div class="admin-layout"><section class="panel admin-panel"><div class="admin-panel-head"><div><h2>Cuentas</h2><p class="muted">Los lectores consultan contenido. Los administradores gestionan cuentas y publicaciones.</p></div></div><div class="admin-list">${users.map(user=>`<div class="account-block"><div class="account-row"><div><strong>${escapeHtml(user.username)}</strong><small>${user.role==='admin'?'Administrador':'Solo lectura'}${user.id===state.auth.user.id?' · Tu cuenta':''}</small></div>${user.id===state.auth.user.id?'':`<div class="account-actions"><button class="text-link" data-toggle-role="${user.id}">${user.role==='admin'?'Pasar a lector':'Hacer administrador'}</button><button class="text-link" data-reset-user="${user.id}">Contraseña</button><button class="text-link danger" data-delete-user="${user.id}">Eliminar</button></div>`}</div>${state.resetUser===user.id?`<form id="reset-password-form" data-id="${user.id}" class="reset-form"><div class="field"><label for="reset-${user.id}">Nueva contraseña</label><input id="reset-${user.id}" name="password" type="password" minlength="12" autocomplete="new-password" required></div><button class="btn btn-primary" type="submit">Guardar contraseña</button></form>`:''}</div>`).join('')}</div></section><section class="panel admin-panel"><h2>Nueva cuenta</h2><p class="muted">Comunica las credenciales al trabajador por un canal interno adecuado.</p><form id="admin-user-form" class="admin-form">${adminField('username','Usuario')}<div class="field"><label for="admin-password">Contraseña inicial</label><input id="admin-password" type="password" name="password" minlength="12" autocomplete="new-password" required><small>Mínimo 12 caracteres.</small></div><div class="field"><label for="admin-role">Tipo de cuenta</label><select id="admin-role" name="role"><option value="reader">Solo lectura</option><option value="admin">Administrador</option></select></div><button class="btn btn-primary" type="submit">Crear cuenta ${icon('arrow')}</button></form></section></div>`;
}

function approvedQuestions() {
  const entries = [...(Array.isArray(window.ISOPAN_STUDY_QUESTIONS)?window.ISOPAN_STUDY_QUESTIONS:[]),...(Array.isArray(window.ISOPAN_QUESTIONS)?window.ISOPAN_QUESTIONS:[])];
  const seen = new Set();
  return entries.filter(q => {
    const valid = q && ['approved','study'].includes(q.status) && typeof q.id === 'string' && q.id.trim() &&
      !seen.has(q.id) && (q.area==='general'||AREAS.some(a => a.id === q.area)) &&
      typeof q.prompt === 'string' && q.prompt.trim() &&
      Array.isArray(q.options) && q.options.length >= 2 && q.options.every(o => typeof o === 'string' && o.trim()) &&
      Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.options.length &&
      typeof q.source === 'string' && q.source.trim() &&
      (q.status==='study'||(typeof q.validatedBy === 'string' && q.validatedBy.trim())) &&
      typeof q.explanation === 'string' && q.explanation.trim();
    if (valid) seen.add(q.id);
    return valid;
  });
}
function filteredQuestions(areaId) { return approvedQuestions().filter(q => areaId === 'all' || q.area === areaId); }
function testPage() {
  const available = approvedQuestions();
  const intro = pageHead('Formación / Evaluación','Test de conocimientos','Preguntas de repaso basadas en fuentes públicas y preguntas de planta aprobadas.');
  if (!available.length) return intro +
    `<section class="panel test-empty"><div class="test-empty-icon">${icon('clipboard')}</div><div><span class="status-pill">BANCO DE PREGUNTAS VACÍO</span><h2>El test está preparado para recibir contenido validado.</h2><p>Cuando se incorporen las preguntas de los documentos de producción, podrás elegir una zona, responderlas y consultar tu resultado. Aún no hay preguntas publicadas.</p><button class="btn btn-outline" data-nav="aprendizaje">Ir a Aprendizaje ${icon('arrow')}</button></div></section><div class="notice test-note">${icon('info')}<span>Solo se muestran preguntas con fuente documental, explicación y validación registradas. El resultado será orientativo y no sustituye la formación de planta.</span></div>`;
  const quiz = state.quiz;
  if (quiz.phase === 'question' && quiz.items.length) {
    const q = quiz.items[quiz.index];
    const total = quiz.items.length;
    return intro + `<section class="panel test-session"><div class="test-session-head"><span class="eyebrow">${escapeHtml(q.area==='general'?'PRL general':area(q.area)?.name || 'Producción')}</span><span class="test-count">Pregunta ${quiz.index+1} de ${total}</span></div><div class="test-progress"><i style="width:${(quiz.index+1)/total*100}%"></i></div><h2>${escapeHtml(q.prompt)}</h2><div class="answer-list" role="group" aria-label="Opciones de respuesta">${q.options.map((option,i)=>`<button class="answer-option ${quiz.chosen===i?'selected':''} ${quiz.checked && i===q.correctIndex?'correct':''} ${quiz.checked && quiz.chosen===i && i!==q.correctIndex?'incorrect':''}" data-option="${i}" ${quiz.checked?'disabled':''}><span class="answer-letter">${String.fromCharCode(65+i)}</span><span>${escapeHtml(option)}</span></button>`).join('')}</div>${quiz.checked?`<div class="answer-feedback ${quiz.chosen===q.correctIndex?'is-correct':'is-incorrect'}" role="status"><strong>${quiz.chosen===q.correctIndex?'Respuesta correcta':'Respuesta a revisar'}</strong><p>${escapeHtml(q.explanation)}</p><small>Fuente: ${escapeHtml(q.source)}</small></div>`:''}<div class="test-actions">${quiz.checked?`<button class="btn btn-primary" data-next>${quiz.index===total-1?'Ver resultado':'Siguiente pregunta'} ${icon('arrow')}</button>`:`<button class="btn btn-primary" data-check ${quiz.chosen===null?'disabled':''}>Comprobar respuesta ${icon('arrow')}</button>`}<button class="btn btn-outline" data-restart>Salir del test</button></div></section>`;
  }
  if (quiz.phase === 'result' && quiz.items.length) {
    const correct=quiz.answers.filter((answer,i)=>answer===quiz.items[i].correctIndex).length;
    return intro + `<section class="panel test-result"><span class="eyebrow">TEST COMPLETADO</span><div class="result-number">${correct}<span> / ${quiz.items.length}</span></div><h2>Respuestas correctas</h2><p>Este resultado sirve para repasar contenidos. No acredita la formación ni autoriza operaciones en línea.</p><div class="test-actions"><button class="btn btn-primary" data-start>Repetir test ${icon('arrow')}</button><button class="btn btn-outline" data-restart>Elegir otra zona</button></div></section>`;
  }
  const count=filteredQuestions(quiz.area).length;
  return intro + `<div class="test-setup"><section class="panel"><span class="eyebrow">PREPARAR EVALUACIÓN</span><h2>Elige el contenido</h2><p class="muted">Selecciona una zona o responde todas las preguntas disponibles. El test combina preguntas de repaso de fuentes públicas y preguntas de planta aprobadas.</p><div class="test-filter-list"><button class="test-filter ${quiz.area==='all'?'active':''}" data-filter="all"><span>Todas las zonas</span><strong>${available.length}</strong></button><button class="test-filter ${quiz.area==='general'?'active':''}" data-filter="general"><span>PRL general</span><strong>${filteredQuestions('general').length}</strong></button>${AREAS.map(a=>`<button class="test-filter ${quiz.area===a.id?'active':''}" data-filter="${a.id}"><span>${a.name}</span><strong>${filteredQuestions(a.id).length}</strong></button>`).join('')}</div><div class="test-actions"><button class="btn btn-primary" data-start ${count?'':'disabled'}>Comenzar test ${icon('arrow')}</button><span class="muted">${count} ${count===1?'pregunta disponible':'preguntas disponibles'}</span></div></section><aside class="panel"><h2>Cómo funciona</h2><div class="steps-preview"><div class="step-preview"><span class="step-num">01</span><span>Elige una zona</span></div><div class="step-preview"><span class="step-num">02</span><span>Responde y revisa cada pregunta</span></div><div class="step-preview"><span class="step-num">03</span><span>Consulta tu resultado</span></div></div><div class="aside-block"><strong>Uso formativo</strong><p>Las respuestas y el resultado no se envían ni se guardan. Sigue siempre los procedimientos vigentes de planta.</p></div></aside></div>`;
}

function render() {
  if (state.auth.loading || !state.auth.user) { app.innerHTML=authPage(); return; }
  let parts=routeParts(); let view,crumbs,active;
  if(state.auth.user.role==='reader' && !['inicio','produccion','calidad','aprendizaje','test'].includes(parts[0])){
    location.hash='#/inicio'; parts=['inicio'];
  }
  if(parts[0]==='produccion') {
    active='produccion'; const a=area(parts[1]);
    if(!a){view=production();crumbs='Producción';}
    else if(!parts[2]){view=areaPage(a);crumbs=`Producción / ${a.name}`;}
    else if(a.lines.includes(parts[2]) && parts[3]==='cambio'){view=draftPage(a,parts[2]);crumbs=`${a.name} / ${parts[2]==='Única'?'Línea única':'Línea '+parts[2]} / Cambio`;}
    else if(a.lines.includes(parts[2]) && parts[3]==='calidad'){location.hash=`#/calidad/${a.id}/${encodeURIComponent(parts[2])}`;return;}
    else if(a.lines.includes(parts[2])){view=linePage(a,parts[2]);crumbs=`${a.name} / ${parts[2]==='Única'?'Línea única':'Línea '+parts[2]}`;}
    else {view=areaPage(a);crumbs=`Producción / ${a.name}`;}
  } else if(parts[0]==='calidad'){
    active='calidad';const a=area(parts[1]);
    if(parts[1]==='administrar'&&state.auth.user.role==='admin'){view=qualityAdminPage();crumbs='Controles de calidad / Administrar';}
    else if(!a){view=qualityHome();crumbs='Controles de calidad';}
    else if(!parts[2]||!a.lines.includes(parts[2])){view=qualityAreaPage(a);crumbs=`Controles de calidad / ${a.name}`;}
    else {view=qualityPage(a,parts[2]);crumbs=`Controles de calidad / ${a.name} / ${parts[2]==='Única'?'Línea única':'Línea '+parts[2]}`;}
  } else if(parts[0]==='aprendizaje'){view=learning();crumbs='Aprendizaje';active='aprendizaje';}
  else if(parts[0]==='oficinas'){view=parts[1]==='inventarios'?inventoryPage():parts[1]==='jefes-turno'?handoverPage():officePage();crumbs=parts[1]==='inventarios'?'Oficinas / Inventarios':parts[1]==='jefes-turno'?'Oficinas / Áreas jefes de turno':'Oficinas';active='oficinas';}
  else if(parts[0]==='mantenimiento' && state.auth.user.role==='admin'){view=maintenancePage();crumbs='Mantenimiento';active='mantenimiento';}
  else if(parts[0]==='test'){view=testPage();crumbs='Test de conocimientos';active='test';}
  else if(parts[0]==='mi-cuenta'){view=accountPage();crumbs='Mi cuenta';active='mi-cuenta';}
  else if(parts[0]==='admin' && state.auth.user.role==='admin'){view=adminPage();crumbs='Administración';active='admin';}
  else {view=home();crumbs='Inicio';active='inicio';}
  app.innerHTML=shell(view,crumbs,active); state.route=parts.join('/');
}

document.addEventListener('click',async event=>{
  const themeButton=event.target.closest('[data-theme-toggle]');if(themeButton){setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');themeButton.setAttribute('aria-checked',String(document.documentElement.dataset.theme==='dark'));return;}
  if (qualityClick(event)) return;
  if (foamGreenClick(event)) return;
  if(event.target.closest('[data-refresh-issues]')){try{await loadIssues();state.office.message='Incidencias actualizadas.';}catch(caught){state.office.message=caught.message;}render();return;}
  if(event.target.closest('[data-logout]')){try{await apiRequest('/api/logout','POST',{});state.auth.user=null;state.auth.csrf=null;state.auth.error='';resetPersonalState();}catch(caught){state.globalMessage='No se pudo cerrar la sesión: '+caught.message;}render();return;}
  const nav=event.target.closest('[data-nav]'); if(nav){if(nav.hasAttribute('data-news-admin'))state.adminTab='noticias';navigate(nav.dataset.nav);return;}
  const editInventory=event.target.closest('[data-edit-inventory]'); if(editInventory){state.editInventory=editInventory.dataset.editInventory;state.office.message='';render();return;}
  if(event.target.closest('[data-new-inventory]')){state.editInventory=null;state.office.message='';render();return;}
  if(event.target.closest('[data-delete-inventory]')){const id=state.editInventory;if(id&&window.confirm('¿Eliminar este artículo?')){try{await apiRequest(`/api/inventory/${id}`,'DELETE',{});state.editInventory=null;state.office.inventory=(await apiRequest('/api/inventory')).items;state.office.message='Artículo eliminado.';}catch(caught){state.office.message=caught.message;}render();}return;}
  const monthButton=event.target.closest('[data-month]');if(monthButton){const [year,month]=state.office.month.split('-').map(Number);const next=new Date(Date.UTC(year,month-1+Number(monthButton.dataset.month),1));state.office.month=next.toISOString().slice(0,7);state.office.date=`${state.office.month}-01`;state.office.message='';try{await loadHandoverMonth();await loadIncoming();}catch(caught){state.office.message=caught.message;}render();return;}
  const handoverDate=event.target.closest('[data-handover-date]');if(handoverDate){state.office.date=handoverDate.dataset.handoverDate;state.office.message='';try{await loadIncoming();}catch(caught){state.office.message=caught.message;}render();return;}
  const handoverShift=event.target.closest('[data-handover-shift]');if(handoverShift){state.office.shift=Number(handoverShift.dataset.handoverShift);state.office.message='';try{await loadIncoming();}catch(caught){state.office.message=caught.message;}render();return;}
  const issueStatus=event.target.closest('[data-issue-status]');if(issueStatus){try{const result=await apiRequest(`/api/issues/${issueStatus.dataset.issueStatus}`,'PUT',{status:issueStatus.dataset.nextStatus});state.office.issues=state.office.issues.map(item=>item.id===result.item.id?result.item:item);state.office.message=issueStatus.dataset.nextStatus==='resolved'?'Incidencia resuelta.':'Incidencia reabierta.';}catch(caught){state.office.message=caught.message;}render();return;}
  const adminTab=event.target.closest('[data-admin-tab]'); if(adminTab){state.adminTab=adminTab.dataset.adminTab;state.adminMessage='';if(state.adminTab==='cuentas')await loadUsers().catch(caught=>{state.adminMessage=caught.message;});if(state.adminTab==='sugerencias')await loadSuggestions().catch(caught=>{state.adminMessage=caught.message;});render();return;}
  const editNews=event.target.closest('[data-edit-news]');if(editNews){state.editNews=editNews.dataset.editNews;state.adminMessage='';render();return;}
  if(event.target.closest('[data-new-news]')){state.editNews=null;state.adminMessage='';render();return;}
  if(event.target.closest('[data-delete-news]')){const id=state.editNews;if(id&&window.confirm('¿Eliminar esta noticia?')){try{await apiRequest(`/api/news/${id}`,'DELETE',{});state.editNews=null;await loadContent();state.adminMessage='Noticia eliminada.';}catch(caught){state.adminMessage=caught.message;}render();}return;}
  const editGuide=event.target.closest('[data-edit-guide]'); if(editGuide){state.editGuide=editGuide.dataset.editGuide;state.adminMessage='';render();return;}
  if(event.target.closest('[data-new-guide]')){state.editGuide=null;state.adminMessage='';render();return;}
  const editQuestion=event.target.closest('[data-edit-question]'); if(editQuestion){state.editQuestion=editQuestion.dataset.editQuestion;state.adminMessage='';render();return;}
  if(event.target.closest('[data-new-question]')){state.editQuestion=null;state.adminMessage='';render();return;}
  if(event.target.closest('[data-add-step]')){const container=document.getElementById('admin-steps');const steps=[...container.querySelectorAll('.admin-step')];const next=Math.max(-1,...steps.map(step=>Number(step.dataset.stepIndex)))+1;container.insertAdjacentHTML('beforeend',adminGuideStep({},next));return;}
  const removeStep=event.target.closest('[data-remove-step]'); if(removeStep){const container=document.getElementById('admin-steps');if(container.querySelectorAll('.admin-step').length>1)removeStep.closest('.admin-step').remove();return;}
  if(event.target.closest('[data-delete-guide]')){const id=state.editGuide;if(id && window.confirm('¿Eliminar esta guía?')){try{await apiRequest(`/api/procedures/${id}`,'DELETE',{});state.editGuide=null;await loadContent();state.adminMessage='Guía eliminada.';}catch(caught){state.adminMessage=caught.message;}render();}return;}
  if(event.target.closest('[data-delete-question]')){const id=state.editQuestion;if(id && window.confirm('¿Eliminar esta pregunta?')){try{await apiRequest(`/api/questions/${id}`,'DELETE',{});state.editQuestion=null;await loadContent();state.adminMessage='Pregunta eliminada.';}catch(caught){state.adminMessage=caught.message;}render();}return;}
  const toggleRole=event.target.closest('[data-toggle-role]');if(toggleRole){const user=state.users?.find(u=>u.id===toggleRole.dataset.toggleRole);if(user && window.confirm(`¿Cambiar el rol de ${user.username}?`)){try{await apiRequest(`/api/users/${user.id}`,'PUT',{role:user.role==='admin'?'reader':'admin'});await loadUsers();state.adminMessage='Rol actualizado.';}catch(caught){state.adminMessage=caught.message;}render();}return;}
  const deleteUser=event.target.closest('[data-delete-user]');if(deleteUser){const user=state.users?.find(u=>u.id===deleteUser.dataset.deleteUser);if(user && window.confirm(`¿Eliminar la cuenta de ${user.username}?`)){try{await apiRequest(`/api/users/${user.id}`,'DELETE',{});await loadUsers();state.adminMessage='Cuenta eliminada.';}catch(caught){state.adminMessage=caught.message;}render();}return;}
  const resetUser=event.target.closest('[data-reset-user]');if(resetUser){state.resetUser=state.resetUser===resetUser.dataset.resetUser?null:resetUser.dataset.resetUser;render();return;}
  const learningArea=event.target.closest('[data-learning-area]');if(learningArea){state.learningArea=learningArea.dataset.learningArea;const first=LESSONS.findIndex(item=>lessonArea(item)===state.learningArea);state.lesson=first<0?0:first;render();return;}
  if(event.target.closest('[data-learning-back]')){state.learningArea=null;render();return;}
  const lesson=event.target.closest('[data-lesson]'); if(lesson){state.lesson=Number(lesson.dataset.lesson);render();return;}
  const complete=event.target.closest('[data-complete]'); if(complete){const i=Number(complete.dataset.complete),key=i+4;if(!state.completed.includes(key)){state.completed.push(key);saveLocal(learningKey(),state.completed);}const next=LESSONS.findIndex((item,index)=>index>i&&lessonArea(item)===state.learningArea);if(next>=0)state.lesson=next;render();return;}
  const filter=event.target.closest('[data-filter]'); if(filter){state.quiz.area=filter.dataset.filter;render();return;}
  if(event.target.closest('[data-start]')){const items=filteredQuestions(state.quiz.area);if(items.length){state.quiz={...state.quiz,items,index:0,answers:[],chosen:null,checked:false,phase:'question'};render();}return;}
  const option=event.target.closest('[data-option]'); if(option && state.quiz.phase==='question' && !state.quiz.checked){state.quiz.chosen=Number(option.dataset.option);render();return;}
  if(event.target.closest('[data-check]') && state.quiz.phase==='question' && state.quiz.chosen!==null){state.quiz.checked=true;state.quiz.answers[state.quiz.index]=state.quiz.chosen;render();return;}
  if(event.target.closest('[data-next]') && state.quiz.phase==='question' && state.quiz.checked){if(state.quiz.index===state.quiz.items.length-1)state.quiz.phase='result';else{state.quiz.index++;state.quiz.chosen=null;state.quiz.checked=false;}render();return;}
  if(event.target.closest('[data-restart]')){state.quiz={area:'all',items:[],index:0,answers:[],chosen:null,checked:false,phase:'setup'};render();return;}
  if(event.target.closest('[data-menu]')){setMobileMenu(true);return;}
  if(event.target.closest('[data-close-menu]')){setMobileMenu(false);}
});
function setMobileMenu(open){state.menu=open;document.querySelector('.sidebar')?.classList.toggle('open',open);document.querySelector('.overlay')?.classList.toggle('open',open);document.querySelector('[data-menu]')?.setAttribute('aria-expanded',String(open));}
function filterInventoryRows(){
  const term=document.getElementById('inventory-search')?.value.trim().toLocaleLowerCase('es')||'';
  const category=document.getElementById('inventory-category-filter')?.value||'';
  document.querySelectorAll('.inventory-row').forEach(row=>{row.hidden=!row.dataset.search.includes(term)||Boolean(category&&row.dataset.category!==category);});
}
document.addEventListener('input',event=>{
  if(event.target.id==='inventory-search')filterInventoryRows();
  const maintenanceForm=event.target.closest?.('[data-maintenance-form]');
  if(maintenanceForm){state.office.maintenanceDrafts??={};state.office.maintenanceDrafts[maintenanceForm.dataset.issueId]=Object.fromEntries(new FormData(maintenanceForm).entries());}
  const issueForm=event.target.closest?.('#issue-form');
  if(issueForm)state.office.issueDraft=Object.fromEntries(new FormData(issueForm).entries());
  if(event.target.closest?.('#handover-form')){
    const key=`${state.office.date}/${state.office.shift}`;
    state.office.drafts[key]=Object.fromEntries(AREAS.map(a=>[a.id,document.getElementById(`handover-${a.id}`).value]));
    const status=document.getElementById('handover-draft-status');
    if(status)status.textContent='Hay cambios sin guardar.';
  }
});
document.addEventListener('change',async event=>{if(event.target.id==='quality-area'||event.target.matches?.('[data-quality-answer],[data-quality-photo]')){await qualityChange(event);return;}if(event.target.id==='inventory-category-filter')filterInventoryRows();const status=event.target.closest('[data-suggestion-status]');if(status){const previous=state.suggestions.find(item=>item.id===status.dataset.suggestionStatus)?.status;try{await apiRequest(`/api/suggestions/${status.dataset.suggestionStatus}`,'PUT',{status:status.value});await loadSuggestions();await loadContent();state.adminMessage='Estado de la sugerencia actualizado.';}catch(caught){status.value=previous||'Nueva';state.adminMessage=caught.message;}render();}});
document.addEventListener('submit',async event=>{
  if(event.target.id==='quality-template-form'){await qualitySubmit(event);return;}
  if(event.target.matches?.('[data-maintenance-form]')){
    event.preventDefault();const values=Object.fromEntries(new FormData(event.target).entries());
    try{const result=await apiRequest(`/api/issues/${event.target.dataset.issueId}`,'PUT',values);state.office.issues=state.office.issues.map(item=>item.id===result.item.id?result.item:item);delete state.office.maintenanceDrafts?.[event.target.dataset.issueId];state.office.message='Previsión de mantenimiento guardada.';}catch(caught){state.office.message=caught.message;}render();return;
  }
  if(event.target.id==='issue-form'){
    event.preventDefault();const values=Object.fromEntries(new FormData(event.target).entries());
    try{const result=await apiRequest('/api/issues','POST',values);state.office.issues.unshift(result.item);state.office.issueDraft=null;state.office.message='Incidencia registrada y visible en los próximos turnos.';}catch(caught){state.office.message=caught.message;}render();return;
  }
  if(event.target.id==='suggestion-form'){
    event.preventDefault();const values=Object.fromEntries(new FormData(event.target).entries());
    try{await apiRequest('/api/suggestions','POST',values);await loadContent();state.homeMessage='Sugerencia enviada. Puedes seguir su estado aquí.';}catch(caught){state.homeMessage=caught.message;}render();return;
  }
  if(event.target.id==='admin-news-form'){
    event.preventDefault();const form=event.target;const values=Object.fromEntries(new FormData(form).entries());
    try{const result=await apiRequest(form.dataset.id?`/api/news/${form.dataset.id}`:'/api/news',form.dataset.id?'PUT':'POST',values);state.editNews=result.item.id;await loadContent();state.adminMessage=form.dataset.id?'Noticia actualizada.':'Noticia publicada.';}catch(caught){state.adminMessage=caught.message;}render();return;
  }
  if(event.target.id==='inventory-form'){
    event.preventDefault();const form=event.target;const values=Object.fromEntries(new FormData(form).entries());values.quantity=Number(values.quantity);
    try{const result=await apiRequest(form.dataset.id?`/api/inventory/${form.dataset.id}`:'/api/inventory',form.dataset.id?'PUT':'POST',values);state.editInventory=result.item.id;state.office.inventory=(await apiRequest('/api/inventory')).items;state.office.message='Artículo guardado.';}catch(caught){state.office.message=caught.message;}render();return;
  }
  if(event.target.id==='handover-form'){
    event.preventDefault();const values=Object.fromEntries(new FormData(event.target).entries());const notes=Object.fromEntries(AREAS.map(a=>[a.id,String(values[a.id]||'').trim()]));
    try{const result=await apiRequest(`/api/handovers/${state.office.date}/${state.office.shift}`,'PUT',{notes});state.office.handovers=state.office.handovers.filter(item=>!(item.date===result.item.date&&item.shift===result.item.shift)).concat(result.item);delete state.office.drafts[`${state.office.date}/${state.office.shift}`];state.office.message='Relevo guardado.';}catch(caught){state.office.message=caught.message;}render();return;
  }
  if(event.target.id==='login-form' || event.target.id==='setup-form') {
    event.preventDefault();
    const form=event.target; const username=form.querySelector('[name="username"]').value.trim(); const password=form.querySelector('[name="password"]').value;
    if(form.id==='setup-form' && password!==form.querySelector('[name="confirm"]').value){state.auth.error='Las contraseñas no coinciden.';render();return;}
    try {
      const result=await apiRequest(form.id==='setup-form'?'/api/setup':'/api/login','POST',{username,password});
      state.auth={loading:false,setupRequired:false,user:result.user,csrf:result.csrf,error:''};
      resetPersonalState();
      await loadContent();await loadQualityData(); if(result.user.role==='admin'){await loadUsers();await loadOfficeData();} navigate('inicio'); render();
    } catch(caught) { state.auth.user=null;state.auth.csrf=null;resetPersonalState();state.auth.error=caught.message;render(); }
    return;
  }
  if(event.target.id==='admin-home-form'){
    event.preventDefault(); const values=Object.fromEntries(new FormData(event.target).entries());
    try{const result=await apiRequest('/api/home','PUT',values);state.home=result.home;state.adminMessage='Portada guardada.';}catch(caught){state.adminMessage=caught.message;}render();return;
  }
  if(event.target.id==='admin-guide-form'){
    event.preventDefault();const form=event.target;const values=Object.fromEntries(new FormData(form).entries());
    const steps=[...form.querySelectorAll('.admin-step')].map(step=>({title:step.querySelector('input').value.trim(),instruction:step.querySelector('textarea').value.trim()}));
    const entry={area:values.area,line:values.line,fromPanel:values.fromPanel.trim(),toPanel:values.toPanel.trim(),title:values.title.trim(),source:values.source.trim(),validatedBy:values.validatedBy.trim(),status:values.status,steps};
    try{const result=await apiRequest(form.dataset.id?`/api/procedures/${form.dataset.id}`:'/api/procedures',form.dataset.id?'PUT':'POST',entry);state.editGuide=result.item.id;await loadContent();state.adminMessage='Guía guardada.';}catch(caught){state.adminMessage=caught.message;}render();return;
  }
  if(event.target.id==='admin-question-form'){
    event.preventDefault();const form=event.target;const values=Object.fromEntries(new FormData(form).entries());
    const optionEntries=[0,1,2,3].map(index=>({index,text:String(values[`option${index}`]||'').trim()})).filter(item=>item.text);
    const options=optionEntries.map(item=>item.text),correctIndex=optionEntries.findIndex(item=>item.index===Number(values.correctIndex));
    if(correctIndex<0){state.adminMessage='La opción marcada como correcta debe tener una respuesta.';render();return;}
    const entry={area:values.area,status:values.status,prompt:values.prompt.trim(),options,correctIndex,explanation:values.explanation.trim(),source:values.source.trim(),validatedBy:values.validatedBy.trim()};
    try{const result=await apiRequest(form.dataset.id?`/api/questions/${form.dataset.id}`:'/api/questions',form.dataset.id?'PUT':'POST',entry);state.editQuestion=result.item.id;await loadContent();state.adminMessage='Pregunta guardada.';}catch(caught){state.adminMessage=caught.message;}render();return;
  }
  if(event.target.id==='admin-user-form'){
    event.preventDefault();const values=Object.fromEntries(new FormData(event.target).entries());
    try{await apiRequest('/api/users','POST',values);await loadUsers();state.adminMessage='Cuenta creada.';}catch(caught){state.adminMessage=caught.message;}render();return;
  }
  if(event.target.id==='account-password-form'){
    event.preventDefault();const values=Object.fromEntries(new FormData(event.target).entries());
    if(values.newPassword!==values.confirm){state.accountMessage='Las contraseñas nuevas no coinciden.';render();return;}
    try{await apiRequest('/api/account/password','POST',{currentPassword:values.currentPassword,newPassword:values.newPassword});state.auth.user=null;state.auth.csrf=null;resetPersonalState();state.auth.notice='Contraseña actualizada. Inicia sesión de nuevo.';render();}catch(caught){state.accountMessage=caught.message;render();}return;
  }
  if(event.target.id==='reset-password-form'){
    event.preventDefault();const form=event.target;
    try{await apiRequest(`/api/users/${form.dataset.id}`,'PUT',{password:form.querySelector('[name="password"]').value});state.resetUser=null;state.adminMessage='Contraseña actualizada.';}catch(caught){state.adminMessage=caught.message;}render();return;
  }
  if(event.target.id!=='draft-form')return;
  event.preventDefault(); const form=event.target;
  const current=form.querySelector('[name="current"]').value.trim();const next=form.querySelector('[name="next"]').value.trim();
  if(!current||!next){form.reportValidity();return;}
  if(!saveLocal(changeDraftKey(form.dataset.key),{current,next,savedAt:new Date().toISOString()})){
    form.querySelector('.saved-status').textContent='No se pudo guardar en este navegador.';
    return;
  }
  render();
});
document.addEventListener('change',event=>{
  if(event.target.id==='guide-area'){
    const selected=area(event.target.value);const line=document.getElementById('guide-line');
    line.innerHTML=selected.lines.map(value=>`<option value="${value}">${value}</option>`).join('');
  }
});
window.addEventListener('hashchange',()=>{if(location.hash==='#main')return;if(location.hash==='#/aprendizaje' && state.route!=='aprendizaje')state.learningArea=null;state.menu=false;render();window.scrollTo(0,0);const requested=location.hash;if(state.auth.user?.role==='admin'&&['#/mantenimiento','#/oficinas/jefes-turno'].includes(requested)){loadIssues().catch(caught=>{state.office.message=caught.message;}).then(()=>{if(location.hash===requested)render();});}});
initialize();
