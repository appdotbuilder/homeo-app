import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { Patient, Doctor, CreateVisitInput } from '../../../server/src/schema';

interface VisitRecordsProps {
  patient: Patient;
  activeDoctor: Doctor;
}

export function VisitRecords({ patient, activeDoctor }: VisitRecordsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateVisitInput>({
    patientId: patient.id,
    doctorId: activeDoctor.id,
    visitDate: new Date(),
    symptoms: '',
    diagnosis: '',
    prescription: '',
    notes: '',
    followUpDate: undefined,
  });



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    setIsLoading(true);
    try {
      // Prepare submission data
      const submitData: CreateVisitInput = {
        patientId: patient.id,
        doctorId: activeDoctor.id,
        visitDate: formData.visitDate,
        symptoms: formData.symptoms.trim(),
        diagnosis: formData.diagnosis.trim(),
        prescription: formData.prescription.trim(),
        notes: formData.notes?.trim() || undefined,
        followUpDate: formData.followUpDate || undefined,
      };

      await trpc.createVisit.mutate(submitData);
      
      setSuccess('Visit record created successfully!');
      
      // Reset form
      setFormData({
        patientId: patient.id,
        doctorId: activeDoctor.id,
        visitDate: new Date(),
        symptoms: '',
        diagnosis: '',
        prescription: '',
        notes: '',
        followUpDate: undefined,
      });
    } catch (error: unknown) {
      console.error('Failed to create visit:', error);
      setError(error instanceof Error ? error.message : 'Failed to create visit record. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  const parseInputDate = (dateString: string): Date => {
    return new Date(dateString + 'T00:00:00');
  };

  return (
    <div className="space-y-6">
      {/* Patient Info */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-xl text-green-800">🩺 New Visit Record</CardTitle>
          <CardDescription>
            Creating visit record for {patient.name || 'Patient'} (ID: {patient.patientId})
            <br />
            <span className="font-medium text-green-700">Attending Doctor: Dr. {activeDoctor.name}</span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Visit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visit Details</CardTitle>
          <CardDescription>
            Fill in the details for this patient visit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="visitDate">
                Visit Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="visitDate"
                type="date"
                value={formatDateForInput(formData.visitDate)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, visitDate: parseInputDate(e.target.value) }))
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="symptoms">
                Symptoms <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="symptoms"
                placeholder="Describe the patient's symptoms..."
                value={formData.symptoms}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev) => ({ ...prev, symptoms: e.target.value }))
                }
                className="min-h-[80px]"
                required
              />
            </div>

            <div>
              <Label htmlFor="diagnosis">
                Diagnosis <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="diagnosis"
                placeholder="Medical diagnosis based on symptoms..."
                value={formData.diagnosis}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev) => ({ ...prev, diagnosis: e.target.value }))
                }
                className="min-h-[80px]"
                required
              />
            </div>

            <div>
              <Label htmlFor="prescription">
                Prescription <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="prescription"
                placeholder="Prescribed medicines, dosage, and instructions..."
                value={formData.prescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev) => ({ ...prev, prescription: e.target.value }))
                }
                className="min-h-[100px]"
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes or observations..."
                value={formData.notes || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value || undefined }))
                }
                className="min-h-[60px]"
              />
            </div>

            <div>
              <Label htmlFor="followUpDate">Follow-up Date (Optional)</Label>
              <Input
                id="followUpDate"
                type="date"
                value={formData.followUpDate ? formatDateForInput(formData.followUpDate) : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ 
                    ...prev, 
                    followUpDate: e.target.value ? parseInputDate(e.target.value) : undefined 
                  }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Set a date for the next recommended visit
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isLoading ? 'Creating Visit Record...' : '✅ Create Visit Record'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Doctor Info */}
      <Card className="border-blue-100">
        <CardContent className="pt-4">
          <div className="text-center text-sm text-gray-600">
            <p className="font-medium">📋 Visit will be recorded under Dr. {activeDoctor.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              Contact: {activeDoctor.contactNumber} • Timings: {activeDoctor.timings}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}