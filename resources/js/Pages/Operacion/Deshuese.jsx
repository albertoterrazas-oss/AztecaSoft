import { useEffect, useState, useCallback, useMemo } from "react";
import { Toaster, toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import BasculaModal from "@/Components/BasculaPesa";
import axios from "axios";
import { Package, ChevronRight, Scale, RotateCcw, Trash2, Save, Blend, ShoppingCart } from 'lucide-react';
import HeaderPanel from '../../Components/HeaderPanel.jsx';

export default function DeshueseDashboard() {
    const [lotes, setLotes] = useState([]);
    const [dbProducts, setDbProducts] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [records, setRecords] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [finDelLote, setFinDelLote] = useState(false);

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

    const pesoBruto = parseFloat(currentWeight || 0);
    const pesoTara = parseFloat(taraGlobal || 0);
    const netWeight = useMemo(() => Math.max(0, pesoBruto - pesoTara).toFixed(2), [pesoBruto, pesoTara]);
    const [idBasculaConfigurada, setIdBasculaConfigurada] = useState("");
    // Función para obtener datos (Memorizada para evitar loops)
    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [resL, resA, resP, resR, conges] = await Promise.all([
                axios.get("/api/LotesDeshuese"),
                axios.get("/api/almacenes"),
                axios.get("/api/getsubproductos"),
                axios.get("/api/AlmacenesRefrigerados")
            ]);
            setLotes(resL.data || []);
            setDbProducts(resP.data || []);

            const limp = resA.data.find(a => a.Nombre?.toUpperCase() === "DESHUESE");
            if (limp?.bascula?.puerto) setIdBasculaConfigurada(limp.bascula.puerto);
            const filteredAlmacenes = (resA.data || []).filter(a => !["ENTRADA", "LIMPIEZA", 'RECEPCION', 'DESHUESE', 'VENTA'].some(w => a.Nombre.toUpperCase().includes(w)));
            setAlmacenes(filteredAlmacenes);
            if (filteredAlmacenes.length > 0) setAreaDestino(filteredAlmacenes[0].IdAlmacen);
        } catch (e) {
            toast.error("Error de conexión al cargar catálogos");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleLoteSelect = async (lote) => {
        setSelectedLote(lote);
        try {
            const res = await axios.post("/api/ProductosLotesHistorial", { opcion: 'A', Lote: lote.Lote, idAlmacen: 3 });
            setRecords(res.data || []);
            setTimeout(() => setShowTaraModal(true), 400);
        } catch (e) {
            toast.error("Error al cargar existencias del lote");
        }
    };

    const agregarAlCarrito = (pesoBrutoFinal) => {
        const pesoNeto = Math.max(0, parseFloat(pesoBrutoFinal) - pesoTara).toFixed(2);
        const nuevoItem = {
            id: selectedChild.IdProducto,
            nombre: selectedChild.Nombre,
            peso: parseFloat(pesoNeto),
            piezas: parseInt(piezas) || 0,
            tempId: Date.now()
        };
        setCarrito([...carrito, nuevoItem]);
        setSelectedChild(null);
        setPiezas("");
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

            await axios.post("/api/despiece", payload);
            toast.success("DATOS GUARDADOS CORRECTAMENTE");

            // LIMPIEZA DE ESTADOS Y ACTUALIZACIÓN DE DATOS
            setCarrito([]);
            setParentFilter(null);
            setSelectedParent(null);
            setSelectedLote(null); // Regresamos a la lista de lotes

            setCurrentWeight("0.00");

            // setTara("0.000");
            setTimeout(() => setShowTaraModal(true), 400);

            // REFRESCAR LA LISTA DE LA BASE DE DATOS
            await fetchData();

        } catch (e) {
            toast.error("Error al procesar el guardado");
        } finally {
            setIsProcessing(false);
        }
    };

    const productosVisibles = useMemo(() => {
        const idsConStock = records.map(r => String(r.idProducto || r.IdProducto));
        if (!parentFilter) {
            return dbProducts.filter(p => p.hijos && p.hijos.length > 0).map(p => ({
                ...p,
                tieneStock: idsConStock.includes(String(p.IdProducto))
            }));
        }
        const padre = dbProducts.find(p => String(p.IdProducto) === String(parentFilter));
        return padre ? (padre.hijos || []).map(h => ({ ...h, tieneStock: true })) : [];
    }, [dbProducts, parentFilter, records]);

    if (isLoading) return <div className="h-[100%] flex items-center justify-center bg-slate-100"><LoadingDiv /></div>;

    if (!selectedLote) {
        return (

            <div className="h-[100%] bg-slate-100 p-8 flex flex-col items-center justify-center font-black uppercase">
                <div className="max-w-7xl w-full">

                    <HeaderPanel
                        badgeText="Azteca AVT"
                        title="Panel de Pesaje:"
                        subtitle="Deshuese"
                        onRefresh={fetchData}
                    />

                    <div className="grid gap-4">
                        {lotes.length > 0 ? (
                            lotes.map((lote) => (
                                <button key={lote.Lote} onClick={() => handleLoteSelect(lote)} className="bg-white p-6 rounded-[2.5rem] flex items-center justify-between border-4 border-transparent hover:border-red-600 transition-all shadow-xl group">
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
                                <h2 className="text-2xl text-slate-400 text-center">No hay lotes en deshuese activos</h2>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col lg:flex-row h-[100%] bg-slate-200 p-4 gap-4 font-black uppercase overflow-hidden">

            <BasculaModal
                isOpen={showTaraModal}
                title="PESAR TARA"
                subtitle="Coloque recipiente vacío"
                currentReading={currentWeight}
                buttonText="GUARDAR TARA"
                colorClass="bg-red-600 border-red-900 hover:bg-red-500"
                onClose={() => setShowTaraModal(false)}
                basculaId={idBasculaConfigurada}
                onConfirm={(b, t) => { setTaraGlobal(t); setShowTaraModal(false); }}
            />

            <BasculaModal
                isOpen={showPesarModal}
                title="PESAR PRODUCTO"
                subtitle={selectedChild?.Nombre}
                currentReading={currentWeight}
                tara={taraGlobal}
                buttonText="CONFIRMAR Y GUARDAR"
                colorClass="bg-emerald-600 border-emerald-900 hover:bg-emerald-500"
                // destinationName={almacenes.find(a => (a.id || a.IdAlmacen) === selectedArea)?.Nombre}
                onClose={() => setShowPesarModal(false)}
                basculaId={idBasculaConfigurada}
                onConfirm={(b, t) => agregarAlCarrito(b, t)}
            />


            <div className="flex-1 flex flex-col min-h-0 gap-4">
                <header className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-[10px] border-slate-300 flex justify-between items-center">
                    <div>
                        <button onClick={() => { setSelectedLote(null); setParentFilter(null); setSelectedParent(null); setCarrito([]); }} className="text-[10px] text-slate-400 mb-1 block">← VOLVER</button>
                        <h1 className="text-2xl text-slate-800 leading-none">{selectedLote.Proveedor}</h1>
                        <p className="text-[10px] text-red-600 font-bold tracking-widest">LOTE: {selectedLote.Lote} | TARA: {taraGlobal} KG</p>
                    </div>
                    {selectedParent && <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] border-b-4 border-emerald-700 animate-pulse">PADRE: {selectedParent.Nombre}</div>}
                </header>

                <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white rounded-[2.5rem] border-b-[10px] border-slate-300 shadow-xl">
                    <div className="flex-1 overflow-y-auto p-6 custom-scroll">
                        {/* <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            <button onClick={() => {  setSelectedParent(null);  }} className="text-[10px] text-slate-400 mb-1 block">← VOLVER</button>

                            {productosVisibles.map((p) => {
                                const isSelected = selectedChild?.IdProducto === p.IdProducto || (parentFilter === p.IdProducto && !selectedChild);
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
                        </div> */}

                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            {/* El botón solo se renderiza si parentFilter no es nulo/vacío */}
                            {parentFilter && (
                                <button
                                    onClick={() => {
                                        setParentFilter(null); // Limpiamos el filtro para volver al inicio
                                        setSelectedParent(null);
                                        setSelectedChild(null);
                                    }}
                                    className="text-[10px] text-slate-400 mb-1 block col-span-full text-left hover:text-blue-600 transition-colors"
                                >
                                    ← VOLVER A PRODUCTOS PADRE
                                </button>
                            )}

                            {productosVisibles.map((p) => {
                                const isSelected = selectedChild?.IdProducto === p.IdProducto || (parentFilter === p.IdProducto && !selectedChild);
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
                                        <span className={`text-[8px] px-2 py-0.5 rounded-lg text-white w-fit ${p.EsSubproducto === "1" ? 'bg-orange-500' : 'bg-blue-600'}`}>
                                            {p.EsSubproducto === "1" ? 'CORTE' : 'PADRE'}
                                        </span>
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
                                carrito.map((item) => (
                                    <div key={item.tempId} className="flex-shrink-0 bg-slate-800 text-white p-3 rounded-2xl min-w-[150px] relative border-b-4 border-black">
                                        <p className="text-[9px] font-black truncate pr-5 uppercase">{item.nombre}</p>
                                        <p className="text-[14px] text-green-400 font-mono">{item.peso} <span className="text-[8px]">KG</span></p>
                                        <button
                                            onClick={() => setCarrito(carrito.filter(i => i.tempId !== item.tempId))}
                                            className="absolute top-2 right-2 text-red-500 hover:scale-125 transition-transform"
                                        >
                                            <Trash2 size={14} />
                                        </button>
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
                            <div className="text-red-400 font-mono text-xl">-{pesoTara.toFixed(2)}</div>
                            <span className="text-slate-500 text-[8px]">TARA</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border-b-[10px] border-slate-300 flex flex-col gap-5 shadow-xl">

                    <button onClick={() => { setCurrentWeight("0.00"); setShowTaraModal(true); }} className="bg-slate-800 text-white py-3 rounded-xl text-[10px] border-b-4 border-black font-black uppercase">Cambiar Tara</button>


                    <label className="flex items-center gap-3 px-2 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={finDelLote} // Asegúrate de tener este estado en tu componente
                                onChange={(e) => setFinDelLote(e.target.checked)}
                                className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border-2 border-slate-300 transition-all checked:bg-emerald-600 checked:border-emerald-700"
                            />
                            {/* Ícono de check manual */}
                            <svg className="absolute w-4 h-4 text-white p-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none left-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span className="text-slate-700 font-bold text-sm uppercase selection:bg-transparent">
                            ¿Fin del lote?
                        </span>
                    </label>
                    <div className="space-y-3 pt-2">
                        <button
                            onClick={() => setShowPesarModal(true)}
                            disabled={!selectedChild}
                            className={`w-full py-5 rounded-2xl text-xl font-black border-b-[8px] transition-all flex items-center justify-center gap-2
                                ${!selectedChild ? "bg-slate-100 text-slate-300 border-slate-200" : "bg-blue-600 text-white border-blue-800 active:translate-y-1 active:border-b-0 hover:bg-blue-500"}`}
                        >
                            <Scale size={20} /> AÑADIR CORTE
                        </button>

                        <button
                            onClick={finalizarDeshuese}
                            disabled={carrito.length === 0 || isProcessing}
                            className={`w-full py-7 rounded-[2rem] text-2xl font-black border-b-[10px] transition-all flex items-center justify-center gap-3
                                ${carrito.length === 0 ? "bg-slate-200 text-slate-400 border-slate-300" : "bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-500 active:translate-y-2 active:border-b-0 shadow-emerald-200"}`}
                        >
                            {isProcessing ? <LoadingDiv /> : <><Save size={24} /> GUARDAR TODO</>}
                        </button>
                    </div>

                    {/* <button onClick={() => setShowTaraModal(true)} className="text-[10px] text-slate-400 flex items-center justify-center gap-2 hover:text-red-600 transition-colors">
                        <RotateCcw size={12} /> RE-PESAR TARA (ACTUAL: {taraGlobal})
                    </button> */}
                </div>
            </aside>
        </div>
    );
}