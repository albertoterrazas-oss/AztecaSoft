import { useEffect, useState, useCallback, useMemo } from "react";
import { Toaster, toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import BasculaModal from "@/Components/BasculaPesa";
import CanastillaModal from "@/Components/Canastillas.jsx";
import axios from "axios";
import { Scale, Trash2, Save, Blend, ChevronRight, ShoppingBasket,Package, Loader2 } from 'lucide-react';
import HeaderPanel from '../../Components/HeaderPanel.jsx';

export default function DeshueseDashboard() {
    // --- ESTADOS ---
    const [lotes, setLotes] = useState([]);
    const [dbProducts, setDbProducts] = useState([]);
    const [records, setRecords] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [selectedLote, setSelectedLote] = useState(null);
    const [selectedParent, setSelectedParent] = useState(null);
    const [selectedChild, setSelectedChild] = useState(null);
    const [parentFilter, setParentFilter] = useState(null);
    const [areaDestino, setAreaDestino] = useState(null);

    const [currentWeight, setCurrentWeight] = useState("0.00");
    const [taraGlobal, setTaraGlobal] = useState("0.00");
    const [colorTaraActiva, setColorTaraActiva] = useState("#64748b");
    const [nombreTaraActiva, setNombreTaraActiva] = useState("");

    const [showTaraModal, setShowTaraModal] = useState(false);
    const [showPesarModal, setShowPesarModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [idBasculaConfigurada, setIdBasculaConfigurada] = useState("");
    const [finDelLote, setFinDelLote] = useState(false);

    // --- CÁLCULOS ---
    const pesoBruto = parseFloat(currentWeight || 0);
    const pesoTara = parseFloat(taraGlobal || 0);
    const netWeight = useMemo(() => Math.max(0, pesoBruto - pesoTara).toFixed(2), [pesoBruto, pesoTara]);

    // --- CARGA DE DATOS ---
    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [resL, resA, resP] = await Promise.all([
                axios.get("/api/LotesDeshuese"),
                axios.get("/api/almacenes"),
                axios.get("/api/getsubproductos")
            ]);
            setLotes(resL.data || []);
            setDbProducts(resP.data || []);

            const limp = resA.data.find(a => a.Nombre?.toUpperCase() === "DESHUESE");
            if (limp?.bascula?.puerto) setIdBasculaConfigurada(limp.bascula.puerto);

            const filteredAlmacenes = resA.data.filter(a => !["ENTRADA", "LIMPIEZA", 'RECEPCION', 'DESHUESE', 'VENTA'].some(w => a.Nombre.toUpperCase().includes(w)));
            if (filteredAlmacenes.length > 0) setAreaDestino(filteredAlmacenes[0].IdAlmacen);
        } catch (e) {
            toast.error("Error al cargar datos");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- HANDLERS ---
    const handleLoteSelect = async (lote) => {
        setSelectedLote(lote);
        try {
            const res = await axios.post("/api/ProductosLotesHistorial", { opcion: 'A', Lote: lote.Lote, idAlmacen: 3 });
            setRecords(res.data || []);
            setTimeout(() => setShowTaraModal(true), 400);
        } catch (e) { toast.error("Error al cargar historial"); }
    };

    const agregarAlCarrito = (pesoBrutoFinal, pesoTaraFinal) => {
        const pesoNeto = Math.max(0, parseFloat(pesoBrutoFinal) - parseFloat(pesoTaraFinal)).toFixed(2);
        const nuevoItem = {
            id: selectedChild.IdProducto,
            nombre: selectedChild.Nombre,
            peso: parseFloat(pesoNeto),
            colorCanastilla: colorTaraActiva,
            piezas: 1, // Por defecto 1 o puedes agregar un input
            tempId: Date.now()
        };
        setCarrito([...carrito, nuevoItem]);
        setSelectedChild(null);
        setCurrentWeight("0.00");
        setShowPesarModal(false);
        toast.info(`${nuevoItem.nombre} añadido`);
    };

    const finalizarDeshuese = async () => {
        if (carrito.length === 0 || !areaDestino) return;
        setIsProcessing(true);
        const user = JSON.parse(localStorage.getItem('perfil'))?.IdUsuario || 1;

        try {
            const payload = {
                id_lote: selectedLote.Lote,
                id_producto_origen: selectedParent.IdProducto,
                id_almacen_origen: 3,
                id_almacen_destino: areaDestino,
                peso_entrada: parseFloat(selectedParent.pesoOriginal) || 0,
                piezas_entrada: parseInt(selectedParent.piezasOriginales) || 0,
                datos_json: JSON.stringify(carrito.map(({ id, nombre, peso, piezas }) => ({ id, nombre, peso, piezas }))),
                idusuario: user,
                finDelLote: finDelLote ? 1 : 0,

            };

            const res = await axios.post("/api/despiece", payload);

            // Si el backend responde con success: false pero entra al try (status 200)
            if (res.data.success === false) {
                toast.error(res.data.message || "Inventario insuficiente");
                return;
            }

            toast.success("DATOS GUARDADOS CORRECTAMENTE");

            setCarrito([]);
            setParentFilter(null);
            setSelectedParent(null);
            setSelectedLote(null);
            setCurrentWeight("0.00");

            await fetchData();

        } catch (e) {
            // --- MANEJO DE ERROR DEL SERVIDOR (SQL) ---
            console.error("Error de despiece:", e);

            // Extraemos el mensaje que mandó el servidor (el que viste en el Preview)
            const errorMsg = e.response?.data?.message || "Error al procesar el guardado";
            const debugMsg = e.response?.data?.debug || "";

            if (debugMsg.includes("Inventario insuficiente")) {
                toast.error("ERROR: No hay stock suficiente del producto padre para este despiece.");
            } else {
                toast.error(errorMsg);
            }

        } finally {
            setIsProcessing(false);
        }
    };

    const productosVisibles = useMemo(() => {
        const idsConStock = records.map(r => String(r.idProducto || r.IdProducto));
        if (!parentFilter) {
            return dbProducts.filter(p => p.hijos?.length > 0).map(p => ({
                ...p, tieneStock: idsConStock.includes(String(p.IdProducto))
            }));
        }
        const padre = dbProducts.find(p => String(p.IdProducto) === String(parentFilter));
        return padre ? (padre.hijos || []).map(h => ({ ...h, tieneStock: true })) : [];
    }, [dbProducts, parentFilter, records]);

    if (isLoading) return <div className="h-full flex items-center justify-center"><LoadingDiv /></div>;

    if (!selectedLote) {
        return (
            // <div className="h-full bg-slate-100 p-8 flex flex-col items-center justify-center font-black uppercase">
            //     <HeaderPanel badgeText="Azteca AVT" title="Panel de Pesaje:" subtitle="Deshuese" onRefresh={fetchData} />
            //     <div className="grid gap-4 w-full max-w-7xl mt-6">
            //         {lotes.map((lote) => (
            //             <button key={lote.Lote} onClick={() => handleLoteSelect(lote)} className="bg-white p-6 rounded-[2.5rem] flex items-center justify-between border-4 border-transparent hover:border-red-600 transition-all shadow-xl group">
            //                 <div className="text-left font-black">
            //                     <span className="text-xs text-red-600">LOTE #{lote.Lote}</span>
            //                     <h3 className="text-2xl text-slate-700">{lote.Proveedor}</h3>
            //                 </div>
            //                 <div className="bg-slate-100 group-hover:bg-red-600 group-hover:text-white p-5 rounded-3xl transition-all">
            //                     <ChevronRight size={32} strokeWidth={4} />
            //                 </div>
            //             </button>
            //         ))}
            //     </div>
            //     <Toaster position="top-right" richColors />
            // </div>

            <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center justify-center font-black uppercase">
                <div className="max-w-7xl w-full">
                    <HeaderPanel
                        badgeText="Azteca AVT"
                        title="Panel de Pesaje:"
                        subtitle="Deshuese"
                        onRefresh={fetchData}
                    />
                    <div className="grid gap-4 mt-8">
                        {lotes.length > 0 ? (
                            lotes.map((lote) => (
                                <button key={lote.Lote} onClick={() => handleLoteSelect(lote)} className="bg-white p-6 rounded-[2.5rem] flex items-center justify-between border-4 border-transparent hover:border-[#1B2654] transition-all shadow-xl group">
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

    return (
        <div className="relative flex flex-col lg:flex-row h-full bg-slate-200 p-4 gap-4 font-black uppercase overflow-hidden">
            <Toaster position="top-right" richColors />

            <CanastillaModal
                isOpen={showTaraModal}
                onClose={() => setShowTaraModal(false)}
                basculaId={idBasculaConfigurada}
                onConfirm={(b, t, canastilla) => {
                    setTaraGlobal(t);
                    setColorTaraActiva(canastilla.colorHex);
                    setNombreTaraActiva(canastilla.nombre);
                    setShowTaraModal(false);
                }}
            />

            <BasculaModal
                isOpen={showPesarModal}
                currentReading={currentWeight}
                tara={taraGlobal}
                onClose={() => setShowPesarModal(false)}
                basculaId={idBasculaConfigurada}
                onConfirm={(b, t) => agregarAlCarrito(b, t)}
            />

            <div className="flex-1 flex flex-col min-h-0 gap-4">
                <header className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-[10px] border-slate-300 flex justify-between items-center">
                    <div>
                        <button onClick={() => { setSelectedLote(null); setCarrito([]); }} className="text-[10px] text-slate-400 mb-1 block">← VOLVER</button>
                        <h1 className="text-2xl text-slate-800 leading-none">{selectedLote.Proveedor}</h1>
                        <p className="text-[10px] text-red-600 tracking-widest">LOTE: {selectedLote.Lote} | TARA: {taraGlobal} KG</p>
                    </div>
                    {selectedParent && <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] border-b-4 border-emerald-700">PADRE: {selectedParent.Nombre}</div>}
                </header>

                <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white rounded-[2.5rem] border-b-[10px] border-slate-300 shadow-xl">
                    <div className="flex-1 overflow-y-auto p-6 custom-scroll">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            {parentFilter && (
                                <button onClick={() => { setParentFilter(null); setSelectedParent(null); }} className="text-[10px] text-slate-400 mb-1 block col-span-full text-left uppercase hover:text-blue-600 transition-colors">← VOLVER A PADRES</button>
                            )}
                            {productosVisibles.map((p) => {
                                const isSelected = selectedChild?.IdProducto === p.IdProducto;
                                return (
                                    <button
                                        key={p.IdProducto}
                                        disabled={!p.tieneStock}
                                        onClick={() => {
                                            if (!parentFilter) {
                                                const r = records.find(rec => String(rec.idProducto || rec.IdProducto) === String(p.IdProducto));
                                                setParentFilter(p.IdProducto);
                                                setSelectedParent({ ...p, pesoOriginal: r?.KG || r?.Peso, piezasOriginales: r?.Piezas });
                                            } else {
                                                setSelectedChild(p);
                                            }
                                        }}
                                        className={`p-4 rounded-[2rem] text-left border-b-[8px] h-28 flex flex-col justify-between transition-all shadow-md active:translate-y-1 active:border-b-0
                                            ${!p.tieneStock ? "opacity-30 grayscale bg-slate-100 border-slate-200" : isSelected ? "border-blue-600 bg-blue-50 ring-4 ring-blue-100" : "border-slate-300 bg-white"}`}
                                    >
                                        <span className={`text-[8px] px-2 py-0.5 rounded-lg text-white w-fit ${p.EsSubproducto === "1" ? 'bg-orange-500' : 'bg-blue-600'}`}>{p.EsSubproducto === "1" ? 'CORTE' : 'PADRE'}</span>
                                        <span className="text-[10px] leading-tight text-slate-800 font-black">{p.Nombre}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-slate-50 border-t-4 border-slate-100 p-4">
                        <div className="flex items-center gap-2 mb-3 px-2">
                            <Blend size={16} className="text-slate-400" />
                            <span className="text-[10px] text-slate-500 font-black tracking-widest">RESUMEN ({carrito.length})</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 px-2 custom-scroll">
                            {carrito.length === 0 ? (
                                <p className="text-[10px] text-slate-300 italic py-2 uppercase">Sin pesajes registrados...</p>
                            ) : (
                                carrito.map((item, index) => (
                                    <div
                                        key={item.tempId}
                                        style={{ backgroundColor: item.colorCanastilla }}
                                        className="flex-shrink-0 text-white p-3 rounded-2xl min-w-[150px] relative border-b-4 border-black/30 shadow-lg"
                                    >
                                        <div className="flex items-center gap-1 mb-1 opacity-80">
                                            <ShoppingBasket size={10} />
                                            <span className="text-[8px] font-bold uppercase tracking-wider">Canastilla {index + 1}</span>
                                        </div>
                                        <p className="text-[9px] font-black truncate pr-5 uppercase">{item.nombre}</p>
                                        <p className="text-[14px] text-white font-mono">{item.peso} <span className="text-[8px]">KG</span></p>
                                        <button onClick={() => setCarrito(carrito.filter(i => i.tempId !== item.tempId))} className="absolute top-2 right-2 text-white/70 hover:text-white"><Trash2 size={14} /></button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <aside className="w-full lg:w-[380px] flex flex-col gap-4">
                <div className="bg-slate-900 rounded-[2.5rem] p-6 shadow-xl border-4 border-slate-800">
                    <div className="bg-black rounded-[1.5rem] p-6 border-2 border-slate-700 text-center mb-4">
                        <div className="text-7xl font-mono text-green-400 tracking-tighter">{netWeight}</div>
                        <span className="text-green-800 text-[9px] tracking-[0.3em]">PESO NETO KG</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-slate-800 p-3 rounded-xl border-b-2 border-black">
                            <div className="text-blue-400 font-mono text-xl">{pesoBruto.toFixed(2)}</div>
                            <span className="text-slate-500 text-[8px]">BRUTO</span>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-xl border-b-2 border-black">
                            <div className="font-mono text-xl" style={{ color: colorTaraActiva }}>-{pesoTara.toFixed(2)}</div>
                            <span className="text-slate-500 text-[8px]">TARA</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border-b-[10px] border-slate-300 flex flex-col gap-5 shadow-xl">
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

                    <div className="space-y-3">

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
                            onClick={() => setShowPesarModal(true)}
                            disabled={!selectedChild}
                            style={{ backgroundColor: selectedChild ? '#1B2654' : undefined }}
                            className={`w-full py-5 rounded-2xl text-xl font-black border-b-[8px] transition-all flex items-center justify-center gap-2
    ${!selectedChild
                                    ? "bg-slate-100 text-slate-300 border-slate-200"
                                    : "text-white border-blue-900 hover:opacity-90 active:translate-y-1 active:border-b-0"
                                }`}
                        >
                            <Scale size={20} /> AÑADIR CORTE
                        </button>

                        <button
                            onClick={finalizarDeshuese}
                            disabled={carrito.length === 0 || isProcessing}
                            className={`w-full py-7 rounded-[2rem] text-2xl font-black border-b-[10px] transition-all flex items-center justify-center gap-3
                                ${carrito.length === 0 || isProcessing ? "bg-slate-200 text-slate-400 border-slate-300" : "bg-emerald-600 text-white border-emerald-800 active:translate-y-2 active:border-b-0"}`}
                        >
                            {isProcessing ? <Loader2 className="animate-spin" /> : <><Save size={24} /> GUARDAR TODO</>}
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}