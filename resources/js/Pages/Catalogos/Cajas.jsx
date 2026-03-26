import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";
import axios from "axios";
import { Pencil, Box } from "lucide-react";
import Datatable from "@/Components/Datatable";

// --- Configuración de Rutas ---
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
    const [almacenes, setAlmacenes] = useState([]); // Para el selector de almacén
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentCaja, setCurrentCaja] = useState(null);
    const [action, setAction] = useState('create');

    // Cargar Cajas
    const getCajas = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(route("CajasListar"));
            const data = await response.json();
            setCajas(data);
        } catch (error) {
            toast.error("Error al cargar el listado de cajas");
        } finally {
            setIsLoading(false);
        }
    };

    // Cargar Almacenes (para asignar a la caja)
    const fetchAlmacenes = async () => {
        try {
            const response = await axios.get('/api/almacenes');
            setAlmacenes(response.data);
        } catch (error) {
            console.error("Error cargando almacenes");
        }
    };

    useEffect(() => {
        getCajas();
        fetchAlmacenes();
    }, []);

    const openModal = (item = null) => {
        setCurrentCaja(item);
        setAction(item ? 'edit' : 'create');
        setIsDialogOpen(true);
    };

    const submitCaja = async (formData) => {
        const isEdit = action === 'edit';
        const method = isEdit ? "PUT" : "POST";
        const ruta = isEdit
            ? route("cajas.update", { id: formData.IdCaja })
            : route("cajas.store");

        try {
            await request(ruta, method, formData);
            toast.success(`Caja ${isEdit ? 'actualizada' : 'registrada'} con éxito`);
            getCajas();
            setIsDialogOpen(false);
        } catch (e) {
            toast.error("Error al procesar la solicitud");
        }
    };

    return (
        <div className="w-full p-4 md:p-8">
            <div className="px-6 pb-12">
                {isLoading ? (
                    <div className="h-96 flex items-center justify-center"><LoadingDiv /></div>
                ) : (
                    <Datatable
                        data={cajas}
                        virtual={true}
                        add={() => openModal()}
                        columns={[
                            {
                                header: "Estatus",
                                accessor: "estatus",
                                width: '10%',
                                cell: ({ item: { Estatus } }) => {
                                    const isActivo = String(Estatus) === "1";
                                    const color = isActivo ? "bg-green-300" : "bg-red-300";

                                    return (
                                        <span className={`inline-flex items-center justify-center rounded-full ${color} w-3 h-3`}
                                            title={isActivo ? "Activo" : "Inactivo"}
                                        />
                                    );
                                },
                            },
                            { header: 'Folio', accessor: 'FolioCaja' },
                            { header: 'No. Caja', accessor: 'NumCaja' },
                            { header: 'Peso', accessor: 'PesoTotal', cell: (p) => `${p.item.PesoTotal} kg` },
                            { header: 'Piezas', accessor: 'PiezasTotales' },
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

            <CajaFormDialog
                isOpen={isDialogOpen}
                closeModal={() => setIsDialogOpen(false)}
                onSubmit={submitCaja}
                dataToEdit={currentCaja}
                action={action}
                almacenes={almacenes}
            />
        </div>
    );
}

// --- Componente del Diálogo ---
function CajaFormDialog({ isOpen, closeModal, onSubmit, dataToEdit, action, almacenes }) {
    const initialState = {
        FolioCaja: "",
        NumCaja: "",
        IdAlmacenActual: "",
        PesoTotal: 0,
        PiezasTotales: 0,
        Estatus: 1,
        IdUsuario: JSON.parse(localStorage.getItem('perfil'))?.IdUsuario || 1
    };


    const [formData, setFormData] = useState(initialState);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(dataToEdit ? { ...dataToEdit } : initialState);
        }
    }, [isOpen, dataToEdit]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSubmit(formData);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Transition show={isOpen}>
            <Dialog onClose={closeModal} className="relative z-[100]">
                <TransitionChild
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-md" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-2xl bg-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden border-t-8 border-[#1B2654]">
                        {saving && (
                            <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center">
                                <LoadingDiv />
                            </div>
                        )}

                        <DialogTitle className="text-2xl font-black text-gray-800 mb-6 uppercase tracking-tighter flex items-center gap-2">
                            <Box className="text-blue-600" />
                            {action === 'create' ? 'Nueva Caja' : 'Editar Caja'}
                        </DialogTitle>

                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Folio */}


                            {/* Numero de Caja */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Número de Caja</label>
                                <input
                                    type="number"
                                    value={formData.NumCaja}
                                    onChange={e => setFormData({ ...formData, NumCaja: e.target.value })}
                                    className="w-full mt-1 px-5 py-3 rounded-2xl bg-gray-100 border-none font-bold text-gray-700"
                                    required
                                />
                            </div>

                            {/* Almacén */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ubicación Actual</label>
                                <select
                                    value={formData.IdAlmacenActual}
                                    onChange={e => setFormData({ ...formData, IdAlmacenActual: e.target.value })}
                                    className="w-full mt-1 px-5 py-3 rounded-2xl bg-gray-100 border-none font-bold text-gray-700"
                                    required
                                >
                                    <option value="">Seleccione Almacén...</option>
                                    {almacenes.map(a => <option key={a.IdAlmacen} value={a.IdAlmacen}>{a.Nombre}</option>)}
                                </select>
                            </div>

                            {/* Estatus */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estatus</label>
                                <select
                                    value={formData.Estatus}
                                    onChange={e => setFormData({ ...formData, Estatus: parseInt(e.target.value) })}
                                    className="w-full mt-1 px-5 py-3 rounded-2xl bg-gray-100 border-none font-bold text-gray-700"
                                >
                                    <option value={1}>Activo</option>
                                    <option value={0}>Inactivo</option>
                                </select>
                            </div>

                            {/* Peso Total */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Peso Total (kg)</label>
                                <input
                                    type="number" step="0.01"
                                    value={formData.PesoTotal}
                                    onChange={e => setFormData({ ...formData, PesoTotal: e.target.value })}
                                    className="w-full mt-1 px-5 py-3 rounded-2xl bg-gray-100 border-none font-bold text-gray-700"
                                    required
                                />
                            </div>

                            {/* Piezas Totales */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Piezas Totales</label>
                                <input
                                    type="number"
                                    value={formData.PiezasTotales}
                                    onChange={e => setFormData({ ...formData, PiezasTotales: e.target.value })}
                                    className="w-full mt-1 px-5 py-3 rounded-2xl bg-gray-100 border-none font-bold text-gray-700"
                                    required
                                />
                            </div>

                            {/* Botones */}
                            <div className="md:col-span-2 flex gap-4 pt-4">
                                <button type="button" onClick={closeModal} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase hover:text-gray-600">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-[#1B2654] transition-all">
                                    Guardar Caja
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}