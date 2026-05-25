document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("footer.footer")) {
    return;
  }

  const isNestedPage = window.location.pathname
    .toLowerCase()
    .includes("/pages/");
  const homeHref = isNestedPage ? "../index.html" : "index.html";
  const pagePrefix = isNestedPage ? "" : "pages/";

  const footer = document.createElement("footer");
  footer.className = "footer";

  footer.innerHTML = `
    <div class="footer-content">
      <div class="footer-main-grid">
        <section class="footer-section brand-section" aria-labelledby="footer-brand">
          <h3 id="footer-brand">College Daddy</h3>
          <p>Your practical companion for academic success.</p>
          <p class="tagline">Built for students by a student.</p>
          <div class="social-links" aria-label="Social links">
            <a
              href="https://www.linkedin.com/company/collegedaddy-tech"
              target="_blank"
              rel="noopener noreferrer"
              class="social-link"
              aria-label="College Daddy on LinkedIn"
            >
              <i class="fab fa-linkedin-in"></i>
            </a>
          </div>
        </section>

        <section class="footer-section" aria-labelledby="footer-quick-links">
          <h3 id="footer-quick-links">Quick Links</h3>
          <ul>
            <li><a href="${homeHref}"><i class="fas fa-home"></i> Home</a></li>
            <li><a href="${pagePrefix}cgpa.html"><i class="fas fa-calculator"></i> CGPA Calculator</a></li>
            <li><a href="${pagePrefix}notes.html"><i class="fas fa-book"></i> Notes</a></li>
            <li><a href="${pagePrefix}roadmap.html"><i class="fas fa-map-signs"></i> Roadmap</a></li>
          </ul>
        </section>

        <section class="footer-section" aria-labelledby="footer-legal">
          <h3 id="footer-legal">Legal</h3>
          <ul>
            <li><a href="${pagePrefix}privacy.html"><i class="fas fa-user-shield"></i> Privacy Policy</a></li>
            <li><a href="${pagePrefix}terms.html"><i class="fas fa-file-contract"></i> Terms of Service</a></li>
          </ul>
        </section>

        <section class="footer-section" aria-labelledby="footer-resources">
          <h3 id="footer-resources">Resources</h3>
          <ul>
            <li><a href="${pagePrefix}docs.html"><i class="fas fa-book-open"></i> Documentation</a></li>
            <li><a href="${pagePrefix}faq.html"><i class="fas fa-question-circle"></i> FAQ</a></li>
          </ul>
        </section>
      </div>

      <div class="footer-divider"></div>

      <section class="footer-section connect-section" aria-labelledby="footer-connect">
        <h3 id="footer-connect">Connect</h3>
        <div class="connect-content">
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSciD1CUiYUpiz4mtQSTYG9XeCRyG3CEhr9GNL03WxmRbFOgkw/viewform?usp=dialog"
            target="_blank"
            rel="noopener noreferrer"
            class="feedback-link"
          >
            <i class="fas fa-comment-dots"></i> Send Feedback
          </a>
          <p>Follow along for updates, tools, and study resources.</p>
        </div>
      </section>
    </div>

    <div class="footer-bottom">
      <p>
        &copy; ${new Date().getFullYear()} College Daddy. All rights reserved.
        Built by <span class="developer-name">Sachin</span>.
      </p>
    </div>
  `;

  document.body.appendChild(footer);
});
