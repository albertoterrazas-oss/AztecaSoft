import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header(props) {
  const [perfil, setPerfil] = useState(null);
  const [tituloDinamico, setTituloDinamico] = useState('Inicio');
  const [cargando, setCargando] = useState(true);
  const [mostrarInfo, setMostrarInfo] = useState(false);
  const menuRef = useRef(null);

  const location = useLocation();

  // Cerrar el menú si se hace clic fuera
  useEffect(() => {
    const clickFuera = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMostrarInfo(false);
      }
    };
    document.addEventListener("mousedown", clickFuera);
    return () => document.removeEventListener("mousedown", clickFuera);
  }, []);

  const capitalizar = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const obtenerRutaMenu = (listaMenus, urlBuscada, pathPadre = "") => {
    for (const menu of listaMenus) {
      const nombreMenuFormateado = capitalizar(menu.menu_nombre);
      const nombreActual = pathPadre ? `${pathPadre} / ${nombreMenuFormateado}` : nombreMenuFormateado;
      if (menu.menu_url === urlBuscada) return nombreActual;
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
    <header className="w-full bg-white border-b border-gray-200 px-6 py-3 shadow-sm relative">
      <div className="flex items-center justify-between">
        
        <div className="flex items-center">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">
              {tituloDinamico}
            </h1>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-700 leading-none">
              {perfil?.Nombres ? `${capitalizar(perfil.Nombres)} ${capitalizar(perfil.ApePat || '')}` : 'Usuario'}
            </p>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Empleado</span>
          </div>

          {/* CONTENEDOR DE PERFIL */}
          <div className="relative" ref={menuRef}>
            <button 
              onMouseEnter={() => setMostrarInfo(true)}
              onClick={() => setMostrarInfo(!mostrarInfo)}
              className="h-10 w-10 rounded-full overflow-hidden border-2 border-indigo-100 shadow-sm hover:border-indigo-400 transition-all focus:outline-none flex items-center justify-center bg-gray-50"
            >
              <img
                className="h-full w-full object-cover aspect-square"
                src={perfil?.PathFotoEmpleado || avatarDefault}
                alt="Perfil"
                onError={(e) => { e.target.src = avatarDefault; }}
              />
            </button>

            {/* TARJETA DE INFORMACIÓN */}
            {mostrarInfo && perfil && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden transition-all"
                onMouseLeave={() => setMostrarInfo(false)}
              >
                {/* Header de la tarjeta */}
                <div className="bg-slate-50 p-4 flex flex-col items-center border-b border-gray-100">
                  <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden mb-2 bg-white">
                    <img 
                      src={perfil.PathFotoEmpleado || avatarDefault} 
                      className="w-full h-full object-cover aspect-square" 
                      alt="Avatar"
                    />
                  </div>
                  <p className="font-bold text-slate-800 text-center leading-tight">
                    {perfil.Nombres}<br/>
                    {perfil.ApePat} {perfil.ApeMat}
                  </p>
                  {/* <p className="text-[11px] text-indigo-500 font-bold mt-1">ID PERSONA: {perfil.IdPersona}</p> */}
                </div>

                {/* Cuerpo de la tarjeta */}
                <div className="p-4 space-y-3 bg-white">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-gray-400 uppercase font-semibold">RFC</p>
                      <p className="text-slate-700 font-medium">{perfil.RFC || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase font-semibold">CURP</p>
                      <p className="text-slate-700 font-medium">{perfil.Curp || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase font-semibold">Teléfono</p>
                      <p className="text-slate-700 font-medium">{perfil.Telefono || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase font-semibold">C.P.</p>
                      <p className="text-slate-700 font-medium">{perfil.CodigoPostal || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-50">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Fecha de Ingreso</p>
                    <p className="text-slate-700 text-xs font-medium">
                      {new Date(perfil.FechaIngreso).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Footer simple */}
                <div className="bg-gray-50 px-4 py-2 flex justify-between items-center border-t border-gray-100">
                   <span className="flex items-center text-[10px] text-green-600 font-bold uppercase">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                    {perfil.Estatus === "1" ? "Activo" : "Inactivo"}
                   </span>
                   <span className="text-[10px] text-gray-400 italic">Azteca System</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}