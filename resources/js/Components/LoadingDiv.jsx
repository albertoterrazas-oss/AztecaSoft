import React from 'react';

const LoadingDiv = () => {
  // Color principal: Cámbialo aquí para todo el componente
  const mainColor = '#3a7bd5'; 

  return (
    <div className="loading-container">
      <style>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 200px;
          width: 100%;
        }

        .spinner-box {
          position: relative;
          width: 60px;
          height: 60px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        /* El aro de fondo (sutil) */
        .circle-bg {
          width: 100%;
          height: 100%;
          border: 4px solid ${mainColor};
          border-radius: 50%;
          opacity: 0.1;
        }

        /* El spinner activo */
        .circle-active {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 4px solid transparent;
          border-top: 4px solid ${mainColor};
          border-radius: 50%;
          animation: smooth-spin 1s linear infinite;
        }

        /* El brillo central */
        .core {
          position: absolute;
          width: 8px;
          height: 8px;
          background-color: ${mainColor};
          border-radius: 50%;
          box-shadow: 0 0 15px ${mainColor};
        }

        .nice-text {
          margin-top: 20px;
          font-family: 'Segoe UI', Roboto, sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          color: ${mainColor};
          letter-spacing: 4px;
          text-transform: uppercase;
          opacity: 0.8;
        }

        @keyframes smooth-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="spinner-box">
        <div className="circle-bg"></div>
        <div className="circle-active"></div>
        <div className="core"></div>
      </div>
      
      <span className="nice-text">Procesando</span>
    </div>
  );
};

export default LoadingDiv;