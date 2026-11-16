const STRAPI_URL = 'http://localhost:1337';

const btnLogin = document.getElementById('btn-login');
const modalLogin = document.getElementById('modal-login');
const btnFechar = document.getElementById('fechar-login');
const btnCancelar = document.getElementById('cancelar-login');
const formLogin = document.getElementById('form-login');
const msgErro = document.getElementById('login-erro');

let modoCadastroAtivo = false;

function prepararModoCadastroNoModal() {
  if (!formLogin || document.getElementById('login-modo-container')) return;

  const submitBtn = formLogin.querySelector('button[type="submit"]');
  const tituloModal = modalLogin?.querySelector('h2');

  const containerAlternancia = document.createElement('div');
  containerAlternancia.id = 'login-modo-container';
  containerAlternancia.className =
    'flex items-center justify-between text-xs text-stone-300 border-b border-[#354f43] pb-3 mb-4';
  containerAlternancia.innerHTML = `
    <span id="login-modo-label" class="text-stone-300">Entre com a sua conta para comentar</span>
    <button type="button" id="btn-alternar-cadastro" class="text-brand-ochre hover:underline font-semibold">
      Criar conta de turista
    </button>
  `;

  const campoEmailExtra = document.createElement('div');
  campoEmailExtra.id = 'campo-cadastro-email';
  campoEmailExtra.className = 'hidden';
  campoEmailExtra.innerHTML = `
    <label for="cadastro-email" class="block text-sm font-medium text-stone-300 mb-1">
      E-mail
    </label>
    <input
      type="email"
      id="cadastro-email"
      placeholder="Ex.: turista@email.com"
      class="w-full px-3.5 py-2.5 rounded-lg bg-[#1f2e27] border border-[#354f43] text-stone-100 placeholder-stone-500 focus:outline-none focus:border-brand-ochre"
    />
  `;

  formLogin.insertBefore(containerAlternancia, formLogin.firstChild);
  const senhaInput = document.getElementById('login-password');
  if (senhaInput?.parentElement) {
    formLogin.insertBefore(campoEmailExtra, senhaInput.parentElement);
  }

  const btnAlternar = document.getElementById('btn-alternar-cadastro');
  btnAlternar.addEventListener('click', () => {
    modoCadastroAtivo = !modoCadastroAtivo;
    if (msgErro) msgErro.textContent = '';

    const emailInput = document.getElementById('cadastro-email');
    if (modoCadastroAtivo) {
      if (tituloModal) tituloModal.textContent = 'Cadastro de Turista';
      document.getElementById('login-modo-label').textContent =
        'Crie uma conta para publicar experiências';
      btnAlternar.textContent = 'Já tenho conta (Entrar)';
      campoEmailExtra.classList.remove('hidden');
      if (emailInput) emailInput.required = true;
      if (submitBtn) submitBtn.textContent = 'Cadastrar';
    } else {
      if (tituloModal) tituloModal.textContent = 'Acessar Portal';
      document.getElementById('login-modo-label').textContent =
        'Entre com a sua conta para comentar';
      btnAlternar.textContent = 'Criar conta de turista';
      campoEmailExtra.classList.add('hidden');
      if (emailInput) emailInput.required = false;
      if (submitBtn) submitBtn.textContent = 'Entrar';
    }
  });
}

function resetarModoLoginPadrao() {
  modoCadastroAtivo = false;
  const tituloModal = modalLogin?.querySelector('h2');
  const modoLabel = document.getElementById('login-modo-label');
  const btnAlternar = document.getElementById('btn-alternar-cadastro');
  const campoEmailExtra = document.getElementById('campo-cadastro-email');
  const emailInput = document.getElementById('cadastro-email');
  const submitBtn = formLogin?.querySelector('button[type="submit"]');

  if (tituloModal) tituloModal.textContent = 'Acessar Portal';
  if (modoLabel) modoLabel.textContent = 'Entre com a sua conta para comentar';
  if (btnAlternar) btnAlternar.textContent = 'Criar conta de turista';
  if (campoEmailExtra) campoEmailExtra.classList.add('hidden');
  if (emailInput) emailInput.required = false;
  if (submitBtn) submitBtn.textContent = 'Entrar';
}

function criarBotaoSairSeNecessario() {
  if (!btnLogin || document.getElementById('btn-logout')) return;

  const btnSair = document.createElement('button');
  btnSair.type = 'button';
  btnSair.id = 'btn-logout';
  btnSair.textContent = 'Sair';
  btnSair.className =
    'hidden bg-stone-800 hover:bg-red-900/80 text-stone-300 hover:text-white border border-stone-700 px-3 py-2 rounded-lg text-xs font-semibold transition';

  btnSair.addEventListener('click', () => {
    localStorage.removeItem('strapi_jwt');
    localStorage.removeItem('strapi_user');
    atualizarInterfacePorUsuario(null);
    if (typeof window.atualizarEstadoChat === 'function') {
      window.atualizarEstadoChat();
    }
    if (typeof openTab === 'function') {
      openTab('inicio');
    }
  });

  btnLogin.insertAdjacentElement('afterend', btnSair);
}

function abrirModalLogin(e) {
  if (e) e.preventDefault();
  prepararModoCadastroNoModal();
  if (localStorage.getItem('strapi_jwt') && localStorage.getItem('strapi_user')) {
    return;
  }
  if (msgErro) msgErro.textContent = '';
  if (formLogin) formLogin.reset();
  resetarModoLoginPadrao();
  if (modalLogin) {
    modalLogin.classList.remove('hidden');
  }
}

function fecharModalLogin() {
  if (modalLogin) {
    modalLogin.classList.add('hidden');
  }
}

prepararModoCadastroNoModal();
criarBotaoSairSeNecessario();

if (btnLogin) {
  btnLogin.addEventListener('click', abrirModalLogin);
}

if (btnFechar) {
  btnFechar.addEventListener('click', fecharModalLogin);
}

if (btnCancelar) {
  btnCancelar.addEventListener('click', fecharModalLogin);
}

if (modalLogin) {
  modalLogin.addEventListener('click', (e) => {
    if (e.target === modalLogin) {
      fecharModalLogin();
    }
  });
}

function obterNomePapel(user) {
  if (!user) return 'Turista';
  if (typeof user.role === 'string') return user.role;
  const papelApi = user?.role?.name || user?.role?.type;
  if (papelApi) return papelApi;

  const username = String(user.username || '').toLowerCase();
  const email = String(user.email || '').toLowerCase();
  if (username === 'alysson' || email === 'alyssonqwerty@gmail.com') {
    return 'Gestor';
  }

  return 'Turista';
}

function aplicarPermissoesPorPapel(roleName, logado = true) {
  const isGestor = logado && String(roleName).toLowerCase() === 'gestor';
  const painelGestor = document.getElementById('painel-gestor');

  if (painelGestor) {
    painelGestor.classList.toggle('hidden', !isGestor);
  }

  if (!isGestor && typeof window.fecharModalAdmin === 'function') {
    window.fecharModalAdmin();
  }

  document.querySelectorAll('.gestor-only').forEach((el) => {
    el.classList.toggle('hidden', !isGestor);
  });

  if (typeof window.atualizarEstadoChat === 'function') {
    window.atualizarEstadoChat();
  }
}

function atualizarInterfacePorUsuario(user) {
  const btnSair = document.getElementById('btn-logout');
  if (!btnLogin) return;

  if (!user) {
    btnLogin.textContent = 'Login';
    if (btnSair) btnSair.classList.add('hidden');
    aplicarPermissoesPorPapel('Turista', false);
    return;
  }

  const papel = obterNomePapel(user);
  btnLogin.textContent = `${user.username} (${papel})`;
  if (btnSair) btnSair.classList.remove('hidden');
  aplicarPermissoesPorPapel(papel, true);
}

if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgErro.textContent = modoCadastroAtivo
      ? 'A criar conta de turista...'
      : 'A autenticar no Strapi...';

    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;
    const emailCadastro = document.getElementById('cadastro-email')?.value.trim();

    try {
      let authData;

      if (modoCadastroAtivo) {
        const regRes = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: identifier,
            email: emailCadastro,
            password,
          }),
        });

        authData = await regRes.json();
        if (!regRes.ok) {
          msgErro.textContent =
            authData?.error?.message ||
            'Não foi possível concluir o cadastro. Verifique utilizador, e-mail e palavra-passe.';
          return;
        }
      } else {
        const authRes = await fetch(`${STRAPI_URL}/api/auth/local`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });

        authData = await authRes.json();
        if (!authRes.ok) {
          msgErro.textContent =
            authData?.error?.message || 'Utilizador ou palavra-passe inválidos.';
          return;
        }
      }

      const jwt = authData.jwt;

      const meRes = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      let userData = meRes.ok ? await meRes.json() : authData.user || {};

      if (!userData?.role && userData?.id) {
        const userDetailRes = await fetch(
          `${STRAPI_URL}/api/users/${userData.id}?populate=role`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
        if (userDetailRes.ok) {
          const fullUser = await userDetailRes.json();
          userData = { ...userData, ...fullUser };
        }
      }

      const roleName = obterNomePapel(userData);

      localStorage.setItem('strapi_jwt', jwt);
      localStorage.setItem('strapi_user', JSON.stringify(userData));

      atualizarInterfacePorUsuario(userData);
      fecharModalLogin();

      if (String(roleName).toLowerCase() === 'gestor') {
        alert(
          `Sessão iniciada como GESTOR (${userData.username}). Área de gestão libertada.`
        );
      } else {
        alert(
          modoCadastroAtivo
            ? `Conta criada com sucesso! Bem-vindo(a), ${userData.username}.`
            : `Sessão iniciada como TURISTA (${userData.username}). Já pode comentar e falar com a gestão.`
        );
      }
    } catch (_) {
      msgErro.textContent =
        'Falha ao ligar a http://localhost:1337. Verifique se o Strapi está a correr e se o CORS permite esta origem.';
    }
  });
}

window.abrirModalLogin = abrirModalLogin;

const usuarioSalvo = localStorage.getItem('strapi_user');
const jwtSalvo = localStorage.getItem('strapi_jwt');
if (usuarioSalvo && jwtSalvo) {
  try {
    atualizarInterfacePorUsuario(JSON.parse(usuarioSalvo));
  } catch (_) {
    localStorage.removeItem('strapi_user');
    localStorage.removeItem('strapi_jwt');
    atualizarInterfacePorUsuario(null);
  }
} else {
  atualizarInterfacePorUsuario(null);
}