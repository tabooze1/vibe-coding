import { useState, useEffect } from 'react';
import { IncidentMap } from './components/IncidentMap';
import { parseCSVData } from './lib/data';

function App() {
  const [csvData, setCsvData] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Starting to fetch CSV...');
    fetch('/vibe-coding/Dallas_Police_Officer-Involved_Shootings.csv')
      .then(response => {
        console.log('CSV Response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(data => {
        console.log('CSV Data loaded, length:', data.length);
        console.log('First few lines:', data.split('\n').slice(0, 3).join('\n'));
        
        // Try parsing the data here to verify it works
        try {
          const parsedData = parseCSVData(data);
          console.log('App: Successfully parsed data, found incidents:', parsedData.length);
          if (parsedData.length > 0) {
            console.log('App: First parsed incident:', parsedData[0]);
          }
        } catch (err) {
          console.error('App: Error parsing CSV:', err);
        }
        
        setCsvData(data);
      })
      .catch(error => {
        console.error('Error loading CSV:', error);
        setError(error.message);
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error loading data</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Dallas Police Officer-Involved Shootings Map
        </h1>
      </header>
      <main className="max-w-7xl mx-auto">
        {csvData ? (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Data loaded: {csvData.length} characters
            </div>
            <IncidentMap csvData={csvData} />
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading data...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;