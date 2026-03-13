// import React, { useState, useEffect } from 'react';

// /**
//  * BasculaModal - Componente de pesaje con soporte de edición manual para pruebas.
//  */
// const BasculaModal = ({
//     isOpen,
//     onClose,
//     onConfirm,
//     currentReading = 0,
//     tara = 0,
//     title = "Captura de Peso",
//     subtitle = "Lectura en tiempo real",
//     buttonText = "Confirmar Peso",
//     colorClass = "bg-green-600 border-green-900 hover:bg-green-500",
//     disabledConfirm = false,
//     showSimulate = false,
//     onSimulate,
//     destinationName
// }) => {
//     // 1. Estados locales para permitir la sobrescritura manual (Pruebas)
//     const [manualWeight, setManualWeight] = useState(currentReading);
//     const [manualTara, setManualTara] = useState(tara);

//     // 2. Sincronización: Si el sensor real manda un dato, actualizamos el manual
//     useEffect(() => {
//         setManualWeight(currentReading);
//     }, [currentReading]);

//     useEffect(() => {
//         setManualTara(tara);
//     }, [tara]);

//     if (!isOpen) return null;

//     // 3. Cálculos dinámicos
//     const bruto = parseFloat(manualWeight || 0);
//     const taraVal = parseFloat(manualTara || 0);
//     const neto = Math.max(0, bruto - taraVal).toFixed(2);

//     const handleConfirm = () => {
//         // Devolvemos el bruto y la tara al padre por si hubo ajustes manuales
//         onConfirm(bruto, taraVal);
//     };

//     // Estilo base para inputs que parecen texto plano (sin bordes ni flechas)
//     const inputCleanClass = "bg-transparent outline-none focus:ring-0 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

//     return (
//         <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
//             <div className="bg-slate-900 w-full max-w-2xl rounded-[4rem] p-10 border-4 border-slate-700 shadow-2xl animate-in zoom-in duration-300">

//                 {/* Header */}
//                 <div className="flex justify-between items-start mb-6">
//                     <div className="text-left">
//                         <h2 className="text-white text-3xl tracking-widest font-black uppercase leading-none">{title}</h2>
//                         <p className="text-slate-500 text-sm mt-2 tracking-widest font-bold uppercase">{subtitle}</p>
//                     </div>
//                     {destinationName && (
//                         <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-tighter shadow-lg shadow-blue-900/40">
//                             DESTINO: {destinationName}
//                         </div>
//                     )}
//                 </div>

//                 {/* Display Central (Estilo Báscula Industrial) */}
//                 <div className="bg-[#0f1713] rounded-[3rem] p-10 border-8 border-black shadow-inner mb-6 text-center relative overflow-hidden">

//                     {/* Indicadores Superiores (Editables) */}
//                     <div className="flex justify-around mb-4 border-b border-white/5 pb-4">
//                         <div className="text-center group">
//                             <span className="block text-[10px] text-slate-500 font-black uppercase">Peso Bruto</span>
//                             <input
//                                 type="number"
//                                 value={manualWeight}
//                                 onChange={(e) => setManualWeight(e.target.value)}
//                                 className={`${inputCleanClass} text-2xl font-mono text-blue-400 text-center w-32 cursor-edit`}
//                             />
//                         </div>
//                         <div className="text-center group">
//                             <span className="block text-[10px] text-slate-500 font-black uppercase">Tara</span>
//                             <div className="flex items-center justify-center text-red-500">
//                                 <span className="text-2xl font-mono">-</span>
//                                 <input
//                                     type="number"
//                                     value={manualTara}
//                                     onChange={(e) => setManualTara(e.target.value)}
//                                     className={`${inputCleanClass} text-2xl font-mono text-red-500 text-center w-32`}
//                                 />
//                             </div>
//                         </div>
//                     </div>

//                     {/* Lectura Principal (Neto o Bruto según corresponda) */}
//                     <div className="relative group">
//                         <input
//                             type="number"
//                             value={taraVal > 0 ? neto : bruto}
//                             onChange={(e) => setManualWeight(e.target.value)}
//                             className={`w-full ${inputCleanClass} text-[10rem] font-mono text-green-400 leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] text-center`}
//                             readOnly={taraVal > 0} // Se bloquea si hay tara para forzar el cálculo automático
//                         />
//                         <div className="absolute top-0 right-0 text-[10px] text-green-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase">
//                             Modo Pruebas Activado
//                         </div>
//                     </div>

//                     <span className="text-green-900 text-sm mt-4 block tracking-[0.5em] font-black uppercase">
//                         {taraVal > 0 ? "PESO NETO (KG)" : "LECTURA BRUTA (KG)"}
//                     </span>
//                 </div>

//                 {/* Botón de Simulación (Opcional) */}
//                 {showSimulate && (
//                     <button
//                         onClick={onSimulate}
//                         className="w-full mb-6 py-5 rounded-2xl bg-blue-600 text-white text-xl font-black hover:bg-blue-500 transition-all border-b-8 border-blue-900 active:translate-y-1 active:border-b-0 uppercase"
//                     >
//                         Capturar Peso Báscula
//                     </button>
//                 )}

//                 {/* Acciones */}
//                 <div className="flex gap-6">
//                     <button
//                         onClick={onClose}
//                         className="flex-1 py-7 rounded-3xl bg-slate-800 text-white text-xl font-black hover:bg-slate-700 transition-all uppercase border-b-[10px] border-black active:translate-y-2 active:border-b-0"
//                     >
//                         Cancelar
//                     </button>
//                     <button
//                         disabled={disabledConfirm}
//                         onClick={handleConfirm}
//                         className={`flex-1 py-7 rounded-3xl ${colorClass} text-white text-xl font-black shadow-lg uppercase transition-all ${disabledConfirm ? 'opacity-30 cursor-not-allowed border-b-0' : 'active:translate-y-2 active:border-b-0 border-b-[10px]'}`}
//                     >
//                         {buttonText}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default BasculaModal;


import React, { useState, useEffect } from 'react';

const BasculaModal = ({
    isOpen,
    onClose,
    onConfirm,
    currentReading = 0,
    tara = 0,
    title = "Captura de Peso",
    subtitle = "Lectura en tiempo real",
    buttonText = "Confirmar Peso",
    colorClass = "bg-green-600 border-green-900 hover:bg-green-500",
    disabledConfirm = false,
    showSimulate = false,
    onSimulate,
    destinationName
}) => {
    // Sincronizamos los estados locales con las props cuando el modal se abre
    const [manualWeight, setManualWeight] = useState(currentReading);
    const [manualTara, setManualTara] = useState(tara);

    useEffect(() => {
        if (isOpen) {
            setManualWeight(currentReading);
        }
    }, [currentReading, isOpen]);

    useEffect(() => {
        if (isOpen) {
            setManualTara(tara);
        }
    }, [tara, isOpen]);

    if (!isOpen) return null;

    const bruto = parseFloat(manualWeight || 0);
    const taraVal = parseFloat(manualTara || 0);

    // CORRECCIÓN: Si el título incluye "TARA", ignoramos el cálculo del neto 
    // para que el display principal siempre muestre lo que hay en la báscula.
    const esModoTara = title.toUpperCase().includes("TARA");
    const valorAMostrar = esModoTara ? bruto : Math.max(0, bruto - taraVal);

    const handleConfirm = () => {
        // Importante: Devolvemos el valor bruto actual para que el padre lo asigne a la tara
        onConfirm(bruto.toFixed(2), taraVal.toFixed(2));
    };

    const inputCleanClass = "bg-transparent outline-none focus:ring-0 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-2xl rounded-[4rem] p-10 border-4 border-slate-700 shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="text-left">
                        <h2 className="text-white text-3xl font-black uppercase tracking-widest">{title}</h2>
                        <p className="text-slate-500 text-sm mt-2 font-bold uppercase tracking-widest">{subtitle}</p>
                    </div>
                    {destinationName && (
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg">
                            DESTINO: {destinationName}
                        </div>
                    )}
                </div>

                {/* Display Industrial */}
                <div className="bg-[#0f1713] rounded-[3rem] p-10 border-8 border-black shadow-inner mb-6 text-center relative overflow-hidden">

                    <div className="flex justify-around mb-4 border-b border-white/5 pb-4">
                        <div className="text-center">
                            <span className="block text-[10px] text-slate-500 font-black uppercase">Peso Bruto</span>
                            <input
                                type="number"
                                value={manualWeight}
                                onChange={(e) => setManualWeight(e.target.value)}
                                className={`${inputCleanClass} text-2xl font-mono text-blue-400 text-center w-32`}
                            />
                        </div>
                        {/* Solo mostramos la resta de tara si NO estamos en modo pesar tara */}
                        {!esModoTara && (
                            <div className="text-center">
                                <span className="block text-[10px] text-slate-500 font-black uppercase">Tara</span>
                                <div className="flex items-center justify-center text-red-500">
                                    <span className="text-2xl font-mono">-</span>
                                    <input
                                        type="number"
                                        value={manualTara}
                                        onChange={(e) => setManualTara(e.target.value)}
                                        className={`${inputCleanClass} text-2xl font-mono text-red-500 text-center w-32`}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Lectura Principal */}
                    <div className="relative">
                        <input
                            type="number"
                            value={valorAMostrar}
                            onChange={(e) => setManualWeight(e.target.value)}
                            className={`w-full ${inputCleanClass} text-[10rem] font-mono text-green-400 leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] text-center`}
                            readOnly={!esModoTara && taraVal > 0}
                        />
                    </div>

                    <span className="text-green-900 text-sm mt-4 block tracking-[0.5em] font-black uppercase">
                        {esModoTara ? "CAPTURANDO TARA (KG)" : "PESO NETO (KG)"}
                    </span>
                </div>

                {showSimulate && (
                    <button
                        onClick={onSimulate}
                        className="w-full mb-6 py-5 rounded-2xl bg-blue-600 text-white text-xl font-black border-b-8 border-blue-900 active:translate-y-1 active:border-b-0 uppercase"
                    >
                        Simular Lectura Báscula
                    </button>
                )}

                <div className="flex gap-6">
                    <button onClick={onClose} className="flex-1 py-7 rounded-3xl bg-slate-800 text-white text-xl font-black uppercase border-b-[10px] border-black active:translate-y-2 active:border-b-0">
                        Cancelar
                    </button>
                    <button
                        disabled={disabledConfirm}
                        onClick={handleConfirm}
                        className={`flex-1 py-7 rounded-3xl ${colorClass} text-white text-xl font-black uppercase shadow-lg transition-all ${disabledConfirm ? 'opacity-30 cursor-not-allowed' : 'active:translate-y-2 border-b-[10px]'}`}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BasculaModal;