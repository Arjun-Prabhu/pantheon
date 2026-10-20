import {useState} from "react";

const LEVEL_LABELS = { breaking: 'Breaking', high: 'High', medium: 'Medium', low: 'Low' };
const SCORE_COLOR  = s => s >= 9 ? 'var(--breaking)' : s >= 7 ? 'var(--high)' : s >= 5 ? 'var(--medium)' : 'var(--low)';

export default function NewsItem({ article, showScore = false, activeRegion, onRegionSelect, onClick, children}) {
  const sc = SCORE_COLOR(article.importance);
  const onClickFunc = () => {
    onRegionSelect(article.region, article.lat, article.lon)
    onClick()
  }
  return (
    <div
      className={`ni cat-${article.category}${activeRegion === article.region ? ' active-region' : ''}`}
      onClick={onClickFunc}
    >
      <div className="ni-meta">
        <span className={`badge b-${article.level}`}>{LEVEL_LABELS[article.level]}</span>
        <span className="ni-region">{article.region}</span>
        <span className="ni-time">{article.time}</span>
      </div>
      <div className="ni-headline">{article.headline}</div>
      <div className="ni-summary">{article.summary}</div>
      {showScore && (
        <div className="score-row">
          <div className="score-track">
            <div className="score-fill" style={{ width: `${article.importance * 10}%`, background: sc }} />
          </div>
          <div className="score-num" style={{ color: sc }}>{article.importance}/10</div>
        </div>
      )}
      {children}
    </div>
  );
}
