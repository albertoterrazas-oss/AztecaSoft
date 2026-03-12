
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
// Importamos Sonner
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import { useEffect, useState } from "react";
import request from "@/utils";

// DUMMY FUNCTIONS (Reemplazar con tus implementaciones reales)
const route = (name, params = {}) => {
    // Rutas dummy adaptadas para Unidades
    const routeMap = {
        "UnidadesQuiencQuien": "/api/UnidadesQuiencQuien",
        "unidades.store": "/api/unidades",
        "unidades.update": `/api/unidades/${params}`,
    };
    return routeMap[name] || `/${name}`;
};

// Función DUMMY de validación adaptada para Unidades
const validateInputs = (validations, data) => {
    let formErrors = {};
    // Validación de prueba básica:
    if (validations.Unidades_numeroEconomico && !data.Unidades_numeroEconomico?.trim()) formErrors.Unidades_numeroEconomico = 'El número económico es obligatorio.';
    if (validations.Unidades_numeroSerie && !data.Unidades_numeroSerie?.trim()) formErrors.Unidades_numeroSerie = 'El número de serie es obligatorio.';
    if (validations.Unidades_modelo && !data.Unidades_modelo?.trim()) formErrors.Unidades_modelo = 'El modelo es obligatorio.';

    // Validación de año (simple)
    if (validations.Unidades_ano && data.Unidades_ano && (isNaN(parseInt(data.Unidades_ano)) || data.Unidades_ano.length !== 4)) {
        formErrors.Unidades_ano = 'El año debe ser un número de 4 dígitos.';
    }

    return { isValid: Object.keys(formErrors).length === 0, errors: formErrors };
};
// FIN DUMMY FUNCTIONS

// Validaciones requeridas para el formulario de Unidad
const unitValidations = {
    Unidades_numeroEconomico: true,
    Unidades_numeroSerie: true,
    Unidades_modelo: true,
    Unidades_ano: true, // Se valida en validateInputs
    // El resto son opcionales por ahora
};

const userObject = JSON.parse(localStorage.getItem('user'));
// const personasUsuarioID = userObject.Personas_usuarioID; // Esta era la línea que faltaba si querías una variable intermedia
// Datos de ejemplo para el estado inicial del formulario de Unidad
const initialUnitData = {
    Unidades_ID: null,
    Unidades_numeroEconomico: "",
    Unidades_numeroSerie: "",
    Unidades_modelo: "",
    Unidades_ano: "",
    Unidades_placa: "",
    Unidades_kilometraje: 0,
    Unidades_mantenimiento: 0,
    Unidades_estatus: "1",
    Unidades_capGasolina: "",
    // Aquí se asigna el valor:
    Unidades_usuarioID: userObject.Personas_usuarioID
};
// Componente del Formulario de Unidad (Modal de Headless UI)
function UnitFormDialog({ isOpen, closeModal, onSubmit, unitToEdit, action, errors, setErrors }) {
    // Cambiado de personData a unitData
    const [unitData, setUnitData] = useState(initialUnitData);
    const [loading, setLoading] = useState(false);

    // Sincroniza los datos al abrir el modal o cambiar la unidad a editar
    useEffect(() => {
        if (isOpen) {
            const dataToLoad = unitToEdit
                ? {
                    ...unitToEdit,
                    // Aseguramos valores por defecto para campos que pueden ser null
                    Unidades_kilometraje: unitToEdit.Unidades_kilometraje || 0,
                    Unidades_mantenimiento: unitToEdit.Unidades_mantenimiento,
                    Unidades_ano: unitToEdit.Unidades_ano ? String(unitToEdit.Unidades_ano) : "",
                }
                : initialUnitData;
            setUnitData(dataToLoad);
            setErrors({}); // Limpia errores al abrir
        }
    }, [isOpen, unitToEdit]);



    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? (checked ? "1" : "0") : value;

        setUnitData(prevData => ({
            ...prevData,
            [name]: finalValue
        }));

    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        try {
            // Llama a la función onSubmit del padre, pasándole los datos del formulario
            await onSubmit(unitData);
            // Si la función onSubmit tiene éxito (no lanza error), cierra el modal.
            closeModal();
        } catch (error) {
            console.error("Error al enviar el formulario:", error);
        } finally {
            setLoading(false);
        }
    };

    const dialogTitle = action === 'create' ? 'Crear Nueva Unidad' : 'Editar Unidad';

    // return (
    //     <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
    //         {/* Overlay de fondo */}
    //         <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

    //         {/* Contenedor del Modal */}
    //         <div className="fixed inset-0 flex items-center justify-center p-4">
    //             <DialogPanel className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl relative">

    //                 {/* Indicador de carga */}
    //                 {loading && <LoadingDiv />}

    //                 <DialogTitle className="text-2xl font-bold mb-4 text-gray-900 border-b pb-2">
    //                     {dialogTitle}
    //                 </DialogTitle>

    //                 <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">

    //                     {/* Agrupación de campos principales (ya en una sola columna) */}
    //                     <div className="space-y-2">
    //                         {/* Input Número Económico */}
    //                         <label className="block">
    //                             <span className="text-sm font-medium text-gray-700">No. Económico: <span className="text-red-500">*</span></span>
    //                             <input
    //                                 type="text"
    //                                 name="Unidades_numeroEconomico"
    //                                 value={unitData.Unidades_numeroEconomico}
    //                                 onChange={handleChange}
    //                                 className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.Unidades_numeroEconomico ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
    //                             />
    //                             {errors.Unidades_numeroEconomico && <p className="text-red-500 text-xs mt-1">{errors.Unidades_numeroEconomico}</p>}
    //                         </label>
    //                         {/* Input Número de Serie */}
    //                         <label className="block">
    //                             <span className="text-sm font-medium text-gray-700">No. de Serie: <span className="text-red-500">*</span></span>
    //                             <input
    //                                 type="text"
    //                                 name="Unidades_numeroSerie"
    //                                 value={unitData.Unidades_numeroSerie}
    //                                 onChange={handleChange}
    //                                 className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.Unidades_numeroSerie ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
    //                             />
    //                             {errors.Unidades_numeroSerie && <p className="text-red-500 text-xs mt-1">{errors.Unidades_numeroSerie}</p>}
    //                         </label>
    //                         {/* Input Modelo */}
    //                         <label className="block">
    //                             <span className="text-sm font-medium text-gray-700">Modelo: <span className="text-red-500">*</span></span>
    //                             <input
    //                                 type="text"
    //                                 name="Unidades_modelo"
    //                                 value={unitData.Unidades_modelo}
    //                                 onChange={handleChange}
    //                                 className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.Unidades_modelo ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
    //                             />
    //                             {errors.Unidades_modelo && <p className="text-red-500 text-xs mt-1">{errors.Unidades_modelo}</p>}
    //                         </label>
    //                         {/* Input Año */}
    //                         <label className="block">
    //                             <span className="text-sm font-medium text-gray-700">Año: <span className="text-red-500">*</span></span>
    //                             <input
    //                                 type="number"
    //                                 name="Unidades_ano"
    //                                 value={unitData.Unidades_ano}
    //                                 onChange={handleChange}
    //                                 maxLength={4}
    //                                 className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.Unidades_ano ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
    //                             />
    //                             {errors.Unidades_ano && <p className="text-red-500 text-xs mt-1">{errors.Unidades_ano}</p>}
    //                         </label>
    //                     </div>

    //                     {/* Input Placa (continuación de la columna) */}
    //                     <label className="block">
    //                         <span className="text-sm font-medium text-gray-700">Placa:</span>
    //                         <input
    //                             type="text"
    //                             name="Unidades_placa"
    //                             value={unitData.Unidades_placa}
    //                             onChange={handleChange}
    //                             className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
    //                         />
    //                     </label>

    //                     {/* Input Kilometraje (continuación de la columna) */}
    //                     <label className="block">
    //                         <span className="text-sm font-medium text-gray-700">Kilometraje:</span>
    //                         <input
    //                             type="number"
    //                             name="Unidades_kilometraje"
    //                             value={unitData.Unidades_kilometraje}
    //                             onChange={handleChange}
    //                             className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
    //                         />
    //                     </label>

    //                     <label className="block">
    //                         <span className="text-sm font-medium text-gray-700">Mantenimiento:</span>
    //                         <input
    //                             type="text"
    //                             name="Unidades_mantenimiento"
    //                             value={unitData.Unidades_mantenimiento}
    //                             onChange={handleChange}
    //                             className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
    //                         />
    //                     </label>
    //                     <label className="block">
    //                         <span className="text-sm font-medium text-gray-700">Capacidad tanque (LTS):</span>
    //                         <input
    //                             type="text"
    //                             name="Unidades_capGasolina"
    //                             value={unitData.Unidades_capGasolina}
    //                             onChange={handleChange}
    //                             className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
    //                         />
    //                     </label>



    //                     {/* Checkbox Estatus (centrado) */}
    //                     <div className="flex justify-center w-full">
    //                         <label className="flex items-center space-x-2">
    //                             <input
    //                                 type="checkbox"
    //                                 name="Unidades_estatus"
    //                                 checked={unitData.Unidades_estatus == 1} // Usamos == para manejar 1 o '1'
    //                                 onChange={handleChange}
    //                                 className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    //                             />
    //                             <span className="text-sm font-medium text-gray-700">Estatus</span>
    //                         </label>
    //                     </div>


    //                     {/* Botones (se eliminó col-span-2) */}
    //                     <div className="flex justify-end gap-3 pt-4 border-t mt-4">
    //                         <button
    //                             type="button"
    //                             onClick={closeModal}
    //                             disabled={loading}
    //                             className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
    //                         >
    //                             Cancelar
    //                         </button>
    //                         <button
    //                             type="submit"
    //                             disabled={loading}
    //                             className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
    //                         >
    //                             {loading ? (action === 'create' ? 'Registrando...' : 'Actualizando...') : (action === 'create' ? 'Guardar Unidad' : 'Actualizar Unidad')}
    //                         </button>
    //                     </div>
    //                 </form>
    //             </DialogPanel>
    //         </div>
    //     </Dialog>
    // )

    return (
    <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
        {/* Overlay de fondo */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        {/* Contenedor del Modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
            {/* El tamaño del panel se ajusta para acomodar 2 columnas en pantallas medianas y grandes */}
            <DialogPanel className="w-full max-w-lg sm:max-w-2xl md:max-w-3xl rounded-xl bg-white p-6 shadow-2xl relative">

                {/* Indicador de carga */}
                {loading && <LoadingDiv />}

                <DialogTitle className="text-2xl font-bold mb-4 text-gray-900 border-b pb-2">
                    {dialogTitle}
                </DialogTitle>

                {/* Formulario responsivo: 1 columna por defecto, 2 columnas a partir de 'md' */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-8">

                    {/* COLUMNA 1 */}
                    <div className="space-y-4">
                        {/* Input Número Económico */}
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">No. Económico: <span className="text-red-500">*</span></span>
                            <input
                                type="text"
                                name="Unidades_numeroEconomico"
                                value={unitData.Unidades_numeroEconomico}
                                onChange={handleChange}
                                className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.Unidades_numeroEconomico ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                            />
                            {errors.Unidades_numeroEconomico && <p className="text-red-500 text-xs mt-1">{errors.Unidades_numeroEconomico}</p>}
                        </label>

                        {/* Input Número de Serie */}
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">No. de Serie: <span className="text-red-500">*</span></span>
                            <input
                                type="text"
                                name="Unidades_numeroSerie"
                                value={unitData.Unidades_numeroSerie}
                                onChange={handleChange}
                                className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.Unidades_numeroSerie ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                            />
                            {errors.Unidades_numeroSerie && <p className="text-red-500 text-xs mt-1">{errors.Unidades_numeroSerie}</p>}
                        </label>

                        {/* Input Modelo */}
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Modelo: <span className="text-red-500">*</span></span>
                            <input
                                type="text"
                                name="Unidades_modelo"
                                value={unitData.Unidades_modelo}
                                onChange={handleChange}
                                className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.Unidades_modelo ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                            />
                            {errors.Unidades_modelo && <p className="text-red-500 text-xs mt-1">{errors.Unidades_modelo}</p>}
                        </label>

                        {/* Input Año */}
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Año: <span className="text-red-500">*</span></span>
                            <input
                                type="number"
                                name="Unidades_ano"
                                value={unitData.Unidades_ano}
                                onChange={handleChange}
                                maxLength={4}
                                className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.Unidades_ano ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                            />
                            {errors.Unidades_ano && <p className="text-red-500 text-xs mt-1">{errors.Unidades_ano}</p>}
                        </label>
                    </div>

                    {/* COLUMNA 2 */}
                    <div className="space-y-4">
                        {/* Input Placa */}
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Placa:</span>
                            <input
                                type="text"
                                name="Unidades_placa"
                                value={unitData.Unidades_placa}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </label>

                        {/* Input Kilometraje */}
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Kilometraje:</span>
                            <input
                                type="number"
                                name="Unidades_kilometraje"
                                value={unitData.Unidades_kilometraje}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </label>

                        {/* Input Mantenimiento */}
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Mantenimiento:</span>
                            <input
                                type="text"
                                name="Unidades_mantenimiento"
                                value={unitData.Unidades_mantenimiento}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </label>

                        {/* Input Capacidad tanque */}
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Capacidad tanque (LTS):</span>
                            <input
                                type="text"
                                name="Unidades_capGasolina"
                                value={unitData.Unidades_capGasolina}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </label>

                        {/* Checkbox Estatus (ya no necesita justificación para centrar dentro de la columna) */}
                        <div className="flex items-center pt-2">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name="Unidades_estatus"
                                    checked={unitData.Unidades_estatus == 1} // Usamos == para manejar 1 o '1'
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Estatus</span>
                            </label>
                        </div>
                    </div>

                    {/* Botones: Ocupan 2 columnas en 'md' y superior */}
                    <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t mt-4">
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
                            {loading ? (action === 'create' ? 'Registrando...' : 'Actualizando...') : (action === 'create' ? 'Guardar Unidad' : 'Actualizar Unidad')}
                        </button>
                    </div>
                </form>
            </DialogPanel>
        </div>
    </Dialog>
)

    
}

// ----------------------------------------------------------------------
// Componente principal Unidades (anteriormente Unidades)
// ----------------------------------------------------------------------

export default function Unidades() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [units, setUnits] = useState([]); // Cambiado a units
    const [action, setAction] = useState('create'); // 'create' o 'edit'
    const [unitData, setUnitData] = useState(initialUnitData); // Cambiado a unitData
    const [errors, setErrors] = useState({}); // Errores de validación
    const [isLoading, setIsLoading] = useState(true);

    // Función para abrir modal en modo creación
    const openCreateModal = () => {
        setAction('create');
        setUnitData(initialUnitData); // Limpiar para creación
        setErrors({});
        setIsDialogOpen(true);
    };

    // Función para abrir modal en modo edición
    const openEditModal = (unit) => {
        setAction('edit');
        setUnitData(unit); // Cargar datos de la unidad para edición
        setErrors({});
        setIsDialogOpen(true);
    };

    // Limpia el formulario y cierra el modal
    const closeModal = () => {
        setIsDialogOpen(false);
        setUnitData(initialUnitData);
        setErrors({});
    };

    /**
     * Función que maneja la validación y la petición POST/PUT real.
     * Recibe los datos del formulario.
     */
    const submit = async (data) => {
        setErrors({});

        // 1. VALIDACIÓN
        const validationResult = validateInputs(unitValidations, data); // Usar unitValidations

        if (!validationResult.isValid) {
            setErrors(validationResult.errors);
            toast.error("Por favor, corrige los errores en el formulario.");
            // Lanza un error para que el UnitFormDialog sepa que falló
            throw new Error("Validation Failed");
        }

        // 2. RUTAS Y MÉTODO: Usa Unidades_ID para la actualización
        const isEdit = data.Unidades_unidadID;
        // La ID que se pasa a route debe ser la de la Unidad
        const ruta = isEdit
            ? route("unidades.update", data.Unidades_unidadID) // Cambiado a 'units.update'
            : route("unidades.store"); // Cambiado a 'units.store'

        const method = isEdit ? "PUT" : "POST";
        const successMessage = isEdit ? "Unidad actualizada con éxito." : "Unidad creada con éxito.";

        // 3. PETICIÓN (Request)
        try {
            await request(ruta, method, data);

            // 4. POST-ÉXITO
            await getUnits(); // Cambiado a getUnits
            toast.success(successMessage);
        } catch (error) {
            console.error("Error al guardar la unidad:", error);
            toast.error("Hubo un error al guardar la unidad.");
            throw error; // Propagar el error al UnitFormDialog para evitar que cierre el modal
        }
    };

    const getUnits = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(route("UnidadesQuiencQuien"));

            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.statusText} (${response.status})`);
            }

            const data = await response.json();
            setUnits(data);

        } catch (error) {
            console.error('Error al obtener las unidades:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getUnits() // Llamar a getUnits al montar
    }, [])

    return (

        <div className="relative h-[100%] pb-4 px-3 overflow-auto blue-scroll">

            <div className="flex justify-between items-center p-3 border-b mb-4">
                <h2 className="text-3xl font-bold text-gray-800">Gestión de Unidades </h2>
                <button
                    onClick={openCreateModal}
                    className="flex items-center px-4 py-2 text-base font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition duration-150 ease-in-out"
                >
                    + Nueva Unidad
                </button>
            </div>

            {isLoading ? (
                <div className='flex items-center justify-center h-[100%] w-full'> <LoadingDiv /> </div>

            ) : (
                <Datatable
                    data={units}
                    virtual={true}
                    columns={[
                        {
                            header: "Estatus",
                            accessor: "Unidades_estatus",
                            // width: '20%',
                            cell: ({ item: { Unidades_estatus } }) => {
                                const color = String(Unidades_estatus) === "1"
                                    ? "bg-green-300" // Si es "1"
                                    : "bg-red-300";  // Si NO es "1" (incluyendo "2", "0", null, etc.)

                                return (
                                    <span className={`inline-flex items-center justify-center rounded-full ${color} w-4 h-4`} />
                                );
                            },
                        },
                        { header: 'No. Económico', accessor: 'Unidades_numeroEconomico' },
                        { header: 'Modelo', accessor: 'Unidades_modelo' },
                        { header: 'Año', accessor: 'Unidades_ano' },
                        { header: 'Placa', accessor: 'Unidades_placa' },
                        { header: 'Mantenimiento', accessor: 'Unidades_mantenimiento' },
                        { header: 'Capacidad tanque (LTS)', accessor: 'Unidades_capGasolina' },

                        {
                            header: "Acciones", accessor: "Acciones", cell: (eprops) => (<>
                                <button
                                    onClick={() => openEditModal(eprops.item)}
                                    className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition"
                                >
                                    Editar
                                </button>
                            </>)
                        },
                    ]}
                />
            )}

            {/* Componente Modal de Headless UI */}
            <UnitFormDialog // Cambiado de PersonFormDialog a UnitFormDialog
                isOpen={isDialogOpen}
                closeModal={closeModal}
                onSubmit={submit}
                unitToEdit={unitData} // Cambiado de personToEdit a unitToEdit
                action={action}
                errors={errors}
                setErrors={setErrors}
            />

        </div>
    );
}