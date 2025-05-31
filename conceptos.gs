// conceptos.gs

function getConceptos() {
  const conceptosSheet = getGoogleSheet("Conceptos");
  const conceptosData = conceptosSheet.getDataRange().getValues();
  const conceptosHeaders = conceptosData[0];

  const relSheet = getGoogleSheet("Concepto_Tema");
  const relData = relSheet.getDataRange().getValues().slice(1);
  const conceptoTemaMap = {};
  relData.forEach(row => {
    const [id_concepto, id_tema] = row;
    if (!conceptoTemaMap[id_concepto]) conceptoTemaMap[id_concepto] = [];
    conceptoTemaMap[id_concepto].push(id_tema);
  });

  const temasSheet = getGoogleSheet("Temas");
  const temasData = temasSheet.getDataRange().getValues();
  const temasHeaders = temasData[0];
  const temasMap = {};
  temasData.slice(1).forEach(row => {
    const id = row[temasHeaders.indexOf("id_tema")];
    const nombre = row[temasHeaders.indexOf("nombre")];
    const prenombre = row[temasHeaders.indexOf("prenombre")] || "";
    temasMap[id] = `${prenombre} ${nombre}`.trim();
  });

  return conceptosData.slice(1).map(row => {
    const obj = {};
    conceptosHeaders.forEach((h, i) => obj[h] = row[i]);
    obj.revisar = obj.revisar === true || obj.revisar === "TRUE";
    const ids = conceptoTemaMap[obj.id_concepto] || [];
    obj.idTemas = ids;
    obj.temas = ids.map(id => temasMap[id] || id);
    return obj;
  });
}

function getTiposConcepto() {
  const sheet = getGoogleSheet("Tipos_Concepto");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1).map(row => {
    const tipo = {};
    headers.forEach((key, i) => tipo[key] = row[i]);
    return tipo;
  });
}

function addConcepto(nombre, id_tipo, importancia, descripcion, pista, tecnica, revisar, idTemas = []) {
  const conceptosSheet = getGoogleSheet("Conceptos");
  const data = conceptosSheet.getDataRange().getValues();
  const headers = data[0];

  if (data.slice(1).some(r => r[headers.indexOf("nombre")]?.toLowerCase() === nombre.toLowerCase())) {
    throw new Error("Ya existe un concepto con ese nombre.");
  }

  const lastId = Math.max(0, ...data.slice(1).map(r => Number(r[0]) || 0));
  const newId = lastId + 1;

  const fila = [];
  fila[headers.indexOf("id_concepto")] = newId;
  fila[headers.indexOf("nombre")] = nombre;
  fila[headers.indexOf("id_tipo")] = id_tipo;
  fila[headers.indexOf("importancia")] = importancia;
  fila[headers.indexOf("descripcion")] = descripcion;
  fila[headers.indexOf("pista")] = pista;
  fila[headers.indexOf("tecnica")] = tecnica;
  fila[headers.indexOf("revisar")] = revisar;

  conceptosSheet.appendRow(fila);

  const relSheet = getGoogleSheet("Concepto_Tema");
  idTemas.forEach(idTema => {
    relSheet.appendRow([newId, idTema]);
  });
}

function updateConcepto(id, nombre, id_tipo, importancia, descripcion, pista, tecnica, revisar, idTemas = []) {
  const conceptosSheet = getGoogleSheet("Conceptos");
  const data = conceptosSheet.getDataRange().getValues();
  const headers = data[0];
  const idx = data.findIndex(r => String(r[0]) === String(id));

  if (idx === -1) throw new Error("Concepto no encontrado");

  if (data.slice(1).some(r => String(r[0]) !== String(id) && r[headers.indexOf("nombre")]?.toLowerCase() === nombre.toLowerCase())) {
    throw new Error("Ya existe un concepto con ese nombre.");
  }

  data[idx][headers.indexOf("nombre")] = nombre;
  data[idx][headers.indexOf("id_tipo")] = id_tipo;
  data[idx][headers.indexOf("importancia")] = importancia;
  data[idx][headers.indexOf("descripcion")] = descripcion;
  data[idx][headers.indexOf("pista")] = pista;
  data[idx][headers.indexOf("tecnica")] = tecnica;
  data[idx][headers.indexOf("revisar")] = revisar;

  conceptosSheet.getRange(idx + 1, 1, 1, data[idx].length).setValues([data[idx]]);

  const relSheet = getGoogleSheet("Concepto_Tema");
  const relData = relSheet.getDataRange().getValues();
  for (let i = relData.length - 1; i > 0; i--) {
    if (String(relData[i][0]) === String(id)) {
      relSheet.deleteRow(i + 1);
    }
  }
  idTemas.forEach(idTema => {
    relSheet.appendRow([id, idTema]);
  });
}

function deleteConcepto(id) {
  const conceptosSheet = getGoogleSheet("Conceptos");
  const data = conceptosSheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[0]) === String(id));
  if (idx !== -1) {
    conceptosSheet.deleteRow(idx + 1);
  }

  const relSheet = getGoogleSheet("Concepto_Tema");
  const relData = relSheet.getDataRange().getValues();
  for (let i = relData.length - 1; i > 0; i--) {
    if (String(relData[i][0]) === String(id)) {
      relSheet.deleteRow(i + 1);
    }
  }
}

function getConceptoPorId(id) {
  const conceptosSheet = getGoogleSheet("Conceptos");
  const conceptosData = conceptosSheet.getDataRange().getValues();
  const headers = conceptosData[0];

  const relSheet = getGoogleSheet("Concepto_Tema");
  const relData = relSheet.getDataRange().getValues().slice(1);
  const idTemas = relData.filter(r => String(r[0]) === String(id)).map(r => r[1]);

  for (let i = 1; i < conceptosData.length; i++) {
    if (String(conceptosData[i][0]) === String(id)) {
      const obj = {};
      headers.forEach((h, idx) => obj[h] = conceptosData[i][idx]);
      obj.revisar = obj.revisar === true || obj.revisar === "TRUE";
      obj.idTemas = idTemas;
      return obj;
    }
  }
  throw new Error("Concepto no encontrado");
}
