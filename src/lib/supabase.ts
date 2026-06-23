import { createClient } from '@supabase/supabase-js';

// Vite выставляет только переменные с префиксом VITE_ через import.meta.env.
// SUPABASE_SERVICE_ROLE_KEY намеренно НЕ включён сюда — это SPA без серверной
// стороны, поэтому service_role ключ нельзя безопасно использовать в браузере.
// Когда появится серверный слой (Edge Functions / API route), он пойдёт туда.

const url  = import.meta.env.VITE_SUPABASE_URL  as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anon) {
  throw new Error(
    '[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. ' +
    'Check .env.local (Vite requires VITE_ prefix, not NEXT_PUBLIC_).'
  );
}

export const supabase = createClient(url, anon);
