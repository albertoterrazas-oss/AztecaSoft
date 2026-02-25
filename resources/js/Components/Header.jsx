import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header(props) {
  const [perfil, setPerfil] = useState(null);
  const [tituloDinamico, setTituloDinamico] = useState('Inicio');
  const [cargando, setCargando] = useState(true);

  const location = useLocation();

  // Función para poner solo la primera letra en mayúscula
  const capitalizar = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Función recursiva para construir la jerarquía
  const obtenerRutaMenu = (listaMenus, urlBuscada, pathPadre = "") => {
    for (const menu of listaMenus) {
      // Capitalizamos el nombre del menú actual
      const nombreMenuFormateado = capitalizar(menu.menu_nombre);

      const nombreActual = pathPadre
        ? `${pathPadre} / ${nombreMenuFormateado}`
        : nombreMenuFormateado;

      if (menu.menu_url === urlBuscada) {
        return nombreActual;
      }

      if (menu.childs && menu.childs.length > 0) {
        const encontradoEnHijo = obtenerRutaMenu(menu.childs, urlBuscada, nombreActual);
        if (encontradoEnHijo) return encontradoEnHijo;
      }
    }
    return null;
  };

  useEffect(() => {
    const obtenerDatos = () => {
      try {
        const perfilStorage = localStorage.getItem('perfil');
        if (perfilStorage) setPerfil(JSON.parse(perfilStorage));

        const menusStorage = localStorage.getItem('menus');
        if (menusStorage) {
          const listaMenus = JSON.parse(menusStorage);
          const pathActual = location.pathname.substring(1);

          if (pathActual === "" || pathActual === "home") {
            setTituloDinamico("Panel principal");
          } else {
            const rutaCompleta = obtenerRutaMenu(listaMenus, pathActual);
            setTituloDinamico(rutaCompleta || "Módulo");
          }
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatos();
  }, [location.pathname]);

  const avatarDefault = `https://ui-avatars.com/api/?name=${perfil?.Nombres || 'U'}&background=random&color=fff`;

  if (cargando) return <header className="w-full bg-white border-b p-3 animate-pulse" />;

  return (
    <header className="w-full bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">

        <div className="flex items-center">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            {/* Quitamos el 'uppercase' de Tailwind y dejamos que la función haga el trabajo */}
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">
              {tituloDinamico}
            </h1>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-700">
              {perfil?.Nombres
                ? `${capitalizar(perfil.Nombres)} ${capitalizar(perfil.ApePat || '')} ${capitalizar(perfil.ApeMat || '')}`.trim()
                : 'Usuario'
              }
            </p>
          </div>
          <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-indigo-100 shadow-inner">
            <img
              className="h-full w-full object-cover"
              src={perfil?.PathFotoEmpleado || avatarDefault}
              alt="Perfil"
              onError={(e) => { e.target.src = avatarDefault; }}
            />
          </div>
        </div>

      </div>
    </header>
  );
}