import { useEffect, useState, useRef, Fragment, memo, useMemo } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import {
    Camera, User, MapPin, Fingerprint, Pencil, Save, Hash, Home, Loader2
} from "lucide-react";
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

// --- COMPONENTES ATÓMICOS RHINO ---
const RhinoInput = memo(({ label, icon: Icon, error, ...props }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 flex items-center gap-2">
            {Icon && <Icon size={12} className="text-[#1B2654]" />}
            {label}
        </label>
        <input
            {...props}
            className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none text-sm 
            ${error ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-[#1B2654] focus:bg-white'} 
            disabled:opacity-60 disabled:cursor-not-allowed`}
        />
        {error && <p className="text-red-500 text-[9px] font-black uppercase mt-1 ml-4">{error[0] || error}</p>}
    </div>
));

const RhinoSelect = memo(({ label, icon: Icon, options, displayKey, valueKey, loading, ...props }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 flex items-center gap-2">
            {Icon && <Icon size={12} className="text-[#1B2654]" />}
            {label}
            {loading && <Loader2 size={12} className="animate-spin" />}
        </label>
        <select
            {...props}
            className="w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 border-transparent transition-all font-bold text-slate-700 outline-none text-sm focus:border-[#1B2654] focus:bg-white appearance-none disabled:opacity-50"
        >
            <option value="">{loading ? 'CARGANDO...' : 'SELECCIONAR...'}</option>
            {options?.map((o, idx) => (
                <option key={`${idx}-${o[valueKey]}`} value={o[valueKey]}>{o[displayKey]}</option>
            ))}
        </select>
    </div>
));

// --- MODAL FORMULARIO PERSONAS ---
function PersonaFormDialog({ isOpen, closeModal, onSubmit, dataToEdit, estados, municipios }) {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingColonias, setLoadingColonias] = useState(false);
    const [colonias, setColonias] = useState([]);
    const fileInputRef = useRef(null);

    // 1. Inicialización
    useEffect(() => {
        if (isOpen) {
            if (dataToEdit?.IdPersona) {
                setFormData({
                    ...dataToEdit,
                    IdEstado: String(dataToEdit.IdEstado || ""),
                    IdMunicipio: String(dataToEdit.IdMunicipio || ""),
                    IdColonia: String(dataToEdit.IdColonia || ""),
                    CodigoPostal: dataToEdit.CodigoPostal || ""
                });
            } else {
                setFormData({
                    IdPersona: null, IdEstado: "", IdMunicipio: "", IdColonia: "",
                    Nombres: "", ApePat: "", ApeMat: "", Calle: "", CasaNum: "",
                    Sexo: "M", RFC: "", Curp: "", CodigoPostal: "", PathFotoEmpleado: "",NSS: ""
                });
            }
            setErrors({});
        }
    }, [isOpen, dataToEdit]);

    // 2. Carga de colonias dinámica
    useEffect(() => {
        const fetchColonias = async () => {
            if (!formData.IdMunicipio) {
                setColonias([]);
                return;
            }
            setLoadingColonias(true);
            try {
                const res = await request(`/api/colonias?Colonia_IdMunicipio=${formData.IdMunicipio}`);
                setColonias(res.data || res);
            } catch (e) {
                console.error("Error colonias", e);
            } finally {
                setLoadingColonias(false);
            }
        };
        fetchColonias();
    }, [formData.IdMunicipio]);

    // 3. Filtrado local de municipios
    const municipiosFiltrados = useMemo(() => {
        if (!formData.IdEstado) return [];
        return municipios.filter(m => String(m.idestado) === String(formData.IdEstado));
    }, [formData.IdEstado, municipios]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Lógica especial para Colonia -> Setea C.P. automáticamente
        if (name === "IdColonia") {
            const coloniaSeleccionada = colonias.find(c => String(c.Colonia_Id) === String(value));
            setFormData(prev => ({
                ...prev,
                IdColonia: value,
                CodigoPostal: coloniaSeleccionada ? coloniaSeleccionada.c_CodigoPostal : ""
            }));
            return;
        }

        const upperVal = (name !== 'PathFotoEmpleado') ? value.toUpperCase() : value;

        setFormData(prev => ({
            ...prev,
            [name]: upperVal,
            ...(name === 'IdEstado' ? { IdMunicipio: "", IdColonia: "", CodigoPostal: "" } : {}),
            ...(name === 'IdMunicipio' ? { IdColonia: "", CodigoPostal: "" } : {})
        }));
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={loading ? () => { } : closeModal} className="relative z-[200]">
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <DialogPanel className="w-full max-w-4xl rounded-[3rem] bg-white p-10 shadow-2xl relative overflow-hidden border-b-[12px] border-[#1B2654]">

                            <div className="flex flex-col items-center mb-8">
                                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-[#1B2654] mb-4 shadow-inner relative group border-2 border-white overflow-hidden">
                                    {formData.PathFotoEmpleado ? (
                                        <img src={formData.PathFotoEmpleado} className="w-full h-full object-cover" />
                                    ) : <User size={40} className="opacity-20" />}
                                    <button type="button" onClick={() => fileInputRef.current.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Camera size={20} />
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setFormData(p => ({ ...p, PathFotoEmpleado: reader.result }));
                                            reader.readAsDataURL(file);
                                        }
                                    }} />
                                </div>
                                <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter text-center italic leading-none">
                                    Ficha de <span className="text-[#1B2654]">Personal</span>
                                </DialogTitle>
                            </div>

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                setLoading(true);
                                try { await onSubmit(formData); }
                                catch (err) { setErrors(err.response?.data?.errors || {}); }
                                finally { setLoading(false); }
                            }} className="space-y-6 overflow-y-auto max-h-[60vh] px-4 blue-scroll">

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <RhinoInput label="Nombres" name="Nombres" value={formData.Nombres || ''} onChange={handleChange} error={errors.Nombres} icon={Fingerprint} />
                                    <RhinoInput label="Paterno" name="ApePat" value={formData.ApePat || ''} onChange={handleChange} error={errors.ApePat} />
                                    <RhinoInput label="Materno" name="ApeMat" value={formData.ApeMat || ''} onChange={handleChange} />

                                    <RhinoInput
                                        label="RFC"
                                        name="RFC"
                                        value={formData.RFC || ''}
                                        onChange={handleChange}
                                        error={errors.RFC}
                                        maxLength={15}
                                    />
                                    <RhinoInput
                                        label="NSS"
                                        name="NSS"
                                        value={formData.NSS || ''}
                                        onChange={handleChange}
                                        error={errors.NSS}
                                        maxLength={15}
                                    />
                                    <RhinoInput
                                        label="CURP"
                                        name="Curp"
                                        value={formData.Curp || ''}
                                        onChange={handleChange}
                                        error={errors.Curp}
                                        maxLength={20} // Esto evita que el usuario escriba más caracteres
                                    />
                                    <RhinoSelect label="Género" name="Sexo" value={formData.Sexo || 'M'} onChange={handleChange} options={[{ v: 'M', d: 'MASCULINO' }, { v: 'F', d: 'FEMENINO' }]} valueKey="v" displayKey="d" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-[2.5rem] border-2 border-white shadow-inner">
                                    <RhinoSelect label="Estado" name="IdEstado" value={formData.IdEstado || ''} onChange={handleChange} options={estados} valueKey="idEstado" displayKey="descripcionEstado" icon={MapPin} />

                                    <RhinoSelect label="Municipio" name="IdMunicipio" value={formData.IdMunicipio || ''} onChange={handleChange}
                                        options={municipiosFiltrados} valueKey="idMunicipio" displayKey="descripcionMunicipio" disabled={!formData.IdEstado} />

                                    <RhinoSelect
                                        label="Colonia"
                                        name="IdColonia"
                                        value={formData.IdColonia || ''}
                                        onChange={handleChange}
                                        options={colonias}
                                        valueKey="Colonia_Id"
                                        displayKey="Colonia_Nombre"
                                        disabled={!formData.IdMunicipio || loadingColonias}
                                        loading={loadingColonias}
                                        icon={Home}
                                    />

                                    <div className="md:col-span-2">
                                        <RhinoInput label="Calle y Número" name="Calle" value={formData.Calle || ''} onChange={handleChange} />
                                    </div>

                                    {/* CP AUTOMÁTICO Y DESHABILITADO */}
                                    <RhinoInput
                                        label="C.P."
                                        name="CodigoPostal"
                                        value={formData.CodigoPostal || ''}
                                        icon={Hash}
                                        disabled={true}
                                        placeholder="AUTOCONTROL"
                                    />
                                </div>

                                <div className="flex gap-4 pt-6 border-t border-slate-100">
                                    <button type="button" onClick={closeModal} className="flex-1 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-red-600 transition-colors">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={loading} className="flex-[2] py-4 bg-[#1B2654] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#A61A18] transition-all disabled:bg-slate-300 flex items-center justify-center gap-2">
                                        <Save size={16} />
                                        {loading ? 'Procesando...' : 'Confirmar Registro'}
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

// --- VISTA PRINCIPAL ---
export default function Personas() {
    const [data, setData] = useState([]);
    const [cats, setCats] = useState({ est: [], mun: [] });
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ open: false, action: 'create', item: null });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [p, e, m] = await Promise.all([
                request("/api/personas"),
                request("/api/estados"),
                request("/api/municipios")
            ]);
            setData(p.data || p);
            setCats({ est: e.data || e, mun: m.data || m });
        } catch (e) { toast.error("Error al sincronizar datos"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    return (
        <div className="h-full bg-[#f8fafc] p-8 flex flex-col font-sans">
            <div className="flex-1 overflow-hidden">
                {loading ? <div className="h-full flex items-center justify-center"><LoadingDiv /></div> : (
                    <Datatable
                        data={data}
                        virtual={true}
                        add={() => setModal({ open: true, action: 'create', item: null })}
                        columns={[
                            // {
                            //     header: 'Colaborador',
                            //     cell: (p) => (
                            //         <div className="flex items-center gap-3">
                            //             <div className="w-8 h-8 rounded-lg bg-slate-200 overflow-hidden border border-slate-300">
                            //                 {p.item.PathFotoEmpleado && <img src={p.item.PathFotoEmpleado} className="w-full h-full object-cover" />}
                            //             </div>
                            //             <span className="font-bold text-slate-700 uppercase tracking-tight">
                            //                 {`${p.item.Nombres} ${p.item.ApePat}`}
                            //             </span>
                            //         </div>
                            //     )
                            // },

                            {
                                header: "Estatus",
                                accessor: "Estatus",
                                cell: ({ item: { Estatus } }) => (
                                    <div className="flex justify-center">
                                        <span className={`inline-flex items-center justify-center rounded-full w-4 h-4 shadow-sm ${Number(Estatus) === 1 ? "bg-green-400" : "bg-red-400"}`} />
                                    </div>
                                ),
                            },
                            // { header: 'Estatus', accessor: 'Estatus' },

                            { header: 'Nombre', accessor: 'NombreCompleto' },
                            { header: 'RFC', accessor: 'RFC' },
                            // { header: 'RFC', cell: (p) => <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg font-mono">{p.item.RFC}</span> },
                            {
                                header: 'Acciones',
                                cell: (p) => (
                                    <button onClick={() => setModal({ open: true, action: 'edit', item: p.item })} className="p-3 bg-slate-100 text-[#1B2654] rounded-xl hover:bg-[#1B2654] hover:text-white transition-all border border-slate-200">
                                        <Pencil size={16} />
                                    </button>
                                )
                            }
                        ]}
                    />
                )}
            </div>

            <PersonaFormDialog
                isOpen={modal.open}
                closeModal={() => setModal({ open: false })}
                action={modal.action}
                dataToEdit={modal.item}
                onSubmit={async (val) => {
                    const isEdit = !!val.IdPersona;
                    const res = await request(isEdit ? `/api/personas/${val.IdPersona}` : "/api/personas", isEdit ? 'PUT' : 'POST', val);
                    if (res) {
                        toast.success("DATOS ACTUALIZADOS");
                        fetchData();
                        setModal({ open: false });
                    }
                }}
                estados={cats.est}
                municipios={cats.mun}
            />
        </div>
    );
}