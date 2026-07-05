import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { WhatsAppIcon } from '../icons';
import { css, useReveal } from '../utils';
import styles from '../Landing.module.css';

export default function Contacto() {
  const { t } = useLanguage();
  const containerRef = useReveal(styles['vis']);

  const ciItems = [
    { icon: MapPin, lbl: t.contacto.direccionLbl, content: <span dangerouslySetInnerHTML={{ __html: t.contacto.direccion }} /> },
    { icon: Phone, lbl: t.contacto.telefonoLbl, content: <a href="tel:+34963123456">+34 963 123 456</a> },
    { icon: WhatsAppIcon, lbl: t.contacto.whatsappLbl, content: <a href="https://wa.me/34600123456" target="_blank" rel="noreferrer">+34 600 123 456</a> },
    { icon: Mail, lbl: t.contacto.emailLbl, content: <a href="mailto:carmen@ambelcorfallero.com">carmen@ambelcorfallero.com</a> },
    { icon: Clock, lbl: t.contacto.horarioLbl, content: <span dangerouslySetInnerHTML={{ __html: t.contacto.horario }} /> },
  ];

  return (
    <section id="contacto" className={css(styles, 'contacto', 'section-pad')} ref={containerRef}>
      <div className={css(styles, 'container')}>
        <div className={css(styles, 'section-header', 'center', 'reveal')} data-reveal>
          <span className={css(styles, 'tag')}>{t.contacto.tag}</span>
          <h2 className={css(styles, 'section-title')}>{t.contacto.title}</h2>
          <p className={css(styles, 'section-subtitle')}>{t.contacto.subtitle}</p>
        </div>
        <div className={css(styles, 'contact-grid', 'contact-grid-solo')}>
          <div className={css(styles, 'reveal')} data-reveal>
            <div className={css(styles, 'contact-info')}>
              <h3>{t.contacto.infoTitle}</h3>
              <p>{t.contacto.infoDesc}</p>
            </div>
            <br />
            <div className={css(styles, 'ci-list')}>
              {ciItems.map(({ icon: Icon, lbl, content }, i) => (
                <div className={css(styles, 'ci')} key={i}>
                  <div className={css(styles, 'ci-icon')}>
                    <Icon size={17} />
                  </div>
                  <div>
                    <div className={css(styles, 'ci-lbl')}>{lbl}</div>
                    <div className={css(styles, 'ci-val')}>{content}</div>
                  </div>
                </div>
              ))}
            </div>
            <a
              href="https://wa.me/34600123456?text=Hola%20Carmen%2C%20me%20gustar%C3%ADa%20consultar%20sobre%20vuestros%20servicios"
              target="_blank"
              rel="noreferrer"
              className={css(styles, 'wa-btn')}
            >
              <WhatsAppIcon size={20} /> {t.contacto.waBtn}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
