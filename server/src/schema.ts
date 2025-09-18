import { z } from 'zod';

// Location schemas
export const locationSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string(),
});

export type Location = z.infer<typeof locationSchema>;

export const createLocationInputSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  address: z.string().min(1, "Location address is required"),
});

export type CreateLocationInput = z.infer<typeof createLocationInputSchema>;

export const updateLocationInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Location name is required").optional(),
  address: z.string().min(1, "Location address is required").optional(),
});

export type UpdateLocationInput = z.infer<typeof updateLocationInputSchema>;

// Doctor schemas
export const doctorSchema = z.object({
  id: z.number(),
  name: z.string(),
  contactNumber: z.string(),
  locationId: z.number(),
  timings: z.string(),
});

export type Doctor = z.infer<typeof doctorSchema>;

export const createDoctorInputSchema = z.object({
  name: z.string().min(1, "Doctor name is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  locationId: z.number(),
  timings: z.string().min(1, "Timings are required"),
});

export type CreateDoctorInput = z.infer<typeof createDoctorInputSchema>;

export const updateDoctorInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Doctor name is required").optional(),
  contactNumber: z.string().min(1, "Contact number is required").optional(),
  locationId: z.number().optional(),
  timings: z.string().min(1, "Timings are required").optional(),
});

export type UpdateDoctorInput = z.infer<typeof updateDoctorInputSchema>;

// Patient schemas - with constraint that either cnic or phone must be provided
export const patientSchema = z.object({
  id: z.number(),
  patientId: z.string(),
  cnic: z.string().nullable(),
  phone: z.string().nullable(),
  name: z.string().nullable(),
});

export type Patient = z.infer<typeof patientSchema>;

export const createPatientInputSchema = z.object({
  cnic: z.string().optional(),
  phone: z.string().optional(),
  name: z.string().optional(),
}).refine(
  (data) => data.cnic || data.phone,
  {
    message: "Either CNIC or phone number must be provided",
    path: ["cnic", "phone"],
  }
);

export type CreatePatientInput = z.infer<typeof createPatientInputSchema>;

export const updatePatientInputSchema = z.object({
  id: z.number(),
  cnic: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
});

export type UpdatePatientInput = z.infer<typeof updatePatientInputSchema>;

// Patient search schema
export const patientSearchInputSchema = z.object({
  query: z.string().min(1, "Search query is required"),
});

export type PatientSearchInput = z.infer<typeof patientSearchInputSchema>;

// Visit schemas
export const visitSchema = z.object({
  id: z.number(),
  patientId: z.number(),
  doctorId: z.number(),
  visitDate: z.coerce.date(),
  symptoms: z.string(),
  diagnosis: z.string(),
  prescription: z.string(),
  notes: z.string().nullable(),
  followUpDate: z.coerce.date().nullable(),
});

export type Visit = z.infer<typeof visitSchema>;

export const createVisitInputSchema = z.object({
  patientId: z.number(),
  doctorId: z.number(),
  visitDate: z.coerce.date().optional(),
  symptoms: z.string().min(1, "Symptoms are required"),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  prescription: z.string().min(1, "Prescription is required"),
  notes: z.string().optional(),
  followUpDate: z.coerce.date().optional(),
});

export type CreateVisitInput = z.infer<typeof createVisitInputSchema>;

export const updateVisitInputSchema = z.object({
  id: z.number(),
  patientId: z.number().optional(),
  doctorId: z.number().optional(),
  visitDate: z.coerce.date().optional(),
  symptoms: z.string().min(1, "Symptoms are required").optional(),
  diagnosis: z.string().min(1, "Diagnosis is required").optional(),
  prescription: z.string().min(1, "Prescription is required").optional(),
  notes: z.string().nullable().optional(),
  followUpDate: z.coerce.date().nullable().optional(),
});

export type UpdateVisitInput = z.infer<typeof updateVisitInputSchema>;

// Query schemas for getting specific records
export const getByIdInputSchema = z.object({
  id: z.number(),
});

export type GetByIdInput = z.infer<typeof getByIdInputSchema>;

export const getVisitsByPatientInputSchema = z.object({
  patientId: z.number(),
});

export type GetVisitsByPatientInput = z.infer<typeof getVisitsByPatientInputSchema>;

export const getDoctorsByLocationInputSchema = z.object({
  locationId: z.number(),
});

export type GetDoctorsByLocationInput = z.infer<typeof getDoctorsByLocationInputSchema>;