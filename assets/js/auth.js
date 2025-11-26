// ------------------ auth.js ------------------

// 1️⃣ تهيئة Supabase
const SUPABASE_URL = "https://mvxjqtvmnibhxtfuufky.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12eGpxdHZtbmliaHh0ZnV1Zmt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NDU0NDAsImV4cCI6MjA3OTQyMTQ0MH0.P_s2APZULn9VLrEoyttWBsT-TR9Vf9J5WM-DFwjmWb0";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2️⃣ رابط السيرفر الحقيقي لإدارة المستخدمين
const SERVER_API = "https://supabase-admin-api-xi.vercel.app/api/users";

// ------------------ روابط الصور للخرائط ------------------
const mapImages = {
  "سكنية": "https://mvxjqtvmnibhxtfuufky.supabase.co/storage/v1/object/public/map-type-images/images/residential.png",
  "صناعية": "https://mvxjqtvmnibhxtfuufky.supabase.co/storage/v1/object/public/map-type-images/images/industrial.png",
  "تجارية": "https://mvxjqtvmnibhxtfuufky.supabase.co/storage/v1/object/public/map-type-images/images/commercial.png",
  "خدمية": "https://mvxjqtvmnibhxtfuufky.supabase.co/storage/v1/object/public/map-type-images/images/services.png",
  "logo": "https://mvxjqtvmnibhxtfuufky.supabase.co/storage/v1/object/public/map-type-images/images/logo.png"
};

// ------------------ تتبع الزيارات ------------------
// إدخال سجل زيارة جديد للمستخدم
async function trackVisit(userId){
    if(!userId) return;
    const { error } = await supabaseClient.from('visits').insert({ user_id: userId });
    if(error) console.error("Failed to track visit:", error);
}

// الحصول على إحصائيات زيارات المستخدمين (اسم المستخدم وعدد الزيارات)
async function getVisitStats(){
    const { data: visits, error } = await supabaseClient
        .from('visits')
        .select('user_id, profiles(name)'); // ربط جدول visits مع profiles للحصول على الاسم
    if(error){ console.error(error); return null; }

    const stats = {};
    visits.forEach(v => {
        const name = v.profiles && v.profiles.name ? v.profiles.name : 'مجهول';
        stats[name] = (stats[name] || 0) + 1; // عد الزيارات لكل مستخدم
    });
    return stats;
}

// تحديث شارت الزيارات في dashboard.html
async function updateVisitsChart(){
    const statsData = await getVisitStats();
    if(!statsData) return;

    const labels = Object.keys(statsData);
    const data = Object.values(statsData);

    // تمييز المستخدم الحالي بلون مختلف
    const currentUser = JSON.parse(localStorage.getItem("sessionUser"));
    const backgroundColors = labels.map(name => 
        currentUser && currentUser.name === name ? '#26d0ce' : '#004b8d'
    );

    const ctx = document.getElementById('visitsChart').getContext('2d');
    if(window.visitsChart) window.visitsChart.destroy(); // مسح الشارت القديم

    window.visitsChart = new Chart(ctx,{
        type:'bar',
        data:{
            labels,
            datasets:[{
                label:'عدد الزيارات',
                data,
                backgroundColor: backgroundColors
            }]
        },
        options:{
            responsive:true,
            maintainAspectRatio:false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales:{
                y:{
                    beginAtZero:true,
                    title: { display:true, text:'عدد الزيارات' }
                }
            }
        }
    });
}

// ------------------ تسجيل الدخول ------------------
// تسجيل الدخول باستخدام Supabase auth
async function login(email, password) {
    if (!email || !password) {
        alert("أدخل البريد وكلمة المرور");
        return;
    }

    const { data: session, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) { alert("البريد أو كلمة المرور خاطئة"); return; }

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

    // تتبع الزيارة للمستخدم
    await trackVisit(user.id);

    // إعادة توجيه حسب الدور
    if (profile.role === "admin") window.location.href = "dashboard.html";
    else if (profile.role === "user") window.location.href = "user.html";
    else window.location.href = "guest.html";
}

// ------------------ تسجيل الخروج ------------------
async function logout() {
    await supabaseClient.auth.signOut();
    localStorage.removeItem("sessionUser");
    window.location.href = "index.html";
}

// ------------------ حماية الصفحات ------------------
// التحقق من صلاحية الوصول للصفحة وإرجاع بيانات المستخدم
async function protectPage() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) { window.location.href = "index.html"; return null; }

    const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("id, role, username, name, email")
        .eq("id", user.id)
        .single();

    if (error || !profile) { window.location.href = "index.html"; return null; }

    // تتبع الزيارة باستخدام الدالة الموحدة
    await trackVisit(user.id);

    return profile; // إعادة بيانات المستخدم للصفحة
}

// ------------------ إدارة الخرائط ------------------
// جلب الخرائط المسموح بها للمستخدم حسب دوره
async function getAccessibleMaps(userRole){
    const { data: maps, error } = await supabaseClient.from("maps").select("id, name, url, allowed_roles, type, image_url");
    if(error){ console.error(error); return []; }
    return maps.filter(map => Array.isArray(map.allowed_roles) && map.allowed_roles.includes(userRole));
}

// إضافة خريطة جديدة
async function addMap(name, url, roles, type="سكنية"){
    const { error } = await supabaseClient.from("maps").insert({ name, url, allowed_roles: roles, type, image_url: mapImages[type] });
    if(error){ alert("خطأ في إضافة الخريطة: "+error.message); return false; }
    return true;
}

// حذف خريطة
async function deleteMap(mapId){
    const { error } = await supabaseClient.from("maps").delete().eq('id', mapId);
    if(error){ alert("خطأ في حذف الخريطة: "+error.message); return false; }
    return true;
}

// ------------------ إدارة المستخدمين عبر السيرفر ------------------
// دالة موحدة لتحديث بيانات المستخدم (role أو password)
async function updateUser(userId, updates) {
    try {
        const res = await fetch(`${SERVER_API}?action=update-user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, ...updates })
        });
        const data = await res.json();
        return data.success || false;
    } catch (err) {
        console.error(err);
        alert("خطأ في الاتصال بالسيرفر");
        return false;
    }
}

// جلب جميع المستخدمين
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

// إضافة مستخدم جديد
async function addUser(name, email, password, role) {
    return updateUser(null, { name, email, password, role, action: "add-user" });
}

// حذف مستخدم
async function deleteUser(userId) {
    return updateUser(userId, { action: "delete-user" });
}

// ------------------ تصدير الدوال للاستخدام في صفحات مختلفة ------------------
window.login = login;
window.logout = logout;
window.protectPage = protectPage;
window.trackVisit = trackVisit;
window.getVisitStats = getVisitStats;
window.updateVisitsChart = updateVisitsChart;
window.getAccessibleMaps = getAccessibleMaps;
window.addMap = addMap;
window.deleteMap = deleteMap;
window.getUsers = getUsers;
window.addUser = addUser;
window.deleteUser = deleteUser;
window.updateUser = updateUser;
window.mapImages = mapImages;
window.checkSessionOnly = checkSessionOnly;
