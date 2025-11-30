// api/visits.js
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // إعداد Supabase باستخدام Service Role (آمن في الخادم فقط)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
  );

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ========== GET VISITS ==========
  if (req.query.action === "get-visits") {
    try {
      const { data, error } = await supabase
        .from("visits")  // اسم جدول الزيارات
        .select("user_id, created_at");

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ visits: data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(404).json({ error: "Not found" });
}
