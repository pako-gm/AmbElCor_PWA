import { useLanguage } from '../LanguageContext';
import { css } from '../utils';
import styles from '../Landing.module.css';

export default function CookieBanner({ visible, onAccept, onReject, onOpenModal }) {
  const { t } = useLanguage();

  return (
    <div className={css(styles, 'ckbanner', visible && 'show')}>
      <div className={css(styles, 'ck-text')}>
        {t.cookieBanner.text}{' '}
        <button type="button" onClick={() => onOpenModal('cookies')}>
          {t.cookieBanner.moreInfo}
        </button>
      </div>
      <div className={css(styles, 'ck-btns')}>
        <button type="button" className={css(styles, 'ck-btn', 'ck-no')} onClick={onReject}>
          {t.cookieBanner.rejectBtn}
        </button>
        <button type="button" className={css(styles, 'ck-btn', 'ck-ok')} onClick={onAccept}>
          {t.cookieBanner.acceptBtn}
        </button>
      </div>
    </div>
  );
}
