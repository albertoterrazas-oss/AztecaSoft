import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Link as InertiaLink } from '@inertiajs/react';
import "../../sass/_leftMenu.scss";
import logo from '../../../public/img/logotipo.png';

import {
    X, Search, ChevronLeft, ChevronRight, SquarePen, AlertCircle,
    Home, Settings, User, Menu, LogOut, Award, BarChart, Book,
    Car, Check, Clock, Code, CreditCard, Database, DollarSign, Download,
    Eye, Heart, Key, List, Lock, Mail, Map, Monitor,
    Moon, Phone, Plus, Power, Save, Star, Sun, Trash2, Truck, Upload,
    Users, Video, Volume2, Wallet, Layers, Filter, Anchor, Apple, Archive,
    Briefcase, Calendar, Camera, Cloud, Coffee, Construction, Droplet,
    Feather, FileText, FlaskConical, Folder, Gift, Globe, Hammer, Image,
    Info, Minus, MoreHorizontal, Move, Music, Package, Paperclip, Pause,
    PenTool, Pin, Plane, Printer, QrCode, Radar, Send, Server, Tablet,
    Tag, Terminal, ThumbsUp, ToggleLeft, Watch, Wifi, Zap, ZoomIn, ZoomOut,
    Bell
} from 'lucide-react';

const ICON_COMPONENTS = {
    X, Search, ChevronLeft, ChevronRight, SquarePen, AlertCircle, Home,
    Settings, User, Menu, LogOut, Award, BarChart, Book, Car, Check, Clock,
    Code, CreditCard, Database, DollarSign, Download, Eye, Heart, Key, List,
    Lock, Mail, Map, Monitor, Moon, Phone, Plus, Power, Save, Star, Sun,
    Trash2, Truck, Upload, Users, Video, Volume2, Wallet, Layers, Filter,
    Anchor, Apple, Archive, Briefcase, Calendar, Camera, Cloud, Coffee,
    Construction, Droplet, Feather, FileText, FlaskConical, Folder, Gift,
    Globe, Hammer, Image, Info, Minus, MoreHorizontal, Move, Music, Package,
    Paperclip, Pause, PenTool, Pin, Plane, Printer, QrCode, Radar, Send,
    Server, Tablet, Tag, Terminal, ThumbsUp, ToggleLeft, Watch, Wifi, Zap,
    ZoomIn, ZoomOut, Bell,
    'AdminPanelSettings': Users,
    'Category': Layers,
    'CameraTwoTone': Camera,
    'Correos': Mail,
    'Computer': Monitor,
    'Motivos': AlertCircle,
    'PersonSearchTwoTone': User,
    'QYQ': Globe,
    'AssignmentSharp': FileText,
    'LineAxis': BarChart,
    'Link': List,
};

const getIconComponent = (iconName) => {
    return ICON_COMPONENTS[String(iconName)] || null;
};

const LeftMenu = ({ auth }) => {
    const [showMenu, setShowMenu] = useState(true);
    const [userMenus, setUserMenus] = useState([]);
    const [openMenus, setOpenMenus] = useState({});
    const [isLoggingOut, setIsLoggingOut] = useState(false); // Estado para la animación
    const location = useLocation();

    const getPerfil = useCallback(async () => {
        try {
            const response = await fetch(window.route("user.Perfil", auth.IdUsuario));
            if (!response.ok) throw new Error('Error al cargar menús');
            const data = await response.json();
            const menuArray = Array.isArray(data.menus) ? data.menus : (data.menus ? [data.menus] : []);
            setUserMenus(menuArray);
        } catch (error) {
            console.error('Error en getPerfil:', error.message);
        }
    }, [auth.IdUsuario]);

    useEffect(() => { getPerfil(); }, [getPerfil]);

    const toggleAccordion = (menuId) => {
        setOpenMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
    };

    const renderMenuItem = (menu, level = 0) => {
        const hasChilds = Array.isArray(menu.childs) && menu.childs.length > 0;
        const IconComponent = getIconComponent(menu.menu_tooltip);
        const isOpen = !!openMenus[menu.menu_id];
        const activePath = location.pathname === '/dashboard' ? '/' : location.pathname;
        const menuPath = menu.menu_url === '/dashboard' ? '/' : menu.menu_url;
        const isSelected = activePath === menuPath;

        const paddingLeft = showMenu ? `${20 + (level * 15)}px` : '15px';

        return (
            <li key={menu.menu_id} className="w-full">
                {hasChilds ? (
                    <>
                        <div
                            onClick={() => toggleAccordion(menu.menu_id)}
                            className={`flex items-center justify-between p-3 cursor-pointer transition-all duration-200 text-white
                                ${isOpen ? 'bg-white bg-opacity-10' : 'hover:bg-white hover:bg-opacity-5'}`}
                            style={{ paddingLeft }}
                        >
                            <div className="flex items-center overflow-hidden">
                                {IconComponent && <IconComponent size={20} className="flex-shrink-0 mr-3" />}
                                {showMenu && <span className="truncate text-sm font-medium">{menu.menu_nombre}</span>}
                            </div>
                            {showMenu && (
                                <ChevronRight 
                                    size={16} 
                                    className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} 
                                />
                            )}
                        </div>
                        <div 
                            className="overflow-hidden transition-all duration-300 ease-in-out"
                            style={{ maxHeight: isOpen ? '2000px' : '0', backgroundColor: 'rgba(0,0,0,0.1)' }}
                        >
                            <ul className="list-none p-0 m-0">
                                {menu.childs.map(child => renderMenuItem(child, level + 1))}
                            </ul>
                        </div>
                    </>
                ) : (
                    <Link
                        to={menu.menu_url || '#'}
                        className={`flex items-center p-3 cursor-pointer transition-all duration-200 text-white relative
                            ${isSelected ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-5'}`}
                        style={{ paddingLeft }}
                    >
                        {IconComponent && <IconComponent size={20} className="flex-shrink-0 mr-3" />}
                        {showMenu && <span className="truncate text-sm">{menu.menu_nombre}</span>}
                        {isSelected && (
                            <div className="absolute left-0 top-0 h-full w-1 bg-white" />
                        )}
                    </Link>
                )}
            </li>
        );
    };

    return (
        <>
            {/* OVERLAY DE CIERRE DE SESIÓN PROFESIONAL */}
            {isLoggingOut && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1B2654] bg-opacity-95 backdrop-blur-md transition-all duration-500">
                    <div className="relative flex items-center justify-center">
                        {/* Spinner animado */}
                        <div className="w-20 h-20 border-4 border-t-blue-400 border-r-transparent border-b-blue-400 border-l-transparent rounded-full animate-spin"></div>
                        <LogOut className="absolute text-white animate-pulse" size={30} />
                    </div>
                    <div className="mt-8 text-center">
                        <h2 className="text-white text-2xl font-bold tracking-widest uppercase mb-2">
                            Finalizando Sesión
                        </h2>
                        <div className="flex gap-1 justify-center">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        </div>
                        <p className="text-blue-200 text-sm mt-4 font-light opacity-70">
                            Esperamos verte pronto en AVT System
                        </p>
                    </div>
                </div>
            )}

            <div id="left-menu" className={`flex flex-col h-screen select-none transition-all duration-300 ${isLoggingOut ? 'blur-md' : ''}`}
                style={{ width: showMenu ? '290px' : '64px', backgroundColor: '#1B2654' }}>
                
                <style>
                    {`
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.15);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
                    .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.15) transparent; }
                    `}
                </style>
                
                <div className="flex items-center justify-between px-4 py-6 border-b border-white border-opacity-10">
                    {showMenu && (
                        <div className="flex items-center gap-3">
                            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                            <h2 className="text-white font-bold text-lg whitespace-nowrap">AVT System</h2>
                        </div>
                    )}
                    <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg">
                        {showMenu ? <ChevronLeft size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    <ul className="py-2">{userMenus.map(menu => renderMenuItem(menu))}</ul>
                </div>

                <div className="p-2 border-t border-white border-opacity-10">
                    <InertiaLink 
                        href={window.route('logout')} 
                        method="post" 
                        as="button"
                        onClick={() => setIsLoggingOut(true)} // Activa la animación
                        className={`flex items-center p-3 w-full rounded-lg text-white hover:bg-red-600 hover:bg-opacity-40 transition-all duration-300
                        ${showMenu ? 'justify-start' : 'justify-center'}`}
                    >
                        <LogOut size={20} className={showMenu ? 'mr-3' : ''} />
                        {showMenu && <span className="text-sm font-semibold">Cerrar Sesión</span>}
                    </InertiaLink>
                </div>
            </div>
        </>
    );
};

export default LeftMenu;