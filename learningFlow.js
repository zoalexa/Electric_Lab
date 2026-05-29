// =========================
// LEARNING FLOW CORE
// =========================
function getUserId() {
  try {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return "guest";
    const user = JSON.parse(raw);
    if (user?.username) return user.username;
    if (user?.id) return user.id;
  } catch {}
  return "guest";
}

// =========================
// ADMIN CHECK
// =========================
function isAdminUser() {
  try {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return false;
    const user = JSON.parse(raw);
    return user?.role === "admin";
  } catch { return false; }
}

// =========================
// TOAST NOTIFICATION
// =========================
function showToast(message) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 9999;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.style.cssText = `
    background: #1e1e2e;
    color: white;
    padding: 14px 20px;
    border-radius: 10px;
    font-size: 14px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    max-width: 300px;
    border-left: 4px solid #4ade80;
  `;
  toast.innerHTML = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// =========================
// DEFAULT PROGRESS
// =========================
function createDefaultProgress() {
  return {
    glossaryVisited: false,
    videos: {
      video1: false, video2: false, video3: false,
      video4: false, video5: false, video6: false,
      video7: false, video8: false, video9: false
    },
    unlocked: {
      glossary: false,
      video1: false, video2: false, video3: false,
      video4: false, video5: false, video6: false,
      video7: false, video8: false, video9: false,
      homework: false, forum: false, material: false
    },
    lastVisited: null
  };
}

function safeParse(key) {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch { return null; }
}

function loadProgress() {
  // Admin: όλα ξεκλειδωμένα
  if (isAdminUser()) {
    const full = createDefaultProgress();
    Object.keys(full.unlocked).forEach(k => full.unlocked[k] = true);
    full.glossaryVisited = true;
    Object.keys(full.videos).forEach(k => full.videos[k] = true);
    return full;
  }
  const id = getUserId();
  try {
    const saved = safeParse(`progress_${id}`);
    if (!saved || typeof saved !== "object") {
      const fresh = createDefaultProgress();
      saveProgress(fresh);
      return fresh;
    }
    return {
      ...createDefaultProgress(),
      ...saved,
      videos: { ...createDefaultProgress().videos, ...saved.videos },
      unlocked: { ...createDefaultProgress().unlocked, ...saved.unlocked }
    };
  } catch {
    const fresh = createDefaultProgress();
    saveProgress(fresh);
    return fresh;
  }
}

function saveProgress(progress) {
  const id = getUserId();
  if (id === "guest") return;
  localStorage.setItem(`progress_${id}`, JSON.stringify(progress));
}

// =========================
// UNLOCK GLOSSARY
// (καλείται από glos.html)
// =========================
function unlockGlossary() {
  const mode = localStorage.getItem("mode");
  if (!mode || mode === "guest") return;

  const progress = loadProgress();
  const alreadyVisited = progress.glossaryVisited === true;

  progress.glossaryVisited = true;
  progress.unlocked.glossary = true;
  progress.unlocked.video1 = true;
  saveProgress(progress);
  window.dispatchEvent(new Event("progressUpdated"));

  if (!alreadyVisited) {
    showToast("🔓 Ξεκλειδώθηκαν τα <b>Εκπαιδευτικά Βίντεο</b>! Πήγαινε στην Αρχική για να τα δεις.");
  }
}

// =========================
// UNLOCK GLOSSARY FROM INFO
// (καλείται όταν κλείνει το Info modal)
// =========================
function unlockGlossaryFromInfo() {
  const mode = localStorage.getItem("mode");
  if (!mode || mode === "guest") return;

  const progress = loadProgress();
  if (progress.unlocked.glossary === true) return; // ήδη ξεκλειδωμένο

  progress.unlocked.glossary = true;
  saveProgress(progress);
  window.dispatchEvent(new Event("progressUpdated"));

  showToast("🔓 Ξεκλειδώθηκε το <b>Γλωσσάριο</b>!");
}

// =========================
// COMPLETE VIDEO
// =========================
function completeVideo(videoId) {
  const progress = loadProgress();
  progress.videos[videoId] = true;

  const next = getNextVideo(videoId);
  if (next) {
    progress.unlocked[next] = true;
    const nextNumber = next.replace("video", "");
    showToast(`🔓 Ξεκλειδώθηκε το <b>Βίντεο ${nextNumber}</b>!`);
  } else {
    progress.unlocked.homework = true;
    progress.unlocked.forum = true;
    progress.unlocked.material = true;
    showToast("🎉 Συγχαρητήρια! Ξεκλειδώθηκαν:<br><b>Homework, Forum, Υλικό Μαθήματος</b>!");
  }

  saveProgress(progress);
  window.dispatchEvent(new Event("progressUpdated"));
}

function getNextVideo(id) {
  const order = [
    "video1","video2","video3","video4","video5",
    "video6","video7","video8","video9"
  ];
  const index = order.indexOf(id);
  return order[index + 1] || null;
}

window.markVideoCompleted = (id) => {
  const progress = loadProgress();
  if (progress.unlocked?.[id] !== true) return;
  if (progress.videos?.[id] === true) return;
  completeVideo(id);
};

// =========================
// APPLY LOCKS (index.html)
// =========================
function applyLocks() {
// Admin: πρόσβαση παντού
if (isAdminUser()) {
    ["btnGlos","btnVideos","btnHomework","btnForum","btnMaterial"].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) unlockBtn(btn);
    });
    return;
  }

  const mode = localStorage.getItem("mode");

  const btnGlos     = document.getElementById("btnGlos");
  const btnVideos   = document.getElementById("btnVideos");
  const btnHomework = document.getElementById("btnHomework");
  const btnForum    = document.getElementById("btnForum");
  const btnMaterial = document.getElementById("btnMaterial");

  if (!mode || mode === "guest") {
    [btnGlos, btnVideos, btnHomework, btnForum, btnMaterial].forEach(btn => {
      if (btn) lockBtn(btn);
    });
    return;
  }

  const progress = loadProgress();

  setBtn(btnGlos,     progress.unlocked.glossary);
  setBtn(btnVideos,   progress.unlocked.video1);
  setBtn(btnHomework, progress.unlocked.homework);
  setBtn(btnForum,    progress.unlocked.forum);
  setBtn(btnMaterial, progress.unlocked.material);
}

function lockBtn(btn) {
  btn.disabled = true;
  btn.style.opacity = "0.4";
  btn.style.cursor = "not-allowed";
  btn.style.filter = "grayscale(1)";
  btn.title = "🔒 Κλειδωμένο";
}

function unlockBtn(btn) {
  btn.disabled = false;
  btn.style.opacity = "";
  btn.style.cursor = "";
  btn.style.filter = "";
  btn.title = "";
}

function setBtn(btn, isUnlocked) {
  if (!btn) return;
  isUnlocked ? unlockBtn(btn) : lockBtn(btn);
}

// =========================
// PROGRESS PERCENT
// =========================
function getProgressPercent() {
  const mode = localStorage.getItem("mode");
  if (!mode || mode === "guest") return 0;

  const progress = loadProgress();
  const steps = [
    progress.unlocked.glossary,
    progress.videos.video1,
    progress.videos.video2,
    progress.videos.video3,
    progress.videos.video4,
    progress.videos.video5,
    progress.videos.video6,
    progress.videos.video7,
    progress.videos.video8,
    progress.videos.video9,
    progress.unlocked.homework
  ];

  const done = steps.filter(Boolean).length;
  return Math.round((done / steps.length) * 100);
}

// =========================
// NEXT STEP
// =========================
function getNextStep() {
  const mode = localStorage.getItem("mode");
  if (!mode || mode === "guest") return null;

  const progress = loadProgress();

  if (!progress.unlocked.glossary) {
    return { label: "📘 Άνοιξε το Info για να ξεκινήσεις", action: null };
  }
  if (!progress.glossaryVisited) {
    return { label: "📖 Συνέχισε στο Γλωσσάριο", action: "data/glos.html" };
  }
  for (let i = 1; i <= 9; i++) {
    if (!progress.videos[`video${i}`]) {
      return { label: `🎥 Συνέχισε στο Βίντεο ${i}`, action: "data/videos.html" };
    }
  }
  if (progress.unlocked.homework) {
    return { label: "🎉 Έχεις ολοκληρώσει όλο το υλικό!", action: null };
  }

  return null;
}

// =========================
// HOMEWORK UNLOCK SYSTEM
// =========================
const HOMEWORK_ORDER = [
  "basic",
  "advanced",
  "scenario_burned-lamp",
  "scenario_wiring-fault",
  "scenario_weak-lamp",
  "scenario_switch-fault",
  "scenario_socket",
  "scenario_breaker-trip",
  "scenario_short-circuit",
  "scenario_ground-fault",
  "scenario_overheated-socket",
  "quiz1",
  "quiz2",
  "quiz3",
  "quiz4",
  "quiz5"
];

function createDefaultHomeworkProgress() {
  const unlocked = {};
  const completed = {};
  HOMEWORK_ORDER.forEach((key, i) => {
    unlocked[key] = i === 0; // μόνο το πρώτο ξεκλειδωμένο
    completed[key] = false;
  });
  return { unlocked, completed };
}

function loadHomeworkProgress() {
  // Admin: όλα ξεκλειδωμένα
  if (isAdminUser()) {
    const full = createDefaultHomeworkProgress();
    Object.keys(full.unlocked).forEach(k => full.unlocked[k] = true);
    return full;
  }
  const id = getUserId();
  if (id === "guest") return createDefaultHomeworkProgress();
  try {
    const raw = localStorage.getItem(`homework_${id}`);
    if (!raw) {
      const fresh = createDefaultHomeworkProgress();
      saveHomeworkProgress(fresh);
      return fresh;
    }
    const saved = JSON.parse(raw);
    const defaults = createDefaultHomeworkProgress();
    return {
      unlocked:  { ...defaults.unlocked,  ...saved.unlocked  },
      completed: { ...defaults.completed, ...saved.completed }
    };
  } catch {
    return createDefaultHomeworkProgress();
  }
}

function saveHomeworkProgress(progress) {
  const id = getUserId();
  if (id === "guest") return;
  localStorage.setItem(`homework_${id}`, JSON.stringify(progress));
}

function completeHomeworkStep(key) {
  const mode = localStorage.getItem("mode");
  if (!mode || mode === "guest") return;

  const progress = loadHomeworkProgress();
  if (!progress.unlocked[key]) return;
  if (progress.completed[key]) return;

  progress.completed[key] = true;

  // ξεκλείδωμα επόμενου
  const index = HOMEWORK_ORDER.indexOf(key);
  if (index !== -1 && index < HOMEWORK_ORDER.length - 1) {
    const next = HOMEWORK_ORDER[index + 1];
    progress.unlocked[next] = true;
    showToast(`🔓 Ξεκλειδώθηκε: <b>${getHomeworkLabel(next)}</b>!`);
  } else if (index === HOMEWORK_ORDER.length - 1) {
    // τελευταίο quiz → μήνυμα επιτυχίας
    showToast("🎉 <b>Συγχαρητήρια!</b> Ολοκλήρωσες όλο το Ασκησιολόγιο!");
  }

  saveHomeworkProgress(progress);
  window.dispatchEvent(new Event("homeworkUpdated"));
}

function getHomeworkLabel(key) {
  const labels = {
    "basic":                      "Βασικές Ασκήσεις",
    "advanced":                   "Προχωρημένες Ασκήσεις",
    "scenario_burned-lamp":       "Σενάριο: Καμένη Λάμπα",
    "scenario_wiring-fault":      "Σενάριο: Πρόβλημα Καλωδίωσης",
    "scenario_weak-lamp":         "Σενάριο: Αστοχία Λάμπας",
    "scenario_switch-fault":      "Σενάριο: Ελαττωματικός Διακόπτης",
    "scenario_socket":            "Σενάριο: Συνδεσμολογία Πρίζας",
    "scenario_breaker-trip":      "Σενάριο: Πτώση Ασφάλειας",
    "scenario_short-circuit":     "Σενάριο: Βραχυκύκλωμα",
    "scenario_ground-fault":      "Σενάριο: Απουσία Γείωσης",
    "scenario_overheated-socket": "Σενάριο: Υπερθέρμανση Πρίζας",
    "quiz1": "Quiz Ενότητα 1",
    "quiz2": "Quiz Ενότητα 2",
    "quiz3": "Quiz Ενότητα 3",
    "quiz4": "Quiz Ενότητα 4",
    "quiz5": "Τυχαίο Quiz"
  };
  return labels[key] || key;
}

window.completeHomeworkStep = completeHomeworkStep;
window.loadHomeworkProgress = loadHomeworkProgress;
