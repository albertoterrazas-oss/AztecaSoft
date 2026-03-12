import { useState, useEffect, Fragment } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Tree } from "primereact/tree";
import { toast } from "sonner";
import request from "@/utils";
import SelectComp from "@/components/SelectInput";

// --- Configuración Inicial ---
const initialState = {
    mainMenuList: [],
    mainMenuSelected: null,
    showConfirmDialog: false,
    confirmSave: false,
    updateUsers: false,
    usersList: []
};

export default function AsignMenusDialog({ rol, assignMenu, assignMenuHandler }) {
    const [state, setState] = useState(initialState);
    const [allMenus, setAllMenus] = useState(null);
    const [assignedMenus, setAssignedMenus] = useState(null);
    const [selectedKeys, setSelectedKeys] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);

    // --- Lógica de Procesamiento de Menús ---
    function calcularValores(obj, assignedMenus, currentSelectedNodes) {
        const menuInfo = assignedMenus.find((menu) => menu.menu_id === obj.key);

        if (menuInfo) {
            if (obj.children && obj.children.length > 0) {
                let todosHijosSeleccionados = true;
                let algunosHijosSeleccionados = false;

                for (const hijo of obj.children) {
                    const hijoValores = calcularValores(hijo, assignedMenus, currentSelectedNodes);
                    if (!hijoValores) {
                        todosHijosSeleccionados = false;
                        algunosHijosSeleccionados = true;
                    }
                }

                if (!(todosHijosSeleccionados === false && algunosHijosSeleccionados === false)) {
                    if (todosHijosSeleccionados) {
                        currentSelectedNodes[obj.key] = { checked: true, partialChecked: false, label: menuInfo.menu_nombre };
                    } else if (algunosHijosSeleccionados) {
                        currentSelectedNodes[obj.key] = { checked: false, partialChecked: true, label: menuInfo.menu_nombre };
                    }
                }
            } else {
                currentSelectedNodes[obj.key] = { checked: true, partialChecked: false, label: menuInfo.menu_nombre, toList: true };
            }
            return currentSelectedNodes[obj.key] || false;
        } else if (obj.children && obj.children.length > 0) {
            let algunoSeleccionado = false;
            for (const hijo of obj.children) {
                const hijoValores = calcularValores(hijo, assignedMenus, currentSelectedNodes);
                if (hijoValores && (hijoValores.checked || hijoValores.partialChecked)) algunoSeleccionado = true;
            }
            if (algunoSeleccionado) {
                currentSelectedNodes[obj.key] = { checked: false, partialChecked: true, label: obj.label };
                return currentSelectedNodes[obj.key];
            }
        }
        return false;
    }

    const fetchAndSetupData = async () => {
        try {
            const [menusRes, assignedRes] = await Promise.all([
                fetch(route("menus-tree")),
                fetch(route("rolesxmenu.show", rol.roles_id))
            ]);

            const dataMenus = await menusRes.json();
            const dataMenusAssigned = await assignedRes.json();

            setAllMenus(dataMenus);
            setAssignedMenus(dataMenusAssigned);

            let initialSelectedNodesLocal = {};
            dataMenus.forEach((obj) => calcularValores(obj, dataMenusAssigned, initialSelectedNodesLocal));

            setSelectedKeys(initialSelectedNodesLocal);
            setOpenDialog(true);
        } catch (error) {
            console.error("Error fetching menu data:", error);
            toast.error("Error al cargar la estructura de menús");
        }
    };

    const handleOnChangeCheck = (e) => {
        const keys = Object.keys(e);
        const mainList = {};

        function addMenuName(obj) {
            const isPresent = keys.find((key) => parseInt(key) === obj.key);
            if (isPresent) {
                if (obj.children && obj.children.length > 0) {
                    let todosHijos = true;
                    let algunosHijos = false;
                    obj.children.forEach(h => {
                        const val = addMenuName(h);
                        if (!val) { todosHijos = false; algunosHijos = true; }
                    });
                    mainList[obj.key] = { checked: todosHijos, partialChecked: !todosHijos && algunosHijos, label: obj.label };
                } else {
                    mainList[obj.key] = { checked: true, partialChecked: false, label: obj.label, toList: true };
                }
            } else if (obj.children) {
                let alguno = false;
                obj.children.forEach(h => { if (addMenuName(h)) alguno = true; });
                if (alguno) return true;
            }
            return mainList[obj.key];
        }

        allMenus.forEach(addMenuName);
        setSelectedKeys(mainList);
    };

    const saveUserMenus = async () => {
        const menus = Object.keys(selectedKeys);

        // --- LOGICA DE PERMISOS CORREGIDA (Cualquiera de los dos + permiso) ---
        // if ((order?.Estatus === "ACTIVO" || order?.Estatus === "PROGRAMADO") && permiso) { ... }

        if (!state.showConfirmDialog && !state.confirmSave) {
            const originalMenus = assignedMenus.map(m => m.menu_id.toString());
            const hasChanges = originalMenus.length !== menus.length || menus.some(m => !originalMenus.includes(m));

            if (hasChanges) {
                const usersInRole = await request(route('rolesxmenu.usersPerRole'), 'POST', { idRol: rol.roles_id });
                if (usersInRole?.usuarios?.length > 0) {
                    return setState({ ...state, showConfirmDialog: true, usersList: usersInRole.usuarios });
                }
            }
        }

        try {
            await request(route('rolesxmenu.update', rol.roles_id), 'PUT', {
                menus_ids: menus,
                menuInicio: state.mainMenuSelected,
                updateUsers: state.updateUsers,
                usersList: state.usersList
            });
            toast.success("¡Configuración guardada con éxito!");
            setState(initialState);
            setOpenDialog(false);
            assignMenuHandler(false);
        } catch (error) {
            toast.error("Error al procesar la solicitud");
        }
    };

    useEffect(() => {
        if (assignMenu) fetchAndSetupData();
        else {
            setOpenDialog(false);
            setSelectedKeys(null);
        }
    }, [assignMenu]);

    useEffect(() => {
        if (state.confirmSave) saveUserMenus();
    }, [state.confirmSave]);

    return (
        <Transition appear show={openDialog} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={() => assignMenuHandler(false)}>
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel className="w-full max-w-xl transform overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl transition-all border-b-[10px] border-[#1B2654]">

                            {/* Header Estilo Rhino */}
                            <div className="mb-6 flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="w-12 h-12 rounded-xl bg-[#1B2654] flex items-center justify-center text-white shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <DialogTitle as="h3" className="text-xl font-black text-[#1B2654] uppercase italic leading-tight">
                                        Gestión de Accesos
                                    </DialogTitle>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Rol: <span className="text-sky-600">{rol.roles_descripcion}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Selector de Inicio */}
                                {/* <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-inner">
                                    <SelectComp
                                        value={state.mainMenuSelected || ''}
                                        onChangeFunc={(e) => setState({ ...state, mainMenuSelected: e })}
                                        options={Object.entries(selectedKeys || {}).filter(i => i[1].toList).map(i => ({ key: parseInt(i[0]), label: i[1].label }))}
                                        label={'Módulo de Inicio Predeterminado'}
                                        valueKey={"key"}
                                        data={"label"}
                                    />
                                </div> */}

                                {/* Árbol de Menús Modificado */}
                                <div className="max-h-[350px] overflow-y-auto pr-2 custom-scroll">
                                    {/* <Tree
                                        value={allMenus}
                                        selectionMode="checkbox"
                                        selectionKeys={selectedKeys}
                                        onSelectionChange={(e) => handleOnChangeCheck(e.value)}
                                        filter
                                        filterPlaceholder="Filtrar módulos..."
                                        className="w-full border-none p-0 bg-white"
                                        pt={{
                                            root: { className: 'bg-white p-0' },
                                            node: { className: 'outline-none' },
                                            content: ({ context }) => ({
                                                className: `flex items-center p-2 rounded-xl transition-all ${context.selected ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`
                                            }),
                                            toggler: { className: 'w-6 h-6 text-slate-400 mr-1 flex items-center justify-center bg-transparent border-none' },
                                            // CHECKBOX FIX: SVG Inyectado
                                            checkbox: ({ context }) => ({
                                                className: `w-5 h-5 flex items-center justify-center border-2 rounded-md transition-all mr-3 
                                                    ${context.checked ? 'bg-[#1B2654] border-[#1B2654]' : 'bg-white border-slate-300'} 
                                                    ${context.partialChecked ? 'bg-sky-500 border-sky-500' : ''}`
                                            }),
                                            checkboxIcon: ({ context }) => ({
                                                className: `text-white w-3 h-3 transition-opacity ${context.checked || context.partialChecked ? 'opacity-100' : 'opacity-0'}`,
                                                children: context.partialChecked ? (
                                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 12h14" /></svg>
                                                ) : (
                                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>
                                                )
                                            }),
                                            label: { className: 'text-[11px] font-black text-slate-700 uppercase p-0 select-none tracking-tight' }
                                        }}
                                    /> */}

                                    <Tree
                                        value={allMenus}
                                        selectionMode="checkbox"
                                        selectionKeys={selectedKeys}
                                        onSelectionChange={(e) => handleOnChangeCheck(e.value)}
                                        filter
                                        filterPlaceholder="Filtrar módulos..."
                                        className="w-full border-none p-0 bg-white"
                                        pt={{
                                            root: { className: 'bg-white p-0' },
                                            node: { className: 'outline-none' },
                                            content: ({ context }) => ({
                                                className: `flex items-center p-2 rounded-xl transition-all ${context.selected ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`
                                            }),
                                            toggler: { className: 'w-6 h-6 text-slate-400 mr-1 flex items-center justify-center bg-transparent border-none' },
                                            checkbox: ({ context }) => ({
                                                className: `w-5 h-5 flex items-center justify-center border-2 rounded-md transition-all mr-1 
                ${context.checked ? 'bg-[#1B2654] border-[#1B2654]' : 'bg-white border-slate-300'} 
                ${context.partialChecked ? 'bg-sky-500 border-sky-500' : ''}`
                                            }),
                                            checkboxIcon: ({ context }) => ({
                                                className: `text-white w-3 h-3 transition-opacity ${context.checked || context.partialChecked ? 'opacity-100' : 'opacity-0'}`,
                                                children: context.partialChecked ? (
                                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 12h14" /></svg>
                                                ) : (
                                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>
                                                )
                                            }),
                                            // AQUÍ ESTÁ EL CAMBIO: añadimos pl-3 para dar aire
                                            label: { className: 'text-[11px] font-black text-slate-700 uppercase p-0 pl-3 select-none tracking-tight' }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Footer de Botones */}
                            <div className="mt-8 flex gap-3">
                                <button onClick={() => assignMenuHandler(false)} className="flex-1 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">
                                    Descartar
                                </button>
                                <button onClick={saveUserMenus} className="flex-[2] py-4 bg-[#1B2654] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                                    Aplicar Cambios
                                </button>
                            </div>

                        </DialogPanel>
                    </div>
                </div>
            </Dialog>

            {/* Modal de Advertencia Usuarios */}
            <Transition show={state.showConfirmDialog} as={Fragment}>
                <Dialog className="relative z-[110]" onClose={() => setState({ ...state, showConfirmDialog: false })}>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                        <DialogPanel className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl text-center border-b-8 border-amber-500">
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                            </div>
                            <DialogTitle className="text-lg font-black text-slate-800 uppercase italic mb-2">¡Usuarios Detectados!</DialogTitle>
                            <p className="text-[11px] font-bold text-slate-500 mb-6 leading-relaxed">
                                Hay usuarios con este rol activo. ¿Quieres forzar la actualización de sus menús en esta sesión?
                            </p>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => setState({ ...state, confirmSave: true, updateUsers: true })} className="py-3 bg-[#1B2654] text-white rounded-xl font-black text-[10px] uppercase">Sí, actualizar todos</button>
                                <button onClick={() => setState({ ...state, confirmSave: true })} className="py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase">No, solo el rol</button>
                                <button onClick={() => setState({ ...state, showConfirmDialog: false })} className="py-3 text-[10px] font-black uppercase text-slate-400">Cancelar</button>
                            </div>
                        </DialogPanel>
                    </div>
                </Dialog>
            </Transition>
        </Transition>
    );
}