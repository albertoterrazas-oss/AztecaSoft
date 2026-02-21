import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";
import axios from "axios";

// --- HELPERS ---
const route = (name) => {
    const routeMap = {
        "provedores.index": "/api/provedores",
        "productos.index": "/api/productos",
        "pesaje.store": "/api/pesaje/guardar-lote",
    };
    return routeMap[name] || `/${name}`;
};

const AREAS = [
    { id: 1, nombre: "Limpieza", color: "bg-blue-100 text-blue-700" },
    { id: 2, nombre: "Subproductos", color: "bg-orange-100 text-orange-700" },
    { id: 3, nombre: "Venta", color: "bg-green-100 text-green-700" }
];

const initialSessionData = {
    IdProveedor: "",
    RazonSocial: "",
    folio: "",
    observaciones: "",
};

// --- MODAL DE FINALIZACIÓN ---
function FinishSessionDialog({ isOpen, closeModal, onSubmit, sessionData, totalKilos }) {
    const [obs, setObs] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => { if (isOpen) setObs(""); }, [isOpen]);

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
                    <DialogPanel className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl relative">
                        {loading && <LoadingDiv />}
                        <DialogTitle className="text-xl font-black uppercase text-gray-900 border-b pb-4 mb-6">
                            Finalizar Recepción
                        </DialogTitle>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between bg-slate-50 p-4 rounded-2xl">
                                <span className="text-xs font-bold text-slate-400 uppercase">Total Lote:</span>
                                <span className="font-black text-red-600 text-lg">{totalKilos} KG</span>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <textarea
                                className="w-full rounded-2xl border-gray-100 bg-slate-50 p-4 text-sm h-24 resize-none focus:ring-2 focus:ring-red-500 transition-all"
                                placeholder="Observaciones finales..."
                                value={obs}
                                onChange={(e) => setObs(e.target.value)}
                            />
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-bold text-gray-400">Regresar</button>
                                <button type="submit" className="px-8 py-3 text-sm font-black text-white bg-red-600 rounded-2xl hover:bg-red-700 uppercase">
                                    Guardar y Cerrar
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
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
    const [dbProducts, setDbProducts] = useState([]);
    const [records, setRecords] = useState([]);
    const [sessionData, setSessionData] = useState(initialSessionData);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedArea, setSelectedArea] = useState(1); 
    
    // ESTADOS DE PESO
    const [currentWeight, setCurrentWeight] = useState("0.00");
    const [tara, setTara] = useState("0.00");

    const netWeight = Math.max(0, (parseFloat(currentWeight) - parseFloat(tara))).toFixed(2);

    useEffect(() => {
        const initDashboard = async () => {
            try {
                const [resProv, resProd] = await Promise.all([
                    axios.get(route("provedores.index")),
                    axios.get(route("productos.index"))
                ]);
                const proveedores = resProv.data.data || resProv.data;
                const allProducts = resProd.data.data || resProd.data;
                const filteredProducts = allProducts.filter(p => p.EsSubproducto === 0 || p.EsSubproducto === "0");

                if (proveedores.length > 0) {
                    setSessionData({
                        IdProveedor: proveedores[0].IdProveedor,
                        RazonSocial: proveedores[0].RazonSocial,
                        folio: `AUTO-${Date.now().toString().slice(-4)}`,
                        observaciones: ""
                    });
                }
                setDbProducts(filteredProducts);
                if (filteredProducts.length > 0) setSelectedProduct(filteredProducts[0]);
            } catch (error) {
                toast.error("Error al cargar catálogos");
            } finally {
                setIsLoading(false);
            }
        };
        initDashboard();
    }, []);

    const totalKilos = records.reduce((acc, rec) => acc + parseFloat(rec.peso), 0).toFixed(2);

    // PASO 1: MEDIR TARA (BOTE VACÍO)
    const handleMeasureTara = () => {
        const randomTara = (Math.random() * 1.5 + 0.5).toFixed(2); // Simula bote de 0.5 a 2kg
        setTara(randomTara);
        setCurrentWeight("0.00"); // Reset peso bruto para esperar producto
        toast.success(`Tara fijada: ${randomTara} KG`);
    };

    // PASO 2: MEDIR PRODUCTO (BRUTO)
    const handleMeasureGross = () => {
        if (parseFloat(tara) <= 0) return toast.error("Primero debe medir la tara");
        const randomGross = (Math.random() * 40 + 15).toFixed(2); // Simula peso con producto
        setCurrentWeight(randomGross);
        toast.info("Peso bruto capturado");
    };

    const handleRegisterWeight = () => {
        if (!selectedProduct) return toast.error("Seleccione un producto");
        if (parseFloat(netWeight) <= 0) return toast.error("Capture el peso del producto");

        const areaObj = AREAS.find(a => a.id === selectedArea);
        const newRecord = {
            id: Date.now(),
            IdProducto: selectedProduct.IdProducto,
            producto: selectedProduct.Nombre,
            peso_bruto: currentWeight,
            tara: tara,
            peso: netWeight,
            unidad: selectedProduct.UnidadMedida,
            area: areaObj.nombre,
            areaColor: areaObj.color,
            hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setRecords([newRecord, ...records]);
        setCurrentWeight("0.00");
        setTara("0.00"); // Limpiar para el siguiente bote
        toast.success("Registro completado");
    };

    const submitFinalLote = async (obs) => {
        const payload = { ...sessionData, observaciones: obs, detalles: records, total_kg: totalKilos };
        try {
            await request(route("pesaje.store"), "POST", payload);
            toast.success("Lote guardado");
            setRecords([]);
            setSessionData(prev => ({ ...prev, folio: `AUTO-${Date.now().toString().slice(-4)}` }));
        } catch (e) { throw e; }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center"><LoadingDiv /></div>;

    return (
        <div className="h-[95vh] bg-slate-100 p-4 font-sans overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-6 h-full">

                {/* IZQUIERDA: PRODUCTOS Y TABLA */}
                <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                    <header className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-black text-red-600 uppercase">Proveedor Activo</p>
                            <h1 className="text-3xl font-black uppercase text-slate-800 tracking-tight">{sessionData.RazonSocial}</h1>
                        </div>
                        <div className="bg-white px-6 py-2 rounded-2xl shadow-sm border border-slate-200 text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Acumulado</p>
                            <p className="text-2xl font-black text-slate-800">{totalKilos} <span className="text-xs">KG</span></p>
                        </div>
                    </header>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {dbProducts.map((p) => (
                            <button
                                key={p.IdProducto}
                                onClick={() => setSelectedProduct(p)}
                                className={`p-4 rounded-3xl text-left transition-all border-2 ${selectedProduct?.IdProducto === p.IdProducto ? "border-red-600 bg-white shadow-md scale-105" : "border-transparent bg-white/60 hover:bg-white"}`}
                            >
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">{p.UnidadMedida}</span>
                                <span className="text-xs font-black uppercase text-slate-700 leading-tight">{p.Nombre}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase">
                                <tr>
                                    <th className="p-4 uppercase">Hora</th>
                                    <th className="p-4 uppercase">Producto</th>
                                    <th className="p-4 text-center uppercase">Tara</th>
                                    <th className="p-4 text-right uppercase">Neto</th>
                                    <th className="p-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 overflow-y-auto">
                                {records.map((reg) => (
                                    <tr key={reg.id} className="text-xs font-bold">
                                        <td className="p-4 text-slate-400">{reg.hora}</td>
                                        <td className="p-4 uppercase text-slate-700">{reg.producto}</td>
                                        <td className="p-4 text-center text-red-400">-{reg.tara}</td>
                                        <td className="p-4 text-right text-xl font-black text-slate-800">{reg.peso} <span className="text-[9px]">KG</span></td>
                                        <td className="p-4">
                                            <button onClick={() => setRecords(records.filter(r => r.id !== reg.id))} className="text-slate-200 hover:text-red-500">×</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* DERECHA: ESTACIÓN DE BÁSCULA */}
                <aside className="w-full lg:w-96 flex flex-col gap-4">
                    
                    {/* DISPLAY INDUSTRIAL */}
                    <div className="bg-slate-900 rounded-[3rem] p-6 shadow-2xl border-t-8 border-slate-700">
                        <div className="flex justify-between items-center mb-4 text-[9px] font-black uppercase tracking-widest text-slate-500">
                            <span>Status: Online</span>
                            <span className="text-red-500 animate-pulse">● Rec: {sessionData.folio}</span>
                        </div>

                        {/* PANTALLA LCD */}
                        <div className="bg-[#0f1713] rounded-3xl p-8 border-4 border-slate-950 text-center shadow-[inset_0_2px_10px_rgba(0,0,0,1)]">
                            <span className="absolute top-10 left-12 text-[8px] font-black text-green-900 uppercase tracking-widest">Peso Neto kg</span>
                            <div className="text-7xl font-mono font-black text-green-400 drop-shadow-[0_0_12px_rgba(74,222,128,0.5)] leading-none">
                                {netWeight}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-700/50">
                                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Báscula Bruto</p>
                                <p className="text-xl font-mono text-slate-400">{currentWeight}</p>
                            </div>
                            <div className={`bg-slate-950/50 p-3 rounded-2xl border transition-all ${parseFloat(tara) > 0 ? "border-blue-500/50" : "border-slate-700/50"}`}>
                                <p className="text-[8px] font-black text-blue-500 uppercase mb-1">Tara Guardada</p>
                                <p className="text-xl font-mono text-blue-400">-{tara}</p>
                            </div>
                        </div>
                    </div>

                    {/* CONTROLES DE FLUJO */}
                    <div className="flex flex-col gap-3 p-2">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleMeasureTara}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-black py-5 rounded-3xl uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95 border-b-4 border-slate-950"
                            >
                                1. Tarar Bote
                            </button>
                            <button
                                onClick={handleMeasureGross}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-3xl uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95 border-b-4 border-blue-800"
                            >
                                2. Pesar Producto
                            </button>
                        </div>

                        <div className="bg-white p-4 rounded-3xl border border-slate-200">
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-3 text-center">Área de Destino</p>
                             <div className="flex gap-2">
                                {AREAS.map(a => (
                                    <button 
                                        key={a.id} 
                                        onClick={() => setSelectedArea(a.id)}
                                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${selectedArea === a.id ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-400"}`}
                                    >
                                        {a.nombre}
                                    </button>
                                ))}
                             </div>
                        </div>

                        <button
                            onClick={handleRegisterWeight}
                            disabled={parseFloat(netWeight) <= 0}
                            className={`w-full font-black py-8 rounded-[2.5rem] uppercase text-2xl transition-all border-b-8 ${parseFloat(netWeight) > 0 ? "bg-red-600 text-white border-red-800 shadow-xl shadow-red-200 active:scale-95" : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"}`}
                        >
                            Registrar
                        </button>

                        <button
                            onClick={() => setIsFinishModalOpen(true)}
                            className="text-slate-400 font-black py-2 uppercase text-[10px] hover:text-red-600 transition-colors tracking-widest"
                        >
                            Finalizar Lote
                        </button>
                    </div>
                </aside>
            </div>

            <FinishSessionDialog
                isOpen={isFinishModalOpen}
                closeModal={() => setIsFinishModalOpen(false)}
                onSubmit={submitFinalLote}
                sessionData={sessionData}
                totalKilos={totalKilos}
            />
        </div>
    );
}