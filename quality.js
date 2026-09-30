function qualityBlankTemplate(){return {name:'',area:'perfiladora',line:'Verde',status:'draft',pages:[{type:'questions',title:'Comprobaciones',questions:[{prompt:'',options:['','']}]}]};}
function qualityTemplateForLine(a,line){return (state.quality.templates||[]).filter(item=>item.area===a.id&&item.line===line&&item.status==='published');}
function qualityHome(){
  const admin=state.auth.user.role==='admin';
  return pageHead('Controles de calidad','Controles de calidad','Elige un área para consultar los controles de sus líneas.')+
    `${admin?`<section class="panel quality-admin-entry"><div><div class="eyebrow">ADMINISTRACIÓN</div><h2>Crear y revisar controles</h2><p>Diseña páginas de preguntas y fotos, publica formularios y consulta los resultados.</p></div><button type="button" class="btn btn-primary" data-nav="calidad/administrar">Administrar controles ${icon('arrow')}</button></section>`:''}`+
    `<section class="quality-choice"><div class="home-section-head"><div><div class="eyebrow">ÁREAS DE PRODUCCIÓN</div><h2>Selecciona un área</h2></div></div><div class="area-grid">${AREAS.map(a=>`<button type="button" class="area-card" data-nav="calidad/${a.id}"><span class="area-icon">${icon(a.icon)}</span><strong>${a.name}</strong><span>${a.lines.length===1?'1 línea':`${a.lines.length} líneas`} · ${a.lines.reduce((n,line)=>n+qualityTemplateForLine(a,line).length,0)} controles</span></button>`).join('')}</div></section>`;
}
function qualityAreaPage(a){
  return back('calidad','Volver a Controles de calidad')+pageHead('Controles de calidad / Área',a.name,'Elige la línea para ver sus controles.')+
    `<section class="panel"><div class="panel-head"><h2>${a.lines.length===1?'Línea de '+a.name:'Líneas disponibles'}</h2></div><div class="line-grid">${a.lines.map(line=>`<button type="button" class="line-card ${line==='Azul'?'blue':line==='Única'?'neutral':''}" data-nav="calidad/${a.id}/${encodeURIComponent(line)}"><span class="line-swatch"></span><strong>${line==='Única'?'Línea única':'Línea '+line}</strong><span>${qualityTemplateForLine(a,line).length} controles disponibles →</span></button>`).join('')}</div></section>`;
}
function qualityAdminPage(){return back('calidad','Volver a Controles de calidad')+pageHead('Controles de calidad / Administración','Administrar controles','Diseña formularios y consulta los controles realizados.')+qualityAdmin();}
function qualityRecordCard(item){
  return `<button type="button" class="quality-record-row" data-quality-view-record="${item.id}"><span><strong>${escapeHtml(item.templateName)}</strong><small>${escapeHtml(area(item.area)?.name||item.area)} · ${escapeHtml(item.line)} · ${escapeHtml(item.author)}</small></span><time>${formatPortalDate(item.createdAt)}</time></button>`;
}
function qualityRecordDetail(item){
  return `<div class="quality-record-detail"><div class="eyebrow">CONTROL REALIZADO · VERSIÓN ${item.revision}</div><h2>${escapeHtml(item.templateName)}</h2><p class="muted">${escapeHtml(area(item.area)?.name||item.area)} · ${escapeHtml(item.line)} · ${escapeHtml(item.author)} · ${formatPortalDate(item.createdAt)}</p>${item.pages.map((page,i)=>`<section class="quality-record-page"><h3>${i+1}. ${escapeHtml(page.title)}</h3>${page.type==='questions'?page.questions.map((q,j)=>`<div class="quality-record-answer"><strong>${escapeHtml(q.prompt)}</strong><span>${escapeHtml(q.options[item.answers[i]?.selected?.[j]]||'Sin respuesta')}</span></div>`).join(''):`<p>${escapeHtml(page.prompt)}</p>${item.answers[i]?.photoId?`<a href="/api/quality/photos/${item.answers[i].photoId}" target="_blank" rel="noopener noreferrer"><img src="/api/quality/photos/${item.answers[i].photoId}" alt="Foto de ${escapeHtml(page.title)}" loading="lazy"></a>`:'<p class="muted">No se adjuntó foto.</p>'}`}</section>`).join('')}</div>`;
}
function qualityPage(a,line){
  const q=state.quality;const templates=qualityTemplateForLine(a,line);const run=q.run;
  const selected=templates.find(item=>item.id===run?.templateId);
  const own=(q.records||[]).filter(item=>item.area===a.id&&item.line===line&&item.authorId===state.auth.user.id);
  const head=back(`calidad/${a.id}`,'Volver a '+a.name)+pageHead('Controles de calidad / Línea','Control de calidad',lineLabel(a,line));
  if(run&&selected){
    const page=selected.pages[run.page];const answer=run.answers[run.page]||{};
    return head+`<div class="quality-progress"><span>Página ${run.page+1} de ${selected.pages.length}</span><div><i style="width:${((run.page+1)/selected.pages.length)*100}%"></i></div></div>${q.message?`<div class="admin-message" role="status">${escapeHtml(q.message)}</div>`:''}<section class="panel quality-run"><div class="eyebrow">${escapeHtml(selected.name)} · PÁGINA ${run.page+1}</div><h2>${escapeHtml(page.title)}</h2>${page.type==='questions'?`<p class="muted">Elige una respuesta en cada desplegable.</p><div class="quality-question-list">${page.questions.map((question,i)=>`<div class="field"><label for="quality-answer-${i}">${i+1}. ${escapeHtml(question.prompt)}</label><select id="quality-answer-${i}" data-quality-answer="${i}" required><option value="">Selecciona una opción</option>${question.options.map((option,j)=>`<option value="${j}" ${answer.selected?.[i]===j?'selected':''}>${escapeHtml(option)}</option>`).join('')}</select></div>`).join('')}</div>`:`<p>${escapeHtml(page.prompt)}</p><div class="quality-photo-field"><label for="quality-photo">${page.required?'Haz una foto para continuar':'Añade una foto si procede'}</label><input id="quality-photo" type="file" accept="image/*" capture="environment" data-quality-photo ${q.photoBusy?'disabled':''} ${page.required?'required':''}><small>En móvil puedes abrir la cámara. La imagen se reduce antes de enviarla.</small>${answer.photoData?`<img src="${answer.photoData}" alt="Vista previa de la foto" class="quality-preview">`:''}</div>`}<div class="quality-run-actions"><button type="button" class="btn btn-outline" data-quality-prev ${run.page===0||q.saving||q.photoBusy?'disabled':''}>Anterior</button><button type="button" class="btn btn-primary" ${q.saving||q.photoBusy?'disabled':''} ${run.page===selected.pages.length-1?'data-quality-finish':'data-quality-next'}>${run.page===selected.pages.length-1?(q.saving?'Guardando…':'Finalizar y guardar'):'Siguiente página'} ${icon('arrow')}</button></div></section>`;
  }
  const viewing=(q.records||[]).find(item=>item.id===q.viewRecord&&item.area===a.id&&item.line===line&&item.authorId===state.auth.user.id);
  return head+`${q.message?`<div class="admin-message" role="status">${escapeHtml(q.message)}</div>`:''}${viewing?`<button type="button" class="back-link" data-quality-close-record>${icon('back')} Volver a los controles</button><section class="panel quality-detail-panel">${qualityRecordDetail(viewing)}</section>`:`<section class="quality-choice"><div class="home-section-head"><div><div class="eyebrow">CONTROLES DISPONIBLES</div><h2>Elige un control</h2><p>Las páginas y fotos solicitadas dependen de la línea.</p></div></div>${templates.length?`<div class="news-grid">${templates.map(item=>`<article class="panel quality-choice-card"><span class="news-category">${item.pages.length} ${item.pages.length===1?'página':'páginas'}</span><h3>${escapeHtml(item.name)}</h3><p>${item.pages.filter(page=>page.type==='questions').reduce((n,page)=>n+page.questions.length,0)} preguntas · ${item.pages.filter(page=>page.type==='photo').length} fotos</p><button type="button" class="btn btn-primary" data-quality-start="${item.id}">Empezar ${icon('arrow')}</button></article>`).join('')}</div>`:'<div class="panel empty-state">Aún no hay un control publicado para esta línea.</div>'}</section><section class="panel quality-history"><h2>Mis controles realizados</h2>${own.length?`<div class="quality-record-list">${own.map(qualityRecordCard).join('')}</div>`:'<p class="muted">Todavía no has completado ningún control en esta línea.</p>'}</section>`}`;
}
function qualityBuilderPage(page,index){
  return `<div class="quality-builder-page" data-quality-page="${index}"><div class="quality-builder-page-head"><strong>Página ${index+1} · ${page.type==='photo'?'Foto':'Preguntas'}</strong><div><button type="button" class="text-link" data-quality-move-page="${index}" data-direction="-1" ${index===0?'disabled':''}>↑</button><button type="button" class="text-link" data-quality-move-page="${index}" data-direction="1">↓</button><button type="button" class="text-link danger" data-quality-remove-page="${index}">Quitar</button></div></div><div class="field"><label>Título de la página</label><input class="quality-page-title" value="${escapeHtml(page.title)}" maxlength="120" required></div>${page.type==='questions'?`<div class="quality-builder-questions">${page.questions.map((question,j)=>`<div class="quality-builder-question" data-quality-question="${j}"><div class="quality-builder-question-head"><strong>Pregunta ${j+1}</strong><button type="button" class="text-link danger" data-quality-remove-question="${index}:${j}">Quitar</button></div><div class="field"><label>Pregunta</label><input class="quality-question-prompt" value="${escapeHtml(question.prompt)}" maxlength="240" required></div><div class="quality-option-grid">${question.options.map((option,k)=>`<div class="field"><label>Opción ${k+1}</label><input class="quality-option-input" value="${escapeHtml(option)}" maxlength="100" required></div>`).join('')}</div><button type="button" class="text-link" data-quality-toggle-option="${index}:${j}">${question.options.length===2?'Añadir tercera opción':'Quitar tercera opción'}</button></div>`).join('')}</div><button type="button" class="btn btn-outline" data-quality-add-question="${index}">Añadir pregunta</button>`:`<div class="field"><label>¿Qué foto debe hacerse?</label><textarea class="quality-photo-prompt" rows="3" maxlength="300" required>${escapeHtml(page.prompt)}</textarea></div><label class="quality-checkbox"><input type="checkbox" class="quality-photo-required" ${page.required?'checked':''}> Foto obligatoria</label>`}</div>`;
}
function qualityAdmin(){
  const q=state.quality;const selected=q.editor;const viewing=q.records.find(item=>item.id===q.viewRecord);
  return `${q.message?`<div class="admin-message" role="status">${escapeHtml(q.message)}</div>`:''}<div class="admin-layout"><section class="panel admin-panel"><div class="admin-panel-head"><div><h2>Controles de calidad</h2><p class="muted">Crea un control por área y línea; publica cuando esté listo.</p></div><button type="button" class="btn btn-outline" data-quality-new>Nuevo</button></div><div class="admin-list">${q.templates.length?q.templates.map(item=>`<button type="button" class="admin-list-item ${selected?.id===item.id?'active':''}" data-quality-edit="${item.id}"><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(area(item.area)?.name||item.area)} · ${escapeHtml(item.line)} · ${item.pages.length} páginas</small></span><em class="${item.status==='published'?'approved':''}">${item.status==='published'?'Publicado':'Borrador'}</em></button>`).join(''):'<div class="empty-state">Todavía no hay controles creados.</div>'}</div><div class="quality-record-admin"><h3>Controles realizados</h3>${q.records.length?`<div class="quality-record-list">${q.records.map(qualityRecordCard).join('')}</div>`:'<p class="muted">Aún no hay controles completados.</p>'}</div></section><section class="panel admin-panel">${viewing?`<button type="button" class="back-link" data-quality-close-record>${icon('back')} Volver al editor</button>${qualityRecordDetail(viewing)}`:selected?`<h2>${selected.id?'Editar control':'Crear control'}</h2><p class="muted">Cada bloque será una página. Puedes poner varias preguntas en una página y solicitar una foto en otra.</p><form id="quality-template-form" class="admin-form"><div class="field"><label for="quality-name">Nombre del control</label><input id="quality-name" name="name" value="${escapeHtml(selected.name)}" maxlength="120" required></div><div class="admin-form-grid"><div class="field"><label for="quality-area">Área</label><select id="quality-area" name="area">${AREAS.map(a=>`<option value="${a.id}" ${selected.area===a.id?'selected':''}>${a.name}</option>`).join('')}</select></div><div class="field"><label for="quality-line">Línea</label><select id="quality-line" name="line">${(area(selected.area)?.lines||['Verde']).map(line=>`<option value="${line}" ${selected.line===line?'selected':''}>${line}</option>`).join('')}</select></div><div class="field"><label for="quality-status">Estado</label><select id="quality-status" name="status"><option value="draft" ${selected.status==='draft'?'selected':''}>Borrador</option><option value="published" ${selected.status==='published'?'selected':''}>Publicado</option></select></div></div><div class="quality-builder-pages">${selected.pages.map(qualityBuilderPage).join('')}</div><div class="quality-add-page"><button type="button" class="btn btn-outline" data-quality-add-page="questions">Añadir página de preguntas</button><button type="button" class="btn btn-outline" data-quality-add-page="photo">Añadir página de foto</button></div><button type="submit" class="btn btn-primary">Guardar control ${icon('check')}</button></form>`:'<div class="empty-state">Elige un control de la lista o crea uno nuevo.</div>'}</section></div>`;
}
function qualityCaptureEditor(){
  const form=document.getElementById('quality-template-form');if(!form||!state.quality.editor)return;
  const editor=state.quality.editor;const data=new FormData(form);editor.name=String(data.get('name')||'');editor.area=String(data.get('area')||'');editor.line=String(data.get('line')||'');editor.status=String(data.get('status')||'');
  [...form.querySelectorAll('.quality-builder-page')].forEach((node,i)=>{const page=editor.pages[i];if(!page)return;page.title=node.querySelector('.quality-page-title').value;if(page.type==='photo'){page.prompt=node.querySelector('.quality-photo-prompt').value;page.required=node.querySelector('.quality-photo-required').checked;}else{[...node.querySelectorAll('.quality-builder-question')].forEach((row,j)=>{page.questions[j].prompt=row.querySelector('.quality-question-prompt').value;page.questions[j].options=[...row.querySelectorAll('.quality-option-input')].map(input=>input.value);});}});
}
function qualityPageComplete(template,index,answer){const page=template.pages[index];return page.type==='questions'?Array.isArray(answer?.selected)&&answer.selected.length===page.questions.length&&page.questions.every((question,j)=>Number.isInteger(answer.selected[j])&&answer.selected[j]>=0&&answer.selected[j]<question.options.length):!page.required||Boolean(answer?.photoData);}
function qualityClick(event){
  const button=event.target.closest('[data-quality-new],[data-quality-edit],[data-quality-add-page],[data-quality-remove-page],[data-quality-move-page],[data-quality-add-question],[data-quality-remove-question],[data-quality-toggle-option],[data-quality-start],[data-quality-next],[data-quality-prev],[data-quality-finish],[data-quality-view-record],[data-quality-close-record]');if(!button)return false;
  const q=state.quality;const d=button.dataset;
  if(q.saving||q.photoBusy)return true;
  if(d.qualityNew!==undefined){q.editor=qualityBlankTemplate();q.viewRecord=null;q.message='';render();return true;}
  if(d.qualityEdit){const item=q.templates.find(t=>t.id===d.qualityEdit);if(item){q.editor=JSON.parse(JSON.stringify(item));q.viewRecord=null;q.message='';render();}return true;}
  if(d.qualityViewRecord){q.viewRecord=d.qualityViewRecord;q.message='';render();return true;}
  if(d.qualityCloseRecord!==undefined){q.viewRecord=null;render();return true;}
  if(d.qualityStart){q.run={templateId:d.qualityStart,page:0,answers:[]};q.message='';render();return true;}
  if(d.qualityPrev!==undefined){if(q.run&&q.run.page>0){q.run.page--;q.message='';render();}return true;}
  if(d.qualityNext!==undefined||d.qualityFinish!==undefined){
    const run=q.run,template=q.templates.find(t=>t.id===run?.templateId);if(!template)return true;
    if(!qualityPageComplete(template,run.page,run.answers[run.page])){q.message='Completa todas las respuestas o la foto solicitada para continuar.';render();return true;}
    q.message='';if(d.qualityNext!==undefined){run.page++;render();return true;}
    if(q.saving)return true;q.saving=true;render();
    (async()=>{try{await apiRequest('/api/quality/records','POST',{templateId:template.id,revision:template.revision,answers:template.pages.map((page,i)=>run.answers[i]||(page.type==='photo'?{}:{selected:[]}))});q.run=null;q.message='Control de calidad guardado. Puedes consultarlo en tus controles realizados.';try{await loadQualityData();}catch{q.message='Control guardado. Vuelve a abrir esta sección para actualizar el historial.';}}
    catch(caught){q.message=caught.message;}finally{q.saving=false;render();}})();return true;
  }
  qualityCaptureEditor();const editor=q.editor;if(!editor)return true;
  if(d.qualityAddPage){if(editor.pages.length<20)editor.pages.push(d.qualityAddPage==='photo'?{type:'photo',title:'Nueva foto',prompt:'',required:true}:{type:'questions',title:'Nuevas preguntas',questions:[{prompt:'',options:['','']}]});}
  else if(d.qualityRemovePage!==undefined){if(editor.pages.length>1)editor.pages.splice(Number(d.qualityRemovePage),1);}
  else if(d.qualityMovePage!==undefined){const i=Number(d.qualityMovePage),j=i+Number(d.direction);if(j>=0&&j<editor.pages.length)[editor.pages[i],editor.pages[j]]=[editor.pages[j],editor.pages[i]];}
  else if(d.qualityAddQuestion!==undefined){const page=editor.pages[Number(d.qualityAddQuestion)];if(page?.type==='questions'&&page.questions.length<20)page.questions.push({prompt:'',options:['','']});}
  else if(d.qualityRemoveQuestion){const [i,j]=d.qualityRemoveQuestion.split(':').map(Number);const list=editor.pages[i]?.questions;if(list?.length>1)list.splice(j,1);}
  else if(d.qualityToggleOption){const [i,j]=d.qualityToggleOption.split(':').map(Number);const options=editor.pages[i]?.questions?.[j]?.options;if(options?.length===2)options.push('');else if(options?.length===3)options.pop();}
  render();return true;
}
function qualityImageData(file){return new Promise((resolve,reject)=>{
  if(!file||!file.type.startsWith('image/')||file.size>12_000_000){reject(new Error('Selecciona una imagen de hasta 12 MB.'));return;}
  const reader=new FileReader();
  reader.onerror=()=>reject(new Error('No se pudo leer esta imagen.'));
  reader.onload=()=>{
    const image=new Image();
    image.onerror=()=>reject(new Error('No se pudo abrir esta imagen.'));
    image.onload=()=>{try{
      const ratio=Math.min(1,1280/Math.max(image.width,image.height));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(image.width*ratio));
      canvas.height=Math.max(1,Math.round(image.height*ratio));
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      const data=canvas.toDataURL('image/jpeg',0.72);
      if(data.length>1_500_000)reject(new Error('La foto sigue siendo demasiado grande. Prueba con otra imagen.'));
      else resolve(data);
    }catch(caught){reject(caught);}};
    image.src=reader.result;
  };
  reader.readAsDataURL(file);
});}
async function qualityChange(event){
  const q=state.quality;if(event.target.id==='quality-area'){qualityCaptureEditor();const a=area(event.target.value);q.editor.area=a.id;q.editor.line=a.lines[0];render();return true;}
  if(event.target.matches?.('[data-quality-answer]')){const run=q.run;if(!run)return true;const answer=run.answers[run.page]||{selected:[]};answer.selected[Number(event.target.dataset.qualityAnswer)]=event.target.value===''?null:Number(event.target.value);run.answers[run.page]=answer;return true;}
  if(event.target.matches?.('[data-quality-photo]')){
    const run=q.run,file=event.target.files?.[0];if(!run||!file||q.photoBusy)return true;
    const pageIndex=run.page;q.photoBusy=true;q.message='Preparando foto…';render();
    try{const data=await qualityImageData(file);if(state.quality===q&&q.run===run){run.answers[pageIndex]={photoData:data};q.message='Foto preparada.';}}
    catch(caught){if(state.quality===q&&q.run===run)q.message=caught.message;}
    finally{q.photoBusy=false;if(state.quality===q&&q.run===run)render();}
    return true;
  }
  return false;
}
async function qualitySubmit(event){
  if(event.target.id!=='quality-template-form')return false;event.preventDefault();qualityCaptureEditor();const q=state.quality,editor=q.editor;
  try{const saved=await apiRequest(editor.id?`/api/quality/templates/${editor.id}`:'/api/quality/templates',editor.id?'PUT':'POST',editor);await loadQualityData();q.editor=JSON.parse(JSON.stringify(saved.item));q.message=editor.status==='published'?'Control publicado y disponible en su línea.':'Borrador guardado.';}
  catch(caught){q.message=caught.message;}render();return true;
}
