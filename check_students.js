import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const profRes = await supabase.from("profiles").select("id, department_id, enrollment_year, full_name");
  console.log("ALL PROFILES:", profRes.data);
  
  if (profRes.data && profRes.data.length > 0) {
    const p = profRes.data.find(x => x.department_id && x.enrollment_year);
    if (p) {
      console.log("TESTING QUERY FOR:", p.department_id, p.enrollment_year);
      const { data, error } = await supabase
        .from("profiles")
        .select("*, student_grades(count)")
        .eq("department_id", p.department_id)
        .eq("enrollment_year", p.enrollment_year);
      console.log("RESULT:", data, "ERROR:", error);
    }
  }
}
test();
