"use client";

import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface TrackingPoint {
  lat: number;
  lng: number;
  label: string;
}

const WAREHOUSE_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`;

// Small quadcopter glyph — matches the DroneIcon used elsewhere in this app.
const DRONE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 9 4 4M15 9l5-5M9 15l-5 5M15 15l5 5"/><circle cx="4" cy="4" r="1.6"/><circle cx="20" cy="4" r="1.6"/><circle cx="4" cy="20" r="1.6"/><circle cx="20" cy="20" r="1.6"/></svg>`;

function warehouseIcon(label: string) {
  return new L.DivIcon({
    html: `<div class="flex flex-col items-center gap-1 text-xs font-bold text-charcoal drop-shadow-md" style="transform: translate(-50%, -100%); width: max-content;">
             <span class="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-md ring-4 ring-primary/30">${WAREHOUSE_PIN_SVG}</span>
             <span class="whitespace-nowrap rounded bg-white/80 px-1 backdrop-blur">${label}</span>
           </div>`,
    className: "custom-marker-icon bg-transparent",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function destinationIcon(label: string) {
  return new L.DivIcon({
    html: `<div class="flex flex-col items-center gap-1 text-xs font-bold text-charcoal drop-shadow-md" style="transform: translate(-50%, -100%); width: max-content;">
             <span class="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white shadow-md ring-4 ring-black/30">${WAREHOUSE_PIN_SVG}</span>
             <span class="whitespace-nowrap rounded bg-white/80 px-1 backdrop-blur">${label}</span>
           </div>`,
    className: "custom-marker-icon bg-transparent",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function droneIcon(headingDegrees: number) {
  return new L.DivIcon({
    html: `<div class="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal text-white shadow-xl ring-4 ring-white/70" style="transform: translate(-50%, -50%) rotate(${headingDegrees}deg);">
             ${DRONE_SVG}
           </div>`,
    className: "custom-marker-icon bg-transparent",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export default function TrackingMap({
  origin,
  destination,
  dronePosition,
  headingDegrees = 0,
}: {
  origin: TrackingPoint;
  destination: TrackingPoint;
  dronePosition: { lat: number; lng: number };
  headingDegrees?: number;
}) {
  const center: [number, number] = [
    (origin.lat + destination.lat) / 2,
    (origin.lng + destination.lng) / 2,
  ];

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={true}
      className="absolute inset-0 grayscale-[.35] z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Full planned path */}
      <Polyline
        positions={[
          [origin.lat, origin.lng],
          [destination.lat, destination.lng],
        ]}
        color="#cbd5e1"
        weight={3}
        dashArray="10, 10"
      />

      {/* Flown so far */}
      <Polyline
        positions={[
          [origin.lat, origin.lng],
          [dronePosition.lat, dronePosition.lng],
        ]}
        color="#03a038ff"
        weight={4}
      />

      <Marker position={[origin.lat, origin.lng]} icon={warehouseIcon(origin.label)} />
      <Marker position={[destination.lat, destination.lng]} icon={destinationIcon(destination.label)} />
      <Marker
        position={[dronePosition.lat, dronePosition.lng]}
        icon={droneIcon(headingDegrees)}
      />
    </MapContainer>
  );
}
