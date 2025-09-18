import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, doctorsTable, patientsTable, visitsTable } from '../db/schema';
import { getVisits } from '../handlers/get_visits';

describe('getVisits', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no visits exist', async () => {
    const result = await getVisits();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all visits when they exist', async () => {
    // Create prerequisite data
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Test Street'
      })
      .returning()
      .execute();

    const doctorResult = await db.insert(doctorsTable)
      .values({
        name: 'Dr. Test',
        contactNumber: '123-456-7890',
        locationId: locationResult[0].id,
        timings: '9 AM - 5 PM'
      })
      .returning()
      .execute();

    const patientResult = await db.insert(patientsTable)
      .values({
        patientId: 'PAT001',
        cnic: '12345-6789012-3',
        phone: '0300-1234567',
        name: 'Test Patient'
      })
      .returning()
      .execute();

    // Create test visits
    const visitDate1 = new Date('2024-01-15T10:30:00Z');
    const followUpDate1 = new Date('2024-01-22T10:30:00Z');
    const visitDate2 = new Date('2024-01-20T14:15:00Z');

    await db.insert(visitsTable)
      .values([
        {
          patientId: patientResult[0].id,
          doctorId: doctorResult[0].id,
          visitDate: visitDate1,
          symptoms: 'Headache and fever',
          diagnosis: 'Viral infection',
          prescription: 'Paracetamol 500mg',
          notes: 'Patient recovering well',
          followUpDate: followUpDate1
        },
        {
          patientId: patientResult[0].id,
          doctorId: doctorResult[0].id,
          visitDate: visitDate2,
          symptoms: 'Cough and sore throat',
          diagnosis: 'Common cold',
          prescription: 'Rest and fluids',
          notes: null,
          followUpDate: null
        }
      ])
      .execute();

    const result = await getVisits();

    expect(result).toHaveLength(2);
    expect(Array.isArray(result)).toBe(true);

    // Verify first visit
    const visit1 = result.find(v => v.symptoms === 'Headache and fever');
    expect(visit1).toBeDefined();
    expect(visit1?.patientId).toEqual(patientResult[0].id);
    expect(visit1?.doctorId).toEqual(doctorResult[0].id);
    expect(visit1?.visitDate).toBeInstanceOf(Date);
    expect(visit1?.diagnosis).toEqual('Viral infection');
    expect(visit1?.prescription).toEqual('Paracetamol 500mg');
    expect(visit1?.notes).toEqual('Patient recovering well');
    expect(visit1?.followUpDate).toBeInstanceOf(Date);

    // Verify second visit
    const visit2 = result.find(v => v.symptoms === 'Cough and sore throat');
    expect(visit2).toBeDefined();
    expect(visit2?.patientId).toEqual(patientResult[0].id);
    expect(visit2?.doctorId).toEqual(doctorResult[0].id);
    expect(visit2?.visitDate).toBeInstanceOf(Date);
    expect(visit2?.diagnosis).toEqual('Common cold');
    expect(visit2?.prescription).toEqual('Rest and fluids');
    expect(visit2?.notes).toBeNull();
    expect(visit2?.followUpDate).toBeNull();
  });

  it('should handle multiple visits from different patients and doctors', async () => {
    // Create multiple locations, doctors, and patients
    const locationResults = await db.insert(locationsTable)
      .values([
        { name: 'Hospital A', address: '123 Main St' },
        { name: 'Clinic B', address: '456 Oak Ave' }
      ])
      .returning()
      .execute();

    const doctorResults = await db.insert(doctorsTable)
      .values([
        {
          name: 'Dr. Smith',
          contactNumber: '111-111-1111',
          locationId: locationResults[0].id,
          timings: '8 AM - 4 PM'
        },
        {
          name: 'Dr. Johnson',
          contactNumber: '222-222-2222',
          locationId: locationResults[1].id,
          timings: '10 AM - 6 PM'
        }
      ])
      .returning()
      .execute();

    const patientResults = await db.insert(patientsTable)
      .values([
        {
          patientId: 'PAT001',
          cnic: '11111-1111111-1',
          name: 'Patient One'
        },
        {
          patientId: 'PAT002',
          phone: '0300-1111111',
          name: 'Patient Two'
        }
      ])
      .returning()
      .execute();

    // Create visits for different combinations
    await db.insert(visitsTable)
      .values([
        {
          patientId: patientResults[0].id,
          doctorId: doctorResults[0].id,
          visitDate: new Date('2024-01-10T09:00:00Z'),
          symptoms: 'Back pain',
          diagnosis: 'Muscle strain',
          prescription: 'Ibuprofen',
          notes: 'Recommended physical therapy'
        },
        {
          patientId: patientResults[1].id,
          doctorId: doctorResults[1].id,
          visitDate: new Date('2024-01-12T11:30:00Z'),
          symptoms: 'Allergic reaction',
          diagnosis: 'Food allergy',
          prescription: 'Antihistamine'
        },
        {
          patientId: patientResults[0].id,
          doctorId: doctorResults[1].id,
          visitDate: new Date('2024-01-15T15:00:00Z'),
          symptoms: 'Follow-up checkup',
          diagnosis: 'Improving condition',
          prescription: 'Continue current medication'
        }
      ])
      .execute();

    const result = await getVisits();

    expect(result).toHaveLength(3);
    
    // Verify we have visits from both doctors
    const doctorIds = [...new Set(result.map(v => v.doctorId))];
    expect(doctorIds).toHaveLength(2);
    expect(doctorIds).toContain(doctorResults[0].id);
    expect(doctorIds).toContain(doctorResults[1].id);

    // Verify we have visits from both patients
    const patientIds = [...new Set(result.map(v => v.patientId))];
    expect(patientIds).toHaveLength(2);
    expect(patientIds).toContain(patientResults[0].id);
    expect(patientIds).toContain(patientResults[1].id);

    // Verify all visits have required fields
    result.forEach(visit => {
      expect(visit.id).toBeDefined();
      expect(visit.patientId).toBeDefined();
      expect(visit.doctorId).toBeDefined();
      expect(visit.visitDate).toBeInstanceOf(Date);
      expect(visit.symptoms).toBeDefined();
      expect(visit.diagnosis).toBeDefined();
      expect(visit.prescription).toBeDefined();
      // notes and followUpDate can be null
    });
  });

  it('should preserve date types correctly', async () => {
    // Create prerequisite data
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Test Street'
      })
      .returning()
      .execute();

    const doctorResult = await db.insert(doctorsTable)
      .values({
        name: 'Dr. Test',
        contactNumber: '123-456-7890',
        locationId: locationResult[0].id,
        timings: '9 AM - 5 PM'
      })
      .returning()
      .execute();

    const patientResult = await db.insert(patientsTable)
      .values({
        patientId: 'PAT001',
        cnic: '12345-6789012-3',
        name: 'Test Patient'
      })
      .returning()
      .execute();

    const specificDate = new Date('2024-03-15T14:30:00Z');
    const specificFollowUp = new Date('2024-03-22T14:30:00Z');

    await db.insert(visitsTable)
      .values({
        patientId: patientResult[0].id,
        doctorId: doctorResult[0].id,
        visitDate: specificDate,
        symptoms: 'Test symptoms',
        diagnosis: 'Test diagnosis',
        prescription: 'Test prescription',
        followUpDate: specificFollowUp
      })
      .execute();

    const result = await getVisits();

    expect(result).toHaveLength(1);
    expect(result[0].visitDate).toBeInstanceOf(Date);
    expect(result[0].followUpDate).toBeInstanceOf(Date);
    expect(result[0].visitDate.getTime()).toEqual(specificDate.getTime());
    expect(result[0].followUpDate?.getTime()).toEqual(specificFollowUp.getTime());
  });
});