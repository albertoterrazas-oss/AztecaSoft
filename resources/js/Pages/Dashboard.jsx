import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  FileSpreadsheet, RefreshCcw, Package, Scale, CheckCircle2, TrendingDown, Box
} from 'lucide-react';
import { toast } from "sonner";

const VacaReal3D = ({ modelo }) => {
  return (
    <div className="w-full h-[300px] md:h-[350px] flex items-center justify-center">
      <model-viewer
        key={modelo} 
        src={`/3d/${modelo}`} 
        auto-rotate
        camera-controls
        shadow-intensity="2"
        environment-image="neutral"
        exposure="1"
        interaction-prompt="none"
        style={{ width: '100%', height: '100%', outline: 'none' }}
        touch-action="pan-y"
      >
        <div slot="poster" className="flex flex-col items-center justify-center text-slate-400">
          <RefreshCcw className="animate-spin mb-2" />
          <span className="text-[10px] font-black uppercase tracking-widest">Cargando...</span>
        </div>
      </model-viewer>
    </div>
  );
};

export default function DashboardReportes() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({ kpis: {}, grafica: [] });
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
    <div className="h-[100%] bg-[#F8FAFC] p-4 md:p-8 lg:p-10 font-sans text-slate-900">

      {/* HEADER - Mejor espaciado en tablet */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase italic">
            DASHBOARD <span className="text-red-800">CONTROL</span>
          </h1>
          <p className="text-slate-400 text-[11px] font-bold tracking-[0.3em] uppercase mt-1">Monitoreo en Tiempo Real</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchDashboardData} className="p-4 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-all active:scale-95 shadow-sm">
            <RefreshCcw size={22} className={loading ? 'animate-spin text-red-800' : 'text-slate-400'} />
          </button>
          <button className="bg-[#0F172A] text-white px-8 py-4 rounded-2xl font-bold text-sm flex items-center gap-3 shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-colors">
            <FileSpreadsheet size={20} /> <span className="hidden sm:inline">EXPORTAR EXCEL</span>
          </button>
        </div>
      </div>

      {/* KPIs - REPARADO: sm:grid-cols-2 es clave para Tablet */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {[
          { t: "Total Recibido", v: `${fmt(kpis.TotalRecibido)}`, u: "kg", i: Scale, c: "text-emerald-500" },
          { t: "Limpieza A2", v: `${fmt(kpis.TotalLimpiezaA2)}`, u: "kg", i: Package, c: "text-blue-500" },
          { t: "Merma", v: `${kpis.MermaPromedio || 0}`, u: "%", i: TrendingDown, c: "text-red-500" },
          { t: "Eficiencia", v: `${kpis.Eficiencia || 0}`, u: "%", i: CheckCircle2, c: "text-orange-500" }
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.t}</p>
              <div className={`${card.c} bg-slate-50 p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                <card.i size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{card.v}</h3>
              <span className="text-sm font-bold text-slate-400 uppercase">{card.u}</span>
            </div>
          </div>
        ))}
      </div>

      {/* SECCIÓN PRINCIPAL - Grid 1 col en tablet, 3 en desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* GRÁFICA */}
        <div className="xl:col-span-2 bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-2 h-8 bg-red-800 rounded-full" />
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tighter">Rendimiento de Planta</h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataBarras} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 800 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="valor" fill="#991b1b" radius={[10, 10, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MODELO 3D - Altura controlada para que no se vea gigante */}
        <div className="flex flex-col">
          <div className="bg-[#1B2654] rounded-[3rem] p-8 shadow-2xl relative overflow-hidden flex flex-col items-center justify-between min-h-[500px]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(153,27,27,0.3),transparent)]" />

            {/* SELECTOR */}
            <div className="relative z-20 flex gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl w-full">
              <button 
                onClick={() => setModeloActivo('quaternius_cc0-cow-881.glb')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black transition-all ${modeloActivo === 'quaternius_cc0-cow-881.glb' ? 'bg-red-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                <Box size={14} /> VACA 
              </button>
              <button 
                onClick={() => setModeloActivo('quaternius_cc0-cow-882.glb')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black transition-all ${modeloActivo === 'quaternius_cc0-cow-882.glb' ? 'bg-red-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                <Box size={14} /> TORO
              </button>
            </div>

            <VacaReal3D modelo={modeloActivo} />

            <div className="relative z-10 text-center">
              <h4 className="font-black text-2xl uppercase tracking-tighter italic text-white">AVT <span className="text-red-600">SYSTEM</span></h4>
              <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-[0.2em] opacity-60 italic">Industrial Vision 2026</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}