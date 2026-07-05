import { useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { LanguageProvider } from './LanguageContext';
import { css } from './utils';
import { WhatsAppIcon } from './icons';
import styles from './Landing.module.css';

import Header from './sections/Header';
import Hero from './sections/Hero';
import QuienesSomos from './sections/QuienesSomos';
import Servicios from './sections/Servicios';
import Noticias from './sections/Noticias';
import Tienda from './sections/Tienda';
import Contacto from './sections/Contacto';
import Footer from './sections/Footer';
import LegalModales from './sections/LegalModales';
import CookieBanner from './sections/CookieBanner';
import { useLanguage } from './LanguageContext';

const COOKIE_STORAGE_KEY = 'ck';

function LandingContent() {
  const { t } = useLanguage();
  const [openModal, setOpenModal] = useState(null);
  const [cookieBannerVisible, setCookieBannerVisible] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(COOKIE_STORAGE_KEY)) {
      const timer = setTimeout(() => setCookieBannerVisible(true), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (!openModal) return undefined;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpenModal(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [openModal]);

  const acceptCookies = () => {
    window.localStorage.setItem(COOKIE_STORAGE_KEY, 'ok');
    setCookieBannerVisible(false);
  };
  const rejectCookies = () => {
    window.localStorage.setItem(COOKIE_STORAGE_KEY, 'no');
    setCookieBannerVisible(false);
  };

  return (
    <div className={css(styles, 'landing-root')}>
      <Header />
      <Hero />
      <QuienesSomos />
      <Servicios />
      <Noticias />
      <Tienda />

      <div className={css(styles, 'cta-band')}>
        <div className={css(styles, 'container')}>
          <h2>{t.ctaBand.title}</h2>
          <p>{t.ctaBand.subtitle}</p>
          <div className={css(styles, 'cta-btns')}>
            <a href="#contacto" className={css(styles, 'btn', 'btn-white')}>
              <CalendarCheck size={16} /> {t.ctaBand.btnCita}
            </a>
            <a href="https://wa.me/34600123456" target="_blank" rel="noreferrer" className={css(styles, 'btn', 'btn-ghost')}>
              <WhatsAppIcon size={16} /> {t.ctaBand.btnWhatsapp}
            </a>
          </div>
        </div>
      </div>

      <Contacto />
      <Footer onOpenModal={setOpenModal} />
      <LegalModales openModal={openModal} onClose={() => setOpenModal(null)} />
      <CookieBanner
        visible={cookieBannerVisible}
        onAccept={acceptCookies}
        onReject={rejectCookies}
        onOpenModal={setOpenModal}
      />
    </div>
  );
}

export default function Landing() {
  return (
    <LanguageProvider>
      <LandingContent />
    </LanguageProvider>
  );
}
