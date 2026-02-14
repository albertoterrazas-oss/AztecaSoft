import { useEffect, useState, useRef } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

const route = (name, params = {}) => {
    const id = params.IdPersona;
    const routeMap = {
        "personas.index": "/api/personas",
        "personas.store": "/api/personas",
        "personas.update": `/api/personas/${id}`,
        "estados.index": "/api/estados",
        "municipios.index": "/api/municipios",
        "colonias.index": "/api/colonias",
        "puestos.index": "/api/puestos",
    };
    return routeMap[name] || `/${name}`;
};

const initialPersonaData = {
    IdPersona: null, IdEstado: "", IdMunicipio: "", IdColonia: "", IdPuesto: "",
    Nombres: "", ApePat: "", ApeMat: "", Calle: "", CasaNum: "", Telefono: "",
    FechaNacimiento: "", FechaIngreso: "", Sexo: "M", NSS: "", RFC: "",
    Curp: "", CodigoPostal: "", SalarioReal: 0, Estatus: true, EsEmpleado: true,
    PathFotoEmpleado: ""
};

function PersonaFormDialog({ isOpen, closeModal, onSubmit, dataToEdit, action, estados, municipios, colonias, puestos }) {
    const [formData, setFormData] = useState(initialPersonaData);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setFormData(dataToEdit?.IdPersona ? { ...dataToEdit } : initialPersonaData);
            setErrors({});
        }
    }, [isOpen, dataToEdit]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFormData(prev => ({ ...prev, PathFotoEmpleado: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));

        if (name === 'IdEstado') setFormData(p => ({ ...p, IdMunicipio: "", IdColonia: "", CodigoPostal: "" }));
        if (name === 'IdMunicipio') setFormData(p => ({ ...p, IdColonia: "", CodigoPostal: "" }));
        if (name === 'IdColonia') {
            const col = colonias.find(c => String(c.Colonia_Id) === String(value));
            if (col) setFormData(p => ({ ...p, CodigoPostal: col.c_CodigoPostal }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try { await onSubmit(formData); }
        catch (err) { setErrors(err.response?.data?.errors || {}); toast.error("Error de validación."); }
        finally { setLoading(false); }
    };

    return (
        <Transition show={isOpen}>
            <Dialog onClose={closeModal} className="relative z-50">
                <TransitionChild enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30" />
                </TransitionChild>
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-8 shadow-2xl relative">
                        {loading && <LoadingDiv />}
                        <DialogTitle className="text-2xl font-bold mb-6 border-b pb-2 text-indigo-900 flex justify-between items-center">
                            {action === 'create' ? 'Nueva Persona' : 'Editar Persona'}
                        </DialogTitle>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* PREVISUALIZACIÓN DE FOTO */}
                            <div className="flex flex-col items-center bg-indigo-50 p-6 rounded-xl border-2 border-dashed border-indigo-200">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-xl flex items-center justify-center">
                                        {formData.PathFotoEmpleado ? (
                                            <img src={formData.PathFotoEmpleado} className="w-full h-full object-cover" alt="Perfil" />
                                        ) : (
                                            <div className="text-gray-300 text-xs font-black uppercase text-center">Sin Foto</div>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => fileInputRef.current.click()} className="absolute bottom-1 right-1 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 active:scale-90 transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </button>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                <p className="text-[10px] font-bold text-indigo-400 mt-3 uppercase tracking-tighter">Foto del Empleado</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <h3 className="md:col-span-3 font-bold text-gray-400 uppercase text-xs">Datos Personales</h3>
                                <Field label="Nombres" name="Nombres" value={formData.Nombres} onChange={handleChange} error={errors.Nombres} />
                                <Field label="Apellido Paterno" name="ApePat" value={formData.ApePat} onChange={handleChange} error={errors.ApePat} />
                                <Field label="Apellido Materno" name="ApeMat" value={formData.ApeMat} onChange={handleChange} error={errors.ApeMat} />
                                <Field label="RFC" name="RFC" value={formData.RFC} onChange={handleChange} error={errors.RFC} />
                                <Field label="CURP" name="Curp" value={formData.Curp} onChange={handleChange} error={errors.Curp} />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sexo</label>
                                    <select name="Sexo" value={formData.Sexo} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:ring-2 focus:ring-indigo-500">
                                        <option value="M">Masculino</option><option value="F">Femenino</option><option value="O">Otro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border">
                                <h3 className="md:col-span-3 font-bold text-indigo-700 uppercase text-xs">Domicilio</h3>
                                <Select label="Estado" name="IdEstado" value={formData.IdEstado} options={estados} onChange={handleChange} displayKey="descripcionEstado" valueKey="idEstado" />
                                <Select label="Municipio" name="IdMunicipio" value={formData.IdMunicipio} options={municipios.filter(m => String(m.idestado) === String(formData.IdEstado))} onChange={handleChange} displayKey="descripcionMunicipio" valueKey="idMunicipio" disabled={!formData.IdEstado} />
                                <Select label="Colonia" name="IdColonia" value={formData.IdColonia} options={colonias.filter(c => String(c.Colonia_IdMunicipio) === String(formData.IdMunicipio))} onChange={handleChange} displayKey="Colonia_Nombre" valueKey="Colonia_Id" disabled={!formData.IdMunicipio} />
                                <Field label="Calle" name="Calle" value={formData.Calle} onChange={handleChange} />
                                <Field label="Num. Exterior" name="CasaNum" value={formData.CasaNum} onChange={handleChange} />
                                <Field label="CP" name="CodigoPostal" value={formData.CodigoPostal} readOnly />
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                                <button type="button" onClick={closeModal} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all">Guardar Cambios</button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}

const Field = ({ label, name, value, onChange, type = "text", error, readOnly = false }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input type={type} name={name} value={value || ""} onChange={onChange} readOnly={readOnly}
            className={`w-full mt-1 border rounded p-2 text-sm transition-all ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'} ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
        {error && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{error[0]}</p>}
    </div>
);

const Select = ({ label, name, value, options, onChange, displayKey, valueKey, disabled = false }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <select name={name} value={value} onChange={onChange} disabled={disabled} className="w-full border border-gray-300 rounded p-2 text-sm mt-1 disabled:bg-gray-100">
            <option value="">Seleccione...</option>
            {options.map(o => <option key={o[valueKey]} value={o[valueKey]}>{o[displayKey]}</option>)}
        </select>
    </div>
);

export default function Personas() {
    const [data, setData] = useState([]);
    const [cats, setCats] = useState({ est: [], mun: [], col: [], pue: [] });
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ open: false, action: 'create', item: null });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resP, resE, resM, resC, resPue] = await Promise.all([
                fetch(route("personas.index")), fetch(route("estados.index")),
                fetch(route("municipios.index")), fetch(route("colonias.index")), fetch(route("puestos.index"))
            ]);
            const [p, e, m, c, pue] = await Promise.all([resP.json(), resE.json(), resM.json(), resC.json(), resPue.json()]);
            setData(p.data || []);
            setCats({ est: e, mun: m.data || m, col: c.data || c, pue: pue.data || pue });
        } catch (e) { toast.error("Error al cargar datos."); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSave = async (formData) => {
        const isEdit = !!formData.IdPersona;
        const url = isEdit ? route("personas.update", { IdPersona: formData.IdPersona }) : route("personas.store");
        await request(url, isEdit ? "PUT" : "POST", formData);
        toast.success("Operación exitosa");
        fetchData();
        setModal({ open: false });
    };

    return (
        <div className="relative h-full pb-4 px-3 overflow-auto bg-gray-50">
            {/* <div className="flex justify-between items-center p-4 border-b mb-6 bg-white sticky top-0 z-10 shadow-sm rounded-b-xl">
                <h2 className="text-2xl font-extrabold text-indigo-900">Catálogo de RH</h2>
                <button onClick={() => setModal({ open: true, action: 'create', item: null })} className="px-4 py-2 bg-[#A61A18] text-white rounded-lg font-bold shadow-md hover:opacity-90 transition-all">+ Nueva Persona</button>
            </div> */}

            {loading ? <div className="flex justify-center mt-20"><LoadingDiv /></div> : (
                <div className="bg-white rounded-xl shadow-md p-2">
                    <Datatable data={data} virtual={true}

                        add={() => {
                            // openCreateModal()
                            setModal({ open: true, action: 'create', item: null })
                        }}
                        columns={[

                            { header: 'Nombre Completo', cell: (p) => <span className="font-bold text-gray-700">{`${p.item.Nombres} ${p.item.ApePat}`}</span> },
                            { header: 'RFC', accessor: 'RFC' },
                            {
                                header: 'Acciones', cell: (p) => (
                                    <button onClick={() => setModal({ open: true, action: 'edit', item: p.item })} className="bg-indigo-500 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-bold transition-all">Editar</button>
                                )
                            }
                        ]} />
                </div>
            )}

            <PersonaFormDialog isOpen={modal.open} closeModal={() => setModal({ open: false })} action={modal.action} dataToEdit={modal.item} onSubmit={handleSave} estados={cats.est} municipios={cats.mun} colonias={cats.col} puestos={cats.pue} />
        </div>
    );
}