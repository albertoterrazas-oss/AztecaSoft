import React, { useEffect, useState } from 'react';
// 1. Importaciones de React Router Dom para la navegación INTERNA
import { Link, useLocation } from 'react-router-dom';
// 2. Renombramos el Link de Inertia para usarlo SÓLO en Logout
import { Link as InertiaLink } from '@inertiajs/react';
import "../../sass/_leftMenu.scss";
import logo from '../../../public/img/logotipo.png';

// --- TUS IMPORTACIONES DE ÍCONOS (LUCIDE REACT) ---
import {
    X, Search, ChevronLeft, ChevronRight, SquarePen, AlertCircle,
    Home, Settings, User, Menu, LogOut, Award, BarChart, Book,
    Car, Check, Clock, Code, CreditCard, Database, DollarSign, Download,
    Eye, Heart, Key, Link as LucideLink, List, Lock, Mail, Map, Monitor,
    Moon, Phone, Plus, Power, Save, Star, Sun, Trash2, Truck, Upload,
    Users, Video, Volume2, Wallet, Layers, Filter, Anchor, Apple, Archive,
    Briefcase, Calendar, Camera, Cloud, Coffee, Construction, Droplet,
    Feather, FileText, FlaskConical, Folder, Gift, Globe, Hammer, Image,
    Info, Minus, MoreHorizontal, Move, Music, Package, Paperclip, Pause,
    PenTool, Pin, Plane, Printer, QrCode, Radar, Send, Server, Tablet,
    Tag, Terminal, ThumbsUp, ToggleLeft, Watch, Wifi, Zap, ZoomIn, ZoomOut,
    Bell // Se agrega Bell que estaba en tu lista de intenciones de íconos
} from 'lucide-react';

// Mapeo de nombres de 'menu_tooltip' a componentes reales de íconos
const ICON_COMPONENTS = {
    // --- Mapeos Directos de Lucide ---
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

    // Si tu API usa un nombre diferente al componente de Lucide (ej: AdminPanelSettings -> Users)
    // Agrega aquí los mapeos personalizados que necesites:
    'AdminPanelSettings': Users,    // Icono para "Usuarios"
    'Category': Layers,             // Icono común para catálogos
    'CameraTwoTone': Camera,        // Icono para cámaras/vigilancia
    'Correos': Mail,
    'Computer': Monitor,
    'Motivos': AlertCircle,
    'PersonSearchTwoTone': User,
    'QYQ': Globe,
    'AssignmentSharp': FileText,
    'LineAxis': BarChart,
    'Link': LucideLink,             // Maneja la colisión de nombres (Link de Lucide vs. Link de React Router)
    'Lightbulb': Award,             // Si la API tiene Lightbulb y quieres usar Award

    // Fallback: Si el nombre del tooltip no coincide con ningún componente
    'default': Menu,
    'null': Menu,
    '': Menu,
};

// Función auxiliar para obtener el componente de ícono
function getIconComponent(iconName) {
    const key = String(iconName);
    // Busca por el nombre directo o el mapeo personalizado, si no encuentra, usa 'default'.
    return ICON_COMPONENTS[key] || ICON_COMPONENTS['default'];
}

const LeftMenu = ({ auth }) => {
    const [showMenu, setShowMenu] = useState(true);
    const [userMenus, setUserMenus] = useState([]);
    const [openMenuId, setOpenMenuId] = useState(null);

    const location = useLocation();

    const toggleMenu = () => {
        setShowMenu(!showMenu);
    };

    const handleAccordionClick = (menu) => {
        setOpenMenuId(openMenuId === menu.menu_id ? null : menu.menu_id);
    };

    /**
     * Función recursiva para encontrar el padre del elemento activo y establecer openMenuId.
     */
    const findAndOpenParent = (menus, pathname) => {
        const normalizedPathname = pathname === '/dashboard' ? '/' : pathname;

        for (const menu of menus) {
            const menuUrl = menu.menu_url || '/#';
            const normalizedMenuUrl = menuUrl === '/dashboard' ? '/' : menuUrl;

            if (menu.childs && menu.childs.length > 0) {
                const foundInChilds = findAndOpenParent(menu.childs, normalizedPathname);
                const parentIsActive = normalizedMenuUrl !== '/#' && normalizedMenuUrl === normalizedPathname;

                if (foundInChilds || parentIsActive) {
                    setOpenMenuId(menu.menu_id);
                    return true;
                }
            } else {
                if (normalizedMenuUrl !== '/#' && normalizedMenuUrl === normalizedPathname) {
                    return true;
                }
            }
        }
        return false;
    };


    // Efecto para cargar los menús al montar el componente
    useEffect(() => {
        getPerfil()
    }, []);

    // 💡 EFECTO CLAVE: Se ejecuta con cada cambio de ruta para mantener el acordeón abierto.
    useEffect(() => {
        if (userMenus.length > 0) {
            findAndOpenParent(userMenus, location.pathname);
        }
    }, [location.pathname, userMenus]);

    const getPerfil = async () => {
        try {
            localStorage.setItem('user', JSON.stringify(auth));

            const response = await fetch(window.route("user.Perfil", auth.IdUsuario));
            if (!response.ok) {
                throw new Error('Error al cargar menús del usuario');
            }
            const data = await response.json();
            // Asegura que la data sea un array para el mapeo, incluso si la API devuelve un solo objeto
            const menuArray = Array.isArray(data.menus) ? data.menus : (data.menus ? [data.menus] : []);
            setUserMenus(menuArray);
            localStorage.setItem('perfil', JSON.stringify(data.persona));

        } catch (error) {
            console.error('Error en getMenus:', error.message);
        }
    };


    // --- Estilos Base ---

    const sideMenuStyle = {
        width: showMenu ? '290px' : '49px',
        transition: 'width 0.3s ease-in-out',
        overflowX: 'hidden',
        minHeight: '100svh',
        backgroundColor: '#053AA7',
    };

    // Clases base con Tailwind CSS
    const itemBaseClass = "text-white p-3 cursor-pointer flex items-center relative transition-colors duration-200 ease-in-out";

    // --- Renderizado de Menú (Función Recursiva) ---

    function renderMenu(menu) {
        if (!menu.menu_id || !menu.menu_nombre) return null;

        const hasChilds = menu.childs && menu.childs.length > 0;

        // Obtener el componente de icono usando menu_tooltip
        const IconComponent = getIconComponent(menu.menu_tooltip);

        // Normalización y lógica de resaltado
        const normalizedPathname = location.pathname === '/dashboard' ? '/' : location.pathname;
        const normalizedMenuUrl = menu.menu_url === '/dashboard' ? '/' : menu.menu_url;
        const isSelected = normalizedPathname === normalizedMenuUrl;

        const isOpen = openMenuId === menu.menu_id;

        const submenuStyle = {
            maxHeight: isOpen ? '500px' : '0',
            overflow: 'hidden',
            backgroundColor: '#1B2654',
            transition: 'max-height 0.3s ease-in-out, padding 0.3s ease-in-out',
            paddingTop: isOpen ? '5px' : '0',
            paddingBottom: isOpen ? '5px' : '0',
        };


        // Nivel 2+ (menu_idPadre !== '0'): 35px (abierto) o 15px (colapsado)
        const effectivePadding = menu.menu_idPadre !== '0' ?
            { paddingLeft: showMenu ? '35px' : '15px' } :
            { paddingLeft: '20px' };


        if (hasChilds) {
            return (
                <li key={menu.menu_id}>
                    <div
                        className={itemBaseClass + (isOpen ? ' bg-white bg-opacity-15' : ' hover:bg-white hover:bg-opacity-10')}
                        onClick={() => handleAccordionClick(menu)}
                        style={effectivePadding}
                    >
                        <span className="text-white flex items-center justify-between w-full">
                            <span className="flex items-center">
                                {/* 1a. Renderiza el Ícono */}
                                <IconComponent size={20} className="w-5 h-5 mr-3 flex-shrink-0" />

                                {/* 1b. Renderiza el Label */}
                                {showMenu && (
                                    <span className="truncate">{menu.menu_nombre}</span>
                                )}
                            </span>

                            {/* Icono de flecha para el acordeón */}
                            <svg className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'} ${!showMenu ? 'hidden' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </span>
                    </div>
                    <div style={submenuStyle}>
                        <ul className="list-none p-0 m-0">
                            {menu.childs.map((submenu) => renderMenu(submenu))}
                        </ul>
                    </div>
                </li>
            );
        }

        return (
            <li key={menu.menu_id}>
                {/* ENLACE HOJA */}
                <Link
                    to={menu.menu_url}
                    className={itemBaseClass + (isSelected ? " item-selected" : " hover:bg-white hover:bg-opacity-10")}
                    style={{
                        ...effectivePadding,
                        ...(isSelected ? { backgroundColor: 'rgba(255, 255, 255, 0.2)' } : {})
                    }}
                >
                    <span className="flex relative items-center">
                        {/* 2a. Renderiza el Ícono */}
                        <IconComponent size={20} className="w-5 h-5 mr-3 flex-shrink-0" />

                        {/* 2b. Renderiza el Label */}
                        {showMenu && (
                            <span className="truncate">{menu.menu_nombre}</span>
                        )}
                    </span>
                    {isSelected && (
                        <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-full bg-white rounded-r-md"></span>
                    )}
                </Link>
            </li>
        );
    }

    return (
        <div id="left-menu" className="leftmenu" style={sideMenuStyle} >
            <div className="flex flex-col h-[100svh]" style={{ background: '#1B2654' }}>

                <div className={`headerMenu pt-4 pl-7 ${showMenu ? 'pr-7' : 'pr-1'} border-b-2 flex justify-between items-center`} style={{ borderColor: '#d1d1d117' }}>
                    {showMenu && (
                        <div className="user-info w-full px-2">
                            <div className="flex items-center justify-start gap-2">
                                {/* Logo */}
                                <div className="flex-shrink-0 w-10">
                                    <img
                                        src={logo}
                                        alt="Logo"
                                        className="w-full h-auto block object-contain"
                                    />
                                </div>

                                {/* Texto - Forzando el grosor máximo */}
                                <h2
                                    className="text-white text-[20px] tracking-tighter whitespace-nowrap px-1 antialiased"
                                    style={{
                                        fontWeight: '700',
                                        fontFamily: 'sans-serif' // Asegura que use una fuente del sistema que sí tenga negrita
                                    }}
                                >
                                    AVT System
                                </h2>
                            </div>
                        </div>
                    )}

                    {/* Botón de Toggle - Añadido un poco de margen superior para separar del logo si es necesario */}
                    <div className="leftmenu-button cursor-pointer mt-2">
                        <button
                            className="w-10 h-10 flex items-center justify-center"
                            onClick={toggleMenu}
                        >
                            {showMenu ? (
                                <svg viewBox="0 0 42 30" className="w-8 h-8">
                                    <path
                                        d="M20 24L13 16L20 8M16 16H35"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 64 64" className="w-8 h-8">
                                    <path
                                        d="M12 28h42a3 3 0 0 1 0 6h-42a3 3 0 0 1 0-6zM12 42h42a3 3 0 0 1 0 6h-42a3 3 0 0 1 0-6zM12 14h42a3 3 0 0 1 0 6h-42a3 3 0 0 1 0-6z"
                                        fill="white"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Contenedor Principal de Menús */}
                <div className="containerMenu grow pt-1 overflow-y-auto" >
                    <ul id="menus-list" className="leftmenu-list list-none p-0 m-0">
                        {userMenus.length > 0 &&
                            userMenus.map((menu) => renderMenu(menu))}
                    </ul>
                </div>

                {/* Pie de Menú (Cerrar Sesión) */}
                <div className="footerMenu border-t-2 pt-2 flex justify-center" style={{ borderColor: '#d1d1d117' }}>
                    {/* El Link de Logout siempre es visible, pero cambia su estilo */}
                    <InertiaLink
                        href={window.route('logout')}
                        method="post"
                        as="button"
                        id="logoutButton"
                        className={`
                            flex items-center p-2 rounded-lg
                            text-white bg-transparent
                            hover:bg-white hover:bg-opacity-10
                            transition-all duration-200 ease-in-out
                            ${showMenu ? 'w-full justify-start' : 'w-auto justify-center'}
                        `}
                    >
                        <LogOut size={20} className={`w-5 h-5 flex-shrink-0 ${showMenu ? 'mr-3' : 'm-auto'}`} />
                        {showMenu && (
                            <span className="font-medium text-sm">Cerrar Sesión</span>
                        )}
                    </InertiaLink>
                </div>
            </div>
        </div >
    );
};

export default LeftMenu;