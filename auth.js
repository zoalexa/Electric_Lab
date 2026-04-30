// =====================
// USERS (ADMIN CONTROLLED)
// =====================
const USERS = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "user1", password: "1234", role: "user" },
  { username: "user2", password: "1234", role: "user" }
];

// =====================
// LOGIN
// =====================
function login() {
  const u = username.value;
  const p = password.value;

  const user = USERS.find(x => x.username === u && x.password === p);

  if (!user) {
    alert("Λάθος στοιχεία");
    return;
  }

  localStorage.setItem("currentUser", JSON.stringify(user));
  localStorage.setItem("mode", "user");

  window.location.href = "index.html";
}

// =====================
// GUEST
// =====================
function continueAsGuest() {
  localStorage.removeItem("currentUser");
  localStorage.setItem("mode", "guest");
  window.location.href = "index.html";
}

// =====================
// GETTERS
// =====================
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function getMode() {
  return localStorage.getItem("mode");
}

// =====================
// PROTECTION
// =====================
function requireEntry() {
  const mode = getMode();
  const user = getCurrentUser();

  if (!mode) {
    window.location.href = "login.html";
    return;
  }

  if (mode === "guest") return;

  if (mode === "user" && !user) {
    window.location.href = "login.html";
  }
}

// =====================
// LOGOUT
// =====================
function logout() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("mode");
  window.location.href = "login.html";
}