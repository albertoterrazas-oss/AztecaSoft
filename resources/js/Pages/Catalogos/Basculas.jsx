import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

// --- COMPONENTE VISUAL DE LA BÁSCULA (SVG DETALLADO) ---
const BasculaIlustracion = ({ className }) => (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Sombra proyectada */}
        <ellipse cx="200" cy="250" rx="120" ry="15" fill="#000" opacity="0.1" />
        
        {/* Cuerpo Inferior */}
        <path d="M40,230 L360,230 L335,140 L65,140 Z" fill="#2d3748" />
        <path d="M65,140 L335,140 L315,115 L85,115 Z" fill="#4a5568" />
        
        {/* Plato de Acero (Brillante) */}
        <rect x="45" y="85" width="310" height="35" rx="8" fill="#edf2f7" />
        <rect x="45" y="85" width="310" height="15" rx="8" fill="#fff" opacity="0.5" />
        
        {/* Panel Frontal Negro */}
        <rect x="110" y="165" width="180" height="55" rx="8" fill="#1a202c" />
        
        {/* Pantallas LCD (Verde Rhino) */}
        <rect x="120" y="175" width="45" height="18" rx="2" fill="#9ccc65" className="animate-pulse" />
        <rect x="177" y="175" width="45" height="18" rx="2" fill="#9ccc65" />
        <rect x="234" y="175" width="45" height="18" rx="2" fill="#9ccc65" />
        
        {/* Teclado/Botones */}
        <rect x="120" y="200" width="160" height="10" rx="2" fill="#4a5568" opacity="0.5" />
    </svg>
);

const IconPlus = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const IconUsb = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5m-15 4.5H3m18 0h-1.5m-15 4.5H3m18 0h-1.5M6.75 12a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-9a.75.75 0 0 1-.75-.75V12Z" />
    </svg>
);

// --- Configuración de Rutas ---
const route = (name, params = {}) => {
    const id = params.id;
    const routeMap = {
        "BasculasIndex": "/api/basculas",
        "basculas.store": "/api/basculas",
        "basculas.update": `/api/basculas/${id}`,
    };
    return routeMap[name] || `/${name}`;
};

export default function CatalogosBasculas() {
    const [basculas, setBasculas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentBascula, setCurrentBascula] = useState({ IdBascula: null, Nombre: "", puerto: "" });
    const [action, setAction] = useState('create');

    const getBasculas = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(route("BasculasIndex"));
            const data = await response.json();
            setBasculas(data);
        } catch (error) {
            toast.error("Error al cargar las básculas");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { getBasculas(); }, []);

    const openModal = (item = { IdBascula: null, Nombre: "", puerto: "" }) => {
        setCurrentBascula(item);
        setAction(item.IdBascula ? 'edit' : 'create');
        setIsDialogOpen(true);
    };

    const submitBascula = async (formData) => {
        const isEdit = !!formData.IdBascula;
        const method = isEdit ? "PUT" : "POST";
        const ruta = isEdit ? route("basculas.update", { id: formData.IdBascula }) : route("basculas.store");

        try {
            await request(ruta, method, formData);
            toast.success(isEdit ? "Báscula actualizada" : "Báscula registrada");
            getBasculas();
            setIsDialogOpen(false);
        } catch (e) {
            toast.error("Error al procesar la solicitud");
        }
    };

    return (
        <div className="w-full h-full p-4 md:p-8 bg-slate-200">
            <div className="max-w-7xl mx-auto h-full">
                
                {/* Header Estilo Industrial */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 bg-[#1B2654] p-6 rounded-2xl shadow-xl border-b-4 border-[#A61A18]">
                    <div>
                        <h2 className="text-white font-black text-2xl tracking-tighter uppercase">Panel de Control de Pesaje</h2>
                        <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.2em]">Hardware & Puertos COM</p>
                    </div>
                    <div className="mt-4 md:mt-0 text-white/50 text-[10px] font-mono">
                        SISTEMA DE MONITOREO V2.6
                    </div>
                </div>

                {isLoading ? (
                    <div className="h-96 flex items-center justify-center"><LoadingDiv /></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

                        {/* Card Agregar Nueva */}
                        <button
                            onClick={() => openModal()}
                            className="group relative h-80 bg-white/50 border-4 border-dashed border-slate-400 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-500 hover:bg-white hover:border-[#A61A18] hover:text-[#A61A18] transition-all overflow-hidden"
                        >
                            <div className="p-6 rounded-full bg-slate-200 group-hover:bg-red-50 transition-colors">
                                <IconPlus />
                            </div>
                            <span className="font-black uppercase text-sm mt-4 tracking-widest">Añadir Equipo</span>
                        </button>

                        {/* Renderizado de Básculas */}
                        {basculas.map((bascula) => (
                            <div key={bascula.IdBascula} className="group h-80 bg-white rounded-[2.5rem] shadow-xl flex flex-col border-2 border-transparent hover:border-[#1B2654] transition-all relative overflow-hidden">
                                
                                {/* Badge de Estado */}
                                <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-green-100 px-3 py-1 rounded-full">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black text-green-700 uppercase">Online</span>
                                </div>

                                {/* Visual de la Báscula (Centro de la Card) */}
                                <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-white">
                                    <BasculaIlustracion className="w-48 h-48 drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" />
                                </div>

                                {/* Info y Footer */}
                                <div className="p-6 bg-[#f8fafc] border-t border-slate-100">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <h3 className="font-black text-slate-800 uppercase text-lg leading-none mb-1">{bascula.Nombre}</h3>
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <IconUsb />
                                                <span className="text-xs font-bold font-mono">{bascula.puerto}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => openModal(bascula)}
                                                className="p-3 bg-slate-800 text-white rounded-xl hover:bg-[#A61A18] transition-colors shadow-lg"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-6.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-9.75 0h9.75" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal - Se mantiene igual pero con el nuevo look de la báscula arriba */}
            <BasculaFormDialog
                isOpen={isDialogOpen}
                closeModal={() => setIsDialogOpen(false)}
                onSubmit={submitBascula}
                dataToEdit={currentBascula}
                action={action}
            />
        </div>
    );
}

function BasculaFormDialog({ isOpen, closeModal, onSubmit, dataToEdit, action }) {
    // ... (El resto del código del dialog se mantiene igual que el anterior, 
    // pero puedes poner el componente <BasculaIlustracion className="w-24 mx-auto mb-4" /> 
    // justo arriba del DialogTitle para que se vea de lujo)
    const [formData, setFormData] = useState({ Nombre: "", puerto: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) setFormData({
            IdBascula: dataToEdit?.IdBascula || null,
            Nombre: dataToEdit?.Nombre || "",
            puerto: dataToEdit?.puerto || ""
        });
    }, [isOpen, dataToEdit]);

    return (
        <Transition show={isOpen}>
            <Dialog onClose={closeModal} className="relative z-[100]">
                <TransitionChild enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" />
                </TransitionChild>
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl border-b-[12px] border-[#1B2654]">
                        <BasculaIlustracion className="w-32 h-32 mx-auto mb-2" />
                        <DialogTitle className="text-2xl font-black text-center text-slate-800 mb-8 uppercase tracking-tighter">
                            {action === 'create' ? 'Registrar Equipo' : 'Configurar Equipo'}
                        </DialogTitle>
                        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nombre del dispositivo</label>
                                <input
                                    type="text"
                                    value={formData.Nombre}
                                    onChange={e => setFormData({ ...formData, Nombre: e.target.value })}
                                    className="w-full mt-1 px-6 py-4 rounded-2xl bg-slate-100 border-2 border-transparent focus:border-[#A61A18] focus:bg-white transition-all font-bold text-slate-700 outline-none"
                                    placeholder="RHINO BAR-6"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Puerto de enlace</label>
                                <input
                                    type="text"
                                    value={formData.puerto}
                                    onChange={e => setFormData({ ...formData, puerto: e.target.value })}
                                    className="w-full mt-1 px-6 py-4 rounded-2xl bg-slate-100 border-2 border-transparent focus:border-[#A61A18] focus:bg-white transition-all font-bold text-slate-700 outline-none"
                                    placeholder="COM1, COM2..."
                                    required
                                />
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button type="submit" className="flex-1 py-4 bg-[#1B2654] text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-[#A61A18] transition-all">
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}