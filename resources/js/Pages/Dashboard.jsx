import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Download, 
  FileSpreadsheet, 
  RefreshCcw, 
  TrendingUp, 
  TrendingDown,
  Package, 
  Scale, 
  CheckCircle2,
  Thermometer
} from 'lucide-react';
import { toast } from "sonner";

// --- COMPONENTE DE TARJETA KPI ---
const StatCard = ({ title, value, subtext, trend, trendColor, icon: Icon }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-500 text-[11px] font-black uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-black text-gray-800 mb-2">{value}</h3>
      </div>
      <div className={`p-2 rounded-xl ${trendColor.replace('text', 'bg')}/10`}>
        <Icon size={22} className={trendColor} />
      </div>
    </div>
    <div className="flex items-center gap-1 mt-1">
        <span className={`text-xs font-bold ${trendColor}`}>
            {trend}%
        </span>
        <span className="text-gray-400 text-[10px] font-medium uppercase">{subtext}</span>
    </div>
  </div>
);

export default function DashboardReportes() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    kpis: {},
    grafica: []
  });

  // --- OBTENER DATOS DEL API ---
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Usando tu ruta exacta
      const response = await fetch('/api/getKilosDashboard'); 
      const res = await response.json();

      if (res.success) {
        setDashboardData({
          kpis: res.data.diarios[0] || {}, // El objeto con totales
          grafica: res.data.recientes || [] // El array de la semana
        });
        toast.success("Sincronización Exitosa", {
            description: "Datos actualizados desde el servidor SQL."
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión", {
        description: "No se pudo conectar con /api/getKilosDashboard"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Formateador de números (quita ceros extras y pone comas)
  const fmt = (val) => parseFloat(val || 0).toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  const { kpis, grafica } = dashboardData;

  // Mapeo para la gráfica de barras
  const dataBarras = grafica.map(item => ({
    name: item.DiaSemana, 
    valor: parseFloat(item.VolumenProcesado || 0)
  }));

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">
            Control de Pesaje <span className="text-red-800">Innova</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold tracking-[0.2em] uppercase">Métricas de Rendimiento Diario</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            <RefreshCcw size={18} className={`${loading ? 'animate-spin text-red-800' : 'text-slate-400'}`} /> 
            {loading ? 'Consultando...' : 'Actualizar'}
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all active:scale-95">
            <FileSpreadsheet size={18} /> Reporte Excel
          </button>
        </div>
      </div>

      {/* KPIs (Data de 'diarios') */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Recibido" 
          value={`${fmt(kpis.TotalRecibido)} kg`}
          trend={kpis.PorcentajeRecibidoVsAyer || "0"} 
          subtext="Vs Ayer" 
          trendColor="text-emerald-600" 
          icon={Scale} 
        />
        <StatCard 
          title="Limpieza (A2)" 
          value={`${fmt(kpis.TotalLimpiezaA2)} kg`}
          trend={kpis.PorcentajeLimpiezaVsAyer || "0"} 
          subtext="Rendimiento" 
          trendColor="text-blue-600" 
          icon={Package} 
        />
        <StatCard 
          title="Merma" 
          value={`${kpis.MermaPromedio || "0"}%`}
          trend={kpis.MermaAyer || "0"} 
          subtext="Promedio" 
          trendColor="text-red-600" 
          icon={TrendingDown} 
        />
        <StatCard 
          title="Eficiencia" 
          value={`${kpis.Eficiencia || "0"}%`}
          trend="100" 
          subtext="Meta" 
          trendColor="text-orange-600" 
          icon={CheckCircle2} 
        />
      </div>

      {/* GRÁFICA Y RESUMEN (Data de 'recientes' y 'diarios') */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfica */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-10">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-3">
              <div className="w-2 h-8 bg-red-800 rounded-full" />
              VOLUMEN PROCESADO (ÚLTIMOS 7 DÍAS)
            </h3>
          </div>
          
          <div className="h-[350px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-300 font-black animate-pulse">CARGANDO GRÁFICA...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataBarras} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: '900' }} 
                    dy={15} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="valor" fill="#991b1b" radius={[10, 10, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Panel Secundario (Data de diarios) */}
        <div className="space-y-6">
            <div className="bg-red-900 rounded-[2rem] p-8 text-white shadow-xl shadow-red-900/20">
                <p className="text-red-200 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Empacado Final</p>
                <h4 className="text-5xl font-black mb-2">{fmt(kpis.EmpacadoFinal)}</h4>
                <p className="text-red-200/60 text-sm font-bold uppercase">Kilogramos Netos</p>
                <div className="mt-8 pt-6 border-t border-red-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-red-200">Refrigerado (A3)</span>
                    <span className="text-xl font-black">{fmt(kpis.TotalRefrigerado)} kg</span>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                        <Thermometer size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase">Estado Sistema</p>
                        <p className="text-slate-800 font-black">OPERATIVO</p>
                    </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full w-[85%] rounded-full" />
                </div>
                <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-tighter">Sincronización de básculas al 85%</p>
            </div>
        </div>
      </div>
    </div>
  );
}