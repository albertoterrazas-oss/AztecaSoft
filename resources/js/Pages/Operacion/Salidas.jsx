import { useEffect, useState, useCallback, useRef } from "react";
import { Toaster, toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";

// --- CONFIGURACIÓN DE RUTAS ---
const route = (name) => {
    const routeMap = {
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
    const [lotes, setLotes] = useState([]);
    const [selectedLote, setSelectedLote] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dbProducts, setDbProducts] = useState([]); 
    const [records, setRecords] = useState([]); 

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedArea, setSelectedArea] = useState(1);
    const [currentWeight, setCurrentWeight] = useState("0.00");
    const [tara, setTara] = useState("0.00");
    const [piezas, setPiezas] = useState(0); // Estado que ahora se auto-completa

    const hasFetchedInitialData = useRef(false);
    const netWeight = Math.max(0, (parseFloat(currentWeight) - parseFloat(tara))).toFixed(2);

    const fetchLotes = useCallback(async () => {
        try {
            const res = await axios.get(route("Lotes"));
            setLotes(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error al actualizar lotes", error);
        }
    }, []);

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
                setDbProducts(allProducts.filter(p => p.EsSubproducto == 0));
                hasFetchedInitialData.current = true;
            } catch (error) {
                toast.error("Error de conexión");
            } finally {
                setIsLoading(false);
            }
        };
        initData();
    }, [fetchLotes]);

    const handleSelectLote = (lote) => {
        setSelectedLote(lote);
        setRecords(lote.detalles || []);
        setSelectedProduct(null);
        setPiezas(0);
    };

    // --- ESTA ES LA FUNCIÓN CLAVE ---
    const handleProductSelection = (product) => {
        setSelectedProduct(product);
        
        // Buscamos el detalle de este producto en el lote seleccionado
        const detalle = records.find(r => String(r.IdProducto) === String(product.IdProducto));
        
        if (detalle) {
            // Seteamos las piezas que vienen en el JSON automáticamente
            setPiezas(detalle.Piezas || 0);
        }
    };

    const getProductStats = (productId) => {
        const detail = records.find(r => String(r.IdProducto) === String(productId));
        return {
            exists: !!detail,
            total: parseFloat(detail?.Peso || 0).toFixed(2),
            isCompleted: parseFloat(detail?.Peso || 0) > 0 
        };
    };

    const totalKilosLote = records.reduce((acc, rec) => acc + parseFloat(rec.Peso || 0), 0).toFixed(2);

    const getUserId = () => {
        const perfil = localStorage.getItem('perfil');
        if (perfil) {
            try {
                const parsed = JSON.parse(perfil);
                return parsed.IdUsuario;
            } catch (e) {
                console.error("Error al parsear el perfil", e);
                return null;
            }
        }
        return null;
    };


    const registrarSalida = async () => {
        if (isProcessing) return;
        toast.dismiss();

        if (!selectedProduct) return toast.error("Selecciona un producto");
        if (parseFloat(netWeight) <= 0) return toast.error("La báscula está en cero");

        setIsProcessing(true);
        const toastId = toast.loading("Guardando pesaje...");

        try {
            const payload = {
                id_lote: selectedLote.IdLote,
                id_producto: selectedProduct.IdProducto,
                cantidad: netWeight,
                piezas: piezas, // Se envía lo que esté en el input (auto-completado o editado)
                id_almacen: 1,
                id_area: selectedArea,
                idusuario: getUserId()
            };

            const response = await axios.post(route("pesaje.store"), payload);

            if (response.data.lote_cerrado) {
                toast.success("Lote finalizado", { id: toastId });
                setSelectedLote(null);
                fetchLotes();
            } else {
                const res = await axios.get(route("Lotes"));
                const freshLote = res.data.find(l => l.IdLote === selectedLote.IdLote);
                if (freshLote) setRecords(freshLote.detalles || []);

                setCurrentWeight("0.00");
                setTara("0.00");
                setPiezas(0);
                setSelectedProduct(null);
                toast.success("Registro exitoso", { id: toastId });
            }
        } catch (error) {
            toast.error("Error al registrar", { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center"><LoadingDiv /></div>;

    if (!selectedLote) {
        return (
            <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center">
                <Toaster position="top-right" richColors />
                <div className="w-full max-w-4xl text-center">
                    <header className="mb-10 uppercase">
                        <h1 className="text-4xl font-black text-slate-800">Seleccionar Lote</h1>
                    </header>
                    <div className="grid gap-4">
                        {lotes.map((lote) => (
                            <button key={lote.IdLote} onClick={() => handleSelectLote(lote)} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center justify-between hover:border-red-500 transition-all shadow-sm group">
                                <div className="text-left">
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Lote #{lote.IdLote}</span>
                                    <h3 className="text-xl font-black text-slate-800 uppercase leading-none">{lote.provedor?.RazonSocial}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase italic">{lote.fecha}</p>
                                </div>
                                <div className="bg-slate-50 group-hover:bg-red-600 group-hover:text-white p-4 rounded-2xl transition-all">
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
        <div className="h-screen bg-slate-100 p-4 font-sans overflow-hidden flex flex-col lg:flex-row gap-6">
            <Toaster position="top-right" richColors />
            
            <div className="flex-[2.5] flex flex-col gap-4 overflow-hidden">
                <header className="flex justify-between items-end">
                    <div>
                        <button onClick={() => setSelectedLote(null)} className="text-[9px] font-black text-slate-400 uppercase mb-1 hover:text-red-600">← Volver</button>
                        <h1 className="text-3xl font-black uppercase text-slate-800 leading-none">{selectedLote.provedor?.RazonSocial}</h1>
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest font-mono">ID LOTE: {selectedLote.IdLote}</p>
                    </div>
                    <div className="bg-white px-6 py-2 rounded-2xl border border-slate-200 text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Acumulado</p>
                        <p className="text-2xl font-black text-slate-800">{totalKilosLote} KG</p>
                    </div>
                </header>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 overflow-y-auto pr-2">
                    {dbProducts
                        .map(p => ({ ...p, stats: getProductStats(p.IdProducto) }))
                        .sort((a, b) => b.stats.exists - a.stats.exists)
                        .map((p) => {
                            const { exists, total, isCompleted } = p.stats;
                            return (
                                <button
                                    key={p.IdProducto}
                                    disabled={!exists || isProcessing || isCompleted}
                                    onClick={() => handleProductSelection(p)} // Usamos la nueva función
                                    className={`p-3 rounded-2xl text-left transition-all border-2 h-20 flex flex-col justify-between relative
                                        ${!exists ? "bg-slate-200 opacity-30 cursor-not-allowed" : "bg-white shadow-sm"}
                                        ${isCompleted ? "bg-green-50 border-green-200" : "hover:border-slate-300"}
                                        ${selectedProduct?.IdProducto === p.IdProducto ? "border-red-600 scale-105 z-10 shadow-md" : "border-transparent"}`}
                                >
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">{p.UnidadMedida || 'KG'}</span>
                                    <span className="text-[10px] font-black uppercase leading-tight line-clamp-2 text-slate-700">{p.Nombre}</span>
                                    {exists && <span className="absolute bottom-1 right-2 text-[9px] font-black bg-slate-100 px-1 rounded">{total}</span>}
                                </button>
                            );
                        })}
                </div>

                <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-y-auto h-full">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b text-[9px] font-black text-slate-400 uppercase sticky top-0 z-20">
                                <tr>
                                    <th className="p-4">Producto</th>
                                    <th className="p-4 text-center">Piezas</th>
                                    <th className="p-4 text-center">Decomiso</th>
                                    <th className="p-4 text-right">Peso</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {records.map((reg, i) => (
                                    <tr key={i} className={`text-[11px] font-bold ${parseFloat(reg.Peso) > 0 ? 'bg-green-50/50' : ''}`}>
                                        <td className="p-4 uppercase text-slate-700">ID: {reg.IdProducto}</td>
                                        <td className="p-4 text-center text-slate-400">{reg.Piezas}</td>
                                        <td className="p-4 text-center text-red-400">{reg.Decomiso}</td>
                                        <td className="p-4 text-right text-base font-black text-slate-800">{reg.Peso} KG</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <aside className="w-full lg:w-80 flex flex-col gap-4">
                <div className="bg-slate-900 rounded-[2.5rem] p-5 shadow-2xl text-center">
                    <div className="bg-[#0f1713] rounded-2xl p-6 border-4 border-slate-950 shadow-inner">
                        <div className="text-6xl font-mono font-black text-green-400 leading-none">{netWeight}</div>
                        <span className="text-green-900 font-bold text-[10px]">KILOGRAMOS NETOS</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 font-mono text-[10px]">
                        <div className="bg-slate-950/50 p-2 rounded-xl text-slate-400">BRUTO: {currentWeight}</div>
                        <div className="bg-slate-950/50 p-2 rounded-xl text-blue-400">TARA: -{tara}</div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setTara((Math.random() * 1.5).toFixed(2))} className="bg-slate-800 text-white font-black py-4 rounded-2xl uppercase text-[9px] hover:bg-slate-700">Tarar</button>
                        <button onClick={() => setCurrentWeight((Math.random() * 40 + 10).toFixed(2))} className="bg-blue-600 text-white font-black py-4 rounded-2xl uppercase text-[9px] hover:bg-blue-500">Simular</button>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                        <label className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-widest text-center">Confirmar Piezas</label>
                        {/* INPUT QUE SE ACTUALIZA AL CLICKEAR EL PRODUCTO */}
                        <input 
                            type="number" 
                            value={piezas} 
                            onChange={(e) => setPiezas(e.target.value)} 
                            className="w-full bg-slate-100 border-none rounded-xl font-black text-center text-xl p-2 mb-4 focus:ring-2 focus:ring-red-500 transition-all" 
                        />
                        
                        <div className="flex gap-1">
                            {AREAS.map(a => (
                                <button key={a.id} onClick={() => setSelectedArea(a.id)} className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${selectedArea === a.id ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}>{a.nombre}</button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={registrarSalida}
                        disabled={isProcessing || !selectedProduct || parseFloat(netWeight) <= 0}
                        className={`w-full font-black py-4 rounded-[2rem] uppercase text-2xl border-b-8 shadow-lg transition-all
                            ${(isProcessing || !selectedProduct || parseFloat(netWeight) <= 0)
                                ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                                : "bg-red-600 text-white border-red-800 active:translate-y-1 active:border-b-0 hover:bg-red-500"}`}
                    >
                        {isProcessing ? "..." : "Registrar"}
                    </button>
                </div>
            </aside>
        </div>
    );
}