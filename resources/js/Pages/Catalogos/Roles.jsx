
import AsignMenusDialog from "./Roles/AsignMenusDialog";
import request from "@/utils";

import "../../../../resources/sass/TablesComponent/_tablesStyle.scss";

import LoadingDiv from "@/components/LoadingDiv";
import Datatable from "@/components/Datatable";
import { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";
// import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
import { Width } from "devextreme-react/chart";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Building2, Fingerprint, Save, UserPlus, Pencil, Building } from "lucide-react";

const rolesValidation = { roles_descripcion: ['required', 'max:150'] }
// Datos de ejemplo para el estado inicial del formulario de Roles
const initialRoleData = { roles_descripcion: "" };

const route = (name, params = {}) => {
    // Rutas dummy adaptadas para Roles
    const routeMap = {
        "roles.index": "/api/roles",
        "roles.store": "/api/roles",
        "roles.update": `/api/roles/${params.id}`, // Asume que el ID se pasa en params.id
    };
    return routeMap[name] || `/${name}`;
};

// Función DUMMY de validación
const validateInputs = (validations, data) => {
    let formErrors = {};
    // Validación de prueba básica:
    if (validations.roles_descripcion && !data.roles_descripcion?.trim()) {
        formErrors.roles_descripcion = 'La descripción del rol es obligatoria.';
    } else if (data.roles_descripcion?.length > 150) {
        formErrors.roles_descripcion = 'La descripción no puede exceder los 150 caracteres.';
    }

    return { isValid: Object.keys(formErrors).length === 0, errors: formErrors };
};
// --- FIN CONSTANTES Y DUMMY FUNCTIONS ---


// Componente del Formulario de Rol (Modal de Headless UI)
// Cambiado de UnitFormDialog a RoleFormDialog
function RoleFormDialog({ isOpen, closeModal, onSubmit, roleToEdit, action, errors, setErrors }) {
    const [roleData, setRoleData] = useState(initialRoleData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const dataToLoad = action === 'edit' && roleToEdit
                ? {
                    ...roleToEdit,
                    roles_descripcion: roleToEdit.roles_descripcion || "",
                }
                : initialRoleData;
            setRoleData(dataToLoad);
            setErrors({});
        }
    }, [isOpen, roleToEdit, action, setErrors]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRoleData(prevData => ({
            ...prevData,
            [name]: value.toUpperCase() // Forzamos mayúsculas para mantener el look industrial
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = validateInputs(rolesValidation, roleData);
        if (!result.isValid) {
            setErrors(result.errors);
            return;
        }

        setLoading(true);
        try {
            await onSubmit(roleData);
            closeModal();
        } catch (error) {
            console.error("Error al enviar el formulario:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={isOpen}>
            <Dialog onClose={closeModal} className="relative z-[100]">
                {/* Fondo con Blur */}
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

                            {/* Overlay de carga */}
                            {loading && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                                    <LoadingDiv />
                                </div>
                            )}

                            {/* Encabezado Estilo Rhino */}
                            <div className="flex flex-col items-center mb-8">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-[#1B2654] mb-4 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                                    </svg>
                                </div>
                                <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter text-center">
                                    {action === 'create' ? 'Nuevo Rol de Usuario' : 'Editar Permisos de Rol'}
                                </DialogTitle>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 text-center">Gestión de Privilegios</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Campo Descripción */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Descripción del Rol *</label>
                                    <input
                                        type="text"
                                        name="roles_descripcion"
                                        value={roleData.roles_descripcion}
                                        onChange={handleChange}
                                        placeholder="EJ: ADMINISTRADOR GENERAL"
                                        className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none uppercase ${errors.roles_descripcion ? 'border-red-500' : 'border-transparent focus:border-[#1B2654] focus:bg-white'
                                            }`}
                                    />
                                    {errors.roles_descripcion && (
                                        <p className="text-red-500 text-[10px] font-bold ml-2 uppercase mt-1">{errors.roles_descripcion}</p>
                                    )}
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
                                        {loading ? 'Procesando...' : (action === 'create' ? 'Guardar Rol' : 'Actualizar Rol')}
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

export default function Roles() {
    const [roles, setRoles] = useState([]);
    const [assignMenu, setAssignMenu] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false); // Controla el modal del formulario
    const [action, setAction] = useState("create"); // 'create' o 'edit'
    const [selectedRole, setSelectedRole] = useState(initialRoleData); // Rol seleccionado para editar

    // Estado del rol para el Datatable y AsignMenusDialog (usa useForm de Inertia/React)
    const { data: dataForAssign, setData: setDataForAssign } = useForm(initialRoleData);


    const fetchdata = async () => {
        setLoading(true);
        try {
            const response = await fetch(route("roles.index"));
            const data = await response.json();
            setRoles(data);
        } catch (error) {
            console.error("Error fetching roles:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchdata();
    }, []);

    const handleSubmitRole = async (roleData) => {
        const ruta = action === "create"
            ? route("roles.store")
            : route("roles.update", { id: roleData.roles_id }); // Asume que el ID se llama roles_ID
        const method = action === "create" ? "POST" : "PUT";

        try {
            // Se asume que request() maneja la respuesta y errores de la API
            const response = await request(ruta, method, roleData);
            // console.log("Respuesta de la API:", response);
            fetchdata(); // Refresca los datos de la tabla
        } catch (error) {
            console.error("Error al guardar/actualizar rol:", error);
            // Manejo de errores de la API
            throw error; // Propagar para evitar que el modal se cierre
        }
    };

    const openCreateModal = () => {
        setAction('create');
        setSelectedRole(initialRoleData); // Limpiar datos
        setErrors({});
        setIsDialogOpen(true);
    };

    const openEditModal = (role) => {
        setAction('edit');
        setSelectedRole(role); // Cargar datos del rol
        setErrors({});
        setIsDialogOpen(true);
    };

    const closeModal = () => {
        setIsDialogOpen(false);
        setSelectedRole(initialRoleData);
        setErrors({});
    };

    return (
        <div className="relative h-[100%] pb-4 px-3 overflow-auto blue-scroll">
            {loading && <div className='flex items-center justify-center h-[100%] w-full'> <LoadingDiv /> </div>}


            <RoleFormDialog
                isOpen={isDialogOpen}
                closeModal={closeModal}
                onSubmit={handleSubmitRole}
                roleToEdit={selectedRole}
                action={action}
                errors={errors}
                setErrors={setErrors}
            />

            {roles && !loading && (
                <div >

                    <Datatable
                        add={openCreateModal} // Usamos la nueva función para agregar
                        virtual={true}
                        data={roles}
                        columns={[
                            { header: "Nombre",  accessor: "roles_descripcion", type: 'text' },
                            // {
                            //     header: "Acciones",
                            //     accessor: "Acciones",
                            //     Width: '20%',
                            //     cell: (eprops) => (
                            //         <div className="flex space-x-2"> {/* Contenedor div con espacio entre elementos */}
                            //             <button
                            //                 onClick={() => {
                            //                     openEditModal(eprops.item);
                            //                 }}
                            //                 className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md"
                            //             >
                            //                 Editar Rol
                            //             </button>
                            //             <button
                            //                 onClick={() => {
                            //                     setAssignMenu(true);
                            //                     setDataForAssign({ ...eprops.item });
                            //                 }}
                            //                 className="px-3 py-1 text-sm font-medium text-purple-600 bg-purple-100 rounded-md"
                            //             >
                            //                 Asignar Menú
                            //             </button>
                            //         </div>
                            //     )
                            // }
                            {
                                header: "Acciones",
                                accessor: "Acciones",
                                // Width: '20%',
                                cell: (eprops) => (
                                    <div className="flex space-x-2">
                                        {/* Botón Editar */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                openEditModal(eprops.item);
                                            }}
                                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                                        >
                                            Editar Rol
                                        </button>

                                        {/* Botón Asignar Menú */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setAssignMenu(true);
                                                setDataForAssign({ ...eprops.item });
                                            }}
                                            className="px-3 py-1 text-sm font-medium text-purple-600 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors"
                                        >
                                            Asignar Menú
                                        </button>
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>

            )}

            <AsignMenusDialog
                assignMenu={assignMenu}
                assignMenuHandler={setAssignMenu}
                rol={dataForAssign}
            ></AsignMenusDialog>

        </div>
    );
}