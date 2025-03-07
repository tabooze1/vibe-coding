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
  
  // Skip header row
  const incidents = lines.slice(1).map(line => {
    if (!line.trim()) return null;

    // Extract coordinates from the end of the line
    const coordinatesMatch = line.match(/\(([-\d.]+),\s*([-\d.]+)\)/);
    if (!coordinatesMatch) {
      return null;
    }

    const coordinates: [number, number] = [
      parseFloat(coordinatesMatch[1]),
      parseFloat(coordinatesMatch[2])
    ];

    // Remove the coordinates part from the line
    const lineWithoutCoords = line.substring(0, line.indexOf('('));

    // Split the remaining line by commas, but preserve commas inside quotes
    const fields: string[] = [];
    let field = '';
    let insideQuotes = false;
    
    for (let i = 0; i < lineWithoutCoords.length; i++) {
      const char = lineWithoutCoords[i];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
        continue;
      }
      
      if (char === ',' && !insideQuotes) {
        fields.push(field.trim());
        field = '';
        continue;
      }
      
      field += char;
    }
    fields.push(field.trim());

    if (fields.length < 8) {
      return null;
    }

    // Get the address from the location field
    const locationParts = fields[7].split('\n');
    const address = locationParts[0].replace(/"/g, '').trim();

    console.log('Found incident:', fields[0], 'at', coordinates);

    return {
      caseNumber: fields[0],
      date: fields[1],
      outcome: fields[2].replace(/"/g, ''),
      subjectWeapon: fields[3],
      officers: fields[4].replace(/"/g, ''),
      grandJuryDisposition: fields[5],
      attorneyGeneralUrl: fields[6],
      summaryUrl: fields[7],
      location: {
        address: address,
        coordinates
      }
    };
  }).filter((incident): incident is PoliceIncident => {
    if (!incident) return false;
    return !isNaN(incident.location.coordinates[0]) && 
           !isNaN(incident.location.coordinates[1]) &&
           incident.caseNumber !== '';
  });

  console.log('Valid incidents:', incidents.length);
  if (incidents.length > 0) {
    console.log('First valid incident:', incidents[0]);
  }
  return incidents;
} 