import { PenTool, Scissors, Wrench, Tag, ArrowRight } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { css, useReveal, useAnchoredPopup } from '../utils';
import styles from '../Landing.module.css';

const SERVICE_META = [
  { icon: PenTool, href: '#contacto', img: 'https://images.pexels.com/photos/2381469/pexels-photo-2381469.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=500&w=500' },
  { icon: Scissors, href: '#contacto', img: 'https://images.pexels.com/photos/4622419/pexels-photo-4622419.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=500&w=500' },
  { icon: Wrench, href: '#contacto', img: 'https://images.unsplash.com/photo-1746737198844-b9c9f4189352?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=600' },
  { icon: Tag, href: '#tienda', img: 'https://images.unsplash.com/photo-1642775255546-6ee6e59c7cfe?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=600' },
];

export default function Servicios() {
  const { t } = useLanguage();
  const containerRef = useReveal(styles['vis']);
  const [popupVisible, showPopup] = useAnchoredPopup();

  return (
    <section id="servicios" className={css(styles, 'servicios', 'section-pad')} ref={containerRef}>
      <div className={css(styles, 'container')}>
        <div className={css(styles, 'section-header', 'center', 'reveal')} data-reveal>
          <span className={css(styles, 'tag')}>{t.servicios.tag}</span>
          <h2 className={css(styles, 'section-title')}>{t.servicios.title}</h2>
          <p className={css(styles, 'section-subtitle')}>{t.servicios.subtitle}</p>
        </div>
        <div className={css(styles, 'srv-grid')}>
          {t.servicios.items.map((item, i) => {
            const { icon: Icon, href, img } = SERVICE_META[i];
            const isAlquiler = i === 3;
            return (
              <div className={css(styles, 'srv-card', 'reveal', `d${i + 1}`)} key={i} data-reveal>
                <div className={css(styles, 'srv-num')}>0{i + 1}</div>
                <div className={css(styles, 'srv-img-wrap')}>
                  <img src={img} alt={item.title} className={css(styles, 'srv-img')} />
                </div>
                <div className={css(styles, 'srv-body')}>
                  <div className={css(styles, 'srv-icon')}>
                    <Icon size={21} />
                  </div>
                  <h3 className={css(styles, 'srv-title')}>{item.title}</h3>
                  <p className={css(styles, 'srv-desc')}>{item.desc}</p>
                  {isAlquiler ? (
                    <button
                      type="button"
                      className={css(styles, 'srv-link')}
                      onMouseEnter={showPopup}
                      onClick={(e) => {
                        e.preventDefault();
                        showPopup();
                      }}
                    >
                      {item.link} <ArrowRight size={14} />
                      <span className={css(styles, 'catalog-popup', popupVisible && 'show')}>
                        {t.popups.catalogoProximamente}
                      </span>
                    </button>
                  ) : (
                    <a href={href} className={css(styles, 'srv-link')}>
                      {item.link} <ArrowRight size={14} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
