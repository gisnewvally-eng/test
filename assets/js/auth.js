// ------------------ auth.js (Supabase Version) ------------------

// 1️⃣ تهيئة Supabase
const SUPABASE_URL = "https://mvxjqtvmnibhxtfuufky.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JK3bRv-u0gaoduyKQFBUeg_yhKc9p5y";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------ تسجيل الدخول ------------------
async function login() {
  const email = document.getElementById("user").value.trim();
  const password = document.getElementById("pass").value;

  if(!email || !password){
    alert("أدخل البريد وكلمة المرور");
    return;
  }

  const { data: session, error } = await supabase.auth.signInWithPassword({ email, password });

  if(error){
    alert("البريد أو كلمة المرور خاطئة");
    return;
  }

  // جلب بيانات المستخدم من جدول profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if(profileError){
    alert("حدث خطأ أثناء جلب بيانات المستخدم");
    return;
  }

  // حفظ بيانات المستخدم محليًا مؤقتًا (اختياري)
  localStorage.setItem("loggedUser", JSON.stringify({ email, role: profile.role }));

  // توجيه المستخدم حسب الدور
  if(profile.role === "admin") window.location.href = "dashboard.html";
  else if(profile.role === "user") window.location.href = "user.html";
  else if(profile.role === "guest") window.location.href = "guest.html";
}

// ------------------ تسجيل الخروج ------------------
async function logout() {
  await supabase.auth.signOut();
  localStorage.removeItem("loggedUser");
  window.location.href = "index.html";
}

// ------------------ حماية الصفحات ------------------
async function protectPage() {
  const { data: { user } } = await supabase.auth.getUser();
  if(!user){
    window.location.href = "index.html";
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if(error || !profile){
    window.location.href = "index.html";
    return null;
  }

  return profile; // يحتوي على role وid
}

// ------------------ إدارة الحسابات (Admin فقط) ------------------

// جلب كل المستخدمين
async function getUsers(){
  const { data: profiles, error } = await supabase.from("profiles").select("*");
  if(error) return [];
  return profiles;
}

// إضافة مستخدم جديد
async function addUser(email, password, role){
  // تسجيل المستخدم أولاً في Auth
  const { data: user, error } = await supabase.auth.signUp({ email, password });

  if(error){
    alert("خطأ في إنشاء المستخدم: " + error.message);
    return false;
  }

  // إضافة الدور في جدول profiles
  const { error: profileError } = await supabase
    .from("profiles")
    .insert([{ id: user.user.id, role }]);

  if(profileError){
    alert("خطأ في حفظ بيانات الدور: " + profileError.message);
    return false;
  }

  return true;
}

// حذف مستخدم
async function deleteUser(userId){
  // حذف من جدول profiles
  await supabase.from("profiles").delete().eq("id", userId);
  
  // حذف من Auth (يتطلب مفتاح Admin API وليس Public Key)
  alert("لحذف المستخدم نهائياً من Supabase Auth يجب استخدام Admin API من الخادم");
}

// تعديل كلمة مرور
async function changePassword(userId, newPassword){
  // تغيير كلمة المرور يتطلب Admin API من الخادم أو إعادة تعيينها للبريد
  alert("لتغيير كلمة المرور يجب استخدام Admin API أو رابط إعادة تعيين كلمة المرور للبريد");
}

// ------------------ مثال تحميل المستخدمين في لوحة Admin ------------------
async function loadUsersList() {
  const usersListDiv = document.getElementById("usersList");
  if(!usersListDiv) return;

  const users = await getUsers();
  usersListDiv.innerHTML = "";

  users.forEach(u => {
    const div = document.createElement("div");
    div.innerHTML = `${u.id} (${u.role}) <span>`;
    div.innerHTML += `<button onclick="deleteUser('${u.id}')">حذف</button>`;
    div.innerHTML += `</span>`;
    usersListDiv.appendChild(div);
  });
}

// ------------------ مراقبة الجلسة ------------------
supabase.auth.onAuthStateChange((event, session) => {
  // يمكن استخدامه لتحديث واجهة المستخدم تلقائيًا عند تسجيل الخروج أو الدخول
  if(!session) localStorage.removeItem("loggedUser");
});
