function doGet() {
  return HtmlService.createTemplateFromFile('index').evaluate()
    .setTitle("Gestión de Temario")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Función para obtener el HTML de una sección
function getSectionHTML(section) {
  var validSections = ['oposiciones', 'bloques', 'temas', 'test', 'conceptos', 'estudio', 'repasos'];
  if (!validSections.includes(section)) section = 'bienvenido';
  return HtmlService.createHtmlOutput('<h2>' + section.charAt(0).toUpperCase() + section.slice(1) + '</h2>').getContent();
  var html;
  switch (section) {
    case 'oposiciones':
      html = HtmlService.createHtmlOutput('<h2>Oposiciones</h2>').getContent();
      break;
    case 'bloques':
      html = HtmlService.createHtmlOutput('<h2>Bloques</h2>').getContent();
      break;
    case 'temas':
      html = HtmlService.createHtmlOutput('<h2>Temas</h2>').getContent();
      break;
    case 'test':
      html = HtmlService.createHtmlOutput('<h2>Test</h2>').getContent();
      break;
    case 'conceptos':
      html = HtmlService.createHtmlOutput('<h2>Conceptos</h2>').getContent();
      break;
    case 'estudio':
      html = HtmlService.createHtmlOutput('<h2>Estudio</h2>').getContent();
      break;
    case 'repasos':
      html = HtmlService.createHtmlOutput('<h2>Repasos</h2>').getContent();
      break;
    default:
      html = HtmlService.createHtmlOutput('<h2>Bienvenido</h2>').getContent();
  }
  return html;
}

//OPOSICIONES
  function isOposicionNombreUnico(nombre) {
    return isOposicionNombreUnico(nombre); // Función definida en `oposiciones.gs`
  }
  function getOposicionesOrdenadas() {
    return getOposicionesOrdenadas(); // Función definida en `oposiciones.gs`
  }

  function addOposicion(nombre) {
    return addOposicion(nombre); // Función definida en `oposiciones.gs`
  }

  function updateOposicion(id, nuevoNombre) {
    return updateOposicion(id, nuevoNombre); // Función definida en `oposiciones.gs`
  }

  function isOposicionNombreUnicoParaActualizacion(id, nombre, data, columns) {
    return isOposicionNombreUnicoParaActualizacion(id, nombre, data, columns); // Función definida en `oposiciones.gs`
  }

  function deleteOposicion(id) {
    return deleteOposicion(id); // Función definida en `oposiciones.gs`
  }

  function getTemasDisponiblesParaOposicion(idOposicion) {
    return getTemasDisponiblesParaOposicion(idOposicion); // Función definida en `oposiciones.gs`
  }

  function getOposiciones() {
    return getOposiciones(); // Función definida en `oposiciones.gs`
  }  

  function desvincularTemaAOposicion(idTema) {
    return desvincularTemaAOposicion(idTema); // Función definida en `oposiciones.gs`
  }

  function vincularTemaConHijos(idOposicion, idTema) {
    return vincularTemaConHijos(idOposicion, idTema); // Función definida en `oposiciones.gs`
  }

  function getTemasVinculadosEnArbol(idOposicion) {
    return getTemasVinculadosEnArbol(idOposicion); // Función definida en `oposiciones.gs`
  }

  function getTemasVinculadosEnArbolOrdenados(idOposicion) {
    return getTemasVinculadosEnArbolOrdenados(idOposicion); // Función definida en `oposiciones.gs`
  }

  function getTemasDisponiblesEnArbol(idOposicion) {
    return getTemasDisponiblesEnArbol(idOposicion); // Función definida en `oposiciones.gs`
  }
  
  function getTemasPorOposicion(idOposicion) {
    return getTemasPorOposicion(idOposicion); // Función definida en `oposicion.gs`
  }
//FIN OPOSICIONES

//BLOQUES
  function getTemasSinBloque() {
    return getTemasSinBloque(); // Función definida en `bloques.gs`
  }
  
    // Vincular un tema a un bloque
  function vincularTemaABloque(idBloque, idTema) {
    return vincularTemaABloque(idBloque, idTema); // Función definida en `bloques.gs`
  }

  function getTemasPorBloqueConNombre(idBloque) {
    return getTemasPorBloqueConNombre(idBloque); // Función definida en `bloques.gs`
  }


  function getBloquesConTemas() {
    return getBloquesConTemas(); //Funcion definida en `bloques.gs`
  }

  function getBloques() {
    return getBloques(); // Función definida en `bloques.gs`
  }

  function getTemasSinBloque() {
    return getTemasSinBloque(); // Función definida en `bloques.gs`
  }
  
  function addBloque(nombre) {
    return addBloque(nombre); // Función definida en `bloques.gs`
  }

  function updateBloque(id, nuevoNombre) {
    return updateBloque(id, nuevoNombre); // Función definida en `bloques.gs`
  }

  function eliminarBloque(id) {
    return eliminarBloque(id); // Función definida en `bloques.gs`
  }

  function getBloquesOrdenados()  {
    return getBloquesOrdenados();  // Función definida en `bloques.gs`
  }
//FIN BLOQUES

// TEMAS
  function isTemaNombreUnico(nombre) {
    return isTemaNombreUnico(nombre); // Función definida en `temas.gs`
  }
  function getTemasEnArbol() {
    return getTemasEnArbol(); // Función definida en `temas.gs`
  }

  function getTemasEnArbolOrdenados() {
    return getTemasEnArbolOrdenados(); // Función definida en `temas.gs`
  }

//FIN TEMAS
