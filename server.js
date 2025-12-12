import express from 'express';
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
        // [LOG] यहाँ लॉग जोड़ा गया
        console.log('[LOG] Error: Topic is missing in request.');
        return res.status(400).json({ error: 'Topic is required.' });
    }
    
    // [LOG] यहाँ लॉग जोड़ा गया
    console.log(`[LOG] Incoming request for topic: "${topic}"`); 

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
        // [LOG] यहाँ लॉग जोड़ा गया - यह AI कॉल से ठीक पहले है
        console.log(`[LOG] Calling Gemini API for topic: "${topic}"`);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        // [LOG] यहाँ लॉग जोड़ा गया - यह बताता है कि AI से प्रतिक्रिया मिली है
        const text = response.text.trim();
        console.log(`[LOG] AI Response received! Trimming response, length: ${text.length}`);
        
        // AI आउटपुट से केवल JSON को पार्स करने का प्रयास करें
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            // [LOG] यहाँ लॉग जोड़ा गया
            console.error("[ERROR] AI did not return a valid JSON structure:", text);
            return res.status(500).json({ error: 'AI failed to generate structured data. Full response logged.' });
        }
        
        // JSON पार्सिंग में कोई समस्या होने पर यह क्रैश से बचाता है
        let aiData;
        try {
             aiData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
             // [LOG] यहाँ लॉग जोड़ा गया
             console.error("[ERROR] Failed to parse JSON match:", parseError.message, "Match:", jsonMatch[0]);
             return res.status(500).json({ error: 'Failed to finalize AI data (Parsing Error).' });
        }

        // [LOG] यहाँ लॉग जोड़ा गया - यह बताता है कि सब कुछ सफल रहा
        console.log("[LOG] Successfully parsed and sending response.");
        res.json(aiData);

    } catch (error) {
        // [LOG] यहाँ लॉग जोड़ा गया - यह बताता है कि AI संचार में त्रुटि हुई है
        console.error('Gemini AI Communication Error:', error);
        res.status(500).json({ error: 'Failed to communicate with the AI service. Check logs for API key issue.' });
    }
});

// डिफ़ॉल्ट रूट
app.get('/', (req, res) => {
    console.log('[LOG] Root path accessed.');
    res.send('TitleGAN AI Server is running.');
});

app.listen(PORT, () => {
    console.log(`[LOG] Server is running on port ${PORT}`);
});
