// import React, { useEffect, useState, Fragment, useMemo } from "react";
// import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
// import { motion, AnimatePresence } from "framer-motion";
// import { toast } from "sonner";
// import LoadingDiv from "@/Components/LoadingDiv";
// import axios from "axios";
// import {
//     Plus, Minus, Check, Save, Loader2, AlertTriangle,
//     Package, ArrowLeft, Truck, ClipboardCheck, Search, X, MessageSquare
// } from 'lucide-react';

// // Subcomponente para el manejo de cantidades en el Modal
// const QuantityItem = ({ p, values, onUpdate, onChange }) => (
//     <div className="p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 bg-white shadow-sm space-y-3">
//         <div className="flex justify-between items-start border-b border-slate-100 pb-2">
//             <div>
//                 <p className="font-black text-slate-800 uppercase leading-none text-xs sm:text-base">{p.Nombre}</p>
//                 <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{p.UnidadMedida}</p>
//             </div>
//         </div>
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
//             <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl">
//                 <span className="text-[9px] font-black uppercase text-slate-500 ml-2">Piezas</span>
//                 <div className="flex items-center gap-2">
//                     <button onClick={() => onUpdate(p.IdProducto, 'piezas', -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-200">-</button>
//                     <input type="number" className="w-10 text-center font-black bg-transparent border-none p-0 text-sm focus:ring-0" value={values.piezas} onChange={(e) => onChange(p.IdProducto, 'piezas', parseInt(e.target.value) || 0)} />
//                     <button onClick={() => onUpdate(p.IdProducto, 'piezas', 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-200">+</button>
//                 </div>
//             </div>
//             <div className="flex items-center justify-between bg-red-50 p-2 rounded-xl border border-red-100">
//                 <span className="text-[9px] font-black uppercase text-red-600 ml-2">Decomiso</span>
//                 <div className="flex items-center gap-2">
//                     <button onClick={() => onUpdate(p.IdProducto, 'decomiso', -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm border border-red-200 text-red-600">-</button>
//                     <input type="number" className="w-10 text-center font-black bg-transparent border-none p-0 text-sm text-red-600 focus:ring-0" value={values.decomiso} onChange={(e) => onChange(p.IdProducto, 'decomiso', parseInt(e.target.value) || 0)} />
//                     <button onClick={() => onUpdate(p.IdProducto, 'decomiso', 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm border border-red-200 text-red-600">+</button>
//                 </div>
//             </div>
//         </div>
//     </div>
// );

// export default function CombinedDashboard() {
//     const [isLoading, setIsLoading] = useState(true);
//     const [isSaving, setIsSaving] = useState(false);
//     const [step, setStep] = useState(1);
//     const [searchTerm, setSearchTerm] = useState("");

//     const [dbProviders, setDbProviders] = useState([]);
//     const [dbProducts, setDbProducts] = useState([]);
//     const [dbChecklistItems, setDbChecklistItems] = useState([]);

//     const [sessionData, setSessionData] = useState({ IdProveedor: "", RazonSocial: "" });
//     const [selectedProducts, setSelectedProducts] = useState([]);
//     const [itemValues, setItemValues] = useState({});

//     // Estado para Checklist: Maneja el booleano y el comentario por ID
//     const [checklistData, setChecklistData] = useState({});

//     const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
//     const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

//     const filteredProducts = useMemo(() => {
//         return dbProducts.filter(p => p.Nombre.toLowerCase().includes(searchTerm.toLowerCase()));
//     }, [dbProducts, searchTerm]);

//     useEffect(() => {
//         const fetchCatalogos = async () => {
//             try {
//                 const [resProv, resProd, resCheck] = await Promise.all([
//                     axios.get("/api/provedores"),
//                     axios.get("/api/productos"),
//                     axios.get("/api/listaverificacion")
//                 ]);

//                 setDbProviders(resProv.data.data || resProv.data);
//                 setDbProducts((resProd.data.data || resProd.data).filter(p => p.EsSubproducto == 0));

//                 const listData = resCheck.data.data || resCheck.data;
//                 setDbChecklistItems(listData);

//                 // Inicializar estado de checklist: { [id]: { cumple: false, comentario: "" } }
//                 const initialCheck = listData.reduce((acc, item) => ({
//                     ...acc,
//                     [item.IdLista]: { cumple: false, comentario: "" }
//                 }), {});
//                 setChecklistData(initialCheck);

//             } catch (error) {
//                 toast.error("Error de conexión");
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//         fetchCatalogos();
//     }, []);

//     const toggleProduct = (p) => {
//         const isSelected = selectedProducts.find(x => x.IdProducto === p.IdProducto);
//         if (isSelected) {
//             setSelectedProducts(selectedProducts.filter(x => x.IdProducto !== p.IdProducto));
//         } else {
//             setSelectedProducts([...selectedProducts, p]);
//             if (!itemValues[p.IdProducto]) {
//                 setItemValues(prev => ({ ...prev, [p.IdProducto]: { piezas: 0, decomiso: 0 } }));
//             }
//         }
//     };

//     const handleUpdateValue = (id, field, delta) => {
//         setItemValues(prev => ({
//             ...prev,
//             [id]: { ...prev[id], [field]: Math.max(0, (prev[id]?.[field] || 0) + delta) }
//         }));
//     };

//     const handleManualChange = (id, field, value) => {
//         setItemValues(prev => ({
//             ...prev,
//             [id]: { ...prev[id], [field]: Math.max(0, value) }
//         }));
//     };

//     const user = JSON.parse(localStorage.getItem('perfil'))?.IdUsuario || 1;

//     const handleSave = async () => {
//         setIsSaving(true);

//         const productosData = selectedProducts.map(p => ({
//             IdProducto: p.IdProducto,
//             Nombre: p.Nombre,
//             piezas: itemValues[p.IdProducto]?.piezas || 0,
//             decomiso: itemValues[p.IdProducto]?.decomiso || 0
//         }));

//         // TRANSFORMACIÓN AL FORMATO SOLICITADO: Array de objetos
//         const inspeccionData = dbChecklistItems.map(item => ({
//             IdLista: item.IdLista,
//             Cumple: checklistData[item.IdLista].cumple ? 1 : 0,
//             Comentarios: checklistData[item.IdLista].comentario || ""
//         }));

//         try {
//             await axios.post("/api/GuardarLote", {
//                 ...sessionData,
//                 fecha: new Date().toISOString().split('T')[0],
//                 productos: productosData,
//                 inspeccion: inspeccionData,
//                 idUsuarioLocal: user
//             });

//             setIsConfirmModalOpen(false);
//             setIsSuccessModalOpen(true);
//             setStep(1);
//             setSelectedProducts([]);
//             setItemValues({});
//             setSearchTerm("");
//         } catch (error) {
//             toast.error("Error al guardar");
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     if (isLoading) return <div className="h-[100%] flex items-center justify-center"><LoadingDiv /></div>;

//     return (
//         <div className="h-[100%] bg-slate-50 p-3 sm:p-8 font-sans">
//             <AnimatePresence>
//                 {isSaving && (
//                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center text-white">
//                         <Loader2 className="w-12 h-12 animate-spin mb-4 text-red-500" />
//                         <p className="text-lg font-black uppercase">Procesando Lote...</p>
//                     </motion.div>
//                 )}
//             </AnimatePresence>

//             {step === 1 ? (
//                 <div className="flex h-[80vh] items-center justify-center">
//                     <div className="w-full max-w-md bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-xl">
//                         <h2 className="text-xl font-black uppercase text-slate-800 mb-6 border-l-4 pl-4 border-[#1B2654]">Nuevo ingreso de rastro</h2>
//                         <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
//                             <select
//                                 className="w-full rounded-2xl bg-slate-50 p-4 font-bold border-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none"
//                                 value={sessionData.IdProveedor}
//                                 onChange={(e) => {
//                                     const p = dbProviders.find(x => x.IdProveedor == e.target.value);
//                                     setSessionData({ IdProveedor: p?.IdProveedor || "", RazonSocial: p?.RazonSocial || "" });
//                                 }}
//                                 required
//                             >
//                                 <option value="">Seleccionar Proveedor...</option>
//                                 {dbProviders.map(p => (<option key={p.IdProveedor} value={p.IdProveedor}>{p.RazonSocial}</option>))}
//                             </select>
//                             <button className="w-full bg-[#1B2654] text-white font-black py-4 rounded-2xl uppercase tracking-widest text-sm shadow-lg">Siguiente</button>
//                         </form>
//                     </div>
//                 </div>
//             ) : (
//                 <div className="max-w-[1400px] h-[80vh] mx-auto pb-40">
//                     <header className="mb-4 flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm gap-2">
//                         <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
//                             <button onClick={() => setStep(1)} className="flex items-center gap-1 text-red-600 font-bold text-[10px] uppercase mb-1">
//                                 <ArrowLeft className="w-3 h-3" /> Volver
//                             </button>
//                             <h1 className="text-base sm:text-xl font-black uppercase text-slate-800 leading-none">Recepción de Lote</h1>
//                             <p className="text-slate-400 font-bold text-[10px] uppercase italic truncate max-w-[200px]">{sessionData.RazonSocial}</p>
//                         </div>
//                         <div className="relative w-full sm:w-64">
//                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//                             <input
//                                 type="text"
//                                 placeholder="BUSCAR PRODUCTO..."
//                                 className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-[10px] font-black focus:ring-2 focus:ring-red-500"
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                             />
//                         </div>
//                     </header>

//                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
//                         {/* PRODUCTOS */}
//                         <div className="lg:col-span-8">
//                             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4">
//                                 {filteredProducts.map((p) => {
//                                     const isSelected = selectedProducts.find(x => x.IdProducto === p.IdProducto);
//                                     return (
//                                         <button
//                                             key={p.IdProducto}
//                                             onClick={() => toggleProduct(p)}
//                                             className={`relative flex sm:flex-col items-center sm:items-start p-3 sm:p-6 rounded-xl sm:rounded-[2.5rem] text-left transition-all border-2 sm:border-4 ${isSelected ? "border-red-600 bg-white shadow-md" : "border-transparent bg-white/70"
//                                                 }`}
//                                         >
//                                             <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mr-3 sm:mr-0 sm:mb-2 ${isSelected ? "bg-red-600 text-white" : "bg-slate-100 text-slate-400"}`}>
//                                                 {isSelected ? <Check className="w-5 h-5" /> : <Package className="w-5 h-5" />}
//                                             </div>
//                                             <div className="flex-1 overflow-hidden">
//                                                 <span className="text-[8px] sm:text-[10px] font-black text-slate-400 block tracking-widest uppercase">{p.UnidadMedida}</span>
//                                                 <span className="text-xs sm:text-lg font-black uppercase text-slate-700 leading-tight truncate block">{p.Nombre}</span>
//                                             </div>
//                                         </button>
//                                     );
//                                 })}
//                             </div>
//                         </div>

//                         {/* INSPECCIÓN DE UNIDAD */}
//                         <div className="lg:col-span-4">
//                             <div className="lg:sticky lg:top-6 bg-white p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[3rem] shadow-sm">
//                                 <h3 className="font-black uppercase text-slate-400 text-[10px] tracking-widest mb-4 flex items-center gap-2">
//                                     <Truck className="w-4 h-4" /> Inspección de Unidad
//                                 </h3>
//                                 <div className="space-y-3">
//                                     {dbChecklistItems.map((item) => (
//                                         <div key={item.IdLista} className="space-y-1">
//                                             <button
//                                                 onClick={() => setChecklistData(prev => ({
//                                                     ...prev,
//                                                     [item.IdLista]: { ...prev[item.IdLista], cumple: !prev[item.IdLista].cumple }
//                                                 }))}
//                                                 style={{ backgroundColor: '#1B2654' }}
//                                                 className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all  text-white ${checklistData[item.IdLista]?.cumple ? "" : ""
//                                                     }`}
//                                             >
//                                                 <span className="font-black text-[9px] uppercase">{item.Nombre}</span>
//                                                 <div className={`w-4 h-4 rounded-full border ${checklistData[item.IdLista]?.cumple ? "bg-white text-red-600 flex items-center justify-center" : "bg-white"}`}>
//                                                     {checklistData[item.IdLista]?.cumple && <Check className="w-3 h-3" strokeWidth={4} />}
//                                                 </div>
//                                             </button>

//                                             {/* Input para comentarios si NO cumple o si quieres que siempre esté */}
//                                             <div className="relative">
//                                                 <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
//                                                 <input
//                                                     type="text"
//                                                     placeholder="Comentarios (opcional)..."
//                                                     value={checklistData[item.IdLista]?.comentario || ""}
//                                                     onChange={(e) => setChecklistData(prev => ({
//                                                         ...prev,
//                                                         [item.IdLista]: { ...prev[item.IdLista], comentario: e.target.value }
//                                                     }))}
//                                                     className="w-full bg-slate-50 border-none rounded-lg text-[9px] pl-8 py-1.5 focus:ring-1 focus:ring-blue-400 font-bold text-slate-600"
//                                                 />
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* BOTÓN FLOTANTE */}
//                     <div className="fixed bottom-0 left-0 right-0 p-4  flex justify-center">
//                         <button
//                             disabled={selectedProducts.length === 0}
//                             onClick={() => setIsConfirmModalOpen(true)}
//                             style={{ backgroundColor: '#1B2654' }}

//                             className="w-full max-w-md bg-slate-900 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-2xl active:scale-95 disabled:bg-slate-300 flex items-center justify-center gap-3"
//                         >
//                             <span className="text-xs">Revisar Selección ({selectedProducts.length})</span>
//                             <ClipboardCheck className="w-5 h-5" />
//                         </button>
//                     </div>
//                 </div>
//             )}

//             {/* MODAL DE CANTIDADES */}
//             <Transition show={isConfirmModalOpen} as={Fragment}>
//                 <Dialog as="div" className="relative z-50" onClose={() => setIsConfirmModalOpen(false)}>
//                     <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" />
//                     <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
//                         <DialogPanel className="w-full max-w-2xl bg-slate-50 rounded-t-[2rem] sm:rounded-[3rem] p-4 sm:p-8 max-h-[95vh] flex flex-col">
//                             <DialogTitle className="text-sm sm:text-xl font-black uppercase mb-4 text-slate-800 text-center flex items-center justify-center gap-2">
//                                 <Save className="w-5 h-5 text-red-600" /> Detalle Final de Carga
//                             </DialogTitle>

//                             <div className="overflow-y-auto space-y-3 flex-1 pr-1 custom-scrollbar">
//                                 {selectedProducts.map((p) => (
//                                     <QuantityItem
//                                         key={p.IdProducto}
//                                         p={p}
//                                         values={itemValues[p.IdProducto] || { piezas: 0, decomiso: 0 }}
//                                         onUpdate={handleUpdateValue}
//                                         onChange={handleManualChange}
//                                     />
//                                 ))}
//                             </div>

//                             <div className="grid grid-cols-2 gap-3 mt-4">
//                                 <button onClick={() => setIsConfirmModalOpen(false)} className="py-4 font-black text-slate-400 uppercase text-[10px]">Atrás</button>
//                                 <button onClick={handleSave} className="py-4 bg-red-600 text-white font-black rounded-xl uppercase text-[10px] shadow-lg">Guardar Lote</button>
//                             </div>
//                         </DialogPanel>
//                     </div>
//                 </Dialog>
//             </Transition>

//             {/* MODAL ÉXITO */}
//             <Transition show={isSuccessModalOpen} as={Fragment}>
//                 <Dialog as="div" className="relative z-[110]" onClose={() => setIsSuccessModalOpen(false)}>
//                     <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
//                     <div className="fixed inset-0 flex items-center justify-center p-4">
//                         <DialogPanel className="w-full max-w-xs bg-white rounded-[2rem] p-8 text-center shadow-2xl">
//                             <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
//                                 <Check className="w-8 h-8" strokeWidth={4} />
//                             </div>
//                             <DialogTitle className="text-lg font-black uppercase text-slate-800">¡Se guardo con exito el lote!</DialogTitle>
//                             <button onClick={() => setIsSuccessModalOpen(false)}
//                                 style={{ backgroundColor: '#1B2654' }}
//                                 className="mt-6 w-full py-4 text-white font-black rounded-xl uppercase text-[10px]">Aceptar</button>
//                         </DialogPanel>
//                     </div>
//                 </Dialog>
//             </Transition>
//         </div>
//     );
// }



import React, { useEffect, useState, Fragment, useMemo } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";
import {
    Save, Loader2, Truck, Search, ArrowLeft, 
    FileText, Check, MessageSquare, ClipboardCheck, Info
} from 'lucide-react';

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

    // Cálculo de totales en tiempo real para el resumen lateral
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
        <div className="h-[100%] bg-[#F1F5F9] font-sans text-slate-900">
            <AnimatePresence>
                {isSaving && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                        <Loader2 className="w-12 h-12 animate-spin mb-4 text-red-500" />
                        <p className="text-sm font-black uppercase tracking-widest">Sincronizando Datos...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {step === 1 ? (
                /* Pantalla de Selección de Proveedor */
                <div className="flex h-[100%] items-center justify-center p-4">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-200">
                        <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <Truck className="text-red-600 w-8 h-8" />
                        </div>
                        <h2 className="text-center text-2xl font-black uppercase tracking-tight mb-2">Nueva Recepción</h2>
                        <p className="text-center text-slate-400 text-xs font-bold uppercase mb-8">Selecciona el origen del lote</p>
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
                            <button className="w-full bg-[#1B2654] text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Comenzar Registro</button>
                        </form>
                    </motion.div>
                </div>
            ) : (
                /* Layout de Hoja de Trabajo (Dashboard Full Width) */
                <div className="flex flex-col h-[100%] overflow-hidden">
                    {/* Header pegado arriba */}
                    <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setStep(1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><ArrowLeft /></button>
                            <div>
                                <h1 className="text-lg font-black uppercase leading-none tracking-tighter">Hoja de Entrada de Rastro</h1>
                                <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{sessionData.RazonSocial}</p>
                            </div>
                        </div>
                        <div className="flex-1 max-w-md relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="BUSCAR PRODUCTO..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-xs font-black focus:ring-2 focus:ring-red-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </header>

                    {/* Contenedor Principal con Scroll */}
                    <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                        <div className="max-w-[100%] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                            
                            {/* COLUMNA 1: TABLA DE PRODUCTOS (Ocupa 7 de 12 en LG) */}
                            <section className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                                    <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><FileText className="w-4 h-4" /> Detalle de Mercancía</h3>
                                    <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-400">{filteredProducts.length} Ítems</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="text-[9px] font-black uppercase text-slate-400 bg-slate-50/50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-3">Producto / Unidad</th>
                                                <th className="px-6 py-3 text-center w-32">Piezas</th>
                                                <th className="px-6 py-3 text-center w-32">Decomiso</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredProducts.map((p) => (
                                                <tr key={p.IdProducto} className="hover:bg-slate-50/80 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="text-[11px] font-black text-slate-800 uppercase leading-tight">{p.Nombre}</div>
                                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{p.UnidadMedida}</div>
                                                    </td>
                                                    <td className="px-6 py-2 text-center">
                                                        <input
                                                            type="number"
                                                            className="w-20 bg-slate-50 border-2 border-transparent group-hover:bg-white group-hover:border-slate-200 rounded-lg p-2 text-center text-xs font-black focus:ring-0 focus:border-red-500 transition-all"
                                                            value={itemValues[p.IdProducto]?.piezas || ""}
                                                            onChange={(e) => handleManualChange(p.IdProducto, 'piezas', e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-2 text-center">
                                                        <input
                                                            type="number"
                                                            className="w-20 bg-red-50/30 border-2 border-transparent group-hover:bg-red-50 group-hover:border-red-100 rounded-lg p-2 text-center text-xs font-black text-red-600 focus:ring-0 focus:border-red-500 transition-all"
                                                            value={itemValues[p.IdProducto]?.decomiso || ""}
                                                            onChange={(e) => handleManualChange(p.IdProducto, 'decomiso', e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* COLUMNA 2: CHECKLIST (Ocupa 3 de 12 en LG) */}
                            <section className="lg:col-span-3 space-y-4">
                                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                                    <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6 flex items-center gap-2">
                                        <Info className="w-4 h-4 text-red-600" /> Inspección Unidad
                                    </h3>
                                    <div className="space-y-3">
                                        {dbChecklistItems.map((item) => (
                                            <div key={item.IdLista} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group transition-all">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[9px] font-black uppercase text-slate-700">{item.Nombre}</span>
                                                    <button
                                                        onClick={() => setChecklistData(prev => ({
                                                            ...prev,
                                                            [item.IdLista]: { ...prev[item.IdLista], cumple: !prev[item.IdLista].cumple }
                                                        }))}
                                                        className={`w-10 h-5 rounded-full relative transition-colors ${checklistData[item.IdLista]?.cumple ? 'bg-green-500' : 'bg-slate-300'}`}
                                                    >
                                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${checklistData[item.IdLista]?.cumple ? 'right-1' : 'left-1'}`} />
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <MessageSquare className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                                                    <input
                                                        type="text"
                                                        placeholder="Observación..."
                                                        className="w-full pl-6 bg-white border-none rounded-lg text-[9px] font-bold py-1 focus:ring-1 focus:ring-blue-400"
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
                                </div>
                            </section>

                            {/* COLUMNA 3: RESUMEN Y ENVÍO (Ocupa 2 de 12 en LG) */}
                            <section className="lg:col-span-2">
                                <div className="bg-[#1B2654] text-white rounded-[2rem] p-6 shadow-xl sticky top-0 border border-white/10">
                                    <h3 className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-6">Resumen Lote</h3>
                                    
                                    <div className="space-y-6">
                                        <div className="border-b border-white/10 pb-4">
                                            <p className="text-[10px] font-bold text-white/60 uppercase">Total Piezas</p>
                                            <p className="text-3xl font-black">{totals.piezas}</p>
                                        </div>
                                        <div className="border-b border-white/10 pb-4">
                                            <p className="text-[10px] font-bold text-red-400 uppercase">Total Decomiso</p>
                                            <p className="text-3xl font-black text-red-500">{totals.decomiso}</p>
                                        </div>
                                        
                                        <button
                                            onClick={handleSave}
                                            disabled={totals.piezas === 0 && totals.decomiso === 0}
                                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white font-black py-4 rounded-2xl uppercase tracking-tighter text-xs shadow-lg transition-all flex items-center justify-center gap-2 group"
                                        >
                                            Guardar Todo
                                            <ClipboardCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        </button>
                                        <p className="text-[8px] text-white/40 text-center uppercase font-bold tracking-widest">Verifica los datos antes de enviar</p>
                                    </div>
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
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <Check className="w-10 h-10" strokeWidth={4} />
                            </div>
                            <DialogTitle className="text-xl font-black uppercase text-slate-800 leading-tight mb-2">¡Lote Guardado!</DialogTitle>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Base de datos actualizada</p>
                            <button onClick={() => setIsSuccessModalOpen(false)}
                                className="w-full py-4 bg-[#1B2654] text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-lg hover:bg-slate-800 transition-colors">Aceptar</button>
                        </DialogPanel>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}