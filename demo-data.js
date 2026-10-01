// Datos ficticios para la demostración pública. No contiene datos del servidor.
(() => {
  const now = new Date().toISOString();
  const date = now.slice(0, 10);
  const user = { id: 'demo', username: 'Demostración', role: 'admin' };
  const areas = ['perfiladora', 'espuma', 'lana-de-roca', 'cortadora', 'embaladora'];
  const home = {
    intro: 'Información de la empresa y acceso a los espacios internos.',
    heroTitle: 'Un mismo punto de encuentro para toda la plantilla.',
    heroBody: 'Noticias, formación y herramientas de trabajo en un mismo lugar.',
    companyTitle: 'Construimos soluciones para edificios.',
    companyBody: 'Isopan fabrica paneles metálicos aislantes para cubiertas y fachadas.',
    nextTitle: 'Un portal para nuestro equipo.',
    nextBody: 'Recorre las secciones de esta demostración con contenido de ejemplo.'
  };
  const news = [
    { id: 'news1', category: 'Evento', title: 'Encuentro de equipo', body: 'Ejemplo de noticia para anunciar una actividad de la empresa.', eventDate: date, createdAt: now },
    { id: 'news2', category: 'Cumpleaños', title: 'Un día para celebrar', body: 'Aquí aparecerán los cumpleaños y las celebraciones que publique administración.', eventDate: '', createdAt: now },
    { id: 'news3', category: 'General', title: 'Bienvenidos al portal', body: 'Esta es una vista de demostración. Las noticias y registros son ficticios.', eventDate: '', createdAt: now }
  ];
  const issues = [{ id: 'issue1', area: 'perfiladora', priority: 'Normal', title: 'Incidencia de ejemplo', description: 'Ejemplo de seguimiento entre turnos, pendiente de revisión por mantenimiento.', assignee: 'Equipo de mantenimiento', status: 'open', author: 'Demostración', createdAt: now, resolvedAt: null, repairDate: '', materialDate: '', maintenanceNote: 'La previsión se indicará aquí cuando esté disponible.' }];
  const templates = areas.map((area, i) => ({ id: 'quality' + i, name: 'Control de ejemplo', area, line: ['lana-de-roca', 'embaladora'].includes(area) ? 'Única' : 'Verde', status: 'published', revision: 1, createdAt: now, updatedAt: now, pages: [
    { type: 'questions', title: 'Comprobaciones iniciales', questions: [
      { prompt: '¿Se ha revisado la información de la orden?', options: ['Sí', 'No', 'Pendiente'] },
      { prompt: '¿Se ha realizado la comprobación solicitada?', options: ['Sí', 'No'] }
    ] },
    { type: 'photo', title: 'Pantalla de control', prompt: 'Ejemplo: aquí se solicitará una fotografía de la pantalla indicada.', required: false },
    { type: 'photo', title: 'Segunda pantalla', prompt: 'Ejemplo de una segunda página de fotografía.', required: false },
    { type: 'photo', title: 'Última comprobación', prompt: 'Ejemplo de una tercera página de fotografía.', required: false }
  ] }));
  const catalog = ['box', 'isoparette', 'forzen'].flatMap(family => [1000, 1120, 1150].map(width => ({ id: `demo-${family}-${width}`, family, thickness: 40, width, note: 'Variante ficticia para mostrar el selector. Sin ajustes operativos.' })));
  window.ISOPAN_DEMO_API = async (url, method = 'GET') => {
    if (method !== 'GET') throw new Error('Vista de demostración: no se guardan cambios ni se crean cuentas.');
    const path = url.split('?')[0];
    let result;
    if (path === '/api/bootstrap') result = { setupRequired: false, user, csrf: null };
    else if (path === '/api/content') result = { home, news, mySuggestions: [], procedures: [], questions: [], foamGreenCatalog: catalog };
    else if (path === '/api/users') result = { users: [user] };
    else if (path === '/api/quality/templates') result = { items: templates };
    else if (path === '/api/issues') result = { items: issues };
    else if (path === '/api/inventory') result = { items: [{ id: 'inv1', name: 'Material de ejemplo', category: 'Nastros', quantity: 12, unit: 'ud.', location: 'Almacén de ejemplo', area: 'espuma', notes: 'Datos ficticios.' }] };
    else if (path === '/api/handovers') result = url.includes('month=') ? { items: [] } : { item: null };
    else if (path === '/api/suggestions' || path === '/api/quality/records') result = { items: [] };
    else throw new Error('Este registro no está disponible en la demostración.');
    return JSON.parse(JSON.stringify(result));
  };
})();
