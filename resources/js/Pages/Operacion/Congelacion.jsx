// import { useEffect, useState, useCallback, useRef } from "react";
// import { Toaster, toast } from "sonner";
// import LoadingDiv from "@/Components/LoadingDiv";
// import axios from "axios";
// import BasculaModal from '../../Components/BasculaPesa.jsx';
// import { Snowflake, ChevronRight } from 'lucide-react'; 

// const route = (name) => {
//     const routeMap = {
//         "LotesCongelacion": "/api/LotesCongelacion",
//         "pesaje.store": "/api/pesaje/guardar-lote",
//         "AlmacenesRefrigerados": "/api/AlmacenesRefrigerados",
//         "ProductosLotesHistorial": "/api/ProductosLotesHistorial",
//         "ProductosLotes": "/api/ProductosLotes",
//         "MovimientoPrimerPesaje": "/api/MovimientoPrimerPesaje",
//         "pesaje.guardar-traspaso": "/api/pesaje/guardar-traspaso",
//         "LotesRefirgeradores": "/api/LotesRefirgeradores",
//     };
//     return routeMap[name] || `/${name}`;
// };

// // --- MODAL DE ÉXITO ---
// const SuccessModal = ({ isOpen, onClose, message, registeredWeight }) => {
//     if (!isOpen) return null;
//     return (
//         <div className="fixed inset-0 z-[500] flex items-center justify-center bg-emerald-950/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
//             <div className="bg-white w-full max-w-md rounded-[3rem] p-10 text-center shadow-[0_0_100px_rgba(16,185,129,0.4)] animate-in zoom-in duration-300 border-t-8 border-emerald-500">
//                 <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
//                     </svg>
//                 </div>
//                 <h2 className="text-2xl font-black text-slate-400 uppercase tracking-widest">¡Guardado!</h2>
//                 <div className="my-6 bg-slate-900 rounded-3xl p-6 border-4 border-slate-200">
//                     <div className="text-5xl font-mono text-emerald-400 font-black">{registeredWeight} <span className="text-xl">KG</span></div>
//                     <div className="text-[10px] text-emerald-700 font-black mt-2 tracking-[0.3em] uppercase">Peso Neto Final</div>
//                 </div>
//                 <p className="text-slate-500 font-bold mb-8 uppercase text-xs leading-tight">{message}</p>
//                 <button onClick={onClose} className="w-full py-5 rounded-2xl bg-emerald-600 text-white text-xl font-black hover:bg-emerald-500 transition-all border-b-8 border-emerald-900 active:translate-y-1 active:border-b-0 uppercase">Continuar</button>
//             </div>
//         </div>
//     );
// };

// export default function WeighingDashboard() {
//     const [lotes, setLotes] = useState([]);
//     const [selectedLote, setSelectedLote] = useState(null);
//     const [dbProducts, setDbProducts] = useState([]);
//     const [almacenes, setAlmacenes] = useState([]);
//     const [movimientos, setMovimientos] = useState([]);

//     const [isLoading, setIsLoading] = useState(true);
//     const [isProcessing, setIsProcessing] = useState(false);

//     // --- SEPARACIÓN DE ÁREAS (TRUCHA AQUÍ) ---
//     const [selectedAreaFiltro, setSelectedAreaFiltro] = useState(null); // EL DE ARRIBA
//     const [selectedAreaDestino, setSelectedAreaDestino] = useState(null); // EL DE LA DERECHA

//     const [selectedProduct, setSelectedProduct] = useState(null);
//     const [currentWeight, setCurrentWeight] = useState("0.00");
//     const [tara, setTara] = useState("0.00");
//     const [piezas, setPiezas] = useState(0);

//     const [showTaraModal, setShowTaraModal] = useState(false);
//     const [showGuardarModal, setShowGuardarModal] = useState(false);
//     const [showSuccessModal, setShowSuccessModal] = useState(false);
//     const [lastRegisteredWeight, setLastRegisteredWeight] = useState("0.00");

//     const hasFetchedInitialData = useRef(false);

//     const pesoBruto = parseFloat(currentWeight || 0);
//     const pesoTara = parseFloat(tara || 0);
//     const netWeight = Math.max(0, (pesoBruto - pesoTara)).toFixed(2);
//     const totalKilosLote = movimientos.reduce((acc, h) => acc + parseFloat(h.Peso || 0), 0).toFixed(2);

//     const isReadyToOpenGuardar = !isProcessing && selectedProduct && parseFloat(tara) > 0 && selectedAreaDestino && piezas > 0;

//     // --- CARGAS ---
//     const fetchLotes = useCallback(async () => {
//         try {
//             const res = await axios.get(route("LotesCongelacion"));
//             setLotes(Array.isArray(res.data) ? res.data : []);
//         } catch (e) { console.error("Error lotes", e); }
//     }, []);

//     const fetchLotesRefirgeradores = useCallback(async (id) => {
//         try {
//             setIsLoading(true);
//             const res = await axios.post(route("LotesRefirgeradores"), { Almacen: id });
//             setLotes(Array.isArray(res.data) ? res.data : []);
//         } catch (e) { console.error("Error lotes refrigeradores", e); }
//         finally { setIsLoading(false); }
//     }, []);

//     const getMovimientos = useCallback(async () => {
//         try {
//             const res = await axios.get(route("MovimientoPrimerPesaje"));
//             setMovimientos(Array.isArray(res.data) ? res.data : []);
//         } catch (e) { console.error("Error movs", e); }
//     }, []);

//     const fetchProductosLote = async (idLote) => {
//         try {
//             // USAMOS EL FILTRO DE ARRIBA PARA CARGAR PRODUCTOS ESPECÍFICOS DE ESE ALMACÉN
//             const idConsulta = selectedAreaFiltro ? selectedAreaFiltro : 5;
//             const res = await axios.post("/api/ProductosLotesHistorial", { 
//                 opcion: 'A', 
//                 Lote: idLote, 
//                 idAlmacen: idConsulta 
//             });
//             const data = Array.isArray(res.data) ? res.data : [];
//             setDbProducts(data.map(p => ({
//                 IdProducto: String(p.idProducto),
//                 Nombre: p.Producto,
//                 PiezasTeoricas: parseInt(p.Piezas) || 0,
//             })));
//             return data;
//         } catch (e) {
//             toast.error("Error al cargar productos");
//             return [];
//         }
//     };

//     useEffect(() => {
//         if (hasFetchedInitialData.current) return;
//         const init = async () => {
//             setIsLoading(true);
//             try {
//                 const resAlmacenes = await axios.get(route("AlmacenesRefrigerados"));
//                 setAlmacenes(resAlmacenes.data);
//                 await getMovimientos();
//                 hasFetchedInitialData.current = true;
//             } finally { setIsLoading(false); }
//         };
//         init();
//     }, [getMovimientos]);

//     // FILTRO AUTOMÁTICO DE LOTES (POR EL DE ARRIBA)
//     useEffect(() => {
//         if (selectedAreaFiltro) {
//             fetchLotesRefirgeradores(selectedAreaFiltro);
//         } else {
//             fetchLotes();
//         }
//     }, [selectedAreaFiltro, fetchLotes, fetchLotesRefirgeradores]);

//     const handleSelectLote = (lote) => {
//         setSelectedLote(lote);
//         setTara("0.00");
//         setCurrentWeight("0.00");
//         setSelectedProduct(null);
//         fetchProductosLote(lote.Lote);
//         setTimeout(() => setShowTaraModal(true), 400);
//     };

//     const registrarPesaje = async (brutoConfirmado, taraConfirmada) => {
//         setIsProcessing(true);
//         const pesoNetoFinal = (parseFloat(brutoConfirmado) - parseFloat(taraConfirmada)).toFixed(2);
//         try {
//             const user = JSON.parse(localStorage.getItem('perfil'))?.IdUsuario || 1;
//             const payload = {
//                 id_lote: selectedLote.Lote,
//                 id_producto: selectedProduct.IdProducto,
//                 cantidad: pesoNetoFinal,
//                 piezas: piezas,
//                 // ENTRADA: El que seleccionaste arriba o 5
//                 id_area_entrada: selectedAreaFiltro ? selectedAreaFiltro : 5, 
//                 // SALIDA: El que seleccionaste a la derecha
//                 id_area_salida: selectedAreaDestino,
//                 idusuario: user
//             };

//             const res = await axios.post(route("pesaje.guardar-traspaso"), payload);
//             setLastRegisteredWeight(pesoNetoFinal);
//             setShowSuccessModal(true);
//             getMovimientos();

//             const productosRestantes = await fetchProductosLote(selectedLote.Lote);
//             if (productosRestantes.length === 0 || res.data.lote_cerrado) {
//                 toast.success("¡Lote finalizado!");
//                 setSelectedLote(null);
//                 if(selectedAreaFiltro) fetchLotesRefirgeradores(selectedAreaFiltro);
//             } else {
//                 setSelectedProduct(null);
//                 setPiezas(0);
//                 setCurrentWeight("0.00");
//             }
//         } catch (e) { toast.error("Error al guardar"); }
//         finally { setIsProcessing(false); setShowGuardarModal(false); }
//     };

//     if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-100"><LoadingDiv /></div>;

//     // --- VISTA SELECCIÓN ---
//     if (!selectedLote) {
//         return (
//             <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 flex flex-col items-center font-sans tracking-tight text-slate-900 font-black uppercase">
//                 <div className="max-w-5xl w-full space-y-8">
//                     <header className="flex flex-col items-center mb-4">
//                         <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-2 shadow-lg shadow-blue-200">Sistema de Control</div>
//                         <h1 className="text-5xl font-black italic tracking-tighter text-slate-800 uppercase leading-none">Panel de <span className="text-blue-600">Congelación</span></h1>
//                         <div className="h-1.5 w-24 bg-red-600 mt-4 rounded-full"></div>
//                     </header>

//                     {/* SELECTOR FILTRO (ARRIBA) */}
//                     <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex gap-2 overflow-x-auto no-scrollbar">
//                         {almacenes.map((a) => {
//                             const id = a.id || a.IdAlmacen;
//                             const isActive = selectedAreaFiltro === id;
//                             return (
//                                 <button key={id} onClick={() => setSelectedAreaFiltro(isActive ? null : id)}
//                                     className={`flex-1 min-w-[120px] py-4 px-3 rounded-xl transition-all duration-500 flex flex-col items-center gap-2 group relative overflow-hidden ${isActive ? 'bg-slate-900 text-white shadow-2xl scale-[1.05] z-10' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100 shadow-sm'}`}>
//                                     <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-blue-500' : 'bg-slate-100'}`}><Snowflake size={18} className={isActive ? 'text-white' : 'text-slate-400'} /></div>
//                                     <span className="text-[10px] font-black uppercase tracking-widest">{a.Nombre?.substring(0, 15)}</span>
//                                 </button>
//                             );
//                         })}
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         {lotes.length > 0 ? (
//                             lotes.map((lote) => (
//                                 <button key={lote.Lote} onClick={() => handleSelectLote(lote)}
//                                     className="relative bg-white p-1 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-500 transition-all duration-300 group overflow-hidden">
//                                     <div className="p-6 flex items-center justify-between">
//                                         <div className="text-left space-y-1">
//                                             <div className="flex items-center gap-2"><span className="bg-red-50 text-red-600 px-3 py-0.5 rounded-full text-[10px] font-black border border-red-100">LOTE #{lote.Lote}</span></div>
//                                             <h3 className="text-3xl font-black text-slate-800 leading-tight uppercase italic tracking-tighter">{lote.Proveedor}</h3>
//                                         </div>
//                                         <div className="bg-slate-50 group-hover:bg-blue-600 group-hover:text-white p-4 rounded-2xl transition-all duration-500 transform group-hover:translate-x-1"><ChevronRight size={28} strokeWidth={3} /></div>
//                                     </div>
//                                 </button>
//                             ))
//                         ) : (
//                             <div className="col-span-full bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-4">
//                                 <span className="text-8xl">🧊</span>
//                                 <h2 className="text-2xl font-black text-slate-800 uppercase italic">{selectedAreaFiltro ? "Sin lotes en esta área" : "Elija un almacén"}</h2>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     // --- VISTA PESAJE ---
//     return (
//         <div className="flex flex-col lg:flex-row h-screen bg-slate-200 p-4 gap-4 overflow-hidden font-black uppercase">
//             <Toaster position="top-center" richColors />

//             <BasculaModal isOpen={showTaraModal} title="PESAR TARA" currentReading={currentWeight} buttonText="GUARDAR TARA" colorClass="bg-red-600 border-red-900 hover:bg-red-500" disabledConfirm={parseFloat(currentWeight) <= 0} showSimulate={true} onSimulate={() => setCurrentWeight((Math.random() * (1.5 - 0.2) + 0.2).toFixed(2))} onClose={() => { setShowTaraModal(false); setCurrentWeight("0.00"); }} onConfirm={(brutoEditado) => { setTara(brutoEditado); setCurrentWeight("0.00"); setShowTaraModal(false); }} />

//             <BasculaModal isOpen={showGuardarModal} title="PESAR PRODUCTO" subtitle={selectedProduct?.Nombre} currentReading={currentWeight} tara={tara} buttonText="CONFIRMAR Y GUARDAR" colorClass="bg-emerald-600 border-emerald-900 hover:bg-emerald-500" disabledConfirm={parseFloat(currentWeight) - parseFloat(tara) <= 0} showSimulate={true} onSimulate={() => setCurrentWeight((Math.random() * (40 - 5) + 5).toFixed(2))} destinationName={almacenes.find(a => (a.id || a.IdAlmacen) === selectedAreaDestino)?.Nombre} onClose={() => { setShowGuardarModal(false); setCurrentWeight("0.00"); }} onConfirm={(brutoFinal, taraFinal) => registrarPesaje(brutoFinal, taraFinal)} />

//             <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} registeredWeight={lastRegisteredWeight} message={`Registro guardado para ${selectedProduct?.Nombre}`} />

//             <div className="flex-1 flex flex-col min-h-0 gap-4">
//                 <header className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-md border border-slate-300">
//                     <div>
//                         <button onClick={() => setSelectedLote(null)} className="text-[10px] text-slate-400 hover:text-red-600 mb-1 block">← VOLVER</button>
//                         <h1 className="text-2xl text-slate-800">{selectedLote.Proveedor}</h1>
//                         <p className="text-[10px] text-red-600 tracking-widest">LOTE: {selectedLote.Lote} | ORIGEN: {almacenes.find(a => (a.id || a.IdAlmacen) === selectedAreaFiltro)?.Nombre || 'GENERAL'}</p>
//                     </div>
//                     <div className="text-right">
//                         <p className="text-[9px] text-slate-400 uppercase">Acumulado Sesión</p>
//                         <p className="text-3xl text-slate-800 font-mono">{totalKilosLote} KG</p>
//                     </div>
//                 </header>

//                 <div className="flex-1 overflow-y-auto custom-scroll pr-2">
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                         {dbProducts.map((p) => (
//                             <button key={p.IdProducto} onClick={() => { setSelectedProduct(p); setPiezas(p.PiezasTeoricas); }} className={`p-4 rounded-[2rem] text-left border-b-[10px] h-36 flex flex-col justify-between transition-all shadow-md active:translate-y-2 active:border-b-0 ${selectedProduct?.IdProducto === p.IdProducto ? "border-red-600 bg-white scale-[0.98]" : "border-slate-300 bg-white"}`}><span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-lg w-fit">{p.PiezasTeoricas} PZS</span><span className="text-[12px] leading-tight text-slate-800 line-clamp-2">{p.Nombre}</span></button>
//                         ))}
//                     </div>
//                 </div>

//                 <div className="h-1/3 bg-white rounded-[2.5rem] shadow-inner border border-slate-200 overflow-hidden">
//                     <table className="w-full text-left">
//                         <thead className="bg-slate-50 border-b text-[9px] text-slate-400 sticky top-0"><tr><th className="p-4">PRODUCTO</th><th className="p-4 text-center">PZS</th><th className="p-4 text-right">PESO NETO</th></tr></thead>
//                         <tbody className="divide-y divide-slate-100 overflow-y-auto">{movimientos.map((reg, i) => (<tr key={i} className="text-[11px] font-bold text-slate-700"><td className="p-4 truncate">{reg.Nombre}</td><td className="p-4 text-center">{reg.Piezas}</td><td className="p-4 text-right font-black">{parseFloat(reg.Peso || 0).toFixed(2)} KG</td></tr>))}</tbody>
//                     </table>
//                 </div>
//             </div>

//             <aside className="w-full md:w-1/3 lg:w-[350px] flex flex-col gap-3">
//                 <div className="bg-slate-900 rounded-[2rem] p-4 shadow-xl border-4 border-slate-800">
//                     <div className="bg-[#0f1713] rounded-[1.5rem] p-4 border-4 border-black text-center"><div className="text-5xl font-mono text-green-400">{netWeight}</div><span className="text-green-900 text-[8px] mt-1 block tracking-widest font-black uppercase">Neto (KG)</span></div>
//                     <div className="grid grid-cols-2 gap-2 mt-3">
//                         <div className="bg-slate-800 py-2 rounded-xl text-center"><div className="text-base font-mono text-blue-400">{pesoBruto.toFixed(2)}</div><span className="text-slate-500 text-[7px] font-bold">BRUTO</span></div>
//                         <div className="bg-slate-800 py-2 rounded-xl text-center"><div className="text-base font-mono text-red-400">-{pesoTara.toFixed(2)}</div><span className="text-slate-500 text-[7px] font-bold">TARA</span></div>
//                     </div>
//                 </div>

//                 <div className="bg-white p-4 rounded-[2rem] border-4 border-slate-200 flex flex-col gap-3">
//                     <button onClick={() => { setCurrentWeight("0.00"); setShowTaraModal(true); }} className="bg-slate-800 text-white py-3 rounded-xl text-[10px] border-b-4 border-black font-black active:translate-y-1 active:border-b-0">CAMBIAR TARA</button>

//                     <div className="w-full px-2">
//                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block text-center">Piezas</label>
//                         <div className="flex gap-2 h-16">
//                             <button onClick={() => setPiezas(Math.max(0, Number(piezas || 0) - 1))} className="flex-1 rounded-2xl bg-slate-100 border-b-4 border-slate-300 font-black text-2xl">-</button>
//                             <input type="number" value={piezas} onChange={e => setPiezas(e.target.value)} className="w-[35%] bg-slate-50 border-b-4 border-slate-200 rounded-2xl text-center text-3xl font-black outline-none" />
//                             <button onClick={() => setPiezas(Number(piezas || 0) + 1)} className="flex-1 rounded-2xl bg-slate-100 border-b-4 border-slate-300 font-black text-2xl">+</button>
//                         </div>
//                     </div>

//                     {/* SELECTOR SALIDA (DERECHA) */}
//                     <div>
//                         <label className={`text-[10px] block mb-2 text-center tracking-widest font-black uppercase ${!selectedAreaDestino ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
//                             {!selectedAreaDestino ? "⚠️ Elija Destino" : "Almacen de Salida"}
//                         </label>
//                         <div className="flex gap-1">
//                             {almacenes.map(a => (
//                                 <button key={a.id || a.IdAlmacen} onClick={() => setSelectedAreaDestino(a.id || a.IdAlmacen)} className={`flex-1 py-3 rounded-xl text-[9px] transition-all border-b-4 font-black flex flex-col items-center justify-center gap-1 ${selectedAreaDestino === (a.id || a.IdAlmacen) ? 'bg-yellow-400 border-yellow-600 text-yellow-900' : 'bg-slate-100 border-slate-300 text-slate-400'}`}>
//                                     <Snowflake size={14} strokeWidth={3} />
//                                     <span>{a.Nombre?.substring(0, 10)}</span>
//                                 </button>
//                             ))}
//                         </div>
//                     </div>

//                     <button onClick={() => { setCurrentWeight("0.00"); setShowGuardarModal(true); }} disabled={!isReadyToOpenGuardar} className={`w-full py-5 rounded-[1.5rem] text-lg border-b-[8px] transition-all font-black ${!isReadyToOpenGuardar ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed" : "bg-emerald-600 text-white border-emerald-900 hover:bg-emerald-500 active:translate-y-1 active:border-b-0"}`}>
//                         {!selectedProduct ? "ELIJA PRODUCTO" : piezas <= 0 ? "INDIQUE PIEZAS" : !selectedAreaDestino ? "ELIJA DESTINO" : "Pesar y Guardar"}
//                     </button>
//                 </div>
//             </aside>
//         </div>
//     );
// }


import { useEffect, useState, useCallback, useRef } from "react";
import { Toaster, toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";
import BasculaModal from '../../Components/BasculaPesa.jsx';
import { Snowflake, ChevronRight, LayoutGrid } from 'lucide-react';
import HeaderPanel from '../../Components/HeaderPanel.jsx';
// import { LayoutGrid, Snowflake } from 'lucide-react';
const route = (name) => {
    const routeMap = {
        "LotesCongelacion": "/api/LotesCongelacion",
        "pesaje.store": "/api/pesaje/guardar-lote",
        "AlmacenesRefrigerados": "/api/AlmacenesRefrigerados",
        "AlmacenesListar": "/api/almacenes",
        "ProductosLotesHistorial": "/api/ProductosLotesHistorial",
        "ProductosLotes": "/api/ProductosLotes",
        "MovimientoPrimerPesaje": "/api/MovimientoPrimerPesaje",
        "pesaje.guardar-traspaso": "/api/pesaje/guardar-traspaso",
        "LotesRefirgeradores": "/api/LotesRefirgeradores",
    };
    return routeMap[name] || `/${name}`;
};

// --- MODAL DE ÉXITO ---
const SuccessModal = ({ isOpen, onClose, message, registeredWeight }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-emerald-950/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-10 text-center shadow-[0_0_100px_rgba(16,185,129,0.4)] animate-in zoom-in duration-300 border-t-8 border-emerald-500">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-black text-slate-400 uppercase tracking-widest">¡Guardado!</h2>
                <div className="my-6 bg-slate-900 rounded-3xl p-6 border-4 border-slate-200">
                    <div className="text-5xl font-mono text-emerald-400 font-black">{registeredWeight} <span className="text-xl">KG</span></div>
                    <div className="text-[10px] text-emerald-700 font-black mt-2 tracking-[0.3em] uppercase">Peso Neto Final</div>
                </div>
                <p className="text-slate-500 font-bold mb-8 uppercase text-xs leading-tight">{message}</p>
                <button onClick={onClose} className="w-full py-5 rounded-2xl bg-emerald-600 text-white text-xl font-black hover:bg-emerald-500 transition-all border-b-8 border-emerald-900 active:translate-y-1 active:border-b-0 uppercase">Continuar</button>
            </div>
        </div>
    );
};

export default function WeighingDashboard() {
    const [lotes, setLotes] = useState([]);
    const [selectedLote, setSelectedLote] = useState(null);
    const [dbProducts, setDbProducts] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [movimientos, setMovimientos] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const [selectedAreaFiltro, setSelectedAreaFiltro] = useState(null);
    const [selectedAreaDestino, setSelectedAreaDestino] = useState(null);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [currentWeight, setCurrentWeight] = useState("0.00");
    const [tara, setTara] = useState("0.00");

    // --- CAMBIO: Ahora manejamos el peso manual como string decimal ---
    const [pesoManual, setPesoManual] = useState("0.00");

    const [showTaraModal, setShowTaraModal] = useState(false);
    const [showGuardarModal, setShowGuardarModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastRegisteredWeight, setLastRegisteredWeight] = useState("0.00");

    const hasFetchedInitialData = useRef(false);

    const pesoBruto = parseFloat(currentWeight || 0);
    const pesoTara = parseFloat(tara || 0);
    const netWeight = Math.max(0, (pesoBruto - pesoTara)).toFixed(2);
    const totalKilosLote = movimientos.reduce((acc, h) => acc + parseFloat(h.Peso || 0), 0).toFixed(2);
    const [idBasculaConfigurada, setIdBasculaConfigurada] = useState("");

    // --- CAMBIO: Validación con parseFloat para el peso manual ---
    const isReadyToOpenGuardar = !isProcessing && selectedProduct && parseFloat(tara) > 0 && selectedAreaDestino;

    const fetchLotes = useCallback(async () => {
        try {
            const res = await axios.get(route("LotesCongelacion"));
            setLotes(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error("Error lotes", e); }
    }, []);

    const fetchLotesRefirgeradores = useCallback(async (id) => {
        try {
            setIsLoading(true);
            const res = await axios.post(route("LotesRefirgeradores"), { Almacen: id });
            setLotes(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error("Error lotes refrigeradores", e); }
        finally { setIsLoading(false); }
    }, []);

    const getMovimientos = useCallback(async () => {
        try {
            const res = await axios.get(route("MovimientoPrimerPesaje"));
            setMovimientos(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error("Error movs", e); }
    }, []);

    const fetchProductosLote = async (idLote) => {
        try {
            const idConsulta = selectedAreaFiltro ? selectedAreaFiltro : 5;
            const res = await axios.post("/api/ProductosLotesHistorial", {
                opcion: 'A',
                Lote: idLote,
                idAlmacen: idConsulta
            });
            const data = Array.isArray(res.data) ? res.data : [];
            setDbProducts(data.map(p => ({
                IdProducto: String(p.IdProducto),

                Nombre: p.Producto,
                KG: parseFloat(p.KG || 0),
                PesoTeorico: parseFloat(p.Piezas || 0).toFixed(2), // Renombrado para claridad
            })));
            return data;
        } catch (e) {
            toast.error("Error al cargar productos");
            return [];
        }
    };

    useEffect(() => {
        if (hasFetchedInitialData.current) return;
        const init = async () => {
            setIsLoading(true);
            try {
                const resAlmacenes = await axios.get(route("AlmacenesRefrigerados"));
                const res = await axios.get(route("AlmacenesListar"));

                // axios.get(route(""))


                const limp = res.data.find(a => a.Nombre?.toUpperCase() === "CONGELACION");
                if (limp?.bascula?.puerto) setIdBasculaConfigurada(limp.bascula.puerto);
                setAlmacenes(resAlmacenes.data);
                await getMovimientos();
                hasFetchedInitialData.current = true;
            } finally { setIsLoading(false); }
        };
        init();
    }, [getMovimientos]);

    useEffect(() => {
        if (selectedAreaFiltro) {
            fetchLotesRefirgeradores(selectedAreaFiltro);
        } else {
            fetchLotes();
        }
    }, [selectedAreaFiltro, fetchLotes, fetchLotesRefirgeradores]);

    const handleSelectLote = (lote) => {
        setSelectedLote(lote);
        setTara("0.00");
        setCurrentWeight("0.00");
        setSelectedProduct(null);
        fetchProductosLote(lote.Lote);
        setTimeout(() => setShowTaraModal(true), 400);
    };

    const registrarPesaje = async (brutoConfirmado, taraConfirmada) => {
        setIsProcessing(true);
        const pesoNetoFinal = (parseFloat(brutoConfirmado) - parseFloat(taraConfirmada)).toFixed(2);
        try {
            const user = JSON.parse(localStorage.getItem('perfil'))?.IdUsuario || 1;
            const payload = {
                id_lote: selectedLote.Lote,
                id_producto: selectedProduct.IdProducto,
                cantidad: pesoNetoFinal,
                piezas: 0, // Enviamos el peso manual aquí
                id_area_entrada: selectedAreaFiltro ? selectedAreaFiltro : 5,
                id_area_salida: selectedAreaDestino,
                idusuario: user
            };

            const res = await axios.post(route("pesaje.guardar-traspaso"), payload);
            setLastRegisteredWeight(pesoNetoFinal);
            setShowSuccessModal(true);
            getMovimientos();

            const productosRestantes = await fetchProductosLote(selectedLote.Lote);
            if (productosRestantes.length === 0 || res.data.lote_cerrado) {
                toast.success("¡Lote finalizado!");
                setSelectedLote(null);
                if (selectedAreaFiltro) fetchLotesRefirgeradores(selectedAreaFiltro);
            } else {
                setSelectedProduct(null);
                setPesoManual("0.00");
                setCurrentWeight("0.00");
            }
        } catch (e) { toast.error("Error al guardar"); }
        finally { setIsProcessing(false); setShowGuardarModal(false); }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-100"><LoadingDiv /></div>;

    if (!selectedLote) {
        return (
            <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 flex flex-col items-center font-sans tracking-tight text-slate-900 font-black uppercase">
                <div className="max-w-7xl w-full">

                    <HeaderPanel
                        badgeText="Azteca AVT"
                        title="Panel de Pesaje:"
                        subtitle="Congelación"
                        onRefresh={fetchLotes}
                    />

                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex gap-2 overflow-x-auto no-scrollbar">

                        <button
                            onClick={() => setSelectedAreaFiltro(null)}
                            className={`flex-1 min-w-[120px] py-4 px-3 rounded-xl transition-all duration-500 flex flex-col items-center gap-2 group relative overflow-hidden ${!selectedAreaFiltro ? 'bg-[#1B2654] text-white shadow-2xl scale-[1.05] z-10' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100 shadow-sm'}`}
                        >
                            <div className={`p-2 rounded-lg transition-colors ${!selectedAreaFiltro ? 'bg-red-600' : 'bg-slate-100'}`}>
                                <LayoutGrid size={18} className={!selectedAreaFiltro ? 'text-white' : 'text-slate-400'} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Todos</span>
                        </button>

                        {/* Mapeo de almacenes existentes */}
                        {almacenes.map((a) => {
                            const id = a.id || a.IdAlmacen;
                            const isActive = selectedAreaFiltro === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => setSelectedAreaFiltro(isActive ? null : id)}
                                    className={`flex-1 min-w-[120px] py-4 px-3 rounded-xl transition-all duration-500 flex flex-col items-center gap-2 group relative overflow-hidden ${isActive ? 'bg-[#1B2654] text-white shadow-2xl scale-[1.05] z-10' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100 shadow-sm'}`}
                                >
                                    <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-red-600' : 'bg-slate-100'}`}>
                                        <Snowflake size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {a.Nombre?.substring(0, 15)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {lotes.length > 0 ? (
                            lotes.map((lote) => (
                                <button key={lote.Lote} onClick={() => handleSelectLote(lote)}
                                    className="bg-white p-6 rounded-[2.5rem] flex items-center justify-between border-4 border-transparent hover:border-red-600 transition-all shadow-xl group"
                                >

                                    <div className="text-left font-black">
                                        <span className="text-xs text-red-600 uppercase">LOTE #{lote.Lote}</span>
                                        <h3 className="text-2xl leading-none text-slate-700">{lote.Proveedor}</h3>
                                    </div>
                                    <div className="bg-slate-100 group-hover:bg-red-600 group-hover:text-white p-5 rounded-3xl transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                    </div>
                                </button>

                            ))
                        ) : (
                            <div className="col-span-full bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-4">
                                <span className="text-8xl">🧊</span>
                                <h2 className="text-2xl font-black text-slate-800 uppercase italic">{selectedAreaFiltro ? "Sin lotes en esta área" : "No tienes lotes para pesar, filtra por congelador"}</h2>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-slate-200 p-4 gap-4 overflow-hidden font-black uppercase">

            <BasculaModal
                isOpen={showTaraModal}
                title="PESAR TARA"
                subtitle="Coloque recipiente vacío"
                currentReading={currentWeight}
                buttonText="GUARDAR TARA"
                colorClass="bg-red-600 border-red-900 hover:bg-red-500"
                onClose={() => setShowTaraModal(false)}
                basculaId={idBasculaConfigurada}
                onConfirm={(b, t) => { setTara(t); setShowTaraModal(false); }}
            />

            <BasculaModal
                isOpen={showGuardarModal}
                title="PESAR PRODUCTO"
                subtitle={selectedProduct?.Nombre}
                currentReading={currentWeight}
                tara={tara}
                buttonText="CONFIRMAR Y GUARDAR"
                colorClass="bg-emerald-600 border-emerald-900 hover:bg-emerald-500"
                destinationName={almacenes.find(a => (a.id || a.IdAlmacen) === selectedAreaDestino)?.Nombre}
                onClose={() => setShowGuardarModal(false)}
                basculaId={idBasculaConfigurada}
                onConfirm={(b, t) => registrarPesaje(b, t)}
            />

            <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} registeredWeight={lastRegisteredWeight} message={`Registro guardado para ${selectedProduct?.Nombre}`} />

            <div className="flex-1 flex flex-col min-h-0 gap-4">
                <header className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-md border border-slate-300">
                    <div>
                        <button onClick={() => setSelectedLote(null)} className="text-[10px] text-slate-400 hover:text-red-600 mb-1 block">← VOLVER</button>
                        <h1 className="text-2xl text-slate-800">{selectedLote.Proveedor}</h1>
                        <p className="text-[10px] text-red-600 tracking-widest">LOTE: {selectedLote.Lote} | ORIGEN: {almacenes.find(a => (a.id || a.IdAlmacen) === selectedAreaFiltro)?.Nombre || 'GENERAL'}</p>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scroll pr-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {dbProducts.map((p) => (
                            <button key={p.IdProducto} onClick={() => { setSelectedProduct(p); setPesoManual(p.PesoTeorico); }} className={`p-4 rounded-[2rem] text-left border-b-[10px] h-36 flex flex-col justify-between transition-all shadow-md active:translate-y-2 active:border-b-0 ${selectedProduct?.IdProducto === p.IdProducto ? "border-red-600 bg-white scale-[0.98]" : "border-slate-300 bg-white"}`}>
                                {/* CAMBIO AQUÍ: Dice KG en vez de PZS */}
                                <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-lg w-fit">{p.KG} KG</span>
                                <span className="text-[12px] leading-tight text-slate-800 line-clamp-2">{p.Nombre}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-1/3 bg-white rounded-[2.5rem] shadow-inner border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b text-[9px] text-slate-400 sticky top-0"><tr><th className="p-4">PRODUCTO</th><th className="p-4 text-center">KG (MANUAL)</th><th className="p-4 text-right">PESO NETO {totalKilosLote} </th></tr></thead>
                        <tbody className="divide-y divide-slate-100 overflow-y-auto">{movimientos.map((reg, i) => (<tr key={i} className="text-[11px] font-bold text-slate-700"><td className="p-4 truncate">{reg.Nombre}</td><td className="p-4 text-center">{reg.Piezas} KG</td><td className="p-4 text-right font-black">{parseFloat(reg.Peso || 0).toFixed(2)} KG</td></tr>))}</tbody>
                    </table>
                </div>
            </div>

            <aside className="w-full md:w-1/3 lg:w-[350px] flex flex-col gap-3">
                <div className="bg-slate-900 rounded-[2rem] p-4 shadow-xl border-4 border-slate-800">
                    <div className="bg-[#0f1713] rounded-[1.5rem] p-4 border-4 border-black text-center"><div className="text-5xl font-mono text-green-400">{netWeight}</div><span className="text-green-900 text-[8px] mt-1 block tracking-widest font-black uppercase">Neto (KG)</span></div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="bg-slate-800 py-2 rounded-xl text-center"><div className="text-base font-mono text-blue-400">{pesoBruto.toFixed(2)}</div><span className="text-slate-500 text-[7px] font-bold">BRUTO</span></div>
                        <div className="bg-slate-800 py-2 rounded-xl text-center"><div className="text-base font-mono text-red-400">-{pesoTara.toFixed(2)}</div><span className="text-slate-500 text-[7px] font-bold">TARA</span></div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-[2rem] border-4 border-slate-200 flex flex-col gap-3">
                    <button onClick={() => { setCurrentWeight("0.00"); setShowTaraModal(true); }} className="bg-slate-800 text-white py-3 rounded-xl text-[10px] border-b-4 border-black font-black active:translate-y-1 active:border-b-0">CAMBIAR TARA</button>

                    <div>
                        <label className={`text-[10px] block mb-2 text-center tracking-widest font-black uppercase ${!selectedAreaDestino ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                            {!selectedAreaDestino ? "Elija EL CONGELADOR" : "CONGELADOR DE DESTINO"}
                        </label>
                        <div className="flex gap-1">
                            {almacenes.map(a => (
                                <button key={a.id || a.IdAlmacen} onClick={() => setSelectedAreaDestino(a.id || a.IdAlmacen)} className={`flex-1 py-3 rounded-xl text-[9px] transition-all border-b-4 font-black flex flex-col items-center justify-center gap-1 ${selectedAreaDestino === (a.id || a.IdAlmacen) ? 'bg-yellow-400 border-yellow-600 text-yellow-900' : 'bg-slate-100 border-slate-300 text-slate-400'}`}>
                                    <Snowflake size={14} strokeWidth={3} />
                                    <span>{a.Nombre?.substring(0, 10)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={() => { setCurrentWeight("0.00"); setShowGuardarModal(true); }} disabled={!isReadyToOpenGuardar} className={`w-full py-5 rounded-[1.5rem] text-lg border-b-[8px] transition-all font-black ${!isReadyToOpenGuardar ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed" : "bg-emerald-600 text-white border-emerald-900 hover:bg-emerald-500 active:translate-y-1 active:border-b-0"}`}>
                        {!selectedProduct ? "ELIJA PRODUCTO" : !selectedAreaDestino ? "ELIJA DESTINO" : "Pesar y Guardar"}
                    </button>
                </div>
            </aside>
        </div>
    );
}