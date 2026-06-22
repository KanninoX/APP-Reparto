import { useEffect, useState } from 'react';
import api from '../../services/api';

interface RutaPedido {
  ordenEntrega: number;
  pedido: { id: number; direccionEntrega: string; estado: string; cliente: { nombre: string } };
}
interface Ruta { id: number; nombre: string; fecha: string; rutaPedidos: RutaPedido[]; }

const ESTADO_COLOR: Record<string, string> = {
  ENTREGADO: 'bg-[#10B981] text-white',
  EN_RUTA:   'bg-[#F59E0B] text-white',
  RECHAZADO: 'bg-[#EF4444] text-white',
  REAGENDADO:'bg-[#8B5CF6] text-white',
  ASIGNADO:  'bg-[#2563EB] text-white',
  PENDIENTE: 'bg-[#E5E7EB] text-[#6B7280]',
};

export default function OperarioRutaTab() {
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/rutas/mi-ruta')
      .then(r => setRuta(r.data.data))
      .catch(() => setError('No tienes una ruta activa por el momento.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-[#9CA3AF]">
      <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      <p className="text-[13px]">Cargando ruta...</p>
    </div>
  );

  if (error || !ruta) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
      <span className="text-5xl">🚚</span>
      <p className="text-[15px] font-bold text-[#374151]">Sin ruta activa</p>
      <p className="text-[12px] text-[#9CA3AF]">{error || 'El ejecutivo aún no te ha asignado una ruta para hoy.'}</p>
    </div>
  );

  const pedidos = [...ruta.rutaPedidos].sort((a, b) => a.ordenEntrega - b.ordenEntrega);
  const entregados = pedidos.filter(p => p.pedido.estado === 'ENTREGADO').length;

  return (
    <div className="flex flex-col h-full">
      {/* Cabecera de ruta */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 py-3">
        <p className="font-bold text-[#1F2937] text-[15px]">{ruta.nombre}</p>
        <p className="text-[11px] text-[#6B7280]">Fecha: {ruta.fecha} · {pedidos.length} paradas</p>
        {/* Barra de progreso */}
        <div className="mt-2 bg-[#E5E7EB] rounded-full h-1.5 overflow-hidden">
          <div className="bg-[#10B981] h-full rounded-full transition-all"
               style={{ width: `${pedidos.length ? (entregados / pedidos.length) * 100 : 0}%` }} />
        </div>
        <p className="text-[10px] text-[#9CA3AF] mt-1">{entregados} de {pedidos.length} entregados</p>
      </div>

      {/* Lista de paradas */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#F3F4F6] bg-white">
        {pedidos.map((rp) => (
          <div key={rp.pedido.id} className="flex items-center gap-3 px-4 py-3">
            {/* Número de parada */}
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
              <span className="text-[#2563EB] font-black text-[13px]">{rp.ordenEntrega + 1}</span>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1F2937] text-[13px] truncate">{rp.pedido.cliente?.nombre}</p>
              <p className="text-[11px] text-[#6B7280] truncate">{rp.pedido.direccionEntrega}</p>
            </div>
            {/* Estado badge */}
            <span className={`shrink-0 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${ESTADO_COLOR[rp.pedido.estado] ?? 'bg-[#E5E7EB] text-[#6B7280]'}`}>
              {rp.pedido.estado.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
