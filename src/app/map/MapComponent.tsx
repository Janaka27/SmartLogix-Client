"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

export default function MapComponent({ warehouses }: { warehouses: any[] }) {
  // Center of Sri Lanka roughly
  const center: [number, number] = [7.8731, 80.7718];

  return (
    <MapContainer center={center} zoom={7} scrollWheelZoom={true} className="absolute inset-0 grayscale-[.35] z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {warehouses.map((w) => (
        <Marker
          key={w.id}
          position={[w.latitude, w.longitude]}
          icon={
            new L.DivIcon({
              html: `<div class="flex flex-col items-center gap-1 text-xs font-bold text-charcoal drop-shadow-md" style="transform: translate(-50%, -100%); width: max-content;">
                      <span class="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-md ring-4 ring-primary/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                      </span>
                      <span class="whitespace-nowrap rounded bg-white/80 px-1 backdrop-blur">${w.name}</span>
                    </div>`,
              className: "custom-marker-icon bg-transparent",
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            })
          }
        />
      ))}
    </MapContainer>
  );
}
