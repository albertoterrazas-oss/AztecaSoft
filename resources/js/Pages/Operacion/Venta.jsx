import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import {
  Package, ChevronRight, X, CheckCircle2,
  User, Truck, Save, Box, Loader2, ArrowLeft,
  Printer, ArchiveX
} from 'lucide-react';
import { Link } from "react-router-dom";

const PanelSalidaPacas = () => {
  // --- ESTADOS ---
  const [clientes, setClientes] = useState([]);
  const [pacasInventario, setPacasInventario] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCajas, setIsLoadingCajas] = useState(false);
  const [despachador, setDespachador] = useState({ nombre: "Usuario", foto: null });

  const [step, setStep] = useState('inicio');
  const [clienteSel, setClienteSel] = useState(null);
  const [pacasSeleccionadas, setPacasSeleccionadas] = useState([]);

  // 1. CARGA INICIAL
  useEffect(() => {
    const perfilData = localStorage.getItem('perfil');
    if (perfilData) {
      const p = JSON.parse(perfilData);
      setDespachador({
        nombre: `${p.Nombres} ${p.ApePat} ${p.ApeMat}`,
        foto: p.PathFotoEmpleado
      });
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

  // 3. LÓGICA DE IMPRESIÓN
  const handlePrint = () => {
    window.print();
  };

  // 4. ENVÍO AL BACKEND
  const handleGuardarVenta = async () => {
    if (!clienteSel) {
      toast.error("Selecciona un cliente para continuar.");
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        IdCliente: clienteSel.IdCliente,
        user: JSON.parse(localStorage.getItem('perfil'))?.IdUsuario || 1,
        cajas: pacasSeleccionadas.map(p => p.IdCaja)
      };

      const response = await axios.post(route("venderCajas"), payload);

      if (response.data.success) {
        toast.success("Venta procesada correctamente.");
        // Pequeño delay para que el usuario vea el éxito antes de imprimir o resetear
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
      <Toaster position="top-center" richColors />

      {/* --- ESTILOS DE IMPRESIÓN (OCULTO EN NAVEGADOR) --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #print-section, #print-section * { visibility: visible; }
          #print-section { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}} />

      {/* --- VISTA 1: INICIO --- */}
      {step === 'inicio' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center min-h-[80vh]">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full text-center shadow-2xl border-b-8 border-slate-900">
            <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-6 border-4 border-blue-500 overflow-hidden shadow-inner">
              <img src={despachador.foto} alt="Perfil" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-tight">
              Hola, <br /> {despachador.nombre}
            </h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase mt-2 mb-10 tracking-[0.3em]">Gestión de Salidas</p>
            <div className="space-y-4">
              <button onClick={fetchCajas} style={{ backgroundColor: '#A61A18' }} className="w-full py-5 text-white rounded-3xl font-black italic transition-all flex justify-between px-8 items-center group">
                <span>NUEVA SALIDA DE PACAS</span>
                {isLoadingCajas ? <Loader2 className="animate-spin" /> : <ChevronRight className="group-hover:translate-x-2 transition-transform" />}
              </button>
              <Link to="/empaque">
                <button style={{ backgroundColor: '#A61A18' }} className="w-full py-5 mt-4 text-white rounded-3xl font-black italic flex justify-between px-8 items-center group">
                  <span>CREAR NUEVAS PACAS</span>
                  <ChevronRight className="group-hover:translate-x-2 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* --- VISTA 2: INVENTARIO --- */}
      {step === 'inventario' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep('inicio')} className="p-4 bg-white rounded-full shadow-sm hover:bg-slate-100 transition-colors">
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Inventario Disponible</h1>
            </div>
            <div className="bg-slate-900 text-white p-6 rounded-[2rem] flex items-center gap-8 shadow-xl">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Carga actual</p>
                <p className="text-xl font-black italic">{pacasSeleccionadas.length} PACAS / {totalKilos} KG</p>
              </div>
              <button disabled={pacasSeleccionadas.length === 0} onClick={() => setStep('venta')} className="bg-blue-600 px-8 py-4 rounded-2xl font-black uppercase italic text-sm hover:bg-blue-500 disabled:bg-slate-700 transition-all">
                Continuar
              </button>
            </div>
          </div>

          {pacasInventario.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-200">
              <ArchiveX size={80} className="text-slate-200 mb-4" />
              <h3 className="text-2xl font-black italic text-slate-400 uppercase">No hay cajas disponibles</h3>
              <p className="text-slate-400 text-sm">El inventario está vacío en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pacasInventario.map(paca => (
                <motion.div
                  key={paca.IdCaja}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => togglePaca(paca)}
                  className={`p-6 rounded-[2.5rem] border-4 cursor-pointer transition-all ${pacasSeleccionadas.some(s => s.IdCaja === paca.IdCaja) ? 'border-blue-600 bg-blue-50/50 shadow-lg' : 'border-white bg-white shadow-sm'}`}
                >
                   {/* ... contenido de la paca (igual al tuyo) ... */}
                   <div className="flex justify-between items-start mb-4">
                    <span className="font-black text-blue-600 italic text-lg uppercase tracking-tighter">{paca.FolioCaja}</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${pacasSeleccionadas.some(s => s.IdCaja === paca.IdCaja) ? 'bg-blue-600 border-blue-600' : 'border-slate-100'}`}>
                      {pacasSeleccionadas.some(s => s.IdCaja === paca.IdCaja) && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                  </div>
                  <div className="space-y-1 mb-4 h-20 overflow-y-auto pr-2 custom-scrollbar text-[10px] font-bold text-slate-500 italic uppercase">
                    {parsearProductos(paca.ContenidoDetallado).map((prod, i) => (
                      <div key={i} className="flex justify-between"><span>• {prod.nombre}</span><span>{prod.peso} KG</span></div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-300 uppercase">Peso Neto</span>
                    <span className="font-black italic text-slate-900">{parseFloat(paca.KilosTotales).toFixed(2)} KG</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* --- VISTA 3: RESUMEN Y DESPACHO --- */}
      {step === 'venta' && (
        <motion.div id="print-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-10 pb-20 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
            <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">Salida de<br />Almacén</h1>
            <div className="flex gap-4">
              <button onClick={() => setStep('inventario')} className="bg-white border-4 border-slate-900 px-8 py-5 rounded-3xl font-black italic uppercase text-sm">Editar Carga</button>
              <button onClick={handleGuardarVenta} disabled={isLoading || !clienteSel} className="bg-green-600 text-white px-12 py-5 rounded-3xl font-black italic shadow-2xl flex items-center gap-3 uppercase">
                {isLoading ? <Loader2 className="animate-spin" /> : <Save />}
                {isLoading ? 'Procesando...' : 'Confirmar y Salir'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 bg-white rounded-[4rem] p-12 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-12">
                <h2 className="font-black text-slate-300 text-[11px] tracking-[0.4em] uppercase italic">Detalle de Mercancía</h2>
                <button onClick={handlePrint} className="no-print p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><Printer size={20}/></button>
              </div>

              {pacasSeleccionadas.map(paca => (
                <div key={paca.IdCaja} className="mb-10 last:mb-0 border-l-[10px] border-slate-900 pl-8">
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="font-black text-3xl italic uppercase text-slate-900">{paca.FolioCaja}</h3>
                    <span className="font-black text-xl italic text-blue-600">{parseFloat(paca.KilosTotales).toFixed(2)} KG</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {parsearProductos(paca.ContenidoDetallado).map((prod, idx) => (
                      <div key={idx} className="flex justify-between text-xs font-bold text-slate-500 uppercase italic bg-slate-50 p-3 rounded-xl">
                        <span>{prod.nombre}</span><span>{prod.peso} KG</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-16 pt-12 border-t-8 border-double border-slate-100 flex justify-between items-center">
                <span className="text-7xl font-black italic tracking-tighter text-slate-900">{totalKilos} <small className="text-2xl text-slate-400">KG</small></span>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-[3.5rem] p-10 shadow-sm border border-slate-100 sticky top-10">
                <select onChange={(e) => setClienteSel(clientes.find(cli => cli.IdCliente == e.target.value))} className="w-full p-6 bg-slate-100 border-none rounded-[2rem] font-black italic mb-8 no-print">
                  <option value="">Buscar Cliente...</option>
                  {clientes.map(c => <option key={c.IdCliente} value={c.IdCliente}>{c.RazonSocial}</option>)}
                </select>

                {clienteSel && (
                  <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
                    <p className="text-blue-500 font-black text-[10px] tracking-widest uppercase mb-4 italic">Destino Confirmado</p>
                    <h4 className="text-3xl font-black uppercase leading-tight mb-4 tracking-tighter">{clienteSel.RazonSocial}</h4>
                    <p className="text-xs font-bold text-slate-400">RFC: {clienteSel.RFC || '---'}</p>
                    <p className="text-xs font-bold text-slate-400">FECHA: {new Date().toLocaleDateString()}</p>
                  </div>
                )}
                
                <div className="mt-10 pt-10 border-t border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Despachado por</p>
                  <p className="font-black italic text-slate-900">{despachador.nombre}</p>
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