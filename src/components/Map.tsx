import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getIncidents } from '../lib/db';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Sun as Gun, Car, Shield } from 'lucide-react';

// Fix for default marker icons in React Leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Incident {
  id: string;
  incident_date: string;
  latitude: number;
  longitude: number;
  address: string;
  incident_type: 'fatal' | 'non_fatal' | 'shot_fired_no_hit';
  description: string | null;
  summary_url: string | null;
  ag_forms_url: string | null;
  grand_jury_disposition: string | null;
  officers: Array<{
    name: string;
    race_gender: string;
  }>;
  weapons: Array<{
    weapon_type: string;
  }>;
}

export default function Map() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const data = getIncidents();
      setIncidents(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        <AlertTriangle className="w-6 h-6 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <MapContainer
      center={[32.7767, -96.7970]} // Dallas coordinates
      zoom={11}
      className="h-screen w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {incidents.map((incident) => (
        <Marker
          key={incident.id}
          position={[incident.latitude, incident.longitude]}
        >
          <Popup>
            <div className="max-w-sm">
              <h3 className="font-bold text-lg mb-2">
                {new Date(incident.incident_date).toLocaleDateString()}
              </h3>
              <p className="text-sm mb-2">{incident.address}</p>
              <p className="text-sm mb-2">
                <span className="font-semibold">Type:</span>{' '}
                {incident.incident_type.replace(/_/g, ' ')}
              </p>
              
              {incident.officers.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-semibold text-sm mb-1">Officers Involved:</h4>
                  {incident.officers.map((officer, idx) => (
                    <div key={idx} className="text-xs mb-1 flex items-center">
                      <Shield className="w-4 h-4 mr-1" />
                      <span>{officer.name} ({officer.race_gender})</span>
                    </div>
                  ))}
                </div>
              )}

              {incident.weapons.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-semibold text-sm mb-1">Weapons:</h4>
                  {incident.weapons.map((weapon, idx) => (
                    <div key={idx} className="text-xs flex items-center">
                      {weapon.weapon_type.toLowerCase() === 'vehicle' ? (
                        <Car className="w-4 h-4 mr-1" />
                      ) : (
                        <Gun className="w-4 h-4 mr-1" />
                      )}
                      <span>{weapon.weapon_type}</span>
                    </div>
                  ))}
                </div>
              )}

              {incident.grand_jury_disposition && incident.grand_jury_disposition !== 'N/A' && (
                <p className="text-xs mt-2">
                  <span className="font-semibold">Grand Jury:</span> {incident.grand_jury_disposition}
                </p>
              )}

              {incident.summary_url && (
                <div className="mt-2">
                  <a
                    href={incident.summary_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    View Summary Report
                  </a>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}