/**
 * Usha Institute of Computer Education - Global Shell & UI Controller
 * Standardizes identical Header, Footer, Theme & Language toggles across all pages
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderSharedHeader();
  renderSharedFooter();
  window.i18n.applyTranslations();
  initScrollEffects();
});

function initTheme() {
  const savedTheme = localStorage.getItem('usha_theme') || 
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('usha_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeToggleIcon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
}

function renderSharedHeader() {
  const headerMount = document.getElementById('siteHeaderMount');
  if (!headerMount) return;

  const currentPath = window.location.pathname;
  const token = localStorage.getItem('cmsAuthToken') || localStorage.getItem('studentAuthToken');
  const userRole = localStorage.getItem('userRole') || (localStorage.getItem('cmsAuthToken') ? 'admin' : '');

  headerMount.innerHTML = `
    <header class="site-header">
      <div class="container header-inner">
        <!-- Brand Logo & Title -->
        <a href="/" class="brand-wrapper">
          <img src="/uploads/logo.png" onerror="this.src='https://center.pmkvyedu.com/upload/logo/1787653813.png'" alt="Usha Institute Logo" class="brand-logo-img">
          <div class="brand-text-group">
            <span class="brand-title" data-i18n="institute_name">Usha Institute Of Computer Education</span>
            <span class="brand-sub">ATC: IN/UP/MAU/29172</span>
          </div>
        </a>

        <!-- Desktop Navigation -->
        <nav>
          <ul class="nav-menu">
            <li><a href="/" class="nav-link ${currentPath === '/' || currentPath === '/index.html' ? 'active' : ''}" data-i18n="nav_home">Home</a></li>
            <li><a href="/certificate" class="nav-link ${currentPath.includes('certificate') ? 'active' : ''}"><i class="fa-solid fa-award me-1"></i> Verify Certificate</a></li>
            <li><a href="/result" class="nav-link ${currentPath.includes('result') ? 'active' : ''}"><i class="fa-solid fa-square-poll-vertical me-1"></i> Marksheet / Result</a></li>
            <li><a href="/admit-card" class="nav-link ${currentPath.includes('admit') ? 'active' : ''}"><i class="fa-solid fa-id-card-clip me-1"></i> Admit Card</a></li>
            <li><a href="/courses" class="nav-link ${currentPath.includes('course') ? 'active' : ''}" data-i18n="nav_courses">Courses</a></li>
            <li><a href="/contact" class="nav-link ${currentPath.includes('contact') ? 'active' : ''}" data-i18n="nav_contact">Contact</a></li>
          </ul>
        </nav>

        <!-- Right Action Controls -->
        <div class="header-actions">
          <!-- Language Switcher -->
          <button class="lang-toggle-btn" onclick="window.i18n.toggleLanguage()" title="Switch Language">
            <i class="fa-solid fa-language"></i> <span id="langToggleText">${window.i18n.currentLang === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          <!-- Dark/Light Theme -->
          <button class="theme-toggle-btn" onclick="toggleTheme()" title="Toggle Dark/Light Mode">
            <i id="themeToggleIcon" class="fa-solid fa-moon"></i>
          </button>

          <!-- Login / Portal Button -->
          ${token ? `
            <a href="${userRole === 'admin' ? '/admin' : '/student-dashboard'}" class="btn btn-secondary btn-sm">
              <i class="fa-solid fa-gauge me-1"></i> <span data-i18n="nav_dashboard">Dashboard</span>
            </a>
          ` : `
            <a href="/student-login" class="nav-login-btn">
              <i class="fa-solid fa-user-lock"></i> <span data-i18n="nav_login">Login</span>
            </a>
          `}

          <!-- Header Document Verification Action Pill -->
          <a href="/certificate" class="btn btn-primary btn-pill btn-sm d-none d-sm-inline-flex">
            <i class="fa-solid fa-shield-check me-1"></i> Verify
          </a>

          <!-- Mobile Hamburger -->
          <button class="mobile-toggle" onclick="toggleMobileDrawer()" aria-label="Toggle Navigation">
            <i class="fa-solid fa-bars"></i>
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile Navigation Drawer -->
    <div id="mobileDrawer" class="mobile-drawer" onclick="handleDrawerBackdropClick(event)">
      <div class="mobile-drawer-content">
        <div class="mobile-drawer-header">
          <span class="brand-title" style="font-size: 20px;">USHA INSTITUTE</span>
          <button class="btn btn-secondary btn-sm" onclick="toggleMobileDrawer()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <ul class="mobile-drawer-links">
          <li><a href="/" data-i18n="nav_home">Home</a></li>
          <li><a href="/certificate"><i class="fa-solid fa-award me-2"></i>Verify Certificate & Marksheet</a></li>
          <li><a href="/result"><i class="fa-solid fa-square-poll-vertical me-2"></i>Examination Result Sheet</a></li>
          <li><a href="/admit-card"><i class="fa-solid fa-id-card-clip me-2"></i>Download Admit Card</a></li>
          <li><a href="/courses" data-i18n="nav_courses">Courses</a></li>
          <li><a href="/contact" data-i18n="nav_contact">Contact</a></li>
          <li><a href="/student-login" data-i18n="nav_login">Student Login</a></li>
          <li><a href="/admin">Staff & Admin Panel</a></li>
        </ul>
        <div class="mt-auto">
          <a href="/certificate" class="btn btn-primary btn-pill w-100"><i class="fa-solid fa-shield-check me-1"></i> Verify Document</a>
        </div>
      </div>
    </div>
  `;
}

function renderSharedFooter() {
  const footerMount = document.getElementById('siteFooterMount');
  if (!footerMount) return;

  footerMount.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <!-- Col 1: Institute Overview -->
          <div>
            <h4 class="footer-heading" data-i18n="institute_name">Usha Institute Of Computer Education</h4>
            <p class="footer-desc" data-i18n="footer_desc">
              Registered under Section 8, Ministry of Corporate Affairs, Govt. of India. ISO 9001:2015, 29990:2010 Certified Vocational & IT Academy.
            </p>
            <a href="/apply" class="btn btn-primary btn-pill btn-sm" data-i18n="nav_apply_now">Apply Now</a>
          </div>

          <!-- Col 2: Quick Links -->
          <div>
            <h5 class="footer-heading" style="font-size: 18px;" data-i18n="footer_quick_links">Quick Links</h5>
            <ul class="footer-links">
              <li><a href="/" data-i18n="nav_home">Home</a></li>
              <li><a href="/about" data-i18n="nav_about">About Us</a></li>
              <li><a href="/courses" data-i18n="nav_courses">Courses & Fees</a></li>
              <li><a href="/apply" data-i18n="nav_apply_online">Online Admission</a></li>
              <li><a href="/student-login" data-i18n="nav_login">Student Portal</a></li>
              <li><a href="/admin">Admin Panel</a></li>
            </ul>
          </div>

          <!-- Col 3: Student Services -->
          <div>
            <h5 class="footer-heading" style="font-size: 18px;">Examination</h5>
            <ul class="footer-links">
              <li><a href="/result" data-i18n="nav_student_result">Semester Result</a></li>
              <li><a href="/certificate" data-i18n="nav_verify_cert">Verify Certificate</a></li>
              <li><a href="/admit-card" data-i18n="nav_admit_card">Download Admit Card</a></li>
              <li><a href="/payment">Pay Fee Online</a></li>
            </ul>
          </div>

          <!-- Col 4: Contact Details -->
          <div>
            <h5 class="footer-heading" style="font-size: 18px;" data-i18n="footer_contact_info">Campus Contact</h5>
            <div class="footer-contact-item">
              <i class="fa-solid fa-location-dot mt-1" style="color: var(--maroon);"></i>
              <span data-i18n="footer_address">Hanuman Mandir ke pass, Pahasa Bazar, Mau, Uttar Pradesh 221705</span>
            </div>
            <div class="footer-contact-item">
              <i class="fa-solid fa-phone mt-1" style="color: var(--maroon);"></i>
              <a href="tel:+917275043143" data-i18n="footer_phone">+91-7275043143</a>
            </div>
            <div class="footer-contact-item">
              <i class="fa-solid fa-envelope mt-1" style="color: var(--maroon);"></i>
              <a href="mailto:ushainstitutepahasa@gmail.com" data-i18n="footer_email">ushainstitutepahasa@gmail.com</a>
            </div>

            <div class="footer-socials">
              <a href="#" class="social-circle-btn" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
              <a href="#" class="social-circle-btn" aria-label="Twitter"><i class="fa-brands fa-x-twitter"></i></a>
              <a href="#" class="social-circle-btn" aria-label="YouTube"><i class="fa-brands fa-youtube"></i></a>
              <a href="#" class="social-circle-btn" aria-label="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <div>
            &copy; 2026 <span data-i18n="institute_name">Usha Institute Of Computer Education</span>. <span data-i18n="footer_rights">All Rights Reserved.</span>
          </div>
          <div class="footer-legal-links">
            <a href="#" data-i18n="footer_privacy">Privacy Policy</a>
            <a href="#" data-i18n="footer_terms">Terms & Conditions</a>
            <a href="#" data-i18n="footer_refund">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

function toggleMobileDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  if (drawer) drawer.classList.toggle('open');
}

function handleDrawerBackdropClick(e) {
  if (e.target.id === 'mobileDrawer') {
    toggleMobileDrawer();
  }
}

function initScrollEffects() {
  window.addEventListener('scroll', () => {
    const header = document.querySelector('.site-header');
    if (header) {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  });
}
