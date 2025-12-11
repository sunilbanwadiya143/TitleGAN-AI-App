// server.js (Node.js/Express Code)

import express from 'express';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';

// Key को Environment Variable से पढ़ें (जो आपने Render में सेट की है)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY environment variable is not set!");
    process.exit(1); 
}

const ai = new GoogleGenAI(GEMINI_API_KEY);
const model = "gemini-2.5-flash"; 

const app = express();
// पोर्ट 3000 लोकल डेवलपमेंट के लिए था, Render अपना पोर्ट देता है
const port = process.env.PORT || 3000; 

// Middleware
app.use(cors()); 
app.use(express.json()); 

// --- AI टाइटल जनरेशन एंडपॉइंट ---
app.post('/api/generate-titles', async (req, res) => {
    const { topic } = req.body;

    if (!topic) {
        return res.status(400).json({ error: 'Topic is required.' });
    }

    const prompt = `Generate 15 highly engaging, high-CTR, and SEO-optimized YouTube video titles for the topic: "${topic}". 
    The titles must be in Hindi/English mix (Hinglish) and include power words, numbers, or curiosity gaps.
    Return the output as a simple JSON array of strings, without any extra text, headings, or numbering.
    Example format: ["Title 1", "Title 2", "Title 3", ... ]`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "array",
                    items: {
                        type: "string",
                        description: "A highly engaging YouTube title."
                    }
                }
            }
        });
        
        const titles = JSON.parse(response.text);

        res.json({ titles: titles });

    } catch (error) {
        console.error('Error generating titles:', error);
        res.status(500).json({ error: 'Failed to generate titles from AI.' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

