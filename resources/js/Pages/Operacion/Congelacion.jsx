import { useEffect, useState, useCallback, useRef } from "react";
import { Toaster, toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";
import BasculaModal from '../../Components/BasculaPesa.jsx';
import { Snowflake, ChevronRight, LayoutGrid, AlertCircle } from 'lucide-react';
import HeaderPanel from '../../Components/HeaderPanel.jsx';

const route = (name) => {
    const routeMap = {
        "LotesCongelacion": "/api/LotesCongelacion",
        "pesaje.store": "/api/pesaje/guardar-lote",
        "AlmacenesRefrigerados": "/api/AlmacenesRefrigerados",
        "AlmacenesListar": "/api/almacenes",
        "ProductosLotesHistorial": "/api/ProductosLotesHistorial",
        "ProductosLotes": "/api/ProductosLotes",
        "MovimientoPrimerPesaje": "/api/MovimientoPrimerPesaje",
        "pesaje.guardar-traspaso": "/api/pesaje/guardar-traspaso",
        "LotesRefirgeradores": "/api/LotesRefirgeradores",
    };
    return routeMap[name] || `/${name}`;
};

// --- MODAL DE ÉXITO ---
const SuccessModal = ({ isOpen, onClose, message, registeredWeight }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-emerald-950/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-10 text-center shadow-[0_0_100px_rgba(16,185,129,0.4)] animate-in zoom-in duration-300 border-t-8 border-emerald-500">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-black text-slate-400 uppercase tracking-widest">¡Guardado!</h2>
                <div className="my-6 bg-slate-900 rounded-3xl p-6 border-4 border-slate-200">
                    <div className="text-5xl font-mono text-emerald-400 font-black">{registeredWeight} <span className="text-xl">KG</span></div>
                    <div className="text-[10px] text-emerald-700 font-black mt-2 tracking-[0.3em] uppercase">Peso Neto Final</div>
                </div>
                <p className="text-slate-500 font-bold mb-8 uppercase text-xs leading-tight">{message}</p>
                <button onClick={onClose} className="w-full py-5 rounded-2xl bg-emerald-600 text-white text-xl font-black hover:bg-emerald-500 transition-all border-b-8 border-emerald-900 active:translate-y-1 active:border-b-0 uppercase">Continuar</button>
            </div>
        </div>
    );
};

export default function WeighingDashboard() {
    const [lotes, setLotes] = useState([]);
    const [selectedLote, setSelectedLote] = useState(null);
    const [dbProducts, setDbProducts] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedAreaFiltro, setSelectedAreaFiltro] = useState(null);
    const [selectedAreaDestino, setSelectedAreaDestino] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [currentWeight, setCurrentWeight] = useState("0.00");
    const [tara, setTara] = useState("0.00");
    const [pesoManual, setPesoManual] = useState("0.00");
    const [showTaraModal, setShowTaraModal] = useState(false);
    const [showGuardarModal, setShowGuardarModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastRegisteredWeight, setLastRegisteredWeight] = useState("0.00");
    const [idBasculaConfigurada, setIdBasculaConfigurada] = useState("");

    const hasFetchedInitialData = useRef(false);

    const pesoBruto = parseFloat(currentWeight || 0);
    const pesoTara = parseFloat(tara || 0);
    const netWeight = Math.max(0, (pesoBruto - pesoTara)).toFixed(2);
    const totalKilosLote = movimientos.reduce((acc, h) => acc + parseFloat(h.Peso || 0), 0).toFixed(2);

    const isReadyToOpenGuardar = !isProcessing && selectedProduct && parseFloat(tara) > 0 && selectedAreaDestino;

    // Reset de destino al cambiar producto
    useEffect(() => {
        setSelectedAreaDestino(null);
    }, [selectedProduct]);

    const fetchLotes = useCallback(async () => {
        try {
            const res = await axios.get(route("LotesCongelacion"));
            setLotes(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error("Error lotes", e); }
    }, []);

    const fetchLotesRefirgeradores = useCallback(async (id) => {
        try {
            setIsLoading(true);
            const res = await axios.post(route("LotesRefirgeradores"), { Almacen: id });
            setLotes(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error("Error lotes refrigeradores", e); }
        finally { setIsLoading(false); }
    }, []);

    const getMovimientos = useCallback(async () => {
        try {
            const res = await axios.get(route("MovimientoPrimerPesaje"));
            setMovimientos(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error("Error movs", e); }
    }, []);

    const fetchProductosLote = async (idLote) => {
        try {
            const idConsulta = selectedAreaFiltro ? Number(selectedAreaFiltro) : 5;
            const res = await axios.post("/api/ProductosLotesHistorial", {
                opcion: 'A',
                Lote: idLote,
                idAlmacen: idConsulta
            });
            const data = Array.isArray(res.data) ? res.data : [];
            
            setDbProducts(data.map(p => ({
                IdProducto: String(p.IdProducto),
                Nombre: p.Producto,
                KG: parseFloat(p.KG || 0),
                PesoTeorico: parseFloat(p.Piezas || 0).toFixed(2),
                // ASEGURAMOS QUE LOS IDS SEAN NÚMEROS DESDE AQUÍ
                refrigeradores: Array.isArray(p.refrigeradores) 
                    ? p.refrigeradores.map(r => ({ ...r, IdAlmacen: Number(r.IdAlmacen) })) 
                    : []
            })));
            return data;
        } catch (e) {
            toast.error("Error al cargar productos");
            return [];
        }
    };

    useEffect(() => {
        if (hasFetchedInitialData.current) return;
        const init = async () => {
            setIsLoading(true);
            try {
                const resAlmacenes = await axios.get(route("AlmacenesRefrigerados"));
                const res = await axios.get(route("AlmacenesListar"));
                const limp = res.data.find(a => a.Nombre?.toUpperCase() === "CONGELACION");
                if (limp?.bascula?.puerto) setIdBasculaConfigurada(limp.bascula.puerto);
                setAlmacenes(resAlmacenes.data);
                await getMovimientos();
                hasFetchedInitialData.current = true;
            } finally { setIsLoading(false); }
        };
        init();
    }, [getMovimientos]);

    useEffect(() => {
        if (selectedAreaFiltro) {
            fetchLotesRefirgeradores(selectedAreaFiltro);
        } else {
            fetchLotes();
        }
    }, [selectedAreaFiltro, fetchLotes, fetchLotesRefirgeradores]);

    const handleSelectLote = (lote) => {
        setSelectedLote(lote);
        setTara("0.00");
        setCurrentWeight("0.00");
        setSelectedProduct(null);
        fetchProductosLote(lote.Lote);
        setTimeout(() => setShowTaraModal(true), 400);
    };

    const registrarPesaje = async (brutoConfirmado, taraConfirmada) => {
        setIsProcessing(true);
        const pesoNetoFinal = (parseFloat(brutoConfirmado) - parseFloat(taraConfirmada)).toFixed(2);
        try {
            const user = JSON.parse(localStorage.getItem('perfil'))?.IdUsuario || 1;
            const payload = {
                id_lote: selectedLote.Lote,
                id_producto: selectedProduct.IdProducto,
                cantidad: pesoNetoFinal,
                piezas: 0,
                id_area_entrada: selectedAreaFiltro ? Number(selectedAreaFiltro) : 5,
                id_area_salida: Number(selectedAreaDestino),
                idusuario: user
            };

            const res = await axios.post(route("pesaje.guardar-traspaso"), payload);
            setLastRegisteredWeight(pesoNetoFinal);
            setShowSuccessModal(true);
            getMovimientos();

            const productosRestantes = await fetchProductosLote(selectedLote.Lote);
            if (productosRestantes.length === 0 || res.data.lote_cerrado) {
                toast.success("¡Lote finalizado!");
                setSelectedLote(null);
                if (selectedAreaFiltro) fetchLotesRefirgeradores(selectedAreaFiltro);
            } else {
                setSelectedProduct(null);
                setPesoManual("0.00");
                setCurrentWeight("0.00");
            }
        } catch (e) { toast.error("Error al guardar"); }
        finally { setIsProcessing(false); setShowGuardarModal(false); }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-100"><LoadingDiv /></div>;

    if (!selectedLote) {
        return (
            <div className="h-full bg-[#f8fafc] p-4 md:p-10 flex flex-col items-center font-sans tracking-tight text-slate-900 font-black uppercase">
                <div className="max-w-7xl w-full">
                    <HeaderPanel badgeText="Azteca AVT" title="Panel de Pesaje:" subtitle="Congelación" onRefresh={fetchLotes} />
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex gap-2 overflow-x-auto no-scrollbar">
                        <button onClick={() => setSelectedAreaFiltro(null)} className={`flex-1 min-w-[120px] py-4 px-3 rounded-xl transition-all duration-500 flex flex-col items-center gap-2 group relative overflow-hidden ${!selectedAreaFiltro ? 'bg-[#1B2654] text-white shadow-2xl scale-[1.05] z-10' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100 shadow-sm'}`}>
                            <div className={`p-2 rounded-lg transition-colors ${!selectedAreaFiltro ? 'bg-red-600' : 'bg-slate-100'}`}><LayoutGrid size={18} className={!selectedAreaFiltro ? 'text-white' : 'text-slate-400'} /></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Todos</span>
                        </button>
                        {almacenes.map((a) => {
                            const id = Number(a.id || a.IdAlmacen);
                            const isActive = Number(selectedAreaFiltro) === id;
                            return (
                                <button key={id} onClick={() => setSelectedAreaFiltro(id)} className={`flex-1 min-w-[120px] py-4 px-3 rounded-xl transition-all duration-500 flex flex-col items-center gap-2 group relative overflow-hidden ${isActive ? 'bg-[#1B2654] text-white shadow-2xl scale-[1.05] z-10' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100 shadow-sm'}`}>
                                    <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-red-600' : 'bg-slate-100'}`}><Snowflake size={18} className={isActive ? 'text-white' : 'text-slate-400'} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{a.Nombre?.substring(0, 15)}</span>
                                </button>
                            );
                        })}
                    </div>
                    <br />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {lotes.length > 0 ? (
                            lotes.map((lote) => (
                                <button key={lote.Lote} onClick={() => handleSelectLote(lote)} className="bg-white p-6 rounded-[2.5rem] flex items-center justify-between border-4 border-transparent hover:border-red-600 transition-all shadow-xl group">
                                    <div className="text-left font-black">
                                        <span className="text-xs text-red-600 uppercase">LOTE #{lote.Lote}</span>
                                        <h3 className="text-2xl leading-none text-slate-700">{lote.Proveedor}</h3>
                                    </div>
                                    <div className="bg-slate-100 group-hover:bg-red-600 group-hover:text-white p-5 rounded-3xl transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="col-span-full bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-4">
                                <span className="text-8xl">🧊</span>
                                <h2 className="text-2xl font-black text-slate-800 uppercase italic">No hay lotes</h2>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-full bg-slate-200 p-4 gap-4 overflow-hidden font-black uppercase">
            {/* <Toaster position="top-center" richColors /> */}
            
            <BasculaModal isOpen={showTaraModal} title="PESAR TARA" currentReading={currentWeight} buttonText="GUARDAR TARA" colorClass="bg-red-600 border-red-900 hover:bg-red-500" onClose={() => setShowTaraModal(false)} basculaId={idBasculaConfigurada} onConfirm={(b, t) => { setTara(t); setShowTaraModal(false); }} />
            
            <BasculaModal isOpen={showGuardarModal} title="PESAR PRODUCTO" subtitle={selectedProduct?.Nombre} currentReading={currentWeight} tara={tara} buttonText="CONFIRMAR Y GUARDAR" colorClass="bg-emerald-600 border-emerald-900 hover:bg-emerald-500" destinationName={almacenes.find(a => Number(a.id || a.IdAlmacen) === Number(selectedAreaDestino))?.Nombre} onClose={() => setShowGuardarModal(false)} basculaId={idBasculaConfigurada} onConfirm={(b, t) => registrarPesaje(b, t)} />

            <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} registeredWeight={lastRegisteredWeight} message={`Registro guardado para ${selectedProduct?.Nombre}`} />

            <div className="flex-1 flex flex-col min-h-0 gap-4">
                <header className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-md border border-slate-300">
                    <div>
                        <button onClick={() => setSelectedLote(null)} className="text-[10px] text-slate-400 hover:text-red-600 mb-1 block">← VOLVER</button>
                        <h1 className="text-2xl text-slate-800">{selectedLote.Proveedor}</h1>
                        <p className="text-[10px] text-red-600 tracking-widest">LOTE: {selectedLote.Lote} | ORIGEN: {almacenes.find(a => Number(a.id || a.IdAlmacen) === Number(selectedAreaFiltro))?.Nombre || 'GENERAL'}</p>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scroll pr-2">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {dbProducts.map((p) => {
                            const noTieneCongelador = !p.refrigeradores || p.refrigeradores.length === 0;
                            return (
                                <button key={p.IdProducto} 
                                    disabled={noTieneCongelador}
                                    onClick={() => { setSelectedProduct(p); setPesoManual(p.PesoTeorico); }} 
                                    className={`p-4 rounded-[2rem] text-left border-b-[10px] h-36 flex flex-col justify-between transition-all shadow-md relative 
                                    ${noTieneCongelador ? "bg-gray-100 border-gray-400 opacity-60 cursor-not-allowed" : selectedProduct?.IdProducto === p.IdProducto ? "border-red-600 bg-white scale-[0.98]" : "border-slate-300 bg-white"}`}>
                                    <div className="flex flex-col gap-1">
                                        {!noTieneCongelador ? (
                                            <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-lg w-fit">{p.KG} KG</span>
                                        ) : (
                                            <span className="bg-red-500 text-white text-[7px] px-2 py-0.5 rounded-lg w-fit animate-pulse">SIN CONGELADOR</span>
                                        )}
                                    </div>
                                    <span className={`text-[12px] leading-tight line-clamp-2 ${noTieneCongelador ? "text-gray-400 italic" : "text-slate-800"}`}>{p.Nombre}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="h-1/3 bg-white rounded-[2.5rem] shadow-inner border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b text-[9px] text-slate-400 sticky top-0"><tr><th className="p-4">PRODUCTO</th><th className="p-4 text-center">KG (MANUAL)</th><th className="p-4 text-right">PESO NETO</th></tr></thead>
                        <tbody className="divide-y divide-slate-100 overflow-y-auto">{movimientos.map((reg, i) => (<tr key={i} className="text-[11px] font-bold text-slate-700"><td className="p-4 truncate">{reg.Nombre}</td><td className="p-4 text-center">{reg.Piezas} KG</td><td className="p-4 text-right font-black">{parseFloat(reg.Peso || 0).toFixed(2)} KG</td></tr>))}</tbody>
                    </table>
                </div>
            </div>

            <aside className="w-full md:w-1/3 lg:w-[350px] flex flex-col gap-3">
                <div className="bg-slate-900 rounded-[2rem] p-4 shadow-xl border-4 border-slate-800">
                    <div className="bg-[#0f1713] rounded-[1.5rem] p-4 border-4 border-black text-center"><div className="text-5xl font-mono text-green-400">{netWeight}</div><span className="text-green-900 text-[8px] mt-1 block tracking-widest font-black uppercase">Neto (KG)</span></div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="bg-slate-800 py-2 rounded-xl text-center"><div className="text-base font-mono text-blue-400">{pesoBruto.toFixed(2)}</div><span className="text-slate-500 text-[7px] font-bold">BRUTO</span></div>
                        <div className="bg-slate-800 py-2 rounded-xl text-center"><div className="text-base font-mono text-red-400">-{pesoTara.toFixed(2)}</div><span className="text-slate-500 text-[7px] font-bold">TARA</span></div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-[2rem] border-4 border-slate-200 flex flex-col gap-3">
                    <button onClick={() => { setCurrentWeight("0.00"); setShowTaraModal(true); }} className="bg-slate-800 text-white py-3 rounded-xl text-[10px] border-b-4 border-black font-black active:translate-y-1 active:border-b-0">CAMBIAR TARA</button>

                    <div>
                        <label className={`text-[10px] block mb-2 text-center tracking-widest font-black uppercase ${!selectedAreaDestino ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                            {!selectedAreaDestino ? "ELIJA CONGELADOR" : "CONGELADOR SELECCIONADO"}
                        </label>
                        <div className="flex gap-1 flex-wrap">
                            {almacenes
                                .filter(a => {
                                    if (!selectedProduct) return true;
                                    // CONVERSIÓN EXPLÍCITA A NUMBER PARA COMPARAR
                                    const idsPermitidos = selectedProduct.refrigeradores?.map(r => Number(r.IdAlmacen)) || [];
                                    const idAlmacenBoton = Number(a.id || a.IdAlmacen);
                                    return idsPermitidos.includes(idAlmacenBoton);
                                })
                                .map(a => {
                                    const id = Number(a.id || a.IdAlmacen);
                                    return (
                                        <button key={id} 
                                            onClick={() => setSelectedAreaDestino(id)} 
                                            className={`flex-1 min-w-[80px] py-3 rounded-xl text-[9px] transition-all border-b-4 font-black flex flex-col items-center justify-center gap-1 
                                            ${Number(selectedAreaDestino) === id ? 'bg-yellow-400 border-yellow-600 text-yellow-900' : 'bg-slate-100 border-slate-300 text-slate-400 hover:bg-blue-50'}`}>
                                            <Snowflake size={14} strokeWidth={3} />
                                            <span>{a.Nombre?.substring(0, 10)}</span>
                                        </button>
                                    );
                                })
                            }
                            {/* Alerta de sistema */}
                            {selectedProduct && almacenes.filter(a => (selectedProduct.refrigeradores?.map(r => Number(r.IdAlmacen)) || []).includes(Number(a.id || a.IdAlmacen))).length === 0 && (
                                <div className="w-full p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="text-red-600" size={16} />
                                    <span className="text-[7px] text-red-700 font-bold uppercase">Sin rutas configuradas</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <button onClick={() => { setCurrentWeight("0.00"); setShowGuardarModal(true); }} 
                        disabled={!isReadyToOpenGuardar} 
                        className={`w-full py-5 rounded-[1.5rem] text-lg border-b-[8px] transition-all font-black 
                        ${!isReadyToOpenGuardar ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed" : "bg-emerald-600 text-white border-emerald-900 hover:bg-emerald-500 active:translate-y-1 active:border-b-0"}`}>
                        {!selectedProduct ? "ELIJA PRODUCTO" : !selectedAreaDestino ? "ELIJA DESTINO" : "Pesar y Guardar"}
                    </button>
                </div>
            </aside>
        </div>
    );
}