import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Polyline, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationService, CONTINENTS } from '../utils/LocationService';
import FlightAnimationOverlay from './FlightAnimation';
import DistanceRings from './DistanceRings';
import GlobeView from './GlobeView';
import TimeLapseControls from './TimeLapseControls';

// Fix for default marker icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const GEOJSON_URL = 'https://gist.githubusercontent.com/MichaelVerdegaal/a5f68cc0695ce4cf721cff4875696ffc/raw/countries_lowres.geo.json';

const CONTINENT_CENTERS = {
    'North America': [40, -100],
    'Europe': [50, 20],
    'Asia': [35, 100],
    'South America': [-15, -60],
    'Africa': [0, 20],
    'Oceania': [-25, 135],
    'Antarctica': [-80, 0]
};

const TILE_URLS = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
};

const TimelineFlyTo = React.memo(({ activeCities, timelineDate }) => {
    const map = useMap();
    const lastCityId = React.useRef(null);

    useEffect(() => {
        if (activeCities.length > 0) {
            const newest = [...activeCities].sort((a, b) => new Date(b.date) - new Date(a.date))[0];

            if (newest && newest.id !== lastCityId.current) {
                const currentCenter = map.getCenter();
                const dist = Math.sqrt(Math.pow(currentCenter.lat - newest.lat, 2) + Math.pow(currentCenter.lng - newest.lng, 2));

                // Only fly if it's actually a new destination or far away
                if (dist > 2) {
                    map.flyTo([newest.lat, newest.lng], map.getZoom(), {
                        animate: true,
                        duration: 0.5
                    });
                }
                lastCityId.current = newest.id;
            }
        }
    }, [activeCities, map]);
    return null;
});

const FlyToListener = React.memo(({ city }) => {
    const map = useMap();
    useEffect(() => {
        if (city) {
            map.flyTo([city.lat, city.lng], 6, {
                animate: true,
                duration: 1.5
            });
        }
    }, [city, map]);
    return null;
});

const Map = React.memo(({
    visitedCities,
    bucketListCities,
    visitedCountries,
    bucketListCountries,
    settings,
    selectedCity,
    onToggleCountry,
    onToggleBucketList,
    onCountryInfo,
    onUpdateSettings,
    timelineDate
}) => {
    const [geoData, setGeoData] = useState(null);
    const [showFlightAnimation, setShowFlightAnimation] = useState(false);
    const [weatherData, setWeatherData] = useState({});
    const [showGlobe, setShowGlobe] = useState(false);
    const [showTimeLapse, setShowTimeLapse] = useState(false);
    const [showDistanceRings, setShowDistanceRings] = useState(false);
    const [currentTimelineDate, setCurrentTimelineDate] = useState(timelineDate || new Date().toISOString());

    useEffect(() => {
        setCurrentTimelineDate(timelineDate);
    }, [timelineDate]);

    useEffect(() => {
        fetch(GEOJSON_URL)
            .then(res => res.json())
            .then(data => setGeoData(data))
            .catch(err => console.error('Error loading GeoJSON:', err));
    }, []);

    // Fetch weather for cities when overlay enabled
    useEffect(() => {
        if (!settings?.weatherOverlay || visitedCities.length === 0) return;
        const toFetch = visitedCities.filter(c => !weatherData[c.id]);
        if (toFetch.length === 0) return;
        toFetch.slice(0, 10).forEach(async city => {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current_weather=true`);
                const data = await res.json();
                if (data.current_weather) {
                    setWeatherData(prev => ({ ...prev, [city.id]: data.current_weather }));
                }
            } catch (e) { /* silently skip */ }
        });
    }, [settings?.weatherOverlay, visitedCities]);

    // 1. Pre-calculate ALL possible paths for the entire history
    const allPaths = useMemo(() => {
        const sortedAll = [...visitedCities].sort((a, b) => new Date(a.date) - new Date(b.date));
        const paths = [];
        for (let i = 0; i < sortedAll.length - 1; i++) {
            paths.push({
                positions: LocationService.getCurvePoints(
                    [sortedAll[i].lat, sortedAll[i].lng],
                    [sortedAll[i + 1].lat, sortedAll[i + 1].lng]
                ),
                toDate: sortedAll[i + 1].date,
                id: `path-${sortedAll[i].id}-${sortedAll[i + 1].id}`
            });
        }
        return paths;
    }, [visitedCities]);

    // 2. Filter cities and paths based on timeline - VERY FAST
    const activeCities = useMemo(() =>
        visitedCities.filter(c => c.date <= (currentTimelineDate || new Date().toISOString())),
        [visitedCities, currentTimelineDate]);

    const activePaths = useMemo(() =>
        allPaths.filter(p => p.toDate <= (currentTimelineDate || new Date().toISOString())),
        [allPaths, currentTimelineDate]);

    // Continent heatmap data
    const continentHeatmap = useMemo(() => {
        const counts = {};
        activeCities.forEach(city => {
            const cont = Object.keys(CONTINENTS).find(k => CONTINENTS[k].includes(city.country));
            if (cont) counts[cont] = (counts[cont] || 0) + 1;
        });
        return Object.entries(counts).map(([name, count]) => ({
            name,
            count,
            center: CONTINENT_CENTERS[name]
        }));
    }, [activeCities]);

    // Custom icons memoized
    const getEmojiIcon = useCallback((cityEmoji) => L.divIcon({
        html: `<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); cursor: pointer;">${cityEmoji || settings?.globalEmoji || '📍'}</div>`,
        className: 'custom-emoji-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    }), [settings?.globalEmoji]);

    const bucketIcon = useMemo(() => L.divIcon({
        html: `<div style="font-size: 20px; filter: opacity(0.6) drop-shadow(0 0 10px rgba(168, 85, 247, 0.4)); cursor: pointer;">✨</div>`,
        className: 'bucket-emoji-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    }), []);

    // Day/Night and style
    const efficientStyle = useMemo(() => {
        const currentHour = new Date().getHours();
        const isNight = currentHour < 6 || currentHour > 18;
        return settings?.autoDayNight
            ? (isNight ? 'dark' : 'light')
            : (settings?.mapStyle || 'dark');
    }, [settings?.autoDayNight, settings?.mapStyle]);

    // Country styling memoized
    const countryStyle = useCallback((feature) => {
        const isVisited = visitedCountries.includes(feature.properties.name);
        const isBucketList = bucketListCountries.includes(feature.properties.name);

        if (isVisited) return { fillColor: '#fbbf24', weight: 1.5, opacity: 0.6, color: '#fbbf24', fillOpacity: 0.4 };
        if (isBucketList) return { fillColor: '#c084fc', weight: 1, opacity: 0.4, color: '#c084fc', fillOpacity: 0.2, dashArray: '3' };
        return { fillColor: 'transparent', weight: 1, opacity: 0.1, color: '#475569', fillOpacity: 0 };
    }, [visitedCountries, bucketListCountries]);

    const onEachCountry = useCallback((feature, layer) => {
        layer.on({
            click: (e) => {
                L.DomEvent.stopPropagation(e);
                const coords = e.latlng;
                if (e.originalEvent.shiftKey) onToggleBucketList(feature.properties.name, coords);
                else if (e.originalEvent.ctrlKey && onCountryInfo) onCountryInfo(feature.properties.name);
                else onToggleCountry(feature.properties.name, coords);
            },
            mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({ fillOpacity: 0.6, weight: 2 });
            },
            mouseout: (e) => {
                const layer = e.target;
                layer.setStyle(countryStyle(feature));
            }
        });
    }, [countryStyle, onToggleBucketList, onToggleCountry]);

    return (
        <div className="flex-1 h-full relative" id="map-capture-area">
            <MapContainer
                key={efficientStyle}
                center={[20, 0]}
                zoom={2.5}
                style={{ height: '100%', width: '100%', background: '#020617' }}
                zoomControl={false}
                attributionControl={false}
                preferCanvas={true} // Use Canvas for better performance with many elements
            >
                <TileLayer url={TILE_URLS[efficientStyle]} />

                <TimelineFlyTo activeCities={activeCities} timelineDate={currentTimelineDate} />
                <FlyToListener city={selectedCity} />

                {showDistanceRings && (settings?.homeCity || activeCities.length > 0) && (
                    <DistanceRings center={settings?.homeCity || { lat: activeCities[0].lat, lng: activeCities[0].lng }} />
                )}

                {settings?.showHeatmap && continentHeatmap.map(ch => (
                    <CircleMarker
                        key={`cont-heat-${ch.name}`}
                        center={ch.center}
                        radius={20 + (ch.count * 5)}
                        pathOptions={{
                            fillColor: '#fbbf24',
                            fillOpacity: 0.15,
                            color: '#fbbf24',
                            weight: 1,
                            opacity: 0.3
                        }}
                        interactive={false}
                    />
                ))}

                {geoData && (
                    <GeoJSON
                        key={`geo-${visitedCountries.length}-${bucketListCountries.length}`}
                        data={geoData}
                        style={countryStyle}
                        onEachFeature={onEachCountry}
                    />
                )}

                {activePaths.map((path) => (
                    <Polyline
                        key={path.id}
                        positions={path.positions}
                        color="#3b82f6"
                        weight={1.2}
                        opacity={0.2}
                        dashArray="4,4"
                        interactive={false}
                    />
                ))}

                {activeCities.map((city) => (
                    settings?.showHeatmap ? (
                        <CircleMarker
                            key={`heat-${city.id}`}
                            center={[city.lat, city.lng]}
                            radius={20}
                            pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.1, color: 'transparent' }}
                            interactive={false}
                        />
                    ) : (
                        <Marker
                            key={`marker-${city.id}`}
                            position={[city.lat, city.lng]}
                            icon={getEmojiIcon(city.customEmoji)}
                        >
                            <Popup className="travel-popup">
                                <div className="p-1 min-w-[200px]">
                                    {city.photo && (
                                        <div className="w-full h-32 mb-2 overflow-hidden rounded-lg">
                                            <img src={city.photo} alt={city.name} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <h4 className="text-slate-900 font-bold border-b border-slate-100 pb-2 mb-2">{city.name}</h4>
                                    <div className="text-[10px] text-slate-500 mb-2">
                                        {new Date(city.date).toLocaleDateString()}
                                        {city.departureDate && ` — ${new Date(city.departureDate).toLocaleDateString()}`}
                                        {settings?.weatherOverlay && weatherData[city.id] && (
                                            <span className="ml-2 text-blue-500 font-bold">{weatherData[city.id].temperature}°C</span>
                                        )}
                                    </div>
                                    {(city.tags || []).length > 0 && <div className="flex flex-wrap gap-1 mb-2">{city.tags.map(t => <span key={t} className="px-1 py-0.5 bg-blue-50 rounded text-[8px] text-blue-600 font-bold">{t}</span>)}</div>}
                                    {city.notes ? <p className="bg-slate-50 p-2 rounded-lg italic text-xs text-slate-600">{city.notes}</p> : <p className="text-[10px] text-slate-400 italic">No journal notes yet...</p>}
                                    {city.budget?.amount > 0 && <p className="text-[10px] text-amber-600 font-bold mt-1">💰 ${city.budget.amount}</p>}
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}

                {bucketListCities.map((city) => (
                    <Marker key={city.id} position={[city.lat, city.lng]} icon={bucketIcon}>
                        <Popup className="travel-popup">
                            <div className="p-1">
                                <h4 className="text-slate-900 font-bold mb-1">{city.name}</h4>
                                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest">✨ Bucket List</p>
                                {city.targetDate && <p className="text-[10px] text-slate-500 mt-1">Target: {new Date(city.targetDate).toLocaleDateString()}</p>}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Flight Animation */}
                {showFlightAnimation && activeCities.length >= 2 && (
                    <FlightAnimationOverlay
                        cities={activeCities}
                        onClose={() => setShowFlightAnimation(false)}
                    />
                )}
            </MapContainer>

            {/* Legend */}
            <div className="absolute top-6 right-6 glass p-4 rounded-2xl pointer-events-none z-[1000] text-[10px] uppercase tracking-wider font-bold space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-amber-400 opacity-60 rounded-md ring-2 ring-amber-400/20"></div>
                    <span className="text-slate-200">Visited</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-purple-500 opacity-40 rounded-md border border-dashed border-purple-400"></div>
                    <span className="text-slate-200">Bucket List</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 border-t border-dashed border-blue-500/60"></div>
                    <span className="text-slate-200">Travel Route</span>
                </div>
                <div className="border-t border-white/10 pt-2 text-slate-500 normal-case font-medium">Shift+Click = Bucket • Ctrl+Click = Info</div>
            </div>

            {/* Flight replay & theme toggle buttons & new controls */}
            <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
                <button onClick={() => setShowGlobe(true)} className="glass p-3 rounded-xl text-white hover:bg-white/10 transition-all shadow-lg border border-white/10" title="3D Globe View">
                    <span className="text-sm">🌍</span>
                </button>
                <button onClick={() => setShowTimeLapse(true)} className="glass p-3 rounded-xl text-white hover:bg-white/10 transition-all shadow-lg border border-white/10" title="Time-Lapse Replay">
                    <span className="text-sm">⏱️</span>
                </button>
                <button onClick={() => setShowDistanceRings(!showDistanceRings)} className={`glass p-3 rounded-xl text-white hover:bg-white/10 transition-all shadow-lg border ${showDistanceRings ? 'border-blue-500 bg-blue-500/20' : 'border-white/10'}`} title="Distance Rings">
                    <span className="text-sm">⭕</span>
                </button>
                {activeCities.length >= 2 && (
                    <button onClick={() => setShowFlightAnimation(!showFlightAnimation)} className="glass p-3 rounded-xl text-white hover:bg-white/10 transition-all shadow-lg border border-white/10" title="Replay Flight Path">
                        <span className="text-sm">✈️</span>
                    </button>
                )}
                {onUpdateSettings && (
                    <button onClick={() => {
                        const styles = ['dark', 'light', 'satellite', 'terrain'];
                        const current = settings?.mapStyle || 'dark';
                        const next = styles[(styles.indexOf(current) + 1) % styles.length];
                        onUpdateSettings({ mapStyle: next, autoDayNight: false });
                    }} className="glass p-3 rounded-xl text-white hover:bg-white/10 transition-all shadow-lg border border-white/10" title="Toggle Map Style">
                        <span className="text-sm">{settings?.mapStyle === 'dark' ? '🌙' : settings?.mapStyle === 'light' ? '☀️' : settings?.mapStyle === 'satellite' ? '🛰️' : '🏔️'}</span>
                    </button>
                )}
            </div>

            {/* Overlays */}
            {showGlobe && <GlobeView visitedCountries={visitedCountries} onClose={() => setShowGlobe(false)} />}

            {showTimeLapse && (
                <TimeLapseControls
                    cities={visitedCities}
                    currentDate={currentTimelineDate}
                    onChange={setCurrentTimelineDate}
                    onClose={() => setShowTimeLapse(false)}
                />
            )}
        </div>
    );
});

export default Map;
