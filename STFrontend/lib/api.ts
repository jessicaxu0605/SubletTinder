const BASE_URL = 'http://127.0.0.1:8000'; // Change to your backend URL if needed

export async function apiGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost(path: string, data: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPut(path: string, data?: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Authentication API functions
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  profile_photo?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  profile_photo?: string;
}

export async function loginUser(data: LoginData): Promise<User> {
  return apiPost('/login', data);
}

export async function signupUser(data: SignupData): Promise<{ message: string; id: number }> {
  return apiPost('/signup', data);
} 

export async function fetchListingIds(userId: number): Promise<number[]> {
  try {
    const data = await apiGet(`/users/${userId}/listings`);
    console.log(data)
    return data.listing_ids ?? [];
  } catch (error: any) {
    throw error;
  }
}

export async function fetchRenterProfileId(userId: number): Promise<number | null> {
  try {
    const res = await fetch(`${BASE_URL}/users/${userId}/renter_profile`);

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    const data = await res.json();
    return data.renter_profile_id ?? null;
  } catch (error) {
    console.error("Error fetching renter profile ID:", error);
    throw error;
  }
}
