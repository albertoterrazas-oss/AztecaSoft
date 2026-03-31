import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  FileSpreadsheet, RefreshCcw, Package, Scale, CheckCircle2, TrendingDown, 
  Box, Database, ChevronRight, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast, Toaster } from "sonner";
import axios from 'axios';

const VacaReal3D = ({ modelo }) => (
  <div className="w-full h-[280px] flex items-center justify-center">
    <model-viewer
      key={modelo}
      src={`/3d/${modelo}`}
      auto-rotate
      camera-controls
      shadow-intensity="2"
      exposure="1"
      style={{ width: '100%', height: '100%', outline: 'none' }}
    />
  </div>
);

export default function DashboardConectado() {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('semana'); // Control para tu API
  const [modeloActivo, setModeloActivo] = useState('quaternius_cc0-cow-882.glb');
  const [data, setData] = useState({ kpis: {}, grafica: [], movimientos: [] });

  // --- FUNCIÓN DE CARGA REAL ---
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Ajustamos el endpoint con el periodo seleccionado
      const response = await axios.get(`/api/getKilosDashboard`, {
        params: { filtro: periodo } // Enviamos 'dia', 'semana', etc.
      });

      if (response.data.success) {
        const result = response.data.data;
        setData({
          kpis: result.diarios[0] || {},
          grafica: result.recientes || [],
          // Aquí podrías cargar un segundo endpoint para la tabla si es necesario
          movimientos: [
            { fecha: '30/03/2026', tipo: 'ENTRADA', lote: 'LOTE-2117', folio: 'F-990', cliente: 'CENTRAL', clas: 'VISCERAS', prod: 'BOFE', sub: 'BOFE', kilos: 316.0000 },
            { fecha: '30/03/2026', tipo: 'ENTRADA', lote: 'LOTE-2118', folio: 'F-991', cliente: 'CENTRAL', clas: 'VISCERAS', prod: 'BOFE', sub: 'BOFE', kilos: 86.0000 },
          ]
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al conectar con la API de Azteca AVT");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, [periodo]);

  const fmt = (val) => parseFloat(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
  
  // Mapeo para la gráfica (Recharts necesita números limpios)
  const chartData = data.grafica.map(item => ({
    name: item.DiaSemana.toUpperCase(),
    valor: parseFloat(item.VolumenProcesado || 0)
  }));

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-8 lg:p-10 font-sans text-slate-900">
      <Toaster richColors position="top-right" />

      {/* HEADER */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-6">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#1B2654] text-white px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase italic">Azteca AVT</span>
            <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> SISTEMA CONECTADO
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-[#1B2654] tracking-tighter italic uppercase leading-none">
            Dashboard <span className="text-[#A61A18] not-italic">REPORTES</span>
          </h1>
        </motion.div>

        <div className="flex flex-wrap items-center gap-4">
          {/* SELECTOR DE PERIODO REAL */}
          <div className="flex bg-white p-1.5 rounded-2xl shadow-xl border border-slate-100">
            {['dia', 'semana', 'quincena', 'mes'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                  periodo === p ? 'bg-[#1B2654] text-white shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          {/* <button className="bg-[#10b981] hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] tracking-widest flex items-center gap-3 shadow-xl transition-all active:scale-95">
            <FileSpreadsheet size={20} /> EXCEL PRO
          </button> */}
        </div>
      </header>

      {/* KPIS CON DATOS DEL JSON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {[
          { t: "Kilos Recibidos", v: fmt(data.kpis.TotalRecibido), u: "kg", i: Scale, c: "text-emerald-500", bg: "bg-emerald-50" },
          { t: "Limpieza A2", v: fmt(data.kpis.TotalLimpiezaA2), u: "kg", i: Package, c: "text-blue-500", bg: "bg-blue-50" },
          { t: "Merma Hoy", v: data.kpis.MermaPromedio || "0.00", u: "%", i: TrendingDown, c: "text-red-500", bg: "bg-red-50" },
          { t: "Eficiencia Planta", v: data.kpis.Eficiencia || "0.00", u: "%", i: CheckCircle2, c: "text-orange-500", bg: "bg-orange-50" }
        ].map((card, idx) => (
          <motion.div key={idx} whileHover={{ y: -5 }} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className={`${card.bg} ${card.c} p-3 rounded-2xl`}><card.i size={24} /></div>
              <Activity size={16} className="text-slate-200" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.t}</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{card.v}</h3>
              <span className="text-xs font-bold text-slate-400">{card.u}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
        {/* GRÁFICA CON VOLUMEN PROCESADO */}
        <div className="xl:col-span-2 bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm min-h-[450px]">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-3 h-10 bg-[#A61A18] rounded-full" />
            <div>
                <h3 className="font-black text-slate-800 text-xl uppercase tracking-tighter italic">Volumen Procesado</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Monitoreo por {periodo}</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {loading ? (
                <div className="h-full flex items-center justify-center"><RefreshCcw className="animate-spin text-[#1B2654]" size={32} /></div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip cursor={{ fill: '#f8fafc', radius: 10 }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="valor" fill="#1B2654" radius={[10, 10, 10, 10]} barSize={45}>
                            {chartData.map((entry, index) => (
                                <Cell key={index} fill={entry.valor > 0 ? '#1B2654' : '#E2E8F0'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* SELECTOR 3D VACA/TORO */}
        <div className="bg-[#1B2654] rounded-[3.5rem] p-8 shadow-2xl flex flex-col items-center justify-between">
            <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl w-full mb-6">
                <button 
                  onClick={() => setModeloActivo('quaternius_cc0-cow-881.glb')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${modeloActivo.includes('881') ? 'bg-[#A61A18] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >VACA</button>
                <button 
                  onClick={() => setModeloActivo('quaternius_cc0-cow-882.glb')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${modeloActivo.includes('882') ? 'bg-[#A61A18] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >TORO</button>
            </div>
            <VacaReal3D modelo={modeloActivo} />
            <div className="text-center">
                <h4 className="text-white font-black text-2xl tracking-tighter uppercase italic">3D <span className="text-[#A61A18]">MONITOR</span></h4>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Status Industrial</p>
            </div>
        </div>
      </div>

      {/* TABLA DE REPORTE DETALLADO (ESTILO IMAGEN) */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-[#1B2654] px-10 py-6 flex justify-between items-center border-b border-white/5">
            <h2 className="text-white font-black text-xs uppercase tracking-[0.4em] flex items-center gap-3">
                <Database size={16} className="text-[#A61A18]" /> Detalle de Movimientos
            </h2>
            <div className="px-4 py-1.5 bg-[#A61A18]/20 text-[#A61A18] rounded-full text-[9px] font-black uppercase">Live Data</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-[#242F5E] text-white/50 text-[9px] font-black uppercase tracking-[0.2em]">
                <th className="px-8 py-5 border-r border-white/5">Fecha</th>
                <th className="px-8 py-5 border-r border-white/5">Entrada/Salida</th>
                <th className="px-8 py-5 border-r border-white/5">Lote</th>
                <th className="px-8 py-5 border-r border-white/5">Folio</th>
                <th className="px-8 py-5 border-r border-white/5">Cliente</th>
                <th className="px-8 py-5 border-r border-white/5">Clasificación</th>
                <th className="px-8 py-5 border-r border-white/5">Producto</th>
                <th className="px-8 py-5 border-r border-white/5">Subproducto</th>
                <th className="px-8 py-5 text-right">Kilos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 uppercase tracking-tight">
              {data.movimientos.map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-8 py-4 text-[11px] font-bold text-slate-500">{row.fecha}</td>
                  <td className="px-8 py-4">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-md ${row.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {row.tipo}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-[11px] font-black text-[#1B2654]">{row.lote}</td>
                  <td className="px-8 py-4 text-slate-400 text-[11px] font-bold text-center">{row.folio}</td>
                  <td className="px-8 py-4 text-slate-400 text-[11px] font-bold">{row.cliente}</td>
                  <td className="px-8 py-4 text-[10px] font-black text-slate-500">{row.clas}</td>
                  <td className="px-8 py-4 text-[11px] font-black text-slate-700">{row.prod}</td>
                  <td className="px-8 py-4 text-slate-500 text-[11px] font-bold">{row.sub}</td>
                  <td className="px-8 py-4 text-[12px] font-black text-right text-slate-900 pr-12">
                    {row.kilos.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="bg-slate-50 px-10 py-5 flex justify-between items-center border-t border-slate-200">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Azteca AVT Management v2.0</span>
            <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"><ChevronRight size={18} className="rotate-180" /></button>
                <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"><ChevronRight size={18} /></button>
            </div>
        </div>
      </div>
    </div>
  );
}