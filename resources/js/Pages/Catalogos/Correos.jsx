import React, { useEffect, useState } from "react"; import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
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

    // Lógica para cargar datos del correo a editar o inicial
    useEffect(() => {
        if (isOpen) {
            const dataToLoad = correoToEdit && correoToEdit.IdCorreoNotificaciones ? correoToEdit : initialCorreoData;
            setCorreoData({
                ...dataToLoad,
                // Asegurar que el idUsuario sea string para el select
                idUsuario: String(dataToLoad.idUsuario || ""),
                idAsunto: String(dataToLoad.idAsunto || ""),


            });
            setErrors({});
        }
    }, [isOpen, correoToEdit, setErrors]);

    // Lógica para cargar la lista de usuarios
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
            console.error('Error al obtener los usuarios:', error);
            toast.error("No se pudieron cargar los usuarios.");
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

        // Convertir idUsuario a número antes del submit final
        const dataToSend = {
            ...correoData,
            idUsuario: Number(correoData.idUsuario),
            idAsunto: Number(correoData.idAsunto)

        };

        try {
            // El padre (Correos) maneja la validación y el guardado
            await onSubmit(dataToSend);
            closeModal();
        } catch (error) {
            // El error se maneja en el padre, y no cerramos el modal si falla
        } finally {
            setLoading(false);
        }
    };


    const dialogTitle = action === 'create' ? 'Crear Nuevo Correo' : 'Editar Correo';

    return (
        <Transition show={isOpen}>
            <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl relative">
                        {loading && <LoadingDiv />}
                        <DialogTitle className="text-2xl font-bold mb-4 text-gray-900 border-b pb-2">
                            {dialogTitle}
                        </DialogTitle>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">

                            {/* Input Correo */}
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Correo Electrónico: <span className="text-red-500">*</span></span>
                                <input
                                    type="email"
                                    name="correo"
                                    value={correoData.correo || ''}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.correo ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                    placeholder="ejemplo@dominio.com"
                                    required
                                />
                                {errors.correo && <p className="text-red-500 text-xs mt-1">{errors.correo}</p>}
                            </label>

                            {/* Select Usuario */}
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Usuario: <span className="text-red-500">*</span></span>
                                <select
                                    name="idUsuario"
                                    value={correoData.idUsuario || ''}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.idUsuario ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                    required
                                >
                                    <option value="" disabled>Selecciona un Usuario</option>
                                    {users.map((user) => (
                                        <option
                                            key={user.IdUsuario}
                                            value={user.IdUsuario}
                                        >
                                            {user.nombre_completo}
                                        </option>
                                    ))}
                                </select>
                                {errors.idUsuario && <p className="text-red-500 text-xs mt-1">{errors.idUsuario}</p>}
                            </label>


                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Asunto: <span className="text-red-500">*</span></span>
                                <select
                                    name="idAsunto"
                                    value={correoData.idAsunto || ''}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.idAsunto ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                    required
                                >
                                    <option value="" disabled>Selecciona un Asunto</option>
                                    {asuntos.map((asunt) => (
                                        <option
                                            key={asunt.IdAsunto}
                                            value={asunt.IdAsunto}
                                        >
                                            {asunt.Descripcion}
                                        </option>
                                    ))}
                                </select>
                                {errors.idAsunto && <p className="text-red-500 text-xs mt-1">{errors.idAsunto}</p>}
                            </label>




                            {/* Checkbox Estatus */}
                            <div className="flex justify-center w-full mt-2">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        name="estatus"
                                        checked={correoData.estatus === "1"}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Activo</span>
                                </label>
                            </div>

                            {/* Botones */}
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
                                    {loading ? (action === 'create' ? 'Registrando...' : 'Actualizando...') : (action === 'create' ? 'Guardar Correo' : 'Actualizar Correo')}
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    )
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