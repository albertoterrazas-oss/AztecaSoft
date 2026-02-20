import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";
import axios from "axios";

export default function AreaLavadoLimpieza() {
    const [isLoading, setIsLoading] = useState(true);
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
    
    const [dbProviders, setDbProviders] = useState([]);
    const [dbProducts, setDbProducts] = useState([]);
    
    // Estados de control de la sesión
    const [origenId, setOrigenId] = useState("");
    const [folio, setFolio] = useState("");
    const [currentWeight, setCurrentWeight] = useState("0.00");

    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                const [resProv, resProd] = await Promise.all([
                    axios.get("/api/provedores"),
                    axios.get("/api/productos")
                ]);
                setDbProviders(resProv.data.data || resProv.data);
                
                // Mapeamos los productos para que tengan los campos de "lavado" seteados desde el inicio
                const prodsInciales = (resProd.data.data || resProd.data).map(p => ({
                    ...p,
                    pesoSalida: null,
                    horaEnvio: null,
                    estatus: "PENDIENTE",
                    origenNombre: null
                }));
                setDbProducts(prodsInciales);
            } catch (error) {
                toast.error("Error al cargar catálogos");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCatalogos();
    }, []);

    // Función principal: Al dar click al producto, se setea con la info actual
    const handleSetProductData = (productoId) => {
        if (!origenId) return toast.error("¡Selecciona un Origen primero, wey!");
        if (parseFloat(currentWeight) <= 0) return toast.error("La báscula está en 0");

        const nombreOrigen = dbProviders.find(p => p.IdProveedor == origenId)?.RazonSocial;

        setDbProducts(prev => prev.map(p => {
            if (p.IdProducto === productoId) {
                return {
                    ...p,
                    pesoSalida: currentWeight,
                    horaEnvio: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    estatus: "LIMPIO",
                    origenNombre: nombreOrigen
                };
            }
            return p;
        }));
        
        toast.success("Producto procesado");
        setCurrentWeight("0.00"); // Reset báscula tras pesar
    };

    const totalKilos = dbProducts
        .reduce((acc, p) => acc + (parseFloat(p.pesoSalida) || 0), 0)
        .toFixed(2);

    if (isLoading) return <div className="h-screen flex items-center justify-center"><LoadingDiv /></div>;

    return (
        <div className="h-screen bg-slate-100 p-6 flex flex-col gap-6">
            {/* PANEL SUPERIOR */}
            <header className="bg-white p-6 rounded-3xl shadow-sm flex justify-between items-center border-b-4 border-blue-500">
                <div>
                    <h1 className="text-2xl font-black uppercase text-slate-800">Área Lavado de Limpieza</h1>
                    <div className="flex gap-4 mt-2">
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">FOLIO: {folio || '---'}</span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">TOTAL: {totalKilos} KG</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <input 
                        type="text" 
                        placeholder="Folio..."
                        className="rounded-xl border-slate-200 bg-slate-50 text-xs font-mono p-3 w-24 text-center"
                        value={folio}
                        onChange={(e) => setFolio(e.target.value)}
                    />
                    <select 
                        className="rounded-xl border-slate-200 bg-slate-50 text-xs font-bold p-3 w-64 focus:ring-blue-500"
                        value={origenId}
                        onChange={(e) => setOrigenId(e.target.value)}
                    >
                        <option value="">-- Seleccionar Origen --</option>
                        {dbProviders.map(p => <option key={p.IdProveedor} value={p.IdProveedor}>{p.RazonSocial}</option>)}
                    </select>
                </div>
            </header>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* GRID DE PRODUCTOS SETEADOS */}
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dbProducts.map((p) => (
                            <button
                                key={p.IdProducto}
                                onClick={() => handleSetProductData(p.IdProducto)}
                                className={`relative p-5 rounded-[2rem] text-left transition-all border-2 flex flex-col justify-between h-44 shadow-sm hover:shadow-md ${p.estatus === "LIMPIO" ? "border-green-500 bg-white" : "border-transparent bg-white hover:border-blue-300"}`}
                            >
                                <div>
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">{p.Nombre}</span>
                                        <span className={`text-[9px] font-black px-2 py-1 rounded-full ${p.estatus === "LIMPIO" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                                            {p.estatus}
                                        </span>
                                    </div>
                                    
                                    {p.estatus === "LIMPIO" ? (
                                        <div className="mt-3 space-y-1">
                                            <p className="text-[10px] text-blue-600 font-bold uppercase leading-tight">📍 {p.origenNombre}</p>
                                            <p className="text-3xl font-mono font-black text-slate-800">{p.pesoSalida} <span className="text-xs uppercase">{p.UnidadMedida}</span></p>
                                        </div>
                                    ) : (
                                        <div className="mt-4 flex flex-col items-center justify-center opacity-20">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                                        </div>
                                    )}
                                </div>

                                {p.horaEnvio && (
                                    <div className="mt-auto pt-2 border-t border-slate-50 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400">ENVÍO: {p.horaEnvio}</span>
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CONTROL BÁSCULA LADO DERECHO */}
                <aside className="w-80 flex flex-col gap-4">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-center text-white shadow-2xl border-b-8 border-blue-600">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Peso Actual de Salida</p>
                        <div className="flex items-baseline justify-center gap-2">
                            <span className="text-6xl font-mono font-black text-blue-400">{currentWeight}</span>
                            <span className="text-xs font-bold text-blue-800 uppercase">KG</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setCurrentWeight((Math.random() * 20 + 2).toFixed(2))}
                        className="bg-slate-700 text-white font-black py-4 rounded-2xl uppercase text-xs active:scale-95 transition-all"
                    >
                        Simular Báscula
                    </button>

                    <div className="flex-1 flex flex-col justify-end gap-3">
                         <button
                            onClick={() => setIsFinishModalOpen(true)}
                            disabled={!dbProducts.some(p => p.estatus === "LIMPIO")}
                            className="w-full bg-blue-600 text-white font-black py-8 rounded-3xl uppercase text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:grayscale transition-all"
                        >
                            Finalizar Lote
                        </button>
                        
                        <button 
                            onClick={() => setDbProducts(prev => prev.map(p => ({...p, estatus: "PENDIENTE", pesoSalida: null, horaEnvio: null})))}
                            className="text-[10px] font-black text-slate-400 uppercase hover:text-red-500 transition-colors"
                        >
                            Limpiar Tablero
                        </button>
                    </div>
                </aside>
            </div>

            <FinishSessionDialog 
                isOpen={isFinishModalOpen}
                closeModal={() => setIsFinishModalOpen(false)}
                total={totalKilos}
                onConfirm={() => {
                    const enviables = dbProducts.filter(p => p.estatus === "LIMPIO");
                    console.log("Enviando a limpieza:", enviables);
                    toast.success("Lote guardado con éxito");
                    setIsFinishModalOpen(false);
                }}
            />
        </div>
    );
}

// Modal simple de cierre
function FinishSessionDialog({ isOpen, closeModal, total, onConfirm }) {
    return (
        <Transition show={isOpen}>
            <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-sm rounded-[2.5rem] bg-white p-8 shadow-2xl text-center">
                        <DialogTitle className="text-xl font-black uppercase mb-4 text-slate-800">Finalizar Lavado</DialogTitle>
                        <p className="text-sm text-slate-500 mb-6 font-bold uppercase tracking-tight">Vas a registrar un total de <br/><span className="text-3xl text-blue-600">{total} KG</span></p>
                        <div className="flex gap-3">
                            <button onClick={closeModal} className="flex-1 py-3 text-xs font-black text-slate-400 uppercase">Cerrar</button>
                            <button onClick={onConfirm} className="flex-2 px-8 py-3 bg-blue-600 text-white font-black rounded-2xl uppercase text-xs shadow-lg shadow-blue-100">Confirmar</button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>

        //ola
    );
} 