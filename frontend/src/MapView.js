import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function decodePolyline(encoded) {
  const polyline = require("@mapbox/polyline");
  return polyline.decode(encoded);
}

function MapView({ geometry1, geometry2 }) {
  if (!geometry1) return null;

  const polyline = require("@mapbox/polyline");

  const coords1 = polyline.decode(geometry1);
  const coords2 = geometry2 ? polyline.decode(geometry2) : [];

  return (
    <MapContainer
      center={coords1[0]}
      zoom={6}
      style={{ height: "400px", width: "100%", marginTop: "20px" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Polyline positions={coords1} />
      {coords2.length > 0 && <Polyline positions={coords2} />}
    </MapContainer>
  );
}

export default MapView;
