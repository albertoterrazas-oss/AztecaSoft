// import { useEffect, useState } from "react";
// import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
// import { toast } from 'sonner';
// import Datatable from "@/Components/Datatable";
// import LoadingDiv from "@/Components/LoadingDiv";
// import ComponenteVerificacion from "./ListaVerificacionImagenes";

// import request from "@/utils";

// const route = (name, params = {}) => {
//     // Rutas dummy adaptadas para ListaVerificacion
//     const id = params.id || params; // Permite pasar el ID directamente o como objeto {id: X}
//     const routeMap = {
//         "listaverificacion.index": "/api/listaverificacion",
//         "listaverificacion.store": "/api/listaverificacion",
//         "listaverificacion.update": `/api/listaverificacion/${id}`,
//     };
//     return routeMap[name] || `/${name}`;
// };

// // Validaciones requeridas para el formulario de ListaVerificacion (CORREGIDAS)
// const listaVerificacionValidations = {
//     ListaVerificacion_nombre: true,
//     ListaVerificacion_tipo: true,
//     ListaVerificacion_observaciones: true,
//     ListaVerificacion_imgVehiculo: true
//     // ListaVerificacion_usuarioID: true, // Se omite la validación de usuario en el frontend si el valor es fijo o viene del contexto
// };

// // Función DUMMY de validación adaptada para ListaVerificacion (CORREGIDA)
// const validateInputs = (validations, data) => {
//     let formErrors = {};

//     if (validations.ListaVerificacion_nombre && !data.ListaVerificacion_nombre?.trim()) formErrors.ListaVerificacion_nombre = 'El nombre de la lista es obligatorio.';
//     if (validations.ListaVerificacion_tipo && !data.ListaVerificacion_tipo?.trim()) formErrors.ListaVerificacion_tipo = 'El tipo de lista es obligatorio.';
//     if (validations.ListaVerificacion_observaciones && !data.ListaVerificacion_observaciones?.trim()) formErrors.ListaVerificacion_observaciones = 'Las observaciones son obligatorias.';

//     return { isValid: Object.keys(formErrors).length === 0, errors: formErrors };
// };
// // FIN DUMMY FUNCTIONS
// // ======================================================================
// const userObject = JSON.parse(localStorage.getItem('user'));

// // Datos de ejemplo para el estado inicial del formulario de ListaVerificacion (CORREGIDOS)
// const initialListData = {
//     ListaVerificacion_listaID: null, // ID para identificar en edición
//     ListaVerificacion_nombre: "",
//     ListaVerificacion_tipo: "", // Ejemplo de tipo inicial
//     ListaVerificacion_observaciones: "",
//     ListaVerificacion_imgVehiculo: true,
//     ListaVerificacion_usuarioID: userObject.Personas_usuarioID, // Valor de ejemplo
//     // ListaVerificacion_fechaCreacion: new Date().toISOString().slice(0, 10), 
// };


// function ListaVerificacionFormDialog({ isOpen, closeModal, onSubmit, listToEdit, action, errors, setErrors }) {
//     // Nota: listToEdit ya debe tener los nombres de campos correctos
//     const [listData, setListData] = useState(initialListData);
//     const [loading, setLoading] = useState(false);

//     // Sincroniza los datos al abrir el modal o cambiar la lista a editar
//     useEffect(() => {
//         if (isOpen) {
//             const dataToLoad = listToEdit && listToEdit.ListaVerificacion_listaID
//                 ? {
//                     ...listToEdit,
//                     ListaVerificacion_nombre: listToEdit.ListaVerificacion_nombre || "",
//                     ListaVerificacion_tipo: listToEdit.ListaVerificacion_tipo || "Inspección",
//                     ListaVerificacion_observaciones: listToEdit.ListaVerificacion_observaciones || "",
//                     ListaVerificacion_usuarioID: listToEdit.ListaVerificacion_usuarioID || 1,
//                     ListaVerificacion_imgVehiculo: listToEdit.ListaVerificacion_imgVehiculo
//                 }
//                 : initialListData;
//             setListData(dataToLoad);
//             setErrors({}); // Limpia errores al abrir
//         }
//     }, [isOpen, listToEdit]);




//     const handleChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         let finalValue = value;

//         if (name === 'menu_idPadre') {
//             // El valor '0' del select se usa para representar 'Raiz' (null) en la data.
//             finalValue = value === "" || value === '0' ? null : Number(value);
//         } else if (type === 'checkbox') {
//             finalValue = checked ? "1" : "0";
//         }

//         setListData(prevData => ({
//             ...prevData,
//             [name]: finalValue
//         }));

//         if (errors[name]) {
//             setErrors(prevErrors => {
//                 const newErrors = { ...prevErrors };
//                 delete newErrors[name];
//                 return newErrors;
//             });
//         }
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         setLoading(true);
//         try {
//             // Llama a la función onSubmit del padre, pasándole los datos del formulario
//             await onSubmit(listData);
//             // Si la función onSubmit tiene éxito (no lanza error), cierra el modal.
//             closeModal();
//         } catch (error) {
//             // El error es propagado desde el padre, si falla, el modal no se cierra.
//             // La lógica de `toast.error` ya se maneja en el componente padre.
//             console.error("Error en el submit del formulario:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const dialogTitle = action === 'create' ? 'Crear Nueva Lista de Verificación' : 'Editar Lista de Verificación';

//     return (
//         <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
//             {/* Overlay de fondo */}
//             <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

//             {/* Contenedor del Modal */}
//             <div className="fixed inset-0 flex items-center justify-center p-4">
//                 <DialogPanel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl relative">

//                     {/* Indicador de carga */}
//                     {loading && <LoadingDiv />}

//                     <DialogTitle className="text-2xl font-bold mb-4 text-gray-900 border-b pb-2">
//                         {dialogTitle}
//                     </DialogTitle>

//                     <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
//                         <div className="space-y-3">
//                             {/* Input Nombre (CORREGIDO NAME) */}
//                             <label className="block">
//                                 <span className="text-sm font-medium text-gray-700">Nombre de la Lista: <span className="text-red-500">*</span></span>
//                                 <input
//                                     type="text"
//                                     name="ListaVerificacion_nombre" // ¡CORREGIDO!
//                                     value={listData.ListaVerificacion_nombre}
//                                     onChange={handleChange}
//                                     className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.ListaVerificacion_nombre ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
//                                 />
//                                 {errors.ListaVerificacion_nombre && <p className="text-red-500 text-xs mt-1">{errors.ListaVerificacion_nombre}</p>}
//                             </label>


//                             {/* <label className="block">
//                                 <span className="text-sm font-medium text-gray-700">Tipo: <span className="text-red-500">*</span></span>
//                                 <input
//                                     type="text"
//                                     name="ListaVerificacion_tipo" // ¡CORREGIDO!
//                                     value={listData.ListaVerificacion_tipo}
//                                     onChange={handleChange}
//                                     className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.ListaVerificacion_tipo ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
//                                 />
//                                 {errors.ListaVerificacion_tipo && <p className="text-red-500 text-xs mt-1">{errors.ListaVerificacion_tipo}</p>}
//                             </label> */}


//                             {/* Obligatorio */}


//                             {/* <label className="block">
//                                 <span className="text-sm font-medium text-gray-700">Tipo: <span className="text-red-500">*</span></span>
//                                 <select
//                                     name="ListaVerificacion_tipo"
//                                     value={listData.ListaVerificacion_tipo || ''}
//                                     onChange={handleChange}
//                                     className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.ListaVerificacion_tipo ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
//                                 >
//                                     <option value="" disabled>Selecciona un departamento</option>
//                                     {departments.map((dept) => (
//                                         <option
//                                             key={dept.Departamentos_id}
//                                             value={dept.Departamentos_id}
//                                         >
//                                             {dept.Departamentos_nombre}
//                                         </option>
//                                     ))}
//                                 </select>
//                                 {errors.ListaVerificacion_tipo && <p className="text-red-500 text-xs mt-1">{errors.ListaVerificacion_tipo}</p>}
//                             </label> */}

//                             <label className="block">
//                                 <span className="text-sm font-medium text-gray-700">Tipo: <span className="text-red-500">*</span></span>
//                                 <select
//                                     name="ListaVerificacion_tipo"
//                                     value={listData.ListaVerificacion_tipo || ''}
//                                     onChange={handleChange}
//                                     className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.ListaVerificacion_tipo ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
//                                 >
//                                     <option value="" disabled>Selecciona un tipo</option>

//                                     {/* Array estático para las opciones: Obligatorio y Recomendado */}
//                                     {/* Nota: He usado las claves "id" y "nombre" para que el mapeo sea similar al anterior. */}
//                                     {/* El valor del "value" debería coincidir con lo que esperas guardar en listData.ListaVerificacion_tipo */}
//                                     {[
//                                         { id: 'Obligatorio', nombre: 'Obligatorio' },
//                                         { id: 'Recomendado', nombre: 'Recomendado' }
//                                     ].map((tipo) => (
//                                         <option
//                                             key={tipo.id}
//                                             value={tipo.id} // Aquí guarda 'Obligatorio' o 'Recomendado'
//                                         >
//                                             {tipo.nombre}
//                                         </option>
//                                     ))}

//                                 </select>
//                                 {errors.ListaVerificacion_tipo && <p className="text-red-500 text-xs mt-1">{errors.ListaVerificacion_tipo}</p>}
//                             </label>

//                             {/* Textarea Observaciones (CORREGIDO NAME) */}
//                             <label className="block">
//                                 <span className="text-sm font-medium text-gray-700">Observaciones: <span className="text-red-500">*</span></span>
//                                 <textarea
//                                     name="ListaVerificacion_observaciones" // ¡CORREGIDO!
//                                     value={listData.ListaVerificacion_observaciones}
//                                     onChange={handleChange}
//                                     rows="3"
//                                     className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.ListaVerificacion_observaciones ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
//                                 />
//                                 {errors.ListaVerificacion_observaciones && <p className="text-red-500 text-xs mt-1">{errors.ListaVerificacion_observaciones}</p>}
//                             </label>


//                             <div className="flex justify-center w-full pt-2">
//                                 <label className="flex items-center space-x-2">
//                                     <input
//                                         type="checkbox"
//                                         name="ListaVerificacion_imgVehiculo"
//                                         checked={listData.ListaVerificacion_imgVehiculo == "1"}
//                                         onChange={handleChange}
//                                         className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                                     />
//                                     <span className="text-sm font-medium text-gray-700">Imagen (Estatus)</span>
//                                 </label>
//                             </div>

//                             {/* :listToEdit.ListaVerificacion_imgVehiculo */}


//                         </div>

//                         {/* Botones */}
//                         <div className="flex justify-end gap-3 pt-4 border-t mt-4">
//                             <button
//                                 type="button"
//                                 onClick={closeModal}
//                                 disabled={loading}
//                                 className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
//                             >
//                                 Cancelar
//                             </button>
//                             <button
//                                 type="submit"
//                                 disabled={loading}
//                                 className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
//                             >
//                                 {loading ? (action === 'create' ? 'Registrando...' : 'Actualizando...') : (action === 'create' ? 'Guardar Lista' : 'Actualizar Lista')}
//                             </button>
//                         </div>
//                     </form>
//                 </DialogPanel>
//             </div>
//         </Dialog>
//     )
// }


// export default function ListaVerificacion() {
//     const [isDialogOpen, setIsDialogOpen] = useState(false);
//     const [listas, setListas] = useState([]); // Listado de listas de verificación
//     const [action, setAction] = useState('create');
//     const [listToEdit, setListToEdit] = useState(null); // Usamos null para edición
//     const [errors, setErrors] = useState({});
//     const [isLoading, setIsLoading] = useState(true);

//     // Función para abrir modal en modo creación
//     const openCreateModal = () => {
//         setAction('create');
//         setListToEdit(null); // Asegura que se usa initialListData en el FormDialog
//         setErrors({});
//         setIsDialogOpen(true);
//     };

//     // Función para abrir modal en modo edición
//     const openEditModal = (list) => {
//         setAction('edit');
//         setListToEdit(list); // Cargar datos de la lista para edición
//         setErrors({});
//         setIsDialogOpen(true);
//     };

//     // Limpia el formulario y cierra el modal
//     const closeModal = () => {
//         setIsDialogOpen(false);
//         setListToEdit(null); // Resetear datos
//         setErrors({});
//     };

//     /**
//      * Función que maneja la validación y la petición POST/PUT real.
//      */
//     const submit = async (data) => {
//         setErrors({});
//         setIsLoading(true);

//         // 1. VALIDACIÓN (Usando los nombres de campos corregidos)
//         const validationResult = validateInputs(listaVerificacionValidations, data);

//         if (!validationResult.isValid) {
//             setErrors(validationResult.errors);
//             toast.error("Por favor, corrige los errores en el formulario.");
//             // Lanza un error para que el FormDialog sepa que falló
//             throw new Error("Validation Failed");
//         }

//         // 2. RUTAS Y MÉTODO: Usa ListaVerificacion_listaID para la actualización
//         const isEdit = data.ListaVerificacion_listaID;
//         // La ID que se pasa a route debe ser la de la Lista
//         const ruta = isEdit
//             ? route("listaverificacion.update", { id: data.ListaVerificacion_listaID }) // Enviamos el ID correctamente
//             : route("listaverificacion.store");

//         const method = isEdit ? "PUT" : "POST";
//         const successMessage = isEdit ? "Lista de verificación actualizada con éxito." : "Lista de verificación creada con éxito.";

//         // 3. PETICIÓN (Request)
//         try {
//             // Nota: Se asume que la función `request` está configurada para enviar `data` correctamente.
//             await request(ruta, method, data);

//             // 4. POST-ÉXITO
//             await getListas(); // Obtener lista actualizada
//             toast.success(successMessage);
//             setIsLoading(false);

//         } catch (error) {
//             console.error("Error al guardar la lista de verificación:", error);

//             // Intentamos parsear errores del servidor si es posible
//             if (error.response && error.response.data && error.response.data.errors) {
//                 // Asume que Laravel devuelve errores con los nombres de campo (ListaVerificacion_nombre, etc.)
//                 setErrors(error.response.data.errors);
//                 setIsLoading(false);

//                 toast.error("Hubo errores de validación en el servidor.");
//             } else {
//                 toast.error("Hubo un error al guardar la lista de verificación.");
//             }
//             throw error; // Propagar el error al FormDialog para evitar que cierre el modal
//         }
//     };

//     const getListas = async () => {
//         // 1. Inicia el estado de carga
//         setIsLoading(true);

//         try {
//             const response = await fetch(route("listaverificacion.index"));

//             // 2. Verifica la respuesta HTTP antes de procesarla
//             if (!response.ok) {
//                 // Lanza un error si el estado HTTP no es 2xx
//                 throw new Error(`Error ${response.status}: Fallo al cargar listas de verificación`);
//             }

//             const data = await response.json();

//             // 3. Actualiza el estado con los datos
//             setListas(data);

//         } catch (error) {
//             // 4. Maneja el error
//             console.error('Error al obtener las listas de verificación:', error);
//             // Muestra una notificación al usuario
//             toast.error('No se pudieron cargar las listas de verificación.');

//         } finally {
//             // 5. El bloque 'finally' se ejecuta SIEMPRE (éxito o error)
//             // Esto garantiza que el estado de carga se desactive
//             setIsLoading(false);
//         }
//     }

//     useEffect(() => {
//         getListas() // Llamar a getListas al montar
//     }, [])

//     return (
//         <div className="relative h-[100%] pb-4 px-3 overflow-auto blue-scroll">

//             <div className="flex justify-between items-center p-3 border-b mb-4">
//                 <h2 className="text-3xl font-bold text-gray-800">Gestión de Listas de Verificación</h2>
//                 <button
//                     onClick={openCreateModal}
//                     className="flex items-center px-4 py-2 text-base font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition duration-150 ease-in-out"
//                 >
//                     + Nueva Lista
//                 </button>
//             </div>
//             {isLoading ? (
//                 <div className='flex items-center justify-center h-[100%] w-full'> <LoadingDiv /> </div>

//             ) : (
//                 <Datatable
//                     data={listas}
//                     virtual={true}
//                     columns={[
//                         { header: 'Nombre', accessor: 'ListaVerificacion_nombre' },
//                         { header: 'Tipo', accessor: 'ListaVerificacion_tipo' },
//                         { header: 'Observaciones', accessor: 'ListaVerificacion_observaciones' },
//                         { header: 'Usuario', accessor: 'usuario.Personas_nombres' },
//                         {
//                             header: "Acciones", accessor: "Acciones", cell: (eprops) => (<>
//                                 <button
//                                     onClick={() => openEditModal(eprops.item)}
//                                     className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition"
//                                 >
//                                     Editar
//                                 </button>
//                             </>)
//                         },
//                     ]}
//                 />
//             )}
//             {/* Componente Modal de Headless UI */}
//             <ListaVerificacionFormDialog
//                 isOpen={isDialogOpen}
//                 closeModal={closeModal}
//                 onSubmit={submit}
//                 listToEdit={listToEdit}
//                 action={action}
//                 errors={errors}
//                 setErrors={setErrors}
//             />

//             {/* <ComponenteVerificacion /> */}



//         </div>
//     );
// }