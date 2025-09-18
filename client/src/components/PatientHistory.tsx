import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Patient, Visit, Doctor } from '../../../server/src/schema';

interface PatientHistoryProps {
  patient: Patient;
}

export function PatientHistory({ patient }: PatientHistoryProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadVisits = useCallback(async () => {
    setIsLoading(true);
    try {
      const visitsResult = await trpc.getVisitsByPatient.query({ patientId: patient.id });
      const doctorsResult = await trpc.getDoctors.query();
      
      setVisits(visitsResult);
      setDoctors(doctorsResult);
    } catch (error) {
      console.error('Failed to load patient history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [patient.id]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  const getDoctorName = (doctorId: number): string => {
    const doctor = doctors.find((doc: Doctor) => doc.id === doctorId);
    return doctor ? doctor.name : 'Unknown Doctor';
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Patient Info Card */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-xl text-green-800">📋 Patient History</CardTitle>
          <CardDescription>
            Complete visit history for {patient.name || 'Patient'} (ID: {patient.patientId})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-green-700">Patient ID:</span>
              <p className="text-green-600">{patient.patientId}</p>
            </div>
            <div>
              <span className="font-medium text-green-700">Name:</span>
              <p className="text-green-600">{patient.name || 'Not provided'}</p>
            </div>
            <div>
              <span className="font-medium text-green-700">Contact:</span>
              <p className="text-green-600">
                {patient.cnic && `CNIC: ${patient.cnic}`}
                {patient.cnic && patient.phone && ' • '}
                {patient.phone && `Phone: ${patient.phone}`}
                {!patient.cnic && !patient.phone && 'No contact info'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visit History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">🩺 Visit Records</CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : `${visits.length} visit(s) on record`}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              Total Visits: {visits.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading patient history...</p>
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No visits recorded yet</p>
              <p className="text-sm text-gray-400">
                Use the "New Visit" tab to create the first visit record for this patient.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {visits.map((visit: Visit, index: number) => (
                <div key={visit.id}>
                  <Card className="border-green-100">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base text-green-800">
                            Visit #{visits.length - index}
                          </CardTitle>
                          <CardDescription className="text-sm mt-1">
                            {formatDate(visit.visitDate)} • Dr. {getDoctorName(visit.doctorId)}
                          </CardDescription>
                        </div>
                        {visit.followUpDate && (
                          <Badge variant="outline" className="text-xs">
                            Follow-up: {formatDate(visit.followUpDate)}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2">🤒 Symptoms</h4>
                          <p className="text-sm bg-gray-50 p-3 rounded border">{visit.symptoms}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2">🔍 Diagnosis</h4>
                          <p className="text-sm bg-blue-50 p-3 rounded border border-blue-100">{visit.diagnosis}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">💊 Prescription</h4>
                        <p className="text-sm bg-green-50 p-3 rounded border border-green-100 whitespace-pre-wrap">
                          {visit.prescription}
                        </p>
                      </div>

                      {visit.notes && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2">📝 Notes</h4>
                          <p className="text-sm bg-yellow-50 p-3 rounded border border-yellow-100">
                            {visit.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {index < visits.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}