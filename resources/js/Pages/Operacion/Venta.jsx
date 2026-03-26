import React, { useState } from "react";
import { Toaster, toast } from "sonner";
import { Package, Trash2, RotateCcw, Box, Layers } from "lucide-react";

export default function SmartPallet3DFinal() {
  const [boxes, setBoxes] = useState([]);
  const [viewAngle, setViewAngle] = useState({ rotateX: 60, rotateZ: 45 });

  const tipos = [
    { sku: "MASTER", nombre: "Caja Master", w: 2, h: 2, alto: 80, color: "#fbbf24" },
    { sku: "CHICA", nombre: "Caja Chica", w: 1, h: 1, alto: 50, color: "#f97316" },
    { sku: "LARGA", nombre: "Caja Larga", w: 2, h: 1, alto: 60, color: "#10b981" }
  ];

  const agregarCaja = (tipo) => {
    let mejorX = -1, mejorY = -1, menorZ = Infinity;
    for (let r = 0; r <= 4 - tipo.h; r++) {
      for (let c = 0; c <= 4 - tipo.w; c++) {
        let maxZEnArea = 0;
        boxes.forEach(b => {
          if (c < b.x + b.w && c + tipo.w > b.x && r < b.y + b.h && r + tipo.h > b.y) {
            maxZEnArea = Math.max(maxZEnArea, b.zBase + b.alto);
          }
        });
        if (maxZEnArea < menorZ) {
          menorZ = maxZEnArea; mejorX = c; mejorY = r;
        }
      }
    }
    if (mejorX !== -1) {
      setBoxes([...boxes, { ...tipo, id: Date.now(), x: mejorX, y: mejorY, zBase: menorZ, peso: (10 + Math.random() * 20).toFixed(1) }]);
      toast.success("Caja sellada");
    }
  };

  const CELL = 80;

  return (
    <div className="h-screen bg-slate-950 flex overflow-hidden text-white font-sans">
      <Toaster richColors />
      
      <aside className="w-72 bg-slate-900 p-6 shadow-2xl border-r border-white/5 z-50 flex flex-col">
        <h2 className="text-xl font-black italic flex items-center gap-2 mb-8 text-blue-500 uppercase tracking-tighter">
          <Layers /> Pallet Pro 3D
        </h2>
        
        <div className="space-y-3 flex-1">
          {tipos.map(t => (
            <button key={t.sku} onClick={() => agregarCaja(t)} 
              className="w-full p-4 bg-slate-800 rounded-xl hover:bg-blue-600 transition-all text-left border-l-4 border-blue-500 shadow-lg group">
              <p className="font-black text-xs uppercase text-slate-400 group-hover:text-white transition-colors">{t.nombre}</p>
              <p className="text-[10px] font-bold text-blue-400 group-hover:text-blue-100 uppercase tracking-widest">{t.w}x{t.h} - {t.alto}mm</p>
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 bg-black/30 rounded-2xl border border-white/5">
          <p className="text-[10px] font-black uppercase text-slate-500 mb-4 text-center">Controles de Cámara</p>
          <div className="space-y-4">
            <input type="range" min="20" max="90" value={viewAngle.rotateX} onChange={e => setViewAngle({...viewAngle, rotateX: e.target.value})} className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
            <input type="range" min="0" max="360" value={viewAngle.rotateZ} onChange={e => setViewAngle({...viewAngle, rotateZ: e.target.value})} className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
          </div>
        </div>

        <button onClick={() => setBoxes([])} className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 hover:text-red-500 transition-colors uppercase">
          <RotateCcw size={14}/> Limpiar Escena
        </button>
      </aside>

      <main className="flex-1 relative flex items-center justify-center perspective-[1200px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black">
        <div 
          className="relative transition-transform duration-300"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${viewAngle.rotateX}deg) rotateZ(${viewAngle.rotateZ}deg)`,
            width: CELL * 4, height: CELL * 4
          }}
        >
          {/* BASE DEL PALLET (Sólido) */}
          <div className="absolute inset-0 bg-orange-950/80 border-2 border-orange-900" style={{ transform: "translateZ(-20px)", transformStyle: "preserve-3d" }}>
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-20">
               {[...Array(16)].map((_, i) => <div key={i} className="border border-white/20" />)}
            </div>
            {/* Laterales del Pallet para cerrar el volumen de la base */}
            <div className="absolute w-full h-[20px] bg-orange-950 bottom-0" style={{ transform: "rotateX(-90deg)", transformOrigin: "bottom" }} />
            <div className="absolute h-full w-[20px] bg-orange-900 right-0" style={{ transform: "rotateY(90deg)", transformOrigin: "right" }} />
          </div>

          {/* CAJAS TOTALMENTE CERRADAS */}
          {boxes.map(box => {
            const w = box.w * CELL - 4;
            const h = box.h * CELL - 4;
            const d = box.alto;

            return (
              <div key={box.id} className="absolute"
                style={{
                  width: w, height: h,
                  left: box.x * CELL + 2, top: box.y * CELL + 2,
                  transform: `translateZ(${box.zBase}px)`,
                  transformStyle: "preserve-3d"
                }}>
                
                {/* 1. TOP (Tapa) */}
                <div className="absolute inset-0 border border-black/20 flex flex-col items-center justify-center shadow-inner" 
                  style={{ transform: `translateZ(${d}px)`, backgroundColor: box.color, backfaceVisibility: "hidden" }}>
                  <p className="text-[10px] font-black text-black/40">{box.sku}</p>
                  <p className="text-xl font-black text-black leading-none">{box.peso}kg</p>
                </div>

                {/* 2. BOTTOM (Base de la caja) */}
                <div className="absolute inset-0 bg-black/60" style={{ transform: "rotateX(180deg)", backfaceVisibility: "hidden" }} />

                {/* 3. FRONT */}
                <div className="absolute w-full border border-black/30 shadow-inner" 
                  style={{ height: d, top: "100%", transformOrigin: "top", transform: "rotateX(-90deg)", backgroundColor: box.color, filter: "brightness(0.8)", backfaceVisibility: "hidden" }} />

                {/* 4. BACK */}
                <div className="absolute w-full border border-black/30 shadow-inner" 
                  style={{ height: d, top: 0, transformOrigin: "top", transform: "rotateX(90deg) translateZ("+h+"px)", backgroundColor: box.color, filter: "brightness(0.6)", backfaceVisibility: "hidden" }} />

                {/* 5. RIGHT */}
                <div className="absolute h-full border border-black/30 shadow-inner" 
                  style={{ width: d, left: "100%", transformOrigin: "left", transform: "rotateY(90deg)", backgroundColor: box.color, filter: "brightness(0.9)", backfaceVisibility: "hidden" }} />

                {/* 6. LEFT */}
                <div className="absolute h-full border border-black/30 shadow-inner" 
                  style={{ width: d, left: 0, transformOrigin: "left", transform: "rotateY(-90deg)", backgroundColor: box.color, filter: "brightness(0.7)", backfaceVisibility: "hidden" }} />

                {/* BOTÓN ELIMINAR (Solo en la tapa superior) */}
                <button onClick={() => setBoxes(boxes.filter(b => b.id !== box.id))}
                  className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1.5 opacity-0 hover:opacity-100 transition-opacity z-50 shadow-2xl"
                  style={{ transform: `translateZ(${d + 10}px)` }}>
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-\\[1200px\\] { perspective: 1200px; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px; width: 12px;
          border-radius: 50%; background: #3b82f6;
          cursor: pointer; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
      `}} />
    </div>
  );
}