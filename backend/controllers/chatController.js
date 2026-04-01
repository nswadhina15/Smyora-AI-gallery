import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const analyzeChat = async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // We use Gemini 1.5 Flash for blazing-fast responses
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // The system prompt tells the AI exactly how to behave
    const systemPrompt = `
      You are a smart, creative AI Gallery Assistant.
      The user is searching their photo gallery with this request: "${prompt}"
      
      Task 1: Extract 1 to 3 core visual subjects/objects from this request to use as search database tags. (e.g., if they say "show me sunny days at the beach", return ["beach", "sun"]).
      Task 2: Write a fun, engaging, and creative caption (1 to 2 sentences max) based on their request.
      
      You MUST return EXACTLY this JSON format and nothing else (no markdown blocks, no extra text):
      {
        "searchTags": ["tag1", "tag2"],
        "caption": "Your creative caption here!"
      }
    `;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    
    // Clean up the response to ensure it's pure JSON
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(jsonStr);

    res.status(200).json(aiData);
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: 'Failed to process AI chat' });
  }
};

export const synthesizeAlbum = async (req, res) => {
  try {
    const { tags, albumName } = req.body;
    
    if (!tags || tags.length === 0) {
      return res.status(400).json({ error: 'No tags provided' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // The prompt instructs the AI to craft a specific style of poetry
    const systemPrompt = `
      You are a soulful and observant poet. You are looking at a photo album named "${albumName}".
      The visual elements found in these photos are: ${tags.join(', ')}.
      
      Your task is to synthesize the emotion, atmosphere, and essence of these memories into a beautiful, evocative Hindi kavita (poem).
      Keep it between 4 to 8 lines. Make it deeply emotional, nostalgic, or joyous depending on the tags. 
      Format it elegantly with line breaks. Provide ONLY the poem, no introductory or concluding text.
    `;

    const result = await model.generateContent(systemPrompt);
    
    res.status(200).json({ synthesis: result.response.text() });
  } catch (error) {
    console.error("Vibe Synthesis Error:", error);
    res.status(500).json({ error: 'Failed to synthesize album vibe' });
  }
};

export const extractPhotoDNA = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'No image URL provided' });

    // 1. Fetch the image from Cloudinary and convert to Base64
    const imageResp = await fetch(imageUrl);
    const arrayBuffer = await imageResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // 2. Initialize Gemini 2.5 Flash (which has excellent Vision capabilities)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 3. The prompt asking for a strict JSON format
    const prompt = `
      You are an expert color theorist and mood analyst. Analyze this image.
      Return EXACTLY this JSON structure and nothing else:
      {
        "colors": ["#HEX1", "#HEX2", "#HEX3"],
        "mood": "Single word mood (e.g., Serene, Melancholic, Joyful, Energetic)",
        "energy": Number between 1 and 100
      }
    `;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    // Clean and parse the JSON
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const dnaData = JSON.parse(jsonStr);

    res.status(200).json(dnaData);
  } catch (error) {
    console.error("DNA Extraction Error:", error);
    res.status(500).json({ error: 'Failed to extract Photo DNA' });
  }
};

export const queryGallery = async (req, res) => {
  try {
    const { query, gallery } = req.body;

    if (!query || !gallery || !Array.isArray(gallery)) {
      return res.status(400).json({ error: 'Missing query or gallery data' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // The prompt that turns Gemini into a personal memory assistant
    const systemPrompt = `
      You are a friendly, intelligent memory assistant for a photo gallery app.
      The user is asking: "${query}"
      
      Here is the metadata for their entire photo gallery in JSON format:
      ${JSON.stringify(gallery)}
      
      Task:
      1. Understand the user's intent.
      2. Find the best matching photos from the gallery JSON. Match based on tags, mood, energy, or date.
      3. Write a conversational, empathetic reply (1-3 sentences) directly to the user. (e.g. "Here are the happiest moments I found from last year!")
      4. Return an array of the 'id's of the matching photos (maximum 10 ids).
      
      You MUST return EXACTLY this JSON format and nothing else (no markdown blocks, no extra text):
      {
        "reply": "Your conversational response here.",
        "photoIds": ["id1", "id2"]
      }
    `;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    
    // Clean up the response to ensure it's pure JSON
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(jsonStr);

    res.status(200).json(aiData);
  } catch (error) {
    console.error("AI Memory Chat Error:", error);
    res.status(500).json({ error: 'Failed to query gallery' });
  }
};