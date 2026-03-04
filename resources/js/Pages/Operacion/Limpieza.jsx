import { useEffect, useState, useCallback, useRef } from "react";
import { Toaster, toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";

const route = (name) => {
    const routeMap = {
        "productos.index": "/api/productos",
        "LotesLimpieza": "/api/LotesLimpieza",
        "pesaje.store": "/api/pesaje/guardar-lote",
        "AlmacenesListar": "/api/almacenes",
    };
    return routeMap[name] || `/${name}`;
};

export default function WeighingDashboard() {
    // ESTADOS PRINCIPALES
    const [lotes, setLotes] = useState([]);
    const [selectedLote, setSelectedLote] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dbProducts, setDbProducts] = useState([]);
    const [records, setRecords] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);

    // ESTADOS DE FORMULARIO Y BÁSCULA
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);
    const [currentWeight, setCurrentWeight] = useState("0.00");
    const [tara, setTara] = useState("0.00");
    const [piezas, setPiezas] = useState(0);

    const hasFetchedInitialData = useRef(false);

    // LÓGICA DE PESAJES
    const pesoBruto = parseFloat(currentWeight || 0);
    const pesoTara = parseFloat(tara || 0);
    const netWeight = Math.max(0, (pesoBruto - pesoTara)).toFixed(2);
    const totalKilosLote = records.reduce((acc, rec) => acc + parseFloat(rec.Peso || 0), 0).toFixed(2);

    const areaLimpiezaObj = almacenes.find(a => (a.Nombre || '').toUpperCase().includes("LIMPIEZA"));
    const idAreaLimpieza = areaLimpiezaObj ? areaLimpiezaObj.IdAlmacen : null;

    // CARGA DE DATOS
    const fetchLotes = useCallback(async () => {
        try {
            const res = await axios.get(route("LotesLimpieza"));
            const data = Array.isArray(res.data) ? res.data : [];
            setLotes(data);
            
            // Si hay un lote seleccionado, actualizar sus records específicos
            if (selectedLote) {
                const freshLote = data.find(l => l.IdLote === selectedLote.IdLote);
                if (freshLote) {
                    setRecords(freshLote.movimientos || []);
                }
            }
        } catch (error) { console.error("Error lotes:", error); }
    }, [selectedLote]);

    const fetchAlmacenes = useCallback(async () => {
        try {
            const res = await axios.get(route("AlmacenesListar"));
            const filtrados = res.data.filter(a => {
                const nombre = (a.Nombre || '').toUpperCase();
                return nombre !== "ENTRADA" && nombre !== "VENTA" && nombre !== "DESHUESE" && nombre !== "RECEPCION";
            });
            setAlmacenes(filtrados);
        } catch (error) { toast.error("Error al cargar almacenes"); }
    }, []);

    useEffect(() => {
        if (hasFetchedInitialData.current) return;
        const initData = async () => {
            setIsLoading(true);
            try {
                const [resProd] = await Promise.all([
                    axios.get(route("productos.index")),
                    fetchLotes(),
                    fetchAlmacenes()
                ]);
                const allProducts = resProd.data.data || resProd.data;
                setDbProducts(allProducts.filter(p => p.EsSubproducto == 0));
                hasFetchedInitialData.current = true;
            } catch (error) { toast.error("Error de conexión"); }
            finally { setIsLoading(false); }
        };
        initData();
    }, [fetchLotes, fetchAlmacenes]);

    // MANEJADORES
    const handleSelectLote = (lote) => {
        setSelectedLote(lote);
        setRecords(lote.movimientos || []);
        resetForm();
        const congelacion = almacenes.find(a => a.Nombre.toUpperCase().includes("CONGELACION"));
        if (congelacion) setSelectedArea(congelacion.IdAlmacen);
    };

    const resetForm = () => {
        setSelectedProduct(null);
        setPiezas(0);
        setCurrentWeight("0.00");
        setTara("0.00");
    };

    const handleProductClick = (p, currentPieces) => {
        setSelectedProduct(p);
        setPiezas(currentPieces || 0);
        setCurrentWeight("0.00");
        setTara("0.00");
    };

    const getUserId = () => {
        const perfil = localStorage.getItem('perfil');
        try { return JSON.parse(perfil).IdUsuario; } catch (e) { return null; }
    };

    const registrarPesaje = async () => {
        if (isProcessing) return;
        if (!selectedProduct) return toast.error("Selecciona un producto");
        if (parseFloat(netWeight) <= 0) return toast.error("Báscula en cero");

        setIsProcessing(true);
        const toastId = toast.loading("Guardando pesaje...");

        try {
            const payload = {
                id_lote: selectedLote.IdLote,
                id_producto: selectedProduct.IdProducto,
                cantidad: netWeight,
                piezas: piezas,
                id_area_entrada: idAreaLimpieza,
                id_area_salida: selectedArea,
                idusuario: getUserId()
            };

            const response = await axios.post(route("pesaje.store"), payload);

            if (response.data.lote_cerrado) {
                toast.success("Lote finalizado con éxito", { id: toastId });
                setSelectedLote(null);
                fetchLotes();
            } else {
                // AQUÍ ESTÁ EL TRUCO: Refrescamos los datos del lote inmediatamente
                await fetchLotes(); 
                resetForm();
                toast.success("Pesaje registrado correctamente", { id: toastId });
            }
        } catch (error) {
            toast.error("Error al registrar: " + (error.response?.data?.message || "Error de red"), { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-100 font-black"><LoadingDiv /></div>;

    if (!selectedLote) {
        return (
            <div className="min-h-screen bg-slate-100 p-8 text-slate-800 uppercase font-black flex flex-col justify-center items-center">
                <Toaster position="top-center" richColors />
                <div className="max-w-4xl w-full mx-auto">
                    <h1 className="text-4xl text-center mb-10">PANEL DE LIMPIEZA</h1>
                    <div className="grid gap-4">
                        {lotes.length > 0 ? (
                            lotes.map((lote) => (
                                <button key={lote.IdLote} onClick={() => handleSelectLote(lote)} className="bg-white p-6 rounded-[2rem] flex items-center justify-between border border-slate-200 hover:border-red-600 transition-all shadow-sm group">
                                    <div className="text-left">
                                        <span className="text-[10px] text-red-600">Lote #{lote.IdLote}</span>
                                        <h3 className="text-xl leading-none">{lote.provedor?.RazonSocial}</h3>
                                    </div>
                                    <div className="bg-slate-50 group-hover:bg-red-600 group-hover:text-white p-4 rounded-2xl transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="bg-white/50 border-2 border-dashed border-slate-300 rounded-[2rem] p-12 text-center">
                                <h2 className="text-xl text-slate-500">No hay lotes pendientes</h2>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-slate-200 p-4 gap-4 overflow-hidden font-black uppercase">
            <Toaster position="top-center" richColors />

            {/* SECCIÓN IZQUIERDA: LISTADO DE PRODUCTOS */}
            <div className="flex-1 flex flex-col gap-4 min-h-0">
                <header className="flex justify-between items-center bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-300">
                    <div>
                        <button onClick={() => setSelectedLote(null)} className="text-[10px] text-slate-400 hover:text-red-600 mb-1 block">← VOLVER A LOTES</button>
                        <h1 className="text-2xl text-slate-800 leading-none">{selectedLote.provedor?.RazonSocial}</h1>
                        <p className="text-[10px] text-red-600">ID LOTE: {selectedLote.IdLote}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-slate-400">TOTAL PROCESADO</p>
                        <p className="text-3xl text-slate-800">{totalKilosLote} KG</p>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto pr-2 custom-scroll">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {dbProducts.map((p) => {
                            const detail = records.find(r => String(r.IdProducto) === String(p.IdProducto));
                            const exists = !!detail;
                            const isCompleted = exists && parseFloat(detail.Peso || 0) > 0;

                            return (
                                <button
                                    key={p.IdProducto}
                                    disabled={!exists || isProcessing}
                                    onClick={() => handleProductClick(p, detail?.Piezas)}
                                    className={`p-4 rounded-[2rem] text-left border-4 h-36 flex flex-col justify-between relative transition-all
                                        ${!exists ? "bg-slate-300 opacity-20 cursor-not-allowed border-transparent" : "bg-white shadow-md"}
                                        ${selectedProduct?.IdProducto === p.IdProducto ? "border-red-600 scale-105 z-10 shadow-xl" : "border-white"}
                                        ${isCompleted ? "bg-emerald-500 text-white !border-emerald-600" : ""}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={`text-[9px] ${isCompleted ? "text-emerald-100" : "text-slate-400"}`}>{p.UnidadMedida || 'KG'}</span>
                                        {exists && (
                                            <span className={`${isCompleted ? "bg-white text-emerald-600" : "bg-blue-600 text-white"} text-[10px] px-2 py-0.5 rounded-lg font-bold`}>
                                                {detail.Piezas} PZS
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-[12px] leading-tight line-clamp-2 pr-2 ${isCompleted ? "text-black" : "text-slate-800"}`}>
                                        {p.Nombre}
                                    </span>
                                    {exists && (
                                        <span className={`absolute bottom-3 right-4 text-[12px] px-2 py-0.5 rounded shadow-sm ${isCompleted ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                                            {parseFloat(detail.Peso || 0).toFixed(2)} KG
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* SECCIÓN DERECHA: PANEL DE CONTROL Y PESA */}
            <aside className="w-full lg:w-[420px] flex flex-col gap-4">
                
                <div className="bg-slate-900 rounded-[3rem] p-6 shadow-2xl border-4 border-slate-800">
                    <div className="bg-[#0f1713] rounded-[2rem] p-8 border-4 border-black shadow-inner mb-6 text-center">
                        <div className="text-8xl font-mono text-green-400 leading-none tracking-tighter">
                            {netWeight}
                        </div>
                        <span className="text-green-900 text-[11px] mt-2 block tracking-[0.3em] font-bold">KILOGRAMOS NETOS</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center">
                            <div className="text-2xl font-mono text-blue-400">{pesoBruto.toFixed(2)}</div>
                            <span className="text-slate-500 text-[8px]">PESO BRUTO</span>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center">
                            <div className="text-2xl font-mono text-red-400">-{pesoTara.toFixed(2)}</div>
                            <span className="text-slate-500 text-[8px]">TARA FIJA</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[3rem] border-4 border-slate-300 shadow-sm flex flex-col gap-5">
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setTara((Math.random() * 1.5).toFixed(2))} className="bg-slate-800 text-white py-5 rounded-2xl text-[11px] border-b-8 border-black active:translate-y-2 active:border-b-0 transition-all">ESTABLECER TARA</button>
                        <button onClick={() => setCurrentWeight((Math.random() * 40 + 10).toFixed(2))} className="bg-blue-600 text-white py-5 rounded-2xl text-[11px] border-b-8 border-blue-900 active:translate-y-2 active:border-b-0 transition-all">SIMULAR BÁSCULA</button>
                    </div>

                    <div>
                        <label className="text-[10px] text-slate-400 block mb-2 text-center tracking-widest">NÚMERO DE PIEZAS</label>
                        <input
                            type="number"
                            value={piezas}
                            onChange={(e) => setPiezas(e.target.value)}
                            className="w-full bg-slate-100 border-4 border-slate-200 rounded-2xl font-black text-center text-5xl p-4 focus:ring-0 focus:border-red-600 transition-all"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-slate-400 text-center">DESTINO: CONGELACIÓN</label>
                        <div className="flex gap-2">
                            {almacenes.filter(a => a.Nombre.toUpperCase().includes("CONGELACION")).map(a => (
                                <button
                                    key={a.IdAlmacen}
                                    onClick={() => setSelectedArea(a.IdAlmacen)}
                                    className={`flex-1 py-4 rounded-2xl text-[12px] transition-all border-b-4 bg-[#facc15] border-[#ca8a04] text-yellow-900 shadow-lg`}
                                >
                                    {a.Nombre} ✓
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={registrarPesaje}
                        disabled={isProcessing || !selectedProduct || parseFloat(netWeight) <= 0 || !selectedArea}
                        className={`w-full py-7 rounded-[2.5rem] text-3xl border-b-[12px] shadow-2xl transition-all
                            ${(isProcessing || !selectedProduct || parseFloat(netWeight) <= 0 || !selectedArea)
                                ? "bg-slate-200 text-slate-400 border-slate-300"
                                : "bg-[#007b3e] text-white border-[#005a2d] hover:bg-[#008f48] active:translate-y-2 active:border-b-0"}`}
                    >
                        {isProcessing ? "GUARDANDO..." : "GUARDAR PESAJE"}
                    </button>
                </div>
            </aside>
        </div>
    );
}