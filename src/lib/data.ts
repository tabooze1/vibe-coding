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
  // First, normalize line endings and split into lines
  const normalizedText = csvText.replace(/\r\n/g, '\n');
  const allLines = normalizedText.split('\n');
  
  // Combine lines that are part of the same record
  const lines: string[] = [];
  let currentLine = '';
  
  for (const line of allLines) {
    if (line.includes('(') && line.includes(')')) {
      // This line contains coordinates, so it's the end of a record
      lines.push(currentLine + line);
      currentLine = '';
    } else if (line.trim() !== '') {
      // This line is part of a record
      currentLine += line + ' ';
    }
  }

  console.log('Total records:', lines.length);

  // Skip header and process each line
  const incidents = lines.slice(1).map((line, index) => {
    try {
      // Extract coordinates
      const coordMatch = line.match(/\(([-\d.]+),\s*([-\d.]+)\)/);
      if (!coordMatch) {
        console.log(`Line ${index + 1}: No coordinates found`);
        return null;
      }

      const coordinates: [number, number] = [
        parseFloat(coordMatch[1]),
        parseFloat(coordMatch[2])
      ];

      // Remove the coordinates part and split the rest by commas
      const mainPart = line.substring(0, line.indexOf('('));
      const parts: string[] = [];
      let field = '';
      let inQuotes = false;

      for (let i = 0; i < mainPart.length; i++) {
        const char = mainPart[i];
        if (char === '"') {
          inQuotes = !inQuotes;
          field += char;
        } else if (char === ',' && !inQuotes) {
          parts.push(field.trim());
          field = '';
        } else {
          field += char;
        }
      }
      if (field) {
        parts.push(field.trim());
      }

      // Clean up the fields
      const fields = parts.map(f => f.replace(/^"?|"?$/g, '').trim());

      if (fields.length < 8) {
        console.log(`Line ${index + 1}: Not enough fields`, fields);
        return null;
      }

      // Create the incident object
      const incident: PoliceIncident = {
        caseNumber: fields[0],
        date: fields[1],
        outcome: fields[2],
        subjectWeapon: fields[3],
        officers: fields[4],
        grandJuryDisposition: fields[5],
        attorneyGeneralUrl: fields[6],
        summaryUrl: fields[7],
        location: {
          address: fields[7].split('http')[0].trim(),
          coordinates
        }
      };

      console.log(`Successfully parsed incident: ${incident.caseNumber}`);
      return incident;
    } catch (error) {
      console.error(`Error parsing line ${index + 1}:`, error);
      return null;
    }
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