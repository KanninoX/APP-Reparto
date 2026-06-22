import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import logoWhite from '../assets/logo-white.svg';
import api from '../services/api';

const navItems = [
  { label: 'Panel de Control', path: '/',          icon: 'dashboard',       roles: ['ADMIN','EJECUTIVO','OPERARIO'] },
  { label: 'Pedidos',          path: '/pedidos',    icon: 'inventory_2',     roles: ['ADMIN','EJECUTIVO','OPERARIO'] },
  { label: 'Rutas',            path: '/rutas',      icon: 'route',           roles: ['ADMIN','EJECUTIVO'] },
  { label: 'Mapa GPS',         path: '/mapa',       icon: 'map',             roles: ['ADMIN','EJECUTIVO','OPERARIO'] },
  { label: 'Clientes',         path: '/clientes',   icon: 'groups',          roles: ['ADMIN','EJECUTIVO'] },
  { label: 'Facturas',         path: '/facturas',   icon: 'receipt_long',    roles: ['ADMIN','EJECUTIVO'] },
  { label: 'Vehículos',        path: '/vehiculos',  icon: 'directions_car',  roles: ['ADMIN'] },
  { label: 'Usuarios',         path: '/usuarios',   icon: 'manage_accounts', roles: ['ADMIN'] },
];

interface Notificacion {
  id: number; titulo: string; mensaje: string; leida: boolean; tipo: string; fechaCreacion: string;
}

function getInitials(nombre: string) {
  return nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function timeAgo(fechaStr: string) {
  const diff = Date.now() - new Date(fechaStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Ahora';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

const TIPO_ICON: Record<string, { icon: string; color: string; bg: string }> = {
  ALERTA:    { icon: 'warning',       color: 'text-[#ba1a1a]', bg: 'bg-[#ffdad6]' },
  INFO:      { icon: 'info',          color: 'text-[#316bf3]', bg: 'bg-[#d8e2ff]' },
  EXITO:     { icon: 'check_circle',  color: 'text-[#20bf86]', bg: 'bg-[#6ffbbe]/30' },
  ENTREGA:   { icon: 'local_shipping',color: 'text-[#00255a]', bg: 'bg-[#d8e2ff]' },
};

// ─── Modal Nueva Entrega ────────────────────────────────────────────────────
function NuevaEntregaModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [clientes, setClientes]   = useState<{id:number;nombre:string}[]>([]);
  const [vehiculos, setVehiculos] = useState<{id:number;codigo:string;patente:string}[]>([]);
  const [form, setForm] = useState({
    clienteId: '', vehiculoId: '', direccionEntrega: '', prioridad: 'MEDIA',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    api.get('/clientes').then(r  => setClientes(r.data.data  ?? []));
    api.get('/vehiculos').then(r => setVehiculos(r.data.data ?? []));
  }, []);

  const submit = async () => {
    if (!form.clienteId || !form.direccionEntrega) { setError('Cliente y dirección son requeridos.'); return; }
    setSaving(true);
    try {
      await api.post('/pedidos', {
        clienteId:        Number(form.clienteId),
        vehiculoId:       form.vehiculoId ? Number(form.vehiculoId) : undefined,
        direccionEntrega: form.direccionEntrega,
        prioridad:        form.prioridad,
        estado:           'PENDIENTE',
      });
      onCreated();
      onClose();
    } catch { setError('Error al crear el pedido.'); }
    finally   { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-[#00255a] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#316bf3] flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]">add</span>
            </div>
            <h2 className="text-[16px] font-bold text-white">Nueva Entrega</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-[#ffdad6] text-[#ba1a1a] text-[12px] px-3 py-2 rounded-lg">
              <span className="material-symbols-outlined text-[16px]">error</span>{error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#434750] mb-1.5 uppercase tracking-wide">Cliente *</label>
            <select
              value={form.clienteId}
              onChange={e => setForm(f => ({ ...f, clienteId: e.target.value }))}
              className="w-full h-10 px-3 text-[13px] rounded-lg border border-[#c4c6d2] text-[#191c1e] bg-white focus:outline-none focus:border-[#00255a]"
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#434750] mb-1.5 uppercase tracking-wide">Dirección de Entrega *</label>
            <input
              type="text"
              value={form.direccionEntrega}
              onChange={e => setForm(f => ({ ...f, direccionEntrega: e.target.value }))}
              placeholder="Ej: Av. Costanera 234, Puerto Montt"
              className="w-full h-10 px-3 text-[13px] rounded-lg border border-[#c4c6d2] text-[#191c1e] focus:outline-none focus:border-[#00255a]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#434750] mb-1.5 uppercase tracking-wide">Vehículo</label>
              <select
                value={form.vehiculoId}
                onChange={e => setForm(f => ({ ...f, vehiculoId: e.target.value }))}
                className="w-full h-10 px-3 text-[13px] rounded-lg border border-[#c4c6d2] text-[#191c1e] bg-white focus:outline-none focus:border-[#00255a]"
              >
                <option value="">Sin asignar</option>
                {vehiculos.map(v => <option key={v.id} value={v.id}>{v.codigo} — {v.patente}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#434750] mb-1.5 uppercase tracking-wide">Prioridad</label>
              <select
                value={form.prioridad}
                onChange={e => setForm(f => ({ ...f, prioridad: e.target.value }))}
                className="w-full h-10 px-3 text-[13px] rounded-lg border border-[#c4c6d2] text-[#191c1e] bg-white focus:outline-none focus:border-[#00255a]"
              >
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-[#c4c6d2] text-[#434750] text-[13px] font-semibold hover:bg-[#f3f4f6] transition-colors">
            Cancelar
          </button>
          <button
            onClick={submit} disabled={saving}
            className="flex-1 h-10 rounded-lg bg-[#316bf3] text-white text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-[16px]">add</span>}
            {saving ? 'Creando...' : 'Crear Entrega'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notificaciones Panel ────────────────────────────────────────────────────
function NotificacionesPanel({ onClose }: { onClose: () => void }) {
  const [notifs, setNotifs] = useState<Notificacion[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const cargar = () => api.get('/notificaciones').then(r => setNotifs(r.data.data ?? [])).catch(() => {});

  useEffect(() => {
    cargar();
    const iv = setInterval(cargar, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const marcarLeida = async (id: number) => {
    await api.patch(`/notificaciones/${id}/leida`).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  const marcarTodas = () => notifs.filter(n => !n.leida).forEach(n => marcarLeida(n.id));
  const noLeidas = notifs.filter(n => !n.leida).length;

  // Notificaciones demo si no hay ninguna
  const items: (Notificacion | { id: number; titulo: string; mensaje: string; leida: boolean; tipo: string; fechaCreacion: string })[] =
    notifs.length > 0 ? notifs : [
      { id: -1, titulo: 'Retraso en Ruta #402', mensaje: 'Tráfico intenso detectado. Entrega estimada +25 min.', leida: false, tipo: 'ALERTA', fechaCreacion: new Date(Date.now() - 4 * 60000).toISOString() },
      { id: -2, titulo: 'Carga de Flota Completada', mensaje: 'Vehículos VEH-001 a VEH-003 listos para salida.', leida: true, tipo: 'EXITO', fechaCreacion: new Date(Date.now() - 15 * 60000).toISOString() },
      { id: -3, titulo: 'Nuevo pedido asignado', mensaje: 'ORD-0013 asignado a zona norte Puerto Montt.', leida: false, tipo: 'INFO', fechaCreacion: new Date(Date.now() - 30 * 60000).toISOString() },
    ];

  const totalNoLeidas = notifs.length > 0 ? noLeidas : items.filter(n => !n.leida).length;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-12 w-[360px] bg-white rounded-xl shadow-2xl border border-[#c4c6d2] z-[100] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#c4c6d2]">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-bold text-[#191c1e]">Notificaciones</h3>
          {totalNoLeidas > 0 && (
            <span className="px-1.5 py-0.5 bg-[#ba1a1a] text-white text-[10px] font-bold rounded-full">{totalNoLeidas}</span>
          )}
        </div>
        {totalNoLeidas > 0 && notifs.length > 0 && (
          <button onClick={marcarTodas} className="text-[11px] text-[#0051d5] font-semibold hover:underline">
            Marcar todas leídas
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[380px] overflow-y-auto">
        {items.map(n => {
          const style = TIPO_ICON[n.tipo] ?? TIPO_ICON['INFO'];
          return (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 border-b border-[#f3f4f6] hover:bg-[#f8f9fb] transition-colors ${!n.leida ? 'bg-[#eff6ff]' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                <span className={`material-symbols-outlined text-[16px] ${style.color}`}>{style.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-[12px] font-bold text-[#191c1e] leading-tight ${!n.leida ? '' : 'font-semibold'}`}>{n.titulo}</p>
                  {!n.leida && n.id > 0 && (
                    <button onClick={() => marcarLeida(n.id)} className="text-[#316bf3] hover:text-[#0051d5] shrink-0">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    </button>
                  )}
                  {!n.leida && n.id < 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#316bf3] shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-[11px] text-[#434750] mt-0.5 leading-tight">{n.mensaje}</p>
                <p className="text-[10px] text-[#747782] mt-1">{timeAgo(n.fechaCreacion)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[#c4c6d2] text-center">
        <button className="text-[12px] font-bold text-[#0051d5] hover:underline">Ver todas las notificaciones</button>
      </div>
    </div>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────
export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [search, setSearch]               = useState('');
  const [showNotifs, setShowNotifs]       = useState(false);
  const [showNuevaEntrega, setShowNueva]  = useState(false);
  const [pedidosKey, setPedidosKey]       = useState(0);

  const items = navItems.filter(i => user && i.roles.includes(user.rol));
  const currentPage = navItems.find(i => i.path === pathname)?.label ?? 'App Reparto';

  return (
    <div className="flex min-h-screen bg-[#f8f9fb]">

      {/* ─── Sidebar ─── */}
      <aside className="fixed left-0 top-0 h-full w-[240px] bg-[#00255a] flex flex-col py-[16px] z-50">

        {/* Brand */}
        <div className="px-[16px] mb-[32px]">
          <div className="flex items-center gap-3 mb-1">
            <img src={logoWhite} alt="App Reparto" className="w-10 h-10 shrink-0" />
            <div>
              <h1 className="text-[20px] font-bold leading-6 tracking-tight text-white">App Reparto</h1>
              <p className="text-[11px] text-white/60 leading-4 tracking-wide font-medium">Gestión Logística</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {items.map(item => {
            const active = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 py-3 text-left transition-colors text-[12px] tracking-wide font-medium ${
                  active
                    ? 'text-[#dbe1ff] font-bold border-l-4 border-[#dbe1ff] pl-4 bg-white/5'
                    : 'text-white/70 pl-5 hover:bg-[#0f3b7e]/50'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Nueva Entrega button */}
        <div className="px-[16px] mt-[32px]">
          <button
            onClick={() => setShowNueva(true)}
            className="w-full bg-[#316bf3] text-white py-3 rounded-lg text-[12px] font-bold tracking-wide flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nueva Entrega
          </button>
        </div>
      </aside>

      {/* ─── Main area ─── */}
      <div className="flex flex-col flex-1 ml-[240px]">

        {/* Top bar */}
        <header className="fixed top-0 right-0 left-[240px] h-16 bg-white border-b border-[#c4c6d2] flex items-center justify-between px-[24px] z-40">
          <div className="flex items-center gap-[16px] flex-1">
            <span className="text-[20px] font-black text-[#00255a] whitespace-nowrap">{currentPage}</span>
            <div className="relative hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747782] text-[20px]">search</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar envíos..."
                className="pl-10 pr-4 py-2 bg-[#f3f4f6] border-none rounded-full text-[13px] w-64 focus:outline-none focus:ring-2 focus:ring-[#00255a]/20 text-[#191c1e] placeholder:text-[#c4c6d2]"
              />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-[16px]">
            {/* Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(v => !v)}
                className="p-2 text-[#434750] hover:bg-[#f3f4f6] rounded-full transition-colors relative"
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full ring-2 ring-white" />
              </button>
              {showNotifs && <NotificacionesPanel onClose={() => setShowNotifs(false)} />}
            </div>

            <button className="p-2 text-[#434750] hover:bg-[#f3f4f6] rounded-full transition-colors">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
            <div className="w-px h-8 bg-[#c4c6d2] mx-1" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[12px] font-bold text-[#191c1e] leading-4">{user?.nombre}</p>
                <p className="text-[11px] text-[#434750] leading-3">{user?.rol}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#0f3b7e] border-2 border-[#d8e2ff] flex items-center justify-center">
                <span className="text-[13px] font-bold text-white">{user ? getInitials(user.nombre) : '?'}</span>
              </div>
              <button onClick={logout} className="p-1.5 text-[#434750] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors" title="Cerrar sesión">
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pt-16 p-[24px]" key={pedidosKey}>
          <Outlet />
        </main>
      </div>

      {/* Modal Nueva Entrega */}
      {showNuevaEntrega && (
        <NuevaEntregaModal
          onClose={() => setShowNueva(false)}
          onCreated={() => { setPedidosKey(k => k + 1); navigate('/pedidos'); }}
        />
      )}
    </div>
  );
}
