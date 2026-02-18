import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Polyline, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationService } from '../utils/LocationService';

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
    timelineDate
}) => {
    const [geoData, setGeoData] = useState(null);

    useEffect(() => {
        fetch(GEOJSON_URL)
            .then(res => res.json())
            .then(data => setGeoData(data))
            .catch(err => console.error('Error loading GeoJSON:', err));
    }, []);

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
        visitedCities.filter(c => c.date <= (timelineDate || new Date().toISOString())),
        [visitedCities, timelineDate]);

    const activePaths = useMemo(() =>
        allPaths.filter(p => p.toDate <= (timelineDate || new Date().toISOString())),
        [allPaths, timelineDate]);

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

                <TimelineFlyTo activeCities={activeCities} timelineDate={timelineDate} />
                <FlyToListener city={selectedCity} />

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
                                    <div className="text-[10px] text-slate-500 mb-2">{new Date(city.date).toLocaleDateString()}</div>
                                    {city.notes ? <p className="bg-slate-50 p-2 rounded-lg italic text-xs text-slate-600">{city.notes}</p> : <p className="text-[10px] text-slate-400 italic">No journal notes yet...</p>}
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
                            </div>
                        </Popup>
                    </Marker>
                ))}
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
                <div className="border-t border-white/10 pt-2 text-slate-500 normal-case font-medium">Shift + Click to toggle Bucket List</div>
            </div>
        </div>
    );
});

export default Map;
