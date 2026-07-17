const { Readable } = require('stream');
const ExcelJS = require('exceljs');

const HEADER_ALIASES = {
  truckNumber: ['truck number', 'truck_number', 'truck no', 'truck #', 'truck'],
  driverName: ['driver name', 'driver_name', 'driver'],
  batteryCount: ['battery count', 'battery_count', 'batteries', 'battery qty', 'qty'],
};
const REQUIRED_FIELDS = ['truckNumber', 'driverName', 'batteryCount'];

function normalizeHeader(value) {
  return String(value ?? '').trim().toLowerCase();
}

function matchField(header) {
  const normalized = normalizeHeader(header);
  return Object.keys(HEADER_ALIASES).find((field) =>
    HEADER_ALIASES[field].includes(normalized)
  );
}

async function loadWorksheet(buffer, filename) {
  const workbook = new ExcelJS.Workbook();
  const isCsv = /\.csv$/i.test(filename || '');

  if (isCsv) {
    await workbook.csv.read(Readable.from(buffer));
  } else {
    await workbook.xlsx.load(buffer);
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('File has no readable sheet');
  return worksheet;
}

// Reads a Truck Intake spreadsheet (.xlsx or .csv) and returns parsed rows.
// Each row is either { rowNumber, truckNumber, driverName, batteryCount }
// or { rowNumber, error } for rows that fail basic validation.
async function parseTruckIntakeSheet(buffer, filename) {
  const worksheet = await loadWorksheet(buffer, filename);

  const columnFields = {};
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    const field = matchField(cell.value);
    if (field) columnFields[colNumber] = field;
  });

  const foundFields = new Set(Object.values(columnFields));
  const missing = REQUIRED_FIELDS.filter((field) => !foundFields.has(field));
  if (missing.length) {
    throw new Error(
      `Missing required column(s): ${missing.join(', ')}. Expected headers like ` +
        '"Truck Number", "Driver Name", "Battery Count".'
    );
  }

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const record = {};
    row.eachCell((cell, colNumber) => {
      const field = columnFields[colNumber];
      if (field) record[field] = cell.value;
    });

    if (record.truckNumber == null && record.driverName == null && record.batteryCount == null) {
      return;
    }

    const truckNumber = String(record.truckNumber ?? '').trim();
    const driverName = String(record.driverName ?? '').trim();
    const batteryCount = Number(record.batteryCount);

    if (!truckNumber || !driverName || !Number.isFinite(batteryCount) || batteryCount <= 0) {
      rows.push({
        rowNumber,
        error: `Invalid row (truck="${truckNumber}", driver="${driverName}", batteries="${record.batteryCount}")`,
      });
      return;
    }

    rows.push({ rowNumber, truckNumber, driverName, batteryCount });
  });

  return rows;
}

module.exports = { parseTruckIntakeSheet };
