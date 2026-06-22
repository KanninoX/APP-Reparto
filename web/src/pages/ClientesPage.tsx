import { useEffect, useState } from 'react';
import api from '../services/api';

interface Cliente { id: number; rut: string; nombre: string; direccion: string; telefono: string; email: string; }

const EMPTY: Omit<Cliente, 'id'> = { rut: '', nombre: '', direccion: '', telefono: '', email: '' };

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

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');

  const cargar = () => api.get('/clientes').then((r) => setClientes(r.data.data ?? []));
  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    await api.post('/clientes', form);
    setOpen(false);
    setForm(EMPTY);
    cargar();
  };

  const filtered = clientes.filter(c =>
    !search || c.nombre.toLowerCase().includes(search.toLowerCase()) || c.rut.includes(search)
  );

  return (
    <div className="space-y-5">

      {/* Section header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-semibold text-[#00255a]">Clientes</h2>
          <nav className="flex items-center gap-2 text-[#434750] text-[11px] font-semibold mt-0.5">
            <a href="#" className="hover:text-[#00255a]">Dashboard</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#191c1e]">Gestión de Clientes</span>
          </nav>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-[#00255a] text-white px-4 py-2 rounded-lg text-[12px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm self-start md:self-auto">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          + Nuevo Cliente
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: 'groups',          bg: 'bg-[#d8e2ff]', text: 'text-[#00255a]', label: 'Total Clientes',       value: clientes.length },
          { icon: 'person_check',    bg: 'bg-[#6ffbbe]',  text: 'text-[#002113]', label: 'Clientes Activos',     value: clientes.length },
          { icon: 'location_on',     bg: 'bg-[#dbe1ff]',  text: 'text-[#0051d5]', label: 'Puntos de Entrega',    value: clientes.length },
          { icon: 'person_add',      bg: 'bg-[#ffdad6]',  text: 'text-[#ba1a1a]', label: 'Nuevos este mes',      value: Math.floor(clientes.length * 0.1) },
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

      {/* Search */}
      <div className="relative max-w-sm">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747782] text-[18px]">search</span>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar cliente o RUT..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-[#c4c6d2] rounded-lg text-[13px] focus:outline-none focus:border-[#00255a] text-[#191c1e] placeholder:text-[#c4c6d2]" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#c4c6d2] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f3f4f6] border-b border-[#c4c6d2]">
                {['#', 'Cliente', 'RUT', 'Dirección', 'Teléfono', 'Email'].map(h => (
                  <th key={h} className="px-4 py-3 text-[11px] font-semibold text-[#434750] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e8ea]">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-[#747782]">
                    <span className="material-symbols-outlined text-[48px] block mb-2 opacity-20">groups</span>
                    <span className="text-[13px]">Sin clientes registrados</span>
                  </td>
                </tr>
              )}
              {filtered.map((c, idx) => (
                <tr key={c.id} className="hover:bg-[#f3f4f6] transition-colors cursor-pointer">
                  <td className="px-4 py-4 text-[12px] font-medium text-[#434750]">{String(idx + 1).padStart(3, '0')}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${AVATAR_COLORS[c.id % AVATAR_COLORS.length]}`}>
                        {getInitials(c.nombre)}
                      </div>
                      <span className="text-[13px] font-semibold text-[#191c1e]">{c.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[12px] text-[#434750] font-medium">{c.rut}</td>
                  <td className="px-4 py-4 text-[12px] text-[#434750] max-w-[180px] truncate">{c.direccion}</td>
                  <td className="px-4 py-4 text-[12px] text-[#434750]">{c.telefono}</td>
                  <td className="px-4 py-4 text-[12px] text-[#434750]">{c.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#c4c6d2]">
              <h2 className="text-[18px] font-semibold text-[#191c1e]">Nuevo Cliente</h2>
              <button onClick={() => setOpen(false)} className="text-[#747782] hover:text-[#191c1e] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { k: 'rut',       label: 'RUT',       type: 'text' },
                { k: 'nombre',    label: 'Nombre',    type: 'text' },
                { k: 'direccion', label: 'Dirección', type: 'text' },
                { k: 'telefono',  label: 'Teléfono',  type: 'tel' },
                { k: 'email',     label: 'Email',     type: 'email' },
              ].map(({ k, label, type }) => (
                <div key={k}>
                  <label className="block text-[12px] font-semibold text-[#434750] mb-1">{label}</label>
                  <input type={type} value={form[k as keyof typeof EMPTY]}
                    onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]"
                    placeholder={label} />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#c4c6d2]">
              <button onClick={() => setOpen(false)}
                className="h-9 px-5 text-[13px] font-semibold text-[#434750] border border-[#c4c6d2] rounded-lg hover:bg-[#f3f4f6] transition-colors">
                Cancelar
              </button>
              <button onClick={guardar}
                className="h-9 px-5 text-[13px] font-semibold bg-[#00255a] text-white rounded-lg hover:opacity-90 active:scale-95 transition-all">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
