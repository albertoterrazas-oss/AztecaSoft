import { useEffect, useState, Fragment } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";
import { Building2, Fingerprint, Save, UserPlus, Pencil, Building } from "lucide-react";

// --- Configuración de Rutas ---
const route = (name, params = {}) => {
    const id = params.Colonia_Id;
    const routeMap = {
        "colonias.index": "/api/colonias",
        "colonias.store": "/api/colonias",
        "colonias.update": `/api/colonias/${id}`,
        "estados.index": "/api/estados",
        "municipios.index": "/api/municipios",
    };
    return routeMap[name] || `/${name}`;
};

const initialColoniaData = {
    Colonia_Id: null,
    Colonia_Nombre: "",
    Colonia_IdMunicipio: "",
    c_CodigoPostal: "",
    Colonia_cveSAT: "",
    idEstado: "",
};

// --- Componente del Formulario Modal ---
function ColoniaFormDialog({ isOpen, closeModal, onSubmit, dataToEdit, action, estados, municipios }) {
    const [formData, setFormData] = useState(initialColoniaData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Mapeo preciso: idestado (minúscula) viene dentro de municipio en tu JSON

            console.log("Data para editar:", dataToEdit); // Verifica qué datos llegan al abrir el modal
            const idEstadoRef = dataToEdit?.municipio?.idestado || "";
            const idMunicipioRef = dataToEdit?.Colonia_IdMunicipio || dataToEdit?.municipio?.idMunicipio || "";

            setFormData({
                Colonia_Id: dataToEdit?.Colonia_Id || null,
                Colonia_Nombre: dataToEdit?.Colonia_Nombre || "",
                Colonia_IdMunicipio: String(idMunicipioRef),
                c_CodigoPostal: dataToEdit?.c_CodigoPostal || "",
                Colonia_cveSAT: dataToEdit?.Colonia_cveSAT || "", // Aquí ya no se pierde al editar
                idEstado: String(idEstadoRef),
            });
        }
    }, [isOpen, dataToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'idEstado') {
            setFormData(prev => ({ ...prev, idEstado: value, Colonia_IdMunicipio: "" }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: (name.includes('Id')) ? value : value.toUpperCase()
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.Colonia_IdMunicipio) return toast.error("Selecciona un municipio");

        setLoading(true);
        try {
            const isEdit = !!formData.Colonia_Id;
            const method = isEdit ? "PUT" : "POST";
            const url = isEdit ? route("colonias.update", { Colonia_Id: formData.Colonia_Id }) : route("colonias.store");
            await request(url, method, formData);
            toast.success("¡Guardado correctamente!");
            onSubmit();
            closeModal();
        } catch (err) {
            toast.error("Error al guardar datos");
        } finally { setLoading(false); }
    };

    const filteredMun = municipios.filter(m => String(m.idestado) === String(formData.idEstado));

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={closeModal} className="relative z-[200]">
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" />
                </TransitionChild>
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <DialogPanel className="w-full max-w-lg rounded-[3rem] bg-white p-10 shadow-2xl border-b-[12px] border-[#1B2654]">
                            <DialogTitle className="text-2xl font-black text-[#1B2654] uppercase italic text-center mb-6">Detalles Colonia</DialogTitle>
                            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Estado</label>
                                    <select name="idEstado" value={formData.idEstado} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-[#1B2654] font-bold text-xs outline-none">
                                        <option value="">Seleccione...</option>
                                        {estados.map(e => <option key={e.idEstado} value={String(e.idEstado)}>{e.descripcionEstado}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Municipio</label>
                                    <select name="Colonia_IdMunicipio" value={formData.Colonia_IdMunicipio} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-[#1B2654] font-bold text-xs outline-none">
                                        <option value="">Seleccione...</option>
                                        {filteredMun.map(m => <option key={m.idMunicipio} value={String(m.idMunicipio)}>{m.descripcionMunicipio}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre Colonia</label>
                                    <input type="text" name="Colonia_Nombre" value={formData.Colonia_Nombre} onChange={handleChange} className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-[#1B2654] font-bold text-sm outline-none" />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">CP</label>
                                    <input type="text" name="c_CodigoPostal" value={formData.c_CodigoPostal} onChange={handleChange} className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-[#1B2654] font-bold text-sm outline-none" />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Clave SAT</label>
                                    <input type="text" name="Colonia_cveSAT" value={formData.Colonia_cveSAT || ""} onChange={handleChange} className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-[#1B2654] font-bold text-sm outline-none" />
                                </div>
                                <div className="col-span-2 flex gap-4 mt-4">
                                    <button type="button" onClick={closeModal} className="flex-1 py-3 font-black text-[10px] uppercase text-slate-400">Cancelar</button>
                                    <button type="submit" className="flex-[2] py-4 bg-[#1B2654] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Guardar</button>
                                </div>
                            </form>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}

// --- Componente Principal ---
export default function Colonias() {
    const [colonias, setColonias] = useState([]);
    const [estados, setEstados] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [filterEstado, setFilterEstado] = useState("");
    const [filterMunicipio, setFilterMunicipio] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [action, setAction] = useState('create');
    const [currentCol, setCurrentCol] = useState(initialColoniaData);
    const [isLoading, setIsLoading] = useState(false); // Empezamos sin cargar nada

    const getColonias = async () => {
        // REGLA: No buscar nada si no hay municipio seleccionado
        if (!filterMunicipio) {
            setColonias([]);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/colonias?Colonia_IdMunicipio=${filterMunicipio}`);
            const data = await res.json();
            const finalData = data.data ? data.data : data;
            setColonias(Array.isArray(finalData) ? finalData : []);
        } catch (error) {
            toast.error("Error al cargar");
            setColonias([]);
        } finally { setIsLoading(false); }
    };

    useEffect(() => {
        const fetchCats = async () => {
            const [re, rm] = await Promise.all([fetch("/api/estados"), fetch("/api/municipios")]);
            setEstados(await re.json());
            const dm = await rm.json();
            setMunicipios(dm.data || dm);
        };
        fetchCats();
    }, []);

    // Solo se dispara la búsqueda cuando cambia el filtro de municipio
    useEffect(() => {
        getColonias();
    }, [filterMunicipio]);

    return (
        <div className="relative h-full px-6 py-4 flex flex-col bg-[#F8FAFC]">
            {/* Filtros */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 mb-6 transition-all">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* <h1 className="text-xl font-black text-slate-800 uppercase italic leading-none">Colonias</h1> */}
                    <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                        <select className="bg-slate-50 border-2 border-transparent focus:border-[#1B2654] rounded-2xl px-4 py-2.5 text-xs font-bold transition-all outline-none"
                            value={filterEstado} onChange={(e) => { setFilterEstado(e.target.value); setFilterMunicipio(""); setColonias([]); }}>
                            <option value="">1. Seleccione Estado</option>
                            {estados.map(e => <option key={e.idEstado} value={String(e.idEstado)}>{e.descripcionEstado}</option>)}
                        </select>
                        <select className="bg-slate-50 border-2 border-transparent focus:border-[#1B2654] rounded-2xl px-4 py-2.5 text-xs font-bold transition-all outline-none disabled:opacity-50"
                            value={filterMunicipio} onChange={(e) => setFilterMunicipio(e.target.value)} disabled={!filterEstado}>
                            <option value="">2. Seleccione Municipio</option>
                            {municipios.filter(m => String(m.idestado) === String(filterEstado)).map(m => (
                                <option key={m.idMunicipio} value={String(m.idMunicipio)}>{m.descripcionMunicipio}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="flex-1  shadow-sm  overflow-hidden relative">
                {isLoading ? (
                    <div className='flex items-center justify-center h-full w-full'> <LoadingDiv /> </div>
                ) : filterMunicipio === "" ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 italic">
                        <p className="font-bold text-lg uppercase tracking-tighter">Esperando selección...</p>
                        <p className="text-xs">Selecciona un estado y municipio para ver las colonias</p>
                    </div>
                ) : (
                    <Datatable
                        data={colonias}
                        virtual={true}
                        add={() => { setAction('create'); setCurrentCol(initialColoniaData); setIsDialogOpen(true); }}
                        columns={[
                            {
                                header: 'Codigo de postal',
                                accessor: 'c_CodigoPostal',
                                cell: ({ item }) => <span className="font-semibold text-gray-800">{item.c_CodigoPostal}</span>
                            },
                            {
                                header: 'Nombre del Área',
                                accessor: 'Colonia_Nombre',
                                cell: ({ item }) => <span className="font-semibold text-gray-800">{item.Colonia_Nombre}</span>
                            },
                            // {
                            //     header: "Acciones",
                            //     cell: (props) => (
                            //         <button
                            //             onClick={() => { setAction('edit'); setCurrentCol(props.item); setIsDialogOpen(true); }}
                            //             className="text-blue-600 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 transition-colors"
                            //         >
                            //             Editar
                            //         </button>
                            //     )
                            // },

                            {
                                header: "Acciones",
                                cell: (props) => (
                                    <button
                                        onClick={() => { setAction('edit'); setCurrentCol(props.item); setIsDialogOpen(true); }}
                                        className="p-3 bg-slate-50 text-[#1B2654] rounded-xl hover:bg-[#1B2654] hover:text-white transition-all border border-slate-100"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                )
                            },
                        ]}
                    />
                )}
            </div>

            <ColoniaFormDialog isOpen={isDialogOpen} closeModal={() => setIsDialogOpen(false)} onSubmit={getColonias} dataToEdit={currentCol} action={action} estados={estados} municipios={municipios} />
        </div>
    );
}