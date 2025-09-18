import { db } from '../db';
import { doctorsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { LoginInput, LoginResponse } from '../schema';

export const login = async (input: LoginInput): Promise<LoginResponse> => {
  try {
    const { username, password } = input;

    // Hardcoded authentication for superadmin
    if (username === 'admin' && password === 'password') {
      return {
        role: 'superadmin'
      };
    }

    // Hardcoded authentication for doctor
    if (username === 'doctor1' && password === 'password') {
      // Try to fetch a sample doctor from the database
      const doctors = await db.select()
        .from(doctorsTable)
        .where(eq(doctorsTable.id, 1))
        .limit(1)
        .execute();

      if (doctors.length > 0) {
        return {
          role: 'doctor',
          doctor: doctors[0]
        };
      } else {
        // If no doctor found, return error
        throw new Error('Doctor profile not found. Please contact administrator.');
      }
    }

    // Invalid credentials
    throw new Error('Invalid username or password');
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};