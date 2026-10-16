// frontend-ui/src/pages/admin/network-map/models/GridNode.js
import L from 'leaflet';

/**
 * GridNode (Domain Entity)
 * Encapsulates water meter attributes, coordinate validation, search matching,
 * and Apple Maps-style Leaflet marker rendering.
 */
export class GridNode {
  constructor(data = {}) {
    this.id = data.node_id || '';
    this.label = data.household_label || 'Unnamed Meter';
    this.cluster = data.purok_cluster || 'Purok 2';
    this.parentId = data.parent_node_id || null;
    this.lat = Number(data.latitude) || 14.6766;
    this.lng = Number(data.longitude) || 120.5422;
    this.isPhysical = Boolean(data.is_physical);
    this.status = data.status || 'ACTIVE'; // 'ACTIVE' | 'LEAK' | 'MAINTENANCE'
    this.installedAt = data.installation_date || '2026-09-01';
  }

  isLeaking() {
    return this.status === 'LEAK';
  }

  isMaintenance() {
    return this.status === 'MAINTENANCE';
  }

  isActive() {
    return this.status === 'ACTIVE';
  }

  hasValidCoordinates() {
    return !isNaN(this.lat) && !isNaN(this.lng) && this.lat !== 0 && this.lng !== 0;
  }

  getLatLng() {
    return [this.lat, this.lng];
  }

  /**
   * Evaluates if this node satisfies the search text and status filter.
   */
  matches(query = '', statusFilter = 'all') {
    // 1. Status Filter
    if (statusFilter === 'leak' && !this.isLeaking()) return false;
    if (statusFilter === 'maintenance' && !this.isMaintenance()) return false;
    if (statusFilter === 'active' && !this.isActive()) return false;

    // 2. Search Text Match
    if (!query) return true;
    const q = query.toLowerCase().trim();
    return (
      this.label.toLowerCase().includes(q) ||
      this.id.toLowerCase().includes(q) ||
      this.cluster.toLowerCase().includes(q)
    );
  }

  /**
   * Generates a clean Apple Maps-style DivIcon.
   * If isDraft is true, renders an animated pulsating preview pin.
   */
  createMarkerIcon(isDraft = false) {
    if (isDraft) {
      // Draft / Preview Pin (Pulsing ring to show it's not saved yet)
      const html = `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(0, 122, 255, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 26px; height: 26px; border-radius: 9999px; background: #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.25); border: 3px solid #007aff; display: flex; align-items: center; justify-content: center;">
            <div style="width: 10px; height: 10px; border-radius: 9999px; background: #007aff;"></div>
          </div>
        </div>
      `;
      return L.divIcon({
        className: 'apple-map-draft-pin',
        html,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    }

    // Permanent Pin Markers
    let ringColor = '#007aff'; // Default Apple System Blue
    let dotColor = '#007aff';
    let pulse = false;

    if (this.isMaintenance()) {
      ringColor = '#d97706';
      dotColor = '#f59e0b';
    } else if (this.isLeaking()) {
      ringColor = '#dc2626';
      dotColor = '#ef4444';
      pulse = true;
    }

    const html = `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        ${pulse ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(239, 68, 68, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
        <div style="width: 22px; height: 22px; border-radius: 9999px; background: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.18); border: 2.5px solid ${ringColor}; display: flex; align-items: center; justify-content: center;">
          <div style="width: 8px; height: 8px; border-radius: 9999px; background: ${dotColor};"></div>
        </div>
        ${this.isPhysical ? `<div style="position: absolute; bottom: -2px; right: -2px; width: 9px; height: 9px; border-radius: 9999px; background: #18181b; border: 1.5px solid #ffffff;"></div>` : ''}
      </div>
    `;

    return L.divIcon({
      className: 'apple-map-pin',
      html,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }
}