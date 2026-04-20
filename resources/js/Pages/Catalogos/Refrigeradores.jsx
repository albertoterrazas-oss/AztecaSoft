import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

// --- ICONOS SVG ---
const IconPlus = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const IconEdit = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

const IconInventory = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
);

const IconCube = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
);

// --- Configuración de Rutas ---
const route = (name, params = {}) => {
    const id = params.id;
    const routeMap = {
        "AlmacenesRefrigerados": "/api/AlmacenesRefrigerados",
        "almacenes.store": "/api/almacenes",
        "almacenes.update": `/api/almacenes/${id}`,
    };
    return routeMap[name] || `/${name}`;
};

export default function AlmacenesRefrigerador() {
    const [almacenes, setAlmacenes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [action, setAction] = useState('create');
    
    // Estado inicial con CapacidadKilos
    const initialFormState = { 
        IdAlmacen: null, 
        Nombre: "", 
        Tipo: "REFRIGERADO", 
        CapacidadKilos: "" 
    };
    const [currentAlmacen, setCurrentAlmacen] = useState(initialFormState);

    const getAlmacenes = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(route("AlmacenesRefrigerados"));
            const data = await response.json();
            setAlmacenes(data);
        } catch (error) {
            toast.error("Error al cargar los estantes");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { getAlmacenes(); }, []);

    const openModal = (item = initialFormState) => {
        setCurrentAlmacen(item);
        setAction(item.IdAlmacen ? 'edit' : 'create');
        setIsDialogOpen(true);
    };

    const submitAlmacen = async (formData) => {
        const isEdit = !!formData.IdAlmacen;
        const method = isEdit ? "PUT" : "POST";
        const ruta = isEdit ? route("almacenes.update", { id: formData.IdAlmacen }) : route("almacenes.store");
        
        try {
            await request(ruta, method, formData);
            toast.success("Almacén guardado");
            getAlmacenes();
            setIsDialogOpen(false);
        } catch (e) {
            toast.error("Error al guardar");
        }
    };

    return (
        <div className="w-full h-full p-4 md:p-8">
            <div className="w-full mx-auto h-full rounded-t-[4rem] rounded-b-2xl border-x-[16px] border-t-[16px] border-gray-300 shadow-2xl overflow-hidden bg-gray-50">
                
                {/* Termostato Digital */}
                <div className="flex flex-col items-center pt-8 pb-6 border-b-4 border-gray-400/30 mb-6 bg-gray-300">
                    <div className="w-40 h-12 bg-black rounded-lg border-2 border-gray-600 flex items-center justify-between px-4 shadow-inner">
                        <span className="text-cyan-400 font-mono text-xl animate-pulse">2.8°C</span>
                        <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></div>
                    </div>
                    <h2 className="mt-2 text-gray-500 font-bold text-[10px] tracking-[0.3em] uppercase">Sistema de control de enfriamiento</h2>
                </div>

                <div className="px-6 pb-12">
                    {isLoading ? (
                        <div className="h-96 flex items-center justify-center"><LoadingDiv /></div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            {/* Card Agregar */}
                            <button 
                                onClick={() => openModal()}
                                className="group h-52 border-4 border-dashed border-gray-400 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:bg-white hover:border-[#1B2654] hover:text-[#1B2654] transition-all shadow-inner"
                            >
                                <IconPlus />
                                <span className="font-black uppercase text-xs mt-2">Nuevo Estante</span>
                            </button>

                            {/* Listado */}
                            {almacenes.map((almacen) => (
                                <div key={almacen.IdAlmacen} className="h-52 bg-white rounded-2xl shadow-lg flex flex-col border-b-8 border-gray-400 overflow-hidden">
                                    <div className="p-5 flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-blue-100 text-[#1B2654]">
                                                <IconCube />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <h3 className="font-black text-gray-800 truncate uppercase text-sm leading-tight">{almacen.Nombre}</h3>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    Capacidad: {almacen.CapacidadKilos || 0} Kg
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Barra de Capacidad */}
                                    {/* <div className="px-5 mb-4 text-[9px] font-bold text-gray-400 uppercase">
                                        Estado de carga ({almacen.CapacidadKilos || 0} Kg)
                                        <div className="h-2 w-full bg-gray-100 rounded-full mt-1 overflow-hidden">
                                            <div className="h-full bg-blue-600" style={{ width: '0%' }}></div>
                                        </div>
                                    </div> */}

                                    {/* Botones */}
                                    <div className="grid grid-cols-1 border-t border-gray-100">
                                        <button 
                                            onClick={() => openModal(almacen)}
                                            className="flex items-center justify-center gap-2 py-3 hover:bg-yellow-50 text-yellow-600 border-r border-gray-100 transition-colors"
                                        >
                                            <IconEdit />
                                            <span className="text-[10px] font-black uppercase">Editar</span>
                                        </button>
                                        {/* <button 
                                            onClick={() => toast.info(`Abriendo: ${almacen.Nombre}`)}
                                            className="flex items-center justify-center gap-2 py-3 hover:bg-blue-50 text-blue-600 transition-colors"
                                        >
                                            <IconInventory />
                                            <span className="text-[10px] font-black uppercase">Inventario</span>
                                        </button> */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AlmacenFormDialog 
                isOpen={isDialogOpen} 
                closeModal={() => setIsDialogOpen(false)} 
                onSubmit={submitAlmacen}
                dataToEdit={currentAlmacen}
                action={action}
            />
        </div>
    );
}

// --- Componente Modal ---
function AlmacenFormDialog({ isOpen, closeModal, onSubmit, dataToEdit, action }) {
    const [formData, setFormData] = useState({ Nombre: "", Tipo: "REFRIGERADO", CapacidadKilos: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({ 
                IdAlmacen: dataToEdit?.IdAlmacen || null, 
                Nombre: dataToEdit?.Nombre || "", 
                Tipo: "REFRIGERADO",
                CapacidadKilos: dataToEdit?.CapacidadKilos || ""
            });
        }
    }, [isOpen, dataToEdit]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try { await onSubmit(formData); } finally { setSaving(false); }
    };

    return (
        <Transition show={isOpen}>
            <Dialog onClose={closeModal} className="relative z-[100]">
                <TransitionChild enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-md" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden border-t-8 border-[#1B2654]">
                        {saving && <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center"><LoadingDiv /></div>}
                        
                        <DialogTitle className="text-2xl font-black text-gray-800 mb-6 uppercase tracking-tighter">
                            {action === 'create' ? 'Nuevo Estante' : 'Ajustar Estante'}
                        </DialogTitle>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Etiqueta del Almacén</label>
                                <input 
                                    type="text" 
                                    value={formData.Nombre} 
                                    onChange={e => setFormData({...formData, Nombre: e.target.value})}
                                    className="w-full mt-1 px-5 py-4 rounded-2xl bg-gray-100 border-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700"
                                    placeholder="Ej: SECTOR CARNICOS"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Capacidad Máxima (Kg)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={formData.CapacidadKilos} 
                                    onChange={e => setFormData({...formData, CapacidadKilos: e.target.value})}
                                    className="w-full mt-1 px-5 py-4 rounded-2xl bg-gray-100 border-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700"
                                    placeholder="Ej: 500.00"
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={closeModal} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase hover:text-gray-600 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-blue-200 hover:bg-[#1B2654] transition-all">Confirmar</button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}