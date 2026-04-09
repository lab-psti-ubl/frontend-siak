import L from 'leaflet';

// Fix marker icon paths for bundlers (Vite).
// Leaflet default icon URLs are resolved relative to leaflet.css, which can break in build output.
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import marker from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let didApply = false;

export function ensureLeafletDefaultIcon(): void {
  if (didApply) return;
  didApply = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: marker2x,
    iconUrl: marker,
    shadowUrl: markerShadow,
  });
}

