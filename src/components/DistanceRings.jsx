import React from 'react';
import { Circle, Marker, Tooltip } from 'react-leaflet';

const DistanceRings = ({ center }) => {
    if (!center) return null;

    const circles = [
        { radius: 1000000, label: '1,000 km', color: '#60a5fa' },
        { radius: 5000000, label: '5,000 km', color: '#3b82f6' },
        { radius: 10000000, label: '10,000 km', color: '#2563eb' },
        { radius: 20000000, label: '20,000 km', color: '#1e40af' }
    ];

    return (
        <>
            {circles.map((c, i) => (
                <Circle
                    key={i}
                    center={[center.lat, center.lng]}
                    radius={c.radius}
                    pathOptions={{
                        color: c.color,
                        weight: 1,
                        dashArray: '5, 10',
                        fillOpacity: 0.03,
                        fillColor: c.color
                    }}
                >
                    <Tooltip sticky direction="top" className="ring-tooltip">
                        <span className="text-[10px] font-black text-blue-500 uppercase">{c.label} from home</span>
                    </Tooltip>
                </Circle>
            ))}
            <Marker position={[center.lat, center.lng]}>
                <Tooltip permanent direction="bottom">
                    <span className="text-[10px] font-black uppercase tracking-widest">🏠 Home</span>
                </Tooltip>
            </Marker>
        </>
    );
};

export default DistanceRings;
