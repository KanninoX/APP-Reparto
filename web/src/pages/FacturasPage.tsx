import { useEffect, useState } from 'react';
import api from '../services/api';

interface PedidoResumen { id: number; cliente?: { nombre: string }; }
interface Factura {
  id: number;
  pedido: PedidoResumen;
  numeroFactura: string;
  montoTotal: number;
  fechaEmision: string;
  estado: string;
  urlPdfS3?: string;
}

const ESTADOS_F = ['PENDIENTE', 'PAGADA', 'VENCIDA', 'ANULADA'];

const BADGE: Record<string, string> = {
  PENDIENTE: 'bg-[#316bf3]/10 text-[#316bf3] border border-[#316bf3]/30',
  PAGADA:    'bg-[#6ffbbe]/20 text-[#20bf86] border border-[#6ffbbe]/40',
  VENCIDA:   'bg-[#ffdad6] text-[#93000a] border border-[#ffdad6]',
  ANULADA:   'bg-[#e1e2e4] text-[#747782] border border-[#c4c6d2]',
};

const EMPTY_FORM = { pedidoId: '' as string | number, numeroFactura: '', montoTotal: '' };

function formatMonto(n: number) {
  return `$${Number(n).toLocaleString('es-CL')}`;
}

function formatFecha(f: string | null) {
  if (!f) return '—';
  try { return new Date(f).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return f; }
}

export default function FacturasPage() {
  const [facturas, setFacturas]   = useState<Factura[]>([]);
  const [pedidos, setPedidos]     = useState<PedidoResumen[]>([]);
  const [open, setOpen]           = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [error, setError]         = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const cargar = () => {
    const params = filtroEstado ? `?estado=${filtroEstado}` : '';
    api.get(`/facturas${params}`).then((r) => setFacturas(r.data.data ?? []));
  };
  useEffect(() => { cargar(); }, [filtroEstado]);
  useEffect(() => { api.get('/pedidos?estado=ENTREGADO').then((r) => setPedidos(r.data.data ?? [])); }, []);

  const guardar = async () => {
    setError('');
    if (!form.pedidoId || !form.numeroFactura || !form.montoTotal) { setError('Todos los campos son obligatorios'); return; }
    try {
      await api.post('/facturas', {
        pedido: { id: Number(form.pedidoId) },
        numeroFactura: form.numeroFactura,
        montoTotal: parseFloat(form.montoTotal),
      });
      setOpen(false); setForm(EMPTY_FORM); cargar();
    } catch { setError('Error al crear factura. El pedido puede ya tener una factura.'); }
  };

  const cambiarEstado = async (id: number, estado: string) => {
    await api.patch(`/facturas/${id}/estado?estado=${estado}`);
    cargar();
  };

  const pendientes = facturas.filter(f => f.estado === 'PENDIENTE');
  const pagadas    = facturas.filter(f => f.estado === 'PAGADA');
  const vencidas   = facturas.filter(f => f.estado === 'VENCIDA');
  const totalPendiente = pendientes.reduce((s, f) => s + Number(f.montoTotal), 0);
  const efectividad = facturas.length > 0
    ? ((pagadas.length / facturas.length) * 100).toFixed(0) + '%'
    : '0%';

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-semibold text-[#00255a]">Facturas</h2>
          <nav className="flex items-center gap-2 text-[#434750] text-[11px] font-semibold mt-0.5">
            <a href="#" className="hover:text-[#00255a]">Dashboard</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#191c1e]">Gestión de Facturas</span>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setFilterOpen(v => !v)}
              className="flex items-center gap-2 bg-white border border-[#c4c6d2] px-4 py-2 rounded-lg text-[12px] font-medium hover:bg-[#f3f4f6] transition-colors">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              Estado: {filtroEstado || 'Todos'}
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-[#c4c6d2] rounded-lg shadow-lg z-10 overflow-hidden">
                {['', ...ESTADOS_F].map(e => (
                  <button key={e} onClick={() => { setFiltroEstado(e); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-[12px] hover:bg-[#f3f4f6] transition-colors ${filtroEstado === e ? 'font-bold text-[#00255a]' : 'text-[#191c1e]'}`}>
                    {e || 'Todos'}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => { setOpen(true); setError(''); }}
            className="flex items-center gap-2 bg-[#00255a] text-white px-4 py-2 rounded-lg text-[12px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nueva Factura
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: 'payments',       bg: 'bg-[#ffdad6]',  text: 'text-[#93000a]', label: 'Total Pendiente',    value: formatMonto(totalPendiente) },
          { icon: 'check_circle',   bg: 'bg-[#6ffbbe]',  text: 'text-[#002113]', label: 'Pagadas Hoy',        value: pagadas.length },
          { icon: 'warning',        bg: 'bg-[#ffdad6]',  text: 'text-[#ba1a1a]', label: 'Vencidas',           value: vencidas.length },
          { icon: 'trending_up',    bg: 'bg-[#d8e2ff]',  text: 'text-[#00255a]', label: 'Efectividad Cobro',  value: efectividad },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-[#c4c6d2] p-4 shadow-sm hover:border-[#00255a] transition-colors cursor-default">
            <div className="flex justify-between items-start mb-3">
              <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-[20px] ${kpi.text}`}>{kpi.icon}</span>
              </div>
            </div>
            <p className="text-[12px] text-[#434750]">{kpi.label}</p>
            <p className="text-[24px] font-bold text-[#191c1e]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Main grid: table + upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Table */}
        <div className="lg:col-span-2 bg-white border border-[#c4c6d2] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f3f4f6] border-b border-[#c4c6d2]">
                  {['#', 'Pedido / Cliente', 'N° Factura', 'Monto', 'Emisión', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-[#434750] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e8ea]">
                {facturas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-[#747782]">
                      <span className="material-symbols-outlined text-[48px] block mb-2 opacity-20">receipt_long</span>
                      <span className="text-[13px]">Sin facturas</span>
                    </td>
                  </tr>
                )}
                {facturas.map(f => (
                  <tr key={f.id} className="hover:bg-[#f3f4f6] transition-colors">
                    <td className="px-4 py-4 text-[12px] font-bold text-[#00255a]">#{f.id}</td>
                    <td className="px-4 py-4">
                      <p className="text-[12px] font-semibold text-[#191c1e]">ORD-{String(f.pedido.id).padStart(4, '0')}</p>
                      {f.pedido.cliente && <p className="text-[11px] text-[#747782]">{f.pedido.cliente.nombre}</p>}
                    </td>
                    <td className="px-4 py-4 text-[12px] font-medium text-[#434750]">{f.numeroFactura}</td>
                    <td className="px-4 py-4 text-[13px] font-bold text-[#191c1e]">{formatMonto(f.montoTotal)}</td>
                    <td className="px-4 py-4 text-[12px] text-[#434750]">{formatFecha(f.fechaEmision)}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${BADGE[f.estado] ?? 'bg-[#f3f4f6] text-[#434750] border border-[#c4c6d2]'}`}>
                        {f.estado}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1.5">
                        {f.estado === 'PENDIENTE' && (
                          <button onClick={() => cambiarEstado(f.id, 'PAGADA')}
                            className="bg-[#edeef0] text-[#20bf86] hover:bg-[#20bf86] hover:text-white text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all">
                            Marcar Pagada
                          </button>
                        )}
                        {f.urlPdfS3 && (
                          <a href={f.urlPdfS3} target="_blank" rel="noopener noreferrer"
                            className="bg-[#edeef0] text-[#434750] hover:bg-[#434750] hover:text-white text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all">
                            PDF
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: próximos vencimientos + CTA */}
        <div className="space-y-4">
          {/* Próximos vencimientos */}
          <div className="bg-white border border-[#c4c6d2] rounded-xl shadow-sm p-5">
            <h3 className="text-[15px] font-semibold text-[#191c1e] mb-4">Próximos Vencimientos</h3>
            {pendientes.length === 0 ? (
              <div className="text-center py-6 text-[#747782]">
                <span className="material-symbols-outlined text-[32px] block mb-1 opacity-20">event_available</span>
                <span className="text-[12px]">Sin vencimientos próximos</span>
              </div>
            ) : (
              <div className="space-y-3">
                {pendientes.slice(0, 4).map(f => (
                  <div key={f.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[#e7e8ea] hover:bg-[#f8f9fb] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#ffdad6] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#ba1a1a] text-[16px]">receipt</span>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-[#191c1e]">{f.numeroFactura}</p>
                        <p className="text-[11px] text-[#747782]">{formatFecha(f.fechaEmision)}</p>
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-[#ba1a1a]">{formatMonto(f.montoTotal)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optimización CTA */}
          <div className="bg-[#0f3b7e] rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-[#316bf3] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-white text-[20px]">auto_awesome</span>
            </div>
            <h3 className="text-[14px] font-bold text-white mb-1">Optimiza tus cobros</h3>
            <p className="text-[12px] text-white/70 mb-4">Automatiza recordatorios de pago y mejora tu flujo de caja.</p>
            <button className="w-full bg-[#316bf3] text-white text-[12px] font-bold py-2 rounded-lg hover:opacity-90 transition-opacity">
              Ver herramientas
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#c4c6d2]">
              <h2 className="text-[18px] font-semibold text-[#191c1e]">Nueva Factura</h2>
              <button onClick={() => setOpen(false)} className="text-[#747782] hover:text-[#191c1e] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="p-3 rounded-lg bg-[#ffdad6] text-[#93000a] text-[13px]">{error}</div>}
              <div>
                <label className="block text-[12px] font-semibold text-[#434750] mb-1">Pedido (entregado) *</label>
                <select value={form.pedidoId} onChange={e => setForm(f => ({ ...f, pedidoId: e.target.value }))}
                  className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]">
                  <option value="">Seleccionar pedido...</option>
                  {pedidos.map(p => (
                    <option key={p.id} value={p.id}>ORD-{String(p.id).padStart(4, '0')} — {p.cliente?.nombre ?? ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#434750] mb-1">N° Factura *</label>
                <input type="text" value={form.numeroFactura} onChange={e => setForm(f => ({ ...f, numeroFactura: e.target.value }))}
                  className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]"
                  placeholder="Ej: FAC-20250001" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#434750] mb-1">Monto total ($) *</label>
                <input type="number" value={form.montoTotal} onChange={e => setForm(f => ({ ...f, montoTotal: e.target.value }))}
                  className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]"
                  placeholder="0" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#c4c6d2]">
              <button onClick={() => setOpen(false)}
                className="h-9 px-5 text-[13px] font-semibold text-[#434750] border border-[#c4c6d2] rounded-lg hover:bg-[#f3f4f6] transition-colors">
                Cancelar
              </button>
              <button onClick={guardar}
                className="h-9 px-5 text-[13px] font-semibold bg-[#00255a] text-white rounded-lg hover:opacity-90 active:scale-95 transition-all">
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
