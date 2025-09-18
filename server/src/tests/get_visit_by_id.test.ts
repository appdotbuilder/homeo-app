import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, doctorsTable, patientsTable, visitsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { getVisitById } from '../handlers/get_visit_by_id';

// Test input
const testInput: GetByIdInput = {
  id: 1
};

describe('getVisitById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a visit when found', async () => {
    // Create prerequisite data
    const [location] = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Test Street'
      })
      .returning()
      .execute();

    const [doctor] = await db.insert(doctorsTable)
      .values({
        name: 'Dr. Smith',
        contactNumber: '+1234567890',
        locationId: location.id,
        timings: '9AM-5PM'
      })
      .returning()
      .execute();

    const [patient] = await db.insert(patientsTable)
      .values({
        patientId: 'P001',
        cnic: '12345-6789012-3',
        phone: '+1987654321',
        name: 'John Doe'
      })
      .returning()
      .execute();

    const visitDate = new Date('2023-12-01T10:00:00Z');
    const followUpDate = new Date('2023-12-15T10:00:00Z');

    const [visit] = await db.insert(visitsTable)
      .values({
        patientId: patient.id,
        doctorId: doctor.id,
        visitDate: visitDate,
        symptoms: 'Fever and cough',
        diagnosis: 'Common cold',
        prescription: 'Rest and fluids',
        notes: 'Patient should return if symptoms worsen',
        followUpDate: followUpDate
      })
      .returning()
      .execute();

    const result = await getVisitById({ id: visit.id });

    expect(result).not.toBeNull();
    expect(result!.id).toBe(visit.id);
    expect(result!.patientId).toBe(patient.id);
    expect(result!.doctorId).toBe(doctor.id);
    expect(result!.visitDate).toEqual(visitDate);
    expect(result!.symptoms).toBe('Fever and cough');
    expect(result!.diagnosis).toBe('Common cold');
    expect(result!.prescription).toBe('Rest and fluids');
    expect(result!.notes).toBe('Patient should return if symptoms worsen');
    expect(result!.followUpDate).toEqual(followUpDate);
  });

  it('should return visit with nullable fields as null', async () => {
    // Create prerequisite data
    const [location] = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Test Street'
      })
      .returning()
      .execute();

    const [doctor] = await db.insert(doctorsTable)
      .values({
        name: 'Dr. Smith',
        contactNumber: '+1234567890',
        locationId: location.id,
        timings: '9AM-5PM'
      })
      .returning()
      .execute();

    const [patient] = await db.insert(patientsTable)
      .values({
        patientId: 'P001',
        cnic: '12345-6789012-3',
        phone: null,
        name: null
      })
      .returning()
      .execute();

    const [visit] = await db.insert(visitsTable)
      .values({
        patientId: patient.id,
        doctorId: doctor.id,
        visitDate: new Date('2023-12-01T10:00:00Z'),
        symptoms: 'Headache',
        diagnosis: 'Tension headache',
        prescription: 'Paracetamol',
        notes: null,
        followUpDate: null
      })
      .returning()
      .execute();

    const result = await getVisitById({ id: visit.id });

    expect(result).not.toBeNull();
    expect(result!.id).toBe(visit.id);
    expect(result!.notes).toBeNull();
    expect(result!.followUpDate).toBeNull();
    expect(result!.symptoms).toBe('Headache');
    expect(result!.diagnosis).toBe('Tension headache');
    expect(result!.prescription).toBe('Paracetamol');
  });

  it('should return null when visit not found', async () => {
    const result = await getVisitById({ id: 999 });

    expect(result).toBeNull();
  });

  it('should return null for non-existent visit ID', async () => {
    // Create some data but query for a different ID
    const [location] = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Test Street'
      })
      .returning()
      .execute();

    const [doctor] = await db.insert(doctorsTable)
      .values({
        name: 'Dr. Smith',
        contactNumber: '+1234567890',
        locationId: location.id,
        timings: '9AM-5PM'
      })
      .returning()
      .execute();

    const [patient] = await db.insert(patientsTable)
      .values({
        patientId: 'P001',
        cnic: '12345-6789012-3',
        phone: '+1987654321',
        name: 'John Doe'
      })
      .returning()
      .execute();

    await db.insert(visitsTable)
      .values({
        patientId: patient.id,
        doctorId: doctor.id,
        visitDate: new Date('2023-12-01T10:00:00Z'),
        symptoms: 'Fever',
        diagnosis: 'Flu',
        prescription: 'Antiviral medication',
        notes: 'Test notes',
        followUpDate: null
      })
      .returning()
      .execute();

    // Query for a different visit ID
    const result = await getVisitById({ id: 888 });

    expect(result).toBeNull();
  });

  it('should handle visits with default timestamp values correctly', async () => {
    // Create prerequisite data
    const [location] = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Test Street'
      })
      .returning()
      .execute();

    const [doctor] = await db.insert(doctorsTable)
      .values({
        name: 'Dr. Smith',
        contactNumber: '+1234567890',
        locationId: location.id,
        timings: '9AM-5PM'
      })
      .returning()
      .execute();

    const [patient] = await db.insert(patientsTable)
      .values({
        patientId: 'P001',
        cnic: '12345-6789012-3',
        phone: '+1987654321',
        name: 'John Doe'
      })
      .returning()
      .execute();

    // Insert visit without specifying visitDate (should use default)
    const [visit] = await db.insert(visitsTable)
      .values({
        patientId: patient.id,
        doctorId: doctor.id,
        symptoms: 'Back pain',
        diagnosis: 'Muscle strain',
        prescription: 'Physical therapy'
      })
      .returning()
      .execute();

    const result = await getVisitById({ id: visit.id });

    expect(result).not.toBeNull();
    expect(result!.visitDate).toBeInstanceOf(Date);
    expect(result!.visitDate.getTime()).toBeCloseTo(Date.now(), -10000); // Within 10 seconds
    expect(result!.symptoms).toBe('Back pain');
    expect(result!.diagnosis).toBe('Muscle strain');
    expect(result!.prescription).toBe('Physical therapy');
  });
});