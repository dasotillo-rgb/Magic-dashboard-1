import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
);

const SYSTEM_PROMPT = `Eres "APE", el asistente de inteligencia artificial del dashboard "Ape Intelligence OS". 
Eres un experto en trading de criptomonedas, análisis de mercados, estrategias de inversión y tecnología.
Respondes de forma concisa, directa y profesional. Usa español cuando el usuario hable en español.
Si te preguntan sobre datos de mercado en tiempo real, aclara que tus datos pueden no estar actualizados.
Mantén un tono de "comandante de operaciones" — eres el co-piloto del usuario.`;

export async function POST(request: NextRequest) {
    try {
        const { messages } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Messages array is required' },
                { status: 400 }
            );
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Build chat history for Gemini
        const history = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: 'Instrucciones del sistema: ' + SYSTEM_PROMPT }] },
                { role: 'model', parts: [{ text: 'Entendido, Comandante. APE Intelligence OS operativo. ¿En qué puedo asistirte?' }] },
                ...history,
            ],
        });

        const lastMessage = messages[messages.length - 1].content;
        const result = await chat.sendMessage(lastMessage);
        const response = result.response.text();

        return NextResponse.json({ response });
    } catch (error: any) {
        console.error('Gemini API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Error connecting to Gemini' },
            { status: 500 }
        );
    }
}
