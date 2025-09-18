import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { Patient } from '../../../server/src/schema';

interface PatientSearchProps {
  onPatientSelect: (patient: Patient) => void;
}

export function PatientSearch({ onPatientSelect }: PatientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const results = await trpc.searchPatients.query({ query: searchQuery.trim() });
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search patients:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-green-800">🔍 Patient Search</CardTitle>
          <CardDescription>
            Search for patients by Patient ID, CNIC, Phone Number, or Name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <Label htmlFor="search">Search Patients</Label>
              <Input
                id="search"
                placeholder="Enter Patient ID, CNIC, Phone, or Name..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="text-base"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={isLoading || !searchQuery.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Searching...' : '🔍 Search'}
              </Button>
              {hasSearched && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={clearSearch}
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Results</CardTitle>
            <CardDescription>
              {isLoading ? 'Searching...' : `Found ${searchResults.length} patient(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchResults.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No patients found for "{searchQuery}"</p>
                <p className="text-sm text-gray-400">
                  Try searching with a different Patient ID, CNIC, phone number, or name.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {searchResults.map((patient: Patient) => (
                  <Card 
                    key={patient.id} 
                    className="border-green-100 hover:border-green-200 cursor-pointer transition-colors"
                    onClick={() => onPatientSelect(patient)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-green-800">
                            {patient.name || 'Name not provided'}
                          </h3>
                          <Badge variant="secondary" className="text-xs mt-1">
                            Patient ID: {patient.patientId}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPatientSelect(patient);
                          }}
                        >
                          Select
                        </Button>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        {patient.cnic && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">CNIC:</span>
                            <span>{patient.cnic}</span>
                          </div>
                        )}
                        {patient.phone && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Phone:</span>
                            <span>{patient.phone}</span>
                          </div>
                        )}
                        {!patient.cnic && !patient.phone && (
                          <p className="text-gray-400 italic">No contact information provided</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!hasSearched && (
        <Card className="border-green-100">
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <p className="mb-2">🔍 Start searching to find patients</p>
              <p className="text-sm text-gray-400">
                You can search by any of the following:
              </p>
              <ul className="text-sm text-gray-400 mt-2 space-y-1">
                <li>• Patient ID (e.g., P001, PAT123)</li>
                <li>• CNIC number</li>
                <li>• Phone number</li>
                <li>• Patient name (partial matches work)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}