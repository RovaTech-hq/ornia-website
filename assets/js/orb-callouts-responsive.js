// Tailored "pulse line" annotations for tablet and mobile.
//
// The desktop version (>=1020px) is static HTML/CSS hand-tuned for an exact
// 960x600 stage — see .orb-callouts in index.html/style.css. That technique
// doesn't scale down cleanly, so for tablet (681-1019px) and mobile
// (360-680px) this script instead MEASURES the orb's actual rendered size at
// runtime and computes the bend geometry from real numbers, with content
// tailored per tier (full labels on tablet, abbreviated on mobile).
//
// Safety net: .orb-mobile-stats (plain pill chips) is visible by default for
// any width under 1020px. This script only hides it once it has successfully
// measured the orb and rendered real lines — if anything here throws or the
// orb isn't ready yet, the pills simply stay put. No dependency, no risk.

(function () {
  var TIERS = {
    tablet: {
      min: 681,
      angle: 45,
      vGapRatio: 1.1,
      textWidth: 150,
      gap: 14,
      fontSize: 13,
      labels: {
        spo2: function (v) { return 'SpO₂ <b>' + v + '</b>'; },
        rr: function (v) { return 'Breathing <b>' + v + '</b>/min'; },
        temp: function (v) { return 'Skin Temp <b>' + v + '</b>'; },
        ai: function () { return 'AI Baseline <b>Calibrated</b>'; },
        latency: function () { return 'Alert Latency <b>&lt;800ms</b>'; },
        mode: function () { return 'Mode <b>Offline-First</b>'; },
      },
    },
    mobile: {
      min: 360,
      angle: 52,
      vGapRatio: 1.4,
      textWidth: 92,
      gap: 6,
      fontSize: 10.5,
      labels: {
        spo2: function (v) { return 'SpO₂ <b>' + v + '</b>'; },
        rr: function (v) { return 'Breathing <b>' + v + '</b>'; },
        temp: function (v) { return 'Temp <b>' + v + '</b>'; },
        ai: function () { return 'AI <b>Calibrated</b>'; },
        latency: function () { return 'Latency <b>&lt;800ms</b>'; },
        mode: function () { return 'Mode <b>Offline</b>'; },
      },
    },
  };

  var ROWS = [
    { key: 'spo2', side: 'left', row: 'top', delay: -0.3 },
    { key: 'rr', side: 'left', row: 'mid', delay: -1.8 },
    { key: 'temp', side: 'left', row: 'bottom', delay: -3.4 },
    { key: 'ai', side: 'right', row: 'top', delay: -2.1 },
    { key: 'latency', side: 'right', row: 'mid', delay: -4.6 },
    { key: 'mode', side: 'right', row: 'bottom', delay: -5.5 },
  ];

  var liveValues = { spo2: '98%', rr: '36', temp: '36.7°' };
  var stage, core, visual, pills, dyn;
  var resizeTimer = null;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function rnd(a, b, d) {
    d = d || 0;
    return parseFloat((Math.random() * (b - a) + a).toFixed(d));
  }

  function bezierPath(x1, y1, x2, y2) {
    var c1x = x1 + (x2 - x1) * 0.6;
    var c2x = x1 + (x2 - x1) * 0.4;
    return 'M' + x1 + ',' + y1 + ' C' + c1x + ',' + y1 + ' ' + c2x + ',' + y2 + ' ' + x2 + ',' + y2;
  }

  function pickTier(w) {
    if (w >= 1020 || w < TIERS.mobile.min) return null;
    return w >= TIERS.tablet.min ? 'tablet' : 'mobile';
  }

  function layoutRow(def, cfg, cx, cy, r, stageW) {
    var sign = def.side === 'left' ? -1 : 1;
    var touchX, touchY;
    if (def.row === 'mid') {
      touchX = cx + sign * r;
      touchY = cy;
    } else {
      var rad = (cfg.angle * Math.PI) / 180;
      var vsign = def.row === 'top' ? -1 : 1;
      touchX = cx + sign * r * Math.cos(rad);
      touchY = cy + vsign * r * Math.sin(rad);
    }
    var textY = def.row === 'mid' ? cy : def.row === 'top' ? cy - r * cfg.vGapRatio : cy + r * cfg.vGapRatio;
    var nearX = def.side === 'left' ? touchX - cfg.gap : touchX + cfg.gap;
    var boxLeft = def.side === 'left' ? nearX - cfg.textWidth : nearX;
    // clamp so text never renders off the edge of the stage on extreme widths
    boxLeft = Math.max(4, Math.min(stageW - cfg.textWidth - 4, boxLeft));
    return { touchX: touchX, touchY: touchY, textY: textY, nearX: nearX, boxLeft: boxLeft };
  }

  function render() {
    if (!stage || !core || !visual || !pills || !dyn) return;
    var w = window.innerWidth;
    var tierName = pickTier(w);

    if (!tierName) {
      dyn.classList.remove('is-active');
      dyn.innerHTML = '';
      pills.style.display = '';
      return;
    }

    var stageRect = stage.getBoundingClientRect();
    var coreRect = core.getBoundingClientRect();
    if (!stageRect.width || !coreRect.width) return;

    var cfg = TIERS[tierName];
    var cx = coreRect.left + coreRect.width / 2 - stageRect.left;
    var cy = coreRect.top + coreRect.height / 2 - stageRect.top;
    var r = coreRect.width / 2;

    var svg = '';
    var text = '';

    ROWS.forEach(function (def) {
      var L = layoutRow(def, cfg, cx, cy, r, stageRect.width);
      var path = def.side === 'left'
        ? bezierPath(L.boxLeft + cfg.textWidth, L.textY, L.touchX, L.touchY)
        : bezierPath(L.boxLeft, L.textY, L.touchX, L.touchY);

      svg += '<path d="' + path + '"/><circle cx="' + L.touchX.toFixed(1) + '" cy="' + L.touchY.toFixed(1) + '" r="3" style="animation-delay:' + def.delay + 's"/>';

      var value = liveValues[def.key] !== undefined ? liveValues[def.key] : '';
      var html = cfg.labels[def.key](value);
      var align = def.side === 'left' ? 'right' : 'left';
      var idAttr = (def.key === 'spo2' || def.key === 'rr' || def.key === 'temp') ? ' data-dyn-key="' + def.key + '"' : '';
      text += '<div class="dyn-text"' + idAttr + ' style="left:' + L.boxLeft.toFixed(1) + 'px; top:' + (L.textY - 9).toFixed(1) + 'px; width:' + cfg.textWidth + 'px; text-align:' + align + '; font-size:' + cfg.fontSize + 'px;">' + html + '</div>';
    });

    dyn.innerHTML = '<svg class="dyn-svg" width="' + stageRect.width + '" height="' + stageRect.height + '" viewBox="0 0 ' + stageRect.width + ' ' + stageRect.height + '">' + svg + '</svg>' + text;
    dyn.classList.add('is-active');
    pills.style.display = 'none';
  }

  function tickValues() {
    liveValues.spo2 = rnd(96, 99) + '%';
    liveValues.rr = rnd(32, 40);
    liveValues.temp = rnd(36.4, 37.1, 1) + '°';
    if (!dyn || !dyn.classList.contains('is-active')) return;
    ['spo2', 'rr', 'temp'].forEach(function (key) {
      var el = dyn.querySelector('[data-dyn-key="' + key + '"] b');
      if (el) el.textContent = liveValues[key];
    });
  }

  function debouncedRender() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 150);
  }

  ready(function () {
    stage = document.getElementById('orb-stage');
    core = document.getElementById('orb-core');
    visual = document.getElementById('orb-visual');
    pills = document.querySelector('.orb-mobile-stats');
    dyn = document.getElementById('orb-callouts-dyn');
    if (!stage || !core || !visual || !pills || !dyn) return;

    render();
    window.addEventListener('resize', debouncedRender);
    window.addEventListener('orientationchange', debouncedRender);
    setInterval(tickValues, 2400);
  });
})();
