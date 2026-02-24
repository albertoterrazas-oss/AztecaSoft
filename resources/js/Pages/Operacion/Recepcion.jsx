import React, { useEffect, useState, Fragment, useRef } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";
import { Plus, Minus, Check, Save, Loader2 } from 'lucide-react';

// --- COMPONENTE PARA LA ANIMACIÓN DE COLOR ---
const QuantityItem = ({ p, quantity, onUpdate, onChange }) => {
    const [flashClass, setFlashClass] = useState("");
    const prevValue = useRef(quantity);

    useEffect(() => {
        if (quantity > prevValue.current) {
            setFlashClass("bg-green-100 border-green-500");
        } else if (quantity < prevValue.current) {
            setFlashClass("bg-red-100 border-red-500");
        }
        
        const timer = setTimeout(() => setFlashClass(""), 300);
        prevValue.current = quantity;
        return () => clearTimeout(timer);
    }, [quantity]);

    return (
        <div className={`flex items-center justify-between p-5 rounded-3xl border transition-all duration-300 ${flashClass || "bg-slate-50 border-slate-100"}`}>
            <div className="flex-1 pr-4">
                <p className="font-black text-slate-800 uppercase truncate leading-none mb-1">{p.Nombre}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{p.UnidadMedida}</p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => onUpdate(p.IdProducto, -1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 active:scale-90 transition-transform">
                    <Minus className="w-4 h-4" />
                </button>
                <input 
                    type="number" 
                    className="w-16 text-center font-black bg-white rounded-xl border-none ring-1 ring-slate-200 text-lg py-2 focus:ring-red-500"
                    value={quantity}
                    onChange={(e) => onChange(p.IdProducto, parseInt(e.target.value) || 1)}
                />
                <button onClick={() => onUpdate(p.IdProducto, 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 active:scale-90 transition-transform">
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

const route = (name) => {
    const routeMap = {
        "provedores.index": "/api/provedores",
        "productos.index": "/api/productos",
        "GuardarLote": "/api/GuardarLote",
    };
    return routeMap[name] || `/${name}`;
};

const initialSessionData = {
    IdProveedor: "",
    RazonSocial: "",
    folio: "",
    observaciones: ""
};

export default function WeighingDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [step, setStep] = useState(1);
    
    const [dbProviders, setDbProviders] = useState([]);
    const [dbProducts, setDbProducts] = useState([]);

    const [sessionData, setSessionData] = useState(initialSessionData);
    const [selectedProducts, setSelectedProducts] = useState([]); 
    const [quantities, setQuantities] = useState({});

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                const [resProv, resProd] = await Promise.all([
                    axios.get(route("provedores.index")),
                    axios.get(route("productos.index"))
                ]);
                setDbProviders(resProv.data.data || resProv.data);
                const allProducts = resProd.data.data || resProd.data;
                setDbProducts(allProducts.filter(p => p.EsSubproducto == 0));
            } catch (error) {
                toast.error("Error al conectar con el servidor.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCatalogos();
    }, []);

    const handleSaveLote = async () => {
        setIsSaving(true);
        const productosData = selectedProducts.map(p => ({
            IdProducto: p.IdProducto,
            cantidad: quantities[p.IdProducto] || 1
        }));

        const payload = {
            ...sessionData,
            fecha: new Date().toISOString().split('T')[0],
            productos: productosData
        };

        try {
            await axios.post(route("GuardarLote"), payload);
            toast.success("Lote guardado correctamente");
            
            // --- REINICIO TOTAL ---
            setIsConfirmModalOpen(false); // Cerramos el modal
            setStep(1); // Volvemos al inicio
            setSessionData(initialSessionData);
            setSelectedProducts([]);
            setQuantities({});
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el lote");
        } finally {
            setIsSaving(false);
        }
    };

    const updateQuantity = (id, delta) => {
        setQuantities(prev => ({
            ...prev,
            [id]: Math.max(1, (prev[id] || 1) + delta)
        }));
    };

    const toggleProductSelection = (product) => {
        const exists = selectedProducts.find(p => p.IdProducto === product.IdProducto);
        if (exists) {
            setSelectedProducts(selectedProducts.filter(p => p.IdProducto !== product.IdProducto));
        } else {
            setSelectedProducts([...selectedProducts, product]);
            if (!quantities[product.IdProducto]) {
                setQuantities(prev => ({ ...prev, [product.IdProducto]: 1 }));
            }
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center"><LoadingDiv /></div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            
            {isSaving && (
                <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white text-center p-4">
                    <Loader2 className="w-16 h-16 animate-spin text-red-500 mb-4" />
                    <p className="text-2xl font-black uppercase tracking-widest">Finalizando Transacción...</p>
                </div>
            )}

            {/* STEP 1: INICIO */}
            {step === 1 && (
                <div className="flex h-[80vh] items-center justify-center">
                    <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                        <h2 className="text-2xl font-black uppercase mb-8 border-l-4 border-red-600 pl-4 text-slate-800">Nueva Recepción</h2>
                        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
                            <select 
                                className="w-full rounded-2xl bg-slate-50 p-4 font-bold border-none focus:ring-2 focus:ring-red-500"
                                value={sessionData.IdProveedor}
                                onChange={(e) => {
                                    const p = dbProviders.find(x => x.IdProveedor == e.target.value);
                                    setSessionData({...sessionData, IdProveedor: p?.IdProveedor || "", RazonSocial: p?.RazonSocial || ""});
                                }}
                                required
                            >
                                <option value="">Seleccione Proveedor...</option>
                                {dbProviders.map(p => (
                                    <option key={p.IdProveedor} value={p.IdProveedor}>{p.RazonSocial}</option>
                                ))}
                            </select>
                            <input 
                                type="text" 
                                placeholder="Folio de Lote" 
                                className="w-full rounded-2xl bg-slate-50 p-4 font-mono border-none focus:ring-2 focus:ring-red-500 uppercase"
                                value={sessionData.folio}
                                onChange={(e) => setSessionData({...sessionData, folio: e.target.value})}
                                required 
                            />
                            <textarea 
                                placeholder="Observaciones (opcional)"
                                className="w-full rounded-2xl bg-slate-50 p-4 font-medium border-none focus:ring-2 focus:ring-red-500 resize-none"
                                rows="2"
                                value={sessionData.observaciones}
                                onChange={(e) => setSessionData({...sessionData, observaciones: e.target.value})}
                            />
                            <button className="w-full bg-red-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-lg active:scale-95 transition-transform">
                                Comenzar
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* STEP 2: SELECCIÓN */}
            {step === 2 && (
                <div className="w-full max-w-5xl mx-auto pb-32">
                    <header className="mb-8 flex justify-between items-end">
                        <div>
                            <button onClick={() => setStep(1)} className="text-red-600 font-bold text-xs uppercase mb-2">← Cambiar Datos</button>
                            <h1 className="text-3xl font-black text-slate-800 uppercase leading-none">Selección de Carga</h1>
                            <p className="text-slate-500 font-medium mt-2 italic">Proveedor: {sessionData.RazonSocial}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Folio Lote</p>
                            <p className="font-mono font-black text-xl text-slate-700">#{sessionData.folio}</p>
                        </div>
                    </header>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {dbProducts.map((p) => {
                            const isSelected = selectedProducts.find(x => x.IdProducto === p.IdProducto);
                            return (
                                <button
                                    key={p.IdProducto}
                                    onClick={() => toggleProductSelection(p)}
                                    className={`relative p-6 rounded-[2.5rem] text-left transition-all border-4 ${
                                        isSelected ? "border-red-600 bg-white shadow-xl scale-[1.02]" : "border-transparent bg-white opacity-60 shadow-sm hover:opacity-100"
                                    }`}
                                >
                                    {isSelected && <div className="absolute top-4 right-4 bg-red-600 rounded-full p-1"><Check className="w-3 h-3 text-white" strokeWidth={4} /></div>}
                                    <span className="text-[10px] font-black text-slate-400 block tracking-widest uppercase mb-1">{p.UnidadMedida}</span>
                                    <span className="text-lg font-black uppercase text-slate-700 leading-tight">{p.Nombre}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="fixed bottom-8 left-0 right-0 px-6 z-10 flex justify-center">
                        <button 
                            disabled={selectedProducts.length === 0}
                            onClick={() => setIsConfirmModalOpen(true)}
                            className="w-full max-w-md bg-slate-900 text-white font-black py-6 rounded-3xl uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all disabled:bg-slate-300 disabled:shadow-none"
                        >
                            Confirmar Selección ({selectedProducts.length})
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL DE REVISIÓN Y GUARDADO */}
            <Transition show={isConfirmModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsConfirmModalOpen(false)}>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <DialogPanel className="w-full max-w-2xl bg-white rounded-[3rem] p-10 shadow-2xl">
                            <DialogTitle className="text-2xl font-black uppercase mb-8 border-l-4 border-red-600 pl-4">Resumen de Carga</DialogTitle>

                            <div className="max-h-[40vh] overflow-y-auto space-y-3 mb-10 pr-2">
                                {selectedProducts.map((p) => (
                                    <QuantityItem 
                                        key={p.IdProducto} 
                                        p={p} 
                                        quantity={quantities[p.IdProducto] || 1}
                                        onUpdate={updateQuantity}
                                        onChange={(id, val) => setQuantities({...quantities, [id]: val})}
                                    />
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <button onClick={() => setIsConfirmModalOpen(false)} className="py-5 font-black text-slate-400 uppercase tracking-widest text-sm hover:text-slate-600">Atrás</button>
                                <button 
                                    onClick={handleSaveLote}
                                    className="py-5 bg-red-600 text-white font-black rounded-2xl uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:bg-red-700 transition-colors"
                                >
                                    <Save className="w-5 h-5" /> Guardar Lote
                                </button>
                            </div>
                        </DialogPanel>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}