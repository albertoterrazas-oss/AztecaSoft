import React, { useEffect, useState, useCallback } from "react";
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import BasculaModal from '../../Components/BasculaPesa.jsx';

import {
  Thermometer,
  ChevronLeft,
  CircleDot,
  Package,
  Trash2,
  Save,
  Scale,
  X,
  Loader2
} from 'lucide-react';

// --- SUB-COMPONENTE: TARJETA DE LOTE ---
const LoteCard = ({ lote, idAlmacen, onSelectProducto }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setLoading(true);
        const res = await axios.post("/api/ProductosLotesHistorial", {
          opcion: 'A',
          Lote: lote.Lote,
          idAlmacen: idAlmacen
        });
        setProductos(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(`Error en productos del lote ${lote.Lote}`, e);
      } finally {
        setLoading(false);
      }
    };
    if (lote.Lote) fetchProductos();
  }, [lote.Lote, idAlmacen]);

  return (
    <div className="mb-12">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-4 w-1 bg-blue-600"></div>
        <h3 className="text-sm font-black italic tracking-widest uppercase text-slate-800">
          Lote: {lote.Lote} <span className="mx-2 text-slate-300">|</span>
          <span className="text-blue-600">Proveedor: {lote.Proveedor || 'N/A'}</span>
        </h3>
      </div>

      <div className="bg-slate-100 rounded-[3rem] p-8 grid grid-cols-2 lg:grid-cols-3 gap-6 shadow-inner border border-slate-200 min-h-[150px] items-center text-black">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-4 text-slate-400">
            <Loader2 className="animate-spin mb-2" size={24} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Sincronizando...</span>
          </div>
        ) : productos.length > 0 ? (
          productos.map((p, idx) => (
            <motion.button
              key={`${p.idProducto}-${idx}`}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => onSelectProducto(p.Producto)}
              className="bg-[#1B2656] text-white p-8 rounded-[2rem] flex flex-col items-center gap-3 shadow-lg group relative overflow-hidden"
            >
              <Package className="text-blue-400 group-hover:scale-110 transition-transform" size={28} />
              <span className="font-black uppercase text-[10px] tracking-widest text-center leading-tight">
                {p.Producto}
              </span>
              <div className="mt-2 px-3 py-1 bg-white/10 rounded-full">
                <span className="text-[9px] font-mono text-blue-300 font-bold">{p.KG} KG EN STOCK</span>
              </div>
            </motion.button>
          ))
        ) : (
          <div className="col-span-full text-center py-6 text-slate-400 font-bold uppercase text-[10px] italic">
            Sin productos registrados
          </div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const SistemaRomaneoSanGabriel = () => {
  const [view, setView] = useState('grid');
  const [almacenes, setAlmacenes] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de Selección y Pesaje
  const [selectedCamara, setSelectedCamara] = useState(null);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [itemsEnPaquete, setItemsEnPaquete] = useState([]);

  // Estados de los Modales de Báscula
  const [showTaraModal, setShowTaraModal] = useState(false);
  const [showGuardarModal, setShowGuardarModal] = useState(false);
  const [tara, setTara] = useState(0);
  const [currentWeight, setCurrentWeight] = useState(0); // Aquí conectarías tu lectura real
  const [idBasculaConfigurada] = useState(1);

  useEffect(() => {
    const fetchAlmacenes = async () => {
      try {
        setLoading(true);
        const resAlmacenes = await axios.get(route("AlmacenesRefrigerados"));
        setAlmacenes(resAlmacenes.data);
      } catch (error) {
        console.error("Error cámaras:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlmacenes();
  }, []);

  const fetchLotes = useCallback(async (camara) => {
    try {
      const idAlmacen = camara.IdAlmacen || camara.id;
      const res = await axios.post(route("LotesRefirgeradores"), { Almacen: idAlmacen });
      setLotes(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error lotes:", e);
    }
  }, []);

  const iniciarApertura = (camara) => {
    setSelectedCamara(camara);
    setView('apertura');
    fetchLotes(camara);
    setTimeout(() => {
      setView('estanteria');
    }, 2500);
  };

  // Acción al seleccionar producto: Abrir flujo de báscula
  const handleSeleccionProducto = (productoNombre) => {
    setSelectedProducto(productoNombre);
    setTara(0);
    setShowTaraModal(true);
  };

  // Registro final después del segundo modal
  const registrarPesaje = (basculaId, pesoBruto) => {
    const pesoNeto = pesoBruto - tara;
    const nuevoItem = {
      id: Date.now(),
      producto: selectedProducto,
      peso: pesoNeto.toFixed(2),
      tara: tara,
      bruto: pesoBruto
    };
    setItemsEnPaquete([nuevoItem, ...itemsEnPaquete]);
    setShowGuardarModal(false);
  };

  return (
    <div className="h-screen bg-white text-slate-100 font-sans overflow-hidden">
      <AnimatePresence mode="wait">

        {/* VISTA 1: GRID DE ALMACENES */}
        {view === 'grid' && (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 w-full h-full overflow-y-auto">
            <header className="mb-12 border-l-8 border-blue-600 pl-6">
              <h1 className="text-4xl font-black italic uppercase text-black tracking-tighter">Panel de Empaque</h1>
              <p className="text-blue-500 font-bold tracking-[0.3em] text-xs uppercase opacity-70">Almacenes refrigerados</p>
            </header>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-blue-600"><Loader2 className="animate-spin mb-4" size={48} /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {almacenes.map((c) => (
                  <motion.div
                    key={c.id}
                    whileHover={{ scale: 1.02, backgroundColor: '#1B2656' }}
                    onClick={() => iniciarApertura(c)}
                    style={{ backgroundColor: '#1B2654' }}
                    className="border-2 border-slate-800 p-10 rounded-[3rem] cursor-pointer text-center group transition-all shadow-2xl relative overflow-hidden"
                  >
                    <Thermometer className="mx-auto mb-4 text-blue-400" size={32} />
                    <h3 className="text-xl font-black italic uppercase tracking-tighter">{c.Nombre}</h3>
                    <p className="text-xs font-black uppercase tracking-tighter text-red-800">{c.Tipo}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* VISTA 2: ANIMACIÓN DE APERTURA */}
        {view === 'apertura' && (
          <motion.div
            key="apertura"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0, filter: 'blur(20px)' }}
            className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-between px-[12%]"
          >
            <div className="z-10 text-left">
              <span className="text-blue-500 font-black tracking-[0.5em] uppercase text-sm mb-4 block animate-pulse">Abriendo el almacen...</span>
              <h2 className="text-7xl font-black italic tracking-tighter uppercase text-white leading-none">
                {selectedCamara?.Nombre}
              </h2>
              <div className="h-2 w-48 bg-red-800 mt-8 rounded-full"></div>
            </div>

            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ delay: 0.2, duration: 1.8, ease: "easeInOut" }}
              className="relative w-80 h-80 rounded-full border-[25px] border-slate-400 bg-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex items-center justify-center"
            >
              <div className="absolute w-6 h-full bg-slate-500 rounded-full"></div>
              <div className="absolute w-full h-6 bg-slate-500 rounded-full"></div>
              <div className="w-20 h-20 rounded-full bg-slate-400 border-8 border-slate-600 flex items-center justify-center shadow-inner">
                <CircleDot size={40} className="text-white opacity-40" />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* VISTA 3: INTERIOR DEL ALMACÉN */}
        {view === 'estanteria' && (
          <motion.div key="estanteria" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full w-full bg-white text-black">
            <div className="flex-[2] p-8 overflow-y-auto border-r border-slate-200 scrollbar-hide pb-20">
              <div className="flex justify-between items-center mb-10">
                <button onClick={() => setView('grid')} className="flex items-center gap-2 font-black uppercase text-xs italic text-slate-400 hover:text-blue-600 transition-colors">
                  <ChevronLeft size={18} /> Panel General
                </button>
                <h2 className="text-3xl font-black italic border-r-4 border-blue-600 pr-6 uppercase tracking-tighter">{selectedCamara?.Nombre}</h2>
              </div>

              {lotes.map((lote, index) => (
                <LoteCard
                  key={`${lote.Lote}-${index}`}
                  lote={lote}
                  idAlmacen={selectedCamara?.IdAlmacen || selectedCamara?.id}
                  onSelectProducto={handleSeleccionProducto}
                />
              ))}
            </div>

            {/* PANEL DERECHO: RESUMEN DE CARGA */}
            <div className="flex-1 bg-slate-50 p-8 flex flex-col border-l border-slate-200">
              <div className="flex items-center gap-3 mb-8 border-b pb-6">
                <Scale className="text-blue-600" size={24} />
                <h3 className="font-black italic uppercase text-sm tracking-widest text-black">Carga Actual</h3>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide">
                {itemsEnPaquete.map((item) => (
                  <div key={item.id} className="p-5 bg-white rounded-3xl border border-slate-200 flex justify-between items-center shadow-sm relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600"></div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{item.producto}</p>
                      <p className="text-3xl font-black text-[#1B2656]">{item.peso} KG</p>
                      <p className="text-[8px] font-bold text-slate-400">TARA: {item.tara} KG</p>
                    </div>
                    <button onClick={() => setItemsEnPaquete(itemsEnPaquete.filter(i => i.id !== item.id))} className="p-3 text-slate-300 hover:text-red-500">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="flex justify-between items-end mb-6">
                  <span className="text-slate-400 font-black uppercase text-[10px]">Total Neto</span>
                  <span className="text-5xl font-black text-blue-600 italic">
                    {itemsEnPaquete.reduce((a, b) => a + parseFloat(b.peso), 0).toFixed(2)}
                  </span>
                </div>
                <button 
                  onClick={() => { alert("Guardando pesajes..."); setView('grid'); setItemsEnPaquete([]); }} 
                  disabled={itemsEnPaquete.length === 0} 
                  className="w-full bg-[#1B2656] text-white py-6 rounded-[2rem] font-black uppercase italic shadow-xl disabled:opacity-20 flex items-center justify-center gap-3"
                >
                  <Save size={24} /> Guardar Todo
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODALES DE BÁSCULA (SISTEMA EXTERNO) --- */}
      <BasculaModal
        isOpen={showTaraModal}
        title="PESAR TARA"
        subtitle="Coloque recipiente vacío"
        currentReading={currentWeight}
        buttonText="GUARDAR TARA"
        colorClass="bg-red-600 border-red-900 hover:bg-red-500"
        onClose={() => setShowTaraModal(false)}
        basculaId={idBasculaConfigurada}
        onConfirm={(b, t) => { 
          setTara(t); 
          setShowTaraModal(false); 
          setShowGuardarModal(true); 
        }}
      />

      <BasculaModal
        isOpen={showGuardarModal}
        title="PESAR PRODUCTO"
        subtitle={selectedProducto}
        currentReading={currentWeight}
        tara={tara}
        buttonText="CONFIRMAR Y GUARDAR"
        colorClass="bg-emerald-600 border-emerald-900 hover:bg-emerald-500"
        destinationName={selectedCamara?.Nombre}
        onClose={() => setShowGuardarModal(false)}
        basculaId={idBasculaConfigurada}
        onConfirm={(b, t) => registrarPesaje(b, t)}
      />

      <style>{` .scrollbar-hide::-webkit-scrollbar { display: none; } body { background: #020617; } `}</style>
    </div>
  );
};

export default SistemaRomaneoSanGabriel;