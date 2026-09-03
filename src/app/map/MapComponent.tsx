"use client";

import { MapContainer, TileLayer, Marker, useMapEvents, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapComponent({ 
  warehouses, 
  dropPoint, 
  onMapClick,
  routePath,
  allEdges
}: { 
  warehouses: any[], 
  dropPoint?: {lat: number, lng: number} | null,
  onMapClick?: (lat: number, lng: number) => void,
  routePath?: any[],
  allEdges?: any[]
}) {
  // Center of Sri Lanka roughly
  const center: [number, number] = [7.8731, 80.7718];

  return (
    <MapContainer 
      center={center} 
      zoom={7} 
      scrollWheelZoom={true} 
      className="absolute inset-0 grayscale-[.35] z-0"
      maxBounds={[[5.5, 79.0], [10.0, 82.5]]}
      maxBoundsViscosity={1.0}
      minZoom={7}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
      
      {allEdges?.map((edge, i) => {
        const fromNode = warehouses.find(w => w.id === edge.from);
        const toNode = warehouses.find(w => w.id === edge.to);
        
        if (!fromNode || !toNode) return null;
        
        return (
          <Polyline
            key={`edge-${i}`}
            positions={[
              [fromNode.latitude, fromNode.longitude], 
              [toNode.latitude, toNode.longitude]
            ]}
            color="#cbd5e1"
            weight={3}
            dashArray="10, 10"
          />
        );
      })}

      {routePath && routePath.length > 1 && (
        <Polyline
          positions={routePath.map((node: any) => [node.lat, node.lng])}
          color="#03a038ff"
          weight={4}
        />
      )}

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
      {dropPoint && (
        <Marker
          position={[dropPoint.lat, dropPoint.lng]}
          icon={
            new L.DivIcon({
              html: `<div class="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white shadow-md ring-4 ring-black/30" style="transform: translate(-50%, -100%);">
                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                     </div>`,
              className: "custom-marker-icon bg-transparent",
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            })
          }
        />
      )}
    </MapContainer>
  );
}
