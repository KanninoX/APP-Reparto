import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../services/api';

interface Stats {
  total: number;
  entregados: number;
  pendientes: number;
  enRuta: number;
  porDia: { fecha: string; total: number }[];
  porEstado: { estado: string; total: number }[];
}

interface Pedido {
  id: number;
  estado: string;
  direccionEntrega: string;
  fechaCreacion: string;
  cliente?: { nombre: string };
  prioridad?: string;
}

const PIE_COLORS: Record<string, string> = {
  ENTREGADO:  '#6ffbbe',
  EN_RUTA:    '#316bf3',
  PENDIENTE:  '#ffdad6',
  RECHAZADO:  '#ba1a1a',
  ASIGNADO:   '#dbe1ff',
  REAGENDADO: '#c4c6d2',
};

const ESTADO_COLOR: Record<string, string> = {
  ENTREGADO:  'bg-[#6ffbbe]/20 text-[#00472f]',
  EN_RUTA:    'bg-[#316bf3]/10 text-[#316bf3]',
  PENDIENTE:  'bg-[#ffdad6] text-[#ba1a1a]',
  RECHAZADO:  'bg-[#ba1a1a]/10 text-[#ba1a1a]',
  ASIGNADO:   'bg-[#dbe1ff] text-[#00255a]',
  REAGENDADO: 'bg-[#c4c6d2] text-[#434750]',
};

const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function KpiCard({ icon, label, value, trend, trendUp, onClick, accent }: {
  icon: string; label: string; value: number | string;
  trend?: string; trendUp?: boolean; onClick?: () => void; accent?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl border border-[#c4c6d2] p-4 shadow-sm flex flex-col justify-between hover:border-[#0051d5] hover:shadow-md transition-all group text-left w-full ${onClick ? 'cursor-pointer active:scale-[.98]' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-lg ${accent ?? 'bg-[#d8e2ff]'}`}>
          <span className="material-symbols-outlined text-[#00255a] text-[22px]">{icon}</span>
        </div>
        {trend && (
          <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${trendUp ? 'text-[#20bf86]' : 'text-[#ba1a1a]'}`}>
            <span className="material-symbols-outlined text-[14px]">{trendUp ? 'trending_up' : 'trending_down'}</span>
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[12px] text-[#434750]">{label}</p>
        <p className="text-[24px] font-bold text-[#191c1e]">{typeof value === 'number' ? value.toLocaleString('es-CL') : value}</p>
      </div>
      {onClick && (
        <p className="text-[11px] text-[#0051d5] mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          Ver listado <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
        </p>
      )}
    </button>
  );
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

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recientes, setRecientes] = useState<Pedido[]>([]);

  useEffect(() => {
    api.get('/pedidos').then(r => {
      const pedidos: Pedido[] = r.data.data ?? [];
      const byEstado: Record<string, number> = {};
      const byDia: Record<string, number> = {};

      pedidos.forEach(p => {
        byEstado[p.estado] = (byEstado[p.estado] ?? 0) + 1;
        const d = p.fechaCreacion?.slice(0, 10) ?? '';
        byDia[d] = (byDia[d] ?? 0) + 1;
      });

      const today = new Date();
      const porDia = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        const key = d.toISOString().slice(0, 10);
        return { fecha: DIAS[d.getDay()], total: byDia[key] ?? 0 };
      });

      setStats({
        total: pedidos.length,
        entregados:  byEstado['ENTREGADO']  ?? 0,
        pendientes:  byEstado['PENDIENTE']   ?? 0,
        enRuta:      byEstado['EN_RUTA']     ?? 0,
        porDia,
        porEstado: Object.entries(byEstado).map(([estado, total]) => ({ estado, total })),
      });

      setRecientes([...pedidos].sort((a, b) =>
        new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
      ).slice(0, 6));
    }).catch(() => {});
  }, []);

  const s = stats ?? { total: 0, entregados: 0, pendientes: 0, enRuta: 0, porDia: [], porEstado: [] };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-bold text-[#00255a]">Dashboard</h1>
        <p className="text-[12px] text-[#747782]">Puerto Montt · Última actualización hace 2 min</p>
      </div>

      {/* KPI row — clickables */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon="inventory_2" label="Total Pedidos" value={s.total}
          trend="+12%" trendUp
          onClick={() => navigate('/pedidos')}
        />
        <KpiCard
          icon="check_circle" label="Entregados" value={s.entregados}
          trend="+5%" trendUp accent="bg-[#6ffbbe]/30"
          onClick={() => navigate('/pedidos?estado=ENTREGADO')}
        />
        <KpiCard
          icon="pending_actions" label="Pendientes" value={s.pendientes}
          trend="-2%" trendUp={false} accent="bg-[#ffdad6]"
          onClick={() => navigate('/pedidos?estado=PENDIENTE')}
        />
        <KpiCard
          icon="local_shipping" label="En Ruta" value={s.enRuta}
          accent="bg-[#316bf3]/10"
          onClick={() => navigate('/mapa')}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#c4c6d2] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[18px] font-semibold text-[#191c1e]">Pedidos por día (últimos 7 días)</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={s.porDia} barSize={32}>
              <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#434750' }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #c4c6d2', fontSize: 12 }}
                cursor={{ fill: '#f3f4f6' }}
              />
              <Bar dataKey="total" fill="#316bf3" radius={[6, 6, 0, 0]} name="Pedidos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-[#c4c6d2] p-6 shadow-sm flex flex-col">
          <h2 className="text-[18px] font-semibold text-[#191c1e] mb-4">Distribución por estado</h2>
          <div className="flex-1 flex flex-col justify-center">
            {s.porEstado.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={s.porEstado} dataKey="total" nameKey="estado" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {s.porEstado.map((entry) => (
                      <Cell key={entry.estado} fill={PIE_COLORS[entry.estado] ?? '#c4c6d2'} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={10} formatter={v => <span style={{ fontSize: 11, color: '#434750' }}>{v}</span>} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #c4c6d2', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-[#747782]">
                <span className="material-symbols-outlined text-[40px] mb-2 opacity-30">pie_chart</span>
                <p className="text-[13px]">Sin datos aún</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom grid: Eventos recientes + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Eventos recientes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#c4c6d2] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[18px] font-semibold text-[#191c1e]">Eventos Recientes</h2>
            <button
              onClick={() => navigate('/pedidos')}
              className="text-[12px] font-bold text-[#0051d5] hover:underline flex items-center gap-1"
            >
              Ver todos <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </button>
          </div>
          <div className="space-y-1">
            {recientes.length === 0 ? (
              <p className="text-[13px] text-[#747782] py-4 text-center">Sin eventos recientes</p>
            ) : recientes.map(p => (
              <button
                key={p.id}
                onClick={() => navigate('/pedidos')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f3f4f6] transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-[#d8e2ff] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#00255a] text-[16px]">
                    {p.estado === 'ENTREGADO' ? 'check_circle' : p.estado === 'EN_RUTA' ? 'local_shipping' : 'pending_actions'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#191c1e] truncate">
                    ORD-{String(p.id).padStart(4,'0')} · {p.cliente?.nombre ?? p.direccionEntrega}
                  </p>
                  <p className="text-[11px] text-[#434750] truncate">{p.direccionEntrega}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${ESTADO_COLOR[p.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                  {p.estado.replace('_', ' ')}
                </span>
                <span className="text-[11px] text-[#747782] shrink-0 ml-1">{timeAgo(p.fechaCreacion)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white rounded-xl border border-[#c4c6d2] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[18px] font-semibold text-[#191c1e]">Alertas</h2>
            <span className="px-2 py-0.5 bg-[#ba1a1a]/10 text-[#ba1a1a] text-[11px] font-bold rounded-full">
              {s.pendientes} pendientes
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#ffdad6]/30 border-l-4 border-[#ba1a1a]">
              <span className="material-symbols-outlined text-[#ba1a1a] text-[18px] mt-0.5">warning</span>
              <div>
                <p className="text-[12px] font-bold text-[#191c1e]">Retraso en Ruta</p>
                <p className="text-[11px] text-[#434750]">Tráfico intenso · +25 min estimado</p>
                <p className="text-[10px] text-[#747782] mt-0.5">Hace 4 min</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#6ffbbe]/20 border-l-4 border-[#20bf86]">
              <span className="material-symbols-outlined text-[#20bf86] text-[18px] mt-0.5">verified</span>
              <div>
                <p className="text-[12px] font-bold text-[#191c1e]">Flota lista</p>
                <p className="text-[11px] text-[#434750]">VEH-001 a VEH-003 operativos</p>
                <p className="text-[10px] text-[#747782] mt-0.5">Hace 15 min</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#d8e2ff]/50 border-l-4 border-[#316bf3]">
              <span className="material-symbols-outlined text-[#316bf3] text-[18px] mt-0.5">info</span>
              <div>
                <p className="text-[12px] font-bold text-[#191c1e]">{s.enRuta} en ruta ahora</p>
                <p className="text-[11px] text-[#434750]">Seguimiento activo en Mapa GPS</p>
                <button onClick={() => navigate('/mapa')} className="text-[10px] text-[#0051d5] font-semibold mt-0.5 hover:underline">
                  Ver mapa →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
