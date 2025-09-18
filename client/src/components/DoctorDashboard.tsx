import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientSearch } from '@/components/PatientSearch';
import { PatientRegistration } from '@/components/PatientRegistration';
import { PatientHistory } from '@/components/PatientHistory';
import { VisitRecords } from '@/components/VisitRecords';
import { useState } from 'react';
import type { Patient, Doctor } from '../../../server/src/schema';

interface DoctorDashboardProps {
  selectedDoctor: Doctor;
}

export function DoctorDashboard({ selectedDoctor }: DoctorDashboardProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState('search');

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('history');
  };

  const handleNewPatientRegistered = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('history');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h2>
        <p className="text-gray-600 mt-2">
          Welcome, Dr. {selectedDoctor.name} • {selectedDoctor.timings}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Manage patient records and visit history
        </p>
      </div>

      {selectedPatient && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-800">Selected Patient</h3>
                <p className="text-green-700">
                  <span className="font-medium">ID:</span> {selectedPatient.patientId} • 
                  <span className="font-medium ml-2">Name:</span> {selectedPatient.name || 'Not provided'} • 
                  {selectedPatient.cnic && <><span className="font-medium ml-2">CNIC:</span> {selectedPatient.cnic}</>}
                  {selectedPatient.phone && <><span className="font-medium ml-2">Phone:</span> {selectedPatient.phone}</>}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPatient(null)}
                className="text-green-600 hover:text-green-800 text-sm underline"
              >
                Clear Selection
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
          <TabsTrigger value="search" className="flex items-center gap-2">
            🔍 Search
          </TabsTrigger>
          <TabsTrigger value="register" className="flex items-center gap-2">
            ➕ Register
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2" disabled={!selectedPatient}>
            📋 History
          </TabsTrigger>
          <TabsTrigger value="visits" className="flex items-center gap-2" disabled={!selectedPatient}>
            🩺 New Visit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <PatientSearch onPatientSelect={handlePatientSelect} />
        </TabsContent>

        <TabsContent value="register" className="space-y-4">
          <PatientRegistration onPatientRegistered={handleNewPatientRegistered} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {selectedPatient && <PatientHistory patient={selectedPatient} />}
        </TabsContent>

        <TabsContent value="visits" className="space-y-4">
          {selectedPatient && <VisitRecords patient={selectedPatient} activeDoctor={selectedDoctor} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}