import { Head } from '@inertiajs/react';
import React, { lazy, Suspense, useEffect, useState, useCallback } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import LoadingDiv from '@/Components/LoadingDiv';
import LeftMenu from '@/Components/LeftMenu';
import Header from '@/Components/Header';

// --- RUTAS ---
const routes = [
    { path: "/", import: lazy(() => import('./Dashboard')) },
    { path: "/dashboard", import: lazy(() => import('./Dashboard')) },
    { path: "/unidades", import: lazy(() => import('./Catalogos/Unidades')) },
    { path: "/usuarios", import: lazy(() => import('./Catalogos/Usuarios')) },
    { path: "/motivos", import: lazy(() => import('./Catalogos/Motivos')) },
    { path: "/areas", import: lazy(() => import('./Catalogos/Areas')) },
    { path: "/reportes", import: lazy(() => import('./Catalogos/Reportes')) },
    { path: "/menus", import: lazy(() => import('./Catalogos/Menus')) },
    { path: "/listaverificacion", import: lazy(() => import('./Catalogos/ListaVerificacion')) },
    { path: "/puestos", import: lazy(() => import('./Catalogos/Puestos')) },
    { path: "/departamentos", import: lazy(() => import('./Catalogos/Departamentos')) },
    { path: "/roles", import: lazy(() => import('./Catalogos/Roles')) },
    { path: "/correosnotificaciones", import: lazy(() => import('./Catalogos/Correos')) },
    { path: "/Asuntos", import: lazy(() => import('./Catalogos/Asuntos')) },
    { path: "/productos", import: lazy(() => import('./Catalogos/Productos')) },
    { path: "/estados", import: lazy(() => import('./SAT/Estados')) },
    { path: "/municipios", import: lazy(() => import('./SAT/Municipios')) },
    { path: "/colonias", import: lazy(() => import('./SAT/Colonias')) },
    { path: "/personas", import: lazy(() => import('./Catalogos/Personas')) },
    { path: "/provedores", import: lazy(() => import('./Catalogos/Provedores')) },
    { path: "/clientes", import: lazy(() => import('./Catalogos/Clientes')) },
    { path: "/almacenes", import: lazy(() => import('./Catalogos/Almacenes')) },
    { path: "/Recepcion", import: lazy(() => import('./Operacion/Recepcion')) },
    { path: "/Entrada", import: lazy(() => import('./Operacion/Entrada')) },
    { path: "/Limpieza", import: lazy(() => import('./Operacion/Limpieza')) },
    { path: "/Deshuese", import: lazy(() => import('./Operacion/Deshuese')) },
    { path: "/empaque", import: lazy(() => import('./Operacion/Venta')) },
];

export default function Home({ auth }) {
    const [perfilFull, setPerfilFull] = useState(null);
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    const location = useLocation();

    // Obtener datos extendidos del servidor
    const getPerfil = useCallback(async () => {
        try {
            // Ajustar 'auth.user.id' según tu estructura de backend
            const response = await fetch(window.route("user.Perfil", auth.user.id || auth.user.IdUsuario));
            if (!response.ok) throw new Error('Error al obtener perfil');
            
            const data = await response.json();
            
            // Procesar Menús
            const menuArray = Array.isArray(data.menus) ? data.menus : (data.menus ? [data.menus] : []);
            setMenus(menuArray);
            setPerfilFull(data.persona);

            // Persistencia para otros componentes que no usen props
            localStorage.setItem('menus', JSON.stringify(menuArray));
            localStorage.setItem('perfil', JSON.stringify(data.persona));
        } catch (error) {
            console.error('Error en carga de datos:', error);
        } finally {
            setLoading(false);
        }
    }, [auth.user]);

    useEffect(() => { getPerfil(); }, [getPerfil]);

    useEffect(() => {
        const handleFS = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFS);
        return () => document.removeEventListener('fullscreenchange', handleFS);
    }, []);

    const toggleFS = () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
    };

    if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-gray-50"><LoadingDiv /></div>;

    return (
        <div id="page-container" className="flex h-screen w-screen overflow-hidden bg-gray-100">
            <Head title="Panel de Control" />

            <div className="flex-shrink-0 h-full">
                <LeftMenu auth={perfilFull} menus={menus} />
            </div>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header user={perfilFull} menus={menus} />

                <main className="flex-1 overflow-y-auto p-4">
                    <Suspense fallback={<LoadingDiv />}>
                        <Routes location={location}>
                            {routes.map((route, index) => (
                                <Route key={index} path={route.path} element={<route.import auth={perfilFull} />} />
                            ))}
                            <Route path="*" element={<div className="p-20 text-center text-gray-400">Seleccione un módulo del menú lateral.</div>} />
                        </Routes>
                    </Suspense>
                </main>
            </div>

            <button onClick={toggleFS} className="fixed bottom-6 right-6 p-3 rounded-full shadow-lg text-white bg-[#A61A18] z-50">
                {isFullscreen ? '✕' : '⛶'}
            </button>
        </div>
    );
}