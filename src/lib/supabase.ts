import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zjiymevaezdltnuiisoh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaXltZXZhZXpkbHRudWlpc29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNjU0NzQsImV4cCI6MjA1Njc0MTQ3NH0.16_asQkLrFZJo12HFc3I7FXTLy6LUCokD2juhw88N9E';

export const supabase = createClient(supabaseUrl, supabaseKey);