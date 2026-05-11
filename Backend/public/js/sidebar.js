document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("sidebar-toggle");
  const sidebar = document.querySelector(".sidebar");
  
  if (toggleBtn && sidebar) {
    // Start collapsed on mobile
    if (window.innerWidth <= 768) {
      sidebar.classList.add("collapsed");
    }

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebar.classList.toggle("collapsed");
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", (e) => {
      if (window.innerWidth <= 768 && 
          !sidebar.contains(e.target) && 
          !toggleBtn.contains(e.target) && 
          !sidebar.classList.contains("collapsed")) {
        sidebar.classList.add("collapsed");
      }
    });
  }
});
