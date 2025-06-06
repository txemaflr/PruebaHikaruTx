// Obtener oposiciones ordenadas
function getOposicionesOrdenadas() {
  const sheet = getGoogleSheet('Oposiciones');
  const columns = getColumnIndices('Oposiciones');
  const data = sheet.getDataRange().getValues();
  data.shift(); // Eliminar encabezados
  return data.map(row => ({
    id: row[columns['id_oposicion']],
    nombre: row[columns['nombre']]
  }));
}

function addOposicion(nombre) {
  const sheet = getGoogleSheet('Oposiciones');
  const columns = getColumnIndices('Oposiciones');

  // Verificar unicidad del nombre
  if (!isNombreUnico('Oposiciones', 'nombre', nombre)) {
      throw new Error(`El nombre "${nombre}" ya existe. Por favor, elige otro.`);
  }

  // Generar un ID único
  console.info('la columna id: '+ columns['id_oposicion']);
  console.info('la columna nombre: '+ columns['nombre']);
  console.info('la columna no existe: '+ columns['id']);
  const uniqueId = generateUniqueId(sheet, columns['id_oposicion']+1);
  
  // Agregar oposición con ID único (agregar fila)
  sheet.appendRow([uniqueId, nombre]); 
  return `Oposición "${nombre}" añadida correctamente.`;
  invalidarCacheOposiciones();
}

// Actualizar una oposición
function updateOposicion(id, nuevoNombre) {
  const sheet = getGoogleSheet('Oposiciones');
  const columns = getColumnIndices('Oposiciones');
  const data = sheet.getDataRange().getValues();

  // Extraer el nombre de la Oposicion
  const nombreOposicion = getNombreById('Oposiciones', 'id_oposicion', 'nombre', id);
  if (!nombreOposicion) {
    throw new Error(`No se encontró la oposición con ID ${id}.`);
  }

  // Verificar si el nombre ya existe en otra fila
  if (!isOposicionNombreUnicoParaActualizacion(id, nuevoNombre, data, columns) || (nombreOposicion == nuevoNombre)) {
    throw new Error(`El nombre "${nuevoNombre}" ya existe. Por favor, elige otro.`);
  }

  // Actualizar el nombre de la oposición
  for (let i = 1; i < data.length; i++) {
    if (data[i][columns['id_oposicion']] == id) {
      sheet.getRange(i + 1, columns['nombre'] + 1).setValue(nuevoNombre);
      return `Oposición actualizada correctamente: "${nuevoNombre}".`;
    }
  }

  throw new Error(`Oposición con ID ${id} no encontrada.`);
  invalidarCacheOposiciones();
}

// Verificar unicidad al actualizar
function isOposicionNombreUnicoParaActualizacion(id, nombre, data, columns) {
  return !data.some(row =>
    String(row[columns['nombre']]).toLowerCase() === nombre.toLowerCase() &&
    String(row[columns['id_oposicion']]) !== String(id)
  );
}

// Eliminar una oposición y los temas que tiene vinculados
function deleteOposicion(id) {
  const oposicionSheet = getGoogleSheet('Oposiciones');
  const temaOposicionSheet = getGoogleSheet('Tema_Oposicion');
  const oposicionColumns = getColumnIndices('Oposiciones');
  const temaOposicionColumns = getColumnIndices('Tema_Oposicion');
  const oposicionesData = oposicionSheet.getDataRange().getValues();
  const temaOposicionData = temaOposicionSheet.getDataRange().getValues();

  // Eliminar registros en la entidad Tema_Oposicion
  const rowsToDelete = [];
  for (let i = 1; i < temaOposicionData.length; i++) {
    if (temaOposicionData[i][temaOposicionColumns['id_oposicion']] == id) {
      rowsToDelete.push(i + 1);
    }
  }

  rowsToDelete.reverse().forEach(rowIndex => temaOposicionSheet.deleteRow(rowIndex));
  let nombreOposicion = null;

  // Eliminar la oposición
  for (let i = 1; i < oposicionesData.length; i++) {
    if (oposicionesData[i][oposicionColumns['id_oposicion']] == id) {
      nombreOposicion = oposicionesData[i][oposicionColumns['nombre']];
      oposicionSheet.deleteRow(i + 1);
      return `Oposición "${nombreOposicion}" eliminada correctamente.`;
    }
  }

  throw new Error(`Oposición con ID ${id} no encontrada.`);
  invalidarCacheOposiciones();
}

function getTemasDisponiblesParaOposicion(idOposicion) {
  const temaOposicionSheet = getGoogleSheet('Tema_Oposicion');
  const temasArbol = getTemasEnArbol(); // Obtener la jerarquía completa
  const temaOposicionData = temaOposicionSheet.getDataRange().getValues().slice(1); // Sin encabezados
  const temaOposicionColumns = getColumnIndices('Tema_Oposicion');

  // Obtener IDs de temas ya vinculados
  const temasVinculadosIds = temaOposicionData
    .filter(row => String(row[temaOposicionColumns['id_oposicion']]) === String(idOposicion))
    .map(row => String(row[temaOposicionColumns['id_tema']]));

  const temasDisponibles = [];

  // Función para buscar temas disponibles
  function buscarTemasDisponibles(tema) {
    const temaId = String(tema.id);
    const hijosDisponibles = tema.hijos.filter(hijo => !temasVinculadosIds.includes(String(hijo.id)));

    if (!temasVinculadosIds.includes(temaId) || hijosDisponibles.length > 0) {
      // Añadir tema si no está vinculado o tiene hijos disponibles
      temasDisponibles.push({
        id: tema.id,
        nombre: tema.nombre,
        prenombre: tema.prenombre || '',
        nivel: tema.nivel,
      });
    }

    // Continuar búsqueda en los hijos
    tema.hijos.forEach(hijo => buscarTemasDisponibles(hijo));
  }

  temasArbol.forEach(tema => buscarTemasDisponibles(tema));

  // Ordenar los temas
  return temasDisponibles.sort((a, b) => {
    if (a.nivel === b.nivel) {
      return a.prenombre.localeCompare(b.prenombre) || a.nombre.localeCompare(b.nombre);
    }
    return a.nivel - b.nivel;
  });
}

// Obtener las oposiciones que hay
function getOposiciones() {
  const sheet = getGoogleSheet('Oposiciones'); // Nombre de la hoja donde se almacenan las oposiciones
  const columns = getColumnIndices('Oposiciones'); // Indices de columnas
  const data = sheet.getDataRange().getValues(); // Obtener todos los datos de la hoja
  data.shift(); // Eliminar encabezados

  return data.map(row => ({
    id: row[columns['id_oposicion']], // Columna que contiene el ID de la oposición
    nombre: row[columns['nombre']]   // Columna que contiene el nombre de la oposición
  }));
}

function desvincularTemaAOposicion(idTema) {
  const temasSheet = getGoogleSheet('Temas');
  const temasColumns = getColumnIndices('Temas');
  const temasData = temasSheet.getDataRange().getValues();

  // Verificar si el tema tiene hijos
  const tieneHijos = temasData.some(row => row[temasColumns['id_padre']] == idTema);

  if (tieneHijos) {
    throw new Error('El tema no se puede desvincular porque tiene temas hijos vinculados.');
  }

  // Si no tiene hijos, eliminar de Tema_Oposicion
  const temaOposicionSheet = getGoogleSheet('Tema_Oposicion');
  const temaOposicionColumns = getColumnIndices('Tema_Oposicion');
  const temaOposicionData = temaOposicionSheet.getDataRange().getValues();

  for (let i = 1; i < temaOposicionData.length; i++) {
    if (temaOposicionData[i][temaOposicionColumns['id_tema']] == idTema) {
      temaOposicionSheet.deleteRow(i + 1); // Eliminar fila correspondiente
      return `Tema con ID ${idTema} desvinculado correctamente.`;
    }
  }

  throw new Error(`No se encontró la relación para el tema con ID ${idTema}.`);
}

// Obtener los temas vinculados a una oposición específica
function getTemasPorOposicion(idOposicion) {
  const temaOposicionSheet = getGoogleSheet('Tema_Oposicion');
  const temasSheet = getGoogleSheet('Temas');
  const temaOposicionColumns = getColumnIndices('Tema_Oposicion');
  const temasColumns = getColumnIndices('Temas');

  const temaOposicionData = temaOposicionSheet.getDataRange().getValues();
  const temasData = temasSheet.getDataRange().getValues();
  temasData.shift(); // Eliminar encabezados

  // Filtrar temas vinculados a esta oposición
  const temasVinculados = temaOposicionData
    .filter(row => row[temaOposicionColumns['id_oposicion']] == idOposicion)
    .map(row => row[temaOposicionColumns['id_tema']]);

  // Obtener los nombres de los temas vinculados
  return temasData
    .filter(row => temasVinculados.includes(row[temasColumns['id_tema']]))
    .map(row => ({
      id: row[temasColumns['id_tema']],
      nombre: row[temasColumns['nombre']]
    }));
}

function vincularTemaConHijos(idOposicion, idTema) {
  const temaOposicionSheet = getGoogleSheet('Tema_Oposicion');
  const temasArbol = getTemasEnArbol(); // Obtener jerarquía completa
  const temasAVincular = []; // Usamos un array para permitir el uso de push

  const nombreOposicion = getNombreById('Oposiciones', 'id_oposicion', 'nombre', idOposicion);
  if (!nombreOposicion) {
    throw new Error(`No se encontró la oposición con ID ${idOposicion}.`);
  }
  const temaNombre = getNombreById('Temas', 'id_tema', 'nombre', idTema);
  if (!temaNombre) {
    throw new Error(`No se encontró el tema con ID ${idTema}.`);
  }

  // Función para buscar padres, el tema seleccionado y sus hijos
  function buscarTemas(tema, idTemaBuscado) {
    console.info(`Revisando tema: ${tema.id}, Buscado: ${idTemaBuscado}`);
    if (String(tema.id) === String(idTemaBuscado)) { // Conversión a String para comparación
      console.info(`Tema encontrado: ${tema.id} (${tema.nombre})`);
      temasAVincular.push(tema); // Añadir tema al array
      tema.hijos.forEach(hijo => buscarTemas(hijo, hijo.id)); // Añadir hijos
      return true;
    }

    // Buscar en los hijos
    const encontradoEnHijos = tema.hijos.some(hijo => buscarTemas(hijo, idTemaBuscado));
    if (encontradoEnHijos) {
      console.info(`Tema padre encontrado: ${tema.id} (${tema.nombre})`);
      temasAVincular.push(tema); // Añadir el padre si se encontró en sus hijos
    }

    return encontradoEnHijos;
  }

  // Buscar el tema seleccionado en todo el árbol
  temasArbol.forEach(tema => buscarTemas(tema, idTema));

  // Buscar todos los padres del tema seleccionado hasta la raíz
  function buscarPadres(idTemaBuscado) {
    temasArbol.forEach(function buscarRecursivo(tema) {
      if (tema.hijos.some(hijo => String(hijo.id) === String(idTemaBuscado))) { // Conversión a String
        console.info(`Padre encontrado: ${tema.id} (${tema.nombre})`);
        temasAVincular.push(tema); // Añadir el padre
        buscarPadres(tema.id); // Buscar padres del padre
      }
      tema.hijos.forEach(buscarRecursivo); // Continuar búsqueda
    });
  }
  buscarPadres(idTema); // Añadir padres

  // Eliminar duplicados en temasAVincular
  const temasUnicos = Array.from(new Set(temasAVincular.map(t => String(t.id)))).map(id =>
    temasAVincular.find(t => String(t.id) === id)
  );

  // Vincular temas al Google Sheet
  const temaOposicionData = temaOposicionSheet.getDataRange().getValues().slice(1); // Quitar encabezados
  const temaOposicionColumns = getColumnIndices('Tema_Oposicion');

  temasUnicos.forEach(tema => {
    const yaVinculado = temaOposicionData.some(row => {
      return String(row[temaOposicionColumns['id_oposicion']]) === String(idOposicion) &&
             String(row[temaOposicionColumns['id_tema']]) === String(tema.id);
    });

    if (!yaVinculado) {
      try {
        console.info(`Insertando: id_oposicion=${idOposicion}, id_tema=${tema.id}`);
        // Aquí se corrige el orden de los datos
        temaOposicionSheet.appendRow([tema.id,idOposicion]);
      } catch (error) {
        console.info(`Error al insertar: ${error.message}`);
      }
    }
  });

  return `Tema con ID ${idTema}, sus padres y sus hijos vinculados correctamente a la oposición ${idOposicion}.`;
}

function getTemasVinculadosEnArbol(idOposicion) {
  const temasArbol = getTemasEnArbol();
  const temaOposicionSheet = getGoogleSheet('Tema_Oposicion');
  const temaOposicionColumns = getColumnIndices('Tema_Oposicion');
  const temaOposicionData = temaOposicionSheet.getDataRange().getValues();

  // Filtrar temas vinculados a la oposición
  const temasVinculadosIds = temaOposicionData
    .filter(row => row[temaOposicionColumns['id_oposicion']] == idOposicion)
    .map(row => row[temaOposicionColumns['id_tema']]);

  // Filtrar jerarquía para incluir solo temas vinculados
  function filtrarJerarquia(temas) {
    return temas
      .filter(tema => temasVinculadosIds.includes(tema.id))
      .map(tema => ({ ...tema, hijos: filtrarJerarquia(tema.hijos) }));
  }

  return filtrarJerarquia(temasArbol);
}

function getTemasVinculadosEnArbolOrdenados(idOposicion) {
  console.log("Dentro de getTemasVinculadosEnArbolOrdenados y el idOposicion: "+idOposicion);
  const temasArbol = getTemasEnArbolOrdenados(); // Obtener árbol completo
  const temaOposicionSheet = getGoogleSheet('Tema_Oposicion');
  const temaOposicionColumns = getColumnIndices('Tema_Oposicion');
  const temaOposicionData = temaOposicionSheet.getDataRange().getValues();

  // Filtrar temas vinculados a la oposición
  const temasVinculadosIds = temaOposicionData
    .filter(row => row[temaOposicionColumns['id_oposicion']] == idOposicion)
    .map(row => row[temaOposicionColumns['id_tema']]);

  // Filtrar jerarquía para incluir solo temas vinculados
  function filtrarJerarquia(temas) {
    return temas
      .filter(tema => temasVinculadosIds.includes(tema.id))
      .map(tema => ({
        ...tema,
        hijos: filtrarJerarquia(tema.hijos)
      }));
  }
  
  return filtrarJerarquia(temasArbol); // Devolver árbol jerárquico de temas vinculados
}

function getTemasDisponiblesEnArbol(idOposicion) {
  const temasSheet = getGoogleSheet('Temas');
  const temasColumns = getColumnIndices('Temas');
  const temasData = temasSheet.getDataRange().getValues().slice(1); // Quitar encabezados

  const temaOposicionSheet = getGoogleSheet('Tema_Oposicion');
  const temaOposicionColumns = getColumnIndices('Tema_Oposicion');
  const temaOposicionData = temaOposicionSheet.getDataRange().getValues().slice(1); // Quitar encabezados

  // Paso 1: Crear listaV (temas ya vinculados)
  const listaV = temaOposicionData
    .filter(row => String(row[temaOposicionColumns['id_oposicion']]) === String(idOposicion))
    .map(row => String(row[temaOposicionColumns['id_tema']]));

  // Paso 2: Crear listaNV (temas no vinculados)
  const listaNV = [];
  temasData.forEach(row => {
    const idTema = String(row[temasColumns['id_tema']]);
    if (!listaV.includes(idTema)) {
      listaNV.push({
        id: idTema,
        nombre: row[temasColumns['nombre']],
        prenombre: row[temasColumns['prenombre']] || '',
        nivel: row[temasColumns['nivel']],
        idPadre: row[temasColumns['id_padre']] ? String(row[temasColumns['id_padre']]) : null,
      });
    }
  });

  // Paso 3: Agregar temas padres para cada tema en listaNV
  const listaFinal = [];
  const temasMap = new Map(); // Mapa para buscar temas por ID rápidamente

  // Crear un mapa de los temas para referencia rápida
  temasData.forEach(row => {
    temasMap.set(String(row[temasColumns['id_tema']]), {
      id: String(row[temasColumns['id_tema']]),
      nombre: row[temasColumns['nombre']],
      prenombre: row[temasColumns['prenombre']] || '',
      nivel: row[temasColumns['nivel']],
      idPadre: row[temasColumns['id_padre']] ? String(row[temasColumns['id_padre']]) : null,
    });
  });

  // Función recursiva para agregar un tema y todos sus padres
  function agregarTemaYPadres(tema) {
    if (!tema || listaFinal.some(t => t.id === tema.id)) {
      return; // Evitar duplicados
    }

    listaFinal.push(tema);

    if (tema.idPadre) {
      const padre = temasMap.get(tema.idPadre);
      agregarTemaYPadres(padre);
    }
  }

  listaNV.forEach(tema => agregarTemaYPadres(tema));

  // Paso 4: Ordenar y formatear en formato árbol
  function ordenarYFormatear(temas, nivel = 0) {
    return temas
      .sort((a, b) => {
        if (a.nivel === b.nivel) {
          return a.prenombre.localeCompare(b.prenombre) || a.nombre.localeCompare(b.nombre);
        }
        return a.nivel - b.nivel;
      })
      .flatMap(tema => [
        {
          id: tema.id,
          nombre: `${'--'.repeat(nivel)} ${tema.prenombre ? tema.prenombre + ' ' : ''}${tema.nombre}`,
          prenombre: tema.prenombre || '',
          nivel: nivel + 1,
        },
        ...ordenarYFormatear(listaFinal.filter(t => t.idPadre === tema.id), nivel + 1),
      ]);
  }

  return ordenarYFormatear(listaFinal.filter(t => !t.idPadre)); // Filtrar raíces para el árbol
}


