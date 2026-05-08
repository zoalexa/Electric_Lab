window.onload = function() {

    // κουμπί γλωσσάριο
    document.getElementById("btnGlos").onclick = function() {
        window.location.href = "data/glos.html";
    };

    // κουμπί video lessons
    document.getElementById("btnVideos").onclick = function() {
        window.location.href = "data/videos.html";
    };


    // κουμπί βοήθειας-info
    document.getElementById("btnHelp").onclick = function() {
       openHelpModal();
    };
};

function openHelpModal() {
  document.getElementById("helpModal").style.display = "flex";
}

function closeHelpModal() {
  document.getElementById("helpModal").style.display = "none";
}

function openHomework() {
  window.location.href = "homework/homework.html";
}

function openForum() {
  window.location.href = "forum/forum.html";
}

function openMaterial() {
  window.location.href = "material/material.html";
}
