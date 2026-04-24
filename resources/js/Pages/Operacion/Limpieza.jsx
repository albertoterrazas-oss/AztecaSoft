import { useEffect, useState, useCallback, useRef } from "react";
import { Toaster, toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";
import BasculaModal from '../../Components/BasculaPesa.jsx';
import HeaderPanel from '../../Components/HeaderPanel.jsx';
import CanastillaModal from "@/Components/Canastillas.jsx";
import { Scale, ChevronLeft, Package, CheckCircle2, ShoppingBasket, ChevronRight } from "lucide-react";

const route = (name) => {
    const routeMap = {
        "LotesLimpieza": "/api/LotesLimpieza",
        "pesaje.guardar-traspaso": "/api/pesaje/guardar-traspaso",
        "AlmacenesListar": "/api/almacenes",
        "ProductosLotesHistorial": "/api/ProductosLotesHistorial",
    };
    return routeMap[name] || `/${name}`;
};

// Componente de Modal de Éxito estilizado
const SuccessModal = ({ isOpen, onClose, message, registeredWeight }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#1B2654]/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-10 text-center shadow-2xl animate-in zoom-in duration-300 border-t-8 border-emerald-500">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={40} strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-black text-slate-400 uppercase tracking-widest">¡Guardado!</h2>
                <div className="my-6 bg-slate-900 rounded-3xl p-6 border-4 border-slate-200">
                    <div className="text-5xl font-mono text-emerald-400 font-black">
                        {registeredWeight} <span className="text-xl">KG</span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-black mt-2 tracking-[0.3em] uppercase">Peso Neto Registrado</div>
                </div>
                <p className="text-slate-500 font-bold mb-8 uppercase text-xs leading-tight">{message}</p>
                <button
                    onClick={onClose}
                    className="w-full py-5 rounded-2xl bg-[#1B2654] text-white text-xl font-black hover:bg-[#253370] transition-all border-b-8 border-black active:translate-y-1 active:border-b-0 uppercase"
                >
                    Continuar
                </button>
            </div>
        </div>
    );
};

export default function WeighingDashboardLimpieza() {
    // --- ESTADOS ---
    const [lotes, setLotes] = useState([]);
    const [selectedLote, setSelectedLote] = useState(null);
    const [dbProducts, setDbProducts] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Pesaje
    const [currentWeight, setCurrentWeight] = useState("0.00");
    const [taraGlobal, setTaraGlobal] = useState("0.00");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);
    const [finDelLote, setFinDelLote] = useState(false);

    // Modales
    const [showTaraModal, setShowTaraModal] = useState(false);
    const [showGuardarModal, setShowGuardarModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [lastRegisteredWeight, setLastRegisteredWeight] = useState("0.00");

    const [idBasculaConfigurada, setIdBasculaConfigurada] = useState("");
    const hasFetchedInitialData = useRef(false);

    // --- CÁLCULOS ---
    const pesoBruto = parseFloat(currentWeight || 0);
    const pesoTara = parseFloat(taraGlobal || 0);
    const netWeight = Math.max(0, (pesoBruto - pesoTara)).toFixed(2);
    const canOpenGuardar = !isProcessing && selectedProduct && pesoTara > 0;

    //  const [taraGlobal, setTaraGlobal] = useState("0.00");
    const [colorTaraActiva, setColorTaraActiva] = useState("#64748b");
    const [nombreTaraActiva, setNombreTaraActiva] = useState("");

    // --- FUNCIONES DE CARGA ---
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
                KG: parseFloat(p.KG || 0).toFixed(2)
            })));
        } catch (e) { toast.error("Error al cargar productos"); }
    };

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

    // --- MANEJADORES ---
    const handleSelectLote = (lote) => {

        console.log('lote',lote)
        setSelectedLote(lote);
        setTaraGlobal("0.00");
        setCurrentWeight("0.00");
        setSelectedProduct(null);
        setFinDelLote(false);
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
                idusuario: user,
                finDelLote: finDelLote ? 1 : 0,
            };

            const res = await axios.post(route("pesaje.guardar-traspaso"), payload);
            setLastRegisteredWeight(pesoNetoFinal);

            if (res.data.lote_cerrado) {
                setSuccessMsg(`Lote #${selectedLote.Lote} Cerrado Exitosamente.`);
                setSelectedLote(null);
                setDbProducts([]);
            } else {
                setSuccessMsg(`${selectedProduct.Nombre} registrado correctamente.`);
                await Promise.all([fetchProductosLote(selectedLote.Lote), fetchHistorial(selectedLote.Lote)]);

                // Limpieza para el siguiente pesaje
                setSelectedProduct(null);
                setCurrentWeight("0.00");
                // setTaraGlobal("0.00");
                // setTimeout(() => setShowTaraModal(true), 600);
            }
            setShowSuccessModal(true);
        } catch (e) {
            toast.error("Error al guardar el pesaje");
        } finally {
            setIsProcessing(false);
            setShowGuardarModal(false);
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-100"><LoadingDiv /></div>;

    // Vista de Selección de Lote
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
                    <div className="grid gap-4 mt-8">
                        {lotes.length > 0 ? (
                            lotes.map((lote) => (
                                <button key={lote.Lote} onClick={() => handleSelectLote(lote)} className="bg-white p-6 rounded-[2.5rem] flex items-center justify-between border-4 border-transparent hover:border-[#1B2654] transition-all shadow-xl group">
                                    <div className="text-left font-black">
                                        <span className="text-xs text-blue-600 uppercase">LOTE EN PROCESO #{lote.Lote}</span>
                                        <h3 className="text-2xl leading-none text-slate-700">{lote.Proveedor}</h3>
                                    </div>
                                    <div className="bg-slate-100 group-hover:bg-[#1B2654] group-hover:text-white p-5 rounded-3xl transition-all">
                                        <Scale size={28} />
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border-4 border-dashed border-slate-300 flex flex-col items-center">
                                <Package size={64} className="text-slate-300 mb-4" />
                                <h2 className="text-2xl text-slate-400 text-center uppercase">No hay lotes disponibles</h2>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Vista de Panel de Pesaje
    return (
        <div className="flex flex-col lg:flex-row h-screen bg-slate-200 p-4 gap-4 overflow-hidden font-black uppercase">
            <Toaster position="top-center" richColors />

            <CanastillaModal
                isOpen={showTaraModal}
                onClose={() => setShowTaraModal(false)}
                basculaId={idBasculaConfigurada}
                onConfirm={(b, t, canastilla) => {
                    setTaraGlobal(t);
                    setShowTaraModal(false);
                    setColorTaraActiva(canastilla.colorHex);
                    setNombreTaraActiva(canastilla.nombre);

                }}
            />

            <BasculaModal
                isOpen={showGuardarModal}
                title="REGISTRAR PESO"
                subtitle={selectedProduct?.Nombre}
                currentReading={currentWeight}
                tara={taraGlobal}
                buttonText="GUARDAR CORTE"
                colorClass="bg-[#1B2654] border-[#131a3a] hover:bg-[#253370]"
                onClose={() => setShowGuardarModal(false)}
                basculaId={idBasculaConfigurada}
                onConfirm={(b, t) => registrarPesaje(b, t)}
            />

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                message={successMsg}
                registeredWeight={lastRegisteredWeight}
            />

            {/* Lado Izquierdo: Productos e Historial */}
            <div className="flex-1 flex flex-col min-h-0 gap-3">
                <header className="flex justify-between items-center bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-300">
                    <div>
                        <button onClick={() => setSelectedLote(null)} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-600 mb-1 transition-colors">
                            <ChevronLeft size={12} /> CAMBIAR LOTE
                        </button>
                        <h1 className="text-2xl text-slate-800 leading-none">{selectedLote.Proveedor}</h1>
                        <p className="text-[10px] text-blue-600 font-bold tracking-widest">LOTE: {selectedLote.Lote} | TARA SELECCIONADA: {taraGlobal} KG</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-slate-400">DESTINO FINAL</p>
                        <select
                            value={selectedArea}
                            onChange={(e) => setSelectedArea(e.target.value)}
                            className="text-sm font-black bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border-none focus:ring-2 ring-blue-200 outline-none"
                        >
                            {almacenes.map(a => <option key={a.IdAlmacen || a.id} value={a.IdAlmacen || a.id}>{a.Nombre}</option>)}
                        </select>
                    </div>
                </header>

                {/* Grid de Productos */}
                <div className="flex-1 overflow-y-auto custom-scroll pr-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {dbProducts.map((p) => {
                            const isSelected = selectedProduct?.IdProducto === p.IdProducto;
                            return (
                                <button
                                    key={p.IdProducto}
                                    onClick={() => setSelectedProduct(p)}
                                    className={`p-4 rounded-[2rem] text-left border-b-[10px] h-32 flex flex-col justify-between transition-all shadow-md active:translate-y-2 active:border-b-0
                                        ${isSelected ? "border-[#1B2654] bg-blue-50" : "border-slate-300 bg-white hover:border-slate-400"}`}
                                >
                                    <span className={`text-[10px] px-2 py-0.5 rounded-lg w-fit font-black ${isSelected ? 'bg-[#1B2654] text-white' : 'bg-emerald-600 text-white'}`}>
                                        {p.KG} KG TOTAL
                                    </span>
                                    <span className="text-[13px] leading-tight line-clamp-2 text-slate-800 font-black">{p.Nombre}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Historial Inferior */}
                <div className="h-1/3 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 tracking-widest">HISTORIAL DE PESAJES</span>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">PRODUCCIÓN ACTUAL</span>
                    </div>
                    <div className="overflow-y-auto flex-1 pb-4">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-slate-100 uppercase">
                                {historial.map((reg, i) => (
                                    <tr key={i} className="text-[11px] font-bold hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-slate-700">{reg.Producto}</td>
                                        <td className="p-4 text-center text-slate-400">{reg.Piezas} PZS</td>
                                        <td className="p-4 text-right text-base font-black text-[#1B2654]">{parseFloat(reg.KG || 0).toFixed(2)} KG</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Lado Derecho: Display de Báscula y Botón */}
            <aside className="w-full lg:w-[380px] flex flex-col gap-3">
                <div className="bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl border-4 border-slate-800">
                    <div className="bg-[#0f1713] rounded-[2rem] p-6 border-4 border-black shadow-inner mb-4 text-center">
                        <div className="text-6xl font-mono text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
                            {netWeight}
                        </div>
                        <span className="text-green-900 text-[10px] mt-2 block tracking-widest font-black uppercase">PESO NETO (KG)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/50 p-3 rounded-2xl text-center border border-slate-700">
                            <div className="text-xl font-mono text-blue-400">{pesoBruto.toFixed(2)}</div>
                            <span className="text-slate-500 text-[8px] font-bold uppercase">BRUTO</span>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-2xl text-center border border-slate-700">
                            <div className="text-xl font-mono text-red-400">-{pesoTara.toFixed(2)}</div>
                            <span className="text-slate-500 text-[8px] font-bold uppercase">TARA</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[2.5rem] border-4 border-slate-200 shadow-sm flex flex-col gap-4">
                    {/* <button
                        onClick={() => {
                            setCurrentWeight("0.00");
                            setShowTaraModal(true);
                        }}
                        className="bg-slate-800 text-white py-4 rounded-2xl text-[11px] border-b-4 border-black font-black hover:bg-slate-700 active:translate-y-1 active:border-b-0 transition-all uppercase tracking-tighter"
                    >
                        Cambiar Tara (Canastilla)
                    </button> */}


                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Canastilla Activa</label>
                        <button
                            onClick={() => setShowTaraModal(true)}

                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 hover:border-blue-500 transition-all group text-left shadow-sm"
                        >
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg  transition-transform"
                                style={{ backgroundColor: '#1B2654' }}

                            >
                                <ShoppingBasket size={28} style={{ color: colorTaraActiva }} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-[12px] font-black uppercase text-slate-800 truncate">{nombreTaraActiva || 'Seleccionar'}</p>
                                    <ChevronRight size={16} className="text-slate-300" />
                                </div>
                                <p className="text-[11px] font-mono text-slate-500">Valor: -{pesoTara.toFixed(2)} KG</p>
                            </div>
                        </button>
                    </div>


                    <label className="flex items-center gap-3 px-4 py-3 cursor-pointer bg-slate-50 rounded-2xl border-2 border-transparent hover:border-emerald-500 transition-all group">
                        <input
                            type="checkbox"
                            checked={finDelLote}
                            onChange={(e) => setFinDelLote(e.target.checked)}
                            className="h-6 w-6 rounded-md border-2 border-slate-300 checked:bg-emerald-600 transition-all cursor-pointer"
                        />
                        <span className="text-slate-700 font-bold text-sm uppercase group-hover:text-emerald-700 transition-colors">
                            ¿Finalizar Lote Completo?
                        </span>
                    </label>

                    <button
                        onClick={() => {
                            setCurrentWeight("0.00");
                            setShowGuardarModal(true);
                        }}
                        disabled={!canOpenGuardar}
                        className={`w-full py-6 rounded-[2rem] text-xl border-b-[8px] transition-all font-black flex flex-col items-center justify-center
                            ${!canOpenGuardar
                                ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed"
                                : "bg-[#1B2654] text-white border-[#131a3a] hover:bg-[#253370] active:translate-y-1 active:border-b-0 shadow-lg"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Scale size={24} />
                            <span>AÑADIR CORTE</span>
                        </div>
                        {!selectedProduct && <span className="text-[9px] mt-1 opacity-60">SELECCIONE PRODUCTO</span>}
                        {selectedProduct && pesoTara <= 0 && <span className="text-[9px] mt-1 opacity-60">FALTA TARA</span>}
                    </button>
                </div>
            </aside>
        </div>
    );
}