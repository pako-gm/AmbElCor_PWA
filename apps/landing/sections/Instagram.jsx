import { Instagram as InstagramIcon } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { css, useReveal } from '../utils';
import styles from '../Landing.module.css';

const IMAGES = [
  'https://images.pexels.com/photos/14423702/pexels-photo-14423702.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=500&w=500',
  'https://images.pexels.com/photos/2381469/pexels-photo-2381469.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=500&w=500',
  'https://images.pexels.com/photos/4622419/pexels-photo-4622419.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=500&w=500',
  'https://images.pexels.com/photos/11829057/pexels-photo-11829057.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=500&w=500',
  'https://images.unsplash.com/photo-1758723209148-80edb67f3492?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=500',
  'https://images.unsplash.com/photo-1746737198844-b9c9f4189352?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=500',
];

export default function Instagram() {
  const { t } = useLanguage();
  const containerRef = useReveal(styles['vis']);

  return (
    <section id="instagram" className={css(styles, 'noticias', 'section-pad')} ref={containerRef}>
      <div className={css(styles, 'container')}>
        <div className={css(styles, 'section-header', 'center', 'reveal')} data-reveal>
          <span className={css(styles, 'tag')}>{t.instagram.tag}</span>
          <h2 className={css(styles, 'section-title')}>{t.instagram.title}</h2>
          <p className={css(styles, 'section-subtitle')}>{t.instagram.subtitle}</p>
        </div>

        <div className={css(styles, 'insta-grid')}>
          {IMAGES.map((src, i) => (
            <div className={css(styles, 'insta-item', 'reveal', `d${(i % 4) + 1}`)} key={i} data-reveal>
              <img src={src} alt="" className={css(styles, 'insta-img')} />
              <div className={css(styles, 'insta-overlay')}>
                <InstagramIcon size={22} />
              </div>
            </div>
          ))}
        </div>

        <div className={css(styles, 'shop-cta', 'reveal')} data-reveal>
          <a
            href="https://www.instagram.com/amb_el_cor/?hl=es_es"
            target="_blank"
            rel="noreferrer noopener"
            className={css(styles, 'btn', 'btn-primary')}
          >
            <InstagramIcon size={16} /> {t.instagram.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
