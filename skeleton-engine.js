// ─────────────────────────────────────────────────────────────────────────────
// skeleton-engine.js
// 스틱맨 뼈대 물리 엔진 — 순수 계산 함수 모음
//
// 의존: rotatePt() (app.js 전역 함수, app.js 이후 로드됨)
// 사용: calcSkeleton(s), defaultAngles(), defaultPartOffsets(), normalizePartOffsets(offsets)
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

/**
 * Rank 기반 무손실 정규화 알고리즘
 * 오염된 오프셋 수치(예: 120조)의 순서를 보존한 채 안전한 정수 범위로 압축
 */
function normalizePartOffsets(offsets) {
  if (!offsets || typeof offsets !== 'object') return {};
  const entries = Object.entries(offsets).map(e => [e[0], (typeof e[1] === 'number' && !isNaN(e[1])) ? e[1] : 0]);
  if (entries.length === 0) return {};

  entries.sort((a, b) => a[1] - b[1]);

  const normalized = {};
  let currentRank = 0;
  let lastValue = null;
  for (const [key, val] of entries) {
    if (lastValue === null) currentRank = 0;
    else if (val > lastValue) currentRank++;
    normalized[key] = currentRank;
    lastValue = val;
  }

  const ranks = Object.values(normalized);
  if (ranks.length > 0) {
    const mid = Math.round((Math.min(...ranks) + Math.max(...ranks)) / 2);
    for (const key in normalized) normalized[key] -= mid;
  }
  return normalized;
}

/** 기본 관절 각도 초기값 */
function defaultAngles() {
  return {
    pelvis: 0,
    waist: 0,
    chest: 0,
    neck: 0,
    head: 0,
    lShoulder: 25, lElbow: 15, lWrist: 0,
    rShoulder: -25, rElbow: -15, rWrist: 0,
    lHip: 12, lKnee: 0, lAnkle: 0,
    rHip: -12, rKnee: 0, rAnkle: 0
  };
}

/** 기본 파츠 레이어 오프셋 초기값 */
function defaultPartOffsets() {
  return {
    lUpperArm: -12, lLowerArm: 6, lHand: 7,
    rUpperArm: -9, rLowerArm: 8, rHand: 9,
    lFoot: -6, lCalf: -5, lThigh: -4,
    rFoot: -3, rCalf: -2, rThigh: -1,
    pelvis: 1, waist: 2, chest: 3, neck: 4, head: 5
  };
}

/**
 * 스틱맨 오브젝트 s 의 현재 각도/위치/스케일 값을 바탕으로
 * 16개 관절 좌표를 계산하여 반환합니다.
 *
 * @param {Object} s - stickman 오브젝트 (angles, partOffsets, scale, x, y, angle, flipped 포함)
 * @returns {Object} 관절명 → {x, y} 절대 좌표 맵
 */
function calcSkeleton(s) {
  const sc = s.scale;
  const L = {
    pelvisH: 31 * sc,
    waistH: 26 * sc,
    chestH: 44 * sc,
    neckH: 3.1 * sc,
    headR: 18 * sc,
    shoulderSpan: 54 * sc,
    hipSpan: 30 * sc,
    uArm: 52 * sc, lArm: 52 * sc, hand: 12 * sc,
    thigh: 91 * sc, calf: 85 * sc, foot: 12 * sc
  };
  const d2r = d => d * Math.PI / 180;
  const local = {};

  // Root at Pelvis Center (0, 0)
  local.pelvis = { x: 0, y: 0 };

  const pRad = d2r(s.angles.pelvis);
  const hipOffset = 12 * sc;
  local.lHip = {
    x: -L.hipSpan/2 * Math.cos(pRad) - hipOffset * Math.sin(pRad),
    y: -L.hipSpan/2 * Math.sin(pRad) + hipOffset * Math.cos(pRad)
  };
  local.rHip = {
    x:  L.hipSpan/2 * Math.cos(pRad) - hipOffset * Math.sin(pRad),
    y:  L.hipSpan/2 * Math.sin(pRad) + hipOffset * Math.cos(pRad)
  };

  local.waist = { x: L.pelvisH * Math.sin(pRad), y: -L.pelvisH * Math.cos(pRad) };

  const wRad = pRad + d2r(s.angles.waist);
  local.chestBase = { x: local.waist.x + L.waistH * Math.sin(wRad),
                      y: local.waist.y - L.waistH * Math.cos(wRad) };

  const cRad = wRad + d2r(s.angles.chest);
  local.neckBase = { x: local.chestBase.x + L.chestH * Math.sin(cRad),
                     y: local.chestBase.y - L.chestH * Math.cos(cRad) };
  local.lShoulder = { x: local.neckBase.x - (L.shoulderSpan/2) * Math.cos(cRad) - 14 * sc * Math.sin(cRad),
                      y: local.neckBase.y - (L.shoulderSpan/2) * Math.sin(cRad) + 14 * sc * Math.cos(cRad) };
  local.rShoulder = { x: local.neckBase.x + (L.shoulderSpan/2) * Math.cos(cRad) - 14 * sc * Math.sin(cRad),
                      y: local.neckBase.y + (L.shoulderSpan/2) * Math.sin(cRad) + 14 * sc * Math.cos(cRad) };

  const nRad = cRad + d2r(s.angles.neck);
  local.headBase = { x: local.neckBase.x + L.neckH * Math.sin(nRad),
                     y: local.neckBase.y - L.neckH * Math.cos(nRad) };

  const hRad = nRad + d2r(s.angles.head);
  local.headCenter = { x: local.headBase.x + L.headR * Math.sin(hRad),
                       y: local.headBase.y - L.headR * Math.cos(hRad) };

  // Arms (0 degrees is straight down)
  function arm(shoulder, shoulderA, elbowA, wristA) {
    const sRad = cRad + Math.PI + d2r(shoulderA);
    const elbow = { x: shoulder.x + L.uArm * Math.sin(sRad), y: shoulder.y - L.uArm * Math.cos(sRad) };
    const eRad = sRad + d2r(elbowA);
    const wrist = { x: elbow.x + L.lArm * Math.sin(eRad), y: elbow.y - L.lArm * Math.cos(eRad) };
    const wRad2 = eRad + d2r(wristA);
    const hand = { x: wrist.x + L.hand * Math.sin(wRad2), y: wrist.y - L.hand * Math.cos(wRad2) };
    return { elbow, wrist, hand };
  }
  const la = arm(local.lShoulder, s.angles.lShoulder, s.angles.lElbow, s.angles.lWrist);
  local.lElbow = la.elbow; local.lWrist = la.wrist; local.lHand = la.hand;
  const ra = arm(local.rShoulder, s.angles.rShoulder, s.angles.rElbow, s.angles.rWrist);
  local.rElbow = ra.elbow; local.rWrist = ra.wrist; local.rHand = ra.hand;

  // Legs (0 degrees is straight down)
  function leg(hip, hipA, kneeA, ankleA) {
    const hRad2 = pRad + Math.PI + d2r(hipA);
    const knee = { x: hip.x + L.thigh * Math.sin(hRad2), y: hip.y - L.thigh * Math.cos(hRad2) };
    const kRad = hRad2 + d2r(kneeA);
    const ankle = { x: knee.x + L.calf * Math.sin(kRad), y: knee.y - L.calf * Math.cos(kRad) };
    const aRad = kRad + d2r(ankleA);
    const foot = { x: ankle.x + L.foot * Math.sin(aRad), y: ankle.y - L.foot * Math.cos(aRad) };
    return { knee, ankle, foot };
  }
  const ll = leg(local.lHip, s.angles.lHip, s.angles.lKnee, s.angles.lAnkle);
  local.lKnee = ll.knee; local.lAnkle = ll.ankle; local.lFoot = ll.foot;
  const rl = leg(local.rHip, s.angles.rHip, s.angles.rKnee, s.angles.rAnkle);
  local.rKnee = rl.knee; local.rAnkle = rl.ankle; local.rFoot = rl.foot;

  // Apply flip + global rotation + translation
  const abs = {};
  for (const [k, pt] of Object.entries(local)) {
    let x = pt.x, y = pt.y;
    if (s.flipped) x = -x;
    const rot = rotatePt(x, y, 0, 0, s.angle);
    abs[k] = { x: rot.x + s.x, y: rot.y + s.y };
  }
  return abs;
}
