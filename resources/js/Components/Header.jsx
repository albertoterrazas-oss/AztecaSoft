import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Header(props) {
  // Usamos un estado para manejar el perfil y que React se entere de los cambios
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerPerfil = () => {
      try {
        const userStorage = localStorage.getItem('perfil');
        if (userStorage) {
          setPerfil(JSON.parse(userStorage));
        }
      } catch (error) {
        console.error("Error al parsear el perfil:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerPerfil();
  }, []);

  // 1. Imagen por defecto: Generamos un avatar con las iniciales o un placeholder UI
  const avatarDefault = `https://ui-avatars.com/api/?name=${perfil?.Nombres || 'U'}&background=random&color=fff`;

  if (cargando) {
    return (
      <header className="w-full bg-white border-b border-gray-200 px-6 py-3 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        
        {/* Lado izquierdo: Logo */}
        <div className="flex items-center">
          <Link title="Ir al inicio" to="/">
            <h1 className="text-lg font-bold text-slate-800">
              Catálogo de Departamentos
            </h1>
          </Link>
        </div>

        {/* Lado derecho: Info de usuario */}
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-700 leading-tight">
              {perfil?.Nombres || 'Usuario Invitado'}
            </p>
            {/* <p className="text-[10px] text-slate-400 uppercase tracking-wider">
              {perfil?.Estatus || 'Activo'}
            </p> */}
          </div>

          <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-indigo-100 shadow-inner bg-gray-50">
            <img
              src={perfil?.PathFotoEmpleado || avatarDefault}
              alt="Perfil"
              className="h-full w-full object-cover"
              onError={(e) => {
                // Si la imagen del servidor falla, ponemos el placeholder
                e.target.src = avatarDefault;
              }}
            />
          </div>
        </div>

      </div>
    </header>
  );
}