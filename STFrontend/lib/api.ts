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

export async function apiPatch(path: string, data?: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
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