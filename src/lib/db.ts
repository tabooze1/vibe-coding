import Database from 'better-sqlite3';

const db = new Database('incidents.db');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    incident_date TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT NOT NULL,
    incident_type TEXT NOT NULL CHECK (incident_type IN ('fatal', 'non_fatal', 'shot_fired_no_hit')),
    description TEXT,
    summary_url TEXT,
    ag_forms_url TEXT,
    grand_jury_disposition TEXT
  );

  CREATE TABLE IF NOT EXISTS officers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id TEXT NOT NULL,
    name TEXT NOT NULL,
    race_gender TEXT,
    FOREIGN KEY (incident_id) REFERENCES incidents(id)
  );

  CREATE TABLE IF NOT EXISTS weapons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id TEXT NOT NULL,
    weapon_type TEXT NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES incidents(id)
  );
`);

// Helper function to parse the date from MM/DD/YYYY to YYYY-MM-DD
function parseDate(dateStr: string): string {
  const [month, day, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Helper function to extract coordinates from the address string
function extractCoordinates(location: string): [number, number] {
  const match = location.match(/\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/);
  if (!match) {
    throw new Error(`Could not extract coordinates from location: ${location}`);
  }
  return [parseFloat(match[1]), parseFloat(match[2])];
}

// Helper function to extract clean address from the full location string
function extractAddress(location: string): string {
  return location.split('\n')[0].trim();
}

// Function to map the incident outcome to our incident_type enum
function mapIncidentType(outcome: string): 'fatal' | 'non_fatal' | 'shot_fired_no_hit' {
  const lowerOutcome = outcome.toLowerCase();
  if (lowerOutcome.includes('deceased')) return 'fatal';
  if (lowerOutcome.includes('injured')) return 'non_fatal';
  return 'shot_fired_no_hit';
}

// Helper function to parse officer information
function parseOfficers(officerStr: string): Array<{ name: string, race_gender: string }> {
  return officerStr.split(';').map(officer => {
    const match = officer.trim().match(/([^(]+)\s*(\([^)]+\))?/);
    if (!match) return { name: officer.trim(), race_gender: '' };
    
    const name = match[1].trim();
    const raceGender = match[2] ? match[2].replace(/[()]/g, '') : '';
    return { name, race_gender: raceGender };
  });
}

// Insert data using prepared statements
const insertIncident = db.prepare(`
  INSERT OR REPLACE INTO incidents (
    id, incident_date, latitude, longitude, address, 
    incident_type, summary_url, ag_forms_url, grand_jury_disposition
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertOfficer = db.prepare(`
  INSERT INTO officers (incident_id, name, race_gender)
  VALUES (?, ?, ?)
`);

const insertWeapon = db.prepare(`
  INSERT INTO weapons (incident_id, weapon_type)
  VALUES (?, ?)
`);

// Clear existing data
db.exec('DELETE FROM weapons');
db.exec('DELETE FROM officers');
db.exec('DELETE FROM incidents');

// Transaction to insert all data
const insertData = db.transaction(() => {
  const incidents = [
    {
      id: '507756T',
      date: '07/07/2007',
      outcome: 'Shoot and Miss',
      weapon: 'Vehicle',
      officers: 'Madison, John W/M',
      disposition: 'N/A',
      agFormsUrl: 'N/A',
      summaryUrl: 'https://www.dallaspolice.net/reports/OIS/narrative/2007/OIS_2007_507756T.pdf',
      location: '1818 N Akard Street\nDallas, Texas\n(32.786522, -96.802127)'
    },
    // Add all other incidents here...
  ];

  for (const incident of incidents) {
    const [latitude, longitude] = extractCoordinates(incident.location);
    const address = extractAddress(incident.location);
    const incidentType = mapIncidentType(incident.outcome);
    const officers = parseOfficers(incident.officers);

    insertIncident.run(
      incident.id,
      parseDate(incident.date),
      latitude,
      longitude,
      address,
      incidentType,
      incident.summaryUrl || null,
      incident.agFormsUrl === 'N/A' ? null : incident.agFormsUrl,
      incident.disposition === 'N/A' ? null : incident.disposition
    );

    // Insert officers
    for (const officer of officers) {
      insertOfficer.run(
        incident.id,
        officer.name,
        officer.race_gender
      );
    }

    // Insert weapon
    insertWeapon.run(
      incident.id,
      incident.weapon
    );
  }
});

// Execute the transaction
insertData();

export function getIncidents() {
  const incidents = db.prepare(`
    SELECT 
      i.*,
      json_group_array(DISTINCT json_object(
        'name', o.name,
        'race_gender', o.race_gender
      )) as officers,
      json_group_array(DISTINCT json_object(
        'weapon_type', w.weapon_type
      )) as weapons
    FROM incidents i
    LEFT JOIN officers o ON i.id = o.incident_id
    LEFT JOIN weapons w ON i.id = w.incident_id
    GROUP BY i.id
  `).all();

  // Parse JSON strings into objects
  return incidents.map(incident => ({
    ...incident,
    officers: JSON.parse(incident.officers),
    weapons: JSON.parse(incident.weapons)
  }));
}