import { useEffect, useState, useRef, Fragment, memo } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import { 
    Camera, X, User, MapPin, Fingerprint, UserPlus, Pencil, Save, Hash, Home
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
            ${error ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-[#1B2654] focus:bg-white'}`}
        />
        {error && <p className="text-red-500 text-[9px] font-black uppercase mt-1 ml-4">{error[0] || error}</p>}
    </div>
));

const RhinoSelect = memo(({ label, icon: Icon, options, displayKey, valueKey, ...props }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 flex items-center gap-2">
            {Icon && <Icon size={12} className="text-[#1B2654]" />}
            {label}
        </label>
        <select
            {...props}
            className="w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 border-transparent transition-all font-bold text-slate-700 outline-none text-sm focus:border-[#1B2654] focus:bg-white appearance-none disabled:opacity-50"
        >
            <option value="">SELECCIONAR...</option>
            {options?.map(o => (
                <option key={o[valueKey]} value={o[valueKey]}>{o[displayKey]}</option>
            ))}
        </select>
    </div>
));

// --- MODAL FORMULARIO PERSONAS (SIN COLONIAS API) ---
function PersonaFormDialog({ isOpen, closeModal, onSubmit, dataToEdit, action, estados, municipios }) {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setFormData(dataToEdit?.IdPersona ? { ...dataToEdit } : {
                IdPersona: null, IdEstado: "", IdMunicipio: "", Colonia: "",
                Nombres: "", ApePat: "", ApeMat: "", Calle: "", CasaNum: "", 
                Sexo: "M", RFC: "", Curp: "", CodigoPostal: "", PathFotoEmpleado: ""
            });
            setErrors({});
        }
    }, [isOpen, dataToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const upperVal = value.toUpperCase();

        setFormData(prev => ({ 
            ...prev, 
            [name]: upperVal,
            // Si cambia estado, limpiamos municipio por lógica
            ...(name === 'IdEstado' ? { IdMunicipio: "" } : {})
        }));

        if (errors[name]) {
            setErrors(prev => {
                const n = {...prev};
                delete n[name];
                return n;
            });
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={loading ? () => {} : closeModal} className="relative z-[200]">
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
                                            reader.onloadend = () => setFormData(p => ({...p, PathFotoEmpleado: reader.result}));
                                            reader.readAsDataURL(file);
                                        }
                                    }} />
                                </div>
                                <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter text-center italic leading-none">
                                    Registro de <span className="text-[#1B2654]">Personal</span>
                                </DialogTitle>
                            </div>

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                setLoading(true);
                                try { await onSubmit(formData); }
                                catch (err) { setErrors(err.response?.data?.errors || {}); }
                                finally { setLoading(false); }
                            }} className="space-y-6 overflow-y-auto max-h-[60vh] px-4 blue-scroll">
                                
                                {/* DATOS PERSONALES */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <RhinoInput label="Nombres" name="Nombres" value={formData.Nombres || ''} onChange={handleChange} error={errors.Nombres} icon={Fingerprint} />
                                    <RhinoInput label="Paterno" name="ApePat" value={formData.ApePat || ''} onChange={handleChange} error={errors.ApePat} />
                                    <RhinoInput label="Materno" name="ApeMat" value={formData.ApeMat || ''} onChange={handleChange} />
                                    <RhinoInput label="RFC" name="RFC" value={formData.RFC || ''} onChange={handleChange} error={errors.RFC} />
                                    <RhinoInput label="CURP" name="Curp" value={formData.Curp || ''} onChange={handleChange} error={errors.Curp} />
                                    <RhinoSelect label="Género" name="Sexo" value={formData.Sexo || 'M'} onChange={handleChange} options={[{v:'M', d:'MASCULINO'}, {v:'F', d:'FEMENINO'}]} valueKey="v" displayKey="d" />
                                </div>

                                {/* UBICACIÓN MANUAL (SIN TRABAS) */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-[2.5rem] border-2 border-white shadow-inner">
                                    <RhinoSelect label="Estado" name="IdEstado" value={formData.IdEstado || ''} onChange={handleChange} options={estados} valueKey="idEstado" displayKey="descripcionEstado" icon={MapPin} />
                                    <RhinoSelect label="Municipio" name="IdMunicipio" value={formData.IdMunicipio || ''} onChange={handleChange} 
                                        options={municipios.filter(m => String(m.idestado) === String(formData.IdEstado))} 
                                        valueKey="idMunicipio" displayKey="descripcionMunicipio" disabled={!formData.IdEstado} />
                                    
                                    <RhinoInput label="Colonia" name="Colonia" value={formData.Colonia || ''} onChange={handleChange} icon={Home} placeholder="ESCRIBE LA COLONIA" />

                                    <div className="md:col-span-2">
                                        <RhinoInput label="Calle y Número" name="Calle" value={formData.Calle || ''} onChange={handleChange} />
                                    </div>
                                    <RhinoInput label="C.P." name="CodigoPostal" value={formData.CodigoPostal || ''} onChange={handleChange} icon={Hash} maxLength={5} />
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
                request("/api/personas"), request("/api/estados"), request("/api/municipios")
            ]);
            setData(p.data || p);
            setCats({ est: e, mun: m.data || m });
        } catch (e) { toast.error("Error al sincronizar datos"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    return (
        <div className="h-full bg-[#f8fafc] p-8 flex flex-col font-sans">
            {/* <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="bg-[#1B2654] p-4 rounded-3xl shadow-lg shadow-blue-900/20">
                        <User size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[#1B2654] uppercase tracking-tighter italic">Personal</h1>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Rhino Unit DB</p>
                    </div>
                </div>
                <button onClick={() => setModal({ open: true, action: 'create', item: null })} className="bg-[#1B2654] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#A61A18] transition-all shadow-xl flex items-center gap-3">
                    <UserPlus size={20} />
                    Nuevo Registro
                </button>
            </div> */}

            <div className="flex-1  overflow-hidden">
                {loading ? <div className="h-full flex items-center justify-center"><LoadingDiv /></div> : (
                    <Datatable 
                        data={data}
                        virtual={true}
                        columns={[
                            // { header: 'ID', accessor: 'IdPersona', cell: (p) => <span className="font-black text-slate-300">#{p.item.IdPersona}</span> },
                            { header: 'Colaborador', cell: (p) => <span className="font-bold text-slate-700 uppercase tracking-tight">{`${p.item.Nombres} ${p.item.ApePat}`}</span> },
                            { header: 'Identificación', cell: (p) => <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg font-mono">{p.item.RFC}</span> },
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
                    if(res) {
                        toast.success("DATOS ACTUALIZADOS");
                        fetchData();
                        setModal({ open: false });
                    }
                }}
                estados={[]}
                municipios={[]}
            />
        </div>
    );
}