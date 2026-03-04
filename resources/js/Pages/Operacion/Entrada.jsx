import { useEffect, useState, useCallback, useRef } from "react";
import { Toaster, toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";
import { ChevronLeft, Scale, Package, History, AlertCircle, Loader2 } from 'lucide-react';

const route = (name) => {
    const routeMap = {
        "Lotes": "/api/Lotes",
        "pesaje.store": "/api/pesaje/guardar-lote",
        "AlmacenesListar": "/api/almacenes",
        "ProductosLotes": "/api/ProductosLotes",
    };
    return routeMap[name] || `/${name}`;
};

export default function WeighingDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isFetchingProducts, setIsFetchingProducts] = useState(false);

    const [lotes, setLotes] = useState([]);
    const [selectedLote, setSelectedLote] = useState(null);
    const [dbProducts, setDbProducts] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);
    const [currentWeight, setCurrentWeight] = useState("0.00");
    const [tara, setTara] = useState("0.00");
    const [piezas, setPiezas] = useState(0);

    const hasFetchedInitialData = useRef(false);

    const netWeight = Math.max(0, (parseFloat(currentWeight) - parseFloat(tara))).toFixed(2);
    const totalKilosLote = dbProducts.reduce((acc, p) => acc + parseFloat(p.PesoRegistrado || 0), 0).toFixed(2);
    
    const areaSeleccionadaObj = almacenes.find(a => (a.IdAlmacen || a.id) === selectedArea);
    const esTipoEntrada = (areaSeleccionadaObj?.Nombre || areaSeleccionadaObj?.Departamentos_nombre || '').toUpperCase().includes("ENTRADA");

    // --- PETICIONES ---

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

    const fetchProductosLote = async (idLote) => {
        setIsFetchingProducts(true);
        try {
            const response = await axios.post(route("ProductosLotes"), {
                opcion: 'L',
                idLote: idLote,
                idAlmacen: 1
            });
            
            const mappedProducts = (response.data || []).map(p => ({
                IdProducto: p.idProducto,
                Nombre: p.Producto,
                PiezasTeoricas: p.Piezas,
                PesoRegistrado: p.KG
            }));

            setDbProducts(mappedProducts);
        } catch (error) {
            toast.error("Error al obtener productos");
        } finally {
            setIsFetchingProducts(false);
        }
    };

    useEffect(() => {
        if (hasFetchedInitialData.current) return;
        const initData = async () => {
            setIsLoading(true);
            try {
                await Promise.all([fetchLotes(), fetchAlmacenes()]);
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
        // Normalizamos el objeto para que siempre usemos "Lote" como el ID
        setSelectedLote(lote); 
        setSelectedProduct(null);
        setSelectedArea(null);
        setPiezas(0);
        fetchProductosLote(lote.Lote); // Usamos "Lote" que es "1029" según tu JSON
    };

    const registrarPesaje = async () => {
        if (isProcessing) return;
        
        // Validación corregida para usar .Lote
        if (!selectedLote?.Lote) return toast.error("No hay un lote seleccionado");
        if (!selectedProduct) return toast.error("Selecciona un producto");
        if (!selectedArea) return toast.error("Selecciona el área");

        setIsProcessing(true);
        const toastId = toast.loading("Guardando registro...");

        try {
            const payload = {
                id_lote: selectedLote.Lote, // Enviamos "1029"
                id_producto: selectedProduct.IdProducto,
                cantidad: netWeight,
                piezas: piezas,
                id_area_entrada: 1, 
                id_area_salida: selectedArea,
                idusuario: JSON.parse(localStorage.getItem('perfil'))?.IdUsuario
            };

            const response = await axios.post(route("pesaje.store"), payload);

            if (response.data.lote_cerrado) {
                toast.success("Lote Finalizado", { id: toastId });
                setSelectedLote(null);
                fetchLotes();
            } else {
                await fetchProductosLote(selectedLote.Lote);
                setCurrentWeight("0.00");
                setTara("0.00");
                setPiezas(0);
                setSelectedProduct(null);
                toast.success("Registrado correctamente", { id: toastId });
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Error al registrar";
            toast.error(msg, { id: toastId });
            console.error("Detalle error:", error.response?.data);
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center"><LoadingDiv /></div>;

    if (!selectedLote) {
        return (
            <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-slate-50">
                <div className="max-w-4xl w-full mx-auto">
                    <h1 className="text-4xl font-black text-center mb-10 text-slate-800 uppercase italic tracking-tighter">Panel de Pesaje</h1>
                    <div className="grid gap-4">
                        {lotes.map((lote) => (
                            <button key={lote.Lote} onClick={() => handleSelectLote(lote)} className="bg-white p-6 rounded-[2rem] flex items-center justify-between border border-slate-200 hover:border-red-500 transition-all shadow-sm group">
                                <div className="text-left">
                                    <span className="text-[10px] font-black text-red-600 uppercase">Lote #{lote.Lote}</span>
                                    <h3 className="text-xl font-black text-slate-800 uppercase leading-none">{lote.Proveedor || 'Sin Nombre'}</h3>
                                </div>
                                <div className="bg-slate-50 group-hover:bg-red-600 group-hover:text-white p-4 rounded-2xl transition-all">
                                    <ChevronLeft className="h-6 w-6 rotate-180" strokeWidth={3} />
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

            {isFetchingProducts && (
                <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-red-600" />
                </div>
            )}

            <div className="flex-[2.5] flex flex-col gap-4 overflow-hidden">
                <header className="flex justify-between items-end">
                    <div>
                        <button onClick={() => setSelectedLote(null)} className="text-[9px] font-black text-slate-400 uppercase mb-1 hover:text-red-600 flex items-center gap-1">
                            <ChevronLeft className="w-3 h-3" /> Regresar
                        </button>
                        <h1 className="text-3xl font-black uppercase text-slate-800 leading-none">{selectedLote.Proveedor}</h1>
                        <p className="text-[10px] font-bold text-red-600 font-mono italic">LOTE #{selectedLote.Lote}</p>
                    </div>
                    <div className="bg-white px-6 py-2 rounded-2xl border border-slate-200 text-right shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Acumulado</p>
                        <p className="text-2xl font-black text-slate-800">{totalKilosLote} KG</p>
                    </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto pr-2 custom-scroll">
                    {dbProducts.map((p) => {
                        const isCompleted = parseFloat(p.PesoRegistrado || 0) > 0;
                        const isSelected = selectedProduct?.IdProducto === p.IdProducto;

                        return (
                            <button
                                key={p.IdProducto}
                                disabled={isProcessing || isCompleted}
                                onClick={() => { setSelectedProduct(p); setPiezas(p.PiezasTeoricas || 0); }}
                                className={`p-4 rounded-3xl text-left border-2 h-28 flex flex-col justify-between relative transition-all bg-white shadow-sm
                                    ${isCompleted ? "bg-green-50 border-green-200 opacity-80" : "hover:border-slate-300"}
                                    ${isSelected ? "border-red-600 scale-105 z-10 shadow-md" : "border-transparent"}`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black ${isCompleted ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                                        {p.PiezasTeoricas} PZS
                                    </span>
                                </div>
                                <span className="text-[11px] font-black uppercase leading-tight line-clamp-2">{p.Nombre}</span>
                                <span className="text-[10px] font-black text-slate-500">{parseFloat(p.PesoRegistrado || 0).toFixed(2)} KG</span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b text-[9px] font-black text-slate-400 uppercase sticky top-0">
                            <tr><th className="p-4">Producto</th><th className="p-4 text-center">Piezas</th><th className="p-4 text-right">Peso Registrado</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {dbProducts.map((reg, i) => (
                                <tr key={i} className={`text-[11px] font-bold ${parseFloat(reg.PesoRegistrado) > 0 ? 'bg-green-50/40' : ''}`}>
                                    <td className="p-4 uppercase text-slate-700">{reg.Nombre}</td>
                                    <td className="p-4 text-center"><span className="bg-slate-100 px-2 py-1 rounded font-black">{reg.PiezasTeoricas}</span></td>
                                    <td className="p-4 text-right text-base font-black">{parseFloat(reg.PesoRegistrado || 0).toFixed(2)} KG</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <aside className="w-full lg:w-80 flex flex-col gap-4">
                <div className="bg-slate-900 rounded-[2.5rem] p-5 shadow-2xl text-center border-b-4 border-slate-950">
                    <div className="bg-[#0f1713] rounded-2xl p-6 border-4 border-slate-950 shadow-inner">
                        <div className="text-6xl font-mono font-black text-green-400 leading-none tabular-nums">{netWeight}</div>
                        <span className="text-green-900 font-bold text-[10px] tracking-widest uppercase">Kgs Netos</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-mono">
                        <div className="bg-slate-950 p-2 rounded-xl text-slate-400">Bruto: {currentWeight}</div>
                        <div className="bg-slate-950 p-2 rounded-xl text-blue-400">Tara: -{tara}</div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setTara(currentWeight)} className="bg-slate-800 text-white font-black py-4 rounded-2xl uppercase text-[9px]">Tarar</button>
                        <button onClick={() => setCurrentWeight((Math.random() * 40 + 10).toFixed(2))} className="bg-blue-600 text-white font-black py-4 rounded-2xl uppercase text-[9px]">Simular</button>
                    </div>

                    <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm">
                        <label className="text-[8px] font-black text-slate-400 block mb-1 uppercase text-center tracking-widest">
                            {esTipoEntrada ? "Cant. Bloqueada" : "Captura de Piezas"}
                        </label>
                        <input
                            type="number" value={piezas} onChange={(e) => setPiezas(e.target.value)} disabled={esTipoEntrada}
                            className={`w-full border-none rounded-2xl font-black text-center text-2xl p-3 mb-4 transition-all
                                ${esTipoEntrada ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-800"}`}
                        />
                        <div className="flex flex-wrap gap-1">
                            {almacenes.map(a => {
                                const areaId = a.IdAlmacen || a.id;
                                const nombre = (a.Nombre || a.Departamentos_nombre || '').toUpperCase();
                                const isSelected = selectedArea === areaId;
                                const isEntradaBtn = nombre.includes("ENTRADA");
                                return (
                                    <button key={areaId} onClick={() => setSelectedArea(areaId)} className={`flex-1 min-w-[75px] py-3 rounded-xl text-[8px] font-black uppercase border-2
                                        ${isSelected ? (isEntradaBtn ? "bg-emerald-600 border-emerald-700 text-white" : "bg-slate-800 border-slate-900 text-white") : (isEntradaBtn ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-50 border-transparent text-slate-400")}`}>{nombre}</button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        onClick={registrarPesaje}
                        disabled={isProcessing || !selectedProduct || parseFloat(netWeight) <= 0 || !selectedArea}
                        className={`w-full font-black py-5 rounded-[2.5rem] uppercase text-2xl border-b-[8px] shadow-xl transition-all active:translate-y-1 active:border-b-0
                            ${(isProcessing || !selectedProduct || parseFloat(netWeight) <= 0 || !selectedArea) ? "bg-slate-200 text-slate-400 border-slate-300" : esTipoEntrada ? "bg-emerald-600 text-white border-emerald-800" : "bg-red-600 text-white border-red-800"}`}
                    >
                        {isProcessing ? "..." : (esTipoEntrada ? "Entrada" : "Salida")}
                    </button>
                </div>
            </aside>
        </div>
    );
}