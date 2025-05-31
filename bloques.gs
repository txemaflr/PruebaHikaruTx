// Vincular tema de nivel 1 a un bloque
function vincularTemaABloque(idBloque, idTema) {
  const temasSheet = getGoogleSheet('Temas');
  const bloquesSheet = getGoogleSheet('Bloques');
  const temasColumns = getColumnIndices('Temas');
  const bloquesColumns = getColumnIndices('Bloques');
  const temasData = temasSheet.getDataRange().getValues();
  const bloquesData = bloquesSheet.getDataRange().getValues();

  // Buscar el tema seleccionado
  const temaRow = temasData.find(row => String(row[temasColumns['id_tema']]) === String(idTema));
  if (!temaRow) {
    throw new Error(`El tema seleccionado no existe.`);
  }

  const temaNombre = `${temaRow[temasColumns['prenombre']] || ''} ${temaRow[temasColumns['nombre']]}`.trim();

  // Buscar el bloque seleccionado
  const bloqueRow = bloquesData.find(row => String(row[bloquesColumns['id_bloque']]) === String(idBloque));
  if (!bloqueRow) {
    throw new Error(`El bloque seleccionado no existe.`);
  }

  const bloqueNombre = bloqueRow[bloquesColumns['nombre']];

  // Verificar si el tema ya está vinculado a otro bloque
  if (temaRow[temasColumns['id_bloque']]) {
    throw new Error(`El tema "${temaNombre}" ya está vinculado a otro bloque.`);
  }

  // Verificar si el tema es de nivel 1
  if (temaRow[temasColumns['nivel']] !== 1) {
    throw new Error(`Solo se pueden vincular temas de nivel 1. "${temaNombre}" no es de nivel 1.`);
  }

  // Asignar el bloque al tema
  const temaIndex = temasData.findIndex(row => String(row[temasColumns['id_tema']]) === String(idTema));
  temasSheet.getRange(temaIndex + 1, temasColumns['id_bloque'] + 1).setValue(idBloque);

  return `Tema "${temaNombre}" vinculado correctamente al bloque "${bloqueNombre}".`;
}

function getTemasPorBloqueConNombre(idBloque) {
  const temasSheet = getGoogleSheet('Temas');
  const temasColumns = getColumnIndices('Temas');
  const temasData = temasSheet.getDataRange().getValues();
  temasData.shift(); // Eliminar encabezados

  // Filtrar los temas vinculados al bloque específico
  const temasVinculados = temasData
    .filter(row => String(row[temasColumns['id_bloque']]) === String(idBloque) && row[temasColumns['nivel']] === 1) // Solo temas de nivel 1
    .map(row => ({
      id: row[temasColumns['id_tema']],
      nombre: row[temasColumns['nombre']]
    }));

  // Obtener el nombre del bloque
  const bloquesSheet = getGoogleSheet('Bloques');
  const bloquesColumns = getColumnIndices('Bloques');
  const bloquesData = bloquesSheet.getDataRange().getValues();
  bloquesData.shift(); // Eliminar encabezados

  const bloque = bloquesData.find(row => String(row[bloquesColumns['id_bloque']]) === String(idBloque));
  const nombreBloque = bloque ? bloque[bloquesColumns['nombre']] : 'Bloque desconocido';

  return {
    nombreBloque,
    temas: temasVinculados
  };
}

// Obtener los bloques con sus temas vinculados (solo temas de nivel 1)
function getBloquesConTemas() {
  const bloquesSheet = getGoogleSheet('Bloques');
  const temasSheet = getGoogleSheet('Temas');
  const bloquesColumns = getColumnIndices('Bloques');
  const temasColumns = getColumnIndices('Temas');

  const bloquesData = bloquesSheet.getDataRange().getValues();
  const temasData = temasSheet.getDataRange().getValues();

  bloquesData.shift(); // Eliminar encabezados
  temasData.shift(); // Eliminar encabezados

  return bloquesData.map(bloque => {
    const idBloque = bloque[bloquesColumns['id_bloque']];
    const bloqueNombre = bloque[bloquesColumns['nombre']];
    
    const temasEnBloque = temasData
      .filter(tema => String(tema[temasColumns['id_bloque']]) === String(idBloque) && tema[temasColumns['nivel']] === 1)
      .map(tema => ({
        id: tema[temasColumns['id_tema']],
        nombre: `${tema[temasColumns['prenombre']] || ''} ${tema[temasColumns['nombre']]}`.trim(),
      }));

    return {
      id: idBloque,
      nombre: bloqueNombre,
      temas: temasEnBloque.length > 0 ? temasEnBloque : [{ nombre: 'Sin temas asignados' }],
    };
  });
}

// Obtener bloques
function getBloques() {
  const sheet = getGoogleSheet('Bloques');
  const columns = getColumnIndices('Bloques');
  const data = sheet.getDataRange().getValues();
  data.shift(); // Eliminar encabezados

  return data.map(row => ({
    id: String(row[columns['id_bloque']]),
    nombre: row[columns['nombre']],
  }));
}

// Obtener temas sin bloque asignado
function getTemasSinBloque() {
  const temasSheet = getGoogleSheet('Temas');
  const temasColumns = getColumnIndices('Temas');
  const temasData = temasSheet.getDataRange().getValues();
  temasData.shift(); // Eliminar encabezados

  return temasData
    .filter(row => !row[temasColumns['id_bloque']]) // Temas sin bloque
    .map(row => ({
      id: String(row[temasColumns['id_tema']]),
      nombre: `${row[temasColumns['prenombre']] || ''} ${row[temasColumns['nombre']]}`.trim(),
      nivel: row[temasColumns['nivel']],
    }))
    .filter(tema => tema.nivel === 1); // Solo temas de nivel 1
}

// Función para agregar un bloque
function addBloque(nombre) {
  const sheet = getGoogleSheet('Bloques');
  const columns = getColumnIndices('Bloques');

  // Verificar unicidad del nombre
  if (!isNombreUnico('Bloques', 'nombre', nombre)) {
    throw new Error(`El nombre "${nombre}" ya existe. Por favor, elige otro.`);
  }

  // Generar ID único
  const uniqueId = generateUniqueId(sheet, columns['id_bloque']+1);

  // Agregar fila
  sheet.appendRow([uniqueId, nombre]);
  return `Bloque "${nombre}" añadido correctamente.`;
}

// Actualizar un bloque
function updateBloque(id, nuevoNombre) {
  const bloquesSheet = getGoogleSheet('Bloques');
  const columns = getColumnIndices('Bloques');
  const bloquesData = bloquesSheet.getDataRange().getValues();

  const nombreBloque = getNombreById('Bloques', 'id_bloque', 'nombre', id);
  if (!nombreBloque) {
    throw new Error(`No se encontró el bloque con ID ${id}.`);
  }

  // Verificar que el nombre sea único, excepto para el bloque que estamos actualizando
  const bloqueActual = bloquesData.find(row => String(row[columns['id_bloque']]) === String(id));
  if (!bloqueActual) {
    throw new Error(`Bloque con ID ${id} no encontrado.`);
  }

  // Verificar si el nombre ya existe en otra fila
    if (!isBloqueNombreUnicoParaActualizacion(id, nuevoNombre, bloquesData, columns) || nombreBloque == nuevoNombre) {
      throw new Error(`El nombre "${nuevoNombre}" ya existe. Por favor, elige otro.`);
    }

  for (let i = 1; i < bloquesData.length; i++) {
    if (bloquesData[i][columns['id_bloque']] == id) {
      bloquesSheet.getRange(i + 1, columns['nombre'] + 1).setValue(nuevoNombre);
      return `Bloque: "${nombreBloque}" se ha actualizado correctamente al nombre: "${nuevoNombre}".`;
    }
  }

  throw new Error(`Bloque con ID ${id} no encontrado.`);
}

// Verificar unicidad al actualizar
function isBloqueNombreUnicoParaActualizacion(id, nombre, data, columns) {
  return !data.some(row =>
    String(row[columns['nombre']]).toLowerCase() === nombre.toLowerCase() &&
    String(row[columns['id_bloque']]) !== String(id)
  );
}

function eliminarBloque(idBloque) {
  const bloquesSheet = getGoogleSheet('Bloques');
  const temasSheet = getGoogleSheet('Temas');
  const bloquesColumns = getColumnIndices('Bloques');
  const temasColumns = getColumnIndices('Temas');

  const nombreBloque = getNombreById('Bloques', 'id_bloque', 'nombre', idBloque);
    if (!nombreBloque) {
      throw new Error(`No se encontró el bloque con ID ${idBloque}.`);
    }

  const temasData = temasSheet.getDataRange().getValues();
  // Verificar si el bloque tiene temas asociados
  const tieneTemasAsociados = temasData.some(row => String(row[temasColumns['id_bloque']]) === String(idBloque));

  if (tieneTemasAsociados) {
    throw new Error('No se puede eliminar un bloque que tiene temas asociados.');
  }

  const bloquesData = bloquesSheet.getDataRange().getValues();
  const bloqueIndex = bloquesData.findIndex(row => String(row[bloquesColumns['id_bloque']]) === String(idBloque));

  if (bloqueIndex === -1) {
    throw new Error(`El bloque con ID ${idBloque} no existe.`);
  }

  // Eliminar la fila del bloque
  bloquesSheet.deleteRow(bloqueIndex + 1);
  return `Bloque "${nombreBloque}" eliminado correctamente.`;
}



// Desvincular un tema de un bloque (solo temas de nivel 1)
function desvincularTemaDeBloque(idBloque, idTema) {
  const temasSheet = getGoogleSheet('Temas');
  const temasColumns = getColumnIndices('Temas');
  const temasData = temasSheet.getDataRange().getValues();
  
  const temaNombre = getNombreById('Temas', 'id_tema', 'nombre', idTema);
  if (!temaNombre) {
    throw new Error(`No se encontró el tema con ID ${idTema}.`);
  }
  // Buscar el tema en la hoja de datos
  const temaIndex = temasData.findIndex(row => String(row[temasColumns['id_tema']]) === String(idTema));

  if (temaIndex === -1) {
    throw new Error(`El tema con ID ${idTema} no se encuentra en el bloque.`);
  }

  temasSheet.getRange(temaIndex + 1, temasColumns['id_bloque'] + 1).setValue(''); // Eliminar la relación con el bloque

  return `Tema "${temaNombre}" desvinculado correctamente del bloque.`;
}


function getBloquesOrdenados() {
  const sheet = getGoogleSheet('Bloques');
  const columns = getColumnIndices('Bloques');
  const data = sheet.getDataRange().getValues();
  data.shift(); // Eliminar encabezados

  return data
    .sort((a, b) => a[columns['nombre']].localeCompare(b[columns['nombre']]))
    .map(row => ({
      id: String(row[columns['id_bloque']]),
      nombre: row[columns['nombre']]
    }));
}


