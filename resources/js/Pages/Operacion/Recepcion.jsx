import React, { useEffect, useState, Fragment, useMemo } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";
import {
    Plus, Minus, Check, Save, Loader2, AlertTriangle,
    Package, ArrowLeft, Truck, ClipboardCheck, Search, X, MessageSquare
} from 'lucide-react';

// Subcomponente para el manejo de cantidades en el Modal
const QuantityItem = ({ p, values, onUpdate, onChange }) => (
    <div className="p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 bg-white shadow-sm space-y-3">
        <div className="flex justify-between items-start border-b border-slate-100 pb-2">
            <div>
                <p className="font-black text-slate-800 uppercase leading-none text-xs sm:text-base">{p.Nombre}</p>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{p.UnidadMedida}</p>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl">
                <span className="text-[9px] font-black uppercase text-slate-500 ml-2">Piezas</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => onUpdate(p.IdProducto, 'piezas', -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-200">-</button>
                    <input type="number" className="w-10 text-center font-black bg-transparent border-none p-0 text-sm focus:ring-0" value={values.piezas} onChange={(e) => onChange(p.IdProducto, 'piezas', parseInt(e.target.value) || 0)} />
                    <button onClick={() => onUpdate(p.IdProducto, 'piezas', 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-200">+</button>
                </div>
            </div>
            <div className="flex items-center justify-between bg-red-50 p-2 rounded-xl border border-red-100">
                <span className="text-[9px] font-black uppercase text-red-600 ml-2">Decomiso</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => onUpdate(p.IdProducto, 'decomiso', -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm border border-red-200 text-red-600">-</button>
                    <input type="number" className="w-10 text-center font-black bg-transparent border-none p-0 text-sm text-red-600 focus:ring-0" value={values.decomiso} onChange={(e) => onChange(p.IdProducto, 'decomiso', parseInt(e.target.value) || 0)} />
                    <button onClick={() => onUpdate(p.IdProducto, 'decomiso', 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm border border-red-200 text-red-600">+</button>
                </div>
            </div>
        </div>
    </div>
);

export default function CombinedDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [step, setStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    const [dbProviders, setDbProviders] = useState([]);
    const [dbProducts, setDbProducts] = useState([]);
    const [dbChecklistItems, setDbChecklistItems] = useState([]);

    const [sessionData, setSessionData] = useState({ IdProveedor: "", RazonSocial: "" });
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [itemValues, setItemValues] = useState({});

    // Estado para Checklist: Maneja el booleano y el comentario por ID
    const [checklistData, setChecklistData] = useState({});

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    const filteredProducts = useMemo(() => {
        return dbProducts.filter(p => p.Nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [dbProducts, searchTerm]);

    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                const [resProv, resProd, resCheck] = await Promise.all([
                    axios.get("/api/provedores"),
                    axios.get("/api/productos"),
                    axios.get("/api/listaverificacion")
                ]);

                setDbProviders(resProv.data.data || resProv.data);
                setDbProducts((resProd.data.data || resProd.data).filter(p => p.EsSubproducto == 0));

                const listData = resCheck.data.data || resCheck.data;
                setDbChecklistItems(listData);

                // Inicializar estado de checklist: { [id]: { cumple: false, comentario: "" } }
                const initialCheck = listData.reduce((acc, item) => ({
                    ...acc,
                    [item.IdLista]: { cumple: false, comentario: "" }
                }), {});
                setChecklistData(initialCheck);

            } catch (error) {
                toast.error("Error de conexión");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCatalogos();
    }, []);

    const toggleProduct = (p) => {
        const isSelected = selectedProducts.find(x => x.IdProducto === p.IdProducto);
        if (isSelected) {
            setSelectedProducts(selectedProducts.filter(x => x.IdProducto !== p.IdProducto));
        } else {
            setSelectedProducts([...selectedProducts, p]);
            if (!itemValues[p.IdProducto]) {
                setItemValues(prev => ({ ...prev, [p.IdProducto]: { piezas: 0, decomiso: 0 } }));
            }
        }
    };

    const handleUpdateValue = (id, field, delta) => {
        setItemValues(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: Math.max(0, (prev[id]?.[field] || 0) + delta) }
        }));
    };

    const handleManualChange = (id, field, value) => {
        setItemValues(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: Math.max(0, value) }
        }));
    };

    const user = JSON.parse(localStorage.getItem('perfil'))?.IdUsuario || 1;

    const handleSave = async () => {
        setIsSaving(true);

        const productosData = selectedProducts.map(p => ({
            IdProducto: p.IdProducto,
            Nombre: p.Nombre,
            piezas: itemValues[p.IdProducto]?.piezas || 0,
            decomiso: itemValues[p.IdProducto]?.decomiso || 0
        }));

        // TRANSFORMACIÓN AL FORMATO SOLICITADO: Array de objetos
        const inspeccionData = dbChecklistItems.map(item => ({
            IdLista: item.IdLista,
            Cumple: checklistData[item.IdLista].cumple ? 1 : 0,
            Comentarios: checklistData[item.IdLista].comentario || ""
        }));

        try {
            await axios.post("/api/GuardarLote", {
                ...sessionData,
                fecha: new Date().toISOString().split('T')[0],
                productos: productosData,
                inspeccion: inspeccionData,
                idUsuarioLocal: user
            });

            setIsConfirmModalOpen(false);
            setIsSuccessModalOpen(true);
            setStep(1);
            setSelectedProducts([]);
            setItemValues({});
            setSearchTerm("");
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="h-[100%] flex items-center justify-center"><LoadingDiv /></div>;

    return (
        <div className="h-[100%] bg-slate-50 p-3 sm:p-8 font-sans">
            <AnimatePresence>
                {isSaving && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center text-white">
                        <Loader2 className="w-12 h-12 animate-spin mb-4 text-red-500" />
                        <p className="text-lg font-black uppercase">Procesando Lote...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {step === 1 ? (
                <div className="flex h-[80vh] items-center justify-center">
                    <div className="w-full max-w-md bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-xl">
                        <h2 className="text-xl font-black uppercase text-slate-800 mb-6 border-l-4 pl-4 border-[#1B2654]">Nueva Recepción</h2>
                        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
                            <select
                                className="w-full rounded-2xl bg-slate-50 p-4 font-bold border-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none"
                                value={sessionData.IdProveedor}
                                onChange={(e) => {
                                    const p = dbProviders.find(x => x.IdProveedor == e.target.value);
                                    setSessionData({ IdProveedor: p?.IdProveedor || "", RazonSocial: p?.RazonSocial || "" });
                                }}
                                required
                            >
                                <option value="">Seleccionar Proveedor...</option>
                                {dbProviders.map(p => (<option key={p.IdProveedor} value={p.IdProveedor}>{p.RazonSocial}</option>))}
                            </select>
                            <button className="w-full bg-[#1B2654] text-white font-black py-4 rounded-2xl uppercase tracking-widest text-sm shadow-lg">Siguiente</button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="max-w-[1400px] h-[80vh] mx-auto pb-40">
                    <header className="mb-4 flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm gap-2">
                        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-red-600 font-bold text-[10px] uppercase mb-1">
                                <ArrowLeft className="w-3 h-3" /> Volver
                            </button>
                            <h1 className="text-base sm:text-xl font-black uppercase text-slate-800 leading-none">Recepción de Lote</h1>
                            <p className="text-slate-400 font-bold text-[10px] uppercase italic truncate max-w-[200px]">{sessionData.RazonSocial}</p>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="BUSCAR PRODUCTO..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-[10px] font-black focus:ring-2 focus:ring-red-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* PRODUCTOS */}
                        <div className="lg:col-span-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4">
                                {filteredProducts.map((p) => {
                                    const isSelected = selectedProducts.find(x => x.IdProducto === p.IdProducto);
                                    return (
                                        <button
                                            key={p.IdProducto}
                                            onClick={() => toggleProduct(p)}
                                            className={`relative flex sm:flex-col items-center sm:items-start p-3 sm:p-6 rounded-xl sm:rounded-[2.5rem] text-left transition-all border-2 sm:border-4 ${isSelected ? "border-red-600 bg-white shadow-md" : "border-transparent bg-white/70"
                                                }`}
                                        >
                                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mr-3 sm:mr-0 sm:mb-2 ${isSelected ? "bg-red-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                                                {isSelected ? <Check className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <span className="text-[8px] sm:text-[10px] font-black text-slate-400 block tracking-widest uppercase">{p.UnidadMedida}</span>
                                                <span className="text-xs sm:text-lg font-black uppercase text-slate-700 leading-tight truncate block">{p.Nombre}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* INSPECCIÓN DE UNIDAD */}
                        <div className="lg:col-span-4">
                            <div className="lg:sticky lg:top-6 bg-white p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[3rem] shadow-sm">
                                <h3 className="font-black uppercase text-slate-400 text-[10px] tracking-widest mb-4 flex items-center gap-2">
                                    <Truck className="w-4 h-4" /> Inspección de Unidad
                                </h3>
                                <div className="space-y-3">
                                    {dbChecklistItems.map((item) => (
                                        <div key={item.IdLista} className="space-y-1">
                                            <button
                                                onClick={() => setChecklistData(prev => ({
                                                    ...prev,
                                                    [item.IdLista]: { ...prev[item.IdLista], cumple: !prev[item.IdLista].cumple }
                                                }))}
                                                style={{ backgroundColor: '#1B2654' }}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all  text-white ${checklistData[item.IdLista]?.cumple ? "" : ""
                                                    }`}
                                            >
                                                <span className="font-black text-[9px] uppercase">{item.Nombre}</span>
                                                <div className={`w-4 h-4 rounded-full border ${checklistData[item.IdLista]?.cumple ? "bg-white text-red-600 flex items-center justify-center" : "bg-white"}`}>
                                                    {checklistData[item.IdLista]?.cumple && <Check className="w-3 h-3" strokeWidth={4} />}
                                                </div>
                                            </button>

                                            {/* Input para comentarios si NO cumple o si quieres que siempre esté */}
                                            <div className="relative">
                                                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                                                <input
                                                    type="text"
                                                    placeholder="Comentarios (opcional)..."
                                                    value={checklistData[item.IdLista]?.comentario || ""}
                                                    onChange={(e) => setChecklistData(prev => ({
                                                        ...prev,
                                                        [item.IdLista]: { ...prev[item.IdLista], comentario: e.target.value }
                                                    }))}
                                                    className="w-full bg-slate-50 border-none rounded-lg text-[9px] pl-8 py-1.5 focus:ring-1 focus:ring-blue-400 font-bold text-slate-600"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BOTÓN FLOTANTE */}
                    <div className="fixed bottom-0 left-0 right-0 p-4  flex justify-center">
                        <button
                            disabled={selectedProducts.length === 0}
                            onClick={() => setIsConfirmModalOpen(true)}
                            style={{ backgroundColor: '#1B2654' }}

                            className="w-full max-w-md bg-slate-900 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-2xl active:scale-95 disabled:bg-slate-300 flex items-center justify-center gap-3"
                        >
                            <span className="text-xs">Revisar Selección ({selectedProducts.length})</span>
                            <ClipboardCheck className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL DE CANTIDADES */}
            <Transition show={isConfirmModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsConfirmModalOpen(false)}>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" />
                    <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <DialogPanel className="w-full max-w-2xl bg-slate-50 rounded-t-[2rem] sm:rounded-[3rem] p-4 sm:p-8 max-h-[95vh] flex flex-col">
                            <DialogTitle className="text-sm sm:text-xl font-black uppercase mb-4 text-slate-800 text-center flex items-center justify-center gap-2">
                                <Save className="w-5 h-5 text-red-600" /> Detalle Final de Carga
                            </DialogTitle>

                            <div className="overflow-y-auto space-y-3 flex-1 pr-1 custom-scrollbar">
                                {selectedProducts.map((p) => (
                                    <QuantityItem
                                        key={p.IdProducto}
                                        p={p}
                                        values={itemValues[p.IdProducto] || { piezas: 0, decomiso: 0 }}
                                        onUpdate={handleUpdateValue}
                                        onChange={handleManualChange}
                                    />
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <button onClick={() => setIsConfirmModalOpen(false)} className="py-4 font-black text-slate-400 uppercase text-[10px]">Atrás</button>
                                <button onClick={handleSave} className="py-4 bg-red-600 text-white font-black rounded-xl uppercase text-[10px] shadow-lg">Guardar Lote</button>
                            </div>
                        </DialogPanel>
                    </div>
                </Dialog>
            </Transition>

            {/* MODAL ÉXITO */}
            <Transition show={isSuccessModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[110]" onClose={() => setIsSuccessModalOpen(false)}>
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <DialogPanel className="w-full max-w-xs bg-white rounded-[2rem] p-8 text-center shadow-2xl">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8" strokeWidth={4} />
                            </div>
                            <DialogTitle className="text-lg font-black uppercase text-slate-800">¡Se guardo con exito el lote!</DialogTitle>
                            <button onClick={() => setIsSuccessModalOpen(false)}
                                style={{ backgroundColor: '#1B2654' }}
                                className="mt-6 w-full py-4 text-white font-black rounded-xl uppercase text-[10px]">Aceptar</button>
                        </DialogPanel>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}