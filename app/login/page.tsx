// app/login/page.tsx
'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // La contraseña secreta se validará en un API Route
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      // Si el login es correcto, redirige al dashboard
      window.location.href = '/';
    } else {
      setError('Acceso denegado.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="w-full max-w-xs p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem]">
        <h1 className="text-2xl font-black text-center">Ape Intelligence OS</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Token de Acceso"
            className="w-full px-4 py-2 text-sm bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <button type="submit" className="w-full py-2 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">
            Entrar
          </button>
          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
}
