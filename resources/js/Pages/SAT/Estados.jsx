import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

// --- Configuración y Utilidades ---

const route = (name, params = {}) => {
    const id = params.idEstado;
    const routeMap = {
        "estados.index": "/api/estados", // Ajusta según tu api.php
        "estados.store": "/api/estados",
        "estados.update": `/api/estados/${id}`,
    };
    return routeMap[name] || `/${name}`;
};

const validateInputs = (data) => {
    let formErrors = {};
    if (!data.cveEstado?.trim()) formErrors.cveEstado = 'La clave del estado es obligatoria.';
    if (!data.cvePais?.trim()) formErrors.cvePais = 'La clave del país es obligatoria.';
    if (!data.descripcionEstado?.trim()) formErrors.descripcionEstado = 'La descripción es obligatoria.';

    return { isValid: Object.keys(formErrors).length === 0, errors: formErrors };
};

const initialEstadoData = {
    idEstado: null,
    cveEstado: "",
    cvePais: "MEX", // Valor por defecto común
    descripcionEstado: "",
};

// --- Componente del Formulario (Diálogo Modal) ---

function EstadoFormDialog({ isOpen, closeModal, onSubmit, estadoToEdit, action, errors, setErrors }) {
    const [estadoData, setEstadoData] = useState(initialEstadoData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setEstadoData({
                idEstado: estadoToEdit?.idEstado || null,
                cveEstado: estadoToEdit?.cveEstado || "",
                cvePais: estadoToEdit?.cvePais || "MEX",
                descripcionEstado: estadoToEdit?.descripcionEstado || ""
            });
            setErrors({});
        }
    }, [isOpen, estadoToEdit, setErrors]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Automáticamente a mayúsculas para mantener orden en la DB
        setEstadoData(prev => ({ ...prev, [name]: value.toUpperCase() }));

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(estadoData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={loading ? () => { } : closeModal} className="relative z-[200]">
                {/* Backdrop Rhino */}
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" aria-hidden="true" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <DialogPanel className="w-full max-w-md rounded-[3rem] bg-white p-10 shadow-2xl relative overflow-hidden border-b-[12px] border-[#1B2654]">

                            {loading && (
                                <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
                                    <LoadingDiv />
                                    <span className="mt-4 text-[10px] font-black text-[#1B2654] uppercase tracking-[0.3em] animate-pulse">Actualizando</span>
                                </div>
                            )}

                            {/* Cabecera Estilizada */}
                            <div className="flex flex-col items-center mb-8">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-[#1B2654] mb-4 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                                    </svg>
                                </div>
                                <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter text-center italic leading-none">
                                    {action === 'create' ? 'Nuevo' : 'Editar'} <br />
                                    <span className="text-[#1B2654]">Estado</span>
                                </DialogTitle>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Clave Estado */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Clave Estado</label>
                                        <input
                                            type="text"
                                            name="cveEstado"
                                            value={estadoData.cveEstado}
                                            onChange={handleChange}
                                            placeholder="COA"
                                            className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none uppercase text-sm ${errors.cveEstado ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-[#1B2654] focus:bg-white'}`}
                                        />
                                        {errors.cveEstado && <p className="text-red-500 text-[9px] font-black uppercase mt-1 ml-2">{errors.cveEstado}</p>}
                                    </div>

                                    {/* Clave País */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Clave País</label>
                                        <input
                                            type="text"
                                            name="cvePais"
                                            value={estadoData.cvePais}
                                            onChange={handleChange}
                                            placeholder="MEX"
                                            className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none uppercase text-sm border-transparent focus:border-[#1B2654] focus:bg-white`}
                                        />
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nombre del Estado</label>
                                    <input
                                        type="text"
                                        name="descripcionEstado"
                                        value={estadoData.descripcionEstado}
                                        onChange={handleChange}
                                        placeholder="EJ. COAHUILA"
                                        className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none uppercase text-sm ${errors.descripcionEstado ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-[#1B2654] focus:bg-white'}`}
                                    />
                                    {errors.descripcionEstado && <p className="text-red-500 text-[9px] font-black uppercase mt-1 ml-2">{errors.descripcionEstado}</p>}
                                </div>

                                {/* Botones Rhino */}
                                <div className="flex gap-4 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] py-4 bg-[#1B2654] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#A61A18] transition-all disabled:bg-slate-300"
                                    >
                                        {loading ? 'Procesando...' : 'Confirmar'}
                                    </button>
                                </div>
                            </form>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}

export default function Estados() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [estados, setEstados] = useState([]);
    const [action, setAction] = useState('create');
    const [currentEst, setCurrentEst] = useState(initialEstadoData);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const getEstados = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(route("estados.index"));
            const data = await response.json();
            setEstados(data);
        } catch (error) {
            toast.error("No se pudieron cargar los estados.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { getEstados(); }, []);

    const openCreateModal = () => {
        setAction('create');
        setCurrentEst(initialEstadoData);
        setErrors({});
        setIsDialogOpen(true);
    };

    const openEditModal = (estado) => {
        setAction('edit');
        setCurrentEst(estado);
        setErrors({});
        setIsDialogOpen(true);
    };

    const submit = async (formData) => {
        const validation = validateInputs(formData);
        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        const isEdit = !!formData.idEstado;
        const ruta = isEdit ? route("estados.update", { idEstado: formData.idEstado }) : route("estados.store");
        const method = isEdit ? "PUT" : "POST";

        try {
            await request(ruta, method, formData);
            toast.success("Operación exitosa");
            await getEstados();
            setIsDialogOpen(false);
        } catch (error) {
            toast.error("Error al guardar.");
        }
    };

    return (
        <div className="relative h-[100%] pb-4 px-3 overflow-auto blue-scroll">

            {isLoading ? (
                <div className='flex items-center justify-center h-[100%] w-full'> <LoadingDiv /> </div>
            ) : (
                <Datatable
                    data={estados}
                    virtual={true}
                    add={() => {
                        openCreateModal()
                    }}
                    columns={[
                        { header: 'Clave', accessor: 'cveEstado' },
                        { header: 'Descripción', accessor: 'descripcionEstado' },
                        {
                            header: "Acciones",
                            accessor: "actions",
                            // width: '15%',
                            cell: (props) => (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => openEditModal(props.item)}
                                        className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                                    >
                                        Editar
                                    </button>
                                </div>
                            )
                        },
                    ]}
                />
            )}

            <EstadoFormDialog
                isOpen={isDialogOpen}
                closeModal={() => setIsDialogOpen(false)}
                onSubmit={submit}
                estadoToEdit={currentEst}
                action={action}
                errors={errors}
                setErrors={setErrors}
            />
        </div>
    );
}