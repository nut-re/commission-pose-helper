'use strict';

/* ================================================================
   free-objects.js  –  신청서 패널 자유 이미지 스티커 객체 관리자 (V48)
   - 디자인: 왼쪽 패널 UI 토큰(Clean Panel UI) 100% 통일
   - 패널 우측 상단 [이미지 추가] 버튼 연동
   - 자유 배치 / 모서리 드래그 크기 조절 / 상단 모서리 회전 핸들 / 상단 미니 툴바
   - 맨위로 / 맨아래로 / 삭제 지원
================================================================ */

(function initFreeObjectsSystem() {
  let freeObjects = [];
  let activeObjId = null;

  function createFreeObject(src, initialX, initialY, initialW, initialH, objType = 'image', textContent = '') {
    const id = 'free_obj_' + Date.now() + '_' + Math.floor(Math.random()*1000);
    const obj = {
      id: id,
      type: objType || 'image',
      src: src,
      content: textContent || '',
      x: initialX || 460,
      y: initialY || 150,
      w: initialW || (objType === 'text' ? 130 : 120),
      h: initialH || (objType === 'text' ? 38 : 120),
      rotation: 0,
      fontSize: 14,
      fontWeight: '400',
      color: '#1e293b',
      zIndex: 10 + freeObjects.length
    };
    freeObjects.push(obj);
    renderObjectDOM(obj);
    selectObject(id);
  }

  function renderObjectDOM(obj) {
    const container = document.getElementById('cs-sheet-wrap');
    if (!container) return;

    let el = document.getElementById(obj.id);
    if (!el) {
      el = document.createElement('div');
      el.id = obj.id;
      el.className = 'free-obj-item';
      el.dataset.type = obj.type;
      
      let innerContent = '';
      if (obj.type === 'text') {
        const fs = obj.fontSize || 14;
        const fw = obj.fontWeight || '400';
        const col = obj.color || '#1e293b';
        innerContent = `<div class="free-obj-text" contenteditable="false" spellcheck="false" style="font-size:${fs}px; font-weight:${fw}; color:${col};">${obj.content || ''}</div>`;
      } else {
        innerContent = '<img class="free-obj-img" src="' + (obj.src || '') + '" draggable="false">';
      }

      el.innerHTML = [
        innerContent,
        '<div class="free-obj-handle handle-tl" data-handle="tl"></div>',
        '<div class="free-obj-handle handle-tr" data-handle="tr"></div>',
        '<div class="free-obj-handle handle-bl" data-handle="bl"></div>',
        '<div class="free-obj-handle handle-br" data-handle="br"></div>',
        '<div class="free-obj-handle handle-rot-top" data-handle="rot" title="드래그하여 회전"><i class="fa-solid fa-rotate"></i></div>',
        '<div class="free-obj-toolbar">',
        (obj.type === 'text' ? '  <button class="free-tb-btn" data-act="style" title="텍스트 서식/스타일"><i class="fa-solid fa-font"></i></button>' : ''),
        '  <button class="free-tb-btn" data-act="front" title="맨 위로 보내기"><i class="fa-solid fa-layer-group"></i></button>',
        '  <button class="free-tb-btn" data-act="back" title="맨 아래로 보내기"><i class="fa-solid fa-layer-group fa-flip-vertical"></i></button>',
        '  <button class="free-tb-btn is-danger" data-act="del" title="삭제"><i class="fa-solid fa-trash"></i></button>',
        '</div>'
      ].join('');

      container.appendChild(el);
      bindObjectEvents(el, obj);
    }

    updateObjectDOMStyle(el, obj);
  }

  function updateObjectDOMStyle(el, obj) {
    if (!el || !obj || !el.style) return;
    el.style.left = obj.x + 'px';
    el.style.top = obj.y + 'px';
    el.style.width = obj.w + 'px';
    el.style.height = obj.h + 'px';
    el.style.transform = 'rotate(' + obj.rotation + 'deg)';
    el.style.zIndex = obj.zIndex;
  }

  function selectObject(id) {
    activeObjId = id;
    document.querySelectorAll('.free-obj-item').forEach(el => {
      el.classList.toggle('is-selected', el.id === id);
      if (el.id !== id) {
        el.classList.remove('is-editing');
        const txt = el.querySelector('.free-obj-text');
        if (txt) txt.contentEditable = 'false';
      }
    });

    // 인물(피규어)과 상호 배타적 단일 선택 보장: 스티커 선택 시 인물 선택 해제
    if (id && window.app && typeof window.app._select === 'function') {
      window.app._select(null);
    }
  }

  function deselectAll() {
    activeObjId = null;
    if (typeof hideStylePopup === 'function') hideStylePopup();
    document.querySelectorAll('.free-obj-item').forEach(el => {
      el.classList.remove('is-selected', 'is-editing');
      const txt = el.querySelector('.free-obj-text');
      if (txt) txt.contentEditable = 'false';
    });
  }

  function bindObjectEvents(el, obj) {
    let lastClickTime = 0;

    el.addEventListener('pointerdown', e => {
      if (e.target.closest('.free-obj-toolbar')) return;
      selectObject(obj.id);
      
      if (el.classList.contains('is-editing')) {
        e.stopPropagation();
        return;
      }

      // 텍스트 객체 자체 더블클릭 타이머 감지 (브라우저 preventDefault 억제 문제 100% 극복)
      if (obj.type === 'text') {
        const now = Date.now();
        if (now - lastClickTime < 380) {
          lastClickTime = 0;
          const textEl = el.querySelector('.free-obj-text');
          if (textEl) {
            textEl.contentEditable = 'true';
            el.classList.add('is-editing');
            textEl.focus();
            try {
              const range = document.createRange();
              range.selectNodeContents(textEl);
              const sel = window.getSelection();
              sel.removeAllRanges();
              sel.addRange(range);
            } catch (err) {}
          }
          e.stopPropagation();
          return;
        }
        lastClickTime = now;
      }
      
      const handle = e.target.dataset.handle;
      if (handle === 'rot') {
        startRotate(e, el, obj);
      } else if (handle) {
        startResize(e, el, obj, handle);
      } else {
        startDrag(e, el, obj);
      }
      e.stopPropagation();
    });

    const tb = el.querySelector('.free-obj-toolbar');
    tb.addEventListener('click', e => {
      e.stopPropagation();
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;

      if (act === 'del') {
        deleteObject(obj.id);
      } else if (act === 'front') {
        bringToFront(obj.id);
      } else if (act === 'back') {
        sendToBack(obj.id);
      } else if (act === 'style') {
        if (typeof toggleStylePopup === 'function') toggleStylePopup(el, obj);
      }
    });

    const textEl = el.querySelector('.free-obj-text');
    if (textEl) {
      // 1. 외래 요소(컬러칩, 이미지 등) 드래그 드롭 원천 차단
      textEl.addEventListener('dragover', e => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
      });
      textEl.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation();
      });

      // 2. 붙여넣기 시 HTML 서식(컬러칩 등) 방지, 순수 텍스트만 허용
      textEl.addEventListener('paste', e => {
        e.preventDefault();
        const plain = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, plain);
      });

      // 3. 더블클릭 시 텍스트 편집 모드 활성화 및 커서 잡기
      el.addEventListener('dblclick', e => {
        if (e.target.closest('.free-obj-toolbar')) return;
        textEl.contentEditable = 'true';
        el.classList.add('is-editing');
        textEl.focus();
        try {
          const range = document.createRange();
          range.selectNodeContents(textEl);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (err) {}
        e.stopPropagation();
      });

      // 4. 편집 중 키 입력(Backspace, Delete 등)이 전역 단축키로 전파되는 것 방지
      textEl.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          textEl.blur();
        }
        e.stopPropagation();
      });

      // 5. 편집 완료(블러) 시 편집 모드 해제 및 텍스트 저장
      textEl.addEventListener('blur', () => {
        textEl.contentEditable = 'false';
        el.classList.remove('is-editing');
        const trimmed = textEl.innerText.trim();
        obj.content = trimmed || '텍스트 입력';
        textEl.innerText = obj.content;
      });

      textEl.addEventListener('input', () => {
        obj.content = textEl.innerText;
        el.style.height = 'auto';
        textEl.style.height = 'max-content';
        const rect = textEl.getBoundingClientRect();
        obj.h = Math.max(30, rect.height);
        el.style.height = obj.h + 'px';
        textEl.style.height = '100%';
        updateObjectDOMStyle(el, obj);
      });
    }
  }

  function startDrag(e, el, obj) {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    const startX = e.clientX - obj.x;
    const startY = e.clientY - obj.y;

    function onMove(ev) {
      obj.x = ev.clientX - startX;
      obj.y = ev.clientY - startY;
      updateObjectDOMStyle(el, obj);
    }

    function onUp(ev) {
      el.releasePointerCapture(ev.pointerId);
      DragBus.clear();
    }

    DragBus.start(onMove, onUp);
  }

  function startResize(e, el, obj, handle) {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = obj.w;
    const startH = obj.h;
    const startXPos = obj.x;
    const startYPos = obj.y;
    const aspect = startW / startH;

    function onMove(ev) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      let newW = startW;
      let newH = startH;

      if (handle === 'br') {
        newW = Math.max(30, startW + dx);
        newH = newW / aspect;
      } else if (handle === 'bl') {
        newW = Math.max(30, startW - dx);
        newH = newW / aspect;
        obj.x = startXPos + (startW - newW);
      } else if (handle === 'tr') {
        newW = Math.max(30, startW + dx);
        newH = newW / aspect;
        obj.y = startYPos + (startH - newH);
      } else if (handle === 'tl') {
        newW = Math.max(30, startW - dx);
        newH = newW / aspect;
        obj.x = startXPos + (startW - newW);
        obj.y = startYPos + (startH - newH);
      }

      obj.w = newW;
      obj.h = newH;
      updateObjectDOMStyle(el, obj);
    }

    function onUp(ev) {
      el.releasePointerCapture(ev.pointerId);
      DragBus.clear();
    }

    DragBus.start(onMove, onUp);
  }

  function startRotate(e, el, obj) {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    function onMove(ev) {
      const radians = Math.atan2(ev.clientY - centerY, ev.clientX - centerX);
      let degrees = radians * (180 / Math.PI) + 90;
      if (degrees < 0) degrees += 360;
      
      if (Math.abs(degrees) <= 3 || Math.abs(degrees - 360) <= 3) degrees = 0;

      obj.rotation = Math.round(degrees);
      updateObjectDOMStyle(el, obj);
    }

    function onUp(ev) {
      el.releasePointerCapture(ev.pointerId);
      DragBus.clear();
    }

    DragBus.start(onMove, onUp);
  }

  function deleteObject(id) {
    if (activeObjId === id) {
      if (typeof hideStylePopup === 'function') hideStylePopup();
      activeObjId = null;
    }
    freeObjects = freeObjects.filter(o => o.id !== id);
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function bringToFront(id) {
    const maxZ = freeObjects.reduce((max, o) => Math.max(max, o.zIndex), 10);
    const obj = freeObjects.find(o => o.id === id);
    if (obj) {
      obj.zIndex = maxZ + 1;
      const el = document.getElementById(id);
      if (el) el.style.zIndex = obj.zIndex;
    }
  }

  function sendToBack(id) {
    const minZ = freeObjects.reduce((min, o) => Math.min(min, o.zIndex), 10);
    const obj = freeObjects.find(o => o.id === id);
    if (obj) {
      obj.zIndex = Math.max(1, minZ - 1);
      const el = document.getElementById(id);
      if (el) el.style.zIndex = obj.zIndex;
    }
  }

  // ── 텍스트 스타일 팝업 관리 ──────────────────────────────────────────────
  let stylePopupEl = null;

  function hideStylePopup() {
    if (stylePopupEl) {
      stylePopupEl.remove();
      stylePopupEl = null;
    }
  }

  function toggleStylePopup(targetEl, obj) {
    if (stylePopupEl) {
      hideStylePopup();
      return;
    }

    stylePopupEl = document.createElement('div');
    stylePopupEl.className = 'free-obj-style-pop';

    // 폰트 크기 (슬라이더)
    const rowSize = document.createElement('div');
    rowSize.className = 'canvas-tool-row';
    rowSize.innerHTML = `
      <span style="font-size:12px; font-weight:600; color:var(--c-text);">크기</span>
      <input type="range" class="ctrl-range" id="canvas-tool-size-range" min="10" max="120" value="${obj.fontSize || 14}" style="width:100px;">
      <div class="canvas-tool-val" id="canvas-tool-size-val">${obj.fontSize || 14}</div>
    `;

    // 굵기
    const rowWeight = document.createElement('div');
    rowWeight.className = 'canvas-tool-row';
    const isBold = obj.fontWeight === '700' || obj.fontWeight === 'bold';
    rowWeight.innerHTML = `
      <button class="canvas-tool-btn ${isBold ? 'active' : ''}" data-action="bold" title="굵게" style="width:100%;">B (굵은 글씨)</button>
    `;

    // 컬러 (프리셋 5종 + 네이티브 컬러피커)
    const rowColor = document.createElement('div');
    rowColor.className = 'canvas-tool-row';
    const colors = ['#1e293b', '#ffffff', '#64748b', '#ef4444', '#3b82f6'];
    let colorHtml = '';
    let hasCustomColor = true;
    colors.forEach(c => {
      const active = (obj.color === c) ? 'active' : '';
      if (active) hasCustomColor = false;
      colorHtml += `<div class="canvas-tool-color-btn ${active}" data-color="${c}" style="background:${c};"></div>`;
    });
    colorHtml += `<input type="color" class="canvas-tool-color-native" value="${obj.color || '#1e293b'}">`;
    rowColor.innerHTML = colorHtml;

    stylePopupEl.appendChild(rowSize);
    stylePopupEl.appendChild(rowWeight);
    stylePopupEl.appendChild(rowColor);

    stylePopupEl.addEventListener('pointerdown', e => e.stopPropagation());
    stylePopupEl.addEventListener('click', e => e.stopPropagation());
    stylePopupEl.addEventListener('dblclick', e => e.stopPropagation());

    const updateStyle = () => {
      const textEl = targetEl.querySelector('.free-obj-text');
      if (textEl) {
        textEl.style.fontSize = obj.fontSize + 'px';
        textEl.style.fontWeight = obj.fontWeight;
        textEl.style.color = obj.color;

        // 글자 크기가 커졌을 때 텍스트가 잘리지 않도록 임시로 크기를 늘려 측정 후 바운딩 박스(w, h) 갱신
        targetEl.style.width = 'auto';
        targetEl.style.height = 'auto';
        textEl.style.width = 'max-content';
        textEl.style.height = 'max-content';

        const rect = textEl.getBoundingClientRect();
        obj.w = Math.max(60, rect.width); 
        obj.h = Math.max(30, rect.height);
        
        targetEl.style.width = obj.w + 'px';
        targetEl.style.height = obj.h + 'px';
        textEl.style.width = '100%';
        textEl.style.height = '100%';
      }
    };

    // 슬라이더 이벤트 바인딩
    const sizeRange = stylePopupEl.querySelector('#canvas-tool-size-range');
    if (sizeRange) {
      sizeRange.addEventListener('input', (e) => {
        obj.fontSize = parseInt(e.target.value, 10);
        stylePopupEl.querySelector('#canvas-tool-size-val').textContent = obj.fontSize;
        updateStyle();
      });
    }

    stylePopupEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (btn) {
        const act = btn.dataset.action;
        if (act === 'bold') {
          obj.fontWeight = (obj.fontWeight === '700' || obj.fontWeight === 'bold') ? '400' : '700';
          btn.classList.toggle('is-active', obj.fontWeight === '700');
        }
        updateStyle();
      }

      const cBtn = e.target.closest('.canvas-tool-color-btn');
      if (cBtn) {
        stylePopupEl.querySelectorAll('.canvas-tool-color-btn').forEach(b => b.classList.remove('is-active'));
        cBtn.classList.add('is-active');
        obj.color = cBtn.dataset.color;
        stylePopupEl.querySelector('.canvas-tool-color-native').value = obj.color;
        updateStyle();
      }
    });

    const nativeColor = stylePopupEl.querySelector('.canvas-tool-color-native');
    nativeColor.addEventListener('input', e => {
      stylePopupEl.querySelectorAll('.canvas-tool-color-btn').forEach(b => b.classList.remove('is-active'));
      obj.color = e.target.value;
      updateStyle();
    });

    document.getElementById('cs-sheet-wrap').appendChild(stylePopupEl);

    // 플로팅 위치 설정
    const tb = targetEl.querySelector('.free-obj-toolbar');
    const tbRect = tb.getBoundingClientRect();
    const wrapRect = document.getElementById('cs-sheet-wrap').getBoundingClientRect();
    
    // 툴바 바로 위에 배치
    stylePopupEl.style.left = (tbRect.left - wrapRect.left) + 'px';
    stylePopupEl.style.bottom = (wrapRect.bottom - tbRect.top + 8) + 'px';
  }

  function bindPanelImageButton() {
    const addBtn = document.getElementById('add-free-img-btn');
    const addTextBtn = document.getElementById('add-free-text-btn');
    const fileInput = document.getElementById('free-img-file');

    if (addBtn && fileInput) {
      addBtn.addEventListener('click', e => {
        e.stopPropagation();
        fileInput.click();
      });

      fileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          const src = ev.target.result;
          const tempImg = new Image();
          tempImg.onload = () => {
            const maxDim = 140;
            let w = tempImg.naturalWidth || 120;
            let h = tempImg.naturalHeight || 120;
            const scale = Math.min(maxDim / w, maxDim / h, 1);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
            createFreeObject(src, 460, 150, w, h, 'image', '');
          };
          tempImg.src = src;
          fileInput.value = '';
        };
        reader.readAsDataURL(file);
      });
    }

    if (addTextBtn) {
      addTextBtn.addEventListener('click', e => {
        e.stopPropagation();
        createFreeObject('', 460, 150, 120, 36, 'text', '텍스트 입력');
      });
    }

    document.addEventListener('pointerdown', e => {
      if (e.target.closest('.free-obj-item') || e.target.closest('.cs-panel-float-group') || e.target.closest('.free-obj-style-pop')) return;
      deselectAll();
    });
  }

  function getObjectsState() {
    return JSON.parse(JSON.stringify(freeObjects));
  }

  function restoreObjectsState(savedList) {
    document.querySelectorAll('.free-obj-item').forEach(el => el.remove());
    freeObjects = [];
    activeObjId = null;

    if (!Array.isArray(savedList)) return;

    savedList.forEach(obj => {
      // 구버전(이미지만 있던 시절) 호환성 보정
      if (!obj.type) obj.type = 'image';
      if (obj.type === 'text' && !obj.content) obj.content = '';
      
      const copy = JSON.parse(JSON.stringify(obj));
      freeObjects.push(copy);
      renderObjectDOM(copy);
    });
  }

  CommissionApp.FreeObjects = {
    createFreeObject,
    deleteObject,
    deleteSelected: () => { if (activeObjId) deleteObject(activeObjId); },
    getActiveId: () => activeObjId,
    deselectAll,
    getObjects: () => freeObjects,
    getObjectsState,
    restoreObjectsState
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindPanelImageButton);
  } else {
    bindPanelImageButton();
  }
})();
