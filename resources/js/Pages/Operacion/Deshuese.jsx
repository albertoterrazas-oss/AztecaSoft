import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Toaster, toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";
import { Scale, Package, Save, ArrowLeft, Camera, Check, Trash2, ChevronRight } from 'lucide-react';

// --- COMPONENTE MODAL DE BÁSCULA (ESTILO INDUSTRIAL) ---
const BasculaModal = ({
    isOpen, onClose, onConfirm, currentReading, title,
    buttonText, colorClass, subtitle, disabledConfirm,
    showSimulate = false, onSimulate
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-2xl rounded-[4rem] p-10 border-4 border-slate-700 shadow-2xl animate-in zoom-in duration-300">
                <h2 className="text-white text-center text-3xl mb-2 tracking-widest font-black uppercase">{title}</h2>
                <p className="text-slate-500 text-center text-sm mb-8 tracking-widest font-bold uppercase">{subtitle}</p>

                <div className="bg-[#0f1713] rounded-[3rem] p-12 border-8 border-black shadow-inner mb-6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none"></div>
                    <div className="text-[10rem] font-mono text-green-400 leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(74,222,128,0.6)]">
                        {currentReading}
                    </div>
                    <span className="text-green-900 text-sm mt-6 block tracking-[0.5em] font-black uppercase italic">Lectura Actual (KG)</span>
                </div>

                {showSimulate && (
                    <button onClick={onSimulate} className="w-full mb-6 py-5 rounded-2xl bg-blue-600 text-white text-xl font-black hover:bg-blue-500 transition-all border-b-8 border-blue-900 active:translate-y-1 active:border-b-0">
                        OBTENER PESO DE BÁSCULA
                    </button>
                )}

                <div className="flex gap-6">
                    <button onClick={onClose} className="flex-1 py-7 rounded-3xl bg-slate-800 text-white text-xl font-black hover:bg-slate-700 transition-all uppercase border-b-[10px] border-black active:translate-y-2 active:border-b-0">
                        Cancelar
                    </button>
                    <button
                        disabled={disabledConfirm}
                        onClick={onConfirm}
                        className={`flex-1 py-7 rounded-3xl ${colorClass} text-white text-xl font-black shadow-lg uppercase transition-all
                            ${disabledConfirm ? 'opacity-30 cursor-not-allowed' : 'active:translate-y-2 active:border-b-0 border-b-[10px]'}`}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function DeshueseDashboard() {
    const [lotes, setLotes] = useState([]);
    const [dbProducts, setDbProducts] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [records, setRecords] = useState([]);

    const [selectedLote, setSelectedLote] = useState(null);
    const [selectedParent, setSelectedParent] = useState(null);
    const [selectedChild, setSelectedChild] = useState(null);
    const [parentFilter, setParentFilter] = useState(null);
    const [areaDestino, setAreaDestino] = useState(null);

    const [currentWeight, setCurrentWeight] = useState("0.00");
    const [taraGlobal, setTaraGlobal] = useState("0.00");
    const [piezas, setPiezas] = useState("");

    const [showTaraModal, setShowTaraModal] = useState(false);
    const [showPesarModal, setShowPesarModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const RELACIONES_DESHUESE = {
        39: [40, 41], 13: [14, 15, 16, 17, 18], 19: [20, 21, 22],
        23: [24, 25, 26, 27], 29: [30, 31, 32], 5: [8, 9, 10, 11, 12],
        6: [8, 9, 10, 11, 12], 33: [34, 36, 37, 38], 35: [34, 36, 37, 38],
    };

    const netWeight = useMemo(() => {
        const val = parseFloat(currentWeight || 0) - parseFloat(taraGlobal || 0);
        return Math.max(0, val).toFixed(2);
    }, [currentWeight, taraGlobal]);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [resL, resA, resP] = await Promise.all([
                axios.get("/api/LotesDeshuese"),
                axios.get("/api/almacenes"),
                axios.get("/api/productos")
            ]);
            setLotes(resL.data || []);
            setAlmacenes((resA.data || []).filter(a => !["ENTRADA", "LIMPIEZA", 'RECEPCION', 'DESHUESE', 'VENTA'].some(w => a.Nombre.toUpperCase().includes(w))));

            setAreaDestino(resA.data[0]?.IdAlmacen);

            setDbProducts((resP.data || []).map(p => ({
                IdProducto: Number(p.idProducto || p.IdProducto),
                Nombre: p.Producto || p.Nombre,
                EsSubproducto: Number(p.EsSubproducto) || 0
            })));
        } catch (e) { toast.error("Error de conexión"); } finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleLoteSelect = async (lote) => {
        setSelectedLote(lote);
        try {
            const res = await axios.post("/api/ProductosLotes", { opcion: 'L', Lote: lote.Lote, idAlmacen: 3 });
            setRecords(res.data || []);
            setTimeout(() => setShowTaraModal(true), 400);
        } catch (e) { toast.error("Error al cargar existencias"); }
    };

    const registrarDeshuese = async () => {
        setIsProcessing(true);
        try {
            const payload = {
                id_lote: selectedLote.Lote,
                id_producto_origen: selectedParent.IdProducto,
                id_almacen_origen: 3,
                id_almacen_destino: areaDestino,
                peso_entrada: parseFloat(selectedParent.KG) || 0,
                piezas_entrada: parseInt(selectedParent.Piezas),
                datos_json: JSON.stringify([{
                    id: selectedChild.IdProducto,
                    nombre: selectedChild.Nombre,
                    peso: parseFloat(netWeight),
                    piezas: parseInt(piezas) || 0
                }]),
                idusuario: 1
            };
            await axios.post("/api/despiece", payload);
            toast.success("PESAJE GUARDADO");
            setSelectedChild(null);
            setPiezas("");
            setCurrentWeight("0.00");
        } catch (e) { toast.error("Error al guardar"); } finally { setIsProcessing(false); setShowPesarModal(false); }
    };

    const productosVisibles = useMemo(() => {
        if (!parentFilter) {
            const idsStock = records.map(r => Number(r.idProducto || r.IdProducto));
            return dbProducts.filter(p => Number(p.EsSubproducto) === 0 && idsStock.includes(Number(p.IdProducto)));
        }
        const hijos = RELACIONES_DESHUESE[Number(parentFilter)] || [];
        return dbProducts.filter(p => hijos.includes(Number(p.IdProducto)));
    }, [dbProducts, parentFilter, records]);

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-100"><LoadingDiv /></div>;

    if (!selectedLote) {
        return (


            <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center justify-center font-black uppercase">
                <div className="max-w-4xl w-full">
                    <h1 className="text-4xl text-center mb-10 italic font-black text-slate-800">
                        Panel de Pesaje: DESHUESE
                    </h1>

                    <div className="grid gap-4">
                        {lotes.length > 0 ? (
                            lotes.map((lote) => (
                                <button
                                    key={lote.Lote}
                                    onClick={() => handleLoteSelect(lote)}
                                    className="bg-white p-6 rounded-[2.5rem] flex items-center justify-between border-4 border-transparent hover:border-red-600 transition-all shadow-xl group"
                                >
                                    <div className="text-left font-black">
                                        <span className="text-xs text-red-600 uppercase">LOTE #{lote.Lote}</span>
                                        <h3 className="text-2xl leading-none text-slate-700">{lote.Proveedor}</h3>
                                    </div>
                                    <div className="bg-slate-100 group-hover:bg-red-600 group-hover:text-white p-5 rounded-3xl transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </div>
                                </button>
                            ))
                        ) : (
                            /* Mensaje cuando no hay datos */
                            <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border-4 border-dashed border-slate-300 flex flex-col items-center">
                                <span className="text-6xl mb-4 text-slate-300">📦</span>
                                <h2 className="text-2xl text-slate-400 text-center">
                                    No hay lotes activos para pesaje en este momento
                                </h2>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-slate-200 p-4 gap-4 overflow-hidden font-black uppercase">
            {/* <Toaster position="top-center" richColors /> */}

            <BasculaModal
                isOpen={showTaraModal}
                title="PASO 1: PESAR TARA"
                subtitle="Coloque el carro vacío"
                currentReading={currentWeight}
                buttonText="FIJAR TARA"
                colorClass="bg-red-600 border-red-900 shadow-red-600/20"
                onSimulate={() => setCurrentWeight((Math.random() * 5 + 2).toFixed(2))}
                onConfirm={() => { setTaraGlobal(currentWeight); setCurrentWeight("0.00"); setShowTaraModal(false); }}
                onClose={() => { setSelectedLote(null); setShowTaraModal(false); }}
                showSimulate={true}
            />

            <BasculaModal
                isOpen={showPesarModal}
                title="PASO 2: PESO NETO"
                subtitle={selectedChild?.Nombre}
                currentReading={netWeight}
                buttonText="GUARDAR CORTE"
                colorClass="bg-emerald-600 border-emerald-900 shadow-emerald-600/20"
                onSimulate={() => setCurrentWeight((Math.random() * 40 + 10).toFixed(2))}
                onConfirm={registrarDeshuese}
                onClose={() => { setShowPesarModal(false); setCurrentWeight("0.00"); }}
                showSimulate={true}
            />

            <div className="flex-1 flex flex-col min-h-0 gap-4">
                <header className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-md border-b-[10px] border-slate-300">
                    <div>
                        <button onClick={() => { setSelectedLote(null); setParentFilter(null); }} className="text-[10px] text-slate-400 hover:text-red-600 mb-1 block">← CAMBIAR LOTE</button>
                        <h1 className="text-2xl text-slate-800 leading-none">{selectedLote.Proveedor}</h1>
                        <p className="text-[10px] text-blue-600 tracking-widest">LOTE: {selectedLote.Lote} | TARA FIJA: {taraGlobal} KG</p>
                    </div>
                    {selectedParent && (
                        <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl text-[10px] border-b-4 border-emerald-700">
                            ORIGEN: {selectedParent.Nombre}
                        </div>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto custom-scroll pr-2">
                    <div className="mb-4 flex justify-between px-4">
                        <span className="text-xs text-slate-500 tracking-widest">{parentFilter ? "SUBPRODUCTOS DISPONIBLES" : "ELIJA PRODUCTO PADRE (EN STOCK)"}</span>
                        {parentFilter && <button onClick={() => { setParentFilter(null); setSelectedParent(null); setSelectedChild(null); }} className="text-red-600 text-xs underline">VOLVER A PADRES</button>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {productosVisibles.map((p) => (
                            <button
                                key={p.IdProducto}
                                onClick={() => {
                                    if (!parentFilter) {
                                        const r = records.find(rec => Number(rec.idProducto || rec.IdProducto) === p.IdProducto);
                                        setParentFilter(p.IdProducto);
                                        setSelectedParent({ ...p, pesoOriginal: r?.Peso, piezasOriginales: r?.Piezas });
                                    } else {
                                        setSelectedChild(p);
                                    }
                                }}
                                className={`p-4 rounded-[2rem] text-left border-b-[10px] h-36 flex flex-col justify-between transition-all shadow-md active:translate-y-2 active:border-b-0
                                    ${selectedChild?.IdProducto === p.IdProducto ? "border-red-600 bg-white scale-105" : "border-slate-300 bg-white"}`}
                            >
                                <span className={`text-[10px] px-2 py-0.5 rounded-lg w-fit ${p.EsSubproducto ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'}`}>
                                    {p.EsSubproducto ? 'CORTE' : 'PRIMARIO'}
                                </span>
                                <span className="text-[12px] leading-tight text-slate-800 font-black">{p.Nombre}</span>
                            </button>
                        ))}
                    </div>
                </div>


            </div>

            <aside className="w-full lg:w-[400px] flex flex-col gap-4">
                <div className="bg-slate-900 rounded-[3rem] p-8 border-b-[12px] border-black shadow-2xl">
                    <div className="bg-[#0f1713] rounded-[2rem] p-10 border-4 border-black text-center relative overflow-hidden">
                        <div className="text-8xl font-mono text-green-400 leading-none">{netWeight}</div>
                        <span className="text-green-900 text-[10px] mt-4 block tracking-[0.3em] font-black italic">PESO NETO A GUARDAR</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[3rem] border-b-[12px] border-slate-300 flex flex-col gap-4 shadow-xl">
                    <button onClick={() => { setCurrentWeight("0.00"); setShowTaraModal(true); }} className="bg-slate-800 text-white py-5 rounded-2xl text-xs border-b-8 border-black active:translate-y-1 active:border-b-0 transition-all font-black">
                        {parseFloat(taraGlobal) > 0 ? "RE-PESAR TARA" : "1. CONFIGURAR TARA"}
                    </button>

                  
                    <div className="w-full max-w-sm mx-auto p-4">
                        <label className="text-[10px] block mb-4 text-center tracking-widest font-black text-slate-400 uppercase">
                            Piezas Producidas
                        </label>

                        <div className="flex items-stretch gap-2 h-24">
                            {/* BOTÓN MENOS */}
                            <button
                                onClick={() => setPiezas(Math.max(0, parseInt(piezas || 0) - 1))}
                                className="flex-none w-20 bg-slate-200 hover:bg-red-500 hover:text-white rounded-2xl border-b-8 border-slate-300 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center text-4xl font-black"
                            >
                                -
                            </button>

                            {/* INPUT CENTRAL */}
                            <div className="flex-1 relative">
                                <input
                                    type="number"
                                    value={piezas}
                                    onChange={(e) => setPiezas(e.target.value)}
                                    inputMode="none"
                                    className="w-full h-full bg-slate-100 border-b-8 border-slate-200 rounded-2xl font-black text-center text-5xl p-2 outline-none focus:border-blue-600 transition-all appearance-none"
                                    placeholder="0"
                                />
                            </div>

                            {/* BOTÓN MÁS */}
                            <button
                                onClick={() => setPiezas(parseInt(piezas || 0) + 1)}
                                className="flex-none w-20 bg-slate-200 hover:bg-green-500 hover:text-white rounded-2xl border-b-8 border-slate-300 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center text-4xl font-black"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div>
                        {/* <label className="text-[10px] block mb-2 text-center tracking-widest font-black text-slate-400">Destino del Corte</label> */}
                        <div className="grid grid-cols-1 gap-2">
                            {almacenes.map(a => (
                                <button key={a.IdAlmacen} onClick={() => setAreaDestino(a.IdAlmacen)}
                                    className={`py-4 rounded-2xl text-[10px] transition-all border-b-4 font-black ${areaDestino === a.IdAlmacen ? 'bg-yellow-400 border-yellow-600 text-yellow-900' : 'bg-slate-100 border-slate-300 text-slate-400'}`}>
                                    Destino del Corte:    {a.Nombre?.substring(0, 12)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => { setCurrentWeight("0.00"); setShowPesarModal(true); }}
                        disabled={!selectedChild || !areaDestino || isProcessing}
                        className={`w-full py-8 rounded-[2.5rem] text-3xl border-b-[12px] shadow-2xl transition-all font-black
                            ${(!selectedChild || !areaDestino)
                                ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                                : "bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-500 active:translate-y-2 active:border-b-0"}`}
                    >
                        {!selectedParent ? "ELIJA PADRE" : !selectedChild ? "ELIJA CORTE" : !areaDestino ? "ELIJA ÁREA" : "2. PESAR CORTE"}
                    </button>
                </div>
            </aside>
        </div>
    );
}