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
    if (!line.trim()) {
      return null;
    }

    // Split the line by commas, but preserve commas inside quotes
    const values = line.match(/(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g)?.map(value => {
      // Remove leading comma and quotes, and handle double quotes
      return value.replace(/^,?"?|"$/g, '').replace(/""/g, '"');
    }) || [];

    if (values.length < 9) {
      console.log('Invalid line format:', line);
      return null;
    }

    // The last value should contain the location information
    const locationInfo = values[8];
    const coordinatesMatch = locationInfo.match(/\(([-\d.]+),\s*([-\d.]+)\)/);

    if (!coordinatesMatch) {
      console.log('No coordinates found in:', locationInfo);
      return null;
    }

    const coordinates: [number, number] = [
      parseFloat(coordinatesMatch[1]),
      parseFloat(coordinatesMatch[2])
    ];

    if (isNaN(coordinates[0]) || isNaN(coordinates[1])) {
      console.log('Invalid coordinates:', coordinatesMatch[1], coordinatesMatch[2]);
      return null;
    }

    console.log('Found coordinates:', coordinates[0], coordinates[1]);

    return {
      caseNumber: values[0],
      date: values[1],
      outcome: values[2],
      subjectWeapon: values[3],
      officers: values[4],
      grandJuryDisposition: values[5],
      attorneyGeneralUrl: values[6],
      summaryUrl: values[7],
      location: {
        address: locationInfo.split('\n')[0]?.trim() || '',
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