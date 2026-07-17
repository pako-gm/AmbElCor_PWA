import { useEffect, useState } from 'react';
import { CalendarCheck, ShoppingCart, LogIn } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { LANGUAGES } from '../translations';
import { css } from '../utils';
import styles from '../Landing.module.css';
import logoOscuro from '../assets/img/ambelcor-oscuro.png';
import logoClaro from '../assets/img/ambelcor-claro.png';

function LanguageSelector({ variant = 'desktop' }) {
  const { lang, setLang } = useLanguage();
  const wrapClass = variant === 'desktop' ? css(styles, 'lang-selector') : css(styles, 'mob-lang-selector');
  const btnClass = variant === 'desktop' ? 'lang-btn' : 'mob-lang-btn';
  return (
    <div className={wrapClass}>
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          className={css(styles, btnClass, lang === code && 'active')}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function Header() {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const navItems = [
    { href: '#qs', label: t.nav.quienesSomos },
    { href: '#servicios', label: t.nav.servicios },
    { href: '#instagram', label: t.nav.instagram },
    { href: '#tienda', label: t.nav.tienda },
    { href: '#contacto', label: t.nav.contacto },
  ];

  return (
    <>
      <header className={css(styles, 'hdr', scrolled && 'scrolled')}>
        <div className={css(styles, 'container')}>
          <nav className={css(styles, 'nav-inner')}>
            <a href="#inicio" className={css(styles, 'logo')}>
              <img
                src={scrolled ? logoOscuro : logoClaro}
                alt="Amb el Cor"
                className={css(styles, 'header-logo-img')}
              />
              <div className={css(styles, 'logo-text')}>
                <span className={css(styles, 'logo-name')}>Amb el Cor</span>
                <span className={css(styles, 'logo-sub')}>Indumentaria Valenciana</span>
              </div>
            </a>
            <ul className={css(styles, 'nav-links')}>
              {navItems.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
              <li>
                <a href="#" className={css(styles, 'nav-cart')} aria-label={t.nav.carritoAria}>
                  <ShoppingCart size={17} />
                </a>
              </li>
              <li>
                <a
                  href="/acceso"
                  target="_blank"
                  rel="noreferrer"
                  className={css(styles, 'nav-crm')}
                  aria-label={t.nav.crmAria}
                  title={t.nav.crmAria}
                >
                  <LogIn size={17} />
                </a>
              </li>
            </ul>
            <a href="#contacto" className={css(styles, 'btn', 'btn-primary', 'nav-cta')}>
              <CalendarCheck size={16} /> {t.nav.pedirCita}
            </a>
            <LanguageSelector variant="desktop" />
            <button
              type="button"
              className={css(styles, 'hamburger')}
              onClick={() => setMobileOpen(true)}
              aria-label="Menú"
            >
              <span /><span /><span />
            </button>
          </nav>
        </div>
      </header>

      <div className={css(styles, 'mob-menu', mobileOpen && 'open')}>
        <button type="button" className={css(styles, 'mob-close')} onClick={closeMobile} aria-label="Cerrar menú">
          ✕
        </button>
        {navItems.map((item) => (
          <a key={item.href} href={item.href} onClick={closeMobile}>
            {item.label}
          </a>
        ))}
        <a href="#contacto" className={css(styles, 'btn', 'btn-primary')} style={{ marginTop: 10 }} onClick={closeMobile}>
          {t.nav.pedirCita}
        </a>
        <LanguageSelector variant="mobile" />
      </div>
    </>
  );
}
