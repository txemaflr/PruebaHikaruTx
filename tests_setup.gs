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

// Función para crear las hojas de planificación
function crearHojasPlanificacion() {
  const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
  
  // 1. Crear hoja Planificacion_Diaria
  let planDiariaSheet = spreadsheet.getSheetByName('Planificacion_Diaria');
  if (!planDiariaSheet) {
    planDiariaSheet = spreadsheet.insertSheet('Planificacion_Diaria');
    planDiariaSheet.getRange(1, 1, 1, 7).setValues([[
      'id_planificacion',
      'id_oposicion',
      'fecha',
      'tiempo_previsto_minutos',
      'tiempo_real_minutos',
      'estado',
      'fecha_creacion'
    ]]);
    
    // Formato de encabezados
    planDiariaSheet.getRange(1, 1, 1, 7)
      .setBackground('#4a86e8')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    console.log('Hoja Planificacion_Diaria creada');
  }
  
  // 2. Crear hoja Planificacion_Temas
  let planTemasSheet = spreadsheet.getSheetByName('Planificacion_Temas');
  if (!planTemasSheet) {
    planTemasSheet = spreadsheet.insertSheet('Planificacion_Temas');
    planTemasSheet.getRange(1, 1, 1, 11).setValues([[
      'id_planificacion_tema',
      'id_planificacion',
      'id_tema_padre',
      'id_tema_actual',
      'numero_slot',
      'id_bloque',
      'fecha_inicio',
      'fecha_completado',
      'estado',
      'tiempo_estimado_minutos',
      'tiempo_real_minutos'
    ]]);
    
    // Formato de encabezados
    planTemasSheet.getRange(1, 1, 1, 11)
      .setBackground('#4a86e8')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    console.log('Hoja Planificacion_Temas creada');
  }
  
  // 3. Crear hoja Progreso_Temas
  let progresoSheet = spreadsheet.getSheetByName('Progreso_Temas');
  if (!progresoSheet) {
    progresoSheet = spreadsheet.insertSheet('Progreso_Temas');
    progresoSheet.getRange(1, 1, 1, 8).setValues([[
      'id_progreso',
      'id_tema',
      'id_planificacion',
      'fecha_inicio',
      'fecha_completado',
      'estado',
      'paginas_completadas',
      'tiempo_dedicado_minutos'
    ]]);
    
    // Formato de encabezados
    progresoSheet.getRange(1, 1, 1, 8)
      .setBackground('#4a86e8')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    console.log('Hoja Progreso_Temas creada');
  }
  
  // 4. Crear hoja Repasos_Programados
  let repasosSheet = spreadsheet.getSheetByName('Repasos_Programados');
  if (!repasosSheet) {
    repasosSheet = spreadsheet.insertSheet('Repasos_Programados');
    repasosSheet.getRange(1, 1, 1, 10).setValues([[
      'id_repaso',
      'id_tema',
      'numero_repaso',
      'fecha_programada',
      'fecha_completado',
      'estado',
      'id_test',
      'id_evento_calendar',
      'nota_test',
      'tiempo_test_minutos'
    ]]);
    
    // Formato de encabezados
    repasosSheet.getRange(1, 1, 1, 10)
      .setBackground('#4a86e8')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    console.log('Hoja Repasos_Programados creada');
  }
  
  return 'Hojas de planificación creadas correctamente';
}

// Función para eliminar las hojas de planificación (por si necesitas reiniciar)
function eliminarHojasPlanificacion() {
  const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
  
  const hojasAEliminar = ['Planificacion_Diaria', 'Planificacion_Temas', 'Progreso_Temas', 'Repasos_Programados'];
  
  hojasAEliminar.forEach(nombreHoja => {
    const hoja = spreadsheet.getSheetByName(nombreHoja);
    if (hoja) {
      spreadsheet.deleteSheet(hoja);
      console.log(`Hoja ${nombreHoja} eliminada`);
    }
  });
  
  return 'Hojas de planificación eliminadas';
}
