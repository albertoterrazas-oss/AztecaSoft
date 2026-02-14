import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

// --- Helpers de simulación ---
const route = (name, params = null) => {
    const routeMap = {
        "users.index": "/api/users",
        "roles.index": "/api/roles",
        "personas.index": "/api/personas",
        "users.store": "/api/users",
        "users.update": `/api/users/${params}`,
    };
    return routeMap[name] || `/${name}`;
};

const validateInputs = (data, action) => {
    let formErrors = {};

    if (!data.Username?.trim()) formErrors.Username = 'El nombre de usuario es obligatorio.';

    if (action === 'create' && !data.Password?.trim()) {
        formErrors.Password = 'La contraseña es obligatoria.';
    } else if (data.Password && data.Password.length < 8) {
        formErrors.Password = 'Debe tener al menos 8 caracteres.';
    }

    if (!data.IdRol) formErrors.IdRol = 'El rol es obligatorio.';
    if (!data.IdPersona) formErrors.IdPersona = 'Seleccionar una persona es obligatorio.';

    return { isValid: Object.keys(formErrors).length === 0, errors: formErrors };
};

const initialPersonData = {
    IdUsuario: "",
    Username: "",
    Password: "",
    IdRol: "",
    IdPersona: "",
};

// --- Componente Formulario (Dialog) ---
function PersonFormDialog({ isOpen, closeModal, onSubmit, personToEdit, action, errors, setErrors }) {
    const [personData, setPersonData] = useState(initialPersonData);
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState([]);
    const [personas, setPersonas] = useState([]);

    useEffect(() => {
        if (isOpen) {
            if (personToEdit && action === 'edit') {
                setPersonData({
                    IdUsuario: personToEdit.IdUsuario || personToEdit.id,
                    Username: personToEdit.Username || "",
                    Password: "",
                    IdRol: personToEdit.IdRol || "",
                    IdPersona: personToEdit.IdPersona || "",
                });
            } else {
                setPersonData(initialPersonData);
            }
            setErrors({});
            fetchData();
        }
    }, [isOpen, personToEdit, action]);

    const fetchData = async () => {
        try {
            const [resRoles, resPersonas] = await Promise.all([
                fetch(route("roles.index")).then(res => res.json()),
                fetch(route("personas.index")).then(res => res.json())
            ]);

            // Validación crítica: Asegurar que el estado reciba un Array
            setRoles(Array.isArray(resRoles) ? resRoles : (resRoles.data || []));
            setPersonas(Array.isArray(resPersonas) ? resPersonas : (resPersonas.data || []));
        } catch (error) {
            console.error("Error cargando catálogos:", error);
            toast.error("Error al cargar catálogos");
            setRoles([]);
            setPersonas([]);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPersonData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (errors[name]) {
            setErrors(prev => {
                const newErrs = { ...prev };
                delete newErrs[name];
                return newErrs;
            });
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const { isValid, errors: valErrors } = validateInputs(personData, action);

        if (!isValid) {
            setErrors(valErrors);
            return;
        }

        setLoading(true);
        try {
            await onSubmit(personData);
            closeModal();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={isOpen}>
            <Dialog onClose={closeModal} className="relative z-50">
                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl relative">
                        {loading && <LoadingDiv />}
                        <DialogTitle className="text-2xl font-bold mb-4 text-gray-900 border-b pb-2">
                            {action === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
                        </DialogTitle>

                        <form onSubmit={handleFormSubmit} className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="block">
                                    <span className="text-sm font-medium text-gray-700">Usuario: *</span>
                                    <input
                                        type="text"
                                        name="Username"
                                        value={personData.Username}
                                        onChange={handleChange}
                                        className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.Username ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.Username && <p className="text-red-500 text-xs mt-1">{errors.Username}</p>}
                                </label>

                                <label className="block">
                                    <span className="text-sm font-medium text-gray-700">
                                        Contraseña: {action === 'create' && '*'}
                                    </span>
                                    <input
                                        type="password"
                                        name="Password"
                                        value={personData.Password}
                                        onChange={handleChange}
                                        placeholder={action === 'edit' ? "Dejar en blanco para no cambiar" : ""}
                                        className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.Password ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.Password && <p className="text-red-500 text-xs mt-1">{errors.Password}</p>}
                                </label>
                            </div>

                            <div className="space-y-3">
                                <label className="block">
                                    <span className="text-sm font-medium text-gray-700">Rol: *</span>
                                    <select
                                        name="IdRol"
                                        value={personData.IdRol}
                                        onChange={handleChange}
                                        className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.IdRol ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">Selecciona un rol</option>
                                        {roles.map(r => (
                                            <option key={r.roles_id} value={r.roles_id}>{r.roles_descripcion}</option>
                                        ))}
                                    </select>
                                    {errors.IdRol && <p className="text-red-500 text-xs mt-1">{errors.IdRol}</p>}
                                </label>

                                <label className="block">
                                    <span className="text-sm font-medium text-gray-700">Persona Asociada: *</span>
                                    <select
                                        name="IdPersona"
                                        value={personData.IdPersona}
                                        onChange={handleChange}
                                        className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.IdPersona ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">Selecciona una persona</option>
                                        {personas.map(p => (
                                            <option key={p.IdPersona} value={p.IdPersona}>{p.Nombres} {p.Apellidos}</option>
                                        ))}
                                    </select>
                                    {errors.IdPersona && <p className="text-red-500 text-xs mt-1">{errors.IdPersona}</p>}
                                </label>
                            </div>

                            <div className="col-span-2 flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md disabled:bg-blue-400">
                                    {action === 'create' ? 'Guardar' : 'Actualizar'}
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
export default function Usuarios() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [action, setAction] = useState('create');
    const [selectedUser, setSelectedUser] = useState(null);
    const [errors, setErrors] = useState({});

    const getUsers = async () => {
        try {
            const res = await fetch(route("users.index")).then(r => r.json());
            setUsers(Array.isArray(res) ? res : (res.data || []));
        } catch (error) {
            toast.error("Error al obtener usuarios");
        }
    };

    useEffect(() => { getUsers(); }, []);

    const openCreateModal = () => {
        setAction('create');
        setSelectedUser(null);
        setIsDialogOpen(true);
    };

    const openEditModal = (user) => {
        setAction('edit');
        setSelectedUser(user);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (formData) => {
        const isEdit = action === 'edit';
        const url = isEdit ? route("users.update", formData.IdUsuario) : route("users.store");
        const method = isEdit ? "PUT" : "POST";

        try {
            await request(url, method, formData);
            toast.success(isEdit ? "Usuario actualizado" : "Usuario creado");
            getUsers();
        } catch (error) {
            toast.error("Error en el servidor al procesar la solicitud");
            throw error;
        }
    };

    return (
        <div className="p-6">
            {/* <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h2>
                <button onClick={openCreateModal}
                    className="flex items-center px-4 py-2 text-base font-semibold text-white rounded-lg shadow-md  transition duration-150 ease-in-out"
                    style={{ backgroundColor: '#A61A18' }}
                >
                    + Nuevo Usuario
                </button>
            </div> */}

            <Datatable
                data={users}
                virtual={true}
                add={() => {
                    openCreateModal()
                    // setModal({ open: true, action: 'create', item: null })
                }}
                columns={[
                    { header: 'Username', accessor: 'Username' },
                    { header: 'Nombre Completo', accessor: 'nombre_completo' },
                    { header: 'Rol', accessor: 'rol.roles_descripcion' },
                    {
                        header: "Acciones",
                        cell: (props) => (
                            <button
                                onClick={() => openEditModal(props.item)}
                                className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded transition-colors"
                            >
                                Editar
                            </button>
                        )
                    },
                ]}
            />

            <PersonFormDialog
                isOpen={isDialogOpen}
                closeModal={() => setIsDialogOpen(false)}
                onSubmit={handleSubmit}
                personToEdit={selectedUser}
                action={action}
                errors={errors}
                setErrors={setErrors}
            />
        </div>
    );
}