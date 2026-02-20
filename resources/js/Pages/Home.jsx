// Archivo: resources/js/Pages/Home.jsx (Definitivo)

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { lazy, Suspense, useEffect, useState } from 'react';
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
    // { path: "/registrosalida", import: lazy(() => import('./Catalogos/RegistroYSalidaUnificado')) },
    { path: "/menus", import: lazy(() => import('./Catalogos/Menus')) },
    { path: "/listaverificacion", import: lazy(() => import('./Catalogos/ListaVerificacion')) },
    { path: "/puestos", import: lazy(() => import('./Catalogos/Puestos')) },
    { path: "/departamentos", import: lazy(() => import('./Catalogos/Departamentos')) },
    // { path: "/QuienConQuienTransporte", import: lazy(() => import('./Catalogos/QuienConQuienTransporte')) },
    { path: "/roles", import: lazy(() => import('./Catalogos/Roles')) },
    { path: "/correosnotificaciones", import: lazy(() => import('./Catalogos/Correos')) },
    // { path: "/MonitorCodes", import: lazy(() => import('./Catalogos/MonitorCodes')) },
    // { path: "/AutorizacionQuien", import: lazy(() => import('./Catalogos/AutorizacionQuien')) },
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
    { path: "/limpieza", import: lazy(() => import('./Operacion/Limpieza')) },

];

export default function Home({ auth }) {
    const [usuario, setUsuario] = useState(auth.user || null);

    useEffect(() => {
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

    return (
        <div id="page-container" className="flex h-screen w-screen overflow-hidden">

            <div className="flex-shrink-0 h-full min-w-[50px]">
                <LeftMenu auth={usuario} />
            </div>

            <div className="content bg-gray-100 font-sans flex-1 min-w-0">

                <Header />

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