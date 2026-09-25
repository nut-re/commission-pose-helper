/**
 * Commission Helper – app.js
 * Clean, stable core logic matching index.html IDs
 */

'use strict';

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────
function uid() { return 'id_' + Math.random().toString(36).slice(2, 9); }

function svgPt(svg, e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function rotatePt(px, py, cx, cy, deg) {
  const r = deg * Math.PI / 180;
  const dx = px - cx, dy = py - cy;
  return { x: cx + dx * Math.cos(r) - dy * Math.sin(r),
           y: cy + dx * Math.sin(r) + dy * Math.cos(r) };
}

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

// ─────────────────────────────────────────────
// SKELETON ENGINE — skeleton-engine.js 로 이전
// normalizePartOffsets(), defaultAngles(),
// defaultPartOffsets(), calcSkeleton()
// → skeleton-engine.js (app.js 이후 로드)
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// MODAL ACCESSIBILITY HELPERS (KWCAG 2.2 § 2.1.2, 2.4.7)
// ─────────────────────────────────────────────
/** 상태 변화를 스크린 리더에 즉시 알림 (KWCAG 2.2 § 2.4.7 상태 메세지) */
function announceStatus(msg) {
  const el = document.getElementById('a11y-status');
  if (el) el.textContent = msg;

  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.textContent = msg;
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  'a[href]', '[tabindex]:not([tabindex="-1"])'
].join(',');

/** 모달을 열고 포커스를 모달 내부 첫 요소로 이동, 포커스 트랩 리스너 등록 */
function openModalWithFocus(modalEl, returnFocusEl) {
  modalEl.style.display = 'flex';
  modalEl._returnFocus = returnFocusEl || document.activeElement;

  const focusables = Array.from(modalEl.querySelectorAll(FOCUSABLE_SELECTORS));
  if (focusables.length) {
    requestAnimationFrame(() => focusables[0].focus());
  }

  const trapKeydown = (e) => {
    if (e.key !== 'Tab') return;
    const items = Array.from(modalEl.querySelectorAll(FOCUSABLE_SELECTORS));
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  };
  modalEl._trapKeydown = trapKeydown;
  modalEl.addEventListener('keydown', trapKeydown);
}

/** 모달을 닫고 포커스 복원, 포커스 트랩 리스너 해제 */
function closeModalWithFocus(modalEl) {
  modalEl.style.display = 'none';
  if (modalEl._trapKeydown) {
    modalEl.removeEventListener('keydown', modalEl._trapKeydown);
    modalEl._trapKeydown = null;
  }
  if (modalEl._returnFocus && typeof modalEl._returnFocus.focus === 'function') {
    try { modalEl._returnFocus.focus(); } catch (_) {}
    modalEl._returnFocus = null;
  }
}

// ─────────────────────────────────────────────
// SHARED CONSTANTS
// ─────────────────────────────────────────────
/** 더블클릭 감지 임계값(ms) — 전체 동일 적용 */
const DBLCLICK_MS = 380;

// ─────────────────────────────────────────────
// DRAG BUS — 전역 드래그 상태 중계자
// window.pointermove / pointerup 핸들러를 단 1쌍만 유지하여
// 복수 모듈(app.js, free-objects.js 등)이 동시에 window에 등록하는
// 문제를 해소하기 위한 유틸. 현재는 뼈대만 존재(STEP 1).
// 실제 연결은 STEP 2(app.js SVG), STEP 3(free-objects.js)에서 진행.
// ─────────────────────────────────────────────
const DragBus = (() => {
  let _onMove = null;
  let _onUp   = null;

  // window에 단 1쌍만 상주
  window.addEventListener('pointermove', e => { if (_onMove) _onMove(e); });
  window.addEventListener('pointerup',   e => { if (_onUp)   _onUp(e);   });

  return {
    /**
     * 드래그 세션 시작.
     * @param {function} onMove - pointermove 콜백
     * @param {function} onUp   - pointerup 콜백 (clear()도 내부에서 호출할 것)
     */
    start(onMove, onUp) {
      _onMove = onMove;
      _onUp   = onUp;
    },
    /** 드래그 세션 종료 — onUp 내부에서 명시적으로 호출 */
    clear() {
      _onMove = null;
      _onUp   = null;
    }
  };
})();


// Head -> Neck -> Chest -> Waist -> Pelvis 5-segment skeleton
// ─────────────────────────────────────────────
// CUDO(Color Universal Design Organization) 공인 CUD 표준 팔레트
// SKY BLUE -> BLUE -> ORANGE -> BLUISH GREEN -> REDDISH PURPLE -> VERMILION
const DUMMY_COLORS = ['#56B4E9', '#0072B2', '#E69F00', '#009E73', '#CC79A7', '#D55E00'];
let colorIdx = 0;
function nextColor() { return DUMMY_COLORS[colorIdx++ % DUMMY_COLORS.length]; }



// ─────────────────────────────────────────────
// MAIN APP CLASS
// ─────────────────────────────────────────────
class App {
  constructor() {
    this.objects = [];
    this.selected = null;
    this.selectedPart = 'all';
    this.editMode = 'transform'; // 'transform' | 'pose'
    this.tool = 'select';

    // Drawing state
    this.drawingColor = '#000000';
    this.penWidth = 5;
    this.shapeStyle = 'stroke';
    this.shapeWidth = 4;
    this.isDrawing = false;
    this.drawPts = [];
    this.tempEl = null;
    this.shapeOrigin = null;

    // Drag state
    this.dragMode = null;
    this.dragJoint = null;
    this.dragOff = { x: 0, y: 0 };
    this.initScale = 1;
    this.initAngle = 0;
    this.initMouseDist = 0;
    this.initMouseAngle = 0;

    // References
    this.refCategory = '기타';
    this.refSlots = [];

    // Recent colors (CUDO Color Universal Design Palette)
    this.recentColors = ['#000000','#56B4E9','#0072B2','#E69F00','#009E73','#CC79A7','#D55E00','#FFFFFF'];

    // Canvas config
    this.canvasBg = '#ffffff';
    this.vbW = 800; this.vbH = 800;

    // DOM
    this.svg      = document.getElementById('main-svg');
    this.gObjects = document.getElementById('g-obj');
    this.gCtrl    = document.getElementById('g-ctrl');

    this._initResizeObserver();
    this._initTools();
    this._initColorPicker();
    this._initSVGEvents();
    this._initSidebarWires();
    this._initRefPanel();
    this._initBookmarkDeck();
    this._initRefPanelToggle();
    this._initExport();
    CommissionApp.ModalManager.initAll(() => this._clearAll()); // modal-manager.js
    this._initCropModal(); // 이미지 크롭 모달 초기화
    this._renderRecentColors();
    this._initChipColorPicker(); // 컬러칩 컬러 피커 초기화
    this._initSheetTheme();     // 캐릭터 시트 컬러 테마 시스템 초기화
    this._initCompDesc();       // 구도 설명란 컴포넌트 초기화

    // 기본 포즈 프리셋 데이터 정의 (총 10종)
    this.defaultPresets = [
      {
        name: "기본 스탠딩1",
        data: {"angles":{"pelvis":0,"waist":0,"chest":0,"neck":0,"head":0,"lShoulder":25,"lElbow":-163,"lWrist":0,"rShoulder":-7,"rElbow":1,"rWrist":14,"lHip":4,"lKnee":-21,"lAnkle":28,"rHip":-1,"rKnee":4,"rAnkle":-10},"partOffsets":{"lUpperArm":-12,"lLowerArm":6,"lHand":7,"rUpperArm":-9,"rLowerArm":8,"rHand":9,"lFoot":-6,"lCalf":-5,"lThigh":-4,"rFoot":-3,"rCalf":-2,"rThigh":-1,"pelvis":1,"waist":2,"chest":3,"neck":4,"head":5},"facingX":-0.10320050572656084,"facingY":0.21549814887844876,"flipped":false}
      },
      {
        name: "기본 스탠딩2",
        data: {"angles":{"pelvis":0,"waist":-5,"chest":2,"neck":7,"head":0,"lShoulder":25,"lElbow":-44,"lWrist":87,"rShoulder":-25,"rElbow":52,"rWrist":283,"lHip":8,"lKnee":0,"lAnkle":25,"rHip":-1,"rKnee":0,"rAnkle":0},"partOffsets":{"lUpperArm":-12,"lLowerArm":6,"lHand":7,"rUpperArm":-9,"rLowerArm":8,"rHand":9,"lFoot":-6,"lCalf":-5,"lThigh":-4,"rFoot":-3,"rCalf":-2,"rThigh":-1,"pelvis":1,"waist":2,"chest":3,"neck":4,"head":5},"facingX":0.012204252748958883,"facingY":0.07471692039783615,"flipped":false}
      },
      {
        name: "기본 스탠딩3",
        data: {"angles":{"pelvis":0,"waist":0,"chest":0,"neck":0,"head":0,"lShoulder":-4,"lElbow":-66,"lWrist":19,"rShoulder":-1,"rElbow":2,"rWrist":-8,"lHip":1,"lKnee":0,"lAnkle":30,"rHip":-1,"rKnee":0,"rAnkle":-24},"partOffsets":{"lUpperArm":35,"lLowerArm":308,"lHand":356,"rUpperArm":129,"rLowerArm":167,"rHand":306,"lFoot":-6,"lCalf":-5,"lThigh":-4,"rFoot":-3,"rCalf":-2,"rThigh":-1,"pelvis":1,"waist":2,"chest":3,"neck":4,"head":5},"facingX":8.779870202589256e-7,"facingY":0.4092164882346241,"flipped":false}
      },
      {
        name: "팔짱 낌",
        data: {"angles":{"pelvis":0,"waist":0,"chest":-4,"neck":-10,"head":0,"lShoulder":-4,"lElbow":-106,"lWrist":6,"rShoulder":-22,"rElbow":-237,"rWrist":5,"lHip":-3,"lKnee":-5,"lAnkle":9,"rHip":-12,"rKnee":26,"rAnkle":-37},"partOffsets":{"lUpperArm":6,"lLowerArm":7,"lHand":8,"rUpperArm":2,"rLowerArm":8,"rHand":6,"lFoot":-6,"lCalf":-5,"lThigh":-4,"rFoot":-3,"rCalf":-2,"rThigh":-1,"pelvis":1,"waist":2,"chest":3,"neck":4,"head":5},"facingX":0.4306399165954845,"facingY":0.020968686726637608,"flipped":false}
      },
      {
        name: "양손모음",
        data: {"angles":{"pelvis":0,"waist":0,"chest":0,"neck":0,"head":0,"lShoulder":22,"lElbow":-154,"lWrist":0,"rShoulder":-25,"rElbow":-201,"rWrist":-10,"lHip":-1,"lKnee":0,"lAnkle":0,"rHip":0,"rKnee":0,"rAnkle":0},"partOffsets":{"lUpperArm":-12,"lLowerArm":6,"lHand":7,"rUpperArm":-9,"rLowerArm":8,"rHand":9,"lFoot":-6,"lCalf":-5,"lThigh":-4,"rFoot":-3,"rCalf":-2,"rThigh":-1,"pelvis":1,"waist":2,"chest":3,"neck":4,"head":5},"facingX":0.031182170634159748,"facingY":0.4246604574406485,"flipped":false}
      },
      {
        name: "목에 손 1",
        data: {"angles":{"pelvis":-2,"waist":9,"chest":-4,"neck":-2,"head":0,"lShoulder":14,"lElbow":349,"lWrist":6,"rShoulder":-101,"rElbow":-883,"rWrist":-1,"lHip":2,"lKnee":-1,"lAnkle":-8,"rHip":-8,"rKnee":0,"rAnkle":-61},"partOffsets":{"lUpperArm":11,"lLowerArm":29,"lHand":53,"rUpperArm":-9,"rLowerArm":-9,"rHand":-8,"lFoot":-6,"lCalf":-5,"lThigh":-4,"rFoot":-3,"rCalf":-2,"rThigh":-1,"pelvis":1,"waist":2,"chest":3,"neck":4,"head":5},"facingX":0.3360890385100919,"facingY":0.039169209339166476,"flipped":false}
      },
      {
        name: "목에 손 2",
        data: {"angles":{"pelvis":-2,"waist":3,"chest":-4,"neck":8,"head":0,"lShoulder":30,"lElbow":185,"lWrist":6,"rShoulder":-11,"rElbow":-359,"rWrist":-1,"lHip":2,"lKnee":2,"lAnkle":-8,"rHip":-10,"rKnee":32,"rAnkle":-86},"partOffsets":{"lUpperArm":1048578,"lLowerArm":1048579,"lHand":2097152,"rUpperArm":1,"rLowerArm":-8,"rHand":-15,"lFoot":-6,"lCalf":-5,"lThigh":-4,"rFoot":-3,"rCalf":-2,"rThigh":-1,"pelvis":1,"waist":2,"chest":3,"neck":4,"head":5},"facingX":-0.2682391260663229,"facingY":0.15835257986998305,"flipped":true}
      },
      {
        name: "강하고 이상한놈",
        data: {"angles":{"pelvis":0,"waist":0,"chest":0,"neck":0,"head":0,"lShoulder":39,"lElbow":-230,"lWrist":-17,"rShoulder":-8,"rElbow":2,"rWrist":0,"lHip":7,"lKnee":2,"lAnkle":0,"rHip":-12,"rKnee":0,"rAnkle":-49},"partOffsets":{"lUpperArm":11,"lLowerArm":29,"lHand":53,"rUpperArm":-9,"rLowerArm":-11,"rHand":-10,"lFoot":-6,"lCalf":-5,"lThigh":-4,"rFoot":-3,"rCalf":-2,"rThigh":-1,"pelvis":1,"waist":2,"chest":3,"neck":4,"head":5},"facingX":0.27965993764095404,"facingY":0.12955720908393525,"flipped":false}
      },
      {
        name: "팔 스트레칭",
        data: {"angles":{"pelvis":0,"waist":0,"chest":0,"neck":-7,"head":0,"lShoulder":-80,"lElbow":-368,"lWrist":2,"rShoulder":-22,"rElbow":-191,"rWrist":0,"lHip":6,"lKnee":-2,"lAnkle":-1,"rHip":-12,"rKnee":0,"rAnkle":-49},"partOffsets":{"lUpperArm":48378511618778,"lLowerArm":48378511618465,"lHand":96757023236925,"rUpperArm":24189255809715,"rLowerArm":96757023236927,"rHand":120946279046321,"lFoot":-6,"lCalf":-5,"lThigh":-4,"rFoot":-3,"rCalf":-2,"rThigh":-1,"pelvis":1,"waist":2,"chest":-328,"neck":-327,"head":120946279046323},"facingX":0.15433514171752422,"facingY":-0.084729433605412,"flipped":false}
      },
      {
        name: "무릎에 손",
        data: {"angles":{"pelvis":0,"waist":-25,"chest":0,"neck":0,"head":0,"lShoulder":18,"lElbow":-1,"lWrist":0,"rShoulder":9,"rElbow":10,"rWrist":2,"lHip":12,"lKnee":0,"lAnkle":28,"rHip":-5,"rKnee":0,"rAnkle":33},"partOffsets":{"lUpperArm":-12,"lLowerArm":6,"lHand":7,"rUpperArm":11,"rLowerArm":28,"rHand":49,"lFoot":-6,"lCalf":-5,"lThigh":-4,"rFoot":-3,"rCalf":-2,"rThigh":-1,"pelvis":1,"waist":2,"chest":3,"neck":4,"head":5},"facingX":0,"facingY":0,"flipped":false}
      }
    ];

    // 포즈 프리셋 초기화
    this._initPosePresets();

    // HistoryManager 초기화 (history-manager.js)
    CommissionApp.HistoryManager.init({
      getObjects:       () => this.objects,
      getBg:            () => this.canvasBg,
      setObjects:       (arr) => { this.objects = arr; },
      setBg:            (color) => { this.canvasBg = color; },
      selectNull:       () => this._select(null),
      render:           () => this._render(),
      updateUndoRedoBtns: (canUndo, canRedo) => {
        const u = document.getElementById('undo-btn');
        const r = document.getElementById('redo-btn');
        if (u) u.disabled = !canUndo;
        if (r) r.disabled = !canRedo;
      }
    });

    // Add first dummy stickman (조용히 추가)
    this.addDummy(null, null, true);
    // 초기 상태를 히스토리에 저장
    this._pushHistory();
  }

  _initResizeObserver() {
    // canvas-area 크기 변화 감지 → _applyRatio 자동 호출
    const canvasArea = document.getElementById('canvas-area');
    if (canvasArea) {
      this._ro = new ResizeObserver(() => this._applyRatio());
      this._ro.observe(canvasArea);
    }

    // 비율/커스텀 크기 변경 시 재계산
    document.getElementById('canvas-ratio')?.addEventListener('change', () => this._applyRatio());
    document.getElementById('cw')?.addEventListener('change', () => this._applyRatio());
    document.getElementById('ch')?.addEventListener('change', () => this._applyRatio());

    // 초기 실행
    this._applyRatio();
  }

  _applyRatio() {
    const ratio = document.getElementById('canvas-ratio').value;
    const customRow = document.getElementById('custom-size');
    let w = 800, h = 800;
    const map = {
      '1:1':  [800, 800],
      '3:4':  [600, 800],
      '2:3':  [533.33, 800],
      '4:5':  [640, 800],
      '9:16': [450, 800],
      '16:9': [800, 450],
      '4:3':  [800, 600],
      '3:1':  [800, 266.67]
    };

    if (ratio === 'custom') {
      if (customRow) customRow.style.display = 'grid';
      let rw = parseFloat(document.getElementById('cw')?.value) || 4;
      let rh = parseFloat(document.getElementById('ch')?.value) || 3;
      if (rw <= 0) rw = 1;
      if (rh <= 0) rh = 1;

      // 800px 장축 기준으로 안전하게 논리 해상도(ViewBox) 정규화
      if (rw >= rh) {
        w = 800;
        h = Math.max(50, +(800 * (rh / rw)).toFixed(2));
      } else {
        h = 800;
        w = Math.max(50, +(800 * (rw / rh)).toFixed(2));
      }
    } else {
      if (customRow) customRow.style.display = 'none';
      [w, h] = map[ratio] || [800, 800];
    }

    // 800x800 중심점(400, 400) 기준 서브픽셀 정밀 중앙 정렬 뷰박스 계산
    const minX = +((800 - w) / 2).toFixed(2);
    const minY = +((800 - h) / 2).toFixed(2);

    this.vbMinX = minX;
    this.vbMinY = minY;
    this.vbW = w;
    this.vbH = h;
    this.svg.setAttribute('viewBox', `${minX} ${minY} ${w} ${h}`);

    const area = document.getElementById('canvas-area');
    const wrap = document.getElementById('canvas-wrap');

    if (area && wrap) {
      // 구도 설명란 가용 높이 계산
      // ※ 접기(folded) 상태와 무관하게 항상 152px로 계산
      //    → 접기/펼치기는 순수 텍스트 가리기 용도, 캔버스 크기 변동 없음
      //    → 레이아웃 재계산 없음 = 오른쪽 패널 덜컥거림 없음
      const descOuter = document.getElementById('cs-comp-outer');
      let descH = 0;
      if (descOuter && !descOuter.classList.contains('hidden')) {
        descH = 152; // 헤더(38) + 본문(110) + 보더(4) — folded 여부 무시
      }

      const aw = Math.max(100, area.clientWidth - 32);
      const outContainer = document.querySelector('.output-container');
      const containerHeight = outContainer ? (outContainer.clientHeight - 48) : area.clientHeight;
      const ah = Math.max(150, containerHeight - 32 - (descH > 0 ? (descH + 16) : 0));

      const sc = Math.min(aw / w, ah / h);
      const vw = Math.round(w * sc);
      const vh = Math.round(h * sc);

      wrap.style.width = vw + 'px';
      wrap.style.height = vh + 'px';
      this.svg.setAttribute('width', vw);
      this.svg.setAttribute('height', vh);

      if (descOuter) {
        descOuter.style.width = vw + 'px';
      }

      // 로고(워터마크) 반응형 축소 (평소에는 10.5px 유지, 극단적으로 좁아질 때만 안전 축소)
      const watermarkEl = wrap.querySelector('.canvas-watermark');
      if (watermarkEl) {
        const minDim = Math.min(vw, vh);
        if (minDim < 220) {
          const fontSize = Math.max(7, Math.round(minDim * 0.045));
          watermarkEl.style.fontSize = fontSize + 'px';
          watermarkEl.style.right = Math.max(4, Math.round(minDim * 0.03)) + 'px';
          watermarkEl.style.bottom = Math.max(3, Math.round(minDim * 0.025)) + 'px';
        } else {
          watermarkEl.style.fontSize = '';
          watermarkEl.style.right = '';
          watermarkEl.style.bottom = '';
        }
      }
    }
    this._renderControls();
  }

  // ── EXPORT & PREVIEW MODAL INITIALIZATION ─────
  _initExport() {
    document.getElementById('export-btn')?.addEventListener('click', () => this._export(false));
    document.getElementById('preview-btn')?.addEventListener('click', () => this._export(true));

    document.getElementById('preview-close')?.addEventListener('click', () => this._closePreview());
    document.getElementById('preview-close2')?.addEventListener('click', () => this._closePreview());
    document.getElementById('preview-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'preview-modal') this._closePreview();
    });
    document.getElementById('preview-save')?.addEventListener('click', () => {
      const fmt = document.getElementById('export-fmt')?.value || 'png';
      const href = document.getElementById('preview-img')?.src;
      if (href) this._download(href, `commission_layout.${fmt}`);
      this._closePreview();
    });
  }

  _closePreview() {
    const modal = document.getElementById('preview-modal');
    if (modal) closeModalWithFocus(modal);
  }
  _export(isPreview = false) {
    const fmt = document.getElementById('export-fmt')?.value || 'png';
    const dpr = +(document.getElementById('export-dpr')?.value || 2);
    const scope = document.getElementById('export-scope')?.value || 'all';

    // 1. 현재 화면의 활성 캐릭터 데이터 최신 동기화 (텍스트, 슬롯, 컬러칩, 테마, 스티커 100%)
    const curActive = this.characters.find(c => c.id === this.activeCharId);
    if (curActive) {
      const nameEl = document.getElementById('cs-name-input');
      const origEl = document.getElementById('cs-orig-name-input');
      const specEl = document.getElementById('cs-spec-input');
      const kwEl   = document.getElementById('cs-keyword-input');
      const kpEl   = document.getElementById('cs-keypoint-input');
      const featEl = document.getElementById('cs-features-input');
      const srcEl  = document.getElementById('cs-source-input');

      if (nameEl) curActive.name = nameEl.value;
      if (origEl) curActive.origName = origEl.value;
      if (specEl) curActive.spec = specEl.value;
      if (kwEl)   curActive.keywords = kwEl.value;
      if (kpEl) {
        curActive.keypoints = kpEl.innerText || kpEl.textContent;
        curActive.keypointAlign = kpEl.getAttribute('data-align') || 'left';
      }
      if (featEl) {
        curActive.features = (featEl.innerText || featEl.textContent).replace(/\r\n|\r|\n/g, '\n');
        curActive.featuresAlign = featEl.getAttribute('data-align') || 'left';
      }
      if (srcEl)  curActive.source = srcEl.value;
      if (window.CommissionApp?.ImageSlots?.getAllSlotsState) curActive.images = window.CommissionApp.ImageSlots.getAllSlotsState();
      if (typeof this._getAllChipsState === 'function') curActive.chips = this._getAllChipsState();
      if (this.sheetTheme) curActive.theme = { ...this.sheetTheme };
      const freeState = CommissionApp.FreeObjects?.getObjectsState?.();
      if (freeState) curActive.freeObjects = freeState;
    }

    // 2. 파츠 선택 해제
    const prevSelected = this.selected;
    const prevSelectedPart = this.selectedPart;
    this.selected = null;
    this.selectedPart = 'all';
    this._render();

    // 3. 화면 밖 오프스크린 wrapper 생성
    const offscreen = document.createElement('div');
    offscreen.id = 'offscreen-export-wrapper';
    const isSheetsOnly = scope === 'sheets-only' || scope === 'current-sheet-only';
    offscreen.style.cssText = [
      'position:absolute', 'top:0', 'left:-99999px',
      'width:max-content', 'height:max-content',
      'background:#ffffff', 
      'padding:' + (isSheetsOnly ? '4px' : '24px'),
      'display:flex', 'flex-direction:row',
      'align-items:center', 'justify-content:center',
      'gap:' + (isSheetsOnly ? '0' : '24px'),
      'box-sizing:border-box'
    ].join(';');

    const canvasArea = document.getElementById('canvas-area');
    const refPanel   = document.getElementById('ref-panel');
    // html2canvas 서브픽셀 렌더링(테두리 굵기 다름 및 소실) 방지를 위해 강제 정수화
    const targetW = Math.round(this.vbW || 800);
    const targetH = Math.round(this.vbH || 800);

    // 구도 설명란 포함 여부 및 좌측 묶음 전체 높이 계산
    const isCompDescIncluded = this.compDesc && this.compDesc.visible && !this.compDesc.folded;
    const compDescH = isCompDescIncluded ? (38 + 110 + 4) : 0; // 헤더 38px + 본문 110px + 보더 4px
    const groupLeftH = isCompDescIncluded ? (targetH + 12 + compDescH) : targetH;
    const panelH = 830;

    // 내보낼 캐릭터 목록 결정
    let targetCharacters = [];
    if (scope === 'canvas-only') {
      targetCharacters = [];
    } else if (scope === 'current' || scope === 'current-sheet-only') {
      targetCharacters = [ curActive || this.characters[0] ];
    } else {
      // 'all', 'all-split', 'sheets-only'
      targetCharacters = [ ...this.characters ];
    }

    const includeCanvas = (scope !== 'sheets-only' && scope !== 'current-sheet-only') && !!canvasArea;

    // all-split: 캐릭터 2명 이상일 때만 좌/우 분할 (1명이면 기존 캔버스/시트 방식)
    const isSplitLayout = scope === 'all-split' && targetCharacters.length >= 2;
    const leftChars  = isSplitLayout ? targetCharacters.slice(0, Math.floor(targetCharacters.length / 2)) : [];
    const rightChars = isSplitLayout ? targetCharacters.slice(Math.floor(targetCharacters.length / 2))   : [];

    // 좌/우 덩어리의 1:1 완벽 수평 중앙 정렬은 CSS(offscreen의 align-items:center)에 위임
    // ── 3-A. 캔버스 영역 복제 (split 모드: 나중에 중앙에 삽입하기 위해 변수에 저장)
    let clonedAreaEl = null;
    if (includeCanvas) {
      const clonedArea = canvasArea.cloneNode(true);
      clonedArea.querySelector('.canvas-tip')?.remove();
      clonedArea.querySelector('.canvas-toolbar')?.remove();

      const clonedWrap = clonedArea.querySelector('#canvas-wrap');
      const clonedSvg  = clonedArea.querySelector('#main-svg');
      if (clonedWrap && clonedSvg) {
        clonedWrap.style.width  = targetW + 'px';
        clonedWrap.style.height = targetH + 'px';
        clonedSvg.setAttribute('width',  targetW);
        clonedSvg.setAttribute('height', targetH);
        const minX = typeof this.vbMinX === 'number' ? this.vbMinX : Math.round(400 - (targetW / 2));
        const minY = typeof this.vbMinY === 'number' ? this.vbMinY : Math.round(400 - (targetH / 2));
        clonedSvg.setAttribute('viewBox', `${minX} ${minY} ${targetW} ${targetH}`);
      }

      // 구도 설명란 포함 여부 처리 (펼쳐져 있을 때만 포함)
      const clonedDesc = clonedArea.querySelector('#cs-comp-outer');
      if (this.compDesc && this.compDesc.visible && !this.compDesc.folded && clonedDesc) {
        clonedDesc.querySelectorAll('button, #cs-comp-theme-popup, [data-ui-only]').forEach(el => el.remove());
        const th = this.compDesc.theme || {};
        clonedDesc.style.setProperty('--cs-comp-main-color', th.main || '#2E2E2E');
        clonedDesc.style.setProperty('--cs-comp-sub-color', th.sub || '#E6E6E6');
        clonedDesc.style.setProperty('--cs-comp-bg-color', th.bg || '#FFFFFF');
        clonedDesc.style.setProperty('--cs-comp-title-text', th.titleText || '#FFFFFF');
        clonedDesc.style.setProperty('--cs-comp-body-text', th.bodyText || '#1E293B');
        clonedDesc.style.setProperty('--cs-comp-font-size', (th.fontSize || 13) + 'px');
        clonedDesc.style.setProperty('--cs-comp-font-weight', th.fontWeight || 400);
        clonedDesc.style.width = targetW + 'px';
        clonedDesc.style.maxWidth = targetW + 'px';
        clonedDesc.style.flexShrink = '0';

        const ftEl = clonedDesc.querySelector('#cs-comp-features-input');
        if (ftEl) {
          const div = document.createElement('div');
          div.className = ftEl.className;
          div.style.cssText = 'width:100%;height:110px;padding:10px 14px;font-family:inherit;font-size:' + (th.fontSize || 13.5) + 'px;font-weight:' + (th.fontWeight || 400) + ';color:' + (th.bodyText || '#1E293B') + ';line-height:1.55;background:' + (th.sub || '#E6E6E6') + ';border:none;outline:none;overflow:hidden;box-sizing:border-box;white-space:pre-wrap;word-break:break-word;';
          div.innerHTML = (this.compDesc.features || '').replace(/\n/g, '<br>');
          ftEl.replaceWith(div);
        }

        clonedArea.style.cssText = 'flex:none;width:' + targetW + 'px;height:auto;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:12px;margin:auto 0;';
      } else {
        if (clonedDesc) clonedDesc.remove();
        clonedArea.style.cssText = 'flex:none;width:' + targetW + 'px;height:' + targetH + 'px;display:flex;align-items:center;justify-content:center;margin:auto 0;';
      }

      if (isSplitLayout) {
        clonedAreaEl = clonedArea; // split 모드: 나중에 캔버스를 중앙에 삽입
      } else {
        offscreen.appendChild(clonedArea);
      }
    }

    // ── 3-B. 캐릭터 시트 복제 헬퍼 (각 캐릭터별 데이터 100% 반영)
    const clonedSheetsInfo = [];

    // ── 시트 1장을 DOM 요소로 빌드하는 헬퍼 함수
    const buildSheetEl = (char, charIdx, groupScopeForBorder) => {
      const clonedRef = refPanel.cloneNode(true);

      // 조작용 UI 100% 완전 제거
      [
        '.cs-panel-float-group', '.cs-bookmark-deck',
        '.cs-sheets-header-toolbar', '.theme-panel',
        '.float-btn-group', 'button', 'input[type="file"]',
        '[data-ui-only]'
      ].forEach(sel => {
        clonedRef.querySelectorAll(sel).forEach(el => el.remove());
      });

      // 텍스트 필드 데이터 주입 및 정적 Div 치환
      const TEXT_FIELDS = [
        { id: 'cs-name-input',      val: char.name || (char.letter + '.'), isMulti: false },
        { id: 'cs-orig-name-input', val: char.origName || '',              isMulti: false },
        { id: 'cs-spec-input',      val: char.spec || '',                  isMulti: false },
        { id: 'cs-keyword-input',   val: char.keywords || '',              isMulti: false },
        { id: 'cs-keypoint-input',  val: char.keypoints || '',             isMulti: false },
        { id: 'cs-features-input',  val: char.features || '',              isMulti: true },
        { id: 'cs-source-input',    val: char.source || '',                isMulti: false }
      ];

      TEXT_FIELDS.forEach(tf => {
        const el = clonedRef.querySelector('#' + tf.id);
        if (!el) return;
        const liveEl = document.getElementById(tf.id);
        const cs = window.getComputedStyle(liveEl || el);
        const div = document.createElement('div');
        div.id = el.id;
        div.className = el.className;

        if (tf.isMulti) {
          div.innerHTML = (tf.val || '').replace(/\n/g, '<br>');
        } else {
          div.textContent = tf.val || '';
        }

        div.style.cssText = [
          'font-family:' + cs.fontFamily,
          'font-size:' + cs.fontSize,
          'font-weight:' + cs.fontWeight,
          'font-style:' + cs.fontStyle,
          'color:' + cs.color,
          'text-align:' + cs.textAlign,
          'letter-spacing:' + cs.letterSpacing,
          'line-height:' + (cs.lineHeight === 'normal' ? '1.45' : cs.lineHeight),
          'padding:' + cs.padding,
          'margin:' + cs.margin,
          'width:' + cs.width,
          'height:auto',
          'box-sizing:border-box',
          'background:transparent',
          'border:none',
          'outline:none',
          'overflow:hidden',
          tf.isMulti ? 'white-space:pre-wrap;word-break:break-word' : 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis'
        ].join(';');

        el.replaceWith(div);
      });

      // 컬러칩 5종 주입
      const chips = char.chips || {};
      clonedRef.querySelectorAll('.cs-color-swatch').forEach(sw => {
        const key = sw.dataset.csChipKey;
        // 기존 배열 형태면 무시하고 기본값 적용
        let st = Array.isArray(chips) ? null : chips[key];
        
        // st가 없으면 기본 흰색 상태로 렌더링되도록 강제 초기화
        if (!st) {
          st = { baseMode: 'color', color: '#ffffff' };
        }

        if (st.baseMode === 'color') {
          sw.style.backgroundColor = st.color || '#ffffff';
          sw.style.backgroundImage = '';
        } else if (st.baseMode === 'gradient') {
          sw.style.backgroundColor = 'transparent';
          const dir = st.gradient?.dir || 180;
          const stops = st.gradient?.stops || ['#ffffff', '#aaaaaa'];
          sw.style.backgroundImage = `linear-gradient(${dir}deg, ${stops.join(', ')})`;
          sw.style.backgroundSize = '100% 100%';
        } else if (st.baseMode === 'image') {
          sw.style.backgroundColor = 'transparent';
          sw.style.backgroundImage = st.imageUrl ? `url(${st.imageUrl})` : '';
          sw.style.backgroundSize = 'cover';
        }
      });

      // ★ 이미지 슬롯 5종 DOM 초기화 및 캐릭터 고유 슬롯 상태 주입 (각 캐릭터별 이미지 독립 주입)
      const charImgs = char.images || {};
      clonedRef.querySelectorAll('[data-slot-id]').forEach(box => {
        const slotId = box.dataset.slotId;
        const st = charImgs[slotId];

        // 기존 복제된 인터랙티브 요소 및 잔류 이미지 제거
        box.querySelectorAll('.slot-img, .img-slot-overlay, .slot-rotate-row').forEach(el => el.remove());

        const ph = box.querySelector('.slot-placeholder') || box.querySelector('.cs-slot-placeholder');
        if (st && st.original) {
          if (ph) ph.style.display = 'none';
          box.style.backgroundColor = st.bgColor || '#ffffff';

          // ★ 해당 캐릭터의 고유 이미지 <img> 태그 생성 및 transform 주입
          const img = document.createElement('img');
          img.className = 'slot-img';
          img.src = st.original;
          img.style.cssText = [
            'position:absolute',
            'top:50%',
            'left:50%',
            'transform-origin:center center',
            'pointer-events:none',
            'transform:translate(-50%,-50%) translate(' + (st.offsetX || 0) + 'px,' + (st.offsetY || 0) + 'px) scale(' + (st.scale || 1) + ') rotate(' + (st.rotate || 0) + 'deg)',
            'display:block'
          ].join(';');
          box.appendChild(img);
        } else {
          if (ph) {
            ph.style.display = 'flex';
            ph.style.opacity = '1';
          }
          box.style.backgroundColor = (st && st.bgColor) ? st.bgColor : '#ffffff';
        }
      });

      // ref-panel 외부 wrapper 크기/여백 고정
      clonedRef.style.cssText = [
        'flex:none', 'width:722px', 'height:830px',
        'box-sizing:border-box',
        'background:transparent', 'padding:0', 'margin:0', 'border:none',
        'position:relative', 'display:flex', 'align-items:center', 'justify-content:center',
        'margin:auto 0'
      ].join(';');

      // 시트 본체(.cs-sheet-wrap) 규격 절대 고정 (40px 대칭 패딩 강제) 및 캐릭터별 고유 테마/스티커 주입
      const sheet = clonedRef.querySelector('.cs-sheet-wrap') || clonedRef.querySelector('#cs-sheet-wrap');
      if (sheet) {
        sheet.style.width     = '722px';
        sheet.style.height    = '830px';
        sheet.style.minWidth  = '722px';
        sheet.style.minHeight = '830px';
        sheet.style.maxWidth  = '722px';
        sheet.style.maxHeight = '830px';
        sheet.style.padding   = '40px';
        sheet.style.boxSizing = 'border-box';
        // html2canvas가 테두리가 있는 컨테이너의 overflow: hidden을 만날 때 테두리를 잘라먹는 고질적 버그 방지
        sheet.style.overflow  = 'visible';
        sheet.style.position  = 'relative';
        sheet.style.margin    = '0';
        sheet.style.flexShrink = '0';

        // ★ 1. 캐릭터별 고유 테마 색상 주입
        const th = char.theme || { main: '#2E2E2E', sub: '#E6E6E6', title: '#FFFFFF', body: '#1E293B', bg: '#FFFFFF' };
        sheet.style.setProperty('--cs-main-color', th.main);
        sheet.style.setProperty('--cs-sub-color', th.sub);
        sheet.style.setProperty('--cs-title-text', th.title);
        sheet.style.setProperty('--cs-body-text', th.body);
        sheet.style.setProperty('--cs-sheet-bg', th.bg);
        sheet.style.backgroundColor = th.bg;

        // 'sheets-only' 또는 'current-sheet-only' 모드 시 아웃라인 완전 제거
        if (groupScopeForBorder === 'sheets-only' || groupScopeForBorder === 'current-sheet-only') {
          sheet.style.boxShadow = 'none';
          sheet.style.border    = 'none';
          sheet.style.outline   = 'none';
          sheet.style.margin    = '0';
        }

        // ★ 2. 캐릭터별 고유 자유 스티커 이미지 주입
        clonedRef.querySelectorAll('.free-obj-item').forEach(el => el.remove());
        (char.freeObjects || []).forEach(obj => {
          const item = document.createElement('div');
          item.className = 'free-obj-item';
          item.style.position = 'absolute';
          item.style.left = obj.x + 'px';
          item.style.top = obj.y + 'px';
          item.style.width = obj.w + 'px';
          item.style.height = obj.h + 'px';
          item.style.transform = 'rotate(' + (obj.rotation || 0) + 'deg)';
          item.style.zIndex = obj.zIndex || 10;
          if (obj.type === 'text') {
            const fs = obj.fontSize || 14;
            const fw = obj.fontWeight || '400';
            const col = obj.color || '#1e293b';
            item.innerHTML = `<div style="width:100%;height:100%;white-space:pre-wrap;word-break:break-all;font-family:inherit;background:transparent;border:none;overflow:hidden;font-size:${fs}px; font-weight:${fw}; color:${col};display:flex;align-items:center;justify-content:center;text-align:center;">${obj.content || ''}</div>`;
          } else {
            item.innerHTML = '<img class="free-obj-img" src="' + obj.src + '" style="width:100%;height:100%;object-fit:contain;display:block;">';
          }
          sheet.appendChild(item);
        });
      }

      clonedSheetsInfo.push({ char: char, el: clonedRef });
      return clonedRef;
    };

    // ── 3-C. 시트 DOM 조립 및 offscreen에 추가
    if (refPanel && targetCharacters.length > 0) {
      if (isSplitLayout) {
        // split 모드: [좌측 시트들] → [캔버스] → [우측 시트들] 순으로 배치
        // 좌측 시트들을 flex 세로 방향 컨테이너로 묶기
        const makeGroupWrapper = () => {
          const w = document.createElement('div');
          w.style.cssText = 'display:flex;flex-direction:row;align-items:center;gap:0;';
          return w;
        };
        const leftWrap = makeGroupWrapper();
        leftChars.forEach((char, idx) => {
          leftWrap.appendChild(buildSheetEl(char, idx, null));
        });
        offscreen.appendChild(leftWrap);

        // 중앙 캔버스 삽입
        if (clonedAreaEl) offscreen.appendChild(clonedAreaEl);

        const rightWrap = makeGroupWrapper();
        rightChars.forEach((char, idx) => {
          rightWrap.appendChild(buildSheetEl(char, idx, null));
        });
        offscreen.appendChild(rightWrap);
      } else {
        // 기존 모드: 캔버스 뒤에 시트를 순서대로 append
        // sheets-only 모드: 시트 사이에 1px 세로 구분선 삽입
        targetCharacters.forEach((char, charIdx) => {
          if (scope === 'sheets-only' && charIdx > 0) {
            const divider = document.createElement('div');
            divider.style.cssText = 'flex:none;width:1px;height:830px;background:#d0d0d0;align-self:center;';
            offscreen.appendChild(divider);
          }
          offscreen.appendChild(buildSheetEl(char, charIdx, scope));
        });
      }
    }

    document.body.appendChild(offscreen);

    const captureW = offscreen.offsetWidth  || offscreen.scrollWidth;
    const captureH = offscreen.offsetHeight || offscreen.scrollHeight;

    // offscreen 내부의 모든 이미지(슬롯 이미지, 스티커 등) 디코딩 완료 대기
    const allImages = Array.from(offscreen.querySelectorAll('img'));
    const imgPromises = allImages.map(img => {
      if (img.decode) {
        return img.decode().catch(() => Promise.resolve());
      }
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });

    const fontReady = typeof document.fonts !== 'undefined' ? document.fonts.ready : Promise.resolve();
    Promise.all([fontReady, Promise.all(imgPromises), new Promise(r => setTimeout(r, 100))])
    .then(() => html2canvas(offscreen, {
      backgroundColor: '#ffffff',
      scale: dpr,
      width:  captureW,
      height: captureH,
      windowWidth:  captureW,
      windowHeight: captureH,
      scrollX: 0, scrollY: 0,
      useCORS: true, logging: false, allowTaint: true,
      onclone: doc => {
        const fontReady2 = typeof doc.fonts !== 'undefined' ? doc.fonts.ready : Promise.resolve();
        return fontReady2;
      }
    }))
    .then(async canvas => {
      offscreen.remove();
      this.selected = prevSelected;
      this.selectedPart = prevSelectedPart;
      this._render();

      const mimeMap = { png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', webp:'image/webp' };
      const dataUrl = canvas.toDataURL(mimeMap[fmt] || 'image/png', 0.95);

      if (isPreview) {
        const modal = document.getElementById('preview-modal');
        const img   = document.getElementById('preview-img');
        const info  = document.getElementById('preview-info');
        if (modal) openModalWithFocus(modal, document.getElementById('preview-btn'));
        if (img)   img.src = dataUrl;
        if (info)  info.textContent = '출력 해상도: ' + canvas.width + ' x ' + canvas.height + ' px | ' + fmt.toUpperCase() + ' (' + (scope === 'all' ? '전체 합본' : scope === 'all-split' ? '캔버스 중앙 양분할' : scope === 'current' ? '현재 1인' : scope === 'sheets-only' ? '시트만' : scope === 'current-sheet-only' ? '현재 1인 시트만' : '포즈만') + ')';
      } else {
        this._download(dataUrl, 'commission_layout.' + fmt);
        announceStatus('이미지 내보내기가 완료되었습니다.');
      }
    }).catch(err => {
      offscreen.remove();
      this.selected = prevSelected;
      this.selectedPart = prevSelectedPart;
      this._render();
      console.error('[EXPORT ERROR]', err);
      this._alert('내보내기 중 오류가 발생했습니다.\n' + err.message);
    });
  }

  

  
  _initTools() {
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => this._setTool(btn.dataset.tool));
    });
    document.getElementById('add-dummy').addEventListener('click', () => this.addDummy());
  }

  _setTool(t) {
    this.tool = t;
    document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('is-active'));
    const b = document.querySelector(`.tool-btn[data-tool="${t}"]`);
    if (b) b.classList.add('is-active');

    const toolOpts = document.getElementById('tool-opts');
    if (toolOpts) {
      if (t === 'select' && this.selected && ['pen','path','rect','circle','arrow','text'].includes(this.selected.type)) {
        toolOpts.style.display = 'flex';
        const wrapper = document.getElementById('shape-style-wrapper');
        if (wrapper) wrapper.style.display = this.selected.type === 'arrow' ? 'none' : 'block';
      } else {
        toolOpts.style.display = ['pen','rect','circle','arrow','text'].includes(t) ? 'flex' : 'none';
        const wrapper = document.getElementById('shape-style-wrapper');
        if (wrapper) wrapper.style.display = t === 'arrow' ? 'none' : 'block';
      }
    }

    if (t === 'image') {
      document.getElementById('img-file').click();
      this._setTool('select');
    }
    if (t !== 'select') this._select(null);
    this._render();
  }

  // ── COLOR PICKER ─────────────────────────────
  _initColorPicker() {
    const picker = document.getElementById('tool-picker');
    const hex    = document.getElementById('tool-hex');

    const apply = (c) => {
      if (this.selected) {
        this._applyColorToSelected(c);
        if (this.selected.type !== 'stickman') {
          this.drawingColor = c;
        }
      } else {
        this.drawingColor = c;
      }
      this._pushRecentColor(c);
    };

    picker.addEventListener('input', () => { hex.value = picker.value; apply(picker.value); });
    hex.addEventListener('change', () => {
      let c = hex.value.trim();
      if (!/^#/.test(c)) c = '#' + c;
      if (/^#[0-9a-fA-F]{6}$/.test(c)) { picker.value = c; apply(c); }
    });

    if (window.EyeDropper) {
      const btn = document.getElementById('eye-btn');
      btn.style.display = 'inline-flex';
      btn.addEventListener('click', async () => {
        try {
          const r = await new EyeDropper().open();
          picker.value = r.sRGBHex; hex.value = r.sRGBHex; apply(r.sRGBHex);
        } catch {}
      });
    }

    // Canvas background
    const bgP = document.getElementById('bg-picker');
    const bgH = document.getElementById('bg-hex');
    const applyBg = (c) => {
      this.canvasBg = c;
      document.getElementById('svg-bg').setAttribute('fill', c);
      this._pushHistory();
    };
    bgP.addEventListener('input', () => { bgH.value = bgP.value; applyBg(bgP.value); });
    bgH.addEventListener('change', () => {
      let c = bgH.value.trim();
      if (!/^#/.test(c)) c = '#' + c;
      if (/^#[0-9a-fA-F]{6}$/.test(c)) { bgP.value = c; applyBg(c); }
    });

    // Shape/Line width (Unified)
    const sw = document.getElementById('shape-w');
    sw.addEventListener('input', () => {
      this.shapeWidth = +sw.value;
      this.penWidth = +sw.value;
      document.getElementById('sw-val').textContent = sw.value;
      if (this.selected && ['rect','circle','arrow','path','text'].includes(this.selected.type)) {
        this.selected.strokeWidth = this.shapeWidth;
        this._render();
      }
    });

    // Shape/Line style (Unified)
    document.getElementById('shape-style').addEventListener('change', e => {
      this.shapeStyle = e.target.value;
      if (this.selected && ['rect','circle','arrow','path','text'].includes(this.selected.type)) {
        this.selected.shapeStyle = this.shapeStyle; this._render();
      }
    });

    // Image file loader
    document.getElementById('img-file').addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      const fr = new FileReader();
      fr.onload = ev => this._addImage(ev.target.result);
      fr.readAsDataURL(f);
      e.target.value = '';
    });
  }

  _applyColorToSelected(c) {
    const s = this.selected;
    if (!s) return;
    if (s.type === 'stickman') {
      for (const k in s.colors) {
        s.colors[k] = c;
      }
      s.baseColor = c;
      // 인물 컬러를 변경했으므로 연동 토글 자동 해제 (시트 테마 컬러는 안전하게 보존)
      if (this.linkDummyColor) {
        this.linkDummyColor = false;
        const linkToggle = document.getElementById('theme-link-dummy-toggle');
        if (linkToggle) linkToggle.checked = false;
      }
    } else {
      s.color = c;
    }
    this._pushHistory();
    this._render();
  }

  _pushRecentColor(c) {
    this.recentColors = [c, ...this.recentColors.filter(x => x !== c)].slice(0, 8);
    this._renderRecentColors();
  }

  _renderRecentColors() {
    const row = document.getElementById('recent-colors');
    row.innerHTML = '';
    this.recentColors.forEach(c => {
      const ch = document.createElement('div');
      ch.className = 'color-chip';
      ch.style.background = c;
      ch.title = c;
      ch.addEventListener('click', () => {
        document.getElementById('tool-picker').value = c;
        document.getElementById('tool-hex').value = c;
        if (this.selected) {
          this._applyColorToSelected(c);
          if (this.selected.type !== 'stickman') this.drawingColor = c;
        } else {
          this.drawingColor = c;
        }
      });
      row.appendChild(ch);
    });
  }

  // ── SVG EVENTS ───────────────────────────────
  _initSVGEvents() {
    this.svg.addEventListener('pointerdown', e => this._onSVGDown(e));
    // window의 pointermove/pointerup은 DragBus가 단일 쌍으로 관리 (STEP 2)
    this.svg.addEventListener('dblclick',  e => this._onDblClick(e));
  }

  _onSVGDown(e) {
    if (e.target.closest('#g-ctrl')) return;
    const pt = svgPt(this.svg, e);

    if (this.tool === 'select') {
      if (e.target === this.svg || e.target.id === 'svg-bg' || e.target.id === 'g-obj') {
        this._select(null);
      }
      return;
    }
    if (this.tool === 'eraser') return;
    if (this.tool === 'text') {
      this._createText(pt.x, pt.y);
      return;
    }
    if (this.tool === 'pen') {
      this._pushHistory(); // ← before 스냅샷: 그리기 시작 직전
      this.isDrawing = true;
      this.drawPts = [{ x: pt.x, y: pt.y }];
      this.tempEl = svgEl('path', { stroke: this.drawingColor, 'stroke-width': this.penWidth,
                                     fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      this.gObjects.appendChild(this.tempEl);
      DragBus.start(ev => this._onMove(ev), ev => this._onUp(ev));
      return;
    }
    if (['rect','circle','arrow'].includes(this.tool)) {
      this._pushHistory(); // ← before 스냅샷: 도형 그리기 시작 직전
      this.isDrawing = true;
      this.shapeOrigin = { x: pt.x, y: pt.y };
      const tag = this.tool === 'arrow' ? 'line' : this.tool;
      this.tempEl = svgEl(tag);
      if (this.tool === 'arrow') {
        this._styleShapeEl(this.tempEl, 'arrow', this.drawingColor, 'stroke', 4);
        this.tempEl.setAttribute('marker-end', 'url(#arrow-head)');
        this.tempEl.setAttribute('x1', pt.x); this.tempEl.setAttribute('y1', pt.y);
        this.tempEl.setAttribute('x2', pt.x); this.tempEl.setAttribute('y2', pt.y);
      } else {
        this._styleShapeEl(this.tempEl, this.tool, this.drawingColor, this.shapeStyle, 4);
        if (this.tool === 'circle') {
          this.tempEl.setAttribute('cx', pt.x);
          this.tempEl.setAttribute('cy', pt.y);
          this.tempEl.setAttribute('r', 0);
        }
      }
      this.gObjects.appendChild(this.tempEl);
      DragBus.start(ev => this._onMove(ev), ev => this._onUp(ev));
    }
  }

  _onMove(e) {
    const pt = svgPt(this.svg, e);

    // Drawing update
    if (this.isDrawing && this.tempEl) {
      if (this.tool === 'pen') {
        const lastPt = this.drawPts[this.drawPts.length - 1];
        if (!lastPt || Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y) >= 3) {
          this.drawPts.push({ x: pt.x, y: pt.y });
          this.tempEl.setAttribute('d', this._ptsToPath(this.drawPts));
        }
      } else if (this.tool === 'rect') {
        const o = this.shapeOrigin;
        const x = Math.min(pt.x, o.x), y = Math.min(pt.y, o.y);
        this.tempEl.setAttribute('x', x); this.tempEl.setAttribute('y', y);
        this.tempEl.setAttribute('width', Math.abs(pt.x - o.x));
        this.tempEl.setAttribute('height', Math.abs(pt.y - o.y));
      } else if (this.tool === 'circle') {
        const r = Math.hypot(pt.x - this.shapeOrigin.x, pt.y - this.shapeOrigin.y);
        this.tempEl.setAttribute('cx', this.shapeOrigin.x);
        this.tempEl.setAttribute('cy', this.shapeOrigin.y);
        this.tempEl.setAttribute('r', r);
      } else if (this.tool === 'arrow') {
        this.tempEl.setAttribute('x2', pt.x); this.tempEl.setAttribute('y2', pt.y);
      }
    }

    // Object interaction
    const s = this.selected;
    if (!s || !this.dragMode) return;

    if (this.dragMode === 'move') {
      s.x = pt.x - this.dragOff.x;
      s.y = pt.y - this.dragOff.y;
      this._render();
    } else if (this.dragMode === 'scale') {
      const dist = Math.hypot(pt.x - s.x, pt.y - s.y);
      s.scale = Math.min(15.0, Math.max(0.05, this.initScale * (dist / (this.initMouseDist || 1))));
      const scVal = Math.round(s.scale * 100);
      document.getElementById('obj-scale').value = scVal;
      const scaleNum = document.getElementById('obj-scale-num');
      if (scaleNum) scaleNum.value = scVal;
      this._render();
    } else if (this.dragMode === 'rotate') {
      const a = Math.atan2(pt.y - s.y, pt.x - s.x) * 180 / Math.PI;
      s.angle = Math.round(this.initAngle + (a - this.initMouseAngle));
      this._render();
    } else if (this.dragMode === 'pose' && this.dragJoint) {
      if (this.dragJointCenter) {
        const currentMouseAngle = Math.atan2(pt.y - this.dragJointCenter.y, pt.x - this.dragJointCenter.x) * 180 / Math.PI;
        let deltaAngle = currentMouseAngle - this.initMouseAngle;
        if (s.flipped) {
          deltaAngle = -deltaAngle;
        }
        let newAngle = Math.round(this.initJointAngle + deltaAngle);
        s.angles[this.dragAngleField] = newAngle;
        this._render();
      } else {
        let lx = pt.x, ly = pt.y;
        const ur = rotatePt(lx, ly, s.x, s.y, -s.angle);
        lx = ur.x - s.x; ly = ur.y - s.y;
        if (s.flipped) lx = -lx;
        this._solveFK(s, this.dragJoint, lx, ly);
        this._render();
      }
    } else if (this.dragMode === 'facing') {
      const center = this.dragCenter;
      const thetaRoll = this.dragThetaRoll;
      const obj = this.dragObject;
      if (center && obj) {
        // 마우스 위치를 머리 로컬 좌표로 변환
        const dx = pt.x - center.x;
        const dy = pt.y - center.y;
        const radRoll = thetaRoll * Math.PI / 180;
        // 월드 좌표 → 머리 로컬 좌표 (역회전)
        const localX =  dx * Math.cos(radRoll) + dy * Math.sin(radRoll);
        const localY = -dx * Math.sin(radRoll) + dy * Math.cos(radRoll);
        // 머리 반지름으로 정규화 (-1 ~ 1), 원 안에 클램프
        const r = 18 * obj.scale;
        const dist = Math.hypot(localX, localY);
        const clamp = dist > r ? r / dist : 1;
        obj.facingX = (localX * clamp) / r;
        obj.facingY = (localY * clamp) / r;
        this._render();
      }
    }
  }

  _onUp() {
    if (this.isDrawing && this.tempEl) {
      this.tempEl.remove();
      if (this.tool === 'pen' && this.drawPts.length > 1) {
        const xs = this.drawPts.map(p => p.x), ys = this.drawPts.map(p => p.y);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
        this.objects.push({
          id: uid(), type: 'path', x: cx, y: cy, angle: 0, scale: 1.0,
          points: this.drawPts.map(p => ({ x: p.x - cx, y: p.y - cy })),
          color: this.drawingColor, strokeWidth: this.penWidth,
          shapeStyle: this.shapeStyle,
          zIndex: this._nextZ()
        });
        this._select(this.objects[this.objects.length - 1]);
      } else if (this.tool === 'rect') {
        let w = parseFloat(this.tempEl.getAttribute('width')) || 0;
        let h = parseFloat(this.tempEl.getAttribute('height')) || 0;
        let x = parseFloat(this.tempEl.getAttribute('x')) + w / 2;
        let y = parseFloat(this.tempEl.getAttribute('y')) + h / 2;
        if (w <= 4 || h <= 4) {
          // 클릭만 했을 경우 기본 크기(100x100)로 생성
          w = 100; h = 100;
          x = this.shapeOrigin.x; y = this.shapeOrigin.y;
        }
        const newObj = {
          id: uid(), type: 'rect', x, y, angle: 0, scale: 1.0,
          width: w, height: h, color: this.drawingColor, strokeWidth: this.shapeWidth,
          shapeStyle: this.shapeStyle, zIndex: this._nextZ()
        };
        this.objects.push(newObj);
        this._setTool('select');
        this._select(newObj);
      } else if (this.tool === 'circle') {
        let r = parseFloat(this.tempEl.getAttribute('r')) || 0;
        let cx = parseFloat(this.tempEl.getAttribute('cx'));
        let cy = parseFloat(this.tempEl.getAttribute('cy'));
        if (r <= 4) {
          // 클릭만 했을 경우 기본 반지름(50)으로 생성
          r = 50;
          cx = this.shapeOrigin.x; cy = this.shapeOrigin.y;
        }
        const newObj = {
          id: uid(), type: 'circle', x: cx, y: cy, angle: 0, scale: 1.0,
          radius: r, color: this.drawingColor, strokeWidth: this.shapeWidth,
          shapeStyle: this.shapeStyle, zIndex: this._nextZ()
        };
        this.objects.push(newObj);
        this._setTool('select');
        this._select(newObj);
      } else if (this.tool === 'arrow') {
        const x1 = parseFloat(this.tempEl.getAttribute('x1'));
        const y1 = parseFloat(this.tempEl.getAttribute('y1'));
        const x2 = parseFloat(this.tempEl.getAttribute('x2'));
        const y2 = parseFloat(this.tempEl.getAttribute('y2'));
        let len = Math.hypot(x2 - x1, y2 - y1) || 0;
        let ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        let cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
        if (len <= 4) {
          // 클릭만 했을 경우 기본 길이(100)로 생성
          len = 100; ang = 0;
          cx = x1 + 50; cy = y1;
        }
        const newObj = {
          id: uid(), type: 'arrow', x: cx, y: cy,
          angle: ang, scale: 1.0, width: len, color: this.drawingColor,
          strokeWidth: this.shapeWidth, shapeStyle: this.shapeStyle, zIndex: this._nextZ()
        };
        this.objects.push(newObj);
        this._setTool('select');
        this._select(newObj);
      }
    }
    this.isDrawing = false;
    this.tempEl = null;
    this.drawPts = [];
    // 마지막으로 드래그한 관절을 activeJoint에 보존 (강조 표시 유지)
    if (this.dragJoint && this.dragJoint !== 'root') {
      this.activeJoint = this.dragJoint;
    }
    this.dragMode = null;
    this.dragJoint = null;
    DragBus.clear();
    // ← after 스냅샷: pointerdown의 before와 쌍을 이룸.
    //   변경이 없는 단순 클릭은 deduplication이 자동으로 걸러줌.
    this._pushHistory();
    this._render(); // Make sure it re-renders immediately!
  }

  _onDblClick(e) {
    const partEl = e.target.closest('[data-stickman-id]');
    if (partEl) {
      const obj = this.objects.find(o => o.id === partEl.dataset.stickmanId);
      if (obj) {
        this._select(obj);
        this.editMode = this.editMode === 'pose' ? 'transform' : 'pose';
        this._updateModeUI();
        this._renderControls();
        e.stopPropagation();
      }
    }
  }

  // ── UNDO / REDO ────────────────────────────────────────
  // ── 히스토리 래퍼 — 실제 로직은 history-manager.js (CommissionApp.HistoryManager) ──
  _snapshotState()        { /* history-manager.js로 이전 */ }
  _pushHistory()          { CommissionApp.HistoryManager.push(); }
  _undo()                 { CommissionApp.HistoryManager.undo(); }
  _redo()                 { CommissionApp.HistoryManager.redo(); }
  _restoreState(snap)     { /* history-manager.js 내부에서만 호출 */ }
  _updateUndoRedoBtns()   { /* history-manager.js 내부에서만 호출 */ }

  // ── SIDEBAR WIRES ────────────────────────────
  _initSidebarWires() {
    // Mode toggle
    document.getElementById('mode-xform').addEventListener('click', () => {
      this.editMode = 'transform'; this._updateModeUI(); this._renderControls();
    });
    document.getElementById('mode-pose').addEventListener('click', () => {
      this.editMode = 'pose'; this._updateModeUI(); this._renderControls();
    });

    // Dummy controls
    document.getElementById('dummy-flip').addEventListener('click', () => {
      if (this.selected?.type === 'stickman') {
        this._pushHistory();
        this.selected.flipped = !this.selected.flipped;
        if (typeof this.selected.facingX === 'number') {
          this.selected.facingX = -this.selected.facingX;
        }
        if (typeof this.selected.facingAngle === 'number') {
          this.selected.facingAngle = -this.selected.facingAngle;
        }
        this._render();
      }
    });
    document.getElementById('dummy-reset').addEventListener('click', () => {
      const s = this.selected;
      if (s?.type === 'stickman') {
        this._pushHistory();
        s.angles = defaultAngles();
        s.partOffsets = defaultPartOffsets();
        s.facingX = 0;
        s.facingY = 0;
        s.flipped = false;
        this._render();
      }
    });

    // 포즈 복사 / 붙여넣기
    const posePasteBtn = document.getElementById('pose-paste');
    document.getElementById('pose-copy').addEventListener('click', () => {
      const s = this.selected;
      if (s?.type !== 'stickman') return;
      // 포즈 관련 데이터만 딥카피
      this.copiedPose = {
        angles: JSON.parse(JSON.stringify(s.angles)),
        flipped: s.flipped,
        facingX: s.facingX ?? 0,
        facingY: s.facingY ?? 0
      };
      posePasteBtn.disabled = false;
      posePasteBtn.title = '복사된 포즈 붙여넣기';
      announceStatus('포즈가 복사되었습니다.');
    });
    posePasteBtn.addEventListener('click', () => {
      const s = this.selected;
      if (s?.type !== 'stickman' || !this.copiedPose) return;
      s.angles = JSON.parse(JSON.stringify(this.copiedPose.angles));
      s.flipped = this.copiedPose.flipped;
      s.facingX = this.copiedPose.facingX ?? 0;
      s.facingY = this.copiedPose.facingY ?? 0;
      this._render();
      this._pushHistory();
      announceStatus('포즈를 붙여넣기 했습니다.');
    });

    // Part selection
    document.getElementById('part-sel').addEventListener('change', e => {
      this.selectedPart = e.target.value;
      this._updateLayerLbl();
      this._syncColorToSelected();
    });

    // Font size
    document.getElementById('font-size').addEventListener('input', e => {
      const v = +e.target.value;
      document.getElementById('fs-val').textContent = v;
      if (this.selected?.type === 'text') { this.selected.fontSize = v; this._render(); }
    });

    // 텍스트 내용 실시간 편집 (textarea)
    const textContentInput = document.getElementById('text-content-input');
    if (textContentInput) {
      textContentInput.addEventListener('input', () => {
        if (this.selected?.type === 'text') {
          this.selected.text = textContentInput.value || '\u00a0'; // 빈 문자열 방지
          this._render();
          this._renderControls(); // 바운딩 박스 크기도 실시간 갱신
        }
      });
      // 엔터 단일행 승인(탭, Ctrl+Enter)으로 제한 없이 자유롭게 작성
      textContentInput.addEventListener('keydown', e => {
        e.stopPropagation(); // 제타 키에 Delete 등이 조각 단축키로 바인닩되는 것 방지
      });
    }

    // Scale
    const scaleRange = document.getElementById('obj-scale');
    const scaleNum = document.getElementById('obj-scale-num');
    const updateScale = (val) => {
      let v = parseFloat(val);
      if (isNaN(v)) return;
      v = Math.max(5, Math.min(1500, v));
      scaleRange.value = v;
      if (scaleNum) scaleNum.value = v;
      if (this.selected) {
        if (this.selected.type === 'stickman') {
          this.selected.scale = (v / 100) * 1.55;
        } else {
          this.selected.scale = v / 100;
        }
        this._render();
        this._renderControls();
      }
    };
    scaleRange.addEventListener('input', e => updateScale(e.target.value));
    if (scaleNum) {
      scaleNum.addEventListener('change', e => updateScale(e.target.value));
    }
    document.getElementById('obj-scale-reset')?.addEventListener('click', () => {
      this._pushHistory();
      const defaultSc = 100; // 항상 100%가 UI 기본
      updateScale(defaultSc);
    });

    // Layer buttons (공통 레이어 – 인물 외 오브젝트 전용)
    document.getElementById('l-front-common').addEventListener('click', () => this._shiftLayer('front'));
    document.getElementById('l-fwd-common'  ).addEventListener('click', () => this._shiftLayer('fwd'));
    document.getElementById('l-bwd-common'  ).addEventListener('click', () => this._shiftLayer('bwd'));
    document.getElementById('l-back-common' ).addEventListener('click', () => this._shiftLayer('back'));

    // Layer buttons (인물 파츠 전용 – dummy-props 내)
    document.getElementById('l-front').addEventListener('click', () => this._shiftLayer('front'));
    document.getElementById('l-fwd'  ).addEventListener('click', () => this._shiftLayer('fwd'));
    document.getElementById('l-bwd'  ).addEventListener('click', () => this._shiftLayer('bwd'));
    document.getElementById('l-back' ).addEventListener('click', () => this._shiftLayer('back'));

    // 레이어 오프셋 초기화 버튼
    document.getElementById('l-reset')?.addEventListener('click', () => this._resetLayerOffset());


    // Dup & delete
    document.getElementById('obj-dup').addEventListener('click', () => {
      if (!this.selected) return;
      const clone = JSON.parse(JSON.stringify(this.selected));
      clone.id = uid(); clone.x += 30; clone.y += 30; clone.zIndex = this._nextZ();
      this.objects.push(clone);
      this._select(clone);
      this._pushHistory();
      this._render();
    });
    document.getElementById('obj-del').addEventListener('click', () => {
      if (!this.selected) return;
      announceStatus('요소가 삭제되었습니다.');
      this.objects = this.objects.filter(o => o.id !== this.selected.id);
      this._select(null);
      this._pushHistory();
      this._render();
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', e => {
      if (document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA' || 
          document.activeElement.isContentEditable || 
          document.activeElement.closest('[contenteditable="true"]')) return;
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); this._undo(); return; }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); this._redo(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const freeId = window.CommissionApp?.FreeObjects?.getActiveId?.();
        if (freeId) {
          window.CommissionApp?.FreeObjects.deleteSelected();
          return;
        }
        if (this.selected) {
          announceStatus('요소가 삭제되었습니다.');
          this._pushHistory();
          this.objects = this.objects.filter(o => o.id !== this.selected.id);
          this._select(null); this._render();
        }
      }
      if (e.key === 'Escape') {
        if (this.editMode === 'pose') { this.editMode = 'transform'; this._updateModeUI(); this._renderControls(); }
        else this._select(null);
      }
    });

    // Undo / Redo buttons
    document.getElementById('undo-btn')?.addEventListener('click', () => this._undo());
    document.getElementById('redo-btn')?.addEventListener('click', () => this._redo());

    // Project save/load
    document.getElementById('save-btn').addEventListener('click', () => this._saveProject());
    document.getElementById('load-btn').addEventListener('click', () =>
      document.getElementById('load-file').click());
    document.getElementById('load-file').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      const fr = new FileReader();
      fr.onload = ev => { try { this._loadProject(JSON.parse(ev.target.result)); } catch { this._alert('파일을 읽을 수 없습니다.'); } };
      fr.readAsText(f); e.target.value = '';
    });
  }

  _updateModeUI() {
    document.getElementById('mode-xform').classList.toggle('is-active', this.editMode === 'transform');
    document.getElementById('mode-pose').classList.toggle('is-active', this.editMode === 'pose');
  }



  _updateLayerLbl() {
    const lbl = { all:'전체', head:'머리', neck:'목', chest:'상체', waist:'허리', pelvis:'골반',
      lUpperArm:'왼 상완', lLowerArm:'왼 하완', lHand:'왼 손',
      rUpperArm:'오른 상완', rLowerArm:'오른 하완', rHand:'오른 손',
      lThigh:'왼 허벅지', lCalf:'왼 종아리', lFoot:'왼 발',
      rThigh:'오른 허벅지', rCalf:'오른 종아리', rFoot:'오른 발' };
    const t = lbl[this.selectedPart] || this.selectedPart;
    const layerLbl = document.getElementById('layer-lbl');
    if (layerLbl) layerLbl.textContent = `레이어 (${t})`;
    const commonLbl = document.getElementById('layer-lbl-common');
    if (commonLbl) commonLbl.textContent = `레이어`;

    // 레이어 깊이 뱃지 업데이트
    this._updateLayerDepthBadge();
  }

  _updateLayerDepthBadge() {
    const badge = document.getElementById('layer-depth-badge');
    const obj = this.selected;
    if (!badge || !obj) return;

    if (obj.type === 'stickman' && this.selectedPart !== 'all') {
      // 파츠 레이어: partOffset 값 + 다른 오브젝트와의 교차 여부 표시
      const offset = (obj.partOffsets && obj.partOffsets[this.selectedPart]) || 0;
      // 이 파츠의 실효 zIndex = obj.zIndex * 100 + offset
      const effectiveZ = (obj.zIndex || 0) * 100 + offset;
      // 다른 오브젝트의 실효 zIndex (도형은 +50 오프셋 반영)
      const otherZs = this.objects
        .filter(o => o.id !== obj.id)
        .map(o => o.type === 'stickman' ? (o.zIndex || 0) * 100 : (o.zIndex || 0) * 100 + 50);
      const baseZ = (obj.zIndex || 0) * 100;

      if (offset === 0) {
        badge.textContent = '기본';
        badge.className = 'layer-depth-badge badge-default';
      } else if (offset > 0) {
        const crossed = otherZs.filter(z => z > baseZ && z <= effectiveZ).length;
        badge.textContent = crossed > 0 ? `↑ 앞 (${crossed}개 추월)` : `↑ 앞 +${offset}`;
        badge.className = 'layer-depth-badge badge-front';
      } else {
        const crossed = otherZs.filter(z => z < baseZ && z >= effectiveZ).length;
        badge.textContent = crossed > 0 ? `↓ 뒤 (${crossed}개 뒤로)` : `↓ 뒤 ${offset}`;
        badge.className = 'layer-depth-badge badge-back';
      }
    } else {
      // 전체 파츠 선택: 전체 오브젝트 중 zIndex 순위 표시
      const sorted = [...this.objects].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      const rank = sorted.findIndex(o => o.id === obj.id) + 1;
      const total = sorted.length;
      badge.textContent = `${rank} / ${total}번째`;
      badge.className = 'layer-depth-badge badge-default';
    }
  }

  _syncColorToSelected() {
    const s = this.selected;
    if (!s) return;
    let c = this.drawingColor;
    if (s.type === 'stickman') {
      const map = { lUpperArm:'lArm', lLowerArm:'lArm', lHand:'lArm',
                    rUpperArm:'rArm', rLowerArm:'rArm', rHand:'rArm',
                    lThigh:'lLeg', lCalf:'lLeg', lFoot:'lLeg',
                    rThigh:'rLeg', rCalf:'rLeg', rFoot:'rLeg' };
      const p = this.selectedPart;
      c = p === 'all' ? s.colors.head : (s.colors[map[p] || p] || s.colors.head);
    } else {
      c = s.color || s.stroke || this.drawingColor;
    }
    document.getElementById('tool-picker').value = c;
    document.getElementById('tool-hex').value = c;
  }

  // ── LAYER MANAGEMENT ─────────────────────────
  _nextZ() {
    return this.objects.length === 0 ? 1 : Math.max(...this.objects.map(o => o.zIndex || 0)) + 1;
  }

  _shiftLayer(dir) {
    const s = this.selected;
    if (!s) return;
    this._pushHistory();
    if (s.type === 'stickman' && this.selectedPart !== 'all') {
      // 파츠 레이어 이동 — 실효 zIndex 공간 기준 계산
      // 파츠: obj.zIndex * 100 + partOffset
      // 도형: obj.zIndex * 100 + 50  (도형은 +50 오프셋)
      const allEffective = this.objects.map(o =>
        o.type === 'stickman' ? (o.zIndex || 0) * 100 : (o.zIndex || 0) * 100 + 50
      );
      const globalMax = allEffective.length ? Math.max(...allEffective) : 0;
      const globalMin = allEffective.length ? Math.min(...allEffective) : 0;
      const curOffset = s.partOffsets[this.selectedPart] || 0;
      const curEffective = (s.zIndex || 0) * 100 + curOffset;

      let delta = 1;
      if (dir === 'front') {
        // 모든 오브젝트(도형 포함)의 실효 최상위보다 위로 이동
        delta = Math.max(1, globalMax - curEffective + 110);
      } else if (dir === 'back') {
        // 모든 오브젝트(도형 포함)의 실효 최하위보다 아래로 이동
        delta = Math.min(-1, globalMin - curEffective - 110);
      } else if (dir === 'fwd') {
        delta = 1;
      } else if (dir === 'bwd') {
        delta = -1;
      }
      this._shiftPartOffsets(s, this.selectedPart, delta);
    } else {
      // 오브젝트 전체 레이어 (인물 전체 or 도형 등)
      if (dir === 'front') s.zIndex = this._nextZ();
      else if (dir === 'back') s.zIndex = Math.min(...this.objects.map(o => o.zIndex || 0)) - 1;
      else if (dir === 'fwd') s.zIndex += 1;
      else if (dir === 'bwd') s.zIndex -= 1;
    }
    this._render();
    this._updateLayerLbl(); // 레이어 조작 즉시 뱃지 반영

  }

  _shiftPartOffsets(stickman, part, delta) {
    const children = {
      pelvis: ['waist', 'chest', 'neck', 'head', 'lUpperArm', 'lLowerArm', 'lHand', 'rUpperArm', 'rLowerArm', 'rHand', 'lThigh', 'lCalf', 'lFoot', 'rThigh', 'rCalf', 'rFoot'],
      waist: ['chest', 'neck', 'head', 'lUpperArm', 'lLowerArm', 'lHand', 'rUpperArm', 'rLowerArm', 'rHand'],
      chest: ['neck', 'head', 'lUpperArm', 'lLowerArm', 'lHand', 'rUpperArm', 'rLowerArm', 'rHand'],
      neck: ['head'],
      lUpperArm: ['lLowerArm', 'lHand'],
      lLowerArm: ['lHand'],
      rUpperArm: ['rLowerArm', 'rHand'],
      rLowerArm: ['rHand'],
      lThigh: ['lCalf', 'lFoot'],
      lCalf: ['lFoot'],
      rThigh: ['rCalf', 'rFoot'],
      rCalf: ['rFoot']
    };
    const newVal = (stickman.partOffsets[part] || 0) + delta;
    // 클램핑을 ±500으로 확장하여 여러 오브젝트(도형, 다른 인물)를 자유롭게 넘나들 수 있게 함
    stickman.partOffsets[part] = Math.max(-500, Math.min(500, newVal));
    (children[part] || []).forEach(ch => this._shiftPartOffsets(stickman, ch, delta));
  }

  _resetLayerOffset() {
    const s = this.selected;
    if (!s || s.type !== 'stickman') return;
    this._pushHistory();

    if (this.selectedPart === 'all') {
      // 전체 파츠 오프셋 한 번에 초기화
      s.partOffsets = {};
    } else {
      // 선택된 파츠만 0으로 초기화 (단독 적용, 연계 파츠는 제외)
      const part = this.selectedPart;
      const currentOffset = (s.partOffsets && s.partOffsets[part]) || 0;
      if (currentOffset === 0) return; // 이미 기본값이면 스킵
      // 해당 파츠와 하위 파츠들의 오프셋을 -currentOffset만큼 역보정
      this._shiftPartOffsets(s, part, -currentOffset);
    }

    this._render();
    this._updateLayerLbl(); // 뱃지 즉시 갱신
  }

  // ── SELECT ───────────────────────────────────
  _select(obj) {
    if (obj) CommissionApp.FreeObjects?.deselectAll?.();
    const isSameObj = (this.selected === obj);
    this.selected = obj;
    if (!isSameObj) {
      this.selectedPart = 'all';
      this.editMode = 'transform';
      this.activeJoint = null; // 관절 선택 강조 초기화
    }

    const panel = document.getElementById('props');
    const sDummy = document.getElementById('dummy-props');
    const sText  = document.getElementById('text-props');
    const sImage = document.getElementById('image-props');

    if (obj) {
      panel.style.display = 'block';
      sDummy.style.display = obj.type === 'stickman' ? 'block' : 'none';
      sText.style.display = obj.type === 'text' ? 'block' : 'none';
      if (sImage) sImage.style.display = obj.type === 'image' ? 'block' : 'none';

      let scVal;
      if (obj.type === 'stickman') {
        scVal = Math.round((obj.scale / 1.55) * 100);
      } else {
        scVal = Math.round(obj.scale * 100);
      }
      document.getElementById('obj-scale').value = scVal;
      const scaleNum = document.getElementById('obj-scale-num');
      if (scaleNum) scaleNum.value = scVal;
      if (!isSameObj) {
        document.getElementById('part-sel').value = 'all';
      }
      this._updateLayerLbl();
      this._updateModeUI();

      if (obj.type === 'text') {
        document.getElementById('font-size').value = obj.fontSize;
        document.getElementById('fs-val').textContent = obj.fontSize;
        // 텍스트 내용 textarea도 실시간 동기화
        const tca = document.getElementById('text-content-input');
        if (tca) tca.value = obj.text === '\u00a0' ? '' : (obj.text || '');
      }

      if (['rect','circle','arrow','path','text'].includes(obj.type)) {
        const sw = document.getElementById('shape-w');
        if (sw) {
          sw.value = obj.strokeWidth || 4;
          document.getElementById('sw-val').textContent = obj.strokeWidth || 4;
        }
        const styleSel = document.getElementById('shape-style');
        if (styleSel && obj.shapeStyle) {
          styleSel.value = obj.shapeStyle;
        }
      }
      this._syncColorToSelected();

      // 인물(stickman): 파츠 내 레이어 UI 사용 → 공통 레이어 섹션 숨기기
      // 그 외 오브젝트: 공통 레이어 섹션 표시
      const commonLayerSection = document.getElementById('common-layer-section');
      if (commonLayerSection) {
        commonLayerSection.style.display = obj.type === 'stickman' ? 'none' : 'block';
      }

      // 포즈 프리셋 섹션: 인물(stickman) 선택 시에만 표시
      const posePresetsSection = document.getElementById('pose-presets-section');
      if (posePresetsSection) {
        posePresetsSection.style.display = obj.type === 'stickman' ? 'block' : 'none';
      }
    } else {
      panel.style.display = 'none';
      document.getElementById('tool-picker').value = this.drawingColor;
      document.getElementById('tool-hex').value = this.drawingColor;
    }
    this._renderControls();
  }

  // ── RENDER PIPELINE ──────────────────────────
  _render() {
    this.gObjects.innerHTML = '';

    const items = [];

    this.objects.forEach(obj => {
      if (obj.type === 'stickman') {
        const joints = calcSkeleton(obj);
        const sc = obj.scale;

        const shrinkCapsule = (p1, p2, shrinkStart, shrinkEnd) => {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.hypot(dx, dy) || 1;
          return {
            p1: { x: p1.x + (dx / len) * shrinkStart, y: p1.y + (dy / len) * shrinkStart },
            p2: { x: p2.x - (dx / len) * shrinkEnd, y: p2.y - (dy / len) * shrinkEnd }
          };
        };

        const rThighSeg = shrinkCapsule(joints.rHip, joints.rKnee, 0, 10 * sc);
        const rCalfSeg = shrinkCapsule(joints.rKnee, joints.rAnkle, 10 * sc, 8 * sc);
        const rFootSeg = shrinkCapsule(joints.rAnkle, joints.rFoot, 8 * sc, 0);

        const lThighSeg = shrinkCapsule(joints.lHip, joints.lKnee, 0, 10 * sc);
        const lCalfSeg = shrinkCapsule(joints.lKnee, joints.lAnkle, 10 * sc, 8 * sc);
        const lFootSeg = shrinkCapsule(joints.lAnkle, joints.lFoot, 8 * sc, 0);

        const parts = [
          { name:'rFoot',     draw:(hl)=>this._capsule(rFootSeg.p1, rFootSeg.p2, obj.colors.rLeg, 12*sc, hl) },
          { name:'rCalf',     draw:(hl)=>this._capsule(rCalfSeg.p1, rCalfSeg.p2, obj.colors.rLeg, 16*sc, hl) },
          { name:'rThigh',    draw:(hl)=>this._capsule(rThighSeg.p1, rThighSeg.p2, obj.colors.rLeg, 20*sc, hl) },
          { name:'lFoot',     draw:(hl)=>this._capsule(lFootSeg.p1, lFootSeg.p2, obj.colors.lLeg, 12*sc, hl) },
          { name:'lCalf',     draw:(hl)=>this._capsule(lCalfSeg.p1, lCalfSeg.p2, obj.colors.lLeg, 16*sc, hl) },
          { name:'lThigh',    draw:(hl)=>this._capsule(lThighSeg.p1, lThighSeg.p2, obj.colors.lLeg, 20*sc, hl) },
          { name:'pelvis',    draw:(hl)=>this._capsule(joints.lHip,   joints.rHip,  obj.colors.pelvis, 24*sc, hl) },
          { name:'waist',     draw:(hl)=>this._circle({ x:(joints.pelvis.x+joints.waist.x)/2, y:(joints.pelvis.y+joints.waist.y)/2 }, 10*sc, obj.colors.waist, hl) },
          { name:'chest',     draw:(hl)=>this._drawChest(joints.waist,  joints.neckBase, 54*sc, 44*sc, obj.colors.chest, hl) },
          { name:'neck',      draw:(hl)=>this._capsule(joints.neckBase, joints.headBase, obj.colors.neck || obj.colors.chest, 14*sc, hl) },
          { name:'rUpperArm', draw:(hl)=>this._capsule(joints.rShoulder, joints.rElbow, obj.colors.rArm, 16*sc, hl) },
          { name:'rLowerArm', draw:(hl)=>this._capsule(joints.rElbow, joints.rWrist,   obj.colors.rArm, 14*sc, hl) },
          { name:'rHand',     draw:(hl)=>this._circle(joints.rHand, 8*sc, obj.colors.rArm, hl) },
          { name:'lUpperArm', draw:(hl)=>this._capsule(joints.lShoulder, joints.lElbow, obj.colors.lArm, 16*sc, hl) },
          { name:'lLowerArm', draw:(hl)=>this._capsule(joints.lElbow, joints.lWrist,   obj.colors.lArm, 14*sc, hl) },
          { name:'lHand',     draw:(hl)=>this._circle(joints.lHand, 8*sc, obj.colors.lArm, hl) },
          { name:'head',      draw:(hl)=>this._drawHeadWithFacing(obj, joints.headCenter, 18*sc, obj.colors.head, hl) },
        ];
        parts.forEach(p => {
          const hl = (obj === this.selected && this.selectedPart === p.name);
          items.push({
            // zIndex 단위: obj.zIndex * 100 으로 도형과 동일한 공간 공유
            // partOffset 은 파츠 간 내부 순서 및 도형과의 교차를 동시에 담당
            zIndex: (obj.zIndex * 100) + (obj.partOffsets[p.name] || 0),
            order: items.length, // 안정 정렬 보조 키
            drawFn: () => p.draw(hl),
            stickmanId: obj.id,
            partName: p.name,
            objRef: obj
          });
        });
      } else {
        items.push({
          // 도형은 +50 오프셋: 인물 파츠 기본 범위(-12~+9)와 겹치지 않도록
          // 파츠가 의도적으로 도형을 넘어서려면 offset >= 51 or <= -51 필요
          zIndex: obj.zIndex * 100 + 50,
          order: items.length, // 안정 정렬 보조 키
          drawFn: () => this._drawStdObj(obj),
          objRef: obj
        });
      }
    });

    // 안정 정렬: zIndex가 같으면 삽입 순서(order) 기준 유지 → 렌더마다 순서 변동 방지
    items.sort((a, b) => {
      const dz = a.zIndex - b.zIndex;
      return dz !== 0 ? dz : a.order - b.order;
    });
    items.forEach(item => {
      const el = item.drawFn();
      if (el && item.stickmanId) {
        el.dataset.stickmanId = item.stickmanId;
        el.dataset.partName = item.partName;
        const obj = item.objRef;

        el.addEventListener('pointerdown', e => {
          if (this.tool !== 'select') return;
          e.stopPropagation();
          this._select(obj);

          // 파츠 클릭 시 자동 선택 (레이어 순서 조정용) 복구
          this.selectedPart = item.partName;
          const partSel = document.getElementById('part-sel');
          if (partSel) partSel.value = item.partName;
          this._updateLayerLbl();
          this._syncColorToSelected();

          // 더블클릭(더블탭) 자체 구현 (DBLCLICK_MS 이내 동일 객체 클릭 시 토글)
          const now = Date.now();
          if (now - (this.lastClickTime || 0) < DBLCLICK_MS && this.lastClickObj === obj) {
            this.editMode = this.editMode === 'pose' ? 'transform' : 'pose';
            this._updateModeUI();
            this._renderControls();
            this.lastClickTime = 0;
            this.lastClickObj = null;
            this.dragMode = null;
            this.dragJoint = null;
            return;
          }
          this.lastClickTime = now;
          this.lastClickObj = obj;

          if (this.editMode === 'transform') {
            this._pushHistory(); // ← before 스냅샷: 이동 시작 직전
            this.dragMode = 'move';
            const pt = svgPt(this.svg, e);
            this.dragOff = { x: pt.x - obj.x, y: pt.y - obj.y };
            DragBus.start(ev => this._onMove(ev), ev => this._onUp(ev));
          } else if (this.editMode === 'pose') {
            // 파츠 클릭 시 해당 파츠의 끝 관절을 dragJoint로 설정
            const partToJoint = {
              rThigh: 'rKnee',   rCalf: 'rAnkle',  rFoot: 'rFoot',
              lThigh: 'lKnee',   lCalf: 'lAnkle',   lFoot: 'lFoot',
              rUpperArm: 'rElbow', rLowerArm: 'rWrist', rHand: 'rHand',
              lUpperArm: 'lElbow', lLowerArm: 'lWrist', lHand: 'lHand',
              head: 'headCenter', neck: 'neckBase',
              chest: 'chest',     waist: 'waist',   pelvis: 'pelvis',
            };
            const jointKey = partToJoint[item.partName];
            if (jointKey) {
              this._pushHistory(); // ← before 스냅샷: 파츠 포즈 드래그 시작 직전
              this.dragMode = 'pose';
              this.dragJoint = jointKey;
              this.activeJoint = jointKey; // 노란 강조 표시 활성화
              this._renderControls();

              // 드래그 시작 시점의 회전 기준 스냅샷 저장 (Delta 계산용)
              const pt = svgPt(this.svg, e);
              const info = this._getPoseDragInfo(obj, jointKey, pt);
              if (info) {
                this.dragJointCenter = info.center;
                this.initJointAngle = info.initAngle;
                this.initMouseAngle = info.mouseAngle;
                this.dragAngleField = info.angleField;
              } else {
                this.dragJointCenter = null;
              }
              DragBus.start(ev => this._onMove(ev), ev => this._onUp(ev));
            }
          }

          // 드래그 유실을 방지하기 위해 SVG에 포인터 캡처 지정
          try {
            this.svg.setPointerCapture(e.pointerId);
          } catch (err) {}
        });
      }
    });

    this._renderControls();
  }

  // ── DRAW PRIMITIVES ──────────────────────────
  _capsule(p1, p2, color, w, isHighlighted = false) {
    const g = svgEl('g');
    if (isHighlighted) {
      const hl = svgEl('line', { x1:p1.x, y1:p1.y, x2:p2.x, y2:p2.y,
                                 stroke:'#ffeb3b', 'stroke-width': w+12, 'stroke-linecap':'round', opacity:0.8 });
      g.appendChild(hl);
    }
    const out = svgEl('line', { x1:p1.x, y1:p1.y, x2:p2.x, y2:p2.y,
                                 stroke:'#000', 'stroke-width': w+4, 'stroke-linecap':'round' });
    const inn = svgEl('line', { x1:p1.x, y1:p1.y, x2:p2.x, y2:p2.y,
                                 stroke:color, 'stroke-width': w, 'stroke-linecap':'round' });
    g.appendChild(out); g.appendChild(inn);
    this.gObjects.appendChild(g);
    return g;
  }

  _circle(center, r, color, isHighlighted = false) {
    const g = svgEl('g');
    if (isHighlighted) {
      const hl = svgEl('circle', { cx:center.x, cy:center.y, r:r+6, fill:'#ffeb3b', opacity:0.8 });
      g.appendChild(hl);
    }
    const out = svgEl('circle', { cx:center.x, cy:center.y, r:r+2, fill:'#000' });
    const inn = svgEl('circle', { cx:center.x, cy:center.y, r, fill:color });
    g.appendChild(out); g.appendChild(inn);
    this.gObjects.appendChild(g);
    return g;
  }

  _drawHeadWithFacing(obj, center, r, color, isHighlighted = false) {
    const g = svgEl('g');
    if (isHighlighted) {
      const hl = svgEl('circle', { cx:center.x, cy:center.y, r:r+6, fill:'#ffeb3b', opacity:0.8 });
      g.appendChild(hl);
    }
    const out = svgEl('circle', { cx:center.x, cy:center.y, r:r+2, fill:'#000' });
    const inn = svgEl('circle', { cx:center.x, cy:center.y, r, fill:color });
    g.appendChild(out); g.appendChild(inn);

    const joints = calcSkeleton(obj);
    const headCenter = joints.headCenter;
    const headBase = joints.headBase || joints.neckBase;
    
    // Z축 롤 각도 계산 (머리의 전체 기울기 각도)
    const thetaRoll = Math.atan2(headCenter.y - headBase.y, headCenter.x - headBase.x) * 180 / Math.PI + 90;
    const radRoll = thetaRoll * Math.PI / 180;
    // 2D facing 오프셋 (facingX/Y: -1~1, 없으면 0)
    // 하위 호환: 구 버전 facingAngle이 있으면 변환
    let fx = obj.facingX ?? 0;
    let fy = obj.facingY ?? 0;
    if (fx === 0 && fy === 0 && obj.facingAngle) {
      fx = Math.sin(obj.facingAngle * Math.PI / 180) * 0.9;
      fy = 0;
    }
    const maxOffset = r * 0.9; // 원 가장자리까지 이동 가능
    // 로컬 오프셋을 머리 롤 각도로 월드 좌표 변환
    const localX = fx * maxOffset;
    const localY = fy * maxOffset;
    const cx = headCenter.x + localX * Math.cos(radRoll) - localY * Math.sin(radRoll);
    const cy = headCenter.y + localX * Math.sin(radRoll) + localY * Math.cos(radRoll);
    // 후면 여부: 왼쪽-오른쪽 축 기준 fx가 거의 없고 fy가 크면 (위/아래) 또는 facingAngle 기반
    const isBack = Math.abs(fx) < 0.3 && Math.abs(fy) < 0.3 && (obj.facingAngle > 90 && obj.facingAngle < 270);
    
    // 동적 clipPath 생성 및 갱신 (머리 원 안에만 십자선 표시)
    let defs = this.svg.querySelector('defs');
    if (!defs) {
      defs = svgEl('defs');
      this.svg.insertBefore(defs, this.svg.firstChild);
    }
    const clipId = 'clip-head-' + obj.id;
    let clip = defs.querySelector('#' + clipId);
    if (!clip) {
      clip = svgEl('clipPath', { id: clipId });
      clip.appendChild(svgEl('circle', { cx: headCenter.x, cy: headCenter.y, r: r }));
      defs.appendChild(clip);
    } else {
      const clipCircle = clip.firstChild;
      clipCircle.setAttribute('cx', headCenter.x);
      clipCircle.setAttribute('cy', headCenter.y);
      clipCircle.setAttribute('r', r);
    }
    
    // 클리핑이 적용될 그룹
    const clipG = svgEl('g', { 'clip-path': `url(#${clipId})` });
    
    // 십자선 그룹 – 머리의 기울기(thetaRoll)에 맞춰 함께 회전 (머리에 프린팅된 것처럼)
    const linesG = svgEl('g', { transform: `rotate(${thetaRoll} ${cx} ${cy})` });
    
    const crossLen = r * 2.5; // 클리핑 후 원을 가득 채우는 넉넉한 길이
    const strokeStyle = {
      stroke: '#000000',
      'stroke-width': 1.5,
      'stroke-linecap': 'round',
      opacity: isBack ? 0.35 : 0.8
    };
    if (isBack) {
      strokeStyle['stroke-dasharray'] = '3,3';
    }
    
    // 수평선 (cx, cy 중심, 항상 수평)
    linesG.appendChild(svgEl('line', {
      x1: cx - crossLen / 2, y1: cy,
      x2: cx + crossLen / 2, y2: cy,
      ...strokeStyle
    }));
    // 수직선 (cx, cy 중심, 항상 수직)
    linesG.appendChild(svgEl('line', {
      x1: cx, y1: cy - crossLen / 2,
      x2: cx, y2: cy + crossLen / 2,
      ...strokeStyle
    }));
    
    clipG.appendChild(linesG);
    g.appendChild(clipG);
    
    this.gObjects.appendChild(g);
    return g;
  }

  _drawChest(waist, neckBase, shoulderSpan, chestH, color, isHighlighted = false) {
    const dx = neckBase.x - waist.x;
    const dy = neckBase.y - waist.y;
    const len = Math.hypot(dx, dy) || 1;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    
    const w = shoulderSpan;
    const h = len;
    
    const d = `M ${-w/2} 0 L ${-w/2} ${-h*0.3} C ${-w/2} ${-h} ${-w/4} ${-h} 0 ${-h} C ${w/4} ${-h} ${w/2} ${-h} ${w/2} ${-h*0.3} L ${w/2} 0 Z`;
    
    const g = svgEl('g', { transform: `translate(${waist.x}, ${waist.y}) rotate(${angle})` });
    
    if (isHighlighted) {
      const hl = svgEl('path', { d, fill:'none', stroke:'#ffeb3b', 'stroke-width': 12, 'stroke-linejoin':'round', opacity:0.8 });
      g.appendChild(hl);
    }
    const out = svgEl('path', { d, fill:'#000', stroke:'#000', 'stroke-width': 4, 'stroke-linejoin':'round' });
    const inn = svgEl('path', { d, fill:color, stroke:'none' });
    g.appendChild(out); g.appendChild(inn);
    this.gObjects.appendChild(g);
    return g;
  }

  _drawStdObj(obj) {
    let el;
    if (obj.type === 'path') {
      const g = svgEl('g', { transform: `translate(${obj.x},${obj.y}) rotate(${obj.angle}) scale(${obj.scale})` });
      // 펜 선 투명 히트박스: 얇은 펜 선도 주변 24px 영역 어디를 눌러도 쉽게 선택 가능
      const hitPath = svgEl('path', {
        d: this._ptsToPath(obj.points, 0, 0),
        stroke: 'transparent',
        'stroke-width': Math.max(24, (obj.strokeWidth || 4) + 18),
        fill: 'none',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        style: 'cursor:move; pointer-events:all;'
      });
      g.appendChild(hitPath);

      if (obj.shapeStyle === 'outline-white' || obj.shapeStyle === 'both') {
        const strokeColor = obj.shapeStyle === 'outline-white' ? '#ffffff' : '#000000';
        const outlineEl = svgEl('path', {
          d: this._ptsToPath(obj.points, 0, 0),
          stroke: strokeColor,
          'stroke-width': (obj.strokeWidth || 4) + 4,
          fill: 'none',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          style: 'pointer-events:none;'
        });
        g.appendChild(outlineEl);
      }

      el = svgEl('path', {
        d: this._ptsToPath(obj.points, 0, 0),
        stroke: obj.color, 'stroke-width': obj.strokeWidth,
        fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        style: 'pointer-events:none;'
      });
      g.appendChild(el);
      this._attachObjEvents(g, obj);
      this.gObjects.appendChild(g);
      return g;
    } else if (obj.type === 'image') {
      const g = svgEl('g', { transform: `translate(${obj.x},${obj.y}) rotate(${obj.angle}) scale(${obj.scale})` });
      if (!obj.crop) {
        obj.crop = { x: 0, y: 0, w: obj.w, h: obj.h };
      }
      const cw = obj.crop.w;
      const ch = obj.crop.h;
      const innerSvg = svgEl('svg', {
        x: -cw / 2,
        y: -ch / 2,
        width: cw,
        height: ch,
        viewBox: `${obj.crop.x} ${obj.crop.y} ${cw} ${ch}`
      });
      el = svgEl('image', { href: obj.src, x: 0, y: 0, width: obj.w, height: obj.h });
      innerSvg.appendChild(el);
      g.appendChild(innerSvg);
      this._attachObjEvents(g, obj);
      this.gObjects.appendChild(g);
      return g;
    } else if (obj.type === 'text') {
      const g = svgEl('g', { transform: `translate(${obj.x},${obj.y}) rotate(${obj.angle}) scale(${obj.scale})` });
      g.setAttribute('data-obj-id', obj.id);
      // 텍스트 투명 히트박스 (클릭 영역 확장)
      const approxW = Math.max(60, (obj.text ? obj.text.length : 4) * (obj.fontSize || 24) * 0.7 + 40);
      const approxH = Math.max(30, (obj.fontSize || 24) * 1.4 + 20);
      const hitRect = svgEl('rect', {
        x: -approxW / 2, y: -approxH / 2, width: approxW, height: approxH,
        fill: 'transparent', stroke: 'none', style: 'cursor:move; pointer-events:all;'
      });
      g.appendChild(hitRect);

      const textAttrs = {
        x: 0, y: 0, fill: obj.color, 'font-size': obj.fontSize,
        'font-family': 'var(--font, "Paperlogy", sans-serif)', 'font-weight': '500',
        'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'svg-text',
        style: `pointer-events:none; opacity: ${obj._isEditing ? '0' : '1'}; display: ${obj._isEditing ? 'none' : ''};`
      };
      if (obj.shapeStyle === 'outline-white' || obj.shapeStyle === 'both') {
        textAttrs.stroke = obj.shapeStyle === 'outline-white' ? '#ffffff' : '#000000';
        textAttrs['stroke-width'] = Math.max(1, (obj.strokeWidth || 4) * 0.4);
        textAttrs['paint-order'] = 'stroke fill';
        textAttrs['stroke-linejoin'] = 'round';
      }
      el = svgEl('text', textAttrs);
      const lines = (obj.text || '').split('\n');
      lines.forEach((line, i) => {
        const tspan = svgEl('tspan', {
          x: 0,
          dy: i === 0 ? `-${(lines.length - 1) * 0.6}em` : '1.2em'
        });
        tspan.textContent = line || ' ';
        el.appendChild(tspan);
      });
      g.appendChild(el);
      g.addEventListener('dblclick', e => { e.stopPropagation(); this._editText(obj, g); });
      this._attachObjEvents(g, obj);
      this.gObjects.appendChild(g);
      return g;
    } else if (obj.type === 'rect') {
      const g = svgEl('g', { transform: `translate(${obj.x},${obj.y}) rotate(${obj.angle}) scale(${obj.scale})` });
      // 사각형 투명 히트박스: 선만 있는 사각형도 내부 빈 공간 어디를 눌러도 선택 가능
      const hit = svgEl('rect', {
        x: -obj.width/2 - 6, y: -obj.height/2 - 6,
        width: obj.width + 12, height: obj.height + 12,
        fill: 'transparent', stroke: 'transparent', 'stroke-width': 12,
        style: 'cursor:move; pointer-events:all;'
      });
      g.appendChild(hit);

      el = svgEl('rect', { x:-obj.width/2, y:-obj.height/2, width:obj.width, height:obj.height, rx:3, style: 'pointer-events:none;' });
      this._styleShapeEl(el, 'rect', obj.color, obj.shapeStyle, obj.strokeWidth);
      g.appendChild(el);
      this._attachObjEvents(g, obj);
      this.gObjects.appendChild(g);
      return g;
    } else if (obj.type === 'circle') {
      const g = svgEl('g', { transform: `translate(${obj.x},${obj.y}) rotate(${obj.angle}) scale(${obj.scale})` });
      // 원 투명 히트박스: 선만 있는 원도 내부 빈 공간 어디를 눌러도 선택 가능
      const hit = svgEl('circle', {
        cx: 0, cy: 0, r: obj.radius + 6,
        fill: 'transparent', stroke: 'transparent', 'stroke-width': 12,
        style: 'cursor:move; pointer-events:all;'
      });
      g.appendChild(hit);

      el = svgEl('circle', { cx:0, cy:0, r:obj.radius, style: 'pointer-events:none;' });
      this._styleShapeEl(el, 'circle', obj.color, obj.shapeStyle, obj.strokeWidth);
      g.appendChild(el);
      this._attachObjEvents(g, obj);
      this.gObjects.appendChild(g);
      return g;
    } else if (obj.type === 'arrow') {
      const g = svgEl('g', { transform: `translate(${obj.x},${obj.y}) rotate(${obj.angle}) scale(${obj.scale})` });
      // 화살표 투명 히트박스: 얇은 선 대신 20px 두께의 투명 선으로 클릭 감지
      const hit = svgEl('line', {
        x1: -obj.width/2, y1: 0, x2: obj.width/2, y2: 0,
        stroke: 'transparent', 'stroke-width': 20, 'stroke-linecap': 'round',
        style: 'cursor:move; pointer-events:all;'
      });
      g.appendChild(hit);

      el = svgEl('line', { x1:-obj.width/2, y1:0, x2:obj.width/2, y2:0,
                            stroke:obj.color, 'stroke-width':obj.strokeWidth,
                            'stroke-linecap':'round', 'marker-end':'url(#arrow-head)',
                            style: 'pointer-events:none;' });
      g.appendChild(el);
      this._attachObjEvents(g, obj);
      this.gObjects.appendChild(g);
      return g;
    }
    return el;
  }

  _styleShapeEl(el, type, color, style, sw) {
    const hasStroke = style === 'stroke' || style === 'both' || style === 'outline-white';
    const hasFill   = style === 'fill'   || style === 'both' || style === 'outline-white';
    el.setAttribute('fill', hasFill ? color : 'none');
    if (hasStroke) {
      const strokeColor = style === 'outline-white' ? '#ffffff' : (style === 'both' ? '#000000' : color);
      el.setAttribute('stroke', strokeColor);
      el.setAttribute('stroke-width', sw || 4);
      el.setAttribute('stroke-linejoin', 'round');
    } else {
      el.setAttribute('stroke', 'none');
    }
  }

  _attachObjEvents(el, obj) {
    el.addEventListener('pointerdown', e => {
      if (this.tool === 'eraser') {
        e.stopPropagation();
        this.objects = this.objects.filter(o => o.id !== obj.id);
        if (this.selected?.id === obj.id) this._select(null);
        this._pushHistory();
        this._render(); return;
      }
      if (this.tool !== 'select') return;
      e.stopPropagation();

      // 텍스트 더블클릭 타이머 감지 (DOM 리렌더링 영향 없이 100% 즉시 작동)
      if (obj.type === 'text') {
        const now = Date.now();
        if (this._lastTextClickId === obj.id && (now - (this._lastTextClickTime || 0) < DBLCLICK_MS)) {
          this._lastTextClickTime = 0;
          this.dragMode = null;
          this._editText(obj);
          return;
        }
        this._lastTextClickTime = now;
        this._lastTextClickId = obj.id;
      }

      this._select(obj);
      this._pushHistory(); // ← before 스냅샷: 일반 오브젝트 이동 시작 직전
      this.dragMode = 'move';
      const pt = svgPt(this.svg, e);
      this.dragOff = { x: pt.x - obj.x, y: pt.y - obj.y };
      DragBus.start(ev => this._onMove(ev), ev => this._onUp(ev));
    });
  }

  _ptsToPath(pts, ox = 0, oy = 0) {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x + ox} ${pts[0].y + oy} Z`;
    
    let path = `M ${pts[0].x + ox} ${pts[0].y + oy}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      path += ` Q ${p1.x + ox} ${p1.y + oy}, ${midX + ox} ${midY + oy}`;
    }
    const last = pts[pts.length - 1];
    path += ` L ${last.x + ox} ${last.y + oy}`;
    return path;
  }

  _getStickmanUnscaledBBox(obj) {
    // x:0, y:0, scale:1, angle:0 상태에서 로컬 관절 좌표 범위를 계산
    const joints = calcSkeleton({ ...obj, x: 0, y: 0, scale: 1, angle: 0, flipped: false });
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const k in joints) {
      const p = joints[k];
      if (p && typeof p.x === 'number' && typeof p.y === 'number') {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
    }

    // 관절 범위에 적절한 패딩(약 20px) 추가
    const pad = 20;
    minX -= pad; maxX += pad;
    minY -= (pad + 10); maxY += pad; // 머리 위 여유

    const w = Math.max(50, maxX - minX);
    const h = Math.max(50, maxY - minY);
    const offsetX = (minX + maxX) / 2;
    const offsetY = (minY + maxY) / 2;

    return { w, h, offsetX, offsetY };
  }

  // ── CONTROLS (Selection Handles) ─────────────
  _renderControls() {
    if (!this.gCtrl) this.gCtrl = document.getElementById('g-ctrl');
    if (!this.gCtrl) return;
    this.gCtrl.innerHTML = '';
    const obj = this.selected;
    if (!obj) return;

    if (obj.type === 'stickman') {
      if (this.editMode === 'pose') {
        this._renderJointHandles(obj);
      } else {
        const bb = this._getStickmanUnscaledBBox(obj);
        this._renderBBox(obj, bb.w, bb.h, bb.offsetX, bb.offsetY);
      }
    } else if (obj.type === 'path' && Array.isArray(obj.points) && obj.points.length > 0) {
      // 펜 선(path): points 배열로부터 정밀한 로컬 BBox 및 중심 오프셋 계산
      const xs = obj.points.map(p => p.x);
      const ys = obj.points.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const pad = (obj.strokeWidth || 4) + 8;
      const w = Math.max(20, (maxX - minX) + pad * 2);
      const h = Math.max(20, (maxY - minY) + pad * 2);
      const offsetX = (minX + maxX) / 2;
      const offsetY = (minY + maxY) / 2;
      this._renderBBox(obj, w, h, offsetX, offsetY);
    } else if (obj.type === 'text') {
      const approxW = Math.max(60, (obj.text ? obj.text.length : 4) * (obj.fontSize || 24) * 0.7 + 40);
      const approxH = Math.max(30, (obj.fontSize || 24) * 1.4 + 20);
      this._renderBBox(obj, approxW, approxH, 0, 0);
    } else {
      let w = 0, h = 0;
      if (obj.type === 'image') {
        w = obj.crop ? obj.crop.w : obj.w;
        h = obj.crop ? obj.crop.h : obj.h;
      }
      else if (obj.type === 'rect') { w = obj.width; h = obj.height; }
      else if (obj.type === 'circle') { w = obj.radius * 2; h = obj.radius * 2; }
      else if (obj.type === 'arrow') { w = obj.width + 10; h = Math.max(24, (obj.strokeWidth || 4) * 3); }
      this._renderBBox(obj, w, h);
    }
  }

  _renderBBox(obj, w, h, offsetX = 0, offsetY = 0) {
    const sc = obj.scale;
    const g = svgEl('g', { transform: `translate(${obj.x},${obj.y}) rotate(${obj.angle})` });

    const cx = offsetX * sc;
    const cy = offsetY * sc;
    const hw = (w * sc) / 2, hh = (h * sc) / 2;

    let boxX = cx - hw, boxY = cy - hh, boxW = w * sc, boxH = h * sc;
    const box = svgEl('rect', { x: boxX, y: boxY, width: boxW, height: boxH, class: 'sel-box' });
    if (obj.type === 'text') {
      box.addEventListener('pointerdown', e => {
        const now = Date.now();
        if (this._lastTextClickId === obj.id && (now - (this._lastTextClickTime || 0) < DBLCLICK_MS)) {
          e.stopPropagation();
          this._lastTextClickTime = 0;
          this.dragMode = null;
          if (!obj._isEditing) this._editText(obj);
          return;
        }
        this._lastTextClickTime = now;
        this._lastTextClickId = obj.id;
      });
    }
    g.appendChild(box);

    // Rotation stem & handle (상단 중앙)
    const stem = svgEl('line', { x1: cx, y1: cy - hh, x2: cx, y2: cy - hh - 20, stroke: 'var(--c-accent)', 'stroke-width': 1.5 });
    g.appendChild(stem);

    const rotHandle = svgEl('circle', { cx: cx, cy: cy - hh - 20, r: 5, class: 'ctrl-dot rotate' });
    rotHandle.addEventListener('pointerdown', e => {
      e.stopPropagation();
      this._pushHistory(); // ← before 스냅샷: 회전 시작 직전
      const pt = svgPt(this.svg, e);
      this.dragMode = 'rotate';
      this.initAngle = obj.angle;
      this.initMouseAngle = Math.atan2(pt.y - obj.y, pt.x - obj.x) * 180 / Math.PI;
      DragBus.start(ev => this._onMove(ev), ev => this._onUp(ev));
      try { this.svg.setPointerCapture(e.pointerId); } catch (err) {}
    });
    g.appendChild(rotHandle);

    // Corner scale handles (모서리 4개)
    [[cx - hw, cy - hh], [cx + hw, cy - hh], [cx + hw, cy + hh], [cx - hw, cy + hh]].forEach(([hx, hy], idx) => {
      const hnd = svgEl('circle', { cx: hx, cy: hy, r: 5, class: 'ctrl-dot' });
      hnd.style.cursor = (idx % 2 === 0) ? 'nwse-resize' : 'nesw-resize';
      hnd.addEventListener('pointerdown', e => {
        e.stopPropagation();
        this._pushHistory(); // ← before 스냅샷: 스케일 조정 시작 직전
        const pt = svgPt(this.svg, e);
        this.dragMode = 'scale';
        this.initScale = obj.scale;
        this.initMouseDist = Math.hypot(pt.x - obj.x, pt.y - obj.y);
        DragBus.start(ev => this._onMove(ev), ev => this._onUp(ev));
        try { this.svg.setPointerCapture(e.pointerId); } catch (err) {}
      });
      g.appendChild(hnd);
    });

    this.gCtrl.appendChild(g);
  }

  _renderJointHandles(obj) {
    const joints = calcSkeleton(obj);
    const controlJoints = [
      { k:'headCenter', lbl:'머리' },
      { k:'neckBase',   lbl:'목' },
      { k:'waist',      lbl:'허리' },
      { k:'pelvis',     lbl:'골반' },
      { k:'lElbow',     lbl:'왼 팔꿈치' },
      { k:'lWrist',     lbl:'왼 손목' },
      { k:'lHand',      lbl:'왼 손' },
      { k:'rElbow',     lbl:'오른 팔꿈치' },
      { k:'rWrist',     lbl:'오른 손목' },
      { k:'rHand',      lbl:'오른 손' },
      { k:'lKnee',      lbl:'왼 무릎' },
      { k:'lAnkle',     lbl:'왼 발목' },
      { k:'lFoot',      lbl:'왼 발' },
      { k:'rKnee',      lbl:'오른 무릎' },
      { k:'rAnkle',     lbl:'오른 발목' },
      { k:'rFoot',      lbl:'오른 발' },
    ];

    // Pelvis root handle (move handle)
    const rootG = svgEl('g');
    if (this.dragJoint === 'root') {
      rootG.appendChild(svgEl('circle', { cx:obj.x, cy:obj.y, r:15, fill:'none',
        stroke:'#facc15', 'stroke-width':2.5, opacity:0.9 }));
    }
    rootG.appendChild(svgEl('circle', { cx:obj.x, cy:obj.y, r:8, class:'joint-dot root' }));
    const rootHit = svgEl('circle', { cx:obj.x, cy:obj.y, r:20, fill:'transparent', style:'cursor:grab' });
    rootG.appendChild(rootHit);
    const startRootDrag = e => {
      e.stopPropagation();
      this._pushHistory(); // ← before 스냅샷: 인물 이동 시작 직전
      this.dragMode = 'move';
      this.dragJoint = 'root';
      this.activeJoint = null;
      this.selectedPart = 'pelvis';
      const partSel = document.getElementById('part-sel');
      if (partSel) partSel.value = 'pelvis';
      this._updateLayerLbl();
      const pt = svgPt(this.svg, e);
      this.dragOff = { x: pt.x - obj.x, y: pt.y - obj.y };
      this._renderControls();
      DragBus.start(ev => this._onMove(ev), ev => this._onUp(ev));
      try { this.svg.setPointerCapture(e.pointerId); } catch (err) {}
    };
    rootHit.addEventListener('pointerdown', startRootDrag);
    this.gCtrl.appendChild(rootG);

    controlJoints.forEach(({ k, lbl }) => {
      const j = joints[k];
      if (!j) return;
      const isActive = this.dragJoint === k || this.activeJoint === k;
      const g = svgEl('g');
      if (isActive) {
        g.appendChild(svgEl('circle', { cx:j.x, cy:j.y, r:15, fill:'none',
          stroke:'#facc15', 'stroke-width':2.5, opacity:0.9 }));
      }
      const vis = svgEl('circle', { cx:j.x, cy:j.y, r:6, class:'joint-dot' });
      vis.setAttribute('title', lbl);
      const hit = svgEl('circle', { cx:j.x, cy:j.y, r:20, fill:'transparent', style:'cursor:grab' });
      g.appendChild(vis);
      g.appendChild(hit);
      const startDrag = e => {
        e.stopPropagation();
        this._pushHistory(); // ← before 스냅샷: 관절 포즈 드래그 시작 직전
        this.dragMode = 'pose';
        this.dragJoint = k;
        this.activeJoint = k;
        
        const jointToPart = {
          headCenter: 'head', neckBase: 'neck', waist: 'waist', pelvis: 'pelvis',
          lElbow: 'lUpperArm', lWrist: 'lLowerArm', lHand: 'lHand',
          rElbow: 'rUpperArm', rWrist: 'rLowerArm', rHand: 'rHand',
          lKnee: 'lThigh', lAnkle: 'lCalf', lFoot: 'lFoot',
          rKnee: 'rThigh', rAnkle: 'rCalf', rFoot: 'rFoot'
        };
        const mappedPart = jointToPart[k];
        if (mappedPart) {
          this.selectedPart = mappedPart;
          const partSel = document.getElementById('part-sel');
          if (partSel) partSel.value = mappedPart;
          this._updateLayerLbl();
        }
        
        this._renderControls();
        try { this.svg.setPointerCapture(e.pointerId); } catch (err) {}

        const pt = svgPt(this.svg, e);
        const info = this._getPoseDragInfo(obj, k, pt);
        if (info) {
          this.dragJointCenter = info.center;
          this.initJointAngle = info.initAngle;
          this.initMouseAngle = info.mouseAngle;
          this.dragAngleField = info.angleField;
        } else {
          this.dragJointCenter = null;
        }
        DragBus.start(ev => this._onMove(ev), ev => this._onUp(ev));
      };
      hit.addEventListener('pointerdown', startDrag);
      vis.addEventListener('pointerdown', startDrag);
      this.gCtrl.appendChild(g);
    });

    // ── 얼굴 방향 조작 노브 (Facing Knob) ─────────────────
    const headCenter = joints.headCenter;
    const headBase = joints.headBase || joints.neckBase;
    if (headCenter && headBase) {
      const sc = obj.scale;
      const r = 18 * sc;
      const thetaRoll = Math.atan2(headCenter.y - headBase.y, headCenter.x - headBase.x) * 180 / Math.PI + 90;
      const radRoll = thetaRoll * Math.PI / 180;
      let fx = obj.facingX ?? 0;
      let fy = obj.facingY ?? 0;
      if (fx === 0 && fy === 0 && obj.facingAngle) {
        fx = Math.sin(obj.facingAngle * Math.PI / 180) * 0.9;
      }
      const maxOff = r * 0.9;
      const lx = fx * maxOff;
      const ly = fy * maxOff;
      const kx = headCenter.x + lx * Math.cos(radRoll) - ly * Math.sin(radRoll);
      const ky = headCenter.y + lx * Math.sin(radRoll) + ly * Math.cos(radRoll);

      const fg = svgEl('g');
      
      if (this.activeJoint === 'facing') {
        fg.appendChild(svgEl('circle', { cx: kx, cy: ky, r: 10, fill: 'none',
          stroke: '#facc15', 'stroke-width': 2, opacity: 0.9 }));
      }
      fg.appendChild(svgEl('circle', { cx: kx, cy: ky, r: 5,
        fill: '#000000', stroke: '#ffffff', 'stroke-width': 1.5, style: 'cursor:pointer' }));
      const fHit = svgEl('circle', { cx: kx, cy: ky, r: 16, fill: 'transparent', style: 'cursor:pointer' });
      fg.appendChild(fHit);

      const startFacingDrag = e => {
        e.stopPropagation();
        this._pushHistory(); // ← before 스냅샷: 시선 드래그 시작 직전
        this.dragMode = 'facing';
        this.dragCenter = headCenter;
        this.dragThetaRoll = thetaRoll;
        this.dragObject = obj;
        this.activeJoint = 'facing';
        this._renderControls();
        DragBus.start(ev => this._onMove(ev), ev => this._onUp(ev));
        try { this.svg.setPointerCapture(e.pointerId); } catch (err) {}
      };
      fHit.addEventListener('pointerdown', startFacingDrag);
      this.gCtrl.appendChild(fg);
    }
  }

  _getPoseDragInfo(obj, jointKey, pt) {
    const joints = calcSkeleton(obj);
    
    const map = {
      lShoulder:  { centerKey: 'neckBase',   field: 'lShoulder' },
      lElbow:     { centerKey: 'lShoulder',  field: 'lShoulder' },
      lWrist:     { centerKey: 'lElbow',     field: 'lElbow' },
      lHand:      { centerKey: 'lWrist',     field: 'lWrist' },
      rShoulder:  { centerKey: 'neckBase',   field: 'rShoulder' },
      rElbow:     { centerKey: 'rShoulder',  field: 'rShoulder' },
      rWrist:     { centerKey: 'rElbow',     field: 'rElbow' },
      rHand:      { centerKey: 'rWrist',     field: 'rWrist' },
      lHip:       { centerKey: 'pelvis',     field: 'pelvis' },
      lKnee:      { centerKey: 'lHip',       field: 'lHip' },
      lAnkle:     { centerKey: 'lKnee',      field: 'lKnee' },
      lFoot:      { centerKey: 'lAnkle',     field: 'lAnkle' },
      rKnee:      { centerKey: 'rHip',       field: 'rHip' },
      rAnkle:     { centerKey: 'rKnee',      field: 'rKnee' },
      rFoot:      { centerKey: 'rAnkle',     field: 'rAnkle' },
      headCenter: { centerKey: 'neckBase',   field: 'head' },
      neckBase:   { centerKey: 'chestBase',  field: 'neck' },
      chestBase:  { centerKey: 'waist',      field: 'chest' },
      waist:      { centerKey: 'pelvis',     field: 'waist' },
      pelvis:     { centerKey: 'pelvis',     field: 'pelvis' }
    };

    const config = map[jointKey];
    if (!config) return null;

    const center = joints[config.centerKey] || { x: obj.x, y: obj.y };
    const mouseAngle = Math.atan2(pt.y - center.y, pt.x - center.x) * 180 / Math.PI;
    const initAngle = obj.angles[config.field] !== undefined ? obj.angles[config.field] : 0;

    return { center, initAngle, mouseAngle, angleField: config.field };
  }

  // ── FORWARD KINEMATICS SOLVER ─────────────────
  _solveFK(s, joint, lx, ly) {
    const sk = calcSkeleton({ ...s, angle: 0, flipped: false, scale: 1 });
    const ang = s.angles;

    const getAngleFromDown = (base, tx, ty) => {
      const dx = tx - base.x;
      const dy = ty - base.y;
      let a = Math.atan2(dx, -dy) * 180 / Math.PI;
      let diff = a - 180;
      if (diff < -180) diff += 360;
      return diff;
    };

    const getAngleFromUp = (base, tx, ty) => {
      const dx = tx - base.x;
      const dy = ty - base.y;
      return Math.atan2(dx, -dy) * 180 / Math.PI;
    };

    switch (joint) {
      case 'pelvis':
        ang.pelvis = Math.round(getAngleFromUp(sk.pelvis, lx, ly));
        break;
      case 'waist':
        ang.waist = Math.round(getAngleFromUp(sk.pelvis, lx, ly) - ang.pelvis);
        break;
      case 'chestBase':
      case 'chest':
        ang.chest = Math.round(getAngleFromUp(sk.waist, lx, ly) - ang.pelvis - ang.waist);
        break;
      case 'neckBase':
        ang.neck = Math.round(getAngleFromUp(sk.chestBase || sk.waist, lx, ly) - ang.pelvis - ang.waist - (ang.chest || 0));
        break;
      case 'headCenter':
        ang.head = Math.round(getAngleFromUp(sk.neckBase, lx, ly) - ang.pelvis - ang.waist - (ang.chest || 0) - (ang.neck || 0));
        break;
      
      // Arms (0 is down)
      case 'lElbow':
        ang.lShoulder = Math.round(getAngleFromDown(sk.lShoulder, lx, ly) - ang.chest - ang.waist - ang.pelvis);
        break;
      case 'lWrist':
        ang.lElbow = Math.round(getAngleFromDown(sk.lElbow, lx, ly) - ang.chest - ang.waist - ang.pelvis - ang.lShoulder);
        break;
      case 'lHand':
        ang.lWrist = Math.round(getAngleFromDown(sk.lWrist, lx, ly) - ang.chest - ang.waist - ang.pelvis - ang.lShoulder - ang.lElbow);
        break;

      case 'rElbow':
        ang.rShoulder = Math.round(getAngleFromDown(sk.rShoulder, lx, ly) - ang.chest - ang.waist - ang.pelvis);
        break;
      case 'rWrist':
        ang.rElbow = Math.round(getAngleFromDown(sk.rElbow, lx, ly) - ang.chest - ang.waist - ang.pelvis - ang.rShoulder);
        break;
      case 'rHand':
        ang.rWrist = Math.round(getAngleFromDown(sk.rWrist, lx, ly) - ang.chest - ang.waist - ang.pelvis - ang.rShoulder - ang.rElbow);
        break;

      // Legs (0 is down)
      case 'lKnee':
        ang.lHip = Math.round(getAngleFromDown(sk.lHip, lx, ly) - ang.pelvis);
        break;
      case 'lAnkle':
        ang.lKnee = Math.round(getAngleFromDown(sk.lKnee, lx, ly) - ang.pelvis - ang.lHip);
        break;
      case 'lFoot':
        ang.lAnkle = Math.round(getAngleFromDown(sk.lAnkle, lx, ly) - ang.pelvis - ang.lHip - ang.lKnee);
        break;

      case 'rKnee':
        ang.rHip = Math.round(getAngleFromDown(sk.rHip, lx, ly) - ang.pelvis);
        break;
      case 'rAnkle':
        ang.rKnee = Math.round(getAngleFromDown(sk.rKnee, lx, ly) - ang.pelvis - ang.rHip);
        break;
      case 'rFoot':
        ang.rAnkle = Math.round(getAngleFromDown(sk.rAnkle, lx, ly) - ang.pelvis - ang.rHip - ang.rKnee);
        break;
    }
  }

  // ── ADD OBJECTS ───────────────────────────────
  addDummy(x = null, y = null, quiet = false) {
    if (!quiet) announceStatus('인물이 추가되었습니다.');
    const initX = x !== null ? x : 400; // 캔버스 절대 중앙 고정 (400)
    const initY = y !== null ? y : 400; // 캔버스 절대 중앙 고정 (400)
    const col = nextColor();
    const obj = {
      id: uid(), type: 'stickman', x: initX, y: initY, scale: 1.55, angle: 0, flipped: false,
      facingX: 0, facingY: 0,
      colors: { head:col, neck:col, chest:col, waist:col, pelvis:col, lArm:col, rArm:col, lLeg:col, rLeg:col },
      angles: defaultAngles(),
      partOffsets: defaultPartOffsets(),
      zIndex: this._nextZ()
    };
    this.objects.push(obj);
    this._select(obj);
    this._pushRecentColor(col);
    this._pushHistory();
    this._render();
  }

  _addImage(src) {
    const img = new Image();
    img.onload = () => {
      announceStatus('이미지가 추가되었습니다.');
      const maxD = 280;
      let w = img.width, h = img.height;
      const sc = Math.min(maxD / w, maxD / h, 1);
      w = Math.round(w * sc); h = Math.round(h * sc);
      this.objects.push({
        id: uid(), type: 'image', x: this.vbW/2, y: this.vbH/2,
        scale: 1.0, angle: 0, w, h, src,
        crop: { x: 0, y: 0, w, h },
        zIndex: this._nextZ()
      });
      this._select(this.objects[this.objects.length - 1]);
      this._pushHistory();
      this._render();
    };
    img.src = src;
  }

  _addImageFromRefSlot(slot) {
    const img = new Image();
    img.onload = () => {
      const maxD = 280;
      const origW = img.width, origH = img.height;
      const sc = Math.min(maxD / origW, maxD / origH, 1);
      const w = Math.round(origW * sc);
      const h = Math.round(origH * sc);

      // 참고자료 크롭 정보를 캔버스 이미지 좌표(스케일된)로 변환
      let crop;
      if (slot.crop && slot.crop.w > 0) {
        crop = {
          x: slot.crop.x * sc,
          y: slot.crop.y * sc,
          w: slot.crop.w * sc,
          h: slot.crop.h * sc
        };
      } else {
        crop = { x: 0, y: 0, w, h };
      }

      this.objects.push({
        id: uid(), type: 'image', x: this.vbW/2, y: this.vbH/2,
        scale: 1.0, angle: 0, w, h, src: slot.src,
        crop,
        zIndex: this._nextZ()
      });
      this._select(this.objects[this.objects.length - 1]);
      this._pushHistory();
      this._render();
    };
    img.src = slot.src;
  }

  _createText(x, y) {
    const obj = {
      id: uid(), type: 'text', x, y, scale: 1.0, angle: 0,
      text: '\u00a0', fontSize: 24, color: this.drawingColor, zIndex: this._nextZ(),
      shapeStyle: this.shapeStyle || 'fill', strokeWidth: this.shapeWidth || 4
    };
    this.objects.push(obj);
    this._setTool('select');
    this._select(obj);
    this._pushHistory();
    this._render();
    // 생성 즉시 입력 모드로 진입 (회색 placeholder 없이 바로 타이핑 가능)
    setTimeout(() => {
      this._editText(obj);
    }, 30);
  }

  _editText(obj, gEl = null) {
    document.querySelectorAll('.edit-overlay').forEach(el => el.remove());
    let node = gEl;
    if (!node) node = this.gObjects.querySelector(`[data-obj-id="${obj.id}"]`);
    const textEl = node ? node.querySelector('text') : null;
    
    const ctm = this.svg.getScreenCTM();
    const scaleFactor = ctm ? ctm.a : 1;
    let cx = 0, cy = 0;
    if (textEl) {
      const bbox = textEl.getBoundingClientRect();
      cx = bbox.left + bbox.width / 2;
      cy = bbox.top + bbox.height / 2;
    } else {
      // SVG 좌표 -> 화면 픽셀 좌표계 정밀 변환 fallback
      const pt = this.svg.createSVGPoint();
      pt.x = obj.x; pt.y = obj.y;
      const screenPt = pt.matrixTransform(ctm);
      cx = screenPt.x;
      cy = screenPt.y;
    }

    const inp = document.createElement('textarea');
    inp.value = obj.text === '\u00a0' ? '' : (obj.text || '');
    inp.className = 'edit-overlay';
    
    const actualFontSize = obj.fontSize * (obj.scale || 1) * scaleFactor;
    
    // 중앙 정렬 기반으로 투명 textarea 띄우기
    let startW = Math.max(300, (inp.value.length * actualFontSize * 0.8) + 60);
    inp.style.left = (cx - startW / 2) + 'px';
    inp.style.top = (cy - actualFontSize * 0.6) + 'px';
    inp.style.width = startW + 'px';
    inp.style.minHeight = '36px';
    inp.style.padding = '0';
    inp.style.fontSize = actualFontSize + 'px';
    inp.style.color = obj.color || '#1e293b';
    inp.style.fontFamily = 'var(--font, "Paperlogy", sans-serif)';
    inp.style.background = 'transparent';
    inp.style.border = 'none';
    inp.style.outline = 'none';
    inp.style.boxShadow = 'none';
    inp.style.resize = 'none';
    inp.style.overflow = 'hidden';
    inp.style.whiteSpace = 'pre-wrap';
    inp.style.wordBreak = 'break-all';
    inp.style.textAlign = 'center';
    inp.style.lineHeight = '1.2';
    document.body.appendChild(inp);

    // 원본 SVG 텍스트 숨기기 (겹침 방지) - 렌더링 시에도 유지되도록 플래그 설정
    obj._isEditing = true;
    if (textEl) {
      textEl.style.display = 'none';
      textEl.style.opacity = '0';
    }

    const adjustSize = () => {
      inp.style.height = 'auto';
      inp.style.height = (inp.scrollHeight) + 'px';
      // 넓이를 충분히 주어 스크롤바가 생기거나 밀리는 현상 방지
      let newW = Math.max(300, inp.scrollWidth + 20);
      inp.style.width = newW + 'px';
      inp.style.left = (cx - newW / 2) + 'px';
    };
    inp.addEventListener('input', adjustSize);
    
    setTimeout(() => {
      adjustSize();
      inp.focus();
      inp.select();
    }, 20);

    const done = () => {
      obj._isEditing = false;
      if (textEl) {
        textEl.style.display = '';
        textEl.style.opacity = '1';
      }
      const newText = inp.value.trim();
      obj.text = newText || '\u00a0';
      inp.remove();
      // 패널 textarea에도 즉시 동기화
      const tca = document.getElementById('text-content-input');
      if (tca) tca.value = newText;
      this._pushHistory();
      this._render();
      this._renderControls();
    };
    inp.addEventListener('blur', done);
    inp.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); done(); }
      if (e.key === 'Escape') { inp.remove(); }
    });
  }



  // ── REFERENCE PANEL ───────────────────────────
  _initRefPanel() {
    const toggleBtn = document.getElementById('ref-toggle');
    const panel     = document.getElementById('ref-panel');
    const area      = document.getElementById('canvas-area');

    if (toggleBtn && panel && area) {
      toggleBtn.addEventListener('click', () => {
        const hidden = panel.classList.toggle('hidden');
        toggleBtn.classList.toggle('panel-hidden', hidden);
        area.classList.toggle('panel-hidden', hidden);
        setTimeout(() => this._applyRatio(), 280);
      });
    }



    document.getElementById('ref-cat')?.addEventListener('input', e => {
      this.refCategory = e.target.value;
    });
    document.getElementById('ref-add')?.addEventListener('click', () => this._addRefSlot());
  }



  _addRefSlot(data = null) {
    const slot = { id: uid(), src: data?.src || null, note: data?.note || '', crop: data?.crop || null };
    this.refSlots.push(slot);
    this._renderRefSlots();
    if (data?.sheetTheme && this._applySheetTheme) { this._applySheetTheme(data.sheetTheme); }
  }

  _renderRefSlots() {
    const container = document.getElementById('ref-slots');
    if (!container) return;
    container.innerHTML = '';
    this.refSlots.forEach((slot, idx) => {
      const card = document.createElement('div');
      card.className = 'ref-slot';

      // Thumbnail
      const thumb = document.createElement('div');
      thumb.className = 'slot-thumb' + (slot.src ? ' has-img' : '');

      // 파일 입력 — 항상 thumb에 넣어둠
      const fi = document.createElement('input');
      fi.type = 'file'; fi.accept = 'image/*'; fi.style.display = 'none';
      thumb.appendChild(fi);

      const triggerUpload = () => fi.click();

      // 파일 업로드 처리 함수 (크롭 모달 팝업)
      fi.addEventListener('change', e => {
        const f = e.target.files[0]; if (!f) return;
        const fr = new FileReader();
        fr.onload = ev => {
          const tempImg = new Image();
          tempImg.onload = () => {
            const maxD = 400;
            let dw = tempImg.width, dh = tempImg.height;
            const sc = Math.min(maxD / dw, maxD / dh, 1);
            dw = Math.round(dw * sc); dh = Math.round(dh * sc);

            const factorX = tempImg.naturalWidth / dw;
            const factorY = tempImg.naturalHeight / dh;

            this._openCropModal(ev.target.result, dw, dh, null, (state) => {
              const viewW = 260;
              const scale = state.scale;
              const px = -state.x / scale;
              const py = -state.y / scale;
              const pw = viewW / scale;
              const ph = viewW / scale;

              slot.crop = {
                x: Math.max(0, px * factorX),
                y: Math.max(0, py * factorY),
                w: Math.min(tempImg.naturalWidth, pw * factorX),
                h: Math.min(tempImg.naturalHeight, ph * factorY)
              };
              slot.src = ev.target.result;
              e.target.value = '';
              this._renderRefSlots();
            });
          };
          tempImg.src = ev.target.result;
        };
        fr.readAsDataURL(f);
      });

      if (slot.src) {
        // 동적 캔버스로 크롭된 영역만 그리기
        const canvas = document.createElement('canvas');
        canvas.width = 160; canvas.height = 160;
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, 160, 160);
          const crop = slot.crop && slot.crop.w > 0
            ? slot.crop
            : { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
          ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, 160, 160);
        };
        img.src = slot.src;

        thumb.appendChild(canvas);
        // 이미지 있는 슬롯 클릭 → 크롭 재조정 모달
        thumb.addEventListener('click', () => this._openCropModalForRefSlot(slot));
      } else {
        thumb.innerHTML += '<div class="upload-hint"><i class="fa-solid fa-cloud-arrow-up"></i>이미지 업로드</div>';
        thumb.addEventListener('click', triggerUpload);
      }

      // Note
      const note = document.createElement('textarea');
      note.className = 'slot-note';
      note.placeholder = '설명 / 메모...';
      note.value = slot.note;
      note.addEventListener('input', () => { slot.note = note.value; });

      // Actions
      const actions = document.createElement('div');
      actions.className = 'slot-actions';
      const left = document.createElement('div');
      left.className = 'slot-left';

      const mkBtn = (icon, title, fn) => {
        const b = document.createElement('button');
        b.className = 'action-btn'; b.title = title; b.innerHTML = `<i class="fa-solid ${icon}"></i>`;
        b.style.cssText = 'padding:0 8px;height:28px;font-size:12px;width:auto;flex:none;';
        b.addEventListener('click', fn); return b;
      };

      left.appendChild(mkBtn('fa-arrow-up','위로', () => {
        if (idx > 0) { [this.refSlots[idx-1],this.refSlots[idx]] = [this.refSlots[idx],this.refSlots[idx-1]]; this._renderRefSlots(); }
      }));
      left.appendChild(mkBtn('fa-arrow-down','아래로', () => {
        if (idx < this.refSlots.length-1) { [this.refSlots[idx+1],this.refSlots[idx]] = [this.refSlots[idx],this.refSlots[idx+1]]; this._renderRefSlots(); }
      }));

      if (slot.src) {
        left.appendChild(mkBtn('fa-share-from-square','캔버스로 복사', () => this._addImageFromRefSlot(slot)));
        left.appendChild(mkBtn('fa-image','이미지 변경', triggerUpload));
      }

      const del = mkBtn('fa-trash-can','슬롯 삭제', () => {
        this.refSlots.splice(idx, 1); this._renderRefSlots();
      });
      del.style.color = 'var(--c-danger)';

      actions.appendChild(left); actions.appendChild(del);

      card.appendChild(thumb); card.appendChild(note); card.appendChild(actions);
      container.appendChild(card);
    });
  }

  // 이미지 등록된 슬롯의 크롭 영역 재조정 — 기존 crop 정보 복원 후 모달 표시
  _openCropModalForRefSlot(slot) {
    const tempImg = new Image();
    tempImg.onload = () => {
      const maxD = 400;
      let dw = tempImg.naturalWidth, dh = tempImg.naturalHeight;
      const sc = Math.min(maxD / dw, maxD / dh, 1);
      dw = Math.round(dw * sc); dh = Math.round(dh * sc);

      const factorX = tempImg.naturalWidth / dw;
      const factorY = tempImg.naturalHeight / dh;

      // 원본 crop 좌표를 모달 표시용 좌표로 역산
      let initialCrop = null;
      if (slot.crop && slot.crop.w > 0) {
        initialCrop = {
          x: slot.crop.x / factorX,
          y: slot.crop.y / factorY,
          w: slot.crop.w / factorX,
          h: slot.crop.h / factorY
        };
      }

      this._openCropModal(slot.src, dw, dh, initialCrop, (state) => {
        const viewW = 260;
        const scale = state.scale;
        const px = -state.x / scale;
        const py = -state.y / scale;
        const pw = viewW / scale;
        const ph = viewW / scale;

        slot.crop = {
          x: Math.max(0, px * factorX),
          y: Math.max(0, py * factorY),
          w: Math.min(tempImg.naturalWidth, pw * factorX),
          h: Math.min(tempImg.naturalHeight, ph * factorY)
        };
        this._renderRefSlots();
      });
    };
    tempImg.src = slot.src;
  }

  _initRefPanelToggle() {
    // ref-toggle 이벤트는 _initBookmarkDeck에서 일원화하여 관리
  }
  _loadImg(src) {
    return new Promise(res => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });
  }

  _download(url, filename) {
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
  }

  // ── ALERT, CONFIRM & GLOBAL RESET ──────────────────
  // ── 모달 래퍼 — 실제 로직은 modal-manager.js (CommissionApp.ModalManager) ──
  _initAlertModal()   { /* modal-manager.js로 이전 — ModalManager.initAll()에서 처리 */ }
  _initConfirmModal() { /* modal-manager.js로 이전 — ModalManager.initAll()에서 처리 */ }
  _initPromptModal()  { /* modal-manager.js로 이전 — ModalManager.initAll()에서 처리 */ }
  _initTutorialModal(){ /* modal-manager.js로 이전 — ModalManager.initAll()에서 처리 */ }

  _alert(msg)                      { CommissionApp.ModalManager.alert(msg); }
  _confirm(msg, callback)          { CommissionApp.ModalManager.confirm(msg, callback); }
  _prompt(msg, defaultText, cb)    { CommissionApp.ModalManager.prompt(msg, defaultText, cb); }

  _clearAll() {
    announceStatus('전체 초기화 되었습니다.');
    this._select(null);
    this.objects = [];
    CommissionApp.HistoryManager.reset(); // 히스토리 초기화 (history-manager.js)
    this.refCategory = '기타';
    const refCat = document.getElementById('ref-cat');
    if (refCat) refCat.value = '기타';
    this.refSlots = [];
    
    // Default canvas bg reset
    this.canvasBg = '#ffffff';
    const bgPicker = document.getElementById('bg-picker');
    if (bgPicker) bgPicker.value = '#ffffff';
    const bgHex = document.getElementById('bg-hex');
    if (bgHex) bgHex.value = '#ffffff';
    const svgBg = document.getElementById('svg-bg');
    if (svgBg) svgBg.setAttribute('fill', '#ffffff');

    // 캐릭터 시트 완전 초기화
    this.characters = [this._createDefaultCharacter('c1', 'A')];
    this.activeCharId = 'c1';
    if (typeof this._renderBookmarkTabs === 'function') this._renderBookmarkTabs();
    if (typeof this._switchCharacter === 'function') this._switchCharacter(this.activeCharId);

    // 테마 설정 초기화
    if (typeof this._applySheetTheme === 'function') {
       this.sheetTheme = { id: 'mono', presetId: 'mono', main: '#2E2E2E', sub: '#E6E6E6', title: '#FFFFFF', body: '#1E293B', bg: '#FFFFFF' };
       this._applySheetTheme(this.sheetTheme, 'mono');
    }

    // 구도 설명란 완전 초기화
    if (typeof this._applyCompDescTheme === 'function') {
      this.compDesc = {
        visible: true,
        folded: false,
        keypoint: '',
        features: '',
        theme: {
          main: '#2E2E2E',
          sub: '#E6E6E6',
          bg: '#FFFFFF',
          titleText: '#FFFFFF',
          bodyText: '#1E293B',
          fontSize: 13,
          fontWeight: 400
        },
        linkSheetTheme: false
      };
      this._applyCompDescTheme(this.compDesc.theme);
      const kp = document.getElementById('cs-comp-keypoint-input');
      const ft = document.getElementById('cs-comp-features-input');
      if (kp) kp.innerText = '';
      if (ft) ft.innerHTML = '';
      const outer = document.getElementById('cs-comp-outer');
      if (outer) {
        outer.classList.remove('hidden', 'folded');
      }
      const sideToggle = document.getElementById('canvas-comp-desc-toggle');
      if (sideToggle) sideToggle.checked = true;
    }

    // Add initial dummy (조용히 추가)
    this.addDummy(null, null, true);

    // Re-add default ref slots
    for (let i = 0; i < 4; i++) this._addRefSlot();
    
    // 강제 렌더링 갱신
    this._render();
  }

  // ── PROJECT SAVE / LOAD ───────────────────────
  _saveProject() {
    announceStatus('프로젝트가 저장되었습니다.');
    if (typeof this._saveCurrentCharacterData === 'function') {
      this._saveCurrentCharacterData();
    }
    const data = {
      version: '2.6',
      canvasBg: this.canvasBg,
      canvasRatio: document.getElementById('canvas-ratio').value,
      cw: document.getElementById('cw').value,
      ch: document.getElementById('ch').value,
      objects: this.objects,
      refCategory: this.refCategory,
      refSlots: this.refSlots,
      sheetTheme: this.sheetTheme,
      compDesc: this.compDesc,
      characters: this.characters,
      activeCharId: this.activeCharId
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    this._download(URL.createObjectURL(blob), 'commission_project.json');
  }

  _loadProject(data) {
    announceStatus('프로젝트를 불러왔습니다.');
    this._select(null);
    document.getElementById('canvas-ratio').value = data.canvasRatio || '1:1';
    document.getElementById('cw').value = data.cw || 800;
    document.getElementById('ch').value = data.ch || 600;
    const bg = data.canvasBg || '#ffffff';
    this.canvasBg = bg;
    document.getElementById('bg-picker').value = bg;
    document.getElementById('bg-hex').value = bg;
    document.getElementById('svg-bg').setAttribute('fill', bg);
    this.objects = data.objects || [];
    this.refCategory = data.refCategory || '기타';
    const refCat = document.getElementById('ref-cat');
    if (refCat) refCat.value = this.refCategory;
    this.refSlots = data.refSlots || [];

    // ── 캐릭터 시트 복원 ─────────────────────────────────────────
    if (Array.isArray(data.characters) && data.characters.length > 0) {
      const SLOT_KEYS = ['main-img', 'sub-1', 'sub-2', 'sub-3', 'sub-4'];
      // 각 캐릭터 객체를 기본값으로 보정 (이전 버전 JSON과의 호환성)
      this.characters = data.characters.map(saved => {
        const def = this._createDefaultCharacter(saved.id || ('c_' + Date.now()), saved.letter || 'A');
        const merged = { ...def, ...saved };
        // 이미지 슬롯 누락 항목 보정
        if (!merged.images || typeof merged.images !== 'object') {
          merged.images = def.images;
        } else {
          SLOT_KEYS.forEach(k => {
            if (!merged.images[k]) merged.images[k] = this._createDefaultSlotState();
          });
        }
        if (!merged.chips || typeof merged.chips !== 'object') merged.chips = {};
        if (!merged.theme || typeof merged.theme !== 'object') merged.theme = { ...def.theme };
        if (!Array.isArray(merged.freeObjects)) merged.freeObjects = [];
        return merged;
      });

      // activeCharId 복원 – 없으면 첫 번째 탭
      const savedActiveId = data.activeCharId;
      this.activeCharId = (savedActiveId && this.characters.find(c => c.id === savedActiveId))
        ? savedActiveId
        : this.characters[0].id;

      // 탭 렌더링 → 시트 데이터 화면에 표시
      if (typeof this._renderBookmarkTabs === 'function') this._renderBookmarkTabs();
      if (typeof this._switchCharacter   === 'function') this._switchCharacter(this.activeCharId);
    }
    // ──────────────────────────────────────────────────────────────

    if (data.sheetTheme && typeof this._applySheetTheme === 'function') {
      this._applySheetTheme(data.sheetTheme, data.sheetTheme.presetId || 'mono');
    }
    if (data.compDesc && typeof this._applyCompDescTheme === 'function') {
      this.compDesc = { ...this.compDesc, ...data.compDesc };
      this._applyCompDescTheme(this.compDesc.theme);
      const kp = document.getElementById('cs-comp-keypoint-input');
      const ft = document.getElementById('cs-comp-features-input');
      if (kp) kp.innerText = this.compDesc.keypoint || '';
      if (ft) ft.innerHTML = (this.compDesc.features || '').replace(/\n/g, '<br>');
      const outer = document.getElementById('cs-comp-outer');
      if (outer) {
        outer.classList.toggle('hidden', !this.compDesc.visible);
        outer.classList.toggle('folded', !!this.compDesc.folded);
      }
      const sideToggle = document.getElementById('canvas-comp-desc-toggle');
      if (sideToggle) sideToggle.checked = !!this.compDesc.visible;
    }
    this._applyRatio();
    this._render();
    this._renderRefSlots();
  }

  // ── IMAGE CROP MODAL ──────────────────────────
  _initCropModal() {
    const modal = document.getElementById('crop-modal');
    const closeBtn = document.getElementById('crop-close');
    const cancelBtn = document.getElementById('crop-cancel');
    const saveBtn = document.getElementById('crop-save');
    const container = document.getElementById('crop-container');
    const imgEl = document.getElementById('crop-img');
    const viewport = document.getElementById('crop-viewport');

    let isDragging = false;
    let startX = 0, startY = 0;
    
    this.cropState = {
      scale: 1.0,
      x: 0,
      y: 0,
      displayW: 0,
      displayH: 0
    };
    this.cropOnSave = null;


    const close = () => { closeModalWithFocus(modal); this.cropOnSave = null; };
    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);

    container.addEventListener('pointerdown', e => {
      isDragging = true;
      startX = e.clientX - this.cropState.x;
      startY = e.clientY - this.cropState.y;
      container.setPointerCapture(e.pointerId);
    });

    container.addEventListener('pointermove', e => {
      if (!isDragging) return;
      this.cropState.x = e.clientX - startX;
      this.cropState.y = e.clientY - startY;
      this._updateCropUI();
    });

    container.addEventListener('pointerup', e => {
      if (isDragging) {
        isDragging = false;
        container.releasePointerCapture(e.pointerId);
      }
    });

    container.addEventListener('wheel', e => {
      e.preventDefault();
      const zoomFactor = 1.1;
      const prevScale = this.cropState.scale;
      let newScale = prevScale;

      if (e.deltaY < 0) {
        newScale = Math.min(prevScale * zoomFactor, 10.0);
      } else {
        newScale = Math.max(prevScale / zoomFactor, 0.1);
      }

      const vRect = viewport.getBoundingClientRect();
      const vx = e.clientX - vRect.left;
      const vy = e.clientY - vRect.top;

      this.cropState.x = vx - (vx - this.cropState.x) * (newScale / prevScale);
      this.cropState.y = vy - (vy - this.cropState.y) * (newScale / prevScale);
      this.cropState.scale = newScale;

      this._updateCropUI();
    }, { passive: false });

    saveBtn.addEventListener('click', () => {
      if (this.cropOnSave) {
        this.cropOnSave(this.cropState);
      }
      close();
    });
  }

  _openCropModal(src, displayW, displayH, initialCrop, onSave) {
    const modal = document.getElementById('crop-modal');
    const imgEl = document.getElementById('crop-img');
    
    imgEl.src = src;
    imgEl.style.width = displayW + 'px';
    imgEl.style.height = displayH + 'px';
    
    this.cropState.displayW = displayW;
    this.cropState.displayH = displayH;
    
    const viewW = 260;
    const viewH = 260;

    if (initialCrop && initialCrop.w > 0) {
      const scale = viewW / initialCrop.w;
      this.cropState.scale = scale;
      this.cropState.x = -initialCrop.x * scale;
      this.cropState.y = -initialCrop.y * scale;
    } else {
      const scale = Math.max(viewW / displayW, viewH / displayH);
      this.cropState.scale = scale;
      this.cropState.x = (viewW - displayW * scale) / 2;
      this.cropState.y = (viewH - displayH * scale) / 2;
    }

    this.cropOnSave = onSave;
    this._updateCropUI();
    openModalWithFocus(modal, document.activeElement);
  }

  _updateCropUI() {
    const imgEl = document.getElementById('crop-img');
    if (!imgEl) return;
    imgEl.style.transform = `translate(${this.cropState.x}px, ${this.cropState.y}px) scale(${this.cropState.scale})`;
  }

  _initPosePresets() {
    this._renderPresets();
  }

  _renderPresets() {
    const listEl = document.getElementById('pose-presets-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    // 커스텀 프리셋 로드
    let customPresets = [];
    try {
      customPresets = JSON.parse(localStorage.getItem('custom_pose_presets') || '[]');
    } catch(e) {
      customPresets = [];
    }

    const allPresets = [...this.defaultPresets, ...customPresets];
    // 메모리에 로드된 전체 프리셋의 오염된 partOffsets를 안전하게 정규화
    allPresets.forEach(p => {
      if (p && p.data && p.data.partOffsets) {
        p.data.partOffsets = normalizePartOffsets(p.data.partOffsets);
      }
    });
    
    // 항상 최소 12개 슬롯을 유지하고, 새 커스텀을 추가할 빈 슬롯도 항상 맨 끝에 보여줌
    const totalSlots = Math.max(12, allPresets.length + 1);

    for (let i = 0; i < totalSlots; i++) {
      const preset = allPresets[i];
      if (preset) {
        // 프리셋 버튼 생성
        const btn = document.createElement('button');
        btn.className = 'ctrl-bar-preset-btn';
        btn.title = `${preset.name} 포즈 적용`;
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'ctrl-bar-preset-name';
        nameSpan.textContent = preset.name;
        btn.appendChild(nameSpan);

        // 클릭 이벤트: 포즈 적용
        btn.addEventListener('click', (e) => {
          if (e.target.closest('.ctrl-bar-preset-del-btn')) return;

          const s = this.selected;
          if (!s || s.type !== 'stickman') {
            this._alert('포즈를 적용할 인물을 먼저 선택해 주세요.');
            return;
          }
          this._pushHistory();
          const d = preset.data || {};
          s.angles = d.angles ? JSON.parse(JSON.stringify(d.angles)) : {};
          s.partOffsets = d.partOffsets ? JSON.parse(JSON.stringify(d.partOffsets)) : {};
          s.facingX = d.facingX !== undefined ? Number(d.facingX) : 1;
          s.facingY = d.facingY !== undefined ? Number(d.facingY) : 1;
          s.flipped = d.flipped !== undefined ? !!d.flipped : false;

          this._render();
        });

        // 커스텀 프리셋에만 삭제 버튼 추가
        const isCustom = i >= this.defaultPresets.length;
        if (isCustom) {
          const delBtn = document.createElement('button');
          delBtn.className = 'ctrl-bar-preset-del-btn';
          delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
          delBtn.title = '프리셋 삭제';
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._confirm(`'${preset.name}' 프리셋을 삭제하시겠습니까?`, () => {
              customPresets.splice(i - this.defaultPresets.length, 1);
              localStorage.setItem('custom_pose_presets', JSON.stringify(customPresets));
              this._renderPresets();
            });
          });
          btn.appendChild(delBtn);
        }

        listEl.appendChild(btn);
      } else {
        // 빈 슬롯 생성
        const btn = document.createElement('button');
        btn.className = 'ctrl-bar-preset-btn empty';
        btn.innerHTML = '<i class="fa-solid fa-plus" style="margin-right:4px;"></i> 저장';
        btn.title = '현재 선택된 포즈를 이 슬롯에 저장';

        btn.addEventListener('click', () => {
          const s = this.selected;
          if (!s || s.type !== 'stickman') {
            this._alert('포즈를 저장할 인물을 먼저 선택해 주세요.');
            return;
          }
          this._prompt('새 프리셋 이름을 입력해 주세요:', '', (name) => {
            if (!name) return;
            const trimmed = name.trim();
            if (!trimmed) return;

            const data = {
              angles: JSON.parse(JSON.stringify(s.angles)),
              partOffsets: JSON.parse(JSON.stringify(s.partOffsets)),
              facingX: s.facingX ?? 0,
              facingY: s.facingY ?? 0,
              flipped: !!s.flipped
            };

            customPresets.push({ name: trimmed, data });
            localStorage.setItem('custom_pose_presets', JSON.stringify(customPresets));
            this._renderPresets();
          });
        });

        listEl.appendChild(btn);
      }
    }
  }
  // ── 캐릭터 기본 데이터 팩토리 (클래스 메서드 – 어디서든 접근 가능) ─
  _createDefaultSlotState() {
    return { original: null, scale: 1, offsetX: 0, offsetY: 0, rotate: 0, bgColor: '#ffffff' };
  }

  _createDefaultCharacter(id, letter) {
    const s = () => this._createDefaultSlotState();
    return {
      id, letter,
      name: letter + '.',
      origName: '원어 이름',
      spec: '키 / 체형',
      keywords: '#성격 키워드 #성격 키워드 #성격 키워드',
      keypoints: '빠지면 안 되는 중요한 특징을 서술해 주세요.',
      features: '- 외관 특징을 서술해 주세요.\n- 외관 특징을 서술해 주세요.\n- 외관 특징을 서술해 주세요.\n- 외관 특징을 서술해 주세요.',
      source: '',
      images: {
        'main-img': s(), 'sub-1': s(), 'sub-2': s(), 'sub-3': s(), 'sub-4': s()
      },
      chips: {},
      theme: { presetId: 'mono', main: '#2E2E2E', sub: '#E6E6E6', title: '#FFFFFF', body: '#1E293B', bg: '#FFFFFF' },
      freeObjects: []
    };
  }

  // ── 다인(N인) 캐릭터 책갈피(도킹 탭) 시스템 & 데이터 스위칭 ─────
  _initBookmarkDeck() {
    const tabsContainer = document.getElementById('cs-bookmark-tabs');
    const addCharBtn    = document.getElementById('cs-add-char-btn');
    const toggleBtn     = document.getElementById('ref-toggle');
    const panelWrap     = document.getElementById('ref-panel-wrapper');

    const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // 각 캐릭터의 독립 데이터 저장소 – 팩토리는 클래스 메서드(_createDefaultCharacter)로 분리됨
    this.characters = [
      this._createDefaultCharacter('c1', 'A')
    ];
    this.activeCharId = 'c1';

    // 현재 화면의 시트 텍스트, 이미지 5종, 컬러칩 5종, 테마, 스티커 데이터를 활성 캐릭터 객체에 저장
    const saveCurrentCharacterData = () => {
      const cur = this.characters.find(c => c.id === this.activeCharId);
      if (!cur) return;
      const nameEl = document.getElementById('cs-name-input');
      const origEl = document.getElementById('cs-orig-name-input');
      const specEl = document.getElementById('cs-spec-input');
      const kwEl   = document.getElementById('cs-keyword-input');
      const kpEl   = document.getElementById('cs-keypoint-input');
      const featEl = document.getElementById('cs-features-input');
      const srcEl  = document.getElementById('cs-source-input');

      if (nameEl) cur.name = nameEl.value;
      if (origEl) cur.origName = origEl.value;
      if (specEl) cur.spec = specEl.value;
      if (kwEl)   cur.keywords = kwEl.value;
      if (kpEl) {
        cur.keypoints = kpEl.innerText || kpEl.textContent;
        cur.keypointAlign = kpEl.getAttribute('data-align') || 'left';
      }
      if (featEl) {
        cur.features = (featEl.innerText || featEl.textContent).replace(/\r\n|\r|\n/g, '\n');
        cur.featuresAlign = featEl.getAttribute('data-align') || 'left';
      }
      if (srcEl)  cur.source = srcEl.value;

      // 1) 이미지 슬롯 5종 상태 저장
      if (window.CommissionApp?.ImageSlots?.getAllSlotsState) {
        cur.images = window.CommissionApp.ImageSlots.getAllSlotsState();
      }
      // 2) 컬러칩 5종 상태 저장
      if (typeof this._getAllChipsState === 'function') {
        cur.chips = this._getAllChipsState();
      }
      // 3) 시트 테마 색상 저장
      if (this.sheetTheme) {
        cur.theme = { ...this.sheetTheme };
      }
      // 4) 자유 스티커 이미지 목록 저장
      const freeState2 = CommissionApp.FreeObjects?.getObjectsState?.();
      if (freeState2) cur.freeObjects = freeState2;
    };

    // 선택된 캐릭터 데이터를 화면 시트에 바인딩 (텍스트 + 이미지 5종 + 컬러칩 5종 + 테마 + 스티커)
    this._switchCharacter = (targetId) => {
      const target = this.characters.find(c => c.id === targetId);
      if (!target) return;

      const nameEl = document.getElementById('cs-name-input');
      const origEl = document.getElementById('cs-orig-name-input');
      const specEl = document.getElementById('cs-spec-input');
      const kwEl   = document.getElementById('cs-keyword-input');
      const kpEl   = document.getElementById('cs-keypoint-input');
      const featEl = document.getElementById('cs-features-input');
      const srcEl  = document.getElementById('cs-source-input');

      if (nameEl) nameEl.value = target.name || (target.letter + '.');
      if (origEl) origEl.value = target.origName || '원어 이름';
      if (specEl) specEl.value = target.spec || '키 / 체형';
      if (kwEl)   kwEl.value = target.keywords || '';
      if (kpEl) {
        kpEl.innerText = target.keypoints || '';
        kpEl.setAttribute('data-align', target.keypointAlign || 'left');
        const kpToggleIcon = document.querySelector('.cs-align-toggle[data-target="cs-keypoint-input"] i');
        if (kpToggleIcon) kpToggleIcon.className = 'fa-solid fa-align-' + (target.keypointAlign || 'left');
      }
      if (featEl) {
        featEl.innerHTML = (target.features || '').replace(/\n/g, '<br>');
        featEl.setAttribute('data-align', target.featuresAlign || 'left');
        const featToggleIcon = document.querySelector('.cs-align-toggle[data-target="cs-features-input"] i');
        if (featToggleIcon) featToggleIcon.className = 'fa-solid fa-align-' + (target.featuresAlign || 'left');
      }
      if (srcEl)  srcEl.value = target.source || '';

      // 1) 이미지 슬롯 5종 복원 (해당 캐릭터 고유 이미지 렌더링, 없으면 깔끔한 빈 슬롯 초기화)
      if (window.CommissionApp?.ImageSlots?.restoreAllSlotsState) {
        window.CommissionApp.ImageSlots.restoreAllSlotsState(target.images);
      }
      // 2) 컬러칩 5종 복원 (해당 캐릭터 고유 색상/도형 복원)
      if (typeof this._restoreAllChipsState === 'function') {
        this._restoreAllChipsState(target.chips);
      }
      // 3) 시트 테마 색상 복원
      if (target.theme && typeof this._applySheetTheme === 'function') {
        this._applySheetTheme(target.theme, target.theme.presetId || 'mono');
      }
      // 4) 자유 스티커 이미지 복원
      CommissionApp.FreeObjects?.restoreObjectsState?.(target.freeObjects || []);
      // 5) 인물 색상 연동 토글 활성화 시 시트 메인 색상 동기화
      if (typeof this._syncThemeWithDummy === 'function') {
        this._syncThemeWithDummy();
      }
      // 6) 구도 설명란 시트 테마 연동 활성화 시 동기화
      if (typeof this._syncCompDescWithSheetTheme === 'function') {
        this._syncCompDescWithSheetTheme();
      }
    };

    // 실시간 인풋 입력 시 현재 캐릭터 데이터에 자동 반영
    const bindLiveInputs = () => {
      ['cs-name-input', 'cs-orig-name-input', 'cs-spec-input', 'cs-keyword-input', 'cs-source-input'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el._boundLive) {
          el._boundLive = true;
          el.addEventListener('input', () => saveCurrentCharacterData());
        }
      });
      ['cs-keypoint-input', 'cs-features-input'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el._boundLive) {
          el._boundLive = true;
          el.addEventListener('input', () => saveCurrentCharacterData());
        }
      });
    };
    this._saveCurrentCharacterData = saveCurrentCharacterData;

    // 책갈피 탭들 렌더링
    this._renderBookmarkTabs = () => {
      if (!tabsContainer) return;
      tabsContainer.innerHTML = '';

      const isRemovable = this.characters.length > 1;

      this.characters.forEach((char) => {
        // ★ 방안 1: char.letter는 최초 생성 시 배정된 고유 알파벳을 그대로 유지 (절대 덮어쓰지 않음)
        const tab = document.createElement('div');
        tab.className = 'cs-bookmark-tab' + (char.id === this.activeCharId ? ' is-active' : '');
        tab.dataset.charId = char.id;
        tab.textContent = char.letter;
        tab.title = `캐릭터 ${char.letter}. 시트 (드래그하여 순서 변경 가능)`;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('tabindex', '0');
        tab.setAttribute('aria-label', `캐릭터 ${char.letter} 시트`);
        tab.setAttribute('aria-selected', char.id === this.activeCharId ? 'true' : 'false');
        tab.draggable = true;

        // 드래그 앤 드롭 순서 변경 이벤트
        tab.addEventListener('dragstart', (e) => {
          saveCurrentCharacterData();
          e.dataTransfer.setData('text/plain', char.id);
          e.dataTransfer.effectAllowed = 'move';
          setTimeout(() => tab.classList.add('dragging'), 0);
        });

        tab.addEventListener('dragend', () => {
          tab.classList.remove('dragging');
          document.querySelectorAll('.cs-bookmark-tab').forEach(t => {
            t.classList.remove('drag-over-top', 'drag-over-bottom');
          });
        });

        tab.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const rect = tab.getBoundingClientRect();
          const isTop = e.clientY < rect.top + rect.height / 2;
          tab.classList.toggle('drag-over-top', isTop);
          tab.classList.toggle('drag-over-bottom', !isTop);
        });

        tab.addEventListener('dragleave', () => {
          tab.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        tab.addEventListener('drop', (e) => {
          e.preventDefault();
          tab.classList.remove('drag-over-top', 'drag-over-bottom');
          const fromId = e.dataTransfer.getData('text/plain');
          const toId = char.id;
          if (!fromId || fromId === toId) return;

          saveCurrentCharacterData();
          const fromIdx = this.characters.findIndex(c => c.id === fromId);
          if (fromIdx === -1) return;

          const rect = tab.getBoundingClientRect();
          const insertBefore = e.clientY < rect.top + rect.height / 2;

          const [movedChar] = this.characters.splice(fromIdx, 1);
          let targetIdx = this.characters.findIndex(c => c.id === toId);
          if (targetIdx === -1) {
            this.characters.push(movedChar);
          } else {
            this.characters.splice(insertBefore ? targetIdx : targetIdx + 1, 0, movedChar);
          }

          // ★ 순서 변경 시 letter는 고정 유지 (삭제해도 C → B 리네이밍 없음)

          this._renderBookmarkTabs();
          this._switchCharacter(this.activeCharId);
        });

        // 2인 이상일 때 삭제 미니 버튼
        if (isRemovable) {
          const delBtn = document.createElement('span');
          delBtn.className = 'cs-tab-del-btn';
          delBtn.innerHTML = '&times;';
          delBtn.title = `캐릭터 ${char.letter}. 삭제`;
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.characters.length <= 1) return;

            const charLabel = char.name || (char.letter + '.');
            this._confirm(`캐릭터 [ ${charLabel} ] 시트를 정말 삭제하시겠습니까?<br>작성된 프로필 텍스트와 업로드한 이미지가 모두 삭제됩니다.`, () => {
              const wasActive = (char.id === this.activeCharId);
              this.characters = this.characters.filter(c => c.id !== char.id);
              if (wasActive) {
                this.activeCharId = this.characters[0].id;
              }

              // ★ 삭제 후 letter는 고정 유지 (C → B 리네이밍 없음)

              this._renderBookmarkTabs();
              this._switchCharacter(this.activeCharId);
            });
          });
          tab.appendChild(delBtn);
        }

        // 탭 클릭 전환
        tab.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.activeCharId === char.id) return;
          saveCurrentCharacterData();
          this.activeCharId = char.id;
          this._renderBookmarkTabs();
          this._switchCharacter(this.activeCharId);
        });

        tabsContainer.appendChild(tab);
      });
    };

    // 캐릭터 추가 [ ➕ ] 버튼
    if (addCharBtn) {
      addCharBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.characters.length >= 8) {
          this._alert('캐릭터 시트는 최대 8명까지 추가할 수 있습니다.');
          return;
        }
        saveCurrentCharacterData();
        // ★ 방안 1: 현재 사용 중인 알파벳을 제외하고 다음 빈 알파벳을 자동 배정
        const usedLetters = new Set(this.characters.map(c => c.letter));
        const letter = [...LETTERS].find(l => !usedLetters.has(l)) || String(this.characters.length + 1);
        const newId = 'c_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const newChar = this._createDefaultCharacter(newId, letter);
        this.characters.push(newChar);
        this.activeCharId = newChar.id;
        this._renderBookmarkTabs();
        this._switchCharacter(this.activeCharId);
      });
    }

    // 패널 접기/펼치기 토글
    if (toggleBtn && panelWrap) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = panelWrap.classList.toggle('collapsed');
        const icon = toggleBtn.querySelector('i');
        if (icon) {
          icon.className = isCollapsed ? 'fa-solid fa-chevron-left' : 'fa-solid fa-chevron-right';
        }
        toggleBtn.title = isCollapsed ? '신청서 패널 펼치기' : '신청서 패널 접기';
        setTimeout(() => this._applyRatio(), 100);
      });
    }

    // 초기 인풋 바인딩 및 탭 렌더링
    bindLiveInputs();
    this._renderBookmarkTabs();
    this._switchCharacter(this.activeCharId);
  }





  // ── 캐릭터 시트 컬러 시스템 & 테마 ───────────
  _initSheetTheme() {
    const toggleBtn  = document.getElementById('cs-theme-toggle-btn');
    const popup      = document.getElementById('cs-theme-popup');
    const closeBtn   = document.getElementById('cs-theme-popup-close');
    const resetBtn   = document.getElementById('cs-theme-reset-btn');
    const gridEl     = document.getElementById('cs-theme-presets-grid');
    const sheetEl    = document.querySelector('.cs-sheet-wrap');

    const inMain     = document.getElementById('theme-color-main');
    const inSub      = document.getElementById('theme-color-sub');
    const inTitle    = document.getElementById('theme-color-title');
    const inBody     = document.getElementById('theme-color-body');
    const inBg       = document.getElementById('theme-color-bg');

    const hexMain    = document.getElementById('theme-hex-main');
    const hexSub     = document.getElementById('theme-hex-sub');
    const hexTitle   = document.getElementById('theme-hex-title');
    const hexBody    = document.getElementById('theme-hex-body');
    const hexBg      = document.getElementById('theme-hex-bg');

    if (!toggleBtn || !popup || !sheetEl) return;

    // 8종 기본 프리셋 정의 (사용자 커스텀 튜닝 세트)
    const PRESETS = [
      { id: 'mono',     name: '모노 차콜',  main: '#2E2E2E', sub: '#E6E6E6', title: '#FFFFFF', body: '#1E293B', bg: '#FFFFFF' },
      { id: 'rose',     name: '로즈 핑크',  main: '#EE7791', sub: '#FFE5E7', title: '#FFFFFF', body: '#4C0519', bg: '#FFFAFA' },
      { id: 'ocean',    name: '오션 블루',  main: '#4676DD', sub: '#DBEAFE', title: '#FFFFFF', body: '#092267', bg: '#FAFCFF' },
      { id: 'sage',     name: '세이지 그린', main: '#3E7967', sub: '#E7F3ED', title: '#FFFFFF', body: '#003325', bg: '#FAFFFB' },
      { id: 'purple',   name: '라벤더 퍼플', main: '#6254C9', sub: '#EDE9FE', title: '#FFFFFF', body: '#2C0764', bg: '#FBFAFF' },
      { id: 'mint',     name: '아쿠아 민트', main: '#289D9F', sub: '#E1F3F4', title: '#FFFFFF', body: '#053942', bg: '#FFFFFF' },
      { id: 'honey',    name: '허니 베이지', main: '#D97706', sub: '#FFF9E5', title: '#FFFFFF', body: '#572000', bg: '#FFFEFA' },
      { id: 'mocha',    name: '모카 브라운', main: '#6F472F', sub: '#F7F1ED', title: '#FFFFFF', body: '#2B1408', bg: '#FFFFFF' }
    ];

    this.sheetTheme = {
      presetId: 'mono',
      main: '#2E2E2E',
      sub: '#E6E6E6',
      title: '#FFFFFF',
      body: '#1E293B',
      bg: '#FFFFFF'
    };

    // 테마 적용 함수
    this._applySheetTheme = (theme, activePresetId = null) => {
      this.sheetTheme = { ...this.sheetTheme, ...theme };
      if (activePresetId !== null) this.sheetTheme.presetId = activePresetId;

      sheetEl.style.setProperty('--cs-main-color', this.sheetTheme.main);
      sheetEl.style.setProperty('--cs-sub-color', this.sheetTheme.sub);
      sheetEl.style.setProperty('--cs-title-text', this.sheetTheme.title);
      sheetEl.style.setProperty('--cs-body-text', this.sheetTheme.body);
      sheetEl.style.setProperty('--cs-sheet-bg', this.sheetTheme.bg);

      // 인풋 동기화
      if (inMain)   inMain.value   = this.sheetTheme.main;
      if (hexMain)  hexMain.value  = this.sheetTheme.main.toUpperCase();
      if (inSub)    inSub.value    = this.sheetTheme.sub;
      if (hexSub)   hexSub.value   = this.sheetTheme.sub.toUpperCase();
      if (inTitle)  inTitle.value  = this.sheetTheme.title;
      if (hexTitle) hexTitle.value = this.sheetTheme.title.toUpperCase();
      if (inBody)   inBody.value   = this.sheetTheme.body;
      if (hexBody)  hexBody.value  = this.sheetTheme.body.toUpperCase();
      if (inBg)     inBg.value     = this.sheetTheme.bg;
      if (hexBg)    hexBg.value    = this.sheetTheme.bg.toUpperCase();

      // 프리셋 활성 버튼 동기화
      document.querySelectorAll('.cs-theme-ctrl-bar-preset-btn').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.presetId === this.sheetTheme.presetId);
      });

      if (typeof this._syncCompDescWithSheetTheme === 'function') {
        this._syncCompDescWithSheetTheme();
      }
    };

    // ── 인물 더미 색상 연동 헬퍼 ──
    const linkToggle = document.getElementById('theme-link-dummy-toggle');
    this.linkDummyColor = false;

    // 사용자가 시트 테마를 직접 수동 변경하면 연동 토글 자동 해제
    const disableLinkToggle = () => {
      if (this.linkDummyColor) {
        this.linkDummyColor = false;
        if (linkToggle) linkToggle.checked = false;
      }
    };

    this._syncThemeWithDummy = () => {
      if (!this.linkDummyColor) return;
      const activeIdx = this.characters.findIndex(c => c.id === this.activeCharId);
      if (activeIdx < 0) return;
      const dummies = (this.objects || []).filter(o => o.type === 'stickman');
      const targetDummy = dummies[activeIdx] || dummies[0];
      if (targetDummy) {
        // 대표 색상 추출: 가슴(chest) -> 골반(pelvis) -> 머리(head) -> 단일 color
        const repCol = targetDummy.colors?.chest || targetDummy.colors?.pelvis || targetDummy.colors?.head || targetDummy.color;
        if (repCol) {
          this._applySheetTheme({ main: repCol }, 'custom');
        }
      }
    };

    if (linkToggle) {
      linkToggle.addEventListener('change', (e) => {
        e.stopPropagation();
        this.linkDummyColor = linkToggle.checked;
        if (this.linkDummyColor) {
          this._syncThemeWithDummy();
        }
      });
    }

    // 프리셋 버튼들 렌더링
    if (gridEl) {
      gridEl.innerHTML = '';
      PRESETS.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'cs-theme-ctrl-bar-preset-btn' + (p.id === this.sheetTheme.presetId ? ' is-active' : '');
        btn.dataset.presetId = p.id;
        btn.innerHTML = `
          <div class="cs-theme-ctrl-bar-preset-preview">
            <div class="cs-theme-ctrl-bar-preset-preview-main" style="background:${p.main}"></div>
            <div class="cs-theme-ctrl-bar-preset-preview-sub" style="background:${p.sub}"></div>
          </div>
          <span>${p.name}</span>
        `;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          disableLinkToggle();
          this._applySheetTheme(p, p.id);
        });
        gridEl.appendChild(btn);
      });
    }

    // 커스텀 색상 피커 이벤트
    const wireCustomPicker = (picker, hexIn, propName) => {
      if (picker) {
        picker.addEventListener('input', () => {
          const val = picker.value;
          if (hexIn) hexIn.value = val.toUpperCase();
          disableLinkToggle();
          this._applySheetTheme({ [propName]: val }, 'custom');
        });
      }
      if (hexIn) {
        hexIn.addEventListener('input', () => {
          let val = hexIn.value.trim();
          if (!val.startsWith('#')) val = '#' + val;
          if (/^#[0-9a-fA-F]{6}$/.test(val)) {
            if (picker) picker.value = val;
            disableLinkToggle();
            this._applySheetTheme({ [propName]: val }, 'custom');
          }
        });
      }
    };

    wireCustomPicker(inMain, hexMain, 'main');
    wireCustomPicker(inSub, hexSub, 'sub');
    wireCustomPicker(inTitle, hexTitle, 'title');
    wireCustomPicker(inBody, hexBody, 'body');
    wireCustomPicker(inBg, hexBg, 'bg');

    // 리셋 버튼
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        disableLinkToggle();
        const def = PRESETS[0];
        this._applySheetTheme(def, def.id);
      });
    }

    // 팝업 열기/닫기
    const openPopup = () => {
      const rect = toggleBtn.getBoundingClientRect();
      const pw = 290, ph = 450;
      let top = rect.bottom + 6, left = rect.right - pw;
      // 4방향 경계 clamp
      if (left < 8) left = 8;
      if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
      if (top + ph > window.innerHeight - 8) top = rect.top - ph - 6;
      if (top < 8) top = 8;
      popup.style.top = top + 'px';
      popup.style.left = left + 'px';
      popup.style.display = 'flex';
      popup.style.animation = 'none';
      requestAnimationFrame(() => { popup.style.animation = ''; });
    };

    const closePopup = () => { popup.style.display = 'none'; };

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (popup.style.display === 'none') openPopup();
      else closePopup();
    });

    if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closePopup(); });

    document.addEventListener('click', (e) => {
      if (popup.style.display === 'none') return;
      if (!popup.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
        closePopup();
      }
    });
    popup.addEventListener('click', (e) => e.stopPropagation());

    // 초기 테마 1회 적용
    this._applySheetTheme(this.sheetTheme, 'mono');
  }

  // ── 구도 설명란 (Composition Description) 초기화 ──
  _initCompDesc() {
    this.compDesc = {
      visible: true,
      folded: false,
      keypoint: '',
      features: '',
      theme: {
        main: '#2E2E2E',
        sub: '#E6E6E6',
        bg: '#FFFFFF',
        titleText: '#FFFFFF',
        bodyText: '#1E293B',
        fontSize: 13,
        fontWeight: 400
      },
      linkSheetTheme: false
    };

    const outerEl = document.getElementById('cs-comp-outer');
    const headerEl = document.getElementById('cs-comp-header');
    const foldBtn = document.getElementById('cs-comp-fold-btn');
    const themeBtn = document.getElementById('cs-comp-theme-btn');
    const popup = document.getElementById('cs-comp-theme-popup');
    const sideToggle = document.getElementById('canvas-comp-desc-toggle');

    const featuresIn = document.getElementById('cs-comp-features-input');
    const linkToggle = document.getElementById('cs-comp-link-sheet-toggle');

    const inMain = document.getElementById('cs-comp-main-picker');
    const hexMain = document.getElementById('cs-comp-main-hex');
    const inSub = document.getElementById('cs-comp-sub-picker');
    const hexSub = document.getElementById('cs-comp-sub-hex');
    const inBg = document.getElementById('cs-comp-bg-picker');
    const hexBg = document.getElementById('cs-comp-bg-hex');
    const inBody = document.getElementById('cs-comp-body-picker');
    const hexBody = document.getElementById('cs-comp-body-hex');

    const fsRange = document.getElementById('cs-comp-fs-range');
    const fsVal = document.getElementById('cs-comp-fs-val');
    const fwSelect = document.getElementById('cs-comp-fw-select');
    const resetBtn = document.getElementById('cs-comp-reset-btn');

    // 1. 테마 적용 헬퍼
    this._applyCompDescTheme = (th) => {
      if (!th) return;
      this.compDesc.theme = { ...this.compDesc.theme, ...th };
      const t = this.compDesc.theme;

      if (outerEl) {
        outerEl.style.setProperty('--cs-comp-main-color', t.main);
        outerEl.style.setProperty('--cs-comp-sub-color', t.sub);
        outerEl.style.setProperty('--cs-comp-bg-color', t.bg);
        outerEl.style.setProperty('--cs-comp-title-text', t.titleText || '#FFFFFF');
        outerEl.style.setProperty('--cs-comp-body-text', t.bodyText || '#1E293B');
        outerEl.style.setProperty('--cs-comp-font-size', t.fontSize + 'px');
        outerEl.style.setProperty('--cs-comp-font-weight', t.fontWeight);
      }

      // UI 입력 필드들 동기화
      if (inMain) inMain.value = t.main;
      if (hexMain) hexMain.value = t.main.toUpperCase();
      if (inSub) inSub.value = t.sub;
      if (hexSub) hexSub.value = t.sub.toUpperCase();
      if (inBg) inBg.value = t.bg;
      if (hexBg) hexBg.value = t.bg.toUpperCase();
      if (inBody) inBody.value = t.bodyText;
      if (hexBody) hexBody.value = t.bodyText.toUpperCase();
      if (fsRange) fsRange.value = t.fontSize;
      if (fsVal) fsVal.textContent = t.fontSize;
      if (fwSelect) fwSelect.value = String(t.fontWeight);
    };

    // 2. 시트 테마와 연동 헬퍼
    const disableLinkCompDesc = () => {
      if (this.compDesc.linkSheetTheme) {
        this.compDesc.linkSheetTheme = false;
        if (linkToggle) linkToggle.checked = false;
      }
    };

    this._syncCompDescWithSheetTheme = () => {
      if (!this.compDesc.linkSheetTheme) return;
      if (!this.sheetTheme) return;
      this._applyCompDescTheme({
        main: this.sheetTheme.main || '#2E2E2E',
        sub: this.sheetTheme.sub || '#E6E6E6',
        bg: this.sheetTheme.bg || '#FFFFFF',
        titleText: this.sheetTheme.title || '#FFFFFF',
        bodyText: this.sheetTheme.body || '#1E293B'
      });
    };

    // 3. 표시/숨김 토글 (좌측 사이드 패널 스위치)
    if (sideToggle) {
      sideToggle.addEventListener('change', () => {
        this.compDesc.visible = sideToggle.checked;
        if (outerEl) outerEl.classList.toggle('hidden', !this.compDesc.visible);
        setTimeout(() => this._applyRatio(), 300); // CSS 전환(0.28s) 완료 후 재계산
      });
    }

    // 4. 접기/펼치기 토글
    const toggleFold = (e) => {
      if (e) e.stopPropagation();
      this.compDesc.folded = !this.compDesc.folded;
      if (outerEl) outerEl.classList.toggle('folded', this.compDesc.folded);
      if (foldBtn) foldBtn.title = this.compDesc.folded ? '구도 설명란 펼치기' : '구도 설명란 접기';
      setTimeout(() => this._applyRatio(), 300); // CSS 전환(0.28s) 완료 후 재계산
    };

    if (foldBtn) foldBtn.addEventListener('click', toggleFold);
    if (headerEl) {
      headerEl.addEventListener('click', (e) => {
        if (e.target.closest('#cs-comp-theme-btn') || e.target.closest('#cs-comp-fold-btn')) return;
        toggleFold(e);
      });
    }

    // 5. 팝업 열기/닫기
    const closeCdPopup = () => {
      if (popup) popup.style.display = 'none';
    };

    if (themeBtn && popup) {
      themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = popup.style.display !== 'none';
        if (isOpen) {
          closeCdPopup();
        } else {
          popup.style.display = 'block';
          // 팝업 크기를 알기 위해 렌더링 후 위치 계산
          requestAnimationFrame(() => {
            const btnRect = themeBtn.getBoundingClientRect();
            const pw = popup.offsetWidth || 240;
            const ph = popup.offsetHeight || 280;
            let top = btnRect.bottom + 6;
            let left = btnRect.left;
            // 4방향 경계 clamp
            if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
            if (left < 8) left = 8;
            if (top + ph > window.innerHeight - 8) top = btnRect.top - ph - 6;
            if (top < 8) top = 8;
            popup.style.top = top + 'px';
            popup.style.left = left + 'px';
          });
        }
      });
    }

    document.addEventListener('pointerdown', (e) => {
      if (!popup || popup.style.display === 'none') return;
      if (!popup.contains(e.target) && !e.target.closest('#cs-comp-theme-btn')) {
        closeCdPopup();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popup && popup.style.display !== 'none') {
        closeCdPopup();
      }
    });

    if (popup) {
      popup.addEventListener('pointerdown', (e) => e.stopPropagation());
      popup.addEventListener('click', (e) => e.stopPropagation());
    }

    // 6. 시트 테마 연동 토글
    if (linkToggle) {
      linkToggle.addEventListener('change', (e) => {
        e.stopPropagation();
        this.compDesc.linkSheetTheme = linkToggle.checked;
        if (this.compDesc.linkSheetTheme) {
          this._syncCompDescWithSheetTheme();
        }
      });
    }

    // 7. 커스텀 컬러 피커 이벤트
    const wireCdPicker = (picker, hexIn, propName) => {
      if (picker) {
        picker.addEventListener('input', () => {
          const val = picker.value;
          if (hexIn) hexIn.value = val.toUpperCase();
          disableLinkCompDesc();
          this._applyCompDescTheme({ [propName]: val });
        });
      }
      if (hexIn) {
        hexIn.addEventListener('input', () => {
          let val = hexIn.value.trim();
          if (!val.startsWith('#')) val = '#' + val;
          if (/^#[0-9a-fA-F]{6}$/.test(val)) {
            if (picker) picker.value = val;
            disableLinkCompDesc();
            this._applyCompDescTheme({ [propName]: val });
          }
        });
      }
    };

    wireCdPicker(inMain, hexMain, 'main');
    wireCdPicker(inSub, hexSub, 'sub');
    wireCdPicker(inBg, hexBg, 'bg');
    wireCdPicker(inBody, hexBody, 'bodyText');

    // 8. 폰트 크기 / 굵기
    if (fsRange) {
      fsRange.addEventListener('input', () => {
        const val = parseInt(fsRange.value, 10);
        if (fsVal) fsVal.textContent = val;
        this._applyCompDescTheme({ fontSize: val });
      });
    }

    if (fwSelect) {
      fwSelect.addEventListener('change', () => {
        const val = parseInt(fwSelect.value, 10);
        this._applyCompDescTheme({ fontWeight: val });
      });
    }

    // 9. 리셋 버튼
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        disableLinkCompDesc();
        this._applyCompDescTheme({
          main: '#2E2E2E',
          sub: '#E6E6E6',
          bg: '#FFFFFF',
          titleText: '#FFFFFF',
          bodyText: '#1E293B',
          fontSize: 13,
          fontWeight: 400
        });
      });
    }

    if (featuresIn) {
      featuresIn.addEventListener('input', () => {
        this.compDesc.features = (featuresIn.innerText || featuresIn.textContent || '').replace(/\r\n|\r|\n/g, '\n');
      });
      featuresIn.addEventListener('keydown', (e) => {
        e.stopPropagation();
      });
    }

    // 초기 테마 적용
    this._applyCompDescTheme(this.compDesc.theme);
  }

  // ── 컬러칩 색상 + 그라디언트 + 이미지 + 도형 레이어 피커 ──
  _initChipColorPicker() {
    const popup       = document.getElementById('cs-chip-color-popup');
    const picker      = document.getElementById('cs-chip-picker');
    const hexInput    = document.getElementById('cs-chip-hex');
    const clearBtn    = document.getElementById('cs-chip-clear-btn');
    const labelEl     = document.getElementById('cs-chip-popup-label');
    const tabColor    = document.getElementById('cs-chip-tab-color');
    const tabGradient = document.getElementById('cs-chip-tab-gradient');
    const tabImage    = document.getElementById('cs-chip-tab-image');
    const tabDraw     = document.getElementById('cs-chip-tab-draw');
    const gradPreview = document.getElementById('cs-chip-grad-preview');
    const gradStopsEl = document.getElementById('cs-chip-grad-stops');
    const gradAddBtn  = document.getElementById('cs-chip-grad-add');
    const imgDrop     = document.getElementById('cs-chip-img-drop');
    const imgFile     = document.getElementById('cs-chip-img-file');
    const imgClear    = document.getElementById('cs-chip-img-clear');
    const drawCanvas  = document.getElementById('cs-chip-draw-canvas');
    const drawToggle  = document.getElementById('cs-chip-draw-toggle');
    const drawBadge   = document.getElementById('cs-chip-draw-status-badge');
    const drawColorIn = document.getElementById('cs-chip-draw-color');
    const drawSizeIn  = document.getElementById('cs-chip-draw-size');
    const drawClearBt = document.getElementById('cs-chip-draw-clear');
    if (!popup || !picker || !hexInput) return;

    let activeChip = null;
    let activeTab  = 'color';
    let gradStops  = ['#ffffff', '#aaaaaa'];
    let gradDir    = 180;

    const chipState  = new Map();
    const chipLabels = { thema:'THEMA', hair:'HAIR', eyel:'EYE(L)', eyer:'EYE(R)', skin:'SKIN' };

    const getDefaultState = (defaultColor = '#ffffff') => ({
      baseMode: 'color', // 'color' | 'gradient' | 'image'
      color: defaultColor,
      gradient: { stops: [defaultColor, '#aaaaaa'], dir: 180 },
      imageUrl: null,
      shapeEnabled: false,
      shapeData: { shape: 'circle', shapeColor: '#1a1a1a', size: 65 }
    });

    // ── RGB → HEX ────────────────────────────────
    const rgbToHex = (color) => {
      if (!color || color === 'transparent') return '#ffffff';
      if (color.startsWith('#')) return color;
      const tmp = document.createElement('div');
      tmp.style.color = color; document.body.appendChild(tmp);
      const rgb = getComputedStyle(tmp).color; document.body.removeChild(tmp);
      const m = rgb.match(/\d+/g);
      return m ? '#' + m.slice(0,3).map(v => (+v).toString(16).padStart(2,'0')).join('') : '#ffffff';
    };

    // ── 도형 패스 함수들 ──────────────────────────
    const pathCircle  = (ctx, cx, cy, r) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); };
    const pathOval    = (ctx, cx, cy, r) => { ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.33, r, 0, 0, 2 * Math.PI); };
    const pathDot     = (ctx, cx, cy, r) => { ctx.beginPath(); ctx.arc(cx, cy, r * 0.40, 0, 2 * Math.PI); };
    const pathSparkle = (ctx, cx, cy, r) => {
      const ry = r, rx = r * 0.58;
      ctx.beginPath();
      ctx.moveTo(cx, cy - ry);
      ctx.quadraticCurveTo(cx, cy, cx + rx, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy + ry);
      ctx.quadraticCurveTo(cx, cy, cx - rx, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy - ry);
      ctx.closePath();
    };

    // ── 특정 캔버스에 도형 렌더링 ─────────────────
    const drawShapeOnContext = (ctx, W, H, shapeData) => {
      const cx = W / 2, cy = H / 2;
      const r  = (Math.min(W, H) / 2 - 2) * (shapeData.size / 100);
      ctx.fillStyle   = shapeData.shapeColor;
      ctx.strokeStyle = shapeData.shapeColor;

      if (shapeData.shape === 'ring') {
        ctx.lineWidth = Math.max(2, r * 0.13);
        pathCircle(ctx, cx, cy, r);
        ctx.stroke();
      } else if (shapeData.shape === 'bullseye') {
        ctx.lineWidth = Math.max(2, r * 0.11);
        pathCircle(ctx, cx, cy, r);
        ctx.stroke();
        pathCircle(ctx, cx, cy, r * 0.42);
        ctx.fill();
      } else if (shapeData.shape === 'circle')  { pathCircle(ctx, cx, cy, r);  ctx.fill(); }
      else if (shapeData.shape === 'oval')      { pathOval(ctx, cx, cy, r);    ctx.fill(); }
      else if (shapeData.shape === 'dot')       { pathDot(ctx, cx, cy, r);     ctx.fill(); }
      else if (shapeData.shape === 'sparkle')   { pathSparkle(ctx, cx, cy, r); ctx.fill(); }
    };

    // ── 투명 오프스크린 캔버스에서 도형 dataURL 생성 ──
    const getShapeDataUrl = (shapeData) => {
      const off = document.createElement('canvas');
      off.width = 200; off.height = 200;
      const ctx = off.getContext('2d');
      drawShapeOnContext(ctx, 200, 200, shapeData);
      return off.toDataURL('image/png');
    };

    // ── 칩 디스플레이 갱신 (베이스 + 도형 레이어 합성) ─
    const updateChipDisplay = (chipEl, st) => {
      if (!chipEl || !st) return;
      const shapeUrl = st.shapeEnabled ? getShapeDataUrl(st.shapeData) : null;

      // 보류 2번: 마우스 호버 시 색상/상태 정보 툴팁(Hex 등) 제공 (CSS 툴팁으로 변경)
      if (st.baseMode === 'color') {
        chipEl.setAttribute('data-tooltip', st.color || '#ffffff');
      } else if (st.baseMode === 'gradient') {
        chipEl.setAttribute('data-tooltip', `그라데이션: ${st.gradient.stops.join(', ')}`);
      } else if (st.baseMode === 'pattern') {
        chipEl.setAttribute('data-tooltip', `패턴 적용됨`);
      }
      chipEl.removeAttribute('title');

      if (st.baseMode === 'color') {
        chipEl.style.backgroundColor = st.color || '#ffffff';
        if (shapeUrl) {
          chipEl.style.backgroundImage    = `url(${shapeUrl})`;
          chipEl.style.backgroundSize     = 'contain';
          chipEl.style.backgroundPosition = 'center';
          chipEl.style.backgroundRepeat   = 'no-repeat';
        } else {
          chipEl.style.backgroundImage    = '';
        }
      } else if (st.baseMode === 'gradient') {
        const gradCss = `linear-gradient(${st.gradient.dir}deg, ${st.gradient.stops.join(', ')})`;
        chipEl.style.backgroundColor = 'transparent';
        if (shapeUrl) {
          chipEl.style.backgroundImage    = `url(${shapeUrl}), ${gradCss}`;
          chipEl.style.backgroundSize     = 'contain, 100% 100%';
          chipEl.style.backgroundPosition = 'center, center';
          chipEl.style.backgroundRepeat   = 'no-repeat, no-repeat';
        } else {
          chipEl.style.backgroundImage    = gradCss;
          chipEl.style.backgroundSize     = '100% 100%';
          chipEl.style.backgroundPosition = 'center';
          chipEl.style.backgroundRepeat   = 'no-repeat';
        }
      } else if (st.baseMode === 'image') {
        chipEl.style.backgroundColor = 'transparent';
        if (shapeUrl) {
          chipEl.style.backgroundImage    = `url(${shapeUrl}), url(${st.imageUrl})`;
          chipEl.style.backgroundSize     = 'contain, cover';
          chipEl.style.backgroundPosition = 'center, center';
          chipEl.style.backgroundRepeat   = 'no-repeat, no-repeat';
        } else {
          chipEl.style.backgroundImage    = `url(${st.imageUrl})`;
          chipEl.style.backgroundSize     = 'cover';
          chipEl.style.backgroundPosition = 'center';
          chipEl.style.backgroundRepeat   = 'no-repeat';
        }
      }
    };

    // ── 도형 탭 캔버스 미리보기 갱신 ──────────────
    const renderDrawCanvas = (st) => {
      if (!drawCanvas || !st) return;
      const ctx = drawCanvas.getContext('2d');
      const W = drawCanvas.width, H = drawCanvas.height;
      ctx.clearRect(0, 0, W, H);

      if (drawToggle) drawToggle.checked = !!st.shapeEnabled;
      if (drawBadge) {
        drawBadge.className = 'cs-chip-status-badge ' + (st.shapeEnabled ? 'on' : 'off');
        drawBadge.textContent = st.shapeEnabled ? 'ON' : 'OFF';
      }

      ctx.save();
      if (!st.shapeEnabled) {
        ctx.globalAlpha = 0.32; // 꺼진 상태에서는 은은한 가이드로 표시
      } else {
        ctx.globalAlpha = 1.0;
      }
      drawShapeOnContext(ctx, W, H, st.shapeData);
      ctx.restore();
    };

    // ── 탭 전환 ──────────────────────────────────
    const switchTab = (tab) => {
      activeTab = tab;
      document.querySelectorAll('.cs-chip-tab').forEach(b =>
        b.classList.toggle('is-active', b.dataset.tab === tab));
      tabColor.style.display    = tab === 'color'    ? 'block' : 'none';
      tabGradient.style.display = tab === 'gradient' ? 'block' : 'none';
      tabImage.style.display    = tab === 'image'    ? 'block' : 'none';
      if (tabDraw) tabDraw.style.display = tab === 'draw' ? 'block' : 'none';

      if (tab === 'draw' && activeChip) {
        const key = activeChip.dataset.csChipKey;
        const st  = chipState.get(key) || getDefaultState();
        renderDrawCanvas(st);
      }
    };
    document.querySelectorAll('.cs-chip-tab').forEach(b =>
      b.addEventListener('click', (e) => { e.stopPropagation(); switchTab(b.dataset.tab); }));

    // ── 팝업 위치 (4방향 경계 clamp) ───────────────
    const positionPopup = (chipEl) => {
      const rect = chipEl.getBoundingClientRect();
      let top = rect.bottom + 6, left = rect.left;
      const pw = 280, ph = 410;
      if (left + pw > window.innerWidth  - 8) left = window.innerWidth  - pw - 8;
      if (left < 8) left = 8;
      if (top  + ph > window.innerHeight - 8) top  = rect.top - ph - 6;
      if (top < 8) top = 8;
      popup.style.top = top + 'px'; popup.style.left = left + 'px';
    };

    // ── 단색 적용 ────────────────────────────────
    const applyColor = (hex) => {
      if (!activeChip) return;
      const key = activeChip.dataset.csChipKey;
      const st  = chipState.get(key) || getDefaultState();
      st.baseMode = 'color';
      st.color = hex;
      chipState.set(key, st);
      picker.value = hex; hexInput.value = hex.toUpperCase();
      updateChipDisplay(activeChip, st);
    };

    // ── 이미지 적용 ──────────────────────────────
    const applyImage = (dataUrl) => {
      if (!activeChip) return;
      const key = activeChip.dataset.csChipKey;
      const st  = chipState.get(key) || getDefaultState();
      st.baseMode = 'image';
      st.imageUrl = dataUrl;
      chipState.set(key, st);
      imgDrop.style.backgroundImage    = `url(${dataUrl})`;
      imgDrop.style.backgroundSize     = 'cover';
      imgDrop.style.backgroundPosition = 'center';
      imgDrop.classList.add('has-image');
      imgClear.style.display = 'flex';
      updateChipDisplay(activeChip, st);
    };

    // ── 이미지 제거 ──────────────────────────────
    const clearImage = () => {
      if (!activeChip) return;
      const key = activeChip.dataset.csChipKey;
      const st  = chipState.get(key) || getDefaultState();
      st.baseMode = 'color';
      st.imageUrl = null;
      chipState.set(key, st);
      imgDrop.style.backgroundImage = '';
      imgDrop.classList.remove('has-image');
      imgClear.style.display = 'none';
      updateChipDisplay(activeChip, st);
    };

    // ── 그라디언트: 프리뷰 + 칩 ─────────────────
    const updateGradPreview = () => {
      const css = `linear-gradient(${gradDir}deg, ${gradStops.join(', ')})`;
      if (gradPreview) gradPreview.style.background = css;
      if (!activeChip) return;
      const key = activeChip.dataset.csChipKey;
      const st  = chipState.get(key) || getDefaultState();
      st.baseMode = 'gradient';
      st.gradient = { stops: [...gradStops], dir: gradDir };
      chipState.set(key, st);
      updateChipDisplay(activeChip, st);
    };

    // ── 그라디언트: 정지점 렌더링 ────────────────
    const renderGradStops = () => {
      if (!gradStopsEl) return;
      gradStopsEl.innerHTML = '';
      gradStops.forEach((color, i) => {
        const wrap = document.createElement('div'); wrap.className = 'cs-chip-grad-stop-wrap';

        // 컬러 스와치 (type=color)
        const inp = document.createElement('input');
        inp.type = 'color'; inp.className = 'cs-chip-grad-swatch'; inp.value = color;

        // HEX 텍스트 입력
        const hexInp = document.createElement('input');
        hexInp.type = 'text';
        hexInp.className = 'cs-chip-grad-hex-input';
        hexInp.value = color.toUpperCase();
        hexInp.maxLength = 7;
        hexInp.placeholder = '#RRGGBB';

        // 스와치 → hex 텍스트 동기화
        inp.addEventListener('input', () => {
          gradStops[i] = inp.value;
          hexInp.value = inp.value.toUpperCase();
          updateGradPreview();
        });

        // hex 텍스트 → 스와치 동기화
        hexInp.addEventListener('input', () => {
          let v = hexInp.value.trim();
          if (!v.startsWith('#')) v = '#' + v;
          if (/^#[0-9a-fA-F]{6}$/.test(v)) {
            gradStops[i] = v;
            inp.value = v;
            updateGradPreview();
          }
        });
        hexInp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            let v = hexInp.value.trim();
            if (!v.startsWith('#')) v = '#' + v;
            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
              gradStops[i] = v;
              inp.value = v;
              hexInp.value = v.toUpperCase();
              updateGradPreview();
            }
          }
        });
        hexInp.addEventListener('click', (e) => e.stopPropagation());

        wrap.appendChild(inp);
        wrap.appendChild(hexInp);

        if (gradStops.length > 2) {
          const rm = document.createElement('button');
          rm.className = 'cs-chip-grad-rm-btn'; rm.title = '이 색상 제거';
          rm.innerHTML = '<i class="fa-solid fa-xmark"></i>';
          rm.addEventListener('click', (e) => {
            e.stopPropagation(); gradStops.splice(i, 1); renderGradStops(); updateGradPreview();
          });
          wrap.appendChild(rm);
        }
        gradStopsEl.appendChild(wrap);
      });
      if (gradAddBtn) gradAddBtn.style.display = gradStops.length >= 3 ? 'none' : 'flex';
    };

    // ── 그라디언트: 방향 버튼 ────────────────────
    document.querySelectorAll('.cs-chip-grad-dir').forEach(btn =>
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.cs-chip-grad-dir').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active'); gradDir = parseInt(btn.dataset.deg); updateGradPreview();
      }));
    if (gradAddBtn) gradAddBtn.addEventListener('click', (e) => {
      e.stopPropagation(); if (gradStops.length >= 3) return;
      gradStops.push('#888888'); renderGradStops(); updateGradPreview();
    });

    // ── 도형 탭 이벤트 ───────────────────────────
    if (drawCanvas) {
      if (drawToggle) {
        drawToggle.addEventListener('change', () => {
          if (!activeChip) return;
          const key = activeChip.dataset.csChipKey;
          const st  = chipState.get(key) || getDefaultState();
          st.shapeEnabled = drawToggle.checked;
          chipState.set(key, st);
          updateChipDisplay(activeChip, st);
          renderDrawCanvas(st);
        });
      }

      document.querySelectorAll('.cs-chip-draw-shape').forEach(btn =>
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          document.querySelectorAll('.cs-chip-draw-shape').forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          if (!activeChip) return;
          const key = activeChip.dataset.csChipKey;
          const st  = chipState.get(key) || getDefaultState();
          st.shapeData.shape = btn.dataset.shape;
          st.shapeEnabled = true; // 도형 버튼을 누르면 자동으로 레이어 켜짐
          chipState.set(key, st);
          updateChipDisplay(activeChip, st);
          renderDrawCanvas(st);
        }));

      if (drawColorIn) {
        drawColorIn.addEventListener('input', () => {
          if (!activeChip) return;
          const key = activeChip.dataset.csChipKey;
          const st  = chipState.get(key) || getDefaultState();
          st.shapeData.shapeColor = drawColorIn.value;
          chipState.set(key, st);
          updateChipDisplay(activeChip, st);
          renderDrawCanvas(st);
        });
      }

      if (drawSizeIn) {
        drawSizeIn.addEventListener('input', () => {
          if (!activeChip) return;
          const key = activeChip.dataset.csChipKey;
          const st  = chipState.get(key) || getDefaultState();
          st.shapeData.size = parseInt(drawSizeIn.value);
          chipState.set(key, st);
          updateChipDisplay(activeChip, st);
          renderDrawCanvas(st);
        });
      }

      if (drawClearBt) {
        drawClearBt.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!activeChip) return;
          const key = activeChip.dataset.csChipKey;
          const st  = chipState.get(key) || getDefaultState();
          st.shapeEnabled = false; // 레이어 끄기
          st.shapeData = { shape: 'circle', shapeColor: '#1a1a1a', size: 65 };
          chipState.set(key, st);

          if (drawColorIn) drawColorIn.value = st.shapeData.shapeColor;
          if (drawSizeIn)  drawSizeIn.value  = String(st.shapeData.size);
          document.querySelectorAll('.cs-chip-draw-shape').forEach(b =>
            b.classList.toggle('is-active', b.dataset.shape === 'circle'));

          updateChipDisplay(activeChip, st);
          renderDrawCanvas(st);
        });
      }
    }

    // ── 팝업 열기 ────────────────────────────────
    const openPopup = (chipEl) => {
      activeChip = chipEl;
      const key  = chipEl.dataset.csChipKey || '';
      labelEl.textContent = chipLabels[key] || key.toUpperCase();

      let st = chipState.get(key);
      if (!st) {
        const initBg = rgbToHex(chipEl.style.backgroundColor || '#ffffff');
        st = getDefaultState(initBg);
        chipState.set(key, st);
      }

      // 색상탭 동기화
      picker.value = st.color || '#ffffff';
      hexInput.value = (st.color || '#ffffff').toUpperCase();

      // 그라디언트탭 동기화
      gradStops = st.gradient ? [...st.gradient.stops] : [st.color || '#ffffff', '#aaaaaa'];
      gradDir   = st.gradient ? st.gradient.dir : 180;
      renderGradStops();
      if (gradPreview) gradPreview.style.background = `linear-gradient(${gradDir}deg, ${gradStops.join(', ')})`;
      document.querySelectorAll('.cs-chip-grad-dir').forEach(b =>
        b.classList.toggle('is-active', parseInt(b.dataset.deg) === gradDir));

      // 이미지탭 동기화
      if (st.imageUrl) {
        imgDrop.style.backgroundImage    = `url(${st.imageUrl})`;
        imgDrop.style.backgroundSize     = 'cover';
        imgDrop.style.backgroundPosition = 'center';
        imgDrop.classList.add('has-image');
        imgClear.style.display = 'flex';
      } else {
        imgDrop.style.backgroundImage = '';
        imgDrop.classList.remove('has-image');
        imgClear.style.display = 'none';
      }

      // 도형탭 동기화
      if (drawColorIn) drawColorIn.value = st.shapeData.shapeColor;
      if (drawSizeIn)  drawSizeIn.value  = String(st.shapeData.size);
      document.querySelectorAll('.cs-chip-draw-shape').forEach(b =>
        b.classList.toggle('is-active', b.dataset.shape === st.shapeData.shape));
      renderDrawCanvas(st);

      // 열릴 때 기본 탭은 baseMode
      switchTab(st.baseMode || 'color');

      popup.style.display = 'flex';
      positionPopup(chipEl);
      popup.style.animation = 'none';
      requestAnimationFrame(() => { popup.style.animation = ''; });
      setTimeout(() => { if (activeTab === 'color') hexInput.select(); }, 50);
    };

    // ── 팝업 닫기 ────────────────────────────────
    const closePopup = () => { popup.style.display = 'none'; activeChip = null; };

    // ── 칩 클릭 ──────────────────────────────────
    document.querySelectorAll('.cs-color-swatch').forEach(chip =>
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        if (popup.style.display !== 'none' && activeChip === chip) closePopup();
        else openPopup(chip);
      }));

    // ── 색상탭 이벤트 ────────────────────────────
    picker.addEventListener('input', () => applyColor(picker.value));
    hexInput.addEventListener('input', () => {
      let v = hexInput.value.trim();
      if (!v.startsWith('#')) v = '#' + v;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) applyColor(v);
    });
    hexInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === 'Escape') closePopup();
    });
    clearBtn.addEventListener('click', (e) => { e.stopPropagation(); applyColor('#ffffff'); });

    // ── 이미지탭 이벤트 ──────────────────────────
    imgDrop.addEventListener('click', (e) => { e.stopPropagation(); imgFile.click(); });
    imgFile.addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader(); r.onload = (ev) => applyImage(ev.target.result);
      r.readAsDataURL(f); imgFile.value = '';
    });
    imgDrop.addEventListener('dragover',  (e) => { e.preventDefault(); imgDrop.classList.add('drag-over'); });
    imgDrop.addEventListener('dragleave', () => imgDrop.classList.remove('drag-over'));
    imgDrop.addEventListener('drop', (e) => {
      e.preventDefault(); imgDrop.classList.remove('drag-over');
      const f = e.dataTransfer.files[0];
      if (!f || !f.type.startsWith('image/')) return;
      const r = new FileReader(); r.onload = (ev) => applyImage(ev.target.result); r.readAsDataURL(f);
    });

    if (imgClear) imgClear.addEventListener('click', (e) => { e.stopPropagation(); clearImage(); });

    // ── 바깥 클릭 닫기 (어디든 팝업 바깥을 클릭하면 즉시 닫힘) ──
    document.addEventListener('pointerdown', (e) => {
      if (popup.style.display === 'none') return;
      if (!popup.contains(e.target) && !e.target.closest('.cs-color-swatch')) {
        closePopup();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popup.style.display !== 'none') {
        closePopup();
      }
    });

    popup.addEventListener('pointerdown', (e) => e.stopPropagation());
    popup.addEventListener('click', (e) => e.stopPropagation());

    // ── 캐릭터 전환용 컬러칩 상태 일괄 내보내기/복원 API ──
    this._getAllChipsState = () => {
      const result = {};
      document.querySelectorAll('.cs-color-swatch').forEach(chip => {
        const key = chip.dataset.csChipKey;
        if (key) {
          const st = chipState.get(key) || getDefaultState(rgbToHex(chip.style.backgroundColor || '#ffffff'));
          result[key] = JSON.parse(JSON.stringify(st));
        }
      });
      return result;
    };

    this._restoreAllChipsState = (savedChips) => {
      document.querySelectorAll('.cs-color-swatch').forEach(chip => {
        const key = chip.dataset.csChipKey;
        if (!key) return;
        const st = (savedChips && savedChips[key]) ? JSON.parse(JSON.stringify(savedChips[key])) : getDefaultState('#ffffff');
        chipState.set(key, st);
        updateChipDisplay(chip, st);
      });
    };
  }
}

// ── BOOTSTRAP ────────────────────────────────────
function registerArrowMarker(svg) {
  let defs = svg.querySelector('defs');
  if (!defs) { defs = svgEl('defs'); svg.prepend(defs); }
  
  const createMarker = (id, fill) => {
    const marker = svgEl('marker', { id: id, viewBox:'0 0 10 10',
      refX:'8', refY:'5', markerWidth:'5', markerHeight:'5', orient:'auto-start-reverse' });
    const path = svgEl('path', { d:'M 0 1 L 10 5 L 0 9 z', fill: fill });
    marker.appendChild(path); defs.appendChild(marker);
  };

  createMarker('arrow-head', 'context-stroke');
  createMarker('arrow-head-white', '#ffffff');
  createMarker('arrow-head-black', '#000000');
}

function registerOutlineFilters(svg) {
  let defs = svg.querySelector('defs');
  if (!defs) { defs = svgEl('defs'); svg.prepend(defs); }
  
  const addFilter = (id, color) => {
    const filter = svgEl('filter', { id: id, x: "-20%", y: "-20%", width: "140%", height: "140%" });
    const feMorphology = svgEl('feMorphology', { in: "SourceAlpha", operator: "dilate", radius: "1.5", result: "DILATED" });
    const feFlood = svgEl('feFlood', { floodColor: color, floodOpacity: "1", result: "FLOOD" });
    const feComposite = svgEl('feComposite', { in: "FLOOD", in2: "DILATED", operator: "in", result: "OUTLINE" });
    const feMerge = svgEl('feMerge');
    feMerge.appendChild(svgEl('feMergeNode', { in: "OUTLINE" }));
    feMerge.appendChild(svgEl('feMergeNode', { in: "SourceGraphic" }));
    
    filter.appendChild(feMorphology);
    filter.appendChild(feFlood);
    filter.appendChild(feComposite);
    filter.appendChild(feMerge);
    defs.appendChild(filter);
  };
  
  addFilter('filter-outline-white', '#ffffff');
  addFilter('filter-outline-black', '#000000');
}

window.addEventListener('DOMContentLoaded', () => {
  const mainSvg = document.getElementById('main-svg');
  registerArrowMarker(mainSvg);
  registerOutlineFilters(mainSvg);
  CommissionApp.App = new App();
  window.app = CommissionApp.App; // 하위 호환성 유지 (free-objects.js 등에서 참조)

  // 색상 칩 툴팁 및 초기 상태 강제 동기화 (보류 2번)
  if (CommissionApp.App._restoreAllChipsState) {
    CommissionApp.App._restoreAllChipsState();
  }

  // ── MOBILE ENVIRONMENT DETECTION & WARNING MODAL ──────────────
  // 판단 기준(복합):
  //   1. pointer:coarse  → 터치/스타일러스 기본 포인팅 장치 (CSS Media Query)
  //   2. hover:none      → 마우스 hover 기능 없음 (CSS Media Query)
  //   3. UA 문자열       → 공통 스마트폰 UA 패턴 (보조)
  //   4. 화면 폭         → 768px 미만 (portrait 스마트폰 기준)
  // 오탐 방지: 조건 1+2(CSS MQ)가 동시 성립해야 터치 기기로 확정.
  //   데스크톱에서 창 크기만 줄인 경우 pointer:coarse는 false이므로 오탐 없음.
  (function initMobileWarning() {
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hasNoHover = window.matchMedia('(hover: none)').matches;
    const mobileUaPattern = /Android|iPhone|iPod|Windows Phone/i;
    const isMobileUA = mobileUaPattern.test(navigator.userAgent);
    const isNarrowScreen = window.screen.width < 768;

    // "터치 전용 + hover 없음" 동시 성립 OR UA가 스마트폰 + 좁은 화면
    const isMobile = (isCoarsePointer && hasNoHover) ||
                     (isMobileUA && isNarrowScreen);

    if (!isMobile) return; // 모바일 아님 → 즉시 종료, 데스크톱 UI 완전 무관

    // sessionStorage: 같은 탭 세션 내 반복 표시 방지
    // 새 탭 열기·브라우저 재시작 시에는 다시 표시 (localStorage 불필요)
    const SESSION_KEY = 'ch_mobile_warned';
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');

    const modal = document.getElementById('mobile-warning-modal');
    if (!modal) return;

    // App() 마운트 완료 후 표시. 기존 openModalWithFocus 유틸 재사용.
    requestAnimationFrame(() => {
      openModalWithFocus(modal, null);
    });

    // "알겠습니다" 버튼 → 기존 alert/confirm 모달 정책과 동일하게 버튼으로만 닫음
    document.getElementById('mobile-warning-ok')?.addEventListener('click', () => {
      closeModalWithFocus(modal);
    });
  })();
  // ─────────────────────────────────────────────────────────────

  // ── STARTUP TUTORIAL PROMPT MODAL ──────────────
  (function initStartupPrompt() {
    const startupModal = document.getElementById('startup-modal');
    if (!startupModal) return;

    const TUTORIAL_KEY = 'ch_tutorial_prompt_seen';
    const urlParams = new URLSearchParams(window.location.search);
    const forceShow = urlParams.has('startup') || urlParams.has('tutorial');

    if (urlParams.has('reset_tutorial')) {
      localStorage.removeItem(TUTORIAL_KEY);
    }

    if (!forceShow && localStorage.getItem(TUTORIAL_KEY)) return;

    requestAnimationFrame(() => {
      openModalWithFocus(startupModal, null);
    });

    const markSeenAndClose = () => {
      if (!forceShow) {
        localStorage.setItem(TUTORIAL_KEY, '1');
      }
      closeModalWithFocus(startupModal);
    };

    document.getElementById('startup-tutorial-btn')?.addEventListener('click', () => {
      markSeenAndClose();
      const tutBtn = document.getElementById('tutorial-btn');
      if (tutBtn) tutBtn.click();
    });

    document.getElementById('startup-close-btn')?.addEventListener('click', markSeenAndClose);
    document.getElementById('startup-close-top')?.addEventListener('click', markSeenAndClose);

    // 언제든 테스트/확인할 수 있도록 전역 함수로 제공
    window.showStartupModal = () => {
      openModalWithFocus(startupModal, null);
    };
    window.resetTutorialPrompt = () => {
      localStorage.removeItem(TUTORIAL_KEY);
      location.reload();
    };
  })();
  // ─────────────────────────────────────────────────────────────
  // ── 수평 정렬 토글 이벤트 바인딩 ──────────────
  document.querySelectorAll('.cs-align-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;
      
      const currentAlign = targetEl.getAttribute('data-align') || 'left';
      let newAlign = 'left';
      if (currentAlign === 'left') newAlign = 'center';
      else if (currentAlign === 'center') newAlign = 'right';
      
      targetEl.setAttribute('data-align', newAlign);
      
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = 'fa-solid fa-align-' + newAlign;
      }
      
      const ev = new Event('input', { bubbles: true });
      targetEl.dispatchEvent(ev);
    });
  });
  // ─────────────────────────────────────────────────────────────

  setTimeout(() => {
    const row1 = document.querySelector('.cs-lower-row-top');
    const left = row1?.querySelector('.cs-lower-left');
    const right = row1?.querySelector('.cs-lower-right');
    const block = row1?.querySelector('.cs-block');
    const subGrid = row1?.querySelector('.cs-sub-grid');

  }, 100);
});
