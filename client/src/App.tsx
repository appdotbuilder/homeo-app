import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { SuperadminDashboard } from '@/components/SuperadminDashboard';
import { DoctorDashboard } from '@/components/DoctorDashboard';
import { DoctorSelectionScreen } from '@/components/DoctorSelectionScreen';
import { LoginScreen } from '@/components/LoginScreen';
import type { Doctor } from '../../server/src/schema';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'superadmin' | 'doctor' | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const handleLoginSuccess = (role: 'superadmin' | 'doctor', doctor?: Doctor) => {
    setIsLoggedIn(true);
    setUserRole(role);
    if (role === 'doctor' && doctor) {
      setSelectedDoctor(doctor);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setSelectedDoctor(null);
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleChangeDoctorProfile = () => {
    setSelectedDoctor(null);
  };

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-green-800">🏥 HomeoClinic</h1>
              <Badge 
                variant={userRole === 'superadmin' ? 'default' : 'secondary'} 
                className={userRole === 'superadmin' ? 'bg-blue-600' : 'bg-green-600'}
              >
                {userRole === 'superadmin' ? '👨‍💼 Superadmin' : '👩‍⚕️ Doctor'}
              </Badge>
              {userRole === 'doctor' && selectedDoctor && (
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                  Dr. {selectedDoctor.name}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {userRole === 'doctor' && selectedDoctor && (
                <Button 
                  variant="outline" 
                  onClick={handleChangeDoctorProfile}
                  className="hover:bg-green-50 hover:border-green-200"
                  size="sm"
                >
                  Change Doctor
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="hover:bg-red-50 hover:border-red-200 hover:text-red-700"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {userRole === 'superadmin' && (
          <SuperadminDashboard 
            onDoctorSelect={() => {}} // Superadmin doesn't need doctor selection
            selectedDoctorId={null}
          />
        )}
        {userRole === 'doctor' && !selectedDoctor && (
          <DoctorSelectionScreen onDoctorSelect={handleDoctorSelect} />
        )}
        {userRole === 'doctor' && selectedDoctor && (
          <DoctorDashboard selectedDoctor={selectedDoctor} />
        )}
      </main>
    </div>
  );
}

export default App;