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
  // First, let's properly handle the CSV by preserving newlines in quoted fields
  const rows: string[] = [];
  let currentRow = '';
  let insideQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      insideQuotes = !insideQuotes;
    }
    
    if (char === '\n' && !insideQuotes) {
      rows.push(currentRow);
      currentRow = '';
      continue;
    }
    
    currentRow += char;
  }
  if (currentRow) {
    rows.push(currentRow);
  }

  console.log('Total rows:', rows.length);
  
  // Skip header row
  const incidents = rows.slice(1).map(row => {
    if (!row.trim()) return null;

    // Split the row into fields, preserving quoted content
    const fields: string[] = [];
    let field = '';
    insideQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
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

    if (fields.length < 9) {
      console.log('Invalid row format:', row);
      return null;
    }

    // Parse the location field
    const locationField = fields[8].replace(/^"|"$/g, '');
    const parts = locationField.split('\n').map(part => part.trim());
    
    // Look for coordinates in each part
    let coordinates: [number, number] | null = null;
    for (const part of parts) {
      const match = part.match(/\(([-\d.]+),\s*([-\d.]+)\)/);
      if (match) {
        coordinates = [parseFloat(match[1]), parseFloat(match[2])];
        break;
      }
    }

    if (!coordinates) {
      console.log('No coordinates found in location:', locationField);
      return null;
    }

    if (isNaN(coordinates[0]) || isNaN(coordinates[1])) {
      console.log('Invalid coordinates:', coordinates);
      return null;
    }

    console.log('Found incident:', fields[0], 'at', coordinates);

    return {
      caseNumber: fields[0],
      date: fields[1],
      outcome: fields[2],
      subjectWeapon: fields[3],
      officers: fields[4],
      grandJuryDisposition: fields[5],
      attorneyGeneralUrl: fields[6],
      summaryUrl: fields[7],
      location: {
        address: parts[0] || '',
        coordinates
      }
    };
  }).filter((incident): incident is PoliceIncident => incident !== null);

  console.log('Valid incidents:', incidents.length);
  if (incidents.length > 0) {
    console.log('First valid incident:', incidents[0]);
  }
  return incidents;
} 