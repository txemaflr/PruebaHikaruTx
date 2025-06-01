// tests.gs - Funciones principales para el sistema de tests

// Función para importar preguntas desde un Google Sheet de tests
function importarPreguntasDesdeSheet(urlSheet, idTema) {
  try {
    const sourceSpreadsheet = SpreadsheetApp.openByUrl(urlSheet);
    const sheets = sourceSpreadsheet.getSheets();
    const preguntasSheet = getGoogleSheet('Test_Preguntas');
    const preguntasColumns = getColumnIndices('Test_Preguntas');
    
    let preguntasImportadas = 0;
    
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
      
      // Saltar la primera fila (encabezados)
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // Verificar que la fila tenga datos válidos
        if (row[1] && row[5] && row[6] && row[7] && row[8] && row[9]) {
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
    
    return `Se importaron ${preguntasImportadas} preguntas correctamente`;
  } catch (error) {
    throw new Error(`Error al importar preguntas: ${error.message}`);
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

// Función de prueba para importar desde tu sheet de ejemplo
function pruebaImportarPreguntas() {
  const urlSheet = 'https://docs.google.com/spreadsheets/d/1AR5otTYFAOVgeS2BaUzCdGSb1Mix72Hki60WNzAxMrM/edit?usp=sharing';
  // Usa el ID de un tema existente para la prueba
  const idTema = 1; // Cambia esto por un ID de tema real
  
  try {
    const resultado = importarPreguntasDesdeSheet(urlSheet, idTema);
    console.log(resultado);
    return resultado;
  } catch (error) {
    console.error(error);
    return error.message;
  }
}
