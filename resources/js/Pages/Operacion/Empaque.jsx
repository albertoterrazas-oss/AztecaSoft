import React, { useEffect, useState, useCallback } from "react";
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
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
  Loader2,
  Pencil,
  Inbox
} from 'lucide-react';

// --- SUB-COMPONENTE: TARJETA DE LOTE ---
const LoteCard = ({ lote, idAlmacen, onSelectProducto, itemsEnPaquete }) => {
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

  const getStockDisponible = (nombreProducto, stockOriginal) => {
    const consumido = itemsEnPaquete
      .filter(item => item.producto === nombreProducto && item.lote === lote.Lote)
      .reduce((acc, item) => acc + parseFloat(item.bruto), 0);
    return Math.max(0, parseFloat(stockOriginal) - consumido).toFixed(3);
  };

  return (
    <div className="mb-12">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-4 w-1 bg-blue-600"></div>
        <h3 className="text-sm font-black italic tracking-widest uppercase text-slate-800">
          Lote: {lote.Lote} <span className="mx-2 text-slate-300">|</span>
          <span className="text-blue-600">Proveedor: {lote.Proveedor || 'N/A'}</span>
        </h3>
      </div>

      <div className="bg-slate-100 rounded-[3rem] p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 shadow-inner border border-slate-200 min-h-[150px] items-center">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-4 text-slate-400">
            <Loader2 className="animate-spin mb-2" size={24} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Sincronizando...</span>
          </div>
        ) : productos.length > 0 ? (
          productos.map((p, idx) => {
            const disponible = getStockDisponible(p.Producto, p.KG);
            const agotado = parseFloat(disponible) <= 0;

            return (
              <motion.button
                key={`${p.idProducto}-${idx}`}
                disabled={agotado}
                whileHover={!agotado ? { y: -5, scale: 1.02 } : {}}
                onClick={() => onSelectProducto(p, disponible, lote)}
                className={`p-8 rounded-[2rem] flex flex-col items-center gap-3 shadow-lg group relative overflow-hidden transition-all ${agotado ? 'bg-slate-300 cursor-not-allowed opacity-60' : 'bg-[#1B2656] text-white hover:bg-[#253475]'
                  }`}
              >
                <Package className={agotado ? "text-slate-400" : "text-blue-400 group-hover:scale-110 transition-transform"} size={28} />
                <span className={`font-black uppercase text-[10px] tracking-widest text-center leading-tight ${agotado ? 'text-slate-500' : 'text-white'}`}>
                  {p.Producto}
                </span>
                <div className={`mt-2 px-3 py-1 rounded-full ${agotado ? 'bg-slate-400/20' : 'bg-white/10'}`}>
                  <span className={`text-[9px] font-mono font-bold ${agotado ? 'text-red-500' : 'text-blue-300'}`}>
                    {agotado ? "SIN STOCK" : `${disponible} KG DISPONIBLES`}
                  </span>
                </div>
              </motion.button>
            );
          })
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
const Empaque = () => {
  const [view, setView] = useState('grid');
  const [almacenes, setAlmacenes] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCamara, setSelectedCamara] = useState(null);
  const [selectedProductoObj, setSelectedProductoObj] = useState(null);
  const [loteActivoObj, setLoteActivoObj] = useState(null);
  const [maxPermitido, setMaxPermitido] = useState(0);
  const [itemsEnPaquete, setItemsEnPaquete] = useState([]);
  const [idAlmacenDestino, setIdAlmacenDestino] = useState("");

  const [showTaraModal, setShowTaraModal] = useState(false);
  const [showGuardarModal, setShowGuardarModal] = useState(false);
  const [taraCapturada, setTaraCapturada] = useState(0);

  const [itemAEditar, setItemAEditar] = useState(null);
  const [editBruto, setEditBruto] = useState("");
  const [editTara, setEditTara] = useState("");

  useEffect(() => {
    const fetchAlmacenes = async () => {
      try {
        setLoading(true);
        // Usar la ruta correcta según tu configuración de Ziggy/Laravel
        const resAlmacenes = await axios.get("/api/AlmacenesRefrigerados");
        setAlmacenes(resAlmacenes.data);
      } catch (error) {
        console.error("Error cámaras:", error);
        toast.error("Error al cargar almacenes");
      } finally {
        setLoading(false);
      }
    };
    fetchAlmacenes();
  }, []);

  const fetchLotes = useCallback(async (camara) => {
    try {
      const idAlmacen = camara.IdAlmacen || camara.id;
      const res = await axios.post("/api/LotesRefirgeradores", { Almacen: idAlmacen });
      setLotes(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error lotes:", e);
    }
  }, []);

  const iniciarApertura = (camara) => {
    setSelectedCamara(camara);
    setView('apertura');
    fetchLotes(camara);
    setTimeout(() => { setView('estanteria'); }, 2200);
  };

  const handleSeleccionProducto = (productoObj, stockDisponible, loteObj) => {
    setSelectedProductoObj(productoObj);
    setMaxPermitido(parseFloat(stockDisponible));
    setLoteActivoObj(loteObj);
    setTaraCapturada(0);
    setShowTaraModal(true);
  };

  const registrarPesajeFinal = (brutoRecibido, taraRecibida) => {
    const b = parseFloat(brutoRecibido) || 0;

    if (b > maxPermitido) {
      toast.error(`Stock insuficiente`, {
        description: `Solo quedan ${maxPermitido} KG y se intentó pesar ${b} KG.`,
      });
      return;
    }

    const t = parseFloat(taraRecibida) || 0;
    const n = b - t;
    if (b <= 0) return;

    const nuevoItem = {
      id: Date.now(),
      idProducto: selectedProductoObj.idProducto,
      producto: selectedProductoObj.Producto,
      idLote: loteActivoObj.idLote || loteActivoObj.Lote, // Ajustar según tu API
      lote: loteActivoObj.Lote,
      idAlmacenOrigen: selectedCamara.IdAlmacen || selectedCamara.id,
      bruto: b.toFixed(3),
      tara: t.toFixed(3),
      peso: n.toFixed(3)
    };

    setItemsEnPaquete(prev => [nuevoItem, ...prev]);
    setShowGuardarModal(false);
    toast.success("Pesaje agregado");
  };

  const iniciarEdicion = (item) => {
    setItemAEditar(item);
    setEditBruto(item.bruto);
    setEditTara(item.tara);
  };

  const guardarEdicion = () => {
    const b = parseFloat(editBruto) || 0;
    const t = parseFloat(editTara) || 0;
    const n = b - t;
    setItemsEnPaquete(prev => prev.map(i => i.id === itemAEditar.id ? { ...i, bruto: b.toFixed(3), tara: t.toFixed(3), peso: n.toFixed(3) } : i));
    setItemAEditar(null);
    toast.success("Pesaje actualizado");
  };

  const finalizarTodo = async () => {
    if (itemsEnPaquete.length === 0) return;
    if (!idAlmacenDestino) {
      toast.warning("Selecciona un almacén de destino");
      return;
    }

    const toastId = toast.loading("Procesando empaque...");
    try {
      const cajasJSON = itemsEnPaquete.map(item => ({
        caja: "1",
        idLote: item.idLote,
        idProducto: item.idProducto,
        idAlmacenOrigen: item.idAlmacenOrigen,
        peso: parseFloat(item.peso),
        piezas: 0
      }));

      await axios.post("/api/armarCajas", {
        idAlmacenDestino: idAlmacenDestino,

        user: JSON.parse(localStorage.getItem('perfil'))?.IdUsuario || 1,

        cajas: cajasJSON
      });

      toast.success("¡Carga guardada con éxito!", { id: toastId });
      setView('grid');
      setItemsEnPaquete([]);
      setIdAlmacenDestino("");
    } catch (e) {
      toast.error("Error al guardar la carga", { id: toastId });
    }
  };

  return (
    <div className="h-[100%] bg-white text-slate-100 font-sans overflow-hidden">
      <AnimatePresence mode="wait">
        {view === 'grid' && (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 w-full h-full overflow-y-auto">
            {/* <header className="mb-12 border-l-8 border-blue-600 pl-6 text-black">
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">Panel de Empaque</h1>
              <p className="text-blue-500 font-bold tracking-[0.3em] text-xs uppercase opacity-70">Almacenes refrigerados</p>
            </header> */}

            <h1 className="text-4xl text-center mb-10 italic font-black text-slate-800 uppercase">
              Panel de Pesaje:
              <span style={{ color: '#A61A18' }}>
                Empaque
              </span>
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-white">
              {almacenes.map((c) => (
                <motion.div key={c.IdAlmacen || c.id} whileHover={{ scale: 1.02, backgroundColor: '#1B2656' }} onClick={() => iniciarApertura(c)} style={{ backgroundColor: '#1B2654' }} className="border-2 border-slate-800 p-10 rounded-[3rem] cursor-pointer text-center group transition-all shadow-2xl relative overflow-hidden">
                  <Thermometer className="mx-auto mb-4 text-blue-400" size={32} />
                  <h3 className="text-xl font-black italic uppercase tracking-tighter">{c.Nombre}</h3>
                  <p style={{ color: '#A61A18' }}>REFRIGERADO</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {view === 'apertura' && (
          <motion.div key="apertura" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ scale: 1.5, opacity: 0, filter: 'blur(20px)' }} className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-between px-[12%]">
            <div className="z-10 text-left">
              <span className="text-blue-500 font-black uppercase text-sm mb-4 block animate-pulse">Abriendo el congelador...</span>
              <h2 className="text-7xl font-black italic uppercase text-white leading-none">{selectedCamara?.Nombre}</h2>
              <div className="h-2 w-48 bg-red-800 mt-8 rounded-full"></div>
            </div>
            <motion.div initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ duration: 1.8, ease: "easeInOut" }} className="relative w-80 h-80 rounded-full border-[25px] border-slate-400 bg-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex items-center justify-center">
              <div className="absolute w-6 h-full bg-slate-500 rounded-full"></div>
              <div className="absolute w-full h-6 bg-slate-500 rounded-full"></div>
              <div className="w-20 h-20 rounded-full bg-slate-400 border-8 border-slate-600 flex items-center justify-center">
                <CircleDot size={40} className="text-white opacity-40" />
              </div>
            </motion.div>
          </motion.div>
        )}

        {view === 'estanteria' && (
          <motion.div key="estanteria" className="flex h-full w-full bg-white text-black">
            <div className={`p-8 overflow-y-auto scrollbar-hide flex flex-col transition-all duration-500 ${lotes.length > 0 ? 'flex-[2] border-r border-slate-200' : 'w-full'}`}>
              <button onClick={() => setView('grid')} className="flex items-center gap-2 font-black uppercase text-xs italic text-slate-400 hover:text-blue-600 mb-10 transition-colors w-fit">
                <ChevronLeft size={18} /> Panel General
              </button>

              {lotes.length > 0 ? (
                lotes.map((lote, index) => (
                  <LoteCard
                    key={index}
                    lote={lote}
                    idAlmacen={selectedCamara?.IdAlmacen || selectedCamara?.id}
                    onSelectProducto={handleSeleccionProducto}
                    itemsEnPaquete={itemsEnPaquete}
                  />
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="bg-slate-50 p-20 rounded-[5rem] border-4 border-dashed border-slate-100 flex flex-col items-center">
                    <Inbox className="text-slate-200 mb-6" size={120} />
                    <p className="text-4xl font-black italic uppercase text-slate-300 tracking-tighter text-center">No tiene lotes</p>
                    <button onClick={() => setView('grid')} className="mt-8 px-8 py-4 bg-[#1B2656] text-white rounded-full font-bold uppercase italic hover:scale-105 transition-transform">
                      Volver al Panel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {lotes.length > 0 && (
              <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 bg-slate-50 p-8 flex flex-col border-l border-slate-200">
                <div className="flex items-center gap-3 mb-8 border-b pb-6">
                  <Scale className="text-blue-600" size={24} />
                  <h3 className="font-black italic uppercase text-sm tracking-widest">Lote de cajas</h3>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {itemsEnPaquete.map((item) => (
                    <div key={item.id} className="p-5 bg-white rounded-3xl border border-slate-200 flex justify-between items-center shadow-sm relative group">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600"></div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">{item.producto} (Lote: {item.lote})</p>
                        <p className="text-3xl font-black text-[#1B2656]">{item.peso} KG</p>
                        <p className="text-[8px] font-bold text-slate-400">B: {item.bruto} | T: {item.tara}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => iniciarEdicion(item)} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"><Pencil size={18} /></button>
                        <button onClick={() => {
                          setItemsEnPaquete(itemsEnPaquete.filter(i => i.id !== item.id));
                          toast.info("Removido de la carga");
                        }} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="flex justify-between items-end mb-6">
                    <span className="text-slate-400 font-black uppercase text-[10px]">Total Neto en KG</span>
                    <span className="text-5xl font-black text-blue-600 italic">
                      {itemsEnPaquete.reduce((a, b) => a + parseFloat(b.peso), 0).toFixed(3)} KG
                    </span>
                  </div>

                  <select
                    className="w-full rounded-2xl bg-white p-4 font-bold border-2 border-slate-200 focus:border-blue-600 outline-none mb-4 text-sm"
                    value={idAlmacenDestino}
                    onChange={(e) => setIdAlmacenDestino(e.target.value)}
                    required
                  >
                    <option value="">--- Selecciona el destino ---</option>
                    {almacenes.map(p => (
                      <option key={p.IdAlmacen || p.id} value={p.IdAlmacen || p.id}>{p.Nombre}</option>
                    ))}
                  </select>

                  <button
                    onClick={finalizarTodo}
                    disabled={itemsEnPaquete.length === 0}
                    className={`w-full py-6 rounded-[2rem] font-black uppercase italic shadow-xl transition-all flex items-center justify-center gap-2
                      ${itemsEnPaquete.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed scale-95' : 'bg-[#1B2656] text-white hover:bg-[#253475] active:scale-95'}`}
                  >
                    {itemsEnPaquete.length === 0 ? "Sin pesajes" : <><Save size={24} /> Guardar Todo</>}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALES DE BÁSCULA */}
      <BasculaModal
        isOpen={showTaraModal}
        title="CAPTURAR TARA"
        buttonText="GUARDAR TARA"
        colorClass="bg-red-600"
        onClose={() => setShowTaraModal(false)}
        onConfirm={(p) => { setTaraCapturada(p); setShowTaraModal(false); setShowGuardarModal(true); }}
      />

      <BasculaModal
        isOpen={showGuardarModal}
        title="PESAR PRODUCTO"
        subtitle={`${selectedProductoObj?.Producto} (Máx: ${maxPermitido} KG)`}
        tara={taraCapturada}
        destinationName={selectedCamara?.Nombre}
        buttonText="CONFIRMAR PESO FINAL"
        colorClass="bg-emerald-600"
        onClose={() => setShowGuardarModal(false)}
        onConfirm={(p, t) => registrarPesajeFinal(p, t)}
      />

      {/* MODAL DE EDICIÓN */}
      <AnimatePresence>
        {itemAEditar && (
          <div className="fixed inset-0 bg-slate-900/60 z-[500] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[2.5rem] p-10 shadow-2xl w-full max-w-md text-black relative">
              <button onClick={() => setItemAEditar(null)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500"><X size={24} /></button>
              <p className="text-[10px] font-bold text-blue-600 uppercase mb-1 tracking-widest">Editando Pesaje</p>
              <h3 className="text-3xl font-black italic uppercase mb-8">{itemAEditar.producto}</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Peso Bruto (KG)</label>
                  <input type="number" step="0.001" value={editBruto} onChange={(e) => setEditBruto(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-6 text-4xl font-black text-slate-800 focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Tara (KG)</label>
                  <input type="number" step="0.001" value={editTara} onChange={(e) => setEditTara(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-6 text-4xl font-black text-slate-800 focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>
              <div className="flex gap-4 mt-10">
                <button onClick={() => setItemAEditar(null)} className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-2xl font-bold uppercase hover:bg-slate-200">Cancelar</button>
                <button onClick={guardarEdicion} className="flex-[1.5] bg-blue-600 text-white py-5 rounded-2xl font-bold uppercase shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-all">
                  <Save size={20} /> Guardar Cambios
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{` .scrollbar-hide::-webkit-scrollbar { display: none; } `}</style>
    </div>
  );
};

export default Empaque;