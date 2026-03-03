import { useEffect, useState, useCallback, useMemo } from "react";
import { Toaster, toast } from "sonner";
import axios from "axios";

// Simulación de rutas (Ajusta según tu backend)
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

    // ESTADOS PRINCIPALES
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

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

    // CARGA Y MAPEO DE TUS DATOS ESPECÍFICOS
    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [resCli, resProd] = await Promise.all([
                axios.get(route("clientes.index")),
                axios.get(route("getInventario"))
            ]);

            setClientes(resCli.data.data || resCli.data || []);

            // Mapeo del JSON que proporcionaste
            const rawInventory = resProd.data.data || resProd.data || [];
            const mappedProducts = rawInventory.map((item, idx) => ({
                id: `${item.Producto}-${item.Almacen}-${idx}`, // ID Único compuesto
                nombre: item.Producto,
                almacen: item.Almacen,
                proveedor: item.Proveedor,
                stockKg: parseFloat(item.KG),
                stockPzas: parseInt(item.Piezas),
                precioVenta: item.PrecioVenta || 0, // Asume 0 si no viene en el JSON
            }));

            setProductos(mappedProducts);
        } catch (e) {
            toast.error("ERROR AL OBTENER DATOS DEL SERVIDOR");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // MANEJO DE PESAJE
    const openWeightModal = (producto) => {
        setActiveProduct(producto);
        setCurrentWeight("0.00");
        setTara("0.00");
        setPiezas(1);
        setIsModalOpen(true);
    };

    const confirmarPesaje = () => {
        if (parseFloat(netWeight) <= 0) return toast.warning("EL PESO DEBE SER MAYOR A 0");
        
        const subtotal = piezas * (activeProduct.precioVenta || 100); // Ejemplo con precio base si no hay
        
        setCart([...cart, { 
            ...activeProduct, 
            cantVendida: parseInt(piezas), 
            pesoVendido: parseFloat(netWeight),
            subtotal,
            tempId: Date.now() 
        }]);
        
        setIsModalOpen(false);
        toast.success("AGREGADO AL TICKET");
    };

    const registrarSalida = async () => {
        if (!selectedCliente || cart.length === 0) return;
        setIsSaving(true);
        try {
            const payload = {
                IdCliente: selectedCliente.IdCliente,
                items: cart,
                total: totales.dinero,
                fecha: new Date().toISOString()
            };
            await axios.post(route("pedidos.store"), payload);
            toast.success("VENTA REGISTRADA CON ÉXITO");
            setCart([]);
            setSelectedCliente(null);
        } catch (e) {
            toast.error("ERROR AL GUARDAR LA VENTA");
        } finally {
            setIsSaving(false);
        }
    };

    const totales = useMemo(() => {
        return cart.reduce((acc, i) => ({
            pzas: acc.pzas + i.cantVendida,
            kg: acc.kg + i.pesoVendido,
            dinero: acc.dinero + i.subtotal
        }), { pzas: 0, kg: 0, dinero: 0 });
    }, [cart]);

    if (isLoading) return <div className="h-screen flex items-center justify-center font-black italic text-blue-600">CARGANDO INVENTARIO...</div>;

    return (
        <div className="h-screen bg-slate-100 flex flex-col font-black uppercase overflow-hidden text-slate-800">
            <Toaster position="top-center" richColors />

            {/* HEADER */}
            <header className="bg-white p-4 border-b flex justify-between items-center shrink-0 shadow-sm">
                <div>
                    <h1 className="text-xl italic tracking-tighter text-blue-700">SISTEMA DE PESAJE & VENTAS</h1>
                    <p className="text-[9px] text-slate-400">CONTROL DE ALMACÉN: {productos.length} PRODUCTOS</p>
                </div>
                <div className="flex gap-4 items-center">
                    <select 
                        onChange={(e) => setSelectedCliente(clientes.find(c => c.IdCliente == e.target.value))}
                        className="bg-slate-100 border-none rounded-xl text-[10px] p-3 outline-none w-64 font-bold"
                    >
                        <option value="">-- SELECCIONAR CLIENTE --</option>
                        {clientes.map(c => <option key={c.IdCliente} value={c.IdCliente}>{c.RazonSocial}</option>)}
                    </select>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden p-4 gap-4">
                
                {/* CATÁLOGO BASADO EN TU JSON */}
                <div className="flex-1 flex flex-col min-w-0">
                    <input 
                        type="text" 
                        placeholder="BUSCAR PRODUCTO (EJ: RECTO)..." 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 text-sm outline-none mb-4"
                    />
                    
                    <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pr-2 custom-scrollbar">
                        {productos
                            .filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(p => (
                            <button 
                                key={p.id}
                                onClick={() => openWeightModal(p)}
                                className="bg-white p-4 rounded-[2rem] border-2 border-transparent hover:border-blue-500 hover:shadow-xl transition-all flex flex-col items-center text-center group active:scale-95"
                            >
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl mb-3 flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white">
                                    📦
                                </div>
                                <p className="text-[10px] leading-tight font-black">{p.nombre}</p>
                                <p className="text-[8px] text-blue-500 mt-1">{p.almacen}</p>
                                <p className="text-[8px] text-slate-400 italic">{p.proveedor}</p>
                                <div className="mt-2 text-[10px] bg-slate-100 px-3 py-1 rounded-full font-mono">
                                    DISP: {p.stockKg} KG
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* TICKET / LATERAL */}
                <aside className="w-96 flex flex-col shrink-0 gap-4">
                    <div className="flex-1 bg-white rounded-[2.5rem] shadow-lg border border-slate-200 flex flex-col overflow-hidden">
                        <div className="p-4 border-b bg-slate-50 text-center">
                            <p className="text-[10px] tracking-widest text-slate-400 font-bold">LISTA DE SALIDA</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {cart.length === 0 && <p className="text-center text-[10px] mt-10 opacity-30 italic">AGREGUE PRODUCTOS DESDE EL PANEL</p>}
                            {cart.map(item => (
                                <div key={item.tempId} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center">
                                    <div className="w-2/3">
                                        <p className="text-[9px] font-bold truncate">{item.nombre} ({item.almacen})</p>
                                        <p className="text-[8px] text-blue-600">{item.cantVendida} PZAS | {item.pesoVendido} KG</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold">$ {item.subtotal.toLocaleString()}</p>
                                        <button onClick={() => setCart(cart.filter(i => i.tempId !== item.tempId))} className="text-[8px] text-red-500 underline">BORRAR</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-5 bg-slate-900 text-white rounded-t-[2.5rem]">
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="bg-white/5 p-2 rounded-xl text-center">
                                    <p className="text-[7px] text-slate-500">TOTAL KG</p>
                                    <p className="text-sm text-orange-400 font-mono">{totales.kg.toFixed(2)}</p>
                                </div>
                                <div className="bg-white/5 p-2 rounded-xl text-center">
                                    <p className="text-[7px] text-slate-500">TOTAL PZAS</p>
                                    <p className="text-sm text-blue-400 font-mono">{totales.pzas}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center bg-emerald-600 p-4 rounded-2xl mb-4">
                                <span className="text-[10px]">TOTAL $</span>
                                <span className="text-2xl font-mono">$ {totales.dinero.toLocaleString()}</span>
                            </div>
                            <button 
                                onClick={registrarSalida}
                                disabled={cart.length === 0 || !selectedCliente || isSaving}
                                className={`w-full py-5 rounded-2xl text-[11px] font-black border-b-4 transition-all
                                ${(cart.length > 0 && selectedCliente) ? 'bg-blue-600 border-blue-800 active:translate-y-1' : 'bg-slate-800 text-slate-600 pointer-events-none'}`}
                            >
                                {isSaving ? 'PROCESANDO...' : 'REGISTRAR SALIDA'}
                            </button>
                        </div>
                    </div>
                </aside>
            </main>

            {/* MODAL DE PESAJE (INTEGRADO CON BÁSCULA) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
                        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                            <div>
                                <p className="text-[10px] text-blue-400 tracking-tighter">ORIGEN: {activeProduct?.almacen}</p>
                                <h2 className="text-lg italic">{activeProduct?.nombre}</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-xl">✕</button>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* PANTALLA DE PESO */}
                            <div className="bg-black rounded-[2.5rem] p-8 text-center border-4 border-slate-800">
                                <p className="text-[10px] text-emerald-800 font-bold italic mb-1 uppercase">Peso Neto Digital (KG)</p>
                                <div className="text-8xl font-mono text-emerald-400 tracking-tighter">{netWeight}</div>
                                <div className="flex justify-center gap-6 mt-4 text-[10px] font-mono text-emerald-900">
                                    <span>BRUTO: {currentWeight}</span>
                                    <span>TARA: {tara}</span>
                                </div>
                            </div>

                            {/* SIMULADORES DE BÁSCULA */}
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setTara((Math.random() * 2).toFixed(2))} className="bg-slate-100 py-4 rounded-2xl text-[10px] border-b-4 border-slate-300 active:translate-y-1 transition-all">ESTABLECER TARA</button>
                                <button onClick={() => setCurrentWeight((10 + Math.random() * 30).toFixed(2))} className="bg-blue-600 text-white py-4 rounded-2xl text-[10px] border-b-4 border-blue-800 active:translate-y-1 transition-all">LEER BÁSCULA</button>
                            </div>

                            {/* CANTIDAD DE PIEZAS */}
                            <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400">PIEZAS A RETIRAR:</span>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setPiezas(Math.max(1, piezas - 1))} className="text-3xl text-blue-600 font-light">-</button>
                                    <span className="text-3xl font-mono">{piezas}</span>
                                    <button onClick={() => setPiezas(piezas + 1)} className="text-3xl text-blue-600 font-light">+</button>
                                </div>
                            </div>

                            <button 
                                onClick={confirmarPesaje}
                                className="w-full bg-emerald-500 text-white py-6 rounded-[2rem] text-sm font-black shadow-xl border-b-8 border-emerald-700 active:translate-y-2 active:border-b-0 transition-all"
                            >
                                CONFIRMAR PESAJE Y AÑADIR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}