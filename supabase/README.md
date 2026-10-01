# Supabase en Isopan

El servidor de Isopan puede guardar cuentas y registros en Supabase. El navegador sigue accediendo al servidor de Isopan; las claves de Supabase no se entregan al cliente. Se mantienen las cuentas actuales y sus permisos. Esto no migra las cuentas a Supabase Auth.

## Activación

1. Ejecutar `schema.sql` en el proyecto. La tabla `isopan_state` tiene RLS y no concede acceso a `anon` ni a `authenticated`.
2. Importar una única fila con `id=main`, `payload` igual al contenido de `data/store.json` y `revision=0`. La importación inicial debe hacerse con el servidor parado, una copia local previa y sin sobrescribir una fila existente.
3. Guardar `SUPABASE_URL`, `SUPABASE_SECRET_KEY` e `ISOPAN_STORAGE=supabase` en `.env.supabase`, o en las variables de entorno del servidor. Nunca publicar la clave. `ISOPAN_STORAGE=local` fuerza el almacenamiento local.
4. Comprobar el acceso con `npm run check:supabase` e iniciar el servidor. No hay migración automática ni creación de cuentas si faltan los datos de Supabase.

Las modificaciones se confirman en Supabase antes de responder que se han guardado. Cada operación comprueba la versión anterior para evitar sobrescribir cambios de otro servidor. Ante un fallo o conflicto, la app devuelve un error y la siguiente consulta carga el estado remoto. No cambia silenciosamente a almacenamiento local. Se conserva una copia local de los guardados confirmados; si esa copia falla, se avisa en el registro del servidor.

## Archivos y acceso

Las fotos de controles de calidad se guardan en el bucket privado `isopan-private`, bajo `quality/`. Las fotografías de referencia, los documentos y las tablas de recetas importadas se vinculan mediante `plantContent` dentro del estado. El servidor comprueba los permisos antes de descargar los archivos; no devuelve claves ni enlaces públicos. Las recetas se presentan como tablas, conservando los originales privados como respaldo.

La importación de archivos se realiza con nombres derivados de su contenido y verificación SHA-256 de la descarga. Se conservan los originales locales. Una foto nueva debe subir correctamente antes de guardar el control. Si hay una interrupción posterior a la subida puede quedar un archivo privado sin vincular, que debe reconciliarse antes de borrarlo.

Crear el bucket con `public=false`, sin políticas para `anon` ni `authenticated`, y límites de tamaño y tipos MIME apropiados. Las peticiones usan exclusivamente la clave del servidor. Supabase necesita conexión a Internet. La app exige iniciar sesión al abrir o recargar su página; cierra la sesión previa al inicializar y no deja una cookie persistente. Abrir otra pestaña de la app cierra también la sesión anterior compartida por ese navegador.

## Servidor de la publicación online

GitHub Pages sirve la interfaz real. La función Edge `isopan` ejecuta la misma API que el servidor local mediante `edge-entry.cjs`, sin archivos locales ni credenciales en la interfaz. Configura los secretos `ISOPAN_SECRET_KEY` (clave secreta del proyecto) e `ISOPAN_ALLOWED_ORIGIN` (origen HTTPS de la publicación). `SUPABASE_URL` lo proporciona Supabase.

Prepara el servidor con `node build-edge.cjs` tras instalar las dependencias. Publica `.edge-dist/index.js` como función `isopan`, con `verify_jwt=false`: la autenticación propia de Isopan comprueba el token Bearer, la cuenta, el rol y el token CSRF en cada petición. Las sesiones se guardan con el token resumido mediante SHA-256 dentro del estado privado y sobreviven a cambios de proceso. La tabla privada de intentos limita los accesos incorrectos aunque cambie el proceso. Aplica `supabase/schema.sql` antes de desplegar.

El navegador mantiene su token únicamente en memoria, por lo que cada apertura o recarga vuelve a pedir la cuenta. Las fotos y los documentos se descargan con autorización y se muestran mediante direcciones temporales; se liberan al cerrar la sesión. `site-dist/` contiene únicamente la interfaz y la dirección pública de la función. No contiene la clave del proyecto.

Fuentes: [claves de Supabase](https://supabase.com/docs/guides/getting-started/api-keys) y [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
