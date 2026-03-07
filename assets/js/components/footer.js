document.addEventListener("DOMContentLoaded", () => {
  const footer = document.createElement("footer");
  footer.className = "footer";

  footer.innerHTML = `
    <div class="footer-content">
      <div class="footer-section">
        <h3>College Daddy</h3>
        <p>Your ultimate companion for academic success.</p>
        <p class="tagline">
          Developed with students in mind, for students by a student.
        </p>

        <div class="social-links">
          <a href="https://www.linkedin.com/company/collegedaddy-tech"
             target="_blank"
             class="social-link"
             aria-label="LinkedIn">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </a>

        </div>
      </div>

      <div class="footer-section">
        <h3>Quick Links</h3>
        <ul>
          <li><a href="/index.html">College Daddy Home</a></li>
          <li><a href="/pages/cgpa.html">College Daddy CGPA Calculator</a></li>
          <li><a href="/pages/notes.html">College Daddy Notes</a></li>
          <li><a href="/pages/roadmap.html">College Daddy Roadmap</a></li>
        </ul>
      </div>

      <div class="footer-section">
        <h3>Connect</h3>
        <p>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSciD1CUiYUpiz4mtQSTYG9XeCRyG3CEhr9GNL03WxmRbFOgkw/viewform?usp=dialog"
             target="_blank"
             class="feedback-link">
            Send Feedback to College Daddy
          </a>
        </p>
        <p>
          Follow our journey on social media for updates and resources.
        </p>
      </div>
    </div>

    <div class="footer-bottom">
      <p>
        &copy; 2025 College Daddy. All rights reserved.
        Developed by <span class="developer-name">Sachin</span>
      </p>
    </div>
  `;

  document.body.appendChild(footer);
});
