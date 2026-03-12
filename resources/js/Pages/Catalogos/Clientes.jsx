import { useEffect, useState, Fragment, memo } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import { Building2, Fingerprint, Save, UserPlus, Pencil, Building } from "lucide-react";
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

// --- HELPERS Y CONFIGURACIÓN ---
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

const initialClienteData = {
    IdCliente: null,
    RazonSocial: "",
    RFC: "",
    idUsuario: userObject.IdUsuario || 1,
};

// --- COMPONENTE INPUT ESTILO RHINO ---
const RhinoInput = memo(({ label, icon: Icon, error, ...props }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 flex items-center gap-2">
            {Icon && <Icon size={12} className="text-[#1B2654]" />}
            {label}
        </label>
        <input
            {...props}
            className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none text-sm 
            ${error ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-[#1B2654] focus:bg-white'}`}
        />
        {error && <p className="text-red-500 text-[9px] font-black uppercase mt-1 ml-4">{error}</p>}
    </div>
));

// --- MODAL FORMULARIO CLIENTES ---
function ClienteFormDialog({ isOpen, closeModal, onSubmit, dataToEdit, action, errors, setErrors }) {
    const [formData, setFormData] = useState(initialClienteData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                IdCliente: dataToEdit?.IdCliente || null,
                RazonSocial: dataToEdit?.RazonSocial || "",
                RFC: dataToEdit?.RFC || "",
                idUsuario: dataToEdit?.idUsuario || userObject.IdUsuario || 1
            });
            setErrors({});
        }
    }, [isOpen, dataToEdit, setErrors]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));

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
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={loading ? () => { } : closeModal} className="relative z-[200]">
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <DialogPanel className="w-full max-w-md rounded-[3rem] bg-white p-10 shadow-2xl relative overflow-hidden border-b-[12px] border-[#1B2654]">

                            {loading && (
                                <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
                                    <LoadingDiv />
                                    <span className="mt-4 text-[10px] font-black text-[#1B2654] uppercase tracking-[0.3em] animate-pulse">Sincronizando</span>
                                </div>
                            )}

                            <div className="flex flex-col items-center mb-8">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-[#1B2654] mb-4 shadow-inner">
                                    <Building size={32} />
                                </div>
                                <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter text-center italic leading-none">
                                    {action === 'create' ? 'Nuevo' : 'Editar'} <br />
                                    <span className="text-[#1B2654]">Cliente</span>
                                </DialogTitle>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <RhinoInput
                                    label="Razón Social"
                                    name="RazonSocial"
                                    value={formData.RazonSocial}
                                    onChange={handleChange}
                                    placeholder="NOMBRE DE LA EMPRESA"
                                    error={errors.RazonSocial}
                                    icon={Building2}
                                />

                                <RhinoInput
                                    label="RFC"
                                    name="RFC"
                                    value={formData.RFC}
                                    onChange={handleChange}
                                    placeholder="XAXX010101000"
                                    error={errors.RFC}
                                    icon={Fingerprint}
                                    maxLength={13}
                                />

                                <div className="flex gap-4 pt-6 border-t border-slate-100">
                                    <button type="button" onClick={closeModal} className="flex-1 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-red-600 transition-colors">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={loading} className="flex-[2] py-4 bg-[#1B2654] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#A61A18] transition-all disabled:bg-slate-300 flex items-center justify-center gap-2">
                                        <Save size={14} />
                                        {loading ? 'Guardando...' : 'Confirmar'}
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

// --- VISTA PRINCIPAL ---
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
        } catch (error) {
            toast.error("Error al cargar clientes.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { getData(); }, []);

    const submit = async (formData) => {
        // Validación Rhino Style
        let formErrors = {};
        if (!formData.RazonSocial?.trim()) formErrors.RazonSocial = 'La razón social es obligatoria.';
        if (!formData.RFC?.trim()) formErrors.RFC = 'El RFC es obligatorio.';

        if (Object.keys(formErrors).length > 0) return setErrors(formErrors);

        const isEdit = !!formData.IdCliente;
        const ruta = isEdit ? route("clientes.update", { IdCliente: formData.IdCliente }) : route("clientes.store");
        const method = isEdit ? "PUT" : "POST";

        try {
            await request(ruta, method, formData);
            toast.success(isEdit ? "Cliente actualizado" : "Cliente registrado");
            await getData();
            setIsDialogOpen(false);
        } catch (error) {
            toast.error("Error en la sincronización.");
        }
    };

    return (
        <div className="h-full bg-[#f8fafc] p-8 flex flex-col font-sans overflow-hidden">
            {/* Header de la vista */}
            {/* <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="bg-[#1B2654] p-4 rounded-3xl shadow-lg shadow-blue-900/20">
                        <Building className="text-white" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[#1B2654] uppercase tracking-tighter italic">Clientes</h1>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Directorio Comercial Rhino</p>
                    </div>
                </div>
                <button 
                    onClick={() => { setAction('create'); setCurrent(initialClienteData); setIsDialogOpen(true); }}
                    className="bg-[#1B2654] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#A61A18] transition-all shadow-xl flex items-center gap-3"
                >
                    <UserPlus size={20} />
                    Nuevo Cliente
                </button>
            </div> */}

            {/* Contenedor de Tabla */}
            <div className="flex-1  overflow-hidden relative">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <LoadingDiv />
                    </div>
                ) : (
                    <Datatable
                        data={data}
                        virtual={true}
                        add={() => {
                            setAction('create'); setCurrent(initialClienteData); setIsDialogOpen(true);

                        }}
                        columns={[
                            {
                                header: 'Razón Social',
                                cell: (p) => <span className="font-bold text-slate-700 uppercase">{p.item.RazonSocial}</span>
                            },
                            {
                                header: 'RFC',
                                cell: (p) => <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg font-mono">{p.item.RFC}</span>
                            },
                            {
                                header: "Acciones",
                                cell: (props) => (
                                    <button
                                        onClick={() => { setAction('edit'); setCurrent(props.item); setIsDialogOpen(true); }}
                                        className="p-3 bg-slate-50 text-[#1B2654] rounded-xl hover:bg-[#1B2654] hover:text-white transition-all border border-slate-100"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                )
                            },
                        ]}
                    />
                )}
            </div>

            <ClienteFormDialog
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