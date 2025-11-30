import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
  );

  // ========== GET TEAM ==========
  if (req.query.action === "get-team") {
    const { data, error } = await supabase
      .from("team")
      .select("*")
      .order("id");

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ team: data });
  }

  // ========== ADD MEMBER ==========
  if (req.query.action === "add-member" && req.method === "POST") {
    const { name, image_url } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const { data, error } = await supabase
      .from("team")
      .insert({ name, image_url })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, member: data });
  }

  // ========== UPDATE MEMBER ==========
  if (req.query.action === "update-member" && req.method === "POST") {
    const { id, name, image_url } = req.body;
    if (!id || !name) return res.status(400).json({ error: "ID and Name required" });

    const { data, error } = await supabase
      .from("team")
      .update({ name, image_url })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, member: data });
  }

  // ========== DELETE MEMBER ==========
  if (req.query.action === "delete-member" && req.method === "POST") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "ID is required" });

    const { error } = await supabase.from("team").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(404).json({ error: "Not found" });
}
