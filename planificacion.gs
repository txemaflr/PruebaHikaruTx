// planificacion.gs - REESCRITURA LIMPIA
// Siguiendo la estructura de bloques.gs y conceptos.gs

// ====================================
// FUNCIONES BÁSICAS - OPOSICIONES ACTIVAS
// ====================================

function getOposicionesParaPlanificacion() {
  try {
    const oposicionesSheet = getGoogleSheet('Oposiciones');
    const oposicionesColumns = getColumnIndices('Oposiciones');
    const data = oposicionesSheet.getDataRange().getValues();
    data.shift(); // Eliminar encabezados
    
    return data
      .filter(row => (row[oposicionesColumns['estado']] || 'activa') !== 'finalizada')
      .sort((a, b) => a[oposicionesColumns['nombre']].localeCompare(b[oposicionesColumns['nombre']]))
      .map(row => ({
        id: row[oposicionesColumns['id_oposicion']],
        nombre: row[oposicionesColumns['nombre']],
        estado: row[oposicionesColumns['estado']] || 'activa'
      }));
  } catch (error) {
    console.error('Error al obtener oposiciones:', error);
    return [];
  }
}

function getOposicionActiva() {
  try {
    const configSheet = getOrCreateConfigSheet();
    const data = configSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'oposicion_activa' && data[i][1]) {
        const oposicion = getOposicionById(data[i][1]);
        if (oposicion && oposicion.estado !== 'finalizada') {
          return oposicion;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error al obtener oposición activa:', error);
    return null;
  }
}

function setOposicionActiva(idOposicion) {
  try {
    const configSheet = getOrCreateConfigSheet();
    const data = configSheet.getDataRange().getValues();
    
    // Buscar si ya existe
    let filaExistente = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'oposicion_activa') {
        filaExistente = i + 1;
        break;
      }
    }
    
    if (filaExistente > 0) {
      configSheet.getRange(filaExistente, 2).setValue(idOposicion);
    } else {
      configSheet.appendRow(['oposicion_activa', idOposicion, new Date()]);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error al establecer oposición activa:', error);
    throw error;
  }
}

// ====================================
// FUNCIONES DE CONFIGURACIÓN
// ====================================

function getConfiguracionOposicion(idOposicion) {
  try {
    const configSheet = getGoogleSheet('Configuracion_Planificacion');
    const configColumns = getColumnIndices('Configuracion_Planificacion');
    const data = configSheet.getDataRange().getValues();
    
    // Buscar configuración existente
    for (let i = 1; i < data.length; i++) {
      if (data[i][configColumns['id_oposicion']] == idOposicion) {
        return {
          vueltaActual: data[i][configColumns['vuelta_actual']] || 1,
          minPorPagV1: data[i][configColumns['min_por_pagina_v1']] || 30,
          minPorPagV2: data[i][configColumns['min_por_pagina_v2']] || 20,
          minPorPagV3: data[i][configColumns['min_por_pagina_v3']] || 15,
          minPorPagV4: data[i][configColumns['min_por_pagina_v4_mas']] || 10
        };
      }
    }
    
    // Si no existe, crear configuración por defecto
    return crearConfiguracionPorDefecto(idOposicion);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return { vueltaActual: 1, minPorPagV1: 30, minPorPagV2: 20, minPorPagV3: 15, minPorPagV4: 10 };
  }
}

function crearConfiguracionPorDefecto(idOposicion) {
  try {
    const configSheet = getGoogleSheet('Configuracion_Planificacion');
    const configColumns = getColumnIndices('Configuracion_Planificacion');
    
    const idConfig = generateUniqueId(configSheet, configColumns['id_config'] + 1);
    
    const nuevaConfig = [];
    nuevaConfig[configColumns['id_config']] = idConfig;
    nuevaConfig[configColumns['id_oposicion']] = idOposicion;
    nuevaConfig[configColumns['vuelta_actual']] = 1;
    nuevaConfig[configColumns['min_por_pagina_v1']] = 30;
    nuevaConfig[configColumns['min_por_pagina_v2']] = 20;
    nuevaConfig[configColumns['min_por_pagina_v3']] = 15;
    nuevaConfig[configColumns['min_por_pagina_v4_mas']] = 10;
    nuevaConfig[configColumns['fecha_actualizacion']] = new Date();
    
    configSheet.appendRow(nuevaConfig);
    
    return { vueltaActual: 1, minPorPagV1: 30, minPorPagV2: 20, minPorPagV3: 15, minPorPagV4: 10 };
  } catch (error) {
    console.error('Error al crear configuración por defecto:', error);
    return { vueltaActual: 1, minPorPagV1: 30, minPorPagV2: 20, minPorPagV3: 15, minPorPagV4: 10 };
  }
}

// ====================================
// FUNCIONES DE REPASOS
// ====================================

function getRepasosDelDia(fechaMs) {
  try {
    const fecha = new Date(fechaMs);
    fecha.setHours(0, 0, 0, 0);
    
    const repasosSheet = getGoogleSheet('Repasos_Programados');
    const repasosColumns = getColumnIndices('Repasos_Programados');
    const data = repasosSheet.getDataRange().getValues();
    
    const repasos = [];
    
    for (let i = 1; i < data.length; i++) {
      const fechaRepaso = new Date(data[i][repasosColumns['fecha_programada']]);
      fechaRepaso.setHours(0, 0, 0, 0);
      
      if (fechaRepaso.getTime() === fecha.getTime() && 
          data[i][repasosColumns['estado']] === 'pendiente') {
        
        const idTema = data[i][repasosColumns['id_tema']];
        const tema = getTemaBasico(idTema);
        
        repasos.push({
          id: data[i][repasosColumns['id_repaso']],
          numeroRepaso: data[i][repasosColumns['numero_repaso']],
          nombreTema: construirNombreCompleto(tema),
          tiempoEstimado: 30 // Estimación fija por repaso
        });
      }
    }
    
    return repasos;
  } catch (error) {
    console.error('Error al obtener repasos del día:', error);
    return [];
  }
}

// ====================================
// FUNCIONES DE TEMAS Y ÁRBOL
// ====================================

function getTemasVinculadosAOposicion(idOposicion) {
  try {
    const temaOposSheet = getGoogleSheet('Tema_Oposicion');
    const temaOposColumns = getColumnIndices('Tema_Oposicion');
    const temaOposData = temaOposSheet.getDataRange().getValues();
    
    const temasSheet = getGoogleSheet('Temas');
    const temasColumns = getColumnIndices('Temas');
    const temasData = temasSheet.getDataRange().getValues();
    
    // Obtener IDs vinculados
    const idsVinculados = [];
    for (let i = 1; i < temaOposData.length; i++) {
      if (temaOposData[i][temaOposColumns['id_oposicion']] == idOposicion) {
        idsVinculados.push(temaOposData[i][temaOposColumns['id_tema']]);
      }
    }
    
    // Construir array de temas
    const temas = [];
    for (let i = 1; i < temasData.length; i++) {
      const idTema = temasData[i][temasColumns['id_tema']];
      
      if (idsVinculados.includes(idTema)) {
        temas.push({
          id: idTema,
          nombre: temasData[i][temasColumns['nombre']],
          prenombre: temasData[i][temasColumns['prenombre']] || '',
          idPadre: temasData[i][temasColumns['id_padre']],
          idBloque: temasData[i][temasColumns['id_bloque']],
          pagTotales: temasData[i][temasColumns['pag_totales']] || 0
        });
      }
    }
    
    return temas;
  } catch (error) {
    console.error('Error al obtener temas vinculados:', error);
    return [];
  }
}

function getArbolTemasConEstados(idOposicion, tiempoDisponible) {
  try {
    const config = getConfiguracionOposicion(idOposicion);
    const minutosPorPagina = calcularMinutosPorPagina(config);
    
    const temasVinculados = getTemasVinculadosAOposicion(idOposicion);
    const bloquesInfo = getBloquesPorIds(obtenerIdsBloques(temasVinculados));
    const progresosCompletados = getProgresosCompletados(idOposicion);
    
    const arbolCompleto = construirArbolConEstados(temasVinculados, progresosCompletados, minutosPorPagina);
    
    return {
      arbol: arbolCompleto,
      configuracion: config,
      minutosPorPagina: minutosPorPagina,
      bloques: bloquesInfo
    };
  } catch (error) {
    console.error('Error al obtener árbol de temas:', error);
    throw error;
  }
}

// ====================================
// FUNCIONES DE PLANIFICACIÓN CRUD
// ====================================

function addPlanificacion(datosPlanificacion) {
  try {
    // Validar datos
    if (!datosPlanificacion.fecha || !datosPlanificacion.idOposicion || 
        !datosPlanificacion.temasSeleccionados || datosPlanificacion.temasSeleccionados.length === 0) {
      throw new Error('Datos de planificación incompletos');
    }
    
    // Verificar que no existe planificación para esta fecha
    if (verificarPlanificacionExistente(datosPlanificacion.fecha, datosPlanificacion.idOposicion)) {
      throw new Error('Ya existe una planificación para esta fecha en esta oposición');
    }
    
    // Crear registro principal
    const idPlanificacion = crearRegistroPlanificacion(datosPlanificacion);
    
    // Crear registros de progreso para cada tema
    const progresoIds = crearRegistrosProgreso(idPlanificacion, datosPlanificacion.temasSeleccionados);
    
    return {
      success: true,
      idPlanificacion: idPlanificacion,
      temasCreados: progresoIds.length,
      mensaje: 'Planificación creada correctamente'
    };
  } catch (error) {
    console.error('Error al crear planificación:', error);
    throw error;
  }
}

function getPlanificacionesDelMes(año, mes) {
  try {
    const planSheet = getGoogleSheet('Planificacion_Diaria');
    const planColumns = getColumnIndices('Planificacion_Diaria');
    const data = planSheet.getDataRange().getValues();
    
    const planificaciones = [];
    
    for (let i = 1; i < data.length; i++) {
      const fecha = new Date(data[i][planColumns['fecha']]);
      
      if (fecha.getFullYear() === año && fecha.getMonth() === mes) {
        planificaciones.push({
          id: data[i][planColumns['id_planificacion']],
          fecha: fecha,
          estado: data[i][planColumns['estado']] || 'planificado',
          numeroTemas: data[i][planColumns['numero_temas']] || 0,
          tiempoEstudio: data[i][planColumns['tiempo_estudio_minutos']] || 0,
          tiempoPrevisto: data[i][planColumns['tiempo_previsto_minutos']] || 0
        });
      }
    }
    
    return planificaciones;
  } catch (error) {
    console.error('Error al obtener planificaciones del mes:', error);
    return [];
  }
}

function getDetallePlanificacion(idPlanificacion) {
  try {
    const planSheet = getGoogleSheet('Planificacion_Diaria');
    const planColumns = getColumnIndices('Planificacion_Diaria');
    const planData = planSheet.getDataRange().getValues();
    
    // Buscar planificación principal
    let planificacion = null;
    for (let i = 1; i < planData.length; i++) {
      if (planData[i][planColumns['id_planificacion']] == idPlanificacion) {
        planificacion = {
          id: planData[i][planColumns['id_planificacion']],
          fecha: planData[i][planColumns['fecha']],
          idOposicion: planData[i][planColumns['id_oposicion']],
          tiempoPrevisto: planData[i][planColumns['tiempo_previsto_minutos']],
          tiempoEstudio: planData[i][planColumns['tiempo_estudio_minutos']],
          tiempoRepasos: planData[i][planColumns['tiempo_repasos_minutos']],
          numeroTemas: planData[i][planColumns['numero_temas']],
          estado: planData[i][planColumns['estado']]
        };
        break;
      }
    }
    
    if (!planificacion) {
      throw new Error('Planificación no encontrada');
    }
    
    // Obtener temas asociados
    planificacion.temas = getTemasDeProgreso(idPlanificacion);
    
    return planificacion;
  } catch (error) {
    console.error('Error al obtener detalle de planificación:', error);
    throw error;
  }
}

function marcarTemaComoCompletado(idProgreso, tiempoRealDedicado, nota) {
  try {
    const progresoSheet = getGoogleSheet('Progreso_Temas');
    const progresoColumns = getColumnIndices('Progreso_Temas');
    const data = progresoSheet.getDataRange().getValues();
    
    let idTema = null;
    let fila = -1;
    
    // Buscar el progreso
    for (let i = 1; i < data.length; i++) {
      if (data[i][progresoColumns['id_progreso']] == idProgreso) {
        idTema = data[i][progresoColumns['id_tema']];
        fila = i + 1;
        break;
      }
    }
    
    if (fila === -1) {
      throw new Error('Progreso no encontrado');
    }
    
    // Actualizar progreso
    progresoSheet.getRange(fila, progresoColumns['estado'] + 1).setValue('completado');
    progresoSheet.getRange(fila, progresoColumns['fecha_completado'] + 1).setValue(new Date());
    progresoSheet.getRange(fila, progresoColumns['tiempo_dedicado_minutos'] + 1).setValue(tiempoRealDedicado);
    if (nota) {
      progresoSheet.getRange(fila, progresoColumns['nota'] + 1).setValue(nota);
    }
    
    // Programar repasos automáticamente
    const repasosCreados = programarRepasos(idTema, new Date());
    
    return {
      success: true,
      repasosCreados: repasosCreados.length,
      mensaje: 'Tema completado y repasos programados'
    };
  } catch (error) {
    console.error('Error al completar tema:', error);
    throw error;
  }
}

// ====================================
// FUNCIONES AUXILIARES
// ====================================

function getOrCreateConfigSheet() {
  const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
  
  let configSheet = spreadsheet.getSheetByName('Configuracion_Planificacion');
  if (!configSheet) {
    configSheet = spreadsheet.insertSheet('Configuracion_Planificacion');
    configSheet.getRange(1, 1, 1, 3).setValues([['clave', 'valor', 'fecha_actualizacion']]);
  }
  
  return configSheet;
}

function getOposicionById(idOposicion) {
  try {
    const oposicionesSheet = getGoogleSheet('Oposiciones');
    const oposicionesColumns = getColumnIndices('Oposiciones');
    const data = oposicionesSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][oposicionesColumns['id_oposicion']] == idOposicion) {
        return {
          id: data[i][oposicionesColumns['id_oposicion']],
          nombre: data[i][oposicionesColumns['nombre']],
          estado: data[i][oposicionesColumns['estado']] || 'activa'
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error al obtener oposición por ID:', error);
    return null;
  }
}

function getTemaBasico(idTema) {
  try {
    const temasSheet = getGoogleSheet('Temas');
    const temasColumns = getColumnIndices('Temas');
    const data = temasSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][temasColumns['id_tema']] == idTema) {
        return {
          id: data[i][temasColumns['id_tema']],
          nombre: data[i][temasColumns['nombre']],
          prenombre: data[i][temasColumns['prenombre']] || ''
        };
      }
    }
    return { nombre: 'Tema no encontrado', prenombre: '' };
  } catch (error) {
    console.error('Error al obtener tema:', error);
    return { nombre: 'Error', prenombre: '' };
  }
}

function construirNombreCompleto(tema) {
  return (tema.prenombre ? tema.prenombre + ' ' : '') + tema.nombre;
}

function calcularMinutosPorPagina(config) {
  switch (config.vueltaActual) {
    case 1: return config.minPorPagV1;
    case 2: return config.minPorPagV2;
    case 3: return config.minPorPagV3;
    default: return config.minPorPagV4;
  }
}

function obtenerIdsBloques(temas) {
  return [...new Set(temas.map(t => t.idBloque).filter(id => id))];
}

function getBloquesPorIds(idsBloques) {
  try {
    const bloquesSheet = getGoogleSheet('Bloques');
    const bloquesColumns = getColumnIndices('Bloques');
    const bloquesData = bloquesSheet.getDataRange().getValues();
    
    const bloquesMap = {};
    
    for (let i = 1; i < bloquesData.length; i++) {
      const idBloque = bloquesData[i][bloquesColumns['id_bloque']];
      const nombre = bloquesData[i][bloquesColumns['nombre']];
      bloquesMap[idBloque] = nombre;
    }
    
    return bloquesMap;
  } catch (error) {
    console.error('Error al obtener bloques:', error);
    return {};
  }
}

function verificarPlanificacionExistente(fecha, idOposicion) {
  try {
    const planSheet = getGoogleSheet('Planificacion_Diaria');
    const planColumns = getColumnIndices('Planificacion_Diaria');
    const data = planSheet.getDataRange().getValues();
    
    const fechaBuscar = new Date(fecha);
    fechaBuscar.setHours(0, 0, 0, 0);
    
    for (let i = 1; i < data.length; i++) {
      const fechaFila = new Date(data[i][planColumns['fecha']]);
      fechaFila.setHours(0, 0, 0, 0);
      
      if (fechaFila.getTime() === fechaBuscar.getTime() && 
          data[i][planColumns['id_oposicion']] == idOposicion) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error al verificar planificación existente:', error);
    return false;
  }
}

function crearRegistroPlanificacion(datos) {
  try {
    const planSheet = getGoogleSheet('Planificacion_Diaria');
    const planColumns = getColumnIndices('Planificacion_Diaria');
    
    const idPlanificacion = generateUniqueId(planSheet, planColumns['id_planificacion'] + 1);
    
    const nuevoPlan = [];
    nuevoPlan[planColumns['id_planificacion']] = idPlanificacion;
    nuevoPlan[planColumns['fecha']] = new Date(datos.fecha);
    nuevoPlan[planColumns['id_oposicion']] = datos.idOposicion;
    nuevoPlan[planColumns['tiempo_previsto_minutos']] = datos.tiempoPrevisto;
    nuevoPlan[planColumns['tiempo_repasos_minutos']] = datos.tiempoRepasos;
    nuevoPlan[planColumns['tiempo_estudio_minutos']] = datos.tiempoEstudio;
    nuevoPlan[planColumns['numero_temas']] = datos.temasSeleccionados.length;
    nuevoPlan[planColumns['numero_bloques']] = datos.numeroBloques;
    nuevoPlan[planColumns['estado']] = 'planificado';
    nuevoPlan[planColumns['fecha_creacion']] = new Date();
    
    planSheet.appendRow(nuevoPlan);
    
    return idPlanificacion;
  } catch (error) {
    console.error('Error al crear registro principal:', error);
    throw error;
  }
}

function crearRegistrosProgreso(idPlanificacion, temasSeleccionados) {
  try {
    const progresoSheet = getGoogleSheet('Progreso_Temas');
    const progresoColumns = getColumnIndices('Progreso_Temas');
    
    const registrosCreados = [];
    
    temasSeleccionados.forEach(tema => {
      if (tema.tipo !== 'hijo_automatico') {
        const idProgreso = generateUniqueId(progresoSheet, progresoColumns['id_progreso'] + 1);
        
        const nuevoProgreso = [];
        nuevoProgreso[progresoColumns['id_progreso']] = idProgreso;
        nuevoProgreso[progresoColumns['id_planificacion']] = idPlanificacion;
        nuevoProgreso[progresoColumns['id_tema']] = tema.id;
        nuevoProgreso[progresoColumns['tiempo_asignado_minutos']] = tema.tiempo;
        nuevoProgreso[progresoColumns['estado']] = 'planificado';
        nuevoProgreso[progresoColumns['tipo_seleccion']] = tema.tipo;
        nuevoProgreso[progresoColumns['fecha_planificado']] = new Date();
        
        progresoSheet.appendRow(nuevoProgreso);
        registrosCreados.push(idProgreso);
      }
    });
    
    return registrosCreados;
  } catch (error) {
    console.error('Error al crear registros de progreso:', error);
    throw error;
  }
}

function programarRepasos(idTema, fechaCompletado) {
  try {
    const repasosSheet = getGoogleSheet('Repasos_Programados');
    const repasosColumns = getColumnIndices('Repasos_Programados');
    
    const fechaBase = new Date(fechaCompletado);
    const intervalosRepasos = [1, 3, 7, 15, 30]; // días
    const repasosCreados = [];
    
    intervalosRepasos.forEach((dias, index) => {
      const fechaRepaso = new Date(fechaBase);
      fechaRepaso.setDate(fechaBase.getDate() + dias);
      
      const idRepaso = generateUniqueId(repasosSheet, repasosColumns['id_repaso'] + 1);
      
      const nuevoRepaso = [];
      nuevoRepaso[repasosColumns['id_repaso']] = idRepaso;
      nuevoRepaso[repasosColumns['id_tema']] = idTema;
      nuevoRepaso[repasosColumns['numero_repaso']] = index + 1;
      nuevoRepaso[repasosColumns['fecha_programada']] = fechaRepaso;
      nuevoRepaso[repasosColumns['estado']] = 'pendiente';
      nuevoRepaso[repasosColumns['fecha_creacion']] = new Date();
      
      repasosSheet.appendRow(nuevoRepaso);
      repasosCreados.push(idRepaso);
    });
    
    return repasosCreados;
  } catch (error) {
    console.error('Error al programar repasos:', error);
    return [];
  }
}

// Funciones auxiliares para el árbol (simplificadas)
function getProgresosCompletados(idOposicion) {
  try {
    const progresoSheet = getGoogleSheet('Progreso_Temas');
    const progresoColumns = getColumnIndices('Progreso_Temas');
    const progresoData = progresoSheet.getDataRange().getValues();
    
    const progresosMap = {};
    
    for (let i = 1; i < progresoData.length; i++) {
      if (progresoData[i][progresoColumns['estado']] === 'completado') {
        const idTema = progresoData[i][progresoColumns['id_tema']];
        progresosMap[idTema] = {
          fechaCompletado: progresoData[i][progresoColumns['fecha_completado']],
          estado: 'completado'
        };
      }
    }
    
    return progresosMap;
  } catch (error) {
    console.error('Error al obtener progresos:', error);
    return {};
  }
}

function construirArbolConEstados(temas, progresosMap, minutosPorPagina) {
  // Construir nodos recursivamente
  function construirNodo(idTema, nivel = 0) {
    const tema = temas.find(t => t.id === idTema);
    if (!tema) return null;
    
    const hijos = temas
      .filter(t => t.idPadre === idTema)
      .sort((a, b) => {
        const numA = parseFloat((a.prenombre || '0').replace(/[^\d.]/g, ''));
        const numB = parseFloat((b.prenombre || '0').replace(/[^\d.]/g, ''));
        return numA - numB;
      })
      .map(hijo => construirNodo(hijo.id, nivel + 1))
      .filter(nodo => nodo !== null);
    
    const esHoja = hijos.length === 0;
    let estado = progresosMap[idTema] ? 'completado' : 'pendiente';
    
    if (!esHoja) {
      const hijosCompletados = hijos.filter(h => h.estado === 'completado').length;
      if (hijosCompletados === hijos.length && hijos.length > 0) {
        estado = 'completado';
      } else if (hijosCompletados > 0) {
        estado = 'en_progreso';
      }
    }
    
    const paginas = tema.pagTotales || 0;
    const tiempoMinutos = paginas * minutosPorPagina;
    
    return {
      id: idTema,
      nombre: tema.nombre,
      prenombre: tema.prenombre,
      nombreCompleto: construirNombreCompleto(tema),
      paginas: paginas,
      tiempoMinutos: tiempoMinutos,
      tiempoTexto: formatearTiempo(tiempoMinutos),
      esHoja: esHoja,
      estado: estado,
      nivel: nivel,
      hijos: hijos,
      idBloque: tema.idBloque,
      seleccionable: esHoja && estado === 'pendiente'
    };
  }
  
  // Obtener temas padre (sin idPadre)
  const temasPadre = temas
    .filter(t => !t.idPadre)
    .sort((a, b) => {
      const numA = parseFloat((a.prenombre || '0').replace(/[^\d.]/g, ''));
      const numB = parseFloat((b.prenombre || '0').replace(/[^\d.]/g, ''));
      return numA - numB;
    });
  
  return temasPadre.map(tema => construirNodo(tema.id)).filter(nodo => nodo !== null);
}

function formatearTiempo(minutos) {
  if (!minutos || minutos <= 0) return '0m';
  
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  
  if (horas > 0) {
    return horas + 'h ' + mins + 'm';
  } else {
    return mins + 'm';
  }
}

function getTemasDeProgreso(idPlanificacion) {
  try {
    const progresoSheet = getGoogleSheet('Progreso_Temas');
    const progresoColumns = getColumnIndices('Progreso_Temas');
    const progresoData = progresoSheet.getDataRange().getValues();
    
    const temas = [];
    
    for (let i = 1; i < progresoData.length; i++) {
      if (progresoData[i][progresoColumns['id_planificacion']] == idPlanificacion) {
        const idTema = progresoData[i][progresoColumns['id_tema']];
        const tema = getTemaBasico(idTema);
        
        temas.push({
          idProgreso: progresoData[i][progresoColumns['id_progreso']],
          idTema: idTema,
          nombre: tema.nombre,
          prenombre: tema.prenombre,
          nombreCompleto: construirNombreCompleto(tema),
          tiempoAsignado: progresoData[i][progresoColumns['tiempo_asignado_minutos']],
          tiempoDedicado: progresoData[i][progresoColumns['tiempo_dedicado_minutos']] || 0,
          estado: progresoData[i][progresoColumns['estado']],
          tipoSeleccion: progresoData[i][progresoColumns['tipo_seleccion']],
          fechaCompletado: progresoData[i][progresoColumns['fecha_completado']],
          nota: progresoData[i][progresoColumns['nota']] || ''
        });
      }
    }
    
    return temas;
  } catch (error) {
    console.error('Error al obtener temas de progreso:', error);
    return [];
  }
}
