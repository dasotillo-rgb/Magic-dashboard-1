import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    assets: "$128,430.22",
    trend: "STRONG BUY",
    location: "13.4°C en Base. Condiciones óptimas para trabajo profundo.",
    status: "OPERATIONAL"
  });
}
