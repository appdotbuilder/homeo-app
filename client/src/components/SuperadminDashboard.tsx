// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LocationsManagement } from '@/components/LocationsManagement';
import { DoctorsManagement } from '@/components/DoctorsManagement';

interface SuperadminDashboardProps {
  onDoctorSelect: (doctorId: number | null) => void;
  selectedDoctorId: number | null;
}

export function SuperadminDashboard({ onDoctorSelect, selectedDoctorId }: SuperadminDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Superadmin Dashboard</h2>
        <p className="text-gray-600 mt-2">Manage clinic locations and doctor profiles</p>
      </div>

      <Tabs defaultValue="locations" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="locations" className="flex items-center gap-2">
            🏢 Locations
          </TabsTrigger>
          <TabsTrigger value="doctors" className="flex items-center gap-2">
            👩‍⚕️ Doctors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="space-y-4">
          <LocationsManagement />
        </TabsContent>

        <TabsContent value="doctors" className="space-y-4">
          <DoctorsManagement 
            onDoctorSelect={onDoctorSelect}
            selectedDoctorId={selectedDoctorId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}