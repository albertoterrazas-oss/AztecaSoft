import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import XLSX from 'xlsx-js-style';
import axios from 'axios';
import {
    Search, FileText, Download, Calendar, Loader2,
    Table as TableIcon, ClipboardList, UserCheck,
    Package, ChevronUp, ChevronDown, Filter
} from 'lucide-react';

const ReportesView = () => {
    const getTodayISO = () => new Date().toISOString().split('T')[0];
    const getFormattedDate = () => new Date().toLocaleDateString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // --- ESTADOS ---
    const [tipoReporte, setTipoReporte] = useState('lotes_proveedor');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [subTab, setSubTab] = useState('inventario');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Catálogos
    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);
    const [filtros, setFiltros] = useState({
        idProveedor: '', idLote: '', idProducto: '', clasificacion: '',
        fechaInicio: getTodayISO(), fechaFin: getTodayISO()
    });

    // --- CARGA DE DATOS ---
    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                const [resProv, resProd] = await Promise.all([
                    axios.get("/api/proveedores"),
                    axios.get("/api/productos")
                ]);
                setProveedores(resProv.data);
                setProductos(resProd.data);
            } catch (error) {
                console.error("Error catálogos:", error);
                toast.error("Error al cargar catálogos");
            }
        };
        fetchCatalogos();
    }, []);

    const handleInputChange = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

    // --- LÓGICA DE TABLA ---
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        let items = data ? (tipoReporte === 'inventario_completo' ? [...data[subTab]] : [...data]) : [];
        if (sortConfig.key !== null && items.length > 0) {
            items.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [data, subTab, sortConfig, tipoReporte]);

    const canSubmit = () => {
        if (tipoReporte === 'lotes_proveedor') return filtros.idProveedor && filtros.fechaInicio;
        if (tipoReporte === 'productos_lote') return filtros.idLote;
        if (tipoReporte === 'detalle_reparticion') return filtros.idLote && filtros.idProducto;
        return filtros.fechaInicio && filtros.fechaFin;
    };

    const consultarReporte = async () => {
        setLoading(true);
        setData(null);
        try {
            const endpoint = tipoReporte.replace(/_/g, '-');
            const response = await axios.get(`/api/reportes/${endpoint}`, { params: filtros });
            
            const hasData = Array.isArray(response.data) 
                ? response.data.length > 0 
                : (response.data.inventario && response.data.inventario.length > 0);

            if (!hasData) throw new Error("Sin datos encontrados");

            setData(response.data);
            toast.success("AZTECA AVT: Reporte generado");
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        } finally { setLoading(false); }
    };

    // --- EXPORTACIÓN EXCEL (MÁXIMO NIVEL) ---
    const exportarExcel = () => {
        const wb = XLSX.utils.book_new();

        if (tipoReporte === 'inventario_completo') {
            const ws = XLSX.utils.aoa_to_sheet([
                ["AZTECA AVT - CONTROL DE INVENTARIO Y MOVIMIENTOS"],
                [`FECHA DE REPORTE: ${getFormattedDate()}`],
                []
            ]);

            const secciones = [
                { titulo: 'Inventario', datos: data.inventario, colInicio: 0, color: "DBEAFE" },
                { titulo: 'Entradas', datos: data.entradas, colInicio: 3, color: "FFEDD5" },
                { titulo: 'Salidas', datos: data.salidas, colInicio: 6, color: "DCFCE7" }
            ];

            secciones.forEach((sec) => {
                const filaInicio = 4;
                const titleRef = XLSX.utils.encode_cell({ r: filaInicio - 1, c: sec.colInicio });
                ws[titleRef] = { v: sec.titulo, s: { font: { bold: true, size: 14 } } };

                ["Etiquetas de fila", "Suma de Kilos"].forEach((h, i) => {
                    const cellRef = XLSX.utils.encode_cell({ r: filaInicio, c: sec.colInicio + i });
                    ws[cellRef] = {
                        v: h,
                        s: { fill: { fgColor: { rgb: "334155" } }, font: { color: { rgb: "FFFFFF" }, bold: true }, alignment: { horizontal: "center" } }
                    };
                });

                sec.datos.forEach((item, idx) => {
                    const r = filaInicio + 1 + idx;
                    const valores = Object.values(item);
                    valores.slice(0, 2).forEach((val, i) => {
                        const cellRef = XLSX.utils.encode_cell({ r: r, c: sec.colInicio + i });
                        ws[cellRef] = {
                            v: val,
                            s: { fill: { fgColor: { rgb: sec.color } }, alignment: { horizontal: i === 1 ? "right" : "left" }, numFmt: i === 1 ? "#,##0.00" : "" }
                        };
                    });
                });
            });

            ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 5 }, { wch: 25 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(wb, ws, "MOVIMIENTOS");
        } else {
            const headers = Object.keys(sortedData[0]).map(h => h.toUpperCase().replace(/_/g, ' '));
            const rows = sortedData.map(obj => Object.values(obj));
            const hColor = tipoReporte === 'reporte_detallado' ? "A61A18" : "1B2654";

            const ws = XLSX.utils.aoa_to_sheet([
                [`AZTECA AVT - ${tipoReporte.toUpperCase()}`],
                [`EMISIÓN: ${getFormattedDate()}`],
                [],
                headers,
                ...rows
            ]);

            const range = XLSX.utils.decode_range(ws['!ref']);
            for (let c = range.s.c; c <= range.e.c; c++) {
                const cell = XLSX.utils.encode_cell({ r: 3, c: c });
                if (ws[cell]) ws[cell].s = { fill: { fgColor: { rgb: hColor } }, font: { color: { rgb: "FFFFFF" }, bold: true } };
            }
            ws['!cols'] = headers.map(() => ({ wch: 22 }));
            XLSX.utils.book_append_sheet(wb, ws, "REPORTE");
        }

        XLSX.writeFile(wb, `AZTECA_${tipoReporte.toUpperCase()}_${getTodayISO()}.xlsx`);
    };

    return (
        <div className="h-full bg-[#f8fafc] p-4 md:p-10 font-sans text-slate-800">
            <Toaster position="top-right" richColors />
            <div className="max-w-7xl mx-auto">
                {/* HEADER */}
                <header className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-white px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest bg-[#1B2654]">AZTECA AVT</span>
                            <span className="text-slate-400 text-[10px] font-bold uppercase">{getFormattedDate()}</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">CENTRAL <span className="font-bold not-italic" style={{ color: '#A61A18' }}>REPORTES</span></h1>
                    </motion.div>
                    {data && (
                        <button onClick={exportarExcel} className="bg-[#10b981] hover:bg-emerald-700 text-white px-8 h-14 rounded-2xl font-black shadow-xl flex items-center gap-3 uppercase text-[10px] tracking-widest transition-all active:scale-95">
                            <Download size={20} /> Exportar Excel Pro
                        </button>
                    )}
                </header>

                {/* FILTROS */}
                <section className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 mb-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                        <div className="lg:col-span-4 flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Filter size={12} /> Documento</label>
                            <select value={tipoReporte} onChange={(e) => { setTipoReporte(e.target.value); setData(null); }} className="w-full h-12 bg-slate-50 border-2 border-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none shadow-inner cursor-pointer appearance-none">
                                <option value="lotes_proveedor">Lotes por Proveedor</option>
                                <option value="productos_lote">Productos por Lote</option>
                                <option value="detalle_reparticion">Detalle de Repartición</option>
                                <option value="inventario_completo">Inventario Completo</option>
                                <option value="reporte_detallado">Reporte Detallado</option>
                            </select>
                        </div>

                        <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <AnimatePresence mode="wait">
                                {tipoReporte === 'lotes_proveedor' && (
                                    <motion.div key="p" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><UserCheck size={12} /> PROVEEDOR</label>
                                        <select name="idProveedor" value={filtros.idProveedor} onChange={handleInputChange} className="w-full h-12 bg-slate-50 border-none rounded-xl px-3 font-bold text-sm shadow-inner outline-none">
                                            <option value="">Seleccionar...</option>
                                            {proveedores.map(p => <option key={p.IdProveedor} value={p.IdProveedor}>{p.RazonSocial}</option>)}
                                        </select>
                                    </motion.div>
                                )}
                                {tipoReporte === 'detalle_reparticion' && (
                                    <motion.div key="pr" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Package size={12} /> PRODUCTO</label>
                                        <select name="idProducto" value={filtros.idProducto} onChange={handleInputChange} className="w-full h-12 bg-slate-50 border-none rounded-xl px-3 font-bold text-sm shadow-inner outline-none">
                                            <option value="">Seleccionar...</option>
                                            {productos.map(p => <option key={p.IdProducto} value={p.IdProducto}>{p.Nombre}</option>)}
                                        </select>
                                    </motion.div>
                                )}
                                {(tipoReporte === 'productos_lote' || tipoReporte === 'detalle_reparticion') && (
                                    <motion.div key="l" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-tighter">ID LOTE</label>
                                        <input name="idLote" type="number" onChange={handleInputChange} value={filtros.idLote} className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-bold shadow-inner outline-none" placeholder="00" />
                                    </motion.div>
                                )}
                                {tipoReporte === 'reporte_detallado' && (
                                    <motion.div key="clas" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Filter size={12}/> CLASIFICACIÓN</label>
                                        <select name="clasificacion" value={filtros.clasificacion} onChange={handleInputChange} className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-sm shadow-inner outline-none cursor-pointer appearance-none">
                                            <option value="">TODAS</option>
                                            <option value="VISCERA">VÍSCERAS</option>
                                            <option value="CARNE">CARNE</option>
                                        </select>
                                    </motion.div>
                                )}
                                {(tipoReporte === 'lotes_proveedor' || tipoReporte === 'inventario_completo' || tipoReporte === 'reporte_detallado') && (
                                    <>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Inicio</label>
                                            <input name="fechaInicio" type="date" value={filtros.fechaInicio} onChange={handleInputChange} className="w-full h-12 bg-slate-50 border-none rounded-xl px-3 font-bold text-xs shadow-inner outline-none" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fin</label>
                                            <input name="fechaFin" type="date" value={filtros.fechaFin} onChange={handleInputChange} className="w-full h-12 bg-slate-50 border-none rounded-xl px-3 font-bold text-xs shadow-inner outline-none" />
                                        </div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="lg:col-span-2">
                            <button onClick={consultarReporte} disabled={loading || !canSubmit()} className={`w-full h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${!canSubmit() ? 'bg-slate-100 text-slate-300' : 'bg-[#1B2654] text-white shadow-xl hover:bg-blue-900 active:scale-95'}`}>
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />} {loading ? "PROCESANDO" : "GENERAR"}
                            </button>
                        </div>
                    </div>
                </section>

                {/* TABLA VISUAL */}
                <AnimatePresence mode="wait">
                    {data ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            {tipoReporte === 'inventario_completo' && (
                                <div className="flex gap-2 mb-6 p-1.5 bg-slate-200/50 w-fit rounded-2xl backdrop-blur-sm">
                                    {['inventario', 'entradas', 'salidas'].map(t => (
                                        <button key={t} onClick={() => setSubTab(t)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === t ? 'bg-white text-blue-700 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
                                    ))}
                                </div>
                            )}
                            <div className="bg-white shadow-2xl border border-slate-100 overflow-hidden rounded-2xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-[#1B2654]">
                                                {sortedData.length > 0 && Object.keys(sortedData[0]).map(key => (
                                                    <th key={key} onClick={() => requestSort(key)} className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-colors border-r border-slate-800 last:border-0 group">
                                                        <div className="flex items-center justify-between gap-2">
                                                            {key.replace(/_/g, ' ')}
                                                            {sortConfig.key === key && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-blue-400" /> : <ChevronDown size={12} className="text-blue-400" />)}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 uppercase tracking-tight">
                                            {sortedData.map((row, i) => (
                                                <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                                                    {Object.values(row).map((val, j) => <td key={j} className="px-8 py-5 text-sm font-bold text-slate-600 whitespace-nowrap">{val || '-'}</td>)}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-200">
                            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="bg-slate-100 p-12 rounded-full mb-6">
                                <TableIcon size={80} className="opacity-20" />
                            </motion.div>
                            <p className="font-black text-xs uppercase tracking-[0.5em] text-slate-400">Esperando Parámetros Azteca AVT</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ReportesView;