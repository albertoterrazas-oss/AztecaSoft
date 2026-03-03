// // Archivo: resources/js/Pages/Home.jsx (Definitivo)

// import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
// import { Head, router } from '@inertiajs/react';
// import React, { lazy, Suspense, useEffect, useState } from 'react';
// import { Route, Routes } from 'react-router-dom';
// import LoadingDiv from '@/Components/LoadingDiv';
// import LeftMenu from '@/Components/LeftMenu';
// import Header from '@/Components/Header';

// // --- DEFINICIÓN DE RUTAS (Se mantiene igual) ---
// const routes = [
//     { path: "/", import: lazy(() => import('./Dashboard')) },
//     { path: "/dashboard", import: lazy(() => import('./Dashboard')) },
//     { path: "/unidades", import: lazy(() => import('./Catalogos/Unidades')) },
//     { path: "/usuarios", import: lazy(() => import('./Catalogos/Usuarios')) },
//     { path: "/motivos", import: lazy(() => import('./Catalogos/Motivos')) },
//     { path: "/areas", import: lazy(() => import('./Catalogos/Areas')) },
//     { path: "/reportes", import: lazy(() => import('./Catalogos/Reportes')) },
//     { path: "/menus", import: lazy(() => import('./Catalogos/Menus')) },
//     { path: "/listaverificacion", import: lazy(() => import('./Catalogos/ListaVerificacion')) },
//     { path: "/puestos", import: lazy(() => import('./Catalogos/Puestos')) },
//     { path: "/departamentos", import: lazy(() => import('./Catalogos/Departamentos')) },
//     { path: "/roles", import: lazy(() => import('./Catalogos/Roles')) },
//     { path: "/correosnotificaciones", import: lazy(() => import('./Catalogos/Correos')) },
//     { path: "/Asuntos", import: lazy(() => import('./Catalogos/Asuntos')) },
//     { path: "/productos", import: lazy(() => import('./Catalogos/Productos')) },
//     { path: "/estados", import: lazy(() => import('./SAT/Estados')) },
//     { path: "/municipios", import: lazy(() => import('./SAT/Municipios')) },
//     { path: "/colonias", import: lazy(() => import('./SAT/Colonias')) },
//     { path: "/personas", import: lazy(() => import('./Catalogos/Personas')) },
//     { path: "/provedores", import: lazy(() => import('./Catalogos/Provedores')) },
//     { path: "/clientes", import: lazy(() => import('./Catalogos/Clientes')) },
//     { path: "/almacenes", import: lazy(() => import('./Catalogos/Almacenes')) },
//     { path: "/Recepcion", import: lazy(() => import('./Operacion/Recepcion')) },
//     { path: "/salida", import: lazy(() => import('./Operacion/Salidas')) },
//     { path: "/Limpieza", import: lazy(() => import('./Operacion/Limpieza')) },
//     { path: "/basculas", import: lazy(() => import('./Catalogos/Basculas')) },
// ];

// export default function Home({ auth }) {
//     const [usuario, setUsuario] = useState(auth.user || null);

//     useEffect(() => {
//         if (auth && auth.user && usuario !== auth.user) {
//             setUsuario(auth.user);
//             localStorage.setItem('user', JSON.stringify(auth.user));
//         }
//     }, [auth, usuario]);

//     if (!usuario) {
//         return (
//             <div className="flex justify-center items-center min-h-screen">
//                 <LoadingDiv />
//             </div>
//         );
//     }

//     return (
//         <div id="page-container" className="flex h-screen w-screen overflow-hidden">

//             <div className="flex-shrink-0 h-full min-w-[50px]">
//                 <LeftMenu auth={usuario} />
//             </div>

//             <div className="content bg-gray-100 font-sans flex-1 min-w-0">

//                 <Header />

//                 <div className="scrollable-content px-4">
//                     <Routes>
//                         {
//                             routes.map((route, index) => (
//                                 <Route key={index} path={route.path} element={(
//                                     <Suspense fallback={
//                                         <div className="h-full">
//                                             <LoadingDiv />
//                                         </div>
//                                     }>
//                                         <route.import auth={usuario} />
//                                     </Suspense>
//                                 )} />
//                             ))
//                         }
//                     </Routes>
//                 </div>
//             </div>
//         </div>
//     );
// }


// Archivo: resources/js/Pages/Home.jsx (Actualizado con Toggle de Pantalla Completa)

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import LoadingDiv from '@/Components/LoadingDiv';
import LeftMenu from '@/Components/LeftMenu';
import Header from '@/Components/Header';

// --- DEFINICIÓN DE RUTAS ---
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
    { path: "/Deshuese", import: lazy(() => import('./Operacion/Deshuese')) },

    { path: "/empaque", import: lazy(() => import('./Operacion/Venta')) },
];

export default function Home({ auth }) {
    const [usuario, setUsuario] = useState(auth.user || null);
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

    // Efecto para detectar si el usuario sale de fullscreen con la tecla ESC
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        if (auth && auth.user && usuario !== auth.user) {
            setUsuario(auth.user);
            localStorage.setItem('user', JSON.stringify(auth.user));
        }
    }, [auth, usuario]);

    // Lógica para alternar pantalla completa
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            const element = document.documentElement;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    if (!usuario) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingDiv />
            </div>
        );
    }

    return (
        <div id="page-container" className="flex h-screen w-screen overflow-hidden relative">
            <Head title="Home" />

            {/* Menú Lateral */}
            <div className="flex-shrink-0 h-full min-w-[50px]">
                <LeftMenu auth={usuario} />
            </div>

            {/* Contenido Principal */}
            <div className="content bg-gray-100 font-sans flex-1 min-w-0 flex flex-col">
                <Header />

                <div className="scrollable-content px-4 flex-1 overflow-y-auto">
                    <Routes>
                        {routes.map((route, index) => (
                            <Route
                                key={index}
                                path={route.path}
                                element={(
                                    <Suspense fallback={
                                        <div className="h-full flex justify-center items-center">
                                            <LoadingDiv />
                                        </div>
                                    }>
                                        <route.import auth={usuario} />
                                    </Suspense>
                                )}
                            />
                        ))}
                    </Routes>
                </div>
            </div>

            {/* BOTÓN FLOTANTE: PANTALLA COMPLETA */}
            <button
                onClick={toggleFullscreen}
                className="fixed bottom-6 right-6 p-3 rounded-full shadow-2xl transition-all duration-300 z-[100] group hover:scale-110 active:scale-95 text-white"
                style={{ backgroundColor: '#A61A18' }}
                title={isFullscreen ? "Salir de pantalla completa" : "Poner en pantalla completa"}
            >
                {isFullscreen ? (
                    /* Icono para salir de Fullscreen (Minimizar) */
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                ) : (
                    /* Icono para entrar a Fullscreen (Expandir) */
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4L9 9M20 4v4m0-4h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                    </svg>
                )}
            </button>
        </div>
    );
}