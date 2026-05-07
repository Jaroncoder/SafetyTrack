import React, { useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { estimateEtaMinutes, formatEta, getDistanceMiles } from "../utils/tracking";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const userIcon = new L.Icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const volunteerIcon = new L.Icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapBounds({ points }) {
  const map = useMap();

  React.useEffect(() => {
    if (!points.length) {
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 16);
      return;
    }

    map.fitBounds(points, { padding: [40, 40] });
  }, [map, points]);

  return null;
}

function LiveTrackingMap({ userPosition, volunteerPosition, userLabel = "User", volunteerLabel = "Volunteer", title = "Live Tracking", averageSpeedMph = 20 }) {
  const points = useMemo(() => {
    const list = [];

    if (userPosition?.lat && userPosition?.lng) {
      list.push([userPosition.lat, userPosition.lng]);
    }

    if (volunteerPosition?.lat && volunteerPosition?.lng) {
      list.push([volunteerPosition.lat, volunteerPosition.lng]);
    }

    return list;
  }, [userPosition, volunteerPosition]);

  const routePoints = useMemo(() => {
    if (!userPosition?.lat || !userPosition?.lng) {
      return [];
    }

    if (!volunteerPosition?.lat || !volunteerPosition?.lng) {
      return [[userPosition.lat, userPosition.lng]];
    }

    return [
      [userPosition.lat, userPosition.lng],
      [volunteerPosition.lat, volunteerPosition.lng],
    ];
  }, [userPosition, volunteerPosition]);

  const distanceMiles = getDistanceMiles(
    userPosition?.lat,
    userPosition?.lng,
    volunteerPosition?.lat,
    volunteerPosition?.lng
  );
  const etaMinutes = estimateEtaMinutes(distanceMiles, averageSpeedMph);

  const center = useMemo(() => {
    if (points.length === 0) {
      return [28.6139, 77.209];
    }

    if (points.length === 1) {
      return points[0];
    }

    return [
      (points[0][0] + points[1][0]) / 2,
      (points[0][1] + points[1][1]) / 2,
    ];
  }, [points]);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <p style={{ margin: "4px 0 0 0", color: "#555" }}>
            {formatEta(etaMinutes)}{distanceMiles !== null ? ` • ${distanceMiles.toFixed(1)} miles apart` : ""}
          </p>
        </div>
        <span style={liveBadge}>Live</span>
      </div>

      <MapContainer center={center} zoom={14} style={{ height: "360px", width: "100%", borderRadius: "16px", overflow: "hidden" }}>
        <MapBounds points={points} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userPosition?.lat && userPosition?.lng && (
          <Marker position={[userPosition.lat, userPosition.lng]} icon={userIcon}>
            <Popup>{userLabel}</Popup>
          </Marker>
        )}

        {volunteerPosition?.lat && volunteerPosition?.lng && (
          <Marker position={[volunteerPosition.lat, volunteerPosition.lng]} icon={volunteerIcon}>
            <Popup>{volunteerLabel}</Popup>
          </Marker>
        )}

        {routePoints.length > 1 && (
          <Polyline positions={routePoints} pathOptions={{ color: "#e11d48", weight: 5, opacity: 0.8 }} />
        )}
      </MapContainer>
    </div>
  );
}

const containerStyle = {
  backgroundColor: "#fff",
  borderRadius: "18px",
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
  padding: "16px",
  margin: "20px 0",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "12px",
};

const liveBadge = {
  backgroundColor: "#dcfce7",
  color: "#166534",
  borderRadius: "999px",
  padding: "6px 12px",
  fontSize: "12px",
  fontWeight: "700",
};

export default LiveTrackingMap;
