/**
 * Usha Institute - Global UI Helpers (Zero native alert/prompt/confirm)
 * Provides: Toast notifications, Modal dialogs, Confirm dialogs, Language toggle (English/Hindi)
 */

(function() {
  window.UshaUI = {
    // Current Language state
    lang: localStorage.getItem('usha_lang') || 'en',

    setLanguage(lang) {
      this.lang = lang;
      localStorage.setItem('usha_lang', lang);
      document.body.classList.toggle('lang-hi', lang === 'hi');
      
      // Update data-i18n elements
      document.querySelectorAll('[data-en]').forEach(el => {
        const text = lang === 'hi' ? (el.getAttribute('data-hi') || el.getAttribute('data-en')) : el.getAttribute('data-en');
        if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
          el.setAttribute('placeholder', text);
        } else {
          el.innerHTML = text;
        }
      });

      // Update button label
      const btn = document.getElementById('globalLangToggle');
      if (btn) {
        btn.innerHTML = lang === 'hi' ? '🌐 English' : '🌐 हिन्दी';
      }
    },

    toggleLanguage() {
      this.setLanguage(this.lang === 'en' ? 'hi' : 'en');
    },

    // Styled Toast Notification
    toast(message, type = 'info', title = '') {
      let toastContainer = document.getElementById('ushaToastContainer');
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'ushaToastContainer';
        toastContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;max-width:380px;';
        document.body.appendChild(toastContainer);
      }

      const colors = {
        success: { bg: '#DCFCE7', border: '#15803D', text: '#15803D', icon: 'fa-circle-check' },
        warning: { bg: '#FEF3C7', border: '#B45309', text: '#B45309', icon: 'fa-triangle-exclamation' },
        danger: { bg: '#FEE2E2', border: '#B91C1C', text: '#B91C1C', icon: 'fa-circle-xmark' },
        info: { bg: '#DBEAFE', border: '#1D4ED8', text: '#1D4ED8', icon: 'fa-circle-info' }
      };

      const c = colors[type] || colors.info;

      const toast = document.createElement('div');
      toast.style.cssText = `background:${c.bg};border:1.5px solid ${c.border};color:${c.text};padding:12px 16px;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,0.12);font-size:13px;font-weight:600;display:flex;align-items:flex-start;gap:10px;animation:fadeIn 0.25s ease;`;
      toast.innerHTML = `
        <i class="fa-solid ${c.icon}" style="font-size:18px;margin-top:2px;"></i>
        <div style="flex:1;">
          ${title ? `<div style="font-weight:700;margin-bottom:2px;">${title}</div>` : ''}
          <div>${message}</div>
        </div>
        <button style="background:none;border:none;cursor:pointer;color:${c.text};font-size:16px;line-height:1;" onclick="this.parentElement.remove()">&times;</button>
      `;

      toastContainer.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 5000);
    },

    // Modal Dialog (Replaces alert())
    alert(title, message, type = 'info') {
      return new Promise((resolve) => {
        let modalEl = document.getElementById('ushaGlobalModal');
        if (!modalEl) {
          modalEl = document.createElement('div');
          modalEl.id = 'ushaGlobalModal';
          modalEl.className = 'modal fade';
          modalEl.tabIndex = -1;
          modalEl.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content border-0 shadow-lg" style="border-radius:12px;overflow:hidden;">
                <div class="modal-header bg-navy-lead py-3" style="border-bottom:2px solid var(--color-gold-500);">
                  <h6 class="modal-title fw-bold text-warning mb-0" id="ushaModalTitle">Notice</h6>
                  <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4" id="ushaModalBody" style="font-size:14px;color:var(--color-slate-900);"></div>
                <div class="modal-footer bg-light py-2">
                  <button type="button" class="btn btn-torch-primary" data-bs-dismiss="modal" id="ushaModalOkBtn">OK</button>
                </div>
              </div>
            </div>
          `;
          document.body.appendChild(modalEl);
        }

        document.getElementById('ushaModalTitle').textContent = title;
        document.getElementById('ushaModalBody').innerHTML = message;
        
        const modal = new bootstrap.Modal(modalEl);
        const okBtn = document.getElementById('ushaModalOkBtn');
        const onHide = () => {
          modalEl.removeEventListener('hidden.bs.modal', onHide);
          resolve();
        };
        modalEl.addEventListener('hidden.bs.modal', onHide);
        modal.show();
      });
    },

    // Confirm Dialog (Replaces confirm())
    confirm(title, message) {
      return new Promise((resolve) => {
        let modalEl = document.getElementById('ushaConfirmModal');
        if (!modalEl) {
          modalEl = document.createElement('div');
          modalEl.id = 'ushaConfirmModal';
          modalEl.className = 'modal fade';
          modalEl.tabIndex = -1;
          modalEl.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content border-0 shadow-lg" style="border-radius:12px;overflow:hidden;">
                <div class="modal-header bg-navy-lead py-3" style="border-bottom:2px solid var(--color-gold-500);">
                  <h6 class="modal-title fw-bold text-warning mb-0" id="ushaConfirmTitle">Confirm Action</h6>
                  <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4" id="ushaConfirmBody" style="font-size:14px;color:var(--color-slate-900);"></div>
                <div class="modal-footer bg-light py-2">
                  <button type="button" class="btn btn-outline-secondary btn-sm" id="ushaConfirmCancelBtn" data-bs-dismiss="modal">Cancel</button>
                  <button type="button" class="btn btn-torch-primary btn-sm" id="ushaConfirmOkBtn">Confirm</button>
                </div>
              </div>
            </div>
          `;
          document.body.appendChild(modalEl);
        }

        document.getElementById('ushaConfirmTitle').textContent = title;
        document.getElementById('ushaConfirmBody').innerHTML = message;

        const modal = new bootstrap.Modal(modalEl);
        let confirmed = false;

        const okBtn = document.getElementById('ushaConfirmOkBtn');
        okBtn.onclick = () => {
          confirmed = true;
          modal.hide();
        };

        const onHide = () => {
          modalEl.removeEventListener('hidden.bs.modal', onHide);
          resolve(confirmed);
        };
        modalEl.addEventListener('hidden.bs.modal', onHide);
        modal.show();
      });
    }
  };

  // Initialize language on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    window.UshaUI.setLanguage(window.UshaUI.lang);
  });
})();
