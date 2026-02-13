import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Spanish resale reference prices (HARD FLOOR MARKET VALUE in Spain, Feb 2026)
// Using "Price Low to High" and including "Financed" prices as the benchmark 
// because that is what users compare against.
const SPAIN_REFERENCE_PRICES: Record<string, { min: number; max: number; avg: number }> = {
    // BMW SUVs
    'x1-2020': { min: 20000, max: 25000, avg: 21500 }, 'x1-2021': { min: 23000, max: 28000, avg: 24500 },
    'x1-2022': { min: 26000, max: 32000, avg: 28000 }, 'x1-2023': { min: 31000, max: 40000, avg: 34000 },

    // X3 adjusted to floor
    'x3-2020': { min: 26000, max: 32000, avg: 28000 }, 'x3-2021': { min: 29000, max: 36000, avg: 31000 },
    'x3-2022': { min: 35000, max: 42000, avg: 37000 }, 'x3-2023': { min: 42000, max: 50000, avg: 45000 },

    // X5 HARD FLOOR (Matches Financed Prices)
    // 2021 Floor: ~40k
    // 2022 Floor: ~42k (Financed 41.7k)
    'x5-2020': { min: 38000, max: 46000, avg: 40000 }, 'x5-2021': { min: 41000, max: 52000, avg: 42000 },
    'x5-2022': { min: 43000, max: 60000, avg: 45000 }, 'x5-2023': { min: 62000, max: 78000, avg: 66000 },

    'x7-2020': { min: 62000, max: 78000, avg: 68000 }, 'x7-2021': { min: 70000, max: 85000, avg: 75000 },

    // BMW Touring
    '3er-2020': { min: 19000, max: 26000, avg: 21000 }, '3er-2021': { min: 22000, max: 30000, avg: 25000 },
    '3er-2022': { min: 26000, max: 36000, avg: 30000 }, '3er-2023': { min: 32000, max: 42000, avg: 36000 },
    '5er-2020': { min: 26000, max: 34000, avg: 29000 }, '5er-2021': { min: 30000, max: 38000, avg: 33000 },
    '5er-2022': { min: 36000, max: 48000, avg: 40000 }, '5er-2023': { min: 42000, max: 55000, avg: 48000 },

    // Mercedes SUVs (Conservative adjustments)
    'gla-2020': { min: 23000, max: 29000, avg: 25000 }, 'gla-2021': { min: 26000, max: 33000, avg: 28000 },
    'gla-2022': { min: 30000, max: 38000, avg: 33000 }, 'gla-2023': { min: 34000, max: 42000, avg: 38000 },
    'glb-2020': { min: 26000, max: 34000, avg: 28000 }, 'glb-2021': { min: 30000, max: 38000, avg: 32000 },
    'glb-2022': { min: 34000, max: 44000, avg: 38000 }, 'glb-2023': { min: 38000, max: 48000, avg: 42000 },
    'glc-2020': { min: 28000, max: 36000, avg: 31000 }, 'glc-2021': { min: 32000, max: 42000, avg: 35000 },
    'glc-2022': { min: 38000, max: 50000, avg: 42000 }, 'glc-2023': { min: 46000, max: 62000, avg: 52000 },
    'gle-2020': { min: 46000, max: 58000, avg: 50000 }, 'gle-2021': { min: 52000, max: 68000, avg: 58000 },
    'gle-2022': { min: 60000, max: 78000, avg: 68000 }, 'gle-2023': { min: 70000, max: 88000, avg: 78000 },

    // Audi SUVs & Avant (Q5 Adjusted to floor ~26k)
    'q3-2020': { min: 23000, max: 29000, avg: 25000 }, 'q3-2021': { min: 26000, max: 33000, avg: 28000 },
    'q3-2022': { min: 29000, max: 37000, avg: 32000 }, 'q3-2023': { min: 33000, max: 41000, avg: 37000 },
    'q5-2020': { min: 25000, max: 34000, avg: 27000 }, 'q5-2021': { min: 28000, max: 38000, avg: 31000 },
    'q5-2022': { min: 34000, max: 46000, avg: 38000 }, 'q5-2023': { min: 40000, max: 52000, avg: 46000 },
    'q7-2020': { min: 40000, max: 52000, avg: 46000 }, 'q7-2021': { min: 46000, max: 60000, avg: 52000 },
    'q8-2020': { min: 50000, max: 65000, avg: 56000 }, 'q8-2021': { min: 56000, max: 72000, avg: 62000 },
    'a4-2020': { min: 19000, max: 27000, avg: 22000 }, 'a4-2021': { min: 23000, max: 30000, avg: 26000 },
    'a6-2020': { min: 25000, max: 34000, avg: 29000 }, 'a6-2021': { min: 29000, max: 38000, avg: 33000 },

    // Porsche
    'macan-2020': { min: 40000, max: 50000, avg: 44000 }, 'macan-2021': { min: 46000, max: 58000, avg: 50000 },
    'macan-2022': { min: 52000, max: 65000, avg: 58000 }, 'macan-2023': { min: 62000, max: 75000, avg: 68000 },
    'cayenne-2020': { min: 52000, max: 72000, avg: 62000 }, 'cayenne-2021': { min: 62000, max: 82000, avg: 72000 },

    // Toyota Premium
    'rav4-2020': { min: 20000, max: 25000, avg: 22000 }, 'rav4-2021': { min: 23000, max: 29000, avg: 25000 },
    'rav4-2022': { min: 26000, max: 33000, avg: 29000 }, 'rav4-2023': { min: 29000, max: 37000, avg: 33000 },
    'highlander-2021': { min: 36000, max: 46000, avg: 41000 }, 'highlander-2022': { min: 40000, max: 50000, avg: 45000 },
    'land-cruiser-2020': { min: 40000, max: 55000, avg: 46000 }, 'land-cruiser-2021': { min: 46000, max: 62000, avg: 54000 },
};

const IMPORT_COSTS = {
    transport: 800,
    itp: 0.04,
    gestoria: 350,
    itv: 200,
    homologacion: 150,
    otros: 200,
};

function calculateIEDMT(price: number, fuel: string): number {
    if (fuel === 'ELC' || fuel === 'PHEV') return 0;
    // Conservative average for SUVs
    return price * 0.0975;
}

function estimateImportCost(purchasePrice: number, fuel: string): number {
    const iedmt = calculateIEDMT(purchasePrice, fuel);
    return (
        IMPORT_COSTS.transport +
        IMPORT_COSTS.gestoria +
        IMPORT_COSTS.itv +
        IMPORT_COSTS.homologacion +
        IMPORT_COSTS.otros +
        iedmt
    );
}

export type CarListing = {
    id: string;
    title: string;
    exactModel: string;
    price: number;
    year: number;
    mileage: string;
    mileageNum: number;
    fuel: string;
    url: string;
    source: 'autoscout24' | 'mobile.de';
    make: string;
    model: string;
    importCost: number;
    estimatedESPrice: number;
    estimatedProfit: number;
    profitRating: 'HIGH' | 'MEDIUM' | 'LOW';
    location?: string;
    cochesNetUrl?: string;
};

function parseFuelType(text: string): string {
    const t = text.toLowerCase();
    if (t.includes('elektro') || t.includes('electric')) return 'ELC';
    if (t.includes('plug-in') || t.includes('plugin') || t.includes('phev')) return 'PHEV';
    if (t.includes('hybrid')) return 'HYB';
    if (t.includes('diesel')) return 'DSL';
    if (t.includes('benzin') || t.includes('petrol') || t.includes('gasolina')) return 'BNZ';
    return 'BNZ';
}

// DISABLED EXTRAS VALUE FOR HARD FLOOR COMPARISON
// To compare with the CHEAPEST car on the market, we must assume ours has NO value-add extras.
function calculateExtrasValue(title: string, desc: string = ''): number {
    return 0;
}

function extractExactModel(title: string, make: string): string {
    const t = title.replace(/\s+/g, ' ').trim();
    const makeUpper = make.toUpperCase();
    let model = t.startsWith(makeUpper) ? t.substring(makeUpper.length).trim() : t;
    model = model.replace(/\s*,\s*/g, ' ').replace(/\s+/g, ' ');
    return model || t;
}

const MODEL_SLUGS: Record<string, Record<string, string>> = {
    'bmw': { 'x3': 'x3', 'x1': 'x1', 'x5': 'x5', 'x7': 'x7', '3er': '3er', '5er': '5er' },
    'mercedes-benz': { 'glc': 'glc', 'glb': 'glb', 'gle': 'gle', 'gla': 'gla', 'c-klasse': 'c-klasse', 'e-klasse': 'e-klasse' },
    'audi': { 'q3': 'q3', 'q5': 'q5', 'q7': 'q7', 'q8': 'q8', 'a4': 'a4', 'a6': 'a6' },
    'volkswagen': { 'tiguan': 'tiguan', 'touareg': 'touareg', 'passat': 'passat' },
    'porsche': { 'macan': 'macan', 'cayenne': 'cayenne', 'panamera': 'panamera' },
    'volvo': { 'xc60': 'xc60', 'xc90': 'xc90' },
    'toyota': { 'rav4': 'rav4', 'highlander': 'highlander', 'land-cruiser': 'land-cruiser' },
};

async function scrapeAutoScout24(
    make: string,
    model: string,
    yearFrom: number,
    maxKm?: number,
    searchQuery?: string
): Promise<CarListing[]> {
    const listings: CarListing[] = [];
    const makeSlug = make.toLowerCase();
    const modelSlug = model.toLowerCase();

    let url = `https://www.autoscout24.de/lst/${makeSlug}/${modelSlug}?sort=price&desc=0&fregfrom=${yearFrom}&gear=A&cy=D&atype=C`;
    if (maxKm) url += `&kmto=${maxKm}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                // ... same headers ...
            },
            next: { revalidate: 0 },
        });

        if (!res.ok) return listings;
        const html = await res.text();

        const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
        if (nextDataMatch) {
            try {
                const nextData = JSON.parse(nextDataMatch[1]);
                const listingsData = nextData?.props?.pageProps?.listings;
                if (Array.isArray(listingsData)) {
                    for (const item of listingsData.slice(0, 25)) {
                        const id = item.id || item.listingId || String(Math.random());
                        const price = item.tracking?.price || item.price?.amount || 0;
                        const vehicleModel = item.vehicle?.model || model.toUpperCase();
                        const modelVersion = item.vehicle?.modelVersionInput || '';

                        let exactModel = vehicleModel;
                        if (modelVersion) {
                            const driveMatch = modelVersion.match(/(x|s|e)?Drive\s*\d+\s*[a-zA-Z]*/i);
                            if (driveMatch) {
                                exactModel = `${vehicleModel} ${driveMatch[0]}`.trim();
                            } else {
                                const words = modelVersion.split(/[\s|,]+/).filter((w: string) =>
                                    w.length > 1 && !/^(LED|AHK|SHZ|PDC|ACC|RFK|HiFi|DAB|Aut|Leder|Navi|Pano|Prof|Kamera|Memory|KEYLESS|Sportsitz|Virtual|Innovationsp|CarPlay|Driv|Brems|Park|Ass)/i.test(w)
                                );
                                if (words.length > 0) exactModel = `${vehicleModel} ${words.slice(0, 2).join(' ')}`.trim();
                            }
                            if (/m\s*sport/i.test(modelVersion) && !/m\s*sport/i.test(exactModel)) {
                                exactModel += ' M Sport';
                            }
                        }
                        const title = `${make.toUpperCase()} ${exactModel}`;
                        const firstReg = item.tracking?.firstRegistration || '';
                        const yearMatch = firstReg.match?.(/(\d{4})/);
                        const year = yearMatch ? parseInt(yearMatch[1]) : (yearFrom);
                        const mileageStr = item.vehicle?.mileageInKm || '';
                        const mileageNum = item.tracking?.mileage || parseInt(String(mileageStr).replace(/\D/g, '')) || 0;
                        const fuelRaw = item.vehicle?.fuel || item.tracking?.fuelCategory || '';
                        const fuel = parseFuelType(fuelRaw);
                        const detailUrl = item.url ? `https://www.autoscout24.de${item.url}` : `https://www.autoscout24.de/angebote/${id}`;
                        const loc = item.location?.city || item.seller?.city || '';
                        const cochesNetStart = 'https://www.coches.net/segunda-mano/?fi=Price&or=1&KeyWords=';
                        const cochesNetUrl = `${cochesNetStart}${encodeURIComponent(make + ' ' + exactModel + ' ' + year)}`;

                        if (price > 0 && year >= yearFrom) {
                            if (maxKm && mileageNum > maxKm) continue;

                            const importCost = Math.round(estimateImportCost(price, fuel));
                            const refKey = `${modelSlug}-${year}`;
                            const baseRef = SPAIN_REFERENCE_PRICES[refKey] ||
                                SPAIN_REFERENCE_PRICES[`${modelSlug}-${Math.min(year, 2023)}`] ||
                                { min: Math.round(price * 1.1) };

                            // HARD FLOOR LOGIC: Use MIN price (Financed price equivalent)
                            // NO EXTRAS VALUE ADDED
                            const extrasValue = 0;

                            // Mileage Adjustment: -€0.20 per km over 90,000 km (Aggressive penalty)
                            const mileageAdj = Math.max(0, (mileageNum - 90000) * 0.20) * -1;

                            const estimatedESPrice = baseRef.min + extrasValue + mileageAdj;

                            const estimatedProfit = Math.round(estimatedESPrice - price - importCost);

                            // Rating based on simple hard profit
                            const profitRating = (estimatedProfit > 5000) ? 'HIGH' : (estimatedProfit > 2000) ? 'MEDIUM' : 'LOW';

                            listings.push({
                                id: `as24-${id}`,
                                title,
                                exactModel,
                                price,
                                year,
                                mileage: mileageNum > 0 ? `${(mileageNum / 1000).toFixed(0)}k km` : '',
                                mileageNum,
                                fuel,
                                url: detailUrl,
                                source: 'autoscout24',
                                make: make.toUpperCase(),
                                model: modelSlug,
                                importCost,
                                estimatedESPrice: Math.round(estimatedESPrice),
                                estimatedProfit: Math.max(0, estimatedProfit), // Allow showing 0 or assume user filters out negatives
                                profitRating,
                                location: loc,
                                cochesNetUrl,
                            });
                        }
                    }
                }
            } catch (e) {
                console.error('AutoScout24 JSON parse error:', e);
            }
        }
    } catch (err) { console.error('AutoScout24 scrape error:', err); }

    return listings;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const make = searchParams.get('make') || 'bmw';
        const model = searchParams.get('model');
        const yearFrom = parseInt(searchParams.get('yearFrom') || '2020');
        const maxKm = searchParams.get('maxKm') ? parseInt(searchParams.get('maxKm')!) : 100000;
        const overview = searchParams.get('overview') === 'true';

        if (overview) {
            const [x3, x5, glc, gle, q5, macan, rav4] = await Promise.all([
                scrapeAutoScout24('bmw', 'x3', 2020, 100000),
                scrapeAutoScout24('bmw', 'x5', 2020, 100000),
                scrapeAutoScout24('mercedes-benz', 'glc', 2020, 100000),
                scrapeAutoScout24('mercedes-benz', 'gle', 2020, 100000),
                scrapeAutoScout24('audi', 'q5', 2020, 100000),
                scrapeAutoScout24('porsche', 'macan', 2020, 100000),
                scrapeAutoScout24('toyota', 'rav4', 2020, 100000),
            ]);

            let allListings = [...x3, ...x5, ...glc, ...gle, ...q5, ...macan, ...rav4];
            // Filter: Show anything with profit > 500 (Tight margins allowed)
            allListings = allListings.filter(l => l.estimatedProfit >= 500);
            allListings.sort((a, b) => b.estimatedProfit - a.estimatedProfit || a.price - b.price);

            return NextResponse.json({
                listings: allListings.slice(0, 25),
                importCostBreakdown: IMPORT_COSTS,
                lastUpdated: Date.now(),
                totalFound: allListings.length,
            });
        }

        if (!model) {
            return NextResponse.json({ error: 'Model parameter is required', availableModels: MODEL_SLUGS }, { status: 400 });
        }

        const listings = await scrapeAutoScout24(make, model, yearFrom, maxKm);
        listings.sort((a, b) => b.estimatedProfit - a.estimatedProfit || a.price - b.price);

        return NextResponse.json({
            listings: listings.slice(0, 30),
            importCostBreakdown: IMPORT_COSTS,
            lastUpdated: Date.now(),
            totalFound: listings.length,
            searchParams: { make, model, yearFrom, maxKm },
        });
    } catch (error: any) {
        console.error('Cars API Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch car data' }, { status: 500 });
    }
}
