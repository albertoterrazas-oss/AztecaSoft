import { useEffect, useState, useCallback, useRef } from "react";
import { Toaster, toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";

// --- CONFIGURACIÓN DE RUTAS ---
const route = (name) => {
    const routeMap = {
        "provedores.index": "/api/provedores",
        "productos.index": "/api/productos",
        "Lotes": "/api/Lotes",
        "pesaje.store": "/api/pesaje/guardar-lote",
    };
    return routeMap[name] || `/${name}`;
};

const AREAS = [
    { id: 1, nombre: "Limpieza" },
    { id: 2, nombre: "Subproductos" },
    { id: 3, nombre: "Venta" }
];

export default function WeighingDashboard() {
    // ESTADOS PRINCIPALES
    const [lotes, setLotes] = useState([]);
    const [selectedLote, setSelectedLote] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dbProducts, setDbProducts] = useState([]); // Catálogo general
    const [records, setRecords] = useState([]); // Detalles del lote seleccionado (Autorizaciones)

    // ESTADOS DE FORMULARIO
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedArea, setSelectedArea] = useState(1);
    const [currentWeight, setCurrentWeight] = useState("0.00");
    const [tara, setTara] = useState("0.00");

    const hasFetchedInitialData = useRef(false);
    const netWeight = Math.max(0, (parseFloat(currentWeight) - parseFloat(tara))).toFixed(2);

    // 1. OBTENER LOTES ACTIVOS (ESTATUS 1)
    const fetchLotes = useCallback(async () => {
        try {
            const res = await axios.get(route("Lotes"));
            setLotes(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error al actualizar lotes", error);
        }
    }, []);

    // 2. CARGA INICIAL
    useEffect(() => {
        if (hasFetchedInitialData.current) return;
        const initData = async () => {
            setIsLoading(true);
            try {
                const [resProd] = await Promise.all([
                    axios.get(route("productos.index")),
                    fetchLotes()
                ]);
                const allProducts = resProd.data.data || resProd.data;
                // Filtramos productos que no sean subproductos
                setDbProducts(allProducts.filter(p => p.EsSubproducto == 0));
                hasFetchedInitialData.current = true;
            } catch (error) {
                toast.error("Error de conexión al iniciar el sistema");
            } finally {
                setIsLoading(false);
            }
        };
        initData();
    }, [fetchLotes]);

    // 3. SELECCIÓN DE LOTE
    const handleSelectLote = (lote) => {
        setSelectedLote(lote);
        setRecords(lote.detalles || []);
        setSelectedProduct(null);
    };

    // 4. LÓGICA DE CONTROL DE PRODUCTOS (BLOQUEO POR ESTATUS)
    const getProductStats = (productId) => {
        const detail = records.find(r => 
            String(r.id_producto) === String(productId) || String(r.IdProducto) === String(productId)
        );

        return {
            exists: !!detail,
            total: parseFloat(detail?.kilos || 0).toFixed(2),
            isCompleted: String(detail?.estatus) === "1" // BLOQUEO SI ES "1"
        };
    };

    const totalKilosLote = records.reduce((acc, rec) => acc + parseFloat(rec.kilos || 0), 0).toFixed(2);

    // 5. GUARDAR PESAJE
    const registrarSalida = async () => {
        if (isProcessing) return;
        toast.dismiss();

        if (!selectedProduct) return toast.error("Selecciona un producto");
        if (parseFloat(netWeight) <= 0) return toast.error("La báscula está en cero");

        const detalle = records.find(r => 
            String(r.id_producto) === String(selectedProduct.IdProducto) || 
            String(r.IdProducto) === String(selectedProduct.IdProducto)
        );

        if (!detalle) return toast.error("Producto no autorizado");
        if (String(detalle.estatus) === "1") return toast.error("Este producto ya fue completado");

        setIsProcessing(true);
        const toastId = toast.loading("Registrando peso...");

        try {
            const payload = {
                id_encabezado: selectedLote.id_encabezado,
                id_detalle: detalle.id_detalle,
                id_producto: selectedProduct.IdProducto,
                cantidad: netWeight,
                tara: tara,
                id_area: selectedArea,
                departamentoPadre: selectedLote.departamentoPadre || null
            };

            const response = await axios.post(route("pesaje.store"), payload);

            if (response.data.lote_cerrado) {
                toast.success("¡Lote cerrado!", { id: toastId });
                setSelectedLote(null);
                fetchLotes();
            } else {
                // Refrescamos datos locales para actualizar estatus y kilos en la tabla
                const resLotes = await axios.get(route("Lotes"));
                const freshLotes = resLotes.data;
                setLotes(freshLotes);
                
                const updatedLote = freshLotes.find(l => l.id_encabezado === selectedLote.id_encabezado);
                if (updatedLote) setRecords(updatedLote.detalles || []);

                setCurrentWeight("0.00");
                setTara("0.00");
                setSelectedProduct(null);
                toast.success("Peso registrado", { id: toastId });
            }
        } catch (error) {
            toast.error("Error: " + (error.response?.data?.message || "Error de red"), { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center"><LoadingDiv /></div>;

    // --- VISTA 1: LISTADO DE LOTES ---
    if (!selectedLote) {
        return (
            <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center">
                {/* <Toaster position="top-right" richColors /> */}
                <div className="w-full max-w-4xl text-center">
                    <header className="mb-10 uppercase tracking-tighter">
                        <div className="flex items-center justify-center gap-2 mb-2 font-black text-slate-400 text-[10px]">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            SISTEMA DE PESAJE ACTIVO LIMPIEZA SSS
                        </div>
                        <h1 className="text-4xl font-black text-slate-800">Seleccionar Lote</h1>
                    </header>
                    <div className="grid gap-4">
                        {lotes.length > 0 ? lotes.map((lote) => (
                            <button key={lote.id_encabezado} onClick={() => handleSelectLote(lote)} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center justify-between hover:border-red-500 transition-all group shadow-sm">
                                <div className="text-left">
                                    <span className="text-[10px] font-black text-red-600 tracking-widest uppercase">Lote Limpieza #{lote.folio}</span>
                                    <h3 className="text-xl font-black text-slate-800 uppercase leading-none">{lote.provedor?.RazonSocial || 'Desconocido'}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase italic">{lote.fecha}</p>
                                </div>
                                <div className="bg-slate-50 group-hover:bg-red-600 group-hover:text-white p-4 rounded-2xl transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </div>
                            </button>
                        )) : (
                            <div className="bg-white p-12 rounded-[3rem] border-2 border-dashed border-slate-300">
                                <p className="text-slate-500 font-bold uppercase">No hay lotes con estatus 1</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- VISTA 2: DASHBOARD DE OPERACIÓN ---
    return (
        <div className="h-screen bg-slate-100 p-4 font-sans overflow-hidden flex flex-col lg:flex-row gap-6">
            {/* <Toaster position="top-right" richColors /> */}
            
            {/* IZQUIERDA: CATÁLOGO Y TABLA */}
            <div className="flex-[2.5] flex flex-col gap-4 overflow-hidden">
                <header className="flex justify-between items-end">
                    <div>
                        <button onClick={() => setSelectedLote(null)} className="text-[9px] font-black text-slate-400 uppercase mb-1 hover:text-red-600">← Cambiar Lote</button>
                        <h1 className="text-3xl font-black uppercase text-slate-800 leading-none">{selectedLote.provedor?.RazonSocial}</h1>
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest font-mono">FOLIO: {selectedLote.folio}</p>
                    </div>
                    <div className="bg-white px-6 py-2 rounded-2xl border border-slate-200 text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Acumulado Lote</p>
                        <p className="text-2xl font-black text-slate-800">{totalKilosLote} KG</p>
                    </div>
                </header>

                {/* BOTONES DE PRODUCTOS CON BLOQUEO */}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 overflow-y-auto pr-2 min-h-[160px]">
                    {dbProducts
                        .map(p => ({ ...p, stats: getProductStats(p.IdProducto) }))
                        .sort((a, b) => b.stats.exists - a.stats.exists || a.stats.isCompleted - b.stats.isCompleted)
                        .map((p) => {
                            const { exists, total, isCompleted } = p.stats;
                            const isDisabled = !exists || isProcessing || isCompleted;

                            return (
                                <button
                                    key={p.IdProducto}
                                    disabled={isDisabled}
                                    onClick={() => setSelectedProduct(p)}
                                    className={`p-3 rounded-2xl text-left transition-all border-2 relative h-20 flex flex-col justify-between
                                        ${!exists ? "bg-slate-200 opacity-40 cursor-not-allowed" : ""}
                                        ${isCompleted ? "bg-green-100 border-green-200 opacity-60 cursor-not-allowed" : "bg-white shadow-sm hover:border-slate-300"}
                                        ${selectedProduct?.IdProducto === p.IdProducto ? "border-red-600 scale-105 z-10 shadow-md" : "border-transparent"}`}
                                >
                                    <div className="flex justify-between">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">{p.UnidadMedida}</span>
                                        {isCompleted && <span className="text-green-600 font-black text-[8px]">✓ FIN</span>}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase leading-tight line-clamp-2 ${isCompleted ? 'text-green-700' : 'text-slate-700'}`}>
                                        {p.Nombre}
                                    </span>
                                    {exists && <span className={`absolute bottom-1 right-2 text-[9px] font-black px-1 rounded ${isCompleted ? 'bg-green-200 text-green-800' : 'bg-red-50 text-red-600'}`}>{total}</span>}
                                </button>
                            );
                        })}
                </div>

                {/* TABLA DE HISTORIAL */}
                <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-y-auto h-full">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b text-[9px] font-black text-slate-400 uppercase sticky top-0 z-20">
                                <tr>
                                    <th className="p-4 w-16 text-center">Estatus</th>
                                    <th className="p-4">Producto Autorizado</th>
                                    <th className="p-4 text-center">Planificado</th>
                                    <th className="p-4 text-right">Pesado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {records.map((reg, i) => {
                                    const isDone = String(reg.estatus) === "1";
                                    return (
                                        <tr key={i} className={`text-[11px] font-bold ${isDone ? 'bg-green-50/30' : ''}`}>
                                            <td className="p-4">
                                                <div className="flex justify-center">
                                                    <span className={`h-3 w-3 rounded-full ${isDone ? 'bg-green-500 animate-pulse' : 'bg-yellow-400'}`}></span>
                                                </div>
                                            </td>
                                            <td className="p-4 uppercase text-slate-700">
                                                {reg.producto?.Nombre || `ID: ${reg.id_producto}`}
                                            </td>
                                            <td className="p-4 text-center text-slate-400">{reg.cantidad}</td>
                                            <td className={`p-4 text-right text-base font-black ${isDone ? 'text-green-600' : 'text-slate-800'}`}>
                                                {reg.kilos || 0} KG
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* DERECHA: BÁSCULA */}
            <aside className="w-full lg:w-80 flex flex-col gap-4">
                <div className="bg-slate-900 rounded-[2.5rem] p-5 shadow-2xl border-t-4 border-slate-800 text-center">
                    <div className="text-[9px] font-black uppercase text-slate-500 mb-3 flex justify-between px-2">
                        <span>Terminal 01</span>
                        <span className="text-green-500">Online</span>
                    </div>
                    <div className="bg-[#0f1713] rounded-2xl p-6 border-4 border-slate-950 shadow-inner">
                        <div className="text-6xl font-mono font-black text-green-400 leading-none">{netWeight}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 font-mono">
                        <div className="bg-slate-950/50 p-2 rounded-xl text-slate-400">
                            <p className="text-[7px] uppercase">Bruto</p>
                            <p className="text-lg">{currentWeight}</p>
                        </div>
                        <div className="bg-slate-950/50 p-2 rounded-xl text-blue-400">
                            <p className="text-[7px] uppercase">Tara</p>
                            <p className="text-lg">-{tara}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                        <button disabled={isProcessing} onClick={() => setTara((Math.random() * 1.5).toFixed(2))} className="bg-slate-800 text-white font-black py-4 rounded-2xl uppercase text-[9px]">1. Tarar</button>
                        <button disabled={isProcessing} onClick={() => setCurrentWeight((Math.random() * 40 + 10).toFixed(2))} className="bg-blue-600 text-white font-black py-4 rounded-2xl uppercase text-[9px]">2. Pesar</button>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-slate-200">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-2 text-center">Área de Destino</p>
                        <div className="flex gap-1">
                            {AREAS.map(a => (
                                <button key={a.id} onClick={() => setSelectedArea(a.id)} className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase ${selectedArea === a.id ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-400"}`}>{a.nombre}</button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={registrarSalida}
                        disabled={isProcessing || !selectedProduct || parseFloat(netWeight) <= 0}
                        className={`w-full font-black py-4 rounded-[2rem] uppercase text-2xl border-b-8 shadow-lg transition-all
                            ${(isProcessing || !selectedProduct || parseFloat(netWeight) <= 0)
                                ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                                : "bg-red-600 text-white border-red-800 active:translate-y-1 active:border-b-0"}`}
                    >
                        {isProcessing ? "..." : "Registrar"}
                    </button>
                </div>
            </aside>
        </div>
    );
}