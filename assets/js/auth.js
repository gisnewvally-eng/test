// تخزين حالة تسجيل الدخول
function login() {
  localStorage.setItem("loggedIn", "true");
  window.location.href = "dashboard.html"; // صفحة الصفحات المحمية
}

function logout() {
  localStorage.removeItem("loggedIn");
  window.location.href = "index.html";
}

// منع الوصول للصفحات المحمية بدون تسجيل دخول
function protectPage() {
  if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "index.html";
  }
}
