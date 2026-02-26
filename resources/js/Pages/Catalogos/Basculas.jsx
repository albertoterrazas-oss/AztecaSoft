import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

// --- ICONOS SVG ADAPTADOS A BÁSCULAS ---

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

const IconScale = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l-4 4m4-4l4 4m-4 14l-4-4m4 4l4-4" />
    </svg>
);

const IconUsb = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5m-15 4.5H3m18 0h-1.5m-15 4.5H3m18 0h-1.5M6.75 12a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-9a.75.75 0 0 1-.75-.75V12Z" />
    </svg>
);

// --- Configuración de Rutas (Ajustado a Basculas) ---
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
        <div className="w-full h-full p-4 md:p-8">

            <div className="w-full mx-auto h-full rounded-3xl border-x-[12px] border-t-[12px] border-[#1B2654] shadow-2xl overflow-hidden bg-slate-100">
                <div className="flex flex-col items-center pt-8 pb-6 border-b-4 border-slate-300 mb-6 bg-[#1B2654] text-white">
                    <h2 className="mt-2 text-white font-bold text-[15px] tracking-[0.3em] uppercase">Gestión de basculas</h2>
                </div>

                <div className="px-6 pb-12">
                    {isLoading ? (
                        <div className="h-96 flex items-center justify-center"><LoadingDiv /></div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                            {/* Card Agregar */}
                            <button
                                onClick={() => openModal()}
                                className="group h-52 border-4 border-dashed border-slate-400 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:bg-white hover:border-[#A61A18] hover:text-[#A61A18] transition-all shadow-inner"
                            >
                                <IconPlus />
                                <span className="font-black uppercase text-xs mt-2">Registrar Báscula</span>
                            </button>

                            {/* Listado de Básculas */}
                            {basculas.map((bascula) => (
                                <div key={bascula.IdBascula} className="h-52 bg-white rounded-2xl shadow-lg flex flex-col border-b-8 border-[#1B2654] overflow-hidden hover:translate-y-[-4px] transition-transform">
                                    <div className="p-5 flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 rounded-xl bg-[#1B2654] text-['#A61A18]">
                                                <IconScale />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <h3 className="font-black text-slate-800 truncate uppercase text-sm leading-tight">{bascula.Nombre}</h3>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <IconUsb />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{bascula.puerto}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Decoración de calibración */}
                                    <div className="px-5 mb-4 text-[9px] font-bold text-slate-400 uppercase">
                                        Señal del Puerto
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full mt-1 overflow-hidden flex gap-0.5">
                                            {[...Array(8)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-full flex-1 ${i < 6 ? 'bg-[#A61A18]' : 'bg-slate-300'}`}
                                                ></div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Botones de acción */}
                                    <div className="grid grid-cols-2 border-t border-slate-100">
                                        <button
                                            onClick={() => openModal(bascula)}
                                            className="flex items-center justify-center gap-2 py-3 hover:bg-orange-50 text-slate-600 border-r border-slate-100 transition-colors"
                                        >
                                            <IconEdit />
                                            <span className="text-[10px] font-black uppercase">Configurar</span>
                                        </button>
                                        <button
                                            onClick={() => toast.info(`Testeando conexión en ${bascula.puerto}...`)}
                                            className="flex items-center justify-center gap-2 py-3 hover:bg-slate-800 hover:text-white text-slate-600 transition-colors"
                                        >
                                            <span className="text-[10px] font-black uppercase">Probar Link</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Formulario */}
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
    const [formData, setFormData] = useState({ Nombre: "", puerto: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) setFormData({
            IdBascula: dataToEdit?.IdBascula || null,
            Nombre: dataToEdit?.Nombre || "",
            puerto: dataToEdit?.puerto || ""
        });
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
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                </TransitionChild>
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden border-t-8 border-[#A61A18]">
                        {saving && <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center"><LoadingDiv /></div>}
                        <DialogTitle className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-tighter">
                            {action === 'create' ? 'Nueva Unidad de Pesaje' : 'Ajustes de Báscula'}
                        </DialogTitle>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Identificador</label>
                                <input
                                    type="text"
                                    value={formData.Nombre}
                                    onChange={e => setFormData({ ...formData, Nombre: e.target.value })}
                                    className="w-full mt-1 px-5 py-4 rounded-2xl bg-slate-100 border-none focus:ring-2 focus:ring-[#A61A18] font-bold text-slate-700"
                                    placeholder="Ej: BÁSCULA RECEPCIÓN 01"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Puerto de Comunicación (COM)</label>
                                <input
                                    type="text"
                                    value={formData.puerto}
                                    onChange={e => setFormData({ ...formData, puerto: e.target.value })}
                                    className="w-full mt-1 px-5 py-4 rounded-2xl bg-slate-100 border-none focus:ring-2 focus:ring-[#A61A18] font-bold text-slate-700"
                                    placeholder="Ej: COM3 o 192.168.1.50"
                                    required
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={closeModal} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase hover:text-slate-600 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-[2] py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-slate-900 transition-all">Guardar Configuración</button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}