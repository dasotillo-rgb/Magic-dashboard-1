// lib/bot-engine.ts
import { placeOrder, cancelOrder, getBalances, getOpenOrders, Order, Credentials } from './pionex-client';
import { calculateGeminiMoneyLine } from './gemini-money-line';

export type BotType = 'GRID' | 'INDICATOR';

export type BotConfig = {
    id: string;
    symbol: string;
    type: BotType;
    investment: number;
    // Grid specific
    upperPrice?: number;
    lowerPrice?: number;
    grids?: number;
    // State
    status: 'RUNNING' | 'PAUSED' | 'STOPPED';
    lastUpdate: number;
    totalProfit: number;
};

/**
 * Manages Internal Bots that use the user's Pionex API keys
 * to simulate advanced strategies directly from the dashboard.
 */
export class BotEngine {
    private static activeBots: Map<string, BotConfig> = new Map();

    /**
     * Start a new managed bot
     */
    static async createBot(config: BotConfig, creds: Credentials) {
        // Validation logic here
        this.activeBots.set(config.id, { ...config, status: 'RUNNING', lastUpdate: Date.now() });

        if (config.type === 'GRID') {
            await this.initializeGrid(config, creds);
        }
    }

    /**
     * Simulated Grid Initialization:
     * In a real system, this would place the initial set of limit orders.
     */
    private static async initializeGrid(config: BotConfig, creds: Credentials) {
        console.log(`[BotEngine] Initializing GRID for ${config.symbol}`);
        await this.evaluateGridBot(config, creds);
    }

    /**
     * Heartbeat/Sync:
     * This would be called by a cron or a client-side poll to evaluate 
     * if orders need to be moved or if a signal has been triggered.
     */
    static async tick(botId: string, creds: Credentials) {
        const bot = this.activeBots.get(botId);
        if (!bot || bot.status !== 'RUNNING') return;

        if (bot.type === 'INDICATOR') {
            await this.evaluateIndicatorBot(bot, creds);
        } else {
            await this.evaluateGridBot(bot, creds);
        }
    }

    private static async evaluateIndicatorBot(bot: BotConfig, creds: Credentials) {
        try {
            const { getCandles } = await import('./pionex-client');
            const candles = await getCandles(bot.symbol, '15M', 100);

            if (candles.length < 20) return;

            const result = calculateGeminiMoneyLine(candles, bot.symbol);
            const trend = result.currentTrend; // 1 = bullish, -1 = bearish

            // Check if we need to act
            // To be robust, we should check our current position for this bot
            // For now, let's assume if trend is 1 we want to be LONG, if -1 we want to be SHORT/OUT.

            console.log(`[BotEngine] ${bot.symbol} Ticker trend: ${trend > 0 ? 'BULL' : 'BEAR'}`);

            // Logic: if trend changed since last tick or if we have no record of position
            // (In a more complex engine we'd store the 'side' in the bot config)

            // Dynamic side tracking:
            const currentSide = (bot as any).side;

            if (trend === 1 && currentSide !== 'LONG') {
                console.log(`[BotEngine] INDICATOR FLIP -> BULLISH. Executing BUY for ${bot.symbol}`);
                await placeOrder(bot.symbol, 'BUY', 'MARKET', bot.investment.toString(), undefined, creds);
                (bot as any).side = 'LONG';
            } else if (trend === -1 && currentSide !== 'SHORT') {
                console.log(`[BotEngine] INDICATOR FLIP -> BEARISH. Executing SELL for ${bot.symbol}`);
                await placeOrder(bot.symbol, 'SELL', 'MARKET', bot.investment.toString(), undefined, creds);
                (bot as any).side = 'SHORT';
            }

            bot.lastUpdate = Date.now();
        } catch (error) {
            console.error(`[BotEngine] Error evaluating indicator for ${bot.symbol}:`, error);
        }
    }

    private static async evaluateGridBot(bot: BotConfig, creds: Credentials) {
        try {
            const { getOpenOrders, getTicker, placeOrder } = await import('./pionex-client');
            const ticker = await getTicker(bot.symbol);
            if (!ticker) return;

            const currentPrice = parseFloat(ticker.price);
            const openOrders = await getOpenOrders(bot.symbol, creds);

            // Simple Grid Logic:
            // If No orders exist, place 1 buy and 1 sell around current price as a test
            if (openOrders.length === 0 && bot.status === 'RUNNING') {
                console.log(`[BotEngine] GRID ${bot.symbol}: Placing initial grid orders...`);

                const sellPrice = currentPrice * 1.01;
                const buyPrice = currentPrice * 0.99;
                const size = (bot.investment / 2 / currentPrice).toFixed(6);

                await placeOrder(bot.symbol, 'SELL', 'LIMIT', size, sellPrice.toString(), creds);
                await placeOrder(bot.symbol, 'BUY', 'LIMIT', size, buyPrice.toString(), creds);
            }

            bot.lastUpdate = Date.now();
        } catch (error) {
            console.error(`[BotEngine] Error evaluating grid for ${bot.symbol}:`, error);
        }
    }

    static getBots() {
        return Array.from(this.activeBots.values());
    }

    static stopBot(botId: string) {
        const bot = this.activeBots.get(botId);
        if (bot) {
            bot.status = 'STOPPED';
            // Cancel all orders associated with this bot...
        }
    }
}
