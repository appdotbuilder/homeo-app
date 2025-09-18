import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { visitsTable, patientsTable, doctorsTable, locationsTable } from '../db/schema';
import { type CreateVisitInput } from '../schema';
import { createVisit } from '../handlers/create_visit';
import { eq } from 'drizzle-orm';

describe('createVisit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testLocationId: number;
  let testDoctorId: number;
  let testPatientId: number;

  beforeEach(async () => {
    // Create prerequisite data for each test
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Medical Street',
      })
      .returning()
      .execute();

    testLocationId = locationResult[0].id;

    const doctorResult = await db.insert(doctorsTable)
      .values({
        name: 'Dr. Smith',
        contactNumber: '+1234567890',
        locationId: testLocationId,
        timings: '9 AM - 5 PM',
      })
      .returning()
      .execute();

    testDoctorId = doctorResult[0].id;

    const patientResult = await db.insert(patientsTable)
      .values({
        patientId: 'P001',
        cnic: '12345-6789012-3',
        phone: '+9876543210',
        name: 'John Doe',
      })
      .returning()
      .execute();

    testPatientId = patientResult[0].id;
  });

  it('should create a visit with all fields provided', async () => {
    const visitDate = new Date('2024-01-15T10:00:00Z');
    const followUpDate = new Date('2024-01-22T10:00:00Z');

    const testInput: CreateVisitInput = {
      patientId: testPatientId,
      doctorId: testDoctorId,
      visitDate: visitDate,
      symptoms: 'Fever and headache',
      diagnosis: 'Viral infection',
      prescription: 'Rest and fluids, paracetamol 500mg twice daily',
      notes: 'Patient appears tired but responsive',
      followUpDate: followUpDate,
    };

    const result = await createVisit(testInput);

    // Verify all fields are correctly set
    expect(result.patientId).toEqual(testPatientId);
    expect(result.doctorId).toEqual(testDoctorId);
    expect(result.visitDate).toEqual(visitDate);
    expect(result.symptoms).toEqual('Fever and headache');
    expect(result.diagnosis).toEqual('Viral infection');
    expect(result.prescription).toEqual('Rest and fluids, paracetamol 500mg twice daily');
    expect(result.notes).toEqual('Patient appears tired but responsive');
    expect(result.followUpDate).toEqual(followUpDate);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
  });

  it('should create a visit with minimal required fields', async () => {
    const testInput: CreateVisitInput = {
      patientId: testPatientId,
      doctorId: testDoctorId,
      symptoms: 'Cough',
      diagnosis: 'Common cold',
      prescription: 'Cough syrup',
    };

    const result = await createVisit(testInput);

    // Verify required fields
    expect(result.patientId).toEqual(testPatientId);
    expect(result.doctorId).toEqual(testDoctorId);
    expect(result.symptoms).toEqual('Cough');
    expect(result.diagnosis).toEqual('Common cold');
    expect(result.prescription).toEqual('Cough syrup');
    expect(result.notes).toBeNull();
    expect(result.followUpDate).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.visitDate).toBeInstanceOf(Date);
  });

  it('should set visitDate to current time when not provided', async () => {
    const beforeTest = new Date();

    const testInput: CreateVisitInput = {
      patientId: testPatientId,
      doctorId: testDoctorId,
      symptoms: 'Back pain',
      diagnosis: 'Muscle strain',
      prescription: 'Pain relief medication',
    };

    const result = await createVisit(testInput);
    const afterTest = new Date();

    // Verify visitDate is set to current time
    expect(result.visitDate).toBeInstanceOf(Date);
    expect(result.visitDate.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
    expect(result.visitDate.getTime()).toBeLessThanOrEqual(afterTest.getTime());
  });

  it('should save visit to database correctly', async () => {
    const testInput: CreateVisitInput = {
      patientId: testPatientId,
      doctorId: testDoctorId,
      symptoms: 'Stomach ache',
      diagnosis: 'Gastritis',
      prescription: 'Antacid medication',
      notes: 'Advised dietary changes',
    };

    const result = await createVisit(testInput);

    // Query the database to verify the visit was saved
    const visits = await db.select()
      .from(visitsTable)
      .where(eq(visitsTable.id, result.id))
      .execute();

    expect(visits).toHaveLength(1);
    const savedVisit = visits[0];
    expect(savedVisit.patientId).toEqual(testPatientId);
    expect(savedVisit.doctorId).toEqual(testDoctorId);
    expect(savedVisit.symptoms).toEqual('Stomach ache');
    expect(savedVisit.diagnosis).toEqual('Gastritis');
    expect(savedVisit.prescription).toEqual('Antacid medication');
    expect(savedVisit.notes).toEqual('Advised dietary changes');
    expect(savedVisit.visitDate).toBeInstanceOf(Date);
  });

  it('should throw error when patient does not exist', async () => {
    const nonExistentPatientId = 99999;

    const testInput: CreateVisitInput = {
      patientId: nonExistentPatientId,
      doctorId: testDoctorId,
      symptoms: 'Headache',
      diagnosis: 'Tension headache',
      prescription: 'Pain relief',
    };

    await expect(createVisit(testInput)).rejects.toThrow(/Patient with ID 99999 does not exist/i);
  });

  it('should throw error when doctor does not exist', async () => {
    const nonExistentDoctorId = 99999;

    const testInput: CreateVisitInput = {
      patientId: testPatientId,
      doctorId: nonExistentDoctorId,
      symptoms: 'Knee pain',
      diagnosis: 'Arthritis',
      prescription: 'Anti-inflammatory medication',
    };

    await expect(createVisit(testInput)).rejects.toThrow(/Doctor with ID 99999 does not exist/i);
  });

  it('should handle notes as empty string', async () => {
    const testInput: CreateVisitInput = {
      patientId: testPatientId,
      doctorId: testDoctorId,
      symptoms: 'Sore throat',
      diagnosis: 'Strep throat',
      prescription: 'Antibiotics',
      notes: '',
    };

    const result = await createVisit(testInput);

    // Empty string should be converted to null
    expect(result.notes).toBeNull();
  });

  it('should create multiple visits for same patient', async () => {
    const testInput1: CreateVisitInput = {
      patientId: testPatientId,
      doctorId: testDoctorId,
      symptoms: 'First visit symptoms',
      diagnosis: 'First diagnosis',
      prescription: 'First prescription',
    };

    const testInput2: CreateVisitInput = {
      patientId: testPatientId,
      doctorId: testDoctorId,
      symptoms: 'Second visit symptoms',
      diagnosis: 'Second diagnosis',
      prescription: 'Second prescription',
    };

    const result1 = await createVisit(testInput1);
    const result2 = await createVisit(testInput2);

    // Both visits should be created successfully
    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.patientId).toEqual(testPatientId);
    expect(result2.patientId).toEqual(testPatientId);

    // Verify both visits exist in database
    const allVisits = await db.select()
      .from(visitsTable)
      .where(eq(visitsTable.patientId, testPatientId))
      .execute();

    expect(allVisits).toHaveLength(2);
  });
});