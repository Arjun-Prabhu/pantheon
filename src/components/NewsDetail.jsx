import closeIcon from '../assets/X--Streamline-Tabler.svg';
import {LEVEL_LABELS, LEVEL_COLOR, scoreColor, sourceMeta, buildAiSummary} from '../utils/newsMeta.js';

/* The bias / accuracy / source / summary card. Rendered both as the floating
   popup over the feed and as the detail pane inside the all-feeds modal — both
   read the same `article`, so the two stay in sync. */
export default function NewsDetail({article, onClose, variant = 'popup'}) {
    if (!article) return null;

    const meta = sourceMeta(article);
    const sc = scoreColor(article.importance);
    const levelColor = LEVEL_COLOR[article.level] || 'var(--gold)';

    return (
        <div className={`expanded-overview-modal-container${variant === 'pane' ? ' detail-pane' : ''}`}>
            <div className="expanded-overview-modal-header">
                <div className="tags-container">
                    <div className="modal-label" style={{background: levelColor}}>
                        {(LEVEL_LABELS[article.level] || article.level || 'Update').toUpperCase()}
                    </div>
                    <div className="modal-intensity" style={{color: sc, borderColor: sc}}>
                        INTENSITY {article.importance}/10
                    </div>
                    <div className="modal-heading-text">{article.time} · {meta.domain}</div>
                </div>
                {onClose && (
                    <div className="modal-close-button" onClick={onClose}>
                        <img src={closeIcon} style={{width: '100%', margin: 0}} alt="close"/>
                    </div>
                )}
            </div>

            <p className="modal-title">{article.headline}</p>
            <p className="modal-caption">{article.summary}</p>

            <hr style={{borderColor: 'rgb(34 34 34)', borderWidth: '2px'}}/>
            <p className="modal-summary-header">AI SUMMARY</p>
            <p className="modal-ai-summary">{buildAiSummary(article)}</p>
            <hr style={{borderColor: 'rgb(34 34 34)', borderWidth: '2px'}}/>

            <div className="modal-visualizations-container">
                <div className="visualization-container">
                    <p className="visualization-label">POLITICAL BIAS</p>
                    <p className="visualization-value" style={{color: meta.bias.color}}>{meta.bias.label}</p>
                    <div className="outerSlider">
                        <div className="innerSlider" style={{width: `${meta.bias.pct}%`, backgroundColor: meta.bias.color}}/>
                    </div>
                    <div className="visualization-scale">
                        <p>LEFT</p>
                        <p>RIGHT</p>
                    </div>
                </div>
                <div className="visualization-container">
                    <p className="visualization-label">SOURCE ACCURACY</p>
                    <p className="visualization-value" style={{color: meta.accuracy.color}}>{meta.accuracy.score}/10</p>
                    <div className="outerSlider">
                        <div className="innerSlider" style={{width: `${meta.accuracy.pct}%`, backgroundColor: meta.accuracy.color}}/>
                    </div>
                    <div className="visualization-scale">
                        <p>LOW</p>
                        <p>HIGH</p>
                    </div>
                </div>
                <div className="visualization-container">
                    <p className="visualization-label">SOURCE</p>
                    <p className="visualization-value" style={{color: 'var(--text)'}}>{article.source}</p>
                    <p className="visualization-label" style={{fontSize: '9.5px'}}>{meta.domain}</p>
                    <p className="visualization-label" style={{fontSize: '9.5px'}}>{article.region} · {article.time}</p>
                </div>
            </div>
        </div>
    );
}
