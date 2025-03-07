/*
  # Police-Involved Shootings Database Schema

  1. New Tables
    - `incidents`
      - Primary table for shooting incidents
      - Contains location, date, and basic incident details
      - Links to other detail tables
    
    - `officers`
      - Information about officers involved
      - One incident can have multiple officers
    
    - `subjects`
      - Information about subjects involved in incidents
      - Linked to incidents table
    
    - `weapons`
      - Details about weapons involved
      - Many-to-many relationship with incidents

  2. Security
    - Enable RLS on all tables
    - Public read-only access for authenticated users
    - Write access restricted to admin users
*/

-- Create custom types
CREATE TYPE weapon_type AS ENUM ('firearm', 'knife', 'other', 'unarmed');
CREATE TYPE incident_type AS ENUM ('fatal', 'non_fatal', 'shot_fired_no_hit');

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_date timestamp with time zone NOT NULL,
  latitude numeric(10,8) NOT NULL,
  longitude numeric(11,8) NOT NULL,
  address text,
  zip_code text,
  incident_type incident_type NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Officers table
CREATE TABLE IF NOT EXISTS officers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id),
  badge_number text,
  years_of_service integer,
  department text,
  injury_type text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id),
  age integer,
  gender text,
  race text,
  injury_type text,
  mental_status text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Weapons table
CREATE TABLE IF NOT EXISTS weapons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id),
  weapon_type weapon_type NOT NULL,
  weapon_description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE weapons ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on incidents"
  ON incidents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow public read access on officers"
  ON officers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow public read access on subjects"
  ON subjects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow public read access on weapons"
  ON weapons
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS incidents_date_idx ON incidents(incident_date);
CREATE INDEX IF NOT EXISTS incidents_location_idx ON incidents USING gist (
  ll_to_earth(latitude, longitude)
);
CREATE INDEX IF NOT EXISTS officers_incident_id_idx ON officers(incident_id);
CREATE INDEX IF NOT EXISTS subjects_incident_id_idx ON subjects(incident_id);
CREATE INDEX IF NOT EXISTS weapons_incident_id_idx ON weapons(incident_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_officers_updated_at
    BEFORE UPDATE ON officers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weapons_updated_at
    BEFORE UPDATE ON weapons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();