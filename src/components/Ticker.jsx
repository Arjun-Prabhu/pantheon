import { useEffect, useRef } from 'react';

export default function Ticker({ news }) {
  const elRef = useRef();

  useEffect(() => {
    const items = news.filter(n => n.level === 'breaking' || n.level === 'high').slice(0, 15);
    const str = items.map(n => `  ◆  ${n.headline}  ·  ${n.region}`).join('');
    if (elRef.current) elRef.current.textContent = str + str;
  }, [news]);

  return (
    <div className="ticker">
      <div className="ticker-pill">Breaking</div>
      <div className="ticker-track">
        <div className="ticker-text" ref={elRef} />
      </div>
    </div>
  );
}
