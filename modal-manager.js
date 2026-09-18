// ─────────────────────────────────────────────────────────────────────────────
// modal-manager.js
// 알림 / 확인 / 입력 / 튜토리얼 모달 로직 분리 모듈
//
// 의존: openModalWithFocus, closeModalWithFocus (app.js 전역 함수)
// 사용: CommissionApp.ModalManager.initAll(clearAllCallback)
//       CommissionApp.ModalManager.alert(msg)
//       CommissionApp.ModalManager.confirm(msg, callback)
//       CommissionApp.ModalManager.prompt(msg, defaultText, callback)
// ─────────────────────────────────────────────────────────────────────────────

(function (CommissionApp) {
  'use strict';

  // ── 내부 콜백 저장소 ───────────────────────────────────────────
  let _confirmCallback = null;
  let _promptCallback  = null;

  // ── 공통: 메시지 텍스트를 안전하게 DOM에 삽입 ─────────────────
  function _setMsgEl(msgEl, msg) {
    if (!msgEl) return;
    msgEl.replaceChildren();
    const lines = String(msg).split(/<br\s*\/?>|\n/gi);
    lines.forEach((line, idx) => {
      if (idx > 0) msgEl.appendChild(document.createElement('br'));
      msgEl.appendChild(document.createTextNode(line));
    });
  }

  // ── alert 모달 ────────────────────────────────────────────────
  function _initAlertModal() {
    const modal = document.getElementById('alert-modal');
    if (!modal) return;
    document.getElementById('alert-ok')?.addEventListener('click', () => {
      closeModalWithFocus(modal);
    });
  }

  function mmAlert(msg) {
    const modal = document.getElementById('alert-modal');
    if (!modal) return;
    _setMsgEl(document.getElementById('alert-msg'), msg);
    openModalWithFocus(modal);
  }

  // ── confirm 모달 ──────────────────────────────────────────────
  function _initConfirmModal(clearAllCallback) {
    const modal    = document.getElementById('confirm-modal');
    const resetBtn = document.getElementById('reset-btn');
    if (!modal) return;

    if (resetBtn && typeof clearAllCallback === 'function') {
      resetBtn.addEventListener('click', () => {
        mmConfirm(
          '정말 전체 초기화하시겠습니까?<br>작성 중인 모든 오브젝트와 참고자료가 완전히 삭제됩니다.',
          () => clearAllCallback()
        );
      });
    }

    document.getElementById('confirm-no')?.addEventListener('click', () => {
      closeModalWithFocus(modal);
      _confirmCallback = null;
    });

    document.getElementById('confirm-yes')?.addEventListener('click', () => {
      const cb = _confirmCallback;
      _confirmCallback = null;
      closeModalWithFocus(modal);
      if (cb) cb();
    });
  }

  function mmConfirm(msg, callback) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;
    _setMsgEl(document.getElementById('confirm-msg'), msg);
    openModalWithFocus(modal);
    _confirmCallback = callback;
  }

  // ── prompt 모달 ───────────────────────────────────────────────
  function _initPromptModal() {
    const modal = document.getElementById('prompt-modal');
    if (!modal) return;
    const input = document.getElementById('prompt-input');

    document.getElementById('prompt-no')?.addEventListener('click', () => {
      closeModalWithFocus(modal);
      _promptCallback = null;
    });

    document.getElementById('prompt-yes')?.addEventListener('click', () => {
      const cb  = _promptCallback;
      _promptCallback = null;
      const val = input ? input.value : '';
      closeModalWithFocus(modal);
      if (cb) cb(val);
    });

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('prompt-yes')?.click();
    });
  }

  function mmPrompt(msg, defaultText, callback) {
    const modal = document.getElementById('prompt-modal');
    if (!modal) return;
    const input = document.getElementById('prompt-input');
    _setMsgEl(document.getElementById('prompt-msg'), msg);
    if (input) {
      input.value = defaultText || '';
    }
    openModalWithFocus(modal);
    if (input) {
      input.focus();
      input.select();
    }
    _promptCallback = callback;
  }

  // ── tutorial 모달 ─────────────────────────────────────────────
  function _initTutorialModal() {
    const tutorialBtn  = document.getElementById('tutorial-btn');
    const modal        = document.getElementById('tutorial-modal');
    const closeBtn     = document.getElementById('tutorial-close-btn');
    const closeBtnTop  = document.getElementById('tutorial-close-top');

    if (tutorialBtn && modal) {
      tutorialBtn.addEventListener('click', () => {
        openModalWithFocus(modal, tutorialBtn);
      });
    }

    const closeHandler = () => { if (modal) closeModalWithFocus(modal); };
    closeBtn?.addEventListener('click', closeHandler);
    closeBtnTop?.addEventListener('click', closeHandler);
  }

  // ── 공개 진입점 ───────────────────────────────────────────────
  /**
   * 모든 모달을 초기화합니다.
   * @param {Function} clearAllCallback - 전체 초기화 버튼 클릭 시 호출할 App 측 콜백
   */
  function initAll(clearAllCallback) {
    _initAlertModal();
    _initConfirmModal(clearAllCallback);
    _initPromptModal();
    _initTutorialModal();
  }

  // ── 네임스페이스 등록 ─────────────────────────────────────────
  CommissionApp.ModalManager = {
    initAll,
    alert:   mmAlert,
    confirm: mmConfirm,
    prompt:  mmPrompt,
  };

})(window.CommissionApp = window.CommissionApp || {});
