import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { toast, Toaster } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";

// --- HELPERS ---
const route = (name) => {
    const routeMap = {
        "provedores.index": "/api/provedores",
        "productos.index": "/api/productos",
        "Lotes": "/api/Lotes",
        "LoteDetalles": "/api/LoteDetalles",
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
    const [lotes, setLotes] = useState([]);
    const [selectedLote, setSelectedLote] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dbProducts, setDbProducts] = useState([]);
    const [records, setRecords] = useState([]);
    
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedArea, setSelectedArea] = useState(1); 
    const [currentWeight, setCurrentWeight] = useState("0.00");
    const [tara, setTara] = useState("0.00");

    const netWeight = Math.max(0, (parseFloat(currentWeight) - parseFloat(tara))).toFixed(2);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [resProd, resLotes] = await Promise.all([
                    axios.get(route("productos.index")),
                    axios.get(route("Lotes"))
                ]);
                const allProducts = resProd.data.data || resProd.data;
                setDbProducts(allProducts.filter(p => p.EsSubproducto == 0));
                setLotes(resLotes.data);
            } catch (error) { 
                toast.error("Error al cargar datos base"); 
            } finally { 
                setIsLoading(false); 
            }
        };
        fetchData();
    }, []);

    const handleSelectLote = async (lote) => {
        setIsLoading(true);
        try {
            const res = await axios.get(route("LoteDetalles"), { params: { id: lote.id_encabezado } });
            setSelectedLote(lote);
            setRecords(res.data);
            setSelectedProduct(null);
        } catch (error) { 
            toast.error("Error al cargar detalles del lote"); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const getProductStats = (productId) => {
        const productRecords = records.filter(r => 
            String(r.id_producto) === String(productId) || String(r.IdProducto) === String(productId)
        );
        const total = productRecords.reduce((acc, r) => acc + parseFloat(r.cantidad || r.peso || 0), 0);
        return { exists: productRecords.length > 0, total: total.toFixed(2) };
    };

    const totalKilos = records.reduce((acc, rec) => acc + parseFloat(rec.cantidad || rec.peso || 0), 0).toFixed(2);

    const handleRegisterWeight = () => {
        if (!selectedProduct) return;
        const stats = getProductStats(selectedProduct.IdProducto);
        if (!stats.exists) return toast.error("Producto no autorizado");

        const newRecord = {
            id_detalle: Date.now(),
            id_producto: selectedProduct.IdProducto,
            producto: selectedProduct.Nombre,
            cantidad: netWeight,
            tara: tara,
            hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setRecords([newRecord, ...records]);
        setCurrentWeight("0.00");
        setTara("0.00");
        toast.success("Registrado correctamente");
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center"><LoadingDiv /></div>;

    if (!selectedLote) {
        return (
            <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center">
                <Toaster position="top-right" richColors />
                <div className="w-full max-w-4xl">
                    <header className="mb-10 text-center uppercase">
                        <h1 className="text-4xl font-black text-slate-800">Recepciones Activas</h1>
                    </header>
                    <div className="grid gap-4">
                        {lotes.map((lote) => (
                            <button key={lote.id_encabezado} onClick={() => handleSelectLote(lote)} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex items-center justify-between hover:border-red-500 transition-all text-left group">
                                <div>
                                    <span className="text-[10px] font-black text-red-600 uppercase">Lote #{lote.id_encabezado}</span>
                                    <h3 className="text-xl font-black text-slate-800 uppercase">{lote.provedor?.RazonSocial}</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Fecha: {lote.fecha}</p>
                                </div>
                                <div className="bg-slate-50 group-hover:bg-red-600 group-hover:text-white p-4 rounded-2xl transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-slate-100 p-4 font-sans overflow-hidden">
            <Toaster position="top-right" richColors />
            <div className="flex flex-col lg:flex-row gap-6 h-full">

                {/* IZQUIERDA: PRODUCTOS Y TABLA */}
                <div className="flex-[2.5] flex flex-col gap-4 overflow-hidden">
                    <header className="flex justify-between items-end shrink-0">
                        <div>
                            <button onClick={() => setSelectedLote(null)} className="text-[10px] font-black text-slate-400 uppercase mb-1">← Volver a Lotes</button>
                            <h1 className="text-3xl font-black uppercase text-slate-800 tracking-tight leading-none">{selectedLote.provedor?.RazonSocial}</h1>
                            <p className="text-xs font-bold text-red-600 uppercase">ID LOTE: {selectedLote.id_encabezado}</p>
                        </div>
                        <div className="bg-white px-6 py-2 rounded-2xl shadow-sm border border-slate-200 text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Total Acumulado</p>
                            <p className="text-2xl font-black text-slate-800">{totalKilos} KG</p>
                        </div>
                    </header>

                    {/* GRID DE PRODUCTOS: 6 COLUMNAS */}
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 overflow-y-auto pr-2 min-h-[180px]">
                        {dbProducts
                            .map(p => ({ ...p, stats: getProductStats(p.IdProducto) }))
                            .sort((a, b) => b.stats.exists - a.stats.exists)
                            .map((p) => {
                                const { exists, total } = p.stats;
                                return (
                                    <button
                                        key={p.IdProducto}
                                        onClick={() => exists ? setSelectedProduct(p) : toast.error("No programado")}
                                        className={`p-3 rounded-2xl text-left transition-all border-2 relative h-20 flex flex-col justify-between
                                            ${!exists 
                                                ? "bg-slate-200 grayscale opacity-40 border-transparent cursor-not-allowed" 
                                                : "bg-white hover:bg-slate-50"}
                                            ${selectedProduct?.IdProducto === p.IdProducto ? "border-red-600 shadow-md scale-105 z-10" : "border-transparent"}
                                        `}
                                    >
                                        <span className="text-[8px] font-bold text-slate-400 uppercase block">{p.UnidadMedida || 'KG'}</span>
                                        <span className={`text-[10px] font-black uppercase leading-tight line-clamp-2 ${!exists ? "text-slate-500" : "text-slate-700"}`}>
                                            {p.Nombre}
                                        </span>
                                        
                                        {exists && total > 0 && (
                                            <span className="absolute top-1 right-1 text-[9px] font-black text-red-600 bg-red-50 px-1 rounded-md">
                                                {total}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                    </div>

                    {/* TABLA DE REGISTROS */}
                    <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-y-auto h-full">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase sticky top-0 z-20">
                                    <tr><th className="p-4">Hora</th><th className="p-4">Producto</th><th className="p-4 text-center">Tara</th><th className="p-4 text-right">Neto</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {records.map((reg, i) => (
                                        <tr key={i} className="text-xs font-bold hover:bg-slate-50 transition-colors">
                                            <td className="p-4 text-slate-400">{reg.hora || 'Cargado'}</td>
                                            <td className="p-4 uppercase text-slate-700">{reg.producto || 'Autorizado'}</td>
                                            <td className="p-4 text-center text-red-400">-{reg.tara || '0.00'}</td>
                                            <td className="p-4 text-right text-lg font-black text-slate-800">{reg.cantidad || reg.peso} KG</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* DERECHA: BÁSCULA Y REGISTRO (CON SCROLL) */}
                <aside className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto pb-10 pr-1 shrink-0 h-full">
                    {/* MONITOR BÁSCULA */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-5 shadow-2xl border-t-4 border-slate-700 shrink-0">
                        <div className="flex justify-between items-center mb-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                            <span>Báscula Online</span>
                            <span className="text-green-500 animate-pulse">● Estable</span>
                        </div>
                        <div className="bg-[#0f1713] rounded-2xl p-6 border-4 border-slate-950 text-center shadow-[inset_0_2px_10px_rgba(0,0,0,1)] relative">
                             <div className="text-6xl font-mono font-black text-green-400 drop-shadow-[0_0_12px_rgba(74,222,128,0.5)] leading-none">
                                {netWeight}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-700/50 text-center">
                                <p className="text-[7px] font-black text-slate-500 uppercase">Bruto</p>
                                <p className="text-lg font-mono text-slate-400">{currentWeight}</p>
                            </div>
                            <div className={`bg-slate-950/50 p-2 rounded-xl border text-center transition-all ${parseFloat(tara) > 0 ? "border-blue-500/50" : "border-slate-700/50"}`}>
                                <p className="text-[7px] font-black text-blue-500 uppercase">Tara</p>
                                <p className="text-lg font-mono text-blue-400">-{tara}</p>
                            </div>
                        </div>
                    </div>

                    {/* CONTROLES */}
                    <div className="flex flex-col gap-3 shrink-0">
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setTara((Math.random()*1.5).toFixed(2))} className="bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl uppercase text-[9px] border-b-4 border-slate-950 transition-all active:translate-y-1 active:border-b-0">1. Tarar</button>
                            <button onClick={() => setCurrentWeight((Math.random()*40+10).toFixed(2))} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl uppercase text-[9px] border-b-4 border-blue-800 transition-all active:translate-y-1 active:border-b-0">2. Pesar</button>
                        </div>
                        
                        <div className="bg-white p-3 rounded-2xl border border-slate-200">
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-2 text-center">Área de Destino</p>
                             <div className="flex gap-1">
                                {AREAS.map(a => (
                                    <button key={a.id} onClick={() => setSelectedArea(a.id)} className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${selectedArea === a.id ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-400"}`}>{a.nombre}</button>
                                ))}
                             </div>
                        </div>

                        {/* BOTÓN REGISTRAR: AHORA SIEMPRE ACCESIBLE */}
                        <button
                            onClick={handleRegisterWeight}
                            disabled={!selectedProduct || parseFloat(netWeight) <= 0}
                            className={`w-full font-black py-4 rounded-[2rem] uppercase text-2xl border-b-8 transition-all 
                                ${(!selectedProduct || parseFloat(netWeight) <= 0) 
                                    ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed" 
                                    : "bg-red-600 text-white border-red-800 active:border-b-0 active:translate-y-1 shadow-xl hover:bg-red-700"}`}
                        >
                            Registrar
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
}