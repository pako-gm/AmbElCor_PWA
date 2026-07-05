import { X } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { css } from '../utils';
import styles from '../Landing.module.css';

const KEYS = ['aviso', 'privacidad', 'pago', 'ventas', 'tyc', 'cookies'];

export default function LegalModales({ openModal, onClose }) {
  const { t } = useLanguage();

  return (
    <>
      {KEYS.map((key) => {
        const modal = t.legal[key];
        const isOpen = openModal === key;
        return (
          <div
            key={key}
            className={css(styles, 'modal-ov', isOpen && 'open')}
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            <div className={css(styles, 'modal')}>
              <div className={css(styles, 'modal-hdr')}>
                <h2>{modal.title}</h2>
                <button type="button" className={css(styles, 'modal-close')} onClick={onClose} aria-label="Cerrar">
                  <X size={16} />
                </button>
              </div>
              <div className={css(styles, 'modal-body')}>
                <p>{modal.intro}</p>
                {modal.sections.map((section, i) => (
                  <div key={i}>
                    <h3>{section.heading}</h3>
                    {section.body && <p dangerouslySetInnerHTML={{ __html: section.body }} />}
                    {section.list && (
                      <ul>
                        {section.list.map((li, j) => (
                          <li key={j} dangerouslySetInnerHTML={{ __html: li }} />
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
