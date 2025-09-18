import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, doctorsTable, patientsTable, visitsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { deleteVisit } from '../handlers/delete_visit';
import { eq } from 'drizzle-orm';

// Test helper to create prerequisite data
const createTestData = async () => {
  // Create location
  const locationResult = await db.insert(locationsTable)
    .values({
      name: 'Test Clinic',
      address: '123 Main St'
    })
    .returning()
    .execute();
  const location = locationResult[0];

  // Create doctor
  const doctorResult = await db.insert(doctorsTable)
    .values({
      name: 'Dr. Test',
      contactNumber: '123-456-7890',
      locationId: location.id,
      timings: '9 AM - 5 PM'
    })
    .returning()
    .execute();
  const doctor = doctorResult[0];

  // Create patient
  const patientResult = await db.insert(patientsTable)
    .values({
      patientId: 'P001',
      cnic: '12345-6789012-3',
      phone: '0300-1234567',
      name: 'Test Patient'
    })
    .returning()
    .execute();
  const patient = patientResult[0];

  // Create visit
  const visitResult = await db.insert(visitsTable)
    .values({
      patientId: patient.id,
      doctorId: doctor.id,
      visitDate: new Date('2024-01-01'),
      symptoms: 'Test symptoms',
      diagnosis: 'Test diagnosis',
      prescription: 'Test prescription',
      notes: 'Test notes',
      followUpDate: new Date('2024-01-15')
    })
    .returning()
    .execute();
  
  return {
    location,
    doctor,
    patient,
    visit: visitResult[0]
  };
};

describe('deleteVisit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing visit and return success true', async () => {
    const testData = await createTestData();
    const input: GetByIdInput = { id: testData.visit.id };

    const result = await deleteVisit(input);

    expect(result.success).toBe(true);

    // Verify the visit is actually deleted from database
    const visits = await db.select()
      .from(visitsTable)
      .where(eq(visitsTable.id, testData.visit.id))
      .execute();

    expect(visits).toHaveLength(0);
  });

  it('should return success false when visit does not exist', async () => {
    const input: GetByIdInput = { id: 999 }; // Non-existent ID

    const result = await deleteVisit(input);

    expect(result.success).toBe(false);
  });

  it('should not affect other visits when deleting a specific visit', async () => {
    const testData = await createTestData();
    
    // Create a second visit
    const secondVisitResult = await db.insert(visitsTable)
      .values({
        patientId: testData.patient.id,
        doctorId: testData.doctor.id,
        visitDate: new Date('2024-02-01'),
        symptoms: 'Different symptoms',
        diagnosis: 'Different diagnosis',
        prescription: 'Different prescription',
        notes: 'Different notes',
        followUpDate: new Date('2024-02-15')
      })
      .returning()
      .execute();
    const secondVisit = secondVisitResult[0];

    const input: GetByIdInput = { id: testData.visit.id };

    const result = await deleteVisit(input);

    expect(result.success).toBe(true);

    // Verify first visit is deleted
    const deletedVisits = await db.select()
      .from(visitsTable)
      .where(eq(visitsTable.id, testData.visit.id))
      .execute();
    expect(deletedVisits).toHaveLength(0);

    // Verify second visit still exists
    const remainingVisits = await db.select()
      .from(visitsTable)
      .where(eq(visitsTable.id, secondVisit.id))
      .execute();
    expect(remainingVisits).toHaveLength(1);
    expect(remainingVisits[0].symptoms).toEqual('Different symptoms');
  });

  it('should not affect patient, doctor, or location records when deleting visit', async () => {
    const testData = await createTestData();
    const input: GetByIdInput = { id: testData.visit.id };

    const result = await deleteVisit(input);

    expect(result.success).toBe(true);

    // Verify patient still exists
    const patients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, testData.patient.id))
      .execute();
    expect(patients).toHaveLength(1);

    // Verify doctor still exists
    const doctors = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.id, testData.doctor.id))
      .execute();
    expect(doctors).toHaveLength(1);

    // Verify location still exists
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, testData.location.id))
      .execute();
    expect(locations).toHaveLength(1);
  });

  it('should handle deletion of visit with minimal data', async () => {
    const testData = await createTestData();
    
    // Create a visit with minimal required fields
    const minimalVisitResult = await db.insert(visitsTable)
      .values({
        patientId: testData.patient.id,
        doctorId: testData.doctor.id,
        symptoms: 'Minimal symptoms',
        diagnosis: 'Minimal diagnosis',
        prescription: 'Minimal prescription'
      })
      .returning()
      .execute();
    const minimalVisit = minimalVisitResult[0];

    const input: GetByIdInput = { id: minimalVisit.id };

    const result = await deleteVisit(input);

    expect(result.success).toBe(true);

    // Verify the visit is deleted
    const visits = await db.select()
      .from(visitsTable)
      .where(eq(visitsTable.id, minimalVisit.id))
      .execute();
    expect(visits).toHaveLength(0);
  });
});