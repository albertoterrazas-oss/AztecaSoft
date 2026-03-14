import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";
import { Building2, Fingerprint, Save, UserPlus, Pencil, Building } from "lucide-react";

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
            setRoles(Array.isArray(resRoles) ? resRoles : (resRoles.data || []));
            setPersonas(Array.isArray(resPersonas) ? resPersonas : (resPersonas.data || []));
        } catch (error) {
            console.error("Error cargando catálogos:", error);
            toast.error("Error al cargar catálogos");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Aplicamos el uppercase si es el campo de Username
        const finalValue = name === "Username" ? value.toUpperCase() : value;

        setPersonData(prev => ({ ...prev, [name]: finalValue }));

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
            <Dialog onClose={closeModal} className="relative z-[100]">
                {/* Backdrop con Blur */}
                <TransitionChild enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-2xl bg-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden border-b-[12px] border-[#1B2654]">
                        {loading && <div className="absolute inset-0 z-50 bg-white/60 flex items-center justify-center"><LoadingDiv /></div>}

                        {/* Cabecera Estilo Rhino */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-[#1B2654] mb-4 shadow-inner">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                </svg>
                            </div>
                            <DialogTitle className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                                {action === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
                            </DialogTitle>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Control de Acceso al Sistema</p>
                        </div>

                        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Username */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nombre de Usuario *</label>
                                <input
                                    type="text"
                                    name="Username"
                                    value={personData.Username}
                                    onChange={handleChange}
                                    className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none uppercase ${errors.Username ? 'border-red-500' : 'border-transparent focus:border-[#1B2654] focus:bg-white'}`}
                                    placeholder="EJ: ADMIN_RHINO"
                                    required
                                />
                                {errors.Username && <p className="text-red-500 text-[10px] font-bold ml-2 uppercase">{errors.Username}</p>}
                            </div>

                            {/* Password */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                                    Contraseña {action === 'create' ? '*' : '(Opcional)'}
                                </label>
                                <input
                                    type="password"
                                    name="Password"
                                    value={personData.Password}
                                    onChange={handleChange}
                                    className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none ${errors.Password ? 'border-red-500' : 'border-transparent focus:border-[#1B2654] focus:bg-white'}`}
                                    placeholder={action === 'edit' ? "••••••••" : "Contraseña de acceso"}
                                />
                                {errors.Password && <p className="text-red-500 text-[10px] font-bold ml-2 uppercase">{errors.Password}</p>}
                            </div>

                            {/* Rol */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Rol Asignado *</label>
                                <select
                                    name="IdRol"
                                    value={personData.IdRol}
                                    onChange={handleChange}
                                    className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none appearance-none ${errors.IdRol ? 'border-red-500' : 'border-transparent focus:border-[#1B2654] focus:bg-white'}`}
                                    required
                                >
                                    <option value="">SELECCIONE ROL</option>
                                    {roles.map(r => (
                                        <option key={r.roles_id} value={r.roles_id}>{r.roles_descripcion.toUpperCase()}</option>
                                    ))}
                                </select>
                                {errors.IdRol && <p className="text-red-500 text-[10px] font-bold ml-2 uppercase">{errors.IdRol}</p>}
                            </div>

                            {/* Persona */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Asociar a Persona *</label>
                                <select
                                    name="IdPersona"
                                    value={personData.IdPersona}
                                    onChange={handleChange}
                                    className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none appearance-none ${errors.IdPersona ? 'border-red-500' : 'border-transparent focus:border-[#1B2654] focus:bg-white'}`}
                                    required
                                >
                                    <option value="">SELECCIONE NOMBRE</option>
                                    {personas.map(p => (
                                        <option key={p.IdPersona} value={p.IdPersona}>{`${p.Nombres} ${p.Apellidos}`.toUpperCase()}</option>
                                    ))}
                                </select>
                                {errors.IdPersona && <p className="text-red-500 text-[10px] font-bold ml-2 uppercase">{errors.IdPersona}</p>}
                            </div>

                            {/* Botones */}
                            <div className="md:col-span-2 flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-4 text-slate-400 font-black text-xs uppercase hover:text-slate-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] py-4 bg-[#1B2654] text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-[#A61A18] transition-all disabled:opacity-50"
                                >
                                    {action === 'create' ? 'Registrar Usuario' : 'Actualizar Cambios'}
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
    const [isLoading, setIsLoading] = useState(true);

    const getUsers = async () => {
        setIsLoading(true);

        try {
            const res = await fetch(route("users.index")).then(r => r.json());
            setUsers(Array.isArray(res) ? res : (res.data || []));
        } catch (error) {
            toast.error("Error al obtener usuarios");
        } finally {
            setIsLoading(false);
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
        <div className="relative h-[100%] pb-4 px-3 overflow-auto blue-scroll">
            {isLoading ? (
                <div className='flex items-center justify-center h-[100%] w-full'> <LoadingDiv /> </div>

            ) : (
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
                        // {
                        //     header: "Acciones",
                        //     cell: (props) => (
                        //         <button
                        //             onClick={() => openEditModal(props.item)}
                        //             className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded transition-colors"
                        //         >
                        //             Editar
                        //         </button>
                        //     )
                        // },

                        // {
                        //     header: "Acciones",
                        //     cell: (props) => (
                        //         <button
                        //             onClick={() => openEditModal(props.item)}
                        //             className="p-3 bg-slate-50 text-[#1B2654] rounded-xl hover:bg-[#1B2654] hover:text-white transition-all border border-slate-100"
                        //         >
                        //             <Pencil size={16} />
                        //         </button>
                        //     )
                        // },

                        // import { Building2, Fingerprint, Save, UserPlus, Pencil, Building } from "lucide-react";

                        {
                            header: "Acciones",
                            cell: (props) => (
                                <button
                                    onClick={() => openEditModal(props.item)}
                                    className="p-3 bg-slate-50 text-[#1B2654] rounded-xl hover:bg-[#1B2654] hover:text-white transition-all border border-slate-100"
                                >
                                    <Pencil size={16} />
                                </button>
                            )
                        },
                    ]}
                />

            )}
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