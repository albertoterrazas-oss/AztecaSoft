import { useEffect, useState } from "react";
import { Switch } from '@headlessui/react'; // Asegúrate de agregarlo a tus imports
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";
import axios from "axios";
import { Pencil, Box } from "lucide-react";
import Datatable from "@/Components/Datatable";

// Función de rutas centralizada
const route = (name, params = {}) => {
    const id = params.id;
    const routeMap = {
        "CajasListar": "/api/cajas",
        "cajas.store": "/api/cajas",
        "cajas.update": `/api/cajas/${id}`,
    };
    return routeMap[name] || `/${name}`;
};

export default function CajasCatalogo() {
    const [cajas, setCajas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentCaja, setCurrentCaja] = useState(null);
    const [action, setAction] = useState('create');

    const getCajas = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(route("CajasListar"));
            setCajas(response.data);
        } catch (error) {
            toast.error("Error al cargar el listado");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { getCajas(); }, []);

    const openModal = (item = null) => {
        setCurrentCaja(item);
        setAction(item ? 'edit' : 'create');
        setIsDialogOpen(true);
    };

    const submitCaja = async (formData) => {
        const isEdit = action === 'edit';
        const method = isEdit ? "PUT" : "POST";

        // CORRECCIÓN: Aquí es donde se pasaba el undefined. 
        // Usamos formData.IdCaja para construir la URL de edición.
        const ruta = isEdit
            ? route("cajas.update", { id: formData.IdTipoCaja })
            : route("cajas.store");

        try {
            await request(ruta, method, formData);
            toast.success(`Registro ${isEdit ? 'actualizado' : 'guardado'} con éxito`);
            getCajas();
            setIsDialogOpen(false);
        } catch (e) {
            console.error(e);
            toast.error("Error al procesar la solicitud");
        }
    };

    return (
        <div className="w-full p-4 md:p-8 h-full">
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6">
                    {isLoading ? <LoadingDiv /> : (
                        <Datatable
                            data={cajas}
                            virtual={true}
                            add={() => openModal()}
                            columns={[
                                {
                                    header: "Estatus",
                                    accessor: "Estatus",
                                    cell: ({ item: { Estatus } }) => (
                                        <div className="flex justify-center">
                                            <span className={`inline-flex items-center justify-center rounded-full w-4 h-4 shadow-sm ${Number(Estatus) === 1 ? "bg-green-400" : "bg-red-400"}`} />
                                        </div>
                                    ),
                                },
                                { header: 'Nombre', accessor: 'Nombre' },
                                { header: 'Tara', accessor: 'Tara', cell: (p) => `${p.item.Tara} kg` },
                                {
                                    header: "Acciones",
                                    cell: (props) => (
                                        <button
                                            onClick={() => openModal(props.item)}
                                            className="p-2 bg-slate-100 rounded-lg hover:bg-[#1B2654] hover:text-white transition-all"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    )
                                },
                            ]}
                        />
                    )}
                </div>
            </div>

            <CajaFormDialog
                isOpen={isDialogOpen}
                closeModal={() => setIsDialogOpen(false)}
                onSubmit={submitCaja}
                dataToEdit={currentCaja}
                action={action}
            />
        </div>
    );
}

function CajaFormDialog({ isOpen, closeModal, onSubmit, dataToEdit, action }) {
    const initialState = {
        Nombre: "",
        Tara: "",
        Estatus: 1
    };

    const [formData, setFormData] = useState(initialState);
    const [saving, setSaving] = useState(false);

    // Sincronizar el formulario con los datos a editar
    useEffect(() => {
        if (isOpen) {
            setFormData(dataToEdit ? { ...dataToEdit } : initialState);
        }
    }, [isOpen, dataToEdit]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        // Preparamos el objeto para enviar
        const payload = {
            ...formData, // Esto mantiene el IdCaja original para la función submitCaja
            Nombre: formData.Nombre,
            Tara: parseFloat(formData.Tara),
            Estatus: parseInt(formData.Estatus)
        };

        try {
            await onSubmit(payload);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Transition show={isOpen}>
            <Dialog onClose={closeModal} className="relative z-[100]">
                <TransitionChild
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl relative">
                        <DialogTitle className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2 uppercase">
                            <Box className="text-blue-600" /> {action === 'create' ? 'Crear' : 'Editar'} Caja
                        </DialogTitle>

                        <form onSubmit={handleSave} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.Nombre || ""}
                                    onChange={e => setFormData({ ...formData, Nombre: e.target.value })}
                                    className="w-full mt-1 px-5 py-3 rounded-2xl bg-gray-100 border-none font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tara (kg)</label>
                                <input
                                    type="number" step="0.001"
                                    value={formData.Tara || ""}
                                    onChange={e => setFormData({ ...formData, Tara: e.target.value })}
                                    className="w-full mt-1 px-5 py-3 rounded-2xl bg-gray-100 border-none font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
                                    required
                                />
                            </div>

                            {/* <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estatus</label>
                                <select
                                    value={formData.Estatus}
                                    onChange={e => setFormData({ ...formData, Estatus: e.target.value })}
                                    className="w-full mt-1 px-5 py-3 rounded-2xl bg-gray-100 border-none font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
                                >
                                    <option value={1}>Activo</option>
                                    <option value={0}>Inactivo</option>
                                </select>
                            </div> */}

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-2">
                                    Estatus
                                </label>
                                <div className="flex items-center gap-3 bg-gray-100 p-4 rounded-2xl">
                                    <Switch
                                        checked={Number(formData.Estatus) === 1}
                                        onChange={(checked) => setFormData({ ...formData, Estatus: checked ? 1 : 0 })}
                                        className={`${Number(formData.Estatus) === 1 ? 'bg-blue-600' : 'bg-gray-300'
                                            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                                    >
                                        <span
                                            className={`${Number(formData.Estatus) === 1 ? 'translate-x-6' : 'translate-x-1'
                                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                        />
                                    </Switch>
                                    <span className="text-sm font-bold text-gray-700">
                                        {Number(formData.Estatus) === 1 ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="flex-1 py-4 text-gray-400 font-bold text-xs uppercase hover:text-gray-600">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Guardando...' : 'Confirmar'}
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}