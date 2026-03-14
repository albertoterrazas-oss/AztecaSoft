import { useEffect, useState, Fragment } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";
import { Building2, Fingerprint, Save, UserPlus, Pencil, Building } from "lucide-react";

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
        // Mantenemos la lógica de mayúsculas para descripciones
        setFormData(prev => ({
            ...prev,
            [name]: name === 'idestado' ? value : value.toUpperCase()
        }));

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
                {/* Backdrop con desenfoque */}
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" aria-hidden="true" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <DialogPanel className="w-full max-w-md rounded-[3rem] bg-white p-10 shadow-2xl relative overflow-hidden border-b-[12px] border-[#1B2654]">

                            {/* Loader Rhino */}
                            {loading && (
                                <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
                                    <LoadingDiv />
                                    <span className="mt-4 text-[10px] font-black text-[#1B2654] uppercase tracking-[0.3em] animate-pulse">Procesando</span>
                                </div>
                            )}

                            {/* Cabecera */}
                            <div className="flex flex-col items-center mb-8">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-[#1B2654] mb-4 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                    </svg>
                                </div>
                                <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter text-center italic leading-none">
                                    {action === 'create' ? 'Nuevo' : 'Editar'} <br />
                                    <span className="text-[#1B2654]">Municipio</span>
                                </DialogTitle>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Estado */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Estado</label>
                                    <select
                                        name="idestado"
                                        disabled={loading}
                                        value={formData.idestado}
                                        onChange={handleChange}
                                        className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none uppercase text-sm appearance-none ${errors.idestado ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-[#1B2654] focus:bg-white'}`}
                                    >
                                        <option value="">Seleccionar Estado...</option>
                                        {estados.map(est => (
                                            <option key={est.idEstado} value={est.idEstado}>{est.descripcionEstado}</option>
                                        ))}
                                    </select>
                                    {errors.idestado && <p className="text-red-500 text-[9px] font-black uppercase mt-1 ml-2">{errors.idestado}</p>}
                                </div>

                                {/* Clave Municipio */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Clave Municipio</label>
                                    <input
                                        type="text"
                                        name="claveMunicipio"
                                        disabled={loading}
                                        value={formData.claveMunicipio}
                                        onChange={handleChange}
                                        placeholder="001"
                                        className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none uppercase text-sm ${errors.claveMunicipio ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-[#1B2654] focus:bg-white'}`}
                                    />
                                </div>

                                {/* Descripción */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nombre del Municipio</label>
                                    <input
                                        type="text"
                                        name="descripcionMunicipio"
                                        disabled={loading}
                                        value={formData.descripcionMunicipio}
                                        onChange={handleChange}
                                        placeholder="EJ. TORREÓN"
                                        className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none uppercase text-sm ${errors.descripcionMunicipio ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-[#1B2654] focus:bg-white'}`}
                                    />
                                    {errors.descripcionMunicipio && <p className="text-red-500 text-[9px] font-black uppercase mt-1 ml-2">{errors.descripcionMunicipio}</p>}
                                </div>

                                {/* Botones */}
                                <div className="flex gap-4 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={loading}
                                        className="flex-1 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] py-4 bg-[#1B2654] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#A61A18] transition-all disabled:bg-slate-300"
                                    >
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
        <div className="relative h-[100%] pb-4 px-3 overflow-auto blue-scroll">


            {isLoading ? (
                <div className='flex items-center justify-center h-[100%] w-full'> <LoadingDiv /> </div>
            ) : (
                <Datatable
                    data={municipios}
                    add={() => {
                        openCreateModal()
                    }}
                    virtual={true}
                    columns={[
                        { header: 'Clave', accessor: 'claveMunicipio' },
                        { header: 'Municipio', accessor: 'descripcionMunicipio' },
                        // { header: 'ID Estado', accessor: 'idestado' },
                        // {
                        //     header: "Acciones",
                        //     accessor: "actions",
                        //     cell: (props) => (
                        //         <button onClick={() => openEditModal(props.item)} className="px-3 py-1 text-sm text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200">
                        //             Editar
                        //         </button>
                        //     )
                        // },
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