import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BRAND_COLOR = [22, 101, 52]; // brand-800-ish green
const SLATE = [71, 85, 105];
const LIGHT_SLATE = [148, 163, 184];

function formatMoney(value) {
  return `GBP ${Number(value).toFixed(2)}`;
}

// A repair's own price snapshot, plus any labor charge billed on it — the
// labor_charge field is only present on rows fetched from the battery's
// full history; rows built right after a Log Repair submission already
// have it folded into `price`, so this is a no-op for those.
function lineAmount(r) {
  return Number(r.price) + (Number(r.labor_charge) || 0);
}

// Builds a one-page, itemized invoice PDF for the given repair-history rows
// (part name, staff name, and the repair's stored price snapshot — every
// repair is always exactly one unit of one part) against a battery. Returns
// the doc and its invoice number rather than saving it directly, so callers
// can preview (blob URL) or download (save) the same document.
export function buildBatteryInvoice(battery, history) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const invoiceNumber = `INV-${battery.battery_code}-${Date.now().toString().slice(-6)}`;
  const total = history.reduce((sum, r) => sum + lineAmount(r), 0);

  // Header band
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pageWidth, 90, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Refurbinics', margin, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Battery Repair Invoice', margin, 65);

  doc.setFontSize(11);
  doc.text(invoiceNumber, pageWidth - margin, 45, { align: 'right' });
  doc.text(new Date().toLocaleDateString('en-GB'), pageWidth - margin, 62, { align: 'right' });

  // Battery summary block
  let y = 120;
  doc.setTextColor(...SLATE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`Battery ${battery.battery_code}`, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...LIGHT_SLATE);
  y += 18;
  doc.text(`Status: ${battery.status.replace(/_/g, ' ')}`, margin, y);
  if (battery.intake_truck_number) {
    y += 16;
    doc.text(
      `Intake: Truck ${battery.intake_truck_number} - Driver ${battery.intake_driver_name}`,
      margin,
      y
    );
  }

  // Line items
  autoTable(doc, {
    startY: y + 24,
    margin: { left: margin, right: margin },
    head: [['Date', 'Part Changed', 'Staff', 'Amount']],
    body: history.map((r) => [
      new Date(r.repaired_at).toLocaleDateString('en-GB'),
      r.part_name,
      r.staff_name,
      formatMoney(lineAmount(r)),
    ]),
    headStyles: { fillColor: BRAND_COLOR, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 8, textColor: SLATE },
    alternateRowStyles: { fillColor: [246, 250, 247] },
    columnStyles: { 3: { halign: 'right' } },
  });

  const finalY = doc.lastAutoTable.finalY + 24;

  // Total
  doc.setFillColor(246, 250, 247);
  doc.rect(pageWidth - margin - 200, finalY - 18, 200, 32, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BRAND_COLOR);
  doc.text('Total', pageWidth - margin - 190, finalY + 3);
  doc.text(formatMoney(total), pageWidth - margin - 10, finalY + 3, { align: 'right' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...LIGHT_SLATE);
  doc.text(
    `Generated ${new Date().toLocaleString('en-GB')} - Refurbinics battery repair tracking`,
    margin,
    doc.internal.pageSize.getHeight() - 30
  );

  return { doc, invoiceNumber };
}

// Builds and immediately downloads the invoice for every repair logged
// against a battery (the Battery Detail page's "Download Invoice" button).
function generateBatteryInvoice(battery, history) {
  const { doc, invoiceNumber } = buildBatteryInvoice(battery, history);
  doc.save(`${invoiceNumber}.pdf`);
}

export default generateBatteryInvoice;
