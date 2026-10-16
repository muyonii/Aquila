// frontend-ui/src/pages/admin/network-map/NetworkMapPage.jsx
// frontend-ui/src/pages/admin/network-map/NetworkMapPage.jsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { useNetworkMap, SECTOR_CENTER } from './hooks/useNetworkMap';
import { GridNode } from './models/GridNode'; // <-- Add this import line!

// Floating HUD & Panel Components
import MapSearchOverlay from './components/MapSearchOverlay';
import MapStatusBadge from './components/MapStatusBadge';
import MapControls from './components/MapControls';
import NodeDetailsPanel from './components/NodeDetailsPanel';
import ProvisionNodeDrawer from './components/ProvisionNodeModal';
/**
 * Ensures Leaflet recalibrates its viewport bounds to 100% full-bleed
 * on window resize or when sidebars retract.
 */
function MapViewportWatcher() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

/**
 * Listens for click events directly on the map canvas.
 * When in drafting mode, clicking anywhere relocates the draft pin.
 */
function MapClickHandler({ isAddingNode, onMapClick }) {
  useMapEvents({
    click(e) {
      if (isAddingNode) {
        onMapClick(e.latlng);
      }
    }
  });
  return null;
}

export default function NetworkMapPage() {
  const {
    nodes,
    filteredNodes,
    pipeLines,
    draftPipeLine,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    selectedNode,
    setSelectedNode,
    showPipes,
    setShowPipes,
    mapLayer,
    setMapLayer,
    isAddingNode,
    draftNode,
    setDraftNode,
    submittingNode,
    activeCount,
    leakCount,
    handleMapClick,
    startAddingNode,
    cancelAddingNode,
    commitNewNode,
    toggleMaintenance
  } = useNetworkMap();

  return (
    <div className="relative w-full h-screen overflow-hidden select-none font-sans bg-[#f4f5f8]">
      
      {/* =====================================================================
          1. LEAFLET FULL-BLEED MAP ENGINE
          ===================================================================== */}
      <MapContainer
        center={SECTOR_CENTER}
        zoom={17}
        maxZoom={21}
        zoomControl={false}
        className="w-full h-full z-0"
        style={{ width: '100%', height: '100%' }}
      >
        <MapViewportWatcher />
        <MapClickHandler isAddingNode={isAddingNode} onMapClick={handleMapClick} />

        {/* Clean Standard Carto vs. Google Hybrid Satellite (No gray cutoffs) */}
        {mapLayer === 'standard' ? (
          <TileLayer
            key="carto-standard"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_2des_1_5b92e80a785d8e242b3ca977"
            maxZoom={21}
            maxNativeZoom={19}
          />
        ) : (
          <TileLayer
            key="google-hybrid"
            attribution='&copy; Google'
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            maxZoom={21}
            maxNativeZoom={20}
          />
        )}

        {/* Permanent Hydraulic Pipe Lines (DAG) */}
        {showPipes &&
          pipeLines.map((pipe) => (
            <Polyline
              key={pipe.id}
              positions={pipe.getPositions()}
              pathOptions={pipe.getPathOptions()}
            />
          ))}

        {/* Live Preview Dashed Pipe Line (Connects Parent to Draft Pin) */}
        {draftPipeLine && (
          <Polyline
            key={draftPipeLine.id}
            positions={draftPipeLine.getPositions()}
            pathOptions={draftPipeLine.getPathOptions()}
          />
        )}

        {/* Permanent Water Meter Markers */}
        {filteredNodes.map((node) => (
          <Marker
            key={node.id}
            position={[
              Number(node.lat ?? node.latitude ?? 14.6766),
              Number(node.lng ?? node.longitude ?? 120.5422)
            ]}
            icon={node.createMarkerIcon(false)}
            eventHandlers={{
              click: () => {
                if (!isAddingNode) {
                  setSelectedNode(node);
                }
              }
            }}
          />
        ))}

        {/* Interactive Pulsing Draft Pin (Draggable on the map) */}
        {isAddingNode && draftNode && (
          <Marker
            position={[
              Number(draftNode.lat ?? draftNode.latitude ?? 14.6766),
              Number(draftNode.lng ?? draftNode.longitude ?? 120.5422)
            ]}
            icon={
              typeof draftNode.createMarkerIcon === 'function'
                ? draftNode.createMarkerIcon(true)
                : new GridNode(draftNode).createMarkerIcon(true)
            }
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const pos = e.target.getLatLng();
                handleMapClick(pos);
              }
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -14]} className="apple-pin-tooltip">
              <span className="text-[11px] font-medium text-slate-700">Click map or drag to move</span>
            </Tooltip>
          </Marker>
        )}
      </MapContainer>

      {/* =====================================================================
          3. TOP-LEFT FLOATING HUD: SEARCH & SEGMENTED FILTER
          ===================================================================== */}
      <MapSearchOverlay
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalNodes={nodes.length}
        leakCount={leakCount}
        disabled={isAddingNode}
      />

      {/* =====================================================================
          4. TOP-RIGHT FLOATING HUD: STATUS PILL & "+ ADD WATER METER"
          ===================================================================== */}
      <MapStatusBadge
        activeCount={activeCount}
        leakCount={leakCount}
        onAddClick={startAddingNode}
        isAddingNode={isAddingNode}
      />

      {/* =====================================================================
          5. BOTTOM-RIGHT FLOATING MAP CONTROLS
          ===================================================================== */}
      <MapControls
        onRecenter={() => setSelectedNode(null)}
        showPipes={showPipes}
        onTogglePipes={() => setShowPipes(!showPipes)}
        mapLayer={mapLayer}
        onToggleLayer={() => setMapLayer(mapLayer === 'standard' ? 'satellite' : 'standard')}
      />

      {/* =====================================================================
          6. NODE DETAILS INSPECTOR (Clicking an active pin)
          ===================================================================== */}
      <NodeDetailsPanel
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onToggleMaintenance={toggleMaintenance}
      />

      {/* =====================================================================
          7. PROVISION NODE DRAWER (Point-and-click draft flow)
          ===================================================================== */}
      <ProvisionNodeDrawer
        isOpen={isAddingNode}
        draftNode={draftNode}
        onDraftChange={setDraftNode}
        nodes={nodes}
        onCancel={cancelAddingNode}
        onCommit={commitNewNode}
        submitting={submittingNode}
      />

    </div>
  );
}