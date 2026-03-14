import { useEffect, useState, Fragment } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";
import { Building2, Fingerprint, Save, UserPlus, Pencil, Building } from "lucide-react";

// --- Configuración y Utilidades ---

const userObject = JSON.parse(localStorage.getItem('perfil') || '{}');

const route = (name, params = {}) => {
    const id = params.IdProveedor;
    const routeMap = {
        "provedores.index": "/api/provedores",
        "provedores.store": "/api/provedores",
        "provedores.update": `/api/provedores/${id}`,
    };
    return routeMap[name] || `/${name}`;
};

const validateInputs = (data) => {
    let formErrors = {};
    if (!data.RazonSocial?.trim()) formErrors.RazonSocial = 'La razón social es obligatoria.';
    if (!data.RFC?.trim()) formErrors.RFC = 'El RFC es obligatorio.';
    return { isValid: Object.keys(formErrors).length === 0, errors: formErrors };
};

const initialProveedorData = {
    IdProveedor: null,
    RazonSocial: "",
    RFC: "",
    idUsuario: userObject.IdUsuario || 1,
};

function ProveedorFormDialog({ isOpen, closeModal, onSubmit, dataToEdit, action, errors, setErrors }) {
    const [formData, setFormData] = useState({ RazonSocial: "", RFC: "", idUsuario: 1 });
    const [loading, setLoading] = useState(false);
    const userObject = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (isOpen) {
            setFormData({
                IdProveedor: dataToEdit?.IdProveedor || null,
                RazonSocial: dataToEdit?.RazonSocial || "",
                RFC: dataToEdit?.RFC || "",
                idUsuario: dataToEdit?.idUsuario || userObject.Personas_usuarioID || 1
            });
            setErrors({});
        }
    }, [isOpen, dataToEdit, setErrors]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'RFC' ? value.toUpperCase() : value.toUpperCase() // Forzamos mayúsculas estilo Rhino
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={loading ? () => { } : closeModal} className="relative z-[200]">
                {/* Backdrop con Blur pro */}
                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" aria-hidden="true" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <TransitionChild
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95 translate-y-4"
                        enterTo="opacity-100 scale-100 translate-y-0"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <DialogPanel className="w-full max-w-md rounded-[3rem] bg-white p-10 shadow-2xl relative overflow-hidden border-b-[12px] border-[#1B2654]">

                            {/* Overlay de Carga Rhino */}
                            {loading && (
                                <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
                                    <LoadingDiv />
                                    <span className="mt-4 text-[10px] font-black text-[#1B2654] uppercase tracking-[0.3em] animate-pulse">Procesando</span>
                                </div>
                            )}

                            {/* Header del Modal */}
                            <div className="flex flex-col items-center mb-8">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-[#1B2654] mb-4 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6.75h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h18" />
                                    </svg>
                                </div>
                                <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter text-center">
                                    {action === 'create' ? 'Nuevo Proveedor' : 'Editar Proveedor'}
                                </DialogTitle>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Razón Social */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Razón Social</label>
                                    <input
                                        type="text"
                                        name="RazonSocial"
                                        disabled={loading}
                                        value={formData.RazonSocial}
                                        onChange={handleChange}
                                        placeholder="NOMBRE DE LA EMPRESA"
                                        className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none uppercase text-sm ${errors.RazonSocial ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-[#1B2654] focus:bg-white'
                                            }`}
                                        required
                                    />
                                    {errors.RazonSocial && <p className="text-red-500 text-[9px] font-black uppercase tracking-tighter mt-1 ml-2">{errors.RazonSocial}</p>}
                                </div>

                                {/* RFC */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">RFC</label>
                                    <input
                                        type="text"
                                        name="RFC"
                                        maxLength={13}
                                        disabled={loading}
                                        value={formData.RFC}
                                        onChange={handleChange}
                                        placeholder="XAXX010101000"
                                        className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none uppercase text-sm ${errors.RFC ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-[#1B2654] focus:bg-white'
                                            }`}
                                        required
                                    />
                                    {errors.RFC && <p className="text-red-500 text-[9px] font-black uppercase tracking-tighter mt-1 ml-2">{errors.RFC}</p>}
                                </div>

                                {/* Botones de Acción */}
                                <div className="flex gap-4 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={loading}
                                        className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] py-4 bg-[#1B2654] text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-[#A61A18] transition-all disabled:bg-slate-300"
                                    >
                                        {loading ? 'Guardando...' : 'Confirmar Registro'}
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
// --- Componente Principal ---

export default function Proveedores() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [data, setData] = useState([]);
    const [action, setAction] = useState('create');
    const [current, setCurrent] = useState(initialProveedorData);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const getData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(route("provedores.index"));
            const resData = await response.json();
            setData(resData);
        } catch (error) {
            toast.error("Error al cargar proveedores.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { getData(); }, []);

    const submit = async (formData) => {
        const validation = validateInputs(formData);
        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        const isEdit = !!formData.IdProveedor;
        const ruta = isEdit ? route("provedores.update", { IdProveedor: formData.IdProveedor }) : route("provedores.store");
        const method = isEdit ? "PUT" : "POST";

        try {
            await request(ruta, method, formData);
            toast.success(isEdit ? "Proveedor actualizado" : "Proveedor creado con éxito");
            await getData();
            setIsDialogOpen(false);
        } catch (error) {
            toast.error("Error al guardar.");
            throw error; // Lanzamos el error para que el 'finally' del hijo maneje el estado de loading
        }
    };

    return (
        <div className="relative h-full pb-4 px-3 overflow-auto blue-scroll">
            {isLoading ? (
                <div className='flex flex-col items-center justify-center h-full w-full space-y-4'>
                    <LoadingDiv />
                    <p className="text-gray-500 animate-pulse">Cargando catálogo...</p>
                </div>
            ) : (
                <Datatable
                    data={data}
                    virtual={true}
                    add={() => {
                        setAction('create');
                        setCurrent(initialProveedorData);
                        setIsDialogOpen(true);
                    }}
                    columns={[
                        { header: 'Razón Social', accessor: 'RazonSocial' },
                        { header: 'RFC', accessor: 'RFC' },
                        // {
                        //     header: "Acciones",
                        //     accessor: "actions",
                        //     cell: (props) => (
                        //         <button
                        //             onClick={() => {
                        //                 setAction('edit');
                        //                 setCurrent(props.item);
                        //                 setIsDialogOpen(true);
                        //             }}
                        //             className="px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
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
                                    // onClick={() => openEditModal(props.item)}
                                    onClick={() => {
                                        setAction('edit');
                                        setCurrent(props.item);
                                        setIsDialogOpen(true);
                                    }}
                                    className="p-3 bg-slate-50 text-[#1B2654] rounded-xl hover:bg-[#1B2654] hover:text-white transition-all border border-slate-100"
                                >
                                    <Pencil size={16} />
                                </button>
                            )
                        },
                    ]}
                />
            )}

            <ProveedorFormDialog
                isOpen={isDialogOpen}
                closeModal={() => !isLoading && setIsDialogOpen(false)}
                onSubmit={submit}
                dataToEdit={current}
                action={action}
                errors={errors}
                setErrors={setErrors}
            />
        </div>
    );
}