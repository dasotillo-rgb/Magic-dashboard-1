import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (password === 'Apedashboard') {
      const response = NextResponse.json({ success: true });
      response.cookies.set('ape-auth-token', 'Apedashboard', {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }
    return NextResponse.json({ error: 'Denegado' }, { status: 401 });
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
