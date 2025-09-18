import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, doctorsTable, patientsTable, visitsTable } from '../db/schema';
import { type UpdateVisitInput } from '../schema';
import { updateVisit } from '../handlers/update_visit';
import { eq } from 'drizzle-orm';

describe('updateVisit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let locationId: number;
  let doctorId: number;
  let patientId: number;
  let visitId: number;

  beforeEach(async () => {
    // Create test location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Test St'
      })
      .returning()
      .execute();
    locationId = locationResult[0].id;

    // Create test doctor
    const doctorResult = await db.insert(doctorsTable)
      .values({
        name: 'Dr. Test',
        contactNumber: '123-456-7890',
        locationId: locationId,
        timings: '9 AM - 5 PM'
      })
      .returning()
      .execute();
    doctorId = doctorResult[0].id;

    // Create test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        patientId: 'P001',
        cnic: '12345-1234567-1',
        phone: '0300-1234567',
        name: 'Test Patient'
      })
      .returning()
      .execute();
    patientId = patientResult[0].id;

    // Create test visit
    const visitResult = await db.insert(visitsTable)
      .values({
        patientId: patientId,
        doctorId: doctorId,
        visitDate: new Date('2024-01-01'),
        symptoms: 'Original symptoms',
        diagnosis: 'Original diagnosis',
        prescription: 'Original prescription',
        notes: 'Original notes',
        followUpDate: new Date('2024-01-15')
      })
      .returning()
      .execute();
    visitId = visitResult[0].id;
  });

  it('should update all visit fields', async () => {
    const updateInput: UpdateVisitInput = {
      id: visitId,
      patientId: patientId,
      doctorId: doctorId,
      visitDate: new Date('2024-01-02'),
      symptoms: 'Updated symptoms',
      diagnosis: 'Updated diagnosis',
      prescription: 'Updated prescription',
      notes: 'Updated notes',
      followUpDate: new Date('2024-01-20')
    };

    const result = await updateVisit(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(visitId);
    expect(result!.patientId).toEqual(patientId);
    expect(result!.doctorId).toEqual(doctorId);
    expect(result!.visitDate).toEqual(new Date('2024-01-02'));
    expect(result!.symptoms).toEqual('Updated symptoms');
    expect(result!.diagnosis).toEqual('Updated diagnosis');
    expect(result!.prescription).toEqual('Updated prescription');
    expect(result!.notes).toEqual('Updated notes');
    expect(result!.followUpDate).toEqual(new Date('2024-01-20'));
  });

  it('should update only specific fields', async () => {
    const updateInput: UpdateVisitInput = {
      id: visitId,
      symptoms: 'Updated symptoms only',
      diagnosis: 'Updated diagnosis only'
    };

    const result = await updateVisit(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(visitId);
    expect(result!.symptoms).toEqual('Updated symptoms only');
    expect(result!.diagnosis).toEqual('Updated diagnosis only');
    expect(result!.prescription).toEqual('Original prescription'); // Should remain unchanged
    expect(result!.notes).toEqual('Original notes'); // Should remain unchanged
  });

  it('should set nullable fields to null', async () => {
    const updateInput: UpdateVisitInput = {
      id: visitId,
      notes: null,
      followUpDate: null
    };

    const result = await updateVisit(updateInput);

    expect(result).toBeDefined();
    expect(result!.notes).toBeNull();
    expect(result!.followUpDate).toBeNull();
  });

  it('should update visit in database', async () => {
    const updateInput: UpdateVisitInput = {
      id: visitId,
      symptoms: 'Database test symptoms',
      diagnosis: 'Database test diagnosis'
    };

    await updateVisit(updateInput);

    // Verify in database
    const visits = await db.select()
      .from(visitsTable)
      .where(eq(visitsTable.id, visitId))
      .execute();

    expect(visits).toHaveLength(1);
    expect(visits[0].symptoms).toEqual('Database test symptoms');
    expect(visits[0].diagnosis).toEqual('Database test diagnosis');
  });

  it('should return null for non-existent visit', async () => {
    const updateInput: UpdateVisitInput = {
      id: 99999,
      symptoms: 'Test symptoms'
    };

    const result = await updateVisit(updateInput);

    expect(result).toBeNull();
  });

  it('should validate patient exists when updating patientId', async () => {
    const updateInput: UpdateVisitInput = {
      id: visitId,
      patientId: 99999,
      symptoms: 'Test symptoms'
    };

    await expect(updateVisit(updateInput)).rejects.toThrow(/Patient with id 99999 does not exist/i);
  });

  it('should validate doctor exists when updating doctorId', async () => {
    const updateInput: UpdateVisitInput = {
      id: visitId,
      doctorId: 99999,
      symptoms: 'Test symptoms'
    };

    await expect(updateVisit(updateInput)).rejects.toThrow(/Doctor with id 99999 does not exist/i);
  });

  it('should allow updating to different valid patient and doctor', async () => {
    // Create another patient and doctor
    const newPatientResult = await db.insert(patientsTable)
      .values({
        patientId: 'P002',
        cnic: '12345-1234567-2',
        name: 'Another Patient'
      })
      .returning()
      .execute();

    const newDoctorResult = await db.insert(doctorsTable)
      .values({
        name: 'Dr. Another',
        contactNumber: '987-654-3210',
        locationId: locationId,
        timings: '10 AM - 6 PM'
      })
      .returning()
      .execute();

    const updateInput: UpdateVisitInput = {
      id: visitId,
      patientId: newPatientResult[0].id,
      doctorId: newDoctorResult[0].id,
      symptoms: 'Transfer test symptoms'
    };

    const result = await updateVisit(updateInput);

    expect(result).toBeDefined();
    expect(result!.patientId).toEqual(newPatientResult[0].id);
    expect(result!.doctorId).toEqual(newDoctorResult[0].id);
    expect(result!.symptoms).toEqual('Transfer test symptoms');
  });

  it('should handle date updates correctly', async () => {
    const newVisitDate = new Date('2024-06-15T10:30:00Z');
    const newFollowUpDate = new Date('2024-06-30T14:00:00Z');

    const updateInput: UpdateVisitInput = {
      id: visitId,
      visitDate: newVisitDate,
      followUpDate: newFollowUpDate
    };

    const result = await updateVisit(updateInput);

    expect(result).toBeDefined();
    expect(result!.visitDate).toEqual(newVisitDate);
    expect(result!.followUpDate).toEqual(newFollowUpDate);
  });
});