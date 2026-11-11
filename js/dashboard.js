// ==========================================================================
// UTILITÁRIOS, SEGURANÇA E HIGIENIZAÇÃO DE DADOS
// ==========================================================================
const Utils = {
  // Higieniza strings para prevenir ataques de Cross-Site Scripting (XSS)
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '\u0026amp;')
      .replace(/</g, '\u0026lt;')
      .replace(/>/g, '\u0026gt;')
      .replace(/"/g, '\u0026quot;')
      .replace(/'/g, '\u0026#39;');
  },

  // Remove sufixo interno gerado para prevenção de conflito
  cleanName(rawName) {
    if (!rawName) return '';
    return rawName.replace(/\s*-\s*XG-[A-Za-z0-9]{6}$/i, '').trim();
  },

  // Gera código alfanumérico para garantir unicidade do nome na base
  generateSuffix() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  },

  // Formata valores numéricos para o padrão de moeda brasileiro
  formatMoney(val) {
    const num = typeof val === 'number' ? val : parseFloat(val || 0);
    return isNaN(num) ? 'R$ 0,00' : num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  // Exibe mensagem de feedback visual em caixas de alerta
  showAlert(elemId, msg, type = 'error') {
    const el = document.getElementById(elemId);
    if (!el) return;
    el.textContent = msg;
    el.className = `alert alert-${type}`;
    el.style.display = 'block';
  },

  // Oculta caixa de alerta ativa
  clearAlert(elemId) {
    const el = document.getElementById(elemId);
    if (el) el.style.display = 'none';
  }
};

// ==========================================================================
// COMPONENTES DE FEEDBACK VISUAL: TOAST E MODAL
// ==========================================================================
const Toast = {
  show(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
      success: '✓',
      warning: '⚠️',
      error: '✕',
      info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ'}</span>
      <span class="toast-msg">${Utils.escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    // Animação de entrada
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto-destruição após o tempo determinado
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }
};

const Modal = {
  confirm(title, message, isDanger = false) {
    return new Promise((resolve) => {
      const overlay = document.getElementById('confirmModal');
      const titleEl = document.getElementById('modalTitle');
      const msgEl = document.getElementById('modalMessage');
      const btnConfirm = document.getElementById('modalBtnConfirm');
      const btnCancel = document.getElementById('modalBtnCancel');

      if (!overlay || !btnConfirm || !btnCancel) {
        resolve(false);
        return;
      }

      titleEl.textContent = title;
      msgEl.textContent = message;

      if (isDanger) {
        btnConfirm.className = 'btn btn-primary';
        btnConfirm.style.backgroundColor = 'var(--danger)';
        btnConfirm.style.color = '#ffffff';
      } else {
        btnConfirm.className = 'btn btn-primary';
        btnConfirm.style.backgroundColor = '';
        btnConfirm.style.color = '';
      }

      overlay.classList.add('active');

      const cleanup = () => {
        overlay.classList.remove('active');
        btnConfirm.removeEventListener('click', onConfirm);
        btnCancel.removeEventListener('click', onCancel);
      };

      const onConfirm = () => {
        cleanup();
        resolve(true);
      };

      const onCancel = () => {
        cleanup();
        resolve(false);
      };

      btnConfirm.addEventListener('click', onConfirm);
      btnCancel.addEventListener('click', onCancel);
    });
  }
};

// ==========================================================================
// TEMPORIZADOR DE SEGURANÇA POR INATIVIDADE (15 MINUTOS COM THROTTLE)
// ==========================================================================
const IdleSecurity = {
  TIMEOUT_SECONDS: 15 * 60,
  remainingSeconds: 15 * 60,
  intervalTimer: null,
  lastResetTime: Date.now(),

  reset() {
    this.remainingSeconds = this.TIMEOUT_SECONDS;
    this.lastResetTime = Date.now();
    this.updateDisplay();
  },

  updateDisplay() {
    const badge = document.getElementById('sessionTimerBadge');
    if (!badge) return;
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    badge.textContent = `⏳ ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  },

  tick() {
    this.remainingSeconds--;
    this.updateDisplay();

    if (this.remainingSeconds <= 0) {
      clearInterval(this.intervalTimer);
      Auth.clearSession();
      Toast.show('Sessão encerrada por inatividade. Redirecionando...', 'warning', 2500);
      setTimeout(() => {
        window.location.replace('index.html');
      }, 1500);
    }
  },

  init() {
    this.reset();

    ['click', 'keydown', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, () => this.reset(), { passive: true });
    });

    window.addEventListener('mousemove', () => {
      if (Date.now() - this.lastResetTime > 10000) {
        this.reset();
      }
    }, { passive: true });

    this.intervalTimer = setInterval(() => this.tick(), 1000);
  }
};

// ==========================================================================
// GERENCIADOR DE TEMAS (CLARO E ESCURO)
// ==========================================================================
const ThemeManager = {
  STORAGE_KEY: 'xgate_theme_preference',

  init() {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) || 'dark';
    this.applyTheme(savedTheme);

    const toggleBtn = document.getElementById('btnThemeToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
      });
    }
  },

  applyTheme(theme) {
    const isLight = theme === 'light';
    document.body.classList.toggle('light-theme', isLight);
    localStorage.setItem(this.STORAGE_KEY, theme);

    const logoImg = document.getElementById('appLogo');
    if (logoImg) {
      logoImg.src = isLight ? 'img/xgate-black.png' : 'img/xgate-white.png';
    }
  }
};

// ==========================================================================
// NÚCLEO DA APLICAÇÃO E COMUNICAÇÃO DE DADOS
// ==========================================================================
const App = {
  depositCurrency: null,
  withdrawCurrency: null,
  detectedIp: null,

  async init() {
    const session = Auth.requireAuth();
    if (!session) return;

    ThemeManager.init();
    IdleSecurity.init();

    const userBadge = document.getElementById('userEmailBadge');
    if (userBadge) {
      userBadge.textContent = Utils.escapeHtml(session.email || 'Conectado');
    }

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', async () => {
        const confirmed = await Modal.confirm('Sair da Conta', 'Deseja realmente encerrar sua sessão atual?');
        if (confirmed) {
          Auth.clearSession();
          window.location.replace('index.html');
        }
      });
    }

    this.setupCopyIpButton();
    this.detectPublicIp();
    await this.loadCurrencies();
    await this.fetchBalance();

    setInterval(() => this.fetchBalance(), 25000);
    const btnRefresh = document.getElementById('btnRefreshBalance');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => this.fetchBalance());
    }

    this.setupTabs();
    WithdrawWizard.init();
    DepositWizard.init();
  },

  setupCopyIpButton() {
    const btnCopy = document.getElementById('btnCopyIp');
    if (!btnCopy) return;

    btnCopy.addEventListener('click', async () => {
      const ipText = this.detectedIp || document.getElementById('clientPublicIp')?.textContent?.trim();

      if (!ipText || ipText === 'Detectando...' || ipText === 'Não detectado') {
        Toast.show('Aguarde a detecção do IP antes de copiar.', 'warning');
        return;
      }

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(ipText);
        } else {
          const tempArea = document.createElement('textarea');
          tempArea.value = ipText;
          tempArea.style.position = 'fixed';
          tempArea.style.opacity = '0';
          document.body.appendChild(tempArea);
          tempArea.select();
          document.execCommand('copy');
          document.body.removeChild(tempArea);
        }
        Toast.show(`IP copiado: ${ipText}`, 'success');
      } catch (err) {
        prompt('Copie o seu IP manualmente:', ipText);
      }
    });
  },

  async detectPublicIp() {
    const ipDisplay = document.getElementById('clientPublicIp');
    
    try {
      const res = await fetch('https://api64.ipify.org?format=json');
      const data = await res.json();
      if (data && data.ip) {
        this.detectedIp = data.ip;
        if (ipDisplay) ipDisplay.textContent = Utils.escapeHtml(data.ip);
        return;
      }
    } catch (e) {
      // Falha tratada silenciosamente
    }

    try {
      const res4 = await fetch('https://api.ipify.org?format=json');
      const data4 = await res4.json();
      if (data4 && data4.ip) {
        this.detectedIp = data4.ip;
        if (ipDisplay) ipDisplay.textContent = Utils.escapeHtml(data4.ip);
        return;
      }
    } catch (e) {
      if (ipDisplay) ipDisplay.textContent = 'Não detectado';
    }
  },

  async loadCurrencies() {
    try {
      const depRes = await Auth.apiRequest('/deposit/company/currencies');
      if (depRes.ok && Array.isArray(depRes.data)) {
        this.depositCurrency = depRes.data.find(c => c.name === 'BRL') || depRes.data[0];
      }

      const wdRes = await Auth.apiRequest('/withdraw/company/currencies');
      if (wdRes.ok && Array.isArray(wdRes.data)) {
        this.withdrawCurrency = wdRes.data.find(c => c.name === 'BRL') || wdRes.data[0];
      }
    } catch (e) {
      // Ignora erro inicial
    }
  },

  async fetchBalance() {
    const balanceElem = document.getElementById('companyBalance');
    if (!balanceElem) return;

    balanceElem.classList.add('loading-pulse');

    try {
      const res = await Auth.apiRequest('/balance/company', {
        method: 'POST',
        body: JSON.stringify({})
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          balanceElem.textContent = 'IP Bloqueado';
          balanceElem.title = 'Cadastre seu IP em Configurações > IP Permitidos para consulta de saldo via API';
          return;
        }
        balanceElem.textContent = 'Indisponível';
        return;
      }

      const data = res.data;
      let balanceFound = null;

      if (Array.isArray(data)) {
        const brlObj = data.find(item => {
          const name = item.name || (item.currency && item.currency.name) || '';
          const type = item.type || (item.currency && item.currency.type) || '';
          return name.toUpperCase() === 'BRL' || type.toUpperCase() === 'PIX';
        }) || data[0];

        if (brlObj) {
          balanceFound = brlObj.totalAmount ?? brlObj.amount ?? brlObj.balance ?? brlObj.available ?? 0;
        }
      } else if (typeof data === 'object' && data !== null) {
        balanceFound = data.totalAmount ?? data.amount ?? data.balance ?? null;
      }

      if (balanceFound !== null) {
        balanceElem.textContent = Utils.formatMoney(balanceFound);
        balanceElem.title = 'Saldo BRL disponível';
      } else {
        balanceElem.textContent = 'R$ 0,00';
      }

    } catch (err) {
      balanceElem.textContent = 'Indisponível';
    } finally {
      balanceElem.classList.remove('loading-pulse');
    }
  },

  setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const target = document.getElementById(tab.getAttribute('data-tab'));
        if (target) {
          target.classList.add('active');
        }
      });
    });
  }
};

// ==============================================================
// CONTROLADOR DO FLUXO DE SAQUE (CASH-OUT)
// ==============================================================
const WithdrawWizard = {
  clientMode: 'existing',
  customer: null,
  pixKeys: [],
  selectedPixKey: null,

  init() {
    const btnVerify = document.getElementById('w-btn-verify-id');
    if (btnVerify) btnVerify.addEventListener('click', () => this.verifyCustomer());

    const btnStep1 = document.getElementById('w-btn-step1-next');
    if (btnStep1) btnStep1.addEventListener('click', () => this.submitStep1());

    const pixTypeSelect = document.getElementById('w-new-pix-type');
    if (pixTypeSelect) {
      pixTypeSelect.addEventListener('change', (e) => {
        const ddiWrap = document.getElementById('w-phone-ddi-wrap');
        if (ddiWrap) ddiWrap.style.display = e.target.value === 'PHONE' ? 'block' : 'none';
      });
    }

    const btnAddPix = document.getElementById('w-btn-add-pix');
    if (btnAddPix) btnAddPix.addEventListener('click', () => this.addPixKey());

    const btnStep2 = document.getElementById('w-btn-step2-next');
    if (btnStep2) btnStep2.addEventListener('click', () => this.submitStep2());

    const btnStep3 = document.getElementById('w-btn-step3-next');
    if (btnStep3) btnStep3.addEventListener('click', () => this.submitStep3());

    const btnExec = document.getElementById('w-btn-execute');
    if (btnExec) btnExec.addEventListener('click', () => this.executeWithdraw());
  },

  setClientMode(mode) {
    this.clientMode = mode;
    document.getElementById('w-opt-existing').classList.toggle('selected', mode === 'existing');
    document.getElementById('w-opt-new').classList.toggle('selected', mode === 'new');
    document.getElementById('w-client-existing-box').style.display = mode === 'existing' ? 'block' : 'none';
    document.getElementById('w-client-new-box').style.display = mode === 'new' ? 'block' : 'none';
    this.customer = null;
    document.getElementById('w-cust-preview').style.display = 'none';
  },

  goToStep(stepNumber) {
    for (let i = 1; i <= 4; i++) {
      const stepEl = document.getElementById(`w-step-${i}`);
      const indEl = document.getElementById(`w-step-ind-${i}`);
      if (stepEl) stepEl.classList.toggle('active', i === stepNumber);
      if (indEl) {
        indEl.classList.toggle('active', i === stepNumber);
        indEl.classList.toggle('completed', i < stepNumber);
      }
    }
  },

  async verifyCustomer() {
    Utils.clearAlert('w-step1-alert');
    const id = document.getElementById('w-search-cust-id').value.trim();
    if (!id) {
      Toast.show('Informe o ID do cliente.', 'warning');
      return;
    }

    const btn = document.getElementById('w-btn-verify-id');
    btn.disabled = true;
    btn.textContent = 'Verificando...';

    try {
      const res = await Auth.apiRequest(`/customer/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(res.data.message || 'Cliente não encontrado.');

      this.customer = res.data;
      this.renderCustomerPreview('w', this.customer);
      Toast.show('Cliente localizado com sucesso!', 'success');
    } catch (e) {
      Utils.showAlert('w-step1-alert', e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Verificar ID';
    }
  },

  async submitStep1() {
    Utils.clearAlert('w-step1-alert');

    if (this.clientMode === 'existing') {
      if (!this.customer || !this.customer._id) {
        Toast.show('Verifique o ID do cliente antes de avançar.', 'warning');
        return;
      }
      this.goToStep(2);
      this.loadPixKeys();
    } else {
      const originalName = document.getElementById('w-new-name').value.trim();
      const doc = document.getElementById('w-new-doc').value.trim().replace(/\D/g, '');
      const email = document.getElementById('w-new-email').value.trim();

      if (!originalName) {
        Toast.show('O nome do cliente é obrigatório.', 'warning');
        return;
      }

      const apiName = `${originalName} - XG-${Utils.generateSuffix()}`;
      const payload = { name: apiName, document: doc };
      if (email) payload.email = email;

      try {
        const res = await Auth.apiRequest('/customer', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(res.data.message || 'Falha ao cadastrar cliente.');

        this.customer = res.data.customer || res.data;
        this.renderCustomerPreview('w', this.customer, originalName);
        Toast.show('Cliente cadastrado com sucesso!', 'success');

        this.goToStep(2);
        this.loadPixKeys();
      } catch (e) {
        Utils.showAlert('w-step1-alert', e.message);
      }
    }
  },

  renderCustomerPreview(prefix, cust, overrideCleanName) {
    document.getElementById(`${prefix}-prev-name`).textContent = Utils.escapeHtml(overrideCleanName || Utils.cleanName(cust.name));
    document.getElementById(`${prefix}-prev-doc`).textContent = Utils.escapeHtml(cust.document || '(Sem documento cadastrado)');
    document.getElementById(`${prefix}-prev-id`).textContent = Utils.escapeHtml(cust._id);
    document.getElementById(`${prefix}-cust-preview`).style.display = 'block';
  },

  async loadPixKeys() {
    const container = document.getElementById('w-pix-keys-container');
    container.innerHTML = '<div style="font-size: 13px; color: var(--text-muted);">Consultando chaves cadastradas...</div>';

    try {
      const res = await Auth.apiRequest(`/pix/customer/${encodeURIComponent(this.customer._id)}/key`);
      if (res.ok && Array.isArray(res.data)) {
        this.pixKeys = res.data;
        this.renderPixKeys();
      } else {
        container.innerHTML = '<div style="font-size: 13px; color: var(--danger);">Erro ao buscar chaves Pix.</div>';
      }
    } catch (e) {
      container.innerHTML = '<div style="font-size: 13px; color: var(--danger);">Falha de comunicação.</div>';
    }
  },

  renderPixKeys() {
    const container = document.getElementById('w-pix-keys-container');
    if (this.pixKeys.length === 0) {
      container.innerHTML = '<div style="font-size: 13px; color: var(--warning);">Nenhuma chave cadastrada para este cliente. Cadastre uma abaixo.</div>';
      this.selectedPixKey = null;
      return;
    }

    if (!this.selectedPixKey) {
      this.selectedPixKey = this.pixKeys[0];
    }

    container.innerHTML = this.pixKeys.map(k => {
      const isSel = this.selectedPixKey && this.selectedPixKey._id === k._id;
      return `
        <div class="pix-key-item ${isSel ? 'selected' : ''}" onclick="WithdrawWizard.selectKey('${Utils.escapeHtml(k._id)}')">
          <div class="pix-key-left">
            <input type="radio" name="selectedKeyRadio" ${isSel ? 'checked' : ''} />
            <span class="pix-key-type">${Utils.escapeHtml(k.type)}</span>
            <span class="pix-key-val">${Utils.escapeHtml(k.key)}</span>
          </div>
          <button type="button" class="btn-delete-key" onclick="event.stopPropagation(); WithdrawWizard.deleteKey('${Utils.escapeHtml(k._id)}')" title="Excluir chave">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
    }).join('');
  },

  selectKey(keyId) {
    this.selectedPixKey = this.pixKeys.find(k => k._id === keyId);
    this.renderPixKeys();
  },

  async addPixKey() {
    Utils.clearAlert('w-step2-alert');
    const type = document.getElementById('w-new-pix-type').value;
    let keyVal = document.getElementById('w-new-pix-val').value.trim();

    if (!keyVal) {
      Toast.show('Informe o valor da chave Pix.', 'warning');
      return;
    }

    if (type === 'PHONE') {
      const ddi = document.getElementById('w-phone-ddi').value;
      if (!keyVal.startsWith('+')) {
        keyVal = `${ddi}${keyVal.replace(/\D/g, '')}`;
      }
    }

    try {
      const res = await Auth.apiRequest(`/pix/customer/${encodeURIComponent(this.customer._id)}/key`, {
        method: 'POST',
        body: JSON.stringify({ key: keyVal, type: type })
      });

      if (!res.ok) throw new Error(res.data.message || 'Erro ao registrar chave Pix.');

      document.getElementById('w-new-pix-val').value = '';
      Toast.show('Chave cadastrada com sucesso!', 'success');
      this.selectedPixKey = res.data;
      await this.loadPixKeys();
    } catch (e) {
      Utils.showAlert('w-step2-alert', e.message);
    }
  },

  async deleteKey(keyId) {
    const confirmed = await Modal.confirm('Excluir Chave Pix', 'Deseja realmente remover esta chave Pix? Ela não poderá mais ser utilizada para saques.', true);
    if (!confirmed) return;

    try {
      const res = await Auth.apiRequest(`/pix/customer/${encodeURIComponent(this.customer._id)}/key/remove/${encodeURIComponent(keyId)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(res.data.message || 'Falha ao remover chave.');

      Toast.show('Chave Pix removida com sucesso!', 'success');
      if (this.selectedPixKey && this.selectedPixKey._id === keyId) {
        this.selectedPixKey = null;
      }
      await this.loadPixKeys();
    } catch (e) {
      Utils.showAlert('w-step2-alert', e.message);
    }
  },

  submitStep2() {
    Utils.clearAlert('w-step2-alert');
    if (!this.selectedPixKey) {
      Toast.show('Selecione uma chave Pix para continuar.', 'warning');
      return;
    }
    this.goToStep(3);
  },

  submitStep3() {
    const amount = parseFloat(document.getElementById('w-amount').value);
    if (!amount || amount <= 0) {
      Toast.show('Informe um valor de saque válido.', 'warning');
      return;
    }

    document.getElementById('rev-w-cust-name').textContent = Utils.escapeHtml(Utils.cleanName(this.customer.name));
    document.getElementById('rev-w-cust-doc').textContent = Utils.escapeHtml(this.customer.document || 'Não informado');
    document.getElementById('rev-w-pix-key').textContent = Utils.escapeHtml(this.selectedPixKey.key);
    document.getElementById('rev-w-pix-type').textContent = Utils.escapeHtml(this.selectedPixKey.type);
    document.getElementById('rev-w-amount').textContent = Utils.formatMoney(amount);
    document.getElementById('rev-w-titularidade').textContent = document.getElementById('w-identified-doc').checked ? 'Ativada (Sim)' : 'Desativada (Não)';

    this.goToStep(4);
  },

  async executeWithdraw() {
    Utils.clearAlert('w-step4-alert');
    const btn = document.getElementById('w-btn-execute');
    btn.disabled = true;
    btn.textContent = 'Enviando Ordem...';

    const amount = parseFloat(document.getElementById('w-amount').value);
    const extId = document.getElementById('w-external-id').value.trim();
    const identified = document.getElementById('w-identified-doc').checked;

    const payload = {
      amount: amount,
      customerId: this.customer._id,
      currency: {
        _id: App.withdrawCurrency._id,
        name: App.withdrawCurrency.name,
        type: App.withdrawCurrency.type,
        symbol: App.withdrawCurrency.symbol
      },
      pixKey: {
        _id: this.selectedPixKey._id,
        key: this.selectedPixKey.key,
        type: this.selectedPixKey.type
      }
    };

    if (extId) payload.externalId = extId;
    if (identified) payload.identifiedDocumentPix = true;

    try {
      const res = await Auth.apiRequest('/withdraw', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Falha de permissão: IP não autorizado em "Permissões de IP" no painel da XGate.');
        }
        if (res.status === 422) {
          throw new Error(`Política do Pix rejeitada: ${res.data.reason || res.data.message || 'Verifique o documento de titularidade.'}`);
        }
        throw new Error(res.data.message || `Erro no processamento (${res.status})`);
      }

      document.getElementById('w-trans-id').textContent = Utils.escapeHtml(res.data._id || '---');
      document.getElementById('w-trans-status').textContent = Utils.escapeHtml(res.data.status || 'PENDING');
      document.getElementById('w-success-card').style.display = 'block';
      document.getElementById('w-review-actions').style.display = 'none';

      Toast.show('Ordem de saque criada com sucesso!', 'success');
      setTimeout(() => App.fetchBalance(), 1000);
    } catch (e) {
      Utils.showAlert('w-step4-alert', e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Confirmar e Autorizar Saque';
    }
  },

  reset(clearClient = true) {
    document.getElementById('w-amount').value = '';
    document.getElementById('w-external-id').value = '';
    document.getElementById('w-success-card').style.display = 'none';
    document.getElementById('w-review-actions').style.display = 'flex';
    Utils.clearAlert('w-step4-alert');

    if (clearClient) {
      this.customer = null;
      this.selectedPixKey = null;
      document.getElementById('w-search-cust-id').value = '';
      document.getElementById('w-new-name').value = '';
      document.getElementById('w-new-doc').value = '';
      document.getElementById('w-new-email').value = '';
      document.getElementById('w-cust-preview').style.display = 'none';
      this.goToStep(1);
    } else {
      this.goToStep(3);
    }
  }
};

// ==============================================================
// CONTROLADOR DO FLUXO DE DEPÓSITO (CASH-IN)
// ==============================================================
const DepositWizard = {
  clientMode: 'existing',
  customer: null,

  init() {
    const btnVerify = document.getElementById('d-btn-verify-id');
    if (btnVerify) btnVerify.addEventListener('click', () => this.verifyCustomer());

    const btnStep1 = document.getElementById('d-btn-step1-next');
    if (btnStep1) btnStep1.addEventListener('click', () => this.submitStep1());

    const btnStep2 = document.getElementById('d-btn-step2-next');
    if (btnStep2) btnStep2.addEventListener('click', () => this.submitStep2());

    const btnExec = document.getElementById('d-btn-execute');
    if (btnExec) btnExec.addEventListener('click', () => this.executeDeposit());

    const btnCopy = document.getElementById('d-btn-copy-pix');
    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const code = document.getElementById('d-pix-copy-input').value;
        if (!code) return;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(code);
          } else {
            const tempArea = document.createElement('textarea');
            tempArea.value = code;
            tempArea.style.position = 'fixed';
            tempArea.style.opacity = '0';
            document.body.appendChild(tempArea);
            tempArea.select();
            document.execCommand('copy');
            document.body.removeChild(tempArea);
          }
          Toast.show('Código Pix Copia e Cola copiado!', 'success');
        } catch (e) {
          prompt('Copie o código Pix manualmente:', code);
        }
      });
    }
  },

  setClientMode(mode) {
    this.clientMode = mode;
    document.getElementById('d-opt-existing').classList.toggle('selected', mode === 'existing');
    document.getElementById('d-opt-new').classList.toggle('selected', mode === 'new');
    document.getElementById('d-client-existing-box').style.display = mode === 'existing' ? 'block' : 'none';
    document.getElementById('d-client-new-box').style.display = mode === 'new' ? 'block' : 'none';
    this.customer = null;
    document.getElementById('d-cust-preview').style.display = 'none';
  },

  goToStep(stepNumber) {
    for (let i = 1; i <= 3; i++) {
      const stepEl = document.getElementById(`d-step-${i}`);
      const indEl = document.getElementById(`d-step-ind-${i}`);
      if (stepEl) stepEl.classList.toggle('active', i === stepNumber);
      if (indEl) {
        indEl.classList.toggle('active', i === stepNumber);
        indEl.classList.toggle('completed', i < stepNumber);
      }
    }
  },

  async verifyCustomer() {
    Utils.clearAlert('d-step1-alert');
    const id = document.getElementById('d-search-cust-id').value.trim();
    if (!id) {
      Toast.show('Informe o ID do cliente.', 'warning');
      return;
    }

    const btn = document.getElementById('d-btn-verify-id');
    btn.disabled = true;
    btn.textContent = 'Verificando...';

    try {
      const res = await Auth.apiRequest(`/customer/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(res.data.message || 'Cliente não encontrado.');

      this.customer = res.data;
      WithdrawWizard.renderCustomerPreview('d', this.customer);
      Toast.show('Cliente localizado!', 'success');
    } catch (e) {
      Utils.showAlert('d-step1-alert', e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Verificar ID';
    }
  },

  async submitStep1() {
    Utils.clearAlert('d-step1-alert');

    if (this.clientMode === 'existing') {
      if (!this.customer || !this.customer._id) {
        Toast.show('Verifique o ID do cliente antes de avançar.', 'warning');
        return;
      }
      this.goToStep(2);
    } else {
      const originalName = document.getElementById('d-new-name').value.trim();
      const doc = document.getElementById('d-new-doc').value.trim().replace(/\D/g, '');
      const email = document.getElementById('d-new-email').value.trim();

      if (!originalName) {
        Toast.show('O nome do cliente é obrigatório.', 'warning');
        return;
      }

      const apiName = `${originalName} - XG-${Utils.generateSuffix()}`;
      const payload = { name: apiName, document: doc };
      if (email) payload.email = email;

      try {
        const res = await Auth.apiRequest('/customer', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(res.data.message || 'Falha ao registrar cliente.');

        this.customer = res.data.customer || res.data;
        WithdrawWizard.renderCustomerPreview('d', this.customer, originalName);
        Toast.show('Cliente cadastrado com sucesso!', 'success');
        this.goToStep(2);
      } catch (e) {
        Utils.showAlert('d-step1-alert', e.message);
      }
    }
  },

  submitStep2() {
    const amount = parseFloat(document.getElementById('d-amount').value);
    if (!amount || amount <= 0) {
      Toast.show('Informe um valor de depósito válido.', 'warning');
      return;
    }

    document.getElementById('rev-d-cust-name').textContent = Utils.escapeHtml(Utils.cleanName(this.customer.name));
    document.getElementById('rev-d-cust-doc').textContent = Utils.escapeHtml(this.customer.document || 'Não informado');
    document.getElementById('rev-d-amount').textContent = Utils.formatMoney(amount);

    this.goToStep(3);
  },

  async executeDeposit() {
    Utils.clearAlert('d-step3-alert');
    const btn = document.getElementById('d-btn-execute');
    btn.disabled = true;
    btn.textContent = 'Gerando Cobrança...';

    const amount = parseFloat(document.getElementById('d-amount').value);
    const extId = document.getElementById('d-external-id').value.trim();
    const identified = document.getElementById('d-identified-doc').checked;

    const payload = {
      amount: amount,
      customerId: this.customer._id,
      currency: {
        _id: App.depositCurrency._id,
        name: App.depositCurrency.name,
        type: App.depositCurrency.type,
        symbol: App.depositCurrency.symbol
      }
    };

    if (extId) payload.externalId = extId;
    if (identified) payload.identifiedDocumentPix = true;

    try {
      const res = await Auth.apiRequest('/deposit', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(res.data.message || 'Falha ao gerar cobrança Pix.');

      const responseData = res.data || {};
      const nestedData = responseData.data || {};
      const pixCode = nestedData.code || responseData.code || (nestedData.pix && nestedData.pix.code) || (responseData.pix && responseData.pix.code);

      if (!pixCode) {
        throw new Error('A API não retornou o código Pix Copia e Cola.');
      }

      document.getElementById('d-pix-copy-input').value = pixCode;
      document.getElementById('d-qr-area').style.display = 'block';
      document.getElementById('d-review-actions').style.display = 'none';

      const qrBox = document.getElementById('d-qr-canvas-box');
      qrBox.innerHTML = '';

      try {
        if (typeof QRCode === 'function') {
          const qrOptions = {
            text: pixCode,
            width: 170,
            height: 170,
            colorDark: '#000000',
            colorLight: '#ffffff'
          };

          if (QRCode.CorrectLevel && QRCode.CorrectLevel.M !== undefined) {
            qrOptions.correctLevel = QRCode.CorrectLevel.M;
          }

          new QRCode(qrBox, qrOptions);
        } else if (typeof QRCode !== 'undefined' && typeof QRCode.toCanvas === 'function') {
          const canvas = document.createElement('canvas');
          qrBox.appendChild(canvas);
          QRCode.toCanvas(canvas, pixCode, { width: 170, margin: 1 });
        }
      } catch (renderErr) {
        // Fallback visual
      }

      Toast.show('QR Code Pix gerado com sucesso!', 'success');
    } catch (e) {
      Utils.showAlert('d-step3-alert', e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Gerar QR Code Pix';
    }
  },

  reset(clearClient = true) {
    document.getElementById('d-amount').value = '';
    document.getElementById('d-external-id').value = '';
    document.getElementById('d-qr-area').style.display = 'none';
    document.getElementById('d-review-actions').style.display = 'flex';
    Utils.clearAlert('d-step3-alert');

    if (clearClient) {
      this.customer = null;
      document.getElementById('d-search-cust-id').value = '';
      document.getElementById('d-new-name').value = '';
      document.getElementById('d-new-doc').value = '';
      document.getElementById('d-new-email').value = '';
      document.getElementById('d-cust-preview').style.display = 'none';
      this.goToStep(1);
    } else {
      this.goToStep(2);
    }
  }
};

// ==============================================================
// INICIALIZAÇÃO SEGURA
// ==============================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}