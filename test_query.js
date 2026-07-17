import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const profRes = await supabase.from("profiles").select("id, department_id, enrollment_year").not("department_id", "is", null).not("enrollment_year", "is", null);
  console.log("Profiles Error:", profRes.error);
  console.log("Profiles Count:", profRes.data ? profRes.data.length : null);
}
test();
