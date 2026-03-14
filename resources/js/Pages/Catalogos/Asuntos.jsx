import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";
import { Building2, Fingerprint, Save, UserPlus, Pencil, Building } from "lucide-react";
// --- Helpers ---
// Corregido: Ahora acepta 'id' y construye la URL dinámicamente
const route = (name, params = {}) => {
    const routeMap = {
        "asuntos.index": "/api/asuntos",
        "asuntos.store": "/api/asuntos",
        "asuntos.update": `/api/asuntos/${params.id}`,
    };
    return routeMap[name] || `/${name}`;
};

const validateAsuntos = (data) => {
    let errors = {};
    if (!data.Descripcion?.trim()) errors.Descripcion = 'El nombre es obligatorio.';
    return { isValid: Object.keys(errors).length === 0, errors };
};

const initialAsuntoData = {
    IdAsunto: null,
    Descripcion: "",
};

function AsuntoFormDialog({ isOpen, closeModal, onSubmit, dataToEdit, action, errors, setErrors }) {
    const [formData, setFormData] = useState(initialAsuntoData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(dataToEdit || initialAsuntoData);
            setErrors({});
        }
    }, [isOpen, dataToEdit, setErrors]);

    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === "Descripcion") value = value.toUpperCase();
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            // Error capturado por el padre
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={isOpen}>
            <Dialog onClose={closeModal} className="relative z-[100]">
                {/* Backdrop con Blur Industrial */}
                <TransitionChild
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" aria-hidden="true" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <TransitionChild
                        enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-4"
                        enterTo="opacity-100 scale-100 translate-y-0"
                        leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                    >
                        <DialogPanel className="w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden border-b-[12px] border-[#1B2654]">

                            {/* Overlay de Carga */}
                            {loading && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                                    <LoadingDiv />
                                </div>
                            )}

                            {/* Encabezado */}
                            <div className="flex flex-col items-center mb-8">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-[#1B2654] mb-4 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                    </svg>
                                </div>
                                <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter text-center">
                                    {action === 'create' ? 'Nuevo Asunto' : 'Editar Asunto'}
                                </DialogTitle>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 text-center">Clasificación de Ticket / Trámite</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Nombre del Asunto */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nombre del Asunto *</label>
                                    <input
                                        type="text"
                                        name="Descripcion"
                                        value={formData.Descripcion}
                                        onChange={handleChange}
                                        placeholder="EJ: SOPORTE TÉCNICO BÁSCULAS"
                                        className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none uppercase ${errors.Descripcion ? 'border-red-500' : 'border-transparent focus:border-[#1B2654] focus:bg-white'
                                            }`}
                                    />
                                    {errors.Descripcion && (
                                        <p className="text-red-500 text-[10px] font-bold ml-2 uppercase mt-1">{errors.Descripcion}</p>
                                    )}
                                </div>

                                {/* Botones */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={loading}
                                        className="flex-1 py-4 text-slate-400 font-black text-xs uppercase hover:text-slate-600 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] py-4 bg-[#1B2654] text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-[#A61A18] transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Guardando...' : (action === 'create' ? 'Crear Asunto' : 'Actualizar Asunto')}
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

// --- Main Component ---
export default function Asuntos() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [asuntos, setAsuntos] = useState([]);
    const [action, setAction] = useState('create');
    const [currentData, setCurrentData] = useState(initialAsuntoData);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const getAsuntos = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(route("asuntos.index"));
            const result = await response.json();
            setAsuntos(result);
        } catch (error) {
            toast.error("Error al cargar los asuntos.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { getAsuntos(); }, []);

    const openCreateModal = () => {
        setAction('create');
        setCurrentData(initialAsuntoData);
        setErrors({});
        setIsDialogOpen(true);
    };

    const openEditModal = (item) => {
        setAction('edit');
        setCurrentData(item);
        setErrors({});
        setIsDialogOpen(true);
    };

    const submit = async (data) => {
        const validation = validateAsuntos(data);
        if (!validation.isValid) {
            setErrors(validation.errors);
            toast.error("Revisa el formulario.");
            throw new Error("Validation Failed");
        }

        // Corregido: Validación de ID y construcción de URL
        const isEdit = !!data.IdAsunto;
        const url = isEdit ? route("asuntos.update", { id: data.IdAsunto }) : route("asuntos.store");
        const method = isEdit ? "PUT" : "POST";

        try {
            await request(url, method, {
                Descripcion: data.Descripcion
            });

            await getAsuntos();
            setIsDialogOpen(false); // Cerramos el modal solo si la petición fue exitosa
            toast.success(isEdit ? "Actualizado correctamente" : "Creado correctamente");
        } catch (error) {
            toast.error("Error al procesar la solicitud.");
            throw error;
        }
    };

    return (
        <div className="relative h-[100%] pb-4 px-3 overflow-auto blue-scroll">

            {isLoading ? (
                <div className='flex items-center justify-center h-[100%] w-full'> <LoadingDiv /> </div>
            ) : (
                <Datatable
                    data={asuntos}
                    virtual={true}

                    add={() => {
                        openCreateModal()
                    }}
                    columns={[
                        { header: 'Nombre', accessor: 'Descripcion' },
                        // {
                        //     header: "Acciones",
                        //     cell: (props) => (
                        //         <button
                        //             onClick={() => openEditModal(props.item)}
                        //             className="text-blue-600 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 transition-colors"
                        //         >
                        //             Editar
                        //         </button>
                        //     )
                        // },

                        // import { Building2, Fingerprint, Save, UserPlus, Pencil, Building } from "lucide-react";

                         {
                            header: "Acciones",
                            cell: (props) => (
                                <button
                                    onClick={() => openEditModal(props.item)}
                                    className="p-3 bg-slate-50 text-[#1B2654] rounded-xl hover:bg-[#1B2654] hover:text-white transition-all border border-slate-100"
                                >
                                    <Pencil size={16} />
                                </button>
                            )
                        },
                    ]}
                />
            )}

            <AsuntoFormDialog
                isOpen={isDialogOpen}
                closeModal={() => setIsDialogOpen(false)}
                onSubmit={submit}
                dataToEdit={currentData}
                action={action}
                errors={errors}
                setErrors={setErrors}
            />
        </div>
    );
}