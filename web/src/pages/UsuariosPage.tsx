import { useEffect, useState } from 'react';
import api from '../services/api';

interface Usuario { id: number; nombre: string; email: string; rol: string; activo: boolean; }
interface Dispositivo { id: number; deviceId: string; autorizado: boolean; creadoEn: string; usuario: { id: number; nombre: string; email: string } }

const ROL_OPTIONS = ['ADMIN', 'EJECUTIVO', 'OPERARIO'];
const EMPTY_FORM = { nombre: '', email: '', password: '', rol: 'OPERARIO' };
type TabFilter = 'Todos' | 'ADMIN' | 'EJECUTIVO' | 'OPERARIO';
type Section = 'usuarios' | 'dispositivos';

const ROL_BADGE: Record<string, string> = {
  ADMIN:     'bg-[#00255a]/10 text-[#00255a]',
  EJECUTIVO: 'bg-[#0051d5]/10 text-[#0051d5]',
  OPERARIO:  'bg-[#316bf3]/10 text-[#316bf3]',
};

const AVATAR_BG: Record<string, string> = {
  ADMIN:     'bg-[#0f3b7e] text-[#86a8f2]',
  EJECUTIVO: 'bg-[#dbe1ff] text-[#003ea8]',
  OPERARIO:  'bg-[#d8e2ff] text-[#1d4588]',
};

function getInitials(nombre: string) {
  return nombre.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios]       = useState<Usuario[]>([]);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [tab, setTab]                 = useState<TabFilter>('Todos');
  const [section, setSection]         = useState<Section>('usuarios');
  const [open, setOpen]               = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [error, setError]             = useState('');

  const cargar = () => api.get('/usuarios').then((r) => setUsuarios(r.data.data ?? []));
  const cargarDispositivos = () => api.get('/dispositivos/pendientes').then((r) => setDispositivos(r.data.data ?? []));

  useEffect(() => { cargar(); cargarDispositivos(); }, []);

  const guardar = async () => {
    setError('');
    try {
      await api.post('/auth/register', form);
      setOpen(false); setForm(EMPTY_FORM); cargar();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Error al crear usuario');
    }
  };

  const toggleActivo = async (u: Usuario) => {
    await api.patch(`/usuarios/${u.id}/activo?activo=${!u.activo}`);
    cargar();
  };

  const autorizarDispositivo = async (id: number) => {
    await api.post(`/dispositivos/${id}/autorizar`);
    cargarDispositivos();
  };

  const rechazarDispositivo = async (id: number) => {
    await api.delete(`/dispositivos/${id}`);
    cargarDispositivos();
  };

  const admins    = usuarios.filter(u => u.rol === 'ADMIN').length;
  const ejecutivos = usuarios.filter(u => u.rol === 'EJECUTIVO').length;
  const operarios = usuarios.filter(u => u.rol === 'OPERARIO').length;

  const filtered = tab === 'Todos' ? usuarios : usuarios.filter(u => u.rol === tab);
  const TABS: TabFilter[] = ['Todos', 'ADMIN', 'EJECUTIVO', 'OPERARIO'];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-semibold text-[#00255a]">Usuarios</h2>
          <nav className="flex items-center gap-2 text-[#434750] text-[11px] font-semibold mt-0.5">
            <a href="#" className="hover:text-[#00255a]">Dashboard</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#191c1e]">Administración de Usuarios</span>
          </nav>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Section toggle */}
          <div className="flex rounded-lg border border-[#c4c6d2] overflow-hidden text-[12px] font-semibold">
            <button onClick={() => setSection('usuarios')}
              className={`px-4 py-2 transition-colors ${section === 'usuarios' ? 'bg-[#00255a] text-white' : 'bg-white text-[#434750] hover:bg-[#f3f4f6]'}`}>
              Usuarios
            </button>
            <button onClick={() => setSection('dispositivos')}
              className={`px-4 py-2 transition-colors flex items-center gap-1 ${section === 'dispositivos' ? 'bg-[#00255a] text-white' : 'bg-white text-[#434750] hover:bg-[#f3f4f6]'}`}>
              Dispositivos
              {dispositivos.length > 0 && (
                <span className="ml-1 bg-[#ba1a1a] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {dispositivos.length}
                </span>
              )}
            </button>
          </div>
          {section === 'usuarios' && (
            <button onClick={() => { setOpen(true); setError(''); }}
              className="flex items-center gap-2 bg-[#00255a] text-white px-4 py-2 rounded-lg text-[12px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              + Nuevo Usuario
            </button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: 'manage_accounts', bg: 'bg-[#d8e2ff]', text: 'text-[#00255a]', label: 'Total Usuarios', value: usuarios.length },
          { icon: 'admin_panel_settings', bg: 'bg-[#0f3b7e]', text: 'text-[#86a8f2]', label: 'Roles Admin', value: admins },
          { icon: 'badge', bg: 'bg-[#dbe1ff]', text: 'text-[#0051d5]', label: 'Ejecutivos', value: ejecutivos },
          { icon: 'local_shipping', bg: 'bg-[#6ffbbe]', text: 'text-[#002113]', label: 'Roles Operarios', value: operarios },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-[#c4c6d2] p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-[18px] ${kpi.text}`}>{kpi.icon}</span>
              </div>
            </div>
            <p className="text-[11px] font-semibold text-[#434750]">{kpi.label}</p>
            <p className="text-[24px] font-bold text-[#191c1e]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* AI suggestion banner */}
      <div className="bg-[#0f3b7e] rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#316bf3] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-[18px]">auto_awesome</span>
          </div>
          <div>
            <p className="text-[13px] font-bold text-white">Sugerencia de optimización</p>
            <p className="text-[12px] text-white/70">Tienes {operarios} operarios activos. Considera asignar rutas balanceadas para mejorar eficiencia.</p>
          </div>
        </div>
        <button className="shrink-0 bg-[#316bf3] text-white text-[12px] font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          Ver sugerencias
        </button>
      </div>

      {/* SECTION: USUARIOS */}
      {section === 'usuarios' && (
        <div className="bg-white border border-[#c4c6d2] rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#c4c6d2] bg-[#f3f4f6]/30 flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2">
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-colors border ${
                    tab === t
                      ? 'bg-[#316bf3] text-white border-[#316bf3]'
                      : 'bg-white text-[#434750] border-[#c4c6d2] hover:bg-[#f3f4f6]'
                  }`}>
                  {t === 'Todos' ? `Todos (${usuarios.length})` : t}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f3f4f6] border-b border-[#c4c6d2]">
                <tr>
                  {['#', 'Nombre', 'Email', 'Rol', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-[#434750] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e8ea]">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-16 text-[#747782]">
                    <span className="material-symbols-outlined text-[48px] block mb-2 opacity-20">manage_accounts</span>
                    <span className="text-[13px]">Sin usuarios en esta categoría</span>
                  </td></tr>
                )}
                {filtered.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-[#f8f9fb] transition-colors">
                    <td className="px-4 py-4 text-[12px] font-medium text-[#434750]">{String(idx + 1).padStart(3, '0')}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${AVATAR_BG[u.rol] ?? 'bg-[#e1e2e4] text-[#191c1e]'}`}>
                          {getInitials(u.nombre)}
                        </div>
                        <p className="text-[13px] font-semibold text-[#191c1e]">{u.nombre}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[12px] text-[#434750]">{u.email}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ROL_BADGE[u.rol] ?? 'bg-[#f3f4f6] text-[#434750]'}`}>{u.rol}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        u.activo ? 'bg-[#6ffbbe]/20 text-[#20bf86] border-[#6ffbbe]/40' : 'bg-[#e1e2e4] text-[#747782] border-[#c4c6d2]'
                      }`}>{u.activo ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <button onClick={() => toggleActivo(u)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${u.activo ? 'bg-[#0051d5]' : 'bg-[#c4c6d2]'}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${u.activo ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION: DISPOSITIVOS */}
      {section === 'dispositivos' && (
        <div className="bg-white border border-[#c4c6d2] rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#c4c6d2] flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-[#191c1e]">Dispositivos Pendientes de Autorización</h3>
              <p className="text-[12px] text-[#747782]">Revisa y autoriza los dispositivos móviles de operarios</p>
            </div>
            <button onClick={cargarDispositivos}
              className="flex items-center gap-1 text-[12px] text-[#0051d5] font-semibold hover:underline">
              <span className="material-symbols-outlined text-[16px]">refresh</span> Actualizar
            </button>
          </div>
          {dispositivos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#747782]">
              <span className="material-symbols-outlined text-[56px] mb-3 opacity-20">devices</span>
              <p className="text-[13px] font-medium">No hay dispositivos pendientes</p>
              <p className="text-[12px] text-[#9ca3af] mt-1">Cuando un operario inicie sesión desde un dispositivo nuevo, aparecerá aquí</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e7e8ea]">
              {dispositivos.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[#f8f9fb] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#fef3c7] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#d97706] text-[18px]">smartphone</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#191c1e]">{d.usuario?.nombre}</p>
                      <p className="text-[11px] text-[#747782]">{d.usuario?.email}</p>
                      <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5 truncate max-w-xs">{d.deviceId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-[#747782]">{new Date(d.creadoEn).toLocaleDateString('es-CL')}</span>
                    <button onClick={() => rechazarDispositivo(d.id)}
                      className="px-3 py-1.5 text-[11px] font-semibold text-[#ba1a1a] border border-[#ba1a1a]/30 rounded-lg hover:bg-[#ba1a1a]/10 transition-colors">
                      Rechazar
                    </button>
                    <button onClick={() => autorizarDispositivo(d.id)}
                      className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[#0051d5] rounded-lg hover:opacity-90 transition-opacity">
                      Autorizar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal nuevo usuario */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#c4c6d2]">
              <h2 className="text-[18px] font-semibold text-[#191c1e]">Nuevo Usuario</h2>
              <button onClick={() => setOpen(false)} className="text-[#747782] hover:text-[#191c1e] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="p-3 rounded-lg bg-[#ffdad6] text-[#93000a] text-[13px]">{error}</div>}
              <div>
                <label className="block text-[12px] font-semibold text-[#434750] mb-1">Nombre completo</label>
                <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]"
                  placeholder="Ej: Juan Rodríguez" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#434750] mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]"
                  placeholder="usuario@empresa.com" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#434750] mb-1">Contraseña (mín. 6 caracteres)</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]"
                  placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#434750] mb-1">Rol</label>
                <select value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
                  className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]">
                  {ROL_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#c4c6d2]">
              <button onClick={() => setOpen(false)}
                className="h-9 px-5 text-[13px] font-semibold text-[#434750] border border-[#c4c6d2] rounded-lg hover:bg-[#f3f4f6] transition-colors">
                Cancelar
              </button>
              <button onClick={guardar} disabled={!form.nombre || !form.email || form.password.length < 6}
                className="h-9 px-5 text-[13px] font-semibold bg-[#00255a] text-white rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
                Crear Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
