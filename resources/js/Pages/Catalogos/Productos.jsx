import { useEffect, useState, Fragment } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

// --- ICONOS ---
const IconEdit = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

const IconList = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

// --- COMPONENTE TARJETA ---
function ProductCard({ product, onEdit, onViewSubproducts, subCount }) {
    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        const colors = ['from-[#1B2654] to-[#2a3b7d]', 'from-[#A61A18] to-[#cc211e]', 'from-slate-700 to-slate-900', 'from-emerald-700 to-emerald-900'];
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="bg-white rounded-[2rem] p-3 shadow-sm border-2 border-transparent hover:border-slate-200 hover:shadow-xl transition-all duration-300 group">
            <div className={`relative h-24 rounded-[1.6rem] bg-gradient-to-br ${stringToColor(product.Nombre)} flex items-center justify-center overflow-hidden`}>
                <span className="text-white/10 text-5xl font-black uppercase tracking-tighter absolute -bottom-2 -left-2 rotate-12">{product.Nombre.substring(0, 2)}</span>
                <button onClick={() => onEdit(product)} className="absolute top-2 right-2 p-2.5 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl hover:bg-white hover:text-[#1B2654] transition-all">
                    <IconEdit />
                </button>
            </div>
            <div className="px-2 py-4">
                <h3 className="font-black text-slate-800 text-[11px] uppercase truncate mb-1">{product.Nombre}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">{product.UnidadMedida} • PRINCIPAL</p>
                
                {subCount > 0 && (
                    <button 
                        onClick={() => onViewSubproducts(product)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[9px] tracking-widest hover:bg-[#1B2654] hover:text-white transition-all"
                    >
                        <IconList />
                        {subCount} SUBPRODUCTOS
                    </button>
                )}
            </div>
        </div>
    );
}

export default function Productos() {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [selectedParent, setSelectedParent] = useState(null);
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

    const handleViewSubproducts = (parent) => {
        setSelectedParent(parent);
        setIsSidePanelOpen(true);
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
            setIsSidePanelOpen(false); // Cerramos el panel por si editamos desde ahí
        } catch (error) { toast.error("Error al guardar"); }
        finally { setIsSaving(false); }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans">
            <div className="max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-[#1B2654] tracking-tighter uppercase leading-none">Productos <span className="text-slate-300"></span></h1>
                        {/* <p className="text-[10px] text-slate-400 font-black tracking-[0.4em] uppercase mt-3">Rhino Software Engineering</p> */}
                    </div>
                    <button onClick={() => handleOpenModal()} className="bg-[#1B2654] text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#A61A18] transition-all shadow-xl active:scale-95">+ Nuevo Producto</button>
                </div>

                {isLoading ? <LoadingDiv /> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                        {products.filter(p => !p.ProductoPadre || p.ProductoPadre == 0).map(p => (
                            <ProductCard 
                                key={p.IdProducto} 
                                product={p} 
                                subCount={products.filter(sub => String(sub.ProductoPadre) === String(p.IdProducto)).length}
                                onEdit={handleOpenModal}
                                onViewSubproducts={handleViewSubproducts}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* SIDE PANEL DE SUBPRODUCTOS (EL LADO PRO) */}
            <Transition show={isSidePanelOpen} as={Fragment}>
                <Dialog onClose={() => setIsSidePanelOpen(false)} className="relative z-[150]">
                    <TransitionChild as={Fragment} enter="ease-in-out duration-500" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-500" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-hidden">
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                                <TransitionChild as={Fragment} enter="transform transition ease-in-out duration-500" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-500" leaveFrom="translate-x-0" leaveTo="translate-x-full">
                                    <DialogPanel className="pointer-events-auto w-screen max-w-md">
                                        <div className="flex h-full flex-col bg-white shadow-2xl border-l-[12px] border-[#1B2654]">
                                            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h2 className="text-2xl font-black text-[#1B2654] uppercase tracking-tighter">Subproductos</h2>
                                                    <button onClick={() => setIsSidePanelOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">✕</button>
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Derivados de: {selectedParent?.Nombre}</p>
                                            </div>

                                            <div className="flex-1 overflow-y-auto p-8 space-y-3 custom-scrollbar">
                                                {products.filter(sub => String(sub.ProductoPadre) === String(selectedParent?.IdProducto)).map(sub => (
                                                    <div key={sub.IdProducto} className="group flex items-center justify-between p-5 rounded-[1.5rem] border-2 border-slate-100 hover:border-[#1B2654] hover:bg-slate-50 transition-all">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{sub.Nombre}</span>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{sub.UnidadMedida}</span>
                                                        </div>
                                                        <button 
                                                            onClick={() => { handleOpenModal(sub); setIsSidePanelOpen(false); }} 
                                                            className="p-3 bg-slate-100 text-slate-400 rounded-xl group-hover:bg-[#1B2654] group-hover:text-white transition-all shadow-sm"
                                                        >
                                                            <IconEdit />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div className="p-8 bg-slate-50 border-t border-slate-100">
                                                <button 
                                                    onClick={() => {
                                                        handleOpenModal({ IdProducto: null, Nombre: "", UnidadMedida: "kg", EsSubproducto: "1", idUsuario: userObject.IdUsuario, ProductoPadre: selectedParent.IdProducto });
                                                        setIsSidePanelOpen(false);
                                                    }}
                                                    className="w-full py-4 bg-[#A61A18] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-red-700 transition-all"
                                                >
                                                    + Añadir Variante
                                                </button>
                                            </div>
                                        </div>
                                    </DialogPanel>
                                </TransitionChild>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* MODAL DE EDICIÓN (Mantenemos tu lógica de formulario) */}
            <Transition show={isDialogOpen} as={Fragment}>
                <Dialog onClose={() => !isSaving && setIsDialogOpen(false)} className="relative z-[200]">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" />
                    </TransitionChild>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <DialogPanel className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden border-b-[12px] border-[#1B2654]">
                                {isSaving && <div className="absolute inset-0 z-[60] flex items-center justify-center bg-white/70 backdrop-blur-sm"><LoadingDiv /></div>}
                                <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-8 text-center">{action === 'create' ? 'Nuevo Producto' : 'Editar Registro'}</DialogTitle>
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nombre</label>
                                        <input type="text" value={formData.Nombre} onChange={e => setFormData({ ...formData, Nombre: e.target.value.toUpperCase() })} className="w-full px-6 py-4 rounded-2xl bg-slate-100 font-bold outline-none border-2 border-transparent focus:border-[#1B2654] uppercase text-sm" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Unidad</label>
                                            <select value={formData.UnidadMedida} onChange={e => setFormData({ ...formData, UnidadMedida: e.target.value })} className="w-full px-5 py-4 rounded-2xl bg-slate-100 font-bold outline-none text-xs">
                                                <option value="kg">KILOGRAMOS</option>
                                                <option value="Pieza">PIEZAS</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Padre</label>
                                            <select value={formData.ProductoPadre} onChange={e => setFormData({ ...formData, ProductoPadre: e.target.value })} className="w-full px-5 py-4 rounded-2xl bg-slate-100 font-bold outline-none text-xs">
                                                <option value="">NINGUNO</option>
                                                {products.filter(p => p.IdProducto !== formData.IdProducto && (!p.ProductoPadre || p.ProductoPadre == 0)).map(p => <option key={p.IdProducto} value={p.IdProducto}>{p.Nombre}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => setIsDialogOpen(false)} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase">Cancelar</button>
                                        <button type="submit" disabled={isSaving} className="flex-[2] py-4 bg-[#1B2654] text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-[#A61A18] transition-all">Confirmar</button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}