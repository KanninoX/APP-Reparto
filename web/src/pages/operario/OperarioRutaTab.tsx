import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';

interface RutaPedido {
  ordenEntrega: number;
  pedido: {
    id: number; direccionEntrega: string; estado: string;
    observaciones?: string;
    cliente: { nombre: string; rut: string; telefono?: string };
  };
}
interface Ruta { id: number; nombre: string; fecha: string; rutaPedidos: RutaPedido[]; }

const MOTIVOS = [
  'Cliente ausente', 'Dirección incorrecta', 'Producto dañado',
  'Rechazado por el cliente', 'Acceso bloqueado', 'Otro',
];

const ESTADO_COLOR: Record<string, string> = {
  ENTREGADO:  'bg-[#10B981] text-white',
  EN_RUTA:    'bg-[#F59E0B] text-white',
  RECHAZADO:  'bg-[#EF4444] text-white',
  REAGENDADO: 'bg-[#8B5CF6] text-white',
  ASIGNADO:   'bg-[#2563EB] text-white',
  PENDIENTE:  'bg-[#E5E7EB] text-[#6B7280]',
};

export default function OperarioRutaTab() {
  const [ruta, setRuta]                   = useState<Ruta | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [detalle, setDetalle]             = useState<RutaPedido | null>(null);
  const [modalRechazo, setModalRechazo]   = useState(false);
  const [motivo, setMotivo]               = useState('');
  const [reagendar, setReagendar]         = useState(false);
  const [fotoNombre, setFotoNombre]       = useState('');
  const [guardando, setGuardando]         = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cargar = () => {
    setLoading(true);
    api.get('/rutas/mi-ruta')
      .then(r => setRuta(r.data.data))
      .catch(() => setError('No tienes una ruta activa por el momento.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const marcarEntregado = async () => {
    if (!fotoNombre) { alert('Debes adjuntar la foto de la factura firmada.'); return; }
    setGuardando(true);
    try {
      // Si hay archivo real, subirlo
      const file = fileRef.current?.files?.[0];
      if (file) {
        const fd = new FormData();
        fd.append('archivo', file);
        fd.append('pedidoId', String(detalle!.pedido.id));
        fd.append('tipo', 'FOTO_FACTURA');
        await api.post('/documentos/subir', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      await api.put(`/pedidos/${detalle!.pedido.id}/estado?estado=ENTREGADO`);
      setDetalle(null); setFotoNombre('');
      cargar();
    } catch { alert('Error al registrar entrega.'); }
    finally { setGuardando(false); }
  };

  const confirmarRechazo = async () => {
    if (!motivo) { alert('Selecciona un motivo de rechazo.'); return; }
    setGuardando(true);
    const estado = reagendar ? 'REAGENDADO' : 'RECHAZADO';
    try {
      await api.put(`/pedidos/${detalle!.pedido.id}/estado?estado=${estado}&motivoRechazo=${encodeURIComponent(motivo)}&reagendar=${reagendar}`);
      setDetalle(null); setModalRechazo(false); setMotivo(''); setReagendar(false);
      cargar();
    } catch { alert('Error al registrar rechazo.'); }
    finally { setGuardando(false); }
  };

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
      <p className="text-[12px] text-[#9CA3AF]">{error || 'El ejecutivo aún no te ha asignado una ruta.'}</p>
    </div>
  );

  const pedidos = [...ruta.rutaPedidos].sort((a, b) => a.ordenEntrega - b.ordenEntrega);
  const entregados = pedidos.filter(p => p.pedido.estado === 'ENTREGADO').length;

  return (
    <div className="flex flex-col h-full">

      {/* Cabecera */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 py-3 shrink-0">
        <p className="font-bold text-[#1F2937] text-[15px]">{ruta.nombre}</p>
        <p className="text-[11px] text-[#6B7280]">Fecha: {ruta.fecha} · {pedidos.length} paradas</p>
        <div className="mt-2 bg-[#E5E7EB] rounded-full h-1.5 overflow-hidden">
          <div className="bg-[#10B981] h-full rounded-full transition-all"
               style={{ width: `${pedidos.length ? (entregados / pedidos.length) * 100 : 0}%` }} />
        </div>
        <p className="text-[10px] text-[#9CA3AF] mt-1">{entregados} de {pedidos.length} entregados</p>
      </div>

      {/* Lista de paradas */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#F3F4F6] bg-white">
        {pedidos.map((rp) => (
          <button key={rp.pedido.id} onClick={() => { setDetalle(rp); setFotoNombre(''); }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FF] transition-colors text-left">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
              <span className="text-[#2563EB] font-black text-[13px]">{rp.ordenEntrega + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1F2937] text-[13px] truncate">{rp.pedido.cliente?.nombre}</p>
              <p className="text-[11px] text-[#6B7280] truncate">{rp.pedido.direccionEntrega}</p>
            </div>
            <span className={`shrink-0 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${ESTADO_COLOR[rp.pedido.estado] ?? 'bg-[#E5E7EB] text-[#6B7280]'}`}>
              {rp.pedido.estado.replace('_', ' ')}
            </span>
          </button>
        ))}
      </div>

      {/* ── MODAL DETALLE PEDIDO ── */}
      {detalle && !modalRechazo && (
        <div className="absolute inset-0 bg-[#F3F4F6] flex flex-col z-10">
          {/* Header */}
          <div className="bg-[#0F3B7E] px-4 py-4 flex items-center gap-3 shrink-0">
            <button onClick={() => setDetalle(null)} className="text-white">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <p className="text-white font-bold text-[16px]">Detalle del Pedido</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Info cliente */}
            <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] space-y-2">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Cliente</p>
              <p className="font-bold text-[#1F2937]">{detalle.pedido.cliente?.nombre}</p>
              <p className="text-[12px] text-[#6B7280]">RUT: {detalle.pedido.cliente?.rut}</p>
              {detalle.pedido.cliente?.telefono && (
                <p className="text-[12px] text-[#6B7280]">Tel: {detalle.pedido.cliente.telefono}</p>
              )}
            </div>

            {/* Dirección */}
            <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB]">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">Dirección de entrega</p>
              <p className="text-[14px] text-[#1F2937]">{detalle.pedido.direccionEntrega}</p>
            </div>

            {/* Estado */}
            <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] flex justify-between items-center">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Estado</p>
              <span className={`text-[11px] font-bold uppercase px-3 py-1 rounded-full ${ESTADO_COLOR[detalle.pedido.estado]}`}>
                {detalle.pedido.estado.replace('_', ' ')}
              </span>
            </div>

            {/* Observaciones */}
            {detalle.pedido.observaciones && (
              <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB]">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">Observaciones</p>
                <p className="text-[13px] text-[#374151]">{detalle.pedido.observaciones}</p>
              </div>
            )}

            {/* Acciones solo si está EN_RUTA o ASIGNADO */}
            {(detalle.pedido.estado === 'EN_RUTA' || detalle.pedido.estado === 'ASIGNADO') && (
              <div className="space-y-3 pt-1">
                {/* Upload foto factura */}
                <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB]">
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">
                    📷 Foto factura firmada <span className="text-[#EF4444]">*obligatoria</span>
                  </p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => setFotoNombre(e.target.files?.[0]?.name ?? '')} />
                  <button onClick={() => fileRef.current?.click()}
                    className={`w-full py-3 rounded-xl border-2 border-dashed text-[13px] font-semibold transition-colors ${
                      fotoNombre ? 'border-[#10B981] bg-[#F0FDF4] text-[#10B981]' : 'border-[#D1D5DB] text-[#9CA3AF] hover:border-[#2563EB] hover:text-[#2563EB]'
                    }`}>
                    {fotoNombre ? `✓ ${fotoNombre}` : 'Seleccionar foto'}
                  </button>
                </div>

                {/* Botón entregar */}
                <button onClick={marcarEntregado} disabled={guardando}
                  className="w-full bg-[#10B981] text-white font-bold text-[15px] py-4 rounded-2xl disabled:opacity-60">
                  {guardando ? 'Registrando...' : '✓ Marcar como Entregado'}
                </button>

                {/* Botón rechazar */}
                <button onClick={() => setModalRechazo(true)} disabled={guardando}
                  className="w-full bg-[#EF4444] text-white font-bold text-[15px] py-4 rounded-2xl disabled:opacity-60">
                  ✗ Marcar como Fallido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL RAZONES RECHAZO ── */}
      {detalle && modalRechazo && (
        <div className="absolute inset-0 bg-black/50 flex items-end z-20">
          <div className="bg-white w-full rounded-t-3xl p-5 max-h-[85%] overflow-y-auto">
            <p className="font-bold text-[18px] text-[#111827] mb-1">Motivo del rechazo</p>
            <p className="text-[12px] text-[#6B7280] mb-4">Selecciona obligatoriamente un motivo:</p>

            {MOTIVOS.map(m => (
              <button key={m} onClick={() => setMotivo(m)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border mb-2 text-left transition-colors ${
                  motivo === m ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-[#E5E7EB] bg-white'
                }`}>
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${motivo === m ? 'border-[#2563EB] bg-[#2563EB]' : 'border-[#9CA3AF]'}`} />
                <span className="text-[14px] text-[#1F2937]">{m}</span>
              </button>
            ))}

            {/* Reagendar toggle */}
            <button onClick={() => setReagendar(r => !r)}
              className="w-full flex items-center gap-3 px-2 py-3 mb-5">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${reagendar ? 'bg-[#10B981] border-[#10B981]' : 'border-[#9CA3AF]'}`}>
                {reagendar && <span className="text-white text-[12px] font-bold">✓</span>}
              </div>
              <span className="text-[14px] text-[#1F2937]">Reagendar entrega</span>
            </button>

            <div className="flex gap-3">
              <button onClick={() => { setModalRechazo(false); setMotivo(''); setReagendar(false); }}
                className="flex-1 py-4 rounded-2xl border border-[#D1D5DB] text-[14px] font-semibold text-[#374151]">
                Cancelar
              </button>
              <button onClick={confirmarRechazo} disabled={guardando}
                className="flex-1 py-4 rounded-2xl bg-[#EF4444] text-white text-[14px] font-bold disabled:opacity-60">
                {guardando ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
