const fs=require('node:fs');
fs.mkdirSync('.edge-dist',{recursive:true});
require('esbuild').buildSync({entryPoints:['edge-entry.cjs'],bundle:true,platform:'node',format:'esm',outfile:'.edge-dist/index.js',banner:{js:"import {createRequire} from 'node:module'; import {Buffer} from 'node:buffer'; import process from 'node:process'; const require=createRequire(import.meta.url); const __dirname='/tmp/isopan';"}});
console.log('Servidor preparado para Supabase, sin claves ni archivos de empresa.');
