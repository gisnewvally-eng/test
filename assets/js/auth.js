// ------------------ auth.js (النسخة النهائية والمكتملة) ------------------

// 1️⃣ تهيئة Supabase
// ⚠️ تأكد من أن الروابط التالية هي الروابط الصحيحة لمشروعك 
const SUPABASE_URL = "https://mvxjqtvmnibhxtfuufky.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JK3bRv-u0gaoduyKQFBUeg_yhKc9p5y";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------ دوال تتبع الزيارات والإحصائيات ------------------

/**
 * 🎯 دالة لتسجيل زيارة ناجحة في جدول visits
 * @param {string} userId - مُعرف المستخدم
 */
async function trackVisit(userId) {
    const { error } = await supabaseClient
        .from('visits')
        .insert({ 
            user_id: userId,
            // created_at يتم تسجيلها تلقائيًا
        });

    if (error) {
        // غالباً خطأ بسبب RLS في جدول visits
        console.error("Failed to track visit:", error);
    }
}

/**
 * 📈 دالة لجلب إحصائيات الزيارات المجمعة لكل دور
 * @returns {Promise<Object | null>} - كائن يحتوي على عدد الزيارات لكل دور
 */
async function getVisitStats() {
    // جلب كل الزيارات، مع جلب الدور المقابل من جدول profiles
    // يتطلب تفعيل RLS على جدول visits للسماح بـ SELECT للمستخدمين
    const { data: visits, error } = await supabaseClient
        .from('visits')
        .select(`
            user_id,
            profiles (role) 
        `);

    if (error) {
        console.error("Error fetching visit stats:", error);
        return null;
    }

    // تجميع البيانات حسب الدور (Admin, User, Guest)
    const stats = {};
    visits.forEach(v => {
        // تأكد من وجود ملف تعريف قبل جلب الدور
        const role = v.profiles ? v.profiles.role : 'Unknown';
        stats[role] = (stats[role] || 0) + 1;
    });

    return stats;
}


// ------------------ تسجيل الدخول والخروج والحماية ------------------

/**
 * 🔑 تسجيل دخول المستخدم
 * @param {string} email
 * @param {string} password
 */
async function login(email, password) {
    if(!email || !password){
        alert("أدخل البريد وكلمة المرور");
        return;
    }

    const { data: session, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if(error){
        alert("البريد أو كلمة المرور خاطئة");
        return;
    }
  
    if (!session || !session.user) {
        alert("فشل في إنشاء الجلسة");
        return;
    }

    // جلب بيانات المستخدم من جدول profiles
    const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

    if(profileError){
        alert("حدث خطأ أثناء جلب بيانات المستخدم");
        console.error("Profile Error:", profileError);
        return;
    }
    
    // تسجيل الزيارة الناجحة مباشرة بعد تسجيل الدخول
    trackVisit(session.user.id);

    // حفظ بيانات المستخدم محليًا مؤقتًا
    localStorage.setItem("sessionUser", JSON.stringify({ id: session.user.id, email: session.user.email, role: profile.role }));

    // التوجيه
    if(profile.role === "admin") window.location.href = "dashboard.html";
    else if(profile.role === "user") window.location.href = "user.html";
    else if(profile.role === "guest") window.location.href = "guest.html";
    else window.location.href = "index.html"; 
}

/**
 * 🚪 تسجيل خروج المستخدم
 */
async function logout() {
    await supabaseClient.auth.signOut();
    localStorage.removeItem("sessionUser"); 
    window.location.href = "index.html";
}

/**
 * 🛡️ حماية الصفحات والتحقق من الجلسة
 * @returns {Promise<Object | null>} - بروفايل المستخدم أو null إذا فشل
 */
async function protectPage() {
    const { data: { user } } = await supabaseClient.auth.getUser();
  
    if(!user){
        window.location.href = "index.html";
        return null;
    }

    const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("id, role, username, email") // نستخدم email هنا لغرض العرض في الداشبورد
        .eq("id", user.id)
        .single();

    if(error || !profile){
        await logout(); 
        return null;
    }
    
    // تسجيل الزيارة الناجحة عند حماية أي صفحة
    trackVisit(user.id);
    
    localStorage.setItem("sessionUser", JSON.stringify({ id: user.id, email: user.email, role: profile.role }));

    return { ...profile, email: user.email }; // دمج بيانات المستخدم والبروفايل
}

// ------------------ إدارة الحسابات (Admin فقط) ------------------

/**
 * 👥 جلب كل المستخدمين من جدول profiles
 * @returns {Promise<Array>} - قائمة المستخدمين
 */
async function getUsers(){
    const { data: profiles, error } = await supabaseClient.from("profiles").select("id, role, username, created_at");
    if(error) return [];
    return profiles;
}

/**
 * ➕ إضافة مستخدم جديد (إنشاء في Auth وحفظ الدور في profiles)
 * @param {string} email
 * @param {string} password
 * @param {string} role
 * @returns {Promise<boolean>}
 */
async function addUser(email, password, role){
    // 1. إنشاء المستخدم في Supabase Auth
    const { data: user, error } = await supabaseClient.auth.signUp({ email, password });

    if(error){
        alert("خطأ في إنشاء المستخدم: " + error.message);
        return false;
    }
    
    if (!user || !user.user) {
        alert("فشل في إنشاء المستخدم في Auth");
        return false;
    }

    // 2. حفظ الدور في جدول profiles
    const { error: profileError } = await supabaseClient
        .from("profiles")
        .insert([{ id: user.user.id, role, username: email.split('@')[0] }]);

    if(profileError){
        alert("خطأ في حفظ بيانات الدور: " + profileError.message);
        return false;
    }

    return true;
}

/**
 * ❌ حذف مستخدم (من profiles وسجلات visits)
 * @param {string} userId - مُعرف المستخدم
 */
async function deleteUser(userId){
    // الحذف من profiles
    await supabaseClient.from("profiles").delete().eq("id", userId);
    
    // حذف أي سجلات مرتبطة في جدول visits
    await supabaseClient.from("visits").delete().eq("user_id", userId);
    
    alert("لحذف المستخدم نهائياً من Supabase Auth (Admin API) يجب تنفيذ هذه العملية من الخادم.");
}

/**
 * 📜 تحميل وعرض قائمة المستخدمين في لوحة الأدمن
 */
async function loadUsersList() {
    const usersListDiv = document.getElementById("usersList");
    if(!usersListDiv) return;

    usersListDiv.innerHTML = "جاري تحميل بيانات المستخدمين...";
    
    const users = await getUsers();
    usersListDiv.innerHTML = "";

    users.forEach(u => {
        const div = document.createElement("div");
        div.innerHTML = `
            ${u.username || u.email} (${u.role}) 
            <span style="font-size: 0.8em; margin-right: 10px;">${new Date(u.created_at).toLocaleDateString()}</span>
            <span>
                <button onclick="deleteUser('${u.id}')">حذف</button>
            </span>
        `;
        usersListDiv.appendChild(div);
    });
}


// ------------------ إدارة الخرائط (Admin) ------------------

/**
 * 🗺️ جلب الخرائط المسموح بها لدور معين
 * @param {string} userRole - دور المستخدم الحالي (admin, user, guest)
 * @returns {Promise<Array>} - مصفوفة من كائنات الخرائط
 */
async function getAccessibleMaps(userRole) {
    const { data: maps, error } = await supabaseClient
        .from("maps") 
        .select("id, name, url, allowed_roles");

    if (error) {
        console.error("Error fetching maps:", error);
        return [];
    }

    // تصفية الخرائط بناءً على الدور المسموح به
    const accessibleMaps = maps.filter(map => {
        // التحقق من أن الدور موجود في مصفوفة allowed_roles
        if (Array.isArray(map.allowed_roles)) {
            return map.allowed_roles.includes(userRole);
        }
        return false;
    });

    return accessibleMaps;
}

/**
 * ➕ إضافة خريطة جديدة (يجب استخدامها في صفحة manage-pages.html)
 * @param {string} name - اسم الخريطة
 * @param {string} url - رابط الخريطة
 * @param {Array<string>} roles - مصفوفة الأدوار المسموح بها (مثال: ['admin', 'user'])
 * @returns {Promise<boolean>} - true إذا نجحت العملية
 */
async function addMap(name, url, roles) {
    const { error } = await supabaseClient
        .from("maps")
        .insert({ 
            name: name,
            url: url,
            allowed_roles: roles 
        });

    if (error) {
        alert("خطأ في إضافة الخريطة: " + error.message);
        return false;
    }

    return true;
}

/**
 * ❌ حذف خريطة
 * @param {string} mapId - مُعرف الخريطة المراد حذفها
 * @returns {Promise<boolean>} - true إذا نجحت العملية
 */
async function deleteMap(mapId) {
    const { error } = await supabaseClient
        .from("maps")
        .delete()
        .eq("id", mapId);

    if (error) {
        alert("خطأ في حذف الخريطة: " + error.message);
        return false;
    }

    return true;
}
/**
 * 🔍 دالة للتحقق من الجلسة وجلب البروفايل دون إعادة توجيه (للصفحات العامة مثل index.html)
 * @returns {Promise<Object | null>} - بروفايل المستخدم إذا كان مسجلاً، أو null
 */
async function checkSessionOnly() {
    // 1. التحقق من المستخدم في Supabase Auth
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        return null; // ❌ لا يوجد إعادة توجيه هنا.
    }
    
    // 2. جلب بيانات البروفايل والدور (كما تفعل protectPage)
    const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("role, username, name") 
        .eq("id", user.id)
        .single();

    if (error || !profile) {
        console.error("Profile not found for authenticated user.");
        return null;
    }
    
    // تسجيل الزيارة (اختياري، يتم تنفيذه الآن عند كل تحميل للصفحة مع جلسة صالحة)
    trackVisit(user.id); 

    return { 
        ...profile, 
        email: user.email, 
        // نضمن وجود خاصية الاسم لتجنب خطأ إذا لم تكن موجودة في جدول profiles
        name: profile.name || profile.username || user.email.split('@')[0]
    };
}
// ------------------ مراقبة الجلسة ------------------
supabaseClient.auth.onAuthStateChange((event, session) => {
    if(!session) localStorage.removeItem("sessionUser"); 
});

// ------------------ تصدير الدوال للاستخدام العام ------------------

// يجب جعل هذه الدوال متاحة عالمياً لملف HTML
window.login = login;
window.logout = logout;
window.protectPage = protectPage;
window.getVisitStats = getVisitStats;
window.getUsers = getUsers;
window.loadUsersList = loadUsersList;
window.deleteUser = deleteUser;
window.getAccessibleMaps = getAccessibleMaps;
window.addMap = addMap;
window.deleteMap = deleteMap;
// ... وأي دالة أخرى تحتاج لاستدعائها من HTML مباشرة.

