import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';
import { toast, Toaster } from 'sonner'; // Importamos el disparador y el contenedor

const HeaderPanel = ({ title, subtitle, badgeText, onRefresh }) => {
  
  const handleRefresh = () => {
    // 1. Ejecutamos la función original que viene por props
    if (onRefresh) onRefresh();

    // 2. Disparamos la alerta visual (Toast)
    toast.success('Datos actualizados', {
      description: 'La información del panel se ha refrescado correctamente.',
      style: {
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '16px',
      },
    });
  };

  return (
    <>
      {/* El Toaster debe estar presente en el árbol de componentes una sola vez */}
      <Toaster position="top-right" richColors closeButton />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full md:w-auto"
        >
          {/* Badge superior */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-white px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest shadow-lg shadow-blue-900/20 uppercase bg-[#1B2654]">
              {badgeText}
            </span>
          </div>

          {/* Título Principal */}
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter italic leading-tight">
            {title} <br className="block md:hidden" />
            <span className="font-bold not-italic" style={{ color: '#A61A18' }}>
              {subtitle}
            </span>
          </h1>
        </motion.div>

        {/* Botón de Acción */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh} // Usamos la nueva función controladora
          className="w-full md:w-auto bg-[#1B2654] text-white px-8 h-14 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest transition-all"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            key={Date.now()} // Esto hace que el icono gire cada vez que haces click
          >
            <RefreshCcw size={20} />
          </motion.div>
          <span>Refrescar</span>
        </motion.button>
      </header>
    </>
  );
};

export default HeaderPanel;