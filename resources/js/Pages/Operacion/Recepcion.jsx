import React, { useEffect, useState, Fragment } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";
import { Plus, Minus, Check, Save, Loader2, AlertTriangle, Package, ArrowLeft } from 'lucide-react';

// --- COMPONENTE CON DOBLE INPUT (PIEZAS Y DECOMISO) ---
const QuantityItem = ({ p, values, onUpdate, onChange }) => {
    return (
        <div className="p-6 rounded-[2.5rem] border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                    <p className="font-black text-slate-800 uppercase leading-none mb-1">{p.Nombre}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{p.UnidadMedida}</p>
                </div>
            </div>

            <div className="space-y-3">
                {/* FILA DE PIEZAS */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Package className="w-4 h-4" />
                        <span className="text-xs font-black uppercase">Piezas</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onUpdate(p.IdProducto, 'piezas', -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-200 active:scale-90">-</button>
                        <input
                            type="number"
                            className="w-16 text-center font-black bg-transparent border-none p-0 text-lg focus:ring-0"
                            value={values.piezas}
                            onChange={(e) => onChange(p.IdProducto, 'piezas', parseInt(e.target.value) || 0)}
                        />
                        <button onClick={() => onUpdate(p.IdProducto, 'piezas', 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-200 active:scale-90">+</button>
                    </div>
                </div>

                {/* FILA DE DECOMISO */}
                <div className="flex items-center justify-between bg-red-50 p-3 rounded-2xl border border-red-100">
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-black uppercase">Decomiso</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onUpdate(p.IdProducto, 'decomiso', -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm border border-red-200 text-red-600 active:scale-90">-</button>
                        <input
                            type="number"
                            className="w-16 text-center font-black bg-transparent border-none p-0 text-lg text-red-600 focus:ring-0"
                            value={values.decomiso}
                            onChange={(e) => onChange(p.IdProducto, 'decomiso', parseInt(e.target.value) || 0)}
                        />
                        <button onClick={() => onUpdate(p.IdProducto, 'decomiso', 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm border border-red-200 text-red-600 active:scale-90">+</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const route = (name) => {
    const routeMap = {
        "provedores.index": "/api/provedores",
        "productos.index": "/api/productos",
        "GuardarTodo": "/api/GuardarLote",
    };
    return routeMap[name] || `/${name}`;
};

export default function CombinedDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [step, setStep] = useState(1);

    const [dbProviders, setDbProviders] = useState([]);
    const [dbProducts, setDbProducts] = useState([]);
    const [sessionData, setSessionData] = useState({ IdProveedor: "", RazonSocial: "" });
    const [selectedProducts, setSelectedProducts] = useState([]);

    const [itemValues, setItemValues] = useState({});
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                const [resProv, resProd] = await Promise.all([
                    axios.get(route("provedores.index")),
                    axios.get(route("productos.index"))
                ]);
                setDbProviders(resProv.data.data || resProv.data);
                // Filtramos productos que no sean subproductos
                const items = (resProd.data.data || resProd.data).filter(p => p.EsSubproducto == 0);
                setDbProducts(items);
            } catch (error) { 
                toast.error("Error de conexión"); 
            } finally { 
                setIsLoading(false); 
            }
        };
        fetchCatalogos();
    }, []);

    const handleUpdateValue = (id, field, delta) => {
        setItemValues(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: Math.max(0, (prev[id]?.[field] || 0) + delta)
            }
        }));
    };

    const handleManualChange = (id, field, value) => {
        setItemValues(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: Math.max(0, value) }
        }));
    };

    const getUserId = () => {
        const perfil = localStorage.getItem('perfil');
        if (perfil) {
            try {
                const parsed = JSON.parse(perfil);
                return parsed.IdUsuario;
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    const handleSave = async () => {
        setIsSaving(true);
        const productosData = selectedProducts.map(p => ({
            IdProducto: p.IdProducto,
            piezas: itemValues[p.IdProducto]?.piezas || 0,
            decomiso: itemValues[p.IdProducto]?.decomiso || 0
        }));

        const payload = { 
            ...sessionData, 
            fecha: new Date().toISOString().split('T')[0], 
            productos: productosData, 
            idUsuarioLocal: getUserId() 
        };

        try {
            await axios.post(route("GuardarTodo"), payload);
            toast.success("Registro guardado correctamente");
            setStep(1);
            setSelectedProducts([]);
            setItemValues({});
            setIsConfirmModalOpen(false);
        } catch (error) { 
            toast.error("Error al guardar"); 
        } finally { 
            setIsSaving(false); 
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center"><LoadingDiv /></div>;

    // Validación de existencia de productos
    const hasProducts = dbProducts.length > 0;

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            {isSaving && (
                <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center text-white">
                    <Loader2 className="w-16 h-16 animate-spin mb-4 text-red-500" />
                    <p className="text-2xl font-black uppercase tracking-tighter">Guardando Información...</p>
                </div>
            )}

            {step === 1 && (
                <div className="flex h-[80vh] items-center justify-center">
                    <div className="w-full max-w-md bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                        <h2 className="text-2xl font-black uppercase text-slate-800 mb-8 border-l-4 pl-4" style={{borderColor: '#1B2654'}}>Nueva Recepción</h2>
                        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
                            <select
                                className="w-full rounded-2xl bg-slate-50 p-4 font-bold border-none focus:ring-2 "
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
                            <button style={{backgroundColor: '#1B2654'}} className="w-full text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-lg active:scale-95 transition-all">Siguiente</button>
                        </form>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="w-full max-w-5xl mx-auto pb-32">
                    <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm">
                        <div>
                            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-red-600 font-bold text-xs uppercase mb-1">
                                <ArrowLeft className="w-3 h-3"/> Volver
                            </button>
                            <h1 className="text-2xl font-black uppercase text-slate-800">Selección de Productos</h1>
                            <p className="text-slate-400 font-bold text-sm uppercase italic">{sessionData.RazonSocial}</p>
                        </div>
                    </header>

                    {!hasProducts ? (
                        /* --- ESTADO SIN LOTES --- */
                        <div className="flex flex-col items-center justify-center bg-white p-20 rounded-[3rem] shadow-sm border-2 border-dashed border-slate-200">
                            <div className="bg-slate-50 p-6 rounded-full mb-4">
                                <Package className="w-12 h-12 text-slate-300" />
                            </div>
                            <h2 className="text-xl font-black text-slate-400 uppercase tracking-tight">Sin lotes disponibles</h2>
                            <p className="text-slate-400 text-sm mb-6 text-center">No se encontraron productos para este registro.</p>
                            <button 
                                onClick={() => setStep(1)}
                                className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-colors"
                            >
                                Cambiar Proveedor
                            </button>
                        </div>
                    ) : (
                        /* --- GRID DE PRODUCTOS --- */
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {dbProducts.map((p) => {
                                const isSelected = selectedProducts.find(x => x.IdProducto === p.IdProducto);
                                return (
                                    <button
                                        key={p.IdProducto}
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedProducts(selectedProducts.filter(x => x.IdProducto !== p.IdProducto));
                                            } else {
                                                setSelectedProducts([...selectedProducts, p]);
                                                if (!itemValues[p.IdProducto]) setItemValues({ ...itemValues, [p.IdProducto]: { piezas: 0, decomiso: 0 } });
                                            }
                                        }}
                                        className={`relative p-6 rounded-[2.5rem] text-left transition-all border-4 ${isSelected ? "border-red-600 bg-white shadow-xl scale-[1.02]" : "border-transparent bg-white opacity-60"}`}
                                    >
                                        {isSelected && <div className="absolute top-4 right-4 bg-red-600 rounded-full p-1"><Check className="w-3 h-3 text-white" strokeWidth={4} /></div>}
                                        <span className="text-[10px] font-black text-slate-400 block tracking-widest uppercase mb-1">{p.UnidadMedida}</span>
                                        <span className="text-lg font-black uppercase text-slate-700 leading-tight">{p.Nombre}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Solo mostrar el botón de acción si hay productos */}
                    {hasProducts && (
                        <div className="fixed bottom-8 left-0 right-0 px-6 z-10 flex justify-center">
                            <button
                                disabled={selectedProducts.length === 0}
                                onClick={() => setIsConfirmModalOpen(true)}
                                className="w-full max-w-md bg-slate-900 text-white font-black py-6 rounded-3xl uppercase tracking-widest shadow-2xl active:scale-95 disabled:bg-slate-300 transition-all"
                            >
                                Capturar Cantidades ({selectedProducts.length})
                            </button>
                        </div>
                    )}
                </div>
            )}

            <Transition show={isConfirmModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsConfirmModalOpen(false)}>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <DialogPanel className="w-full max-w-2xl bg-slate-50 rounded-[3rem] p-8 shadow-2xl border border-white">
                            <DialogTitle className="text-2xl font-black uppercase mb-6 text-slate-800 px-2 text-center">Detalle de Carga / Decomiso</DialogTitle>

                            <div className="max-h-[55vh] overflow-y-auto space-y-4 mb-8 px-2">
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

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setIsConfirmModalOpen(false)} className="py-5 font-black text-slate-400 uppercase tracking-widest text-sm">Atrás</button>
                                <button onClick={handleSave} className="py-5 bg-red-600 text-white font-black rounded-2xl uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:bg-red-700">
                                    <Save className="w-5 h-5" /> Guardar Todo
                                </button>
                            </div>
                        </DialogPanel>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}