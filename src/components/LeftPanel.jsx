import NewsPanel from './NewsPanel';
import StockMarketPanel from './StockMarketPanel';
import ForceAnalysisPanel from './ForceAnalysisPanel';
import PredictionsPanel from './PredictionsPanel';

const TABS = [
    {id: 'news',        label: 'Quick Access'},
    {id: 'markets',     label: 'Markets'},
    {id: 'forces',      label: 'Forces'},
    {id: 'predictions', label: 'Predictions'},
];

export default function LeftPanel(props) {
    const {activeTab, setActiveTab} = props;

    return (
        <aside className="panel" id="left-panel">
            <div className="panel-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`panel-tab${activeTab === tab.id ? ' active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {props.activeTab === 'news' && (
                <NewsPanel
                    news={props.news}
                    activeRegion={props.activeRegion}
                    onRegionSelect={props.onRegionSelect}
                    onRegionClear={props.onRegionClear}
                    expanded={props.expanded}
                    setExpanded={props.setExpanded}
                    newsItem={props.newsItem}
                    setNewsItem={props.setNewsItem}
                    maxAge={props.maxAge}
                />
            )}
            {props.activeTab === 'markets' && <StockMarketPanel />}
            {props.activeTab === 'forces' && (
                <ForceAnalysisPanel
                    pois={props.pois}
                    activePoi={props.activePoi}
                    onPoiSelect={props.onPoiSelect}
                />
            )}
            {props.activeTab === 'predictions' && (
                <PredictionsPanel onLocationSelect={props.onPredictionSelect} />
            )}
        </aside>
    );
}
