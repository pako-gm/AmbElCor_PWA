import { Heart, ShoppingBag, Mail } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { WhatsAppIcon } from '../icons';
import { css, useReveal } from '../utils';
import styles from '../Landing.module.css';

const PRODUCT_META = [
  { img: 'https://images.pexels.com/photos/14423702/pexels-photo-14423702.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=600&w=600', alt: true },
  { img: 'https://images.unsplash.com/photo-1642775255546-6ee6e59c7cfe?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=600', alt: true },
  { img: 'https://images.unsplash.com/photo-1764779169349-a5adca68947c?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=600', alt: false },
  { img: 'https://images.unsplash.com/photo-1758723209148-80edb67f3492?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=600', alt: false },
  { img: 'https://images.pexels.com/photos/2381469/pexels-photo-2381469.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=600&w=600', alt: false },
  { img: 'https://images.pexels.com/photos/11829057/pexels-photo-11829057.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=600&w=600', alt: false },
];

export default function Tienda() {
  const { t } = useLanguage();
  const containerRef = useReveal(styles['vis']);

  const tabs = [t.tienda.tabs.todos, t.tienda.tabs.alquiler, t.tienda.tabs.venta, t.tienda.tabs.complementos];

  return (
    <section id="tienda" className={css(styles, 'tienda', 'section-pad')} ref={containerRef}>
      <div className={css(styles, 'container')}>
        <div className={css(styles, 'section-header', 'center', 'reveal')} data-reveal>
          <span className={css(styles, 'tag')}>{t.tienda.tag}</span>
          <h2 className={css(styles, 'section-title')}>{t.tienda.title}</h2>
          <p className={css(styles, 'section-subtitle')}>{t.tienda.subtitle}</p>
        </div>

        {/* Tienda deshabilitada: servicio disponible próximamente (sin enlaces habilitados) */}
        <div className={css(styles, 'tienda-disabled-wrap')}>
          <div className={css(styles, 'tienda-disabled-content')}>
            <div className={css(styles, 'tabs', 'reveal')} data-reveal>
              {tabs.map((label, i) => (
                <button key={i} type="button" className={css(styles, 'tab', i === 0 && 'active')} tabIndex={-1}>
                  {label}
                </button>
              ))}
            </div>
            <div className={css(styles, 'prod-grid')}>
              {t.tienda.products.map((p, i) => {
                const meta = PRODUCT_META[i];
                return (
                  <div className={css(styles, 'prod-card', 'reveal', `d${(i % 4) + 1}`)} key={i} data-reveal>
                    <div className={css(styles, 'prod-img-wrap')}>
                      <img src={meta.img} alt={p.name} className={css(styles, 'prod-img')} />
                      <span className={css(styles, 'prod-badge', meta.alt && 'alt')}>{p.badge}</span>
                      <div className={css(styles, 'prod-wish')} tabIndex={-1}>
                        <Heart size={13} />
                      </div>
                    </div>
                    <div className={css(styles, 'prod-body')}>
                      <h3 className={css(styles, 'prod-name')}>{p.name}</h3>
                      <p className={css(styles, 'prod-desc')}>{p.desc}</p>
                      <div className={css(styles, 'prod-foot')}>
                        <div className={css(styles, 'prod-price')}>--</div>
                        <button type="button" className={css(styles, 'prod-btn')} tabIndex={-1}>
                          <ShoppingBag size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={css(styles, 'tienda-watermark')} aria-hidden="true">
            <span>{t.tienda.watermark}</span>
          </div>
        </div>

        <div className={css(styles, 'shop-cta', 'reveal')} data-reveal>
          <p style={{ color: 'var(--text-medium)', marginBottom: 18, fontSize: '.93rem' }}>{t.tienda.ctaText}</p>
          <a href="#contacto" className={css(styles, 'btn', 'btn-primary')}>
            <Mail size={15} /> {t.tienda.ctaPresupuesto}
          </a>
          &nbsp;
          <a href="https://wa.me/34600123456" target="_blank" rel="noreferrer" className={css(styles, 'btn', 'btn-outline')}>
            <WhatsAppIcon size={16} /> {t.tienda.ctaWhatsapp}
          </a>
        </div>
      </div>
    </section>
  );
}
