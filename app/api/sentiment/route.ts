import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch Fear & Greed Index from alternative.me
        const fngRes = await fetch('https://api.alternative.me/fng/');
        const fngData = await fngRes.json();

        // Standard response from alternative.me: 
        // { "name": "Fear and Greed Index", "data": [ { "value": "x", "value_classification": "y", "timestamp": "z" } ] }
        const currentFng = fngData.data[0];

        // Simulation/Analysis of Twitter Sentiment based on current consensus
        // In a real production app, this would call a sentiment analysis service or scrape specific hashtags
        const twitterSentiment = {
            score: 12, // Lower is more bearish (0-100)
            label: 'Extreme Fear & FUD',
            trendingTopics: ['#BitcoinCrash', '#CryptoWinter', '#ETFOutflow', '#Capitulation'],
            summary: 'Community on X is highly pessimistic. High mention of "Double Top" and "Capitulation". Significant FUD regarding regulatory stalls.'
        };

        return NextResponse.json({
            fng: {
                value: parseInt(currentFng.value),
                label: currentFng.value_classification,
                timestamp: currentFng.timestamp
            },
            twitter: twitterSentiment,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Sentiment API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch sentiment data' }, { status: 500 });
    }
}
