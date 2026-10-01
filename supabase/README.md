# Supabase en Isopan

El servidor de Isopan puede guardar cuentas y registros en Supabase. El navegador sigue accediendo al servidor de Isopan; las claves de Supabase no se entregan al cliente. Se mantienen las cuentas actuales y sus permisos. Esto no migra las cuentas a Supabase Auth.

## Activación

1. Ejecutar `schema.sql` en el proyecto. La tabla `isopan_state` tiene RLS y no concede acceso a `anon` ni a `authenticated`.
2. Importar una única fila con `id=main`, `payload` igual al contenido de `data/store.json` y `revision=0`. La importación inicial debe hacerse con el servidor parado, una copia local previa y sin sobrescribir una fila existente.
3. Guardar `SUPABASE_URL`, `SUPABASE_SECRET_KEY` e `ISOPAN_STORAGE=supabase` en `.env.supabase`, o en las variables de entorno del servidor. Nunca publicar la clave. `ISOPAN_STORAGE=local` fuerza el almacenamiento local.
4. Comprobar el acceso con `npm run check:supabase` e iniciar el servidor. No hay migración automática ni creación de cuentas si faltan los datos de Supabase.

Las modificaciones se confirman en Supabase antes de responder que se han guardado. Cada operación comprueba la versión anterior para evitar sobrescribir cambios de otro servidor. Ante un fallo o conflicto, la app devuelve un error y la siguiente consulta carga el estado remoto. No cambia silenciosamente a almacenamiento local. Se conserva una copia local de los guardados confirmados; si esa copia falla, se avisa en el registro del servidor.

## Archivos y acceso

Las fotos de controles de calidad, los documentos y las recetas siguen en el disco del servidor. Mantener un único servidor de Isopan con un volumen persistente y respaldar `data/` y `Base de datos/`. Supabase necesita conexión a Internet. Las sesiones siguen gestionadas por Isopan y se cierran al reiniciar.

Supabase es la base de datos; hace falta mantener el servidor Node de la app. GitHub Pages continúa siendo una demostración estática, sin acceso a los datos de empresa. Para utilizar la app desde fuera de la red local hace falta alojar su servidor con HTTPS.

Fuentes: [claves de Supabase](https://supabase.com/docs/guides/getting-started/api-keys) y [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
