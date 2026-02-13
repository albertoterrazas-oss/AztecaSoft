import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

// --- Configuración y Utilidades ---

const route = (name, params = {}) => {
    const id = params.IdDepartamento;
    const routeMap = {
        "DepartamentosActivos": "/api/DepartamentosActivos",
        "departamentos.store": "/api/departamentos",
        "departamentos.update": `/api/departamentos/${id}`,
    };
    return routeMap[name] || `/${name}`;
};

const validateInputs = (data) => {
    let formErrors = {};
    if (!data.nombre?.trim()) {
        formErrors.nombre = 'El nombre del departamento es obligatorio.';
    }
    return { isValid: Object.keys(formErrors).length === 0, errors: formErrors };
};

const initialDepartmentData = {
    IdDepartamento: null,
    nombre: "",
    estatus: 1, 
    departamentoPadre: 0
};

// --- Componente del Formulario (Diálogo Modal) ---

function DepartmentFormDialog({ isOpen, closeModal, onSubmit, departmentToEdit, action, errors, setErrors }) {
    const [departmentData, setDepartmentData] = useState(initialDepartmentData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Sincronizamos los datos que vienen del Datatable con el estado del formulario
            setDepartmentData({
                IdDepartamento: departmentToEdit?.IdDepartamento || null,
                nombre: departmentToEdit?.nombre || "",
                estatus: departmentToEdit?.estatus ?? 1,
                departamentoPadre: departmentToEdit?.departamentoPadre || 0
            });
            setErrors({});
        }
    }, [isOpen, departmentToEdit, setErrors]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        // Convertimos el checkbox a 1 o 0 para que Laravel lo procese correctamente como tinyInt/int
        const finalValue = type === 'checkbox' ? (checked ? 1 : 0) : value;
        
        setDepartmentData(prev => ({
            ...prev,
            [name]: finalValue,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(departmentData);
        } catch (error) {
            // Error manejado en el componente principal
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={isOpen}>
            <Dialog onClose={closeModal} className="relative z-50">
                {/* Overlay / Fondo oscuro */}
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
                            {action === 'create' ? 'Crear Nuevo Departamento' : 'Editar Departamento'}
                        </DialogTitle>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                            {/* Campo Nombre */}
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">
                                    Nombre del Departamento: <span className="text-red-500">*</span>
                                </span>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={departmentData.nombre}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm focus:ring-2 outline-none transition-all ${
                                        errors.nombre 
                                        ? 'border-red-500 focus:ring-red-200' 
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                    }`}
                                />
                                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                            </label>

                            {/* Campo Estatus */}
                            <div className="flex justify-start py-2">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="estatus"
                                        checked={Number(departmentData.estatus) === 1}
                                        onChange={handleChange}
                                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm font-medium text-gray-700 select-none">Departamento Activo</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                                >
                                    {loading ? 'Procesando...' : (action === 'create' ? 'Guardar Departamento' : 'Actualizar Departamento')}
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

export default function Departamentos() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [action, setAction] = useState('create');
    const [currentDept, setCurrentDept] = useState(initialDepartmentData);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const getDepartments = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(route("DepartamentosActivos"));
            if (!response.ok) throw new Error("Error en la petición");
            const data = await response.json();
            setDepartments(data);
        } catch (error) {
            console.error('Error:', error);
            toast.error("No se pudieron cargar los departamentos.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getDepartments();
    }, []);

    const openCreateModal = () => {
        setAction('create');
        setCurrentDept(initialDepartmentData);
        setErrors({});
        setIsDialogOpen(true);
    };

    const openEditModal = (department) => {
        setAction('edit');
        setCurrentDept(department);
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

        const isEdit = !!formData.IdDepartamento;
        const ruta = isEdit
            ? route("departamentos.update", { IdDepartamento: formData.IdDepartamento })
            : route("departamentos.store");

        const method = isEdit ? "PUT" : "POST";

        try {
            // Enviamos el objeto tal cual, ya que las llaves coinciden con el Model de Laravel
            await request(ruta, method, formData);
            
            toast.success(isEdit ? "Actualizado correctamente" : "Creado correctamente");
            await getDepartments(); // Refrescar tabla
            closeModal();
        } catch (error) {
            console.error("Error al procesar:", error);
            toast.error("Error al guardar en el servidor.");
            throw error;
        }
    };

    return (
        <div className="relative h-full pb-4 px-3 overflow-auto blue-scroll">
            <div className="flex justify-between items-center p-3 border-b mb-4 bg-white sticky top-0 z-10">
                <h2 className="text-3xl font-bold text-gray-800">Gestión de Departamentos</h2>
                <button
                    onClick={openCreateModal}
                    className="flex items-center px-4 py-2 text-base font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition duration-150 ease-in-out"
                >
                    + Nuevo Departamento
                </button>
            </div>

            {isLoading ? (
                <div className='flex items-center justify-center h-64'> <LoadingDiv /> </div>
            ) : (
                <Datatable
                    data={departments}
                    virtual={true}
                    columns={[
                        {
                            header: "Estatus",
                            accessor: "estatus",
                            width: '10%',
                            cell: ({ item: { estatus } }) => (
                                <div className="flex justify-center">
                                    <span className={`inline-flex items-center justify-center rounded-full w-4 h-4 shadow-sm ${
                                        Number(estatus) === 1 ? "bg-green-400" : "bg-red-400"
                                    }`} />
                                </div>
                            ),
                        },
                        { 
                            header: 'Nombre', 
                            accessor: 'nombre',
                            cell: ({ item }) => <span className="font-medium text-gray-700">{item.nombre}</span>
                        },
                        {
                            header: "Acciones", 
                            accessor: "actions",
                            width: '15%',
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

            <DepartmentFormDialog
                isOpen={isDialogOpen}
                closeModal={closeModal}
                onSubmit={submit}
                departmentToEdit={currentDept}
                action={action}
                errors={errors}
                setErrors={setErrors}
            />
        </div>
    );
}