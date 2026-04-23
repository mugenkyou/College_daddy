document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".roadmap-card");

  cards.forEach((card) => {
    const target = card.getAttribute("data-target");
    if (!target) {
      return;
    }

    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");

    const navigate = () => {
      window.location.href = target;
    };

    card.addEventListener("click", navigate);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigate();
      }
    });
  });

  document.querySelectorAll("a[target='_blank']").forEach((link) => {
    const rel = link.getAttribute("rel") || "";
    if (!/noopener/.test(rel) || !/noreferrer/.test(rel)) {
      link.setAttribute("rel", "noopener noreferrer");
    }
  });
});
