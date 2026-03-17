import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  FileSpreadsheet,
  RefreshCcw,
  Package,
  Scale,
  CheckCircle2,
  TrendingDown,
  Box
} from 'lucide-react';
import { toast } from "sonner";

// --- VISOR DE MODELO REAL .GLB ---
// Recibe "modelo" como prop para actualizarse dinámicamente
const VacaReal3D = ({ modelo }) => {
  return (
    <div className="w-full h-[400px] flex items-center justify-center">
      <model-viewer
        key={modelo} // Key vital para que React refresque el componente al cambiar el path
        src={`/3d/${modelo}`} 
        alt="Modelo 3D Innova"
        auto-rotate
        camera-controls
        shadow-intensity="2"
        environment-image="neutral"
        exposure="1"
        interaction-prompt="none"
        style={{ width: '100%', height: '100%', outline: 'none' }}
        touch-action="pan-y"
      >
        <div slot="poster" className="flex flex-col items-center justify-center text-slate-500">
          <RefreshCcw className="animate-spin mb-2" />
          <span className="text-[10px] font-black uppercase">Cargando {modelo}...</span>
        </div>
      </model-viewer>
    </div>
  );
};

export default function DashboardReportes() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({ kpis: {}, grafica: [] });
  
  // ESTADO PARA EL MODELO 3D
  const [modeloActivo, setModeloActivo] = useState('quaternius_cc0-cow-882.glb');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/getKilosDashboard');
      const res = await response.json();
      if (res.success) {
        setDashboardData({
          kpis: res.data.diarios[0] || {},
          grafica: res.data.recientes || []
        });
      }
    } catch (e) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const fmt = (val) => parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
  const { kpis, grafica } = dashboardData;
  const dataBarras = grafica.map(item => ({
    name: item.DiaSemana,
    valor: parseFloat(item.VolumenProcesado || 0)
  }));

  return (
    <div className="h-[100%] bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900">

      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">
            Dashboard <span className="text-red-800">Control </span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase">Monitoreo de Activos en Tiempo Real</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchDashboardData} className="p-3 bg-white border border-slate-200 rounded-2xl hover:shadow-sm transition-all active:scale-95">
            <RefreshCcw size={20} className={loading ? 'animate-spin text-red-800' : 'text-slate-400'} />
          </button>
          <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-slate-900/20">
            <FileSpreadsheet size={18} /> EXCEL
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { t: "Total Recibido", v: `${fmt(kpis.TotalRecibido)} kg`, i: Scale, c: "text-emerald-600" },
          { t: "Limpieza A2", v: `${fmt(kpis.TotalLimpiezaA2)} kg`, i: Package, c: "text-blue-600" },
          { t: "Merma", v: `${kpis.MermaPromedio || 0}%`, i: TrendingDown, c: "text-red-600" },
          { t: "Eficiencia", v: `${kpis.Eficiencia || 0}%`, i: CheckCircle2, c: "text-orange-600" }
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-red-100 transition-colors">
            <div className="flex justify-between mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.t}</p>
              <card.i className={card.c} size={20} />
            </div>
            <h3 className="text-2xl font-black text-slate-800">{card.v}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GRÁFICA */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-black text-slate-800 mb-8 uppercase tracking-tighter flex items-center gap-2">
            <div className="w-1.5 h-6 bg-red-800 rounded-full" /> Rendimiento de Planta
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataBarras}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 900 }} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="valor" fill="#991b1b" radius={[10, 10, 0, 0]} barSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PANEL DERECHO: EL MODELO 3D + SELECTOR */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[3.5rem] p-6 shadow-2xl relative overflow-hidden flex flex-col items-center min-h-[580px] justify-center text-white"
            style={{ backgroundColor: '#1B2654' }}
          >
            {/* Glow de fondo */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(153,27,27,0.25),transparent)]" />

            {/* SELECTOR DE MODELO (TABS) */}
            <div className="relative z-20 flex gap-2 mb-6 bg-black/30 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
              <button 
                onClick={() => setModeloActivo('quaternius_cc0-cow-881.glb')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${modeloActivo === 'quaternius_cc0-cow-881.glb' ? 'bg-red-700 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Box size={14} /> VACA 
              </button>
              <button 
                onClick={() => setModeloActivo('quaternius_cc0-cow-882.glb')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${modeloActivo === 'quaternius_cc0-cow-882.glb' ? 'bg-red-700 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Box size={14} /> TORO
              </button>
            </div>

            {/* RENDER REAL */}
            <VacaReal3D modelo={modeloActivo} />

            <div className="relative z-10 text-center mt-4">
              <h4 className="font-black text-2xl uppercase tracking-tighter italic">AVT <span className="text-red-600">System</span></h4>
              <p className="text-slate-400 text-[10px] font-medium uppercase mt-1 tracking-widest italic opacity-70">
                {/* Visualizando Activo: {modeloActivo} */}
                2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}