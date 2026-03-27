// ─────────────────────────────────────────────────────────────────────────
// Vision Grroup ERP v5.0 — OCR Utility (Tesseract.js, fully offline)
// ─────────────────────────────────────────────────────────────────────────

let Tesseract = null;

async function loadTesseract() {
  if (Tesseract) return Tesseract;
  try {
    Tesseract = await import('tesseract.js');
    return Tesseract;
  } catch (e) {
    console.error('[OCR] Tesseract.js not available:', e);
    return null;
  }
}

/**
 * Run OCR on a base64 image/PDF
 * @param {string} base64 - base64 data of image
 * @param {string} ext - file extension (jpg, png, pdf)
 * @param {function} onProgress - progress callback (0-100)
 * @returns {string} - extracted text
 */
export async function runOCR(base64, ext, onProgress) {
  const T = await loadTesseract();
  if (!T) throw new Error('Tesseract.js not loaded');

  const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', pdf: 'application/pdf' };
  const mime = mimeMap[ext?.toLowerCase()] || 'image/jpeg';
  const dataUrl = `data:${mime};base64,${base64}`;

  const worker = await T.createWorker('eng', 1, {
    workerPath: undefined, // use bundled
    logger: (m) => { if (m.status === 'recognizing text' && onProgress) onProgress(Math.round(m.progress * 100)); },
  });

  const { data: { text } } = await worker.recognize(dataUrl);
  await worker.terminate();
  return text;
}

/**
 * Parse OCR text for MATERIAL INDENT fields
 * Extracts: item names, qty, unit, remarks
 */
export function parseIndentOCR(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items = [];
  const unitPatterns = /\b(bags?|kg|kgs?|tonnes?|mt|sqft|sq\.?ft|rft|nos?|pcs?|ltrs?|liters?|meters?|mtr|mm|rmt|sets?)\b/i;

  for (const line of lines) {
    const unitMatch = line.match(unitPatterns);
    const qtyMatch = line.match(/\b(\d+(?:\.\d+)?)\s*(?:bags?|kg|kgs?|tonnes?|mt|sqft|rft|nos?|pcs?|ltrs?|meters?|mtr|mm|rmt|sets?)/i);
    if (qtyMatch) {
      const qty = parseFloat(qtyMatch[1]);
      const unit = unitMatch ? unitMatch[1].toLowerCase() : 'nos';
      const material = line.replace(qtyMatch[0], '').replace(/[^\w\s-]/g, '').trim();
      if (material && qty > 0) items.push({ material, qty, unit, raw: line });
    }
  }

  const remarksLine = lines.find(l => /remark|note|urgency|urgent|asap/i.test(l));
  return { items, remarks: remarksLine || '' };
}

/**
 * Parse OCR text for GRN (Goods Receipt Note)
 * Extracts: vendor name, items, qty, vehicle number, challan number
 */
export function parseGRNOCR(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const vendorLine = lines.find(l => /vendor|supplier|from|party/i.test(l));
  const vehicleLine = lines.find(l => /vehicle|truck|lorry|MH|GJ|KA|DL|[A-Z]{2}\d{2}/i.test(l));
  const challanLine = lines.find(l => /challan|dc|delivery|note|no\.|#/i.test(l));
  const dateLine = lines.find(l => /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(l));

  const vehicleMatch = text.match(/[A-Z]{2}\s?\d{2}\s?[A-Z]{1,2}\s?\d{4}/);
  const challanMatch = text.match(/(?:challan|dc|no\.?|#)\s*[:\-]?\s*([A-Z0-9\/-]+)/i);

  return {
    vendor: vendorLine ? vendorLine.replace(/vendor|supplier|from|party/i, '').replace(/[:\-]/g, '').trim() : '',
    vehicle: vehicleMatch ? vehicleMatch[0].replace(/\s/g, '') : '',
    challanNo: challanMatch ? challanMatch[1].trim() : '',
    date: dateLine ? dateLine.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/)?.[0] : '',
    rawText: text,
  };
}

/**
 * Parse OCR text for VENDOR BILL / INVOICE
 * Extracts: invoice number, date, GSTIN, amount, GST
 */
export function parseVendorBillOCR(text) {
  const invoiceMatch = text.match(/(?:invoice|bill|inv|no\.?)\s*[:\-#]?\s*([A-Z0-9\/-]+)/i);
  const dateMatch = text.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/);
  const gstinMatch = text.match(/[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}/);
  const amountMatch = text.match(/(?:total|amount|net|grand total)\s*[:\-]?\s*(?:rs\.?|₹|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  const gstMatch = text.match(/(?:gst|tax|cgst|sgst|igst)\s*[:\-@]?\s*(?:rs\.?|₹|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i);

  return {
    invoiceNo: invoiceMatch ? invoiceMatch[1].trim() : '',
    date: dateMatch ? dateMatch[0] : '',
    gstin: gstinMatch ? gstinMatch[0] : '',
    amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0,
    gstAmount: gstMatch ? parseFloat(gstMatch[1].replace(/,/g, '')) : 0,
    rawText: text,
  };
}

/**
 * Parse OCR text for EXPENSE CLAIM receipt
 */
export function parseExpenseOCR(text) {
  const amountMatch = text.match(/(?:total|amount|bill|paid)\s*[:\-]?\s*(?:rs\.?|₹|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  const dateMatch = text.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/);
  const merchantMatch = text.split('\n')[0]?.trim(); // First line often is merchant name

  return {
    merchant: merchantMatch || '',
    amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0,
    date: dateMatch ? dateMatch[0] : '',
    rawText: text,
  };
}

/**
 * Parse OCR text for TDS CHALLAN
 */
export function parseTDSChallanOCR(text) {
  const bsrMatch = text.match(/BSR\s*[:\-]?\s*(\d{7})/i);
  const amountMatch = text.match(/(?:amount|amt|tax)\s*[:\-]?\s*(?:rs\.?|₹|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  const dateMatch = text.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/);
  const sectionMatch = text.match(/(?:section|sec\.?|u\/s)\s*[:\-]?\s*(194[A-Z]{0,2})/i);

  return {
    bsrCode: bsrMatch ? bsrMatch[1] : '',
    amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0,
    date: dateMatch ? dateMatch[0] : '',
    section: sectionMatch ? sectionMatch[1] : '',
    rawText: text,
  };
}

/**
 * Parse OCR for EMPLOYEE ONBOARDING (Aadhaar / PAN)
 */
export function parseEmployeeOCR(text) {
  const panMatch = text.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/);
  const aadhaarMatch = text.match(/\d{4}\s?\d{4}\s?\d{4}/);
  const nameMatch = text.match(/(?:name|नाम)\s*[:\-]?\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i);
  const dobMatch = text.match(/(?:dob|date of birth|जन्म तिथि)\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);

  return {
    pan: panMatch ? panMatch[0] : '',
    aadhaar: aadhaarMatch ? aadhaarMatch[0].replace(/\s/g, '') : '',
    name: nameMatch ? nameMatch[1].trim() : '',
    dob: dobMatch ? dobMatch[1] : '',
    rawText: text,
  };
}
