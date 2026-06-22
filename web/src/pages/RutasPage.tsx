import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import api from '../services/api';

interface Vehiculo { id: number; codigo: string; patente: string; }
interface UsuarioOp { id: number; nombre: string; }
interface PedidoResumen { id: number; direccionEntrega: string; estado: string; }
interface RutaPedido { pedido: PedidoResumen; ordenEntrega: number; }
interface Ruta {
  id: number; nombre: string; estado: string; fecha: string;
  vehiculo: Vehiculo; usuario: UsuarioOp; rutaPedidos: RutaPedido[];
}

const ESTADO_BADGE: Record<string, string> = {
  PLANEADA:   'bg-[#dbe1ff] text-[#003ea8] border border-[#dbe1ff]',
  EN_CURSO:   'bg-[#316bf3]/10 text-[#316bf3] border border-[#316bf3]/30',
  COMPLETADA: 'bg-[#6ffbbe]/20 text-[#20bf86] border border-[#6ffbbe]/40',
  CANCELADA:  'bg-[#ffdad6] text-[#93000a] border border-[#ffdad6]',
};

const PEDIDO_BADGE: Record<string, string> = {
  PENDIENTE:  'bg-[#316bf3]/10 text-[#316bf3] border border-[#316bf3]/30',
  ASIGNADO:   'bg-[#dbe1ff] text-[#003ea8] border border-[#dbe1ff]',
  EN_RUTA:    'bg-[#316bf3]/10 text-[#316bf3] border border-[#316bf3]/30',
  ENTREGADO:  'bg-[#6ffbbe]/20 text-[#20bf86] border border-[#6ffbbe]/40',
  RECHAZADO:  'bg-[#ffdad6] text-[#93000a] border border-[#ffdad6]',
};

const PRIORIDAD_COLOR: Record<number, string> = {
  0: 'bg-[#ba1a1a] text-white',
  1: 'bg-[#316bf3] text-white',
  2: 'bg-[#6ffbbe] text-[#002113]',
};

const EMPTY_FORM = { nombre: '', fecha: '', vehiculoId: '' as string | number, usuarioId: '' as string | number };

export default function RutasPage() {
  const [rutas, setRutas]                       = useState<Ruta[]>([]);
  const [vehiculos, setVehiculos]               = useState<Vehiculo[]>([]);
  const [operarios, setOperarios]               = useState<UsuarioOp[]>([]);
  const [pedidosPendientes, setPedidosPendientes] = useState<PedidoResumen[]>([]);
  const [open, setOpen]                         = useState(false);
  const [form, setForm]                         = useState(EMPTY_FORM);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<Ruta | null>(null);
  const [rutaDetalle, setRutaDetalle]           = useState<Ruta | null>(null);
  const [pedidoAAgregar, setPedidoAAgregar]     = useState('');

  const cargar = () => api.get('/rutas').then((r) => {
    const data: Ruta[] = r.data.data ?? [];
    setRutas(data);
    if (rutaDetalle) setRutaDetalle(data.find(r => r.id === rutaDetalle.id) ?? null);
  });

  useEffect(() => {
    cargar();
    api.get('/vehiculos').then((r) => setVehiculos(r.data.data ?? []));
    api.get('/usuarios').then((r) =>
      setOperarios((r.data.data ?? []).filter((u: { rol: string }) => u.rol === 'OPERARIO'))
    );
    api.get('/pedidos?estado=PENDIENTE').then((r) => setPedidosPendientes(r.data.data ?? []));
  }, []);

  const crearRuta = async () => {
    if (!form.nombre || !form.fecha || !form.vehiculoId || !form.usuarioId) return;
    await api.post('/rutas', {
      nombre: form.nombre, fecha: form.fecha,
      vehiculo: { id: Number(form.vehiculoId) },
      usuario: { id: Number(form.usuarioId) },
    });
    setOpen(false); setForm(EMPTY_FORM); cargar();
  };

  const agregarPedido = async () => {
    if (!rutaSeleccionada || !pedidoAAgregar) return;
    await api.post(`/rutas/${rutaSeleccionada.id}/pedidos/${pedidoAAgregar}`);
    setPedidoAAgregar('');
    setRutaSeleccionada(null);
    cargar();
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !rutaDetalle) return;
    const items = [...rutaDetalle.rutaPedidos].sort((a, b) => a.ordenEntrega - b.ordenEntrega);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    await api.put(`/rutas/${rutaDetalle.id}/reordenar`, items.map((rp) => rp.pedido.id));
    cargar();
  };

  const selectedPedidos = rutaDetalle
    ? [...rutaDetalle.rutaPedidos].sort((a, b) => a.ordenEntrega - b.ordenEntrega)
    : [];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-semibold text-[#00255a]">Gestión de Rutas</h2>
          <nav className="flex items-center gap-2 text-[#434750] text-[11px] font-semibold mt-0.5">
            <a href="#" className="hover:text-[#00255a]">Dashboard</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#191c1e]">Rutas de Entrega</span>
          </nav>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-[#00255a] text-white px-4 py-2 rounded-lg text-[12px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm self-start md:self-auto">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva Ruta
        </button>
      </div>

      {/* Split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left: route cards list */}
        <div className="lg:col-span-2 space-y-3">
          {rutas.length === 0 && (
            <div className="bg-white rounded-xl border border-[#c4c6d2] p-10 text-center text-[#747782]">
              <span className="material-symbols-outlined text-[48px] block mb-2 opacity-20">route</span>
              <span className="text-[13px]">Sin rutas registradas</span>
            </div>
          )}
          {rutas.map(ruta => (
            <div key={ruta.id}
              onClick={() => setRutaDetalle(rutaDetalle?.id === ruta.id ? null : ruta)}
              className={`bg-white rounded-xl border shadow-sm p-4 cursor-pointer transition-all ${
                rutaDetalle?.id === ruta.id
                  ? 'border-[#316bf3] ring-1 ring-[#316bf3]/30'
                  : 'border-[#c4c6d2] hover:border-[#00255a]'
              }`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[14px] font-bold text-[#191c1e]">{ruta.nombre}</p>
                  <p className="text-[11px] text-[#747782] mt-0.5">{ruta.fecha}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${ESTADO_BADGE[ruta.estado] ?? 'bg-[#e1e2e4] text-[#434750] border border-[#c4c6d2]'}`}>
                  {ruta.estado}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#434750]">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">directions_car</span>
                  <span>{ruta.vehiculo?.codigo}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">person</span>
                  <span>{ruta.usuario?.nombre}</span>
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  <span className="material-symbols-outlined text-[14px]">package_2</span>
                  <span>{ruta.rutaPedidos.length} pedidos</span>
                </div>
              </div>
              {(ruta.estado === 'PLANEADA' || ruta.estado === 'EN_CURSO') && (
                <button onClick={e => { e.stopPropagation(); setRutaSeleccionada(ruta); }}
                  className="mt-3 w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-[#0051d5] border border-[#0051d5] rounded-lg hover:bg-[#0051d5] hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Agregar Pedido
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Right: delivery sequence */}
        <div className="lg:col-span-3 bg-white border border-[#c4c6d2] rounded-xl shadow-sm overflow-hidden">
          {!rutaDetalle ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-[#747782]">
              <span className="material-symbols-outlined text-[56px] mb-3 opacity-20">touch_app</span>
              <p className="text-[13px] font-medium">Selecciona una ruta para ver su secuencia de entrega</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-[#c4c6d2] flex justify-between items-center">
                <div>
                  <h3 className="text-[15px] font-bold text-[#191c1e]">Secuencia de Entrega</h3>
                  <p className="text-[12px] text-[#747782]">{rutaDetalle.nombre} · {selectedPedidos.length} paradas</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${ESTADO_BADGE[rutaDetalle.estado] ?? ''}`}>
                  {rutaDetalle.estado}
                </span>
              </div>
              <div className="p-4">
                {selectedPedidos.length === 0 ? (
                  <div className="text-center py-10 text-[#747782]">
                    <span className="material-symbols-outlined text-[40px] block mb-2 opacity-20">package_2</span>
                    <p className="text-[12px]">Sin pedidos en esta ruta</p>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="secuencia">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                          {selectedPedidos.map((rp, index) => (
                            <Draggable
                              key={rp.pedido.id}
                              draggableId={`pedido-${rp.pedido.id}`}
                              index={index}
                              isDragDisabled={rutaDetalle.estado !== 'PLANEADA'}
                            >
                              {(drag) => (
                                <div ref={drag.innerRef} {...drag.draggableProps}
                                  className="flex items-center gap-3 p-3 bg-[#f8f9fb] border border-[#e7e8ea] rounded-xl hover:bg-[#f3f4f6] transition-colors">
                                  {/* Drag handle */}
                                  <div {...drag.dragHandleProps} className={rutaDetalle.estado === 'PLANEADA' ? 'cursor-grab' : 'cursor-default'}>
                                    <span className="material-symbols-outlined text-[20px] text-[#c4c6d2]">drag_indicator</span>
                                  </div>
                                  {/* Priority/order badge */}
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${PRIORIDAD_COLOR[index] ?? 'bg-[#dbe1ff] text-[#0051d5]'}`}>
                                    {index + 1}
                                  </div>
                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-bold text-[#191c1e]">ORD-{String(rp.pedido.id).padStart(4, '0')}</p>
                                    <p className="text-[11px] text-[#747782] truncate">{rp.pedido.direccionEntrega}</p>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${PEDIDO_BADGE[rp.pedido.estado] ?? 'bg-[#e1e2e4] text-[#747782] border border-[#c4c6d2]'}`}>
                                    {rp.pedido.estado.replace('_', ' ')}
                                  </span>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal: nueva ruta */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#c4c6d2]">
              <h2 className="text-[18px] font-semibold text-[#191c1e]">Nueva Ruta</h2>
              <button onClick={() => setOpen(false)} className="text-[#747782] hover:text-[#191c1e] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#434750] mb-1">Nombre de la ruta</label>
                <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]"
                  placeholder="Ej: Ruta Norte AM" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#434750] mb-1">Fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#434750] mb-1">Vehículo</label>
                <select value={form.vehiculoId} onChange={e => setForm(f => ({ ...f, vehiculoId: e.target.value }))}
                  className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]">
                  <option value="">Seleccionar vehículo...</option>
                  {vehiculos.map(v => <option key={v.id} value={v.id}>{v.codigo} — {v.patente}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#434750] mb-1">Operario</label>
                <select value={form.usuarioId} onChange={e => setForm(f => ({ ...f, usuarioId: e.target.value }))}
                  className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]">
                  <option value="">Seleccionar operario...</option>
                  {operarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#c4c6d2]">
              <button onClick={() => setOpen(false)}
                className="h-9 px-5 text-[13px] font-semibold text-[#434750] border border-[#c4c6d2] rounded-lg hover:bg-[#f3f4f6] transition-colors">
                Cancelar
              </button>
              <button onClick={crearRuta} disabled={!form.nombre || !form.fecha || !form.vehiculoId || !form.usuarioId}
                className="h-9 px-5 text-[13px] font-semibold bg-[#00255a] text-white rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: agregar pedido */}
      {rutaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#c4c6d2]">
              <h2 className="text-[18px] font-semibold text-[#191c1e]">Agregar Pedido a Ruta</h2>
              <button onClick={() => setRutaSeleccionada(null)} className="text-[#747782] hover:text-[#191c1e] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              <p className="text-[12px] text-[#747782] mb-4">
                Ruta: <strong className="text-[#191c1e]">{rutaSeleccionada.nombre}</strong>
              </p>
              <label className="block text-[12px] font-semibold text-[#434750] mb-1">Pedido pendiente</label>
              <select value={pedidoAAgregar} onChange={e => setPedidoAAgregar(e.target.value)}
                className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]">
                <option value="">Seleccionar pedido...</option>
                {pedidosPendientes.map(p => (
                  <option key={p.id} value={p.id}>ORD-{String(p.id).padStart(4,'0')} — {p.direccionEntrega}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#c4c6d2]">
              <button onClick={() => setRutaSeleccionada(null)}
                className="h-9 px-5 text-[13px] font-semibold text-[#434750] border border-[#c4c6d2] rounded-lg hover:bg-[#f3f4f6] transition-colors">
                Cancelar
              </button>
              <button onClick={agregarPedido} disabled={!pedidoAAgregar}
                className="h-9 px-5 text-[13px] font-semibold bg-[#00255a] text-white rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
