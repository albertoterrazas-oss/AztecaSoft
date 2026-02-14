import React from 'react'
import { useRef } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import { DataGrid, Column, Scrolling, Selection, Export, Lookup, MasterDetail, Grouping, ColumnChooser, Position, ColumnChooserSearch, ColumnChooserSelection } from 'devextreme-react/data-grid';
// import NoDataImg from '../../png/camion.png'
import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import '../../sass/TablesComponent/_tablesStyle.scss'
import '../../sass/TablesComponent/_tableEditDropStyle.scss'
// import SearchIcon from '@mui/icons-material/Search';
import { useLocation } from "react-router-dom";
import { useContext } from "react";
// import FilterAltIcon from '@mui/icons-material/FilterAlt';
import UserMenusContext from "@/Context/UserMenusContext";
// import { Button, Tooltip } from '@mui/material';
// import e from 'cors';
// import _ from 'lodash';
import /* request,  */ { findMenuByUrl, moneyFormat, normalizeUrl, numberFormat } from '@/utils';
import moment from 'moment';
import { useImperativeHandle } from 'react';
import { useCallback } from 'react';
import ColumnChooserDialog from './ColumnChooserDialog';
import LoadingDiv from './LoadingDiv';
import useStore from '@/Stores/useStore';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from './ui/input-group';
import { SearchIcon } from 'lucide-react';


/*  PROPS 
data: Array = Datos que muestra la tabla
    columns: Array = Columnas a mostrar en la tabla
            -> header: String = Header (nombre) de la columna
            -> accessor: String = Nombre del campo a acceder de data 
            -> cell: function/html = Propiedad a la que se le pasa el html que se desea renderizar en la celda (No obligatorio)
            -> tableId: String = ID de la tabla (No obligatorio si es solo una tabla) que se usa principalmente para el buscador 
            -> edit: function/html = Propiedad a la que se le pasan las funciones o html que realizará al editar
            -> custom: function/html = Propiedad a la que se le pasan las funciones o html custom que tendrá el modelo (como descargar pdf, abrir otro modal etc)
    virtual: boolean = Indica si se usará una tabla virtualizada (tabla con miles de datos) o una tabla que se renderiza toda la data de forma normal (No obligatorio)
    add: function = Si se pasa esta propiedad, se renderiza el boton de agregar, esta recibira una funcion (No obligatoria)
    searcher: boolean = Decide si se renderiza el buscador de la tabla
    tableRef: ref = Crea una referencia a la tabla (Unicamente virtualizada, no obligatorio)
    rowId: String = ID del renglon de la tabla (Unicamente virtualizada)
    selection: String = Habilita la seleccion de la tabla (Unicamente virtualizada, no obligatoria) con las opciones 'multiple' y 'single'
    selectedData: Array = Datos seleccionados (No obligatorio)
    selectionFunc: function = Funcion de seleccion de registros/renglon
    rowClass: String = recibe las clases de estilo para los renglones de la tabla normal
    si encapsulas la tabla en <div> quitar las clase del containerTable
    */

const Datatable = (props) => {
    const location = useLocation();
    const {
        userMenus
    } = useStore()
    const tableRef = useRef();
    const localRef = useRef(null);
    const filterButtonRef = useRef(null);
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [loadingApply, setLoadingApply] = useState(false)
    const [internalColumns, setInternalColumns] = useState();
    const [filteredData, setFilteredData] = useState()
    const [searchTerm, setSearchTerm] = useState('');
    const [postPermission, setPostPermission] = useState(false);
    const [putPermission, setPutPermission] = useState(false);
    const [specialPermission, setSpecialPermission] = useState(false);
    const [empresa, setEmpresa] = useState();
    const savedColor = '#f5f5f5';

    const search = () => {
        var input = document.getElementById("search-input-datatable")
        var table = document.getElementById("datatable")
        var tr = table.getElementsByTagName("tr")
        var filter = input.value.toUpperCase()
        for (let i = 0; i < tr.length; i++) {
            for (let j = 0; j < props.columns.length; j++) {
                var td = tr[i].getElementsByTagName("td")[j];
                if (td) {
                    var txtValue = td.textContent || td.innerText;
                    if (txtValue.toUpperCase().indexOf(filter) > -1) {
                        tr[i].style.display = "";
                        break;
                    } else {
                        tr[i].style.display = "none";
                    }
                }
            }
        }
    }

    const getNestedValue = (obj, path) => {
        if (!obj || !path) return undefined;

        if (Array.isArray(path)) {
            return path
                .map((p) => getNestedValue(obj, p))
                .filter(v => v !== undefined && v !== null)
                .join(' ');
        }

        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    const formatCellValue = (value, type) => {
        if (!type) return value;

        switch (type) {
            case 'text':
                return value ?? '-';
            case 'int':
                if (value === null || value === undefined || value === '') return 0;
                const intVal = typeof value === 'string' ? value.replace(/,/g, '') : value;
                return parseInt(intVal, 10);
            case 'number':
            case 'percentage':
            case 'money':
                if (value === null || value === undefined || value === '') return 0;
                const cleaned = typeof value === 'string' ? value.replace(/,/g, '') : value;
                return parseFloat(cleaned);
            case 'date':
                if (!value) return null;
                const possibleFormats = [
                    'YYYY-MM-DD',
                    'DD-MM-YYYY',
                    'MM-DD-YYYY',
                    'YYYY/MM/DD',
                    'DD/MM/YYYY',
                    'MM/DD/YYYY',

                    'YYYY-MM-DD HH:mm',
                    'DD-MM-YYYY HH:mm',
                    'MM-DD-YYYY HH:mm',
                    'YYYY/MM/DD HH:mm',
                    'DD/MM/YYYY HH:mm',
                    'MM/DD/YYYY HH:mm',

                    'YYYY-MM-DD HH:mm:ss',
                    'DD-MM-YYYY HH:mm:ss',
                    'MM-DD-YYYY HH:mm:ss',
                    'YYYY/MM/DD HH:mm:ss',
                    'DD/MM/YYYY HH:mm:ss',
                    'MM/DD/YYYY HH:mm:ss',

                    // ISO completo por si acaso
                    moment.ISO_8601,
                ];
                const date = moment(value, possibleFormats, true);

                // console.log({ date: date, value: value })
                return date.isValid() ? date.format('YYYY-MM-DD') : '-';
            case 'time':
                if (!value) return null;
                const time = moment(value);
                return time.isValid() ? time.format('YYYY-MM-DD HH:mm:ss.SSS') : '-';
            case 'fullDate':
                if (!value) return null;
                const dateTime = moment(value);
                return dateTime.isValid() ? dateTime.format('YYYY-MM-DD HH:mm:ss.SSS') : '-';
            case 'boolean':
                if (value === null || value === undefined) return 0;
                const val = (value === true || value === 1 || value === '1') ? 1 : 0
                return val
            // case 'status':
            //     if (value === null || value === undefined) return 0;
            //     const res = (value === true || value === 1 || value === '1') ? 1 : 0
            //     return res
            default:
                return value ?? '';
        }
    };

    const formatDisplayValue = (value, type, column = {}) => {
        if (!type) return value;
        // console.log('value', value)
        switch (type) {
            case 'money':
                return '$ ' + moneyFormat(value ?? 0);
            case 'int':
                return parseInt(value ?? 0, 10);
            case 'percentage':
                return numberFormat(value ?? 0) + '%';
            case 'number':
                return numberFormat(value ?? 0);
            case 'date':
                return value ? moment(value).format('DD/MM/YYYY') : '-';
            case 'fullDate':
                return value ? moment(value).format('DD/MM/YYYY hh:mm a') : '-';
            case 'time':
                return value ? moment(value).format('hh:mm:ss a') : '-';
            case 'boolean':
                return getBooleanDisplay(value, column)
            // case 'status':

            case 'text':
                let label = ''
                if (column.nullText && (!value || value === '')) {
                    label = column.nullText
                } else {
                    label = value ?? '-'
                }
                return label;
            default:
                return value;
        }
    };

    const getBooleanDisplay = (value, column = {}) => {
        const bool = value === true || value === 1 || value === '1';
        const defaultLabels = { true: 'ACTIVO', false: 'INACTIVO' };
        const defaultColors = { true: 'bg-emerald-300', false: 'bg-red-300' };

        if (!column.label && !column.dot) {
            return bool ? { label: defaultLabels.true, color: '' } : { label: defaultLabels.false, color: '' };
        }
        if (column.label) {
            const labels = column.label ?? defaultLabels;
            return bool ? { label: labels.true, color: '' } : { label: labels.false, color: '' };
        }
        if (column.dot) {
            const colors = ((column.dot.true && column.dot.false) ? column.dot : null) ?? defaultColors;
            return bool ? { label: '', color: colors.true } : { label: '', color: colors.false };
        }

        return bool ? { label: defaultLabels.true, color: '' } : { label: defaultLabels.false, color: '' };
    }

    const setCombinedRef = useCallback((instance) => {
        localRef.current = instance;
        if (props.tableRef) {
            props.tableRef.current = instance;
        }
    }, [props.tableRef]);

    const searchVirtual = () => {
        var id = props.tableId ?? "datagrid"
        var table = document.getElementById(id)
        const trElements = table.querySelectorAll('tr');
        var filter = searchTerm.toUpperCase()
        trElements.forEach((tr, index) => {
            var x = tr.querySelectorAll('[role="gridcell"]')
            if (x.length > 0) {
                const contentArray = Array.from(x).map((td) => td.textContent);
                contentArray.forEach((td) => {
                    if (td.toUpperCase().indexOf(filter).toString() > -1) {
                        tr.style.display = "";
                        return;
                    } else {
                        tr.style.display = "none";
                    }
                })
            }
        })
    }

    const allVisible = () => {
        var table = document.getElementById("datatable")
        var tr = table?.getElementsByTagName("tr")
        for (let i = 0; i < tr?.length; i++) {
            tr[i].style.display = "";
        }
        []
    }

    const allVisibleVirtual = () => {
        var id = props.tableId ?? "datagrid"
        var table = document.getElementById(id)
        const trElements = table.querySelectorAll('tr');
        var filter = searchTerm.toUpperCase()
        trElements.forEach((tr, index) => {
            tr.style.display = "";
            // var x = tr.querySelectorAll('[role="gridcell"]')
            // if(x.length > 0){
            //     const contentArray = Array.from(x).map((td) => td.textContent);
            //     contentArray.forEach((td) => {
            //         if (td.toUpperCase().indexOf(filter) > -1) {
            //             tr.style.display = "";
            //             return;
            //         } else {
            //             tr.style.display = "none";
            //         }
            //     })
            // }
        })
    }

    const handleSelection = () => {
        if (props.selection)
            if (typeof props.selection === 'object') {
                return props.selection
            } else {
                return { mode: props.selection }
            }
        else
            return { mode: 'none' }
    }

    // const loadUserPreferences = async () => {
    //     const menu = JSON.parse(localStorage.getItem('selectedMenu'))
    //     try {
    //         const response = await request(route('get-column-preferences'), "POST", { menu_id: menu.menu_id, columns: props.columns }, { enabled: true })
    //         setInternalColumns(response.columns.map(col => ({ ...col })))
    //         props.onColumnVisibilityChange(response.columns.map(col => ({ ...col })))
    //     } catch (error) {
    //         console.error(error)
    //     } finally {
    //         setLoading(false)
    //     }
    // }

    // const saveUserPreferences = async () => {
    //     const menu = JSON.parse(localStorage.getItem('selectedMenu'))
    //     setLoadingApply(true)
    //     try {
    //         await request(route('save-column-preferences'), "POST", { menu_id: menu.menu_id, columns: internalColumns }, { enabled: true })
    //     } catch (error) {
    //         console.error(error)
    //         noty('Ocurrió un error al guardar la configuración.', 'error')
    //     } finally {
    //         props.onColumnVisibilityChange(internalColumns.map(col => ({ ...col })))
    //         setLoadingApply(false)
    //     }
    // }

    // useEffect(() => {
    //     if (!props.columnChooser || props.columnChooser === false) {
    //         setInternalColumns(props.columns.map(col => ({ ...col, visible: true })));
    //     } else {
    //         loadUserPreferences()
    //     }
    // }, []);

    useEffect(() => {
        if (Array.isArray(userMenus)) {
            const url = normalizeUrl(location.pathname)
            const result = findMenuByUrl(userMenus, url)

            if (result !== null) {
                setPostPermission(result.pivot?.usuarioxmenu_alta == 1 ? true : false)
                setPutPermission(result.pivot?.usuarioxmenu_cambio == 1 ? true : false)
                setSpecialPermission(result.pivot?.usuarioxmenu_especial == 1 ? true : false)
            }
        }
    }, [userMenus]);

    useEffect(() => {
        if (!props.virtual) {
            if (searchTerm != "") {
                search()
            } else {
                allVisible()
            }
        } else {
            // if (searchTerm != "") {
            //     searchVirtual()
            // } else {
            //     allVisibleVirtual()
            // } 
            if (props.data) {
                if (searchTerm != "") {
                    const accessors = props.columns.map(c => {
                        if (c.lookup) return c.lookup.displayExpr
                        return c.accessor
                    }).filter(a => a != null || a != undefined)
                    const filteredResults = props.data.filter(reg => {
                        const rowValues = Object.values(reg).some(value => {
                            if (typeof value === 'string') return value.toLowerCase().includes(searchTerm.toLowerCase());
                            if (typeof value === 'object') {
                                return accessors
                                    .some(acc => (value ? `${value[acc]}` : '')
                                        .toLowerCase()
                                        .includes(searchTerm.toLowerCase()))
                            }
                            return false;
                        });
                        return rowValues;
                    });
                    setFilteredData(filteredResults);
                } else
                    setFilteredData(props.data);
            }
        }
    }, [searchTerm, props.data])

    useEffect(() => {
        const company = JSON.parse(localStorage.getItem('empresaData'))
        company && setEmpresa(company)
    }, [localStorage.getItem('empresaData')])

    return (
        <>
            {(loading && props.columnChooser) ?
                <LoadingDiv />
                :
                <>
                    {
                        (!props.add) && (props.searcher === false) ? null : (
                            <div id='topTableActions' className='relative grid justify-between grid-cols-2 m-3'>
                                <>
                                    <div className='flex items-center' >
                                        {/* {(postPermission && props.add && empresa) && */}
                                        <button className="flex items-center px-4 py-2 text-base font-semibold text-white rounded-lg shadow-md  transition duration-150 ease-in-out"
                                            style={{ backgroundColor: '#A61A18' }} onClick={props.add}>Agregar</button>
                                        {/* // } */}
                                    </div>
                                    <div className='flex justify-end'>
                                        {props.columnChooser &&
                                            <button
                                                className={`text-[#464545] max-[906px]:pr-16 min-[906px]:pr-2`}
                                                ref={filterButtonRef}
                                                onClick={() => {
                                                    setOpen(true)
                                                }}
                                            >
                                                {/* <FilterAltIcon /> */}
                                            </button>
                                        }
                                        <div className='flex justify-end min-h-[3rem]' >
                                            {/* {
                                                (props.searcher === false) ? null : (
                                                    <div className='grid justify-items-end' >
                                                        <input id='search-input-datatable' className='h-12 search-input-datatable' type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                                        <label htmlFor="search-input-datatable" className='non-selectable'>
                                                            {/* <SearchIcon className={'search-icon-datatable'} />}
                                                        </label>
                                                    </div>
                                                )
                                            } */}
                                            <InputGroup className='bg-white border rounded-lg overflow-hidden'>
                                                <InputGroupInput
                                                    placeholder="Buscar..."
                                                    id="search-input-datatable"
                                                    className="search-input-datatable"
                                                    value={searchTerm}
                                                    onChange={e => setSearchTerm(e.target.value)}
                                                />
                                                <InputGroupAddon className='bg-white border-0'>
                                                    <SearchIcon className="text-gray-500" />
                                                </InputGroupAddon>
                                            </InputGroup>
                                        </div>
                                    </div>
                                </>
                            </div>
                        )
                    }
                    <div className={props.virtual ? `virtualTable blue-scroll ${props.className || ''}` : `containerTable ${props.className || ''}`}>
                        {filteredData && props.columns && (props.virtual === true || !props.virtual) && (props.columnChooser ? internalColumns : true) &&
                            <DataGrid
                                className={`${props.width ? props.width : `md:min-w-[800px] sm:min-w-[1100px] `} `}
                                id={props.tableId ?? 'datagrid'}
                                ref={setCombinedRef}
                                dataSource={props.searcher === false ? props.data : filteredData}
                                columnAutoWidth={false}
                                keyExpr={props.rowId}
                                showBorders={true}
                                showRowLines={true}
                                height={props.height}
                                editing={{
                                    mode: "cell",
                                    allowUpdating: props.handleRowUpdating ? true : false,
                                    allowDeleting: false
                                }}
                                showColumnLines={props.showColumnLines ?? false}
                                selectedRowKeys={props.selectedData}
                                onSelectionChanged={props.selectionFunc}
                                onRowPrepared={props.onRowPrepared}
                                onRowUpdating={props.handleRowUpdating}
                                onContentReady={props.onContentReady}
                                onRowRemoving={props.handleRowRemoving}
                                hoverStateEnabled={true}
                                elementAttr={{ class: `data-table ${props.tableClassName}` }}
                                onCellPrepared={(e) => {
                                    if (props.onCellPrepared) props.onCellPrepared(e)
                                    e.cellElement.setAttribute('data-label', e.column.caption);

                                    if (e.rowType === 'data' && e.column) {
                                        const matchingColumn = props.columns.find(col => col.accessor === e.column.dataField);

                                        if (!matchingColumn || matchingColumn.type !== 'boolean') return;

                                        const status = e.value;
                                        const result = getBooleanDisplay(status, matchingColumn);

                                        const span = document.createElement("span");
                                        span.className = `inline-flex items-center justify-center rounded-full ${result.color} w-4 h-4`;

                                        e.cellElement.innerHTML = result.label;
                                        e.cellElement.appendChild(span);
                                    }
                                }}
                                onEditorPreparing={props.onEditorPreparing}
                            >
                                <Scrolling mode="virtual" />
                                {props.selection &&
                                    <Selection
                                        {...handleSelection()}
                                        showCheckBoxesMode='always'
                                        selectAllMode='page'
                                        allowSelectAll={false}
                                    />
                                }
                                <Grouping autoExpandAll={false} />
                                {props.columns &&
                                    props.columns.map((column, index) => (
                                        (column.edit || column.custom || column.cell) ? (
                                            <Column
                                                key={index}
                                                type="buttons"
                                                caption={column.header}
                                                cellRender={(rowData) => {
                                                    return (
                                                        <>
                                                            {((!column._editConditional || (column._editConditional && column._editConditional({ item: rowData.data }))) &&
                                                                (putPermission === true && column.edit)) &&
                                                                <button className="material-icons" onClick={() => column.edit({ item: rowData.data })}>edit</button>}
                                                            {((!column._customConditional || (column._customConditional && column._customConditional({ item: rowData.data }))) &&
                                                                (specialPermission && column.custom)) &&
                                                                <column.custom item={{ ...rowData.data }} {...props} />}
                                                            {(column.cell && (!column._cellConditional || (column._cellConditional && column._cellConditional({ item: rowData.data })))) && column.cell({ item: rowData.data, ...props })}

                                                        </>
                                                    );
                                                }}
                                                name={column.cell ? `button-${index}` : undefined}
                                                alignment={column.alignment ?? 'center'}
                                                allowResizing={column.allowResizing ?? false}
                                                width={column.width && column.width}
                                                height={column.height && column.height}
                                                dataType={column.dataType}
                                            >
                                            </Column>
                                        ) : (column.cell) ? (
                                            <Column
                                                key={index}
                                                type="buttons"
                                                caption={column.header}
                                                cellRender={(rowData) =>
                                                    column.cell({ item: rowData.data, ...props })
                                                }
                                                name={column.cell ? `button-${index}` : undefined}
                                                alignment={column.alignment ?? 'center'}
                                                allowResizing={column.allowResizing ?? false}
                                                width={column.width && column.width}
                                                height={column.height && column.height}
                                                dataType={column.dataType}
                                                format={column.format}
                                            >
                                            </Column>
                                        ) : (column.lookup) ? (
                                            <Column
                                                key={index}
                                                caption={column.header}
                                                dataField={column.accessor}
                                                name={column.cell ? `button-${index}` : undefined}
                                                alignment={column.alignment ?? 'center'}
                                                allowResizing={column.allowResizing ?? false}
                                                width={column.width && column.width}
                                                height={column.height && column.height}
                                                dataType={column.dataType}
                                                setCellValue={column.setCellValue}
                                                allowEditing={column.allowEditing ?? true}
                                            >
                                                <Lookup
                                                    dataSource={
                                                        /* column.lookup.filteredData ?
                                                            column.lookup.filteredData({ filter: column.filterId ?? [], self: column.lookup }) : */
                                                        column.lookup.dataSource /* ?? [] */
                                                    }
                                                    displayExpr={column.lookup.displayExpr}
                                                    valueExpr={column.lookup.valueExpr}
                                                // { ...column.lookup}
                                                />
                                            </Column>
                                        ) :
                                            <Column
                                                key={index}
                                                dataField={column.accessor}
                                                caption={column.header}
                                                name={column.cell ? `button-${index}` : undefined}
                                                alignment={column.alignment ?? 'center'}
                                                allowResizing={column.allowResizing ?? false}
                                                allowEditing={column.allowEditing ?? true}
                                                dataType={column.dataType}
                                                width={column.width && column.width}
                                                height={column.height && column.height}
                                                format={column.format}
                                                groupIndex={column.groupIndex}
                                                calculateCellValue={(rowData) => formatCellValue(getNestedValue(rowData, column.accessor), column.type)}
                                                customizeText={({ value }) => {
                                                    return formatDisplayValue(value, column.type, column)?.toString() ?? '';
                                                }}
                                                visible={column.visible !== false}
                                            />
                                    ))}
                                {props.masterDetail && <MasterDetail enabled={true} component={props.masterDetail} />}
                            </DataGrid>
                        }

                        {props.data && props.columns && !props.virtual &&

                            <table id={props.tableId ?? 'datatable'} ref={tableRef} className='data-table'>
                                <thead className='headerTable' >
                                    <tr scope="col" >
                                        {props.columns &&
                                            props.columns.map((head, index) => {
                                                return (
                                                    <th key={index} style={{ backgroundColor: '#E9F6FF', color: 'black' }} className={`table-header table-header-${index}`} >
                                                        {(!head.edit && !head.custom) ? head.header : null}
                                                        {
                                                            ((putPermission && head.edit) || (specialPermission && head.custom)) && head.header
                                                        }
                                                    </th>
                                                )
                                            })
                                        }
                                    </tr>
                                </thead>
                                <tbody>
                                    {props.data &&
                                        props.data.length > 0 ? (
                                        props.data.map((reg, i) => {
                                            const rowClass = props.rowClass ? props.rowClass({ item: reg }) : "";
                                            return (
                                                <tr id='tr' key={i} className={`table-hover ${rowClass}`} onClick={props.selectionFunc}>
                                                    {props.columns &&
                                                        props.columns.map((col, index) => {
                                                            const colClass = col.colClass ? col.colClass({ item: reg }) : "";
                                                            return (
                                                                <td key={index} data-label={`${col.header}`} className={`table-item ${colClass}`}>
                                                                    {/* {
                                                                `${(putPermission && col.edit)}  ${(specialPermission && col.custom)}`
                                                            } */}
                                                                    {
                                                                        ((putPermission && col.edit) || (specialPermission && col.custom)) &&
                                                                        <>

                                                                            {(specialPermission && col.custom) && <col.custom item={{ ...reg }} {...props} />}
                                                                        </>
                                                                    }
                                                                    {
                                                                        // ((!col.edit) && (!col.custom)) &&
                                                                        <>
                                                                            {col.cell && <col.cell item={{ ...reg }} {...props} />}
                                                                            {(!col.cell && !col.edit && !col.custom) &&
                                                                                (
                                                                                    Array.isArray(col.accessor) ?
                                                                                        (col.accessor.map((item) => reg[item] + ' '))
                                                                                        : /* _.get(reg, col.accessor) */ (reg[col.accessor] ?? "-")
                                                                                )
                                                                            }
                                                                        </>
                                                                    }
                                                                </td>
                                                            )
                                                        })
                                                    }
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td className='relative' colSpan={props.columns.length}>
                                                <div className='flex place-content-center'>
                                                    {/* <img className='scale-50 non-selectable' src={NoDataImg} alt="" /> */}
                                                    <span className='absolute left-[0] right-[0] top-[70%] m-auto text-center'>No se encontraron registros.</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                    }
                                </tbody>
                                {/* {(filteredData && props.prev && props.next) &&
                        filteredData.length > 0 &&
                        <tfoot className='sticky w-full h-16 text-center -bottom-1'>
                            <tr>
                                <td colSpan={props.columns.length}>
                                    <div className='flex items-center justify-between pl-12 pr-12'>
                                        <label>{props.current_page} of {props.total_pages}</label>
                                        <div className='flex items-center gap-x-2'>
                                            <div className='flex items-center'>
                                                {props.current_page > 1 &&
                                                    <button onClick={props.prev}>
                                                        <ArrowBackIosIcon />
                                                    </button>
                                                }
                                            </div>
                                            <div>
                                                {pagination().map((pageNumber, index) => (
                                                    <button key={index} disabled={pageNumber === '...'} >{pageNumber}</button>
                                                ))}
                                            </div>
                                            <button onClick={props.next}>
                                                <ArrowForwardIosIcon />
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    } */}
                            </table>
                        }
                    </div >
                    {/* {(internalColumns && props.columnChooser) &&
                        <ColumnChooserDialog
                            open={open}
                            anchorRef={filterButtonRef}
                            onClose={() => setOpen(false)}
                            columns={internalColumns}
                            setColumns={setInternalColumns}
                            onApply={() => {
                                if (props.onColumnVisibilityChange) props.onColumnVisibilityChange(internalColumns.map(col => ({ ...col })))
                                setOpen(false)
                            }}
                            onApplyAndSave={saveUserPreferences}
                            loadingApply={loadingApply}
                        />
                    } */}
                </>
            }
        </>
    )
}

export default Datatable