window.addEventListener("DOMContentLoaded", () => {

  const btnGlos     = document.getElementById("btnGlos");
  const btnVideos   = document.getElementById("btnVideos");
  const btnHelp     = document.getElementById("btnHelp");
  const btnHomework = document.getElementById("btnHomework");
  const btnForum    = document.getElementById("btnForum");
  const btnMaterial = document.getElementById("btnMaterial");

  if (btnHelp) {
    btnHelp.onclick = () => {
      document.getElementById("helpModal").style.display = "flex";
    };
  }

  if (btnGlos) {
    btnGlos.onclick = () => {
      window.location.href = "data/glos.html";
    };
  }

  if (btnVideos) {
    btnVideos.onclick = () => {
      const p = loadProgress();
      if (p.unlocked.video1) window.location.href = "data/videos.html";
    };
  }

  if (btnHomework) {
    btnHomework.onclick = () => {
      const p = loadProgress();
      if (p.unlocked.homework) window.location.href = "homework/homework.html";
    };
  }

  if (btnForum) {
    btnForum.onclick = () => {
      const p = loadProgress();
      if (p.unlocked.forum) window.location.href = "forum/forum.html";
    };
  }

  if (btnMaterial) {
    btnMaterial.onclick = () => {
      const p = loadProgress();
      if (p.unlocked.material) window.location.href = "material/material.html";
    };
  }

});

function closeHelpModal() {
  document.getElementById("helpModal").style.display = "none";
  if (typeof unlockGlossaryFromInfo === "function") {
    unlockGlossaryFromInfo();
  }
}
