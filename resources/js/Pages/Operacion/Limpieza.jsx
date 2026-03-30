import { useEffect, useState, useCallback, useRef } from "react";
import { Toaster, toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";
import BasculaModal from '../../Components/BasculaPesa.jsx';
import HeaderPanel from '../../Components/HeaderPanel.jsx';

const route = (name) => {
    const routeMap = {
        "LotesLimpieza": "/api/LotesLimpieza",
        "pesaje.guardar-traspaso": "/api/pesaje/guardar-traspaso",
        "AlmacenesListar": "/api/almacenes",
        "ProductosLotesHistorial": "/api/ProductosLotesHistorial",
    };
    return routeMap[name] || `/${name}`;
};

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

export default function WeighingDashboardLimpieza() {
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
    const [idBasculaConfigurada, setIdBasculaConfigurada] = useState("");

    const hasFetchedInitialData = useRef(false);

    const pesoBruto = parseFloat(currentWeight || 0);
    const pesoTara = parseFloat(tara || 0);
    const netWeight = Math.max(0, (pesoBruto - pesoTara)).toFixed(2);

    const canOpenGuardar = !isProcessing && selectedProduct && parseFloat(tara) > 0;

    const fetchHistorial = useCallback(async (loteId) => {
        const id = loteId || selectedLote?.Lote;
        if (!id) return;
        try {
            const res = await axios.post(route("ProductosLotesHistorial"), { Lote: id, idAlmacen: 2 });
            setHistorial(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error("Error historial", e); }
    }, [selectedLote]);

    const fetchProductosLote = async (idLote) => {
        try {
            const res = await axios.post(route("ProductosLotesHistorial"), { opcion: 'A', idLote: idLote, idAlmacen: 2 });
            setDbProducts((res.data || []).map(p => ({
                IdProducto: String(p.IdProducto),
                Nombre: p.Producto,
                PiezasTeoricas: parseInt(p.Piezas) || 0,
                KG: parseFloat(p.KG || 0).toFixed(2) // <--- RE-AGREGADO AQUÍ
            })));
        } catch (e) { toast.error("Error al cargar productos"); }
    };


    useEffect(() => {
        if (dbProducts && dbProducts.length === 0) {
            fetchLotes();
            setShowSuccessModal(false);
            setSelectedLote(null);
        }
    }, [dbProducts]); // Se ejecuta cada vez que dbProducts cambie

    const fetchLotes = useCallback(async () => {
        try {
            const res = await axios.get(route("LotesLimpieza"));
            setLotes(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error("Error lotes", e); }
    }, []);

    useEffect(() => {
        if (hasFetchedInitialData.current) return;
        const init = async () => {
            setIsLoading(true);
            try {
                const resAlmacenes = await axios.get(route("AlmacenesListar"));
                const limp = resAlmacenes.data.find(a => a.Nombre?.toUpperCase() === "LIMPIEZA");
                if (limp?.bascula?.puerto) setIdBasculaConfigurada(limp.bascula.puerto);
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
        if (cong) setSelectedArea(cong.IdAlmacen || cong.id);
        setTimeout(() => setShowTaraModal(true), 400);
    };

    const registrarPesaje = async (brutoConfirmado, taraConfirmada) => {
        if (isProcessing) return;
        setIsProcessing(true);
        const pesoNetoFinal = (parseFloat(brutoConfirmado) - parseFloat(taraConfirmada)).toFixed(2);
        try {
            const user = JSON.parse(localStorage.getItem('perfil'))?.IdUsuario || 1;
            const payload = {
                id_lote: selectedLote.Lote,
                id_producto: selectedProduct.IdProducto,
                cantidad: pesoNetoFinal,
                piezas: 0,
                id_area_entrada: 2,
                id_area_salida: selectedArea,
                idusuario: user
            };
            const res = await axios.post(route("pesaje.guardar-traspaso"), payload);
            setLastRegisteredWeight(pesoNetoFinal);
            if (res.data.lote_cerrado) {
                setSuccessMsg(`Lote #${selectedLote.Lote} Cerrado.`);
                setSelectedLote(null);
                setSelectedProduct(null);
                setDbProducts([]);
                setHistorial([]);
                await fetchLotes();
            } else {
                setSuccessMsg(`${selectedProduct.Nombre} guardado.`);
                await Promise.all([fetchProductosLote(selectedLote.Lote), fetchHistorial(selectedLote.Lote)]);
                setSelectedProduct(null);
                setCurrentWeight("0.00");
            }
            setShowSuccessModal(true);
        } catch (e) { toast.error("Error al guardar"); } finally {
            setIsProcessing(false);
            setShowGuardarModal(false);
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-100"><LoadingDiv /></div>;

    if (!selectedLote) {
        return (

            <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center justify-center font-black uppercase">
                <div className="max-w-7xl w-full">
                    <HeaderPanel
                        badgeText="Azteca AVT"
                        title="Panel de Pesaje:"
                        subtitle="Limpieza"
                        onRefresh={fetchLotes}
                    />

                    <div className="grid gap-4">
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
                            <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border-4 border-dashed border-slate-300 flex flex-col items-center">
                                <span className="text-6xl mb-4 text-slate-300">📦</span>
                                <h2 className="text-2xl text-slate-400 text-center">No hay lotes en Limpieza</h2>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-[100%] bg-slate-200 p-4 gap-4 overflow-hidden font-black uppercase">
            {/* <Toaster position="top-center" richColors /> */}
            <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMsg} registeredWeight={lastRegisteredWeight} />
            <BasculaModal isOpen={showTaraModal} title="PESAR TARA" subtitle="Coloque recipiente vacío" currentReading={currentWeight} buttonText="GUARDAR TARA" colorClass="bg-red-600 border-red-900 hover:bg-red-500" onClose={() => setShowTaraModal(false)} basculaId={idBasculaConfigurada} onConfirm={(b, t) => { setTara(t); setShowTaraModal(false); }} />
            <BasculaModal isOpen={showGuardarModal} title="PESAR PRODUCTO" subtitle={selectedProduct?.Nombre} currentReading={currentWeight} tara={tara} buttonText="CONFIRMAR Y GUARDAR" colorClass="bg-emerald-600 border-emerald-900 hover:bg-emerald-500" destinationName={almacenes.find(a => (a.id || a.IdAlmacen) === selectedArea)?.Nombre} onClose={() => setShowGuardarModal(false)} basculaId={idBasculaConfigurada} onConfirm={(b, t) => registrarPesaje(b, t)} />

            <div className="flex-1 flex flex-col min-h-0 gap-3">
                <header className="flex justify-between items-center bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-300">
                    <div>
                        <button onClick={() => { setSelectedLote(null); fetchLotes(); }} className="text-[10px] text-slate-400 hover:text-red-600 mb-1 block">← CAMBIAR LOTE</button>
                        <h1 className="text-2xl text-slate-800 leading-none">{selectedLote.Proveedor}</h1>
                        <p className="text-[10px] text-red-600 font-bold tracking-widest">LOTE: {selectedLote.Lote} | TARA: {tara} KG</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-slate-400">DESTINO</p>
                        <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="text-sm font-black bg-blue-50 text-blue-700 px-3 py-1 rounded-xl border-none">
                            {almacenes.map(a => <option key={a.IdAlmacen || a.id} value={a.IdAlmacen || a.id}>{a.Nombre}</option>)}
                        </select>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scroll pr-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {dbProducts.map((p) => {
                            const isSelected = selectedProduct && String(selectedProduct.IdProducto) === String(p.IdProducto);
                            return (
                                <button
                                    key={p.IdProducto}
                                    onClick={() => { setSelectedProduct(p); setPiezas(p.PiezasTeoricas || 0); }}
                                    className={`p-4 rounded-[2rem] text-left border-b-[10px] h-32 flex flex-col justify-between transition-all shadow-md active:translate-y-2 active:border-b-0
                                        ${isSelected ? "border-red-600 bg-red-50" : "border-slate-300 bg-white"}`}
                                >
                                    <span className={`text-[10px] px-2 py-0.5 rounded-lg w-fit font-black ${isSelected ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                        {p.KG} KG TOTAL
                                    </span>
                                    <span className="text-[12px] leading-tight line-clamp-2 text-slate-800 font-black">{p.Nombre}</span>
                                </button>
                            );
                        })}
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
                        <span className="text-green-900 text-[8px] mt-1 block tracking-widest font-black uppercase">Neto Actual (KG)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-800 py-2 rounded-xl text-center">
                            <div className="text-base font-mono text-blue-400">{pesoBruto.toFixed(2)}</div>
                            <span className="text-slate-500 text-[7px] font-bold uppercase">Bruto</span>
                        </div>
                        <div className="bg-slate-800 py-2 rounded-xl text-center">
                            <div className="text-base font-mono text-red-400">-{pesoTara.toFixed(2)}</div>
                            <span className="text-slate-500 text-[7px] font-bold uppercase">Tara</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-[2rem] border-4 border-slate-200 shadow-sm flex flex-col gap-3">
                    <button onClick={() => { setCurrentWeight("0.00"); setShowTaraModal(true); }} className="bg-slate-800 text-white py-3 rounded-xl text-[10px] border-b-4 border-black font-black uppercase">Cambiar Tara</button>
                    <button onClick={() => { setCurrentWeight("0.00"); setShowGuardarModal(true); }} disabled={!canOpenGuardar} className={`w-full py-5 rounded-[1.5rem] text-lg border-b-[8px] transition-all font-black ${!canOpenGuardar ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed" : "bg-emerald-600 text-white border-emerald-900 hover:bg-emerald-500 active:translate-y-1 active:border-b-0"}`}>
                        {!selectedProduct ? "ELIJA PRODUCTO" : parseFloat(tara) <= 0 ? "FALTA TARA" : "Pesar y Guardar KG"}
                    </button>
                </div>
            </aside>
        </div>
    );
}