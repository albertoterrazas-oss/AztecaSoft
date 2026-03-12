
// import { Head, Link, useForm } from '@inertiajs/react';
// import logo from '../../../../public/img/logotipo.png';
// import React, { useEffect, useState } from 'react';
// import { toast } from 'sonner';


// const TextInput = ({ icon, type = 'text', name, value, onChange, placeholder, error, className = '', isFocused, ...props }) => {
//     // Definición de SVGs para los iconos
//     const IconSVG = () => {
//         if (icon === 'email') {
//             return (
//                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
//                 </svg>
//             );
//         } else if (icon === 'lock') {
//             return (
//                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
//                 </svg>
//             );
//         }
//         return null;
//     };

//     const input = React.useRef();

//     useEffect(() => {
//         if (isFocused) {
//             input.current.focus();
//         }
//     }, [isFocused]);

//     return (
//         <div className={`relative ${className}`}>
//             <input
//                 {...props}
//                 ref={input}
//                 type={type}
//                 name={name}
//                 id={name}
//                 value={value}
//                 onChange={onChange}
//                 placeholder={placeholder}
//                 className={`w-full py-3 ps-4 pe-12 border rounded-lg text-sm transition duration-150 ease-in-out focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400 ${error ? 'border-red-500' : 'border-gray-300'
//                     }`}
//             />
//             <div className="absolute inset-y-0 right-0 flex items-center pe-3 pointer-events-none">
//                 <IconSVG />
//             </div>
//         </div>
//     );
// };

// // 2. Componente PrimaryButton con Icono de Flecha y Spinner
// const PrimaryButton = ({ children, disabled, className = '', processing, ...props }) => (
//     <button
//         {...props}
//         className={`w-full flex items-center justify-center px-4 py-3  border border-transparent rounded-lg font-semibold text-base  tracking-widest  transition ease-in-out duration-150 ${disabled && 'opacity-60 cursor-not-allowed'
//             } ${className}`}
//         disabled={disabled}
//         style={{backgroundColor:'#A61A18'}}
//     >
//         {processing ? (
//             <div className="flex items-center text-white">
//                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                 </svg>
//                 Procesando...
//             </div>
//         ) : (
//             <span className="flex items-center text-white">
//                 {children}
//             </span>
//         )}
//     </button>
// );

// // 3. Componente InputError
// const InputError = ({ message, className = '' }) => {
//     // El mensaje de error de Laravel 422 viene como un array (ej: ["El campo es requerido."])
//     const displayMessage = Array.isArray(message) ? message[0] : message;
//     return displayMessage ? (
//         <p className={`text-sm text-red-600 ${className}`}>{displayMessage}</p>
//     ) : null;
// };

// export default function Login({ status, canResetPassword }) {
//     const { data, setData, post, processing, errors, reset } = useForm({
//         Username: '',
//         Password: '',
//         remember: false,
//     });


//     const handleDataChange = (name, value) => {
//         setData(prevData => ({
//             ...prevData,
//             [name]: value
//         }));
//     };


//     const submit = (e) => {
//         e.preventDefault();

//         // The 'post' function is called with the route, data, and an options object.
//         post(route('login'), {
//             // The third argument is the options object
//             onError: (errors) => {
//                 // This function is called if the form submission fails 
//                 // and the server returns validation or other errors.

//                 toast.success("No se encontraron concidencias con las credenciales");
//                 // console.error('Login Error:', errors);
//             },
//             // // You might also use 'onFinish' to see the final status (success/failure)
//             // onFinish: () => {
//             //     console.log('Login attempt finished.');
//             // }
//         });
//     };

//     const [localErrors, setLocalErrors] = useState({});
//     const [isProcessing, setIsProcessing] = useState(false);
//     const [generalError, setGeneralError] = useState(null);

//     return (
//         // Contenedor principal responsive (simulando el layout)
//         <div className="min-h-screen flex items-center justify-center p-4 font-sans" style={{backgroundColor:'#131B2E'}}>
//             <Head title="Iniciar Sesión" />

//             {/* Contenedor del formulario (Tarjeta central y sombreada) */}
//             <div className="w-full max-w-sm bg-white p-8 md:p-10 rounded-xl shadow-2xl transition duration-500">

//                 {/* Sección de Logo */}
//                 <div className="flex justify-center mb-8">
//                     <img
//                         src={logo}
//                         alt=""
//                         style={{
//                             maxWidth: '45%',
//                             height: 'auto',
//                             display: 'block' // Recomendado para evitar espacios no deseados debajo de la imagen
//                         }}
//                     />
//                 </div>

//                 {/* Sección de Título */}
//                 <div className="mb-6">
//                     <h2 className="text-2xl font-bold text-gray-800 mb-1 text-center">Sistemas de Procesos</h2>
//                     <p className="text-sm text-gray-500 text-center">Administracion de Visceras y Empaque</p>
//                 </div>

//                 {/* Mensaje de error general */}
//                 {generalError && (
//                     <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
//                         {generalError}
//                     </div>
//                 )}

//                 <form onSubmit={submit} className="space-y-6">

//                     {/* Campo Correo electrónico (Username) */}
//                     <div>
//                         <label htmlFor="Username" className="block text-sm font-medium text-gray-700 mb-1">
//                             Usuario
//                         </label>
//                         <TextInput
//                             id="Username"
//                             type="text"
//                             name="Username"
//                             value={data.Username}
//                             onChange={(e) => handleDataChange('Username', e.target.value)}
//                             placeholder="nombre.usuario"
//                             icon="email"
//                             autoComplete="username"
//                             isFocused={true}
//                             error={localErrors.Username}
//                         />
//                         <InputError message={localErrors.Username} className="mt-2" />
//                     </div>

//                     {/* Campo Contraseña (Password) */}
//                     <div>
//                         <label htmlFor="Password" className="block text-sm font-medium text-gray-700 mb-1">
//                             Contraseña
//                         </label>
//                         <TextInput
//                             id="Password"
//                             type="password"
//                             name="Password"
//                             value={data.Password}
//                             onChange={(e) => handleDataChange('Password', e.target.value)}
//                             placeholder="••••••••"
//                             icon="lock"
//                             autoComplete="current-password"
//                             error={localErrors.Password}
//                         />
//                         <InputError message={localErrors.Password} className="mt-2" />
//                     </div>

//                     {/* Botón de Ingresar */}
//                     <div className="mt-6">
//                         <PrimaryButton disabled={isProcessing} processing={isProcessing}>
//                             Iniciar sesion
//                         </PrimaryButton>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }


import { Head, Link, useForm } from '@inertiajs/react';
import logo from '../../../../public/img/logotipo.png';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

// --- COMPONENTES AUXILIARES ---

const TextInput = ({ icon, type = 'text', name, value, onChange, placeholder, error, className = '', isFocused, ...props }) => {
    const IconSVG = () => {
        if (icon === 'email') {
            return (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
            );
        } else if (icon === 'lock') {
            return (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
            );
        }
        return null;
    };

    const input = React.useRef();

    useEffect(() => {
        if (isFocused) {
            input.current.focus();
        }
    }, [isFocused]);

    return (
        <div className={`relative ${className}`}>
            <input
                {...props}
                ref={input}
                type={type}
                name={name}
                id={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full py-3 ps-4 pe-12 border rounded-lg text-sm transition duration-150 ease-in-out focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400 ${error ? 'border-red-500' : 'border-gray-300'}`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pe-3 pointer-events-none">
                <IconSVG />
            </div>
        </div>
    );
};

const PrimaryButton = ({ children, disabled, className = '', processing, ...props }) => (
    <button
        {...props}
        className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg font-semibold text-base tracking-widest transition ease-in-out duration-150 ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'} ${className}`}
        disabled={disabled}
        style={{ backgroundColor: '#A61A18' }}
    >
        {processing ? (
            <div className="flex items-center text-white">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
            </div>
        ) : (
            <span className="flex items-center text-white">
                {children}
            </span>
        )}
    </button>
);

const InputError = ({ message, className = '' }) => {
    const displayMessage = Array.isArray(message) ? message[0] : message;
    return displayMessage ? (
        <p className={`text-sm text-red-600 ${className}`}>{displayMessage}</p>
    ) : null;
};

// --- COMPONENTE PRINCIPAL ---

export default function Login({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        Username: '',
        Password: '',
        remember: false,
    });

    // Función para activar pantalla completa
    const activateFullscreen = () => {
        const docElm = document.documentElement;
        if (docElm.requestFullscreen) {
            docElm.requestFullscreen();
        } else if (docElm.mozRequestFullScreen) { // Firefox
            docElm.mozRequestFullScreen();
        } else if (docElm.webkitRequestFullscreen) { // Chrome, Safari, Opera
            docElm.webkitRequestFullscreen();
        } else if (docElm.msRequestFullscreen) { // IE/Edge
            docElm.msRequestFullscreen();
        }
    };

    const submit = (e) => {
        e.preventDefault();

        // Intentamos poner en pantalla completa (requiere acción del usuario)
        activateFullscreen();

        post(route('login'), {
            onError: () => {
                toast.error("No se encontraron coincidencias con las credenciales");
                // Si falla, podrías decidir si salir de fullscreen o no:
                // if (document.fullscreenElement) document.exitFullscreen();
            },
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 font-sans" style={{ backgroundColor: '#131B2E' }}>
            <Head title="Iniciar Sesión" />

            <div className="w-full max-w-sm bg-white p-8 md:p-10 rounded-xl shadow-2xl transition duration-500">

                {/* Sección de Logo */}
                <div className="flex justify-center mb-8">
                    <img
                        src={logo}
                        alt="Logotipo"
                        style={{
                            maxWidth: '45%',
                            height: 'auto',
                            display: 'block'
                        }}
                    />
                </div>

                {/* Sección de Título */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1 text-center">Sistemas de Procesos</h2>
                    <p className="text-sm text-gray-500 text-center">Administración de Vísceras y Empaque</p>
                </div>

                <form onSubmit={submit} className="space-y-6">

                    {/* Campo Usuario */}
                    <div>
                        <label htmlFor="Username" className="block text-sm font-medium text-gray-700 mb-1">
                            Usuario
                        </label>
                        <TextInput
                            id="Username"
                            type="text"
                            name="Username"
                            // Convertimos a mayúsculas al guardar en el estado
                            onChange={(e) => setData('Username', e.target.value.toUpperCase())}
                            value={data.Username}
                            placeholder="example.user"
                            icon="email"
                            autoComplete="username"
                            isFocused={true}
                            error={errors.Username}
                            // Opcional: Forzar visualmente vía CSS por si hay un retraso en el renderizado
                            className="uppercase"
                        />
                        <InputError message={errors.Username} className="mt-2" />
                    </div>

                    {/* Campo Contraseña */}
                    <div>
                        <label htmlFor="Password" className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <TextInput
                            id="Password"
                            type="password"
                            name="Password"
                            value={data.Password}
                            onChange={(e) => setData('Password', e.target.value)}
                            placeholder="••••••••"
                            icon="lock"
                            autoComplete="current-password"
                            error={errors.Password}
                        />
                        <InputError message={errors.Password} className="mt-2" />
                    </div>

                    {/* Botón de Ingresar */}
                    <div className="mt-6">
                        <PrimaryButton disabled={processing} processing={processing}>
                            Iniciar sesión
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    );
}