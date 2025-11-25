// =====================
//  إعداد رابط API الصحيح
// =====================
const SERVER_API = "https://supabase-admin-api-xi.vercel.app/api";


// =====================
// تسجيل دخول الأدمن
// =====================
async function adminLogin(event) {
  event.preventDefault();

  const username = document.getElementById("admin-username").value;
  const password = document.getElementById("admin-password").value;

  try {
    const response = await fetch(`${SERVER_API}/login-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "خطأ في تسجيل الدخول");
      return;
    }

    localStorage.setItem("admin", "true");
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("login error:", error);
    alert("حدث خطأ أثناء محاولة تسجيل الدخول");
  }
}



// =====================
// منع دخول غير الأدمن للداشبورد
// =====================
function checkAdminAccess() {
  if (!localStorage.getItem("admin")) {
    window.location.href = "login.html";
  }
}



// =====================
// تسجيل خروج الأدمن
// =====================
function adminLogout() {
  localStorage.removeItem("admin");
  window.location.href = "login.html";
}



// =====================
// إضافة مستخدم جديد
// =====================
async function addUser() {
  const username = document.getElementById("new-username").value;
  const password = document.getElementById("new-password").value;
  const role = document.getElementById("new-role").value;

  if (!username || !password) {
    alert("يجب إدخال اسم المستخدم وكلمة المرور");
    return;
  }

  try {
    const response = await fetch(`${SERVER_API}/add-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "تعذرت إضافة المستخدم");
      return;
    }

    alert("تمت إضافة المستخدم بنجاح");
    loadUsersList();
  } catch (error) {
    console.error("add user error:", error);
    alert("حدث خطأ أثناء إضافة المستخدم");
  }
}



// =====================
// جلب قائمة المستخدمين بالكامل
// =====================
async function getUsers() {
  try {
    const response = await fetch(`${SERVER_API}/get-users`);

    const text = await response.text(); // نقرأ الرد كما هو

    try {
      const data = JSON.parse(text);
      if (!response.ok) return [];
      return data.users || [];
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError, text);
      return [];
    }

  } catch (error) {
    console.error("fetch users error:", error);
    return [];
  }
}



// =====================
// تحميل المستخدمين داخل الجدول
// =====================
async function loadUsersList() {
  const users = await getUsers();
  const tableBody = document.getElementById("users-table-body");

  tableBody.innerHTML = "";

  users.forEach(user => {
    const row = `
      <tr>
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>${user.role}</td>
        <td>
          <button onclick="deleteUser(${user.id})">حذف</button>
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
}



// =====================
// حذف مستخدم
// =====================
async function deleteUser(id) {
  if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;

  try {
    const response = await fetch(`${SERVER_API}/delete-user`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "تعذرت عملية الحذف");
      return;
    }

    alert("تم حذف المستخدم");
    loadUsersList();

  } catch (error) {
    console.error("delete error:", error);
    alert("حدث خطأ أثناء الحذف");
  }
}
