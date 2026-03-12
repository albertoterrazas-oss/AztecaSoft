import React, { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";


const validateInputs = (validations, data) => {
    let formErrors = {};

    // Validación de Correo (Requerido)
    if (validations.correo) {
        if (!data.correo?.trim()) {
            formErrors.correo = 'El correo es obligatorio.';
        } else if (!/\S+@\S+\.\S/.test(data.correo)) {
            formErrors.correo = 'Formato de correo inválido.';
        }
    }

    // Validación de ID de Usuario (Requerido y debe ser un número)
    if (validations.idUsuario) {
        // Importante: el valor del select es un string que debe convertirse
        const idUsuario = Number(data.idUsuario);
        if (data.idUsuario === "" || isNaN(idUsuario) || idUsuario <= 0) {
            formErrors.idUsuario = 'El ID de Usuario es obligatorio y debe ser un número positivo.';
        }
    }

    return { isValid: Object.keys(formErrors).length === 0, errors: formErrors };
};

// Validaciones requeridas para el formulario de Correo
const correoValidations = {
    correo: true,
    idUsuario: true,

    idAsunto: true
};

// Datos de ejemplo para el estado inicial del formulario de correo
const initialCorreoData = {
    IdCorreoNotificaciones: null,
    correo: "",
    idUsuario: "", // String para el input/select
    estatus: "1",
    idAsunto: ''
    // Activo por defecto ("1" o "0")
};

// Datos iniciales de la configuración SMTP (Claves usadas en el estado del formulario)
const initialSMTPConfig = {
    correo: "",
    password: "",
    host: "",
    puerto: "587",
    seguridadSSL: "ssl",
};

function ConfiguracionSMTPForm({ config, reloadConfig, isLoading }) {
    const [formData, setFormData] = useState(initialSMTPConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
    const [testEmail, setTestEmail] = useState("");

    // Sincronizar con props cuando cambien
    useEffect(() => {
        if (config) {
            setFormData({
                correo: config.correo || "",
                password: config.password || "",
                host: config.host || "",
                puerto: config.puerto || "",
            });
        }
    }, [config]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Ahora los nombres coinciden con el estado
            const payload = {
                correo: formData.correo,
                password: formData.password,
                host: formData.host,
                puerto: formData.puerto,
                seguridadSSL: 'ssl', // Valor fijo según tu código original
            };

            await request(route("ConfiguracionCorreoStore"), "POST", payload);
            await reloadConfig();
            toast.success("Configuración guardada correctamente.");
        } catch (error) {
            toast.error("Error al guardar la configuración.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmTestSend = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await request(route("sendMailTest"), "POST", { destinatario: testEmail });
            toast.success("Correo de prueba enviado.");
            setIsTestDialogOpen(false);
            setTestEmail("");
        } catch (error) {
            toast.error("Error al enviar prueba.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-100 mb-6 relative">
            {isLoading && <LoadingDiv text="Cargando Configuración..." />}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Correo Servidor</label>
                    <input
                        type="email"
                        name="correo" // Cambiado de smtp_correo a correo
                        value={formData.correo}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                    <input
                        type="password" // Cambiado a type="password" por seguridad
                        name="password" // Cambiado de smtp_password a password
                        value={formData.password}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Host</label>
                    <input
                        type="text"
                        name="host" // Cambiado de smtp_host a host
                        value={formData.host}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Puerto</label>
                    <input
                        type="number"
                        name="puerto" // Cambiado de smtp_port a puerto
                        value={formData.puerto}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                        required
                    />
                </div>

                <div className="md:col-span-2 lg:col-span-5 flex justify-end pt-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setIsTestDialogOpen(true)}
                        className="px-6 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 transition shadow-md disabled:opacity-50"
                    >
                        Enviar Correo de Prueba
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving || isLoading}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </form>

            {/* Modal de prueba */}
            <Transition show={isTestDialogOpen} as={React.Fragment}>
                <Dialog onClose={() => setIsTestDialogOpen(false)} className="relative z-50">
                    <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                            <DialogTitle className="text-xl font-bold mb-4 border-b pb-2">Enviar Prueba</DialogTitle>
                            <form onSubmit={handleConfirmTestSend}>
                                <label className="block text-sm font-medium mb-1">Correo del destinatario:</label>
                                <input
                                    type="email"
                                    required
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    className="w-full border p-2 rounded-md mb-4"
                                    placeholder="correo@ejemplo.com"
                                />
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsTestDialogOpen(false)}
                                        className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {sending ? 'Enviando...' : 'Enviar'}
                                    </button>
                                </div>
                            </form>
                        </DialogPanel>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}


// ✉️ COMPONENTE: CorreoFormDialog
function CorreoFormDialog({ isOpen, closeModal, onSubmit, correoToEdit, action, errors, setErrors }) {
    const [correoData, setCorreoData] = useState(initialCorreoData);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [asuntos, setAsuntos] = useState([]);

    useEffect(() => {
        if (isOpen) {
            const dataToLoad = correoToEdit && correoToEdit.IdCorreoNotificaciones ? correoToEdit : initialCorreoData;
            setCorreoData({
                ...dataToLoad,
                idUsuario: String(dataToLoad.idUsuario || ""),
                idAsunto: String(dataToLoad.idAsunto || ""),
            });
            setErrors({});
        }
    }, [isOpen, correoToEdit, setErrors]);

    const getUsers = async () => {
        try {
            const response = await fetch(route("users.index"));
            const data = await response.json();
            setUsers(data.data || data || []);
        } catch (error) {
            console.error('Error al obtener los usuarios:', error);
            toast.error("No se pudieron cargar los usuarios.");
        }
    }

    const getAsuntos = async () => {
        try {
            const response = await fetch(route("asuntos.index"));
            const data = await response.json();
            setAsuntos(data.data || data || []);
        } catch (error) {
            console.error('Error al obtener los asuntos:', error);
            toast.error("No se pudieron cargar los asuntos.");
        }
    }

    useEffect(() => {
        getUsers();
        getAsuntos();
    }, [])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? (checked ? "1" : "0") : value;

        setCorreoData(prevData => ({
            ...prevData,
            [name]: finalValue
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

        const dataToSend = {
            ...correoData,
            idUsuario: Number(correoData.idUsuario),
            idAsunto: Number(correoData.idAsunto)
        };

        try {
            await onSubmit(dataToSend);
            closeModal();
        } catch (error) {
            // Manejo de error
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={isOpen}>
            <Dialog onClose={closeModal} className="relative z-[100]">
                {/* Backdrop con Blur */}
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
                        <DialogPanel className="w-full max-w-xl bg-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden border-b-[12px] border-[#1B2654]">

                            {/* Overlay de carga */}
                            {loading && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                                    <LoadingDiv />
                                </div>
                            )}

                            {/* Encabezado */}
                            <div className="flex flex-col items-center mb-8">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-[#1B2654] mb-4 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                    </svg>
                                </div>
                                <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter text-center">
                                    {action === 'create' ? 'Nueva Notificación' : 'Configurar Correo'}
                                </DialogTitle>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 text-center">Alertas y Avisos del Sistema</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">

                                {/* Correo Electrónico */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Dirección de Destino *</label>
                                    <input
                                        type="email"
                                        name="correo"
                                        value={correoData.correo || ''}
                                        onChange={handleChange}
                                        placeholder="CORREO@DOMINIO.COM"
                                        className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none ${errors.correo ? 'border-red-500' : 'border-transparent focus:border-[#1B2654] focus:bg-white'
                                            }`}
                                        required
                                    />
                                    {errors.correo && <p className="text-red-500 text-[10px] font-bold ml-2 uppercase">{errors.correo}</p>}
                                </div>

                                {/* Grid para Selects */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Usuario */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Asignar a Usuario</label>
                                        <select
                                            name="idUsuario"
                                            value={correoData.idUsuario || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-4 rounded-2xl bg-slate-100 border-2 border-transparent focus:border-[#1B2654] font-bold text-slate-700 outline-none appearance-none"
                                            required
                                        >
                                            <option value="" disabled>SELECCIONAR...</option>
                                            {users.map((user) => (
                                                <option key={user.IdUsuario} value={user.IdUsuario}>
                                                    {user.nombre_completo?.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Asunto */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Asunto Vinculado</label>
                                        <select
                                            name="idAsunto"
                                            value={correoData.idAsunto || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-4 rounded-2xl bg-slate-100 border-2 border-transparent focus:border-[#1B2654] font-bold text-slate-700 outline-none appearance-none"
                                            required
                                        >
                                            <option value="" disabled>SELECCIONAR...</option>
                                            {asuntos.map((asunt) => (
                                                <option key={asunt.IdAsunto} value={asunt.IdAsunto}>
                                                    {asunt.Descripcion?.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Estatus Toggle */}
                                <div className="flex justify-center bg-slate-50 py-3 rounded-2xl border-2 border-dashed border-slate-200">
                                    <label className="group flex items-center space-x-3 cursor-pointer select-none">
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Inactivo</span>
                                        <div className="relative">
                                            <input type="checkbox" name="estatus" checked={correoData.estatus === "1"} onChange={handleChange} className="sr-only peer" />
                                            <div className="w-12 h-6 bg-slate-300 rounded-full peer peer-checked:bg-green-500 transition-colors shadow-inner"></div>
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-md"></div>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Activo</span>
                                    </label>
                                </div>

                                {/* Botones */}
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
                                        {loading ? 'Procesando...' : (action === 'create' ? 'Guardar Correo' : 'Actualizar Correo')}
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

// ----------------------------------------------------------------------

// 👑 COMPONENTE PRINCIPAL: Correos
export default function Correos() {
    // Estado para Correos de Notificación
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [correos, setCorreos] = useState([]);
    const [action, setAction] = useState('create');
    const [correoData, setCorreoData] = useState(initialCorreoData);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // Estado para Configuración SMTP
    const [smtpConfig, setSmtpConfig] = useState(initialSMTPConfig);
    const [isSmtpLoading, setIsSmtpLoading] = useState(true);

    // --- Lógica de Correos de Notificación (Fetch de la tabla) ---
    const getCorreos = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(route("correos.index"));
            const result = await response.json();
            setCorreos(result.data || result);

        } catch (error) {
            console.error('Error al obtener los correos:', error);
            toast.error("No se pudieron cargar los correos de notificación.");
        } finally {
            setIsLoading(false);
        }
    }

    // --- Lógica de Configuración SMTP (Fetch del formulario) ---
    const getSmtpConfig = async () => {
        setIsSmtpLoading(true);
        try {
            const response = await fetch(route("indexconfiguracioncorreo"));
            if (!response.ok) {
                // Si fetch falla aquí, lanzamos para capturar el error general
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const result = await response.json();

            // **Mapeo de claves del backend a claves de estado**
            setSmtpConfig({
                correo: result.correo || "",
                password: result.password || "",
                host: result.host || "",
                puerto: String(result.puerto || "587"),
                seguridadSSL: result.seguridadSSL || "ssl",
            });

        } catch (error) {
            console.error('Error al obtener la configuración SMTP:', error);
            // Si no se pudo cargar, se mantiene el initialSMTPConfig
            setSmtpConfig(initialSMTPConfig);
        } finally {
            setIsSmtpLoading(false);
        }
    }


    useEffect(() => {
        getCorreos();
        getSmtpConfig();
    }, [])

    // --- Lógica de Modales ---
    const openCreateModal = () => {
        setAction('create');
        setCorreoData(initialCorreoData);
        setErrors({});
        setIsDialogOpen(true);
    };

    const openEditModal = (correo) => {
        setAction('edit');
        setCorreoData(correo);
        setErrors({});
        setIsDialogOpen(true);
    };

    const closeModal = () => {
        setIsDialogOpen(false);
        setCorreoData(initialCorreoData);
        setErrors({});
    };

    // --- Lógica de Correos de Notificación (Submit) ---
    const submit = async (data) => {

        // console.log("entro");
        // Validación
        const validationResult = validateInputs(correoValidations, data);

        if (!validationResult.isValid) {
            setErrors(validationResult.errors);
            toast.error("Por favor, corrige los errores en el formulario.");
            //   console.log("dsd");
            // Lanza un error para detener el flujo en CorreoFormDialog
            throw new Error("Validation Failed");
        }

        const isEdit = data.IdCorreoNotificaciones;


        // console.log("isedit",isEdit)
        const ruta = isEdit
            ? route("correos.update", { id: data.IdCorreoNotificaciones })
            : route("correos.store");

        const method = isEdit ? "PUT" : "POST";
        const successMessage = isEdit ? "Correo actualizado con éxito." : "Correo creado con éxito.";

        try {
            const payload = {
                IdCorreoNotificaciones: data.IdCorreoNotificaciones,

                correo: data.correo,
                idUsuario: data.idUsuario,
                estatus: data.estatus,

                idAsunto: data.idAsunto
            };




            // Usamos la función 'request'
            await request(ruta, method, payload);

            await getCorreos(); // Recarga la tabla
            toast.success(successMessage);
        } catch (error) {
            console.error("Error al guardar el correo:", error);
            toast.error(`Hubo un error al guardar el correo: ${error.message || 'Error de red.'}`);
            throw error; // Propagar para que el diálogo sepa que falló
        }
    };


    return (
        <div className="relative h-[100%] pb-4 px-3 overflow-auto blue-scroll">
            <div className="flex justify-between items-center p-3 border-b mb-4">
                <h2 className="text-3xl font-bold text-gray-800">Configuración de Correo</h2>
            </div>

            {/* Componente de Formulario de Configuración SMTP */}
            <ConfiguracionSMTPForm
                config={smtpConfig}
                isLoading={isSmtpLoading}
                reloadConfig={getSmtpConfig}
            />

            {/* <div className="flex justify-between items-center p-3 border-b mb-4">
                <h2 className="text-3xl font-bold text-gray-800">Correos Electrónicos de Notificación</h2>
                <button
                    onClick={openCreateModal}
                    className="flex items-center px-4 py-2 text-base font-semibold text-white rounded-lg shadow-md  transition duration-150 ease-in-out"
                    style={{ backgroundColor: '#A61A18' }}                >
                    + Nuevo Correo
                </button>
            </div> */}

            {/* Sección de Gestión de Correos de Notificación (Datatable) */}
            {isLoading ? (
                <div className='flex items-center justify-center h-[100%] w-full'> <LoadingDiv /> </div>

            ) : (
                <Datatable
                    data={correos}
                    virtual={true}

                    add={() => {
                        openCreateModal()
                    }}
                    columns={[
                        {
                            header: "Estatus",
                            accessor: "estatus",
                            width: '10%',
                            cell: ({ item: { estatus } }) => {
                                const isActivo = String(estatus) === "1";
                                const color = isActivo ? "bg-green-300" : "bg-red-300";

                                return (
                                    <span className={`inline-flex items-center justify-center rounded-full ${color} w-3 h-3`}
                                        title={isActivo ? "Activo" : "Inactivo"}
                                    />
                                );
                            },
                        },
                        { header: 'Correo', accessor: 'correo' },
                        { header: 'Usuario', accessor: 'usuario.Username' },
                        { header: 'Asunto', accessor: 'asunto.Descripcion' },

                        {
                            header: "Acciones", accessor: "Acciones", cell: (eprops) => (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => openEditModal(eprops.item)}
                                        className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                                    >
                                        Editar
                                    </button>
                                </div>
                            )
                        },
                    ]}
                />
            )}


            {/* Componente Modal de Headless UI */}
            <CorreoFormDialog
                isOpen={isDialogOpen}
                closeModal={closeModal}
                onSubmit={submit}
                correoToEdit={correoData}
                action={action}
                errors={errors}
                setErrors={setErrors}
            />

        </div>
    );
}