document.addEventListener('DOMContentLoaded', () => {
  // Redireciona caso já tenha sessão ativa
  Auth.redirectIfAuthenticated();

  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.getElementById('togglePassword');
  const eyeIcon = document.getElementById('eyeIcon');
  const btnSubmit = document.getElementById('btnSubmit');
  const btnText = document.getElementById('btnText');
  const spinner = document.getElementById('spinner');
  const alertBox = document.getElementById('alertBox');

  // Alternar visualização da senha sem recarregar nem quebrar layout
  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

    eyeIcon.innerHTML = isPassword
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
  });

  function showAlert(msg, type = 'error') {
    alertBox.textContent = msg;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
  }

  function setLoading(loading) {
    btnSubmit.disabled = loading;
    spinner.style.display = loading ? 'inline-block' : 'none';
    btnText.textContent = loading ? 'Autenticando...' : 'Entrar';
  }

  // Disparo do Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.style.display = 'none';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    setLoading(true);

    try {
      const response = await fetch(`${Auth.BASE_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('E-mail ou senha incorretos.');
        }
        throw new Error(data.message || `Erro de autenticação (HTTP ${response.status})`);
      }

      const token = data.token || data.accessToken || (data.data && data.data.token);

      if (!token) {
        throw new Error('Token JWT não retornado pela API.');
      }

      // Salva sessão temporária (destruída ao fechar o navegador/aba)
      Auth.saveSession(token, email);
      showAlert('Login realizado com sucesso! Redirecionando...', 'success');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 600);

    } catch (err) {
      console.error(err);
      showAlert(err.message || 'Erro de conexão com a API da XGate.');
    } finally {
      setLoading(false);
    }
  });
});