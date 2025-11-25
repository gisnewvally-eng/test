// ------------------ auth.js (نسخة محدثة للعمل مع السيرفر) ------------------

// 1️⃣ تهيئة Supabase (لإدارة الخرائط والزيارات فقط)
const SUPABASE_URL = "https://mvxjqtvmnibhxtfuufky.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JK3bRv-u0gaoduyKQFBUeg_yhKc9p5y";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2️⃣ رابط السيرفر (Vercel / Node.js)
const SERVER_API = "https://supabase-admin-api-gisnewvallys-projects.vercel.app";
// ------------------ روابط الصور للخرائط والشعار ------------------
const mapImages = {
  "سكنية": "https://mvxjqtvmnibhxtfuufky.supabase.co/storage/v1/object/public/map-type-images/images/residential.png",
  "صناعية": "https://mvxjqtvmnibhxtfuufky.supabase.co/storage/v1/object/public/map-type-images/images/industrial.png",
  "تجارية": "https://mvxjqtvmnibhxtfuufky.supabase.co/storage/v1/object/public/map-type-images/images/commercial.png",
  "خدمية": "https://mvxjqtvmnibhxtfuufky.supabase.co/storage/v1/object/public/map-type-images/images/services.png",
  "logo": "https://mvxjqtvmnibhxtfuufky.supabase.co/storage/v1/object/public/map-type-images/images/logo.png"
};
// ------------------ تتبع الزيارات ------------------
async function trackVisit(userId){
    if(!userId) return;
    const { error } = await supabaseClient.from('visits').insert({ user_id: userId });
    if(error) console.error("Failed to track visit:", error);
}
async function getVisitStats(){
    const { data: visits, error } = await supabaseClient.from('visits').select('user_id, profiles(role)');
    if(error){ console.error(error); return null; }
    const stats = {};
    visits.forEach(v=>{
        const role = v.profiles ? v.profiles.role : 'Unknown';
        stats[role] = (stats[role] || 0) + 1;
    });
    return stats;
}

// ------------------ تسجيل الدخول والخروج ------------------
async function login(email,password){
    if(!email || !password){ alert("أدخل البريد وكلمة المرور"); return; }

    const { data: session, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if(error){ alert("البريد أو كلمة المرور خاطئة"); return; }
    if(!session || !session.user){ alert("فشل في إنشاء الجلسة"); return; }

    const { data: profile, error: profileError } = await supabaseClient.from("profiles").select("role, name, username").eq("id", session.user.id).single();
    if(profileError){ alert("خطأ في جلب بيانات المستخدم"); console.error(profileError); return; }

    trackVisit(session.user.id);

    localStorage.setItem("sessionUser", JSON.stringify({
        id: session.user.id,
        email: session.user.email,
        role: profile.role,
        name: profile.name || profile.username || session.user.email.split('@')[0]
    }));

    if(profile.role==="admin") window.location.href="dashboard.html";
    else if(profile.role==="user") window.location.href="user.html";
    else if(profile.role==="guest") window.location.href="guest.html";
    else window.location.href="index.html";
}

async function logout(){
    await supabaseClient.auth.signOut();
    localStorage.removeItem("sessionUser");
    window.location.href="index.html";
}

// ------------------ حماية الصفحات ------------------
async function protectPage(){
    const { data: { user } } = await supabaseClient.auth.getUser();
    if(!user){ window.location.href="index.html"; return null; }

    const { data: profile, error } = await supabaseClient.from("profiles").select("id, role, username, name, email").eq("id", user.id).single();
    if(error || !profile){ await logout(); return null; }

    trackVisit(user.id);

    localStorage.setItem("sessionUser", JSON.stringify({
        id: user.id,
        email: profile.email,
        role: profile.role,
        name: profile.name || profile.username || user.email.split('@')[0]
    }));

    return { ...profile, email: profile.email };
}

async function checkSessionOnly(){
    const { data: { user } } = await supabaseClient.auth.getUser();
    if(!user) return null;

    const { data: profile, error } = await supabaseClient.from("profiles").select("role, username, name, email").eq("id", user.id).single();
    if(error || !profile) return null;

    trackVisit(user.id);

    return { ...profile, email: profile.email, name: profile.name || profile.username || user.email.split('@')[0] };
}

// ------------------ إدارة المستخدمين عبر السيرفر ------------------
async function getUsers(){
    try {
        const res = await fetch(`${SERVER_API}/get-users`);
        const data = await res.json();
        return data.users || [];
    } catch(e){ console.error(e); return []; }
}

async function addUser(name,email,password,role){
    try {
        const res = await fetch(`${SERVER_API}/add-user`, {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ name,email,password,role })
        });
        const data = await res.json();
        if(data.success) return true;
        alert(data.error || "خطأ في إضافة المستخدم");
        return false;
    } catch(e){ console.error(e); alert("خطأ في الاتصال بالسيرفر"); return false; }
}

async function deleteUser(userId){
    try {
        const res = await fetch(`${SERVER_API}/delete-user`, {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ userId })
        });
        const data = await res.json();
        if(data.success) return true;
        alert(data.error || "خطأ في حذف المستخدم");
        return false;
    } catch(e){ console.error(e); alert("خطأ في الاتصال بالسيرفر"); return false; }
}

async function updateUserRole(userId, role){
    try {
        const res = await fetch(`${SERVER_API}/update-user`, {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ userId, role })
        });
        const data = await res.json();
        if(!data.success) alert(data.error || "خطأ في تحديث الدور");
    } catch(e){ console.error(e); alert("خطأ في الاتصال بالسيرفر"); }
}

async function updateUserPassword(userId,password){
    try {
        const res = await fetch(`${SERVER_API}/update-user`, {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ userId, password })
        });
        const data = await res.json();
        if(!data.success){ alert(data.error || "خطأ في تغيير كلمة المرور"); return false; }
        return true;
    } catch(e){ console.error(e); alert("خطأ في الاتصال بالسيرفر"); return false; }
}

// ------------------ إدارة الخرائط ------------------
async function getAccessibleMaps(userRole){
    const { data: maps, error } = await supabaseClient.from("maps").select("id, name, url, allowed_roles, type, image_url");
    if(error){ console.error(error); return []; }
    return maps.filter(map => Array.isArray(map.allowed_roles) && map.allowed_roles.includes(userRole));
}

async function addMap(name,url,roles,type="سكنية"){
    const { error } = await supabaseClient.from("maps").insert({ name, url, allowed_roles: roles, type, image_url: mapImages[type] });
    if(error){ alert("خطأ في إضافة الخريطة: "+error.message); return false; }
    return true;
}

async function deleteMap(mapId){
    const { error } = await supabaseClient.from("maps").delete().eq('id', mapId);
    if(error){ alert("خطأ في حذف الخريطة: "+error.message); return false; }
    return true;
}

// ------------------ مراقبة التغييرات في الجلسة ------------------
supabaseClient.auth.onAuthStateChange((event, session) => {
    if(!session) localStorage.removeItem("sessionUser");
});

// ------------------ تصدير الدوال ------------------
window.login = login;
window.logout = logout;
window.protectPage = protectPage;
window.checkSessionOnly = checkSessionOnly;
window.getVisitStats = getVisitStats;
window.getUsers = getUsers;
window.loadUsersList = getUsers;
window.deleteUser = deleteUser;
window.addUser = addUser;
window.updateUserRole = updateUserRole;
window.updateUserPassword = updateUserPassword;
window.getAccessibleMaps = getAccessibleMaps;
window.addMap = addMap;
window.deleteMap = deleteMap;
window.mapImages = mapImages;
