import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import OperarioRutaTab from './OperarioRutaTab';
import OperarioPerfilTab from './OperarioPerfilTab';

type Tab = 'ruta' | 'perfil';

export default function OperarioLayout() {
  const [tab, setTab] = useState<Tab>('ruta');
  const { user } = useAuth();

  return (
    // Fondo oscuro simulando pantalla fuera del teléfono
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      {/* Shell del teléfono */}
      <div className="relative w-full max-w-[390px] h-[844px] bg-[#F3F4F6] rounded-[40px] overflow-hidden shadow-2xl flex flex-col"
           style={{ boxShadow: '0 0 0 8px #2a2a3e, 0 30px 80px rgba(0,0,0,0.6)' }}>

        {/* Notch / status bar */}
        <div className="bg-[#0F3B7E] flex items-center justify-between px-6 pt-3 pb-2 shrink-0">
          <span className="text-white text-[11px] font-semibold">9:41</span>
          <div className="w-24 h-5 bg-black rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <div className="flex items-center gap-1.5">
            <svg width="14" height="10" viewBox="0 0 14 10" fill="white">
              <rect x="0" y="3" width="2" height="7" rx="1"/><rect x="3" y="2" width="2" height="8" rx="1"/>
              <rect x="6" y="1" width="2" height="9" rx="1"/><rect x="9" y="0" width="2" height="10" rx="1"/>
            </svg>
            <svg width="14" height="10" viewBox="0 0 24 12" fill="white">
              <path d="M1 4C5.5 0 18.5 0 23 4" stroke="white" strokeWidth="2" fill="none"/>
              <path d="M4 7C7.5 4 16.5 4 20 7" stroke="white" strokeWidth="2" fill="none"/>
              <circle cx="12" cy="11" r="2" fill="white"/>
            </svg>
            <div className="flex items-center gap-0.5">
              <div className="w-5 h-2.5 rounded-sm border border-white/80 relative">
                <div className="absolute inset-0.5 bg-white rounded-[1px] w-3/4" />
              </div>
            </div>
          </div>
        </div>

        {/* Header azul con nombre */}
        <div className="bg-[#0F3B7E] px-5 pb-4 shrink-0">
          <p className="text-white/60 text-[11px]">Bienvenido</p>
          <p className="text-white font-bold text-[16px]">{user?.nombre}</p>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'ruta'   && <OperarioRutaTab />}
          {tab === 'perfil' && <OperarioPerfilTab />}
        </div>

        {/* Bottom tab bar */}
        <div className="bg-white border-t border-[#E5E7EB] flex shrink-0"
             style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}>
          {([
            { id: 'ruta',   icon: 'local_shipping', label: 'Mi Ruta' },
            { id: 'perfil', icon: 'person',          label: 'Perfil'  },
          ] as { id: Tab; icon: string; label: string }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${
                tab === t.id ? 'text-[#2563EB]' : 'text-[#9CA3AF]'
              }`}>
              <span className="material-symbols-outlined text-[24px]">{t.icon}</span>
              <span className="text-[10px] font-semibold">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
