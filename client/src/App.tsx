import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { SuperadminDashboard } from '@/components/SuperadminDashboard';
import { DoctorDashboard } from '@/components/DoctorDashboard';

type UserRole = 'superadmin' | 'doctor' | null;

function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);

  const handleRoleSwitch = (role: UserRole) => {
    setCurrentRole(role);
    setSelectedDoctorId(null);
  };

  if (!currentRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-800">🏥 HomeoClinic</CardTitle>
            <CardDescription>
              Complete management system for homeopathic clinics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-gray-600 mb-6">
              Select your role to continue
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => handleRoleSwitch('superadmin')}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                👨‍💼 Superadmin
                <div className="text-xs opacity-90 ml-2">Manage doctors & locations</div>
              </Button>
              <Button 
                onClick={() => handleRoleSwitch('doctor')}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                👩‍⚕️ Doctor
                <div className="text-xs opacity-90 ml-2">Manage patients & visits</div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-green-800">🏥 HomeoClinic</h1>
              <Badge 
                variant={currentRole === 'superadmin' ? 'default' : 'secondary'} 
                className={currentRole === 'superadmin' ? 'bg-blue-600' : 'bg-green-600'}
              >
                {currentRole === 'superadmin' ? '👨‍💼 Superadmin' : '👩‍⚕️ Doctor'}
              </Badge>
            </div>
            <Button 
              variant="outline" 
              onClick={() => handleRoleSwitch(null)}
              className="hover:bg-red-50 hover:border-red-200 hover:text-red-700"
            >
              Switch Role
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {currentRole === 'superadmin' && (
          <SuperadminDashboard 
            onDoctorSelect={setSelectedDoctorId}
            selectedDoctorId={selectedDoctorId}
          />
        )}
        {currentRole === 'doctor' && <DoctorDashboard />}
      </main>
    </div>
  );
}

export default App;