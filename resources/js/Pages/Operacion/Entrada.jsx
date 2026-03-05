import { useEffect, useState, useCallback, useRef } from "react";
import { Toaster, toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";

const route = (name) => {
    const routeMap = {
        "LotesEntrada": "/api/LotesEntrada",
        "pesaje.store": "/api/pesaje/guardar-lote",
        "AlmacenesListar": "/api/almacenes",
        "ProductosLotesHistorial": "/api/ProductosLotesHistorial",
        "ProductosLotes": "/api/ProductosLotes",
    };
    return routeMap[name] || `/${name}`;
};

// --- COMPONENTE MODAL DE BÁSCULA REUTILIZABLE ---
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
                <p className="text-slate-500 text-center text-sm mb-8 tracking-widest font-bold">{subtitle}</p>

                <div className="bg-[#0f1713] rounded-[3rem] p-12 border-8 border-black shadow-inner mb-6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none"></div>
                    <div className="text-[10rem] font-mono text-green-400 leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(74,222,128,0.6)]">
                        {currentReading}
                    </div>
                    <span className="text-green-900 text-sm mt-6 block tracking-[0.5em] font-black uppercase">Lectura (KG)</span>
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

export default function WeighingDashboard() {
    const [lotes, setLotes] = useState([]);
    const [selectedLote, setSelectedLote] = useState(null);
    const [dbProducts, setDbProducts] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Estados de pesaje
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);
    const [currentWeight, setCurrentWeight] = useState("0.00");
    const [tara, setTara] = useState("0.00");
    const [piezas, setPiezas] = useState(0);

    // Control de Modales
    const [showTaraModal, setShowTaraModal] = useState(false);
    const [showGuardarModal, setShowGuardarModal] = useState(false);

    const hasFetchedInitialData = useRef(false);

    // Lógica calculada
    const pesoBruto = parseFloat(currentWeight || 0);
    const pesoTara = parseFloat(tara || 0);
    const netWeight = Math.max(0, (pesoBruto - pesoTara)).toFixed(2);
    const totalKilosLote = historial.reduce((acc, h) => acc + parseFloat(h.KG || 0), 0).toFixed(2);

    // VALIDACIÓN COMPLETA PARA EL BOTÓN PRINCIPAL
    const isReadyToWeigh =
        !isProcessing &&
        selectedProduct &&
        parseFloat(tara) > 0 &&
        selectedArea &&
        piezas > 0;

    const fetchHistorial = useCallback(async (loteId) => {
        const id = loteId || selectedLote?.Lote;
        if (!id) return;
        try {
            const res = await axios.post(route("ProductosLotesHistorial"), { Lote: id, idAlmacen: 1 });
            setHistorial(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error("Error historial", e); }
    }, [selectedLote]);

    const fetchProductosLote = async (idLote) => {
        try {
            const res = await axios.post(route("ProductosLotes"), { opcion: 'L', idLote: idLote, idAlmacen: 1 });
            setDbProducts((res.data || []).map(p => ({
                IdProducto: String(p.idProducto),
                Nombre: p.Producto,
                PiezasTeoricas: parseInt(p.Piezas) || 0,
            })));
        } catch (e) { toast.error("Error al cargar productos"); }
    };

    const fetchLotes = useCallback(async () => {
        try {
            const res = await axios.get(route("LotesEntrada"));
            setLotes(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        if (hasFetchedInitialData.current) return;
        const init = async () => {
            setIsLoading(true);
            try {
                const resAlmacenes = await axios.get(route("AlmacenesListar"));
                // Filtramos por estatus activo si es necesario
                setAlmacenes(resAlmacenes.data.filter(a => !["ENTRADA", "RECEPCION"].includes(a.Nombre?.toUpperCase())));
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
        setSelectedArea(null); // Resetear área al cambiar lote
        fetchProductosLote(lote.Lote);
        fetchHistorial(lote.Lote);

        const cong = almacenes.find(a => a.Departamentos_nombre?.toUpperCase().includes("CONGELACION"));
        if (cong) setSelectedArea(cong.id || cong.IdAlmacen);

        setTimeout(() => setShowTaraModal(true), 400);
    };

    const registrarPesaje = async () => {
        if (!isReadyToWeigh) return;
        setIsProcessing(true);
        try {
            const user = JSON.parse(localStorage.getItem('perfil'))?.IdUsuario || 1;
            const payload = {
                id_lote: selectedLote.Lote,
                id_producto: selectedProduct.IdProducto,
                cantidad: netWeight,
                piezas: piezas,
                id_area_entrada: 1,
                id_area_salida: selectedArea,
                idusuario: user
            };
            const res = await axios.post(route("pesaje.store"), payload);

            if (res.data.lote_cerrado) {
                toast.success("LOTE FINALIZADO");
                setSelectedLote(null);
                fetchLotes();
            } else {
                await Promise.all([fetchProductosLote(selectedLote.Lote), fetchHistorial(selectedLote.Lote)]);
                setSelectedProduct(null);
                setPiezas(0);
                setCurrentWeight("0.00");
                toast.success("REGISTRO GUARDADO");
            }
        } catch (e) { toast.error("Error al guardar"); }
        finally { setIsProcessing(false); setShowGuardarModal(false); }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-100"><LoadingDiv /></div>;

    if (!selectedLote) {
        return (
            <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center justify-center font-black uppercase">
                <div className="max-w-4xl w-full">
                    <h1 className="text-4xl text-center mb-10 italic font-black text-slate-800">
                        Panel de Pesaje: ENTRADA Y SALIDA
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
        <div className="flex flex-col lg:flex-row h-screen bg-slate-200 p-4 gap-4 overflow-hidden font-black uppercase">
            {/* <Toaster position="top-center" richColors /> */}

            <BasculaModal
                isOpen={showTaraModal}
                title="PASO 1: PESAR TARA"
                subtitle="Coloque el recipiente vacío"
                currentReading={currentWeight}
                buttonText="FIJAR TARA"
                colorClass="bg-red-600 border-red-900 shadow-red-600/20"
                disabledConfirm={parseFloat(currentWeight) <= 0}
                showSimulate={true}
                onSimulate={() => setCurrentWeight((Math.random() * 1.2 + 0.2).toFixed(2))}
                onClose={() => { setShowTaraModal(false); setCurrentWeight("0.00"); }}
                onConfirm={() => { setTara(currentWeight); setCurrentWeight("0.00"); setShowTaraModal(false); }}
            />

            <BasculaModal
                isOpen={showGuardarModal}
                title="PASO 2: PESO NETO"
                subtitle={selectedProduct?.Nombre}
                currentReading={netWeight}
                buttonText="GUARDAR REGISTRO"
                colorClass="bg-emerald-600 border-emerald-900 shadow-emerald-600/20"
                disabledConfirm={parseFloat(netWeight) <= 0}
                showSimulate={true}
                onSimulate={() => setCurrentWeight((Math.random() * 30 + 5).toFixed(2))}
                onClose={() => { setShowGuardarModal(false); setCurrentWeight("0.00"); }}
                onConfirm={registrarPesaje}
            />

            <div className="flex-1 flex flex-col min-h-0 gap-4">
                <header className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-md border border-slate-300">
                    <div>
                        <button onClick={() => setSelectedLote(null)} className="text-[10px] text-slate-400 hover:text-red-600 mb-1 block">← VOLVER</button>
                        <h1 className="text-2xl text-slate-800 leading-none">{selectedLote.Proveedor}</h1>
                        <p className="text-[10px] text-red-600 tracking-widest">LOTE: {selectedLote.Lote} | TARA: {tara} KG</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-slate-400">TOTAL ACUMULADO</p>
                        <p className="text-3xl text-slate-800 font-mono">{totalKilosLote} KG</p>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scroll pr-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {dbProducts.map((p) => (
                            <button
                                key={p.IdProducto}
                                onClick={() => { setSelectedProduct(p); setPiezas(p.PiezasTeoricas); }}
                                className={`p-4 rounded-[2rem] text-left border-4 h-36 flex flex-col justify-between transition-all shadow-md
                                    ${selectedProduct?.IdProducto === p.IdProducto ? "border-red-600 bg-white scale-105" : "border-white bg-white/80"}`}
                            >
                                <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-lg w-fit">{p.PiezasTeoricas} PZS</span>
                                <span className="text-[12px] leading-tight text-slate-800 line-clamp-2">{p.Nombre}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-1/3 bg-white rounded-[2.5rem] shadow-inner border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b text-[9px] text-slate-400 sticky top-0">
                            <tr><th className="p-4">PRODUCTO</th><th className="p-4 text-center">PZS</th><th className="p-4 text-right">PESO</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 overflow-y-auto">
                            {historial.map((reg, i) => (
                                <tr key={i} className="text-[11px] font-bold text-slate-700">
                                    <td className="p-4 truncate">{reg.Producto}</td>
                                    <td className="p-4 text-center">{reg.Piezas}</td>
                                    <td className="p-4 text-right font-black">{parseFloat(reg.KG || 0).toFixed(2)} KG</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <aside className="w-full lg:w-[400px] flex flex-col gap-4">
                <div className="bg-slate-900 rounded-[3rem] p-6 border-4 border-slate-800 shadow-2xl">
                    <div className="bg-[#0f1713] rounded-[2rem] p-8 border-4 border-black text-center">
                        <div className="text-7xl font-mono text-green-400 leading-none">{netWeight}</div>
                        <span className="text-green-900 text-[10px] mt-2 block tracking-widest font-black uppercase">PESO NETO (KG)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-slate-800 p-4 rounded-2xl text-center border border-slate-700">
                            <div className="text-xl font-mono text-blue-400">{pesoBruto.toFixed(2)}</div>
                            <span className="text-slate-500 text-[8px] uppercase">Bruto</span>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-2xl text-center border border-slate-700">
                            <div className="text-xl font-mono text-red-400">-{pesoTara.toFixed(2)}</div>
                            <span className="text-slate-500 text-[8px] uppercase">Tara</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[3rem] border-4 border-slate-300 flex flex-col gap-4 shadow-xl">
                    <button onClick={() => { setCurrentWeight("0.00"); setShowTaraModal(true); }} className="bg-slate-800 text-white py-5 rounded-2xl text-xs border-b-8 border-black active:translate-y-1 active:border-b-0 transition-all">
                        {parseFloat(tara) > 0 ? "RE-PESAR TARA" : "1. CONFIGURAR TARA"}
                    </button>

                    <div>
                        <label className={`text-[10px] block mb-2 text-center tracking-widest font-black uppercase ${piezas <= 0 ? 'text-red-500' : 'text-slate-400'}`}>
                            {piezas <= 0 ? "⚠️ Ajuste Piezas" : "Ajustar Piezas"}
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={piezas}
                            onChange={(e) => setPiezas(Math.max(0, parseInt(e.target.value) || 0))}
                            className={`w-full bg-slate-100 border-4 rounded-2xl font-black text-center text-5xl p-4 outline-none transition-all
                                ${piezas <= 0 ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-red-600'}`}
                        />
                    </div>

                    <div>
                        <label className={`text-[10px] block mb-2 text-center tracking-widest font-black uppercase ${!selectedArea ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                            {!selectedArea ? "⚠️ Elija Área de Salida" : "Área de Salida"}
                        </label>
                        <div className="flex gap-2">
                            {almacenes.map(a => (
                                <button key={a.id || a.IdAlmacen} onClick={() => setSelectedArea(a.id || a.IdAlmacen)}
                                    className={`flex-1 py-4 rounded-2xl text-[10px] transition-all border-b-4 font-black ${selectedArea === (a.id || a.IdAlmacen) ? 'bg-yellow-400 border-yellow-600 text-yellow-900' : 'bg-slate-100 border-slate-300 text-slate-400'}`}>
                                    {a.Nombre?.substring(0, 10)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => { setCurrentWeight("0.00"); setShowGuardarModal(true); }}
                        disabled={!isReadyToWeigh}
                        className={`w-full py-8 rounded-[2.5rem] text-3xl border-b-[12px] shadow-2xl transition-all font-black
                            ${!isReadyToWeigh
                                ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                                : "bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-500 active:translate-y-2 active:border-b-0"}`}
                    >
                        {parseFloat(tara) <= 0
                            ? "FALTA TARA"
                            : !selectedProduct
                                ? "ELIJA PRODUCTO"
                                : !selectedArea
                                    ? "ELIJA ÁREA"
                                    : piezas <= 0
                                        ? "INDIQUE PIEZAS"
                                        : "2. PESAR"}
                    </button>
                </div>
            </aside>
        </div>
    );
}