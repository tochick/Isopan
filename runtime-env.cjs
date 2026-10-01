const native=process.env;
module.exports=typeof Deno==='undefined'?native:{...native,ISOPAN_EDGE:'1',ISOPAN_STORAGE:'supabase',PUBLIC_HTTPS:'1',HOST:'127.0.0.1',SUPABASE_SECRET_KEY:native.ISOPAN_SECRET_KEY};
