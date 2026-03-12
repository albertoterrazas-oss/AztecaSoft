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
        const finalValue = type === 'checkbox' ? (checked ? 1 : 0) : value.toUpperCase();

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
            // Manejado en el padre
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

                            {/* Encabezado Estilo Rhino */}
                            <div className="flex flex-col items-center mb-8">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-[#1B2654] mb-4 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6.75h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                                    </svg>
                                </div>
                                <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter text-center">
                                    {action === 'create' ? 'Nuevo Departamento' : 'Editar Área'}
                                </DialogTitle>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 text-center">Estructura Organizacional</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Nombre del Departamento */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nombre del Área / Departamento *</label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={departmentData.nombre}
                                        onChange={handleChange}
                                        placeholder="EJ: RECURSOS HUMANOS"
                                        className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none uppercase ${errors.nombre ? 'border-red-500' : 'border-transparent focus:border-[#1B2654] focus:bg-white'
                                            }`}
                                    />
                                    {errors.nombre && (
                                        <p className="text-red-500 text-[10px] font-bold ml-2 uppercase mt-1">{errors.nombre}</p>
                                    )}
                                </div>

                                {/* Estatus Toggle Estilo Rhino */}
                                <div className="flex justify-center bg-slate-50 py-4 rounded-2xl border-2 border-dashed border-slate-200">
                                    <label className="group flex items-center space-x-3 cursor-pointer select-none">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Baja</span>
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                name="estatus"
                                                checked={Number(departmentData.estatus) === 1}
                                                onChange={handleChange}
                                                className="sr-only peer"
                                            />
                                            <div className="w-14 h-7 bg-slate-300 rounded-full peer peer-checked:bg-[#1B2654] transition-colors shadow-inner"></div>
                                            <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-7 shadow-md"></div>
                                        </div>
                                        <span className="text-[10px] font-black text-[#1B2654] uppercase tracking-widest">Activo</span>
                                    </label>
                                </div>

                                {/* Botones de Acción */}
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
                                        {loading ? 'Procesando...' : (action === 'create' ? 'Guardar Área' : 'Actualizar Área')}
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
        <div className="relative h-[100%] pb-4 px-3 overflow-auto blue-scroll">

            {isLoading ? (
                <div className='flex items-center justify-center h-[100%] w-full'> <LoadingDiv /> </div>
            ) : (
                <Datatable
                    data={departments}
                    virtual={true}
                    add={() => {
                        openCreateModal()
                    }}
                    columns={[
                        {
                            header: "Estatus",
                            accessor: "estatus",
                            width: '10%',
                            cell: ({ item: { estatus } }) => (
                                <div className="flex justify-center">
                                    <span className={`inline-flex items-center justify-center rounded-full w-4 h-4 shadow-sm ${Number(estatus) === 1 ? "bg-green-400" : "bg-red-400"
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