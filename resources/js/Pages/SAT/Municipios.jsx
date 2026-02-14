import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

// --- Configuración de Rutas ---
const route = (name, params = {}) => {
    const id = params.id;
    const routeMap = {
        "municipios.index": "/api/municipios",
        "municipios.store": "/api/municipios",
        "municipios.update": `/api/municipios/${id}`,
        "estados.index": "/api/estados", // Necesario para el select
    };
    return routeMap[name] || `/${name}`;
};

const validateInputs = (data) => {
    let formErrors = {};
    if (!data.claveMunicipio?.trim()) formErrors.claveMunicipio = 'La clave es obligatoria.';
    if (!data.idestado) formErrors.idestado = 'Debe seleccionar un estado.';
    if (!data.descripcionMunicipio?.trim()) formErrors.descripcionMunicipio = 'La descripción es obligatoria.';
    return { isValid: Object.keys(formErrors).length === 0, errors: formErrors };
};

const initialMunicipioData = {
    id: null,
    claveMunicipio: "",
    idestado: "",
    descripcionMunicipio: "",
};

// --- Componente del Formulario ---
function MunicipioFormDialog({ isOpen, closeModal, onSubmit, dataToEdit, action, errors, setErrors, estados }) {
    const [formData, setFormData] = useState(initialMunicipioData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                id: dataToEdit?.id || null,
                claveMunicipio: dataToEdit?.claveMunicipio || "",
                idestado: dataToEdit?.idestado || "",
                descripcionMunicipio: dataToEdit?.descripcionMunicipio || ""
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
        try {
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={isOpen}>
            <Dialog onClose={closeModal} className="relative z-50">
                <TransitionChild enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl relative">
                        {loading && <LoadingDiv />}
                        <DialogTitle className="text-2xl font-bold mb-4 border-b pb-2">
                            {action === 'create' ? 'Crear Municipio' : 'Editar Municipio'}
                        </DialogTitle>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                            {/* Selector de Estado */}
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Estado:</span>
                                <select
                                    name="idestado"
                                    value={formData.idestado}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.idestado ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">Seleccione un estado...</option>
                                    {estados.map(est => (
                                        <option key={est.idEstado} value={est.idEstado}>{est.descripcionEstado}</option>
                                    ))}
                                </select>
                                {errors.idestado && <p className="text-red-500 text-xs mt-1">{errors.idestado}</p>}
                            </label>

                            {/* Clave Municipio */}
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Clave Municipio:</span>
                                <input type="text" name="claveMunicipio" value={formData.claveMunicipio} onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.claveMunicipio ? 'border-red-500' : 'border-gray-300'}`} />
                            </label>

                            {/* Descripción */}
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Descripción:</span>
                                <input type="text" name="descripcionMunicipio" value={formData.descripcionMunicipio} onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.descripcionMunicipio ? 'border-red-500' : 'border-gray-300'}`} />
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

export default function Municipios() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [municipios, setMunicipios] = useState([]);
    const [estados, setEstados] = useState([]);
    const [action, setAction] = useState('create');
    const [currentMun, setCurrentMun] = useState(initialMunicipioData);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Cargar Municipios y Estados (para el formulario)
            const [resMun, resEst] = await Promise.all([
                fetch(route("municipios.index")),
                fetch(route("estados.index"))
            ]);
            const dataMun = await resMun.json();
            const dataEst = await resEst.json();

            // Nota: Tu controlador de Laravel usa paginate(), por lo que la data real está en dataMun.data
            setMunicipios(dataMun.data || dataMun);
            setEstados(dataEst);
        } catch (error) {
            toast.error("Error al cargar datos.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openCreateModal = () => {
        setAction('create');
        setCurrentMun(initialMunicipioData);
        setIsDialogOpen(true);
    };

    const openEditModal = (municipio) => {
        setAction('edit');
        setCurrentMun(municipio);
        setIsDialogOpen(true);
    };

    const submit = async (formData) => {
        const validation = validateInputs(formData);
        if (!validation.isValid) return setErrors(validation.errors);

        const isEdit = !!formData.id;
        const ruta = isEdit ? route("municipios.update", { id: formData.id }) : route("municipios.store");
        const method = isEdit ? "PUT" : "POST";

        try {
            await request(ruta, method, formData);
            toast.success("Municipio guardado correctamente");
            await fetchData();
            setIsDialogOpen(false);
        } catch (error) {
            toast.error("Error al procesar la solicitud.");
        }
    };

    return (
        <div className="relative h-full pb-4 px-3 overflow-auto">
            <div className="flex justify-between items-center p-3 border-b mb-4 bg-white sticky top-0 z-10">
                <h2 className="text-3xl font-bold text-gray-800">Catálogo de Municipios</h2>
                <button onClick={openCreateModal}
                    // className="px-4 py-2 bg-green-600 text-white rounded-lg"
                    className="flex items-center px-4 py-2 text-base font-semibold text-white rounded-lg shadow-md  transition duration-150 ease-in-out"
                    style={{ backgroundColor: '#A61A18' }}

                >+ Nuevo Municipio</button>
            </div>

            {isLoading ? (
                <div className='flex items-center justify-center h-64'> <LoadingDiv /> </div>
            ) : (
                <Datatable
                    data={municipios}
                    virtual={true}
                    columns={[
                        { header: 'Clave', accessor: 'claveMunicipio' },
                        { header: 'Municipio', accessor: 'descripcionMunicipio' },
                        { header: 'ID Estado', accessor: 'idestado' },
                        {
                            header: "Acciones",
                            accessor: "actions",
                            cell: (props) => (
                                <button onClick={() => openEditModal(props.item)} className="px-3 py-1 text-sm text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200">
                                    Editar
                                </button>
                            )
                        },
                    ]}
                />
            )}

            <MunicipioFormDialog
                isOpen={isDialogOpen}
                closeModal={() => setIsDialogOpen(false)}
                onSubmit={submit}
                dataToEdit={currentMun}
                action={action}
                errors={errors}
                setErrors={setErrors}
                estados={estados}
            />
        </div>
    );
}