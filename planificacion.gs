// planificacion.gs - Funciones del backend para planificación

// Obtener bloques especiales (geografía y callejero)
function getBloquesEspeciales() {
  const bloquesSheet = getGoogleSheet('Bloques');
  const bloquesColumns = getColumnIndices('Bloques');
  const data = bloquesSheet.getDataRange().getValues();
  
  const especiales = {
    geografia: null,
    callejero: null
  };
  
  for (let i = 1; i < data.length; i++) {
    const nombre = data[i][bloquesColumns['nombre']].toLowerCase();
    const id = data[i][bloquesColumns['id_bloque']];
    
    if (nombre === 'geografía' || nombre === 'geografia') {
      especiales.geografia = id;
    } else if (nombre === 'callejero') {
      especiales.callejero = id;
    }
  }
  
  return especiales;
}

// Verificar si una planificación existe para hoy
function getPlanificacionHoy() {
  const planSheet = getGoogleSheet('Planificacion_Diaria');
  const planColumns = getColumnIndices('Planificacion_Diaria');
  const data = planSheet.getDataRange().getValues();
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  for (let i = 1; i < data.length; i++) {
    const fecha = new Date(data[i][planColumns['fecha']]);
    fecha.setHours(0, 0, 0, 0);
    
    if (fecha.getTime() === hoy.getTime() && data[i][planColumns['estado']] === 'activa') {
      return {
        id: data[i][planColumns['id_planificacion']],
        idOposicion: data[i][planColumns['id_oposicion']],
        tiempoPrevisto: data[i][planColumns['tiempo_previsto_minutos']],
        tiempoReal: data[i][planColumns['tiempo_real_minutos']],
        estado: data[i][planColumns['estado']]
      };
    }
  }
  
  return null;
}

// Obtener temas activos de una planificación
function getTemasActivosPlanificacion(idPlanificacion) {
  const temasSheet = getGoogleSheet('Planificacion_Temas');
  const temasColumns = getColumnIndices('Planificacion_Temas');
  const data = temasSheet.getDataRange().getValues();
  
  const temasActivos = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][temasColumns['id_planificacion']] === idPlanificacion && 
        data[i][temasColumns['estado']] === 'activo') {
      temasActivos.push({
        id: data[i][temasColumns['id_planificacion_tema']],
        idTemaPadre: data[i][temasColumns['id_tema_padre']],
        idTemaActual: data[i][temasColumns['id_tema_actual']],
        numeroSlot: data[i][temasColumns['numero_slot']],
        idBloque: data[i][temasColumns['id_bloque']],
        tiempoEstimado: data[i][temasColumns['tiempo_estimado_minutos']]
      });
    }
  }
  
  return temasActivos;
}

// Obtener temas y bloques para planificación
function getTemasYBloquesPlanificacion(idOposicion) {
  try {
    // Obtener temas vinculados
    const temas = getTemasVinculadosEnArbol(idOposicion);
    
    // Obtener todos los bloques
    const bloquesSheet = getGoogleSheet('Bloques');
    const bloquesColumns = getColumnIndices('Bloques');
    const bloquesData = bloquesSheet.getDataRange().getValues();
    
    const bloques = [];
    for (let i = 1; i < bloquesData.length; i++) {
      bloques.push({
        id: bloquesData[i][bloquesColumns['id_bloque']],
        nombre: bloquesData[i][bloquesColumns['nombre']]
      });
    }
    
    return {
      temas: temas,
      bloques: bloques
    };
  } catch (error) {
    console.error('Error al obtener temas y bloques:', error);
    throw error;
  }
}

// Obtener información de un tema por ID
function getTemaById(idTema) {
  const temasSheet = getGoogleSheet('Temas');
  const temasColumns = getColumnIndices('Temas');
  const data = temasSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][temasColumns['id_tema']] == idTema) {
      return {
        id: data[i][temasColumns['id_tema']],
        nombre: data[i][temasColumns['nombre']],
        prenombre: data[i][temasColumns['prenombre']],
        pag_desde: data[i][temasColumns['pag_desde']],
        pag_hasta: data[i][temasColumns['pag_hasta']],
        id_bloque: data[i][temasColumns['id_bloque']]
      };
    }
  }
  
  throw new Error('Tema no encontrado');
}

// Crear planificación completa
function crearPlanificacionCompleta(datos) {
  try {
    const db = getDatabase();
    db.startTransaction();
    
    try {
      // 1. Crear registro en Planificacion_Diaria
      const planSheet = getGoogleSheet('Planificacion_Diaria');
      const planColumns = getColumnIndices('Planificacion_Diaria');
      
      const idPlanificacion = generateUniqueId(planSheet, planColumns['id_planificacion'] + 1);
      
      const nuevaPlanificacion = [];
      nuevaPlanificacion[planColumns['id_planificacion']] = idPlanificacion;
      nuevaPlanificacion[planColumns['id_oposicion']] = datos.idOposicion;
      nuevaPlanificacion[planColumns['fecha']] = new Date();
      nuevaPlanificacion[planColumns['tiempo_previsto_minutos']] = datos.minutosPrevistos;
      nuevaPlanificacion[planColumns['tiempo_real_minutos']] = 0;
      nuevaPlanificacion[planColumns['estado']] = 'activa';
      nuevaPlanificacion[planColumns['fecha_creacion']] = new Date();
      
      planSheet.appendRow(nuevaPlanificacion);
      
      // 2. Crear registros en Planificacion_Temas
      const temasSheet = getGoogleSheet('Planificacion_Temas');
      const temasColumns = getColumnIndices('Planificacion_Temas');
      
      datos.temas.forEach((tema, index) => {
        const primerHijo = obtenerPrimerTemaHijo(tema.id);
        const tiempoEstimado = tema.paginas * 30;
        
        const nuevoTemaPlan = [];
        nuevoTemaPlan[temasColumns['id_planificacion_tema']] = generateUniqueId(temasSheet, temasColumns['id_planificacion_tema'] + 1);
        nuevoTemaPlan[temasColumns['id_planificacion']] = idPlanificacion;
        nuevoTemaPlan[temasColumns['id_tema_padre']] = tema.id;
        nuevoTemaPlan[temasColumns['id_tema_actual']] = primerHijo ? primerHijo.id : tema.id;
        nuevoTemaPlan[temasColumns['numero_slot']] = index + 1;
        nuevoTemaPlan[temasColumns['id_bloque']] = tema.idBloque;
        nuevoTemaPlan[temasColumns['fecha_inicio']] = new Date();
        nuevoTemaPlan[temasColumns['fecha_completado']] = '';
        nuevoTemaPlan[temasColumns['estado']] = 'activo';
        nuevoTemaPlan[temasColumns['tiempo_estimado_minutos']] = tiempoEstimado;
        nuevoTemaPlan[temasColumns['tiempo_real_minutos']] = 0;
        
        temasSheet.appendRow(nuevoTemaPlan);
        
        // 3. Crear registro en Progreso_Temas para el tema actual
        crearProgresoTema(idPlanificacion, primerHijo ? primerHijo.id : tema.id);
      });
      
      db.commitTransaction();
      
      return {
        success: true,
        idPlanificacion: idPlanificacion,
        mensaje: 'Planificación creada correctamente'
      };
      
    } catch (error) {
      db.rollbackTransaction();
      throw error;
    }
    
  } catch (error) {
    console.error('Error al crear planificación:', error);
    throw error;
  }
}

// Obtener primer tema hijo
function obtenerPrimerTemaHijo(idTemaPadre) {
  const temasSheet = getGoogleSheet('Temas');
  const temasColumns = getColumnIndices('Temas');
  const data = temasSheet.getDataRange().getValues();
  
  // Buscar hijos directos
  const hijos = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][temasColumns['id_padre']] == idTemaPadre) {
      hijos.push({
        id: data[i][temasColumns['id_tema']],
        prenombre: data[i][temasColumns['prenombre']] || '',
        nombre: data[i][temasColumns['nombre']],
        orden: data[i][temasColumns['prenombre']] || data[i][temasColumns['nombre']]
      });
    }
  }
  
  if (hijos.length === 0) {
    return null; // El tema padre no tiene hijos
  }
  
  // Ordenar por prenombre
  hijos.sort((a, b) => {
    // Intentar ordenar numéricamente si es posible
    const numA = parseFloat(a.orden.replace(/[^\d.]/g, ''));
    const numB = parseFloat(b.orden.replace(/[^\d.]/g, ''));
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    
    return a.orden.localeCompare(b.orden);
  });
  
  return hijos[0];
}

// Crear registro de progreso para un tema
function crearProgresoTema(idPlanificacion, idTema) {
  const progresoSheet = getGoogleSheet('Progreso_Temas');
  const progresoColumns = getColumnIndices('Progreso_Temas');
  
  const tema = getTemaById(idTema);
  const paginas = (tema.pag_hasta - tema.pag_desde + 1) || 0;
  
  const nuevoProgreso = [];
  nuevoProgreso[progresoColumns['id_progreso']] = generateUniqueId(progresoSheet, progresoColumns['id_progreso'] + 1);
  nuevoProgreso[progresoColumns['id_tema']] = idTema;
  nuevoProgreso[progresoColumns['id_planificacion']] = idPlanificacion;
  nuevoProgreso[progresoColumns['fecha_inicio']] = new Date();
  nuevoProgreso[progresoColumns['fecha_completado']] = '';
  nuevoProgreso[progresoColumns['estado']] = 'en_progreso';
  nuevoProgreso[progresoColumns['paginas_completadas']] = 0;
  nuevoProgreso[progresoColumns['tiempo_dedicado_minutos']] = 0;
  
  progresoSheet.appendRow(nuevoProgreso);
}

// Obtener datos del calendario para un mes específico
function getDatosCalendarioPlanificacion(año, mes) {
  try {
    const inicioMes = new Date(año, mes, 1);
    const finMes = new Date(año, mes + 1, 0);
    
    // Obtener planificaciones del mes
    const planSheet = getGoogleSheet('Planificacion_Diaria');
    const planColumns = getColumnIndices('Planificacion_Diaria');
    const planData = planSheet.getDataRange().getValues();
    
    const planificaciones = [];
    
    for (let i = 1; i < planData.length; i++) {
      const fecha = new Date(planData[i][planColumns['fecha']]);
      
      if (fecha >= inicioMes && fecha <= finMes) {
        // Contar temas activos
        const temasActivos = getTemasActivosPlanificacion(planData[i][planColumns['id_planificacion']]);
        
        planificaciones.push({
          fecha: fecha,
          tiempoPrevisto: planData[i][planColumns['tiempo_previsto_minutos']],
          tiempoReal: planData[i][planColumns['tiempo_real_minutos']],
          temasActivos: temasActivos.length,
          estado: planData[i][planColumns['estado']]
        });
      }
    }
    
    // Obtener repasos del mes
    const repasosSheet = getGoogleSheet('Repasos_Programados');
    const repasosColumns = getColumnIndices('Repasos_Programados');
    const repasosData = repasosSheet.getDataRange().getValues();
    
    const repasos = [];
    
    for (let i = 1; i < repasosData.length; i++) {
      const fecha = new Date(repasosData[i][repasosColumns['fecha_programada']]);
      
      if (fecha >= inicioMes && fecha <= finMes && repasosData[i][repasosColumns['estado']] === 'pendiente') {
        repasos.push({
          fechaProgramada: fecha,
          numeroRepaso: repasosData[i][repasosColumns['numero_repaso']],
          idTema: repasosData[i][repasosColumns['id_tema']]
        });
      }
    }
    
    return {
      planificaciones: planificaciones,
      repasos: repasos
    };
    
  } catch (error) {
    console.error('Error al obtener datos del calendario:', error);
    throw error;
  }
}

// Obtener detalle del día
function getDetalleDiaPlanificacion(fecha) {
  try {
    // Normalizar fecha
    fecha = new Date(fecha);
    fecha.setHours(0, 0, 0, 0);
    
    // Buscar planificación del día
    const planSheet = getGoogleSheet('Planificacion_Diaria');
    const planColumns = getColumnIndices('Planificacion_Diaria');
    const planData = planSheet.getDataRange().getValues();
    
    let planificacion = null;
    
    for (let i = 1; i < planData.length; i++) {
      const fechaPlan = new Date(planData[i][planColumns['fecha']]);
      fechaPlan.setHours(0, 0, 0, 0);
      
      if (fechaPlan.getTime() === fecha.getTime()) {
        planificacion = {
          id: planData[i][planColumns['id_planificacion']],
          tiempoPrevisto: planData[i][planColumns['tiempo_previsto_minutos']],
          tiempoReal: planData[i][planColumns['tiempo_real_minutos']],
          estado: planData[i][planColumns['estado']]
        };
        break;
      }
    }
    
    if (!planificacion) {
      return { planificacion: null, temasActivos: [], repasos: [] };
    }
    
    // Obtener temas activos con su progreso
    const temasActivos = [];
    const planTemasSheet = getGoogleSheet('Planificacion_Temas');
    const planTemasColumns = getColumnIndices('Planificacion_Temas');
    const planTemasData = planTemasSheet.getDataRange().getValues();
    
    const progresoSheet = getGoogleSheet('Progreso_Temas');
    const progresoColumns = getColumnIndices('Progreso_Temas');
    const progresoData = progresoSheet.getDataRange().getValues();
    
    for (let i = 1; i < planTemasData.length; i++) {
      if (planTemasData[i][planTemasColumns['id_planificacion']] === planificacion.id) {
        const idTemaActual = planTemasData[i][planTemasColumns['id_tema_actual']];
        const tema = getTemaById(idTemaActual);
        
        // Buscar progreso
        let progreso = null;
        for (let j = 1; j < progresoData.length; j++) {
          if (progresoData[j][progresoColumns['id_tema']] === idTemaActual && 
              progresoData[j][progresoColumns['id_planificacion']] === planificacion.id) {
            progreso = {
              id: progresoData[j][progresoColumns['id_progreso']],
              estado: progresoData[j][progresoColumns['estado']],
              paginasCompletadas: progresoData[j][progresoColumns['paginas_completadas']] || 0
            };
            break;
          }
        }
        
        // Obtener nombre del bloque
        const bloque = getBloquePorId(planTemasData[i][planTemasColumns['id_bloque']]);
        
        temasActivos.push({
          idProgreso: progreso ? progreso.id : null,
          idTema: idTemaActual,
          nombreCompleto: (tema.prenombre ? tema.prenombre + ' ' : '') + tema.nombre,
          nombreBloque: bloque ? bloque.nombre : 'Sin bloque',
          paginasTotales: (tema.pag_hasta - tema.pag_desde + 1) || 0,
          paginasCompletadas: progreso ? progreso.paginasCompletadas : 0,
          estado: progreso ? progreso.estado : 'pendiente',
          numeroSlot: planTemasData[i][planTemasColumns['numero_slot']]
        });
      }
    }
    
    // Obtener repasos del día
    const repasosSheet = getGoogleSheet('Repasos_Programados');
    const repasosColumns = getColumnIndices('Repasos_Programados');
    const repasosData = repasosSheet.getDataRange().getValues();
    
    const repasos = [];
    
    for (let i = 1; i < repasosData.length; i++) {
      const fechaRepaso = new Date(repasosData[i][repasosColumns['fecha_programada']]);
      fechaRepaso.setHours(0, 0, 0, 0);
      
      if (fechaRepaso.getTime() === fecha.getTime() && 
          repasosData[i][repasosColumns['estado']] === 'pendiente') {
        const tema = getTemaById(repasosData[i][repasosColumns['id_tema']]);
        
        repasos.push({
          id: repasosData[i][repasosColumns['id_repaso']],
          idTema: repasosData[i][repasosColumns['id_tema']],
          numeroRepaso: repasosData[i][repasosColumns['numero_repaso']],
          nombreTema: (tema.prenombre ? tema.prenombre + ' ' : '') + tema.nombre
        });
      }
    }
    
    return {
      planificacion: planificacion,
      temasActivos: temasActivos.sort((a, b) => a.numeroSlot - b.numeroSlot),
      repasos: repasos
    };
    
  } catch (error) {
    console.error('Error al obtener detalle del día:', error);
    throw error;
  }
}

// Actualizar tiempo real de planificación
function actualizarTiempoRealPlanificacion(idPlanificacion, minutosReales) {
  try {
    const planSheet = getGoogleSheet('Planificacion_Diaria');
    const planColumns = getColumnIndices('Planificacion_Diaria');
    const data = planSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][planColumns['id_planificacion']] === idPlanificacion) {
        planSheet.getRange(i + 1, planColumns['tiempo_real_minutos'] + 1).setValue(minutosReales);
        return { success: true };
      }
    }
    
    throw new Error('Planificación no encontrada');
    
  } catch (error) {
    console.error('Error al actualizar tiempo real:', error);
    throw error;
  }
}

// Completar tema y generar repasos
function completarTemaYGenerarRepasos(idProgreso, idTema) {
  try {
    const db = getDatabase();
    db.startTransaction();
    
    try {
      // 1. Marcar progreso como completado
      const progresoSheet = getGoogleSheet('Progreso_Temas');
      const progresoColumns = getColumnIndices('Progreso_Temas');
      const progresoData = progresoSheet.getDataRange().getValues();
      
      let filaProgreso = -1;
      let idPlanificacion = null;
      
      for (let i = 1; i < progresoData.length; i++) {
        if (progresoData[i][progresoColumns['id_progreso']] === idProgreso) {
          filaProgreso = i + 1;
          idPlanificacion = progresoData[i][progresoColumns['id_planificacion']];
          
          // Actualizar estado y fecha
          progresoSheet.getRange(filaProgreso, progresoColumns['fecha_completado'] + 1).setValue(new Date());
          progresoSheet.getRange(filaProgreso, progresoColumns['estado'] + 1).setValue('completado');
          
          // Actualizar páginas completadas
          const tema = getTemaById(idTema);
          const paginasTotales = (tema.pag_hasta - tema.pag_desde + 1) || 0;
          progresoSheet.getRange(filaProgreso, progresoColumns['paginas_completadas'] + 1).setValue(paginasTotales);
          
          break;
        }
      }
      
      if (filaProgreso === -1) {
        throw new Error('Progreso no encontrado');
      }
      
      // 2. Crear repasos programados
      const repasosSheet = getGoogleSheet('Repasos_Programados');
      const repasosColumns = getColumnIndices('Repasos_Programados');
      
      const fechaCompletado = new Date();
      const intervalosRepasos = [1, 3, 7, 15, 30]; // días
      
      intervalosRepasos.forEach((dias, index) => {
        const fechaRepaso = new Date(fechaCompletado);
        fechaRepaso.setDate(fechaRepaso.getDate() + dias);
        
        const nuevoRepaso = [];
        nuevoRepaso[repasosColumns['id_repaso']] = generateUniqueId(repasosSheet, repasosColumns['id_repaso'] + 1);
        nuevoRepaso[repasosColumns['id_tema']] = idTema;
        nuevoRepaso[repasosColumns['numero_repaso']] = index + 1;
        nuevoRepaso[repasosColumns['fecha_programada']] = fechaRepaso;
        nuevoRepaso[repasosColumns['fecha_completado']] = '';
        nuevoRepaso[repasosColumns['estado']] = 'pendiente';
        nuevoRepaso[repasosColumns['id_test']] = '';
        nuevoRepaso[repasosColumns['id_evento_calendar']] = '';
        nuevoRepaso[repasosColumns['nota_test']] = '';
        nuevoRepaso[repasosColumns['tiempo_test_minutos']] = '';
        
        repasosSheet.appendRow(nuevoRepaso);
        
        // TODO: Crear evento en Google Calendar
      });
      
      // 3. Avanzar al siguiente tema hijo
      avanzarAlSiguienteTema(idPlanificacion, idTema);
      
      db.commitTransaction();
      
      return {
        success: true,
        repasosCreados: intervalosRepasos.length
      };
      
    } catch (error) {
      db.rollbackTransaction();
      throw error;
    }
    
  } catch (error) {
    console.error('Error al completar tema:', error);
    throw error;
  }
}

// Avanzar al siguiente tema hijo
function avanzarAlSiguienteTema(idPlanificacion, idTemaActual) {
  try {
    // Buscar el tema actual y su padre
    const tema = getTemaById(idTemaActual);
    const idPadre = tema.id_padre;
    
    if (!idPadre) {
      // Es un tema padre sin hijos, no hay siguiente
      return;
    }
    
    // Buscar siguiente hijo del mismo padre
    const siguienteHijo = obtenerSiguienteTemaHijo(idPadre, idTemaActual);
    
    if (siguienteHijo) {
      // Actualizar tema actual en Planificacion_Temas
      const planTemasSheet = getGoogleSheet('Planificacion_Temas');
      const planTemasColumns = getColumnIndices('Planificacion_Temas');
      const planTemasData = planTemasSheet.getDataRange().getValues();
      
      for (let i = 1; i < planTemasData.length; i++) {
        if (planTemasData[i][planTemasColumns['id_planificacion']] === idPlanificacion &&
            planTemasData[i][planTemasColumns['id_tema_padre']] === idPadre) {
          
          // Actualizar tema actual
          planTemasSheet.getRange(i + 1, planTemasColumns['id_tema_actual'] + 1).setValue(siguienteHijo.id);
          
          // Crear nuevo progreso para el siguiente tema
          crearProgresoTema(idPlanificacion, siguienteHijo.id);
          
          break;
        }
      }
    } else {
      // No hay más hijos, marcar slot como completado
      const planTemasSheet = getGoogleSheet('Planificacion_Temas');
      const planTemasColumns = getColumnIndices('Planificacion_Temas');
      const planTemasData = planTemasSheet.getDataRange().getValues();
      
      for (let i = 1; i < planTemasData.length; i++) {
        if (planTemasData[i][planTemasColumns['id_planificacion']] === idPlanificacion &&
            planTemasData[i][planTemasColumns['id_tema_padre']] === idPadre) {
          
          planTemasSheet.getRange(i + 1, planTemasColumns['estado'] + 1).setValue('completado');
          planTemasSheet.getRange(i + 1, planTemasColumns['fecha_completado'] + 1).setValue(new Date());
          
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('Error al avanzar al siguiente tema:', error);
    // No lanzar error, solo loggear
  }
}

// Obtener siguiente tema hijo
function obtenerSiguienteTemaHijo(idPadre, idActual) {
  const temasSheet = getGoogleSheet('Temas');
  const temasColumns = getColumnIndices('Temas');
  const data = temasSheet.getDataRange().getValues();
  
  // Obtener todos los hijos del padre
  const hijos = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][temasColumns['id_padre']] == idPadre) {
      hijos.push({
        id: data[i][temasColumns['id_tema']],
        prenombre: data[i][temasColumns['prenombre']] || '',
        nombre: data[i][temasColumns['nombre']],
        orden: data[i][temasColumns['prenombre']] || data[i][temasColumns['nombre']]
      });
    }
  }
  
  // Ordenar por prenombre
  hijos.sort((a, b) => {
    const numA = parseFloat(a.orden.replace(/[^\d.]/g, ''));
    const numB = parseFloat(b.orden.replace(/[^\d.]/g, ''));
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    
    return a.orden.localeCompare(b.orden);
  });
  
  // Encontrar el siguiente
  const indexActual = hijos.findIndex(h => h.id == idActual);
  if (indexActual >= 0 && indexActual < hijos.length - 1) {
    return hijos[indexActual + 1];
  }
  
  return null;
}

// Obtener bloque por ID
function getBloquePorId(idBloque) {
  const bloquesSheet = getGoogleSheet('Bloques');
  const bloquesColumns = getColumnIndices('Bloques');
  const data = bloquesSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][bloquesColumns['id_bloque']] == idBloque) {
      return {
        id: data[i][bloquesColumns['id_bloque']],
        nombre: data[i][bloquesColumns['nombre']]
      };
    }
  }
  
  return null;
}

// Obtener estadísticas del mes
function getEstadisticasMesPlanificacion(año, mes) {
  try {
    const inicioMes = new Date(año, mes, 1);
    const finMes = new Date(año, mes + 1, 0);
    
    let diasEstudiados = 0;
    let minutosEstudiados = 0;
    let temasCompletados = 0;
    let repasosPendientes = 0;
    
    // Contar días estudiados y tiempo
    const planSheet = getGoogleSheet('Planificacion_Diaria');
    const planColumns = getColumnIndices('Planificacion_Diaria');
    const planData = planSheet.getDataRange().getValues();
    
    for (let i = 1; i < planData.length; i++) {
      const fecha = new Date(planData[i][planColumns['fecha']]);
      
      if (fecha >= inicioMes && fecha <= finMes) {
        if (planData[i][planColumns['tiempo_real_minutos']] > 0) {
          diasEstudiados++;
          minutosEstudiados += planData[i][planColumns['tiempo_real_minutos']];
        }
      }
    }
    
    // Contar temas completados
    const progresoSheet = getGoogleSheet('Progreso_Temas');
    const progresoColumns = getColumnIndices('Progreso_Temas');
    const progresoData = progresoSheet.getDataRange().getValues();
    
    for (let i = 1; i < progresoData.length; i++) {
      if (progresoData[i][progresoColumns['estado']] === 'completado') {
        const fechaCompletado = new Date(progresoData[i][progresoColumns['fecha_completado']]);
        if (fechaCompletado >= inicioMes && fechaCompletado <= finMes) {
          temasCompletados++;
        }
      }
    }
    
    // Contar repasos pendientes
    const repasosSheet = getGoogleSheet('Repasos_Programados');
    const repasosColumns = getColumnIndices('Repasos_Programados');
    const repasosData = repasosSheet.getDataRange().getValues();
    
    for (let i = 1; i < repasosData.length; i++) {
      const fechaProgramada = new Date(repasosData[i][repasosColumns['fecha_programada']]);
      
      if (fechaProgramada >= inicioMes && fechaProgramada <= finMes && 
          repasosData[i][repasosColumns['estado']] === 'pendiente') {
        repasosPendientes++;
      }
    }
    
    return {
      diasEstudiados: diasEstudiados,
      minutosEstudiados: minutosEstudiados,
      temasCompletados: temasCompletados,
      repasosPendientes: repasosPendientes
    };
    
  } catch (error) {
    console.error('Error al obtener estadísticas del mes:', error);
    throw error;
  }
}

// Generar test de repaso
function generarTestRepaso(idRepaso, idTema) {
  try {
    // Obtener información del tema
    const tema = getTemaById(idTema);
    
    // Obtener todas las preguntas del tema y sus subtemas
    const preguntasSheet = getGoogleSheet('Test_Preguntas');
    const preguntasColumns = getColumnIndices('Test_Preguntas');
    const preguntasData = preguntasSheet.getDataRange().getValues();
    
    // Obtener todos los IDs de temas (incluir subtemas)
    const todosLosTemas = obtenerTemasConHijos([idTema]);
    
    // Filtrar preguntas del tema
    let preguntasFiltradas = [];
    
    for (let i = 1; i < preguntasData.length; i++) {
      const row = preguntasData[i];
      const idTemaPregunta = row[preguntasColumns['id_tema']];
      const activa = row[preguntasColumns['activa']];
      const vecesFallada = row[preguntasColumns['veces_fallada']] || 0;
      const vecesMostrada = row[preguntasColumns['veces_mostrada']] || 0;
      
      // Verificar si la pregunta pertenece al tema o sus subtemas
      if (todosLosTemas.includes(idTemaPregunta) && activa !== false) {
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
          vecesFallada: vecesFallada,
          vecesMostrada: vecesMostrada,
          // Calcular prioridad (más falladas primero)
          prioridad: vecesMostrada > 0 ? (vecesFallada / vecesMostrada) : 0
        });
      }
    }
    
    if (preguntasFiltradas.length === 0) {
      throw new Error('No hay preguntas disponibles para este tema');
    }
    
    // Ordenar por prioridad (más falladas primero) y luego aleatorizar
    preguntasFiltradas.sort((a, b) => b.prioridad - a.prioridad);
    
    // Tomar máximo 50 preguntas, priorizando las más falladas
    const numPreguntas = Math.min(50, preguntasFiltradas.length);
    let preguntasSeleccionadas = [];
    
    // Tomar las más falladas primero (hasta 30)
    const masFalladas = preguntasFiltradas.filter(p => p.vecesFallada > 0).slice(0, 30);
    preguntasSeleccionadas = [...masFalladas];
    
    // Completar con otras preguntas si es necesario
    if (preguntasSeleccionadas.length < numPreguntas) {
      const otrasPreguntasDisponibles = preguntasFiltradas.filter(
        p => !preguntasSeleccionadas.some(ps => ps.id === p.id)
      );
      
      const preguntasAdicionales = shuffleArray(otrasPreguntasDisponibles)
        .slice(0, numPreguntas - preguntasSeleccionadas.length);
      
      preguntasSeleccionadas = [...preguntasSeleccionadas, ...preguntasAdicionales];
    }
    
    // Mezclar el orden final
    preguntasSeleccionadas = shuffleArray(preguntasSeleccionadas);
    
    // Crear registro en historial
    const historialSheet = getGoogleSheet('Test_Historial');
    const historialColumns = getColumnIndices('Test_Historial');
    
    const idHistorial = generateUniqueId(historialSheet, historialColumns['id_historial'] + 1);
    
    const nuevoHistorial = [];
    nuevoHistorial[historialColumns['id_historial']] = idHistorial;
    nuevoHistorial[historialColumns['id_oposicion']] = 0; // No específico de oposición
    nuevoHistorial[historialColumns['temas_ids']] = idTema.toString();
    nuevoHistorial[historialColumns['fecha']] = new Date();
    nuevoHistorial[historialColumns['modo']] = 'repaso';
    nuevoHistorial[historialColumns['total_preguntas']] = preguntasSeleccionadas.length;
    nuevoHistorial[historialColumns['correctas']] = 0;
    nuevoHistorial[historialColumns['incorrectas']] = 0;
    nuevoHistorial[historialColumns['porcentaje']] = 0;
    nuevoHistorial[historialColumns['tiempo_segundos']] = 0;
    
    historialSheet.appendRow(nuevoHistorial);
    
    // Actualizar el repaso con el ID del test
    const repasosSheet = getGoogleSheet('Repasos_Programados');
    const repasosColumns = getColumnIndices('Repasos_Programados');
    const repasosData = repasosSheet.getDataRange().getValues();
    
    for (let i = 1; i < repasosData.length; i++) {
      if (repasosData[i][repasosColumns['id_repaso']] === idRepaso) {
        repasosSheet.getRange(i + 1, repasosColumns['id_test'] + 1).setValue(idHistorial);
        break;
      }
    }
    
    return {
      success: true,
      idTest: idHistorial,
      idHistorial: idHistorial,
      preguntas: preguntasSeleccionadas,
      nombreTema: (tema.prenombre ? tema.prenombre + ' ' : '') + tema.nombre,
      numeroPreguntas: preguntasSeleccionadas.length
    };
    
  } catch (error) {
    console.error('Error al generar test de repaso:', error);
    throw error;
  }
}

// Marcar repaso como completado
function marcarRepasoCompletado(idRepaso, nota, tiempoSegundos) {
  try {
    const repasosSheet = getGoogleSheet('Repasos_Programados');
    const repasosColumns = getColumnIndices('Repasos_Programados');
    const data = repasosSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][repasosColumns['id_repaso']] === idRepaso) {
        repasosSheet.getRange(i + 1, repasosColumns['fecha_completado'] + 1).setValue(new Date());
        repasosSheet.getRange(i + 1, repasosColumns['estado'] + 1).setValue('completado');
        repasosSheet.getRange(i + 1, repasosColumns['nota_test'] + 1).setValue(nota);
        repasosSheet.getRange(i + 1, repasosColumns['tiempo_test_minutos'] + 1).setValue(Math.round(tiempoSegundos / 60));
        
        return { success: true };
      }
    }
    
    throw new Error('Repaso no encontrado');
    
  } catch (error) {
    console.error('Error al marcar repaso como completado:', error);
    throw error;
  }
}

// Obtener repasos completos con estadísticas
function getRepasosCompletos() {
  try {
    const repasosSheet = getGoogleSheet('Repasos_Programados');
    const repasosColumns = getColumnIndices('Repasos_Programados');
    const repasosData = repasosSheet.getDataRange().getValues();
    
    const repasos = [];
    let estadisticas = {
      total: 0,
      pendientes: 0,
      completados: 0,
      vencidos: 0
    };
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    for (let i = 1; i < repasosData.length; i++) {
      const row = repasosData[i];
      const tema = getTemaById(row[repasosColumns['id_tema']]);
      const bloque = tema.id_bloque ? getBloquePorId(tema.id_bloque) : null;
      
      const fechaProgramada = new Date(row[repasosColumns['fecha_programada']]);
      fechaProgramada.setHours(0, 0, 0, 0);
      
      const repaso = {
        id: row[repasosColumns['id_repaso']],
        idTema: row[repasosColumns['id_tema']],
        nombreTema: (tema.prenombre ? tema.prenombre + ' ' : '') + tema.nombre,
        nombreBloque: bloque ? bloque.nombre : null,
        numeroRepaso: row[repasosColumns['numero_repaso']],
        fechaProgramada: row[repasosColumns['fecha_programada']],
        fechaCompletado: row[repasosColumns['fecha_completado']],
        estado: row[repasosColumns['estado']],
        idTest: row[repasosColumns['id_test']],
        notaTest: row[repasosColumns['nota_test']],
        tiempoTestMinutos: row[repasosColumns['tiempo_test_minutos']]
      };
      
      repasos.push(repaso);
      
      // Actualizar estadísticas
      estadisticas.total++;
      
      switch (repaso.estado) {
        case 'pendiente':
          estadisticas.pendientes++;
          if (fechaProgramada < hoy) {
            estadisticas.vencidos++;
          }
          break;
        case 'completado':
          estadisticas.completados++;
          break;
      }
    }
    
    // Obtener próximos 7 días
    const proximos = repasos
      .filter(r => {
        if (r.estado !== 'pendiente') return false;
        const fecha = new Date(r.fechaProgramada);
        const diasRestantes = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
        return diasRestantes >= 0 && diasRestantes <= 7;
      })
      .sort((a, b) => new Date(a.fechaProgramada) - new Date(b.fechaProgramada))
      .slice(0, 10);
    
    return {
      repasos: repasos.sort((a, b) => new Date(b.fechaProgramada) - new Date(a.fechaProgramada)),
      estadisticas: estadisticas,
      proximos: proximos
    };
    
  } catch (error) {
    console.error('Error al obtener repasos:', error);
    throw error;
  }
}

// Marcar repaso como omitido
function marcarRepasoOmitido(idRepaso) {
  try {
    const repasosSheet = getGoogleSheet('Repasos_Programados');
    const repasosColumns = getColumnIndices('Repasos_Programados');
    const data = repasosSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][repasosColumns['id_repaso']] === idRepaso) {
        repasosSheet.getRange(i + 1, repasosColumns['estado'] + 1).setValue('omitido');
        repasosSheet.getRange(i + 1, repasosColumns['fecha_completado'] + 1).setValue(new Date());
        
        return { success: true };
      }
    }
    
    throw new Error('Repaso no encontrado');
    
  } catch (error) {
    console.error('Error al marcar repaso como omitido:', error);
    throw error;
  }
}
