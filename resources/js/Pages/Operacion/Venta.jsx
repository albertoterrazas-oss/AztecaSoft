import { useEffect, useState, useCallback, useMemo } from "react";
import { Toaster, toast } from "sonner";
import axios from "axios";

const route = (name) => {
    const routeMap = {
        "clientes.index": "/api/clientes",
        "getInventario": "/api/getInventario",
        "pedidos.store": "/api/pedidos/guardar",
    };
    return routeMap[name] || `/${name}`;
};

export default function FlexSalesDashboard() {
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeProduct, setActiveProduct] = useState(null);
    const [currentWeight, setCurrentWeight] = useState("0.00");
    const [tara, setTara] = useState("0.00");
    const [piezas, setPiezas] = useState(1);

    const netWeight = useMemo(() => {
        const res = parseFloat(currentWeight) - parseFloat(tara);
        return Math.max(0, res).toFixed(2);
    }, [currentWeight, tara]);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [resCli, resProd] = await Promise.all([
                axios.get(route("clientes.index")),
                axios.get(route("getInventario"))
            ]);
            setClientes(resCli.data.data || resCli.data || []);
            const rawInventory = resProd.data.data || resProd.data || [];
            setProductos(rawInventory.map((item, idx) => ({
                id: `${item.Producto}-${item.Almacen}-${idx}`,
                nombre: item.Producto,
                almacen: item.Almacen,
                proveedor: item.Proveedor,
                stockKg: parseFloat(item.KG),
                precioVenta: item.PrecioVenta || 0,
            })));
        } catch (e) { toast.error("ERROR AL CARGAR"); } finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openWeightModal = (producto) => {
        setActiveProduct(producto);
        setCurrentWeight("0.00"); setTara("0.00"); setPiezas(1);
        setIsModalOpen(true);
    };

    const confirmarPesaje = () => {
        if (parseFloat(netWeight) <= 0) return toast.warning("EL PESO DEBE SER MAYOR A 0");
        setCart([...cart, { 
            ...activeProduct, 
            cantVendida: piezas, 
            pesoVendido: parseFloat(netWeight),
            subtotal: piezas * (activeProduct.precioVenta || 100),
            tempId: Date.now() 
        }]);
        setIsModalOpen(false);
        toast.success("AGREGADO");
    };

    const totales = useMemo(() => cart.reduce((acc, i) => ({
        pzas: acc.pzas + i.cantVendida,
        kg: acc.kg + i.pesoVendido,
        dinero: acc.dinero + i.subtotal
    }), { pzas: 0, kg: 0, dinero: 0 }), [cart]);

    if (isLoading) return <div className="h-screen flex items-center justify-center font-bold text-blue-600 italic">PREPARANDO INVENTARIO...</div>;

    return (
        <div className="h-screen bg-slate-100 flex flex-col font-sans uppercase overflow-hidden text-slate-800">
            <Toaster position="top-center" richColors />

            {/* HEADER ESTÁNDAR */}
            <header className="bg-white border-b p-3 px-6 flex justify-between items-center shrink-0 shadow-sm">
                <div>
                    <h1 className="text-lg font-black italic tracking-tighter text-slate-900">SISTEMA <span className="text-blue-600">VENTAS & PESAJE</span></h1>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest">{productos.length} ARTÍCULOS EN STOCK</p>
                </div>
                <select 
                    onChange={(e) => setSelectedCliente(clientes.find(c => c.IdCliente == e.target.value))}
                    className="bg-slate-100 border-2 border-slate-200 rounded-xl text-xs p-2.5 outline-none w-72 font-bold focus:border-blue-500 transition-all"
                >
                    <option value="">-- SELECCIONAR CLIENTE --</option>
                    {clientes.map(c => <option key={c.IdCliente} value={c.IdCliente}>{c.RazonSocial}</option>)}
                </select>
            </header>

            <main className="flex-1 flex overflow-hidden p-3 gap-3">
                
                {/* CATÁLOGO BALANCEADO */}
                <div className="flex-[3] flex flex-col min-w-0">
                    <div className="mb-3 relative">
                        <input 
                            type="text" 
                            placeholder="BUSCAR PRODUCTO POR NOMBRE..." 
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 shadow-sm transition-all"
                        />
                        <span className="absolute right-4 top-4 opacity-20 text-xl">🔍</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 pr-2 custom-scrollbar">
                        {productos
                            .filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(p => (
                            <button 
                                key={p.id}
                                onClick={() => openWeightModal(p)}
                                className="bg-white border-2 border-slate-100 p-4 rounded-3xl hover:border-blue-500 hover:shadow-xl transition-all flex flex-col items-start text-left group active:scale-95 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-lg font-bold">+</div>
                                </div>

                                <div className="bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    📦
                                </div>
                                
                                <p className="text-[11px] font-black leading-tight h-8 line-clamp-2 mb-2">{p.nombre}</p>
                                
                                <div className="w-full pt-3 border-t border-slate-50 flex justify-between items-end">
                                    <div>
                                        <p className="text-[9px] text-blue-500 font-bold">{p.almacen}</p>
                                        <p className="text-[8px] text-slate-400 italic truncate w-24">{p.proveedor}</p>
                                    </div>
                                    <div className="bg-slate-900 text-white px-2 py-1 rounded-lg font-mono text-[10px] font-bold">
                                        {p.stockKg} <span className="text-[8px] text-slate-400">KG</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* TICKET DE VENTA */}
                <aside className="w-80 flex flex-col shrink-0">
                    <div className="flex-1 bg-white rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                            <span className="text-xs font-black tracking-widest text-slate-500 uppercase">TICKET</span>
                            <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">{cart.length} ITEMS</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {cart.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                                    <p className="text-3xl mb-2">🛒</p>
                                    <p className="text-[10px]">SIN PRODUCTOS</p>
                                </div>
                            )}
                            {cart.map(item => (
                                <div key={item.tempId} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center group animate-in slide-in-from-right-4">
                                    <div className="w-2/3">
                                        <p className="text-[10px] font-black truncate">{item.nombre}</p>
                                        <p className="text-[9px] text-blue-600 font-bold">{item.cantVendida} PZ | {item.pesoVendido} KG</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black">${item.subtotal.toLocaleString()}</p>
                                        <button onClick={() => setCart(cart.filter(i => i.tempId !== item.tempId))} className="text-[9px] text-red-500 font-bold hover:underline">BORRAR</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-5 bg-slate-900 text-white rounded-t-[2.5rem] shadow-inner">
                            <div className="grid grid-cols-2 gap-3 mb-4 text-center">
                                <div className="bg-white/5 p-2 rounded-2xl">
                                    <p className="text-[8px] text-slate-500 mb-1">TOTAL KILOS</p>
                                    <p className="text-lg font-mono text-orange-400">{totales.kg.toFixed(2)}</p>
                                </div>
                                <div className="bg-white/5 p-2 rounded-2xl">
                                    <p className="text-[8px] text-slate-500 mb-1">TOTAL PIEZAS</p>
                                    <p className="text-lg font-mono text-blue-400">{totales.pzas}</p>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center bg-emerald-600/20 border border-emerald-500/30 p-4 rounded-2xl mb-4">
                                <span className="text-[10px] font-bold">TOTAL VENTA</span>
                                <span className="text-2xl font-mono text-emerald-400 font-bold">$ {totales.dinero.toLocaleString()}</span>
                            </div>

                            <button 
                                onClick={() => !isSaving && toast.success("REGISTRANDO...")}
                                disabled={cart.length === 0 || !selectedCliente || isSaving}
                                className={`w-full py-4 rounded-2xl text-xs font-black transition-all border-b-4
                                ${(cart.length > 0 && selectedCliente) ? 'bg-blue-600 border-blue-800 hover:bg-blue-500 active:translate-y-1 active:border-b-0' : 'bg-slate-800 text-slate-600 pointer-events-none'}`}
                            >
                                {isSaving ? 'PROCESANDO...' : 'REGISTRAR SALIDA'}
                            </button>
                        </div>
                    </div>
                </aside>
            </main>

            {/* MODAL DE PESAJE - TAMAÑO ÓPTIMO */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl border-2 border-white animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                            <div>
                                <p className="text-[10px] text-blue-400 font-bold mb-1 tracking-widest">{activeProduct?.almacen}</p>
                                <h2 className="text-lg italic font-black">{activeProduct?.nombre}</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors font-bold">✕</button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="bg-black rounded-[2.5rem] p-8 text-center border-4 border-slate-800 shadow-inner">
                                <p className="text-[10px] text-emerald-700 font-bold mb-1 tracking-widest">PESO NETO DIGITAL (KG)</p>
                                <div className="text-7xl font-mono text-emerald-400 tracking-tighter tabular-nums leading-none">{netWeight}</div>
                                <div className="flex justify-center gap-8 mt-4 text-[11px] font-mono text-emerald-900 font-bold">
                                    <span>BRUTO: {currentWeight}</span>
                                    <span>TARA: {tara}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setTara((Math.random() * 1.5).toFixed(2))} className="bg-slate-100 py-4 rounded-2xl text-xs font-black border-b-4 border-slate-300 active:translate-y-1 active:border-b-0 transition-all uppercase">Establecer Tara</button>
                                <button onClick={() => setCurrentWeight((15 + Math.random() * 25).toFixed(2))} className="bg-blue-600 text-white py-4 rounded-2xl text-xs font-black border-b-4 border-blue-800 active:translate-y-1 active:border-b-0 transition-all uppercase">Leer Báscula</button>
                            </div>

                            <div className="bg-slate-50 p-5 rounded-3xl border-2 border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400">PIEZAS:</span>
                                <div className="flex items-center gap-6">
                                    <button onClick={() => setPiezas(Math.max(1, piezas - 1))} className="text-4xl text-blue-600 font-light hover:scale-125 transition-transform">-</button>
                                    <span className="text-3xl font-mono font-black">{piezas}</span>
                                    <button onClick={() => setPiezas(piezas + 1)} className="text-4xl text-blue-600 font-light hover:scale-125 transition-transform">+</button>
                                </div>
                            </div>

                            <button onClick={confirmarPesaje} className="w-full bg-emerald-500 text-white py-6 rounded-[2rem] text-sm font-black shadow-xl border-b-8 border-emerald-700 active:translate-y-2 active:border-b-0 transition-all uppercase">
                                Confirmar y Añadir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}