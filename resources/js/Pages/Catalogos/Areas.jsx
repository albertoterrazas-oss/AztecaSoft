import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";
import { Building2, Fingerprint, Save, UserPlus, Pencil, Building } from "lucide-react";

// --- Configuración y Utilidades ---

const route = (name, params = {}) => {
    const id = params.id;
    const routeMap = {
        "areas.index": "/api/areas", 
        "areas.store": "/api/areas",
        "areas.update": `/api/areas/${id}`,
    };
    return routeMap[name] || `/${name}`;
};

const validateInputs = (data) => {
    let formErrors = {};
    if (!data.areas_nombre?.trim()) {
        formErrors.areas_nombre = 'El nombre del área es obligatorio.';
    }
    return { isValid: Object.keys(formErrors).length === 0, errors: formErrors };
};

const initialData = {
    id: null,
    areas_nombre: "",
    areas_estatus: 1,
};

// --- Componente del Formulario (Diálogo Modal) ---

function AreaFormDialog({ isOpen, closeModal, onSubmit, dataToEdit, action, errors, setErrors }) {
    const [formData, setFormData] = useState(initialData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                id: dataToEdit?.id || null,
                areas_nombre: dataToEdit?.areas_nombre || "",
                areas_estatus: dataToEdit?.areas_estatus ?? 1,
            });
            setErrors({});
        }
    }, [isOpen, dataToEdit, setErrors]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        // El controlador espera un boolean para areas_estatus
        const finalValue = type === 'checkbox' ? (checked ? 1 : 0) : value;

        setFormData(prev => ({
            ...prev,
            [name]: finalValue,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            // Manejado en el componente padre
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={isOpen}>
            <Dialog onClose={closeModal} className="relative z-50">
                <TransitionChild
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl relative overflow-hidden">
                        
                        {loading && (
                            <div className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px]">
                                <LoadingDiv />
                                <span className="mt-2 text-sm font-semibold text-blue-600 animate-pulse">Procesando...</span>
                            </div>
                        )}

                        <DialogTitle className="text-2xl font-bold mb-4 text-gray-900 border-b pb-2">
                            {action === 'create' ? 'Crear Área' : 'Editar Área'}
                        </DialogTitle>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">
                                    Nombre del Área: <span className="text-red-500">*</span>
                                </span>
                                <input
                                    type="text"
                                    name="areas_nombre"
                                    value={formData.areas_nombre}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm focus:ring-2 outline-none transition-all ${
                                        errors.areas_nombre
                                        ? 'border-red-500 focus:ring-red-200'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                    }`}
                                />
                                {errors.areas_nombre && <p className="text-red-500 text-xs mt-1">{errors.areas_nombre}</p>}
                            </label>

                            <div className="flex justify-start py-2">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="areas_estatus"
                                        checked={Number(formData.areas_estatus) === 1}
                                        onChange={handleChange}
                                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm font-medium text-gray-700 select-none">Área Activa</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors shadow-sm"
                                >
                                    {action === 'create' ? 'Guardar' : 'Actualizar'}
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}

// --- Componente Principal ---

export default function Areas() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [listData, setListData] = useState([]);
    const [action, setAction] = useState('create');
    const [currentItem, setCurrentItem] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const getData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(route("areas.index"));
            if (!response.ok) throw new Error("Error en la petición");
            const data = await response.json();
            setListData(data);
        } catch (error) {
            console.error('Error:', error);
            toast.error("No se pudieron cargar las áreas.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getData();
    }, []);

    const openCreateModal = () => {
        setAction('create');
        setCurrentItem(initialData);
        setErrors({});
        setIsDialogOpen(true);
    };

    const openEditModal = (item) => {
        setAction('edit');
        setCurrentItem(item);
        setErrors({});
        setIsDialogOpen(true);
    };

    const closeModal = () => {
        setIsDialogOpen(false);
    };

    const submit = async (formData) => {
        setErrors({});
        const validation = validateInputs(formData);

        if (!validation.isValid) {
            setErrors(validation.errors);
            toast.error("Revisa los campos obligatorios.");
            throw new Error("Validation Failed");
        }

        const isEdit = !!formData.id;
        const ruta = isEdit
            ? route("areas.update", { id: formData.id })
            : route("areas.store");

        const method = isEdit ? "PUT" : "POST";

        try {
            await request(ruta, method, formData);
            toast.success(isEdit ? "Área actualizada correctamente" : "Área creada correctamente");
            await getData();
            closeModal();
        } catch (error) {
            console.error("Error al procesar:", error);
            toast.error("Error al guardar en el servidor.");
            throw error;
        }
    };

    return (
        <div className="relative h-[100%] pb-4 px-3 overflow-auto blue-scroll">
            {isLoading ? (
                <div className='flex flex-col items-center justify-center h-full w-full space-y-4'>
                    <LoadingDiv />
                </div>
            ) : (
                <Datatable
                    data={listData}
                    virtual={true}
                    add={openCreateModal}
                    columns={[
                        {
                            header: "Estatus",
                            accessor: "areas_estatus",
                            width: '10%',
                            cell: ({ item: { areas_estatus } }) => (
                                <div className="flex justify-center">
                                    <span className={`inline-flex items-center justify-center rounded-full w-3 h-3 shadow-sm ${Number(areas_estatus) === 1 ? "bg-green-500" : "bg-red-500"}`} />
                                </div>
                            ),
                        },
                        {
                            header: 'Nombre del Área',
                            accessor: 'areas_nombre',
                            cell: ({ item }) => <span className="font-semibold text-gray-800">{item.areas_nombre}</span>
                        },
                        // {
                        //     header: "Acciones",
                        //     accessor: "actions",
                        //     width: '15%',
                        //     cell: (props) => (
                        //         <div className="flex space-x-2">
                        //             <button
                        //                 onClick={() => openEditModal(props.item)}
                        //                 className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-600 hover:text-white transition-all"
                        //             >
                        //                 Editar
                        //             </button>
                        //         </div>
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

            <AreaFormDialog
                isOpen={isDialogOpen}
                closeModal={closeModal}
                onSubmit={submit}
                dataToEdit={currentItem}
                action={action}
                errors={errors}
                setErrors={setErrors}
            />
        </div>
    );
}