import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import {
  Package, ChevronRight, X, CheckCircle2,
  User, Truck, Save, Box, Loader2, ArrowLeft,
  Printer, ArchiveX, Database, Activity, ShieldCheck
} from 'lucide-react';
import { Link } from "react-router-dom";

const PanelSalidaPacas = () => {
  // --- ESTADOS ---
  const [clientes, setClientes] = useState([]);
  const [pacasInventario, setPacasInventario] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCajas, setIsLoadingCajas] = useState(false);
  
  const [despachador, setDespachador] = useState({ 
    nombre: "USUARIO SISTEMA", 
    id: 1 
  });

  const [step, setStep] = useState('inicio');
  const [clienteSel, setClienteSel] = useState(null);
  const [pacasSeleccionadas, setPacasSeleccionadas] = useState([]);

  // 1. CARGA INICIAL Y PERFIL
  useEffect(() => {
    const perfilData = localStorage.getItem('perfil');
    if (perfilData) {
      try {
        const p = JSON.parse(perfilData);
        setDespachador({
          nombre: `${p.Nombres || 'Usuario'} ${p.ApePat || ''}`.toUpperCase(),
          id: p.IdUsuario || 1
        });
      } catch (e) {
        console.error("Error al parsear perfil", e);
      }
    }

    const fetchClientes = async () => {
      try {
        const response = await axios.get(route("clientes.index"));
        setClientes(response.data);
      } catch (error) {
        toast.error("Error al cargar la lista de clientes.");
      }
    };
    fetchClientes();
  }, []);

  // 2. CARGA DE INVENTARIO
  const fetchCajas = async () => {
    try {
      setIsLoadingCajas(true);
      const response = await axios.get(route("CajasIndex"));
      setPacasInventario(response.data);
      setStep('inventario');
    } catch (error) {
      toast.error("Error al obtener el inventario de cajas.");
    } finally {
      setIsLoadingCajas(false);
    }
  };

  const handlePrint = () => window.print();

  const handleGuardarVenta = async () => {
    if (!clienteSel) {
      toast.error("Selecciona un cliente para continuar.");
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        IdCliente: clienteSel.IdCliente,
        user: despachador.id,
        cajas: pacasSeleccionadas.map(p => p.IdCaja)
      };

      const response = await axios.post(route("venderCajas"), payload);

      if (response.data.success) {
        toast.success("Venta procesada correctamente.");
        setTimeout(() => {
          handlePrint(); 
          setPacasSeleccionadas([]);
          setClienteSel(null);
          setStep('inicio');
        }, 1000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.details || "Error al procesar el despacho.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePaca = (paca) => {
    const existe = pacasSeleccionadas.find(p => p.IdCaja === paca.IdCaja);
    if (existe) {
      setPacasSeleccionadas(pacasSeleccionadas.filter(p => p.IdCaja !== paca.IdCaja));
    } else {
      setPacasSeleccionadas([...pacasSeleccionadas, paca]);
    }
  };

  const totalKilos = useMemo(() => {
    return pacasSeleccionadas.reduce((acc, p) => acc + parseFloat(p.KilosTotales || 0), 0).toFixed(2);
  }, [pacasSeleccionadas]);

  const parsearProductos = (stringDetalle) => {
    if (!stringDetalle) return [];
    return stringDetalle.split(',').map(item => {
      const [nombre] = item.split('(');
      const peso = item.match(/\(([^)]+)\)/)?.[1] || '0.00kg';
      return {
        nombre: nombre.trim(),
        peso: peso.replace(/kg|KG/g, '').trim()
      };
    });
  };

  return (
    <div className="h-full bg-slate-50 p-4 md:p-8 font-sans">
      <Toaster position="top-right" richColors />

      {/* --- ESTILOS DE IMPRESIÓN --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: portrait; margin: 5mm; }
          body * { visibility: hidden; }
          #print-section, #print-section * { visibility: visible; }
          #print-section { position: absolute; left: 0; top: 0; width: 100%; color: black !important; }
          .no-print { display: none !important; }
          .print-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .paca-card-print { border: 1px solid #000 !important; padding: 10px !important; break-inside: avoid; margin-bottom: 10px !important; }
        }
      `}} />

      {/* --- VISTA 1: INICIO --- */}
      {step === 'inicio' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center min-h-[80vh]">
          <div className="bg-white rounded-[3.5rem] p-12 max-w-md w-full text-center shadow-2xl border-b-[12px] border-[#1B2654]">
            <div className="w-24 h-24 bg-slate-50 rounded-3xl mx-auto mb-8 border-4 border-[#1B2654] flex items-center justify-center text-[#1B2654] shadow-lg">
               <ShieldCheck size={48} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[#1B2654]">
              HOLA, <span className="text-[#A61A18] block">{despachador.nombre}</span>
            </h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase mt-3 mb-12 tracking-[0.4em]">Acceso Autorizado Azteca AVT</p>
            
            <div className="space-y-4">
              <button onClick={fetchCajas} className="w-full py-6 bg-[#1B2654] text-white rounded-[2rem] font-black italic flex justify-between px-10 items-center group shadow-lg hover:brightness-110 transition-all">
                <span className="tracking-widest uppercase text-sm">Iniciar Despacho</span>
                {isLoadingCajas ? <Loader2 className="animate-spin" /> : <ChevronRight />}
              </button>
              
              <Link to="/empaque" className="block">
                <button className="w-full py-6 bg-[#A61A18] text-white rounded-[2rem] font-black italic flex justify-between px-10 items-center shadow-lg hover:brightness-110 transition-all">
                  <span className="tracking-widest uppercase text-sm">Empacar Nuevo</span>
                  <Box size={20} />
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* --- VISTA 2: INVENTARIO --- */}
      {step === 'inventario' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep('inicio')} className="p-4 bg-white rounded-2xl shadow-sm hover:bg-slate-100 text-[#1B2654]">
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[#1B2654]">Pacas <span className="text-[#A61A18]">Disponibles</span></h1>
            </div>
            
            <div className="bg-[#1B2654] p-6 rounded-[2.5rem] flex items-center gap-10 shadow-2xl border-r-[10px] border-[#A61A18]">
              <div className="text-white">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carga Actual</p>
                <p className="text-2xl font-black italic">{pacasSeleccionadas.length} <small className="text-xs uppercase opacity-50">Und</small> / {totalKilos} <small className="text-xs uppercase opacity-50">Kg</small></p>
              </div>
              <button disabled={pacasSeleccionadas.length === 0} onClick={() => setStep('venta')} className="bg-[#A61A18] text-white px-10 py-4 rounded-2xl font-black uppercase italic text-sm shadow-lg hover:scale-105 transition-all disabled:opacity-50">
                Continuar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pacasInventario.map(paca => (
              <div 
                key={paca.IdCaja} 
                onClick={() => togglePaca(paca)}
                className={`p-7 rounded-[3rem] border-4 cursor-pointer transition-all ${pacasSeleccionadas.some(s => s.IdCaja === paca.IdCaja) ? 'border-[#A61A18] bg-white shadow-xl' : 'border-transparent bg-white shadow-sm hover:border-slate-100'}`}
              >
                <div className="flex justify-between items-center mb-5">
                  <span className="font-black text-[#1B2654] italic text-xl uppercase tracking-tighter">{paca.FolioCaja}</span>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${pacasSeleccionadas.some(s => s.IdCaja === paca.IdCaja) ? 'bg-[#A61A18] border-[#A61A18]' : 'border-slate-100'}`}>
                    {pacasSeleccionadas.some(s => s.IdCaja === paca.IdCaja) && <CheckCircle2 size={18} className="text-white" />}
                  </div>
                </div>
                <div className="space-y-2 mb-6 h-28 overflow-y-auto bg-slate-50 p-4 rounded-2xl">
                  {parsearProductos(paca.ContenidoDetallado).map((prod, i) => (
                    <div key={i} className="flex justify-between text-[10px] font-black text-slate-500 uppercase italic border-b border-slate-200 pb-1 last:border-0">
                      <span>• {prod.nombre}</span>
                      <span className="text-[#1B2654]">{prod.peso} KG</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t-2 border-dashed border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-300 uppercase">Peso Neto</span>
                  <span className="font-black italic text-2xl text-[#1B2654]">{parseFloat(paca.KilosTotales).toFixed(2)} KG</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* --- VISTA 3: RESUMEN (FINAL) --- */}
      {step === 'venta' && (
        <motion.div id="print-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-[#1B2654]">SALIDA DE <span className="text-[#A61A18]">ALMACÉN</span></h1>
            <div className="flex gap-4">
              <button onClick={() => setStep('inventario')} className="bg-slate-200 text-slate-600 px-8 py-5 rounded-[2rem] font-black italic uppercase text-[10px]">Editar Carga</button>
              <button onClick={handleGuardarVenta} disabled={isLoading || !clienteSel} className="bg-[#10b981] text-white px-12 py-5 rounded-[2rem] font-black italic shadow-2xl flex items-center gap-3 uppercase text-[10px]">
                {isLoading ? <Loader2 className="animate-spin" /> : <Save size={18} />} Confirmar y Finalizar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 bg-white rounded-[4rem] p-12 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-10 no-print">
                <h2 className="font-black text-slate-300 text-[10px] tracking-[0.4em] uppercase italic">Manifiesto de Mercancía</h2>
                <button onClick={handlePrint} className="p-4 bg-[#1B2654] text-white rounded-2xl shadow-lg"><Printer size={20}/></button>
              </div>

              <div className="print-grid space-y-6 print:space-y-0">
                {pacasSeleccionadas.map(paca => (
                  <div key={paca.IdCaja} className="paca-card-print border-l-[10px] border-[#1B2654] pl-8 py-4 bg-slate-50/50 rounded-r-3xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black text-3xl italic uppercase text-[#1B2654]">{paca.FolioCaja}</h3>
                      <span className="font-black text-xl italic text-[#A61A18]">{parseFloat(paca.KilosTotales).toFixed(2)} KG</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {parsearProductos(paca.ContenidoDetallado).map((prod, idx) => (
                        <div key={idx} className="flex justify-between text-[10px] font-black text-slate-500 uppercase italic bg-white p-3 rounded-xl border border-slate-100">
                          <span className="truncate pr-2">{prod.nombre}</span>
                          <span className="text-[#1B2654]">{prod.peso} KG</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-16 pt-10 border-t-8 border-double border-slate-100 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volumen Total</p>
                  <span className="text-7xl font-black italic tracking-tighter text-[#1B2654]">{totalKilos} <small className="text-2xl text-[#A61A18]">KG</small></span>
                </div>
                <div className="hidden print:block text-right pb-4">
                   <p className="text-[10px] font-black uppercase mb-16 tracking-widest">Firma Despacho</p>
                   <div className="w-56 border-b-2 border-black"></div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 sticky top-10">
                <div className="no-print mb-8">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Asignar Cliente</label>
                  <select 
                    onChange={(e) => setClienteSel(clientes.find(cli => cli.IdCliente == e.target.value))} 
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black italic text-[#1B2654] focus:border-[#A61A18] outline-none transition-all"
                  >
                    <option value="">Buscar Destino...</option>
                    {clientes.map(c => <option key={c.IdCliente} value={c.IdCliente}>{c.RazonSocial}</option>)}
                  </select>
                </div>

                {clienteSel ? (
                  <div className="bg-[#1B2654] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                    <p className="text-[#A61A18] font-black text-[10px] tracking-widest uppercase mb-4 italic">Confirmado</p>
                    <h4 className="text-3xl font-black uppercase leading-tight mb-4 tracking-tighter italic">{clienteSel.RazonSocial}</h4>
                    <div className="space-y-2 text-xs font-bold text-white/40">
                      <p className="flex justify-between"><span>RFC:</span> <span className="text-white">{clienteSel.RFC || '---'}</span></p>
                      <p className="flex justify-between"><span>FECHA:</span> <span className="text-white">{new Date().toLocaleDateString()}</span></p>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300">
                    <User size={48} className="mb-2 opacity-20"/>
                    <p className="text-[10px] font-black uppercase tracking-widest">Esperando Selección</p>
                  </div>
                )}
                
                <div className="mt-10 pt-8 border-t border-slate-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-[#1B2654] border-2 border-[#1B2654]">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operador</p>
                    <p className="font-black italic text-[#1B2654] uppercase text-sm">{despachador.nombre}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PanelSalidaPacas;