import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Client } from '@stomp/stompjs';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Íconos coloreados por vehículo
function makeIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <span class="material-symbols-outlined" style="font-size:14px;color:white;font-variation-settings:'FILL' 1">local_shipping</span>
    </div>`,
    iconSize:   [28, 28],
    iconAnchor: [14, 14],
  });
}

const VEH_COLORS = ['#316bf3', '#20bf86', '#ba1a1a'];

// Interpola n pasos entre cada par de waypoints para movimiento suave
function interpolarRuta(waypoints: [number, number][], pasos: number): [number, number][] {
  const result: [number, number][] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [lat1, lng1] = waypoints[i];
    const [lat2, lng2] = waypoints[i + 1];
    for (let j = 0; j < pasos; j++) {
      const t = j / pasos;
      result.push([lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t]);
    }
  }
  result.push(waypoints[waypoints.length - 1]);
  return result;
}

// Waypoints clave de Puerto Montt — se interpolan a 16 pasos cada segmento
const WAYPOINTS: [number, number][][] = [
  [
    [-41.4693, -72.9424], [-41.4680, -72.9400], [-41.4660, -72.9380],
    [-41.4640, -72.9360], [-41.4620, -72.9390], [-41.4610, -72.9420],
    [-41.4630, -72.9450], [-41.4650, -72.9470], [-41.4670, -72.9460],
    [-41.4693, -72.9424],
  ],
  [
    [-41.4700, -72.9500], [-41.4720, -72.9480], [-41.4740, -72.9460],
    [-41.4750, -72.9430], [-41.4730, -72.9410], [-41.4710, -72.9390],
    [-41.4690, -72.9380], [-41.4670, -72.9400], [-41.4700, -72.9500],
  ],
  [
    [-41.4660, -72.9450], [-41.4670, -72.9470], [-41.4680, -72.9500],
    [-41.4700, -72.9520], [-41.4720, -72.9510], [-41.4730, -72.9490],
    [-41.4720, -72.9470], [-41.4700, -72.9460], [-41.4660, -72.9450],
  ],
];

const RUTAS_SIM = WAYPOINTS.map(w => interpolarRuta(w, 16));

interface Vehiculo { id: number; codigo: string; patente: string; }
interface Posicion { lat: number; lng: number; vehiculoId: number; ts: string; }

interface SimVeh {
  veh: Vehiculo;
  posicion: Posicion;
  rutaIdx: number;
  stepIdx: number;
  trail: [number, number][];
}

function FlyTo({ posicion }: { posicion: Posicion | null }) {
  const map = useMap();
  useEffect(() => {
    if (posicion) map.flyTo([posicion.lat, posicion.lng], 15, { duration: 1 });
  }, [posicion, map]);
  return null;
}

export default function MapaPage() {
  const [vehiculos, setVehiculos]   = useState<Vehiculo[]>([]);
  const [vehiculoId, setVehiculoId] = useState<number | ''>('');
  const [posicion, setPosicion]     = useState<Posicion | null>(null);
  const [eventos, setEventos]       = useState<{ ts: string; msg: string }[]>([]);
  const [simActiva, setSimActiva]   = useState(false);
  const [simVehs, setSimVehs]       = useState<SimVeh[]>([]);
  const stompRef  = useRef<Client | null>(null);
  const simRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.get('/vehiculos').then(r => setVehiculos(r.data.data ?? []));
  }, []);

  // STOMP real
  useEffect(() => {
    if (!vehiculoId) return;
    const stored = localStorage.getItem('auth');
    const token  = stored ? JSON.parse(stored).token : '';
    const client = new Client({
      webSocketFactory: () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SockJS = (window as any).SockJS;
        return new SockJS('/ws');
      },
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        client.subscribe(`/topic/tracking/${vehiculoId}`, (msg) => {
          const punto = JSON.parse(msg.body);
          const pos: Posicion = {
            lat: punto.latitud, lng: punto.longitud,
            vehiculoId: punto.vehiculo?.id ?? vehiculoId, ts: punto.timestamp,
          };
          setPosicion(pos);
          addEvento(`GPS: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`);
        });
      },
    });
    client.activate();
    stompRef.current = client;
    return () => { client.deactivate(); stompRef.current = null; };
  }, [vehiculoId]);

  const addEvento = useCallback((msg: string) => {
    const ts = new Date().toTimeString().slice(0, 8);
    setEventos(ev => [{ ts, msg }, ...ev].slice(0, 8));
  }, []);

  // Simulación GPS
  const iniciarSimulacion = useCallback(() => {
    if (vehiculos.length === 0) return;
    const vehs = vehiculos.slice(0, 3);
    const inicial: SimVeh[] = vehs.map((veh, i) => {
      const rutaIdx = i % RUTAS_SIM.length;
      const ruta = RUTAS_SIM[rutaIdx];
      return {
        veh,
        posicion: { lat: ruta[0][0], lng: ruta[0][1], vehiculoId: veh.id, ts: new Date().toISOString() },
        rutaIdx,
        stepIdx: 0,
        trail: [ruta[0]],
      };
    });
    setSimVehs(inicial);
    setSimActiva(true);
    addEvento('Simulación iniciada — 3 vehículos activos');

    simRef.current = setInterval(() => {
      setSimVehs(prev => prev.map(sv => {
        const ruta = RUTAS_SIM[sv.rutaIdx];
        const nextStep = (sv.stepIdx + 1) % ruta.length;
        const [lat, lng] = ruta[nextStep];
        // Ruido mínimo para simular imprecisión GPS real
        const jLat = lat + (Math.random() - 0.5) * 0.00008;
        const jLng = lng + (Math.random() - 0.5) * 0.00008;
        const ts = new Date().toISOString();
        const nuevaPos: Posicion = { lat: jLat, lng: jLng, vehiculoId: sv.veh.id, ts };
        const trail: [number, number][] = [...sv.trail, [jLat, jLng]].slice(-20);
        return { ...sv, posicion: nuevaPos, stepIdx: nextStep, trail };
      }));
      // Evento aleatorio (menos frecuente)
      const msgs = ['Entrega completada', 'Llegando a destino', 'En ruta', 'Punto de entrega próximo'];
      if (Math.random() < 0.12) addEvento(msgs[Math.floor(Math.random() * msgs.length)]);
    }, 1800);
  }, [vehiculos, addEvento]);

  const detenerSimulacion = useCallback(() => {
    if (simRef.current) { clearInterval(simRef.current); simRef.current = null; }
    setSimActiva(false);
    setSimVehs([]);
    addEvento('Simulación detenida');
  }, [addEvento]);

  useEffect(() => () => { if (simRef.current) clearInterval(simRef.current); }, []);

  const veh = vehiculos.find(v => v.id === vehiculoId);
  const posicionActual = simActiva
    ? (simVehs[0]?.posicion ?? null)
    : posicion;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-semibold text-[#00255a]">Mapa GPS</h2>
          <nav className="flex items-center gap-2 text-[#434750] text-[11px] font-semibold mt-0.5">
            <a href="#" className="hover:text-[#00255a]">Dashboard</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#191c1e]">Seguimiento en Tiempo Real</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector vehículo (solo cuando no simula) */}
          {!simActiva && (
            <select
              value={vehiculoId}
              onChange={e => { setVehiculoId(Number(e.target.value)); setPosicion(null); setEventos([]); }}
              className="h-10 px-3 text-[13px] rounded-lg border border-[#c4c6d2] text-[#191c1e] bg-white focus:outline-none focus:border-[#00255a] min-w-[220px]"
            >
              <option value="">Seleccionar vehículo...</option>
              {vehiculos.map(v => <option key={v.id} value={v.id}>{v.codigo} — {v.patente}</option>)}
            </select>
          )}

          {/* Botón simulación */}
          {!simActiva ? (
            <button
              onClick={iniciarSimulacion}
              disabled={vehiculos.length === 0}
              className="h-10 px-4 rounded-lg bg-[#20bf86] text-white text-[13px] font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[16px]">directions_car</span>
              Ver Recorrido
            </button>
          ) : (
            <button
              onClick={detenerSimulacion}
              className="h-10 px-4 rounded-lg bg-[#ba1a1a] text-white text-[13px] font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[16px]">stop</span>
              Detener
            </button>
          )}
        </div>
      </div>

      {/* Main grid: map + right panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ height: '62vh' }}>

        {/* Map */}
        <div className="lg:col-span-3 rounded-xl overflow-hidden border border-[#c4c6d2] shadow-sm">
          <MapContainer center={[-41.4693, -72.9424]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyTo posicion={posicionActual} />

            {/* GPS real (un vehículo) */}
            {!simActiva && posicion && (
              <Marker position={[posicion.lat, posicion.lng]}>
                <Popup>
                  <strong>{veh?.codigo ?? 'Vehículo'}</strong><br />
                  {posicion.lat.toFixed(6)}, {posicion.lng.toFixed(6)}<br />
                  <small>{posicion.ts}</small>
                </Popup>
              </Marker>
            )}

            {/* Vehículos simulados */}
            {simActiva && simVehs.map((sv, i) => (
              <div key={sv.veh.id}>
                <Polyline
                  positions={sv.trail as [number, number][]}
                  pathOptions={{ color: VEH_COLORS[i % VEH_COLORS.length], weight: 3, opacity: 0.6, dashArray: '6 4' }}
                />
                <Marker
                  position={[sv.posicion.lat, sv.posicion.lng]}
                  icon={makeIcon(VEH_COLORS[i % VEH_COLORS.length])}
                >
                  <Popup>
                    <strong>{sv.veh.codigo}</strong> — {sv.veh.patente}<br />
                    <span style={{ color: '#20bf86', fontWeight: 700 }}>● EN RUTA</span><br />
                    {sv.posicion.lat.toFixed(6)}, {sv.posicion.lng.toFixed(6)}
                  </Popup>
                </Marker>
              </div>
            ))}
          </MapContainer>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-3 overflow-hidden">

          {/* Estado simulación / vehículo */}
          <div className="bg-white rounded-xl border border-[#c4c6d2] p-4 shadow-sm">
            <h3 className="text-[13px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#0051d5]">
                {simActiva ? 'sensors' : 'local_shipping'}
              </span>
              {simActiva ? 'Flota Activa' : 'Info del Vehículo'}
            </h3>
            {simActiva ? (
              <div className="space-y-2">
                {simVehs.map((sv, i) => (
                  <div key={sv.veh.id} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: VEH_COLORS[i % VEH_COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-[#191c1e] truncate">{sv.veh.codigo}</p>
                      <p className="text-[10px] text-[#747782]">{sv.posicion.lat.toFixed(4)}, {sv.posicion.lng.toFixed(4)}</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#20bf86]">● RUTA</span>
                  </div>
                ))}
              </div>
            ) : veh ? (
              <>
                <div className="w-10 h-10 rounded-lg bg-[#dbe1ff] flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[#0051d5] text-[20px]">local_shipping</span>
                </div>
                <p className="text-[14px] font-bold text-[#00255a]">{veh.codigo}</p>
                <p className="text-[12px] text-[#434750] mt-0.5">{veh.patente}</p>
              </>
            ) : (
              <p className="text-[12px] text-[#747782]">Sin vehículo seleccionado</p>
            )}
          </div>

          {/* Estado GPS */}
          <div className="bg-white rounded-xl border border-[#c4c6d2] p-4 shadow-sm">
            <h3 className="text-[13px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#0051d5]">gps_fixed</span>
              Estado GPS
            </h3>
            {simActiva ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#20bf86] animate-pulse" />
                  <span className="text-[12px] font-semibold text-[#20bf86]">Simulación activa</span>
                </div>
                <p className="text-[11px] text-[#434750]">{simVehs.length} vehículos en ruta</p>
                <p className="text-[11px] text-[#434750]">Actualización cada 2s</p>
              </div>
            ) : posicion ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#20bf86] animate-pulse" />
                  <span className="text-[12px] font-semibold text-[#20bf86]">Activo</span>
                </div>
                <div className="space-y-1 text-[11px] text-[#434750]">
                  <p><span className="font-semibold text-[#191c1e]">Lat:</span> {posicion.lat.toFixed(6)}</p>
                  <p><span className="font-semibold text-[#191c1e]">Lng:</span> {posicion.lng.toFixed(6)}</p>
                  <p><span className="font-semibold text-[#191c1e]">Hora:</span> {posicion.ts?.slice(11, 19) ?? ''}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c4c6d2]" />
                <span className="text-[12px] text-[#747782]">Esperando señal...</span>
              </div>
            )}
          </div>

          {/* Eventos recientes */}
          <div className="bg-white rounded-xl border border-[#c4c6d2] p-4 shadow-sm flex-1 overflow-hidden">
            <h3 className="text-[13px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#0051d5]">history</span>
              Eventos Recientes
            </h3>
            {eventos.length === 0 ? (
              <p className="text-[11px] text-[#747782]">Sin eventos registrados</p>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[150px]">
                {eventos.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#316bf3] mt-1.5 shrink-0" />
                    <div>
                      <p className="text-[11px] text-[#191c1e]">{ev.msg}</p>
                      <p className="text-[10px] text-[#747782]">{ev.ts}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      {(vehiculoId || simActiva) && (
        <div className="flex items-center gap-4 px-5 py-3 bg-white rounded-xl border border-[#c4c6d2] shadow-sm flex-wrap">
          {simActiva ? (
            <>
              <span className="flex items-center gap-2 text-[13px] font-semibold text-[#191c1e]">
                <span className="material-symbols-outlined text-[#20bf86] text-[18px]">sensors</span>
                Simulación GPS activa
              </span>
              <span className="text-[#c4c6d2]">·</span>
              <span className="text-[12px] text-[#20bf86] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#20bf86] animate-pulse" />
                {simVehs.length} vehículos en ruta · Puerto Montt
              </span>
              {simVehs[0] && (
                <>
                  <span className="text-[#c4c6d2]">·</span>
                  <span className="text-[12px] text-[#434750] font-mono">
                    {simVehs[0].posicion.lat.toFixed(5)}, {simVehs[0].posicion.lng.toFixed(5)}
                  </span>
                </>
              )}
            </>
          ) : (
            <>
              <span className="flex items-center gap-2 text-[13px] font-semibold text-[#191c1e]">
                <span className="material-symbols-outlined text-[#0051d5] text-[18px]">local_shipping</span>
                {veh?.codigo} — {veh?.patente}
              </span>
              <span className="text-[#c4c6d2]">·</span>
              {posicion ? (
                <>
                  <span className="flex items-center gap-1.5 text-[12px] text-[#20bf86] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#20bf86]" /> GPS activo
                  </span>
                  <span className="text-[#c4c6d2]">·</span>
                  <span className="text-[12px] text-[#434750] font-mono">
                    {posicion.lat.toFixed(5)}, {posicion.lng.toFixed(5)}
                  </span>
                </>
              ) : (
                <span className="text-[12px] text-[#747782]">Esperando señal GPS...</span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
