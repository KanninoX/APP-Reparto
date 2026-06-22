import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import logo from '../assets/logo.svg';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, rol, nombre } = res.data.data;
      login(token, rol, nombre);
      navigate('/');
    } catch {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[#f3f4f6]">
      <main className="w-full max-w-[440px]">

        {/* Logo & branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-[#00255a] rounded-2xl shadow-lg flex items-center justify-center mb-5 p-3">
            <img src={logo} alt="App Reparto" className="w-full h-full" />
          </div>
          <h1 className="text-[32px] font-bold leading-10 tracking-tight text-[#00255a]">App Reparto</h1>
          <p className="text-[14px] text-[#434750] mt-1">Gestión de Reparto y Distribución</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#c4c6d2] rounded-xl p-8 shadow-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[12px] font-medium tracking-wide text-[#434750] block" htmlFor="email">
                Correo Electrónico
              </label>
              <div className="relative flex items-center rounded-lg border border-[#747782] transition-all focus-within:border-[#0051d5] focus-within:ring-2 focus-within:ring-[#0051d5]/20">
                <span className="material-symbols-outlined absolute left-3 text-[#747782] text-[20px]">mail</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nombre@empresa.com"
                  required
                  className="w-full bg-transparent border-none outline-none py-3 pl-10 pr-4 text-[#191c1e] text-[14px] placeholder:text-[#c4c6d2] rounded-lg"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[12px] font-medium tracking-wide text-[#434750] block" htmlFor="password">
                Contraseña
              </label>
              <div className="relative flex items-center rounded-lg border border-[#747782] transition-all focus-within:border-[#0051d5] focus-within:ring-2 focus-within:ring-[#0051d5]/20">
                <span className="material-symbols-outlined absolute left-3 text-[#747782] text-[20px]">lock</span>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-transparent border-none outline-none py-3 pl-10 pr-12 text-[#191c1e] text-[14px] placeholder:text-[#c4c6d2] rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 text-[#434750] hover:text-[#0051d5] transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPw ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-[#ffdad6] rounded-lg">
                <span className="material-symbols-outlined text-[#93000a] text-[18px]">error</span>
                <span className="text-[13px] text-[#93000a]">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0051d5] text-white text-[20px] font-semibold py-4 rounded-lg shadow-sm hover:bg-[#0051d5]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-[11px] font-semibold text-[#434750]">
            © 2025 App Reparto S.A. Todos los derechos reservados.
          </p>
        </footer>
      </main>
    </div>
  );
}
