export function parseMinutes(timeStr) {
    if (!timeStr || timeStr === 'just now') return 0;
    const h = timeStr.match(/(\d+)h/);
    const m = timeStr.match(/(\d+)m/);
    return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
}
