// Custom "pulse monitor" cursor — desktop / fine-pointer only.
// A dot that tracks the real cursor exactly, plus a glowing ring that lags
// gently behind it (lerp, same technique as the orb's magnetic-pull effect).
// Touch and coarse-pointer devices never run any of this — they keep their
// native cursor exactly as before.

(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var dot = document.createElement('div');
  dot.className = 'cursor-dot';
  var ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  var mx = -100, my = -100;
  var rx = mx, ry = my;
  var shown = false;

  function setDotPosition(x, y) {
    dot.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)';
  }
  function setRingPosition(x, y) {
    ring.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)';
  }

  function onMove(e) {
    mx = e.clientX;
    my = e.clientY;
    setDotPosition(mx, my);
    if (!shown) {
      shown = true;
      rx = mx; ry = my;
      setRingPosition(rx, ry);
      dot.classList.add('show');
      ring.classList.add('show');
      document.documentElement.classList.add('has-custom-cursor');
    }
  }

  function loop() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    setRingPosition(rx, ry);
    requestAnimationFrame(loop);
  }

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mousedown', function () { ring.classList.add('is-press'); });
  window.addEventListener('mouseup', function () { ring.classList.remove('is-press'); });
  document.addEventListener('mouseleave', function () {
    shown = false;
    dot.classList.remove('show');
    ring.classList.remove('show');
  });

  var growSelector = 'a, button, summary, .tile, .mstat';
  var textSelector = 'input, textarea, select';
  document.addEventListener('mouseover', function (e) {
    if (e.target.closest(textSelector)) {
      dot.classList.add('is-hidden');
      ring.classList.add('is-hidden');
    } else if (e.target.closest(growSelector)) {
      ring.classList.add('is-hover');
    }
  });
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest(textSelector)) {
      dot.classList.remove('is-hidden');
      ring.classList.remove('is-hidden');
    } else if (e.target.closest(growSelector)) {
      ring.classList.remove('is-hover');
    }
  });

  requestAnimationFrame(loop);
})();
