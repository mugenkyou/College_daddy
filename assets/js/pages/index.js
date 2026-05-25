function initFeatureCards() {
  const cards = document.querySelectorAll(".feature-card");

  if (window.AOS && typeof window.AOS.init === "function") {
    window.AOS.init({
      offset: 120,
      duration: 700,
      easing: "ease-in-out",
      once: true,
    });
  }

  cards.forEach((card) => {
    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");

    const navigate = () => {
      const url = card.getAttribute("data-url");
      if (url) {
        window.location.href = url;
      }
    };

    card.addEventListener("click", navigate);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigate();
      }
    });
  });
}

function initTypingAnimation() {
  const target = document.getElementById("changingText");
  if (!target) {
    return;
  }

  const words = [
    "CGPA Calculator",
    "Study Timer",
    "Career Roadmaps",
    "Project Architect",
  ];
  let wordIndex = 0;
  let letterIndex = 0;

  const type = () => {
    const currentWord = words[wordIndex];
    letterIndex += 1;
    target.textContent = currentWord.slice(0, letterIndex);

    if (letterIndex === currentWord.length) {
      setTimeout(() => {
        letterIndex = 0;
        wordIndex = (wordIndex + 1) % words.length;
        type();
      }, 1300);
      return;
    }

    setTimeout(type, 95);
  };

  type();
}



document.addEventListener("DOMContentLoaded", () => {
  initFeatureCards();
  initTypingAnimation();
});
