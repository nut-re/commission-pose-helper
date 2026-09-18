// ─────────────────────────────────────────────────────────────────────────────
// history-manager.js
// Undo / Redo 히스토리 관리 모듈
//
// 의존: normalizePartOffsets() (skeleton-engine.js 전역 함수)
// 사용: CommissionApp.HistoryManager.init(accessors)
//       CommissionApp.HistoryManager.push()
//       CommissionApp.HistoryManager.undo()
//       CommissionApp.HistoryManager.redo()
//       CommissionApp.HistoryManager.reset()
//
// accessors = {
//   getObjects()        → 현재 objects 배열 반환
//   getBg()             → 현재 canvasBg 문자열 반환
//   setObjects(arr)     → objects 배열 교체
//   setBg(color)        → canvasBg 색상 교체
//   selectNull()        → app._select(null) 호출
//   render()            → app._render() 호출
//   updateUndoRedoBtns(canUndo, canRedo) → 버튼 상태 갱신
// }
// ─────────────────────────────────────────────────────────────────────────────

(function (CommissionApp) {
  'use strict';

  const MAX_HISTORY = 10;

  let _history      = [];
  let _historyIndex = -1;
  let _ax           = null; // accessors

  // ── 내부: 스냅샷 직렬화 ────────────────────────────────────
  function _snapshot() {
    return JSON.stringify({
      objects:  _ax.getObjects(),
      canvasBg: _ax.getBg()
    });
  }

  // ── 내부: 버튼 상태 갱신 ───────────────────────────────────
  function _syncBtns() {
    _ax.updateUndoRedoBtns(
      _historyIndex > 0,
      _historyIndex >= 0 && _historyIndex < _history.length - 1
    );
  }

  // ── 내부: 스냅샷 복원 ──────────────────────────────────────
  function _restore(snapshotStr) {
    const snapshot = JSON.parse(snapshotStr);
    let objs = snapshot.objects;
    // 과거 오염된 세이브 데이터 로드 시 자동 정규화 복구
    objs.forEach(o => {
      if (o.type === 'stickman' && o.partOffsets) {
        o.partOffsets = normalizePartOffsets(o.partOffsets);
      }
    });
    _ax.setObjects(objs);
    _ax.setBg(snapshot.canvasBg);
    _ax.selectNull();

    // bg picker UI 동기화
    const bgPicker = document.getElementById('bg-picker');
    const bgHex    = document.getElementById('bg-hex');
    if (bgPicker) bgPicker.value = snapshot.canvasBg;
    if (bgHex)    bgHex.value    = snapshot.canvasBg;
    document.getElementById('svg-bg')?.setAttribute('fill', snapshot.canvasBg);

    _ax.render();
  }

  // ── 공개 API ───────────────────────────────────────────────

  /**
   * HistoryManager를 초기화합니다.
   * @param {Object} accessors - App 상태 접근 콜백 묶음 (위 JSDoc 참조)
   */
  function init(accessors) {
    _ax = accessors;
    _history      = [];
    _historyIndex = -1;
    _syncBtns();
  }

  /** 현재 상태를 히스토리에 저장합니다. */
  function push() {
    if (!_ax) return;
    const snap = _snapshot();
    // 이전 스냅샷과 완전히 동일하면 중복 저장 안 함
    if (_historyIndex >= 0 && _history[_historyIndex] === snap) return;
    // 인덱스 이후 미래 히스토리 삭제
    _history = _history.slice(0, _historyIndex + 1);
    _history.push(snap);
    if (_history.length > MAX_HISTORY) _history.shift();
    _historyIndex = _history.length - 1;
    _syncBtns();
  }

  /** 한 단계 되돌립니다. */
  function undo() {
    if (!_ax || _historyIndex <= 0) return;
    _historyIndex--;
    _restore(_history[_historyIndex]);
    _syncBtns();
  }

  /** 한 단계 다시 실행합니다. */
  function redo() {
    if (!_ax || _historyIndex < 0 || _historyIndex >= _history.length - 1) return;
    _historyIndex++;
    _restore(_history[_historyIndex]);
    _syncBtns();
  }

  /** 히스토리를 완전히 초기화합니다. (전체 초기화 시 사용) */
  function reset() {
    _history      = [];
    _historyIndex = -1;
    if (_ax) _syncBtns();
  }

  // ── 네임스페이스 등록 ─────────────────────────────────────
  CommissionApp.HistoryManager = { init, push, undo, redo, reset };

})(window.CommissionApp = window.CommissionApp || {});
