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
        setEstadoData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(estadoData);
        } catch (error) {
            // Error manejado en el padre
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
                    <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl relative">
                        {loading && <LoadingDiv />}

                        <DialogTitle className="text-2xl font-bold mb-4 text-gray-900 border-b pb-2">
                            {action === 'create' ? 'Crear Nuevo Estado' : 'Editar Estado'}
                        </DialogTitle>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                            {/* Clave Estado */}
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Clave Estado:</span>
                                <input
                                    type="text"
                                    name="cveEstado"
                                    value={estadoData.cveEstado}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.cveEstado ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.cveEstado && <p className="text-red-500 text-xs mt-1">{errors.cveEstado}</p>}
                            </label>

                            {/* Clave País */}
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Clave País:</span>
                                <input
                                    type="text"
                                    name="cvePais"
                                    value={estadoData.cvePais}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.cvePais ? 'border-red-500' : 'border-gray-300'}`}
                                />
                            </label>

                            {/* Descripción */}
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Descripción:</span>
                                <input
                                    type="text"
                                    name="descripcionEstado"
                                    value={estadoData.descripcionEstado}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.descripcionEstado ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.descripcionEstado && <p className="text-red-500 text-xs mt-1">{errors.descripcionEstado}</p>}
                            </label>

                            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md">Cancelar</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md">
                                    {loading ? 'Procesando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
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
        <div className="relative h-full pb-4 px-3 overflow-auto">
            <div className="flex justify-between items-center p-3 border-b mb-4 bg-white sticky top-0 z-10">
                <h2 className="text-3xl font-bold text-gray-800">Catálogo de Estados</h2>
                <button onClick={openCreateModal}
                    // className="px-4 py-2 bg-green-600 text-white rounded-lg"
                    className="flex items-center px-4 py-2 text-base font-semibold text-white rounded-lg shadow-md  transition duration-150 ease-in-out"
                    style={{ backgroundColor: '#A61A18' }}
                >+ Nuevo Estado</button>
            </div>

            {isLoading ? (
                <div className='flex items-center justify-center h-64'> <LoadingDiv /> </div>
            ) : (
                <Datatable
                    data={estados}
                    virtual={true}
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