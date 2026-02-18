import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Polyline, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Calendar, Quote, Camera } from 'lucide-react';
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

const FlyToListener = ({ city }) => {
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
};

const Map = ({ visitedCities, bucketListCities, visitedCountries, bucketListCountries, settings, selectedCity, onToggleCountry, onToggleBucketList }) => {
    const [geoData, setGeoData] = useState(null);

    useEffect(() => {
        fetch(GEOJSON_URL)
            .then(res => res.json())
            .then(data => setGeoData(data))
            .catch(err => console.error('Error loading GeoJSON:', err));
    }, []);

    // Custom emoji icon
    const getEmojiIcon = (cityEmoji) => L.divIcon({
        html: `<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); cursor: pointer;">${cityEmoji || settings?.globalEmoji || '📍'}</div>`,
        className: 'custom-emoji-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    // Bucket list icon (Purple/Semi-transparent)
    const bucketIcon = L.divIcon({
        html: `<div style="font-size: 20px; filter: opacity(0.6) drop-shadow(0 0 10px rgba(168, 85, 247, 0.4)); cursor: pointer;">✨</div>`,
        className: 'bucket-emoji-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    // Day/Night logic
    const currentHour = new Date().getHours();
    const isNight = currentHour < 6 || currentHour > 18;
    const effectiveStyle = settings?.autoDayNight
        ? (isNight ? 'dark' : 'light')
        : (settings?.mapStyle || 'dark');

    // Sort cities by date for the path
    const sortedCities = [...visitedCities].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Generate curved path segments
    const curvedPaths = [];
    for (let i = 0; i < sortedCities.length - 1; i++) {
        curvedPaths.push(LocationService.getCurvePoints(
            [sortedCities[i].lat, sortedCities[i].lng],
            [sortedCities[i + 1].lat, sortedCities[i + 1].lng]
        ));
    }

    // ... countryStyle and onEachCountry (keep as is) ...

    const countryStyle = (feature) => {
        const isVisited = visitedCountries.includes(feature.properties.name);
        const isBucketList = bucketListCountries.includes(feature.properties.name);

        if (isVisited) {
            return {
                fillColor: '#fbbf24', // Amber
                weight: 1.5,
                opacity: 0.6,
                color: '#fbbf24',
                fillOpacity: 0.4
            };
        }

        if (isBucketList) {
            return {
                fillColor: '#c084fc', // Purple
                weight: 1,
                opacity: 0.4,
                color: '#c084fc',
                fillOpacity: 0.2,
                dashArray: '3'
            };
        }

        return {
            fillColor: 'transparent',
            weight: 1,
            opacity: 0.2,
            color: '#475569',
            fillOpacity: 0
        };
    };

    const onEachCountry = (feature, layer) => {
        layer.on({
            click: (e) => {
                L.DomEvent.stopPropagation(e);
                if (e.originalEvent.shiftKey) {
                    onToggleBucketList(feature.properties.name);
                } else {
                    onToggleCountry(feature.properties.name);
                }
            },
            mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                    fillOpacity: 0.6,
                    weight: 2
                });
            },
            mouseout: (e) => {
                const layer = e.target;
                layer.setStyle(countryStyle(feature));
            }
        });
    };

    return (
        <div className="flex-1 h-full relative" id="map-capture-area">
            <MapContainer
                key={settings?.mapStyle || 'dark'}
                center={[20, 0]}
                zoom={2.5}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer
                    url={TILE_URLS[effectiveStyle]}
                />
                <FlyToListener city={selectedCity} />

                {geoData && (
                    <GeoJSON
                        key={`geo-${visitedCountries.join(',')}-${bucketListCountries.join(',')}`}
                        data={geoData}
                        style={countryStyle}
                        onEachFeature={onEachCountry}
                    />
                )}

                {/* Curved Path lines */}
                {curvedPaths.map((positions, idx) => (
                    <Polyline
                        key={`path-${idx}`}
                        positions={positions}
                        color="#3b82f6"
                        weight={1.5}
                        opacity={0.3}
                        dashArray="5,5"
                    />
                ))}

                {visitedCities.map((city) => (
                    settings?.showHeatmap ? (
                        <CircleMarker
                            key={`heat-${city.id}`}
                            center={[city.lat, city.lng]}
                            radius={20}
                            pathOptions={{
                                fillColor: '#3b82f6',
                                fillOpacity: 0.15,
                                color: 'transparent',
                                className: 'animate-pulse'
                            }}
                        />
                    ) : (
                        <Marker key={city.id} position={[city.lat, city.lng]} icon={getEmojiIcon(city.customEmoji)}>
                            <Popup className="travel-popup">
                                <div className="p-1 min-w-[200px]">
                                    {city.photo && (
                                        <div className="w-full h-32 mb-2 overflow-hidden rounded-lg">
                                            <img
                                                src={city.photo}
                                                alt={city.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <h4 className="text-slate-900 font-bold border-b border-slate-100 pb-2 mb-2">
                                        {city.name}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
                                        <span>{new Date(city.date).toLocaleDateString()}</span>
                                    </div>
                                    {city.notes ? (
                                        <div className="bg-slate-50 p-2 rounded-lg italic text-xs text-slate-600 flex gap-2">
                                            <p>{city.notes}</p>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-slate-400 italic">No journal notes yet...</p>
                                    )}
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
                                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest">
                                    ✨ Bucket List
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-6 right-6 glass p-4 rounded-2xl pointer-events-none z-[1000] text-[10px] uppercase tracking-wider font-bold space-y-3">
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
                <div className="border-t border-white/10 pt-2 text-slate-500 normal-case font-medium">
                    Shift + Click to toggle Bucket List
                </div>
            </div>
        </div>
    );
};

export default Map;
