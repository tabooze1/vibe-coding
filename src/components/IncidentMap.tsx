import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { PoliceIncident, parseCSVData } from '../lib/data';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface IncidentMapProps {
  csvData: string;
}

export function IncidentMap({ csvData }: IncidentMapProps) {
  const [incidents, setIncidents] = useState<PoliceIncident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number]>([32.7767, -96.7970]); // Dallas coordinates
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    console.log('IncidentMap: Received CSV data, length:', csvData.length);
    try {
      const parsedIncidents = parseCSVData(csvData);
      console.log('IncidentMap: Parsed incidents:', parsedIncidents.length);
      setIncidents(parsedIncidents);
      
      // Set map center to the first incident if available
      if (parsedIncidents.length > 0) {
        console.log('IncidentMap: Setting center to first incident:', parsedIncidents[0].location.coordinates);
        setCenter(parsedIncidents[0].location.coordinates);
      }
    } catch (err) {
      console.error('IncidentMap: Error parsing CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse CSV data');
    }
  }, [csvData]);

  console.log('IncidentMap: Rendering with', incidents.length, 'incidents');
  console.log('IncidentMap: Current center:', center);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <h3 className="font-bold">Error loading map data</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] relative">
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-gray-600">Loading map...</div>
        </div>
      )}
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        whenReady={() => setIsMapReady(true)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {incidents.map((incident) => (
          <Marker
            key={incident.caseNumber}
            position={incident.location.coordinates}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold">Case #{incident.caseNumber}</h3>
                <p><strong>Date:</strong> {incident.date}</p>
                <p><strong>Outcome:</strong> {incident.outcome}</p>
                <p><strong>Weapon:</strong> {incident.subjectWeapon}</p>
                <p><strong>Officers:</strong> {incident.officers}</p>
                <p><strong>Location:</strong> {incident.location.address}</p>
                {incident.summaryUrl && (
                  <a 
                    href={incident.summaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline mt-2 block"
                  >
                    View Summary
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {isMapReady && incidents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="text-gray-600">No incidents found</div>
        </div>
      )}
    </div>
  );
} 