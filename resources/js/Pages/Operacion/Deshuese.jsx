import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Toaster, toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";

// Mapeo de rutas optimizado para Laravel Resource
const route = (name) => {
    const routeMap = {
        "productos.index": "/api/productos",
        "LotesAreasDeshuese": "/api/LotesAreasDeshuese",
        "AlmacenesListar": "/api/almacenes",
        // "despiece.store": "/api/despiece.store", // Apunta a la raíz del recurso con POST
        "despiece.store": "/api/despiece",

    };
    return routeMap[name] || `/${name}`;
};

const RELACIONES_DESHUESE = {
    39: [40, 41], 13: [14, 15, 16, 17, 18], 19: [20, 21, 22],
    23: [24, 25, 26, 27], 29: [30, 31, 32], 5: [8, 9, 10, 11, 12],
    6: [8, 9, 10, 11, 12], 33: [34, 36, 37, 38], 35: [34, 36, 37, 38],
};

export default function WeighingDashboard() {
    // --- ESTADOS ---
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

    // --- CÁLCULOS ---
    const netWeight = useMemo(() => {
        const resultado = parseFloat(currentWeight) - parseFloat(tara);
        return Math.max(0, resultado).toFixed(2);
    }, [currentWeight, tara]);

    const productosVisibles = useMemo(() => {
        const idsEnLote = [...new Set(records.map(r => Number(r.IdProducto)))];
        if (!parentFilter) {
            return dbProducts.filter(p =>
                (p.EsSubproducto == 0 || p.EsSubproducto == "0") &&
                idsEnLote.includes(Number(p.IdProducto))
            );
        } else {
            const hijosIds = RELACIONES_DESHUESE[parentFilter] || [];
            return dbProducts.filter(p => hijosIds.includes(Number(p.IdProducto)));
        }
    }, [dbProducts, parentFilter, records]);


    const getUserId = () => {
        const perfil = localStorage.getItem('perfil');
        try { return JSON.parse(perfil).IdUsuario; } catch (e) { return null; }
    };

    // --- EFECTOS / DATA FETCHING ---
    const fetchData = useCallback(async () => {
        try {
            const [resProd, resLotes, resAlm] = await Promise.all([
                axios.get(route("productos.index")),
                axios.get(route("LotesAreasDeshuese")),
                axios.get(route("AlmacenesListar"))
            ]);
            setDbProducts(resProd.data.data || resProd.data);
            setLotes(resLotes.data);

            const deshuese = resAlm.data.find(a => a.Nombre.toUpperCase().includes("DESHUESE"));
            if (deshuese) setAreaOrigen(deshuese.IdAlmacen);

            const destinosValidos = resAlm.data.filter(a =>
                !["ENTRADA", "LIMPIEZA", "DESHUESE", "VENTA"].some(word => a.Nombre.toUpperCase().includes(word))
            );
            setAlmacenes(destinosValidos);
        } catch (e) {
            toast.error("Error al cargar datos iniciales");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!hasFetchedInitialData.current) {
            fetchData();
            hasFetchedInitialData.current = true;
        }
    }, [fetchData]);

    // --- MANEJADORES ---
    const handleProductSelect = (p) => {
        if (RELACIONES_DESHUESE[p.IdProducto] && !parentFilter) {
            const mov = records.find(r => Number(r.IdProducto) === Number(p.IdProducto));
            setParentFilter(p.IdProducto);
            setSelectedParent({
                ...p,
                piezasOriginales: mov?.Piezas || 0,
                pesoOriginal: mov?.Peso || 0
            });
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
        if (!selectedChild || parseFloat(netWeight) <= 0) return toast.warning("Peso inválido");
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
        if (!areaDestino || despieceList.length === 0 || !selectedParent) {
            return toast.error("Faltan datos por completar");
        }

        setIsProcessing(true);
        const tid = toast.loading("Registrando en base de datos...");

        try {
            const payload = {
                id_lote: selectedLote.IdLote,
                id_producto_origen: selectedParent.IdProducto,
                id_almacen_origen: areaOrigen,
                id_almacen_destino: areaDestino,
                peso_entrada: parseFloat(selectedParent.pesoOriginal),
                piezas_entrada: parseInt(selectedParent.piezasOriginales),
                datos_json: JSON.stringify(despieceList.map(i => ({
                    id: i.id,
                    peso: i.peso,
                    piezas: i.piezas
                }))),
                idusuario: getUserId()

            };

            // Petición POST explícita
            // await axios.post(route("despiece.store"), payload);

            const response = await axios.post(route("despiece.store"), payload);


            toast.success("¡Despiece guardado correctamente!", { id: tid });
            setSelectedLote(null);
            resetSubproceso();
            fetchData();
        } catch (e) {
            const errorMsg = e.response?.data?.message || "Error de servidor";
            toast.error(errorMsg, { id: tid });
        } finally {
            setIsProcessing(false);
        }
    };

    // --- VISTAS ---
    if (isLoading) return <div className="h-screen flex items-center justify-center"><LoadingDiv /></div>;

    if (!selectedLote) {
        return (
            <div className="min-h-screen bg-slate-100 p-8 text-slate-800 uppercase font-black flex flex-col justify-center items-center">
                <div className="max-w-4xl w-full mx-auto">
                    <h1 className="text-2xl mb-8 text-center text-slate-800">Panel de Deshuese - Lotes Activos</h1>

                    <div className="grid gap-4">
                        {lotes && lotes.length > 0 ? (
                            lotes.map(l => (
                                <button
                                    key={l.IdLote}
                                    onClick={() => { setSelectedLote(l); setRecords(l.movimientos || []); }}
                                    className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-200 flex justify-between items-center shadow-sm active:scale-95 transition-all hover:border-red-500 group w-full"
                                >
                                    <div className="text-left">
                                        <p className="text-red-600 text-[10px]">LOTE #{l.IdLote}</p>
                                        <p className="text-lg text-slate-700 leading-none">{l.provedor?.RazonSocial || 'Sin Proveedor'}</p>
                                        <p className="text-[9px] text-slate-400 mt-1">{l.movimientos?.length || 0} Prod. Disponibles</p>
                                    </div>
                                    <span className="text-slate-300 text-[10px] group-hover:text-red-500 transition-colors font-black">
                                        ENTRAR →
                                    </span>
                                </button>
                            ))
                        ) : (
                            /* Estado Vacío para Deshuese */
                            <div className="bg-white/60 border-2 border-dashed border-slate-300 rounded-[2.5rem] py-16 text-center">
                                <div className="bg-slate-200 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <p className="text-slate-500 text-lg">No hay lotes para deshuese</p>
                                <p className="text-slate-400 text-[10px] normal-case mt-1 font-medium">
                                    Espera a que se asigne un nuevo lote a este departamento.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-[100%] pb-4 px-3 overflow-auto blue-scroll">
            <header className="bg-white p-4 border-b flex justify-between items-center shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => { setSelectedLote(null); resetSubproceso(); }} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl text-[10px]">VOLVER</button>
                    <div>
                        <h2 className="text-lg leading-none">{selectedLote.provedor?.RazonSocial}</h2>
                        <p className="text-[10px] text-red-600">LOTE ACTIVO: {selectedLote.IdLote}</p>
                    </div>
                </div>
                {selectedParent && (
                    <div className="bg-emerald-500 text-white px-6 py-2.5 rounded-2xl shadow-lg">
                        <p className="text-xs text-center">{selectedParent.Nombre}</p>
                    </div>
                )}
            </header>

            <main className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden">
                {/* Panel Izquierdo: Selección de Productos */}
                <div className="flex-[2.5] flex flex-col gap-4 min-h-0">
                    {parentFilter && (
                        <button onClick={resetSubproceso} className="w-fit bg-black text-white px-8 py-3 rounded-2xl text-[11px]">
                            ← VOLVER A PRODUCTOS PADRE
                        </button>
                    )}

                    <div className={`bg-white rounded-[2.5rem] p-5 border-2 transition-all ${despieceList.length > 0 ? 'border-orange-500' : 'border-slate-200 opacity-50'}`}>
                        <div className="flex flex-wrap gap-2">
                            {despieceList.length === 0 && <p className="text-slate-400 text-[10px]">Lista de despiece vacía...</p>}
                            {despieceList.map((item, idx) => (
                                <div key={idx} className="bg-orange-500 text-white px-4 py-2 rounded-full text-[10px] flex items-center gap-3">
                                    <span>{item.nombre} - {item.peso} KG</span>
                                    <button onClick={() => setDespieceList(prev => prev.filter((_, i) => i !== idx))} className="font-bold">×</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
                        {productosVisibles.map(p => (
                            <button key={p.IdProducto} onClick={() => handleProductSelect(p)}
                                className={`p-4 h-32 rounded-[2.5rem] border-2 text-left flex flex-col justify-between transition-all
                                ${selectedChild?.IdProducto === p.IdProducto ? 'border-red-600 bg-red-50' : 'bg-white border-white hover:border-slate-300'}`}>
                                <p className="text-[11px] leading-tight text-slate-700">{p.Nombre}</p>
                                {RELACIONES_DESHUESE[p.IdProducto] && !parentFilter && <span className="text-[8px] text-emerald-600">TIENE HIJOS</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Panel Derecho: Bascula y Acciones */}
                <aside className="w-full lg:w-96 flex flex-col gap-4">
                    <div className="bg-slate-900 rounded-[2.5rem] p-5">
                        <div className="bg-[#0f1713] rounded-3xl p-6 border-4 border-black text-center">
                            <div className="flex justify-between text-green-900 text-[10px] mb-2">
                                <span>BRUTO: {currentWeight}</span>
                                <span>TARA: -{tara}</span>
                            </div>
                            <div className="text-7xl font-mono text-green-400">{netWeight}</div>
                            <p className="text-green-800 text-[10px] mt-2">KILOGRAMOS NETOS</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setTara((Math.random() * 1.5).toFixed(2))} className="bg-slate-800 text-white py-4 rounded-2xl text-[10px]">FIJAR TARA</button>
                        <button onClick={() => setCurrentWeight((20 + Math.random() * 30).toFixed(2))} className="bg-blue-600 text-white py-4 rounded-2xl text-[10px]">CAPTURAR PESO</button>
                    </div>

                    <div className="bg-white p-6 rounded-[3.5rem] border flex-1 flex flex-col gap-4">
                        <input type="number" placeholder="PIEZAS" value={piezas} onChange={(e) => setPiezas(e.target.value)}
                            className="w-full bg-slate-50 rounded-2xl p-3 text-center text-3xl outline-none border-2 border-transparent focus:border-red-500" />

                        <div className="space-y-2 overflow-y-auto max-h-40">
                            <p className="text-[9px] text-slate-400 text-center uppercase">Seleccionar Almacén Destino</p>
                            {almacenes.map(a => (
                                <button key={a.IdAlmacen} onClick={() => setAreaDestino(a.IdAlmacen)}
                                    className={`w-full p-4 rounded-2xl text-[10px] border-2 transition-all
                                    ${areaDestino === a.IdAlmacen ? 'bg-yellow-400 border-yellow-600' : 'bg-slate-50 border-transparent'}`}>
                                    {a.Nombre}
                                </button>
                            ))}
                        </div>

                        <div className="mt-auto space-y-2">
                            <button onClick={agregarAlCarrito} disabled={!selectedChild}
                                className={`w-full py-4 rounded-2xl text-[11px] font-bold ${selectedChild ? 'bg-black text-white' : 'bg-slate-100 text-slate-300'}`}>
                                + AÑADIR A DESPIECE
                            </button>
                            <button onClick={finalizarProceso} disabled={despieceList.length === 0 || !areaDestino || isProcessing}
                                className={`w-full py-6 rounded-[2.5rem] text-xl font-black border-b-8 transition-all
                                ${(despieceList.length > 0 && areaDestino) ? 'bg-red-600 border-red-900 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                {isProcessing ? "GUARDANDO..." : "REGISTRAR TODO"}
                            </button>
                        </div>
                    </div>
                </aside>
            </main>
            {/* <Toaster position="top-right" richColors /> */}
        </div>
    );
}