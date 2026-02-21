
import AsignMenusDialog from "./Roles/AsignMenusDialog";
import request from "@/utils";

import "../../../../resources/sass/TablesComponent/_tablesStyle.scss";

import LoadingDiv from "@/components/LoadingDiv";
import Datatable from "@/components/Datatable";
import { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
import { Width } from "devextreme-react/chart";

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
    // Cambiado de unitData a roleData
    const [roleData, setRoleData] = useState(initialRoleData);
    const [loading, setLoading] = useState(false);

    // Sincroniza los datos al abrir el modal o cambiar el rol a editar
    useEffect(() => {
        if (isOpen) {
            const dataToLoad = action === 'edit' && roleToEdit
                ? {
                    ...roleToEdit,
                    roles_descripcion: roleToEdit.roles_descripcion || "",
                }
                : initialRoleData;
            setRoleData(dataToLoad);
            setErrors({}); // Limpia errores al abrir
        }
    }, [isOpen, roleToEdit, action, setErrors]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRoleData(prevData => ({
            ...prevData,
            [name]: value
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

    const dialogTitle = action === 'create' ? 'Crear Nuevo Rol' : 'Editar Rol';

    return (
        <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
            {/* Overlay de fondo */}
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            {/* Contenedor del Modal */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl relative">

                    {/* Indicador de carga */}
                    {loading && <LoadingDiv />}

                    <DialogTitle className="text-2xl font-bold mb-4 text-gray-900 border-b pb-2">
                        {dialogTitle}
                    </DialogTitle>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Descripción del rol: <span className="text-red-500">*</span></span>
                            <input
                                type="text"
                                name="roles_descripcion"
                                value={roleData.roles_descripcion}
                                onChange={handleChange}
                                className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.roles_descripcion ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                            />
                            {errors.roles_descripcion && <p className="text-red-500 text-xs mt-1">{errors.roles_descripcion}</p>}
                        </label>

                        {/* Botones */}
                        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
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
                                {loading ? (action === 'create' ? 'Registrando...' : 'Actualizando...') : (action === 'create' ? 'Guardar Rol' : 'Actualizar Rol')}
                            </button>
                        </div>
                    </form>
                </DialogPanel>
            </div>
        </Dialog>
    )
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
                            { header: "Nombre", Width: '80%', accessor: "roles_descripcion", type: 'text' },
                            {
                                header: "Acciones",
                                accessor: "Acciones",
                                Width: '80%',
                                cell: (eprops) => (
                                    <div className="flex space-x-2"> {/* Contenedor div con espacio entre elementos */}
                                        <button
                                            onClick={() => {
                                                openEditModal(eprops.item);
                                            }}
                                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md"
                                        >
                                            Editar Rol
                                        </button>
                                        <button
                                            onClick={() => {
                                                setAssignMenu(true);
                                                setDataForAssign({ ...eprops.item });
                                            }}
                                            className="px-3 py-1 text-sm font-medium text-purple-600 bg-purple-100 rounded-md"
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