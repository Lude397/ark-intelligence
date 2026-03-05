// FICHIER : shared/js/sessionManager.js

const SessionManager = (() => {
  const SUPABASE_URL = window.ENV?.SUPABASE_URL || '';
  const SUPABASE_KEY = window.ENV?.SUPABASE_ANON_KEY || '';

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  };

  function getCurrentUser() {
    const user = localStorage.getItem('ark_user');
    return user ? JSON.parse(user) : null;
  }

  async function getSession(module) {
    const user = getCurrentUser();
    if (!user) return null;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/ark_sessions?user_id=eq.${user.id}&module=eq.${module}&status=eq.in_progress&limit=1`,
      { headers }
    );
    const data = await res.json();
    return data.length > 0 ? data[0] : null;
  }

  async function saveSession(module, conversationHistory, currentStep) {
    const user = getCurrentUser();
    if (!user) return;

    const existing = await getSession(module);

    if (existing) {
      await fetch(`${SUPABASE_URL}/rest/v1/ark_sessions?id=eq.${existing.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          conversation_history: conversationHistory,
          current_step: currentStep,
          updated_at: new Date().toISOString()
        })
      });
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/ark_sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: user.id,
          module,
          conversation_history: conversationHistory,
          current_step: currentStep,
          status: 'in_progress'
        })
      });
    }
  }

  async function completeSession(module) {
    const session = await getSession(module);
    if (!session) return;

    await fetch(`${SUPABASE_URL}/rest/v1/ark_sessions?id=eq.${session.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'completed', updated_at: new Date().toISOString() })
    });
  }

  async function deleteSession(module) {
    const session = await getSession(module);
    if (!session) return;

    await fetch(`${SUPABASE_URL}/rest/v1/ark_sessions?id=eq.${session.id}`, {
      method: 'DELETE',
      headers
    });
  }

  return { saveSession, getSession, completeSession, deleteSession };
})();
