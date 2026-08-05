(function () {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  });

  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (document.getElementById('pwa-install')) return;
    var btn = document.createElement('button');
    btn.id = 'pwa-install';
    btn.className = 'btn btn-primary';
    btn.type = 'button';
    btn.innerHTML = '<i class="fa-solid fa-download" aria-hidden="true"></i> Install app';
    document.body.appendChild(btn);
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('#pwa-install')) return;
    e.preventDefault();
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () {
      deferredPrompt = null;
    });
  });
})();
