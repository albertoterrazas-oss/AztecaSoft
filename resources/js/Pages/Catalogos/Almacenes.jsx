import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";
import { Building2, Fingerprint, Save, UserPlus, Pencil, Building } from "lucide-react";
import Datatable from "@/Components/Datatable";
// --- Configuración de Rutas ---
const route = (name, params = {}) => {
    const id = params.id;
    const routeMap = {
        "AlmacenesListar": "/api/almacenes",
        "almacenes.store": "/api/almacenes",
        "almacenes.update": `/api/almacenes/${id}`,
    };
    return routeMap[name] || `/${name}`;
};

// --- Componente Principal ---
export default function AlmacenesRefrigerador() {
    const [almacenes, setAlmacenes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentAlmacen, setCurrentAlmacen] = useState({ IdAlmacen: null, Nombre: "", Tipo: "" });
    const [action, setAction] = useState('create');

    const getAlmacenes = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(route("AlmacenesListar"));
            const data = await response.json();
            setAlmacenes(data);
        } catch (error) {
            toast.error("Error al cargar los estantes");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { getAlmacenes(); }, []);

    const openModal = (item = { IdAlmacen: null, Nombre: "", Tipo: "" }) => {
        setCurrentAlmacen(item);
        setAction(item.IdAlmacen ? 'edit' : 'create');
        setIsDialogOpen(true);
    };

    const submitAlmacen = async (formData) => {
        const isEdit = !!formData.IdAlmacen;
        const method = isEdit ? "PUT" : "POST";
        const ruta = isEdit ? route("almacenes.update", { id: formData.IdAlmacen }) : route("almacenes.store");

        try {
            await request(ruta, method, formData);
            toast.success("Almacén guardado");
            getAlmacenes();
            setIsDialogOpen(false);
        } catch (e) {
            toast.error("Error al guardar");
        }
    };

    return (
        <div className="w-full  h-[100%]p-4 md:p-8">
            <div className="px-6 pb-12">
                {isLoading ? (
                    <div className="h-96 flex items-center justify-center"><LoadingDiv /></div>
                ) : (
                    <Datatable
                        data={almacenes}
                        virtual={true}
                        add={() => {
                            openModal()
                        }}
                        columns={[
                            { header: 'Nombre', accessor: 'Nombre' },
                            { header: 'Tipo', accessor: 'Tipo' },
                            {
                                header: "Acciones",
                                cell: (props) => (
                                    <button
                                        onClick={() => openModal(props.item)}
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

            {/* Modal de Formulario */}
            <AlmacenFormDialog
                isOpen={isDialogOpen}
                closeModal={() => setIsDialogOpen(false)}
                onSubmit={submitAlmacen}
                dataToEdit={currentAlmacen}
                action={action}
            />
        </div>
    );
}

function AlmacenFormDialog({ isOpen, closeModal, onSubmit, dataToEdit, action }) {
    const [formData, setFormData] = useState({ Nombre: "", Tipo: "ALMACEN" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) setFormData({
            IdAlmacen: dataToEdit?.IdAlmacen || null,
            Nombre: dataToEdit?.Nombre || "",
            Tipo: "ALMACEN"
        });
    }, [isOpen, dataToEdit]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try { await onSubmit(formData); } finally { setSaving(false); }
    };

    return (
        <Transition show={isOpen}>
            <Dialog onClose={closeModal} className="relative z-[100]">
                <TransitionChild enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-md" />
                </TransitionChild>
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden border-t-8 border-[#1B2654]">
                        {saving && <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center"><LoadingDiv /></div>}
                        <DialogTitle className="text-2xl font-black text-gray-800 mb-6 uppercase tracking-tighter">
                            {action === 'create' ? 'Nuevo Almacén' : 'Ajustar Almacén'}
                        </DialogTitle>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre del almacen</label>
                                <input
                                    type="text"
                                    value={formData.Nombre}
                                    onChange={e => setFormData({ ...formData, Nombre: e.target.value })}
                                    className="w-full mt-1 px-5 py-4 rounded-2xl bg-gray-100 border-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700"
                                    placeholder="Ej: SECTOR CARNICOS"
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={closeModal} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase hover:text-gray-600 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-blue-200 hover:bg-[#1B2654] transition-all">Confirmar</button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}