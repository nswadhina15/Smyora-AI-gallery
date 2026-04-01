import dotenv from 'dotenv';
dotenv.config();

async function checkModels() {
  const key = process.env.GEMINI_API_KEY;
  
  if (!key) {
    console.log("❌ ERROR: No API key found in your .env file!");
    return;
  }

  console.log("🔍 Asking Google for your approved models...");
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.error) {
      console.log("❌ API ERROR:", data.error.message);
      return;
    }

    console.log("\n✅ SUCCESS! Your API Key can use these models:");
    console.log("-------------------------------------------------");
    
    // Filter to only show models that support text generation
    const textModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
    
    textModels.forEach(m => {
      // It returns format "models/model-name", we just want the "model-name" part
      console.log(`👉 "${m.name.replace('models/', '')}"`);
    });
    console.log("-------------------------------------------------\n");

  } catch (err) {
    console.log("❌ Network Error:", err.message);
  }
}

checkModels();