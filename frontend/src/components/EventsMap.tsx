'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { Event } from '@/types/events';

interface EventsMapProps {
  events: Event[];
}

export default function EventsMap({ events }: EventsMapProps) {
  useEffect(() => {
    // Ensure default marker icons work when using webpack/Next.js
    (L.Icon.Default as any).mergeOptions({
      iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  const first = events.find(e => e.latitude && e.longitude);
  const center: [number, number] = first ? [first.latitude!, first.longitude!] : [0, 0];

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {events.map((event, idx) =>
        event.latitude && event.longitude ? (
          <Marker position={[event.latitude, event.longitude]} key={idx}>
            <Popup>
              <strong>{event.name}</strong>
              <br />
              {event.venue || event.location}
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
}
