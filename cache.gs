// cache.gs - Sistema de caché para mejorar el rendimiento

const CACHE_DURATION = 300; // 5 minutos en segundos
const CACHE_PREFIX = 'OPO_'; // Prefijo para identificar nuestras claves

// Obtener datos del caché
function getCachedData(key) {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(CACHE_PREFIX + key);
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    console.error('Error al leer caché:', e);
    return null;
  }
}

// Guardar datos en caché
function setCachedData(key, data, duration = CACHE_DURATION) {
  try {
    const cache = CacheService.getScriptCache();
    const dataStr = JSON.stringify(data);
    
    // CacheService tiene límite de 100KB por entrada
    if (dataStr.length > 100000) {
      console.warn('Datos demasiado grandes para caché:', key);
      return false;
    }
    
    cache.put(CACHE_PREFIX + key, dataStr, duration);
    return true;
  } catch (e) {
    console.error('Error al guardar en caché:', e);
    return false;
  }
}

// Invalidar caché específico
function invalidateCache(keys) {
  try {
    const cache = CacheService.getScriptCache();
    const keysWithPrefix = Array.isArray(keys) 
      ? keys.map(k => CACHE_PREFIX + k)
      : [CACHE_PREFIX + keys];
    
    cache.removeAll(keysWithPrefix);
    return true;
  } catch (e) {
    console.error('Error al invalidar caché:', e);
    return false;
  }
}

// Limpiar todo el caché
function clearAllCache() {
  try {
    const cache = CacheService.getScriptCache();
    // No hay método para limpiar todo, así que invalidamos las claves conocidas
    const commonKeys = [
      'oposiciones', 'bloques', 'temas', 'conceptos',
      'temasArbol', 'tiposConcepto', 'estadisticas'
    ];
    
    invalidateCache(commonKeys);
    return true;
  } catch (e) {
    console.error('Error al limpiar caché:', e);
    return false;
  }
}

// Decorador para cachear funciones automáticamente
function withCache(key, func, duration = CACHE_DURATION) {
  const cached = getCachedData(key);
  if (cached !== null) {
    return cached;
  }
  
  const result = func();
  setCachedData(key, result, duration);
  return result;
}

// Ejemplo de uso en tus funciones existentes:
// En lugar de:
// function getOposiciones() {
//   const sheet = getGoogleSheet('Oposiciones');
//   return sheet.getDataRange().getValues();
// }
//
// Puedes hacer:
// function getOposicionesCached() {
//   return withCache('oposiciones', () => {
//     const sheet = getGoogleSheet('Oposiciones');
//     return sheet.getDataRange().getValues();
//   });
// }
