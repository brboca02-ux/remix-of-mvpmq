import Tesseract from 'tesseract.js';

export const extractTextFromImage = async (file: File): Promise<string> => {
  try {
    const result = await Tesseract.recognize(
      file,
      'por+eng',
      { logger: m => console.log(m) }
    );
    return result.data.text;
  } catch (error) {
    console.error("Error extracting text from image:", error);
    throw new Error("Não foi possível ler a imagem.");
  }
};

export const parseExtractedText = (text: string) => {
  // Simple regex-based extraction for common profile patterns
  const lines = text.split('\n');
  let companyName = "";
  let phone = "";
  let address = "";
  
  // Try to find phone
  const phoneRegex = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-.\s]?\d{4}/;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) phone = phoneMatch[0];

  // First non-empty line usually company name
  companyName = lines.find(l => l.trim().length > 3) || "Empresa Identificada";

  return {
    companyName,
    whatsapp: phone.replace(/\D/g, ''),
    rawText: text
  };
};
