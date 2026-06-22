import { useEffect, useState } from 'react';
import api from '../services/api';

interface Vehiculo { id: number; codigo: string; patente: string; capacidadKg: number; tipo: string; activo: boolean; }

const EMPTY_FORM = { codigo: '', patente: '', capacidadKg: '', tipo: '' };

function PatenteBadge({ patente }: { patente: string }) {
  const parts = patente.match(/([A-Z]{2})([A-Z]{2})(\d{2})/);
  if (parts) {
    return (
      <span className="inline-flex items-center gap-1 border border-[#c4c6d2] rounded px-2 py-0.5 text-[11px] font-bold text-[#191c1e] bg-[#f3f4f6] tracking-widest">
        {parts[1]}·{parts[2]}·{parts[3]}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center border border-[#c4c6d2] rounded px-2 py-0.5 text-[11px] font-bold text-[#191c1e] bg-[#f3f4f6] tracking-widest">
      {patente}
    </span>
  );
}

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const cargar = () => {
    api.get(`/vehiculos${mostrarTodos ? '?todos=true' : ''}`).then((r) => setVehiculos(r.data.data ?? []));
  };
  useEffect(() => { cargar(); }, [mostrarTodos]);

  const guardar = async () => {
    setError('');
    try {
      await api.post('/vehiculos', {
        codigo: form.codigo, patente: form.patente,
        capacidadKg: parseFloat(form.capacidadKg), tipo: form.tipo,
      });
      setOpen(false); setForm(EMPTY_FORM); cargar();
    } catch { setError('Error al crear vehículo. Código y patente deben ser únicos.'); }
  };

  const toggleActivo = async (v: Vehiculo) => {
    await api.patch(`/vehiculos/${v.id}/activo?activo=${!v.activo}`);
    cargar();
  };

  const activos   = vehiculos.filter(v => v.activo).length;
  const inactivos = vehiculos.filter(v => !v.activo).length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-semibold text-[#00255a]">Vehículos</h2>
          <nav className="flex items-center gap-2 text-[#434750] text-[11px] font-semibold mt-0.5">
            <a href="#" className="hover:text-[#00255a]">Dashboard</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#191c1e]">Gestión de Flota</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <button onClick={() => setMostrarTodos(v => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${mostrarTodos ? 'bg-[#0051d5]' : 'bg-[#c4c6d2]'}`}>
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${mostrarTodos ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
            <span className="text-[12px] text-[#434750]">Ver inactivos</span>
          </label>
          <button onClick={() => { setOpen(true); setError(''); }}
            className="flex items-center gap-2 bg-[#00255a] text-white px-4 py-2 rounded-lg text-[12px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nuevo Vehículo
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#c4c6d2] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f3f4f6] border-b border-[#c4c6d2]">
                {['#', 'Código', 'Patente', 'Tipo', 'Capacidad', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-[11px] font-semibold text-[#434750] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e8ea]">
              {vehiculos.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#747782]">
                    <span className="material-symbols-outlined text-[48px] block mb-2 opacity-20">directions_car</span>
                    <span className="text-[13px]">Sin vehículos registrados</span>
                  </td>
                </tr>
              )}
              {vehiculos.map((v, idx) => (
                <tr key={v.id} className={`hover:bg-[#f3f4f6] transition-colors ${!v.activo ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-4 text-[12px] font-medium text-[#434750]">{String(idx + 1).padStart(3, '0')}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#dbe1ff] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#0051d5] text-[16px]">directions_car</span>
                      </div>
                      <span className="text-[13px] font-bold text-[#00255a]">{v.codigo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <PatenteBadge patente={v.patente} />
                  </td>
                  <td className="px-4 py-4 text-[12px] text-[#434750]">{v.tipo}</td>
                  <td className="px-4 py-4 text-[12px] text-[#191c1e] font-medium">{v.capacidadKg?.toLocaleString('es-CL')} kg</td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      v.activo
                        ? 'bg-[#6ffbbe]/20 text-[#20bf86] border-[#6ffbbe]/40'
                        : 'bg-[#e1e2e4] text-[#747782] border-[#c4c6d2]'
                    }`}>
                      {v.activo ? 'Operativo' : 'En Taller'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button onClick={() => toggleActivo(v)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${v.activo ? 'bg-[#0051d5]' : 'bg-[#c4c6d2]'}`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${v.activo ? 'translate-x-4' : 'translate-x-1'}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: 'directions_car', bg: 'bg-[#dbe1ff]', text: 'text-[#0051d5]', label: 'Total Flota',  value: vehiculos.length },
          { icon: 'check_circle',   bg: 'bg-[#6ffbbe]',  text: 'text-[#002113]', label: 'Operativos',   value: activos },
          { icon: 'build',          bg: 'bg-[#ffdad6]',  text: 'text-[#ba1a1a]', label: 'En Taller',    value: inactivos },
        ].map(m => (
          <div key={m.label} className="bg-white p-4 rounded-xl border border-[#c4c6d2] flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-full ${m.bg} flex items-center justify-center shrink-0`}>
              <span className={`material-symbols-outlined text-[20px] ${m.text}`}>{m.icon}</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#434750]">{m.label}</p>
              <p className="text-[20px] font-bold text-[#191c1e]">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#c4c6d2]">
              <h2 className="text-[18px] font-semibold text-[#191c1e]">Nuevo Vehículo</h2>
              <button onClick={() => setOpen(false)} className="text-[#747782] hover:text-[#191c1e] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="p-3 rounded-lg bg-[#ffdad6] text-[#93000a] text-[13px]">{error}</div>}
              {[
                { key: 'codigo',      label: 'Código',         placeholder: 'Ej: VEH-004',  type: 'text' },
                { key: 'patente',     label: 'Patente',        placeholder: 'Ej: BCZR45',   type: 'text' },
                { key: 'tipo',        label: 'Tipo',           placeholder: 'Furgón, Camión...', type: 'text' },
                { key: 'capacidadKg', label: 'Capacidad (kg)', placeholder: '1500',          type: 'number' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-[12px] font-semibold text-[#434750] mb-1">{label}</label>
                  <input type={type} value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full h-10 px-3 text-[13px] border border-[#c4c6d2] rounded-lg focus:outline-none focus:border-[#0051d5]"
                    placeholder={placeholder} />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#c4c6d2]">
              <button onClick={() => setOpen(false)}
                className="h-9 px-5 text-[13px] font-semibold text-[#434750] border border-[#c4c6d2] rounded-lg hover:bg-[#f3f4f6] transition-colors">
                Cancelar
              </button>
              <button onClick={guardar} disabled={!form.codigo || !form.patente}
                className="h-9 px-5 text-[13px] font-semibold bg-[#00255a] text-white rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
