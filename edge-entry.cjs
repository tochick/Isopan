const {EventEmitter}=require('node:events');
const runtimeEnv=require('./runtime-env.cjs');
const core=require('./server.cjs');

async function edgeRequest(request){
  const origin=request.headers.get('origin');
  const allowed=runtimeEnv.ISOPAN_ALLOWED_ORIGIN;
  const cors={'Access-Control-Allow-Origin':allowed,'Vary':'Origin','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'authorization,content-type,x-csrf-token','Cache-Control':'no-store'};
  if(origin&&origin!==allowed)return new Response(JSON.stringify({error:'Origen no permitido.'}),{status:403,headers:{'Content-Type':'application/json'}});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(Number(request.headers.get('content-length')||0)>12000000)return new Response(JSON.stringify({error:'Solicitud demasiado grande.'}),{status:413,headers:{...cors,'Content-Type':'application/json'}});
  const url=new URL(request.url);
  const route=url.pathname.replace(/^\/(?:functions\/v1\/)?isopan(?=\/|$)/,'');
  if(!route.startsWith('/api/')&&!route.startsWith('/docs/'))return new Response(JSON.stringify({error:'Ruta no encontrada.'}),{status:404,headers:{...cors,'Content-Type':'application/json'}});
  try{await core.ready;}catch{return new Response(JSON.stringify({error:'El servidor no está disponible.'}),{status:503,headers:{...cors,'Content-Type':'application/json'}});}
  const req=new EventEmitter();req.headers=Object.fromEntries(request.headers);req.headers.host=url.host;
  req.method=request.method;req.url=route+url.search;req.socket={remoteAddress:request.headers.get('x-real-ip')||'remote'};req.destroyed=false;
  let pumping=false;
  const on=req.on.bind(req);
  req.on=(event,listener)=>{
    on(event,listener);
    if(event==='data'&&!pumping){pumping=true;queueMicrotask(async()=>{
      try{const reader=request.body?.getReader();if(reader){while(true){const {done,value}=await reader.read();if(done)break;req.emit('data',Buffer.from(value));}}req.emit('end');}
      catch{req.emit('error',new Error('No se pudo leer la solicitud.'));}
    });}
    return req;
  };
  return new Promise(resolve=>{
    const res=new EventEmitter();res.headersSent=false;res.destroyed=false;let status=200;let headers={...cors};
    res.writeHead=(code,values)=>{status=code;headers={...headers,...values};res.headersSent=true;};
    res.end=bytes=>{res.headersSent=true;resolve(new Response(bytes,{status,headers}));};
    res.destroy=()=>{res.destroyed=true;resolve(new Response(JSON.stringify({error:'Respuesta interrumpida.'}),{status:500,headers:{...cors,'Content-Type':'application/json'}}));};
    core.handler(req,res).catch(()=>res.destroy());
  });
}
if(typeof Deno!=='undefined')Deno.serve(edgeRequest);
module.exports={edgeRequest};

