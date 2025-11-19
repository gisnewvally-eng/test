// ------------------ auth.js ------------------

// تهيئة المستخدمين (مرة واحدة)
if(!localStorage.getItem("users")){
  const defaultUsers = [
    { username: "admin", password: "1234", role: "admin" },
    { username: "user1", password: "1111", role: "user" },
    { username: "guest", password: "0000", role: "guest" }
  ];
  localStorage.setItem("users", JSON.stringify(defaultUsers));
}

// تسجيل الدخول
function login() {
  const username = document.getElementById("user").value;
  const password = document.getElementById("pass").value;

  const users = JSON.parse(localStorage.getItem("users"));
  const user = users.find(u => u.username === username && u.password === password);

  if(user){
    localStorage.setItem("loggedUser", JSON.stringify(user));
    window.location.href = "dashboard.html";
  } else {
    alert("اسم المستخدم أو كلمة المرور خاطئة");
  }
}

// تسجيل الخروج
function logout() {
  localStorage.removeItem("loggedUser");
  window.location.href = "index.html";
}

// حماية الصفحات
function protectPage() {
  const user = JSON.parse(localStorage.getItem("loggedUser"));
  if(!user){
    window.location.href = "index.html";
    return null;
  }
  return user;
}

// ------------------ إدارة الحسابات (Admin فقط) ------------------

// جلب كل المستخدمين
function getUsers(){
  return JSON.parse(localStorage.getItem("users")) || [];
}

// إضافة مستخدم جديد
function addUser(username, password, role){
  const users = getUsers();
  if(users.find(u => u.username === username)){
    alert("المستخدم موجود بالفعل");
    return false;
  }
  users.push({ username, password, role });
  localStorage.setItem("users", JSON.stringify(users));
  return true;
}

// حذف مستخدم
function deleteUser(username){
  let users = getUsers();
  users = users.filter(u => u.username !== username);
  localStorage.setItem("users", JSON.stringify(users));
}

// تعديل كلمة مرور
function changePassword(username, newPassword){
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if(user){
    user.password = newPassword;
    localStorage.setItem("users", JSON.stringify(users));
  }
}
