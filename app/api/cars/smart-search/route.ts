import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
);

const SYSTEM_PROMPT = `Eres un experto en importación de vehículos premium desde Alemania a España. 
El usuario te describe qué tipo de coche busca en lenguaje natural y tú generas los parámetros de búsqueda óptimos.

DEBES responder SIEMPRE en formato JSON con esta estructura:
{
  "searches": [
    {
      "make": "bmw|mercedes-benz|audi|volkswagen|porsche|volvo",
      "model": "modelo_slug",
      "yearFrom": 2022,
      "maxKm": 100000,
      "reasoning": "breve explicación de por qué este modelo es buena oportunidad"
    }
  ],
  "advice": "consejo breve sobre el tipo de vehículo buscado y su potencial de rentabilidad"
}

MARCAS Y MODELOS DISPONIBLES:
- BMW: x3, 3er, x5, 5er, x1, 1er
- Mercedes-Benz: c-klasse, glc, e-klasse, a-klasse
- Audi: a4, q5, a3, q3, a6
- Volkswagen: golf, tiguan, passat, id.4
- Porsche: cayenne, macan
- Volvo: xc60, xc90

REGLAS:
1. Genera entre 1 y 4 búsquedas relevantes
2. Prioriza modelos con mayor margen de beneficio (SUVs premium, versiones M Sport, AMG, S-Line)
3. Si el usuario pide algo genérico como "SUV premium", genera búsquedas para X3, GLC, Q5, Macan
4. Años recomendados: 2022-2024 para mejor margen
5. KM recomendados: <100.000 para mejor reventa
6. SIEMPRE responde en JSON válido, sin markdown ni backticks`;

export async function POST(request: NextRequest) {
    try {
        const { query, chatHistory } = await request.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const history = (chatHistory || []).map((msg: { role: string; content: string }) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: 'Instrucciones: ' + SYSTEM_PROMPT }] },
                {
                    role: 'model', parts: [{
                        text: JSON.stringify({
                            searches: [{ make: 'bmw', model: 'x3', yearFrom: 2022, maxKm: 100000, reasoning: 'Listo para buscar' }],
                            advice: 'Entendido. Dame tu búsqueda.'
                        })
                    }]
                },
                ...history,
            ],
        });

        const result = await chat.sendMessage(query);
        const responseText = result.response.text();

        // Try to parse JSON from the response
        let parsed;
        try {
            // Clean potential markdown code blocks
            const cleaned = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            parsed = JSON.parse(cleaned);
        } catch {
            // If AI didn't return JSON, wrap it as advice
            parsed = {
                searches: [],
                advice: responseText,
            };
        }

        // Now execute the actual car searches
        const searches = parsed.searches || [];
        const allResults: any[] = [];

        // Fetch car listings for each search in parallel
        const baseUrl = request.nextUrl.origin;
        const fetchPromises = searches.map(async (s: any) => {
            try {
                const params = new URLSearchParams({
                    make: s.make,
                    model: s.model,
                    yearFrom: String(s.yearFrom || 2022),
                });
                if (s.maxKm) params.set('maxKm', String(s.maxKm));

                const res = await fetch(`${baseUrl}/api/cars?${params.toString()}`);
                const data = await res.json();
                return {
                    search: s,
                    listings: (data.listings || []).filter((l: any) => l.estimatedProfit > 0),
                    totalFound: data.totalFound || 0,
                };
            } catch {
                return { search: s, listings: [], totalFound: 0 };
            }
        });

        const searchResults = await Promise.all(fetchPromises);

        // Combine all results, sort by profit
        for (const sr of searchResults) {
            for (const listing of sr.listings) {
                allResults.push({
                    ...listing,
                    searchReasoning: sr.search.reasoning,
                });
            }
        }
        allResults.sort((a, b) => b.estimatedProfit - a.estimatedProfit);

        return NextResponse.json({
            aiResponse: parsed,
            results: allResults.slice(0, 15),
            totalFound: allResults.length,
            searches: searchResults.map(sr => ({
                make: sr.search.make,
                model: sr.search.model,
                reasoning: sr.search.reasoning,
                found: sr.listings.length,
            })),
        });
    } catch (error: any) {
        console.error('Smart Search Error:', error);
        return NextResponse.json(
            { error: error.message || 'Error in smart search' },
            { status: 500 }
        );
    }
}
