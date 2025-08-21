// Page switching
function switchPage(page) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.style.display = 'none');

  const selectedPage = document.getElementById(`page-${page}`);
  if (selectedPage) selectedPage.style.display = 'block';

  if (page === "bot") {
      document.querySelector(".upper").style.display = 'none';
  } else {
      document.querySelector(".upper").style.display = 'block';
  }
}

// Event listener for menu items
document.addEventListener("DOMContentLoaded", function () {
  const accountBtn = document.getElementById("accountBtn");
  if (accountBtn) {
      accountBtn.addEventListener("click", function () {
          switchPage("settings");
      });
  }

  const trustedContactBtn = document.getElementById("trustedContactBtn");
  if (trustedContactBtn) {
      trustedContactBtn.addEventListener("click", function () {
          switchPage("trustedcontact");
      });
  }

  const personalInfoBtn = document.getElementById("personalInfoBtn");
  if (personalInfoBtn) {
      personalInfoBtn.addEventListener("click", function () {
          switchPage("personalinfo");
      });
  }
});

// Add dark mode CSS dynamically
function enableDarkModeCSS() {
  if (!document.getElementById('dark-mode-css')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './assest/style/darkMode.css';
    link.id = 'dark-mode-css';
    document.head.appendChild(link);
  }
}

// Remove dark mode CSS
function disableDarkModeCSS() {
  const existing = document.getElementById('dark-mode-css');
  if (existing) {
    existing.remove();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById('darkToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const isActive = toggle.classList.toggle('active');
      document.body.classList.toggle('dark-mode', isActive);
      
      if (isActive) {
        enableDarkModeCSS();
      } else {
        disableDarkModeCSS();
      }
    });
  }
});

