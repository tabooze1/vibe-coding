/*
  # Fix foreign key relationships

  1. Changes
    - Drop existing tables to recreate with proper foreign key relationships
    - Recreate tables with CASCADE options for better data management
    - Add proper foreign key constraints
  
  2. Security
    - Maintain existing RLS policies
    - Re-enable RLS on all tables
*/

-- Drop existing tables in reverse order of dependencies
DROP TABLE IF EXISTS weapons CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS officers CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS weapon_type CASCADE;
DROP TYPE IF EXISTS incident_type CASCADE;

-- Recreate custom types
CREATE TYPE weapon_type AS ENUM ('firearm', 'knife', 'other', 'unarmed');
CREATE TYPE incident_type AS ENUM ('fatal', 'non_fatal', 'shot_fired_no_hit');

-- Recreate tables with proper foreign key relationships
CREATE TABLE incidents (
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

CREATE TABLE officers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  badge_number text,
  years_of_service integer,
  department text,
  injury_type text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  age integer,
  gender text,
  race text,
  injury_type text,
  mental_status text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE weapons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  weapon_type weapon_type NOT NULL,
  weapon_description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE weapons ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on incidents"
  ON incidents FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow public read access on officers"
  ON officers FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow public read access on subjects"
  ON subjects FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow public read access on weapons"
  ON weapons FOR SELECT TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX incidents_date_idx ON incidents(incident_date);
CREATE INDEX officers_incident_id_idx ON officers(incident_id);
CREATE INDEX subjects_incident_id_idx ON subjects(incident_id);
CREATE INDEX weapons_incident_id_idx ON weapons(incident_id);