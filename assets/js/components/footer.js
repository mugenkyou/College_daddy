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
      <section class="footer-section" aria-labelledby="footer-brand">
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
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </a>
        </div>
      </section>

      <section class="footer-section" aria-labelledby="footer-quick-links">
        <h3 id="footer-quick-links">Quick Links</h3>
        <ul>
          <li><a href="${homeHref}">Home</a></li>
          <li><a href="${pagePrefix}cgpa.html">CGPA Calculator</a></li>
          <li><a href="${pagePrefix}notes.html">Notes</a></li>
          <li><a href="${pagePrefix}project-architect.html">Project Architect</a></li>
          <li><a href="${pagePrefix}roadmap.html">Roadmap</a></li>
        </ul>
      </section>

      <section class="footer-section" aria-labelledby="footer-connect">
        <h3 id="footer-connect">Connect</h3>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSciD1CUiYUpiz4mtQSTYG9XeCRyG3CEhr9GNL03WxmRbFOgkw/viewform?usp=dialog"
          target="_blank"
          rel="noopener noreferrer"
          class="feedback-link"
        >
          Send Feedback
        </a>
        <p>Follow along for updates, tools, and study resources.</p>
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
