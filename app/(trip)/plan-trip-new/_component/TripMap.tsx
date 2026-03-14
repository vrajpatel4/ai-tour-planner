"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in Next.js
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

type Location = {
  name: string;
  description?: string;
  geoCoordinates?: {
    lat: number;
    lng: number;
  };
};

type TripMapProps = {
  places: Location[];
  hotels: Location[];
  className?: string;
};

// Component to update map view when props change
const MapUpdater = ({ locations }: { locations: Location[] }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;

    const validLocs = locations.filter(l => l.geoCoordinates?.lat && l.geoCoordinates?.lng);
    if (validLocs.length === 0) return;

    const bounds = L.latLngBounds(
      validLocs.map((loc) => [
        loc.geoCoordinates!.lat,
        loc.geoCoordinates!.lng,
      ])
    );

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [locations, map]);

  return null;
};

const TripMap = ({ places, hotels, className }: TripMapProps) => {
  const allLocations = [...places, ...hotels].filter(
    (loc) =>
      loc.geoCoordinates &&
      typeof loc.geoCoordinates.lat === "number" &&
      typeof loc.geoCoordinates.lng === "number"
  );

  if (allLocations.length === 0) {
    return (
      <div className={`bg-slate-100 flex items-center justify-center text-slate-400 text-sm ${className}`}>
        No map data available
      </div>
    );
  }

  // Calculate initial center
  const centerLat =
    allLocations.reduce((sum, loc) => sum + loc.geoCoordinates!.lat, 0) /
    allLocations.length;
  const centerLng =
    allLocations.reduce((sum, loc) => sum + loc.geoCoordinates!.lng, 0) /
    allLocations.length;

  return (
    <div className={className}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", borderRadius: "inherit" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {allLocations.map((loc, idx) => (
          <Marker
            key={`${loc.name}-${idx}`}
            position={[loc.geoCoordinates!.lat, loc.geoCoordinates!.lng]}
          >
            <Popup>
              <div className="font-semibold">{loc.name}</div>
              {loc.description && <div className="text-xs">{loc.description}</div>}
            </Popup>
          </Marker>
        ))}

        <MapUpdater locations={allLocations} />
      </MapContainer>
    </div>
  );
};

export default TripMap;