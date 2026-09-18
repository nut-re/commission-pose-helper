'use strict';

/* ================================================================
   text-formatter.js  –  신청서 작성란 텍스트 서식 조절기 (V49)
   - 서식 툴바 디자인: 왼쪽 패널 브랜드 퍼플-블루 악센트 (#5b6bff) 통일
   - 폰트 크기(Size - / +), Bold (B), Italic (I), 말머리 기호 팝업
================================================================ */

(function initTextFormatter() {
  let activeElement = null;
  let toolbarEl = null;
  let bulletMenuEl = null;

  const BULLETS = ['-', '▶', '•', '▸', '✔', '★', '■', '※'];


  // ── 툴바 DOM 생성 ─────────────────────────────────────────
  function getToolbar() {
    if (toolbarEl) return toolbarEl;
    toolbarEl = document.createElement('div');
    toolbarEl.id = 'cs-text-formatting-bar';
    toolbarEl.innerHTML = [
      '<button class="canvas-tool-btn" id="canvas-tool-dec-size" title="폰트 크기 줄이기"><i class="fa-solid fa-minus"></i></button>',
      '<span class="canvas-tool-size-val" id="canvas-tool-size-disp">14px</span>',
      '<button class="canvas-tool-btn" id="canvas-tool-inc-size" title="폰트 크기 키우기"><i class="fa-solid fa-plus"></i></button>',
      '<div class="canvas-tool-sep"></div>',
      '<button class="canvas-tool-btn" id="canvas-tool-bold" title="선택 부분 / 전체 굵게 (Bold)"><b>B</b></button>',
      '<button class="canvas-tool-btn" id="canvas-tool-italic" title="선택 부분 / 전체 기울임 (Italic)"><i>I</i></button>',
      '<div class="canvas-tool-sep"></div>',
      '<button class="canvas-tool-btn" id="canvas-tool-bullet-btn" title="말머리 기호 삽입"><i class="fa-solid fa-list-ul"></i></button>',
      '<div class="canvas-tool-sep"></div>',
      '<button class="canvas-tool-btn" id="canvas-tool-reset" title="서식 초기화"><i class="fa-solid fa-rotate-left"></i></button>'
    ].join('');
    document.body.appendChild(toolbarEl);

    toolbarEl.addEventListener('pointerdown', e => {
      e.preventDefault();
    });

    toolbarEl.querySelector('#canvas-tool-dec-size').addEventListener('click', e => { e.preventDefault(); changeFontSize(-1); });
    toolbarEl.querySelector('#canvas-tool-inc-size').addEventListener('click', e => { e.preventDefault(); changeFontSize(1); });
    toolbarEl.querySelector('#canvas-tool-bold').addEventListener('click', e => { e.preventDefault(); toggleBold(); });
    toolbarEl.querySelector('#canvas-tool-italic').addEventListener('click', e => { e.preventDefault(); toggleItalic(); });
    toolbarEl.querySelector('#canvas-tool-bullet-btn').addEventListener('click', e => { e.preventDefault(); toggleBulletMenu(); });
    toolbarEl.querySelector('#canvas-tool-reset').addEventListener('click', e => { e.preventDefault(); resetFormatting(); });

    return toolbarEl;
  }

  // ── 말머리 기호 팝업 ──────────────────────────────────────
  function getBulletMenu() {
    if (bulletMenuEl) return bulletMenuEl;
    bulletMenuEl = document.createElement('div');
    bulletMenuEl.id = 'canvas-tool-bullet-menu';

    BULLETS.forEach(sym => {
      const item = document.createElement('div');
      item.className = 'bullet-item';
      item.textContent = sym;
      item.title = '말머리기호 "' + sym + '" 삽입';
      item.addEventListener('pointerdown', e => e.preventDefault());
      item.addEventListener('click', e => {
        e.preventDefault();
        insertSymbol(sym);
        hideBulletMenu();
      });
      bulletMenuEl.appendChild(item);
    });

    document.body.appendChild(bulletMenuEl);
    return bulletMenuEl;
  }

  function toggleBulletMenu() {
    const menu = getBulletMenu();
    if (menu.classList.contains('show')) {
      hideBulletMenu();
    } else {
      showBulletMenu();
    }
  }

  function showBulletMenu() {
    const menu = getBulletMenu();
    const btn = toolbarEl.querySelector('#canvas-tool-bullet-btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.left = (rect.left - 40) + 'px';
    menu.classList.add('show');
  }

  function hideBulletMenu() {
    if (bulletMenuEl) bulletMenuEl.classList.remove('show');
  }

  // ── 말머리 기호 삽입 ──────────────────────────────────────
  function insertSymbol(sym) {
    if (!activeElement) return;
    const textToInsert = sym + ' ';
    
    if (activeElement.getAttribute('contenteditable') === 'true') {
      activeElement.focus();
      document.execCommand('insertText', false, textToInsert);
    } else if (typeof activeElement.selectionStart === 'number') {
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      const val = activeElement.value;
      activeElement.value = val.substring(0, start) + textToInsert + val.substring(end);
      activeElement.selectionStart = activeElement.selectionEnd = start + textToInsert.length;
      activeElement.focus();
    }
  }

  // ── 대상 작성란 선택자 ────────────────────────────────────
  const TARGET_SELECTOR = [
    '#cs-name-input',
    '#cs-orig-name-input',
    '#cs-spec-input',
    '#cs-keyword-input',
    '#cs-keypoint-input',
    '#cs-features-input'
  ].join(',');

  // ── 툴바 포지셔닝 및 동기화 ────────────────────────────────
  function attachFormatterTo(el) {
    activeElement = el;
    const bar = getToolbar();
    updateToolbarState(el);
    positionToolbar(el, bar);
    bar.classList.add('show');
  }

  function positionToolbar(el, bar) {
    const rect = el.getBoundingClientRect();
    let top = rect.top - 36;
    let left = rect.left + (rect.width / 2) - 100;

    if (top < 8) top = rect.bottom + 6;
    if (left < 8) left = 8;
    if (left + 220 > window.innerWidth) left = window.innerWidth - 228;

    bar.style.top = top + 'px';
    bar.style.left = left + 'px';
  }

  function updateToolbarState(el) {
    const bar = getToolbar();
    const style = window.getComputedStyle(el);

    const curSize = parseFloat(el.style.fontSize || style.fontSize) || 14;
    bar.querySelector('#canvas-tool-size-disp').textContent = Math.round(curSize) + 'px';

    const curWeight = el.style.fontWeight || style.fontWeight;
    const isBold = curWeight === '700' || curWeight === 'bold' || document.queryCommandState('bold');
    bar.querySelector('#canvas-tool-bold').classList.toggle('is-active', isBold);

    const curStyle = el.style.fontStyle || style.fontStyle;
    const isItalic = curStyle === 'italic' || document.queryCommandState('italic');
    bar.querySelector('#canvas-tool-italic').classList.toggle('is-active', isItalic);
  }

  function hideToolbar() {
    if (toolbarEl) toolbarEl.classList.remove('show');
    hideBulletMenu();
    activeElement = null;
  }

  // ── 서식 조작 기능들 ─────────────────────────────────────
  function changeFontSize(delta) {
    if (!activeElement) return;
    const style = window.getComputedStyle(activeElement);
    let cur = parseFloat(activeElement.style.fontSize || style.fontSize) || 14;
    cur = Math.min(32, Math.max(9, cur + delta));
    activeElement.style.fontSize = cur + 'px';
    updateToolbarState(activeElement);
  }

  function toggleBold() {
    if (!activeElement) return;
    const sel = window.getSelection();
    const hasSelection = sel && !sel.isCollapsed && activeElement.contains(sel.anchorNode);

    if (hasSelection || activeElement.getAttribute('contenteditable') === 'true') {
      document.execCommand('bold', false, null);
    } else {
      const style = window.getComputedStyle(activeElement);
      const curWeight = activeElement.style.fontWeight || style.fontWeight;
      const isBold = curWeight === '700' || curWeight === 'bold';
      activeElement.style.fontWeight = isBold ? '400' : '700';
    }
    updateToolbarState(activeElement);
  }

  function toggleItalic() {
    if (!activeElement) return;
    const sel = window.getSelection();
    const hasSelection = sel && !sel.isCollapsed && activeElement.contains(sel.anchorNode);

    if (hasSelection || activeElement.getAttribute('contenteditable') === 'true') {
      document.execCommand('italic', false, null);
    } else {
      const style = window.getComputedStyle(activeElement);
      const curStyle = activeElement.style.fontStyle || style.fontStyle;
      const isItalic = curStyle === 'italic';
      activeElement.style.fontStyle = isItalic ? 'normal' : 'italic';
    }
    updateToolbarState(activeElement);
  }

  function resetFormatting() {
    if (!activeElement) return;
    activeElement.style.fontSize = '';
    activeElement.style.fontWeight = '';
    activeElement.style.fontStyle = '';
    if (activeElement.getAttribute('contenteditable') === 'true') {
      document.execCommand('removeFormat', false, null);
    }
    updateToolbarState(activeElement);
  }

  // ── 이벤트 바인딩 ────────────────────────────────────────
  function bindEvents() {
    document.querySelectorAll(TARGET_SELECTOR).forEach(el => {
      el.addEventListener('focus', () => attachFormatterTo(el));
      el.addEventListener('click', () => attachFormatterTo(el));
      el.addEventListener('keyup', () => {
        if (activeElement === el) updateToolbarState(el);
      });
    });

    document.addEventListener('selectionchange', () => {
      if (activeElement && document.activeElement === activeElement) {
        updateToolbarState(activeElement);
      }
    });

    document.addEventListener('pointerdown', e => {
      if (e.target.closest('#cs-text-formatting-bar') || e.target.closest('#canvas-tool-bullet-menu')) return;
      if (e.target.closest(TARGET_SELECTOR)) return;
      hideToolbar();
    });

    window.addEventListener('resize', () => {
      if (activeElement && toolbarEl && toolbarEl.classList.contains('show')) {
        positionToolbar(activeElement, toolbarEl);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }
})();
