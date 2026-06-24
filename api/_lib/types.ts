export interface Profile {
  id: string;
  phone: string;
  name: string | null;
  role: string | null;
  created_at: string;
}

export type RequestCodeResult =
  | { ok: true; devCode: string }
  | { ok: false; error: string; code: string };

export type VerifyResult =
  | { ok: true; token: string; profile: Profile }
  | { ok: false; error: string; code: string };
