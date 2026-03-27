import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from "sonner";
import { Loader2, Weight, Scale, X, Zap } from "lucide-react";

const BasculaModal = ({
    isOpen,
    onClose,
    onConfirm,
    basculaId = "",
    currentReading = 0,
    tara = 0,
    title = "Captura de Peso",
    subtitle = "Lectura en tiempo real",
    buttonText = "Confirmar Peso",
    colorClass = "bg-green-600 border-green-900 hover:bg-green-500",
    disabledConfirm = false,
    showSimulate = true,
    destinationName
}) => {
    // --- ESTADOS ---
    const [manualWeight, setManualWeight] = useState("0");
    const [manualTara, setManualTara] = useState("0");
    const [basculas, setBasculas] = useState([]);
    const [selectedBascula, setSelectedBascula] = useState(basculaId);
    const [isLoading, setIsLoading] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);

    // --- EFECTOS ---
    // IMPORTANTE: Solo disparamos esto cuando el modal se ABRE (isOpen cambia de false a true)
    // Si metemos currentReading aquí, cada que cambie nos va a borrar lo capturado.
    useEffect(() => {
        if (isOpen) {
            setManualWeight(currentReading.toString());
            setManualTara(tara.toString());
            setSelectedBascula(basculaId); // Resetear a la báscula por defecto si aplica
            fetchBasculas();
        }
    }, [isOpen]); 

    const fetchBasculas = async () => {
        try {
            const response = await axios.get('/api/basculas');
            setBasculas(response.data);
        } catch (error) {
            toast.error("Error al cargar catálogo de básculas");
        }
    };

    // --- LÓGICA DEL SIMULADOR ---
    const handleSimulateWeight = () => {
        setIsSimulating(true);
        setTimeout(() => {
            const fakeWeight = (Math.random() * (3500 - 800) + 800).toFixed(3);
            setManualWeight(fakeWeight);
            setIsSimulating(false);
            // toast.success("Peso simulado: " + fakeWeight + " kg");
        }, 800);
    };

    // --- CAPTURA REAL ---
    const handleCaptureWeight = async () => {
        if (!selectedBascula) {
            toast.warning("Selecciona una báscula primero", { id: 'warn-bascula' });
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post("/api/obtenerPorPuerto", { puerto: selectedBascula });
            
            if (response.data.status === 'success' || response.data.status === 'ok') {
                const nuevoPeso = response.data.data.peso;
                setManualWeight(nuevoPeso.toString());
                // toast.success("Lectura obtenida: " + nuevoPeso + " kg");
            } else {
                toast.error("La báscula no devolvió un peso válido");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error de comunicación con el puerto " + selectedBascula);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    // --- CÁLCULOS ---
    const bruto = parseFloat(manualWeight || 0);
    const taraVal = parseFloat(manualTara || 0);
    const esModoTara = title.toUpperCase().includes("TARA");
    
    // Si es modo tara, mostramos el bruto. Si no, mostramos neto (Bruto - Tara)
    const valorAMostrar = esModoTara ? bruto : Math.max(0, bruto - taraVal);

    const handleConfirm = () => {
        const p = bruto.toFixed(3);
        const t = esModoTara ? bruto.toFixed(3) : taraVal.toFixed(3);
        onConfirm(p, t);
    };

    const inputCleanClass = "bg-transparent outline-none focus:ring-0 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 animate-in fade-in duration-200"style={{zoom:0.9}}>
            <div className="bg-slate-900 w-full max-w-2xl rounded-[4rem] p-10 border-4 border-slate-700 shadow-2xl relative max-h-[95vh]">

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="text-left">
                        <h2 className="text-white text-3xl font-black uppercase tracking-widest">{title}</h2>
                        <p className="text-slate-500 text-sm mt-2 font-bold uppercase tracking-widest">{subtitle}</p>
                    </div>
                    {destinationName && (
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg uppercase">
                            DESTINO: {destinationName}
                        </div>
                    )}
                </div>

                {/* Selector de Báscula */}
                <div className="mb-4">
                    <label className="text-slate-500 text-[10px] font-bold uppercase ml-2 mb-1 block">Puerto / Dispositivo</label>
                    <select
                        value={selectedBascula}
                        onChange={(e) => setSelectedBascula(e.target.value)}
                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-blue-500 cursor-pointer appearance-none transition-colors"
                    >
                        <option value="">--- Selecciona Báscula ---</option>
                        {basculas.map((b) => (
                            <option key={b.puerto} value={b.puerto}>
                                {b.nombre || b.Nombre} ({b.puerto})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-6">
                    {/* Botón Capturar Real */}
                    <button
                        type="button"
                        onClick={handleCaptureWeight}
                        disabled={isLoading || isSimulating || !selectedBascula}
                        className={`w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-lg font-black border-b-4 border-blue-900 active:translate-y-1 active:border-b-0 uppercase flex items-center justify-center gap-2 shadow-lg transition-all ${(!selectedBascula || isLoading) && 'opacity-50'}`}
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Scale className="w-6 h-6" />}
                        {isLoading ? "OBTENIENDO PESO..." : "CAPTURAR PESO REAL"}
                    </button>

                    {/* Botón Simulador */}
                    {showSimulate && (
                        <button
                            type="button"
                            onClick={handleSimulateWeight}
                            disabled={isSimulating || isLoading}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-lg font-black border-b-4 border-orange-900 active:translate-y-1 active:border-b-0 uppercase flex items-center justify-center gap-2 shadow-lg transition-all"
                        >
                            {isSimulating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-current" />}
                            {isSimulating ? "SIMULANDO..." : "SIMULAR LECTURA"}
                        </button>
                    )}
                </div>

                {/* Display Industrial */}
                <div className={`bg-[#050a08] rounded-[3rem] p-10 border-8 ${isSimulating ? 'border-amber-600' : (isLoading ? 'border-blue-600' : 'border-black')} shadow-inner mb-6 text-center relative overflow-hidden transition-colors`}>
                    
                    <div className="flex justify-around mb-4 border-b border-white/5 pb-4">
                        <div className="text-center">
                            <span className="block text-[10px] text-slate-600 font-black uppercase">Peso Bruto</span>
                            <input
                                type="number"
                                step="0.001"
                                value={manualWeight}
                                onChange={(e) => setManualWeight(e.target.value)}
                                className={`${inputCleanClass} text-2xl font-mono text-blue-400 text-center w-32`}
                            />
                        </div>
                        {!esModoTara && (
                            <div className="text-center">
                                <span className="block text-[10px] text-slate-600 font-black uppercase">Tara</span>
                                <div className="flex items-center justify-center text-red-500">
                                    <span className="text-2xl font-mono">-</span>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={manualTara}
                                        onChange={(e) => setManualTara(e.target.value)}
                                        className={`${inputCleanClass} text-2xl font-mono text-red-500 text-center w-32`}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative py-4" style={{zoom:0.4}}>
                        <div
                            className={`w-full font-mono ${isSimulating ? 'text-amber-400' : 'text-green-400'} leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(74,222,128,0.4)] text-center text-[clamp(3rem,10vw,7rem)] whitespace-nowrap transition-colors`}
                        >
                            {valorAMostrar.toFixed(3)}
                        </div>
                    </div>

                    <span className="text-green-900/50 text-sm mt-4 block tracking-[0.5em] font-black uppercase">
                        {esModoTara ? "CAPTURANDO TARA (KG)" : "PESO NETO (KG)"}
                    </span>
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-6 rounded-3xl bg-slate-800 text-white text-xl font-black uppercase border-b-[10px] border-black active:translate-y-2 active:border-b-0 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        disabled={disabledConfirm || isLoading || isSimulating || bruto <= 0}
                        onClick={handleConfirm}
                        className={`flex-1 py-6 rounded-3xl ${colorClass} text-white text-xl font-black uppercase shadow-lg transition-all 
                            ${(disabledConfirm || isLoading || isSimulating || bruto <= 0) ? 'opacity-30 cursor-not-allowed' : 'active:translate-y-2 border-b-[10px] hover:brightness-110'}`}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BasculaModal;