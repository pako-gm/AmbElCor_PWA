import { CalendarDays } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { css, useReveal } from '../utils';
import styles from '../Landing.module.css';

const FEAT_IMG = 'https://images.pexels.com/photos/14423702/pexels-photo-14423702.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=1200';
const ITEM_IMGS = [
  'https://images.pexels.com/photos/2381469/pexels-photo-2381469.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=200&w=200',
  'https://images.pexels.com/photos/4622419/pexels-photo-4622419.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=200&w=200',
  'https://images.pexels.com/photos/11829057/pexels-photo-11829057.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=200&w=200',
  'https://images.unsplash.com/photo-1758723209148-80edb67f3492?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=200',
];

export default function Noticias() {
  const { t } = useLanguage();
  const containerRef = useReveal(styles['vis']);

  return (
    <section id="noticias" className={css(styles, 'noticias', 'section-pad')} ref={containerRef}>
      <div className={css(styles, 'container')}>
        <div className={css(styles, 'section-header', 'reveal')} data-reveal>
          <span className={css(styles, 'tag')}>{t.noticias.tag}</span>
          <h2 className={css(styles, 'section-title')}>{t.noticias.title}</h2>
          <p className={css(styles, 'section-subtitle')}>{t.noticias.subtitle}</p>
        </div>
        <div className={css(styles, 'news-grid')}>
          <div className={css(styles, 'news-feat', 'reveal-l')} data-reveal>
            <img src={FEAT_IMG} alt={t.noticias.feat.title} className={css(styles, 'news-feat-img')} />
            <div className={css(styles, 'news-feat-ov')} />
            <div className={css(styles, 'news-feat-body')}>
              <span className={css(styles, 'news-cat')}>{t.noticias.feat.cat}</span>
              <h3 className={css(styles, 'news-feat-title')}>{t.noticias.feat.title}</h3>
              <div className={css(styles, 'news-date')}>
                <CalendarDays size={13} /> {t.noticias.feat.date}
              </div>
            </div>
          </div>
          <div className={css(styles, 'news-list', 'reveal-r')} data-reveal>
            {t.noticias.items.map((item, i) => (
              <div className={css(styles, 'news-item')} key={i}>
                <img src={ITEM_IMGS[i]} alt={item.title} className={css(styles, 'news-item-img')} />
                <div>
                  <div className={css(styles, 'news-item-cat')}>{item.cat}</div>
                  <h4 className={css(styles, 'news-item-title')}>{item.title}</h4>
                  <div className={css(styles, 'news-item-date')}>
                    <CalendarDays size={12} /> {item.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
