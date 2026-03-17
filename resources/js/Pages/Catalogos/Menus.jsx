import { useEffect, useState, useMemo, Fragment } from "react";
import { toast } from 'sonner';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
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
    Tag, Terminal, ThumbsUp, ToggleLeft, Watch, Wifi, Zap, ZoomIn, ZoomOut, Pencil
} from 'lucide-react';

import Datatable from "@/Components/Datatable";
import LoadingDiv from "@/Components/LoadingDiv";
import request from "@/utils";

// ----------------------------------------------------
// I. UTILERÍAS Y CONSTANTES
// ----------------------------------------------------

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

const route = (name, params = {}) => {
    const id = (typeof params === 'object' && params !== null && params.id) ? params.id : params;
    const routeMap = {
        "menus.index": "/api/menus",
        "menus.store": "/api/menus",
        "menus.update": `/api/menus/${id}`,
    };
    return routeMap[name] || `/${name}`;
};

// Ícono inicial como null para que no fuerce "Home" si no quieres
const initialMenuData = {
    menu_id: null,
    menu_nombre: "",
    menu_idPadre: 0,
    menu_url: "",
    menu_tooltip: null, 
    menu_estatus: "1",
};

// ----------------------------------------------------
// II. COMPONENTE: MODAL SELECTOR DE ÍCONOS
// ----------------------------------------------------

function IconGridPickerModal({ isOpen, closeModal, onSelect, selectedIconName }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ICONS_PER_PAGE = 24;

    const filteredIcons = useMemo(() => {
        return allIconNames.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredIcons.length / ICONS_PER_PAGE);
    const currentIcons = filteredIcons.slice((currentPage - 1) * ICONS_PER_PAGE, currentPage * ICONS_PER_PAGE);

    useEffect(() => { if (isOpen) { setSearchTerm(''); setCurrentPage(1); } }, [isOpen]);

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={closeModal} className="relative z-[110]">
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <DialogPanel className="w-full max-w-xl bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-200">
                            <div className="flex justify-between items-center mb-6">
                                <DialogTitle className="text-xl font-black text-slate-800 uppercase tracking-tighter">Explorar Íconos</DialogTitle>
                                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
                            </div>

                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-[#1B2654] font-bold text-slate-600 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-4 max-h-80 overflow-y-auto p-2 blue-scroll">
                                {/* Opción para dejar sin icono */}
                                <button
                                    type="button"
                                    onClick={() => { onSelect(null); closeModal(); }}
                                    className={`flex flex-col items-center p-4 rounded-3xl transition-all border-2 ${!selectedIconName ? 'border-[#1B2654] bg-slate-50' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}
                                >
                                    <Minus size={28} className="text-slate-300" />
                                    <span className="text-[9px] mt-2 font-black text-slate-500 uppercase">Ninguno</span>
                                </button>

                                {currentIcons.map((name) => {
                                    const Icon = ICON_COMPONENTS[name];
                                    const isSelected = name === selectedIconName;
                                    return (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => { onSelect(name); closeModal(); }}
                                            className={`flex flex-col items-center p-4 rounded-3xl transition-all border-2 ${isSelected ? 'border-[#1B2654] bg-slate-50' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}
                                        >
                                            <Icon size={28} className={isSelected ? 'text-[#A61A18]' : 'text-slate-600'} />
                                            <span className="text-[9px] mt-2 font-black text-slate-500 uppercase truncate w-full text-center">{name}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 disabled:opacity-30"><ChevronLeft /></button>
                                <span className="text-xs font-black text-slate-400 uppercase">Página {currentPage} de {totalPages || 1}</span>
                                <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 disabled:opacity-30"><ChevronRight /></button>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}

// ----------------------------------------------------
// III. COMPONENTE: MODAL FORMULARIO (MenuFormDialog)
// ----------------------------------------------------

function MenuFormDialog({ isOpen, closeModal, onSubmit, menuToEdit, action, errors, setErrors }) {
    const [menuData, setMenuData] = useState(initialMenuData);
    const [loading, setLoading] = useState(false);
    const [menus2, setMenus2] = useState([]);
    const [isIconModalOpen, setIsIconModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMenuData(menuToEdit ? {
                ...menuToEdit,
                menu_idPadre: menuToEdit.menu_idPadre ? Number(menuToEdit.menu_idPadre) : 0,
                menu_tooltip: menuToEdit.menu_tooltip || null, // Respetamos el null
                menu_estatus: String(menuToEdit.menu_estatus) === "1" ? "1" : "0",
            } : initialMenuData);
            setErrors({});
            fetchData();
        }
    }, [isOpen, menuToEdit]);

    const fetchData = async () => {
        try {
            const response = await fetch(route("menus.index"));
            const data = await response.json();
            setMenus2([{ menu_id: 0, menu_nombre: "Raíz" }, ...data]);
        } catch (e) { toast.error("Error al cargar padres."); }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let finalValue = type === 'checkbox' ? (checked ? "1" : "0") : value;
        if (name === 'menu_idPadre') finalValue = value === '0' ? 0 : Number(value);
        setMenuData(prev => ({ ...prev, [name]: finalValue }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try { await onSubmit(menuData); closeModal(); } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    return (
        <>
            <Transition show={isOpen} as={Fragment}>
                <Dialog onClose={closeModal} className="relative z-[100]">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" />
                    </TransitionChild>

                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <DialogPanel className="w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden border-b-[12px] border-[#1B2654]">
                                {loading && <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm"><LoadingDiv /></div>}

                                <div className="flex flex-col items-center mb-8">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-[#A61A18] mb-4 shadow-inner">
                                        <Menu size={32} />
                                    </div>
                                    <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                                        {action === 'create' ? 'Nuevo Acceso' : 'Editar Menú'}
                                    </DialogTitle>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Navegación del Sistema</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Etiqueta del Menú *</label>
                                        <input type="text" name="menu_nombre" value={menuData.menu_nombre} onChange={handleChange} placeholder="Ej: DASHBOARD" className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none ${errors.menu_nombre ? 'border-red-500' : 'border-transparent focus:border-[#1B2654] focus:bg-white'}`} />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Ruta de Enlace (URL) *</label>
                                        <input type="text" name="menu_url" value={menuData.menu_url} onChange={handleChange} placeholder="/admin/home" className={`w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 transition-all font-bold text-slate-700 outline-none ${errors.menu_url ? 'border-red-500' : 'border-transparent focus:border-[#1B2654] focus:bg-white'}`} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Ubicación</label>
                                            <select name="menu_idPadre" value={menuData.menu_idPadre} onChange={handleChange} className="w-full px-4 py-4 rounded-2xl bg-slate-100 border-2 border-transparent focus:border-[#1B2654] font-bold text-slate-700 outline-none">
                                                {menus2.map(m => (
                                                    (action === 'edit' && m.menu_id === menuData.menu_id) ? null : <option key={m.menu_id} value={m.menu_id}>{m.menu_nombre.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-center pt-5">
                                            <label className="group flex items-center space-x-3 cursor-pointer">
                                                <div className="relative">
                                                    <input type="checkbox" name="menu_estatus" checked={menuData.menu_estatus === "1"} onChange={handleChange} className="sr-only peer" />
                                                    <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-green-500 transition-colors shadow-inner"></div>
                                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-md"></div>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Activo</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-3xl border-2 border-dashed border-slate-200">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Ícono Seleccionado</label>
                                        <div onClick={() => setIsIconModalOpen(true)} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-[#1B2654] transition-all shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="text-[#1B2654]">
                                                    {menuData.menu_tooltip && ICON_COMPONENTS[menuData.menu_tooltip] ?
                                                        (() => { const Icon = ICON_COMPONENTS[menuData.menu_tooltip]; return <Icon size={20} />; })()
                                                        : <Minus size={20} className="text-slate-300" />}
                                                </div>
                                                <span className="font-bold text-slate-700 text-sm uppercase">
                                                    {menuData.menu_tooltip || "Sin Ícono"}
                                                </span>
                                            </div>
                                            <SquarePen size={16} className="text-slate-400" />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={closeModal} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase hover:text-slate-600 transition-colors">Cancelar</button>
                                        <button type="submit" className="flex-[2] py-4 bg-[#1B2654] text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-[#A61A18] transition-all">
                                            {action === 'create' ? 'Guardar Menú' : 'Actualizar Cambios'}
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </Dialog>
            </Transition>

            <IconGridPickerModal
                isOpen={isIconModalOpen}
                closeModal={() => setIsIconModalOpen(false)}
                onSelect={(name) => setMenuData(prev => ({ ...prev, menu_tooltip: name }))}
                selectedIconName={menuData.menu_tooltip}
            />
        </>
    );
}

// ----------------------------------------------------
// IV. COMPONENTE PRINCIPAL (Menus)
// ----------------------------------------------------

export default function Menus() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [menus, setMenus] = useState([]);
    const [action, setAction] = useState('create');
    const [menuData, setMenuData] = useState(initialMenuData);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const getMenus = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(route("menus.index"));
            const data = await response.json();
            setMenus(data);
        } catch (error) { toast.error("No se pudieron cargar los menús."); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { getMenus(); }, []);

    const submit = async (data) => {
        if (!data.menu_nombre?.trim() || !data.menu_url?.trim()) {
            setErrors({ menu_nombre: !data.menu_nombre ? 'Requerido' : '', menu_url: !data.menu_url ? 'Requerido' : '' });
            throw new Error("Validation Failed");
        }

        const isEdit = !!data.menu_id;
        const method = isEdit ? "PUT" : "POST";
        const url = isEdit ? route("menus.update", data.menu_id) : route("menus.store");

        await request(url, method, data);
        await getMenus();
        toast.success(isEdit ? "Actualizado correctamente" : "Creado correctamente");
    };

    return (
        <div className="relative h-full pb-4 px-3 overflow-auto blue-scroll">
            {isLoading ? <div className='flex items-center justify-center h-full w-full'><LoadingDiv /></div> : (
                <Datatable
                    data={menus}
                    virtual={true}
                    add={() => { setAction('create'); setMenuData(initialMenuData); setIsDialogOpen(true); }}
                    columns={[
                        {
                            header: "Estatus",
                            accessor: "menu_estatus",
                            cell: ({ item }) => (
                                <div className="flex justify-center">
                                    <div className={`w-3 h-3 rounded-full ${String(item.menu_estatus) === "1" ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                                </div>
                            )
                        },
                        { header: 'Nombre', accessor: 'menu_nombre' },
                        { header: 'URL', accessor: 'menu_url' },
                        {
                            header: 'Padre',
                            cell: ({ item }) => (<span>{item.menu_idPadre === 0 || item.menu_idPadre === null ? 'Raíz' : (item.menu_padre?.menu_nombre || '...')}</span>)
                        },
                        {
                            header: 'Ícono',
                            headerClassName: 'text-center',
                            cell: ({ item }) => {
                                // Blindamos la celda de la tabla
                                const Icon = item.menu_tooltip ? ICON_COMPONENTS[item.menu_tooltip] : null;
                                return (
                                    <div className="flex justify-center text-slate-400">
                                        {Icon ? <Icon size={18} /> : <span className="text-slate-200">-</span>}
                                    </div>
                                );
                            }
                        },
                        {
                            header: "Acciones",
                            cell: ({ item }) => (
                                <button
                                    onClick={() => {
                                        setAction('edit');
                                        setMenuData(item);
                                        setIsDialogOpen(true);
                                    }}
                                    className="p-3 bg-slate-50 text-[#1B2654] rounded-xl hover:bg-[#1B2654] hover:text-white transition-all border border-slate-100"
                                >
                                    <Pencil size={16} />
                                </button>
                            )
                        },
                    ]}
                />
            )}

            <MenuFormDialog
                isOpen={isDialogOpen}
                closeModal={() => setIsDialogOpen(false)}
                onSubmit={submit}
                menuToEdit={menuData}
                action={action}
                errors={errors}
                setErrors={setErrors}
            />
        </div>
    );
}