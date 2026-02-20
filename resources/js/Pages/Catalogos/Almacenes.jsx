import { useEffect, useState } from "react";
import {
    Dialog,
    DialogPanel,
    DialogTitle,
    Transition,
} from "@headlessui/react";
import { toast } from "sonner";
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";
import axios from "axios";

// --- HELPERS DE RUTA ---
const route = (name, params = {}) => {
    const routeMap = {
        "pesaje.catalogos": "/api/pesaje/catalogos", // Ruta que devuelva proveedores y productos
        "pesaje.store": "/api/pesaje/guardar-lote",
    };
    return routeMap[name] || `/${name}`;
};

const initialSessionData = {
    IdProveedor: "",
    RazonSocial: "",
    folio: "",
    totalLote: "",
    observaciones: "",
};

// --- MODAL DE FINALIZACIÓN (Similar a tu AlmacenFormDialog) ---
function FinishSessionDialog({ isOpen, closeModal, onSubmit, sessionData, records, totalKilos }) {
    const [obs, setObs] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(obs);
            closeModal();
        } catch (error) {
            toast.error("Error al guardar el lote");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={isOpen}>
            <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl relative">
                        {loading && <LoadingDiv />}
                        <DialogTitle className="text-xl font-black uppercase text-gray-900 border-b pb-4 mb-6">
                            Finalizar Recepción
                        </DialogTitle>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between bg-slate-50 p-4 rounded-xl">
                                <span className="text-xs font-bold text-slate-400 uppercase">Total KG:</span>
                                <span className="font-black text-red-600">{totalKilos}</span>
                            </div>
                            <div className="flex justify-between bg-slate-50 p-4 rounded-xl">
                                <span className="text-xs font-bold text-slate-400 uppercase">Proveedor:</span>
                                <span className="font-bold text-slate-700 text-xs">{sessionData.RazonSocial}</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="block">
                                <span className="text-xs font-black text-gray-500 uppercase ml-1">Observaciones:</span>
                                <textarea
                                    className="mt-1 block w-full rounded-xl border-gray-200 bg-slate-50 p-3 text-sm h-24 resize-none focus:ring-red-500 focus:border-red-500"
                                    placeholder="Ej. Merma por transporte..."
                                    value={obs}
                                    onChange={(e) => setObs(e.target.value)}
                                />
                            </label>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-bold text-gray-500">
                                    Regresar
                                </button>
                                <button type="submit" className="px-6 py-2 text-sm font-black text-white bg-red-600 rounded-xl hover:bg-red-700 uppercase shadow-lg shadow-red-100">
                                    Guardar Lote
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}

// --- COMPONENTE PRINCIPAL ---
export default function WeighingDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
    
    const [dbProviders, setDbProviders] = useState([]);
    const [dbProducts, setDbProducts] = useState([]);
    
    const [records, setRecords] = useState([]);
    const [sessionData, setSessionData] = useState(initialSessionData);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [currentWeight, setCurrentWeight] = useState("0.00");

    // Carga inicial de catálogos
    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                // Ajustado para usar axios o tu helper request
                const response = await axios.get(route("pesaje.catalogos"));
                setDbProviders(response.data.proveedores);
                setDbProducts(response.data.productos);
                if (response.data.productos.length > 0) setSelectedProduct(response.data.productos[0]);
            } catch (error) {
                toast.error("Error al conectar con el servidor.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCatalogos();
    }, []);

    const totalKilos = records.reduce((acc, rec) => acc + parseFloat(rec.peso), 0).toFixed(2);

    const handleStartSession = (e) => {
        e.preventDefault();
        if (sessionData.IdProveedor && sessionData.folio) {
            setIsSessionActive(true);
            toast.success("Sesión iniciada");
        } else {
            toast.error("Complete los datos de inicio");
        }
    };

    const handleRegisterWeight = () => {
        if (parseFloat(currentWeight) <= 0) return toast.error("Capture un peso válido");
        const newRecord = {
            id: Date.now(),
            IdProducto: selectedProduct.IdProducto,
            producto: selectedProduct.Nombre,
            peso: currentWeight,
            unidad: selectedProduct.UnidadMedida,
            hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setRecords([newRecord, ...records]);
        setCurrentWeight("0.00");
    };

    const submitFinalLote = async (observacionesFinales) => {
        const payload = {
            ...sessionData,
            observaciones: observacionesFinales,
            detalles: records,
            total_kg: totalKilos
        };

        try {
            await request(route("pesaje.store"), "POST", payload);
            toast.success("Lote guardado en la base de datos");
            // Reset
            setIsSessionActive(false);
            setRecords([]);
            setSessionData(initialSessionData);
        } catch (error) {
            throw error;
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center"><LoadingDiv /></div>;

    return (
        <div className="h-[90vh] bg-slate-50 p-4">
            {!isSessionActive ? (
                /* VISTA INICIAL: PREPARAR RECEPCIÓN */
                <div className="flex h-full items-center justify-center">
                    <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                        <h2 className="text-2xl font-black uppercase mb-8 border-l-4 border-red-600 pl-4">Nueva Recepción</h2>
                        <form onSubmit={handleStartSession} className="space-y-6">
                            <label className="block">
                                <span className="text-[10px] font-black text-slate-400 uppercase ml-1">Proveedor</span>
                                <select 
                                    className="mt-1 block w-full rounded-2xl border-transparent bg-slate-50 p-4 font-bold text-slate-700 focus:ring-2 focus:ring-red-500"
                                    onChange={(e) => {
                                        const p = dbProviders.find(x => x.IdProveedor == e.target.value);
                                        setSessionData({...sessionData, IdProveedor: p.IdProveedor, RazonSocial: p.RazonSocial});
                                    }}
                                    required
                                >
                                    <option value="">Seleccione...</option>
                                    {dbProviders.map(p => <option key={p.IdProveedor} value={p.IdProveedor}>{p.RazonSocial}</option>)}
                                </select>
                            </label>
                            <label className="block">
                                <span className="text-[10px] font-black text-slate-400 uppercase ml-1">Folio del Lote</span>
                                <input 
                                    type="text" 
                                    className="mt-1 block w-full rounded-2xl border-transparent bg-slate-50 p-4 font-mono focus:ring-2 focus:ring-red-500"
                                    placeholder="0000"
                                    value={sessionData.folio}
                                    onChange={(e) => setSessionData({...sessionData, folio: e.target.value})}
                                    required
                                />
                            </label>
                            <button type="submit" className="w-full bg-red-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-lg shadow-red-100">
                                Comenzar Pesaje
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                /* VISTA DASHBOARD: PESAJE ACTIVO */
                <div className="flex flex-col lg:flex-row gap-6 h-full">
                    {/* IZQUIERDA: PRODUCTOS E HISTORIAL */}
                    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                        <header className="flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black uppercase text-slate-800">{sessionData.RazonSocial}</h1>
                                <span className="text-xs font-bold text-red-600 uppercase italic">Folio: #{sessionData.folio}</span>
                            </div>
                        </header>

                        {/* GRID PRODUCTOS */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {dbProducts.map(p => (
                                <button 
                                    key={p.IdProducto}
                                    onClick={() => setSelectedProduct(p)}
                                    className={`p-5 rounded-3xl text-left transition-all border-2 ${selectedProduct?.IdProducto === p.IdProducto ? "border-red-600 bg-white shadow-lg" : "border-transparent bg-white shadow-sm"}`}
                                >
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">{p.UnidadMedida}</span>
                                    <span className="text-sm font-black uppercase text-slate-700">{p.Nombre}</span>
                                </button>
                            ))}
                        </div>

                        {/* DATATABLE DE REGISTROS (Reemplazando tu tabla manual) */}
                        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <Datatable 
                                data={records}
                                virtual={true}
                                columns={[
                                    { header: "Hora", accessor: "hora" },
                                    { header: "Producto", accessor: "producto" },
                                    { 
                                        header: "Peso", 
                                        cell: (props) => <span className="font-black text-red-600">{props.item.peso} {props.item.unidad}</span> 
                                    },
                                    {
                                        header: "Acción",
                                        cell: (props) => (
                                            <button 
                                                onClick={() => setRecords(records.filter(r => r.id !== props.item.id))}
                                                className="text-red-400 hover:text-red-600 p-1"
                                            >
                                                Borrar
                                            </button>
                                        )
                                    }
                                ]}
                            />
                        </div>
                    </div>

                    {/* DERECHA: CONTROL BÁSCULA */}
                    <aside className="w-full lg:w-80 flex flex-col gap-4">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-center text-white shadow-2xl">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Peso Actual - {selectedProduct?.Nombre}</p>
                            <div className="flex items-baseline justify-center gap-2">
                                <span className="text-6xl font-mono font-black text-green-400">{currentWeight}</span>
                                <span className="text-xs font-bold text-green-900 uppercase">{selectedProduct?.UnidadMedida}</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => setCurrentWeight((Math.random() * 40 + 5).toFixed(2))}
                            className="bg-blue-600 text-white font-black py-5 rounded-2xl uppercase text-xs tracking-tighter shadow-lg shadow-blue-100 active:scale-95"
                        >
                            Capturar Báscula
                        </button>

                        <button 
                            onClick={handleRegisterWeight}
                            className="bg-red-600 text-white font-black py-10 rounded-3xl uppercase text-xl shadow-xl shadow-red-200 active:scale-95 transition-transform"
                        >
                            Registrar
                        </button>

                        <button 
                            onClick={() => setIsFinishModalOpen(true)}
                            className="mt-auto bg-slate-200 text-slate-600 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-300"
                        >
                            Finalizar Lote
                        </button>
                    </aside>
                </div>
            )}

            {/* MODAL DE CIERRE */}
            <FinishSessionDialog 
                isOpen={isFinishModalOpen}
                closeModal={() => setIsFinishModalOpen(false)}
                onSubmit={submitFinalLote}
                sessionData={sessionData}
                records={records}
                totalKilos={totalKilos}
            />
        </div>
    );
}