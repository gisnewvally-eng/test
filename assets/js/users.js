// ===========================
// assets/js/users.js
// دوال Front-end لإدارة المستخدمين
// ===========================

// ========== GET USERS ==========
export async function getUsers() {
  try {
    const res = await fetch(`/api/users?action=get-users`);
    const data = await res.json();
    return data.users || [];
  } catch (err) {
    console.error("Error fetching users:", err);
    return [];
  }
}

// ========== ADD USER ==========
export async function addUser(name, email, password, role) {
  try {
    const res = await fetch(`/api/users?action=add-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    return data.success || false;
  } catch (err) {
    console.error("Error adding user:", err);
    return false;
  }
}

// ========== UPDATE USER ROLE ==========
export async function updateUserRole(userId, role) {
  try {
    const res = await fetch(`/api/users?action=update-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role })
    });
    const data = await res.json();
    return data.success || false;
  } catch (err) {
    console.error("Error updating user role:", err);
    return false;
  }
}

// ========== UPDATE USER PASSWORD ==========
export async function updateUserPassword(userId, password) {
  try {
    const res = await fetch(`/api/users?action=update-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password })
    });
    const data = await res.json();
    return data.success || false;
  } catch (err) {
    console.error("Error updating password:", err);
    return false;
  }
}

// ========== DELETE USER ==========
export async function deleteUser(userId) {
  try {
    const res = await fetch(`/api/users?action=delete-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const data = await res.json();
    return data.success || false;
  } catch (err) {
    console.error("Error deleting user:", err);
    return false;
  }
}
