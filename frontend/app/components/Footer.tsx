'use client';

import Link from 'next/link';
import { useI18n } from '../../context/I18nContext';

const Footer = () => {
  const { t } = useI18n();
  
  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">Florería Cristina</h3>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">{t('footer.quickLinks')}</h3>
            <ul>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors">Inicio</Link></li>
              <li><Link href="/catalogo" className="text-gray-400 hover:text-white transition-colors">Catálogo</Link></li>
              <li><Link href="/contacto" className="text-gray-400 hover:text-white transition-colors">{t('footer.contact')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">{t('footer.contact')}</h3>
            <p className="text-gray-400">Dirección: Solano Vera 480, Yerba Buena Tucumán</p>
            <p className="text-gray-400">Email: eleososatuc@gmail.com</p>
            <p className="text-gray-400">Tel: 3814778577</p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-500">&copy; {new Date().getFullYear()} Florería Cristina. {t('footer.allRightsReserved')}.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
