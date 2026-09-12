import { AbhaProfile } from '../types';

// Clean initial state: All test patient profiles stripped out per requirement 1.
export const DEMO_ABHA_PROFILES: AbhaProfile[] = [];

export function findAbhaProfile(query: string): AbhaProfile | null {
  const clean = query.trim().toLowerCase().replace(/[\s-]/g, '');
  if (!clean) return null;
  return DEMO_ABHA_PROFILES.find((p) => {
    const cleanId = p.abha_id.replace(/[\s-]/g, '').toLowerCase();
    const cleanAddr = p.abha_address.toLowerCase();
    return cleanId.includes(clean) || cleanAddr.includes(clean);
  }) || null;
}

export function createPatientProfile(
  name: string,
  age: number,
  gender: 'Male' | 'Female' | 'Other',
  abhaId?: string,
  mobile?: string,
  allergies?: string[],
  chronicConditions?: string[]
): AbhaProfile {
  const cleanAbha = abhaId?.trim() || `14-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const cleanName = name.trim() || 'OPD Patient';
  
  return {
    abha_id: cleanAbha,
    abha_address: `${cleanName.toLowerCase().replace(/\s+/g, '.')}${Math.floor(10 + Math.random() * 90)}@abdm`,
    name: cleanName,
    gender,
    age: Number(age) || 35,
    mobile: mobile?.trim() || '',
    is_verified: Boolean(abhaId),
    chronic_conditions: chronicConditions || [],
    past_diagnoses: [],
    known_allergies: allergies || [],
    past_medications: [],
  };
}

export function createGuestProfile(
  customName?: string,
  age?: number,
  gender?: 'Male' | 'Female' | 'Other',
  mobile?: string,
  allergies?: string[]
): AbhaProfile {
  const cleanName = customName?.trim() || 'Walk-in OPD Patient';
  return {
    abha_id: `WALKIN-${Math.floor(100000 + Math.random() * 900000)}`,
    abha_address: `${cleanName.toLowerCase().replace(/\s+/g, '.')}@abdm.local`,
    name: cleanName,
    gender: gender || 'Other',
    age: Number(age) || 35,
    mobile: mobile?.trim() || '',
    is_verified: false,
    chronic_conditions: [],
    past_diagnoses: [],
    known_allergies: allergies || [],
    past_medications: [],
  };
}
