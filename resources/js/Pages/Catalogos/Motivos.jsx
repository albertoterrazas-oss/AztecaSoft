import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";
import { Building2, Fingerprint, Save, UserPlus, Pencil, Building } from "lucide-react";

const route = (name, params = {}) => {
    const routeMap = {
        "motivos.index": "/api/motivos",
        "motivos.store": "/api/motivos",
        "motivos.update": `/api/motivos/${params}`,
    };
    return routeMap[name] || `/${name}`;
};

// Validaciones requeridas para el formulario de Motivo
const motivoValidations = {
    Motivos_nombre: true,
    // Motivos_tipo: true,
};

// Función DUMMY de validación adaptada para Motivos
const validateInputs = (validations, data) => {
    let formErrors = {};
    if (validations.Motivos_nombre && !data.Motivos_nombre?.trim()) formErrors.Motivos_nombre = 'El nombre del motivo es obligatorio.';
    // if (validations.Motivos_tipo && !data.Motivos_tipo?.trim()) formErrors.Motivos_tipo = 'El tipo de motivo es obligatorio.';
    return { isValid: Object.keys(formErrors).length === 0, errors: formErrors };
};

// Datos de ejemplo para el estado inicial del formulario de Motivo
const initialMotivoData = {
    Motivos_motivoID: null, // Nuevo ID para identificar en edición
    Motivos_nombre: "",
    Motivos_tipo: "EN",
    Motivos_descripcion: "",
    Motivos_estatus: "1", // Ejemplo: 'Activo', 'Inactivo'
};

// Componente del Formulario de Motivo (Modal de Headless UI)
function MotivoFormDialog({ isOpen, closeModal, onSubmit, motivoToEdit, action, errors, setErrors }) {
    // Cambiado de unitData a motivoData
    const [motivoData, setMotivoData] = useState(initialMotivoData);
    const [loading, setLoading] = useState(false);

    // Sincroniza los datos al abrir el modal o cambiar el motivo a editar
    useEffect(() => {
        if (isOpen) {
            const dataToLoad = motivoToEdit
                ? {
                    ...motivoToEdit,
                    Motivos_nombre: motivoToEdit.Motivos_nombre || "",
                    Motivos_tipo: "EN",
                    Motivos_descripcion: motivoToEdit.Motivos_descripcion || "",
                    Motivos_estatus: motivoToEdit.Motivos_estatus || "1",
                }
                : initialMotivoData;
            setMotivoData(dataToLoad);
            setErrors({}); // Limpia errores al abrir
        }
    }, [isOpen, motivoToEdit]);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setMotivoData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? (checked ? "1" : "0") : value
        }));

        if (errors[name]) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        try {
            // Llama a la función onSubmit del padre, pasándole los datos del formulario
            await onSubmit(motivoData);
            // Si la función onSubmit tiene éxito (no lanza error), cierra el modal.
            closeModal();
        } catch (error) {
            console.error("Error al enviar el formulario:", error);
            // El error es propagado desde el padre, si falla, el modal no se cierra.
        } finally {
            setLoading(false);
        }
    };

    const dialogTitle = action === 'create' ? 'Crear Nuevo Motivo' : 'Editar Motivo';

    return (
        <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
            {/* Overlay de fondo */}
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            {/* Contenedor del Modal */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl relative">
                    {loading && <LoadingDiv />}
                    <DialogTitle className="text-2xl font-bold mb-4 text-gray-900 border-b pb-2">
                        {dialogTitle}
                    </DialogTitle>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                        <div className="space-y-3">
                            {/* Input Nombre */}
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Nombre del Motivo: <span className="text-red-500">*</span></span>
                                <input
                                    type="text"
                                    name="Motivos_nombre"
                                    value={motivoData.Motivos_nombre}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.Motivos_nombre ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                />
                                {errors.Motivos_nombre && <p className="text-red-500 text-xs mt-1">{errors.Motivos_nombre}</p>}
                            </label>


                            {/* <label className="block">
                                <span className="text-sm font-medium text-gray-700">Tipo: <span className="text-red-500">*</span></span>
                                <input
                                    type="text"
                                    name="Motivos_tipo"
                                    value={motivoData.Motivos_tipo}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.Motivos_tipo ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                />
                                {errors.Motivos_nombre && <p className="text-red-500 text-xs mt-1">{errors.Motivos_tipo}</p>}
                            </label> */}

                            {/* Textarea Descripción */}
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Descripción:</span>
                                <textarea
                                    name="Motivos_descripcion"
                                    value={motivoData.Motivos_descripcion}
                                    onChange={handleChange}
                                    rows="3"
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </label>


                            <div className="flex justify-center w-full"> {/* <-- Contenedor agregado y clases de centrado */}
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        name="Motivos_estatus"
                                        checked={motivoData.Motivos_estatus == 1} // Usamos == para manejar 1 o '1'
                                        onChange={handleChange}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Estatus</span>
                                </label>
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                            >
                                {loading ? (action === 'create' ? 'Registrando...' : 'Actualizando...') : (action === 'create' ? 'Guardar Motivo' : 'Actualizar Motivo')}
                            </button>
                        </div>
                    </form>
                </DialogPanel>
            </div>
        </Dialog>
    )
}


export default function Motivos() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [motivos, setMotivos] = useState([]); // Cambiado a motivos
    const [action, setAction] = useState('create');
    const [motivoData, setMotivoData] = useState(initialMotivoData); // Cambiado a motivoData
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // Función para abrir modal en modo creación
    const openCreateModal = () => {
        setAction('create');
        setMotivoData(initialMotivoData); // Limpiar para creación
        setErrors({});
        setIsDialogOpen(true);
    };

    // Función para abrir modal en modo edición
    const openEditModal = (motivo) => {
        setAction('edit');
        setMotivoData(motivo); // Cargar datos del motivo para edición
        setErrors({});
        setIsDialogOpen(true);
    };

    // Limpia el formulario y cierra el modal
    const closeModal = () => {
        setIsDialogOpen(false);
        setMotivoData(initialMotivoData);
        setErrors({});
    };

    /**
     * Función que maneja la validación y la petición POST/PUT real.
     */
    const submit = async (data) => {
        setErrors({});
        setIsLoading(true);

        // 1. VALIDACIÓN
        const validationResult = validateInputs(motivoValidations, data); // Usar motivoValidations

        if (!validationResult.isValid) {
            setErrors(validationResult.errors);
            toast.error("Por favor, corrige los errores en el formulario.");
            // Lanza un error para que el MotivoFormDialog sepa que falló
            throw new Error("Validation Failed");
        }

        // 2. RUTAS Y MÉTODO: Usa Motivos_ID para la actualización
        const isEdit = data.Motivos_motivoID;
        // La ID que se pasa a route debe ser la del Motivo
        const ruta = isEdit
            ? route("motivos.update", data.Motivos_motivoID)
            : route("motivos.store");

        const method = isEdit ? "PUT" : "POST";
        const successMessage = isEdit ? "Motivo actualizado con éxito." : "Motivo creado con éxito.";

        try {
            await request(ruta, method, data);
            await getMotivos(); // Obtener lista actualizada

            toast.success(successMessage);
        } catch (error) {
            console.error("Error al guardar el motivo:", error);
            toast.error("Hubo un error al guardar el motivo.");
            throw error; // Propagar el error al MotivoFormDialog para evitar que cierre el modal
        }
    };

    const getMotivos = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(route("motivos.index"));

            if (!response.ok) {
                throw new Error(`Fallo al cargar motivos: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            setMotivos(data);

        } catch (error) {
            console.error('Error al obtener los motivos:', error);

        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        getMotivos() // Llamar a getMotivos al montar
    }, [])

    return (
        <div className="relative h-[100%] pb-4 px-3 overflow-auto blue-scroll">
            <div className="flex justify-between items-center p-3 border-b mb-4">
                <h2 className="text-3xl font-bold text-gray-800">Gestión de Motivos </h2>
                <button
                    onClick={openCreateModal}
                    className="flex items-center px-4 py-2 text-base font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition duration-150 ease-in-out"
                >
                    + Nuevo Motivo
                </button>
            </div>
            {isLoading ? (
                <div className='flex items-center justify-center h-[100%] w-full'> <LoadingDiv /> </div>

            ) : (
                <Datatable
                    data={motivos}
                    virtual={true}
                    columns={[
                        {
                            header: "Estatus",
                            accessor: "Motivos_estatus",
                            cell: ({ item: { Motivos_estatus } }) => {
                                const color = String(Motivos_estatus) === "1"
                                    ? "bg-green-300" // Si es "1"
                                    : "bg-red-300";  // Si NO es "1" (incluyendo "2", "0", null, etc.)

                                return (
                                    <span className={`inline-flex items-center justify-center rounded-full ${color} w-4 h-4`} />
                                );
                            },
                        },
                        { header: 'Nombre', accessor: 'Motivos_nombre' },
                        // { header: 'Tipo', accessor: 'Motivos_tipo' },
                        { header: 'Descripción', accessor: 'Motivos_descripcion' },
                        // {
                        //     header: "Acciones", accessor: "Acciones", cell: (eprops) => (<>
                        //         <button
                        //             onClick={() => openEditModal(eprops.item)}
                        //             className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition"
                        //         >
                        //             Editar
                        //         </button>
                        //     </>)
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

            <MotivoFormDialog
                isOpen={isDialogOpen}
                closeModal={closeModal}
                onSubmit={submit}
                motivoToEdit={motivoData}
                action={action}
                errors={errors}
                setErrors={setErrors}
            />

        </div>
    );
}