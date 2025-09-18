import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Doctor, Location, CreateDoctorInput, UpdateDoctorInput } from '../../../server/src/schema';

interface DoctorsManagementProps {
  onDoctorSelect: (doctorId: number | null) => void;
  selectedDoctorId: number | null;
}

export function DoctorsManagement({ onDoctorSelect, selectedDoctorId }: DoctorsManagementProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateDoctorInput>({
    name: '',
    contactNumber: '',
    locationId: 0,
    timings: '',
  });
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const loadDoctors = useCallback(async () => {
    try {
      const result = await trpc.getDoctors.query();
      setDoctors(result);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  }, []);

  const loadLocations = useCallback(async () => {
    try {
      const result = await trpc.getLocations.query();
      setLocations(result);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
    loadLocations();
  }, [loadDoctors, loadLocations]);

  const getLocationName = (locationId: number): string => {
    const location = locations.find((loc: Location) => loc.id === locationId);
    return location ? location.name : 'Unknown Location';
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.locationId === 0) {
      alert('Please select a location');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await trpc.createDoctor.mutate(formData);
      setDoctors((prev: Doctor[]) => [...prev, response]);
      setFormData({
        name: '',
        contactNumber: '',
        locationId: 0,
        timings: '',
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create doctor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor || formData.locationId === 0) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateDoctorInput = {
        id: editingDoctor.id,
        name: formData.name,
        contactNumber: formData.contactNumber,
        locationId: formData.locationId,
        timings: formData.timings,
      };
      const response = await trpc.updateDoctor.mutate(updateData);
      if (response) {
        setDoctors((prev: Doctor[]) => 
          prev.map((doc: Doctor) => doc.id === editingDoctor.id ? response : doc)
        );
      }
      setEditingDoctor(null);
      setFormData({
        name: '',
        contactNumber: '',
        locationId: 0,
        timings: '',
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update doctor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (doctorId: number) => {
    try {
      await trpc.deleteDoctor.mutate({ id: doctorId });
      setDoctors((prev: Doctor[]) => prev.filter((doc: Doctor) => doc.id !== doctorId));
      if (selectedDoctorId === doctorId) {
        onDoctorSelect(null);
      }
    } catch (error) {
      console.error('Failed to delete doctor:', error);
    }
  };

  const openEditDialog = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
      contactNumber: doctor.contactNumber,
      locationId: doctor.locationId,
      timings: doctor.timings,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl text-blue-800">👩‍⚕️ Doctor Profiles</CardTitle>
              <CardDescription>
                Manage doctor profiles and assignments
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  ➕ Add Doctor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Doctor</DialogTitle>
                  <DialogDescription>
                    Create a new doctor profile with contact details and location assignment.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Doctor Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Dr. Sarah Johnson"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateDoctorInput) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact">Contact Number *</Label>
                    <Input
                      id="contact"
                      placeholder="e.g., +92 300 1234567"
                      value={formData.contactNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateDoctorInput) => ({ ...prev, contactNumber: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Select value={formData.locationId.toString()} onValueChange={(value) => 
                      setFormData((prev: CreateDoctorInput) => ({ ...prev, locationId: parseInt(value) }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location: Location) => (
                          <SelectItem key={location.id} value={location.id.toString()}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timings">Working Hours *</Label>
                    <Input
                      id="timings"
                      placeholder="e.g., Mon-Fri 9 AM - 5 PM"
                      value={formData.timings}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateDoctorInput) => ({ ...prev, timings: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                      {isLoading ? 'Creating...' : 'Create Doctor'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {doctors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No doctors registered yet.</p>
              <p className="text-sm text-gray-400">Add your first doctor to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {doctors.map((doctor: Doctor) => (
                <Card 
                  key={doctor.id} 
                  className={`border-blue-100 hover:border-blue-200 transition-all cursor-pointer ${
                    selectedDoctorId === doctor.id ? 'ring-2 ring-blue-500 border-blue-300' : ''
                  }`}
                  onClick={() => onDoctorSelect(doctor.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{doctor.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        ID: {doctor.id}
                      </Badge>
                    </div>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-1">
                        📞 {doctor.contactNumber}
                      </div>
                      <div className="flex items-center gap-1">
                        🏢 {getLocationName(doctor.locationId)}
                      </div>
                      <div className="flex items-center gap-1">
                        🕒 {doctor.timings}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(doctor);
                        }}
                        className="hover:bg-blue-50"
                      >
                        ✏️ Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            🗑️ Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Doctor</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{doctor.name}"? This action cannot be undone.
                              All patient visits associated with this doctor may be affected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(doctor.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
            <DialogDescription>
              Update the doctor profile details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Doctor Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Dr. Sarah Johnson"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateDoctorInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-contact">Contact Number *</Label>
              <Input
                id="edit-contact"
                placeholder="e.g., +92 300 1234567"
                value={formData.contactNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateDoctorInput) => ({ ...prev, contactNumber: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-location">Location *</Label>
              <Select value={formData.locationId.toString()} onValueChange={(value) => 
                setFormData((prev: CreateDoctorInput) => ({ ...prev, locationId: parseInt(value) }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location: Location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-timings">Working Hours *</Label>
              <Input
                id="edit-timings"
                placeholder="e.g., Mon-Fri 9 AM - 5 PM"
                value={formData.timings}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateDoctorInput) => ({ ...prev, timings: e.target.value }))
                }
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? 'Updating...' : 'Update Doctor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}