// تخزين حالة تسجيل الدخول
// قائمة المستخدمين التجريبية
const users = [
  { username: "admin", password: "1234", role: "admin" },
  { username: "user1", password: "1111", role: "user" },
  { username: "guest", password: "0000", role: "guest" }
];

function login() {
  const username = document.getElementById("user").value;
  const password = document.getElementById("pass").value;

  const user = users.find(u => u.username === username && u.password === password);

  if(user){
    // حفظ بيانات المستخدم في الجلسة
    localStorage.setItem("loggedUser", JSON.stringify(user));
    window.location.href = "dashboard.html";
  } else {
    alert("اسم المستخدم أو كلمة المرور خاطئة");
  }
}

function logout() {
  localStorage.removeItem("loggedUser");
  window.location.href = "index.html";
}

// حماية الصفحات المحمية
function protectPage() {
  if(!localStorage.getItem("loggedUser")){
    window.location.href = "index.html";
  }
}
