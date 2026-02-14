import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

// --- Configuración de Rutas ---
const getRoute = (name, id = null) => {
    const routeMap = {
        "productos.index": "/api/productos",
        "productos.store": "/api/productos",
        "productos.update": `/api/productos/${id}`,
    };
    return routeMap[name];
};

const userObject = JSON.parse(localStorage.getItem('user') || '{}');

const initialProductData = {
    IdProducto: null,
    Nombre: "",
    UnidadMedida: "Pieza",
    EsSubproducto: 0,
    idUsuario: userObject.IdUsuario,
};

// --- Formulario Modal ---
function ProductFormDialog({ isOpen, closeModal, onSubmit, productToEdit, action, errors, setErrors }) {
    const [productData, setProductData] = useState(initialProductData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Si vamos a editar, cargamos el producto, si no, reseteamos al estado inicial
            setProductData(productToEdit || initialProductData);
            setErrors({});
        }
    }, [isOpen, productToEdit, setErrors]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? (checked ? 1 : 0) : value;
        setProductData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(productData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={isOpen}>
            <Dialog onClose={closeModal} className="relative z-50">
                <TransitionChild
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl relative">
                        {loading && <LoadingDiv />}
                        <DialogTitle className="text-xl font-bold mb-4 border-b pb-2">
                            {action === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
                        </DialogTitle>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
                                <input
                                    type="text"
                                    name="Nombre"
                                    value={productData.Nombre}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border p-2 ${errors.Nombre ? 'border-red-500' : 'border-gray-300'}`}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Unidad de Medida</label>
                                <select
                                    name="UnidadMedida"
                                    value={productData.UnidadMedida}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                >
                                    <option value="Pieza">Pieza</option>
                                    <option value="Kilo">Kilo</option>
                                    <option value="Litro">Litro</option>
                                    <option value="Metro">Metro</option>
                                </select>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    name="EsSubproducto"
                                    id="EsSubproducto"
                                    checked={Number(productData.EsSubproducto) === 1}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                />
                                <label htmlFor="EsSubproducto" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    ¿Es un subproducto?
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm bg-gray-100 rounded-md">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                    {action === 'create' ? 'Guardar' : 'Actualizar'}
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}

// --- Vista Principal ---
export default function Productos() {
    const [products, setProducts] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(initialProductData);
    const [action, setAction] = useState('create');
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState({});

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(getRoute("productos.index"));
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            toast.error("Error al cargar productos");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openCreate = () => {
        setCurrentProduct(initialProductData);
        setAction('create');
        setIsDialogOpen(true);
    };

    const openEdit = (item) => {
        setCurrentProduct(item);
        setAction('edit');
        setIsDialogOpen(true);
    };

    const handleSubmit = async (data) => {
        const isEdit = action === 'edit';

        // URL dinámica basada en la acción
        const url = isEdit
            ? getRoute("productos.update", data.IdProducto)
            : getRoute("productos.store");

        /**
         * NOTA IMPORTANTE PARA LARAVEL:
         * Usamos POST siempre y enviamos "_method: PUT" en el body.
         * Esto evita errores de "Method Not Allowed" en muchos servidores y configuraciones de Laravel.
         */
        const method = "POST";
        const payload = isEdit
            ? { ...data, _method: 'PUT' }
            : data;

        try {
            await request(url, method, payload);
            toast.success(isEdit ? "Producto actualizado" : "Producto creado");
            fetchData();
            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Error al procesar la solicitud");
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
        }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Catálogo de Productos</h2>
                <button onClick={openCreate}
                    className="flex items-center px-4 py-2 text-base font-semibold text-white rounded-lg shadow-md  transition duration-150 ease-in-out"
                    style={{ backgroundColor: '#A61A18' }}
                >
                    + Nuevo Producto
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10"><LoadingDiv /></div>
            ) : (
                <Datatable
                    data={products}
                    virtual={true}
                    columns={[
                        { header: 'Nombre', accessor: 'Nombre' },
                        { header: 'U. Medida', accessor: 'UnidadMedida' },
                        {
                            header: 'Tipo',
                            accessor: 'EsSubproducto',
                            cell: ({ item }) => (
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.EsSubproducto ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {item.EsSubproducto ? 'Subproducto' : 'Producto'}
                                </span>
                            )
                        },
                        {
                            header: 'Fecha Reg.',
                            accessor: 'fecha',
                            cell: ({ item }) => item.fecha ? new Date(item.fecha).toLocaleDateString() : 'N/A'
                        },
                        {
                            header: "Acciones",
                            accessor: "Acciones",
                            cell: (eprops) => (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => openEdit(eprops.item)}
                                        className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                                    >
                                        Editar
                                    </button>
                                </div>
                            )
                        },
                    ]}
                />
            )}

            <ProductFormDialog
                isOpen={isDialogOpen}
                closeModal={() => setIsDialogOpen(false)}
                onSubmit={handleSubmit}
                productToEdit={currentProduct}
                action={action}
                errors={errors}
                setErrors={setErrors}
            />
        </div>
    );
}