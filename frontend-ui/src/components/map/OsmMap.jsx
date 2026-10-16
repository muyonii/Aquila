import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Default center: Purok 2 Community Cluster (from seed_demo_nodes.sql)
const DEFAULT_CENTER = [14.6766, 120.5422];
const DEFAULT_ZOOM = 17;

/**
 * OpenStreetMap Leaflet Container
 * @param {Array<number>} center - [lat, lng]
 * @param {number} zoom - Initial zoom level (default 17)
 * @param {React.ReactNode} children - Markers, polylines, popups
 * @param {string} className - Optional Tailwind container classes
 */
export default function OsmMap({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  children,
  className = "h-[450px] w-full"
}) {
  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-200 shadow-sm z-0 ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Dynamic Map Layers (Node markers, DAG edges, Task pins) */}
        {children}
      </MapContainer>
    </div>
  );
}