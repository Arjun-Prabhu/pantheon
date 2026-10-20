import NewsItem from './NewsItem';

export default function RightPanel({ news, activeRegion, onRegionSelect }) {
  let list = [...news];
  if (activeRegion) list = list.filter(a => a.region === activeRegion);
  list.sort((a, b) => b.importance - a.importance);

  const avg     = list.length ? (list.reduce((s, a) => s + a.importance, 0) / list.length).toFixed(1) : '0.0';
  const sources = new Set(list.map(a => a.source)).size;

  return (
    <aside className="panel" id="right-panel">
      <div className="panel-head">
        <div className="panel-title">By Importance</div>
        <div className="panel-count">{list.length} articles</div>
      </div>

      <div className="news-feed">
        {list.map(a => (
          <NewsItem
            key={a.id}
            article={a}
            showScore={true}
            activeRegion={activeRegion}
            onRegionSelect={onRegionSelect}
          />
        ))}
      </div>

      <div className="panel-stats">
        <div className="pstat">
          <div className="pstat-l">Avg Score</div>
          <div className="pstat-v">{avg}</div>
        </div>
        <div className="pstat">
          <div className="pstat-l">Sources</div>
          <div className="pstat-v" style={{ color: 'var(--text)' }}>{sources}</div>
        </div>
        <div className="pstat">
          <div className="pstat-l">Articles</div>
          <div className="pstat-v" style={{ color: 'var(--text)' }}>{list.length}</div>
        </div>
      </div>
    </aside>
  );
}
