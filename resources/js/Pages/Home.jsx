// import { Head } from '@inertiajs/react';
// import React, { lazy, Suspense, useEffect, useState, useCallback } from 'react';
// import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
// import LoadingDiv from '@/Components/LoadingDiv';
// import LeftMenu from '@/Components/LeftMenu';
// import Header from '@/Components/Header';

// // --- CONFIGURACIÓN DE RUTAS (LIMPIA) ---
// const routesConfig = [
//     { path: "/dashboard", component: lazy(() => import('./Dashboard')) },
//     { path: "/unidades", component: lazy(() => import('./Catalogos/Unidades')) },
//     { path: "/usuarios", component: lazy(() => import('./Catalogos/Usuarios')) },
//     { path: "/motivos", component: lazy(() => import('./Catalogos/Motivos')) },
//     { path: "/areas", component: lazy(() => import('./Catalogos/Areas')) },
//     { path: "/reportes", component: lazy(() => import('./Catalogos/Reportes')) },
//     { path: "/menus", component: lazy(() => import('./Catalogos/Menus')) },
//     { path: "/listaverificacion", component: lazy(() => import('./Catalogos/ListaVerificacion')) },
//     { path: "/puestos", component: lazy(() => import('./Catalogos/Puestos')) },
//     { path: "/departamentos", component: lazy(() => import('./Catalogos/Departamentos')) },
//     { path: "/roles", component: lazy(() => import('./Catalogos/Roles')) },
//     { path: "/correosnotificaciones", component: lazy(() => import('./Catalogos/Correos')) },
//     { path: "/Asuntos", component: lazy(() => import('./Catalogos/Asuntos')) },
//     { path: "/productos", component: lazy(() => import('./Catalogos/Productos')) },
//     { path: "/estados", component: lazy(() => import('./SAT/Estados')) },
//     { path: "/municipios", component: lazy(() => import('./SAT/Municipios')) },
//     { path: "/colonias", component: lazy(() => import('./SAT/Colonias')) },
//     { path: "/personas", component: lazy(() => import('./Catalogos/Personas')) },
//     { path: "/provedores", component: lazy(() => import('./Catalogos/Provedores')) },
//     { path: "/clientes", component: lazy(() => import('./Catalogos/Clientes')) },
//     { path: "/almacenes", component: lazy(() => import('./Catalogos/Almacenes')) },
//     { path: "/Recepcion", component: lazy(() => import('./Operacion/Recepcion')) },
//     { path: "/Entrada", component: lazy(() => import('./Operacion/Entrada')) },
//     { path: "/Limpieza", component: lazy(() => import('./Operacion/Limpieza')) },
//     { path: "/Deshuese", component: lazy(() => import('./Operacion/Deshuese')) },
//     { path: "/empaque", component: lazy(() => import('./Operacion/Venta')) },
// ];

// export default function Home({ auth }) {
//     const [perfilFull, setPerfilFull] = useState(null);
//     const [menus, setMenus] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
//     const location = useLocation();

//     const getPerfil = useCallback(async () => {
//         try {
//             const userId = auth?.user?.id || auth?.user?.IdUsuario;
//             if (!userId) return;

//             const response = await fetch(window.route("user.Perfil", userId));
//             if (!response.ok) throw new Error('Error al obtener perfil');

//             const data = await response.json();
//             const menuArray = Array.isArray(data.menus) ? data.menus : (data.menus ? [data.menus] : []);

//             setMenus(menuArray);
//             setPerfilFull(data.persona);

//             localStorage.setItem('menus', JSON.stringify(menuArray));
//             localStorage.setItem('perfil', JSON.stringify(data.persona));
//         } catch (error) {
//             console.error('Error en carga de datos:', error);
//         } finally {
//             setLoading(false);
//         }
//     }, [auth]);

//     useEffect(() => {
//         getPerfil();
//     }, [getPerfil]);

//     useEffect(() => {
//         const handleFS = () => setIsFullscreen(!!document.fullscreenElement);
//         document.addEventListener('fullscreenchange', handleFS);
//         return () => document.removeEventListener('fullscreenchange', handleFS);
//     }, []);

//     const toggleFS = () => {
//         if (!document.fullscreenElement) {
//             document.documentElement.requestFullscreen?.().catch(() => { });
//         } else {
//             document.exitFullscreen?.();
//         }
//     };

//     if (loading) {
//         return (
//             <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
//                 <LoadingDiv />
//             </div>
//         );
//     }

//     // Detectar y loguear la ruta actual al iniciar y en cada cambio
//     useEffect(() => {
//         console.log("📍 Ruta actual detectada:", location.pathname);

//         // Si quieres ver también los parámetros de búsqueda (query strings)
//         if (location.search) {
//             console.log("🔍 Parámetros:", location.search);
//         }
//     }, [location]);

//     return (
//         <div id="page-container" className="flex h-screen w-screen overflow-hidden bg-gray-100">
//             <Head title="Panel de Control" />

//             {/* Menú Lateral */}
//             <div className="flex-shrink-0 h-full">
//                 <LeftMenu auth={perfilFull} menus={menus} />
//             </div>

//             {/* Contenido Principal */}
//             <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
//                 <Header user={perfilFull} menus={menus} />

//                 <main className="flex-1 overflow-y-auto p-4">
//                     <Suspense fallback={<LoadingDiv />}>
//                         <Routes>
//                             {/* REDIRECCIÓN AUTOMÁTICA: Si entras a "/", te manda a "/dashboard" */}
//                             <Route path="/" element={<Navigate to="/dashboard" replace />} />

//                             {/* GENERACIÓN DINÁMICA DE RUTAS */}
//                             {routesConfig.map((route, index) => {
//                                 const Component = route.component;
//                                 return (
//                                     <Route
//                                         key={index}
//                                         path={route.path}
//                                         element={<Component auth={perfilFull} />}
//                                     />
//                                 );
//                             })}

//                             {/* RUTA 404 / PERMISOS */}
//                             <Route path="*" element={
//                                 <div className="p-20 text-center text-gray-400">
//                                     <p className="text-xl font-semibold">Módulo no disponible</p>
//                                     <p>Verifica tu conexión o permisos de acceso.</p>
//                                 </div>
//                             } />
//                         </Routes>
//                     </Suspense>
//                 </main>
//             </div>

//             {/* Botón de Pantalla Completa */}
//             <button
//                 onClick={toggleFS}
//                 className="fixed bottom-6 right-6 p-3 rounded-full shadow-lg text-white bg-[#A61A18] z-50 hover:bg-[#8e1614] transition-all transform hover:scale-110 active:scale-95"
//                 title="Toggle Fullscreen"
//             >
//                 {isFullscreen ? '✕' : '⛶'}
//             </button>
//         </div>
//     );
// }


import { Head } from '@inertiajs/react';
import React, { lazy, Suspense, useEffect, useState, useCallback } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import LoadingDiv from '@/Components/LoadingDiv';
import LeftMenu from '@/Components/LeftMenu';
import Header from '@/Components/Header';

// --- CONFIGURACIÓN DE RUTAS ---
const routesConfig = [
    { path: "/dashboard", component: lazy(() => import('./Dashboard')) },
    { path: "/unidades", component: lazy(() => import('./Catalogos/Unidades')) },
    { path: "/usuarios", component: lazy(() => import('./Catalogos/Usuarios')) },
    { path: "/motivos", component: lazy(() => import('./Catalogos/Motivos')) },
    // { path: "/areas", component: lazy(() => import('./Catalogos/Areas')) },
    { path: "/reportes", component: lazy(() => import('./Catalogos/Reportes')) },
    { path: "/menus", component: lazy(() => import('./Catalogos/Menus')) },
    { path: "/listaverificacion", component: lazy(() => import('./Catalogos/ListaVerificacion')) },
    { path: "/puestos", component: lazy(() => import('./Catalogos/Puestos')) },
    { path: "/departamentos", component: lazy(() => import('./Catalogos/Departamentos')) },
    { path: "/roles", component: lazy(() => import('./Catalogos/Roles')) },
    { path: "/correosnotificaciones", component: lazy(() => import('./Catalogos/Correos')) },
    { path: "/Asuntos", component: lazy(() => import('./Catalogos/Asuntos')) },
    { path: "/productos", component: lazy(() => import('./Catalogos/Productos')) },
    { path: "/estados", component: lazy(() => import('./SAT/Estados')) },
    { path: "/municipios", component: lazy(() => import('./SAT/Municipios')) },
    { path: "/colonias", component: lazy(() => import('./SAT/Colonias')) },
    { path: "/personas", component: lazy(() => import('./Catalogos/Personas')) },
    { path: "/provedores", component: lazy(() => import('./Catalogos/Provedores')) },
    { path: "/clientes", component: lazy(() => import('./Catalogos/Clientes')) },
    { path: "/refrigeradores", component: lazy(() => import('./Catalogos/Refrigeradores')) },
    { path: "/almacenes", component: lazy(() => import('./Catalogos/Almacenes')) },

    { path: "/Recepcion", component: lazy(() => import('./Operacion/Recepcion')) },
    { path: "/Entrada", component: lazy(() => import('./Operacion/Entrada')) },
    { path: "/Limpieza", component: lazy(() => import('./Operacion/Limpieza')) },
    { path: "/Deshuese", component: lazy(() => import('./Operacion/Deshuese')) },
    { path: "/empaque", component: lazy(() => import('./Operacion/Venta')) },
    { path: "/basculas", component: lazy(() => import('./Catalogos/Basculas')) },
    { path: "/congelacion", component: lazy(() => import('./Operacion/Congelacion')) },
    { path: "/cajas", component: lazy(() => import('./Catalogos/Cajas')) },



];

export default function Home({ auth }) {
    const [perfilFull, setPerfilFull] = useState(null);
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    const location = useLocation();

    const getPerfil = useCallback(async () => {
        try {
            const userId = auth?.user?.id || auth?.user?.IdUsuario;
            if (!userId) return;

            const response = await fetch(window.route("user.Perfil", userId));
            if (!response.ok) throw new Error('Error al obtener perfil');

            const data = await response.json();
            const menuArray = Array.isArray(data.menus) ? data.menus : (data.menus ? [data.menus] : []);

            setMenus(menuArray);
            setPerfilFull(data.persona);

            localStorage.setItem('menus', JSON.stringify(menuArray));
            localStorage.setItem('perfil', JSON.stringify(data.persona));
        } catch (error) {
            console.error('Error en carga de datos:', error);
        } finally {
            setLoading(false);
        }
    }, [auth]);

    // --- TODOS LOS HOOKS VAN AQUÍ ARRIBA ---

    useEffect(() => {
        getPerfil();
    }, [getPerfil]);

    useEffect(() => {
        const handleFS = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFS);
        return () => document.removeEventListener('fullscreenchange', handleFS);
    }, []);


    const toggleFS = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(() => { });
        } else {
            document.exitFullscreen?.();
        }
    };

    // --- DESPUÉS DE LOS HOOKS, PODEMOS HACER EL RETURN TEMPRANO ---
    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
                <LoadingDiv />
            </div>
        );
    }

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
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />

                            {routesConfig.map((route, index) => {
                                const Component = route.component;
                                return (
                                    <Route
                                        key={index}
                                        path={route.path}
                                        element={<Component auth={perfilFull} />}
                                    />
                                );
                            })}

                            <Route path="*" element={
                                <div className="p-20 text-center text-gray-400">
                                    <p className="text-xl font-semibold">Módulo no disponible</p>
                                    <p>Verifica tu conexión o permisos de acceso.</p>
                                </div>
                            } />
                        </Routes>
                    </Suspense>
                </main>
            </div>

            <button
                onClick={toggleFS}
                className="fixed bottom-6 right-6 p-3 rounded-full shadow-lg text-white bg-[#A61A18] z-50 hover:bg-[#8e1614] transition-all transform hover:scale-110 active:scale-95"
                title="Toggle Fullscreen"
            >
                {isFullscreen ? '✕' : '⛶'}
            </button>
        </div>
    );
}