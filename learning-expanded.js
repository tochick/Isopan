// Temario de consulta basado en fuentes públicas. Los ajustes y procedimientos de planta requieren validación interna.
(function(){
  const S={
    process:{label:'ROBOR · Línea continua de paneles',url:'https://www.robor.it/en/continuous-sandwich-panel-line'},
    isopan:{label:'Isopan · Paneles con espuma o lana mineral',url:'https://isopan.com/report-esg-isopan/'},
    lugares:{label:'INSST · Guía de lugares de trabajo',url:'https://www.insst.es/documents/94886/203536/Gu%C3%ADa%2Bt%C3%A9cnica%2Butilizaci%C3%B3n%2Bde%2Blos%2Blugares%2Bde%2Btrabajo.pdf/170ae991-4d42-43f4-8c43-d232b249efcb',local:'/docs/lugares-insst.pdf'},
    altura:{label:'INSST · Plataformas y caídas',url:'https://www.insst.es/stp/basemaq/031-plataforma-colgada-para-elevacion-de-personas-caida-desde-plataforma'},
    trafico:{label:'INSST · NTP 1178, circulación',url:'https://www.insst.es/documentacion/colecciones-tecnicas/ntp-notas-tecnicas-de-prevencion/36-serie-ntp-numeros-1176-a-1190-ano-2023/ntp-1178-barreras-de-proteccion-para-la-gestion-de-la-circulacion-en-los-lugares-de-trabajo'},
    maquinas:{label:'INSST · Equipos de trabajo',url:'https://www.insst.es/materias/equipos/equipos-de-trabajo'},
    consignacion:{label:'INSST · NTP 1117, consignación',url:'https://www.insst.es/documentacion/colecciones-tecnicas/ntp-notas-tecnicas-de-prevencion/32-serie-ntp-numeros-1101-a-1135-ano-2018/ntp-1.117-consignacion-de-maquinas'},
    cargas:{label:'INSST · Guía de manipulación de cargas (2024)',url:'https://www.insst.es/documentacion/material-normativo/guia-tecnica-para-la-evaluacion-y-prevencion-de-los-riesgos-relativos-a-la-manipulacion-manual-de-cargas',local:'/docs/cargas-insst.pdf'},
    ruido:{label:'INSST · Guía sobre exposición al ruido',url:'https://www.insst.es/noticias-insst/guia-tecnica-para-la-evaluacion-y-prevencion-de-los-riesgos-relacionados-con-la-exposicion-al-ruido-en-los-lugares-de-trabajo-ano-2022',local:'/docs/ruido-insst.pdf'},
    incendio:{label:'INSST · Seguridad contra incendios',url:'https://www.insst.es/materias/riesgos/seguridad-en-el-trabajo/seguridad-contra-incendios'},
    perfilAcc:{label:'INSST · Accidente en perfiladora',url:'https://www.insst.es/stp/binvac/019-atrapamiento-en-rodillos-de-maquina-perfiladora-de-metal-en-frio',local:'/docs/perfiladora-accidente-insst.pdf'},
    cizalla:{label:'INSST · NTP 153, cizalla de metal',url:'https://www.insst.es/documentacion/colecciones-tecnicas/ntp-notas-tecnicas-de-prevencion/4-serie-ntp-numeros-121-a-155-ano-1985/ntp-153-cizalla-de-guillotina-para-metal'},
    cizallaAcc:{label:'INSST · Accidente en retirada de retales',url:'https://www.insst.es/stp/basemaq/027-cizalla-retirada-de-desechos-por-la-parte-trasera',local:'/docs/cizalla-accidente-insst.pdf'},
    lana:{label:'INSST · NTP 642, fibras minerales',url:'https://www.insst.es/documentacion/colecciones-tecnicas/ntp-notas-tecnicas-de-prevencion/18-serie-ntp-numeros-611-a-645-ano-2003/ntp-642-fibras-minerales-artificiales-y-otras-fibras-diferentes-del-amianto-ii-evaluacion-y-control.'},
    quimicos:{label:'INSST · NTP 1192 y 1193, diisocianatos',url:'https://www.insst.es/noticias-insst/ntp-1192-1193-y-1194-diisocianatos-en-el-ambito-laboral-parte-i-parte-ii-y-parte-iii-',local:'/docs/diisocianatos-insst.pdf'}
  };
  function add(area,group,title,text,sections,sources){window.ISOPAN_LEARNING_TOPICS.push({area,group,title,text,sections:sections.map(([heading,points])=>({title:heading,points})),sources:sources.map(key=>S[key])});}

  add('general','PRL GENERAL','Cómo se fabrica un panel sándwich','Visión de conjunto de una línea continua: dos caras metálicas y un núcleo aislante pasan por varias zonas coordinadas.',[
    ['De bobina a panel',['Las bobinas alimentan las caras metálicas. Los rodillos dan el perfil requerido para cubierta o fachada.','El núcleo se forma con espuma de poliuretano o se introduce como lana mineral preparada, según el producto.','El conjunto pasa por una zona de unión y prensado; después se corta, apila y embala. La secuencia exacta depende de la instalación.']],
    ['Puestos de la línea',['Perfiladora prepara las caras; Espuma trabaja el núcleo reactivo; Lana de roca prepara y alimenta el núcleo mineral.','Cortadora separa el panel a la longitud de la orden; Embaladora forma paquetes y protege el producto para expedición.','Un cambio en espesor, ancho, perfil o núcleo afecta a varias zonas y exige coordinación mediante la orden y el relevo.']],
    ['Distinguir producto y proceso',['Isopan fabrica paneles con núcleo de espuma o lana mineral; no deben confundirse sus riesgos ni sus métodos de unión.','Esta explicación muestra el flujo general de fabricación. No describe la secuencia de maniobras de una línea concreta.']]
  ],['process','isopan']);

  add('general','PRL GENERAL','Caídas al mismo y a distinto nivel','Las zonas de paso, plataformas, escaleras y accesos a la maquinaria requieren controles diferentes.',[
    ['Caídas al mismo nivel',['Un suelo mojado, restos de chapa, flejes o cables pueden causar un resbalón o tropiezo. Mantén despejados los pasos y comunica derrames o daños del pavimento.','Respeta los recorridos señalizados y la iluminación prevista. No atravieses huecos entre máquinas ni zonas de carga para acortar camino.']],
    ['Caídas a distinto nivel',['Identifica plataformas elevadas, huecos, bordes y escaleras. Usa el acceso previsto y verifica que las protecciones colectivas están colocadas.','No subas a bobinas, paquetes, transportadores o estructuras de la línea como si fueran una plataforma.','Si una barandilla o tapa de hueco falta o está dañada, delimita la zona según el procedimiento y avisa antes de trabajar cerca.']],
    ['Trabajos temporales en altura',['La elección de escalera, plataforma u otro equipo depende de la evaluación de la tarea y del equipo disponible.','El sistema anticaídas, cuando se exige, requiere formación, punto de anclaje adecuado y plan de rescate; no se improvisa.']]
  ],['lugares','altura']);

  add('general','PRL GENERAL','Peatones, carretillas y cargas','La separación entre personas y vehículos es una medida clave en cualquier nave con movimiento de materiales.',[
    ['Circulación segura',['Sigue los pasos peatonales y respeta barreras, puertas y cruces. Antes de cruzar, comprueba que el conductor te ha visto y que el vehículo se ha detenido.','No camines bajo cargas suspendidas ni entre una carretilla y una pared, estantería o paquete.','Las zonas de maniobra y de carga deben mantenerse despejadas y señalizadas.']],
    ['Cargas inestables',['Una bobina, un paquete de paneles o un palé puede desplomarse, deslizar o bascular. No intentes sujetarlo con el cuerpo.','Comunica apoyos deteriorados, flejes rotos y apilados inestables. La retirada corresponde a personas autorizadas y medios adecuados.']],
    ['Si se modifica un recorrido',['Un cambio de ubicación, barrera o puerta puede crear nuevos cruces entre peatones y carretillas. Comunícalo para que se revise el plan de circulación.']]
  ],['trafico','cargas']);

  add('general','PRL GENERAL','Máquinas, resguardos y energías','Rodillos, cintas, sierras, prensas y elevadores pueden causar atrapamiento aun cuando una tarea parezca breve.',[
    ['Durante el funcionamiento',['Mantén las manos, herramientas, ropa y cabello fuera de zonas de arrastre y corte. No anules resguardos ni enclavamientos.','Reconoce los mandos de parada del puesto, pero recuerda que una parada normal no elimina necesariamente todas las energías.']],
    ['Antes de intervenir',['Desatascar, limpiar dentro de un resguardo o hacer mantenimiento requiere el procedimiento de consignación aplicable.','La consignación considera electricidad, presión, gravedad, movimiento y energía acumulada; la realiza personal formado y autorizado.','Antes de reanudar, las protecciones deben estar repuestas y la zona despejada según el procedimiento de planta.']],
    ['Señales de alarma',['Un resguardo abierto, un arranque inesperado o una protección que no detiene la máquina requieren parar la tarea y comunicar la incidencia.']]
  ],['maquinas','consignacion']);

  add('general','PRL GENERAL','Ruido y protección auditiva','La exposición se evalúa por tarea y tiempo, no solo por la sensación subjetiva de que una máquina suena fuerte.',[
    ['Reconocer el riesgo',['Las zonas de perfilado, corte y compresión pueden generar niveles elevados o impulsos de ruido. La señalización y la evaluación indican dónde se requiere protección.','El ruido también puede dificultar la comunicación y hacer que no se perciban alarmas o vehículos.']],
    ['Medidas de control',['Se priorizan equipos menos ruidosos, mantenimiento, aislamiento y organización del tiempo de exposición.','Usa el protector auditivo asignado con el ajuste adecuado y comunica si está deteriorado o impide percibir una señal crítica.']],
    ['Seguimiento',['Las mediciones y la vigilancia de la salud corresponden al servicio de prevención. Una aplicación formativa no permite estimar tu exposición personal.']]
  ],['ruido']);

  add('general','PRL GENERAL','Incendio, alarmas y evacuación','Las emergencias deben responderse con el plan del centro y con las funciones asignadas a cada persona.',[
    ['Prevención diaria',['Mantén accesibles salidas, extintores y cuadros. Respeta las zonas con restricciones de fuentes de ignición y el permiso para trabajos en caliente.','Los líquidos inflamables y los residuos se almacenan en los recipientes y áreas definidos por la evaluación.']],
    ['Alarma y evacuación',['Ante una alarma, detén la tarea de forma segura si puedes hacerlo sin retrasarte y sigue la ruta de evacuación indicada.','Dirígete al punto de encuentro y comunica personas ausentes o información útil al equipo de emergencia. No reentres hasta recibir autorización.']],
    ['Intervención',['El uso de equipos de extinción y la respuesta a derrames corresponden a personal designado y formado. No sustituyas el plan por iniciativas improvisadas.']]
  ],['incendio']);

  add('general','PRL GENERAL','Manipulación de paneles y ergonomía','Los paneles pueden ser largos, pesados o difíciles de sujetar; la manipulación se planifica antes de moverlos.',[
    ['Evaluar la tarea',['Observa peso, longitud, centro de gravedad, aristas, espacio disponible y frecuencia del movimiento.','Levantar, empujar, arrastrar y sujetar son formas de manipulación que pueden producir sobreesfuerzo.']],
    ['Reducir el esfuerzo',['Usa transportadores, ventosas, carretillas u otras ayudas previstas para la tarea. No excedas la capacidad del equipo ni uses una ayuda para una carga no autorizada.','Si la pieza bloquea la visión, no cabe por el paso o obliga a una postura forzada, reorganiza la maniobra con el responsable.']],
    ['Vigilancia del puesto',['Comunica molestias musculares y movimientos repetitivos que aparezcan en una fase de trabajo para revisar la organización y los medios.']]
  ],['cargas']);

  add('perfiladora','PERFILADORA','De la bobina al perfil','La perfiladora convierte la chapa plana en la geometría de las caras del panel.',[
    ['Flujo del material',['La bobina se desenrolla y la banda avanza por estaciones de rodillos que modifican su forma progresivamente.','La cara exterior e interior pueden necesitar perfiles y acabados diferentes según la orden.']],
    ['Qué se comprueba',['La referencia de chapa, acabado y perfil deben corresponder con la orden. Se observan daños del recubrimiento, desviaciones y deformaciones.','Un cambio de bobina o perfil afecta a la continuidad de toda la línea y se coordina con el resto de zonas.']],
    ['Riesgos característicos',['Flejes, bordes de chapa, bobinas y rodillos presentan riesgos de corte, golpe y atrapamiento. No se guía material con la mano junto a partes móviles.']]
  ],['process','perfilAcc']);

  add('perfiladora','PERFILADORA','Bobinas, flejes y bordes de chapa','La manipulación previa al perfilado combina cargas de gran masa con bordes cortantes.',[
    ['Antes de alimentar',['Verifica la identificación del material y que la bobina se manipula con el útil y el equipo previstos.','Mantén el cuerpo fuera de la trayectoria de una bobina o un fleje que pueda liberarse.']],
    ['En los rodillos',['Respeta resguardos y distancias de seguridad. Un atasco o desvío requiere el procedimiento de parada y acceso autorizado.','El EPI se selecciona según la tarea; cerca de elementos giratorios, un guante inadecuado puede añadir riesgo de arrastre.']],
    ['Después del cambio',['Comunica defectos visibles o material inestable antes de que avance hacia espuma o lana de roca.']]
  ],['perfilAcc','maquinas']);

  add('espuma','ESPUMAS','Cómo se forma el núcleo de espuma','La espuma se genera a partir de componentes dosificados y mezclados; su expansión y unión se realizan dentro de la línea.',[
    ['Proceso general',['Las caras metálicas llegan perfiladas. El sistema de espumado distribuye la mezcla entre ellas.','La expansión, el contacto con las caras y el paso por la doble cinta contribuyen a dar espesor y continuidad al panel.']],
    ['Variables de producto',['Formulado, espesor, ancho y tipo de panel condicionan la receta y la configuración. La receta real debe proceder de documentación aprobada.','Un cambio de formulado o de componente requiere verificar identificación, conexión y condiciones del proceso según el procedimiento de planta.']],
    ['Riesgos propios',['Puede haber exposición química en conexiones, fugas, limpieza y mantenimiento. Se suman elementos móviles, superficies calientes y, cuando corresponda, atmósferas inflamables.']]
  ],['process','quimicos']);

  add('espuma','ESPUMAS','Doble cinta, curado y calidad','La unión de caras y núcleo continúa después de la aplicación de la mezcla.',[
    ['Paso por la prensa continua',['La doble cinta mantiene la geometría durante el avance y el curado inicial. Los laterales y el espesor se ajustan al producto.','No se accede al interior, a rodillos o a cierres laterales sin la parada y autorización previstas.']],
    ['Señales de desviación',['Espesor irregular, falta de unión, fuga o espuma fuera de la trayectoria son motivos para comunicar la incidencia y seguir el procedimiento.','La inspección visual no sustituye los controles de calidad definidos para la línea.']],
    ['Antes de cortar',['El producto debe llegar a la cortadora en las condiciones definidas por la orden y por los controles de proceso.']]
  ],['process','quimicos']);

  add('lana-de-roca','LANA DE ROCA','Cómo entra la lana mineral en el panel','En este tipo de panel el núcleo se prepara como material sólido antes de unirlo a las caras metálicas.',[
    ['Preparación del núcleo',['La línea puede preparar tiras o lamelas de lana mineral y orientarlas según el diseño del panel.','El núcleo se alimenta de forma continua entre las caras perfiladas y se une mediante el sistema adhesivo previsto.']],
    ['Coordinación con otras zonas',['Espesor, ancho, posición del núcleo y tipo de cara deben corresponder con la orden.','Una discontinuidad o desplazamiento del material puede afectar a la unión y al corte posteriores.']],
    ['Diferencia frente a espuma',['Aquí el aislamiento mineral ya existe antes de entrar en el panel; los riesgos de fibras, polvo y adhesivos se evalúan por separado.']]
  ],['process','lana']);

  add('lana-de-roca','LANA DE ROCA','Fibras, polvo y limpieza','La manipulación y el corte de lana mineral pueden liberar partículas y causar irritación.',[
    ['Exposición',['La evaluación depende del tipo de fibra y de la tarea. No se deduce solo por el nombre genérico “lana de roca”.','Evita generar polvo de forma innecesaria y utiliza la extracción o ventilación prevista.']],
    ['Protección e higiene',['La protección respiratoria, ocular y de la piel se define para el material real y la operación. Consulta la ficha del proveedor.','Sigue el método de limpieza indicado; el barrido en seco o el aire comprimido pueden dispersar fibras.']],
    ['Incidencias',['Comunica extracción averiada, acumulaciones de material o síntomas de irritación para revisar la tarea.']]
  ],['lana']);

  add('lana-de-roca','LANA DE ROCA','Adhesivo y alimentación del núcleo','La unión de lana y caras metálicas requiere controlar el material adhesivo y la continuidad de alimentación.',[
    ['Identificación del adhesivo',['El peligro depende del producto utilizado. Consulta etiqueta, ficha de seguridad y procedimiento antes de conexión, dosificación o limpieza.','No intercambies productos ni recipientes sin identificación.']],
    ['Partes móviles',['Transportadores, rodillos y guiado de lamelas pueden crear puntos de atrapamiento. No retires obstrucciones con la línea en marcha.']],
    ['Control del producto',['Observa si hay huecos, desplazamientos o falta de adhesión y comunica la desviación con la referencia de la orden.']]
  ],['process','maquinas','lana']);

  add('cortadora','CORTADORA','Corte del panel continuo','La cortadora convierte el panel que sale de la prensa en piezas de la longitud requerida.',[
    ['Función del puesto',['La longitud se toma de la orden; el sistema de corte debe coordinarse con el avance de la línea.','Después del corte, las piezas pasan hacia apilado o enfriamiento según la instalación.']],
    ['Peligros de máquina',['La herramienta de corte, los pisones, transportadores y accesos laterales pueden causar corte, atrapamiento o golpe.','No se retiran restos de material dentro de la zona de corte hasta aplicar el procedimiento seguro de acceso.']],
    ['Calidad y trazabilidad',['Comprueba identificación, longitud y aspecto del extremo según los controles aprobados. Señala piezas no conformes para evitar su embalaje.']]
  ],['process','cizalla']);

  add('cortadora','CORTADORA','Retales, atascos y accesos posteriores','La retirada de residuos no debe convertirse en una entrada improvisada a la zona peligrosa.',[
    ['Retales',['Un retal puede tener aristas, peso o apoyo inestable. Se recoge con el medio y recipiente previstos.','No se acumula material junto a pasos, mandos o resguardos.']],
    ['Atasco',['Un panel bloqueado puede conservar energía o moverse al liberarse. Sigue la parada y consignación que corresponda.','La apertura de un acceso no autoriza por sí sola a entrar: comprueba la situación de todas las energías.']],
    ['Lección de un accidente',['El INSST documenta accidentes al retirar desechos por la parte trasera de una cizalla; la zona trasera necesita protección y reglas de acceso propias.']]
  ],['cizallaAcc','consignacion']);

  add('embaladora','EMBALADORA','Apilado y formación del paquete','Los paneles cortados se reúnen y ordenan para su protección y transporte.',[
    ['Flujo de salida',['El sistema puede voltear, elevar o trasladar paneles hasta formar un paquete.','La cantidad, orientación, separadores y etiqueta se comprueban con la orden y el estándar de embalaje del centro.']],
    ['Peligros',['Un panel largo puede flexar, deslizar o golpear. Brazos, ventosas y elevadores tienen zonas de atrapamiento.','No entres en el recorrido del apilador ni bajo una carga suspendida.']],
    ['Incidencias',['Si falla una ventosa, un apoyo o la estabilidad del paquete, detén la maniobra y comunica la situación.']]
  ],['process','cargas']);

  add('embaladora','EMBALADORA','Flejado, protección y expedición','El embalaje protege el producto y mantiene estable el conjunto durante su manipulación.',[
    ['Materiales de embalaje',['Film, cantoneras, separadores y flejes se aplican según el estándar del producto.','Un fleje tensado puede retroceder o liberar energía; solo se manipula con el equipo y la técnica autorizados.']],
    ['Paquete terminado',['Comprueba identificación, integridad visible y estabilidad antes de liberar el paquete.','No apiles sobre apoyos dañados ni invadas vías de circulación o salidas.']],
    ['Transporte interno',['El movimiento con carretilla o puente grúa requiere coordinación con peatones y con el equipo de expedición.']]
  ],['trafico','cargas']);
})();
