import { Fragment, useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

// 1. Corregimos la función de ruta para que use IdPuesto
const route = (name, params = {}) => {
    const id = params.IdPuesto; // Cambiado de Puestos_id a IdPuesto
    const routeMap = {
        "puestos.index": "/api/puestos",
        "DepartamentosActivos": "/api/DepartamentosActivos",
        "puestos.store": "/api/puestos",
        "puestos.update": `/api/puestos/${id}`,
    };
    return routeMap[name] || `/${name}`;
};

const validateInputs = (data) => {
    let formErrors = {};
    if (!data.nombre?.trim()) formErrors.nombre = 'El nombre es obligatorio.';
    if (!data.IdDepartamento) formErrors.IdDepartamento = 'El departamento es obligatorio.';
    return { isValid: Object.keys(formErrors).length === 0, errors: formErrors };
};

const initialPositionData = {
    IdPuesto: null,
    nombre: '',
    IdDepartamento: '',
    estatus: "1",
    TieneHorasExtra: "0"
};

function PositionFormDialog({ isOpen, closeModal, onSubmit, positionToEdit, action, errors, setErrors, departments }) {
    const [positionData, setPositionData] = useState(initialPositionData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPositionData(positionToEdit || initialPositionData);
            setErrors({});
        }
    }, [isOpen, positionToEdit, setErrors]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let finalValue = value;

        if (type === 'checkbox') {
            finalValue = checked ? "1" : "0";
        } else if (name === 'nombre') {
            finalValue = value.toUpperCase();
        }

        setPositionData(prev => ({ ...prev, [name]: finalValue }));
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
            await onSubmit(positionData);
        } catch (error) {
            console.error("Rhino Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={closeModal} className="relative z-[100]">
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-8" enterTo="opacity-100 scale-100 translate-y-0" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <DialogPanel className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl relative overflow-hidden border-t-8 border-[#1B2654]">
                            {loading && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
                                    <div className="w-12 h-12 border-4 border-[#1B2654] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}

                            <div className="p-10">
                                <div className="flex flex-col items-center mb-8">
                                    <DialogTitle className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                                        {action === 'create' ? 'Nuevo Puesto' : 'Editar Puesto'}
                                    </DialogTitle>
                                    <div className="h-1 w-12 bg-[#A61A18] mt-2 rounded-full"></div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-2">Nombre del Puesto</label>
                                        <input
                                            type="text"
                                            name="nombre"
                                            value={positionData.nombre}
                                            onChange={handleChange}
                                            className={`w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 transition-all font-bold ${errors.nombre ? 'border-red-500' : 'border-slate-100 focus:border-[#1B2654]'}`}
                                        />
                                        {errors.nombre && <p className="text-red-500 text-[10px] font-bold ml-2">{errors.nombre}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-2">Departamento</label>
                                        <select
                                            name="IdDepartamento"
                                            value={positionData.IdDepartamento}
                                            onChange={handleChange}
                                            className={`w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 transition-all font-bold ${errors.IdDepartamento ? 'border-red-500' : 'border-slate-100 focus:border-[#1B2654]'}`}
                                        >
                                            <option value="">SELECCIONE...</option>
                                            {departments.map((dept) => (
                                                <option key={dept.IdDepartamento} value={dept.IdDepartamento}>{dept.nombre}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                                        <span className="text-[11px] font-black text-slate-500 uppercase">¿Aplica Horas Extra?</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" name="TieneHorasExtra" checked={positionData.TieneHorasExtra == 1} onChange={handleChange} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between bg-slate-900 px-6 py-4 rounded-2xl">
                                        <span className="text-[11px] font-black text-slate-400 uppercase">Estatus Activo</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" name="estatus" checked={positionData.estatus == 1} onChange={handleChange} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A61A18]"></div>
                                        </label>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={closeModal} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest">Cancelar</button>
                                        <button type="submit" className="flex-[2] py-4 bg-[#1B2654] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">
                                            {action === 'create' ? 'Registrar' : 'Guardar'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}

export default function Puestos() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [positions, setPositions] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [action, setAction] = useState('create');
    const [positionData, setPositionData] = useState(initialPositionData);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const getDepartments = async () => {
        try {
            const data = await fetch(route("DepartamentosActivos")).then(res => res.json());
            setDepartments(data);
        } catch (e) { console.error(e); }
    };

    const getPositions = async () => {
        try {
            setIsLoading(true);
            const data = await fetch(route("puestos.index")).then(res => res.json());
            setPositions(data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    useEffect(() => {
        getDepartments();
        getPositions();
    }, []);

    const openCreateModal = () => {
        setAction('create');
        setPositionData(initialPositionData);
        setIsDialogOpen(true);
    };

    const openEditModal = (item) => {
        setAction('edit');
        // Mapeo exacto basado en el JSON que me mostraste
        setPositionData({
            IdPuesto: item.IdPuesto,
            nombre: item.nombre,
            IdDepartamento: String(item.IdDepartamento),
            estatus: String(item.estatus),
            TieneHorasExtra: String(item.TieneHorasExtra)
        });
        setIsDialogOpen(true);
    };

    const submit = async (formData) => {
        const validation = validateInputs(formData);
        if (!validation.isValid) {
            setErrors(validation.errors);
            toast.error("Revisa los campos.");
            throw new Error("Validation Error");
        }

        // Si hay IdPuesto es un update, si no, store
        const isEdit = action === 'edit';
        const url = isEdit ? route("puestos.update", { IdPuesto: formData.IdPuesto }) : route("puestos.store");
        
        const payload = {
            nombre: formData.nombre,
            estatus: formData.estatus,
            IdDepartamento: formData.IdDepartamento,
            TieneHorasExtra: formData.TieneHorasExtra
        };

        try {
            await request(url, isEdit ? "PUT" : "POST", payload);
            toast.success("¡Listo, rey!");
            getPositions();
            setIsDialogOpen(false);
        } catch (e) {
            toast.error("Error en el servidor.");
            throw e;
        }
    };

    return (
        <div className="h-full p-4 overflow-auto">
            {isLoading ? <div className="flex h-full items-center justify-center"><LoadingDiv /></div> : (
                <Datatable
                    data={positions}
                    add={openCreateModal}
                    virtual={true}
                    columns={[
                        { 
                            header: "Estatus", 
                            accessor: "estatus",
                            cell: ({ item }) => (
                                <span className={`inline-flex w-3 h-3 rounded-full ${item.estatus == 1 ? 'bg-green-400' : 'bg-red-400'}`} />
                            )
                        },
                        { header: 'Puesto', accessor: 'nombre' },
                        { header: 'Departamento', accessor: 'departamento.nombre' },
                        {
                            header: "Acciones", cell: (props) => (
                                <button onClick={() => openEditModal(props.item)} className="text-blue-600 font-bold text-xs uppercase">Editar</button>
                            )
                        }
                    ]}
                />
            )}
            <PositionFormDialog 
                isOpen={isDialogOpen} 
                closeModal={() => setIsDialogOpen(false)} 
                onSubmit={submit}
                positionToEdit={positionData}
                action={action}
                errors={errors}
                setErrors={setErrors}
                departments={departments}
            />
        </div>
    );
}