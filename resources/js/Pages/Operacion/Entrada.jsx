import { useEffect, useState, useCallback, useRef } from "react";
import { Toaster, toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";

const route = (name) => {
    const routeMap = {
        "productos.index": "/api/productos",
        "Lotes": "/api/Lotes",
        "pesaje.store": "/api/pesaje/guardar-lote",
        "AlmacenesListar": "/api/almacenes",
    };
    return routeMap[name] || `/${name}`;
};

export default function WeighingDashboard() {
    const [lotes, setLotes] = useState([]);
    const [selectedLote, setSelectedLote] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dbProducts, setDbProducts] = useState([]);
    const [records, setRecords] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);
    const [currentWeight, setCurrentWeight] = useState("0.00");
    const [tara, setTara] = useState("0.00");
    const [piezas, setPiezas] = useState(0);

    const hasFetchedInitialData = useRef(false);

    const netWeight = Math.max(0, (parseFloat(currentWeight) - parseFloat(tara))).toFixed(2);
    const totalKilosLote = records.reduce((acc, rec) => acc + parseFloat(rec.Peso || 0), 0).toFixed(2);

    // Identificación de Área usando Departamentos_nombre
    const areaSeleccionadaObj = almacenes.find(a => (a.IdAlmacen || a.id) === selectedArea);
    const esTipoEntrada = (areaSeleccionadaObj?.Nombre || areaSeleccionadaObj?.Departamentos_nombre || '').toUpperCase().includes("ENTRADA");

    const fetchLotes = useCallback(async () => {
        try {
            const res = await axios.get(route("Lotes"));
            setLotes(Array.isArray(res.data) ? res.data : []);
        } catch (error) { console.error("Error lotes:", error); }
    }, []);

    const fetchAlmacenes = useCallback(async () => {
        try {
            const res = await axios.get(route("AlmacenesListar"));
            setAlmacenes(res.data);
        } catch (error) { toast.error("Error al cargar áreas"); }
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
            } catch (error) {
                toast.error("Error de conexión");
            } finally {
                setIsLoading(false);
            }
        };
        initData();
    }, [fetchLotes, fetchAlmacenes]);

    const handleSelectLote = (lote) => {
        setSelectedLote(lote);
        setRecords(lote.detalles || []);
        setSelectedProduct(null);
        setSelectedArea(null);
        setPiezas(0);
    };

    const handleProductClick = (p, currentPieces) => {
        setSelectedProduct(p);
        setPiezas(currentPieces || 0);
    };

    const registrarPesaje = async () => {
        if (isProcessing) return;
        if (!selectedProduct) return toast.error("Selecciona un producto");
        if (!selectedArea) return toast.error("Selecciona área");
        if (parseFloat(netWeight) <= 0) return toast.error("Báscula en cero");

        setIsProcessing(true);
        const toastId = toast.loading("Registrando...");

        try {
            const payload = {
                id_lote: selectedLote.IdLote,
                id_producto: selectedProduct.IdProducto,
                cantidad: netWeight,
                piezas: piezas,
                id_area_entrada: 1,
                id_area_salida: selectedArea,
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
                toast.success("Guardado correctamente", { id: toastId });
            }
        } catch (error) {
            toast.error("Error al registrar", { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const getUserId = () => {
        const perfil = localStorage.getItem('perfil');
        try { return JSON.parse(perfil).IdUsuario; } catch (e) { return null; }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center"><LoadingDiv /></div>;

    if (!selectedLote) {
        return (
            <div className="relative h-[100%] pb-4 px-3 overflow-auto blue-scroll">
                {/* <Toaster position="top-right" richColors /> */}
                {/* Contenedor principal para centrado total */}
                <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-slate-50">

                    <div className="max-w-4xl w-full mx-auto">
                        <h1 className="text-4xl font-black text-center mb-10 text-slate-800 uppercase">
                            Panel de entradas y salidas
                        </h1>

                        <div className="grid gap-4">
                            {lotes.length > 0 ? (
                                lotes.map((lote) => (
                                    <button
                                        key={lote.IdLote}
                                        onClick={() => handleSelectLote(lote)}
                                        className="bg-white p-6 rounded-[2rem] flex items-center justify-between border border-slate-200 hover:border-red-500 transition-all shadow-sm group"
                                    >
                                        <div className="text-left">
                                            <span className="text-[10px] font-black text-red-600 uppercase">Lote #{lote.IdLote}</span>
                                            <h3 className="text-xl font-black text-slate-800 uppercase leading-none">{lote.provedor?.RazonSocial}</h3>
                                        </div>
                                        <div className="bg-slate-50 group-hover:bg-red-600 group-hover:text-white p-4 rounded-2xl transition-all">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                /* Estado vacío */
                                <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-white">
                                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-slate-500 font-bold text-lg">No hay lotes disponibles</h3>
                                    <p className="text-slate-400 text-sm">Por el momento no se encontraron registros en esta sección.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-slate-100 p-4 font-sans overflow-hidden flex flex-col lg:flex-row gap-6">
            {/* <Toaster position="top-right" richColors /> */}

            <div className="flex-[2.5] flex flex-col gap-4 overflow-hidden">
                <header className="flex justify-between items-end">
                    <div>
                        <button onClick={() => setSelectedLote(null)} className="text-[9px] font-black text-slate-400 uppercase mb-1 hover:text-red-600">← Volver</button>
                        <h1 className="text-3xl font-black uppercase text-slate-800 leading-none">{selectedLote.provedor?.RazonSocial}</h1>
                        <p className="text-[10px] font-bold text-red-600 font-mono">ID: {selectedLote.IdLote}</p>
                    </div>
                    <div className="bg-white px-6 py-2 rounded-2xl border border-slate-200 text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Acumulado</p>
                        <p className="text-2xl font-black text-slate-800">{totalKilosLote} KG</p>
                    </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-y-auto pr-2">
                    {dbProducts.map((p) => {
                        const detail = records.find(r => String(r.IdProducto) === String(p.IdProducto));
                        const exists = !!detail;
                        const isCompleted = parseFloat(detail?.Peso || 0) > 0;
                        return (
                            <button
                                key={p.IdProducto}
                                disabled={!exists || isProcessing || isCompleted}
                                onClick={() => handleProductClick(p, detail?.Piezas)}
                                className={`p-3 rounded-2xl text-left border-2 h-24 flex flex-col justify-between relative transition-all
                                    ${!exists ? "bg-slate-200 opacity-30 cursor-not-allowed" : "bg-white shadow-sm"}
                                    ${isCompleted ? "bg-green-50 border-green-200" : "hover:border-slate-300"}
                                    ${selectedProduct?.IdProducto === p.IdProducto ? "border-red-600 scale-105 z-10 shadow-md" : "border-transparent"}`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-[8px] font-black text-slate-400 uppercase">{p.UnidadMedida || 'KG'}</span>
                                    {exists && (
                                        <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black">
                                            {detail.Piezas} PZS
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] font-black uppercase leading-tight line-clamp-2 pr-4">{p.Nombre}</span>
                                {exists && (
                                    <span className="absolute bottom-1 right-2 text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded shadow-sm text-slate-700">
                                        {parseFloat(detail.Peso).toFixed(2)} KG
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b text-[9px] font-black text-slate-400 uppercase sticky top-0 z-20">
                            <tr><th className="p-4">Producto</th><th className="p-4 text-center">Piezas</th><th className="p-4 text-right">Peso</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {records.map((reg, i) => (
                                <tr key={i} className={`text-[11px] font-bold ${parseFloat(reg.Peso) > 0 ? 'bg-green-50/50' : ''}`}>
                                    <td className="p-4 uppercase text-slate-700">ID: {reg.IdProducto}</td>
                                    <td className="p-4 text-center">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-black text-[10px]">
                                            {reg.Piezas}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right text-base font-black text-slate-800">{reg.Peso} KG</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <aside className="w-full lg:w-80 flex flex-col gap-4">
                <div className="bg-slate-900 rounded-[2.5rem] p-5 shadow-2xl text-center">
                    <div className="bg-[#0f1713] rounded-2xl p-6 border-4 border-slate-950 shadow-inner">
                        <div className="text-6xl font-mono font-black text-green-400 leading-none">{netWeight}</div>
                        <span className="text-green-900 font-bold text-[10px]">KILOGRAMOS NETOS</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-mono">
                        <div className="bg-slate-950 p-2 rounded-xl text-slate-400 uppercase">Bruto: {currentWeight}</div>
                        <div className="bg-slate-950 p-2 rounded-xl text-blue-400 uppercase">Tara: -{tara}</div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setTara((Math.random() * 1.5).toFixed(2))} className="bg-slate-800 text-white font-black py-4 rounded-2xl uppercase text-[9px]">Tarar</button>
                        <button onClick={() => setCurrentWeight((Math.random() * 40 + 10).toFixed(2))} className="bg-blue-600 text-white font-black py-4 rounded-2xl uppercase text-[9px]">Simular</button>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                        <label className="text-[8px] font-black text-slate-400 block mb-1 uppercase text-center">Cant. Piezas a Registrar</label>
                        <input
                            type="number"
                            value={piezas}
                            onChange={(e) => setPiezas(e.target.value)}
                            // ESTADO: Deshabilitado en Entrada
                            disabled={esTipoEntrada}
                            className={`w-full border-none rounded-xl font-black text-center text-xl p-2 mb-4 transition-all
                                ${esTipoEntrada
                                    ? "bg-emerald-100 text-emerald-700 cursor-not-allowed ring-2 ring-emerald-500/20"
                                    : "bg-slate-100 text-slate-800 focus:ring-2 focus:ring-red-500"
                                }`}
                        />

                        <div className="flex flex-wrap gap-1">
                            {almacenes.map(a => {
                                const areaId = a.IdAlmacen || a.id;
                                const nombre = (a.Nombre || a.Departamentos_nombre || '').toUpperCase();
                                const isSelected = selectedArea === areaId;
                                const isEntrada = nombre.includes("ENTRADA");

                                return (
                                    <button
                                        key={areaId}
                                        onClick={() => setSelectedArea(areaId)}
                                        className={`flex-1 min-w-[70px] py-2 rounded-lg text-[8px] font-black uppercase transition-all border-2
                                            ${isSelected
                                                ? (isEntrada ? "bg-emerald-600 border-emerald-700 text-white" : "bg-slate-800 border-slate-900 text-white")
                                                : (isEntrada ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-slate-100 border-transparent text-slate-400")
                                            }`}
                                    >
                                        {nombre}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        onClick={registrarPesaje}
                        disabled={isProcessing || !selectedProduct || parseFloat(netWeight) <= 0 || !selectedArea}
                        className={`w-full font-black py-4 rounded-[2rem] uppercase text-2xl border-b-8 shadow-lg transition-all
                            ${(isProcessing || !selectedProduct || parseFloat(netWeight) <= 0 || !selectedArea)
                                ? "bg-slate-200 text-slate-400 border-slate-300"
                                : esTipoEntrada
                                    ? "bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-500"
                                    : "bg-red-600 text-white border-red-800 hover:bg-red-500"}`}
                    >
                        {isProcessing ? "..." : (esTipoEntrada ? "Entrada" : "Salida")}
                    </button>
                </div>
            </aside>
        </div>
    );
}