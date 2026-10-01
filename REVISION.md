# Revisión de Isopan — 1 de octubre de 2026

## Resultado

Las comprobaciones automatizadas pasan. El servidor actualizado se ha desplegado en Supabase y se han verificado operaciones online con cuentas temporales. Las cuentas y los registros originales se conservaron; los registros temporales se retiraron al finalizar.

## Corrección realizada

Una petición con datos excesivos podía seguir leyendo el flujo de entrada después de recibir una respuesta de rechazo. El adaptador de Supabase ahora cancela la lectura al terminar o interrumpir una respuesta. Una prueba de regresión confirma la respuesta 413 y la cancelación de un flujo que sigue abierto.

## Cobertura

| Parte | Comprobación |
| --- | --- |
| Inicio, noticias y sugerencias | Flujos de cliente, operaciones de servidor, validación y acceso por cuenta |
| Producción y recetas | Selección por formulado, panel, ancho y espesor; conservación de los campos; comprobación visual del diseño en móvil y ordenador |
| Inventario y relevos | Operaciones con datos aislados, categorías, turnos y conservación al reiniciar |
| Mantenimiento | Resolver, reabrir y guardar previsiones; permisos y persistencia; también comprobado en el servidor online |
| Controles de calidad | Plantillas por pasos, respuestas y fotos, versiones, acceso al historial y a fotografías según cuenta |
| Aprendizaje y test | Navegación, preguntas, corrección y separación del progreso personal |
| Cuentas | Administradores y lectores, sesiones, cierre, límites de acceso y revocación |
| Guardado | Copia local, conflictos de escritura, fallos de red y conservación de datos |
| Publicación | Archivos públicos sin claves ni documentos internos; recuperación tras un fallo de conexión |
| Supabase | Servidor activo, tablas con RLS, acceso público a datos denegado, almacenamiento privado y consulta autenticada de fotografías y documentos |

Pruebas ejecutadas: `smoke-test.cjs`, `server-test.cjs`, `recipe-test.cjs`, `supabase-test.cjs`, `edge-test.cjs`, `site-test.cjs` y `connection-test.cjs`.

## Límites de la revisión

- La cámara y la instalación como acceso directo requieren una prueba en un móvil físico. Se han comprobado tamaños de pantalla mediante navegador.
- Las recetas y ajustes históricos conservan sus datos; su validación operativa corresponde al responsable de planta.
- Esta revisión verifica los controles descritos y no constituye una garantía de ausencia de vulnerabilidades.

## Acceso

[Abrir Isopan](https://tochick.github.io/Isopan/). Recarga la página para recibir la publicación actual e inicia sesión con tu cuenta. La interfaz se publica en GitHub Pages y el servidor y los datos funcionan en Supabase.
