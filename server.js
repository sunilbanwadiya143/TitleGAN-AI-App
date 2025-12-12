Import express from 'express';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';

// आपकी Gemini API कुंजी यहाँ से ली जाएगी (GitHub Secrets/Render Environment Variables)
const ai = new GoogleGenAI({}); 

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*' // सभी ओरिजिन से एक्सेस की अनुमति दें
}));
app.use(express.json()); // JSON बॉडी को पार्स करने के लिए

// मुख्य AI जनरेशन रूट
app.post('/api/generate-titles', async (req, res) => {
    const { topic } = req.body;

    if (!topic) {
        return res.status(400).json({ error: 'Topic is required.' });
    }

    // AI के लिए विस्तृत निर्देश (Prompt)
    const prompt = `You are the SuniCraft AI YouTube Title and SEO Tool. For the video topic: "${topic}", generate comprehensive SEO data. 

    Provide your entire output as a single, valid JSON object following this strict schema:
    {
      "titles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
      "keywords": [
        {"keyword": "Main Keyword", "score": 85}, 
        {"keyword": "Secondary Keyword", "score": 70},
        {"keyword": "Related Search Term", "score": 55}
      ],
      "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"],
      "description_snippet": "A short, catchy, SEO-friendly description snippet (max 150 chars)."
    }

    The 'titles' array must contain 5 unique, highly clickable YouTube video titles (max 60 characters).
    The 'keywords' array must contain at least 3 relevant keywords, and assign a realistic 'score' (1-100) representing competition/search volume (higher is better).
    The 'tags' array must contain at least 7 relevant YouTube tags.
    The 'description_snippet' should be an attractive single line.
    
    Ensure the output is ONLY the JSON object, nothing else.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text.trim();
        
        // AI आउटपुट से केवल JSON को पार्स करने का प्रयास करें
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            console.error("AI did not return a valid JSON structure:", text);
            return res.status(500).json({ error: 'AI failed to generate structured data.' });
        }
        
        const aiData = JSON.parse(jsonMatch[0]);

        res.json(aiData);

    } catch (error) {
        console.error('Gemini AI Generation Error:', error);
        res.status(500).json({ error: 'Failed to communicate with the AI service.' });
    }
});

// डिफ़ॉल्ट रूट
app.get('/', (req, res) => {
    res.send('TitleGAN AI Server is running.');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
