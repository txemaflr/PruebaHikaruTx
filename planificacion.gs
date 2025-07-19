// planificacion.gs - VERSIÓN LIMPIA
// Funciones de planificación completamente nuevas

// TODO: Implementar funciones limpias
// planificacion.gs - FUNCIONES BÁSICAS LIMPIAS

function debugDia16() {
  console.log('🔍 DEBUG DÍA 16 - Iniciando diagnóstico...');
  
  try {
    // 1. Verificar planificaciones día 16
    console.log('📅 PLANIFICACIONES:');
    const planificaciones = getPlanificacionesDelMes(2025, 6);
    console.log('Total planificaciones julio:', planificaciones.length);
    
    const plan16 = planificaciones.find(p => p.dia === 16);
    console.log('Planificación día 16:', plan16);
    
    // 2. Verificar repasos día 16
    console.log('🔄 REPASOS:');
    const fecha16 = new Date(2025, 6, 16).getTime(); // 16 julio 2025
    const repasos = getRepasosDelDia(fecha16);
    console.log('Repasos día 16:', repasos);
    
    // 3. Verificar fecha actual vs día 16
    const hoy = new Date();
    const dia16 = new Date(2025, 6, 16);
    console.log('Hoy:', hoy.toISOString().split('T')[0]);
    console.log('Día 16:', dia16.toISOString().split('T')[0]);
    console.log('¿Día 16 es pasado?', dia16 < hoy);
    
    return {
      planificaciones: planificaciones.length,
      planificacionDia16: plan16,
      repasos: repasos.length,
      repasosDetalle: repasos,
      esPasado: dia16 < hoy
    };
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
    return { error: error.message };
  }
}

function debugDia16Detallado() {
  console.log('🔍 DEBUG DETALLADO DÍA 16...');
  
  try {
    // Acceso directo a planificaciones SIN filtros
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    const sheet = spreadsheet.getSheetByName('Planificacion_Temas');
    const data = sheet.getDataRange().getValues();
    
    console.log('📊 Buscando todas las planificaciones de julio...');
    
    for (let i = 1; i < data.length; i++) {
      const fila = data[i];
      if (fila[6]) {
        const fecha = new Date(fila[6]);
        if (fecha.getFullYear() === 2025 && fecha.getMonth() === 6) {
          console.log('Fila', i, '- Fecha:', fecha.toISOString().split('T')[0], 'Día:', fecha.getDate(), 'Estado:', fila[8]);
        }
      }
    }
    
    // Verificar fecha actual
    const hoy = new Date();
    const dia16 = new Date(2025, 6, 16); // 16 julio 2025
    dia16.setHours(0, 0, 0, 0);
    
    console.log('🗓️ Verificación fechas:');
    console.log('Hoy real:', hoy.toISOString());
    console.log('Día 16 construido:', dia16.toISOString());
    console.log('¿Es día 16 pasado?', dia16 < hoy);
    
    return { ok: true };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return { error: error.message };
  }
}

function getPlanificacionesDelMesSinFiltro(año, mes) {
  try {
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    const sheet = spreadsheet.getSheetByName('Planificacion_Temas');
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const planificacionesMap = {};
    
    for (let i = 1; i < data.length; i++) {
      const fila = data[i];
      
      if (!fila || fila.length < 7 || !fila[6]) continue;
      
      const fecha = new Date(fila[6]);
      if (isNaN(fecha.getTime())) continue;
      
      if (fecha.getFullYear() === parseInt(año) && fecha.getMonth() === parseInt(mes)) {
        const idPlanificacion = fila[1];
        const estado = fila[8] || 'activo';
        
        // ✅ SIN FILTROS - mostrar todo
        
        if (!planificacionesMap[idPlanificacion]) {
          planificacionesMap[idPlanificacion] = {
            id: idPlanificacion,
            fecha: fecha.toISOString(),
            dia: fecha.getDate(),
            temas: [],
            tiempoTotal: 0,
            estado: estado
          };
        }
        
        const nombreJerarquia = getTemaConJerarquia(fila[3]);
        
        planificacionesMap[idPlanificacion].temas.push({
          id: fila[3],
          nombre: nombreJerarquia,
          tiempo: fila[9] || 0,
          idProgreso: fila[0],
          estado: estado
        });
        
        planificacionesMap[idPlanificacion].tiempoTotal += (fila[9] || 0);
      }
    }
    
    const resultado = Object.values(planificacionesMap);
    console.log('🎯 SIN FILTROS: Enviando', resultado.length, 'planificaciones');
    
    return resultado;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return [];
  }
}

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

function debugRapido() {
  console.log('🧪 DEBUG: Iniciando...');
  try {
    const resultado = getPlanificacionesDelMes(2025, 6);
    console.log('🎯 DEBUG: Resultado:', resultado);
    console.log('🔍 DEBUG: Tipo:', typeof resultado);
    return resultado;
  } catch (error) {
    console.error('❌ DEBUG: Error:', error);
    return { error: error.message };
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

function verificarDatos() {
  const sheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit').getSheetByName('Planificacion_Temas');
  const data = sheet.getDataRange().getValues();
  
  console.log('Headers:', data[0]);
  for (let i = 1; i < Math.min(5, data.length); i++) {
    console.log('Fila', i, ':', data[i]);
  }
}

// SISTEMA COMPLETO DE REPASOS CON POSPONER
function getRepasosDelDia(fechaMs) {
  try {
    const fecha = new Date(fechaMs);
    fecha.setHours(0, 0, 0, 0);
    
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    const repasosSheet = spreadsheet.getSheetByName('Repasos_Programados');
    
    if (!repasosSheet) return [];
    
    const data = repasosSheet.getDataRange().getValues();
    const repasos = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][3]) continue; // fecha_programada
      
      const fechaRepaso = new Date(data[i][3]);
      fechaRepaso.setHours(0, 0, 0, 0);
      
      const estado = data[i][5]; // estado
      
      if (fechaRepaso.getTime() === fecha.getTime() && (estado === 'pendiente' || estado === 'retraso' || estado === 'completado')) {
        const idTema = data[i][1];
        const tema = getTemaByIdRobust(idTema);
        
        repasos.push({
          id: data[i][0],
          numeroRepaso: data[i][2],
          nombreTema: tema.nombreCompleto,
          idTema: idTema,
          estado: estado
        });
      }
    }
    
    return repasos;
    
  } catch (error) {
    console.error('❌ Error al obtener repasos:', error);
    return [];
  }
}

function getTemaPadreOriginal(idTema) {
  try {
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    const temasSheet = spreadsheet.getSheetByName('Temas');
    const data = temasSheet.getDataRange().getValues();
    
    function encontrarTema(id) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == id) {
          return {
            id: data[i][0],
            nombre: data[i][1],
            prenombre: data[i][3],
            idPadre: data[i][5]
          };
        }
      }
      return null;
    }
    
    function buscarRaiz(tema) {
      if (!tema.idPadre) {
        // Es tema padre original
        return tema;
      } else {
        // Buscar su padre
        const padre = encontrarTema(tema.idPadre);
        return padre ? buscarRaiz(padre) : tema;
      }
    }
    
    const tema = encontrarTema(idTema);
    if (!tema) return { nombre: 'Tema desconocido', id: null };
    
    const raiz = buscarRaiz(tema);
    return {
      id: raiz.id,
      nombre: raiz.nombre,
      prenombre: raiz.prenombre || ''
    };
    
  } catch (error) {
    console.error('Error al obtener tema padre original:', error);
    return { nombre: 'Error', id: null };
  }
}

// FUNCIÓN SUPER EFICIENTE: Planificaciones + Repasos en UNA SOLA LLAMADA
function getDatosCompletosDelMes(año, mes) {
  try {
    console.log('🚀 BACKEND: Obteniendo datos completos del mes:', año, mes);
    
    // 1. Obtener planificaciones (reutilizar función existente)
    const planificaciones = getPlanificacionesDelMes(año, mes);
    
    // 2. Obtener repasos (reutilizar función que acabamos de crear)
    const repasosPorDia = getRepasosDelMesCompleto(año, mes);
    
    const resultado = {
      planificaciones: planificaciones,
      repasosPorDia: repasosPorDia,
      mes: mes,
      año: año,
      timestamp: new Date().getTime()
    };
    
    console.log('✅ BACKEND: Datos completos obtenidos -', planificaciones.length, 'planificaciones,', Object.keys(repasosPorDia).length, 'días con repasos');
    
    return resultado;
    
  } catch (error) {
    console.error('❌ BACKEND: Error al obtener datos completos:', error);
    return {
      planificaciones: [],
      repasosPorDia: {},
      error: error.message
    };
  }
}

// FUNCIÓN EFICIENTE: Obtener TODOS los repasos del mes de una vez
function getRepasosDelMesCompleto(año, mes) {
  try {
    console.log('📅 BACKEND: Obteniendo repasos de todo el mes:', año, mes);
    
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    const repasosSheet = spreadsheet.getSheetByName('Repasos_Programados');
    
    if (!repasosSheet) return {};
    
    const data = repasosSheet.getDataRange().getValues();
    const repasosPorDia = {};
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][3]) continue; // fecha_programada
      
      const fechaRepaso = new Date(data[i][3]);
      fechaRepaso.setHours(0, 0, 0, 0);
      
      // Solo repasos del año y mes especificado
      if (fechaRepaso.getFullYear() === parseInt(año) && fechaRepaso.getMonth() === parseInt(mes)) {
        const estado = data[i][5]; // estado
        
        // Incluir todos los estados
        if (estado === 'pendiente' || estado === 'retraso' || estado === 'completado') {
          const dia = fechaRepaso.getDate();
          const idTema = data[i][1];
          const tema = getTemaByIdRobust(idTema);
          
          if (!repasosPorDia[dia]) {
            repasosPorDia[dia] = [];
          }
          
          repasosPorDia[dia].push({
            id: data[i][0],
            numeroRepaso: data[i][2],
            nombreTema: tema.nombreCompleto,
            idTema: idTema,
            estado: estado
          });
        }
      }
    }
    
    console.log('✅ BACKEND: Repasos del mes obtenidos:', Object.keys(repasosPorDia).length, 'días');
    return repasosPorDia;
    
  } catch (error) {
    console.error('❌ BACKEND: Error al obtener repasos del mes:', error);
    return {};
  }
}

// FUNCIÓN AUXILIAR PARA ELIMINAR REPASOS PENDIENTES
function eliminarRepasosPendientes(idTema) {
  try {
    console.log('🗑️ BACKEND: Eliminando repasos pendientes para tema:', idTema);
    
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    const repasosSheet = spreadsheet.getSheetByName('Repasos_Programados');
    
    if (!repasosSheet) {
      console.log('⚠️ BACKEND: Hoja Repasos_Programados no encontrada');
      return 0;
    }
    
    const data = repasosSheet.getDataRange().getValues();
    let repasosEliminados = 0;
    
    // Recorrer desde atrás para evitar problemas al eliminar filas
    for (let i = data.length - 1; i >= 1; i--) {
      const idTemaRepaso = data[i][1]; // id_tema
      const estadoRepaso = data[i][5]; // estado
      
      // Eliminar solo repasos pendientes del tema específico
      if (idTemaRepaso == idTema && estadoRepaso === 'pendiente') {
        repasosSheet.deleteRow(i + 1);
        repasosEliminados++;
        console.log('🗑️ BACKEND: Repaso eliminado, fila', i + 1);
      }
    }
    
    console.log('✅ BACKEND: Total repasos eliminados:', repasosEliminados);
    return repasosEliminados;
    
  } catch (error) {
    console.error('❌ BACKEND: Error al eliminar repasos:', error);
    return 0;
  }
}

// FUNCIÓN PARA DESHACER TEMA COMPLETADO
function deshacerTemaCompletado(idProgreso) {
  try {
    console.log('↶ BACKEND: Deshaciendo tema completado - ID:', idProgreso);
    
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    
    // 1. Actualizar en Planificacion_Temas y obtener id_tema_actual
    const planSheet = spreadsheet.getSheetByName('Planificacion_Temas');
    let idTemaActual = null;
    
    if (planSheet) {
      const planData = planSheet.getDataRange().getValues();
      
      for (let i = 1; i < planData.length; i++) {
        if (planData[i][0] == idProgreso) { // Buscar por id_planificacion_tema
          idTemaActual = planData[i][3]; // Obtener id_tema_actual
          planSheet.getRange(i + 1, 8).setValue(''); // Limpiar fecha_completado
          planSheet.getRange(i + 1, 9).setValue('activo'); // Cambiar estado a activo
          planSheet.getRange(i + 1, 11).setValue(0); // Limpiar tiempo_real_minutos
          console.log('✅ BACKEND: Tema deshecho en Planificacion_Temas, fila', i + 1);
          console.log('📝 BACKEND: ID tema actual obtenido:', idTemaActual);
          break;
        }
      }
    }
    
    // 2. Eliminar repasos pendientes
    const repasosEliminados = eliminarRepasosPendientes(idTemaActual);
    
    return {
      success: true,
      repasosEliminados: repasosEliminados,
      mensaje: 'Tema deshecho exitosamente'
    };
    
  } catch (error) {
    console.error('❌ BACKEND: Error al deshacer tema:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// FUNCIÓN PARA POSPONER REPASOS AUTOMÁTICAMENTE
function procesarRepasosPendientes() {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    const repasosSheet = spreadsheet.getSheetByName('Repasos_Programados');
    const data = repasosSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][3]) continue;
      
      const fechaRepaso = new Date(data[i][3]);
      fechaRepaso.setHours(0, 0, 0, 0);
      const estado = data[i][5];
      
      // Si el repaso es de ayer o antes y sigue pendiente
      if (fechaRepaso < hoy && estado === 'pendiente') {
        // Marcar como pospuesto
        repasosSheet.getRange(i + 1, 6).setValue('pospuesto'); // columna estado
        
        // Crear nuevo repaso para hoy con estado "retraso"
        const nuevoRepaso = [
          new Date().getTime(), // id_repaso único
          data[i][1], // id_tema
          data[i][2], // numero_repaso
          hoy, // fecha_programada (hoy)
          '', // fecha_completado
          'retraso', // estado
          '', // id_test
          '', // id_evento_calendario
          '', // nota_test
          data[i][9] // tiempo_test_minutos
        ];
        
        repasosSheet.appendRow(nuevoRepaso);
      }
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error al procesar repasos pendientes:', error);
    return { success: false, error: error.message };
  }
}

// Función auxiliar ROBUSTA para obtener tema por ID
function getTemaByIdRobust(idTema) {
  try {
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    const temasSheet = spreadsheet.getSheetByName('Temas');
    
    if (!temasSheet) {
      console.error('❌ Hoja Temas no encontrada');
      return { nombreCompleto: 'Tema no encontrado' };
    }
    
    const data = temasSheet.getDataRange().getValues();
    
    // ÍNDICES FIJOS basados en estructura real:
    // id_tema | nombre | nombre_completo | prenombre | nivel | id_padre | id_bloque | pag_desde | pag_hasta | pag_totales | maquetado
    const COLUMNAS = {
      id_tema: 0,
      nombre: 1,
      nombre_completo: 2,
      prenombre: 3,
      nivel: 4,
      id_padre: 5,
      id_bloque: 6,
      pag_desde: 7,
      pag_hasta: 8,
      pag_totales: 9,
      maquetado: 10
    };
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][COLUMNAS.id_tema] == idTema) {
        const prenombre = data[i][COLUMNAS.prenombre] || '';
        const nombre = data[i][COLUMNAS.nombre] || data[i][COLUMNAS.nombre_completo] || 'Sin nombre';
        
        return {
          id: data[i][COLUMNAS.id_tema],
          nombre: nombre,
          prenombre: prenombre,
          nombreCompleto: prenombre ? prenombre + ' ' + nombre : nombre,
          pag_totales: data[i][COLUMNAS.pag_totales] || 0
        };
      }
    }
    
    console.warn('⚠️ Tema no encontrado con ID:', idTema);
    return { nombreCompleto: 'Tema ID ' + idTema + ' (no encontrado)' };
    
  } catch (error) {
    console.error('❌ Error al obtener tema por ID:', error);
    return { nombreCompleto: 'Error al cargar tema' };
  }
}

function getTemaById(idTema) {
  // Usar la función robusta como respaldo
  return getTemaByIdRobust(idTema);
}

// Función de TEST para verificar que funciona
function testRepasosDelDia() {
  console.log('🧪 TESTING repasos del día...');
  
  // Test con fecha de hoy
  const hoy = new Date();
  const repasos = getRepasosDelDia(hoy.getTime());
  
  console.log('📊 Resultado test:', repasos);
  
  return {
    fecha_test: hoy.toDateString(),
    repasos_encontrados: repasos.length,
    repasos: repasos
  };
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

// REEMPLAZAR la función construirArbolConEstadosYTiempos en planificacion.gs

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
    
    // Determinar si el tema padre es seleccionable (SIN usar tiempoEstudioDisponible)
    let seleccionablePadre = false;
    if (!esHoja && paginas > 0) {
      // Tema padre seleccionable si tiene páginas y no está completado
      seleccionablePadre = estado !== 'completado';
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
      seleccionablePadre: seleccionablePadre // ← CORREGIDO: sin tiempoEstudioDisponible
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

// FUNCIÓN PARA COMPLETAR REPASOS
function marcarRepasoComoCompletado(idRepaso, tiempoReal, notaTest) {
  try {
    console.log('📝 BACKEND: Marcando repaso como completado - ID:', idRepaso);
    
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    const repasosSheet = spreadsheet.getSheetByName('Repasos_Programados');
    
    if (!repasosSheet) {
      throw new Error('Hoja Repasos_Programados no encontrada');
    }
    
    const data = repasosSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == idRepaso) { // Buscar por id_repaso
        repasosSheet.getRange(i + 1, 5).setValue(new Date()); // fecha_completado
        repasosSheet.getRange(i + 1, 6).setValue('completado'); // estado
        repasosSheet.getRange(i + 1, 9).setValue(notaTest || null); // nota_test
        repasosSheet.getRange(i + 1, 10).setValue(tiempoReal || 30); // tiempo_test_minutos
        
        console.log('✅ BACKEND: Repaso completado, fila', i + 1);
        
        return {
          success: true,
          mensaje: 'Repaso completado correctamente'
        };
      }
    }
    
    throw new Error('Repaso no encontrado');
    
  } catch (error) {
    console.error('❌ BACKEND: Error al completar repaso:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// FUNCIÓN PARA CREAR REPASOS AUTOMÁTICOS
function crearRepasosAutomaticos(idTema, tiempoEstudio) {
  try {
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    const repasosSheet = spreadsheet.getSheetByName('Repasos_Programados');
    
    if (!repasosSheet) {
      console.error('❌ BACKEND: Hoja Repasos_Programados no encontrada');
      return 0;
    }
    
    const hoy = new Date();
    const intervalos = [1, 3, 7, 14, 30]; // días para cada repaso
    let repasosCreados = 0;
    
    intervalos.forEach((dias, index) => {
      const fechaRepaso = new Date(hoy);
      fechaRepaso.setDate(fechaRepaso.getDate() + dias);
      
      const idRepaso = new Date().getTime() + index;
      
      const fila = [
        idRepaso,                    // id_repaso
        idTema,                      // id_tema
        index + 1,                   // numero_repaso
        fechaRepaso,                 // fecha_programada
        '',                          // fecha_completado
        'pendiente',                 // estado
        '',                          // id_test
        '',                          // id_evento_calendario
        '',                          // nota_test
        ''                           // tiempo_test_minutos
      ];
      
      repasosSheet.appendRow(fila);
      repasosCreados++;
    });
    
    console.log('✅ BACKEND: Creados', repasosCreados, 'repasos para tema', idTema);
    return repasosCreados;
    
  } catch (error) {
    console.error('❌ BACKEND: Error creando repasos:', error);
    return 0;
  }
}

// FUNCIÓN PARA COMPLETAR TEMAS
function marcarTemaComoCompletado(idProgreso, tiempoReal, nota) {
  try {
    console.log('📝 BACKEND: Marcando tema como completado - ID:', idProgreso, 'Tiempo:', tiempoReal);
    
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    
    // 1. Actualizar en Planificacion_Temas y obtener id_tema_actual
    const planSheet = spreadsheet.getSheetByName('Planificacion_Temas');
    let idTemaActual = null;

    if (planSheet) {
      const planData = planSheet.getDataRange().getValues();
      
      for (let i = 1; i < planData.length; i++) {
        if (planData[i][0] == idProgreso) { // Buscar por id_planificacion_tema
          idTemaActual = planData[i][3]; // ← OBTENER id_tema_actual (columna 3)
          planSheet.getRange(i + 1, 8).setValue(new Date()); // fecha_completado
          planSheet.getRange(i + 1, 9).setValue('completado'); // estado
          planSheet.getRange(i + 1, 11).setValue(tiempoReal); // tiempo_real_minutos
          console.log('✅ BACKEND: Actualizado en Planificacion_Temas, fila', i + 1);
          console.log('📝 BACKEND: ID tema actual obtenido:', idTemaActual);
          break;
        }
      }
    }

    // 2. Crear repasos automáticos con el ID correcto
    const repasosCreados = crearRepasosAutomaticos(idTemaActual, tiempoReal);
    
    return {
      success: true,
      repasosCreados: repasosCreados,
      mensaje: 'Tema completado exitosamente'
    };
    
  } catch (error) {
    console.error('❌ BACKEND: Error al marcar tema completado:', error);
    return {
      success: false,
      error: error.message
    };
  }
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

function getPlanificacionesDelMes(año, mes) {
  try {
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    const sheet = spreadsheet.getSheetByName('Planificacion_Temas');
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const planificacionesMap = {};
    
    for (let i = 1; i < data.length; i++) {
      const fila = data[i];
      
      if (!fila || fila.length < 7 || !fila[6]) continue;
      
      // ✅ FECHA CORRECTA - sin problemas de zona horaria
      const fecha = new Date(fila[6]);
      if (isNaN(fecha.getTime())) continue;
      
      if (fecha.getFullYear() === parseInt(año) && fecha.getMonth() === parseInt(mes)) {
        const idPlanificacion = fila[1];
        
        if (!planificacionesMap[idPlanificacion]) {
          planificacionesMap[idPlanificacion] = {
            id: idPlanificacion,
            fecha: fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0') + '-' + String(fecha.getDate()).padStart(2, '0'),
            dia: fecha.getDate(),
            temas: [],
            tiempoTotal: 0,
            estado: fila[8] || 'activo'
          };
        }
        
        const nombreJerarquia = getTemaConJerarquia(fila[3]);
        
        planificacionesMap[idPlanificacion].temas.push({
          id: fila[3],
          nombre: nombreJerarquia,
          tiempo: parseInt(fila[9]) || 0,
          idProgreso: fila[0],
          estado: fila[8] || 'activo'
        });
        
        planificacionesMap[idPlanificacion].tiempoTotal += (parseInt(fila[9]) || 0);
      }
    }
    
    return Object.values(planificacionesMap);
    
  } catch (error) {
    console.error('❌ Error al obtener planificaciones:', error);
    return [];
  }
}



// FUNCIÓN DE TEST MEJORADA
function testPlanificacionesJulio2025() {
  console.log('🧪 BACKEND: TEST - Verificando planificaciones julio 2025');
  
  const año = 2025;
  const mes = 6; // Julio (0-11)
  
  try {
    const resultado = getPlanificacionesDelMes(año, mes);
    
    console.log('📊 BACKEND: RESULTADO TEST:');
    console.log('- Año buscado:', año);
    console.log('- Mes buscado:', mes, '(Julio)');
    console.log('- Planificaciones encontradas:', resultado.length);
    
    if (resultado.length > 0) {
      console.log('- Primera planificación:', resultado[0]);
    } else {
      console.log('- Sin planificaciones encontradas');
    }
    
    return {
      año: año,
      mes: mes,
      planificaciones: resultado.length,
      datos: resultado
    };
    
  } catch (error) {
    console.error('❌ BACKEND: Error en test:', error);
    return {
      error: error.message
    };
  }
}

function getTemaConJerarquia(idTema) {
  try {
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    const temasSheet = spreadsheet.getSheetByName('Temas');
    const data = temasSheet.getDataRange().getValues();
    
    // Estructura: id_tema(0) | nombre(1) | nombre_completo(2) | prenombre(3) | nivel(4) | id_padre(5) | id_bloque(6) | pag_desde(7) | pag_hasta(8) | pag_totales(9) | maquetado(10)
    
    function encontrarTema(id) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == id) {
          return {
            id: data[i][0],
            nombre: data[i][1],
            nombreCompleto: data[i][2],
            prenombre: data[i][3],
            nivel: data[i][4],
            idPadre: data[i][5]
          };
        }
      }
      return null;
    }
    
    function construirJerarquia(tema) {
      const jerarquia = [];
      let temaActual = tema;
      
      while (temaActual) {
        const nombreDisplay = temaActual.prenombre ? 
          temaActual.prenombre + ' ' + temaActual.nombre : 
          temaActual.nombre;
        
        jerarquia.unshift(nombreDisplay); // Añadir al principio
        
        if (temaActual.idPadre) {
          temaActual = encontrarTema(temaActual.idPadre);
        } else {
          break;
        }
      }
      
      return jerarquia.join(' → ');
    }
    
    const tema = encontrarTema(idTema);
    if (!tema) {
      return 'Tema ' + idTema + ' (no encontrado)';
    }
    
    return construirJerarquia(tema);
    
  } catch (error) {
    console.error('Error al obtener jerarquía del tema:', error);
    return 'Tema ' + idTema;
  }
}

// AÑADIR estas funciones al final de planificacion.gs

// Cambiar oposición activa (la anterior pasa a "en_pausa")
function cambiarOposicionActiva(idNuevaOposicion) {
  try {
    console.log('🔄 Cambiando oposición activa a:', idNuevaOposicion);
    
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    const oposicionesSheet = spreadsheet.getSheetByName('Oposiciones');
    
    if (!oposicionesSheet) {
      throw new Error('Hoja Oposiciones no encontrada');
    }
    
    const data = oposicionesSheet.getDataRange().getValues();
    
    // Estructura: id_oposicion | nombre | estado | fecha_estado
    const COLUMNAS = {
      id_oposicion: 0,
      nombre: 1,
      estado: 2,
      fecha_estado: 3
    };
    
    // 1. Cambiar todas las oposiciones activas a "en_pausa"
    for (let i = 1; i < data.length; i++) {
      if (data[i][COLUMNAS.estado] === 'activa') {
        oposicionesSheet.getRange(i + 1, COLUMNAS.estado + 1).setValue('en_pausa');
        oposicionesSheet.getRange(i + 1, COLUMNAS.fecha_estado + 1).setValue(new Date());
        console.log('📋 Oposición pausada:', data[i][COLUMNAS.nombre]);
      }
    }
    
    // 2. Activar la nueva oposición
    for (let i = 1; i < data.length; i++) {
      if (data[i][COLUMNAS.id_oposicion] == idNuevaOposicion) {
        oposicionesSheet.getRange(i + 1, COLUMNAS.estado + 1).setValue('activa');
        oposicionesSheet.getRange(i + 1, COLUMNAS.fecha_estado + 1).setValue(new Date());
        
        console.log('✅ Nueva oposición activa:', data[i][COLUMNAS.nombre]);
        
        return {
          success: true,
          oposicion: {
            id: data[i][COLUMNAS.id_oposicion],
            nombre: data[i][COLUMNAS.nombre],
            estado: 'activa'
          }
        };
      }
    }
    
    throw new Error('Oposición no encontrada');
    
  } catch (error) {
    console.error('❌ Error al cambiar oposición activa:', error);
    throw error;
  }
}

// AÑADIR esta función NUEVA al final de planificacion.gs

function getPlanificacionesDelMesNueva(año, mes) {
  console.log('🔥 NUEVA: Función ejecutándose para año:', año, 'mes:', mes);
  
  try {
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    const sheet = spreadsheet.getSheetByName('Planificacion_Temas');
    
    console.log('🔥 NUEVA: Hoja obtenida:', sheet ? 'SÍ' : 'NO');
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    console.log('🔥 NUEVA: Datos obtenidos, filas:', data.length);
    
    // Buscar datos específicos para julio 2025
    const resultados = [];
    
    for (let i = 1; i < data.length; i++) {
      const fila = data[i];
      
      // Verificar fecha en columna 6
      if (fila[6]) {
        const fecha = new Date(fila[6]);
        console.log('🔥 NUEVA: Fila', i, 'fecha:', fecha, 'año:', fecha.getFullYear(), 'mes:', fecha.getMonth());
        
        if (fecha.getFullYear() === 2025 && fecha.getMonth() === 6) {
          console.log('🔥 NUEVA: ¡MATCH! Fila', i, 'ID planificación:', fila[1]);
          
          resultados.push({
            id: fila[1],
            fecha: fecha,
            dia: fecha.getDate(),
            temas: [{
              id: fila[3],
              nombre: 'Tema ' + fila[3],
              tiempo: fila[9] || 0
            }],
            tiempoTotal: fila[9] || 0,
            estado: 'activo'
          });
        }
      }
    }
    
    console.log('🔥 NUEVA: Resultados finales:', resultados.length);
    return resultados;
    
  } catch (error) {
    console.error('🔥 NUEVA: Error:', error.message);
    return [];
  }
}

// Obtener todas las oposiciones con sus estados
function getTodasLasOposiciones() {
  try {
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    const oposicionesSheet = spreadsheet.getSheetByName('Oposiciones');
    
    if (!oposicionesSheet) {
      throw new Error('Hoja Oposiciones no encontrada');
    }
    
    const data = oposicionesSheet.getDataRange().getValues();
    
    const COLUMNAS = {
      id_oposicion: 0,
      nombre: 1,
      estado: 2,
      fecha_estado: 3
    };
    
    const oposiciones = [];
    
    for (let i = 1; i < data.length; i++) {
      oposiciones.push({
        id: data[i][COLUMNAS.id_oposicion],
        nombre: data[i][COLUMNAS.nombre],
        estado: data[i][COLUMNAS.estado] || 'en_pausa',
        fechaEstado: data[i][COLUMNAS.fecha_estado]
      });
    }
    
    return oposiciones.sort((a, b) => {
      if (a.estado === 'activa') return -1;
      if (b.estado === 'activa') return 1;
      return a.nombre.localeCompare(b.nombre);
    });
    
  } catch (error) {
    console.error('❌ Error al obtener todas las oposiciones:', error);
    return [];
  }
}

// Marcar oposición como completada y preparar siguiente vuelta
function completarOposicion(idOposicion) {
  try {
    console.log('🏁 Marcando oposición como completada:', idOposicion);
    
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    
    // 1. Marcar oposición como completada
    const oposicionesSheet = spreadsheet.getSheetByName('Oposiciones');
    const data = oposicionesSheet.getDataRange().getValues();
    
    const COLUMNAS = {
      id_oposicion: 0,
      nombre: 1,
      estado: 2,
      fecha_estado: 3
    };
    
    let nombreOposicion = '';
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][COLUMNAS.id_oposicion] == idOposicion) {
        oposicionesSheet.getRange(i + 1, COLUMNAS.estado + 1).setValue('completada');
        oposicionesSheet.getRange(i + 1, COLUMNAS.fecha_estado + 1).setValue(new Date());
        nombreOposicion = data[i][COLUMNAS.nombre];
        break;
      }
    }
    
    // 2. Actualizar configuración a siguiente vuelta
    const configSheet = spreadsheet.getSheetByName('Configuracion_Planificacion');
    if (configSheet) {
      const configData = configSheet.getDataRange().getValues();
      
      for (let i = 1; i < configData.length; i++) {
        if (configData[i][1] == idOposicion) { // id_oposicion en columna 1
          const vueltaActual = configData[i][2] || 1; // vuelta_actual en columna 2
          configSheet.getRange(i + 1, 3).setValue(vueltaActual + 1); // Incrementar vuelta
          configSheet.getRange(i + 1, 7).setValue(new Date()); // fecha_actualizacion
          break;
        }
      }
    }
    
    // 3. Resetear progreso de temas (marcar como no completados para nueva vuelta)
    const progresoSheet = spreadsheet.getSheetByName('Progreso_Temas');
    if (progresoSheet) {
      const progresoData = progresoSheet.getDataRange().getValues();
      
      // Esto sería más complejo - por ahora solo log
      console.log('📋 Preparando reset de temas para nueva vuelta...');
    }
    
    return {
      success: true,
      mensaje: `Oposición "${nombreOposicion}" completada. Preparada para vuelta ${(parseInt(data.find(row => row[0] == idOposicion)?.[2] || 1) + 1)}.`
    };
    
  } catch (error) {
    console.error('❌ Error al completar oposición:', error);
    throw error;
  }
}

// Función para obtener oposiciones ordenadas (también puede faltar)
function getOposicionesOrdenadas() {
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
    console.error('Error al obtener oposiciones ordenadas:', error);
    return [];
  }
}

// AUTO-TEST - AÑADIR AL FINAL de planificacion.gs
function autoTestRepasos() {
  console.log('🧪 AUTO-TEST REPASOS:', testRepasosDelDia());
}

// AÑADIR AL FINAL de planificacion.gs

function addPlanificacion(datosPlanificacion) {
  try {
    console.log('📝 Creando planificación:', datosPlanificacion);
    
    // Validar datos básicos
    if (!datosPlanificacion.fecha || !datosPlanificacion.idOposicion || !datosPlanificacion.temasSeleccionados) {
      throw new Error('Datos de planificación incompletos');
    }
    
    const spreadsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit');
    
    // Crear ID único para la planificación
    const idPlanificacion = new Date().getTime();
    const fecha = new Date(datosPlanificacion.fecha);
    
    // Acceder a las hojas
    const planificacionTemasSheet = spreadsheet.getSheetByName('Planificacion_Temas');
    const progresoTemasSheet = spreadsheet.getSheetByName('Progreso_Temas');
    
    if (!planificacionTemasSheet || !progresoTemasSheet) {
      throw new Error('Hojas de planificación no encontradas');
    }
    
    let temasCreados = 0;
    
    // Crear entrada para cada tema seleccionado
    datosPlanificacion.temasSeleccionados.forEach((tema, index) => {
      // Entrada en Planificacion_Temas
      // Estructura: id_planificacion_tema | id_planificacion | id_tema_padre | id_tema_actual | numero_slot | id_bloque | fecha_inicio | fecha_completado | estado | tiempo_estimado_minutos | tiempo_real_minutos
      const filaPlanificacion = [
        new Date().getTime() + index, // id_planificacion_tema único
        idPlanificacion,              // id_planificacion
        '',                          // id_tema_padre (vacío por ahora)
        tema.id,                     // id_tema_actual
        index + 1,                   // numero_slot
        tema.bloque || '',           // id_bloque
        fecha,                       // fecha_inicio
        '',                          // fecha_completado (vacío)
        'activo',                    // estado
        tema.tiempo || 0,            // tiempo_estimado_minutos
        0                           // tiempo_real_minutos
      ];
      
      planificacionTemasSheet.appendRow(filaPlanificacion);
      
      // Entrada en Progreso_Temas
      // Estructura: id_progreso | id_tema | id_planificacion | fecha_inicio | fecha_completado | estado | paginas_completadas | tiempo_dedicado_minutos | tiempo_asignado_minutos | tipo_seleccion | fecha_planificado
      const filaProgreso = [
        new Date().getTime() + index + 1000, // id_progreso único
        tema.id,                              // id_tema
        idPlanificacion,                      // id_planificacion
        fecha,                                // fecha_inicio
        '',                                   // fecha_completado (vacío)
        'planificado',                        // estado
        0,                                    // paginas_completadas
        0,                                    // tiempo_dedicado_minutos
        tema.tiempo || 0,                     // tiempo_asignado_minutos
        tema.tipo || 'hijo',                  // tipo_seleccion
        fecha                                 // fecha_planificado
      ];
      
      progresoTemasSheet.appendRow(filaProgreso);
      temasCreados++;
    });
    
    console.log('✅ Planificación creada exitosamente');
    
    return {
      success: true,
      idPlanificacion: idPlanificacion,
      temasCreados: temasCreados,
      fecha: datosPlanificacion.fecha
    };
    
  } catch (error) {
    console.error('❌ Error al crear planificación:', error);
    throw new Error('Error al crear planificación: ' + error.message);
  }
}
