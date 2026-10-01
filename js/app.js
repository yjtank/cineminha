const menu = document.getElementById("menu");
const sidebar = document.getElementById("sidebar");
const closeMenu = document.getElementById("close-menu");

menu.addEventListener("click", () => {
    sidebar.classList.add("active");
});

closeMenu.addEventListener("click", () => {
  sidebar.classList.remove("active");
});