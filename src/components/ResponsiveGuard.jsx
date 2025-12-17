import React, { useEffect, useRef, useState } from 'react';

// Renders children only when the wrapper has a non-zero width and height.
export default function ResponsiveGuard({ children, className }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const checkSize = () => {
      try {
        const r = el.getBoundingClientRect();
        setVisible(r.width > 0 && r.height > 0);
      } catch {
        setVisible(false);
      }
    };

    checkSize();
    const ro = new ResizeObserver(() => checkSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ minHeight: 20 }}>
      {visible ? children : null}
    </div>
  );
}
