import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, doctorsTable, patientsTable, visitsTable } from '../db/schema';
import { type GetVisitsByPatientInput } from '../schema';
import { getVisitsByPatient } from '../handlers/get_visits_by_patient';

describe('getVisitsByPatient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return visits for a specific patient ordered by date descending', async () => {
    // Create test location
    const location = await db.insert(locationsTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St'
      })
      .returning()
      .execute();

    // Create test doctor
    const doctor = await db.insert(doctorsTable)
      .values({
        name: 'Dr. Smith',
        contactNumber: '123-456-7890',
        locationId: location[0].id,
        timings: '9AM-5PM'
      })
      .returning()
      .execute();

    // Create test patient
    const patient = await db.insert(patientsTable)
      .values({
        patientId: 'P001',
        cnic: '12345-1234567-1',
        phone: '555-0123',
        name: 'John Doe'
      })
      .returning()
      .execute();

    // Create visits with different dates
    const visit1Date = new Date('2024-01-01');
    const visit2Date = new Date('2024-01-15');
    const visit3Date = new Date('2024-01-30');

    const visit1 = await db.insert(visitsTable)
      .values({
        patientId: patient[0].id,
        doctorId: doctor[0].id,
        visitDate: visit1Date,
        symptoms: 'Headache',
        diagnosis: 'Tension headache',
        prescription: 'Aspirin',
        notes: 'Follow up in 2 weeks',
        followUpDate: new Date('2024-01-15')
      })
      .returning()
      .execute();

    const visit2 = await db.insert(visitsTable)
      .values({
        patientId: patient[0].id,
        doctorId: doctor[0].id,
        visitDate: visit2Date,
        symptoms: 'Fever',
        diagnosis: 'Viral infection',
        prescription: 'Rest and fluids',
        notes: null,
        followUpDate: null
      })
      .returning()
      .execute();

    const visit3 = await db.insert(visitsTable)
      .values({
        patientId: patient[0].id,
        doctorId: doctor[0].id,
        visitDate: visit3Date,
        symptoms: 'Cough',
        diagnosis: 'Bronchitis',
        prescription: 'Cough syrup',
        notes: 'Improving',
        followUpDate: new Date('2024-02-15')
      })
      .returning()
      .execute();

    const input: GetVisitsByPatientInput = {
      patientId: patient[0].id
    };

    const result = await getVisitsByPatient(input);

    // Should return all 3 visits
    expect(result).toHaveLength(3);

    // Should be ordered by visit date descending (most recent first)
    expect(result[0].id).toBe(visit3[0].id); // 2024-01-30
    expect(result[1].id).toBe(visit2[0].id); // 2024-01-15
    expect(result[2].id).toBe(visit1[0].id); // 2024-01-01

    // Verify visit data structure
    expect(result[0]).toEqual({
      id: visit3[0].id,
      patientId: patient[0].id,
      doctorId: doctor[0].id,
      visitDate: visit3Date,
      symptoms: 'Cough',
      diagnosis: 'Bronchitis',
      prescription: 'Cough syrup',
      notes: 'Improving',
      followUpDate: new Date('2024-02-15')
    });
  });

  it('should return empty array for patient with no visits', async () => {
    // Create test location, doctor, and patient but no visits
    const location = await db.insert(locationsTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St'
      })
      .returning()
      .execute();

    const doctor = await db.insert(doctorsTable)
      .values({
        name: 'Dr. Smith',
        contactNumber: '123-456-7890',
        locationId: location[0].id,
        timings: '9AM-5PM'
      })
      .returning()
      .execute();

    const patient = await db.insert(patientsTable)
      .values({
        patientId: 'P001',
        cnic: '12345-1234567-1',
        phone: '555-0123',
        name: 'John Doe'
      })
      .returning()
      .execute();

    const input: GetVisitsByPatientInput = {
      patientId: patient[0].id
    };

    const result = await getVisitsByPatient(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent patient', async () => {
    const input: GetVisitsByPatientInput = {
      patientId: 99999 // Non-existent patient ID
    };

    const result = await getVisitsByPatient(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle visits with nullable fields correctly', async () => {
    // Create test location
    const location = await db.insert(locationsTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St'
      })
      .returning()
      .execute();

    // Create test doctor
    const doctor = await db.insert(doctorsTable)
      .values({
        name: 'Dr. Smith',
        contactNumber: '123-456-7890',
        locationId: location[0].id,
        timings: '9AM-5PM'
      })
      .returning()
      .execute();

    // Create test patient
    const patient = await db.insert(patientsTable)
      .values({
        patientId: 'P001',
        cnic: '12345-1234567-1',
        phone: '555-0123',
        name: 'John Doe'
      })
      .returning()
      .execute();

    // Create visit with null notes and followUpDate
    const visitDate = new Date('2024-01-01');
    const visit = await db.insert(visitsTable)
      .values({
        patientId: patient[0].id,
        doctorId: doctor[0].id,
        visitDate: visitDate,
        symptoms: 'Headache',
        diagnosis: 'Tension headache',
        prescription: 'Aspirin',
        notes: null,
        followUpDate: null
      })
      .returning()
      .execute();

    const input: GetVisitsByPatientInput = {
      patientId: patient[0].id
    };

    const result = await getVisitsByPatient(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: visit[0].id,
      patientId: patient[0].id,
      doctorId: doctor[0].id,
      visitDate: visitDate,
      symptoms: 'Headache',
      diagnosis: 'Tension headache',
      prescription: 'Aspirin',
      notes: null,
      followUpDate: null
    });
  });

  it('should only return visits for the specified patient', async () => {
    // Create test location
    const location = await db.insert(locationsTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St'
      })
      .returning()
      .execute();

    // Create test doctor
    const doctor = await db.insert(doctorsTable)
      .values({
        name: 'Dr. Smith',
        contactNumber: '123-456-7890',
        locationId: location[0].id,
        timings: '9AM-5PM'
      })
      .returning()
      .execute();

    // Create two patients
    const patient1 = await db.insert(patientsTable)
      .values({
        patientId: 'P001',
        cnic: '12345-1234567-1',
        phone: '555-0123',
        name: 'John Doe'
      })
      .returning()
      .execute();

    const patient2 = await db.insert(patientsTable)
      .values({
        patientId: 'P002',
        cnic: '12345-1234567-2',
        phone: '555-0124',
        name: 'Jane Doe'
      })
      .returning()
      .execute();

    // Create visits for both patients
    const visit1 = await db.insert(visitsTable)
      .values({
        patientId: patient1[0].id,
        doctorId: doctor[0].id,
        visitDate: new Date('2024-01-01'),
        symptoms: 'Patient 1 symptoms',
        diagnosis: 'Patient 1 diagnosis',
        prescription: 'Patient 1 prescription',
        notes: 'Patient 1 notes',
        followUpDate: null
      })
      .returning()
      .execute();

    await db.insert(visitsTable)
      .values({
        patientId: patient2[0].id,
        doctorId: doctor[0].id,
        visitDate: new Date('2024-01-02'),
        symptoms: 'Patient 2 symptoms',
        diagnosis: 'Patient 2 diagnosis',
        prescription: 'Patient 2 prescription',
        notes: 'Patient 2 notes',
        followUpDate: null
      })
      .returning()
      .execute();

    const input: GetVisitsByPatientInput = {
      patientId: patient1[0].id
    };

    const result = await getVisitsByPatient(input);

    // Should only return visits for patient 1
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(visit1[0].id);
    expect(result[0].patientId).toBe(patient1[0].id);
    expect(result[0].symptoms).toBe('Patient 1 symptoms');
  });
});