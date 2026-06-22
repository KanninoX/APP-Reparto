import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface Stats { total: number; entregados: number; rechazados: number; enRuta: number; }

function getInitials(nombre: string) {
  return nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function OperarioPerfilTab() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get('/pedidos/mis-pedidos').then((r) => {
      const pedidos: { estado: string }[] = r.data.data ?? [];
      setStats({
        total:      pedidos.length,
        entregados: pedidos.filter(p => p.estado === 'ENTREGADO').length,
        rechazados: pedidos.filter(p => p.estado === 'RECHAZADO' || p.estado === 'REAGENDADO').length,
        enRuta:     pedidos.filter(p => p.estado === 'EN_RUTA').length,
      });
    }).catch(() => {});
  }, []);

  const nombre = user?.nombre ?? '';

  return (
    <div className="flex flex-col h-full pb-2">
      {/* Avatar header */}
      <div className="bg-[#0F3B7E] flex flex-col items-center py-8 px-6">
        <div className="w-20 h-20 rounded-full bg-[#2563EB] border-4 border-[#86a8f2] flex items-center justify-center mb-3">
          <span className="text-white text-2xl font-black">{getInitials(nombre)}</span>
        </div>
        <p className="text-white font-bold text-lg">{nombre}</p>
        <p className="text-[#93c5fd] text-[12px] mt-0.5">{user?.rol}</p>
        <span className="mt-3 bg-[#1d4ed8] text-[#bfdbfe] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
          Operario de Reparto
        </span>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 p-4">
          {[
            { label: 'Total pedidos', value: stats.total,      color: '#2563EB', icon: '📦' },
            { label: 'Entregados',    value: stats.entregados, color: '#10B981', icon: '✓'  },
            { label: 'Fallidos',      value: stats.rechazados, color: '#EF4444', icon: '✗'  },
            { label: 'En ruta hoy',  value: stats.enRuta,     color: '#F59E0B', icon: '🚚' },
          ].map(s => (
            <div key={s.label}
              className="bg-white rounded-2xl p-4 flex flex-col items-center border border-[#E5E7EB]"
              style={{ borderTopWidth: 3, borderTopColor: s.color }}>
              <span className="text-2xl mb-1">{s.icon}</span>
              <span className="text-3xl font-black" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[10px] text-[#6B7280] text-center mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="mx-4 bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden mb-4">
        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider px-4 pt-3 pb-2">
          Información de sesión
        </p>
        <div className="divide-y divide-[#F3F4F6]">
          <div className="flex justify-between px-4 py-3">
            <span className="text-[13px] text-[#6B7280]">Rol</span>
            <span className="text-[13px] font-semibold text-[#1F2937]">{user?.rol}</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-[13px] text-[#6B7280]">Estado</span>
            <span className="text-[13px] font-semibold text-[#10B981]">● Activo</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mt-auto">
        <button onClick={logout}
          className="w-full bg-[#EF4444] text-white font-bold text-[15px] py-4 rounded-2xl active:opacity-80">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
