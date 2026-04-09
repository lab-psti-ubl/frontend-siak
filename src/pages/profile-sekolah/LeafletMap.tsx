import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { ensureLeafletDefaultIcon } from './leafletIconFix';

type LeafletMapProps = {
  lat?: number;
  lng?: number;
  heightClassName?: string;
  popupTitle?: string;
  popupSubtitle?: string;
  className?: string;
};

const DEFAULT_CENTER: [number, number] = [-5.3971396, 105.2667887]; // Bandar Lampung-ish

const LeafletMap: React.FC<LeafletMapProps> = ({
  lat,
  lng,
  heightClassName = 'h-72 sm:h-80',
  popupTitle = 'Lokasi Sekolah',
  popupSubtitle,
  className,
}) => {
  useEffect(() => {
    ensureLeafletDefaultIcon();
  }, []);

  const center: [number, number] =
    typeof lat === 'number' && typeof lng === 'number' ? [lat, lng] : DEFAULT_CENTER;

  return (
    <div className={`rounded-2xl overflow-hidden border border-slate-200 bg-white ${className ?? ''}`}>
      <div className={`w-full ${heightClassName}`}>
        <MapContainer center={center} zoom={15} scrollWheelZoom={false} className="w-full h-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={center}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold text-slate-900">{popupTitle}</div>
                {popupSubtitle ? <div className="text-slate-600 mt-1">{popupSubtitle}</div> : null}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

export default LeafletMap;

