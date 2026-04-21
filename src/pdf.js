function escapePdfText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, '');
}

function pdfLine(text, x, y, size = 11) {
  return `BT /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
}

function buildDietPdf(diet) {
  const lines = [
    pdfLine('GestaoDieta - Plano alimentar', 50, 780, 18),
    pdfLine(`Paciente: ${diet.patientName}`, 50, 750, 12),
    pdfLine(`Calorias alvo: ${diet.calories} kcal`, 50, 730, 12),
    pdfLine(`Macros: P ${diet.protein}g | C ${diet.carbs}g | G ${diet.fat}g`, 50, 712, 12)
  ];

  let y = 680;
  diet.meals.forEach((meal) => {
    lines.push(pdfLine(`${meal.name}: ${meal.calories} kcal`, 50, y, 12));
    y -= 16;
    lines.push(pdfLine(`P ${meal.protein}g | C ${meal.carbs}g | G ${meal.fat}g`, 66, y, 10));
    y -= 14;
    lines.push(pdfLine(`Alimentos: ${meal.foods.join(', ')}`, 66, y, 10));
    y -= 24;
  });

  diet.notes.forEach((note) => {
    if (y > 80) {
      lines.push(pdfLine(note, 50, y, 9));
      y -= 14;
    }
  });

  const stream = lines.join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(stream, 'ascii')} >> stream\n${stream}\nendstream endobj`
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj) => {
    offsets.push(Buffer.byteLength(pdf, 'ascii'));
    pdf += `${obj}\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'ascii');
}

module.exports = { buildDietPdf };
