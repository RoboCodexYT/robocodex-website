(function () {
  if (!('speechSynthesis' in window)) return;

  var btn = document.getElementById('reader-listen');
  if (!btn) return;

  var speaking = false;

  function textToSpeak() {
    var body = document.getElementById('reader-body');
    if (!body) return '';
    var copy = body.cloneNode(true);
    copy.querySelectorAll('script, style, .code-header, .reader-toc-wrap').forEach(function (n) { n.remove(); });
    return (copy.innerText || '').replace(/\s+/g, ' ').trim();
  }

  function chunks(text) {
    var sentences = text.match(/[^.!?\n]+[.!?]?/g) || [text];
    var out = [];
    var cur = '';
    sentences.forEach(function (s) {
      cur += s + ' ';
      if (cur.length > 450) {
        out.push(cur.trim());
        cur = '';
      }
    });
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  function setSpeaking(v) {
    speaking = v;
    btn.innerHTML = v
      ? '<i class="fa-solid fa-stop" aria-hidden="true"></i><span>Stop</span>'
      : '<i class="fa-solid fa-volume-high" aria-hidden="true"></i><span>Listen</span>';
    btn.classList.toggle('is-speaking', v);
    btn.setAttribute('aria-pressed', v ? 'true' : 'false');
  }

  function speak() {
    var text = textToSpeak();
    if (!text) return;
    var parts = chunks(text);
    parts.forEach(function (part, i) {
      var u = new SpeechSynthesisUtterance(part);
      u.rate = 0.98;
      u.pitch = 1;
      u.onend = function () { if (i === parts.length - 1) setSpeaking(false); };
      u.onerror = function () { setSpeaking(false); };
      speechSynthesis.speak(u);
    });
    setSpeaking(true);
  }

  function stop() {
    speechSynthesis.cancel();
    setSpeaking(false);
  }

  btn.addEventListener('click', function () {
    if (speaking) {
      stop();
    } else {
      stop();
      setTimeout(speak, 60);
    }
  });

  document.addEventListener('click', function (e) {
    if (!speaking) return;
    if (e.target.closest('#reader-back, #reader-prev, #reader-next')) {
      setTimeout(stop, 0);
    }
  });

  window.addEventListener('pagehide', function () {
    speechSynthesis.cancel();
  });
})();
