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
  // Split into records by looking for coordinate patterns
  const records = csvText.split(/\n(?=\d)/);
  console.log('Total records:', records.length);

  // Skip header
  const incidents = records.slice(1).map((record, index) => {
    try {
      // Find coordinates
      const coordMatch = record.match(/\(([-\d.]+),\s*([-\d.]+)\)/);
      if (!coordMatch) return null;

      const coordinates: [number, number] = [
        parseFloat(coordMatch[1]),
        parseFloat(coordMatch[2])
      ];

      // Get the part before coordinates
      const mainPart = record.substring(0, record.indexOf('('));

      // Split into fields
      const fields = mainPart.split(',').map(f => f.trim().replace(/^"|"$/g, ''));

      if (fields.length < 8) return null;

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

      if (!incident.caseNumber || !incident.date) return null;

      return incident;
    } catch (error) {
      return null;
    }
  }).filter((incident): incident is PoliceIncident => {
    if (!incident) return false;
    return !isNaN(incident.location.coordinates[0]) && 
           !isNaN(incident.location.coordinates[1]);
  });

  console.log('Valid incidents:', incidents.length);
  if (incidents.length > 0) {
    console.log('Sample incident:', incidents[0]);
  }
  return incidents;
}