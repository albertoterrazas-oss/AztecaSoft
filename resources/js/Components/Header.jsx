import React from 'react';
// Importante: Asegúrate de que la ruta de la imagen sea correcta según tu estructura
import logo from '../../../public/img/logo.png'; 
import { Link } from 'react-router-dom';

export default function Header() {
  // 1. Obtenemos el string de localStorage
  const userStorage = localStorage.getItem('perfil');
  
  // 2. Convertimos el string a objeto (y manejamos si no existe)
  const perfil = userStorage ? JSON.parse(userStorage) : null;

  // Si no hay perfil, podrías retornar null o un header genérico
  if (!perfil) {
    return <header>Cargando...</header>; 
  }

  return (
    <header className="w-full bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">

        {/* Lado izquierdo: Título o Logo */}
        <div className="flex items-center">
          <Link title="Ir al inicio" to="/">
            <h1 className="text-lg font-bold text-slate-800">
              Catálogo de Usuarios
            </h1>
          </Link>
        </div>

        {/* Lado derecho: Info de usuario */}
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-slate-600">
            {perfil.Nombres || 'Usuario'} 
          </span>
          <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-300 bg-gray-100">
            {perfil.PathFotoEmpleado ? (
              <img
                src={perfil.PathFotoEmpleado}
                alt="Perfil de usuario"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">
                Sin foto
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}