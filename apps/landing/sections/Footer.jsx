import { Scissors, Phone, Mail, MapPin, Instagram, Youtube, Facebook } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { WhatsAppIcon, PinterestIcon } from '../icons';
import { css } from '../utils';
import styles from '../Landing.module.css';

const LEGAL_KEYS = ['aviso', 'privacidad', 'pago', 'ventas', 'tyc', 'cookies'];
const NAV_HREFS = ['#inicio', '#qs', '#instagram', '#tienda', '#contacto'];

export default function Footer({ onOpenModal }) {
  const { t } = useLanguage();

  return (
    <footer className={css(styles, 'footer')}>
      <div className={css(styles, 'container')}>
        <div className={css(styles, 'foot-grid')}>
          <div>
            <div className={css(styles, 'foot-logo')}>
              <div className={css(styles, 'foot-logo-ic')}>
                <Scissors size={17} />
              </div>
              <span className={css(styles, 'foot-logo-name')}>Amb el Cor</span>
            </div>
            <p className={css(styles, 'foot-desc')}>{t.footer.desc}</p>
            <div className={css(styles, 'social-links')}>
              <a href="#" className={css(styles, 'soc', 'ig')} title="Instagram">
                <Instagram size={15} />
              </a>
              <a href="#" className={css(styles, 'soc', 'pi')} title="Pinterest">
                <PinterestIcon size={15} />
              </a>
              <a href="#" className={css(styles, 'soc', 'yt')} title="YouTube">
                <Youtube size={15} />
              </a>
              <a href="#" className={css(styles, 'soc', 'fb')} title="Facebook">
                <Facebook size={15} />
              </a>
            </div>
          </div>

          <div className={css(styles, 'foot-col')}>
            <h4>{t.footer.servicios.title}</h4>
            <ul>
              {t.footer.servicios.items.map((item, i) => (
                <li key={i}>
                  <a href={i === t.footer.servicios.items.length - 1 ? '#tienda' : '#servicios'}>{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className={css(styles, 'foot-col')}>
            <h4>{t.footer.navegacion.title}</h4>
            <ul>
              {t.footer.navegacion.items.map((item, i) => (
                <li key={i}>
                  <a href={NAV_HREFS[i]}>{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className={css(styles, 'foot-col')}>
            <h4>{t.footer.contactoTitle}</h4>
            <ul className={css(styles, 'foot-contact-list')}>
              <li>
                <Phone size={15} color="var(--primary)" />
                <a href="tel:+34963123456">+34 963 123 456</a>
              </li>
              <li>
                <WhatsAppIcon size={15} style={{ color: '#25D366' }} />
                <a href="https://wa.me/34600123456" target="_blank" rel="noreferrer">+34 600 123 456</a>
              </li>
              <li>
                <Mail size={15} color="var(--primary)" />
                <a href="mailto:carmen@ambelcorfallero.com">carmen@ambelcorfallero.com</a>
              </li>
              <li className={css(styles, 'foot-contact-addr')}>
                <MapPin size={15} color="var(--primary)" />
                <span dangerouslySetInnerHTML={{ __html: t.footer.direccion }} />
              </li>
            </ul>
          </div>
        </div>

        <div className={css(styles, 'foot-bottom')}>
          <div className={css(styles, 'foot-btm-inner')}>
            <div className={css(styles, 'foot-copy')}>{t.footer.copy}</div>
            <div className={css(styles, 'foot-legal')}>
              {t.footer.legal.map((label, i) => (
                <button key={i} type="button" onClick={() => onOpenModal(LEGAL_KEYS[i])}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
