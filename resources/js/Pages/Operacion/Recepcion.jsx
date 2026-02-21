import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { toast } from "sonner";
import LoadingDiv from "@/Components/LoadingDiv";
import axios from "axios";

// --- HELPERS DE RUTA ---
const route = (name) => {
    const routeMap = {
        "provedores.index": "/api/provedores",
        "productos.index": "/api/productos",
        "pesaje.store": "/api/pesaje/guardar-lote",
    };
    return routeMap[name] || `/${name}`;
};

const initialSessionData = {
    IdProveedor: "",
    RazonSocial: "",
    folio: "",
};

export default function WeighingDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState(1); // 1: Inicio, 2: Recepción (Selección), 3: Pesaje
    
    const [dbProviders, setDbProviders] = useState([]);
    const [dbProducts, setDbProducts] = useState([]);

    const [sessionData, setSessionData] = useState(initialSessionData);
    const [selectedProducts, setSelectedProducts] = useState([]); 
    const [records, setRecords] = useState([]); 
    const [activeProduct, setActiveProduct] = useState(null); 
    const [currentWeight, setCurrentWeight] = useState("0.00");

    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                const [resProv, resProd] = await Promise.all([
                    axios.get(route("provedores.index")),
                    axios.get(route("productos.index"))
                ]);

                // Seteo de proveedores normal
                setDbProviders(resProv.data.data || resProv.data);

                // FILTRO: Solo productos donde EsSubProducto sea 0
                const allProducts = resProd.data.data || resProd.data;
                const filteredProducts = allProducts.filter(p => 
                    p.EsSubproducto === 0 || p.EsSubproducto === "0"
                );
                
                setDbProducts(filteredProducts);

            } catch (error) {
                console.error(error);
                toast.error("Error al conectar con el servidor.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCatalogos();
    }, []);

    // --- LÓGICA DE PASOS ---
    
    const handleStartSession = (e) => {
        e.preventDefault();
        if (sessionData.IdProveedor && sessionData.folio) {
            setStep(2);
            toast.success("Datos de origen guardados");
        }
    };

    const toggleProductSelection = (product) => {
        if (selectedProducts.find(p => p.IdProducto === product.IdProducto)) {
            setSelectedProducts(selectedProducts.filter(p => p.IdProducto !== product.IdProducto));
        } else {
            setSelectedProducts([...selectedProducts, product]);
        }
    };

    const confirmReception = () => {
        if (selectedProducts.length === 0) return toast.error("Seleccione al menos un producto");
        setStep(3);
        setActiveProduct(selectedProducts[0]);
        toast.info("Carga recibida. Iniciando verificación de peso.");
    };

    const handleRegisterWeight = () => {
        if (parseFloat(currentWeight) <= 0) return toast.error("Capture un peso válido");
        
        const newRecord = {
            id: Date.now(),
            ...activeProduct,
            peso: currentWeight,
            hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        
        setRecords([newRecord, ...records]);
        setCurrentWeight("0.00");
        toast.success("Peso guardado");
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center"><LoadingDiv /></div>;

    return (
        <div className="h-[90vh] bg-slate-50 p-6">
            
            {/* STEP 1: LOGIN DE SESIÓN */}
            {step === 1 && (
                <div className="flex h-full items-center justify-center">
                    <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                        <h2 className="text-2xl font-black uppercase mb-8 border-l-4 border-red-600 pl-4">Nueva Recepción</h2>
                        <form onSubmit={handleStartSession} className="space-y-6">
                            <select 
                                className="w-full rounded-2xl bg-slate-50 p-4 font-bold border-none"
                                value={sessionData.IdProveedor}
                                onChange={(e) => {
                                    const p = dbProviders.find(x => x.IdProveedor == e.target.value);
                                    setSessionData({...sessionData, IdProveedor: p?.IdProveedor || "", RazonSocial: p?.RazonSocial || ""});
                                }}
                                required
                            >
                                <option value="">Seleccione Proveedor...</option>
                                {dbProviders.map(p => (
                                    <option key={p.IdProveedor} value={p.IdProveedor}>
                                        {p.RazonSocial}
                                    </option>
                                ))}
                            </select>
                            <input 
                                type="text" 
                                placeholder="Folio de Lote" 
                                className="w-full rounded-2xl bg-slate-50 p-4 font-mono border-none"
                                value={sessionData.folio}
                                onChange={(e) => setSessionData({...sessionData, folio: e.target.value})}
                                required 
                            />
                            <button className="w-full bg-red-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-lg active:scale-95 transition-transform">
                                Siguiente
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* STEP 2: SELECCIÓN DE PRODUCTOS */}
            {step === 2 && (
                <div className="w-full max-w-5xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-3xl font-black text-slate-800 uppercase">Recepción de Carga</h1>
                        <p className="text-slate-500 font-medium">Seleccione los productos base que vienen en el transporte.</p>
                    </header>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                        {dbProducts.map((p) => {
                            const isSelected = selectedProducts.find(x => x.IdProducto === p.IdProducto);
                            return (
                                <button
                                    key={p.IdProducto}
                                    onClick={() => toggleProductSelection(p)}
                                    className={`p-6 rounded-[2rem] text-left transition-all border-4 ${
                                        isSelected 
                                        ? "border-red-600 bg-white shadow-xl scale-[1.02]" 
                                        : "border-transparent bg-white opacity-60 hover:opacity-100"
                                    }`}
                                >
                                    <span className="text-xs font-bold text-slate-400 block">{p.UnidadMedida}</span>
                                    <span className="text-lg font-black uppercase text-slate-700 leading-tight">{p.Nombre}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="sticky bottom-6">
                        <button 
                            onClick={confirmReception}
                            className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl uppercase tracking-widest shadow-2xl hover:bg-black transition-colors"
                        >
                            Confirmar Carga ({selectedProducts.length}) y Pasar a Pesaje
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: Marcador de posición para Pesaje */}
            {step === 3 && (
                <div className="text-center p-20">
                    <h2 className="text-2xl font-bold">Interfaz de Pesaje Activa</h2>
                    <p>Producto actual: {activeProduct?.Nombre}</p>
                    {/* Aquí iría tu lógica de báscula */}
                    <button 
                        onClick={() => setStep(2)} 
                        className="mt-4 text-red-600 underline"
                    >
                        Regresar a selección
                    </button>
                </div>
            )}
        </div>
    );
}