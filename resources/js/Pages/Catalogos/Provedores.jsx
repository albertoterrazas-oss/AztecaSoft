import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

// --- Configuración y Utilidades ---

// Obtenemos el objeto de usuario una sola vez al cargar el componente
const userObject = JSON.parse(localStorage.getItem('user') || '{}');

const route = (name, params = {}) => {
    const id = params.IdProveedor;
    const routeMap = {
        "proveedores.index": "/api/proveedores",
        "proveedores.store": "/api/proveedores",
        "proveedores.update": `/api/proveedores/${id}`,
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
    idUsuario: userObject.IdUsuario || 1, // Usamos tu lógica de userObject
};

// --- Componente del Formulario (Diálogo Modal) ---

function ProveedorFormDialog({ isOpen, closeModal, onSubmit, dataToEdit, action, errors, setErrors }) {
    const [formData, setFormData] = useState(initialProveedorData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                IdProveedor: dataToEdit?.IdProveedor || null,
                RazonSocial: dataToEdit?.RazonSocial || "",
                RFC: dataToEdit?.RFC || "",
                // Mantenemos el ID original si editamos, o el del localStorage si es nuevo
                idUsuario: dataToEdit?.idUsuario || userObject.Personas_usuarioID || 1
            });
            setErrors({});
        }
    }, [isOpen, dataToEdit, setErrors]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Convertimos RFC a mayúsculas automáticamente para seguir el estándar fiscal
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'RFC' ? value.toUpperCase() : value 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try { await onSubmit(formData); } finally { setLoading(false); }
    };

    return (
        <Transition show={isOpen}>
            <Dialog onClose={closeModal} className="relative z-50">
                <TransitionChild enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl relative">
                        {loading && <LoadingDiv />}
                        
                        <DialogTitle className="text-2xl font-bold mb-4 text-gray-900 border-b pb-2">
                            {action === 'create' ? 'Nuevo Proveedor' : 'Editar Proveedor'}
                        </DialogTitle>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                            {/* Razón Social */}
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Razón Social:</span>
                                <input 
                                    type="text" 
                                    name="RazonSocial" 
                                    value={formData.RazonSocial} 
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.RazonSocial ? 'border-red-500' : 'border-gray-300'}`} 
                                />
                                {errors.RazonSocial && <p className="text-red-500 text-xs mt-1">{errors.RazonSocial}</p>}
                            </label>

                            {/* RFC */}
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">RFC:</span>
                                <input 
                                    type="text" 
                                    name="RFC" 
                                    maxLength={13}
                                    value={formData.RFC} 
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.RFC ? 'border-red-500' : 'border-gray-300'}`} 
                                />
                                {errors.RFC && <p className="text-red-500 text-xs mt-1">{errors.RFC}</p>}
                            </label>

                            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Guardar</button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}

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
            const response = await fetch(route("proveedores.index"));
            const resData = await response.json();
            setData(resData);
        } catch (error) { toast.error("Error al cargar proveedores."); } finally { setIsLoading(false); }
    };

    useEffect(() => { getData(); }, []);

    const submit = async (formData) => {
        const validation = validateInputs(formData);
        if (!validation.isValid) return setErrors(validation.errors);

        const isEdit = !!formData.IdProveedor;
        const ruta = isEdit ? route("proveedores.update", { IdProveedor: formData.IdProveedor }) : route("proveedores.store");
        const method = isEdit ? "PUT" : "POST";

        try {
            await request(ruta, method, formData);
            toast.success(isEdit ? "Proveedor actualizado" : "Proveedor creado con éxito");
            await getData();
            setIsDialogOpen(false);
        } catch (error) { toast.error("Error al guardar."); }
    };

    return (
        <div className="relative h-full pb-4 px-3 overflow-auto">
            {isLoading ? <div className='flex items-center justify-center h-64'><LoadingDiv /></div> : (
                <Datatable 
                    data={data}
                    virtual={true}
                    add={() => { setAction('create'); setCurrent(initialProveedorData); setIsDialogOpen(true); }}
                    columns={[
                        { header: 'Razón Social', accessor: 'RazonSocial' },
                        { header: 'RFC', accessor: 'RFC' },
                        { header: "Acciones", accessor: "actions", cell: (props) => (
                            <button 
                                onClick={() => { setAction('edit'); setCurrent(props.item); setIsDialogOpen(true); }}
                                className="px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                            >
                                Editar
                            </button>
                        )},
                    ]}
                />
            )}
            <ProveedorFormDialog 
                isOpen={isDialogOpen} 
                closeModal={() => setIsDialogOpen(false)} 
                onSubmit={submit} 
                dataToEdit={current} 
                action={action} 
                errors={errors} 
                setErrors={setErrors} 
            />
        </div>
    );
}