// sync.js — MediSafe Senior — Supabase Edition
// Utilise SupabaseService (chargé avant ce fichier)

const STORAGE_KEY_SENIOR = 'medisafe_senior_config';
// MOMENTS est défini dans supabase.js — pas de redéclaration ici

// Config senior stockée localement : { patientId, aidantId, prenom, nom }
function getSeniorConfig() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_SENIOR)) || null; }
  catch(e) { return null; }
}

function setSeniorConfig(config) {
  localStorage.setItem(STORAGE_KEY_SENIOR, JSON.stringify(config));
}

function resetSeniorIdentity() {
  localStorage.removeItem(STORAGE_KEY_SENIOR);
}

function hasConfig() {
  return !!getSeniorConfig();
}

// Récupérer le profil patient depuis Supabase
async function getSeniorProfile() {
  const config = getSeniorConfig();
  if (!config || !config.patientId) return null;
  try {
    const sb = await SupabaseService.getClient();
    const { data } = await sb.from('patients')
      .select('*').eq('id', config.patientId).single();
    return data || null;
  } catch(e) {
    console.error('[SyncService] getSeniorProfile:', e);
    return null;
  }
}

// Import depuis QR code — le QR contient maintenant { patientId, aidantId, prenom, nom }
async function importFromQR(encoded) {
  try {
    const json    = decodeURIComponent(escape(atob(encoded)));
    const payload = JSON.parse(json);
    if (!payload.v || !payload.id) throw new Error('QR invalide');

    // Toujours sauvegarder les données offline comme fallback
    const config = {
      patientId:   payload.id,
      prenom:      payload.prenom,
      nom:         payload.nom,
      offline:     true, // par défaut offline
      medications: payload.medications || []
    };

    // Tenter une connexion Supabase pour passer en mode online
    try {
      const sb = await SupabaseService.getClient();
      const { data } = await sb.from('patients')
        .select('id, prenom, nom')
        .eq('id', payload.id)
        .single();
      if (data) {
        config.offline = false; // patient trouvé → mode online
        config.prenom  = data.prenom;
        config.nom     = data.nom;
      }
    } catch(e) {
      // Supabase inaccessible → mode offline avec données QR
      console.warn('[SyncService] Mode offline activé:', e.message);
    }

    setSeniorConfig(config);
    return { ok: true, prenom: config.prenom };
  } catch(e) {
    console.error('[SyncService] importFromQR:', e);
    return { ok: false, error: e.message };
  }
}

// Médicaments du jour — depuis Supabase ou fallback offline
// Médicaments du jour — toujours depuis Supabase
async function getTodayMeds(patientId) {
  const config = getSeniorConfig();

  try {
    // Garantir une session valide (anonyme si besoin) avant d'appeler Supabase
    await SupabaseService.ensureSession();
    const meds = await SupabaseService.getTodayMeds(patientId);
    // Passer en mode online si on était offline
    if (config && config.offline) {
      config.offline = false;
      setSeniorConfig(config);
    }
    return meds;
  } catch(e) {
    console.warn('[SyncService] Supabase indisponible, fallback offline:', e.message);
    // Fallback offline — données du QR uniquement si Supabase inaccessible
    if (config && config.medications) {
      return _buildOfflineMeds(patientId, config.medications);
    }
    return [];
  }
}

// Mode offline — utiliser les données du QR
function _buildOfflineMeds(patientId, medications) {
  const today   = new Date().toISOString().slice(0, 10);
  const intKey  = 'medisafe_intakes_' + patientId;
  const intakes = (function() { try { return JSON.parse(localStorage.getItem(intKey)) || {}; } catch(e) { return {}; } })();
  const result  = [];

  medications.forEach(function(med) {
    (med.schedule || []).forEach(function(slot) {
      const dt  = today + 'T' + slot.time + ':00';
      const ex  = Object.values(intakes).find(function(i) {
        return i.medId === med.id && i.scheduledTime === dt;
      });
      const status = ex && ex.takenAt ? 'taken'
        : (new Date() - new Date(dt) > 3600000 ? 'missed' : 'pending');
      result.push({
        medId: med.id, name: med.name, dose: med.dose,
        time: slot.time, moment: slot.moment || null,
        scheduledDatetime: dt, status, photo: med.photo || null
      });
    });
  });

  return result.sort(function(a, b) {
    const [ah,am]=a.time.split(':').map(Number);
    const [bh,bm]=b.time.split(':').map(Number);
    return (ah*60+am)-(bh*60+bm);
  });
}

// Confirmer une prise — Supabase ou localStorage offline
async function confirmTaken(patientId, medId, scheduledDatetime) {
  const config = getSeniorConfig();
  try {
    await SupabaseService.ensureSession();
    await SupabaseService.confirmTaken(patientId, medId, scheduledDatetime);
    return true;
  } catch(e) {
    console.warn('[SyncService] confirmTaken Supabase échoué, fallback offline:', e.message);
    // Fallback offline
    const intKey  = 'medisafe_intakes_' + patientId;
    const intakes = (function(){ try{ return JSON.parse(localStorage.getItem(intKey))||{}; }catch(e){ return {}; } })();
    const id = Date.now().toString(36);
    intakes[id] = { id, medId, scheduledTime: scheduledDatetime, takenAt: new Date().toISOString(), status: 'taken' };
    localStorage.setItem(intKey, JSON.stringify(intakes));
    return true;
  }
}

// Abonnement realtime — mise à jour auto quand l'aidant modifie
async function subscribeToUpdates(patientId, callback) {
  try {
    await SupabaseService.ensureSession();
    return await SupabaseService.subscribeToPatient(patientId, callback);
  } catch(e) {
    console.error('[SyncService] subscribeToUpdates:', e);
    return null;
  }
}

window.SyncService = {
  getSeniorConfig, setSeniorConfig, resetSeniorIdentity, hasConfig,
  getSeniorProfile, importFromQR,
  getTodayMeds, confirmTaken,
  subscribeToUpdates,
  get MOMENTS() { return window.SupabaseService ? window.SupabaseService.MOMENTS : {}; }
};
