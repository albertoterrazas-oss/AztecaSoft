import { useEffect, useState, useMemo, useRef } from "react";
import { Dialog } from '@headlessui/react';
import { toast } from 'sonner';

// ⚠️ SOLUCIÓN AL TREE SHAKING: Importación explícita de todos los íconos
import {
    X, Search, ChevronLeft, ChevronRight, SquarePen, AlertCircle,
    Home, Settings, User, Menu, LogOut, Award, BarChart, Bell, Book,
    Car, Check, Clock, Code, CreditCard, Database, DollarSign, Download,
    Eye, Heart, Key, Lightbulb, Link, List, Lock, Mail, Map, Monitor,
    Moon, Phone, Plus, Power, Save, Star, Sun, Trash2, Truck, Upload,
    Users, Video, Volume2, Wallet, Layers, Filter, Anchor, Apple, Archive,
    Briefcase, Calendar, Camera, Cloud, Coffee, Construction, Droplet,
    Feather, FileText, FlaskConical, Folder, Gift, Globe, Hammer, Image,
    Info, Minus, MoreHorizontal, Move, Music, Package, Paperclip, Pause,
    PenTool, Pin, Plane, Printer, QrCode, Radar, Send, Server, Tablet,
    Tag, Terminal, ThumbsUp, ToggleLeft, Watch, Wifi, Zap, ZoomIn, ZoomOut
} from 'lucide-react';

import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

// ----------------------------------------------------
// I. UTILERÍAS GLOBALES Y DATOS INICIALES
// ----------------------------------------------------

/**
 * Función de ruteo simple. Espera el ID directamente para 'menus.update'.
 * @param {string} name - Nombre de la ruta.
 * @param {any} params - Parámetros (asume que es el ID para update).
 */
const route = (name, params = {}) => {
    // Si params es un objeto y tiene un id, lo usa, sino, asume que params es el id
    const id = (typeof params === 'object' && params !== null && params.id) ? params.id : params;

    const routeMap = {
        "menus.index": "/api/menus",
        "menus.store": "/api/menus",
        "menus.update": `/api/menus/${id}`,
    };
    return routeMap[name] || `/${name}`;
};

const menuValidations = {
    menu_nombre: true,
    menu_url: true,
    menu_estatus: true,
};

const validateInputs = (validations, data) => {
    let formErrors = {};
    if (validations.menu_nombre && !data.menu_nombre?.trim()) formErrors.menu_nombre = 'El nombre del menú es obligatorio.';
    if (validations.menu_url && !data.menu_url?.trim()) formErrors.menu_url = 'La URL es obligatoria.';
    // La validación de estatus ahora permite "1" o "0" (del checkbox)
    if (validations.menu_estatus && (data.menu_estatus !== "1" && data.menu_estatus !== "0")) formErrors.menu_estatus = 'El estatus es obligatorio.';
    return { isValid: Object.keys(formErrors).length === 0, errors: formErrors };
};

const initialMenuData = {
    menu_id: null,
    menu_nombre: "",
    menu_idPadre: 0, // null para "Raíz"
    menu_url: "",
    menu_tooltip: "Home", // ⬅️ USADO PARA GUARDAR EL NOMBRE DEL ÍCONO (ej: "Home")
    menu_estatus: "1",
};

/**
 * Mapeo de componentes para acceder a ellos por string.
 */
const ICON_COMPONENTS = {
    Home, Settings, User, Menu, LogOut, Award, BarChart, Bell, Book, Car,
    Check, Clock, Code, CreditCard, Database, DollarSign, Download, Eye, Heart,
    Key, Lightbulb, Link, List, Lock, Mail, Map, Monitor, Moon, Phone, Plus,
    Power, Save, Star, Sun, Trash2, Truck, Upload, Users, Video, Volume2,
    Wallet, Layers, Filter, Anchor, Apple, Archive, Briefcase, Calendar,
    Camera, Cloud, Coffee, Construction, Droplet, Feather, FileText, FlaskConical,
    Folder, Gift, Globe, Hammer, Image, Info, Minus, MoreHorizontal, Move,
    Music, Package, Paperclip, Pause, PenTool, Pin, Plane, Printer, QrCode,
    Radar, Send, Server, Tablet, Tag, Terminal, ThumbsUp, ToggleLeft, Watch,
    Wifi, Zap, ZoomIn, ZoomOut
};

const allIconNames = Object.keys(ICON_COMPONENTS);

// ----------------------------------------------------
// II. COMPONENTE: SELECTOR DE ÍCONOS EN CUADRÍCULA CON BÚSQUEDA Y PAGINACIÓN
// ----------------------------------------------------

function IconGridPickerModal({ isOpen, closeModal, onSelect, selectedIconName }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ICONS_PER_PAGE = 30;

    const filteredIcons = useMemo(() => {
        if (!searchTerm) return allIconNames;

        return allIconNames.filter(name =>
            name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredIcons.length / ICONS_PER_PAGE);
    const startIndex = (currentPage - 1) * ICONS_PER_PAGE;
    const currentIcons = filteredIcons.slice(startIndex, startIndex + ICONS_PER_PAGE);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);


    const handleIconClick = (name) => {
        onSelect(name); // Guarda el nombre del ícono
        closeModal();
    };

    const hasIconsLoaded = allIconNames.length > 0;

    return (
        <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
                    <div className="flex justify-between items-center border-b pb-3 mb-4">
                        <Dialog.Title className="text-xl font-bold text-gray-800">
                            Seleccionar Ícono ({filteredIcons.length} disponibles)
                        </Dialog.Title>
                        <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">
                            <X size={24} />
                        </button>
                    </div>

                    {hasIconsLoaded ? (
                        <>
                            {/* Buscador */}
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar ícono por nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>

                            {/* Cuadrícula de Íconos */}
                            <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-2 border rounded-lg">
                                {currentIcons.length > 0 ? (
                                    currentIcons.map((name) => {
                                        const IconComponent = ICON_COMPONENTS[name];
                                        const isSelected = name === selectedIconName;
                                        return (
                                            <div
                                                key={name}
                                                onClick={() => handleIconClick(name)}
                                                className={`flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer transition-all border-2 
                                                    ${isSelected ? 'border-blue-500 bg-blue-100 shadow-md' : 'border-gray-100 hover:bg-gray-50 hover:border-gray-300'}`}
                                                title={name}
                                            >
                                                <span className={`mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                                                    {IconComponent && <IconComponent size={24} />}
                                                </span>
                                                <span className="text-xs font-medium text-gray-600 truncate w-full text-center">
                                                    {name}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-6 text-center py-10 text-gray-500">
                                        No se encontraron íconos con el término "{searchTerm}".
                                    </div>
                                )}
                            </div>

                            {/* Paginación */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center mt-4 space-x-4">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-2 border rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <span className="text-sm font-medium text-gray-700">
                                        Página {currentPage} de {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-2 border rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-lg font-semibold text-red-700 mb-2">⚠️ Error de Carga de Librería</p>
                            <p className="text-sm text-red-600">
                                La lista de íconos (**lucide-react**) está vacía. Confirma la instalación y el reinicio del servidor.
                            </p>
                        </div>
                    )}

                </Dialog.Panel>
            </div>
        </Dialog>
    );
}

// Componente de Display
// Ahora recibe el nombre del ícono a través de selectedIconName, que será menu_tooltip
function IconDisplayField({ selectedIconName, onOpenModal, label = "Ícono Seleccionado:" }) {
    // Usamos el nombre del ícono para obtener el componente visual. Si no existe, usa AlertCircle.
    const iconName = selectedIconName && ICON_COMPONENTS.hasOwnProperty(selectedIconName) ? selectedIconName : "AlertCircle";
    const CurrentIcon = ICON_COMPONENTS[iconName];

    return (
        <div className="relative">
            <label className="text-sm font-medium text-gray-700 block mb-1">
                {label}
            </label>

            <div
                className="flex items-center justify-between rounded-md border border-gray-300 p-2 text-sm cursor-pointer hover:border-blue-500 transition-all"
                onClick={onOpenModal}
            >
                <div className="flex items-center">
                    <span className={`mr-3 ${selectedIconName ? 'text-blue-600' : 'text-gray-400'}`}>
                        {CurrentIcon ? <CurrentIcon size={20} /> : <AlertCircle size={20} />}
                    </span>
                    <span className="font-medium text-gray-700">
                        {selectedIconName || "(Ninguno/Inválido, haga click para seleccionar)"}
                    </span>
                </div>
                <SquarePen size={18} className="text-gray-500" />
            </div>
            <p className="text-xs mt-1 text-gray-500">Haz clic para buscar y seleccionar.</p>
        </div>
    );
}

// ----------------------------------------------------
// III. COMPONENTE: MODAL DEL FORMULARIO (MenuFormDialog)
// ----------------------------------------------------

function MenuFormDialog({ isOpen, closeModal, onSubmit, menuToEdit, action, errors, setErrors }) {
    const [menuData, setMenuData] = useState(initialMenuData);
    const [loading, setLoading] = useState(false);
    const [menus2, setMenus2] = useState(null);
    const [isIconModalOpen, setIsIconModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const dataToLoad = menuToEdit
                ? {
                    ...menuToEdit,
                    menu_nombre: menuToEdit.menu_nombre || "",
                    menu_idPadre: menuToEdit.menu_idPadre ? Number(menuToEdit.menu_idPadre) : 0,
                    menu_url: menuToEdit.menu_url || "",
                    menu_tooltip: menuToEdit.menu_tooltip || menuToEdit.menu_icono || "Home",
                    menu_estatus: String(menuToEdit.menu_estatus) === "1" ? "1" : "0",
                }
                : initialMenuData;

            setMenuData(dataToLoad);
            setErrors({});
            if (!menus2) fetchdata();
        }
    }, [isOpen, menuToEdit]);

    const fetchdata = async () => {
        try {
            const response = await fetch(route("menus.index"));
            const data = await response.json();
            setMenus2([{ menu_id: 0, menu_nombre: "Raíz" }].concat(data));
        } catch (e) {
            toast.error("Fallo al cargar menús padre.");
            setMenus2([]);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let finalValue = value;

        if (name === 'menu_idPadre') {
            finalValue = value === '0' ? null : Number(value);
        } else if (type === 'checkbox') {
            finalValue = checked ? "1" : "0";
        }

        setMenuData(prev => ({ ...prev, [name]: finalValue }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleIconSelect = (iconName) => {
        setMenuData(prev => ({ ...prev, menu_tooltip: iconName }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(menuData);
            closeModal();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const dialogTitle = action === 'create' ? 'Crear Nuevo Menú' : 'Editar Menú';

    return (
        <>
            <Dialog open={isOpen} onClose={closeModal} className="relative z-40">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    {/* relative y overflow-hidden son clave para el loading */}
                    <Dialog.Panel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl relative overflow-hidden">
                        
                        {/* LOADING OVERLAY: Se posiciona sobre todo el contenido del Panel */}
                        {loading && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                                <LoadingDiv />
                            </div>
                        )}

                        <Dialog.Title className="text-2xl font-bold mb-4 text-gray-900 border-b pb-2">
                            {dialogTitle}
                        </Dialog.Title>

                        {/* Añadimos opacidad visual al formulario cuando carga */}
                        <form onSubmit={handleSubmit} className={`grid grid-cols-1 gap-4 transition-opacity duration-200 ${loading ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                            <div className="space-y-3">
                                <label className="block">
                                    <span className="text-sm font-medium text-gray-700">Nombre: <span className="text-red-500">*</span></span>
                                    <input type="text" name="menu_nombre" value={menuData.menu_nombre} onChange={handleChange}
                                        className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.menu_nombre ? 'border-red-500' : 'border-gray-300'}`} />
                                    {errors.menu_nombre && <p className="text-red-500 text-xs mt-1">{errors.menu_nombre}</p>}
                                </label>

                                <label className="block">
                                    <span className="text-sm font-medium text-gray-700">URL: <span className="text-red-500">*</span></span>
                                    <input type="text" name="menu_url" value={menuData.menu_url} onChange={handleChange}
                                        className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.menu_url ? 'border-red-500' : 'border-gray-300'}`} />
                                    {errors.menu_url && <p className="text-red-500 text-xs mt-1">{errors.menu_url}</p>}
                                </label>

                                <label className="block">
                                    <span className="text-sm font-medium text-gray-700">Menú Padre:</span>
                                    <select name="menu_idPadre" value={menuData.menu_idPadre === null ? 0 : menuData.menu_idPadre} onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm">
                                        {(menus2 ?? []).map((menu) => {
                                            if (action === 'edit' && menu.menu_id === menuData.menu_id) return null;
                                            return <option key={menu.menu_id} value={menu.menu_id}>{menu.menu_id === 0 ? '— Raíz —' : menu.menu_nombre}</option>
                                        })}
                                    </select>
                                </label>

                                <IconDisplayField
                                    selectedIconName={menuData.menu_tooltip}
                                    onOpenModal={() => setIsIconModalOpen(true)}
                                    label="Ícono Seleccionado:"
                                />

                                <div className="flex justify-center pt-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" name="menu_estatus" checked={menuData.menu_estatus == "1"} onChange={handleChange}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                                        <span className="text-sm font-medium text-gray-700">Activo</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                    {action === 'create' ? 'Guardar' : 'Actualizar'}
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>

            <IconGridPickerModal
                isOpen={isIconModalOpen}
                closeModal={() => setIsIconModalOpen(false)}
                onSelect={handleIconSelect}
                selectedIconName={menuData.menu_tooltip}
            />
        </>
    );
}

// ----------------------------------------------------------------------
// IV. COMPONENTE PRINCIPAL (Menus)
// ----------------------------------------------------------------------

export default function Menus() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [menus, setMenus] = useState([]);
    const [action, setAction] = useState('create');
    const [menuData, setMenuData] = useState(initialMenuData);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const openCreateModal = () => {
        setAction('create');
        setMenuData(initialMenuData);
        setErrors({});
        setIsDialogOpen(true);
    };

    const openEditModal = (menu) => {
        setAction('edit');
        setMenuData(menu); // Pasa el objeto original, el modal lo mapeará y limpiará
        setErrors({});
        setIsDialogOpen(true);
    };

    const closeModal = () => {
        setIsDialogOpen(false);
        setMenuData(initialMenuData);
        setErrors({});
    };

    const submit = async (data) => {
        setErrors({});
        const validationResult = validateInputs(menuValidations, data);

        if (!validationResult.isValid) {
            setErrors(validationResult.errors);
            toast.error("Por favor, corrige los errores en el formulario.");
            throw new Error("Validation Failed");
        }

        const isEdit = !!data.menu_id;
        const ruta = isEdit ? route("menus.update", data.menu_id) : route("menus.store");
        const method = isEdit ? "PUT" : "POST";
        const successMessage = isEdit ? "Menú actualizado con éxito." : "Menú creado con éxito.";

        try {
            // Asegurarse de enviar null como ID Padre si es 0 (para la API)
            const dataToSend = {
                ...data,
                menu_idPadre: data.menu_idPadre === 0 ? 0 : data.menu_idPadre,
            }

            await request(ruta, method, dataToSend);
            await getMenus();
            toast.success(successMessage);
        } catch (error) {
            console.error("Error al guardar el menú:", error);
            // Si el error contiene un JSON de errores de validación de la API, se podría manejar aquí.
            toast.error("Hubo un error al guardar el menú.");
            throw error;
        }
    };

    const getMenus = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(route("menus.index"));
            if (!response.ok) throw new Error("Fallo al cargar menús");
            const data = await response.json();
            setMenus(data);
        } catch (error) {
            console.error('Error al obtener los menús:', error);
            toast.error("No se pudieron cargar los menús.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        getMenus()
    }, [])

    return (
        <div className="relative h-[100%] pb-4 px-3 overflow-auto blue-scroll">

            {isLoading ? (
                <div className='flex items-center justify-center h-[100%] w-full'> <LoadingDiv /> </div>

            ) : (
                <Datatable
                    data={menus}
                    virtual={true}
                     add={() => {
                        openCreateModal()
                    }}
                    columns={[
                        {
                            header: "Estatus",
                            width: "10%",
                            accessor: "menu_estatus",
                            cell: ({ item: { menu_estatus } }) => {
                                const isActive = String(menu_estatus) === "1";
                                const color = isActive
                                    ? "bg-green-500" // Color más fuerte para activo
                                    : "bg-red-500"; // Color más fuerte para inactivo

                                return (
                                    <span
                                        className={`inline-flex items-center justify-center rounded-full ${color} w-3 h-3 mx-auto`}
                                        title={isActive ? "Activo" : "Inactivo"}
                                    />
                                );
                            },
                        },
                        { header: 'Nombre', width: "20%", accessor: 'menu_nombre' },
                        { header: 'URL', width: "20%", accessor: 'menu_url' },

                        {
                            header: 'Menu padre', width: '20%', cell: ({ item }) => (
                                <span>{
                                    // Se recomienda simplificar esta lógica si la data no es consistente en el nivel de anidamiento.
                                    // Usando el nombre del padre inmediato si existe:
                                    item.menu_idPadre === null ? 'Raíz' : (item.menu_padre?.menu_nombre || 'Menú Padre No Encontrado')
                                    // La lógica original es más compleja:
                                    // `${item.menu_padre?.menu_padre?.menu_nombre ? '/ ' + item.menu_padre?.menu_padre?.menu_nombre : ''} ${item.menu_padre?.menu_nombre ? '/ ' + item.menu_padre?.menu_nombre : '/'}`
                                }</span>
                            )
                        },
                        {
                            header: 'Icono (Tooltip)',
                            accessor: 'menu_tooltip',
                            width: "10%",
                            // 1. Center the Header Text
                            headerClassName: 'text-center',
                            cell: ({ item: { menu_tooltip } }) => {
                                const IconComponent = ICON_COMPONENTS[menu_tooltip] || AlertCircle;
                                return (
                                    // 2. Center the Cell Content (the Icon)
                                    <div className="flex justify-center items-center h-full">
                                        {IconComponent ? <IconComponent size={20} className="text-gray-600" /> : <AlertCircle size={20} className="text-red-500" />}
                                    </div>
                                );
                            }
                        },
                        {
                            header: "Acciones", width: "10%", accessor: "Acciones", cell: (eprops) => (<>
                                <button
                                    onClick={() => openEditModal(eprops.item)}
                                    className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition"
                                >
                                    Editar
                                </button>
                            </>)
                        },
                    ]}
                />
            )}

            <MenuFormDialog
                isOpen={isDialogOpen}
                closeModal={closeModal}
                onSubmit={submit}
                menuToEdit={menuData}
                action={action}
                errors={errors}
                setErrors={setErrors}
            />

        </div>
    );
}