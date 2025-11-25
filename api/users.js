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

  // ========== GET USERS ==========
  if (req.query.action === "get-users") {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, username, name, created_at");

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ users: data });
  }

  // ========== ADD USER ==========
  if (req.query.action === "add-user" && req.method === "POST") {
    const { name, email, password, role } = req.body;

    const { data: user, error: signError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (signError) return res.status(500).json({ error: signError.message });

    await supabase.from("profiles").insert([
      {
        id: user.id,
        role,
        username: email.split("@")[0],
        name,
      },
    ]);

    return res.json({ success: true });
  }

  // ========== UPDATE USER ==========
  if (req.query.action === "update-user" && req.method === "POST") {
    const { userId, role, password } = req.body;

    if (role)
      await supabase.from("profiles").update({ role }).eq("id", userId);

    if (password)
      await supabase.auth.admin.updateUserById(userId, { password });

    return res.json({ success: true });
  }

  // ========== DELETE USER ==========
  if (req.query.action === "delete-user" && req.method === "POST") {
    const { userId } = req.body;

    await supabase.from("profiles").delete().eq("id", userId);
    await supabase.auth.admin.deleteUser(userId);

    return res.json({ success: true });
  }

  return res.status(404).json({ error: "Not found" });
}
