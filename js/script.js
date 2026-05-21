'use strict';

/* ──────────────────────────────────────────────
   AUTH HELPERS
────────────────────────────────────────────── */
const Auth = {
  login(user) {
    sessionStorage.setItem('sitta_user', JSON.stringify(user));
  },
  logout() {
    sessionStorage.removeItem('sitta_user');
    window.location.href = 'index.html';
  },
  getUser() {
    const u = sessionStorage.getItem('sitta_user');
    return u ? JSON.parse(u) : null;
  },
  requireAuth() {
    if (!this.getUser()) {
      window.location.href = 'index.html';
      return null;
    }
    return this.getUser();
  }
};

/* ──────────────────────────────────────────────
   MODAL HELPERS (Vanilla JS for non-Vue pages)
────────────────────────────────────────────── */
function openModal(id)  {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}
// Global listeners for non-Vue pages (index, dashboard)
if (window.location.pathname.includes('index.html') || window.location.pathname.includes('dashboard.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      }
    });
}

/* ──────────────────────────────────────────────
   ALERT HELPER
────────────────────────────────────────────── */
function showAlert(containerId, type, message) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="alert alert-${type}" role="alert">
      <span>${message}</span>
    </div>`;
  setTimeout(() => { container.innerHTML = ''; }, 4500);
}

/* ──────────────────────────────────────────────
   GREETING HELPER
────────────────────────────────────────────── */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 11) return { text: 'Selamat Pagi',  icon: '🌅' };
  if (hour >= 11 && hour < 15) return { text: 'Selamat Siang', icon: '☀️' };
  if (hour >= 15 && hour < 19) return { text: 'Selamat Sore',  icon: '🌇' };
  return { text: 'Selamat Malam', icon: '🌙' };
}

/* ──────────────────────────────────────────────
   SIDEBAR TOGGLE (mobile)
────────────────────────────────────────────── */
function initSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  const hamburger = document.getElementById('hamburger');
  if (!sidebar) return;

  function openSidebar()  { sidebar.classList.add('open'); if(overlay) overlay.style.display = 'block'; }
  function closeSidebar() { sidebar.classList.remove('open'); if(overlay) overlay.style.display = 'none'; }

  if (hamburger) hamburger.addEventListener('click', openSidebar);
  if (overlay)   overlay.addEventListener('click', closeSidebar);
}

/* ──────────────────────────────────────────────
   USER AVATAR INITIAL
────────────────────────────────────────────── */
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/* ──────────────────────────────────────────────
   PAGE: LOGIN (index.html)
────────────────────────────────────────────── */
function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  if (Auth.getUser()) {
    window.location.href = 'dashboard.html';
    return;
  }

  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showAlert('loginAlert', 'danger', 'Email dan password tidak boleh kosong.');
      return;
    }

    const user = dataPengguna.find(u => u.email === email && u.password === password);
    if (user) {
      Auth.login(user);
      window.location.href = 'dashboard.html';
    } else {
      showAlert('loginAlert', 'danger', 'Email atau password yang Anda masukkan salah.');
      document.getElementById('password').value = '';
    }
  });

  const togglePwd = document.getElementById('togglePassword');
  if (togglePwd) {
    togglePwd.addEventListener('click', function() {
      const pwd = document.getElementById('password');
      const isText = pwd.type === 'text';
      pwd.type = isText ? 'password' : 'text';
      togglePwd.textContent = isText ? '👁' : '🙈';
    });
  }
}

/* ──────────────────────────────────────────────
   PAGE: DASHBOARD (dashboard.html)
────────────────────────────────────────────── */
function initDashboardPage() {
  const el = document.getElementById('dashboardPage');
  if (!el) return;

  const user = Auth.requireAuth();
  if (!user) return;

  document.querySelectorAll('.js-user-name').forEach(e => e.textContent = user.nama);
  document.querySelectorAll('.js-user-role').forEach(e => e.textContent = user.role);
  document.querySelectorAll('.js-user-lokasi').forEach(e => e.textContent = user.lokasi);
  document.querySelectorAll('.js-user-avatar').forEach(e => e.textContent = getInitials(user.nama));

  const g = getGreeting();
  document.querySelectorAll('.js-greeting').forEach(e => {
    e.textContent = `${g.icon}  ${g.text}, ${user.nama.split(' ')[0]}!`;
  });

  if (typeof app !== 'undefined') {
    const totalBahanAjar  = app.$data.stok.length;
    const totalStok       = app.$data.stok.reduce((s, b) => s + b.qty, 0);
    const totalDO         = Object.keys(app.$data.tracking).length;

    const elTotal = document.getElementById('statTotal');
    const elStok  = document.getElementById('statStok');
    const elDO    = document.getElementById('statDO');
    if (elTotal) elTotal.textContent = totalBahanAjar;
    if (elStok)  elStok.textContent  = totalStok.toLocaleString('id-ID');
    if (elDO)    elDO.textContent    = totalDO;
  }

  document.querySelectorAll('.js-logout').forEach(btn => {
    btn.addEventListener('click', Auth.logout.bind(Auth));
  });

  updateClock();
  setInterval(updateClock, 1000);

  initSidebar();
  initDropdownNav();
}

function updateClock() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = now.toLocaleDateString('id-ID', options);
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const elDate = document.getElementById('tanggalHari');
  const elTime = document.getElementById('jamSekarang');
  if (elDate) elDate.textContent = dateStr;
  if (elTime) elTime.textContent = timeStr;
}

function initDropdownNav() {
  document.querySelectorAll('.nav-item.has-sub').forEach(item => {
    item.addEventListener('click', function(e) {
      const sub = this.querySelector('.nav-sub');
      if (sub) sub.classList.toggle('open');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLoginPage();
  initDashboardPage();
});
