import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function getThumbnailIdeas(topic: string) {
  if (!genAI) throw new Error("Gemini API Key missing");
  
  const model = "gemini-3-flash-preview";
  const prompt = `Bạn là một chuyên gia thiết kế Thumbnail YouTube. 
  Hãy gợi ý 3 ý tưởng thiết kế hình đại diện (thumbnail) cho video có chủ đề: "${topic}".
  Mỗi ý tưởng bao gồm:
  1. Tiêu đề hấp dẫn (Catchy title)
  2. Bố cục (Layout)
  3. Màu sắc chủ đạo (Key colors)
  4. Cảm xúc (Vibe)
  
  Hãy trả về định dạng JSON mảng các đối tượng { idea, layout, colors, vibe }.`;

  const result = await genAI.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(result.text);
}
