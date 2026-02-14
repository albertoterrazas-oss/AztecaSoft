import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

const route = (name, params = {}) => {
    const id = params.IdCliente;
    const routeMap = {
        "clientes.index": "/api/clientes",
        "clientes.store": "/api/clientes",
        "clientes.update": `/api/clientes/${id}`,
    };
    return routeMap[name] || `/${name}`;
};


const userObject = JSON.parse(localStorage.getItem('user') || '{}');

const validateInputs = (data) => {
    let formErrors = {};
    if (!data.RazonSocial?.trim()) formErrors.RazonSocial = 'La razón social es obligatoria.';
    if (!data.RFC?.trim()) formErrors.RFC = 'El RFC es obligatorio.';
    return { isValid: Object.keys(formErrors).length === 0, errors: formErrors };
};

const initialClienteData = {
    IdCliente: null,
    RazonSocial: "",
    RFC: "",
    idUsuario: userObject.IdUsuario, // Ajustar según el usuario autenticado
};

function ClienteFormDialog({ isOpen, closeModal, onSubmit, dataToEdit, action, errors, setErrors }) {
    const [formData, setFormData] = useState(initialClienteData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                IdCliente: dataToEdit?.IdCliente || null,
                RazonSocial: dataToEdit?.RazonSocial || "",
                RFC: dataToEdit?.RFC || "",
                idUsuario: dataToEdit?.idUsuario || 1
            });
            setErrors({});
        }
    }, [isOpen, dataToEdit, setErrors]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                            {action === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
                        </DialogTitle>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Razón Social:</span>
                                <input type="text" name="RazonSocial" value={formData.RazonSocial} onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.RazonSocial ? 'border-red-500' : 'border-gray-300'}`} />
                                {errors.RazonSocial && <p className="text-red-500 text-xs mt-1">{errors.RazonSocial}</p>}
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">RFC:</span>
                                <input type="text" name="RFC" value={formData.RFC} onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.RFC ? 'border-red-500' : 'border-gray-300'}`} />
                                {errors.RFC && <p className="text-red-500 text-xs mt-1">{errors.RFC}</p>}
                            </label>
                            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md">Guardar</button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}

export default function Clientes() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [data, setData] = useState([]);
    const [action, setAction] = useState('create');
    const [current, setCurrent] = useState(initialClienteData);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const getData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(route("clientes.index"));
            const resData = await response.json();
            setData(resData);
        } catch (error) { toast.error("Error al cargar clientes."); } finally { setIsLoading(false); }
    };

    useEffect(() => { getData(); }, []);

    const submit = async (formData) => {
        const validation = validateInputs(formData);
        if (!validation.isValid) return setErrors(validation.errors);

        const isEdit = !!formData.IdCliente;
        const ruta = isEdit ? route("clientes.update", { IdCliente: formData.IdCliente }) : route("clientes.store");
        const method = isEdit ? "PUT" : "POST";

        try {
            await request(ruta, method, formData);
            toast.success("Cliente guardado");
            await getData();
            setIsDialogOpen(false);
        } catch (error) { toast.error("Error al guardar."); }
    };

    return (
        <div className="relative h-full pb-4 px-3 overflow-auto">
            {isLoading ? <div className='flex items-center justify-center h-64'><LoadingDiv /></div> : (
                <Datatable data={data}
                virtual={true}
                add={() => { setAction('create'); setCurrent(initialClienteData); setIsDialogOpen(true); }}
                    columns={[
                        { header: 'Razón Social', accessor: 'RazonSocial' },
                        { header: 'RFC', accessor: 'RFC' },
                        { header: "Acciones", accessor: "actions", cell: (props) => (
                            <button onClick={() => { setAction('edit'); setCurrent(props.item); setIsDialogOpen(true); }}
                                className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200">Editar</button>
                        )},
                    ]}
                />
            )}
            <ClienteFormDialog isOpen={isDialogOpen} closeModal={() => setIsDialogOpen(false)} onSubmit={submit} dataToEdit={current} action={action} errors={errors} setErrors={setErrors} />
        </div>
    );
}