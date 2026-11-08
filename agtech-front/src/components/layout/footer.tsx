import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-slate-800 pt-10 pb-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Contenedor Principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Marca y Misión */}
          <div className="col-span-1 md:col-span-1">
            <span className="text-xl font-bold text-white tracking-tight">Ag<span className="text-emerald-500">Tech</span></span>
            <p className="mt-4 text-sm text-slate-400">
              Digitalizando la cadena de valor agrícola en el NOA. Análisis de precisión para legumbres.
            </p>
          </div>

          {/* Enlaces de Producto */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-4">Producto</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Características</a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">API para Plantas</a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Precios</a>
              </li>
            </ul>
          </div>

          {/* Enlaces de Soporte */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-4">Soporte</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Documentación</a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Guías de Integración</a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Contacto de Asistencia</a>
              </li>
            </ul>
          </div>

          {/* Enlaces Legales */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Términos de Servicio</a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Política de Privacidad</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria y Copyright */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-slate-500">
            &copy; {currentYear} AgTech Solutions. Todos los derechos reservados.
          </p>
          <div className="mt-4 md:mt-0 text-sm text-slate-500">
            Desarrollado en Jujuy, Argentina.
          </div>
        </div>
        
      </div>
    </footer>
  );
};

export default Footer;