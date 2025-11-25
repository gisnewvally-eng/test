const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// ---- Supabase Service Role Key ----
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// ---- Helpers ----
function handleError(res, error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
}

// ---- Add User ----
app.post("/add-user", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if(!name || !email || !password || !role) 
            return res.status(400).json({ error: "جميع الحقول مطلوبة" });

        const { data: user, error: signUpError } = await supabase.auth.admin.createUser({
            email, password, email_confirm: true
        });
        if(signUpError) return handleError(res, signUpError);

        const { error: profileError } = await supabase
            .from("profiles")
            .insert([{ id: user.id, role, username: email.split("@")[0], name }]);
        if(profileError) return handleError(res, profileError);

        return res.json({ success: true, user });
    } catch (error) {
        return handleError(res, error);
    }
});

// ---- Delete User ----
app.post("/delete-user", async (req, res) => {
    try {
        const { userId } = req.body;
        if(!userId) return res.status(400).json({ error: "userId مطلوب" });

        // حذف من جدول profiles
        await supabase.from("profiles").delete().eq("id", userId);
        await supabase.from("visits").delete().eq("user_id", userId);

        // حذف من Auth
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if(error) return handleError(res, error);

        return res.json({ success: true });
    } catch (error) {
        return handleError(res, error);
    }
});

// ---- Update User Role / Password ----
app.post("/update-user", async (req, res) => {
    try {
        const { userId, role, password } = req.body;
        if(!userId) return res.status(400).json({ error: "userId مطلوب" });

        if(role){
            const { error: roleError } = await supabase
                .from("profiles")
                .update({ role })
                .eq("id", userId);
            if(roleError) return handleError(res, roleError);
        }

        if(password){
            const { error: pwdError } = await supabase.auth.admin.updateUserById(userId, { password });
            if(pwdError) return handleError(res, pwdError);
        }

        return res.json({ success: true });
    } catch (error) {
        return handleError(res, error);
    }
});

// ---- Get All Users ----
app.get("/get-users", async (req, res) => {
    try {
        const { data: users, error } = await supabase.from("profiles").select("id, role, username, name, created_at");
        if(error) return handleError(res, error);
        return res.json({ users });
    } catch (error) {
        return handleError(res, error);
    }
});

// ---- Start Server ----
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Supabase Admin API running on port ${port}`));

module.exports = app;
