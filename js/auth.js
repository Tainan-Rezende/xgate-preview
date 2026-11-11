const Auth = {
  BASE_URL: 'https://api.xgateglobal.com',
  STORAGE_KEY: 'xgate_temp_session',

  // Guarda o token e o e-mail apenas na sessão da aba atual
  saveSession(token, email) {
    const payload = {
      token: token.trim(),
      email: email,
      createdAt: Date.now()
    };
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
  },

  getSession() {
    const raw = sessionStorage.getItem(this.STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (e) {
      this.clearSession();
      return null;
    }
  },

  clearSession() {
    sessionStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.clear();
  },

  requireAuth() {
    const session = this.getSession();
    if (!session || !session.token) {
      this.clearSession();
      window.location.replace('index.html');
      return null;
    }
    return session;
  },

  redirectIfAuthenticated() {
    const session = this.getSession();
    if (session && session.token) {
      window.location.replace('dashboard.html');
    }
  },

  // Wrapper genérico para chamadas à API da XGate
  async apiRequest(endpoint, options = {}) {
    const session = this.getSession();
    if (!session || !session.token) {
      this.clearSession();
      window.location.replace('index.html');
      throw new Error('Sessão inexistente ou expirada.');
    }

    const url = `${this.BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${session.token}`,
      ...(options.headers || {})
    };

    const response = await fetch(url, { ...options, headers });
    let responseData = {};

    try {
      responseData = await response.json();
    } catch (err) {
      responseData = {};
    }

    // Não expulsar em 401, permitindo que o ecrã informe se o IP está bloqueado
    return {
      ok: response.ok,
      status: response.status,
      data: responseData
    };
  }
};