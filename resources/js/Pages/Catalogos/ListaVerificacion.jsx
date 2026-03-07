import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

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

// --- COMPONENTE: MODAL FORMULARIO ---
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
        let finalValue = value;

        if (type === 'checkbox') {
            finalValue = checked ? "1" : "0";
        }

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
        <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl relative overflow-hidden">
                    
                    {/* Loading centrado sobre el formulario */}
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
                            <LoadingDiv />
                        </div>
                    )}

                    <DialogTitle className="text-2xl font-bold mb-4 text-gray-900 border-b pb-2">
                        {action === 'create' ? 'Crear Nueva Lista' : 'Editar Lista'}
                    </DialogTitle>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nombre de la Lista: <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="Nombre"
                                value={listData.Nombre}
                                onChange={handleChange}
                                className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.Nombre ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.Nombre && <p className="text-red-500 text-xs mt-1">{errors.Nombre}</p>}
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="Estatus"
                                id="Estatus"
                                checked={listData.Estatus === "1"}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <label htmlFor="Estatus" className="ml-2 text-sm font-medium text-gray-700">Activo</label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {action === 'create' ? 'Guardar' : 'Actualizar'}
                            </button>
                        </div>
                    </form>
                </DialogPanel>
            </div>
        </Dialog>
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
                            {
                                header: "Acciones",
                                cell: (eprops) => (
                                    <button
                                        onClick={() => openEditModal(eprops.item)}
                                        className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                                    >
                                        Editar
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