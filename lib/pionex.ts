// lib/pionex.ts
// Cliente manual sin dependencias externas rotas
const BASE_URL = 'https://api.pionex.com';

export const getPionexCandles = async (symbol: string) => {
    try {
        // Formato Pionex: BTC_USDT
        const formattedSymbol = symbol.replace('/', '_').replace('-', '_'); 
        
        // Endpoint público de velas (KLines)
        // Intervalo 1m para datos rápidos
        const response = await fetch(`${BASE_URL}/api/v1/market/klines?symbol=${formattedSymbol}&interval=1m&limit=100`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            next: { revalidate: 10 }
        });

        if (!response.ok) throw new Error('Pionex API Error');
        
        const data = await response.json();
        
        // La API de Pionex devuelve { data: { klines: [...] } }
        if (data.data && data.data.klines) {
            return data.data.klines; 
        }
        return [];
    } catch (error) {
        console.error("Error fetching Pionex candles:", error);
        return []; 
    }
};
