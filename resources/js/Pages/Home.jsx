// Archivo: resources/js/Pages/Home.jsx (Definitivo)

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { lazy, Suspense, useEffect, useState } from 'react';

// Es importante usar 'react-router-dom' si estás usando las etiquetas Routes/Route
import { Route, Routes } from 'react-router-dom';
import LoadingDiv from '@/Components/LoadingDiv';
import LeftMenu from '@/Components/LeftMenu';
import Header from '@/Components/Header';

// --- DEFINICIÓN DE RUTAS (Se mantiene igual) ---
const routes = [
    { path: "/", import: lazy(() => import('./Dashboard')) },
    { path: "/dashboard", import: lazy(() => import('./Dashboard')) },
    { path: "/unidades", import: lazy(() => import('./Catalogos/Unidades')) },
    { path: "/usuarios", import: lazy(() => import('./Catalogos/Usuarios')) },
    { path: "/motivos", import: lazy(() => import('./Catalogos/Motivos')) },
    { path: "/destino", import: lazy(() => import('./Catalogos/Destinos')) },
    { path: "/reportes", import: lazy(() => import('./Catalogos/Reportes')) },
    { path: "/registrosalida", import: lazy(() => import('./Catalogos/RegistroYSalidaUnificado')) },
    { path: "/menus", import: lazy(() => import('./Catalogos/Menus')) },
    { path: "/listaverificacion", import: lazy(() => import('./Catalogos/ListaVerificacion')) },
    { path: "/puestos", import: lazy(() => import('./Catalogos/Puestos')) },
    { path: "/departamentos", import: lazy(() => import('./Catalogos/Departamentos')) },
    { path: "/QuienConQuienTransporte", import: lazy(() => import('./Catalogos/QuienConQuienTransporte')) },
    { path: "/roles", import: lazy(() => import('./Catalogos/Roles')) },
    { path: "/correosnotificaciones", import: lazy(() => import('./Catalogos/Correos')) },
    // { path: "/MonitorCodes", import: lazy(() => import('./Catalogos/MonitorCodes')) },
    { path: "/MonitorCodes", import: lazy(() => import('./Catalogos/MonitorCodes')) },
    { path: "/AutorizacionQuien", import: lazy(() => import('./Catalogos/AutorizacionQuien')) },
    { path: "/Asuntos", import: lazy(() => import('./Catalogos/Asuntos')) },
    { path: "/productos", import: lazy(() => import('./Catalogos/Productos')) },


];

export default function Home({ auth }) {

    const [usuario, setUsuario] = useState(auth.user || null);

    useEffect(() => {
        // Lógica de actualización de usuario...
        if (auth && auth.user && usuario !== auth.user) {
            setUsuario(auth.user);
            localStorage.setItem('user', JSON.stringify(auth.user));
        }
    }, [auth, usuario]);

    if (!usuario) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingDiv />
            </div>
        );
    }

    // Estructura de layout Flexbox de dos columnas (LeftMenu | Content)
    return (

        // NOTA: Si usas clases CSS/SCSS como `.body-container.open`, es posible que
        // debas agregar una clase de estado aquí, como <div id="page-container" className={`flex h-screen w-screen overflow-hidden ${!showMenu ? 'body-container open' : ''}`}>
        // Pero por ahora, nos enfocamos en el ancho.
        <div id="page-container" className="flex h-screen w-screen overflow-hidden">
            {/** 1. Menú Lateral Fijo (Columna 1) **/}
            {/* 🔴 CAMBIO CLAVE: Se eliminan las clases w-64 y bg-gray-800. */}
            {/* LeftMenu ahora controlará su propio ancho (290px -> 49px) y fondo. */}
            {/* Se mantiene flex-shrink-0 y h-full. */}
            <div className="flex-shrink-0 h-full min-w-[50px]">
                <LeftMenu auth={usuario} />
            </div>

            {/** 2. Contenido Principal (Columna 2) - Ocupa el espacio restante **/}
            <div className="content bg-gray-100 font-sans flex-1 min-w-0">
                {/* sm:overflow-auto md:overflow-hidden */}
                {/** A. Header Fijo **/}
                <Header />

                {/** B. Área Desplazable de Rutas (Páginas) **/}
                {/* flex-grow asegura que ocupe todo el espacio vertical restante después del Header */}
                <div className="scrollable-content px-4">
                    <Routes>
                        {
                            routes.map((route, index) => (
                                <Route key={index} path={route.path} element={(
                                    <Suspense fallback={
                                        <div className="h-full">
                                            <LoadingDiv />
                                        </div>
                                    }>
                                        {/* La propiedad 'lazy' ya no es necesaria en Route */}
                                        <route.import auth={usuario} />
                                    </Suspense>
                                )} />
                            ))
                        }
                    </Routes>
                </div>
            </div>
        </div>

    );
}