import path from "node:path";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export async function parseDocument(buffer: Buffer, filename: string) {
  const extension = path.extname(filename).toLowerCase();

  if (extension === ".pdf") {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });

    try {
      const result = await parser.getText();
      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  throw new Error(`Unsupported document extension: ${extension}`);
}
