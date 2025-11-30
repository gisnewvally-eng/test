// api/visits.js
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // التحقق من وجود Environment Variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
      console.error("❌ Missing Supabase environment variables");
      return res.status(500).json({ error: "Supabase env variables not set" });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    );

    // تحقق من action
    if (req.query.action === "get-visits") {
      const { data, error } = await supabase
        .from("visits") // تأكد أن هذا هو اسم الجدول الصحيح
        .select("user_id, created_at");

      if (error) {
        console.error("❌ Supabase query error:", error);
        return res.status(500).json({ error: error.message });
      }

      if (!data) {
        console.warn("⚠️ No visits data returned from Supabase");
        return res.status(200).json({ visits: [] });
      }

      return res.status(200).json({ visits: data });
    }

    return res.status(404).json({ error: "Action not found" });
  } catch (err) {
    console.error("❌ Unexpected server error:", err);
    return res.status(500).json({ error: err.message });
  }
}
