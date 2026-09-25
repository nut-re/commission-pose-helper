'use strict';

/* ================================================================
   image-slots.js  –  신청서 패널 이미지 슬롯 시스템 (V49)
   - 이미지 업로드 슬롯 기본 배경색: #ffffff (흰색) 적용
   - 플레이스홀더 글자 및 아이콘: 선명한 슬레이트 다크 (#475569)로 시독성 대폭 향상
   - 업로드 / 이동(드래그) / 확대축소(휠) / 회전(슬라이더 & 0도 스냅 & 클릭리셋)
   - 내보내기: compositeSlotImages() Canvas 직접 합성 (화질 손실 없음)
================================================================ */

const imageSlots = {};

function createSlotState() {
  return { original: null, scale: 1, offsetX: 0, offsetY: 0, rotate: 0, bgColor: '#ffffff' };
}


// ── 배경색 팝업 ───────────────────────────────────────────
const BG_SWATCHES = [
  '#ffffff','#000000','#f8fafc','#1e293b',
  '#ef4444','#f97316','#eab308','#22c55e',
  '#06b6d4','#3b82f6','#8b5cf6','#ec4899',
  '#fef9c3','#dcfce7','#dbeafe','#fce7f3'
];
let bgPopupEl = null, bgPopupTargetSlotId = null;

function getBgPopup() {
  if (bgPopupEl) return bgPopupEl;
  bgPopupEl = document.createElement('div');
  bgPopupEl.className = 'slot-bg-popup';
  bgPopupEl.id = 'slot-bg-popup';
  bgPopupEl.innerHTML =
    '<div class="slot-bg-popup-title">슬롯 배경색</div>' +
    '<div class="slot-bg-color-row">' +
      '<input type="color" class="slot-bg-native" id="slot-bg-native" value="#ffffff">' +
      '<input type="text" class="slot-bg-hex" id="slot-bg-hex" value="#ffffff" maxlength="7">' +
    '</div>' +
    '<div class="slot-bg-swatches" id="slot-bg-swatches"></div>';
  document.body.appendChild(bgPopupEl);

  const swatchWrap = bgPopupEl.querySelector('#slot-bg-swatches');
  BG_SWATCHES.forEach(function(c) {
    const d = document.createElement('div');
    d.className = 'slot-bg-swatch';
    d.style.backgroundColor = c;
    d.title = c;
    d.dataset.color = c;
    d.addEventListener('click', function() { applyBgColor(c); });
    swatchWrap.appendChild(d);
  });

  bgPopupEl.querySelector('#slot-bg-native').addEventListener('input', function(e) {
    bgPopupEl.querySelector('#slot-bg-hex').value = e.target.value;
    applyBgColor(e.target.value);
  });
  bgPopupEl.querySelector('#slot-bg-hex').addEventListener('input', function(e) {
    var c = e.target.value.trim();
    if (!/^#/.test(c)) c = '#' + c;
    // 3자리 축약형 지원 (예: #fff -> #ffffff)
    if (/^#[0-9a-fA-F]{3}$/.test(c)) {
      c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
    }
    if (/^#[0-9a-fA-F]{6}$/.test(c)) {
      bgPopupEl.querySelector('#slot-bg-native').value = c;
      applyBgColor(c);
    }
  });
  document.addEventListener('pointerdown', function(e) {
    if (bgPopupEl.classList.contains('show') && !bgPopupEl.contains(e.target)) closeBgPopup();
  }, true);
  return bgPopupEl;
}

function openBgPopup(slotId, anchorEl) {
  bgPopupTargetSlotId = slotId;
  var pop = getBgPopup();
  var cur = (imageSlots[slotId] && imageSlots[slotId].bgColor) || '#ffffff';
  pop.querySelector('#slot-bg-native').value = cur;
  pop.querySelector('#slot-bg-hex').value = cur;
  updateSwatchActive(cur);
  var r = anchorEl.getBoundingClientRect();
  pop.style.top  = (r.bottom + 4) + 'px';
  pop.style.left = Math.max(4, r.right - 180) + 'px';
  pop.classList.add('show');
}
function closeBgPopup() { getBgPopup().classList.remove('show'); bgPopupTargetSlotId = null; }

function applyBgColor(color) {
  if (!bgPopupTargetSlotId) return;
  var st = imageSlots[bgPopupTargetSlotId];
  if (!st) return;
  st.bgColor = color;
  var box = document.querySelector('[data-slot-id="' + bgPopupTargetSlotId + '"]');
  if (box) box.style.backgroundColor = color;
  var pop = getBgPopup();
  if (/^#[0-9a-fA-F]{6}$/.test(color)) pop.querySelector('#slot-bg-native').value = color;
  pop.querySelector('#slot-bg-hex').value = color;
  updateSwatchActive(color);
}
function updateSwatchActive(color) {
  getBgPopup().querySelectorAll('.slot-bg-swatch').forEach(function(sw) {
    sw.classList.toggle('is-active', sw.dataset.color === color);
  });
}

// ── 트랜스폼 적용 ─────────────────────────────────────────
function applyTransform(slotId) {
  var st = imageSlots[slotId];
  var box = document.querySelector('[data-slot-id="' + slotId + '"]');
  if (!st || !box) return;
  var img = box.querySelector('.slot-img');
  if (!img) return;
  img.style.transform =
    'translate(-50%,-50%) ' +
    'translate(' + st.offsetX + 'px,' + st.offsetY + 'px) ' +
    'scale(' + st.scale + ') ' +
    'rotate(' + st.rotate + 'deg)';
}

// ── 회전 리셋 헬퍼 ─────────────────────────────────────────
function resetSlotRotation(slotId) {
  var st = imageSlots[slotId];
  if (!st) return;
  st.rotate = 0;
  var box = document.querySelector('[data-slot-id="' + slotId + '"]');
  if (box) {
    var slider = box.querySelector('.slot-rotate-slider');
    var rotLabel = box.querySelector('.slot-rotate-label');
    if (slider) slider.value = 0;
    if (rotLabel) rotLabel.textContent = '0°';
  }
  applyTransform(slotId);
}

// ── 슬롯 초기화 ───────────────────────────────────────────
function initImageSlot(box) {
  var slotId = box.dataset.slotId;
  if (!slotId || box.dataset.slotInit === '1') return;
  box.dataset.slotInit = '1';
  imageSlots[slotId] = createSlotState();

  box.innerHTML = '';
  box.style.position = 'relative';
  box.style.overflow = 'hidden';
  box.style.backgroundColor = '#ffffff'; /* 기본 배경색 흰색 적용 */
  box.style.cursor = 'pointer';

  // 래퍼
  var wrap = document.createElement('div');
  wrap.className = 'img-slot-wrap';
  wrap.dataset.slotId = slotId;

  // 플레이스홀더
  var ph = document.createElement('div');
  ph.className = 'slot-placeholder';
  ph.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i><span>클릭 또는 드래그하여<br>업로드</span>';
  wrap.appendChild(ph);

  // 오버레이 (0도 리셋 버튼 포함)
  var ov = document.createElement('div');
  ov.className = 'img-slot-overlay';
  ov.innerHTML =
    '<button class="slot-ov-btn" data-action="reset-rot" title="회전 0° 리셋"><i class="fa-solid fa-rotate-left"></i></button>' +
    '<button class="slot-ov-btn" data-action="replace" title="이미지 교체"><i class="fa-solid fa-arrow-rotate-right"></i></button>' +
    '<button class="slot-ov-btn" data-action="bg" title="배경색"><i class="fa-solid fa-palette"></i></button>' +
    '<button class="slot-ov-btn is-danger" data-action="delete" title="삭제"><i class="fa-solid fa-trash"></i></button>';
  wrap.appendChild(ov);

  // 회전 슬라이더 (0도 클릭 리셋 뱃지)
  var rotRow = document.createElement('div');
  rotRow.className = 'slot-rotate-row';
  rotRow.innerHTML =
    '<input type="range" class="slot-rotate-slider" min="-180" max="180" step="1" value="0">' +
    '<span class="slot-rotate-label" title="클릭 시 0°로 리셋">0°</span>';
  wrap.appendChild(rotRow);

  box.appendChild(wrap);

  // 파일 인풋
  var fi = document.createElement('input');
  fi.type = 'file'; fi.accept = 'image/*'; fi.style.display = 'none';
  document.body.appendChild(fi);
  fi.addEventListener('change', function(e) {
    var f = e.target.files[0];
    if (f) loadImageFile(slotId, f);
    fi.value = '';
  });

  // 클릭 업로드
  wrap.addEventListener('click', function(e) {
    if (e.target.closest('.img-slot-overlay') || e.target.closest('.slot-rotate-row')) return;
    if (!imageSlots[slotId].original) fi.click();
  });

  // 오버레이 버튼
  ov.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    e.stopPropagation();
    var a = btn.dataset.action;
    if (a === 'reset-rot') resetSlotRotation(slotId);
    if (a === 'replace')   fi.click();
    if (a === 'delete')    clearSlot(slotId);
    if (a === 'bg')        openBgPopup(slotId, btn);
  });

  // 회전 슬라이더 + 0도 Magnet Snap & 각도 텍스트 클릭 리셋
  var slider = rotRow.querySelector('.slot-rotate-slider');
  var rotLabel = rotRow.querySelector('.slot-rotate-label');

  slider.addEventListener('input', function() {
    var val = parseFloat(slider.value);
    if (Math.abs(val) <= 5) {
      val = 0;
      slider.value = 0;
    }
    imageSlots[slotId].rotate = val;
    rotLabel.textContent = val + '°';
    applyTransform(slotId);
  });

  // 각도 텍스트 클릭 시 즉시 0도 리셋
  rotLabel.addEventListener('click', function(e) {
    e.stopPropagation();
    resetSlotRotation(slotId);
  });

  // 드래그 이동
  var dragState = null;
  wrap.addEventListener('pointerdown', function(e) {
    if (e.target.closest('.slot-ov-btn') || e.target.closest('.slot-rotate-slider') || e.target.closest('.slot-rotate-label')) return;
    if (!imageSlots[slotId].original) return;
    e.preventDefault();
    wrap.setPointerCapture(e.pointerId);
    dragState = { x: e.clientX, y: e.clientY, ox: imageSlots[slotId].offsetX, oy: imageSlots[slotId].offsetY };
    wrap.style.cursor = 'grabbing';
  });
  wrap.addEventListener('pointermove', function(e) {
    if (!dragState) return;
    imageSlots[slotId].offsetX = dragState.ox + (e.clientX - dragState.x);
    imageSlots[slotId].offsetY = dragState.oy + (e.clientY - dragState.y);
    applyTransform(slotId);
  });
  var endDrag = function() {
    dragState = null;
    wrap.style.cursor = imageSlots[slotId].original ? 'grab' : 'pointer';
  };
  wrap.addEventListener('pointerup', endDrag);
  wrap.addEventListener('pointercancel', endDrag);

  // 휠 줌
  wrap.addEventListener('wheel', function(e) {
    if (!imageSlots[slotId].original) return;
    e.preventDefault();
    var st = imageSlots[slotId];
    st.scale = Math.min(20, Math.max(0.05, st.scale * (e.deltaY < 0 ? 1.08 : 0.925)));
    applyTransform(slotId);
  }, { passive: false });

  // 드래그드롭
  wrap.addEventListener('dragover', function(e) { e.preventDefault(); wrap.classList.add('dragover'); });
  wrap.addEventListener('dragleave', function() { wrap.classList.remove('dragover'); });
  wrap.addEventListener('drop', function(e) {
    e.preventDefault();
    wrap.classList.remove('dragover');
    var f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) loadImageFile(slotId, f);
  });
}

// ── 이미지 로드 ───────────────────────────────────────────
function loadImageFile(slotId, file) {
  var reader = new FileReader();
  reader.onload = function(e) { setSlotImage(slotId, e.target.result); };
  reader.readAsDataURL(file);
}

function setSlotImage(slotId, dataURL) {
  var st = imageSlots[slotId];
  if (!st) return;
  st.original = dataURL; st.scale = 1; st.offsetX = 0; st.offsetY = 0; st.rotate = 0;

  var box = document.querySelector('[data-slot-id="' + slotId + '"]');
  if (!box) return;
  var wrap = box.querySelector('.img-slot-wrap') || box;
  var ph = wrap.querySelector('.slot-placeholder');
  if (ph) ph.style.display = 'none';
  wrap.querySelectorAll('.slot-img').forEach(function(el) { el.remove(); });

  var img = document.createElement('img');
  img.className = 'slot-img';
  img.src = dataURL;
  img.draggable = false;
  img.onload = function() {
    var bw = box.offsetWidth || box.clientWidth;
    var bh = box.offsetHeight || box.clientHeight;
    if (bw && bh) st.scale = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
    applyTransform(slotId);
  };
  wrap.insertBefore(img, wrap.querySelector('.img-slot-overlay'));
  box.style.backgroundColor = st.bgColor;
  wrap.style.cursor = 'grab';

  var slider = wrap.querySelector('.slot-rotate-slider');
  var rotLabel = wrap.querySelector('.slot-rotate-label');
  if (slider) slider.value = 0;
  if (rotLabel) rotLabel.textContent = '0°';
  applyTransform(slotId);
}

function clearSlot(slotId) {
  if (!imageSlots[slotId]) return;
  Object.assign(imageSlots[slotId], createSlotState());
  var box = document.querySelector('[data-slot-id="' + slotId + '"]');
  if (!box) return;
  var wrap = box.querySelector('.img-slot-wrap') || box;
  wrap.querySelectorAll('.slot-img').forEach(function(el) { el.remove(); });
  var ph = wrap.querySelector('.slot-placeholder');
  if (ph) ph.style.display = '';
  box.style.backgroundColor = '#ffffff'; /* 초기화 시에도 흰색 */
  wrap.style.cursor = 'pointer';
  var slider = wrap.querySelector('.slot-rotate-slider');
  var rotLabel = wrap.querySelector('.slot-rotate-label');
  if (slider) slider.value = 0;
  if (rotLabel) rotLabel.textContent = '0°';
}

// ── 내보내기 Canvas 합성 (모든 슬롯 외곽 테두리선 100% 렌더링) ─────────────────────────────────
function compositeSlotImages(targetCanvas, panelEl, scale) {
  var ctx = targetCanvas.getContext('2d');
  ['main-img','sub-1','sub-2','sub-3','sub-4'].forEach(function(slotId) {
    var slotBox = panelEl.querySelector('[data-slot-id="' + slotId + '"]');
    if (!slotBox) return;

    var sx = 0, sy = 0, el = slotBox;
    while (el && el.id !== 'offscreen-export-wrapper') {
      sx += el.offsetLeft || 0;
      sy += el.offsetTop  || 0;
      el = el.offsetParent;
    }
    var sw = slotBox.offsetWidth, sh = slotBox.offsetHeight;
    var cx = sx * scale, cy = sy * scale, cw = sw * scale, ch = sh * scale;

    var st = imageSlots[slotId];

    if (st && st.original) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx, cy, cw, ch);
      ctx.clip();

      ctx.fillStyle = st.bgColor || '#ffffff';
      ctx.fillRect(cx, cy, cw, ch);

      var imgEl = new Image();
      imgEl.src = st.original;
      var iw = imgEl.naturalWidth || imgEl.width;
      var ih = imgEl.naturalHeight || imgEl.height;
      if (iw && ih) {
        ctx.translate(cx + cw / 2 + st.offsetX * scale, cy + ch / 2 + st.offsetY * scale);
        ctx.rotate(st.rotate * Math.PI / 180);
        ctx.scale(st.scale, st.scale);
        ctx.drawImage(imgEl, -iw / 2, -ih / 2, iw, ih);
      }
      ctx.restore();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx, cy, cw, ch);
    }

    // 슬롯 외각 2px 정갈한 테두리선 렌더링
    ctx.save();
    ctx.strokeStyle = '#2E2E2E';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(cx, cy, cw, ch);
    ctx.restore();
  });
}

// ── 캐릭터 전환용 슬롯 상태 일괄 복원/내보내기 API ─────────────
function restoreSlotFromState(slotId, st) {
  if (!imageSlots[slotId]) return;
  if (!st || !st.original) {
    clearSlot(slotId);
    return;
  }
  Object.assign(imageSlots[slotId], JSON.parse(JSON.stringify(st)));
  var box = document.querySelector('[data-slot-id="' + slotId + '"]');
  if (!box) return;
  var wrap = box.querySelector('.img-slot-wrap') || box;
  var ph = wrap.querySelector('.slot-placeholder');
  if (ph) ph.style.display = 'none';
  wrap.querySelectorAll('.slot-img').forEach(function(el) { el.remove(); });

  var img = document.createElement('img');
  img.className = 'slot-img';
  img.src = st.original;
  img.draggable = false;
  img.onload = function() {
    applyTransform(slotId);
  };
  wrap.insertBefore(img, wrap.querySelector('.img-slot-overlay'));
  box.style.backgroundColor = st.bgColor || '#ffffff';
  wrap.style.cursor = 'grab';

  var slider = wrap.querySelector('.slot-rotate-slider');
  var rotLabel = wrap.querySelector('.slot-rotate-label');
  if (slider) slider.value = st.rotate || 0;
  if (rotLabel) rotLabel.textContent = (st.rotate || 0) + '°';
  applyTransform(slotId);
}

function getAllSlotsState() {
  return JSON.parse(JSON.stringify(imageSlots));
}

function restoreAllSlotsState(savedState) {
  ['main-img', 'sub-1', 'sub-2', 'sub-3', 'sub-4'].forEach(function(slotId) {
    var st = savedState ? savedState[slotId] : null;
    restoreSlotFromState(slotId, st);
  });
}

// Global API -> Namespace API
CommissionApp.ImageSlots.imageSlots          = imageSlots;
CommissionApp.ImageSlots.setSlotImage        = setSlotImage;
CommissionApp.ImageSlots.clearSlot           = clearSlot;
CommissionApp.ImageSlots.resetSlotRotation   = resetSlotRotation;
CommissionApp.ImageSlots.compositeSlotImages = compositeSlotImages;
CommissionApp.ImageSlots.getAllSlotsState    = getAllSlotsState;
CommissionApp.ImageSlots.restoreAllSlotsState = restoreAllSlotsState;

function initAllImageSlots() {
  document.querySelectorAll('[data-slot-id]').forEach(function(box) { initImageSlot(box); });
}
CommissionApp.ImageSlots.initAllImageSlots = initAllImageSlots;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllImageSlots);
} else {
  initAllImageSlots();
}
