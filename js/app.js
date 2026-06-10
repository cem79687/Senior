// app.js — MediSafe Senior

let _seniorProfile = null;

function initApp() {
  if (!window.SyncService) {
    showError('Service indisponible. Veuillez relancer l\'application.');
    return;
  }
  Router.register('splash',    renderSplash);
  Router.register('onboarding', renderOnboarding);
  Router.register('scan',      renderScan);
  Router.register('home',      renderHome);
  Router.go('splash');
}

// ============================================================
// ERREUR VISIBLE
// ============================================================
function showError(msg) {
  document.getElementById('app').innerHTML =
    '<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;gap:20px">' +
      '<i class="ti ti-alert-circle" style="font-size:64px;color:#A32D2D" aria-hidden="true"></i>' +
      '<div style="font-size:22px;font-weight:500;color:var(--color-text-primary)">Un problème est survenu</div>' +
      '<div style="font-size:18px;color:#5A5955;line-height:1.6">'+msg+'</div>' +
      '<button onclick="location.reload()" style="margin-top:8px;padding:16px 32px;background:#185FA5;color:#fff;border:none;border-radius:14px;font-size:18px;font-weight:500;cursor:pointer;min-height:60px;width:100%;max-width:280px">Réessayer</button>' +
    '</div>';
}

// ============================================================
// SPLASH
// ============================================================
function renderSplash() {
  document.getElementById('app').innerHTML =
    '<div class="splash" id="splash-screen" style="cursor:pointer">' +
      '<div class="splash-logo">' +
        '<i class="ti ti-shield-heart" style="font-size:52px;color:#fff" aria-hidden="true"></i>' +
      '</div>' +
      '<div>' +
        '<div class="splash-title">MediSafe</div>' +
        '<div class="splash-sub" style="margin-top:8px">Vos médicaments du jour</div>' +
      '</div>' +
    '</div>';

  // Tap sur le logo pour les utilisateurs déjà configurés
  document.getElementById('splash-screen').addEventListener('click', function() {
    _goAfterSplash();
  });

  setTimeout(function() { _goAfterSplash(); }, 2000);
}

function _goAfterSplash() {
  if (SyncService.hasConfig()) {
    Router.go('home');
  } else {
    Router.go('onboarding');
  }
}

// ============================================================
// ONBOARDING — première fois uniquement
// ============================================================
function renderOnboarding() {
  document.getElementById('app').innerHTML =
    '<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;gap:24px;background:var(--color-bg)">' +
      '<div style="width:80px;height:80px;background:#185FA5;border-radius:24px;display:flex;align-items:center;justify-content:center">' +
        '<i class="ti ti-shield-heart" style="font-size:42px;color:#fff" aria-hidden="true"></i>' +
      '</div>' +
      '<div>' +
        '<div style="font-size:26px;font-weight:600;color:var(--color-text-primary);margin-bottom:10px">Bienvenue sur MediSafe</div>' +
        '<div style="font-size:17px;color:#5A5955;line-height:1.6">Pour configurer votre application, demandez à votre aidant de générer un QR code depuis sa tablette ou son téléphone.</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:12px;width:100%;max-width:320px">' +
        '<button id="btn-scan" style="padding:18px;background:#185FA5;color:#fff;border:none;border-radius:16px;font-size:18px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;min-height:60px;font-family:inherit">' +
          '<i class="ti ti-scan" style="font-size:24px" aria-hidden="true"></i> Scanner le QR code' +
        '</button>' +
        '<button id="btn-code" style="padding:18px;background:transparent;color:#185FA5;border:2px solid #185FA5;border-radius:16px;font-size:18px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;min-height:60px;font-family:inherit">' +
          '<i class="ti ti-keyboard" style="font-size:24px" aria-hidden="true"></i> Saisir le code' +
        '</button>' +
      '</div>' +
    '</div>';

  document.getElementById('btn-scan').addEventListener('click', function() { Router.go('scan'); });
  document.getElementById('btn-code').addEventListener('click', function() { _showCodeInput(); });
}

// ── Saisie manuelle du code ────────────────────────────────
function _showCodeInput() {
  document.getElementById('app').innerHTML =
    '<div style="min-height:100vh;display:flex;flex-direction:column;padding:calc(32px + env(safe-area-inset-top,0px)) 24px 32px;gap:16px;background:var(--color-bg)">' +
      '<button id="btn-back" style="background:none;border:none;cursor:pointer;color:#185FA5;font-size:16px;display:flex;align-items:center;gap:6px;padding:0;font-family:inherit">' +
        '<i class="ti ti-arrow-left" style="font-size:20px" aria-hidden="true"></i> Retour' +
      '</button>' +
      '<div style="font-size:22px;font-weight:600;color:var(--color-text-primary)">Saisir le code</div>' +
      '<div style="font-size:15px;color:#5A5955">Copiez le code fourni par votre aidant et collez-le ici.</div>' +
      '<textarea id="qr-code-input" placeholder="Collez le code ici..." style="width:100%;height:140px;padding:14px;border:1.5px solid var(--color-border-strong);border-radius:12px;font-size:15px;resize:none;font-family:inherit;box-sizing:border-box"></textarea>' +
      '<button id="btn-validate" style="padding:18px;background:#185FA5;color:#fff;border:none;border-radius:16px;font-size:18px;font-weight:500;cursor:pointer;min-height:60px;font-family:inherit">Valider</button>' +
      '<div id="code-error" style="color:#A32D2D;font-size:14px;text-align:center;display:none">Code invalide. Vérifiez avec votre aidant.</div>' +
    '</div>';

  document.getElementById('btn-back').addEventListener('click', function() { Router.go('onboarding'); });
  document.getElementById('btn-validate').addEventListener('click', function() {
    const code = document.getElementById('qr-code-input').value.trim();
    const btn  = document.getElementById('btn-validate');
    if (!code) return;
    btn.textContent = 'Validation...';
    btn.disabled    = true;
    SyncService.importFromQR(code).then(function(result) {
      if (result.ok) {
        _showWelcome(result.prenom);
      } else {
        document.getElementById('code-error').style.display = 'block';
        btn.textContent = 'Valider';
        btn.disabled    = false;
      }
    }).catch(function() {
      document.getElementById('code-error').style.display = 'block';
      btn.textContent = 'Valider';
      btn.disabled    = false;
    });
  });
}

// ============================================================
// SCANNER QR — caméra native
// ============================================================
function renderScan() {
  document.getElementById('app').innerHTML =
    '<div style="min-height:100vh;display:flex;flex-direction:column;background:#000">' +
      '<div style="position:relative;flex:1;overflow:hidden">' +
        '<video id="qr-video" style="width:100%;height:100%;object-fit:cover" playsinline autoplay muted></video>' +
        // Cadre de visée
        '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none">' +
          '<div style="width:240px;height:240px;border:3px solid #fff;border-radius:16px;box-shadow:0 0 0 9999px rgba(0,0,0,.5)">' +
            '<div style="position:absolute;top:-2px;left:-2px;width:32px;height:32px;border-top:4px solid #185FA5;border-left:4px solid #185FA5;border-radius:12px 0 0 0"></div>' +
            '<div style="position:absolute;top:-2px;right:-2px;width:32px;height:32px;border-top:4px solid #185FA5;border-right:4px solid #185FA5;border-radius:0 12px 0 0"></div>' +
            '<div style="position:absolute;bottom:-2px;left:-2px;width:32px;height:32px;border-bottom:4px solid #185FA5;border-left:4px solid #185FA5;border-radius:0 0 0 12px"></div>' +
            '<div style="position:absolute;bottom:-2px;right:-2px;width:32px;height:32px;border-bottom:4px solid #185FA5;border-right:4px solid #185FA5;border-radius:0 0 12px 0"></div>' +
          '</div>' +
        '</div>' +
        // Instructions
        '<div style="position:absolute;bottom:100px;left:0;right:0;text-align:center;color:#fff;font-size:16px;padding:0 24px">Centrez le QR code dans le cadre</div>' +
      '</div>' +
      '<div style="padding:24px;padding-bottom:calc(24px + env(safe-area-inset-bottom,0px));background:#111;display:flex;gap:12px">' +
        '<button id="btn-scan-back" style="flex:1;padding:16px;background:rgba(255,255,255,.1);color:#fff;border:none;border-radius:14px;font-size:16px;cursor:pointer;font-family:inherit">Annuler</button>' +
        '<button id="btn-manual" style="flex:1;padding:16px;background:#185FA5;color:#fff;border:none;border-radius:14px;font-size:16px;cursor:pointer;font-family:inherit">Saisir le code</button>' +
      '</div>' +
    '</div>';

  document.getElementById('btn-scan-back').addEventListener('click', function() {
    _stopCamera();
    Router.go('onboarding');
  });
  document.getElementById('btn-manual').addEventListener('click', function() {
    _stopCamera();
    _showCodeInput();
  });

  _startCamera();
}

let _cameraStream = null;
let _scanInterval = null;

function _startCamera() {
  // Vérifier support caméra
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('Caméra non disponible sur cet appareil', 'warning');
    _showCodeInput();
    return;
  }

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(function(stream) {
      _cameraStream = stream;
      const video = document.getElementById('qr-video');
      if (!video) { _stopCamera(); return; }
      video.srcObject = stream;
      video.play();

      // Charger jsQR puis scanner
      if (!window.jsQR) {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsqr/1.4.0/jsQR.min.js';
        s.onload = function() { _scanLoop(); };
        s.onerror = function() { showToast('Erreur chargement scanner', 'error'); _showCodeInput(); };
        document.head.appendChild(s);
      } else {
        _scanLoop();
      }
    })
    .catch(function(err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        showToast('Permission caméra refusée — saisissez le code manuellement', 'warning');
      } else if (err.name === 'NotFoundError') {
        showToast('Aucune caméra détectée', 'warning');
      } else {
        showToast('Caméra indisponible — saisissez le code manuellement', 'warning');
      }
      _showCodeInput();
    });
}

function _scanLoop() {
  const video  = document.getElementById('qr-video');
  if (!video) return;
  const canvas = document.createElement('canvas');
  const ctx    = canvas.getContext('2d');

  _scanInterval = setInterval(function() {
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
    if (code && code.data) {
      clearInterval(_scanInterval);
      _stopCamera();
      // importFromQR est async — utiliser then/catch
      SyncService.importFromQR(code.data).then(function(result) {
        if (result.ok) {
          _showWelcome(result.prenom);
        } else {
          showToast('QR code invalide — demandez un nouveau QR à votre aidant', 'error');
          Router.go('onboarding');
        }
      }).catch(function(e) {
        console.error('importFromQR error:', e);
        showToast('Erreur lors du scan — réessayez', 'error');
        Router.go('onboarding');
      });
    }
  }, 250);
}

function _stopCamera() {
  if (_scanInterval) { clearInterval(_scanInterval); _scanInterval = null; }
  if (_cameraStream) { _cameraStream.getTracks().forEach(function(t) { t.stop(); }); _cameraStream = null; }
}

// ── Écran de bienvenue post-scan ───────────────────────────
function _showWelcome(prenom) {
  document.getElementById('app').innerHTML =
    '<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;gap:24px;background:var(--color-bg)">' +
      '<div style="width:90px;height:90px;background:#EAF3DE;border-radius:50%;display:flex;align-items:center;justify-content:center">' +
        '<i class="ti ti-circle-check-filled" style="font-size:56px;color:#3B6D11" aria-hidden="true"></i>' +
      '</div>' +
      '<div>' +
        '<div style="font-size:26px;font-weight:600;color:var(--color-text-primary);margin-bottom:10px">Bonjour '+prenom+' !</div>' +
        '<div style="font-size:17px;color:#5A5955;line-height:1.6">Votre application est configurée. Vos médicaments sont prêts.</div>' +
      '</div>' +
      '<button id="btn-start" style="padding:18px 40px;background:#185FA5;color:#fff;border:none;border-radius:16px;font-size:20px;font-weight:500;cursor:pointer;min-height:64px;font-family:inherit">Voir mes médicaments</button>' +
    '</div>';

  document.getElementById('btn-start').addEventListener('click', function() {
    _requestNotifications();
    Router.go('home');
  });

  // Redirection auto après 3s
  setTimeout(function() {
    if (Router.current() !== 'home') {
      _requestNotifications();
      Router.go('home');
    }
  }, 3000);
}

// ── Demande permission notifications ──────────────────────
function _requestNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// ============================================================
// ACCUEIL — médicaments du jour
// ============================================================
let _realtimeChannel = null;

async function renderHome() {
  // Afficher un loader pendant le chargement
  document.getElementById('app').innerHTML =
    '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--color-bg)">' +
      '<i class="ti ti-loader-2" style="font-size:40px;color:#185FA5;animation:spin 1s linear infinite" aria-hidden="true"></i>' +
    '</div>' +
    '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>';

  const config = SyncService.getSeniorConfig();
  if (!config) { Router.go('onboarding'); return; }

  // Charger le profil et les médicaments
  try { _seniorProfile = await SyncService.getSeniorProfile() || { id: config.patientId, prenom: config.prenom, nom: config.nom }; }
  catch(e) { _seniorProfile = { id: config.patientId, prenom: config.prenom, nom: config.nom }; }

  let meds;
  try { meds = await SyncService.getTodayMeds(config.patientId); }
  catch(e) { showError('Impossible de charger vos médicaments. Vérifiez votre connexion.'); return; }

  _renderHomeUI(meds, config);

  // Abonnement realtime — refresh auto si l'aidant modifie
  if (_realtimeChannel) {
    try { await SupabaseService.unsubscribe(_realtimeChannel); } catch(e) {}
  }
  try {
    _realtimeChannel = await SyncService.subscribeToUpdates(config.patientId, function() {
      renderHome();
    });
  } catch(e) {}

  // Fallback polling 30s si realtime non disponible
  if (window._pollInterval) clearInterval(window._pollInterval);
  window._pollInterval = setInterval(function() {
    if (Router.current() === 'home') renderHome();
  }, 30000);
}

function _renderHomeUI(meds, config) {
  const prenom  = _seniorProfile ? _seniorProfile.prenom : (config ? config.prenom : '');
  const today   = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
  const MOMENTS = SyncService.MOMENTS;

  const grouped = {};
  meds.forEach(function(m) {
    if (!grouped[m.medId]) grouped[m.medId] = { medId:m.medId, name:m.name, dose:m.dose, photo:m.photo, intakes:[] };
    grouped[m.medId].intakes.push(m);
  });
  const groups = Object.values(grouped);
  const missed = meds.filter(function(m) { return m.status === 'missed'; });

  const alertHTML = missed.length > 0
    ? '<div class="alert-banner"><i class="ti ti-alert-triangle" style="font-size:28px;flex-shrink:0" aria-hidden="true"></i><span>'+missed.length+' prise'+(missed.length>1?'s':'')+' non effectuée'+(missed.length>1?'s':'')+'</span></div>'
    : '';

  let cardsHTML = '';
  if (groups.length === 0) {
    cardsHTML = '<div class="empty-state"><i class="ti ti-circle-check" style="font-size:64px;color:#3B6D11" aria-hidden="true"></i><div class="empty-title">Aucun médicament aujourd\'hui</div><div class="empty-sub">Votre aidant n\'a pas encore configuré de médicaments.</div></div>';
  } else {
    cardsHTML = groups.map(function(g) {
      const photoHTML = g.photo
        ? '<img src="'+g.photo+'" class="med-photo" alt="'+g.name+'">'
        : '<div class="med-photo-placeholder"><i class="ti ti-pill" style="font-size:34px;color:#185FA5" aria-hidden="true"></i></div>';

      const timesHTML = g.intakes.map(function(i) {
        const chipClass = i.status==='taken' ? 'chip-taken' : i.status==='missed' ? 'chip-missed' : 'chip-pending';
        const sIcon = i.status==='taken'
          ? '<i class="ti ti-check" style="font-size:18px;color:#27500A" aria-hidden="true"></i>'
          : i.status==='missed'
            ? '<i class="ti ti-x" style="font-size:18px;color:#791F1F" aria-hidden="true"></i>'
            : '<i class="ti ti-circle" style="font-size:16px;color:#5A5955" aria-hidden="true"></i>';
        const mIcon = i.moment && MOMENTS[i.moment] ? MOMENTS[i.moment] : '';
        return '<div class="time-chip '+chipClass+'" data-med-id="'+g.medId+'" data-dt="'+i.scheduledDatetime+'" data-status="'+i.status+'" data-name="'+g.name+'" role="button" aria-label="'+i.time+' — '+g.name+'">'+
          '<span class="time-chip-icon" aria-hidden="true">'+mIcon+'</span>'+
          '<span class="time-chip-status">'+sIcon+'</span>'+
          '<span class="time-chip-time">'+i.time+'</span>'+
        '</div>';
      }).join('');

      const allTaken  = g.intakes.every(function(i) { return i.status==='taken'; });
      const anyMissed = g.intakes.some(function(i)  { return i.status==='missed'; });
      const border    = allTaken ? '2px solid rgba(59,109,17,.3)' : anyMissed ? '2px solid rgba(163,45,45,.3)' : '1.5px solid rgba(0,0,0,.06)';

      return '<div class="med-card" style="border:'+border+'">'+
        '<div style="display:flex;align-items:center;gap:14px">'+photoHTML+
          '<div style="flex:1;min-width:0">'+
            '<div class="med-name">'+g.name+'</div>'+
            '<div class="med-dose">'+g.dose+'</div>'+
          '</div>'+
        '</div>'+
        '<div class="time-chips" id="chips-'+g.medId+'">'+timesHTML+'</div>'+
      '</div>';
    }).join('');
  }

  const pending = meds.filter(function(m) { return m.status==='pending'; });
  let nextHTML = '';
  if (pending.length > 0) {
    nextHTML = '<div style="background:var(--color-primary-bg);border-radius:16px;padding:14px 18px;display:flex;align-items:center;gap:12px">'+
      '<i class="ti ti-clock" style="font-size:28px;color:#185FA5;flex-shrink:0" aria-hidden="true"></i>'+
      '<div><div style="font-size:14px;color:#185FA5;font-weight:500">Prochain rappel</div>'+
      '<div style="font-size:20px;font-weight:500;color:#0C447C">'+pending[0].time+' — '+pending[0].name+'</div></div></div>';
  } else if (groups.length > 0) {
    nextHTML = '<div style="background:var(--color-taken-bg);border-radius:16px;padding:14px 18px;display:flex;align-items:center;gap:12px">'+
      '<i class="ti ti-trophy" style="font-size:28px;color:#3B6D11;flex-shrink:0" aria-hidden="true"></i>'+
      '<div style="font-size:20px;font-weight:500;color:#27500A">Tous les médicaments sont pris !</div></div>';
  }

  document.getElementById('app').innerHTML =
    '<div class="header">'+
      '<div>'+
        '<div class="header-title">Bonjour '+prenom+'</div>'+
        '<div class="header-date">'+today+'</div>'+
      '</div>'+
      '<button id="btn-change-profile" style="background:rgba(255,255,255,.15);border:none;border-radius:50%;width:42px;height:42px;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center" aria-label="Changer de profil">'+
        '<i class="ti ti-user-circle" style="font-size:24px" aria-hidden="true"></i>'+
      '</button>'+
    '</div>'+
    '<div class="pad-lg stack-lg" style="padding-top:20px;padding-bottom:calc(32px + env(safe-area-inset-bottom,0px))">'+
      alertHTML + cardsHTML + nextHTML +
    '</div>';

  // Listener délégué sur toutes les chips — fiable mobile
  document.getElementById('app').addEventListener('click', function(e) {
    const chip = e.target.closest('[data-med-id]');
    if (chip) {
      handleTap(chip.dataset.medId, chip.dataset.dt, chip.dataset.status, chip.dataset.name);
      return;
    }
    if (e.target.closest('#btn-change-profile')) {
      _confirmChangeProfile();
    }
  });
}

// ============================================================
// CONFIRMATION DE PRISE
// ============================================================
async function handleTap(medId, scheduledDatetime, currentStatus, medName) {
  if (currentStatus === 'taken') return;
  const config = SyncService.getSeniorConfig();
  if (!config) return;
  let success = false;
  try { success = await SyncService.confirmTaken(config.patientId, medId, scheduledDatetime); }
  catch(e) { showError('Impossible d\'enregistrer la prise. Réessayez.'); return; }
  if (!success) { showError('Erreur lors de l\'enregistrement. Réessayez.'); return; }
  showConfirmation(medName, function() { renderHome(); });
}

function showConfirmation(medName, callback) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML =
    '<div class="confirm-check"><i class="ti ti-circle-check-filled" style="font-size:90px;color:#fff" aria-hidden="true"></i></div>'+
    '<div class="confirm-text">Pris !<br><span style="font-size:20px;opacity:.85">'+medName+'</span></div>';
  document.body.appendChild(overlay);
  setTimeout(function() {
    overlay.style.opacity = '0'; overlay.style.transition = 'opacity .3s';
    setTimeout(function() { overlay.remove(); if (callback) callback(); }, 300);
  }, 1200);
}

// ── Changer de profil ──────────────────────────────────────
function _confirmChangeProfile() {
  if (confirm('Changer de profil ? Votre configuration actuelle sera effacée.')) {
    SyncService.resetSeniorIdentity();
    _seniorProfile = null;
    Router.go('onboarding');
  }
}

// Démarrage
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else { initApp(); }
