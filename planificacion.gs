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
