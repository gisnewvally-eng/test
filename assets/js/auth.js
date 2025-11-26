// ------------------ auth.js ------------------

// 1️⃣ تهيئة Supabase
const SUPABASE_URL = "https://mvxjqtvmnibhxtfuufky.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12eGpxdHZtbmliaHh0ZnV1Zmt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NDU0NDAsImV4cCI6MjA3OTQyMTQ0MH0.P_s2APZULn9VLrEoyttWBsT-TR9Vf9J5WM-DFwjmWb0";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2️⃣ رابط السيرفر الحقيقي
const SERVER_API = "https://supabase-admin-api-xi.vercel.app/api/users";

// ------------------ روابط الصور ------------------
const mapImages = {
  "سكنية": "https://mvxjqtvmnibhxtfuufky.supabase.co/storage/v1/object/public/map-type-images/images/residential.png",
  "صناعية": "https://mvxjqtvmnibhxtfuufky.supabase.co/storage/v1/object/public/map-type-images/images/industrial.png",
  "تجارية": "https://mvxjqtvmnibhxtfuufky.supabase.co/storage/v1/object/public/map-type-images/images/commercial.png",
  "خدمية": "https://mvxjqtvmnibhxtfuufky.supabase.co/storage/v1/object/public/map-type-images/images/services.png",
  "logo": "https://mvxjqtvmnibhxtfuufky.supabase.co/storage/v1/object/public/map-type-images/images/logo.png"
};

// ------------------ تسجيل الدخول ------------------
async function login(email, password) {
  if (!email || !password) {
    alert("أدخل البريد وكلمة المرور");
    return;
  }

  const { data: session, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("البريد أو كلمة المرور خاطئة");
    return;
  }

  const user = session.user;

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("role, name, username")
    .eq("id", user.id)
    .single();

  localStorage.setItem("sessionUser", JSON.stringify({
    id: user.id,
    email: user.email,
    role: profile.role,
    name: profile.name || profile.username
  }));

  if (profile.role === "admin") window.location.href = "dashboard.html";
  else if (profile.role === "user") window.location.href = "user.html";
  else window.location.href = "guest.html";
}

// ------------------ الخروج ------------------
async function logout() {
  await supabaseClient.auth.signOut();
  localStorage.removeItem("sessionUser");
  window.location.href = "index.html";
}

// ------------------ حماية الصفحات ------------------
async function protectPage() {
  const { data } = await supabaseClient.auth.getUser();
  if (!data.user) {
    window.location.href = "index.html";
    return;
  }
}

// ------------------ إدارة المستخدمين عبر السيرفر ------------------

// ✔️ get-users
async function getUsers() {
  try {
    const res = await fetch(`${SERVER_API}?action=get-users`);
    const data = await res.json();
    return data.users || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

// ✔️ add-user
async function addUser(name, email, password, role) {
  try {
    const res = await fetch(`${SERVER_API}?action=add-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await res.json();
    return data.success || false;

  } catch (err) {
    console.error(err);
    alert("خطأ في الاتصال بالسيرفر");
    return false;
  }
}

// ✔️ delete-user
async function deleteUser(userId) {
  try {
    const res = await fetch(`${SERVER_API}?action=delete-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();
    return data.success || false;

  } catch (err) {
    console.error(err);
    alert("خطأ في الاتصال بالسيرفر");
    return false;
  }
}

// ✔️ update-user
async function updateUserRole(userId, role) {
  try {
    const res = await fetch(`${SERVER_API}?action=update-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role })
    });

    const data = await res.json();
    return data.success || false;

  } catch (err) {
    console.error(err);
    alert("خطأ في الاتصال بالسيرفر");
    return false;
  }
}

async function updateUserPassword(userId, password) {
  try {
    const res = await fetch(`${SERVER_API}?action=update-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password })
    });

    const data = await res.json();
    return data.success || false;

  } catch (err) {
    console.error(err);
    alert("خطأ في الاتصال بالسيرفر");
    return false;
  }
}

// ----------------------------------------------------
window.login = login;
window.logout = logout;
window.protectPage = protectPage;

window.getUsers = getUsers;
window.addUser = addUser;
window.deleteUser = deleteUser;
window.updateUserRole = updateUserRole;
window.updateUserPassword = updateUserPassword;

window.mapImages = mapImages;
