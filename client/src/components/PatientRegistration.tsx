import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { Patient, CreatePatientInput } from '../../../server/src/schema';

interface PatientRegistrationProps {
  onPatientRegistered: (patient: Patient) => void;
}

export function PatientRegistration({ onPatientRegistered }: PatientRegistrationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreatePatientInput>({
    cnic: '',
    phone: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate at least one contact method
    const cnicValue = formData.cnic?.trim() || '';
    const phoneValue = formData.phone?.trim() || '';
    
    if (!cnicValue && !phoneValue) {
      setError('Either CNIC or Phone number must be provided');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare data, converting empty strings to undefined
      const submitData: CreatePatientInput = {
        cnic: cnicValue || undefined,
        phone: phoneValue || undefined,
        name: formData.name?.trim() || undefined,
      };

      const response = await trpc.createPatient.mutate(submitData);
      
      // Reset form
      setFormData({
        cnic: '',
        phone: '',
        name: '',
      });
      
      onPatientRegistered(response);
    } catch (error: unknown) {
      console.error('Failed to create patient:', error);
      setError(error instanceof Error ? error.message : 'Failed to register patient. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-green-800">➕ Register New Patient</CardTitle>
          <CardDescription>
            Create a new patient record. Either CNIC or Phone number is required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="name">Patient Name</Label>
              <Input
                id="name"
                placeholder="e.g., Ahmed Khan (optional)"
                value={formData.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePatientInput) => ({ 
                    ...prev, 
                    name: e.target.value || undefined 
                  }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">Optional - can be added later</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cnic">
                  CNIC Number
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="cnic"
                  placeholder="e.g., 12345-1234567-1"
                  value={formData.cnic || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePatientInput) => ({ 
                      ...prev, 
                      cnic: e.target.value || undefined 
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="phone">
                  Phone Number
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="e.g., +92 300 1234567"
                  value={formData.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePatientInput) => ({ 
                      ...prev, 
                      phone: e.target.value || undefined 
                    }))
                  }
                />
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                <strong>Note:</strong> Either CNIC or Phone number must be provided. 
                Both fields are unique - a patient cannot be registered with the same CNIC or phone number twice.
              </AlertDescription>
            </Alert>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Registering...' : '➕ Register Patient'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-green-100">
        <CardContent className="pt-6">
          <div className="text-center text-gray-600">
            <h3 className="font-semibold mb-2">📋 Registration Process</h3>
            <div className="text-sm space-y-1">
              <p>1. Provide either CNIC or Phone (or both)</p>
              <p>2. Patient name is optional but recommended</p>
              <p>3. System will auto-generate a unique Patient ID</p>
              <p>4. Patient will be automatically selected for visit records</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}