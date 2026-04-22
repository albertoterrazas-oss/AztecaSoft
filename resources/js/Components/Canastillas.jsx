import React, { useState, useEffect } from 'react';
import { Check, ShoppingBasket, Loader2 } from 'lucide-react';
import axios from 'axios';

const CanastillaModal = ({ isOpen, onClose, basculaId, onConfirm }) => {
    const [cajas, setCajas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [manualWeight, setManualWeight] = useState("");

    useEffect(() => {
        if (isOpen) fetchCajas();
    }, [isOpen]);

    const fetchCajas = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/cajas');
            const dataFormateada = response.data
                .filter(caja => String(caja.Estatus) === "1")
                .map((caja) => ({
                    id: caja.IdTipoCaja,
                    nombre: caja.Nombre,
                    peso: parseFloat(caja.Tara).toFixed(2),
                    colorHex: caja.Color || '#64748b'
                }));
            setCajas(dataFormateada);
        } catch (error) {
            console.error("Error cargando cajas:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item) => {
        setSelectedId(item.id);
        setManualWeight(item.peso);
    };

    const handleConfirmar = () => {
        if (selectedId) {
            const cajaSeleccionada = cajas.find(c => c.id === selectedId);
            onConfirm(basculaId, manualWeight, cajaSeleccionada);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 font-black uppercase">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 text-white flex justify-between items-start" style={{background:'#A61A18'}}> 
                    <div>
                        <h2 className="text-3xl font-black tracking-tighter italic leading-none">SELECCIONA CANASTILLA</h2>
                        {/* <p className="text-red-100 text-xs font-bold mt-2 tracking-widest">Configuración de Tara</p> */}
                    </div>
                    {loading && <Loader2 className="animate-spin text-red-200" size={24} />}
                </div>

                <div className="p-6 max-h-[400px] overflow-y-auto grid grid-cols-2 gap-4 custom-scrollbar bg-slate-900">
                    {cajas.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className={`relative p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2
                                ${selectedId === item.id 
                                    ? 'border-white bg-slate-800 shadow-xl scale-95' 
                                    : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-600'}`}
                        >
                            <ShoppingBasket style={{ color: item.colorHex }} size={52} strokeWidth={1.5} />
                            <div className="text-center">
                                <span className={`block text-sm font-black truncate w-32 ${selectedId === item.id ? 'text-white' : 'text-slate-400'}`}>
                                    {item.nombre}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 italic">Tara: {item.peso} kg</span>
                            </div>
                            {selectedId === item.id && (
                                <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-lg">
                                    <Check className="text-slate-900" size={12} strokeWidth={4} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-8 bg-slate-800/80 border-t border-slate-700">
                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-4 font-bold text-slate-400 hover:text-white transition-all">CERRAR</button>
                        <button 
                            disabled={!selectedId} 
                            onClick={handleConfirmar}
                            style={{background: selectedId ? '#A61A18' : '#334155'}}
                            className="flex-[2] py-4 rounded-2xl font-black text-white text-lg transition-all"
                        >
                            {selectedId ? `CAPTURAR ${manualWeight} kg` : 'SELECCIONAR'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CanastillaModal;