// estudio.gs - Sistema de Estudio Inteligente con Repetición Espaciada

// Obtener el siguiente concepto según el algoritmo de repetición espaciada
function obtenerSiguienteConcepto(idOposicion, modoEstudio = 'inteligente') {
  // Crear hojas si no existen
  crearHojasEstudio();
  
  const conceptosSheet = getGoogleSheet('Conceptos');
  const progresoSheet = getGoogleSheet('Progreso_Estudio');
  const temaOposicionSheet = getGoogleSheet('Tema_Oposicion');
  
  const conceptosColumns = getColumnIndices('Conceptos');
  const progresoColumns = {
    'id_concepto': 0,
    'fecha': 1,
    'nivel_comprension': 2,
    'tiempo_estudio': 3,
    'usuario': 4
  };
  const temaOposicionColumns = getColumnIndices('Tema_Oposicion');
  
  // Obtener todos los temas de la oposición
  const temaOposicionData = temaOposicionSheet.getDataRange().getValues();
  const temasOposicion = temaOposicionData
    .filter(row => String(row[temaOposicionColumns['id_oposicion']]) === String(idOposicion))
    .map(row => row[temaOposicionColumns['id_tema']]);
  
  // Obtener conceptos asociados a estos temas
  const conceptoTemaSheet = getGoogleSheet('Concepto_Tema');
  const conceptoTemaData = conceptoTemaSheet.getDataRange().getValues();
  const conceptosIds = new Set();
  
  conceptoTemaData.forEach(row => {
    if (temasOposicion.includes(row[1])) { // row[1] = id_tema
      conceptosIds.add(row[0]); // row[0] = id_concepto
    }
  });
  
  // Obtener datos de conceptos
  const conceptosData = conceptosSheet.getDataRange().getValues();
  const conceptos = conceptosData
    .filter(row => conceptosIds.has(row[conceptosColumns['id_concepto']]))
    .map(row => ({
      id: row[conceptosColumns['id_concepto']],
      nombre: row[conceptosColumns['nombre']],
      tipo: row[conceptosColumns['id_tipo']],
      importancia: row[conceptosColumns['importancia']] || 3,
      descripcion: row[conceptosColumns['descripcion']],
      pista: row[conceptosColumns['pista']],
      tecnica: row[conceptosColumns['tecnica']],
      revisar: row[conceptosColumns['revisar']]
    }));
  
  // Obtener progreso de estudio
  const progresoData = progresoSheet.getDataRange().getValues();
  const progresoMap = new Map();
  
  progresoData.forEach(row => {
    const idConcepto = row[progresoColumns['id_concepto']];
    if (!progresoMap.has(idConcepto)) {
      progresoMap.set(idConcepto, []);
    }
    progresoMap.get(idConcepto).push({
      fecha: row[progresoColumns['fecha']],
      comprension: row[progresoColumns['nivel_comprension']],
      tiempo: row[progresoColumns['tiempo_estudio']]
    });
  });
  
  // Calcular prioridad según el modo
  let conceptosPriorizados;
  
  switch (modoEstudio) {
    case 'inteligente':
      conceptosPriorizados = calcularPrioridadInteligente(conceptos, progresoMap);
      break;
    case 'secuencial':
      conceptosPriorizados = conceptos.sort((a, b) => a.id - b.id);
      break;
    case 'aleatorio':
      conceptosPriorizados = shuffleArray(conceptos);
      break;
    case 'repaso':
      conceptosPriorizados = conceptos.filter(c => {
        const progreso = progresoMap.get(c.id);
        return progreso && progreso.length > 0;
      });
      conceptosPriorizados = calcularPrioridadInteligente(conceptosPriorizados, progresoMap);
      break;
  }
  
  // Retornar el concepto con mayor prioridad
  if (conceptosPriorizados.length === 0) return null;
  
  const conceptoElegido = conceptosPriorizados[0];
  
  // Agregar información adicional del tema
  const temasSheet = getGoogleSheet('Temas');
  const temasData = temasSheet.getDataRange().getValues();
  const temasColumns = getColumnIndices('Temas');
  
  // Buscar el tema del concepto
  const conceptoTema = conceptoTemaData.find(row => 
    row[0] === conceptoElegido.id
  );
  
  if (conceptoTema) {
    const tema = temasData.find(row => 
      row[temasColumns['id_tema']] === conceptoTema[1]
    );
    
    if (tema) {
      conceptoElegido.tema = tema[temasColumns['nombre']];
      conceptoElegido.bloque = obtenerNombreBloque(tema[temasColumns['id_bloque']]);
    }
  }
  
  // Obtener nombre del tipo de concepto
  const tiposSheet = getGoogleSheet('Tipos_Concepto');
  const tiposData = tiposSheet.getDataRange().getValues();
  const tipo = tiposData.find(row => row[0] === conceptoElegido.tipo);
  if (tipo) {
    conceptoElegido.tipo = tipo[1]; // nombre del tipo
  }
  
  return conceptoElegido;
}

// Calcular prioridad inteligente usando algoritmo de repetición espaciada
function calcularPrioridadInteligente(conceptos, progresoMap) {
  const ahora = new Date();
  
  const conceptosConPrioridad = conceptos.map(concepto => {
    const progreso = progresoMap.get(concepto.id) || [];
    let prioridad = 100; // Prioridad base para conceptos nuevos
    
    if (progreso.length > 0) {
      // Ordenar por fecha más reciente
      progreso.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      const ultimoEstudio = progreso[0];
      const diasDesdeUltimo = (ahora - new Date(ultimoEstudio.fecha)) / (1000 * 60 * 60 * 24);
      
      // Calcular intervalo óptimo según SuperMemo 2
      const n = progreso.length; // número de repeticiones
      const ef = calcularFactorFacilidad(progreso); // factor de facilidad
      
      let intervalo;
      if (n === 1) {
        intervalo = 1;
      } else if (n === 2) {
        intervalo = 6;
      } else {
        // Para n > 2, usar el intervalo anterior multiplicado por el factor
        const intervaloPrevio = progreso[1] ? 
          (new Date(progreso[0].fecha) - new Date(progreso[1].fecha)) / (1000 * 60 * 60 * 24) : 
          6;
        intervalo = Math.round(intervaloPrevio * ef);
      }
      
      // Calcular prioridad basada en cuánto ha pasado del intervalo óptimo
      const ratioTiempo = diasDesdeUltimo / intervalo;
      
      if (ratioTiempo >= 1) {
        // Es hora de repasar o ya pasó
        prioridad = 90 + (10 * Math.min(ratioTiempo, 2));
      } else {
        // Aún no es hora
        prioridad = 10 * ratioTiempo;
      }
      
      // Ajustar por importancia del concepto
      prioridad *= (concepto.importancia / 3);
      
      // Penalizar si el último intento fue difícil
      if (ultimoEstudio.comprension <= 2) {
        prioridad *= 1.5;
      }
    }
    
    return {
      ...concepto,
      prioridad: prioridad,
      ultimoEstudio: progreso[0]?.fecha || null
    };
  });
  
  // Ordenar por prioridad descendente
  return conceptosConPrioridad.sort((a, b) => b.prioridad - a.prioridad);
}

// Calcular factor de facilidad basado en el historial
function calcularFactorFacilidad(progreso) {
  if (progreso.length === 0) return 2.5;
  
  let ef = 2.5;
  progreso.forEach(estudio => {
    const q = estudio.comprension; // calidad de respuesta (1-4)
    ef = ef + (0.1 - (4 - q) * (0.08 + (4 - q) * 0.02));
    ef = Math.max(1.3, ef); // no puede ser menor a 1.3
  });
  
  return ef;
}

// Guardar progreso de un concepto
function guardarProgresoConcepto(idConcepto, nivelComprension, tiempoEstudio) {
  const progresoSheet = getGoogleSheet('Progreso_Estudio');
  const fecha = new Date();
  
  progresoSheet.appendRow([
    idConcepto,
    fecha,
    nivelComprension,
    tiempoEstudio,
    Session.getActiveUser().getEmail() || 'usuario'
  ]);
  
  // Actualizar estadísticas del día
  actualizarEstadisticasDiarias(idConcepto);
  
  return true;
}

// Actualizar estadísticas diarias
function actualizarEstadisticasDiarias(idConcepto) {
  const statsSheet = getGoogleSheet('Estadisticas_Diarias');
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const data = statsSheet.getDataRange().getValues();
  let filaHoy = -1;
  
  // Buscar si ya hay una entrada para hoy
  for (let i = 1; i < data.length; i++) {
    const fecha = new Date(data[i][0]);
    fecha.setHours(0, 0, 0, 0);
    
    if (fecha.getTime() === hoy.getTime()) {
      filaHoy = i;
      break;
    }
  }
  
  if (filaHoy === -1) {
    // Crear nueva entrada
    statsSheet.appendRow([hoy, 1, String(idConcepto)]);
  } else {
    // Actualizar entrada existente
    const conceptosEstudiados = data[filaHoy][1] + 1;
    
    // Verificar si data[filaHoy][2] existe y es una cadena
    let conceptosIds = [];
    if (data[filaHoy][2]) {
      // Convertir a string si no lo es
      const idsString = String(data[filaHoy][2]);
      conceptosIds = idsString.split(',');
    }
    
    if (!conceptosIds.includes(String(idConcepto))) {
      conceptosIds.push(String(idConcepto));
    }
    
    statsSheet.getRange(filaHoy + 1, 2).setValue(conceptosEstudiados);
    statsSheet.getRange(filaHoy + 1, 3).setValue(conceptosIds.join(','));
  }
}

// Obtener estadísticas de estudio
function getEstadisticasEstudio(idOposicion) {
  const statsSheet = getGoogleSheet('Estadisticas_Diarias');
  const data = statsSheet.getDataRange().getValues();
  
  // Calcular racha
  let racha = 0;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  for (let i = data.length - 1; i > 0; i--) {
    const fecha = new Date(data[i][0]);
    fecha.setHours(0, 0, 0, 0);
    
    const diferenciaDias = (hoy - fecha) / (1000 * 60 * 60 * 24);
    
    if (diferenciaDias === racha) {
      racha++;
    } else {
      break;
    }
  }
  
  // Conceptos estudiados hoy
  let conceptosHoy = 0;
  const ultimaFila = data[data.length - 1];
  if (ultimaFila) {
    const fechaUltima = new Date(ultimaFila[0]);
    fechaUltima.setHours(0, 0, 0, 0);
    
    if (fechaUltima.getTime() === hoy.getTime()) {
      conceptosHoy = ultimaFila[1];
    }
  }
  
  return {
    racha: racha,
    conceptosHoy: conceptosHoy
  };
}

// Obtener estadísticas generales para el dashboard
function getEstadisticasGenerales() {
  const temasSheet = getGoogleSheet('Temas');
  const conceptosSheet = getGoogleSheet('Conceptos');
  
  const temas = temasSheet.getDataRange().getValues().length - 1;
  const conceptos = conceptosSheet.getDataRange().getValues().length - 1;
  
  return {
    temas: temas,
    conceptos: conceptos
  };
}

// Función auxiliar para mezclar array
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Obtener nombre del bloque
function obtenerNombreBloque(idBloque) {
  if (!idBloque) return 'Sin bloque';
  
  const bloquesSheet = getGoogleSheet('Bloques');
  const data = bloquesSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === idBloque) {
      return data[i][1];
    }
  }
  
  return 'Sin bloque';
}

// Crear las hojas necesarias si no existen
function crearHojasEstudio() {
  const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
  
  // Crear hoja Progreso_Estudio si no existe
  let progresoSheet = spreadsheet.getSheetByName('Progreso_Estudio');
  if (!progresoSheet) {
    progresoSheet = spreadsheet.insertSheet('Progreso_Estudio');
    progresoSheet.getRange(1, 1, 1, 5).setValues([['id_concepto', 'fecha', 'nivel_comprension', 'tiempo_estudio', 'usuario']]);
  }
  
  // Crear hoja Estadisticas_Diarias si no existe
  let statsSheet = spreadsheet.getSheetByName('Estadisticas_Diarias');
  if (!statsSheet) {
    statsSheet = spreadsheet.insertSheet('Estadisticas_Diarias');
    statsSheet.getRange(1, 1, 1, 3).setValues([['fecha', 'conceptos_estudiados', 'conceptos_ids']]);
  }
  
  return true;
}
