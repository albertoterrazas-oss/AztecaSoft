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

    // Estados
    const [tipoReporte, setTipoReporte] = useState('lotes_proveedor');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [subTab, setSubTab] = useState('inventario');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Catálogos
    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);
    const [filtros, setFiltros] = useState({
        idProveedor: '', idLote: '', idProducto: '',
        fechaInicio: getTodayISO(), fechaFin: getTodayISO()
    });

    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                const [resProv, resProd] = await Promise.all([
                    fetch(route("provedores.index")).then(res => res.json()),
                    fetch("/api/productos").then(res => res.json())
                ]);
                setProveedores(resProv);
                setProductos(resProd);
            } catch (error) { console.error("Error catálogos"); }
        };
        fetchCatalogos();
    }, []);

    const handleInputChange = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        let items = data ? (tipoReporte === 'inventario_completo' ? [...data[subTab]] : [...data]) : [];
        if (sortConfig.key !== null) {
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
            const response = await axios.get(`/api/reportes/${tipoReporte.replace('_', '-')}`, { params: filtros });
            if (Array.isArray(response.data) ? response.data.length === 0 : response.data.inventario.length === 0) throw new Error("Sin datos");
            setData(response.data);
            toast.success("AZTECA AVT: Reporte generado");
        } catch (error) { toast.error(error.message); }
        finally { setLoading(false); }
    };

    const exportarExcel = () => {
        const wb = XLSX.utils.book_new();
        const generateStyledSheet = (jsonData, sheetName) => {
            const title = [["AZTECA AVT - REPORTE OPERATIVO"], [`FECHA EMISIÓN: ${getFormattedDate()}`], []];
            const headers = Object.keys(jsonData[0]).map(h => h.toUpperCase().replace(/_/g, ' '));
            const rows = jsonData.map(obj => Object.values(obj));
            const ws = XLSX.utils.aoa_to_sheet([...title, headers, ...rows]);

            ws["A1"].s = { font: { bold: true, size: 16, color: { rgb: "001F3F" } }, alignment: { horizontal: "center" } };
            const range = XLSX.utils.decode_range(ws['!ref']);
            for (let c = range.s.c; c <= range.e.c; c++) {
                const cellRef = XLSX.utils.encode_cell({ r: 3, c: c });
                if (!ws[cellRef]) continue;
                ws[cellRef].s = {
                    fill: { fgColor: { rgb: "001F3F" } },
                    font: { color: { rgb: "FFFFFF" }, bold: true },
                    alignment: { horizontal: "center" },
                    border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
                };
            }
            ws['!cols'] = headers.map(() => ({ wch: 25 }));
            ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        };

        if (tipoReporte === 'inventario_completo') {
            generateStyledSheet(data.inventario, "INVENTARIO");
            generateStyledSheet(data.entradas, "ENTRADAS");
            generateStyledSheet(data.salidas, "SALIDAS");
        } else {
            generateStyledSheet(data, "REPORTE");
        }
        XLSX.writeFile(wb, `AZTECA_AVT_${tipoReporte.toUpperCase()}_${getTodayISO()}.xlsx`);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 font-sans text-slate-800">
            <Toaster position="top-right" richColors />

            <div className="max-w-7xl mx-auto">
                {/* HEADER */}
                <header className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-3 mb-2">
                            <span className=" text-white px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest shadow-lg shadow-blue-900/20 uppercase bg-[#1B2654]" >Azteca AVT</span>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{getFormattedDate()}</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">CENTRAL <span className="font-bold not-italic" style={{ color: '#A61A18' }}>REPORTES</span></h1>
                    </motion.div>




                    {data && (
                        <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={exportarExcel}
                            className="bg-[#10b981] hover:bg-emerald-700 text-white px-8 h-14 rounded-2xl font-black shadow-xl shadow-emerald-200 flex items-center gap-3 uppercase text-[10px] tracking-widest transition-all"
                        >
                            <Download size={20} /> Exportar Excel Pro
                        </motion.button>
                    )}
                </header>

                {/* FILTROS UNIFICADOS (TAMAÑO h-12) */}
                <section className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 mb-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">

                        {/* TIPO DOCUMENTO */}
                        <div className="lg:col-span-4 flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Filter size={12} /> Documento</label>
                            <select
                                value={tipoReporte} onChange={(e) => { setTipoReporte(e.target.value); setData(null); }}
                                className="w-full h-12 bg-slate-50 border-2 border-slate-50 rounded-xl px-4 font-bold text-slate-700 focus:border-blue-500 outline-none transition-all shadow-inner appearance-none cursor-pointer"
                            >
                                <option value="lotes_proveedor">Lotes por Proveedor</option>
                                <option value="productos_lote">Productos por Lote</option>
                                <option value="detalle_reparticion">Detalle de Repartición</option>
                                <option value="inventario_completo">Inventario Completo</option>
                            </select>
                        </div>

                        {/* FILTROS DINÁMICOS */}
                        <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <AnimatePresence mode="wait">
                                {tipoReporte === 'lotes_proveedor' && (
                                    <motion.div key="p" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><UserCheck size={12} /> PROVEEDOR</label>
                                        <select name="idProveedor" value={filtros.idProveedor} onChange={handleInputChange} className="w-full h-12 bg-slate-50 border-none rounded-xl px-3 font-bold text-sm shadow-inner outline-none cursor-pointer">
                                            <option value="">Seleccionar...</option>
                                            {proveedores.map(p => <option key={p.IdProveedor} value={p.IdProveedor}>{p.RazonSocial}</option>)}
                                        </select>
                                    </motion.div>
                                )}

                                {tipoReporte === 'detalle_reparticion' && (
                                    <motion.div key="pr" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Package size={12} /> PRODUCTO</label>
                                        <select name="idProducto" value={filtros.idProducto} onChange={handleInputChange} className="w-full h-12 bg-slate-50 border-none rounded-xl px-3 font-bold text-sm shadow-inner outline-none cursor-pointer">
                                            <option value="">Seleccionar...</option>
                                            {productos.map(p => <option key={p.IdProducto} value={p.IdProducto}>{p.Nombre}</option>)}
                                        </select>
                                    </motion.div>
                                )}

                                {(tipoReporte === 'productos_lote' || tipoReporte === 'detalle_reparticion') && (
                                    <motion.div key="l" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-tighter">ID LOTE</label>
                                        <input name="idLote" type="number" onChange={handleInputChange} className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-bold shadow-inner outline-none" placeholder="00" />
                                    </motion.div>
                                )}

                                {(tipoReporte === 'lotes_proveedor' || tipoReporte === 'inventario_completo') && (
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

                        {/* BOTÓN GENERAR UNIFICADO */}
                        <div className="lg:col-span-2">
                            <button
                                onClick={consultarReporte} disabled={loading || !canSubmit()}
                                className={`w-full h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2
                  ${!canSubmit() ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' : 'bg-[#1B2654] text-white shadow-xl hover:bg-blue-900 active:scale-95'}`}
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                                {loading ? "PROCESANDO" : "GENERAR"}
                            </button>
                        </div>
                    </div>
                </section>

                {/* VISUALIZADOR DE TABLA */}
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

                            <div className="bg-white shadow-2xl border border-slate-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="  bg-[#1B2654]">
                                                {sortedData.length > 0 && Object.keys(sortedData[0]).map(key => (
                                                    <th key={key} onClick={() => requestSort(key)} className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-colors border-r border-slate-800 last:border-0 group">
                                                        <div className="flex items-center justify-between">
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