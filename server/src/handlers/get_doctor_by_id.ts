import { type GetByIdInput, type Doctor } from '../schema';

export async function getDoctorById(input: GetByIdInput): Promise<Doctor | null> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is fetching a specific doctor by their ID from the database.
  // It should return a single doctor record or null if not found.
  return Promise.resolve({
    id: input.id,
    name: "Placeholder Doctor",
    contactNumber: "000-000-0000",
    locationId: 1,
    timings: "Mon-Fri 9 AM - 5 PM",
  } as Doctor);
}