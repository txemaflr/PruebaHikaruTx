// tests.gs - Versión mejorada con búsqueda automática de temas

// Función auxiliar para buscar ID de tema por nombre
function buscarIdTemaPorNombre(nombreTema) {
  const temasSheet = getGoogleSheet('Temas');
  const temasColumns = getColumnIndices('Temas');
  const temasData = temasSheet.getDataRange().getValues();
  
  for (let i = 1; i < temasData.length; i++) {
    const nombreCompleto = `${temasData[i][temasColumns['prenombre']] || ''} ${temasData[i][temasColumns['nombre']]}`.trim();
    const nombreSolo = temasData[i][temasColumns['nombre']];
    
    // Comparar con nombre completo o solo nombre
    if (nombreCompleto.toLowerCase() === nombreTema.toLowerCase() || 
        nombreSolo.toLowerCase() === nombreTema.toLowerCase()) {
      return temasData[i][temasColumns['id_tema']];
    }
  }
  
  return null; // No encontrado
}

// Función mejorada para importar preguntas
function importarPreguntasDesdeSheet(urlSheet) {
  try {
    const sourceSpreadsheet = SpreadsheetApp.openByUrl(urlSheet);
    const sheets = sourceSpreadsheet.getSheets();
    const preguntasSheet = getGoogleSheet('Test_Preguntas');
    const preguntasColumns = getColumnIndices('Test_Preguntas');
    
    let preguntasImportadas = 0;
    let temasNoEncontrados = new Set();
    
    // Obtener el último ID de pregunta
    const lastRow = preguntasSheet.getLastRow();
    let ultimoId = 0;
    if (lastRow > 1) {
      const ids = preguntasSheet.getRange(2, preguntasColumns['id_pregunta'] + 1, lastRow - 1, 1)
        .getValues()
        .flat()
        .map(id => parseInt(id) || 0);
      ultimoId = Math.max(...ids, 0);
    }
    
    // Recorrer todas las hojas del spreadsheet
    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
      const data = sheet.getDataRange().getValues();
      
      // Buscar la columna nombre_tema en los encabezados
      const headers = data[0];
      let columnaNombreTema = -1;
      
      for (let i = 0; i < headers.length; i++) {
        if (headers[i].toLowerCase() === 'nombre_tema' || headers[i].toLowerCase() === 'tema') {
          columnaNombreTema = i;
          break;
        }
      }
      
      // Si no encuentra la columna, usar el nombre de la hoja como tema
      const temaDefault = sheetName;
      
      // Saltar la primera fila (encabezados)
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // Verificar que la fila tenga datos válidos
        if (row[1] && row[5] && row[6] && row[7] && row[8] && row[9]) {
          // Obtener nombre del tema
          const nombreTema = (columnaNombreTema >= 0 && row[columnaNombreTema]) ? 
                            row[columnaNombreTema] : temaDefault;
          
          // Buscar ID del tema
          const idTema = buscarIdTemaPorNombre(nombreTema);
          
          if (!idTema) {
            temasNoEncontrados.add(nombreTema);
            continue; // Saltar esta pregunta si no se encuentra el tema
          }
          
          ultimoId++;
          
          const nuevaPregunta = [];
          nuevaPregunta[preguntasColumns['id_pregunta']] = ultimoId;
          nuevaPregunta[preguntasColumns['id_tema']] = idTema;
          nuevaPregunta[preguntasColumns['titulo']] = row[1]; // Título pregunta
          nuevaPregunta[preguntasColumns['descripcion']] = row[2] || ''; // Descripción
          nuevaPregunta[preguntasColumns['opcion_a']] = row[5]; // Respuesta 1
          nuevaPregunta[preguntasColumns['opcion_b']] = row[6]; // Respuesta 2
          nuevaPregunta[preguntasColumns['opcion_c']] = row[7]; // Respuesta 3
          nuevaPregunta[preguntasColumns['opcion_d']] = row[8]; // Respuesta 4
          nuevaPregunta[preguntasColumns['respuesta_correcta']] = row[9]; // Solución1
          nuevaPregunta[preguntasColumns['retroalimentacion']] = row[11] || ''; // Retroalimentación
          nuevaPregunta[preguntasColumns['fuente_sheet']] = sourceSpreadsheet.getName();
          nuevaPregunta[preguntasColumns['fuente_hoja']] = sheetName;
          nuevaPregunta[preguntasColumns['veces_mostrada']] = 0;
          nuevaPregunta[preguntasColumns['veces_acertada']] = 0;
          nuevaPregunta[preguntasColumns['veces_fallada']] = 0;
          nuevaPregunta[preguntasColumns['racha_actual']] = 0;
          nuevaPregunta[preguntasColumns['ultima_respuesta']] = '';
          nuevaPregunta[preguntasColumns['activa']] = true;
          
          preguntasSheet.appendRow(nuevaPregunta);
          preguntasImportadas++;
        }
      }
    });
    
    let mensaje = `Se importaron ${preguntasImportadas} preguntas correctamente.`;
    if (temasNoEncontrados.size > 0) {
      mensaje += ` Temas no encontrados: ${Array.from(temasNoEncontrados).join(', ')}`;
    }
    
    return mensaje;
  } catch (error) {
    throw new Error(`Error al importar preguntas: ${error.message}`);
  }
}

// Función de prueba actualizada
function pruebaImportarPreguntas() {
  const urlSheet = 'https://docs.google.com/spreadsheets/d/1AR5otTYFAOVgeS2BaUzCdGSb1Mix72Hki60WNzAxMrM/edit?usp=sharing';
  
  try {
    const resultado = importarPreguntasDesdeSheet(urlSheet);
    console.log(resultado);
    return resultado;
  } catch (error) {
    console.error(error);
    return error.message;
  }
}

// Función para buscar archivos de tests en una carpeta de Drive
function buscarArchivosTestEnCarpeta(nombreCarpeta) {
  try {
    const carpetas = DriveApp.getFoldersByName(nombreCarpeta);
    
    if (!carpetas.hasNext()) {
      throw new Error(`No se encontró la carpeta "${nombreCarpeta}"`);
    }
    
    const carpeta = carpetas.next();
    const archivos = carpeta.getFilesByType(MimeType.GOOGLE_SHEETS);
    const listaArchivos = [];
    
    while (archivos.hasNext()) {
      const archivo = archivos.next();
      listaArchivos.push({
        id: archivo.getId(),
        nombre: archivo.getName(),
        url: archivo.getUrl()
      });
    }
    
    return listaArchivos;
  } catch (error) {
    throw new Error(`Error al buscar archivos: ${error.message}`);
  }
}

// Función para generar un test según criterios
function generarTest(idOposicion, idsTemas, numPreguntas, modo, opciones = {}) {
  try {
    const preguntasSheet = getGoogleSheet('Test_Preguntas');
    const preguntasColumns = getColumnIndices('Test_Preguntas');
    const preguntasData = preguntasSheet.getDataRange().getValues();
    
    // Obtener todos los IDs de temas incluyendo hijos
    const todosLosTemas = obtenerTemasConHijos(idsTemas);
    
    // Filtrar preguntas según criterios
    let preguntasFiltradas = [];
    
    for (let i = 1; i < preguntasData.length; i++) {
      const row = preguntasData[i];
      const idTema = row[preguntasColumns['id_tema']];
      const racha = row[preguntasColumns['racha_actual']] || 0;
      const vecesFallada = row[preguntasColumns['veces_fallada']] || 0;
      const activa = row[preguntasColumns['activa']];
      
      // Verificar si el tema está en la lista
      if (!todosLosTemas.includes(idTema)) continue;
      
      // Verificar si la pregunta está activa
      if (activa === false || activa === 'FALSE') continue;
      
      // Aplicar filtros opcionales
      if (opciones.soloFalladas && vecesFallada === 0) continue;
      if (opciones.incluirDominadas === false && racha >= 5) continue;
      if (opciones.soloDominadas && racha < 5) continue;
      
      preguntasFiltradas.push({
        index: i,
        id: row[preguntasColumns['id_pregunta']],
        titulo: row[preguntasColumns['titulo']],
        descripcion: row[preguntasColumns['descripcion']],
        opcion_a: row[preguntasColumns['opcion_a']],
        opcion_b: row[preguntasColumns['opcion_b']],
        opcion_c: row[preguntasColumns['opcion_c']],
        opcion_d: row[preguntasColumns['opcion_d']],
        respuesta_correcta: row[preguntasColumns['respuesta_correcta']],
        retroalimentacion: row[preguntasColumns['retroalimentacion']],
        racha: racha
      });
    }
    
    // Verificar si hay suficientes preguntas
    if (preguntasFiltradas.length === 0) {
      throw new Error('No hay preguntas disponibles con los criterios seleccionados');
    }
    
    // Mezclar y seleccionar el número de preguntas solicitado
    const preguntasSeleccionadas = shuffleArray(preguntasFiltradas)
      .slice(0, Math.min(numPreguntas, preguntasFiltradas.length));
    
    // Crear registro en historial
    const historialSheet = getGoogleSheet('Test_Historial');
    const historialColumns = getColumnIndices('Test_Historial');
    
    const nuevoHistorial = [];
    const idHistorial = generateUniqueId(historialSheet, historialColumns['id_historial'] + 1);
    
    nuevoHistorial[historialColumns['id_historial']] = idHistorial;
    nuevoHistorial[historialColumns['id_oposicion']] = idOposicion;
    nuevoHistorial[historialColumns['temas_ids']] = idsTemas.join(',');
    nuevoHistorial[historialColumns['fecha']] = new Date();
    nuevoHistorial[historialColumns['modo']] = modo;
    nuevoHistorial[historialColumns['total_preguntas']] = preguntasSeleccionadas.length;
    nuevoHistorial[historialColumns['correctas']] = 0;
    nuevoHistorial[historialColumns['incorrectas']] = 0;
    nuevoHistorial[historialColumns['porcentaje']] = 0;
    nuevoHistorial[historialColumns['tiempo_segundos']] = 0;
    
    historialSheet.appendRow(nuevoHistorial);
    
    return {
      idHistorial: idHistorial,
      idOposicion: idOposicion,
      idsTemas: idsTemas,
      modo: modo,
      totalPreguntas: preguntasSeleccionadas.length,
      preguntas: preguntasSeleccionadas,
      tiempoInicio: new Date().getTime()
    };
    
  } catch (error) {
    throw new Error(`Error al generar test: ${error.message}`);
  }
}

// Función para obtener temas con todos sus hijos
function obtenerTemasConHijos(idsTemas) {
  const temasSheet = getGoogleSheet('Temas');
  const temasColumns = getColumnIndices('Temas');
  const temasData = temasSheet.getDataRange().getValues();
  
  const todosLosTemas = new Set(idsTemas.map(id => Number(id)));
  
  // Función recursiva para obtener hijos
  function obtenerHijos(idPadre) {
    for (let i = 1; i < temasData.length; i++) {
      if (temasData[i][temasColumns['id_padre']] === idPadre) {
        const idHijo = temasData[i][temasColumns['id_tema']];
        todosLosTemas.add(idHijo);
        obtenerHijos(idHijo); // Recursión para obtener nietos
      }
    }
  }
  
  // Obtener hijos de cada tema seleccionado
  idsTemas.forEach(id => obtenerHijos(Number(id)));
  
  return Array.from(todosLosTemas);
}

// Función para guardar respuesta de una pregunta
function guardarRespuestaTest(idHistorial, idPregunta, respuestaUsuario, indexPregunta) {
  try {
    const preguntasSheet = getGoogleSheet('Test_Preguntas');
    const preguntasColumns = getColumnIndices('Test_Preguntas');
    const respuestasSheet = getGoogleSheet('Test_Respuestas');
    const respuestasColumns = getColumnIndices('Test_Respuestas');
    
    // Obtener datos de la pregunta
    const preguntaData = preguntasSheet.getRange(indexPregunta + 1, 1, 1, preguntasSheet.getLastColumn()).getValues()[0];
    const respuestaCorrecta = preguntaData[preguntasColumns['respuesta_correcta']];
    const esCorrecta = respuestaUsuario === respuestaCorrecta;
    
    // Guardar respuesta
    const nuevaRespuesta = [];
    const idRespuesta = generateUniqueId(respuestasSheet, respuestasColumns['id_respuesta'] + 1);
    
    nuevaRespuesta[respuestasColumns['id_respuesta']] = idRespuesta;
    nuevaRespuesta[respuestasColumns['id_historial']] = idHistorial;
    nuevaRespuesta[respuestasColumns['id_pregunta']] = idPregunta;
    nuevaRespuesta[respuestasColumns['respuesta_usuario']] = respuestaUsuario;
    nuevaRespuesta[respuestasColumns['es_correcta']] = esCorrecta;
    nuevaRespuesta[respuestasColumns['fecha']] = new Date();
    
    respuestasSheet.appendRow(nuevaRespuesta);
    
    // Actualizar estadísticas de la pregunta
    const vecesMostrada = (preguntaData[preguntasColumns['veces_mostrada']] || 0) + 1;
    const vecesAcertada = (preguntaData[preguntasColumns['veces_acertada']] || 0) + (esCorrecta ? 1 : 0);
    const vecesFallada = (preguntaData[preguntasColumns['veces_fallada']] || 0) + (esCorrecta ? 0 : 1);
    const rachaActual = esCorrecta ? 
      (preguntaData[preguntasColumns['racha_actual']] || 0) + 1 : 
      0;
    
    // Actualizar en la hoja
    preguntasSheet.getRange(indexPregunta + 1, preguntasColumns['veces_mostrada'] + 1).setValue(vecesMostrada);
    preguntasSheet.getRange(indexPregunta + 1, preguntasColumns['veces_acertada'] + 1).setValue(vecesAcertada);
    preguntasSheet.getRange(indexPregunta + 1, preguntasColumns['veces_fallada'] + 1).setValue(vecesFallada);
    preguntasSheet.getRange(indexPregunta + 1, preguntasColumns['racha_actual'] + 1).setValue(rachaActual);
    preguntasSheet.getRange(indexPregunta + 1, preguntasColumns['ultima_respuesta'] + 1).setValue(new Date());
    
    return {
      esCorrecta: esCorrecta,
      respuestaCorrecta: respuestaCorrecta,
      rachaActual: rachaActual
    };
    
  } catch (error) {
    throw new Error(`Error al guardar respuesta: ${error.message}`);
  }
}

// Función para finalizar test y calcular resultados
function finalizarTest(idHistorial, tiempoInicio) {
  try {
    const historialSheet = getGoogleSheet('Test_Historial');
    const historialColumns = getColumnIndices('Test_Historial');
    const respuestasSheet = getGoogleSheet('Test_Respuestas');
    const respuestasColumns = getColumnIndices('Test_Respuestas');
    
    // Calcular estadísticas
    const respuestasData = respuestasSheet.getDataRange().getValues();
    let correctas = 0;
    let incorrectas = 0;
    
    for (let i = 1; i < respuestasData.length; i++) {
      if (respuestasData[i][respuestasColumns['id_historial']] === idHistorial) {
        if (respuestasData[i][respuestasColumns['es_correcta']]) {
          correctas++;
        } else {
          incorrectas++;
        }
      }
    }
    
    const total = correctas + incorrectas;
    const porcentaje = total > 0 ? Math.round((correctas / total) * 100) : 0;
    const tiempoSegundos = Math.round((new Date().getTime() - tiempoInicio) / 1000);
    
    // Buscar fila del historial
    const historialData = historialSheet.getDataRange().getValues();
    let filaHistorial = -1;
    
    for (let i = 1; i < historialData.length; i++) {
      if (historialData[i][historialColumns['id_historial']] === idHistorial) {
        filaHistorial = i + 1;
        break;
      }
    }
    
    if (filaHistorial > 0) {
      // Actualizar estadísticas
      historialSheet.getRange(filaHistorial, historialColumns['correctas'] + 1).setValue(correctas);
      historialSheet.getRange(filaHistorial, historialColumns['incorrectas'] + 1).setValue(incorrectas);
      historialSheet.getRange(filaHistorial, historialColumns['porcentaje'] + 1).setValue(porcentaje);
      historialSheet.getRange(filaHistorial, historialColumns['tiempo_segundos'] + 1).setValue(tiempoSegundos);
    }
    
    return {
      correctas: correctas,
      incorrectas: incorrectas,
      total: total,
      porcentaje: porcentaje,
      tiempoSegundos: tiempoSegundos,
      tiempoFormateado: formatearTiempo(tiempoSegundos)
    };
    
  } catch (error) {
    throw new Error(`Error al finalizar test: ${error.message}`);
  }
}

// Función auxiliar para formatear tiempo
function formatearTiempo(segundos) {
  const minutos = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return `${minutos}m ${seg}s`;
}

// Obtener estadísticas de preguntas
function obtenerEstadisticasPreguntas() {
  try {
    const preguntasSheet = getGoogleSheet('Test_Preguntas');
    const data = preguntasSheet.getDataRange().getValues();
    
    const totalPreguntas = data.length - 1; // menos encabezados
    
    // Contar temas únicos
    const temasUnicos = new Set();
    for (let i = 1; i < data.length; i++) {
      const idTema = data[i][1]; // columna id_tema
      if (idTema) temasUnicos.add(idTema);
    }
    
    // Obtener última fecha de importación
    let ultimaFecha = null;
    // Aquí podrías buscar la fecha más reciente si la guardas
    
    return {
      totalPreguntas: totalPreguntas,
      temasConPreguntas: temasUnicos.size,
      ultimaImportacion: ultimaFecha ? new Date(ultimaFecha).toLocaleString() : 'Nunca'
    };
  } catch (error) {
    throw new Error('Error al obtener estadísticas: ' + error.message);
  }
}

// Función mejorada para importar preguntas con opción de hojas específicas
function importarPreguntasDesdeSheetMejorado(urlSheet, hojasEspecificas = null) {
  try {
    const sourceSpreadsheet = SpreadsheetApp.openByUrl(urlSheet);
    const sheets = sourceSpreadsheet.getSheets();
    const preguntasSheet = getGoogleSheet('Test_Preguntas');
    const preguntasColumns = getColumnIndices('Test_Preguntas');
    
    let preguntasImportadas = 0;
    let hojasImportadas = 0;
    let temasNoEncontrados = new Set();
    
    // Obtener el último ID de pregunta
    const lastRow = preguntasSheet.getLastRow();
    let ultimoId = 0;
    if (lastRow > 1) {
      const ids = preguntasSheet.getRange(2, preguntasColumns['id_pregunta'] + 1, lastRow - 1, 1)
        .getValues()
        .flat()
        .map(id => parseInt(id) || 0);
      ultimoId = Math.max(...ids, 0);
    }
    
    // Recorrer las hojas
    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
      
      // Si se especificaron hojas, verificar si esta hoja está en la lista
      if (hojasEspecificas && !hojasEspecificas.includes(sheetName)) {
        console.log('Saltando hoja:', sheetName);
        return;
      }
      
      console.log('Importando hoja:', sheetName);
      hojasImportadas++;
      
      const data = sheet.getDataRange().getValues();
      
      // Buscar la columna nombre_tema
      const headers = data[0];
      let columnaNombreTema = -1;
      
      for (let i = 0; i < headers.length; i++) {
        if (headers[i] && (headers[i].toLowerCase() === 'nombre_tema' || headers[i].toLowerCase() === 'tema')) {
          columnaNombreTema = i;
          break;
        }
      }
      
      // Usar el nombre de la hoja como tema por defecto
      const temaDefault = sheetName;
      
      // Procesar filas
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // Verificar que la fila tenga datos válidos
        if (row[1] && row[5] && row[6] && row[7] && row[8] && row[9]) {
          const nombreTema = (columnaNombreTema >= 0 && row[columnaNombreTema]) ? 
                            row[columnaNombreTema] : temaDefault;
          
          const idTema = buscarIdTemaPorNombre(nombreTema);
          
          if (!idTema) {
            temasNoEncontrados.add(nombreTema);
            continue;
          }
          
          ultimoId++;
          
          const nuevaPregunta = [];
          nuevaPregunta[preguntasColumns['id_pregunta']] = ultimoId;
          nuevaPregunta[preguntasColumns['id_tema']] = idTema;
          nuevaPregunta[preguntasColumns['titulo']] = row[1];
          nuevaPregunta[preguntasColumns['descripcion']] = row[2] || '';
          nuevaPregunta[preguntasColumns['opcion_a']] = row[5];
          nuevaPregunta[preguntasColumns['opcion_b']] = row[6];
          nuevaPregunta[preguntasColumns['opcion_c']] = row[7];
          nuevaPregunta[preguntasColumns['opcion_d']] = row[8];
          nuevaPregunta[preguntasColumns['respuesta_correcta']] = row[9];
          nuevaPregunta[preguntasColumns['retroalimentacion']] = row[11] || '';
          nuevaPregunta[preguntasColumns['fuente_sheet']] = sourceSpreadsheet.getName();
          nuevaPregunta[preguntasColumns['fuente_hoja']] = sheetName;
          nuevaPregunta[preguntasColumns['veces_mostrada']] = 0;
          nuevaPregunta[preguntasColumns['veces_acertada']] = 0;
          nuevaPregunta[preguntasColumns['veces_fallada']] = 0;
          nuevaPregunta[preguntasColumns['racha_actual']] = 0;
          nuevaPregunta[preguntasColumns['ultima_respuesta']] = '';
          nuevaPregunta[preguntasColumns['activa']] = true;
          
          preguntasSheet.appendRow(nuevaPregunta);
          preguntasImportadas++;
        }
      }
    });
    
    let mensaje = `Importación completada:\n`;
    mensaje += `- ${preguntasImportadas} preguntas importadas\n`;
    mensaje += `- ${hojasImportadas} hojas procesadas`;
    
    if (temasNoEncontrados.size > 0) {
      mensaje += `\n\nTemas no encontrados: ${Array.from(temasNoEncontrados).join(', ')}`;
    }
    
    return mensaje;
  } catch (error) {
    throw new Error(`Error al importar preguntas: ${error.message}`);
  }
}
