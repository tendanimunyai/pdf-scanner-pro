import * as FileSystem from 'expo-file-system/legacy';

import type { PdfPage, PdfService } from '../../services/scannerServices';

function decodeBase64(value: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = value.replace(/\s/g, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let offset = 0;
  for (const character of clean) {
    if (character === '=') break;
    const digit = alphabet.indexOf(character);
    if (digit < 0) continue;
    buffer = (buffer << 6) | digit;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[offset++] = (buffer >> bits) & 0xff;
    }
  }
  return bytes.slice(0, offset);
}

function asciiHex(bytes: Uint8Array): string {
  let result = '';
  for (const byte of bytes) result += byte.toString(16).padStart(2, '0');
  return `${result}>`;
}

function pdfText(value: string): string {
  return value
    .replace(/[^\x20-\x7e]/g, '?')
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)');
}

function streamObject(dictionary: string, stream: string): string {
  return `<< ${dictionary} /Length ${String(stream.length)} >>\nstream\n${stream}\nendstream`;
}

async function imageStream(page: PdfPage): Promise<string> {
  const data = await FileSystem.readAsStringAsync(page.imagePath, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = decodeBase64(data);
  if (bytes.length === 0) throw new Error('invalid_input');
  return streamObject(
    `/Type /XObject /Subtype /Image /Width ${String(Math.round(page.width))} /Height ${String(Math.round(page.height))} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode]`,
    asciiHex(bytes),
  );
}

function contentStream(page: PdfPage, imageName: string): string {
  const width = Math.round(page.width);
  const height = Math.round(page.height);
  const commands = [
    `q ${String(width)} 0 0 ${String(height)} 0 0 cm /${imageName} Do Q`,
    'BT',
    '3 Tr',
  ];
  for (const word of page.words) {
    const size = Math.max(4, word.bounds.height * height);
    const x = word.bounds.x * width;
    const y = height - (word.bounds.y + word.bounds.height) * height;
    commands.push(
      `/F1 ${size.toFixed(2)} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${pdfText(word.text)}) Tj`,
    );
  }
  commands.push('ET');
  return streamObject('', commands.join('\n'));
}

function buildPdf(objects: readonly string[], rootObject: number): string {
  let pdf = '%PDF-1.7\n%\xFF\xFF\xFF\xFF\n';
  const offsets: number[] = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${String(index + 1)} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${String(objects.length + 1)}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1)
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${String(objects.length + 1)} /Root ${String(rootObject)} 0 R >>\nstartxref\n${String(xref)}\n%%EOF\n`;
  return pdf;
}

export const asciiPdfService: PdfService = {
  async estimateSize(pages, quality) {
    const multiplier = quality === 'low' ? 0.55 : quality === 'medium' ? 0.8 : 1;
    let bytes = 0;
    for (const page of pages) {
      const info = await FileSystem.getInfoAsync(page.imagePath);
      bytes += ('size' in info ? info.size : 0) * multiplier;
    }
    return Math.ceil(bytes + pages.length * 2_048);
  },

  async exportSearchable(input) {
    const objects: string[] = ['', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
    const pageReferences: number[] = [];
    const pagesObjectNumber = 2;
    const fontObjectNumber = 3;
    for (let index = 0; index < input.pages.length; index += 1) {
      const page = input.pages[index];
      if (!page) throw new Error('invalid_input');
      if (input.signal?.aborted) throw new Error('export_cancelled');
      const imageObject = objects.length + 1;
      objects.push(await imageStream(page));
      const contentObject = objects.length + 1;
      objects.push(contentStream(page, `Im${String(index + 1)}`));
      const pageObject = objects.length + 1;
      objects.push(
        `<< /Type /Page /Parent ${String(pagesObjectNumber)} 0 R /MediaBox [0 0 ${String(Math.round(page.width))} ${String(Math.round(page.height))}] /Resources << /Font << /F1 ${String(fontObjectNumber)} 0 R >> /XObject << /Im${String(index + 1)} ${String(imageObject)} 0 R >> >> /Contents ${String(contentObject)} 0 R >>`,
      );
      pageReferences.push(pageObject);
    }
    objects[0] = `<< /Type /Catalog /Pages ${String(pagesObjectNumber)} 0 R >>`;
    objects[1] = `<< /Type /Pages /Kids [${pageReferences.map((reference) => `${String(reference)} 0 R`).join(' ')}] /Count ${String(pageReferences.length)} >>`;
    const pdf = buildPdf(objects, 1);
    await FileSystem.makeDirectoryAsync(input.outputPath.split('/').slice(0, -1).join('/'), {
      intermediates: true,
    });
    await FileSystem.writeAsStringAsync(input.outputPath, pdf);
    return input.outputPath;
  },
};
