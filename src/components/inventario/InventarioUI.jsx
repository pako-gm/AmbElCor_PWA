/* ============================================================
   Inventario AmbElCor — UI base (iconos, botones, badges, KPI)
   ============================================================ */

// Iconos (stroke, currentColor)
export function Icon({ name, size = 18, style }) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style,
  };
  const paths = {
    doc: (
      <>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M8 13h8M8 17h5" />
      </>
    ),
    arrowDown: (
      <>
        <path d="M12 5v14" />
        <path d="m6 13 6 6 6-6" />
      </>
    ),
    arrowUp: (
      <>
        <path d="M12 19V5" />
        <path d="m6 11 6-6 6 6" />
      </>
    ),
    wrench: (
      <path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L4 17l3 3 5.5-5.5a4 4 0 0 0 5.2-5.2l-2.4 2.4-2.1-.5-.5-2.1z" />
    ),
    cubes: (
      <>
        <path d="m12 2 8 4-8 4-8-4 8-4z" />
        <path d="m4 6v12l8 4 8-4V6" />
        <path d="M12 10v12" />
      </>
    ),
    box: (
      <>
        <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
        <path d="m3 8 9 5 9-5" />
        <path d="M12 13v8" />
      </>
    ),
    warn: (
      <>
        <path d="M10.3 3.5 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    pencil: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 16v-4M12 8h.01" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    chevL: <path d="m15 18-6-6 6-6" />,
    x: (
      <>
        <path d="M18 6 6 18M6 6l12 12" />
      </>
    ),
    sort: (
      <>
        <path d="m8 9 4-4 4 4M16 15l-4 4-4-4" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    menu: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),
    back: (
      <>
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
      </>
    ),
    shirt: <path d="M16 4 12 7 8 4 3 7l2 4 2-1v9h10v-9l2 1 2-4z" />,
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5z" />
        <path d="m3 13 9 5 9-5" />
      </>
    ),
    gem: (
      <>
        <path d="m6 3 12 0 3 6-9 12L3 9z" />
        <path d="M3 9h18M9 3 6 9l6 12 6-12-3-6" />
      </>
    ),
    scissors: (
      <>
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="6" cy="18" r="2.5" />
        <path d="M8 8 20 18M8 16 20 6" />
      </>
    ),
    circle: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2" />
      </>
    ),
    trash: <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />,
    heart: <path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5 6 5c2 0 3 1.2 4 2.5C11 6.2 12 5 14 5c3.5 0 5 4 3.5 7-2.5 4.5-9.5 9-9.5 9z" />,
    building: (
      <>
        <path d="M3 21h18M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 21V9h3a1 1 0 0 1 1 1v11" />
        <path d="M8 7h2M8 11h2M8 15h2" />
      </>
    ),
    phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M8 2v4M16 2v4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </>
    ),
    card: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </>
    ),
    check: <path d="M20 6 9 17l-5-5" />,
    power: (
      <>
        <path d="M12 3v9" />
        <path d="M7.5 6.5a7 7 0 1 0 9 0" />
      </>
    ),
  };
  return <svg {...p}>{paths[name] || null}</svg>;
}

// Botón
export function Btn({
  kind = 'ghost',
  icon,
  children,
  onClick,
  type = 'button',
  style,
  disabled,
  full,
  className,
}) {
  const cls = `btn btn--${kind}${full ? ' btn--full' : ''}${className ? ` ${className}` : ''}`;
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} style={style}>
      {icon && <Icon name={icon} size={16} />}
      {children && <span>{children}</span>}
    </button>
  );
}

// Badge de categoría
export function CatBadge({ cat }) {
  return <span className="cat-badge">{cat}</span>;
}

// Pill de estado
export function StatusPill({ status }) {
  const map = { OK: 'ok', BAJO: 'bajo', AGOTADO: 'agotado' };
  return <span className={`pill pill--${map[status] || 'ok'}`}>{status}</span>;
}

// KPI Card
export function KpiCard({ id, label, value, icon, tone, active, onClick }) {
  return (
    <button
      className={`kpi${active ? ` kpi--active kpi--active-${tone}` : ''}`}
      onClick={onClick}
      data-tone={tone}
    >
      <div className="kpi__row">
        <span className="kpi__label">{label}</span>
        <span className={`kpi__icon kpi__icon--${tone}`}>
          <Icon name={icon} size={18} />
        </span>
      </div>
      <div className="kpi__value">{value}</div>
    </button>
  );
}

// Shell de modal
export function Modal({ tone = 'green', eyebrow, title, titleNote, onClose, children, footer }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal modal--${tone}`} role="dialog" aria-modal="true">
        <div className={`modal__head modal__head--${tone}`}>
          <div>
            {eyebrow && <div className="modal__eyebrow">{eyebrow}</div>}
            <h2 className="modal__title">
              {title}
              {titleNote && <span className="modal__title-note">{titleNote}</span>}
            </h2>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

// Campo de formulario
export function Field({ label, hint, children, htmlFor }) {
  return (
    <label className="field" htmlFor={htmlFor}>
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}

// Tooltip "?" para explicar PMP
export function Help({ children }) {
  return (
    <span className="help" tabIndex={0}>
      <Icon name="info" size={13} />
      <span className="help__pop">{children}</span>
    </span>
  );
}
