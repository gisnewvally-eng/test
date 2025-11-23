// ------------------ auth.js (Supabase Version مصحح) ------------------

// 1️⃣ تهيئة Supabase
const SUPABASE_URL = "https://mvxjqtvmnibhxtfuufky.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JK3bRv-u0gaoduyKQFBUeg_yhKc9p5y";

// تغيير الاسم لتجنب التعارض
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------ تسجيل الدخول ------------------
async function login() {
  // ⚠️ يتم جلب القيم من DOM لأن هذا الملف سيتم استدعاؤه في login.html
  const email = document.getElementById("user").value.trim();
  const password = document.getElementById("pass").value;

  if(!email || !password){
    alert("أدخل البريد وكلمة المرور");
    return;
  }

  const { data: session, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if(error){
    alert("البريد أو كلمة المرور خاطئة");
    console.log(error);
    return;
  }
  // التحقق من وجود الجلسة والمستخدم
  if (!session || !session.user) {
     alert("فشل في إنشاء الجلسة");
     return;
  }

  // جلب بيانات المستخدم من جدول profiles
  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", session.user.id) // استخدام الـ ID لضمان الدقة
    .single();

  if(profileError){
    alert("حدث خطأ أثناء جلب بيانات المستخدم");
    console.error("Profile Error:", profileError);
    return;
  }

  // حفظ بيانات المستخدم محليًا مؤقتًا (تم تغيير الاسم لتوحيد المفتاح)
  localStorage.setItem("sessionUser", JSON.stringify({ id: session.user.id, email, role: profile.role }));

  // توجيه المستخدم حسب الدور
  if(profile.role === "admin") window.location.href = "dashboard.html";
  else if(profile.role === "user") window.location.href = "user.html";
  else if(profile.role === "guest") window.location.href = "guest.html";
  else window.location.href = "index.html"; // توجيه احتياطي
}

// ------------------ تسجيل الخروج ------------------
async function logout() {
  await supabaseClient.auth.signOut();
  // استخدام نفس مفتاح localStorage
  localStorage.removeItem("sessionUser"); 
  window.location.href = "index.html";
}

// ------------------ حماية الصفحات ------------------
async function protectPage() {
  // التحقق أولاً من حالة المستخدم في Supabase Auth
  const { data: { user } } = await supabaseClient.auth.getUser();
  
  if(!user){
    window.location.href = "index.html";
    return null;
  }

  // جلب بيانات الدور من جدول profiles
  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("id, role") // جلب فقط ما تحتاجه
    .eq("id", user.id)
    .single();

  if(error || !profile){
    // في حالة عدم العثور على بروفايل في DB، قم بتسجيل الخروج لإعادة التوجيه
    await logout(); 
    return null;
  }
  
  // حفظ بيانات الجلسة (قد تكون قد ضاعت أو لم يتم تخزينها)
  localStorage.setItem("sessionUser", JSON.stringify({ id: user.id, email: user.email, role: profile.role }));


  return profile; // يحتوي الآن على role وid
}

// ------------------ إدارة الحسابات (Admin فقط) ------------------

// جلب كل المستخدمين
async function getUsers(){
  const { data: profiles, error } = await supabaseClient.from("profiles").select("*");
  if(error) return [];
  return profiles;
}

// إضافة مستخدم جديد
async function addUser(email, password, role){
  const { data: user, error } = await supabaseClient.auth.signUp({ email, password });

  if(error){
    alert("خطأ في إنشاء المستخدم: " + error.message);
    return false;
  }
  
  // ⚠️ يفضل التأكد من تفعيل التسجيل التلقائي (Auto-Confirm) في إعدادات Supabase
  if (!user || !user.user) {
      alert("فشل في إنشاء المستخدم في Auth");
      return false;
  }

  const { error: profileError } = await supabaseClient
    .from("profiles")
    .insert([{ id: user.user.id, role, username: email.split('@')[0] }]); // إضافة username بسيط

  if(profileError){
    alert("خطأ في حفظ بيانات الدور: " + profileError.message);
    return false;
  }

  return true;
}

// حذف مستخدم
async function deleteUser(userId){
  await supabaseClient.from("profiles").delete().eq("id", userId);
  alert("لحذف المستخدم نهائياً من Supabase Auth يجب استخدام Admin API من الخادم");
}

// تعديل كلمة مرور
async function changePassword(userId, newPassword){
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
supabaseClient.auth.onAuthStateChange((event, session) => {
  // يتم حذف الجلسة محلياً عند تسجيل الخروج أو انتهاء الجلسة
  if(!session) localStorage.removeItem("sessionUser"); 
});
