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
function construirArbolConEstadosYTiempos(temas, progresosMap, minutosPorPagina, tiempoDisponible) {

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
      seleccionablePadre = (tiempoMinutos <= tiempoDisponible) && estado !== 'completado';
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

// 7. Obtener temas comunes organizados en árbol con horas
function getTemassComunesEnArbol(idOposicion1, idOposicion2) {
  try {
    // Obtener temas comunes básicos
    const temasComunes = getTemasComunes(idOposicion1, idOposicion2);
    const idsComunes = temasComunes.map(t => t.id);
    
    // Obtener todos los temas para construir jerarquía
    const temasSheet = getGoogleSheet('Temas');
    const temasColumns = getColumnIndices('Temas');
    const temasData = temasSheet.getDataRange().getValues();
    
    // Construir árbol solo con temas comunes y sus ancestros
    const arbol = construirArbolTemasComunes(temasData, temasColumns, idsComunes);
    
    return arbol;
  } catch (error) {
    console.error('Error al obtener temas comunes en árbol:', error);
    throw error;
  }
}

// 8. Construir árbol jerárquico de temas comunes
function construirArbolTemasComunes(temasData, temasColumns, idsComunes) {
  // Esta función sería similar a getTemasEnArbol() pero filtrada
  // ¿Quieres que implemente esta función completa ahora?
}

// 7. Obtener temas comunes agrupados por bloque con horas
function getTemassComunesPorBloque(idOposicion1, idOposicion2) {
  try {
    // Obtener temas comunes
    const temasComunes = getTemasComunes(idOposicion1, idOposicion2);
    
    // Obtener información de bloques
    const bloquesSheet = getGoogleSheet('Bloques');
    const bloquesColumns = getColumnIndices('Bloques');
    const bloquesData = bloquesSheet.getDataRange().getValues();
    
    // Agrupar por bloque
    const temasPorBloque = {};
    
    temasComunes.forEach(tema => {
      const idBloque = tema.id_bloque || 'sin_bloque';
      
      if (!temasPorBloque[idBloque]) {
        // Buscar nombre del bloque
        let nombreBloque = 'Sin bloque';
        for (let i = 1; i < bloquesData.length; i++) {
          if (bloquesData[i][bloquesColumns['id_bloque']] == idBloque) {
            nombreBloque = bloquesData[i][bloquesColumns['nombre']];
            break;
          }
        }
        
        temasPorBloque[idBloque] = {
          idBloque: idBloque,
          nombreBloque: nombreBloque,
          temas: []
        };
      }
      
      // Calcular horas del tema (páginas * minutos por página / 60)
      const paginas = calcularPaginasTema(tema.id);
      const minutosEstimados = paginas * 30; // 30 min por página (configuración base)
      const horasEstimadas = Math.round((minutosEstimados / 60) * 10) / 10; // redondear a 1 decimal
      
      temasPorBloque[idBloque].temas.push({
        ...tema,
        paginas: paginas,
        minutosEstimados: minutosEstimados,
        horasEstimadas: horasEstimadas
      });
    });
    
    // Convertir a array y ordenar
    const resultado = Object.values(temasPorBloque);
    
    // Ordenar bloques por nombre
    resultado.sort((a, b) => a.nombreBloque.localeCompare(b.nombreBloque));
    
    // Ordenar temas dentro de cada bloque
    resultado.forEach(bloque => {
      bloque.temas.sort((a, b) => {
        const ordenA = a.prenombre || a.nombre;
        const ordenB = b.prenombre || b.nombre;
        return ordenA.localeCompare(ordenB);
      });
    });
    
    return resultado;
  } catch (error) {
    console.error('Error al obtener temas comunes por bloque:', error);
    throw error;
  }
}

// 8. Calcular páginas de un tema (recursivo si tiene hijos)
function calcularPaginasTema(idTema) {
  try {
    const temasSheet = getGoogleSheet('Temas');
    const temasColumns = getColumnIndices('Temas');
    const data = temasSheet.getDataRange().getValues();
    
    // Buscar el tema
    let tema = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][temasColumns['id_tema']] == idTema) {
        tema = {
          id: data[i][temasColumns['id_tema']],
          pag_desde: data[i][temasColumns['pag_desde']],
          pag_hasta: data[i][temasColumns['pag_hasta']],
          id_padre: data[i][temasColumns['id_padre']]
        };
        break;
      }
    }
    
    if (!tema) return 0;
    
    // Si tiene páginas definidas, calcular
    if (tema.pag_desde && tema.pag_hasta) {
      return tema.pag_hasta - tema.pag_desde + 1;
    }
    
    // Si no tiene páginas, buscar en hijos
    let paginasHijos = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i][temasColumns['id_padre']] == idTema) {
        paginasHijos += calcularPaginasTema(data[i][temasColumns['id_tema']]);
      }
    }
    
    return paginasHijos;
  } catch (error) {
    console.error('Error al calcular páginas del tema:', error);
    return 0;
  }
}

// 9. Obtener temas comunes en formato árbol jerárquico por bloque
function getTemassComunesEnArbolPorBloque(idOposicion1, idOposicion2) {
  try {
    // Obtener temas comunes básicos
    const temasComunes = getTemasComunes(idOposicion1, idOposicion2);
    const idsComunes = temasComunes.map(t => t.id);
    
    // Obtener todos los temas para construir jerarquía
    const temasSheet = getGoogleSheet('Temas');
    const temasColumns = getColumnIndices('Temas');
    const temasData = temasSheet.getDataRange().getValues();
    
    // Crear mapa de todos los temas
    const mapaTemas = {};
    for (let i = 1; i < temasData.length; i++) {
      const tema = {
        id: temasData[i][temasColumns['id_tema']],
        nombre: temasData[i][temasColumns['nombre']],
        prenombre: temasData[i][temasColumns['prenombre']],
        nombreCompleto: (temasData[i][temasColumns['prenombre']] || '') + ' ' + temasData[i][temasColumns['nombre']],
        id_padre: temasData[i][temasColumns['id_padre']],
        id_bloque: temasData[i][temasColumns['id_bloque']],
        pag_desde: temasData[i][temasColumns['pag_desde']],
        pag_hasta: temasData[i][temasColumns['pag_hasta']],
        esComun: idsComunes.includes(temasData[i][temasColumns['id_tema']]),
        completado: verificarTemaCompletado(temasData[i][temasColumns['id_tema']]),
        hijos: []
      };
      
      // Calcular páginas y horas
      tema.paginas = calcularPaginasTema(tema.id);
      tema.minutosEstimados = tema.paginas * 30;
      tema.horasEstimadas = Math.round((tema.minutosEstimados / 60) * 10) / 10;
      
      mapaTemas[tema.id] = tema;
    }
    
    // Construir jerarquía
    const temasRaiz = [];
    Object.values(mapaTemas).forEach(tema => {
      if (tema.id_padre && mapaTemas[tema.id_padre]) {
        mapaTemas[tema.id_padre].hijos.push(tema);
      } else {
        temasRaiz.push(tema);
      }
    });
    
    // Filtrar solo temas que son comunes o tienen descendientes comunes
    const temasFiltrados = filtrarTemasConComunesYDescendientes(temasRaiz, idsComunes);
    
    // Agrupar por bloque
    return agruparTemasPorBloque(temasFiltrados);
    
  } catch (error) {
    console.error('Error al obtener temas comunes en árbol:', error);
    throw error;
  }
}

// 10. Filtrar temas que son comunes o tienen descendientes comunes
function filtrarTemasConComunesYDescendientes(temas, idsComunes) {
  const resultado = [];
  
  temas.forEach(tema => {
    // Filtrar hijos recursivamente
    tema.hijos = filtrarTemasConComunesYDescendientes(tema.hijos, idsComunes);
    
    // Incluir si el tema es común O tiene hijos comunes
    if (tema.esComun || tema.hijos.length > 0) {
      resultado.push(tema);
    }
  });
  
  return resultado;
}

// 11. Agrupar temas filtrados por bloque (VERSIÓN CORREGIDA SIN DUPLICADOS)
function agruparTemasPorBloque(temas) {
  const bloquesSheet = getGoogleSheet('Bloques');
  const bloquesColumns = getColumnIndices('Bloques');
  const bloquesData = bloquesSheet.getDataRange().getValues();
  
  const temasPorBloque = {};
  
  // Solo procesar temas de nivel raíz (que no tienen padre en la lista filtrada)
  temas.forEach(tema => {
    const idBloque = tema.id_bloque || 'sin_bloque';
    
    if (!temasPorBloque[idBloque]) {
      let nombreBloque = 'Sin bloque';
      for (let i = 1; i < bloquesData.length; i++) {
        if (bloquesData[i][bloquesColumns['id_bloque']] == idBloque) {
          nombreBloque = bloquesData[i][bloquesColumns['nombre']];
          break;
        }
      }
      
      temasPorBloque[idBloque] = {
        idBloque: idBloque,
        nombreBloque: nombreBloque,
        temas: []
      };
    }
    
    // Solo añadir temas que no tienen padre en la lista (son raíz del árbol)
    const tienePadreEnLista = temas.some(otroTema => otroTema.id === tema.id_padre);
    if (!tienePadreEnLista) {
      temasPorBloque[idBloque].temas.push(tema);
    }
  });
  
  // Convertir a array y ordenar
  const resultado = Object.values(temasPorBloque);
  resultado.sort((a, b) => a.nombreBloque.localeCompare(b.nombreBloque));
  
  // Ordenar temas dentro de cada bloque
  resultado.forEach(bloque => {
    bloque.temas.sort((a, b) => {
      const ordenA = a.prenombre || a.nombre;
      const ordenB = b.prenombre || b.nombre;
      return ordenA.localeCompare(ordenB);
    });
  });
  
  return resultado;
}

// Verificar progreso de una oposición
function verificarProgresoOposicion(idOposicion) {
  try {
    let temasCompletados = 0;
    let horasEstudiadas = 0;
    let repasosPendientes = 0;
    
    // Contar temas completados
    const progresoSheet = getGoogleSheet('Progreso_Temas');
    const progresoColumns = getColumnIndices('Progreso_Temas');
    const progresoData = progresoSheet.getDataRange().getValues();
    
    // Obtener planificaciones de esta oposición
    const planSheet = getGoogleSheet('Planificacion_Diaria');
    const planColumns = getColumnIndices('Planificacion_Diaria');
    const planData = planSheet.getDataRange().getValues();
    
    const planificacionesOposicion = [];
    for (let i = 1; i < planData.length; i++) {
      if (planData[i][planColumns['id_oposicion']] == idOposicion) {
        planificacionesOposicion.push({
          id: planData[i][planColumns['id_planificacion']],
          tiempoReal: planData[i][planColumns['tiempo_real_minutos']] || 0
        });
      }
    }
    
    // Calcular temas completados y horas estudiadas
    for (let i = 1; i < progresoData.length; i++) {
      const idPlanificacion = progresoData[i][progresoColumns['id_planificacion']];
      const planificacionCorrespondiente = planificacionesOposicion.find(p => p.id === idPlanificacion);
      
      if (planificacionCorrespondiente) {
        if (progresoData[i][progresoColumns['estado']] === 'completado') {
          temasCompletados++;
        }
        
        // Sumar tiempo dedicado
        const tiempoDedicado = progresoData[i][progresoColumns['tiempo_dedicado_minutos']] || 0;
        horasEstudiadas += tiempoDedicado;
      }
    }
    
    // Convertir minutos a horas
    horasEstudiadas = Math.round(horasEstudiadas / 60 * 10) / 10;
    
    // Contar repasos pendientes relacionados con temas de esta oposición
    const repasosSheet = getGoogleSheet('Repasos_Programados');
    const repasosColumns = getColumnIndices('Repasos_Programados');
    const repasosData = repasosSheet.getDataRange().getValues();
    
    // Obtener IDs de temas vinculados a la oposición
    const temasVinculados = getTemasVinculadosAOposicion(idOposicion);
    const idsTemasVinculados = temasVinculados.map(t => t.id);
    
    for (let i = 1; i < repasosData.length; i++) {
      const idTema = repasosData[i][repasosColumns['id_tema']];
      const estado = repasosData[i][repasosColumns['estado']];
      
      if (idsTemasVinculados.includes(idTema) && estado === 'pendiente') {
        repasosPendientes++;
      }
    }
    
    return {
      tieneProgreso: temasCompletados > 0 || horasEstudiadas > 0 || repasosPendientes > 0,
      temasCompletados: temasCompletados,
      horasEstudiadas: horasEstudiadas,
      repasosPendientes: repasosPendientes
    };
    
  } catch (error) {
    console.error('Error al verificar progreso:', error);
    return {
      tieneProgreso: false,
      temasCompletados: 0,
      horasEstudiadas: 0,
      repasosPendientes: 0
    };
  }
}

// Cambiar estado de una oposición
function cambiarEstadoOposicion(idOposicion, nuevoEstado) {
  try {
    const oposicionesSheet = getGoogleSheet('Oposiciones');
    const oposicionesColumns = getColumnIndices('Oposiciones');
    const data = oposicionesSheet.getDataRange().getValues();
    
    // Verificar que existe columna de estado, si no crearla
    if (!oposicionesColumns['estado']) {
      // Añadir columna estado
      const numColumnas = oposicionesSheet.getLastColumn();
      oposicionesSheet.getRange(1, numColumnas + 1).setValue('estado');
      
      // Actualizar todas las filas existentes con estado 'activa'
      for (let i = 2; i <= oposicionesSheet.getLastRow(); i++) {
        oposicionesSheet.getRange(i, numColumnas + 1).setValue('activa');
      }
      
      // Volver a obtener índices
      const nuevosColumns = getColumnIndices('Oposiciones');
      oposicionesColumns['estado'] = nuevosColumns['estado'];
    }
    
    // Buscar la oposición y cambiar estado
    for (let i = 1; i < data.length; i++) {
      if (data[i][oposicionesColumns['id_oposicion']] == idOposicion) {
        oposicionesSheet.getRange(i + 1, oposicionesColumns['estado'] + 1).setValue(nuevoEstado);
        
        // Si se marca como interrumpida o finalizada, añadir fecha
        if (nuevoEstado === 'interrumpida' || nuevoEstado === 'finalizada') {
          // Verificar si existe columna fecha_estado
          if (!oposicionesColumns['fecha_estado']) {
            const numColumnas = oposicionesSheet.getLastColumn();
            oposicionesSheet.getRange(1, numColumnas + 1).setValue('fecha_estado');
            oposicionesColumns['fecha_estado'] = numColumnas;
          }
          
          oposicionesSheet.getRange(i + 1, oposicionesColumns['fecha_estado'] + 1).setValue(new Date());
        }
        
        return { success: true };
      }
    }
    
    throw new Error('Oposición no encontrada');
    
  } catch (error) {
    console.error('Error al cambiar estado de oposición:', error);
    throw error;
  }
}

// Obtener oposiciones con estado
function getOposicionesConEstado() {
  try {
    const oposicionesSheet = getGoogleSheet('Oposiciones');
    const oposicionesColumns = getColumnIndices('Oposiciones');
    const data = oposicionesSheet.getDataRange().getValues();
    
    const oposiciones = [];
    
    for (let i = 1; i < data.length; i++) {
      const estado = data[i][oposicionesColumns['estado']] || 'activa'; // Por defecto activa
      
      oposiciones.push({
        id: data[i][oposicionesColumns['id_oposicion']],
        nombre: data[i][oposicionesColumns['nombre']],
        estado: estado,
        fechaEstado: data[i][oposicionesColumns['fecha_estado']] || null
      });
    }
    
    return oposiciones.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
  } catch (error) {
    console.error('Error al obtener oposiciones con estado:', error);
    return [];
  }
}

// Verificar si un día es modificable (no es pasado)
function esDiaModificable(fechaStr) {
  try {
    const fecha = new Date(fechaStr + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);
    
    return fecha >= hoy;
  } catch (error) {
    console.error('Error al verificar día modificable:', error);
    return false;
  }
}

// Obtener repasos programados para un día específico
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
          nombreTema: (tema.prenombre ? tema.prenombre + ' ' : '') + tema.nombre,
          tiempoEstimado: 30 // Estimación fija de 30 min por repaso
        });
      }
    }
    
    return repasos;
    
  } catch (error) {
    console.error('Error al obtener repasos del día:', error);
    return [];
  }
}

// Función corregida para obtener árbol con tiempo disponible
function getArbolTemasConEstados(idOposicion, tiempoDisponibleMinutos) {
  try {
    console.log('🌳 Obteniendo árbol de temas para oposición:', idOposicion);
    console.log('⏱️ Tiempo disponible:', tiempoDisponibleMinutos, 'min');
    
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
    
    // Construir árbol con estados y tiempo disponible
    const arbolCompleto = construirArbolConEstadosYTiempos(
      temasVinculados, 
      progresosCompletados, 
      minutosPorPagina,
      tiempoDisponibleMinutos  // PASAR TIEMPO DISPONIBLE
    );
    
    console.log('🌳 Árbol construido:', arbolCompleto.length, 'temas principales');
    
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

function testTemasConHoras() {
  const resultado = getTemassComunesEnArbolPorBloque(1, 2);
  
  // Verificar estructura del primer bloque
  if (resultado.length > 0) {
    const primerBloque = resultado[0];
    console.log('Nombre del bloque:', primerBloque.nombreBloque);
    console.log('Número de temas:', primerBloque.temas.length);
    
    // Verificar primer tema
    if (primerBloque.temas.length > 0) {
      const primerTema = primerBloque.temas[0];
      console.log('Primer tema:', primerTema.nombreCompleto);
      console.log('¿Es común?:', primerTema.esComun);
      console.log('Número de hijos:', primerTema.hijos ? primerTema.hijos.length : 'No tiene hijos');
      console.log('Horas estimadas:', primerTema.horasEstimadas);
      
      // Si tiene hijos, mostrar el primer hijo
      if (primerTema.hijos && primerTema.hijos.length > 0) {
        console.log('Primer hijo:', primerTema.hijos[0].nombreCompleto);
        console.log('¿Hijo es común?:', primerTema.hijos[0].esComun);
      }
    }
  }
  
  return resultado;
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


// ==========================================
// BACKEND - AÑADIR A planificacion.gs
// ==========================================

// 1. FUNCIÓN PRINCIPAL: Crear planificación completa
function crearPlanificacionCompleta(datosplanificacion) {
  try {
    console.log('📝 Creando planificación completa:', datosplanificacion);
    
    // Validar datos de entrada
    if (!datosplanificacion.fecha || !datosplanificacion.idOposicion || 
        !datosplanificacion.temasSeleccionados || datosplanificacion.temasSeleccionados.length === 0) {
      throw new Error('Datos de planificación incompletos');
    }
    
    // 1. Verificar que no existe planificación para esta fecha
    const planificacionExistente = verificarPlanificacionExistente(datosplanificacion.fecha, datosplanificacion.idOposicion);
    if (planificacionExistente) {
      throw new Error('Ya existe una planificación para esta fecha en esta oposición');
    }
    
    // 2. Crear registro principal en Planificacion_Diaria
    const idPlanificacion = crearRegistroPlanificacionDiaria(datosplanificacion);
    
    // 3. Crear registros en Progreso_Temas para cada tema seleccionado
    const progresoIds = crearRegistrosProgresoTemas(idPlanificacion, datosplanificacion.temasSeleccionados);
    
    // NOTA: Los repasos NO se crean aquí, solo cuando se marca tema como completado
    
    // 4. Retornar resultado
    return {
      success: true,
      idPlanificacion: idPlanificacion,
      temasCreados: progresoIds.length,
      mensaje: 'Planificación creada correctamente'
    };
    
  } catch (error) {
    console.error('❌ Error al crear planificación:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 2. Verificar planificación existente
function verificarPlanificacionExistente(fecha, idOposicion) {
  try {
    const planSheet = getGoogleSheet('Planificacion_Diaria');
    const planColumns = getColumnIndices('Planificacion_Diaria');
    const data = planSheet.getDataRange().getValues();
    
    const fechaBuscar = new Date(fecha);
    fechaBuscar.setHours(0, 0, 0, 0);
    
    for (let i = 1; i < data.length; i++) {
      const fechaFilaBuscar = new Date(data[i][planColumns['fecha']]);
      fechaFilaBuscar.setHours(0, 0, 0, 0);
      
      if (fechaFilaBuscar.getTime() === fechaBuscar.getTime() && 
          data[i][planColumns['id_oposicion']] == idOposicion) {
        return {
          id: data[i][planColumns['id_planificacion']],
          fecha: data[i][planColumns['fecha']]
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error al verificar planificación existente:', error);
    return null;
  }
}

// 3. Crear registro principal en Planificacion_Diaria
function crearRegistroPlanificacionDiaria(datos) {
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
    nuevoPlan[planColumns['numero_bloques']] = datos.numeroBloqures;
    nuevoPlan[planColumns['estado']] = 'planificado';
    nuevoPlan[planColumns['fecha_creacion']] = new Date();
    
    planSheet.appendRow(nuevoPlan);
    
    console.log('✅ Registro principal creado con ID:', idPlanificacion);
    return idPlanificacion;
    
  } catch (error) {
    console.error('Error al crear registro principal:', error);
    throw error;
  }
}

// 4. Crear registros en Progreso_Temas
function crearRegistrosProgresoTemas(idPlanificacion, temasSeleccionados) {
  try {
    const progresoSheet = getGoogleSheet('Progreso_Temas');
    const progresoColumns = getColumnIndices('Progreso_Temas');
    
    const registrosCreados = [];
    
    temasSeleccionados.forEach(tema => {
      // Solo crear registros para temas principales (no hijos automáticos)
      if (tema.tipo !== 'hijo_automatico') {
        const idProgreso = generateUniqueId(progresoSheet, progresoColumns['id_progreso'] + 1);
        
        const nuevoProgreso = [];
        nuevoProgreso[progresoColumns['id_progreso']] = idProgreso;
        nuevoProgreso[progresoColumns['id_planificacion']] = idPlanificacion;
        nuevoProgreso[progresoColumns['id_tema']] = tema.id;
        nuevoProgreso[progresoColumns['tiempo_asignado_minutos']] = tema.tiempo;
        nuevoProgreso[progresoColumns['estado']] = 'planificado';
        nuevoProgreso[progresoColumns['tipo_seleccion']] = tema.tipo; // 'padre' o 'hijo'
        nuevoProgreso[progresoColumns['fecha_planificado']] = new Date();
        
        progresoSheet.appendRow(nuevoProgreso);
        registrosCreados.push(idProgreso);
        
        console.log('✅ Progreso creado para tema:', tema.id, 'con ID:', idProgreso);
      }
    });
    
    return registrosCreados;
    
  } catch (error) {
    console.error('Error al crear registros de progreso:', error);
    throw error;
  }
}


// 5. NUEVA FUNCIÓN: Marcar tema como completado (AQUÍ se crean los repasos)
function marcarTemaComoCompletado(idProgreso, tiempoRealDedicado, nota) {
  try {
    console.log('✅ Marcando tema como completado:', idProgreso);
    
    // 1. Actualizar estado en Progreso_Temas
    const progresoSheet = getGoogleSheet('Progreso_Temas');
    const progresoColumns = getColumnIndices('Progreso_Temas');
    const data = progresoSheet.getDataRange().getValues();
    
    let idTema = null;
    let fila = -1;
    
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
    
    // Actualizar estado a completado
    progresoSheet.getRange(fila, progresoColumns['estado'] + 1).setValue('completado');
    progresoSheet.getRange(fila, progresoColumns['fecha_completado'] + 1).setValue(new Date());
    progresoSheet.getRange(fila, progresoColumns['tiempo_dedicado_minutos'] + 1).setValue(tiempoRealDedicado);
    if (nota) {
      progresoSheet.getRange(fila, progresoColumns['nota'] + 1).setValue(nota);
    }
    
    // 2. AHORA SÍ crear los repasos automáticamente
    const repasosCreados = programarRepasosParaTema(idTema, new Date());
    
    console.log('✅ Tema completado y repasos programados:', repasosCreados.length);
    
    return {
      success: true,
      repasosCreados: repasosCreados.length,
      mensaje: 'Tema marcado como completado y repasos programados'
    };
    
  } catch (error) {
    console.error('❌ Error al completar tema:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 6. Programar repasos para un tema específico (SOLO cuando se completa)
function programarRepasosParaTema(idTema, fechaCompletado) {
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
    
    console.log('✅ Repasos programados para tema:', idTema, '→', repasosCreados.length, 'repasos');
    return repasosCreados;
    
  } catch (error) {
    console.error('Error al programar repasos para tema:', error);
    return [];
  }
}

// 6. Obtener planificaciones para calendario
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
          estado: data[i][planColumns['estado']],
          numeroTemas: data[i][planColumns['numero_temas']],
          tiempoEstudio: data[i][planColumns['tiempo_estudio_minutos']]
        });
      }
    }
    
    return planificaciones;
    
  } catch (error) {
    console.error('Error al obtener planificaciones del mes:', error);
    return [];
  }
}

// 7. Obtener detalle de una planificación específica
function getDetallePlanificacion(idPlanificacion) {
  try {
    // Obtener datos principales
    const planSheet = getGoogleSheet('Planificacion_Diaria');
    const planColumns = getColumnIndices('Planificacion_Diaria');
    const planData = planSheet.getDataRange().getValues();
    
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
    
    // Obtener temas de la planificación
    const progresoSheet = getGoogleSheet('Progreso_Temas');
    const progresoColumns = getColumnIndices('Progreso_Temas');
    const progresoData = progresoSheet.getDataRange().getValues();
    
    const temas = [];
    for (let i = 1; i < progresoData.length; i++) {
      if (progresoData[i][progresoColumns['id_planificacion']] == idPlanificacion) {
        const idTema = progresoData[i][progresoColumns['id_tema']];
        const tema = getTemaById(idTema);
        
        temas.push({
          id: idTema,
          nombre: tema.nombre,
          prenombre: tema.prenombre,
          nombreCompleto: (tema.prenombre || '') + ' ' + tema.nombre,
          tiempoAsignado: progresoData[i][progresoColumns['tiempo_asignado_minutos']],
          estado: progresoData[i][progresoColumns['estado']],
          tipoSeleccion: progresoData[i][progresoColumns['tipo_seleccion']]
        });
      }
    }
    
    planificacion.temas = temas;
    return planificacion;
    
  } catch (error) {
    console.error('Error al obtener detalle de planificación:', error);
    throw error;
  }
}
