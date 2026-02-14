import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

// Función para mapear rutas de API
const route = (name, params = {}) => {
    const id = params.Puestos_id; // Ahora usa Puestos_id
    const routeMap = {
        "puestos.index": "/api/puestos",
        "DepartamentosActivos": "/api/DepartamentosActivos",
        "puestos.store": "/api/puestos",
        "puestos.update": `/api/puestos/${id}`,
        "departamentos.index": "/api/departamentos", // Nueva ruta para obtener departamentos
    };
    return routeMap[name] || `/${name}`;
};

// Función de validación de entradas
const validateInputs = (validations, data) => {
    let formErrors = {};
    if (validations.Puestos_nombre && !data.Puestos_nombre?.trim()) formErrors.Puestos_nombre = 'El nombre del puesto es obligatorio.';
    if (validations.Puestos_idDepartamento && !data.Puestos_idDepartamento) formErrors.Puestos_idDepartamento = 'El departamento es obligatorio.';
    return { isValid: Object.keys(formErrors).length === 0, errors: formErrors };
};

const positionValidations = {
    Puestos_nombre: true,
    Puestos_idDepartamento: true,
};

const initialPositionData = {
    Puestos_id: null,
    Puestos_nombre: "",
    Puestos_estatus: 1, // Por defecto: Activo (1)
    Puestos_idDepartamento: "",
};

function PositionFormDialog({ isOpen, closeModal, onSubmit, positionToEdit, action, errors, setErrors, departments }) {
    const [positionData, setPositionData] = useState(initialPositionData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Asegura que Puestos_idDepartamento sea un string para el <select>
            const dataToLoad = positionToEdit
                ? { ...positionToEdit, Puestos_idDepartamento: String(positionToEdit.Puestos_idDepartamento) }
                : initialPositionData;

            setPositionData(dataToLoad);
            setErrors({});
        }
    }, [isOpen, positionToEdit, setErrors]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setPositionData(prevData => ({
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
            await onSubmit(positionData);
        } catch (error) {
            // Manejo de error (ej: validación fallida)
        } finally {
            setLoading(false);
        }
    };

    const dialogTitle = action === 'create' ? 'Crear Nuevo Puesto' : 'Editar Puesto';

    return (
        <Transition show={isOpen}>
            <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl relative">
                        {loading && <LoadingDiv />}
                        <DialogTitle className="text-2xl font-bold mb-4 text-gray-900 border-b pb-2">
                            {dialogTitle}
                        </DialogTitle>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">

                            {/* Campo Nombre del Puesto */}
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Nombre del Puesto: <span className="text-red-500">*</span></span>
                                <input
                                    type="text"
                                    name="Puestos_nombre"
                                    value={positionData.Puestos_nombre || ''}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.Puestos_nombre ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                />
                                {errors.Puestos_nombre && <p className="text-red-500 text-xs mt-1">{errors.Puestos_nombre}</p>}
                            </label>

                            {/* Campo Departamento (Select) */}
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Departamento: <span className="text-red-500">*</span></span>
                                <select
                                    name="Puestos_idDepartamento"
                                    value={positionData.Puestos_idDepartamento || ''}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.Puestos_idDepartamento ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                >
                                    <option value="" disabled>Selecciona un departamento</option>
                                    {departments.map((dept) => (
                                        <option
                                            key={dept.Departamentos_id}
                                            value={dept.Departamentos_id}
                                        >
                                            {dept.Departamentos_nombre}
                                        </option>
                                    ))}
                                </select>
                                {errors.Puestos_idDepartamento && <p className="text-red-500 text-xs mt-1">{errors.Puestos_idDepartamento}</p>}
                            </label>

                            <div className="flex justify-center w-full"> {/* <-- Contenedor agregado y clases de centrado */}
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        name="Puestos_estatus"
                                        checked={positionData.Puestos_estatus == 1} // Usamos == para manejar 1 o '1'
                                        onChange={handleChange}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Estatus</span>
                                </label>
                            </div>


                            <div className="col-span-1 flex justify-end gap-3 pt-4 border-t mt-4">
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
                                    {loading ? (action === 'create' ? 'Registrando...' : 'Actualizando...') : (action === 'create' ? 'Guardar Puesto' : 'Actualizar Puesto')}
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    )
}

// --- Componente Principal ---

export default function Puestos() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [positions, setPositions] = useState([]); // Lista de puestos
    const [departments, setDepartments] = useState([]); // Lista de departamentos
    const [action, setAction] = useState('create');
    const [positionData, setPositionData] = useState(initialPositionData);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const openCreateModal = () => {
        setAction('create');
        setPositionData(initialPositionData);
        setErrors({});
        setIsDialogOpen(true);
    };

    const openEditModal = (position) => {
        setAction('edit');
        setPositionData(position);
        setErrors({});
        setIsDialogOpen(true);
    };

    const closeModal = () => {
        setIsDialogOpen(false);
        setPositionData(initialPositionData);
        setErrors({});
    };

    const submit = async (data) => {
        setErrors({});
        const validationResult = validateInputs(positionValidations, data);

        if (!validationResult.isValid) {
            setErrors(validationResult.errors);
            toast.error("Por favor, corrige los errores en el formulario.");
            throw new Error("Validation Failed");
        }

        const isEdit = data.Puestos_id;
        const ruta = isEdit
            ? route("puestos.update", { Puestos_id: data.Puestos_id }) // ¡Ruta de puestos!
            : route("puestos.store"); // ¡Ruta de puestos!

        const method = isEdit ? "PUT" : "POST";
        const successMessage = isEdit ? "Puesto actualizado con éxito." : "Puesto creado con éxito.";

        try {
            const payload = {
                Puestos_nombre: data.Puestos_nombre,
                Puestos_estatus: data.Puestos_estatus,
                Puestos_idDepartamento: data.Puestos_idDepartamento, // Incluir la clave foránea
            };

            await request(ruta, method, payload);
            await getPositions(); // Recargar la tabla de puestos
            toast.success(successMessage);
            closeModal(); // Cerrar solo si la operación fue exitosa

        } catch (error) {
            console.error("Error al guardar el puesto:", error);
            toast.error("Hubo un error al guardar el puesto.");
            throw error;
        }
    };


    const getDepartments = async () => {
        try {
            // Obtenemos todos los departamentos para el <select>
            const data = await fetch(route("DepartamentosActivos")).then(res => res.json());
            setDepartments(data);
        } catch (error) {
            console.error('Error al obtener los departamentos:', error);
            toast.error("Error al cargar la lista de departamentos.");
        }
    }

    const getPositions = async () => {
        try {
            setIsLoading(true);
            const data = await fetch(route("puestos.index")).then(res => res.json());
            setPositions(data);
            setIsLoading(false);

        } catch (error) {
            console.error('Error al obtener los puestos:', error);
            setIsLoading(false);
            toast.error("Error al cargar la lista de puestos.");
        }
    }

    useEffect(() => {
        getDepartments();
        getPositions();
    }, [])

    // Definición de las columnas de la tabla
    const columns = [
        {
            header: "Estatus",
            accessor: "estatus",
            cell: ({ item: { estatus } }) => {
                const color = String(estatus) === "1"
                    ? "bg-green-300" // Si es "1"
                    : "bg-red-300";  // Si NO es "1" (incluyendo "2", "0", null, etc.)

                return (
                    <span className={`inline-flex items-center justify-center rounded-full ${color} w-4 h-4`} />
                );
            },
        },
        { header: 'Nombre del Puesto', accessor: 'nombre' },
        { header: 'Departamento', accessor: 'departamento.nombre' },
        {
            header: "Acciones", accessor: "Acciones", cell: (eprops) => (<div className="flex space-x-2">
                <button
                    onClick={() => openEditModal(eprops.item)}
                    className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                >
                    Editar
                </button>
            </div>)
        },
    ];

    return (
        <div className="relative h-[100%] pb-4 px-3 overflow-auto blue-scroll">
            {/* <div className="flex justify-between items-center p-3 border-b mb-4">
                <h2 className="text-3xl font-bold text-gray-800">Gestión de Puestos</h2>
                <button
                    onClick={openCreateModal}
                    className="flex items-center px-4 py-2 text-base font-semibold text-white rounded-lg shadow-md  transition duration-150 ease-in-out"
                    style={{ backgroundColor: '#A61A18' }}>
                    + Nuevo Puesto
                </button>
            </div> */}

            {isLoading ? (
                <div className='flex items-center justify-center h-[100%] w-full'> <LoadingDiv /> </div>

            ) : (
                <Datatable
                    data={positions}
                    add={() => {
                        openCreateModal()
                    }}
                    virtual={true}
                    columns={columns}
                />
            )}

            <PositionFormDialog
                isOpen={isDialogOpen}
                closeModal={closeModal}
                onSubmit={submit}
                positionToEdit={positionData}
                action={action}
                errors={errors}
                setErrors={setErrors}
                departments={departments} // Pasamos la lista de departamentos
            />

        </div>
    );
}