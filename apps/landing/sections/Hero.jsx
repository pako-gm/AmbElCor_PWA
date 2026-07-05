import { useEffect, useRef, useState } from 'react';
import { Award, ListChecks, Store, ChevronDown } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { WhatsAppIcon } from '../icons';
import { css } from '../utils';
import styles from '../Landing.module.css';

function StatItem({ target, label, plus, pct, started }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return undefined;
    let cur = 0;
    const inc = target / 55;
    const timer = setInterval(() => {
      cur += inc;
      if (cur >= target) {
        cur = target;
        clearInterval(timer);
      }
      setCount(Math.floor(cur));
    }, 22);
    return () => clearInterval(timer);
  }, [started, target]);

  return (
    <div className={css(styles, 'stat-item')}>
      <div className={css(styles, 'stat-num')}>
        {plus ? '+' : ''}
        {count}
        {pct ? '%' : ''}
      </div>
      <div className={css(styles, 'stat-lbl')}>{label}</div>
    </div>
  );
}

export default function Hero() {
  const { t } = useLanguage();
  const statsRef = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStarted(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stats = [
    { target: 8, plus: true, label: t.hero.stats.anios },
    { target: 500, plus: true, label: t.hero.stats.trajes },
    { target: 4, label: t.hero.stats.servicios },
    { target: 100, pct: true, label: t.hero.stats.satisfaccion },
  ];

  return (
    <section id="inicio">
      <div className={css(styles, 'hero')}>
        <div className={css(styles, 'hero-bg')} />
        <div className={css(styles, 'hero-overlay')} />
        <div className={css(styles, 'shapes')}>
          <div className={css(styles, 'sh', 'sh1')} />
          <div className={css(styles, 'sh', 'sh2')} />
          <div className={css(styles, 'sh', 'sh3')} />
        </div>
        <div className={css(styles, 'container')}>
          <div className={css(styles, 'hero-content')}>
            <div className={css(styles, 'hero-badge')}>
              <Award size={15} /> {t.hero.badge}
            </div>
            <h1 className={css(styles, 'hero-title')}>
              {t.hero.titleLine1}
              <em>{t.hero.titleEm}</em>
            </h1>
            <p className={css(styles, 'hero-subtitle')}>{t.hero.subtitle}</p>
            <div className={css(styles, 'hero-actions')}>
              <a href="#servicios" className={css(styles, 'btn', 'btn-primary')}>
                <ListChecks size={16} /> {t.hero.ctaServicios}
              </a>
              <a href="#tienda" className={css(styles, 'btn', 'btn-white')}>
                <Store size={16} /> {t.hero.ctaTienda}
              </a>
              <a href="https://wa.me/34600123456" target="_blank" rel="noreferrer" className={css(styles, 'btn', 'btn-gold')}>
                <WhatsAppIcon size={16} /> {t.hero.ctaWhatsapp}
              </a>
            </div>
          </div>
        </div>
        <div className={css(styles, 'hero-scroll')}>
          <span>{t.hero.scrollLabel}</span>
          <ChevronDown size={14} />
        </div>
        <div className={css(styles, 'hero-stats')} ref={statsRef}>
          <div className={css(styles, 'container')}>
            <div className={css(styles, 'stats-inner')}>
              {stats.map((s, i) => (
                <StatItem key={i} {...s} started={started} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
