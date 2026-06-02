// =====================
// ELEMENTS
// =====================
const el = (id) => document.getElementById(id);

const fileInput = el("matFile");
const filePreview = el("filePreview");
const container = el("materialContainer");
const addBtn = el("addMaterialBtn");
const filterType = el("filterType");
const filterCategory = el("filterCategory");
const searchInput = el("searchInput");
const customCategoryInput = el("customCategory");

const user = getCurrentUser();

// =====================
// HELPERS
// =====================
const isNew = (date) =>
  Date.now() - new Date(date).getTime() < 86400000;

const getIcon = (type) => ({
  video: "🎥",
  doc: "📄",
  link: "🔗"
}[type] || "🔗");

const getYouTubeData = (url) => {
  try {
    const u = new URL(url);

    let id = null;

    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.slice(1);
    } 
    else if (u.searchParams.get("v")) {
      id = u.searchParams.get("v");
    } 
    else if (u.pathname.includes("/shorts/")) {
      id = u.pathname.split("/shorts/")[1];
    }

    if (!id) return null;

    return {
      id,
      embed: `https://www.youtube.com/embed/${id}`,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    };

  } catch {
    return null;
  }
};

const cleanYouTubeUrl = (url) => {
  try {
    const u = new URL(url);

    const id = u.searchParams.get("v");
    if (id) {
      return `https://www.youtube.com/watch?v=${id}`;
    }

    return url;
  } catch {
    return url;
  }
};


// =====================
// LOCAL STORAGE
// =====================
const getMaterials = () =>
  JSON.parse(localStorage.getItem("materials") || "[]");

const saveMaterials = (data) =>
  localStorage.setItem("materials", JSON.stringify(data));

// =====================
// EVENTS
// =====================
el("matCategory").onchange = (e) => {
  customCategoryInput.style.display =
    e.target.value === "custom" ? "block" : "none";
};

fileInput.onchange = () => {
  const file = fileInput.files[0];
  filePreview.textContent = file ? `Επιλέχθηκε: ${file.name}` : "";
};

if (user?.role === "admin") {
  addBtn.style.display = "inline-block";
}

// =====================
// CREATE CARD
// =====================
function createCard(item) {
  const div = document.createElement("div");
  div.className = "card";

  const header = document.createElement("div");
  header.className = "card-header";

  const title = document.createElement("h3");
  title.textContent = `${getIcon(item.type)} ${item.title}`;

  if (isNew(item.createdAt)) {
    const badge = document.createElement("span");
    badge.textContent = " NEW";
    badge.style.background = "#ff5252";
    badge.style.color = "white";
    badge.style.padding = "2px 6px";
    badge.style.borderRadius = "6px";
    badge.style.marginLeft = "6px";
    badge.style.fontSize = "12px";
    title.appendChild(badge);
  }

  header.appendChild(title);

  const body = document.createElement("div");
  body.className = "card-body";
  body.textContent = item.desc || "Χωρίς περιγραφή";

  const meta = document.createElement("div");
  meta.className = "card-meta";

  // 🔥 format date σωστά για εμφάνιση
  const formatDate = (iso) => {
    return new Date(iso).toLocaleString("el-GR");
  };

  meta.innerHTML = `
    <span>${item.category}</span>
    <span>${formatDate(item.createdAt)}</span>
  `;

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const preview = document.createElement("div");
  preview.className = "preview";

  if (item.type === "video" && item.link) {
  const yt = getYouTubeData(item.link);

  if (yt) {
    const wrapper = document.createElement("div");
    wrapper.className = "video-thumb";

    const img = document.createElement("img");
    img.src = yt.thumbnail;

    const play = document.createElement("div");
    play.className = "play-btn";
    play.textContent = "▶";

    wrapper.append(img, play);

    wrapper.onclick = () => {
      window.open(item.link, "_blank");
    };

    preview.appendChild(wrapper);
  }
}
 else if (item.fileData && item.fileName.endsWith(".pdf")) {
    const iframe = document.createElement("iframe");
    iframe.src = item.fileData;
    iframe.width = "100%";
    iframe.height = "200";
    preview.appendChild(iframe);
  }

  const actionRow = document.createElement("div");
  actionRow.className = "action-row";

  const openBtn = document.createElement("a");
  openBtn.className = "open-btn";

  if (item.fileData) {
    openBtn.href = item.fileData;
    openBtn.download = item.fileName;
    openBtn.textContent = "📥 Κατέβασμα";
  } else {
    openBtn.href = item.link;
    openBtn.target = "_blank";
    openBtn.textContent = "📂 Άνοιγμα";
  }

  actionRow.appendChild(openBtn);

  if (user?.role === "admin") {
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.className = "edit-btn";
    editBtn.onclick = () => editItem(item.id);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑";
    deleteBtn.className = "delete-btn";
    deleteBtn.onclick = () => deleteItem(item.id);

    actionRow.append(editBtn, deleteBtn);
  }

  actions.append(preview, actionRow);
  div.append(header, body, meta, actions);

  return div;
}

// =====================
// RENDER (FIXED ORDER)
// =====================
function render() {
  const data = getMaterials();
  container.innerHTML = "";

  const filtered = data.filter(item =>
    (filterType.value === "all" || item.type === filterType.value) &&
    (filterCategory.value === "all" || item.category === filterCategory.value) &&
    item.title.toLowerCase().includes(searchInput.value.toLowerCase())
  );

  if (!filtered.length) {
    container.innerHTML = `
  <div style="text-align:center; padding:50px; color:#777;">
    <h2>📭 Δεν υπάρχει υλικό</h2>
    <p>Ξεκίνα προσθέτοντας το πρώτο σου αρχείο 👇</p>
  </div>
`;
    return;
  }

  // 🔥 1. GLOBAL SORT (NEW → OLD)
  const sorted = [...filtered].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  // 🔥 2. GROUP ΧΩΡΙΣ ΝΑ ΧΑΛΑΣΕΙ Η ΣΕΙΡΑ
  const grouped = {};

  sorted.forEach(item => {
    const cat = item.category || "Άλλο";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  // 🔥 3. SORT CATEGORIES ΜΕ ΒΑΣΗ ΤΟ ΠΙΟ ΠΡΟΣΦΑΤΟ POST
  const sortedCategories = Object.keys(grouped).sort((a, b) =>
    grouped[b][0].createdAt.localeCompare(grouped[a][0].createdAt)
  );

  // 🔥 4. RENDER
  sortedCategories.forEach(category => {
    const title = document.createElement("h2");
	title.textContent = `📚 ${category}`;
	title.style.cursor = "pointer";
	title.style.transition = "0.2s";

	title.onmouseenter = () => title.style.color = "#1976d2";
	title.onmouseleave = () => title.style.color = "#333";
    container.appendChild(title);

    grouped[category].forEach(item => {
      container.appendChild(createCard(item));
    });
  });
}

// =====================
// ADD (ADMIN ONLY)
// =====================
function saveMaterial() {
  if (!user || user.role !== "admin") {
    alert("Δεν έχεις δικαίωμα προσθήκης!");
    return;
  }

  const title = el("matTitle").value.trim();
  const desc = el("matDesc").value;
  const type = el("matType").value;

  let category = el("matCategory").value;
  if (category === "custom") {
    category = customCategoryInput.value || "Άλλο";
  }

  const link = el("matLink").value;
  const file = fileInput.files[0];

  if (!title) return alert("Βάλε τίτλο!");

  const addItem = (extra) => {
    const data = getMaterials();

    data.push({
      id: crypto.randomUUID(),
      title,
      desc,
      type,
      category,
      createdAt: new Date().toISOString(),
      ...extra
    });

    saveMaterials(data);
    closeModal();
    render();
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      addItem({
        fileName: file.name,
        fileData: e.target.result
      });
    };
    reader.readAsDataURL(file);
    return;
  }

  if (!link) return alert("Βάλε link ή αρχείο!");

  addItem({ link });
}

// =====================
// DELETE
// =====================
function deleteItem(id) {
  if (!user || user.role !== "admin") {
    alert("Δεν έχεις δικαίωμα διαγραφής!");
    return;
  }

  if (!confirm("Σίγουρα θες διαγραφή;")) return;

  const data = getMaterials().filter(item => item.id !== id);
  saveMaterials(data);
  render();
}

// =====================
// EDIT
// =====================
function editItem(id) {
  if (!user || user.role !== "admin") {
    alert("Δεν έχεις δικαίωμα επεξεργασίας!");
    return;
  }

  const data = getMaterials();
  const item = data.find(x => x.id === id);

  const title = prompt("Νέος τίτλος:", item.title);
  if (!title) return;

  item.title = title;
  item.desc = prompt("Νέα περιγραφή:", item.desc);

  saveMaterials(data);
  render();
}

// =====================
// MODAL
// =====================
function closeModal() {
  el("modal").style.display = "none";

  ["matTitle","matDesc","matLink"].forEach(id => el(id).value = "");
  fileInput.value = "";
  filePreview.textContent = "";
}

addBtn.onclick = () => {
  if (!user || user.role !== "admin") {
    alert("Δεν έχεις πρόσβαση!");
    return;
  }
  el("modal").style.display = "flex";
};

// =====================
// FILTERS
// =====================
filterType.onchange = render;
filterCategory.onchange = render;

let timer;
searchInput.oninput = () => {
  clearTimeout(timer);
  timer = setTimeout(render, 300);
};

// =====================
// INIT
// =====================
render();
