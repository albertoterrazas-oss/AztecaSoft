import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Toaster, toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";

const route = (name) => {
    const routeMap = {
        "productos.index": "/api/productos",
        "Lotes": "/api/Lotes",
        "despiece.store": "/api/despiece/procesar",
        "AlmacenesListar": "/api/almacenes",
    };
    return routeMap[name] || `/${name}`;
};

const RELACIONES_DESHUESE = {
    39: [40, 41], 13: [14, 15, 16, 17, 18], 19: [20, 21, 22],
    23: [24, 25, 26, 27], 29: [30, 31, 32], 5: [8, 9, 10, 11, 12],
    6: [8, 9, 10, 11, 12], 33: [34, 36, 37, 38], 35: [34, 36, 37, 38],
};

export default function WeighingDashboard() {
    const [lotes, setLotes] = useState([]);
    const [selectedLote, setSelectedLote] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dbProducts, setDbProducts] = useState([]);
    const [records, setRecords] = useState([]); 
    const [almacenes, setAlmacenes] = useState([]); 

    const [selectedParent, setSelectedParent] = useState(null); 
    const [selectedChild, setSelectedChild] = useState(null);   
    const [parentFilter, setParentFilter] = useState(null); 
    const [areaOrigen, setAreaOrigen] = useState(null);
    const [areaDestino, setAreaDestino] = useState(null);

    const [despieceList, setDespieceList] = useState([]); 
    const [currentWeight, setCurrentWeight] = useState("0.00");
    const [tara, setTara] = useState("0.00");
    const [piezas, setPiezas] = useState(0);

    const hasFetchedInitialData = useRef(false);

    const netWeight = useMemo(() => {
        const resultado = parseFloat(currentWeight) - parseFloat(tara);
        return Math.max(0, resultado).toFixed(2);
    }, [currentWeight, tara]);

    const productosVisibles = useMemo(() => {
        const idsEnLote = records.map(r => Number(r.IdProducto));
        if (!parentFilter) {
            return dbProducts.filter(p => (p.EsSubproducto == 0 || p.EsSubproducto == "0") && idsEnLote.includes(Number(p.IdProducto)));
        } else {
            const hijosIds = RELACIONES_DESHUESE[parentFilter] || [];
            return dbProducts.filter(p => hijosIds.includes(Number(p.IdProducto)));
        }
    }, [dbProducts, parentFilter, records]);

    const fetchData = useCallback(async () => {
        try {
            const [resProd, resLotes, resAlm] = await Promise.all([
                axios.get(route("productos.index")),
                axios.get(route("Lotes")),
                axios.get(route("AlmacenesListar"))
            ]);
            setDbProducts(resProd.data.data || resProd.data);
            setLotes(resLotes.data);

            const deshuese = resAlm.data.find(a => a.Nombre.toUpperCase().includes("DESHUESE"));
            if (deshuese) setAreaOrigen(deshuese.IdAlmacen);

            const destinosValidos = resAlm.data.filter(a => 
                !a.Nombre.toUpperCase().includes("ENTRADA") && 
                !a.Nombre.toUpperCase().includes("LIMPIEZA") &&
                !a.Nombre.toUpperCase().includes("DESHUESE")
            );
            setAlmacenes(destinosValidos);
        } catch (e) { toast.error("Error de conexión"); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { if (!hasFetchedInitialData.current) { fetchData(); hasFetchedInitialData.current = true; } }, [fetchData]);

    // SIMULADORES RANDOM
    const generarTaraRandom = () => setTara((Math.random() * 5 + 1).toFixed(2));
    const generarPesoRandom = () => {
        setCurrentWeight((45 + Math.random() * 55).toFixed(2));
        // Para el hijo sugerimos piezas random si el usuario no las pone
        if(piezas == 0) setPiezas(Math.floor(Math.random() * 5) + 1);
    };

    const handleProductSelect = (p) => {
        if (RELACIONES_DESHUESE[p.IdProducto] && !parentFilter) {
            // BUSCAR PIEZAS DEL DETALLE DEL LOTE (PADRE)
            const detalleOriginal = records.find(r => Number(r.IdProducto) === Number(p.IdProducto));
            
            setParentFilter(p.IdProducto);
            setSelectedParent({
                ...p,
                piezasOriginales: detalleOriginal?.Piezas || 0,
                pesoOriginal: detalleOriginal?.Peso || 0
            });
            // Limpiamos piezas para empezar el pesaje de hijos
            setPiezas(0); 
        } else {
            setSelectedChild(p);
        }
    };

    const resetSubproceso = () => {
        setParentFilter(null);
        setSelectedParent(null);
        setSelectedChild(null);
        setDespieceList([]);
        setCurrentWeight("0.00");
        setTara("0.00");
        setPiezas(0);
    };

    const agregarAlCarrito = () => {
        if (!selectedChild || parseFloat(netWeight) <= 0) return toast.warning("Realice el pesaje primero");
        setDespieceList(prev => [...prev, {
            id: selectedChild.IdProducto,
            nombre: selectedChild.Nombre,
            peso: parseFloat(netWeight),
            piezas: parseInt(piezas) || 0
        }]);
        setSelectedChild(null);
        setCurrentWeight("0.00");
        setPiezas(0);
        toast.success("Agregado");
    };

    const finalizarProceso = async () => {
        if (!areaDestino || despieceList.length === 0) return;
        setIsProcessing(true);
        const tid = toast.loading("Registrando despiece...");

        try {
            await axios.post(route("despiece.store"), {
                id_lote: selectedLote.IdLote,
                id_producto_origen: selectedParent.IdProducto,
                id_almacen_origen: areaOrigen,
                id_almacen_destino: areaDestino,
                // USAMOS LOS VALORES REALES DEL DETALLE QUE GUARDAMOS EN EL ESTADO
                peso_entrada: selectedParent.pesoOriginal,
                piezas_entrada: selectedParent.piezasOriginales,
                datos_json: JSON.stringify(despieceList.map(i => ({id: i.id, peso: i.peso, piezas: i.piezas})))
            });
            toast.success("¡Completado!", { id: tid });
            setSelectedLote(null);
            resetSubproceso();
            fetchData();
        } catch (e) { toast.error("Error en servidor", { id: tid }); }
        finally { setIsProcessing(false); }
    };

    if (isLoading) return <LoadingDiv />;

    if (!selectedLote) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-black uppercase">
                <div className="w-full max-w-xl">
                    <h1 className="text-2xl mb-8 text-center">Seleccionar Lote</h1>
                    <div className="grid gap-3">
                        {lotes.map(l => (
                            <button key={l.IdLote} onClick={() => { setSelectedLote(l); setRecords(l.detalles || []); }} 
                                className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-200 flex justify-between items-center shadow-sm active:scale-95 transition-all">
                                <div className="text-left"><p className="text-red-600 text-[10px]">LOTE #{l.IdLote}</p><p className="text-lg">{l.provedor?.RazonSocial}</p></div>
                                <span className="text-slate-300 text-[10px]">SELECCIONAR</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-slate-100 flex flex-col overflow-hidden font-black uppercase">
            {/* <Toaster position="top-right" richColors /> */}

            <header className="bg-white p-4 border-b flex justify-between items-center shrink-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => { setSelectedLote(null); resetSubproceso(); }} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl text-[10px]">VOLVER</button>
                    <div><h2 className="text-lg leading-none">{selectedLote.provedor?.RazonSocial}</h2><p className="text-[10px] text-red-600">FOLIO: {selectedLote.IdLote}</p></div>
                </div>
                {selectedParent && (
                    <div className="bg-emerald-500 text-white px-6 py-2.5 rounded-2xl shadow-lg border-b-4 border-emerald-700 flex flex-col items-center">
                        <p className="text-[8px] opacity-80 mb-1">ORIGEN: DESHUESE</p>
                        <p className="text-xs">{selectedParent.Nombre} ({selectedParent.piezasOriginales} PZAS)</p>
                    </div>
                )}
            </header>

            <main className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden">
                <div className="flex-[2.5] flex flex-col gap-4 min-h-0">
                    {parentFilter && (
                        <button onClick={resetSubproceso} className="w-fit bg-black text-white px-8 py-3 rounded-2xl text-[11px] shadow-xl active:scale-95 transition-all">
                            ← CAMBIAR PRODUCTO PADRE
                        </button>
                    )}

                    <div className={`bg-white rounded-[2.5rem] p-5 border-2 transition-all ${despieceList.length > 0 ? 'border-orange-500 shadow-lg' : 'border-slate-200 opacity-50'}`}>
                        <p className="text-[10px] text-slate-400 mb-3 uppercase tracking-widest font-bold">Resumen de Pesaje ({despieceList.length})</p>
                        <div className="flex flex-wrap gap-2">
                            {despieceList.map((item, idx) => (
                                <div key={idx} className="bg-orange-500 text-white px-4 py-2 rounded-full text-[10px] flex items-center gap-3 shadow-md animate-in zoom-in">
                                    <span>{item.nombre}</span><span className="bg-orange-700 px-2 py-0.5 rounded-md">{item.peso} KG</span>
                                    <button onClick={() => setDespieceList(despieceList.filter((_, i) => i !== idx))} className="text-xl">×</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 content-start pb-10">
                        {productosVisibles.map(p => (
                            <button key={p.IdProducto} onClick={() => handleProductSelect(p)}
                                className={`p-4 h-32 rounded-[2.5rem] border-2 text-left flex flex-col justify-between transition-all active:scale-95 shadow-sm
                                ${selectedChild?.IdProducto === p.IdProducto ? 'border-red-600 ring-4 ring-red-100 bg-white' : 'bg-white border-white hover:border-slate-300'}`}>
                                <span className="text-[9px] text-slate-300">{p.UnidadMedida}</span>
                                <p className="text-[11px] leading-tight line-clamp-2">{p.Nombre}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <aside className="w-full lg:w-96 flex flex-col gap-4">
                    <div className="bg-slate-900 rounded-[2.5rem] p-5 shadow-2xl border-4 border-slate-800">
                        <div className="bg-[#0f1713] rounded-3xl p-8 border-4 border-black text-center mb-4">
                            <div className="text-7xl font-mono text-green-400 tracking-tighter leading-none">{netWeight}</div>
                            <p className="mt-2 text-green-900 text-[10px] tracking-[0.4em] uppercase">Peso Neto</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-white">
                            <div className="bg-black/40 p-2 rounded-xl text-center border border-white/5"><p className="text-[8px] opacity-40 uppercase">Bruto</p><p className="text-sm font-mono">{currentWeight}</p></div>
                            <div className="bg-black/40 p-2 rounded-xl text-center border border-white/5"><p className="text-[8px] opacity-40 text-red-500 uppercase">Tara</p><p className="text-sm font-mono text-red-500">{tara}</p></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={generarTaraRandom} className="bg-slate-800 text-white py-4 rounded-2xl text-[10px] active:scale-95 shadow-inner">AUTO-TARA</button>
                        <button onClick={generarPesoRandom} className="bg-blue-600 text-white py-4 rounded-2xl text-[10px] active:scale-95 shadow-lg shadow-blue-200">PESAR</button>
                    </div>

                    <div className="bg-white p-6 rounded-[3.5rem] border shadow-sm flex-1 flex flex-col gap-5 overflow-y-auto">
                        <div className="bg-slate-50 p-4 rounded-3xl">
                            <p className="text-[9px] text-slate-400 text-center mb-1 uppercase tracking-widest font-bold">Piezas del Subproducto</p>
                            <input type="number" value={piezas} onChange={(e) => setPiezas(e.target.value)}
                                className="w-full bg-transparent border-none text-center text-4xl outline-none" placeholder="0" />
                        </div>

                        <div className="space-y-2">
                            <p className="text-[9px] text-slate-400 text-center uppercase tracking-widest font-bold">Ruta de Almacén</p>
                            <div className="w-full p-4 rounded-2xl text-[10px] bg-emerald-500 border-2 border-emerald-600 text-white flex justify-between items-center shadow-md">
                                <span className="flex items-center gap-2 font-bold uppercase"><span className="w-2 h-2 bg-white rounded-full animate-pulse" /> DESHUESE</span>
                                <span className="bg-emerald-700 px-3 py-1 rounded text-[8px] font-bold">ORIGEN</span>
                            </div>

                            {almacenes.map(a => (
                                <button key={a.IdAlmacen} onClick={() => setAreaDestino(a.IdAlmacen)}
                                    className={`w-full p-4 rounded-2xl text-[10px] border-2 transition-all flex justify-between items-center
                                    ${areaDestino === a.IdAlmacen ? 'bg-yellow-400 border-yellow-500 text-black shadow-lg scale-105 font-bold' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}>
                                    {a.Nombre}{areaDestino === a.IdAlmacen ? <span className="bg-yellow-600 text-white px-3 py-1 rounded text-[8px] font-bold tracking-tighter">DESTINO SALIDA</span> : <span>○</span>}
                                </button>
                            ))}
                        </div>

                        <div className="mt-auto space-y-2">
                            <button onClick={agregarAlCarrito} disabled={!selectedChild}
                                className={`w-full py-4 rounded-2xl text-[11px] font-bold transition-all shadow-sm
                                ${selectedChild ? 'bg-black text-white active:scale-95' : 'bg-slate-100 text-slate-300'}`}>
                                + AGREGAR A LA LISTA
                            </button>

                            <button onClick={finalizarProceso} disabled={despieceList.length === 0 || !areaDestino || isProcessing}
                                className={`w-full py-6 rounded-[2.5rem] text-xl border-b-8 transition-all
                                ${ (despieceList.length > 0 && areaDestino) ? 'bg-red-600 border-red-800 text-white shadow-red-200 active:translate-y-1 active:border-b-0 shadow-lg' : 'bg-slate-100 text-slate-200 border-slate-200'}`}>
                                {isProcessing ? "ENVIANDO..." : "REGISTRAR DESPIECE"}
                            </button>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
}