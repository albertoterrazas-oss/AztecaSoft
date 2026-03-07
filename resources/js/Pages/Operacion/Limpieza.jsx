import { useEffect, useState, useCallback, useRef } from "react";
import { Toaster, toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";

// --- RUTAS ---
const route = (name) => {
    const routeMap = {
        "LotesLimpieza": "/api/LotesLimpieza",
        "pesaje.store": "/api/pesaje/guardar-lote",
        "AlmacenesListar": "/api/almacenes",
        "ProductosLotesHistorial": "/api/ProductosLotesHistorial",
        "ProductosLotes": "/api/ProductosLotes",
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

// --- MODAL DE BÁSCULA MEJORADO ---
const BasculaModal = ({
    isOpen, onClose, onConfirm, currentReading, tara, title,
    buttonText, colorClass, subtitle, disabledConfirm,
    showSimulate = false, onSimulate, destinationName
}) => {
    if (!isOpen) return null;
    const bruto = parseFloat(currentReading || 0);
    const taraVal = parseFloat(tara || 0);
    const neto = Math.max(0, bruto - taraVal).toFixed(2);

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-2xl rounded-[4rem] p-10 border-4 border-slate-700 shadow-2xl animate-in zoom-in duration-300">
                <div className="flex justify-between items-start mb-6">
                    <div className="text-left">
                        <h2 className="text-white text-3xl tracking-widest font-black uppercase leading-none">{title}</h2>
                        <p className="text-slate-500 text-sm mt-2 tracking-widest font-bold uppercase">{subtitle}</p>
                    </div>
                    {destinationName && (
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-tighter shadow-lg shadow-blue-900/40">
                            DESTINO: {destinationName}
                        </div>
                    )}
                </div>

                <div className="bg-[#0f1713] rounded-[3rem] p-10 border-8 border-black shadow-inner mb-6 text-center relative overflow-hidden">
                    <div className="flex justify-around mb-4 border-b border-white/5 pb-4">
                        <div className="text-center">
                            <span className="block text-[10px] text-slate-500 font-black uppercase">Peso Bruto</span>
                            <span className="text-2xl font-mono text-blue-400">{bruto.toFixed(2)}</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-[10px] text-slate-500 font-black uppercase">Tara</span>
                            <span className="text-2xl font-mono text-red-500">-{taraVal.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="text-[10rem] font-mono text-green-400 leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(74,222,128,0.6)]">
                        {taraVal > 0 ? neto : bruto.toFixed(2)}
                    </div>
                    <span className="text-green-900 text-sm mt-4 block tracking-[0.5em] font-black uppercase">
                        {taraVal > 0 ? "PESO NETO (KG)" : "LECTURA BRUTA (KG)"}
                    </span>
                </div>

                {showSimulate && (
                    <button onClick={onSimulate} className="w-full mb-6 py-5 rounded-2xl bg-blue-600 text-white text-xl font-black hover:bg-blue-500 transition-all border-b-8 border-blue-900 active:translate-y-1 active:border-b-0 uppercase">Capturar Peso Báscula</button>
                )}

                <div className="flex gap-6">
                    <button onClick={onClose} className="flex-1 py-7 rounded-3xl bg-slate-800 text-white text-xl font-black hover:bg-slate-700 transition-all uppercase border-b-[10px] border-black active:translate-y-2 active:border-b-0">Cancelar</button>
                    <button disabled={disabledConfirm} onClick={onConfirm} className={`flex-1 py-7 rounded-3xl ${colorClass} text-white text-xl font-black shadow-lg uppercase transition-all ${disabledConfirm ? 'opacity-30 cursor-not-allowed border-b-0' : 'active:translate-y-2 active:border-b-0 border-b-[10px]'}`}>{buttonText}</button>
                </div>
            </div>
        </div>
    );
};

export default function WeighingDashboard() {
    const [lotes, setLotes] = useState([]);
    const [selectedLote, setSelectedLote] = useState(null);
    const [dbProducts, setDbProducts] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);
    const [currentWeight, setCurrentWeight] = useState("0.00");
    const [tara, setTara] = useState("0.00");
    const [piezas, setPiezas] = useState(0);
    const [showTaraModal, setShowTaraModal] = useState(false);
    const [showGuardarModal, setShowGuardarModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [lastRegisteredWeight, setLastRegisteredWeight] = useState("0.00");

    const hasFetchedInitialData = useRef(false);

    const pesoBruto = parseFloat(currentWeight || 0);
    const pesoTara = parseFloat(tara || 0);
    const netWeight = Math.max(0, (pesoBruto - pesoTara)).toFixed(2);

    const fetchHistorial = useCallback(async (loteId) => {
        const id = loteId || selectedLote?.Lote;
        if (!id) return;
        try {
            const res = await axios.post(route("ProductosLotesHistorial"), { Lote: id, idAlmacen: 2 });
            setHistorial(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error(e); }
    }, [selectedLote]);

    const fetchProductosLote = async (idLote) => {
        try {
            const res = await axios.post(route("ProductosLotes"), { opcion: 'L', idLote: idLote, idAlmacen: 2 });
            setDbProducts((res.data || []).map(p => ({
                IdProducto: String(p.idProducto),
                Nombre: p.Producto,
                PiezasTeoricas: parseInt(p.Piezas) || 0,
            })));
        } catch (e) { toast.error("Error productos"); }
    };

    const fetchLotes = useCallback(async () => {
        try {
            const res = await axios.get(route("LotesLimpieza"));
            setLotes(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        if (hasFetchedInitialData.current) return;
        const init = async () => {
            setIsLoading(true);
            try {
                const resAlmacenes = await axios.get(route("AlmacenesListar"));
                const validAlmacenes = resAlmacenes.data.filter(a => !["ENTRADA", "VENTA", "DESHUESE", "RECEPCION"].includes(a.Nombre?.toUpperCase()));
                setAlmacenes(validAlmacenes);
                await fetchLotes();
                hasFetchedInitialData.current = true;
            } finally { setIsLoading(false); }
        };
        init();
    }, [fetchLotes]);

    const handleSelectLote = (lote) => {
        setSelectedLote(lote);
        setTara("0.00");
        setCurrentWeight("0.00");
        setSelectedProduct(null);
        fetchProductosLote(lote.Lote);
        fetchHistorial(lote.Lote);
        const cong = almacenes.find(a => a.Nombre.toUpperCase().includes("CONGELACION"));
        if (cong) setSelectedArea(cong.IdAlmacen);
        setTimeout(() => setShowTaraModal(true), 400);
    };

    const registrarPesaje = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const user = JSON.parse(localStorage.getItem('perfil'))?.IdUsuario || 1;
            const weightToSave = netWeight;
            const payload = {
                id_lote: selectedLote.Lote,
                id_producto: selectedProduct.IdProducto,
                cantidad: weightToSave,
                piezas: piezas,
                id_area_entrada: 2,
                id_area_salida: selectedArea,
                idusuario: user
            };
            const res = await axios.post(route("pesaje.store"), payload);
            setShowGuardarModal(false);
            setLastRegisteredWeight(weightToSave);
            if (res.data.lote_cerrado) {
                setSuccessMsg(`Lote #${selectedLote.Lote} Cerrado.`);
                setSelectedLote(null);
                await fetchLotes();
            } else {
                setSuccessMsg(`${selectedProduct.Nombre} guardado.`);
                await Promise.all([fetchLotes(), fetchProductosLote(selectedLote.Lote), fetchHistorial(selectedLote.Lote)]);
                setSelectedProduct(null);
                setPiezas(0);
                setCurrentWeight("0.00");
            }
            setShowSuccessModal(true);
        } catch (e) { toast.error("Error al guardar"); } finally { setIsProcessing(false); }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-100"><LoadingDiv /></div>;

    if (!selectedLote) {
        return (

            <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center justify-center font-black uppercase">
                <div className="max-w-4xl w-full">
                    <h1 className="text-4xl text-center mb-10 italic font-black text-slate-800">
                        Panel de Pesaje: Proceso
                    </h1>

                    <div className="grid gap-4">
                        {lotes.length > 0 ? (
                            lotes.map((lote) => (
                                <button
                                    key={lote.Lote}
                                    onClick={() => handleSelectLote(lote)}
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
        <div className="relative flex flex-col lg:flex-row h-[100%] bg-slate-200 p-4 gap-4 font-black uppercase ">
            {isProcessing && (
                <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center border-b-[12px] border-emerald-500">
                        <LoadingDiv /><span className="mt-6 text-slate-800 font-black tracking-[0.2em] text-xl animate-pulse">GUARDANDO REGISTRO...</span>
                    </div>
                </div>
            )}

            <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMsg} registeredWeight={lastRegisteredWeight} />

            <BasculaModal
                isOpen={showTaraModal} title="PESAR TARA" subtitle="Coloque recipiente vacío" currentReading={currentWeight} tara="0.00" buttonText="GUARDAR TARA" colorClass="bg-red-600 border-red-900" disabledConfirm={parseFloat(currentWeight) <= 0} showSimulate={true} onSimulate={() => setCurrentWeight((Math.random() * (1.5 - 0.2) + 0.2).toFixed(2))} onClose={() => { setShowTaraModal(false); setCurrentWeight("0.00"); }} onConfirm={() => { setTara(currentWeight); setCurrentWeight("0.00"); setShowTaraModal(false); }}
            />

            <BasculaModal
                isOpen={showGuardarModal} title="PESAR PRODUCTO" subtitle={selectedProduct?.Nombre} currentReading={currentWeight} tara={tara} buttonText="CONFIRMAR Y GUARDAR" colorClass="bg-emerald-600 border-emerald-900" disabledConfirm={parseFloat(netWeight) <= 0} showSimulate={true} onSimulate={() => setCurrentWeight((Math.random() * (40 - 5) + 5).toFixed(2))} destinationName={almacenes.find(a => a.IdAlmacen === selectedArea)?.Nombre} onClose={() => { setShowGuardarModal(false); setCurrentWeight("0.00"); }} onConfirm={registrarPesaje}
            />

            <div className="flex-1 flex flex-col min-h-0 gap-3">
                <header className="flex justify-between items-center bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-300">
                    <div>
                        <button onClick={() => setSelectedLote(null)} className="text-[10px] text-slate-400 hover:text-red-600 mb-1 block">← CAMBIAR LOTE</button>
                        <h1 className="text-2xl text-slate-800 leading-none">{selectedLote.Proveedor}</h1>
                        <p className="text-[10px] text-red-600 font-bold tracking-widest">LOTE: {selectedLote.Lote} | TARA: {tara} KG</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-slate-400">ALMACÉN DESTINO</p>
                        <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="text-sm font-black bg-blue-50 text-blue-700 px-3 py-1 rounded-xl border-none outline-none">
                            {almacenes.map(a => <option key={a.IdAlmacen} value={a.IdAlmacen}>{a.Nombre}</option>)}
                        </select>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scroll pr-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {dbProducts.map((p) => (
                            <button key={p.IdProducto} onClick={() => { setSelectedProduct(p); setPiezas(p.PiezasTeoricas || 0); }} className={`p-4 rounded-[2rem] text-left border-b-[10px] h-32 flex flex-col justify-between transition-all shadow-md active:translate-y-2 active:border-b-0 ${selectedProduct?.IdProducto === p.IdProducto ? "border-red-600 bg-red-50" : "border-slate-300 bg-white"}`}>
                                <span className={`text-[10px] px-2 py-0.5 rounded-lg w-fit font-black ${selectedProduct?.IdProducto === p.IdProducto ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>{p.PiezasTeoricas} PZS</span>
                                <span className="text-[12px] leading-tight line-clamp-2 text-slate-800 font-black">{p.Nombre}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b text-[9px] font-black text-slate-400 uppercase sticky top-0">
                            <tr><th className="p-4">Producto</th><th className="p-4 text-center">Piezas</th><th className="p-4 text-right">Peso</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 uppercase">
                            {historial.map((reg, i) => (
                                <tr key={i} className={`text-[11px] font-bold ${parseFloat(reg.KG) > 0 ? 'bg-green-50/40' : ''}`}>
                                    <td className="p-4 text-slate-700">{reg.Producto}</td>
                                    <td className="p-4 text-center"><span className="bg-slate-100 px-2 py-1 rounded">{reg.Piezas}</span></td>
                                    <td className="p-4 text-right text-base font-black">{parseFloat(reg.KG || 0).toFixed(2)} KG</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <aside className="w-full md:w-1/3 lg:w-[350px] flex flex-col gap-3">
                <div className="bg-slate-900 rounded-[2rem] p-4 shadow-xl border-4 border-slate-800">
                    <div className="bg-[#0f1713] rounded-[1.5rem] p-4 border-4 border-black shadow-inner mb-3 text-center">
                        <div className="text-5xl font-mono text-green-400">{netWeight}</div>
                        <span className="text-green-900 text-[8px] mt-1 block tracking-widest font-black">Neto (KG)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-800 py-2 rounded-xl text-center"><div className="text-base font-mono text-blue-400">{pesoBruto.toFixed(2)}</div><span className="text-slate-500 text-[7px] font-bold uppercase">Bruto</span></div>
                        <div className="bg-slate-800 py-2 rounded-xl text-center"><div className="text-base font-mono text-red-400">-{pesoTara.toFixed(2)}</div><span className="text-slate-500 text-[7px] font-bold uppercase">Tara</span></div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-[2rem] border-4 border-slate-200 shadow-sm flex flex-col gap-3">
                    <button
                        onClick={() => {
                            setShowGuardarModal(false);
                            setShowSuccessModal(false);
                            setCurrentWeight("0.00");
                            setShowTaraModal(true);
                        }}
                        className="bg-slate-800 text-white py-3 rounded-xl text-[10px] border-b-4 border-black active:translate-y-1 active:border-b-0 transition-all font-black uppercase"
                    >
                        Cambiar Tara
                    </button>
                    <div className="w-full px-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block text-center">Cantidad de Piezas</label>
                        <div className="flex gap-4 h-24 text-5xl font-black">
                            {[{ s: '-', v: -1, h: 'hover:bg-red-500' }, { s: '+', v: 1, h: 'hover:bg-green-500' }].map((b, i) => (
                                <button key={i} onClick={() => setPiezas(Math.max(0, Number(piezas || 0) + b.v))} className={`flex-1 rounded-3xl border-b-[8px] border-slate-300 bg-slate-100 active:border-b-0 active:translate-y-2 transition-all ${b.h} hover:text-white ${i ? 'order-last' : ''}`}>{b.s}</button>
                            ))}
                            <input type="number" value={piezas} onChange={e => setPiezas(e.target.value)} className="w-[40%] bg-slate-50 border-b-[8px] border-slate-200 rounded-3xl text-center outline-none focus:bg-white" />
                        </div>
                    </div>

                    <button onClick={() => { setCurrentWeight("0.00"); setShowGuardarModal(true); }} disabled={isProcessing || !selectedProduct || parseFloat(tara) <= 0} className={`w-full py-4 rounded-[1.5rem] text-lg border-b-[8px] transition-all font-black ${(isProcessing || !selectedProduct || parseFloat(tara) <= 0) ? "bg-slate-100 text-slate-300 border-slate-200" : "bg-emerald-600 text-white border-emerald-900 active:translate-y-1 active:border-b-0"}`}>Pesar y Guardar</button>
                </div>
            </aside>
            <Toaster position="top-right" richColors />
        </div>
    );
}