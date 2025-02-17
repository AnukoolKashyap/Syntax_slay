import { Groq } from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { code } = req.body;
        
        const response = await groq.chat.completions.create({
            messages: [{
                role: "user",
                content: `Debug this Python code and return JSON with diagnosis, fixed_code, and confidence score:\n\n${code}`
            }],
            model: "llama3-8b-8192",
            response_format: { type: "json_object" },
            temperature: 0.3
        });

        const result = JSON.parse(response.choices[0].message.content);
        
        // Validation
        if (!result.diagnosis || !result.fixed_code || !result.confidence) {
            throw new Error('Invalid response format from AI');
        }

        res.status(200).json({
            diagnosis: result.diagnosis,
            fixed_code: result.fixed_code,
            confidence: Math.round(result.confidence * 100)
        });

    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message });
    }
}