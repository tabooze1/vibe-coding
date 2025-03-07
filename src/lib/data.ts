export interface PoliceIncident {
  caseNumber: string;
  date: string;
  outcome: string;
  subjectWeapon: string;
  officers: string;
  grandJuryDisposition: string;
  attorneyGeneralUrl: string;
  summaryUrl: string;
  location: {
    address: string;
    coordinates: [number, number];
  };
}

export function parseCSVData(csvText: string): PoliceIncident[] {
  // Split by newlines but preserve quoted content
  const lines = csvText.split('\n');
  console.log('Total lines:', lines.length);
  
  const incidents = lines.slice(1).map(line => {
    // Find the last comma that's not inside quotes
    const lastCommaIndex = line.lastIndexOf(',');
    if (lastCommaIndex === -1) {
      console.log('No comma found in line:', line);
      return null;
    }
    
    const geoLocation = line.slice(lastCommaIndex + 1).replace(/"/g, '').split('\n');
    const values = line.slice(0, lastCommaIndex).split(',');
    
    const coordinatesMatch = geoLocation[2]?.match(/\(([-\d.]+),\s*([-\d.]+)\)/);
    
    if (coordinatesMatch) {
      console.log('Found coordinates:', coordinatesMatch[1], coordinatesMatch[2]);
    } else {
      console.log('No coordinates found in:', geoLocation[2]);
    }
    
    const coordinates: [number, number] = coordinatesMatch ? [
      parseFloat(coordinatesMatch[1]),
      parseFloat(coordinatesMatch[2])
    ] : [0, 0];
    
    return {
      caseNumber: values[0] || '',
      date: values[1] || '',
      outcome: values[2] || '',
      subjectWeapon: values[3] || '',
      officers: values[4] || '',
      grandJuryDisposition: values[5] || '',
      attorneyGeneralUrl: values[6] || '',
      summaryUrl: values[7] || '',
      location: {
        address: geoLocation[0]?.trim() || '',
        coordinates
      }
    };
  }).filter((incident): incident is PoliceIncident => incident !== null);

  const validIncidents = incidents.filter(incident => 
    incident.location.coordinates[0] !== 0 && 
    incident.location.coordinates[1] !== 0 &&
    incident.caseNumber !== ''
  );

  console.log('Valid incidents:', validIncidents.length);
  if (validIncidents.length > 0) {
    console.log('First valid incident:', validIncidents[0]);
  }
  return validIncidents;
} 