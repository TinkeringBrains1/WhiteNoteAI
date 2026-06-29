import { PDFParse } from 'pdf-parse';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // 1. Initialize the new parser class with your buffer
    const parser = new PDFParse({ data: buffer });
    
    // 2. Extract the text
    const result = await parser.getText();
    
    // 3. Clean up the parser (crucial for memory management!)
    await parser.destroy();
    
    if (!result.text || result.text.trim() === '') {
      throw new Error("PDF content is empty or unreadable.");
    }
    
    return result.text;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to extract text from the uploaded invoice.");
  }
}