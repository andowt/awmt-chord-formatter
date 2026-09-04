import {
  AlignmentType,
  Document,
  Header,
  LineRuleType,
  PageOrientation,
  Paragraph,
  Packer,
  TextRun,
} from 'docx';
import JSZip from 'jszip';

function preserveLeadingSpaces(line) {
  const leadingSpaces = /^ +/.exec(line);
  if (!leadingSpaces) {
    return line;
  }

  return '\u00A0'.repeat(leadingSpaces[0].length) + line.substring(leadingSpaces[0].length);
}

export async function generateDocx({ fontSize, fontWeight, configName, a3, content, fileName }) {
  const pageWidth = a3 ? '297mm' : '210mm';
  const pageHeight = a3 ? '420mm' : '297mm';
  const paragraphs = [];

  content.split(/\n/).forEach(line => {
    const preservedLine = preserveLeadingSpaces(line);
    if (preservedLine.trim() === '') {
      return;
    }

    const isSectionHeader = preservedLine.trim().startsWith('[');
    paragraphs.push(new Paragraph({
      children: [new TextRun({
        text: isSectionHeader ? preservedLine.trim() : preservedLine,
        font: 'Courier New',
        bold: isSectionHeader || fontWeight === 'bold',
        size: Number(fontSize) * 2,
      })],
      alignment: AlignmentType.LEFT,
      spacing: {
        line: Number(fontSize) * 20,
        lineRule: LineRuleType.EXACT,
      },
    }));
  });

  const document = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 568 * 1.27, right: 568 * 1.27, bottom: 568 * 1.27, left: 568 * 1.27 },
          size: { width: pageWidth, height: pageHeight, orientation: PageOrientation.PORTRAIT },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [new TextRun({
              text: `${fileName.toUpperCase()}  /  ${configName}\n`,
              bold: true,
              font: 'Courier New',
              size: Number(fontSize) * 2,
            })],
            alignment: 'center',
          })],
        }),
      },
      children: paragraphs,
    }],
  });

  return Packer.toBlob(document);
}

export async function downloadDocxZip(documents, fileName) {
  const zip = new JSZip();
  documents.forEach(({ blob, configName }) => {
    zip.file(`${fileName.replace(/\s+/g, '_')}_${configName}.docx`, blob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(zipBlob);
  link.href = objectUrl;
  link.download = `${fileName.replace(/\s+/g, '_')}.zip`;
  link.click();
  URL.revokeObjectURL(objectUrl);
}
