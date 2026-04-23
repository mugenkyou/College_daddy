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

  const words = ["CGPA Calculator", "Study Timer", "Career Roadmaps"];
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

function initFaqAccessibility() {
  const questions = document.querySelectorAll(".faq-question");

  questions.forEach((question) => {
    if (question.tagName.toLowerCase() === "button") {
      return;
    }

    question.setAttribute("role", "button");
    question.setAttribute("tabindex", "0");
    question.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        question.click();
      }
    });
  });
}

function initFaqToggle() {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const trigger = item.querySelector(".faq-question");
    if (!trigger) {
      return;
    }

    trigger.addEventListener("click", () => {
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.classList.remove("active");
        }
      });

      item.classList.toggle("active");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initFeatureCards();
  initTypingAnimation();
  initFaqAccessibility();
  initFaqToggle();
});
