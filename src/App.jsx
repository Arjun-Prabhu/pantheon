import {useState, useRef, useEffect} from 'react';
import {NEWS} from './data/news';
import {UNITS, POINTS_OF_INTEREST} from './data/IMINT';
import {PREDICTIONS} from './data/predictions';
import Header from './components/Header';
import Globe from './components/Globe';
import LeftPanel from './components/LeftPanel';
import Ticker from './components/Ticker';
import ForceDispositionPanel from './components/ForceDispositionPanel';
import PoiDispositionPanel from './components/PoiDispositionPanel';
import TimelinePanel from './components/TimelinePanel';
import ScrubberBar, {SCRUBBER_MAX} from './components/ScrubberBar';
import LayerToggle from './components/LayerToggle';

export default function App() {
    const [activeRegion, setActiveRegion] = useState(null);
    const [activeCoords, setActiveCoords] = useState(null);
    const [activeUnit, setActiveUnit] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [newsItem, setNewsItem] = useState(null);
    const [activeTab, setActiveTab] = useState('news');
    const [scrubber, setScrubber] = useState(SCRUBBER_MAX);
    const [layers, setLayers] = useState({});
    const layersRef  = useRef({});
    const scrubberRef = useRef(SCRUBBER_MAX);
    useEffect(() => { layersRef.current  = layers;  }, [layers]);
    useEffect(() => { scrubberRef.current = scrubber; }, [scrubber]);

    const handleRegionSelect = (region, lat, lon) => {
        setActiveRegion(region);
        if (lat != null && lon != null) setActiveCoords({lat, lon});
    };
    const handleNewsSelect = (article) => {
        setActiveTab('news');
        setActiveRegion(article ? article.region : null);
        setExpanded(exp => article ? !exp : exp);
        setNewsItem(article);
        if (article.lat != null && article.lon != null) setActiveCoords({lat: article.lat, lon: article.lon});
    };
    const handleClear = () => {
        setActiveRegion(null);
        setActiveCoords(null);
    };
    const handleUnitSelect = (unitId) => {
        setActiveUnit(UNITS.find(u => u.id === unitId) ?? null);
    };
    const handleUnitClear = () => setActiveUnit(null);
    const handlePoiSelect = (poiId) => {
        const poi = POINTS_OF_INTEREST.find(p => p.id === poiId);
        if (!poi) return;
        setActivePoi(poi);
        setActiveCoords({ lat: poi.lat, lon: poi.lon });
    };
    const handlePoiClear = () => {
        setActivePoi(null);
        setActiveCoords(null);
    };
    const [activePoi, setActivePoi] = useState(null);
    const [activePrediction, setActivePrediction] = useState(null);
    const handlePredictionSelect = (lat, lon) => {
        setActivePrediction({ lat, lon });
        setActiveRegion(null);
        setActiveUnit(null);
    };

    return (
        <div className="app">
            <Header news={NEWS} onResultSelect={handleNewsSelect}/>

            <main className="main">
                <LeftPanel
                    news={NEWS}
                    units={UNITS}
                    pois={POINTS_OF_INTEREST}
                    activeRegion={activeRegion}
                    onRegionClear={handleClear}
                    onRegionSelect={handleRegionSelect}
                    onUnitSelect={handleUnitSelect}
                    activePoi={activePoi}
                    onPoiSelect={handlePoiSelect}
                    onPredictionSelect={handlePredictionSelect}
                    expanded={expanded}
                    newsItem={newsItem}
                    setNewsItem={setNewsItem}
                    setExpanded={setExpanded}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    maxAge={scrubber}
                />

                <div className="globe-container">
                    <Globe
                        news={NEWS}
                        pois={POINTS_OF_INTEREST}
                        predictions={PREDICTIONS}
                        activeRegion={activeRegion}
                        activeCoords={activeCoords}
                        activePrediction={activePrediction}
                        activePoi={activePoi}
                        onRegionSelect={handleNewsSelect}
                        onPoiSelect={handlePoiSelect}
                        layersRef={layersRef}
                        scrubberRef={scrubberRef}
                    />
                    {activeUnit && (
                        <ForceDispositionPanel unit={activeUnit} onClose={handleUnitClear}/>
                    )}
                    {activePoi && (
                        <PoiDispositionPanel poi={activePoi} onClose={handlePoiClear}/>
                    )}
                    <LayerToggle layers={layers} onChange={setLayers} />
                    <ScrubberBar value={scrubber} onChange={setScrubber} />
                    <Ticker news={NEWS}/>
                </div>

                {/*<TimelinePanel*/}
                {/*    activeRegion={activeRegion}*/}
                {/*    onRegionSelect={handleRegionSelect}*/}
                {/*    maxAge={scrubber}*/}
                {/*/>*/}
            </main>
        </div>
    );
}
