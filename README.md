# Portal interno Isopan

## App online con cuenta

[Abre Isopan](https://tochick.github.io/Isopan/). La publicación utiliza el servidor protegido de Supabase y comparte las cuentas, registros, recetas y fotografías de la instalación local configurada con Supabase. Al abrir o recargar solicita la cuenta; el token de acceso permanece solo en memoria. Las acciones se guardan en la base de datos y los archivos internos se descargan únicamente tras comprobar permisos.

Para preparar la publicación: `node build-site.cjs` y `node site-test.cjs`. GitHub Pages publica únicamente `site-dist/`, sin claves, cuentas ni archivos internos. El servidor se prepara con `node build-edge.cjs`; su despliegue en Supabase requiere acceso autorizado al proyecto y los secretos privados descritos en `supabase/README.md`.

Aplicación interna para Producción, aprendizaje y contenidos de empresa. Se abre desde un servidor local o de la red de la empresa. Incluye cuentas con roles **administrador** y **solo lectura**. Los permisos de edición se comprueban en el servidor.

## Probar en este ordenador

Haz doble clic en **Iniciar Isopan.cmd**. El iniciador pone en marcha el servidor si estaba detenido y abre la aplicación en el navegador. Puedes volver a usarlo después de apagar o reiniciar este ordenador; si el servidor ya funciona, solo abrirá la página.

También puedes iniciarlo desde una terminal. Requiere Node.js 18 o posterior:

```text
node server.cjs
```

Abre `http://127.0.0.1:4173` en el navegador. En el primer arranque se crea la cuenta administradora inicial. Después se inicia sesión y se pueden crear otras cuentas desde **Administración → Cuentas**. Este equipo sirve para pruebas; la instalación de la empresa se hará en su propio servidor.

No abras `index.html` directamente: las cuentas y el contenido compartido necesitan el servidor.

## Inicio

El **Tablero de noticias** muestra cumpleaños, eventos, comunicados y novedades generales publicados por administración. Cada noticia tiene categoría, título, texto y una fecha de evento opcional. En **Administración → Noticias** se pueden crear, editar y eliminar; las publicaciones aparecen en Inicio para todas las cuentas.

El **Buzón de sugerencias** permite a cualquier cuenta enviar una idea con su usuario y consultar sus propias sugerencias y estado. Solo administración puede ver el buzón completo y marcar cada sugerencia como Nueva, En revisión o Resuelta desde **Administración → Sugerencias**. Las sugerencias quedan guardadas en el servidor y no se muestran a otros lectores.

## Recorrido de Producción

**Producción → Área → Línea → Preparar un cambio.** Perfiladora, Espuma y Cortadora tienen líneas Verde y Azul. Lana de roca y Embaladora tienen una sola. El cambio se prepara únicamente después de entrar en una línea. Las referencias del panel actual y siguiente se guardan como borrador en el navegador, separadas por cuenta.

**Controles de calidad → Área → Línea.** Los controles publicados para esa línea se completan página a página. Cada página puede reunir preguntas con desplegables de dos o tres opciones, o solicitar una foto concreta. El móvil ofrece la cámara al seleccionar una foto; también se puede elegir una imagen existente. Las fotos se reducen antes de enviarse y se guardan en el almacenamiento privado configurado, con acceso limitado a la persona que completó el control y a administración. Los controles realizados conservan las preguntas y la versión que se usó, aunque el administrador edite después la plantilla.

La guía se muestra solo cuando área, línea y ambas referencias coinciden con un procedimiento aprobado. Si no hay coincidencia, la aplicación indica que la guía no está disponible y remite a la documentación vigente de planta. **No contiene pasos de operación inventados.**

En **Espuma → Línea Verde**, el cambio permite elegir BCI, FP1 o KIMPUR y seleccionar los paneles por tipo, espesor y ancho. El catálogo diferencia Box (incluye las hojas llamadas Pared), Isoparete (Plissé) y Forzen. Los anchos no identificados permanecen aparte. Las recetas de BCI y FP1 se muestran como tablas por formulado, tipo de panel, ancho y espesor del panel siguiente, con sus filas diferenciadas por velocidad. Los documentos originales indican «En elaboración» y las transcripciones requieren validación. KIMPUR permanece pendiente; no se reutilizan recetas de otro ancho. Isoparete tiene un único ancho de 1000 mm. Los ajustes históricos transcritos se muestran como pendientes de confirmación. Las hojas originales de ajustes no se publican en la web. Para Box 1000 y 1155 se muestran las fotografías de referencia DX y SX, con acceso mediante sesión.

## Aprendizaje

La sección empieza con **Elige tu puesto**: PRL general, Perfiladora, Espuma, Lana de roca, Cortadora o Embaladora. Incluye 25 temas sobre el proceso de fabricación de paneles sándwich, riesgos generales de fábrica y riesgos propios de cada zona. Cada tema muestra sus fuentes; siete PDF del INSST están disponibles para descarga dentro del portal. Los temas de funcionamiento de la línea se basan en información pública de fabricantes y deben contrastarse con el proceso concreto de la planta. La marca «Tema leído» solo guarda el progreso personal en ese navegador; no acredita formación obligatoria ni sustituye la evaluación de riesgos, las FDS ni los procedimientos de planta.

## Oficinas

Solo las cuentas administradoras pueden entrar en **Oficinas**.

- **Inventarios:** crea, busca, filtra, actualiza y elimina artículos con cantidad, unidad, ubicación, área y observaciones. Cada artículo pertenece a una categoría predefinida: Nastros, Guarnicion, Pelabiles, Peines espuma, Peines cola, Mezcladores cola, Mezcladores promotor o Bobinas. Los datos quedan compartidos en el servidor.
- **Áreas jefes de turno:** el calendario permite elegir fecha y Turno 1, 2 o 3. Muestra las cinco áreas. Cada turno deja comentarios para el siguiente; una incidencia recibida se muestra con una X roja y su comentario. Si el turno anterior guardó el relevo sin comentario, aparece un tick verde. Si aún no registró el relevo, aparece un signo de interrogación gris. El Turno 1 recibe lo registrado por el Turno 3 del día anterior. Los comentarios que todavía no se han guardado se conservan al cambiar de fecha o turno mientras la página siga abierta.

  Bajo el relevo hay un seguimiento de **incidencias abiertas**. Un administrador puede registrar el área, la prioridad, el detalle y un responsable opcional, y marcar la incidencia como resuelta o reabrirla. Permanece visible entre turnos y marca el área con una X roja mientras esté abierta. Los comentarios del relevo siguen funcionando de forma independiente.

Los comentarios vacíos indican que el turno no comunicó incidencias en esa área. El calendario muestra los días con relevos registrados y destaca los que contienen comentarios.

## Mantenimiento

Las cuentas administradoras acceden a **Mantenimiento** desde Espacio de trabajo. Comparte las mismas incidencias con jefes de turno: permite registrarlas, resolverlas o reabrirlas y guardar una fecha prevista de reparación, una fecha de llegada de material y una nota. Las previsiones se muestran también en los relevos y no cierran la incidencia. Los campos sin guardar se conservan mientras se actualiza el listado o se abre el menú móvil; se borran al cerrar sesión.

## Administración

- **Portada:** modifica los textos de Inicio.
- **Noticias:** publica, edita y elimina las noticias internas de Inicio.
- **Sugerencias:** revisa las ideas recibidas y actualiza su estado.
- **Controles de calidad → Administrar controles:** crea controles por área y línea, añade y ordena páginas de preguntas o fotos, guarda borradores, publica y consulta los controles realizados. Cada página de preguntas puede contener hasta 20 preguntas con dos o tres respuestas posibles; un control admite hasta ocho páginas de foto.
- **Guías de cambio:** crea, edita, aprueba o elimina procedimientos asociados a una línea y a un par de referencias.
- **Preguntas:** crea, edita, aprueba o elimina preguntas con respuesta, explicación y fuente documental.
- **Cuentas:** crea administradores o lectores, cambia roles, restablece contraseñas y elimina cuentas. La cuenta en uso no puede modificarse o eliminarse desde el panel. Cada persona puede cambiar su propia contraseña en **Mi cuenta**.

Los borradores de guías y preguntas solo son visibles para administradores. El test ofrece 31 preguntas de repaso basadas en fuentes públicas, además de las preguntas de planta que aprueben los administradores. Permite seleccionar PRL general o un puesto, corregir respuestas y consultar un resultado orientativo. Las cuentas de **solo lectura** ven Inicio, Producción, Controles de calidad, Aprendizaje y Test de conocimientos; no ven Oficinas, Mantenimiento, Administración ni Mi cuenta. Pueden consultar contenido publicado, preparar una consulta de cambio, enviar sugerencias y completar controles de calidad. No pueden modificar noticias, contenido formativo ni cuentas.

Antes de publicar guías o preguntas, transcribe y valida los documentos de producción con el responsable correspondiente. Los ajustes históricos de Espuma Verde aún requieren confirmación antes de usarse como referencia operativa.

## Instalar después en el servidor de la empresa

Para guardar cuentas, registros, recetas, documentos y fotografías en Supabase conservando el servidor y los permisos de Isopan, consulta [la configuración de Supabase](supabase/README.md). Las claves se guardan solo en la configuración privada del servidor. La app pide la cuenta al abrir o recargar su página.

El proyecto no depende de este ordenador: copia la carpeta al servidor de la empresa e instala Node.js 18 o posterior allí. Configura un directorio persistente para los datos con `ISOPAN_DATA_DIR` y haz copias de seguridad de `store.json`. El servidor escucha solo en `127.0.0.1` por defecto. Puedes cambiar el puerto con `PORT`.

Las cuentas envían contraseñas al servidor. Para acceso desde otros ordenadores o tablets, publica la aplicación mediante **HTTPS** en la red de la empresa. Hay dos opciones: mantener Node en `127.0.0.1` detrás de un proxy HTTPS corporativo y configurar `PUBLIC_HTTPS=1`; o configurar `HOST=0.0.0.0`, `TLS_KEY` y `TLS_CERT` para que Node sirva HTTPS directamente. El servidor rechaza el acceso de red directo sin TLS. Crea la cuenta administradora inicial antes de abrir el acceso a la red. El administrador de sistemas podrá asignar una dirección interna estable y configurar el inicio automático del proceso.

Las sesiones se cierran al reiniciar el servidor; las cuentas y contenidos permanecen en `store.json`. Las contraseñas se guardan con un hash derivado mediante `scrypt`, no en texto claro. El archivo de datos no se sirve por HTTP.

El servidor limita los intentos de acceso, comprueba los permisos y el token de sesión en cada cambio, rechaza datos JSON mal formados o demasiado grandes y envía cabeceras de seguridad al navegador. Mantén Node.js actualizado y protege el directorio de datos y sus copias de seguridad con permisos del sistema operativo. Las recetas y ajustes históricos de Espuma Verde requieren validación antes de su uso operativo.

## Comprobaciones

```text
node smoke-test.cjs
node server-test.cjs
node recipe-test.cjs
```

La primera comprueba navegación, borradores, calidad, mantenimiento, guías, test y el escape de contenido mostrado con una interfaz simulada. La segunda arranca un servidor de prueba con datos temporales y verifica cuentas, permisos, noticias, sugerencias, inventario, relevos, calidad, límites de peticiones, cabeceras de seguridad, cambios concurrentes y conservación de datos tras reiniciar. No sustituyen una prueba visual en navegador ni una prueba de cámara en un móvil. El logotipo y el icono se obtuvieron del [sitio oficial de Isopan](https://isopan.com/) y están incluidos localmente.

Las fotos DX/SX y las transcripciones de recetas permanecen en `Base de datos/`, fuera del repositorio público. Para trasladar la instalación interna, copia también `Base de datos/Datos espuma verde/Fotos Box/` y `Base de datos/Recetas/recetas.json` mediante un canal interno. El servidor lee las recetas al arrancar.

## Móvil, tablet y ordenador

La interfaz adapta el menú y los formularios al ancho disponible, ofrece controles táctiles de al menos 44 píxeles y respeta la reducción de movimiento. Las recetas muestran directamente todos sus campos en tarjetas grandes, sin tabla estrecha ni desplegable adicional. En móvil las tarjetas se muestran en una columna con nombres completos y valores grandes; en ordenador se distribuyen en columnas. Los ejemplos de nuevos controles son indicaciones que desaparecen al escribir; al entrar en un texto existente se selecciona para sustituirlo directamente sin borrar datos al salir del campo.
