import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Marker, Popup, useMap } from 'react-leaflet';
import { useTaskStore } from '../../stores/useTaskStore';
import OsmMap from '../../components/map/OsmMap';
import { createNodeIcon, createTechLocationIcon } from '../../components/map/mapIcons';

import { 
  Navigation, 
  MapPin, 
  ArrowRight, 
  Crosshair, 
  ShieldAlert, 
  AlertTriangle, 
  Compass, 
  RefreshCw 
} from 'lucide-react';

// Child component to programmatically pan/fly the Leaflet map
function MapController({ targetCenter }) {
  const map = useMap();
  useEffect(() => {
    if (targetCenter) {
      map.flyTo(targetCenter, 18, { animate: true });
    }
  }, [targetCenter, map]);
  return null;
}

export default function MapPage() {
  const { tasks, fetchMyTasks, isLoading } = useTaskStore();

  // Technician GPS State
  const [techLocation, setTechLocation] = useState(null);
  const [targetCenter, setTargetCenter] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // 1. Fetch assigned work orders
  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  // 2. Real-Time GPS Tracking via navigator.geolocation
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setTechLocation(coords);
        setGpsError(null);
      },
      (err) => {
        // Fallback gracefully on local dev or if permission denied
        setGpsError('GPS permission denied or unavailable.');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Filter tasks that have valid coordinates
  const tasksWithCoords = tasks.filter(
    (t) => t.latitude && t.longitude && !isNaN(Number(t.latitude)) && !isNaN(Number(t.longitude))
  );

  const handleCenterOnMe = () => {
    if (techLocation) {
      setTargetCenter(techLocation);
    }
  };

  const handleCenterOnTask = (task) => {
    const coords = [Number(task.latitude), Number(task.longitude)];
    setTargetCenter(coords);
    setSelectedTask(task);
  };

  return (
    <div className="relative h-[calc(100vh-7.5rem)] w-full flex flex-col">
      {/* 1. Floating Top HUD Strip */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md pointer-events-auto flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-800">
            {tasksWithCoords.length} Active Work Order{tasksWithCoords.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* GPS Location Centering Button */}
        <button
          onClick={handleCenterOnMe}
          disabled={!techLocation}
          title="Center on My Location"
          className="bg-white hover:bg-slate-50 text-slate-700 p-2.5 rounded-xl border border-slate-200 shadow-md pointer-events-auto transition active:scale-95 disabled:opacity-50"
        >
          <Crosshair className={`w-4 h-4 ${techLocation ? 'text-sky-600' : 'text-slate-400'}`} />
        </button>
      </div>

      {/* 2. Leaflet OpenStreetMap Container */}
      <div className="flex-1 w-full h-full relative z-0">
        <OsmMap className="h-full w-full rounded-2xl">
          {/* Programmatic Map Panning */}
          <MapController targetCenter={targetCenter} />

          {/* A. Plumber's Live GPS Dot */}
          {techLocation && (
            <Marker position={techLocation} icon={createTechLocationIcon()}>
              <Popup>
                <div className="p-1 text-center text-xs">
                  <p className="font-bold text-sky-700">Your Current Location</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Live GPS Active</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* B. Work Order Pins */}
          {tasksWithCoords.map((task) => {
            const isP1 = task.severity_level === 'P1';
            const isPendingVerif = task.status === 'PENDING_VERIFICATION';
            
            // Map pin icon status
            let pinStatus = 'NORMAL';
            if (isP1) pinStatus = 'LEAK';
            else if (isPendingVerif) pinStatus = 'SUSPICIOUS';

            const pos = [Number(task.latitude), Number(task.longitude)];
            const shortCode = task.node_id?.slice(-2) || '!';

            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}`;

            return (
              <Marker
                key={task.incident_id}
                position={pos}
                icon={createNodeIcon(pinStatus, shortCode)}
              >
                <Popup>
                  <div className="p-1.5 space-y-2 text-xs min-w-[210px]">
                    {/* Header */}
                    <div className="border-b border-slate-100 pb-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          isP1 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {task.severity_level} Priority
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 mt-1">
                        {task.household_label || task.node_id}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {task.purok_cluster} • {task.node_id}
                      </p>
                    </div>

                    {/* Problem Preview */}
                    {task.repair_notes && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-1.5 rounded">
                        {task.repair_notes}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="pt-1 flex items-center justify-between gap-2">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition"
                      >
                        <Navigation className="w-3 h-3 text-sky-600" />
                        <span>Navigate</span>
                      </a>

                      <Link
                        to={`/tasks/${task.incident_id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-sky-600 hover:bg-sky-700 px-2.5 py-1 rounded-lg transition shadow-sm"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </OsmMap>
      </div>

      {/* 3. Bottom Carousel / Quick Task Drawer */}
      {tasksWithCoords.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 z-10 pointer-events-none">
          <div className="flex gap-2 overflow-x-auto pb-1 pointer-events-auto">
            {tasksWithCoords.map((task) => {
              const isSelected = selectedTask?.incident_id === task.incident_id;
              const isP1 = task.severity_level === 'P1';

              return (
                <button
                  key={task.incident_id}
                  onClick={() => handleCenterOnTask(task)}
                  className={`bg-white/95 backdrop-blur-md p-2.5 rounded-xl border text-left shadow-lg shrink-0 w-60 transition active:scale-95 ${
                    isSelected ? 'ring-2 ring-sky-500 border-sky-400' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className={`font-bold px-1.5 py-0.2 rounded-full ${
                      isP1 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {task.severity_level}
                    </span>
                    <span className="font-mono text-slate-400">{task.node_id}</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 truncate">
                    {task.household_label || task.node_id}
                  </h5>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{task.purok_cluster}</span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}