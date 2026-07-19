import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export const ROWS = 9;
export const DEFAULT_COLUMNS = 5;
export const SHEET_SIZE = DEFAULT_COLUMNS * ROWS; // 45 QR codes per A4 sheet, at the default column count

// Lays a batch of already-generated batteries out as a `columns`-across x
// 9-down grid — one QR code plus its Battery Number underneath each — so a
// print run can be downloaded and cut apart in one go instead of one QR code
// at a time. The admin picks where to start, how many to include, and how
// many per row (GenerateQrPage); once the per-page count (columns x ROWS) is
// exceeded this spills onto additional A4 pages in the same PDF rather than
// overflowing one page. Returns the built doc so callers can either preview
// it (blob URL, in a new tab) or save it straight to disk with the same
// layout.
export async function buildQrSheet(batteries, columns = DEFAULT_COLUMNS) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 24;
  const cellWidth = (pageWidth - margin * 2) / columns;
  const cellHeight = (pageHeight - margin * 2) / ROWS;
  const labelSpace = 16;
  const qrSize = Math.min(cellWidth, cellHeight - labelSpace) - 12;
  const pageSize = columns * ROWS;

  for (let i = 0; i < batteries.length; i += 1) {
    const battery = batteries[i];
    const positionOnPage = i % pageSize;
    if (i > 0 && positionOnPage === 0) doc.addPage();

    const col = positionOnPage % columns;
    const row = Math.floor(positionOnPage / columns);
    const cellX = margin + col * cellWidth;
    const cellY = margin + row * cellHeight;
    const qrX = cellX + (cellWidth - qrSize) / 2;
    const qrY = cellY + 6;

    const detailUrl = `${window.location.origin}/batteries/${encodeURIComponent(battery.battery_code)}`;
    // eslint-disable-next-line no-await-in-loop
    const dataUrl = await QRCode.toDataURL(detailUrl, { width: 300, margin: 1 });
    doc.addImage(dataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    const label = battery.serial_number || battery.battery_code;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    doc.text(label, cellX + cellWidth / 2, qrY + qrSize + 11, { align: 'center', maxWidth: cellWidth - 8 });
  }

  return doc;
}

function sheetFileName(batteries) {
  const first = batteries[0]?.battery_code || 'start';
  const last = batteries[batteries.length - 1]?.battery_code || 'end';
  return `qr-sheet-${first}-to-${last}.pdf`;
}

// Saves the built sheet straight to disk.
export async function downloadQrSheet(batteries, columns = DEFAULT_COLUMNS) {
  const doc = await buildQrSheet(batteries, columns);
  doc.save(sheetFileName(batteries));
}

// Opens the built sheet in a new browser tab (native PDF viewer) instead of
// downloading it, so the layout/labels can be checked before committing to
// paper.
export async function previewQrSheet(batteries, columns = DEFAULT_COLUMNS) {
  const doc = await buildQrSheet(batteries, columns);
  window.open(doc.output('bloburl'), '_blank');
}
