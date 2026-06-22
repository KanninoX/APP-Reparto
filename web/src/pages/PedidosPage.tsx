import { useEffect, useState } from 'react';
import api from '../services/api';

interface Cliente { id: number; nombre: string; }
interface Pedido {
  id: number;
  cliente: Cliente;
  estado: string;
  direccionEntrega: string;
  fechaCreacion: string;
  fechaEntrega: string;
  prioridad: string;
  observaciones: string;
}

const ESTADOS = ['PENDIENTE', 'ASIGNADO', 'EN_RUTA', 'ENTREGADO', 'RECHAZADO', 'REAGENDADO'];

const ESTADO_BADGE: Record<string, string> = {
  ENTREGADO:  'bg-[#6ffbbe]/20 text-[#20bf86] border border-[#6ffbbe]/40',
  EN_RUTA:    'bg-[#316bf3]/10 text-[#316bf3] border border-[#316bf3]/30',
  PENDIENTE:  'bg-[#316bf3]/10 text-[#316bf3] border border-[#316bf3]/30',
  ASIGNADO:   'bg-[#dbe1ff] text-[#003ea8] border border-[#dbe1ff]',
  RECHAZADO:  'bg-[#ffdad6] text-[#93000a] border border-[#ffdad6]',
  REAGENDADO: 'bg-[#e1e2e4] text-[#434750] border border-[#e1e2e4]',
};

const PRIORIDAD_DOT: Record<string, string> = {
  ALTA:   'bg-[#ba1a1a]',
  NORMAL: 'bg-[#747782]',
  BAJA:   'bg-[#00472f]',
};

const PRIORIDAD_TEXT: Record<string, string> = {
  ALTA:   'text-[#ba1a1a]',
  NORMAL: 'text-[#747782]',
  BAJA:   'text-[#00472f]',
};

const AVATAR_COLORS = [
  'bg-[#dbe1ff] text-[#00174b]',
  'bg-[#6ffbbe] text-[#002113]',
  'bg-[#d8e2ff] text-[#001a43]',
  'bg-[#b4c5ff] text-[#003ea8]',
  'bg-[#e1e2e4] text-[#191c1e]',
];

function getInitials(nombre: string) {
  return nombre.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function formatFecha(f: string | null) {
  if (!f) return '—';
  try { return new Date(f).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return f; }
}

const EMPTY_FORM = {
  clienteId: '' as string | number,
  direccionEntrega: '',
  fechaEntrega: '',
  prioridad: 'NORMAL',
  observaciones: '',
};

const PAGE_SIZE = 10;

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);

  const cargar = () => {
    const params = filtroEstado ? `?estado=${filtroEstado}` : '';
    api.get(`/pedidos${params}`).then((r) => { setPedidos(r.data.data ?? []); setPage(0); });
  };

  useEffect(() => { cargar(); }, [filtroEstado]);
  useEffect(() => { api.get('/clientes').then((r) => setClientes(r.data.data ?? [])); }, []);

  const cambiarEstado = async (id: number, estado: string) => {
    await api.put(`/pedidos/${id}/estado?estado=${estado}`);
    cargar();
  };

  const guardar = async () => {
    setError('');
    if (!form.clienteId || !form.direccionEntrega) { setError('Cliente y dirección son obligatorios'); return; }
    try {
      await api.post('/pedidos', {
        cliente: { id: Number(form.clienteId) },
        direccionEntrega: form.direccionEntrega,
        fechaEntrega: form.fechaEntrega || null,
        prioridad: form.prioridad,
        observaciones: form.observaciones,
      });
      setOpen(false);
      setForm(EMPTY_FORM);
      cargar();
    } catch { setError('Error al crear pedido'); }
  };

  const totalPages = Math.ceil(pedidos.length / PAGE_SIZE);
  const pageItems  = pedidos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const entregados   = pedidos.filter(p => p.estado === 'ENTREGADO').length;
  const efectividad  = pedidos.length > 0 ? ((entregados / pedidos.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-5">

      {/* Section header + breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-semibold text-[#00255a]">Pedidos</h2>
          <nav className="flex items-center gap-2 text-[#434750] text-[11px] font-semibold mt-0.5">
            <a href="#" className="hover:text-[#00255a]">Dashboard</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#191c1e]">Envíos Pendientes</span>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(v => !v)}
              className="flex items-center gap-2 bg-white border border-[#c4c6d2] px-4 py-2 rounded-lg text-[12px] font-medium hover:bg-[#f3f4f6] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              Estado: {filtroEstado || 'Todos'}
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-[#c4c6d2] rounded-lg shadow-lg z-10 overflow-hidden">
                {['', ...ESTADOS].map(e => (
                  <button key={e} onClick={() => { setFiltroEstado(e); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-[12px] hover:bg-[#f3f4f6] transition-colors ${filtroEstado === e ? 'font-bold text-[#00255a]' : 'text-[#191c1e]'}`}>
                    {e || 'Todos'}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Export */}
          <button className="bg-white border border-[#c4c6d2] p-2 rounded-lg hover:bg-[#f3f4f6] transition-colors" title="Exportar">
            <span className="material-symbols-outlined text-[20px] text-[#434750]">download</span>
          </button>
          {/* New order */}
          <button onClick={() => { setOpen(true); setError(''); }}
            className="flex items-center gap-2 bg-[#00255a] text-white px-4 py-2 rounded-lg text-[12px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            + Nuevo Pedido
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border border-[#c4c6d2] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f3f4f6] border-b border-[#c4c6d2]">
                {['#', 'Cliente', 'Dirección', 'Fecha Entrega', 'Estado', 'Prioridad', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-[11px] font-semibold text-[#434750] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e8ea]">
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#747782]">
                    <span className="material-symbols-outlined text-[48px] block mb-2 opacity-20">inventory_2</span>
                    <span className="text-[13px]">Sin pedidos</span>
                  </td>
                </tr>
              )}
              {pageItems.map(p => (
                <tr key={p.id} className="hover:bg-[#f3f4f6] transition-colors cursor-pointer">
                  <td className="px-4 py-4 text-[13px] font-bold text-[#00255a]">ORD-{String(p.id).padStart(4, '0')}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getAvatarColor(p.id)}`}>
                        {getInitials(p.cliente?.nombre ?? 'NA')}
                      </div>
                      <span className="text-[12px] font-medium text-[#191c1e]">{p.cliente?.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[12px] text-[#434750] max-w-[200px] truncate">{p.direccionEntrega}</td>
                  <td className="px-4 py-4 text-[12px] text-[#434750]">{formatFecha(p.fechaEntrega)}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${ESTADO_BADGE[p.estado] ?? 'bg-[#f3f4f6] text-[#434750] border border-[#c4c6d2]'}`}>
                      {p.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className={`flex items-center gap-1.5 text-[11px] font-bold ${PRIORIDAD_TEXT[p.prioridad] ?? 'text-[#747782]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${PRIORIDAD_DOT[p.prioridad] ?? 'bg-[#747782]'}`} />
                      {p.prioridad}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex gap-1.5 justify-end flex-wrap">
                      {p.estado === 'PENDIENTE' && (
                        <button onClick={() => cambiarEstado(p.id, 'ASIGNADO')}
                          className="bg-[#edeef0] text-[#00255a] hover:bg-[#00255a] hover:text-white text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all">
                          Asignar
                        </button>
                      )}
                      {p.estado === 'ASIGNADO' && (
                        <button onClick={() => cambiarEstado(p.id, 'EN_RUTA')}
                          className="bg-[#edeef0] text-[#00255a] hover:bg-[#00255a] hover:text-white text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all">
                          En Ruta
                        </button>
                      )}
                      {p.estado === 'EN_RUTA' && (
                        <>
                          <button onClick={() => cambiarEstado(p.id, 'ENTREGADO')}
                            className="bg-[#edeef0] text-[#20bf86] hover:bg-[#20bf86] hover:text-white text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all">
                            Entregar
                          </button>
                          <button onClick={() => cambiarEstado(p.id, 'RECHAZADO')}
                            className="bg-[#ffdad6] text-[#93000a] hover:bg-[#93000a] hover:text-white text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all">
                            Rechazar
                          </button>
                        </>
                      )}
                      {p.estado === 'RECHAZADO' && (
                        <button onClick={() => cambiarEstado(p.id, 'REAGENDADO')}
                          className="bg-[#edeef0] text-[#434750] hover:bg-[#434750] hover:text-white text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all">
                          Reagendar
                        </button>
                      )}
                      {(p.estado === 'ENTREGADO' || p.estado === 'REAGENDADO') && (
                        <button className="bg-[#edeef0] text-[#00255a] text-[12px] font-medium px-3 py-1.5 rounded-lg">
                          Ver Detalle
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-[#e7e8ea] bg-white">
            <span className="text-[11px] font-semibold text-[#434750]">
              Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, pedidos.length)} de {pedidos.length} pedidos
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-1 rounded hover:bg-[#f3f4f6] disabled:opacity-30 transition-colors">
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`w-8 h-8 rounded text-[11px] font-semibold transition-colors ${i === page ? 'bg-[#00255a] text-white' : 'hover:bg-[#f3f4f6] text-[#191c1e]'}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                className="p-1 rounded hover:bg-[#f3f4f6] disabled:opacity-30 transition-colors">
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: 'schedule',       bg: 'bg-[#d8e2ff]', text: 'text-[#00255a]', label: 'Tiempo Prom. Despacho', value: '45.2 min' },
          { icon: 'check_circle',   bg: 'bg-[#6ffbbe]',  text: 'text-[#002113]', label: 'Efectividad Hoy',        value: `${efectividad}%` },
          { icon: 'local_shipping', bg: 'bg-[#dbe1ff]',  text: 'text-[#0051d5]', label: 'Vehículos Activos',      value: '12 / 15' },
          { icon: 'warning',        bg: 'bg-[#ffdad6]',  text: 'text-[#ba1a1a]', label: 'Retrasos Reportados',    value: '02' },
        ].map(m => (
          <div key={m.label} className="bg-white p-4 rounded-xl border border-[#c4c6d2] flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-full ${m.bg} flex items-center justify-center shrink-0`}>
              <span className={`material-symbols-outlined text-[20px] ${m.text}`}>{m.icon}</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#434750]">{m.label}</p>
              <p className="text-[18px] font-semibold text-[#191c1e]">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal nuevo pedido */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#c4c6d2]">
              <h2 className="text-[18px] font-semibold text-[#191c1e]">Nuevo Pedido</h2>
              <button onClick={() => setOpen(false)} className="text-[#747782] hover:text-[#191c1e] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="p-3 rounded-lg bg-[#ffdad6] text-[#93000a] text-[13px]">{error}</div>}
              <div>
                <label className="block text-[12px] font-semibold text-[#434750] mb-1">Cliente *</label>
                <select value={form.clienteId} onChange={e => setForm(f => ({ ...f, clienteId: e.target.value }))}
                  className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]">
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#434750] mb-1">Dirección de entrega *</label>
                <input type="text" value={form.direccionEntrega}
                  onChange={e => setForm(f => ({ ...f, direccionEntrega: e.target.value }))}
                  className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]"
                  placeholder="Ej: Av. Libertador 1234, Santiago" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#434750] mb-1">Fecha de entrega</label>
                  <input type="date" value={form.fechaEntrega}
                    onChange={e => setForm(f => ({ ...f, fechaEntrega: e.target.value }))}
                    className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#434750] mb-1">Prioridad</label>
                  <select value={form.prioridad} onChange={e => setForm(f => ({ ...f, prioridad: e.target.value }))}
                    className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]">
                    {['ALTA', 'NORMAL', 'BAJA'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#434750] mb-1">Observaciones</label>
                <textarea value={form.observaciones} rows={3}
                  onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                  className="w-full px-3 py-2 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5] resize-none"
                  placeholder="Notas adicionales..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#c4c6d2]">
              <button onClick={() => setOpen(false)}
                className="h-9 px-5 text-[13px] font-semibold text-[#434750] border border-[#c4c6d2] rounded-lg hover:bg-[#f3f4f6] transition-colors">
                Cancelar
              </button>
              <button onClick={guardar}
                className="h-9 px-5 text-[13px] font-semibold bg-[#00255a] text-white rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm">
                Crear Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
