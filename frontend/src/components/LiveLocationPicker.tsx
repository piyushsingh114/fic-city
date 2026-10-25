import React, { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, AlertCircle, CheckCircle, RefreshCw, Layers } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Custom Leaflet Pin Icon
const pinIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  houseFlatNo?: string;
  landmark?: string;
  accuracyMeters?: number;
  capturedAt?: string;
}

interface LiveLocationPickerProps {
  value: LocationData;
  onChange: (data: LocationData) => void;
}

// Map center adjuster on position change
function MapCenterController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 16, { animate: true });
  }, [center, map]);
  return null;
}

// Draggable Marker on the Map
function DraggablePin({
  position,
  onDragEnd
}: {
  position: [number, number];
  onDragEnd: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const { lat, lng } = marker.getLatLng();
        onDragEnd(lat, lng);
      }
    }
  };

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={pinIcon}
    />
  );
}

export const LiveLocationPicker: React.FC<LiveLocationPickerProps> = ({ value, onChange }) => {
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentLat = value.latitude || 28.6514;
  const currentLng = value.longitude || 77.1907;

  // Reverse Geocoding with OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lon: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (res.ok) {
        const data = await res.json();
        const fullAddr =
          data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}, Delhi`;
        
        onChange({
          ...value,
          latitude: lat,
          longitude: lon,
          address: fullAddr,
          capturedAt: new Date().toISOString()
        });
        setSuccessMsg("Location & address updated from map pin!");
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        throw new Error("Geocoding failed");
      }
    } catch (e) {
      // Fallback: keep coordinates, update address with readable coordinates
      onChange({
        ...value,
        latitude: lat,
        longitude: lon,
        capturedAt: new Date().toISOString()
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Browser Geolocation API
  const handleCaptureLiveLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser. Please enter address manually.");
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);

        setIsLocating(false);
        setSuccessMsg(`GPS Location locked (Accuracy: ±${accuracy}m)!`);
        setTimeout(() => setSuccessMsg(null), 4000);

        onChange({
          ...value,
          latitude: lat,
          longitude: lng,
          accuracyMeters: accuracy,
          capturedAt: new Date().toISOString()
        });

        // Convert coordinates to address
        await reverseGeocode(lat, lng);
      },
      (err) => {
        setIsLocating(false);
        let msg = "Could not detect location. Please enter address manually.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "GPS permission denied in browser. Please allow location access or type address.";
        } else if (err.code === err.TIMEOUT) {
          msg = "GPS request timed out. Please check your network or enter address.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Location unavailable. Please enter address manually.";
        }
        setErrorMsg(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handlePinDragEnd = (newLat: number, newLng: number) => {
    reverseGeocode(newLat, newLng);
  };

  return (
    <div className="space-y-3">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Incident Location & Address *</span>
        </label>

        <button
          type="button"
          onClick={handleCaptureLiveLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-extrabold transition-all shadow-xs active:scale-95"
        >
          {isLocating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>{isLocating ? "Detecting GPS..." : "Use My Current Location"}</span>
        </button>
      </div>

      {/* Status Messages */}
      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Interactive Map with Draggable Pin */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm h-52 bg-slate-100">
        <MapContainer
          center={[currentLat, currentLng]}
          zoom={15}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenterController center={[currentLat, currentLng]} />
          <DraggablePin
            position={[currentLat, currentLng]}
            onDragEnd={handlePinDragEnd}
          />
        </MapContainer>

        {/* Floating Pin Guidance Badge */}
        <div className="absolute top-2 left-2 z-400 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-xs">
          <Layers className="w-3.5 h-3.5 text-emerald-600" />
          <span>Drag pin to fine-tune exact position</span>
          {isGeocoding && <RefreshCw className="w-3 h-3 animate-spin text-sky-600" />}
        </div>

        {/* GPS coordinates pill */}
        <div className="absolute bottom-2 right-2 z-400 bg-slate-900/85 backdrop-blur-xs px-2.5 py-1 rounded-lg text-white font-mono text-[10px] shadow-sm">
          {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
          {value.accuracyMeters && ` (±${value.accuracyMeters}m)`}
        </div>
      </div>

      {/* Editable Address Fields */}
      <div className="space-y-2">
        <div>
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Full Street Address / Area *
          </label>
          <input
            type="text"
            required
            value={value.address}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            placeholder="e.g. Near Metro Gate 2, DB Gupta Road, Karol Bagh, Delhi - 110005"
            className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              House / Building / Pole Number (Optional)
            </label>
            <input
              type="text"
              value={value.houseFlatNo || ""}
              onChange={(e) => onChange({ ...value, houseFlatNo: e.target.value })}
              placeholder="e.g. Flat 402, Building B, Pole #12"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Landmark (Optional)
            </label>
            <input
              type="text"
              value={value.landmark || ""}
              onChange={(e) => onChange({ ...value, landmark: e.target.value })}
              placeholder="e.g. Opposite Haldiram's / Post Office"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
