// planificacion.gs - VERSIÓN LIMPIA
// Funciones de planificación completamente nuevas

// TODO: Implementar funciones limpias
// planificacion.gs - FUNCIONES BÁSICAS LIMPIAS

// Obtener oposiciones para el modal
function getOposicionesParaPlanificacion() {
  try {
    const oposicionesSheet = getGoogleSheet('Oposiciones');
    const oposicionesColumns = getColumnIndices('Oposiciones');
    const data = oposicionesSheet.getDataRange().getValues();
    
    const oposiciones = [];
    for (let i = 1; i < data.length; i++) {
      oposiciones.push({
        id: data[i][oposicionesColumns['id_oposicion']],
        nombre: data[i][oposicionesColumns['nombre']]
      });
    }
    
    return oposiciones.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
  } catch (error) {
    console.error('Error al obtener oposiciones:', error);
    return [];
  }
}

// Obtener configuración de planificación para una oposición
function getConfiguracionOposicion(idOposicion) {
  try {
    const configSheet = getGoogleSheet('Configuracion_Planificacion');
    const configColumns = getColumnIndices('Configuracion_Planificacion');
    const data = configSheet.getDataRange().getValues();
    
    // Buscar configuración existente
    for (let i = 1; i < data.length; i++) {
      if (data[i][configColumns['id_oposicion']] == idOposicion) {
        return {
          vueltaActual: data[i][configColumns['vuelta_actual']],
          minPorPagV1: data[i][configColumns['min_por_pagina_v1']],
          minPorPagV2: data[i][configColumns['min_por_pagina_v2']],
          minPorPagV3: data[i][configColumns['min_por_pagina_v3']],
          minPorPagV4: data[i][configColumns['min_por_pagina_v4_mas']]
        };
      }
    }
    
    // Si no existe, crear configuración por defecto
    return crearConfiguracionPorDefecto(idOposicion);
    
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return {
      vueltaActual: 1,
      minPorPagV1: 30,
      minPorPagV2: 20,
      minPorPagV3: 15,
      minPorPagV4: 10
    };
  }
}

// Crear configuración por defecto
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
    
    return {
      vueltaActual: 1,
      minPorPagV1: 30,
      minPorPagV2: 20,
      minPorPagV3: 15,
      minPorPagV4: 10
    };
    
  } catch (error) {
    console.error('Error al crear configuración por defecto:', error);
    return {
      vueltaActual: 1,
      minPorPagV1: 30,
      minPorPagV2: 20,
      minPorPagV3: 15,
      minPorPagV4: 10
    };
  }
}

// Calcular minutos por página según vuelta
function getMinutosPorPagina(config) {
  switch (config.vueltaActual) {
    case 1: return config.minPorPagV1;
    case 2: return config.minPorPagV2;
    case 3: return config.minPorPagV3;
    default: return config.minPorPagV4;
  }
}

// Obtener repasos de un día específico
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
        
        // Obtener nombre del tema
        const idTema = data[i][repasosColumns['id_tema']];
        const tema = getTemaById(idTema);
        
        repasos.push({
          id: data[i][repasosColumns['id_repaso']],
          numeroRepaso: data[i][repasosColumns['numero_repaso']],
          nombreTema: (tema.prenombre ? tema.prenombre + ' ' : '') + tema.nombre
        });
      }
    }
    
    return repasos;
    
  } catch (error) {
    console.error('Error al obtener repasos del día:', error);
    return [];
  }
}

// Función auxiliar para obtener tema por ID (si no existe)
function getTemaById(idTema) {
  try {
    const temasSheet = getGoogleSheet('Temas');
    const temasColumns = getColumnIndices('Temas');
    const data = temasSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][temasColumns['id_tema']] == idTema) {
        return {
          id: data[i][temasColumns['id_tema']],
          nombre: data[i][temasColumns['nombre']],
          prenombre: data[i][temasColumns['prenombre']] || '',
          pag_desde: data[i][temasColumns['pag_desde']],
          pag_hasta: data[i][temasColumns['pag_hasta']],
          pag_totales: data[i][temasColumns['pag_totales']]
        };
      }
    }
    
    return { nombre: 'Tema no encontrado', prenombre: '' };
    
  } catch (error) {
    console.error('Error al obtener tema por ID:', error);
    return { nombre: 'Error', prenombre: '' };
  }
}

// Obtener árbol completo de temas con estados (CORREGIDO CON BLOQUES)
function getArbolTemasConEstados(idOposicion) {
  try {
    console.log('🌳 Obteniendo árbol de temas para oposición:', idOposicion);
    
    // Obtener configuración para calcular tiempos
    const config = getConfiguracionOposicion(idOposicion);
    const minutosPorPagina = getMinutosPorPagina(config);
    
    // Obtener temas vinculados a la oposición
    const temasVinculados = getTemasVinculadosAOposicion(idOposicion);
    console.log('📝 Temas vinculados obtenidos:', temasVinculados.length);
    
    // Obtener información de bloques
    const idsBloques = [...new Set(temasVinculados.map(t => t.idBloque).filter(id => id))];
    const bloquesInfo = getBloquesPorIds(idsBloques);
    
    // Obtener progresos completados
    const progresosCompletados = getProgresosCompletadosPorOposicion(idOposicion);
    
    // Construir árbol con estados
    const arbolCompleto = construirArbolConEstadosYTiempos(temasVinculados, progresosCompletados, minutosPorPagina);
    
    console.log('🌳 Árbol construido:', arbolCompleto.length, 'temas principales');
    
    return {
      arbol: arbolCompleto,
      configuracion: config,
      minutosPorPagina: minutosPorPagina,
      bloques: bloquesInfo  // ← AÑADIR INFO DE BLOQUES
    };
    
  } catch (error) {
    console.error('Error al obtener árbol de temas:', error);
    throw error;
  }
}

// Obtener temas vinculados a una oposición (CORREGIDO)
function getTemasVinculadosAOposicion(idOposicion) {
  try {
    // Obtener relaciones tema-oposición (NOMBRE CORREGIDO)
    const temaOposSheet = getGoogleSheet('Tema_Oposicion');
    const temaOposColumns = getColumnIndices('Tema_Oposicion');
    const temaOposData = temaOposSheet.getDataRange().getValues();
    
    // Obtener todos los temas
    const temasSheet = getGoogleSheet('Temas');
    const temasColumns = getColumnIndices('Temas');
    const temasData = temasSheet.getDataRange().getValues();
    
    // Obtener IDs de temas vinculados (NOMBRES DE COLUMNAS CORREGIDOS)
    const idsVinculados = [];
    for (let i = 1; i < temaOposData.length; i++) {
      if (temaOposData[i][temaOposColumns['id_oposicion']] == idOposicion) {
        idsVinculados.push(temaOposData[i][temaOposColumns['id_tema']]);
      }
    }
    
    console.log('🔗 IDs vinculados encontrados:', idsVinculados);
    
    // Construir array de temas vinculados
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
    
    console.log('📝 Temas construidos:', temas);
    return temas;
    
  } catch (error) {
    console.error('Error al obtener temas vinculados:', error);
    return [];
  }
}

// Obtener progresos completados por oposición
function getProgresosCompletadosPorOposicion(idOposicion) {
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

// Construir árbol con estados y tiempos
function construirArbolConEstadosYTiempos(temas, progresosMap, minutosPorPagina) {
  // Función recursiva para construir nodos
  function construirNodo(idTema, nivel = 0) {
    const tema = temas.find(t => t.id === idTema);
    if (!tema) return null;
    
    // Obtener hijos directos
    const hijos = temas
      .filter(t => t.idPadre === idTema)
      .sort((a, b) => {
        const numA = parseFloat((a.prenombre || '0').replace(/[^\d.]/g, ''));
        const numB = parseFloat((b.prenombre || '0').replace(/[^\d.]/g, ''));
        return numA - numB;
      })
      .map(hijo => construirNodo(hijo.id, nivel + 1))
      .filter(nodo => nodo !== null);
    
    // Determinar estado
    const esHoja = hijos.length === 0;
    let estado = 'pendiente';
    
    if (esHoja) {
      estado = progresosMap[idTema] ? 'completado' : 'pendiente';
    } else {
      // Para padres, calcular estado basado en hijos
      const hijosCompletados = hijos.filter(h => h.estado === 'completado').length;
      if (hijosCompletados === hijos.length && hijos.length > 0) {
        estado = 'completado';
      } else if (hijosCompletados > 0) {
        estado = 'en_progreso';
      }
    }
    
    // Calcular tiempo
    const paginas = tema.pagTotales || 0;
    const tiempoMinutos = paginas * minutosPorPagina;
    

    // Determinar si el tema padre es seleccionable
    let seleccionablePadre = false;
    if (!esHoja && paginas > 0) {
      // Tema padre seleccionable si tiene tiempo ≤ disponible y no está completado
      seleccionablePadre = (tiempoMinutos <= tiempoEstudioDisponible) && estado !== 'completado';
    }
    
    return {
      id: idTema,
      nombre: tema.nombre,
      prenombre: tema.prenombre,
      nombreCompleto: (tema.prenombre ? tema.prenombre + ' ' : '') + tema.nombre,
      paginas: paginas,
      tiempoMinutos: tiempoMinutos,
      tiempoTexto: formatearTiempo(tiempoMinutos),
      esHoja: esHoja,
      estado: estado,
      nivel: nivel,
      hijos: hijos,
      idBloque: tema.idBloque,
      seleccionable: esHoja && estado === 'pendiente', // Solo hojas pendientes
      seleccionablePadre: seleccionablePadre // ← NUEVA PROPIEDAD
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

// Formatear tiempo en horas y minutos
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

// Función de debug para verificar datos
function debugTemasVinculados(idOposicion) {
  try {
    console.log('🔍 DEBUG: Verificando temas para oposición', idOposicion);
    
    // 1. Verificar hoja Oposicion_Temas
    const temaOposSheet = getGoogleSheet('Tema_Oposicion');
    const temaOposColumns = getColumnIndices('Tema_Oposicion');
    const temaOposData  = temaOposSheet.getDataRange().getValues();
    
    console.log('📊 Columnas Tema_Oposicion:', temaOposColumns);
    console.log('📊 Filas Tema_Oposicion:', temaOposData.length);
    
    // 2. Buscar relaciones para esta oposición
    const relaciones = [];
    for (let i = 1; i < temaOposData.length; i++) {
      if (temaOposData[i][temaOposColumns['id_oposicion']] == idOposicion) {
        relaciones.push({
          idOposicion: temaOposData[i][temaOposColumns['id_oposicion']],
          idTema: temaOposData[i][temaOposColumns['id_tema']]
        });
      }
    }
    
    console.log('🔗 Relaciones encontradas:', relaciones);
    
    // 3. Verificar hoja Temas
    const temasSheet = getGoogleSheet('Temas');
    const temasColumns = getColumnIndices('Temas');
    const temasData = temasSheet.getDataRange().getValues();
    
    console.log('📊 Columnas Temas:', temasColumns);
    console.log('📊 Filas Temas:', temasData.length);
    
    // 4. Verificar que existen los temas vinculados
    const temasEncontrados = [];
    relaciones.forEach(rel => {
      for (let i = 1; i < temasData.length; i++) {
        if (temasData[i][temasColumns['id_tema']] == rel.idTema) {
          temasEncontrados.push({
            id: temasData[i][temasColumns['id_tema']],
            nombre: temasData[i][temasColumns['nombre']],
            prenombre: temasData[i][temasColumns['prenombre']],
            idPadre: temasData[i][temasColumns['id_padre']],
            idBloque: temasData[i][temasColumns['id_bloque']]
          });
          break;
        }
      }
    });
    
    console.log('📝 Temas encontrados:', temasEncontrados);
    
    return {
      relacionesEncontradas: relaciones.length,
      temasEncontrados: temasEncontrados.length,
      relaciones: relaciones,
      temas: temasEncontrados
    };
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
    return { error: error.message };
  }
}

// Obtener información de bloques desde la hoja Bloques
function getBloquesPorIds(idsBloques) {
  try {
    const bloquesSheet = getGoogleSheet('Bloques');
    const bloquesColumns = getColumnIndices('Bloques');
    const bloquesData = bloquesSheet.getDataRange().getValues();
    
    const bloquesMap = {};
    
    // Crear mapa de id_bloque -> nombre
    for (let i = 1; i < bloquesData.length; i++) {
      const idBloque = bloquesData[i][bloquesColumns['id_bloque']];
      const nombre = bloquesData[i][bloquesColumns['nombre']];
      bloquesMap[idBloque] = nombre;
    }
    
    console.log('📊 Bloques encontrados:', bloquesMap);
    return bloquesMap;
    
  } catch (error) {
    console.error('Error al obtener bloques:', error);
    return {};
  }
}

// PASO 1: Añadir estas 4 funciones al final de planificacion.gs

// 1. Obtener o crear hoja de configuración
function getOrCreateConfigSheet() {
  const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
  
  let configSheet = spreadsheet.getSheetByName('Configuracion_Planificacion');
  if (!configSheet) {
    configSheet = spreadsheet.insertSheet('Configuracion_Planificacion');
    configSheet.getRange(1, 1, 1, 3).setValues([['clave', 'valor', 'fecha_actualizacion']]);
  }
  
  return configSheet;
}

// 2. Obtener oposición por ID
function getOposicionById(idOposicion) {
  try {
    const oposicionesSheet = getGoogleSheet('Oposiciones');
    const oposicionesColumns = getColumnIndices('Oposiciones');
    const data = oposicionesSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][oposicionesColumns['id_oposicion']] == idOposicion) {
        return {
          id: data[i][oposicionesColumns['id_oposicion']],
          nombre: data[i][oposicionesColumns['nombre']]
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error al obtener oposición por ID:', error);
    return null;
  }
}

// 3. Obtener oposición activa actual
function getOposicionActiva() {
  try {
    const configSheet = getOrCreateConfigSheet();
    const data = configSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'oposicion_activa' && data[i][1]) {
        // Verificar que la oposición existe
        const oposicion = getOposicionById(data[i][1]);
        if (oposicion) {
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

// 4. Establecer oposición activa
function setOposicionActiva(idOposicion) {
  try {
    const configSheet = getOrCreateConfigSheet();
    const data = configSheet.getDataRange().getValues();
    
    // Buscar si ya existe configuración
    let filaExistente = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'oposicion_activa') {
        filaExistente = i + 1;
        break;
      }
    }
    
    if (filaExistente > 0) {
      // Actualizar existente
      configSheet.getRange(filaExistente, 2).setValue(idOposicion);
    } else {
      // Crear nuevo
      configSheet.appendRow(['oposicion_activa', idOposicion, new Date()]);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error al establecer oposición activa:', error);
    throw error;
  }
}

// 5. Obtener temas comunes entre dos oposiciones con estado
function getTemasComunes(idOposicion1, idOposicion2) {
  try {
    const temaOposicionSheet = getGoogleSheet('Tema_Oposicion');
    const temaOposicionColumns = getColumnIndices('Tema_Oposicion');
    const data = temaOposicionSheet.getDataRange().getValues();
    
    // Obtener temas de cada oposición
    const temasOp1 = [];
    const temasOp2 = [];
    
    for (let i = 1; i < data.length; i++) {
      const idOposicion = data[i][temaOposicionColumns['id_oposicion']];
      const idTema = data[i][temaOposicionColumns['id_tema']];
      
      if (idOposicion == idOposicion1) {
        temasOp1.push(idTema);
      } else if (idOposicion == idOposicion2) {
        temasOp2.push(idTema);
      }
    }
    
    // Encontrar temas comunes
    const temasComunes = temasOp1.filter(tema => temasOp2.includes(tema));
    
    // Obtener información completa de los temas comunes
    const temasSheet = getGoogleSheet('Temas');
    const temasColumns = getColumnIndices('Temas');
    const temasData = temasSheet.getDataRange().getValues();
    
    const temasDetalle = [];
    
    temasComunes.forEach(idTema => {
      for (let i = 1; i < temasData.length; i++) {
        if (temasData[i][temasColumns['id_tema']] == idTema) {
          // Verificar si el tema está completado
          const completado = verificarTemaCompletado(idTema);
          
          temasDetalle.push({
            id: idTema,
            nombre: temasData[i][temasColumns['nombre']],
            prenombre: temasData[i][temasColumns['prenombre']],
            nombreCompleto: (temasData[i][temasColumns['prenombre']] || '') + ' ' + temasData[i][temasColumns['nombre']],
            id_bloque: temasData[i][temasColumns['id_bloque']],
            completado: completado
          });
          break;
        }
      }
    });
    
    return temasDetalle;
  } catch (error) {
    console.error('Error al obtener temas comunes:', error);
    throw error;
  }
}

// 6. Verificar si un tema está completado
function verificarTemaCompletado(idTema) {
  try {
    // Buscar en Progreso_Temas si hay registro completado
    const progresoSheet = getGoogleSheet('Progreso_Temas');
    const progresoColumns = getColumnIndices('Progreso_Temas');
    const data = progresoSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][progresoColumns['id_tema']] == idTema && 
          data[i][progresoColumns['estado']] === 'completado') {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error al verificar tema completado:', error);
    return false;
  }
}

function testComparacion() {
  const oposiciones = getOposicionesOrdenadas();
  console.log('Oposiciones disponibles:', oposiciones);
  
  if (oposiciones.length >= 2) {
    const temas = getTemasComunes(oposiciones[0].id, oposiciones[1].id);
    console.log('Temas comunes:', temas);
  }
}

// Función temporal para probar
function testOposicionActiva() {
  console.log('Probando oposición activa...');
  const activa = getOposicionActiva();
  console.log('Oposición activa:', activa);
  return activa;
}

// ====================================
// SISTEMA DE LOGGING Y GESTIÓN DE ERRORES - BACKEND
// Añadir al final de planificacion.gs
// ====================================

// Función para recibir y procesar logs de errores del frontend
function logError(infoError) {
  try {
    // Validar que la información del error sea válida
    if (!infoError || !infoError.contexto) {
      console.error('Información de error inválida recibida');
      return { success: false, error: 'Datos inválidos' };
    }
    
    // Obtener información adicional del backend
    var errorCompleto = {
      // Datos del frontend
      contexto: infoError.contexto,
      mensaje: infoError.mensaje,
      timestamp: infoError.timestamp,
      url: infoError.url,
      userAgent: infoError.userAgent,
      stack: infoError.stack,
      datos: infoError.datos,
      
      // Datos adicionales del backend
      usuario: obtenerUsuarioActual(),
      sesion: obtenerIdSesion(),
      servidor: 'Google Apps Script',
      funcionBackend: 'logError',
      timestampServidor: new Date().toISOString()
    };
    
    // Registrar en el log de Google Apps Script
    console.error('ERROR FRONTEND:', JSON.stringify(errorCompleto, null, 2));
    
    // Guardar en hoja de logs si es necesario (opcional)
    if (debeGuardarEnHoja(infoError)) {
      guardarErrorEnHoja(errorCompleto);
    }
    
    // Enviar notificación si es crítico (opcional)
    if (esErrorCritico(infoError)) {
      notificarErrorCritico(errorCompleto);
    }
    
    return { success: true, logId: Utilities.getUuid() };
    
  } catch (error) {
    console.error('Error al procesar log de error:', error);
    return { success: false, error: error.toString() };
  }
}

// Wrapper para funciones con manejo de errores mejorado
function ejecutarConManejo(funcion, contexto, parametros) {
  parametros = parametros || [];
  
  try {
    // Log de inicio de operación
    console.log(`🔄 Iniciando: ${contexto}`);
    
    var inicio = new Date();
    var resultado = funcion.apply(this, parametros);
    var duracion = new Date() - inicio;
    
    // Log de éxito
    console.log(`✅ Completado: ${contexto} (${duracion}ms)`);
    
    return {
      success: true,
      data: resultado,
      duracion: duracion,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    // Log detallado del error
    var errorInfo = {
      contexto: contexto,
      mensaje: error.message,
      stack: error.stack,
      parametros: parametros,
      usuario: obtenerUsuarioActual(),
      timestamp: new Date().toISOString()
    };
    
    console.error('❌ Error en:', contexto, errorInfo);
    
    // Guardar error crítico
    if (esErrorCriticoBackend(error)) {
      guardarErrorEnHoja(errorInfo);
    }
    
    // Re-lanzar el error para que lo maneje el frontend
    throw new Error(`${contexto}: ${error.message}`);
  }
}

// Determinar si un error debe guardarse en hoja de logs
function debeGuardarEnHoja(infoError) {
  // Criterios para guardar en hoja:
  var contextosCriticos = [
    'crearPlanificacion',
    'addPlanificacion',
    'marcarTemaComoCompletado',
    'setOposicionActiva'
  ];
  
  var erroresCriticos = [
    'permission',
    'forbidden',
    'database',
    'sheet'
  ];
  
  // Verificar contexto crítico
  for (var i = 0; i < contextosCriticos.length; i++) {
    if (infoError.contexto.includes(contextosCriticos[i])) {
      return true;
    }
  }
  
  // Verificar tipo de error crítico
  var mensajeLower = infoError.mensaje.toLowerCase();
  for (var j = 0; j < erroresCriticos.length; j++) {
    if (mensajeLower.includes(erroresCriticos[j])) {
      return true;
    }
  }
  
  return false;
}

// Guardar error en hoja de logs
function guardarErrorEnHoja(errorInfo) {
  try {
    var logsSheet = getOrCreateLogsSheet();
    
    var fila = [
      new Date(),
      errorInfo.contexto || 'Desconocido',
      errorInfo.mensaje || 'Sin mensaje',
      errorInfo.usuario || 'Anónimo',
      errorInfo.url || 'No disponible',
      JSON.stringify(errorInfo.datos || {}),
      errorInfo.stack || 'No disponible'
    ];
    
    logsSheet.appendRow(fila);
    
  } catch (e) {
    console.error('Error al guardar en hoja de logs:', e);
  }
}

// Crear o obtener hoja de logs
function getOrCreateLogsSheet() {
  var spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
  
  var logsSheet = spreadsheet.getSheetByName('Error_Logs');
  if (!logsSheet) {
    logsSheet = spreadsheet.insertSheet('Error_Logs');
    
    // Crear encabezados
    var encabezados = [
      'Timestamp',
      'Contexto',
      'Mensaje',
      'Usuario',
      'URL',
      'Datos',
      'Stack'
    ];
    
    logsSheet.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
    logsSheet.getRange(1, 1, 1, encabezados.length).setFontWeight('bold');
  }
  
  return logsSheet;
}

// Determinar si es error crítico
function esErrorCritico(infoError) {
  var contextosCriticos = [
    'addPlanificacion',
    'marcarTemaComoCompletado'
  ];
  
  return contextosCriticos.some(function(contexto) {
    return infoError.contexto.includes(contexto);
  });
}

// Determinar si es error crítico del backend
function esErrorCriticoBackend(error) {
  var mensajeError = error.message.toLowerCase();
  var erroresCriticos = [
    'permission denied',
    'sheet not found',
    'quota exceeded',
    'service invoked too many times'
  ];
  
  return erroresCriticos.some(function(errorCritico) {
    return mensajeError.includes(errorCritico);
  });
}

// Notificar error crítico (opcional - implementar según necesidades)
function notificarErrorCritico(errorInfo) {
  try {
    // Aquí podrías enviar email, Slack, etc.
    console.warn('🚨 ERROR CRÍTICO DETECTADO:', errorInfo.contexto);
    
    // Ejemplo: enviar email al administrador
    // var destinatario = 'admin@example.com';
    // var asunto = '🚨 Error crítico en aplicación de oposiciones';
    // var cuerpo = 'Error: ' + errorInfo.mensaje + '\nContexto: ' + errorInfo.contexto;
    // GmailApp.sendEmail(destinatario, asunto, cuerpo);
    
  } catch (e) {
    console.error('Error al notificar error crítico:', e);
  }
}

// Funciones auxiliares
function obtenerUsuarioActual() {
  try {
    return Session.getActiveUser().getEmail();
  } catch (e) {
    return 'Usuario anónimo';
  }
}

function obtenerIdSesion() {
  try {
    return Session.getTemporaryActiveUserKey() || Utilities.getUuid();
  } catch (e) {
    return Utilities.getUuid();
  }
}

// Función para versiones mejoradas de las funciones existentes
function addPlanificacionSegura(datosPlanificacion) {
  return ejecutarConManejo(function() {
    // Validaciones adicionales
    if (!datosPlanificacion || !datosPlanificacion.fecha) {
      throw new Error('Datos de planificación inválidos: falta fecha');
    }
    
    if (!datosPlanificacion.idOposicion) {
      throw new Error('Datos de planificación inválidos: falta ID de oposición');
    }
    
    if (!datosPlanificacion.temasSeleccionados || datosPlanificacion.temasSeleccionados.length === 0) {
      throw new Error('Datos de planificación inválidos: no hay temas seleccionados');
    }
    
    // Llamar a la función original
    return addPlanificacion(datosPlanificacion);
    
  }, 'addPlanificacionSegura', [datosPlanificacion]);
}

function getOposicionActivaSegura() {
  return ejecutarConManejo(function() {
    return getOposicionActiva();
  }, 'getOposicionActivaSegura', []);
}

function getArbolTemasConEstadosSeguro(idOposicion, tiempoDisponible) {
  return ejecutarConManejo(function() {
    if (!idOposicion) {
      throw new Error('ID de oposición requerido');
    }
    
    return getArbolTemasConEstados(idOposicion, tiempoDisponible);
  }, 'getArbolTemasConEstadosSeguro', [idOposicion, tiempoDisponible]);
}

console.log('✅ Sistema de logging backend configurado');
