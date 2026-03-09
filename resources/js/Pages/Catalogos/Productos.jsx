import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";
import { color } from "framer-motion";

// --- ICONOS COMPACTOS ---
const IconEdit = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-slate-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

const IconChevron = ({ open }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3 h-3 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

// --- COMPONENTE DE TARJETA ESTILIZADA ---
function ProductCard({ product, onEdit, subproducts }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasSubproducts = subproducts.length > 0;

    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        const colors = ['from-indigo-500 to-blue-600', 'from-rose-400 to-red-600', 'from-emerald-400 to-teal-600', 'from-slate-600 to-slate-800', 'from-violet-500 to-purple-700'];
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className={`relative transition-all duration-300 ${isExpanded ? 'z-50' : 'z-10'}`}>
            {/* Card Principal */}
            <div className={`bg-white rounded-[1.8rem] p-2 shadow-sm border border-slate-200/60 hover:shadow-xl transition-all duration-300 relative z-20 ${isExpanded ? 'ring-1 ring-slate-900' : ''}`}>
                
                {/* Header Visual Compacto */}
                <div className={`relative h-24 rounded-[1.4rem] bg-gradient-to-br ${stringToColor(product.Nombre)} flex items-center justify-center overflow-hidden`}>
                    <span className="text-white/20 text-4xl font-black uppercase select-none tracking-tighter">
                        {product.Nombre.substring(0, 2)}
                    </span>
                    <button 
                        onClick={() => onEdit(product)}
                        className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur rounded-xl shadow-sm hover:bg-white transition-all active:scale-90"
                    >
                        <IconEdit />
                    </button>
                </div>
                
                <div className="px-3 py-4">
                    <h3 className="font-bold text-slate-800 text-sm uppercase truncate leading-tight tracking-tight">
                        {product.Nombre}
                    </h3>
                    
                    <div className="flex items-center justify-between mt-1 mb-4">
                        <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${product.EsSubproducto === "1" ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                {product.UnidadMedida} • {product.EsSubproducto === "1" ? 'Derivado' : 'Principal'}
                            </span>
                        </div>
                    </div>

                    {hasSubproducts && (
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all font-white text-[9px] tracking-widest relative z-30 ${isExpanded ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-200'}`}
                        >
                            <span>{subproducts.length} SUBPRODUCTOS</span>
                            <IconChevron open={isExpanded} style={{color: 'white'}} />
                        </button>
                    )}
                </div>
            </div>

            {/* Dropdown de Subproductos */}
            <div className={`absolute top-full left-3 right-3 z-10 transition-all duration-300 transform ${isExpanded ? 'opacity-100 translate-y-[-12px]' : 'opacity-0 translate-y-[-30px] pointer-events-none'}`}>
                <div className="bg-slate-900 rounded-b-[1.5rem] shadow-2xl p-3 pt-6 border border-slate-800">
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                        {subproducts.map(sub => (
                            <div key={sub.IdProducto} className="flex items-center justify-between bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-all group">
                                <span className="text-[10px] font-medium text-slate-300 uppercase truncate pr-2">{sub.Nombre}</span>
                                <button onClick={() => onEdit(sub)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-all">
                                    <IconEdit />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Productos() {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [action, setAction] = useState('create');
    const [isSaving, setIsSaving] = useState(false);

    const userObject = JSON.parse(localStorage.getItem('user') || '{"IdUsuario": 1}');
    const [formData, setFormData] = useState({ IdProducto: null, Nombre: "", UnidadMedida: "kg", EsSubproducto: "0", idUsuario: userObject.IdUsuario, ProductoPadre: "" });

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/productos");
            const data = await response.json();
            setProducts(data);
        } catch (error) { toast.error("Error de red"); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleOpenModal = (item = null) => {
        if (item) {
            setAction('edit');
            setFormData({ ...item, ProductoPadre: item.ProductoPadre || "" });
        } else {
            setAction('create');
            setFormData({ IdProducto: null, Nombre: "", UnidadMedida: "kg", EsSubproducto: "0", idUsuario: userObject.IdUsuario, ProductoPadre: "" });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const isEdit = action === 'edit';
        try {
            await request(isEdit ? `/api/productos/${formData.IdProducto}` : "/api/productos", "POST", { ...formData, _method: isEdit ? 'PUT' : 'POST' });
            toast.success("Operación exitosa");
            fetchData();
            setIsDialogOpen(false);
        } catch (error) { toast.error("Error al guardar"); }
        finally { setIsSaving(false); }
    };

    return (
        <div className="min-h-screen bg-[#F3F4F6] p-4 md:p-8">
            <div className="max-w-[1600px] mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Productos</h1>
                        <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Gestión de Inventario Maestro</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95">
                        + Nuevo
                    </button>
                </div>

                {isLoading ? <LoadingDiv /> : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {products.filter(p => !p.ProductoPadre).map(p => (
                            <ProductCard 
                                key={p.IdProducto} 
                                product={p} 
                                subproducts={products.filter(sub => sub.ProductoPadre == p.IdProducto)}
                                onEdit={handleOpenModal}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Compacto */}
            <Transition show={isDialogOpen}>
                <Dialog onClose={() => setIsDialogOpen(false)} className="relative z-[100]">
                    <TransitionChild enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    </TransitionChild>
                    
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <DialogPanel className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 relative overflow-hidden">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-6">{action === 'create' ? 'Nuevo Registro' : 'Editar Producto'}</h2>
                            
                            <form onSubmit={handleSave} className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                                    <input type="text" value={formData.Nombre} onChange={e => setFormData({...formData, Nombre: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border-none rounded-xl p-3.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all text-sm" placeholder="NOMBRE DEL PRODUCTO" required />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidad</label>
                                        <select value={formData.UnidadMedida} onChange={e => setFormData({...formData, UnidadMedida: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3.5 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500">
                                            <option value="kg">KG</option>
                                            <option value="Pieza">PZ</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Padre</label>
                                        <select value={formData.ProductoPadre} onChange={e => setFormData({...formData, ProductoPadre: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3.5 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500">
                                            <option value="">Ninguno</option>
                                            {products.filter(p => p.IdProducto !== formData.IdProducto).map(p => <option key={p.IdProducto} value={p.IdProducto}>{p.Nombre}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setIsDialogOpen(false)} className="flex-1 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancelar</button>
                                    <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg">
                                        {isSaving ? 'Guardando...' : 'Confirmar'}
                                    </button>
                                </div>
                            </form>
                        </DialogPanel>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}