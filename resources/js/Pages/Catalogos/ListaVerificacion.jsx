import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";
import { Building2, Fingerprint, Save, UserPlus, Pencil, Building } from "lucide-react";

// --- HELPERS ---
const route = (name, params = {}) => {
    const id = params.id || params;
    const routeMap = {
        "listaverificacion.index": "/api/listaverificacion",
        "listaverificacion.store": "/api/listaverificacion",
        "listaverificacion.update": `/api/listaverificacion/${id}`,
    };
    return routeMap[name] || `/${name}`;
};

const listaVerificacionValidations = {
    Nombre: true,
    Estatus: true
};

const validateInputs = (validations, data) => {
    let formErrors = {};
    if (validations.Nombre && !data.Nombre?.trim()) {
        formErrors.Nombre = 'El nombre de la lista es obligatorio.';
    }
    return { isValid: Object.keys(formErrors).length === 0, errors: formErrors };
};

const initialListData = {
    IdLista: null,
    Nombre: "",
    Estatus: "1",
};

function ListaVerificacionFormDialog({ isOpen, closeModal, onSubmit, listToEdit, action, errors, setErrors }) {
    const [listData, setListData] = useState(initialListData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (listToEdit && listToEdit.IdLista) {
                setListData({
                    ...listToEdit,
                    Nombre: listToEdit.Nombre || "",
                    Estatus: String(listToEdit.Estatus)
                });
            } else {
                setListData(initialListData);
            }
            setErrors({});
        }
    }, [isOpen, listToEdit, setErrors]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let finalValue = type === 'checkbox' ? (checked ? "1" : "0") : value.toUpperCase();

        setListData(prev => ({ ...prev, [name]: finalValue }));

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
            await onSubmit(listData);
            closeModal();
        } catch (error) {
            console.error("Error en submit:", error);
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

                            {/* OVERLAY DE CARGA CORREGIDO */}
                            {loading && (
                                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-[3rem]">
                                    <LoadingDiv />
                                </div>
                            )}

                            {/* Encabezado */}
                            <div className="flex flex-col items-center mb-8">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-[#1B2654] mb-4 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m.75-12h4.5a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 18 21.75H6.25A2.25 2.25 0 0 1 4 19.5V6.75A2.25 2.25 0 0 1 6.25 4.5h4.5m.75-1.5h3a.75.75 0 0 1 .75.75V4.5h-4.5V3.75a.75.75 0 0 1 .75-.75Z" />
                                    </svg>
                                </div>
                                <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter text-center">
                                    {action === 'create' ? 'Nueva Lista' : 'Editar Lista'}
                                </DialogTitle>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 text-center">Protocolos de Verificación</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Nombre de la Lista */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nombre del Protocolo *</label>
                                    <input
                                        type="text"
                                        name="Nombre"
                                        value={listData.Nombre}
                                        onChange={handleChange}
                                        placeholder="EJ: REVISIÓN DE EMBARQUE"
                                        className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none uppercase ${errors.Nombre ? 'border-red-500' : 'border-transparent focus:border-[#1B2654] focus:bg-white'
                                            }`}
                                    />
                                    {errors.Nombre && (
                                        <p className="text-red-500 text-[10px] font-bold ml-2 uppercase mt-1">{errors.Nombre}</p>
                                    )}
                                </div>

                                {/* Estatus Toggle */}
                                <div className="flex justify-center bg-slate-50 py-4 rounded-2xl border-2 border-dashed border-slate-200">
                                    <label className="group flex items-center space-x-3 cursor-pointer select-none">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inactiva</span>
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                name="Estatus"
                                                id="Estatus"
                                                checked={listData.Estatus === "1"}
                                                onChange={handleChange}
                                                className="sr-only peer"
                                            />
                                            <div className="w-14 h-7 bg-slate-300 rounded-full peer peer-checked:bg-[#1B2654] transition-colors shadow-inner"></div>
                                            <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-7 shadow-md"></div>
                                        </div>
                                        <span className="text-[10px] font-black text-[#1B2654] uppercase tracking-widest">Activa</span>
                                    </label>
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
                                        {loading ? 'Guardando...' : (action === 'create' ? 'Guardar Lista' : 'Actualizar Lista')}
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
// --- COMPONENTE PRINCIPAL ---
export default function ListaVerificacion() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [listas, setListas] = useState([]);
    const [action, setAction] = useState('create');
    const [listToEdit, setListToEdit] = useState(null);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const getListas = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(route("listaverificacion.index"));
            if (!response.ok) throw new Error("Error al cargar");
            const data = await response.json();
            setListas(data);
        } catch (error) {
            toast.error('No se pudieron cargar las listas.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { getListas(); }, []);

    const submit = async (data) => {
        const validation = validateInputs(listaVerificacionValidations, data);
        if (!validation.isValid) {
            setErrors(validation.errors);
            toast.error("Revisa los campos.");
            throw new Error("Validation Failed");
        }

        const isEdit = data.IdLista;
        const ruta = isEdit ? route("listaverificacion.update", data.IdLista) : route("listaverificacion.store");
        const method = isEdit ? "PUT" : "POST";

        try {
            await request(ruta, method, data);
            toast.success("Operación exitosa");
            await getListas();
        } catch (error) {
            toast.error("Error en el servidor");
            if (error.response?.data?.errors) setErrors(error.response.data.errors);
            throw error;
        }
    };

    const openCreateModal = () => {
        setAction('create');
        setListToEdit(null);
        setIsDialogOpen(true);
    };

    const openEditModal = (list) => {
        setAction('edit');
        setListToEdit(list);
        setIsDialogOpen(true);
    };

    return (
        <div className="relative h-full w-full pb-4 px-3 overflow-hidden">
            {isLoading ? (
                /* Contenedor de carga centrado totalmente */
                <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
                    <LoadingDiv />
                </div>
            ) : (
                <div className="h-full overflow-auto blue-scroll">
                    <Datatable
                        data={listas}
                        virtual={true}
                        add={openCreateModal}
                        columns={[
                            { header: 'Nombre', accessor: 'Nombre' },
                            // {
                            //     header: "Acciones",
                            //     cell: (eprops) => (
                            //         <button
                            //             onClick={() => openEditModal(eprops.item)}
                            //             className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
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
                </div>
            )}

            <ListaVerificacionFormDialog
                isOpen={isDialogOpen}
                closeModal={() => setIsDialogOpen(false)}
                onSubmit={submit}
                listToEdit={listToEdit}
                action={action}
                errors={errors}
                setErrors={setErrors}
            />
        </div>
    );
}