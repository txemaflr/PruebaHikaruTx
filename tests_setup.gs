// tests_setup.gs - Configuración inicial de hojas para tests

function crearHojasTests() {
  const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
  
  // 1. Crear hoja Test_Preguntas
  let preguntasSheet = spreadsheet.getSheetByName('Test_Preguntas');
  if (!preguntasSheet) {
    preguntasSheet = spreadsheet.insertSheet('Test_Preguntas');
    preguntasSheet.getRange(1, 1, 1, 18).setValues([[
      'id_pregunta',
      'id_tema',
      'titulo',
      'descripcion',
      'opcion_a',
      'opcion_b',
      'opcion_c',
      'opcion_d',
      'respuesta_correcta',
      'retroalimentacion',
      'fuente_sheet',
      'fuente_hoja',
      'veces_mostrada',
      'veces_acertada',
      'veces_fallada',
      'racha_actual',
      'ultima_respuesta',
      'activa'
    ]]);
    
    // Formato de encabezados
    preguntasSheet.getRange(1, 1, 1, 18)
      .setBackground('#4a86e8')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    console.log('Hoja Test_Preguntas creada');
  }
  
  // 2. Crear hoja Test_Historial
  let historialSheet = spreadsheet.getSheetByName('Test_Historial');
  if (!historialSheet) {
    historialSheet = spreadsheet.insertSheet('Test_Historial');
    historialSheet.getRange(1, 1, 1, 10).setValues([[
      'id_historial',
      'id_oposicion',
      'temas_ids',
      'fecha',
      'modo',
      'total_preguntas',
      'correctas',
      'incorrectas',
      'porcentaje',
      'tiempo_segundos'
    ]]);
    
    // Formato de encabezados
    historialSheet.getRange(1, 1, 1, 10)
      .setBackground('#4a86e8')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    console.log('Hoja Test_Historial creada');
  }
  
  // 3. Crear hoja Test_Respuestas
  let respuestasSheet = spreadsheet.getSheetByName('Test_Respuestas');
  if (!respuestasSheet) {
    respuestasSheet = spreadsheet.insertSheet('Test_Respuestas');
    respuestasSheet.getRange(1, 1, 1, 6).setValues([[
      'id_respuesta',
      'id_historial',
      'id_pregunta',
      'respuesta_usuario',
      'es_correcta',
      'fecha'
    ]]);
    
    // Formato de encabezados
    respuestasSheet.getRange(1, 1, 1, 6)
      .setBackground('#4a86e8')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    console.log('Hoja Test_Respuestas creada');
  }
  
  return 'Hojas de tests creadas correctamente';
}

// Función para eliminar las hojas de test (por si necesitas reiniciar)
function eliminarHojasTests() {
  const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
  
  const hojasAEliminar = ['Test_Preguntas', 'Test_Historial', 'Test_Respuestas'];
  
  hojasAEliminar.forEach(nombreHoja => {
    const hoja = spreadsheet.getSheetByName(nombreHoja);
    if (hoja) {
      spreadsheet.deleteSheet(hoja);
      console.log(`Hoja ${nombreHoja} eliminada`);
    }
  });
  
  return 'Hojas de tests eliminadas';
}
