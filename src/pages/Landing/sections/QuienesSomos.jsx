import { Sparkles, Ruler, Leaf, Heart } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { css, useReveal } from '../utils';
import styles from '../Landing.module.css';

const VALUE_ICONS = [Sparkles, Ruler, Leaf, Heart];

export default function QuienesSomos() {
  const { t } = useLanguage();
  const containerRef = useReveal(styles['vis']);

  return (
    <section id="qs" className={css(styles, 'qs', 'section-pad')} ref={containerRef}>
      <div className={css(styles, 'container')}>
        <div className={css(styles, 'qs-grid')}>
          <div className={css(styles, 'qs-img-wrap', 'reveal-l')} data-reveal>
            <img src="/images/carmen.jpg" alt="Carmen Moya en el taller" className={css(styles, 'qs-img-main')} />
            <img
              src="https://images.pexels.com/photos/2381469/pexels-photo-2381469.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400"
              alt="Detalle bordado en oro"
              className={css(styles, 'qs-img-accent')}
            />
            <div className={css(styles, 'qs-badge')}>
              <span className={css(styles, 'qs-badge-n')}>{t.qs.badgeYears}</span>
              <span className={css(styles, 'qs-badge-t')}>{t.qs.badgeText}</span>
            </div>
          </div>
          <div className={css(styles, 'reveal-r')} data-reveal>
            <span className={css(styles, 'tag')}>{t.qs.tag}</span>
            <h2 className={css(styles, 'section-title')}>{t.qs.title}</h2>
            <p className={css(styles, 'section-subtitle')}>{t.qs.subtitle}</p>
            <p
              style={{ fontSize: '.93rem', color: 'var(--text-medium)', marginTop: 14, lineHeight: 1.75 }}
              dangerouslySetInnerHTML={{ __html: t.qs.paragraph }}
            />
            <div className={css(styles, 'qs-values')}>
              {t.qs.values.map((v, i) => {
                const Icon = VALUE_ICONS[i];
                return (
                  <div className={css(styles, 'qs-val')} key={i}>
                    <Icon size={19} className={css(styles, 'qs-val-ic')} />
                    <div>
                      <h4>{v.title}</h4>
                      <p>{v.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={css(styles, 'qs-firma')}>
              <div className={css(styles, 'qs-avatar')}>C</div>
              <div>
                <div className={css(styles, 'qs-name')}>{t.qs.firmaName}</div>
                <div className={css(styles, 'qs-role')}>{t.qs.firmaRole}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
