// ------------------ auth.js (نسخة كاملة ومحدثة) ------------------

// 1️⃣ تهيئة Supabase
const SUPABASE_URL = "https://mvxjqtvmnibhxtfuufky.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JK3bRv-u0gaoduyKQFBUeg_yhKc9p5y";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------ دوال تتبع الزيارات والإحصائيات ------------------
async function trackVisit(userId) {
    const { error } = await supabaseClient.from('visits').insert({ user_id: userId });
    if (error) console.error("Failed to track visit:", error);
}

async function getVisitStats() {
    const { data: visits, error } = await supabaseClient.from('visits').select(`user_id, profiles(role)`);
    if (error) { console.error(error); return null; }

    const stats = {};
    visits.forEach(v => {
        const role = v.profiles ? v.profiles.role : 'Unknown';
        stats[role] = (stats[role] || 0) + 1;
    });
    return stats;
}

// ------------------ تسجيل الدخول والخروج والحماية ------------------
async function login(email, password) {
    if(!email || !password){ alert("أدخل البريد وكلمة المرور"); return; }

    const { data: session, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if(error){ alert("البريد أو كلمة المرور خاطئة"); return; }

    if(!session || !session.user){ alert("فشل في إنشاء الجلسة"); return; }

    const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("role, name, username")
        .eq("id", session.user.id)
        .single();

    if(profileError){ alert("خطأ في جلب بيانات المستخدم"); console.error(profileError); return; }

    trackVisit(session.user.id);

    localStorage.setItem("sessionUser", JSON.stringify({
        id: session.user.id,
        email: session.user.email,
        role: profile.role,
        name: profile.name || profile.username || session.user.email.split('@')[0]
    }));

    if(profile.role === "admin") window.location.href = "dashboard.html";
    else if(profile.role === "user") window.location.href = "user.html";
    else if(profile.role === "guest") window.location.href = "guest.html";
    else window.location.href = "index.html"; 
}

async function logout() {
    await supabaseClient.auth.signOut();
    localStorage.removeItem("sessionUser");
    window.location.href = "index.html";
}

async function protectPage() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if(!user){ window.location.href = "index.html"; return null; }

    const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("id, role, username, name, email")
        .eq("id", user.id)
        .single();

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

// ------------------ فحص الجلسة بدون إعادة توجيه ------------------
async function checkSessionOnly() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if(!user) return null;

    const { data: profile, error } = await supabaseClient.from("profiles")
        .select("role, username, name, email")
        .eq("id", user.id)
        .single();

    if(error || !profile) return null;

    trackVisit(user.id);

    return {
        ...profile,
        email: profile.email,
        name: profile.name || profile.username || user.email.split('@')[0]
    };
}

// ------------------ إدارة الحسابات ------------------
async function getUsers() {
    const { data: profiles, error } = await supabaseClient.from("profiles")
        .select("id, role, username, name, created_at");
    if(error) return [];
    return profiles;
}

async function addUser(name, email, password, role){
    if(!name || !email || !password){ alert("املأ جميع الحقول"); return false; }

    const { data: user, error } = await supabaseClient.auth.signUp({ email, password });
    if(error){ alert("خطأ في إنشاء المستخدم: " + error.message); return false; }
    if(!user || !user.user){ alert("فشل في إنشاء المستخدم"); return false; }

    const { error: profileError } = await supabaseClient
        .from("profiles")
        .insert([{ id: user.user.id, role, username: email.split('@')[0], name: name }]);
    if(profileError){ alert("خطأ في حفظ بيانات المستخدم: " + profileError.message); return false; }

    return true;
}

async function deleteUser(userId){
    await supabaseClient.from("profiles").delete().eq("id", userId);
    await supabaseClient.from("visits").delete().eq("user_id", userId);
    alert("لحذف المستخدم نهائياً من Supabase Auth يجب تنفيذها من الخادم.");
}

async function loadUsersList() {
    const usersListDiv = document.getElementById("usersList");
    if(!usersListDiv) return;

    usersListDiv.innerHTML = "جاري تحميل بيانات المستخدمين...";
    const users = await getUsers();
    usersListDiv.innerHTML = "";

    users.forEach(u => {
        const div = document.createElement("div");
        div.innerHTML = `
            ${u.name || u.username} (${u.role}) 
            <span style="font-size:0.8em; margin-right:10px;">${new Date(u.created_at).toLocaleDateString()}</span>
            <span><button onclick="deleteUser('${u.id}')">حذف</button></span>
        `;
        usersListDiv.appendChild(div);
    });
}

// ------------------ إدارة الخرائط ------------------
async function getAccessibleMaps(userRole) {
    const { data: maps, error } = await supabaseClient.from("maps")
        .select("id, name, url, allowed_roles, type, image_url");
    if(error){ console.error(error); return []; }

    return maps.filter(map => Array.isArray(map.allowed_roles) && map.allowed_roles.includes(userRole));
}

async function addMap(name, url, roles, type="سكنية"){
    const { error } = await supabaseClient.from("maps").insert({
        name,
        url,
        allowed_roles: roles,
        type,
        image_url: mapImages[type] // ← أضف هذا
    });


async function deleteMap(mapId){
    const { error } = await supabaseClient.from("maps").delete().eq('id', mapId);
    if(error){ alert("خطأ في حذف الخريطة: " + error.message); return false; }
    return true;
}

// ------------------ مراقبة التغييرات في الجلسة ------------------
supabaseClient.auth.onAuthStateChange((event, session) => {
    if(!session) localStorage.removeItem("sessionUser");
});

// ------------------ تصدير جميع الدوال ------------------
window.login = login;
window.logout = logout;
window.protectPage = protectPage;
window.checkSessionOnly = checkSessionOnly;
window.getVisitStats = getVisitStats;
window.getUsers = getUsers;
window.loadUsersList = loadUsersList;
window.deleteUser = deleteUser;
window.addUser = addUser;
window.getAccessibleMaps = getAccessibleMaps;
window.addMap = addMap;
window.deleteMap = deleteMap;


