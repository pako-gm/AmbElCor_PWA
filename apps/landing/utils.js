import { useEffect, useRef, useState } from 'react';

export const cx = (...classes) => classes.filter(Boolean).join(' ');

// Los nombres de clase del CSS original usan guiones (p.ej. "hero-title"),
// así que se acceden por índice en el objeto de CSS Modules: styles['hero-title'].
// Este helper permite escribir css(styles, 'hero-title', condicion && 'd1').
export const css = (styles, ...names) => names.map((n) => (n ? styles[n] : n)).filter(Boolean).join(' ');

// Registra elementos para la animación "reveal on scroll": añade visClassName
// cuando el elemento entra en el viewport (una sola vez), igual que el
// IntersectionObserver del script original. Se usa sobre un contenedor (ref
// en la sección) y cada elemento a animar lleva el atributo data-reveal.
//
// Importante: crear el observer, observar los elementos Y limpiar debe ocurrir
// todo dentro del mismo useEffect. Si "observar" se hiciera fuera del efecto
// (p.ej. en un ref callback) mientras la limpieza vive en el efecto, el doble
// montaje de efectos de React.StrictMode (mount → cleanup → mount) desconecta
// el observer antes de que llegue a disparar y los elementos nunca se
// re-observan, dejándolos con opacity:0 para siempre (bug detectado en
// viewport móvil, donde la carrera se perdía sistemáticamente).
export function useReveal(visClassName) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const targets = container.querySelectorAll('[data-reveal]');
    if (!targets.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(visClassName);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [visClassName]);

  return containerRef;
}

// Popup discreto anclado (p.ej. "Ver catálogo"): se muestra en hover/click
// y se cierra solo a los 3s, reiniciando el temporizador en cada interacción.
export function useAnchoredPopup() {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  const show = () => {
    setVisible(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 3000);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return [visible, show];
}
