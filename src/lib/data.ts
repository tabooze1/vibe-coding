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
  const incidents = lines.slice(1).map((line, index) => {
    if (!line.trim()) {
      console.log(`Line ${index + 1}: Empty line`);
      return null;
    }

    // Extract coordinates from the end of the line
    const coordinatesMatch = line.match(/\(([-\d.]+),\s*([-\d.]+)\)/);
    if (!coordinatesMatch) {
      console.log(`Line ${index + 1}: No coordinates found in line:`, line);
      return null;
    }

    const coordinates: [number, number] = [
      parseFloat(coordinatesMatch[1]),
      parseFloat(coordinatesMatch[2])
    ];

    // Split by commas, handling quoted fields
    const fields: string[] = [];
    let currentField = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      // Stop when we reach the coordinates
      if (char === '(' && !insideQuotes && line.substring(i).includes(')')) {
        if (currentField.trim()) {
          fields.push(currentField.trim());
        }
        break;
      }
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }

    // Clean up the fields
    const cleanFields = fields.map(field => field.replace(/^"|"$/g, '').trim());

    if (cleanFields.length < 8) {
      console.log(`Line ${index + 1}: Not enough fields:`, cleanFields);
      return null;
    }

    // Get the address from the location field
    const address = cleanFields[7].split('\n')[0].trim();

    const incident = {
      caseNumber: cleanFields[0],
      date: cleanFields[1],
      outcome: cleanFields[2],
      subjectWeapon: cleanFields[3],
      officers: cleanFields[4],
      grandJuryDisposition: cleanFields[5],
      attorneyGeneralUrl: cleanFields[6],
      summaryUrl: cleanFields[7],
      location: {
        address,
        coordinates
      }
    };

    console.log(`Line ${index + 1}: Successfully parsed incident:`, incident.caseNumber, 'at', coordinates);
    return incident;
  }).filter((incident): incident is PoliceIncident => {
    if (!incident) return false;
    const valid = !isNaN(incident.location.coordinates[0]) && 
           !isNaN(incident.location.coordinates[1]) &&
           incident.caseNumber !== '';
    if (!valid) {
      console.log('Invalid incident:', incident);
    }
    return valid;
  });

  console.log('Valid incidents:', incidents.length);
  if (incidents.length > 0) {
    console.log('First valid incident:', incidents[0]);
  }
  return incidents;
} 