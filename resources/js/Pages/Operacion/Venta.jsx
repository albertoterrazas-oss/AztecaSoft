import { useEffect, useState, useCallback, useMemo } from "react";
import { Toaster, toast } from "sonner";
import axios from "axios";
import LoadingDiv from "@/Components/LoadingDiv";

// Simulación de rutas
const route = (name) => {
    const routeMap = {
        "clientes.index": "/api/clientes",
        "productos.index": "/api/productos",
        "pedidos.store": "/api/pedidos/guardar",
    };
    return routeMap[name] || `/${name}`;
};

export default function FlexSalesDashboard() {
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // ESTADOS PRINCIPALES
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [observaciones, setObservaciones] = useState("");

    // ESTADOS DEL DIÁLOGO (MODAL DE PESAJE)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeProduct, setActiveProduct] = useState(null);
    const [currentWeight, setCurrentWeight] = useState("0.00");
    const [tara, setTara] = useState("0.00");
    const [piezas, setPiezas] = useState(1);

    const netWeight = useMemo(() => {
        const res = parseFloat(currentWeight) - parseFloat(tara);
        return Math.max(0, res).toFixed(2);
    }, [currentWeight, tara]);

    // CARGA DE DATOS
    const fetchData = useCallback(async () => {
        try {
            const [resCli, resProd] = await Promise.all([
                axios.get(route("clientes.index")),
                axios.get(route("productos.index"))
            ]);
            setClientes(resCli.data.data || resCli.data || []);
            setProductos(resProd.data.data || resProd.data || []);
        } catch (e) { toast.error("ERROR DE CARGA"); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ABRIR PESAJE
    const openWeightModal = (producto) => {
        setActiveProduct(producto);
        setCurrentWeight("0.00");
        setTara("0.00");
        setPiezas(1);
        setIsModalOpen(true);
    };

    // AGREGAR AL TICKET DESDE EL MODAL
    const confirmarPesaje = () => {
        if (parseFloat(netWeight) <= 0) return toast.warning("EL PESO DEBE SER MAYOR A 0");
        
        const subtotal = piezas * (activeProduct.PrecioVenta || 0);
        setCart([...cart, { 
            ...activeProduct, 
            cant: parseInt(piezas), 
            pesoTotal: parseFloat(netWeight),
            subtotal,
            tempId: Date.now() 
        }]);
        
        setIsModalOpen(false);
        toast.success("AÑADIDO AL TICKET");
    };

    const totales = useMemo(() => {
        return cart.reduce((acc, i) => ({
            pzas: acc.pzas + i.cant,
            kg: acc.kg + i.pesoTotal,
            dinero: acc.dinero + i.subtotal
        }), { pzas: 0, kg: 0, dinero: 0 });
    }, [cart]);

    if (isLoading) return <LoadingDiv />;

    return (
        <div className="h-screen bg-slate-50 flex flex-col font-black uppercase overflow-hidden text-slate-800">
            {/* <Toaster position="top-center" richColors /> */}

            {/* HEADER COMPACTO */}
            <header className="bg-white p-4 border-b flex justify-between items-center shrink-0 shadow-sm">
                <div>
                    <h1 className="text-xl italic tracking-tighter text-blue-700">PUNTO DE VENTA & BÁSCULA</h1>
                    <p className="text-[9px] text-slate-400">MODO TABLET - FLUJO FLEXIBLE</p>
                </div>
                <div className="flex gap-4 items-center">
                    <select 
                        onChange={(e) => setSelectedCliente(clientes.find(c => c.IdCliente == e.target.value))}
                        className="bg-slate-100 border-none rounded-xl text-[10px] p-2 outline-none w-48"
                    >
                        <option value="">-- SELECCIONAR CLIENTE --</option>
                        {clientes.map(c => <option key={c.IdCliente} value={c.IdCliente}>{c.RazonSocial}</option>)}
                    </select>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden p-4 gap-4">
                
                {/* IZQUIERDA: CATÁLOGO DE PRODUCTOS (GRID GRANDE) */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="mb-4">
                        <input 
                            type="text" 
                            placeholder="BUSCAR PRODUCTO..." 
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 transition-all"
                        />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pr-2 custom-scrollbar">
                        {productos.filter(p => p.Nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                            <button 
                                key={p.IdProducto}
                                onClick={() => openWeightModal(p)}
                                className="bg-white p-4 rounded-[2rem] border-2 border-transparent hover:border-blue-500 hover:shadow-xl transition-all flex flex-col items-center text-center group active:scale-95"
                            >
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl mb-3 flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    📦
                                </div>
                                <p className="text-[10px] leading-tight h-8 overflow-hidden">{p.Nombre}</p>
                                <p className="text-xs text-blue-600 mt-2">$ {p.PrecioVenta || '0.00'}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* DERECHA: TICKET DE VENTA */}
                <aside className="w-60 md:w-96 h-[80vh] flex flex-col shrink-0 gap-4">
                    <div className="flex-1 bg-white rounded-[2.5rem] shadow-lg border border-slate-200 flex flex-col overflow-hidden">
                        <div className="p-4 border-b bg-slate-50 text-center">
                            <p className="text-[10px] tracking-widest text-slate-400 font-bold">DETALLE DE VENTA</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {cart.length === 0 && <p className="text-center text-[10px] mt-10 opacity-30 italic">SIN PRODUCTOS</p>}
                            {cart.map(item => (
                                <div key={item.tempId} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center animate-in slide-in-from-right-4">
                                    <div className="w-2/3">
                                        <p className="text-[9px] font-bold truncate">{item.Nombre}</p>
                                        <p className="text-[8px] text-blue-600">{item.cant} PZAS | {item.pesoTotal} KG</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold">$ {item.subtotal.toLocaleString()}</p>
                                        <button onClick={() => setCart(cart.filter(i => i.tempId !== item.tempId))} className="text-[8px] text-red-500 underline">QUITAR</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* TOTALES */}
                        <div className="p-5 bg-slate-900 text-white rounded-t-[2.5rem]">
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="bg-white/5 p-2 rounded-xl text-center">
                                    <p className="text-[7px] text-slate-500">PZAS</p>
                                    <p className="text-sm text-blue-400 font-mono">{totales.pzas}</p>
                                </div>
                                <div className="bg-white/5 p-2 rounded-xl text-center">
                                    <p className="text-[7px] text-slate-500">KILOS</p>
                                    <p className="text-sm text-orange-400 font-mono">{totales.kg.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center bg-emerald-600 p-4 rounded-2xl mb-4">
                                <span className="text-[10px]">TOTAL:</span>
                                <span className="text-2xl font-mono">$ {totales.dinero.toLocaleString()}</span>
                            </div>
                            <button 
                                onClick={() => setIsSaving(true)}
                                disabled={cart.length === 0 || !selectedCliente}
                                className={`w-full py-5 rounded-2xl text-[11px] font-black border-b-4 transition-all
                                ${(cart.length > 0 && selectedCliente) ? 'bg-blue-600 border-blue-800 active:translate-y-1 active:border-b-0' : 'bg-slate-800 text-slate-600 pointer-events-none border-transparent'}`}
                            >
                                {isSaving ? 'GUARDANDO...' : 'REGISTRAR SALIDA'}
                            </button>
                        </div>
                    </div>
                </aside>
            </main>

            {/* --- MODAL DE PESAJE (DIALOGO) --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                            <div>
                                <p className="text-[10px] text-blue-400">PESAJE DE PRODUCTO</p>
                                <h2 className="text-lg italic truncate max-w-[250px]">{activeProduct?.Nombre}</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-2xl opacity-50 hover:opacity-100">✕</button>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* MONITOR DE BÁSCULA */}
                            <div className="bg-[#0f1713] rounded-[2.5rem] p-8 border-4 border-black text-center shadow-inner">
                                <p className="text-[10px] text-green-900 tracking-widest mb-1 font-bold italic">Peso Neto KG</p>
                                <div className="text-7xl font-mono text-green-400 leading-none">{netWeight}</div>
                                <div className="flex justify-center gap-6 mt-4 text-[9px] font-mono text-green-900 opacity-60">
                                    <span>BRUTO: {currentWeight}</span>
                                    <span>TARA: {tara}</span>
                                </div>
                            </div>

                            {/* CONTROLES RANDOM */}
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setTara((Math.random() * 5 + 1).toFixed(2))} className="bg-slate-100 py-4 rounded-2xl text-[10px] font-bold border-b-4 border-slate-300 active:translate-y-1 transition-all">TARAR (RANDOM)</button>
                                <button onClick={() => setCurrentWeight((40 + Math.random() * 50).toFixed(2))} className="bg-blue-600 text-white py-4 rounded-2xl text-[10px] font-bold border-b-4 border-blue-800 active:translate-y-1 transition-all">PESAR (RANDOM)</button>
                            </div>

                            {/* CANTIDAD DE PIEZAS */}
                            <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400">PIEZAS EN ESTE PESAJE:</span>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setPiezas(Math.max(1, piezas - 1))} className="text-2xl text-blue-600 px-3">-</button>
                                    <span className="text-2xl font-mono">{piezas}</span>
                                    <button onClick={() => setPiezas(piezas + 1)} className="text-2xl text-blue-600 px-3">+</button>
                                </div>
                            </div>

                            <button 
                                onClick={confirmarPesaje}
                                className="w-full bg-emerald-500 text-white py-6 rounded-[2rem] text-sm font-black shadow-xl shadow-emerald-100 border-b-8 border-emerald-700 active:translate-y-1 active:border-b-0 transition-all"
                            >
                                CONFIRMAR Y AÑADIR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}