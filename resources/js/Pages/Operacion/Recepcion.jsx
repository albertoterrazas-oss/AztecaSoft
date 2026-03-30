import React, { useEffect, useState, Fragment, useMemo } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";
import {
    Save, Loader2, Truck, Search, ArrowLeft,
    FileText, Check, MessageSquare, ClipboardCheck, Info,
    Plus, Minus
} from 'lucide-react';
import logo from './img/logo1.png';
import HeaderPanel from '../../Components/HeaderPanel.jsx';

export default function CombinedDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [step, setStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    const [dbProviders, setDbProviders] = useState([]);
    const [dbProducts, setDbProducts] = useState([]);
    const [dbChecklistItems, setDbChecklistItems] = useState([]);

    const [sessionData, setSessionData] = useState({ IdProveedor: "", RazonSocial: "" });
    const [itemValues, setItemValues] = useState({});
    const [checklistData, setChecklistData] = useState({});

    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    const filteredProducts = useMemo(() => {
        return dbProducts.filter(p => p.Nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [dbProducts, searchTerm]);

    const totals = useMemo(() => {
        return Object.values(itemValues).reduce((acc, curr) => ({
            piezas: acc.piezas + (curr.piezas || 0),
            decomiso: acc.decomiso + (curr.decomiso || 0)
        }), { piezas: 0, decomiso: 0 });
    }, [itemValues]);

    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                const [resProv, resProd, resCheck] = await Promise.all([
                    axios.get("/api/provedores"),
                    axios.get("/api/productos"),
                    axios.get("/api/listaverificacion")
                ]);

                setDbProviders(resProv.data.data || resProv.data);
                const prods = (resProd.data.data || resProd.data).filter(p => p.EsSubproducto == 0);
                setDbProducts(prods);

                const initialValues = prods.reduce((acc, p) => ({ ...acc, [p.IdProducto]: { piezas: 0, decomiso: 0 } }), {});
                setItemValues(initialValues);

                const listData = resCheck.data.data || resCheck.data;
                setDbChecklistItems(listData);
                const initialCheck = listData.reduce((acc, item) => ({ ...acc, [item.IdLista]: { cumple: false, comentario: "" } }), {});
                setChecklistData(initialCheck);

            } catch (error) {
                toast.error("Error de conexión");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCatalogos();
    }, []);

    const handleManualChange = (id, field, value) => {
        const val = Math.max(0, parseInt(value) || 0);
        setItemValues(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
    };

    const handleAdjustValue = (id, field, delta) => {
        const currentValue = itemValues[id]?.[field] || 0;
        const newValue = Math.max(0, currentValue + delta);
        setItemValues(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: newValue }
        }));
    };

    const handleSave = async () => {
        const productosAEnviar = dbProducts
            .filter(p => (itemValues[p.IdProducto]?.piezas > 0 || itemValues[p.IdProducto]?.decomiso > 0))
            .map(p => ({
                IdProducto: p.IdProducto,
                Nombre: p.Nombre,
                piezas: itemValues[p.IdProducto].piezas,
                decomiso: itemValues[p.IdProducto].decomiso
            }));

        if (productosAEnviar.length === 0) return toast.error("Ingresa al menos una cantidad");

        setIsSaving(true);
        try {
            await axios.post("/api/GuardarLote", {
                ...sessionData,
                fecha: new Date().toISOString().split('T')[0],
                productos: productosAEnviar,
                inspeccion: dbChecklistItems.map(item => ({
                    IdLista: item.IdLista,
                    Cumple: checklistData[item.IdLista].cumple ? 1 : 0,
                    Comentarios: checklistData[item.IdLista].comentario || ""
                })),
                idUsuarioLocal: JSON.parse(localStorage.getItem('perfil'))?.IdUsuario || 1
            });
            setIsSuccessModalOpen(true);
            setStep(1);
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center"><LoadingDiv /></div>;

    return (
        <div className="h-full bg-[#F8FAFC] font-sans text-slate-900">
            <AnimatePresence>
                {isSaving && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                        <Loader2 className="w-12 h-12 animate-spin mb-4 text-red-500" />
                        <p className="text-xs font-black uppercase tracking-widest">Sincronizando...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {step === 1 ? (
                // <div className="flex h-screen items-center justify-center p-4">
                //     <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-200">


                //         <img
                //             src={logo}
                //             alt="Logotipo"
                //             style={{
                //                 maxWidth: '45%',
                //                 height: 'auto',  
                //                 display: 'block', 


                //                 borderRadius: '50%', 
                //                 aspectRatio: '1/1',  
                //                 objectFit: 'cover',   
                //                 margin: '0 auto'     
                //             }}
                //         />
                //         <h2 className="text-center text-2xl font-black uppercase tracking-tight mb-2">Nueva Recepción</h2>
                //         <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
                //             <select
                //                 className="w-full rounded-2xl bg-slate-50 p-4 font-bold border-2 border-transparent focus:border-red-500 focus:bg-white transition-all text-sm appearance-none"
                //                 value={sessionData.IdProveedor}
                //                 onChange={(e) => {
                //                     const p = dbProviders.find(x => x.IdProveedor == e.target.value);
                //                     setSessionData({ IdProveedor: p?.IdProveedor || "", RazonSocial: p?.RazonSocial || "" });
                //                 }}
                //                 required
                //             >
                //                 <option value="">--- Seleccionar Proveedor ---</option>
                //                 {dbProviders.map(p => (<option key={p.IdProveedor} value={p.IdProveedor}>{p.RazonSocial}</option>))}
                //             </select>
                //             <button className="w-full bg-[#1B2654] text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Comenzar Registro</button>
                //         </form>
                //     </motion.div>
                // </div>


                <div className="h-[100%] bg-slate-100 p-8 flex flex-col items-center justify-center font-black uppercase">
                    <div className="max-w-4xl w-full">

                        <HeaderPanel
                            badgeText="Azteca AVT"
                            title="Panel DE"
                            subtitle="RECEPCION"
                            onRefresh={() => { }} // <--- No hace nada
                        />

                        <div className="grid gap-4">


                            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
                                <select
                                    className="w-full rounded-2xl bg-slate-50 p-4 font-bold border-2 border-transparent focus:border-red-500 focus:bg-white transition-all text-sm appearance-none"
                                    value={sessionData.IdProveedor}
                                    onChange={(e) => {
                                        const p = dbProviders.find(x => x.IdProveedor == e.target.value);
                                        setSessionData({ IdProveedor: p?.IdProveedor || "", RazonSocial: p?.RazonSocial || "" });
                                    }}
                                    required
                                >
                                    <option value="">--- Seleccionar Proveedor ---</option>
                                    {dbProviders.map(p => (<option key={p.IdProveedor} value={p.IdProveedor}>{p.RazonSocial}</option>))}
                                </select>
                                <button className="w-full bg-[#1B2654] text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Comenzar Registro</button>
                            </form>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-screen overflow-hidden">

                    {/* HEADER CONSOLIDADO: TITULO + TOTALES + BOTON GUARDAR */}
                    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setStep(1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-lg font-black uppercase leading-none tracking-tighter">Hoja de Entrada de Rastro</h1>
                                <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{sessionData.RazonSocial}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* INDICADORES DE TOTALES */}
                            <div className="hidden md:flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                                <div className="flex flex-col items-center border-r border-slate-200 pr-4">
                                    <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Total Piezas</span>
                                    <span className="text-sm font-black text-slate-800 leading-none">{totals.piezas}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Total Decomiso</span>
                                    <span className="text-sm font-black text-red-600 leading-none">{totals.decomiso}</span>
                                </div>
                            </div>

                            {/* BOTÓN GUARDAR INTEGRADO */}
                            <button
                                onClick={handleSave}
                                disabled={totals.piezas === 0 && totals.decomiso === 0}
                                className="bg-[#1B2654] hover:bg-slate-800 px-6 py-3 rounded-xl text-[10px] font-black text-white uppercase tracking-widest disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-blue-900/10 active:scale-95"
                            >
                                Guardar Lote <Save className="w-4 h-4" />
                            </button>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">

                            {/* COLUMNA PRODUCTOS */}
                            <section className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-slate-100 bg-white space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-red-600" /> Detalle de Mercancía
                                    </h3>
                                    {/* BUSCADOR */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="FILTRAR PRODUCTO POR NOMBRE..."
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left table-fixed">
                                        <thead className="text-[9px] font-black uppercase text-slate-400 bg-slate-50/50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-3 w-[50%]">Producto / Unidad</th>
                                                <th className="px-6 py-3 text-center w-[25%]">Piezas</th>
                                                <th className="px-6 py-3 text-center w-[25%]">Decomiso</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredProducts.map((p) => (
                                                <tr key={p.IdProducto} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-3">
                                                        <div className="text-[11px] font-black text-slate-800 uppercase leading-tight truncate">{p.Nombre}</div>
                                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{p.UnidadMedida}</div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button onClick={() => handleAdjustValue(p.IdProducto, 'piezas', -1)} disabled={(itemValues[p.IdProducto]?.piezas || 0) <= 0}
                                                                className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 disabled:opacity-20 active:bg-slate-100 transition-all">
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <input type="number" className="w-12 bg-slate-100/50 border-none rounded-lg p-1.5 text-center text-xs font-black focus:ring-1 focus:ring-red-500"
                                                                value={itemValues[p.IdProducto]?.piezas || ""} onChange={(e) => handleManualChange(p.IdProducto, 'piezas', e.target.value)} placeholder="0" />
                                                            <button onClick={() => handleAdjustValue(p.IdProducto, 'piezas', 1)}
                                                                className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 active:bg-slate-100 transition-all">
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button onClick={() => handleAdjustValue(p.IdProducto, 'decomiso', -1)} disabled={(itemValues[p.IdProducto]?.decomiso || 0) <= 0}
                                                                className="w-7 h-7 flex items-center justify-center bg-white border border-red-100 text-red-300 disabled:opacity-20 active:bg-red-50 transition-all">
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <input type="number" className="w-12 bg-red-50/50 border-none rounded-lg p-1.5 text-center text-xs font-black text-red-600 focus:ring-1 focus:ring-red-500"
                                                                value={itemValues[p.IdProducto]?.decomiso || ""} onChange={(e) => handleManualChange(p.IdProducto, 'decomiso', e.target.value)} placeholder="0" />
                                                            <button onClick={() => handleAdjustValue(p.IdProducto, 'decomiso', 1)}
                                                                className="w-7 h-7 flex items-center justify-center bg-white border border-red-100 text-red-600 active:bg-red-50 transition-all">
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* COLUMNA CHECKLIST */}
                            <section className="lg:col-span-4 bg-white rounded-3xl shadow-sm border border-slate-200 p-5 self-start">
                                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-5 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-red-600" /> Inspección de Unidad
                                </h3>
                                <div className="space-y-3">
                                    {dbChecklistItems.map((item) => (
                                        <div key={item.IdLista} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[9px] font-black uppercase text-slate-700 leading-none">{item.Nombre}</span>
                                                <button
                                                    onClick={() => setChecklistData(prev => ({
                                                        ...prev,
                                                        [item.IdLista]: { ...prev[item.IdLista], cumple: !prev[item.IdLista].cumple }
                                                    }))}
                                                    className={`w-9 h-5 rounded-full relative transition-colors ${checklistData[item.IdLista]?.cumple ? 'bg-green-500' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${checklistData[item.IdLista]?.cumple ? 'right-1' : 'left-1'}`} />
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <MessageSquare className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                                                <input
                                                    type="text"
                                                    placeholder="Comentario..."
                                                    className="w-full pl-7 bg-white border border-slate-100 rounded-lg text-[9px] font-bold py-1.5 focus:ring-1 focus:ring-blue-400 focus:outline-none"
                                                    value={checklistData[item.IdLista]?.comentario || ""}
                                                    onChange={(e) => setChecklistData(prev => ({
                                                        ...prev,
                                                        [item.IdLista]: { ...prev[item.IdLista], comentario: e.target.value }
                                                    }))}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </main>
                </div>
            )}

            {/* MODAL ÉXITO */}
            <Transition show={isSuccessModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[110]" onClose={() => setIsSuccessModalOpen(false)}>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <DialogPanel className="w-full max-w-xs bg-white rounded-[2.5rem] p-8 text-center shadow-2xl border border-slate-200">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8" strokeWidth={4} />
                            </div>
                            <DialogTitle className="text-lg font-black uppercase text-slate-800 mb-6">Lote Guardado</DialogTitle>
                            <button onClick={() => setIsSuccessModalOpen(false)} className="w-full py-4 bg-[#1B2654] text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg">Aceptar</button>
                        </DialogPanel>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}