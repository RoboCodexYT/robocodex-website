(function () {
  var PASSCODE = 'robosix7robosix7';
  var UNLOCK_KEY = 'stats-unlocked';

  if (!('sessionStorage' in window)) return;

  document.addEventListener('DOMContentLoaded', function () {
    if (sessionStorage.getItem(UNLOCK_KEY) === '1') return;

    var overlay = document.createElement('div');
    overlay.id = 'stats-gate';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="stats-gate-card">' +
      '<img src="images/logo.png" alt="RoboCodex" class="stats-gate-logo">' +
      '<h1>Team 24813</h1>' +
      '<p class="stats-gate-sub">This page is for the team. Enter the passcode to view stats and match breakdowns.</p>' +
      '<form class="stats-gate-form">' +
      '<input type="password" id="stats-pass" autocomplete="off" placeholder="Passcode">' +
      '<button type="submit" class="btn btn-primary"><i class="fa-solid fa-unlock" aria-hidden="true"></i> Unlock</button>' +
      '</form>' +
      '<p class="stats-gate-error" hidden>Wrong passcode. Try again.</p>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    var form = overlay.querySelector('.stats-gate-form');
    var input = overlay.querySelector('#stats-pass');
    var error = overlay.querySelector('.stats-gate-error');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (input.value === PASSCODE) {
        sessionStorage.setItem(UNLOCK_KEY, '1');
        document.body.removeChild(overlay);
        document.body.style.overflow = '';
      } else {
        error.hidden = false;
        input.select();
      }
    });

    setTimeout(function () { input.focus(); }, 50);
  });
})();
