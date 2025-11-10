document.addEventListener("DOMContentLoaded", () => {
  // Detect whether the current page is in /pages/
  const isInPages = window.location.pathname.includes("/pages/");
  
  // Correct relative path for navbar.html
  const navbarPath = isInPages
    ? "../components/navbar.html"   // for pages inside /pages/
    : "components/navbar.html";     // for index.html in root

  // Load navbar
  fetch(navbarPath)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then(data => {
      document.body.insertAdjacentHTML("afterbegin", data);
      console.log("Navbar loaded from:", navbarPath);

    })
    .catch(err => console.error("Navbar load error:", err));


});
