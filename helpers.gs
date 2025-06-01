// Obtiene la hoja de google sheets que actua de base de datos para la aplicación.
function getGoogleSheet(sheetName) {
   try {
    var sheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1gJAbVASKrEvp2lR1yCO7Yn0obPlY6C6gCPd7Lgpm8n0/edit').getSheetByName(sheetName);
    if (!sheet) throw new Error('La hoja ' + sheetName + ' no existe');
    return sheet;
  } catch (e) {
    Logger.log('Error al acceder a la hoja: ' + e.message);
    throw e;
  }
}

//Obtiene el índice de las columnas de una hoja por sus nombres.
function getColumnIndices(sheetName) {
  const sheet = getGoogleSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const columnIndices = {};

  headers.forEach((header, index) => {
    columnIndices[header.trim()] = index;
  });

  return columnIndices;
}

// Función para generar IDs únicos, como buscar el valor máximo en la columna de IDs y sumarle 1.
function generateUniqueId(sheet, columnIndex) {
  const lastRow = sheet.getLastRow();
  
  // Si solo hay encabezados o está vacía, comenzar desde 1
  if (lastRow <= 1) {
    return 1;
  }

  // Asegúrate de que columnIndex sea válido
    if (columnIndex < 1) {
      throw new Error('El índice de columna no puede ser menor que 1.');
    }

  // Obtener datos de la columna específica desde la segunda fila
  const data = sheet.getRange(2, columnIndex, lastRow - 1, 1).getValues();
  const ids = data.map(row => parseInt(row[0], 10)).filter(id => !isNaN(id));
  
  // Devolver el ID más alto + 1 o comenzar en 1 si no hay IDs válidos
  return ids.length > 0 ? Math.max(...ids) + 1 : 1;
}

//Verifica si un nombre es único en una columna específica.
function isNombreUnico(sheetName, columnName, nombre) {
  const sheet = getGoogleSheet(sheetName);
  const columns = getColumnIndices(sheetName);
  const data = sheet.getDataRange().getValues();
  data.shift(); // Eliminar encabezados
  return !data.some(row => String(row[columns[columnName]]).toLowerCase() === nombre.toLowerCase());
}

// Función Genérica para Obtener un Nombre a partir de un ID
function getNombreById(sheetName, idColumnName, nameColumnName, idValue) {
  const sheet = getGoogleSheet(sheetName);
  const columns = getColumnIndices(sheetName);
  const data = sheet.getDataRange().getValues();

  // Buscar el nombre basado en el ID
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][columns[idColumnName]]) === String(idValue)) {
      return data[i][columns[nameColumnName]]; // Retorna el nombre si lo encuentra
    }
  }
  
  return null; // Retorna null si no encuentra el ID
}
