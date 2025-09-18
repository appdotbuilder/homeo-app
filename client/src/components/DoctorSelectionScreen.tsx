import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Doctor } from '../../../server/src/schema';

interface DoctorSelectionScreenProps {
  onDoctorSelect: (doctor: Doctor) => void;
}

export function DoctorSelectionScreen({ onDoctorSelect }: DoctorSelectionScreenProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDoctors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await trpc.getDoctors.query();
      setDoctors(result);
    } catch (error) {
      console.error('Failed to load doctors:', error);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading doctors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center space-y-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadDoctors} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="text-center space-y-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>No Doctors Available</CardTitle>
            <CardDescription>
              No doctor profiles are currently available. Please contact your administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">👩‍⚕️ Select Your Doctor Profile</h2>
        <p className="text-gray-600 mt-2">Choose your profile to access patient management</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {doctors.map((doctor: Doctor) => (
          <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-green-800">{doctor.name}</CardTitle>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Dr.
                </Badge>
              </div>
              <CardDescription>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">📞 Contact:</span> {doctor.contactNumber}</p>
                  <p><span className="font-medium">🕒 Timings:</span> {doctor.timings}</p>
                  <p><span className="font-medium">🏥 Location ID:</span> {doctor.locationId}</p>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => onDoctorSelect(doctor)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Select This Profile
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}