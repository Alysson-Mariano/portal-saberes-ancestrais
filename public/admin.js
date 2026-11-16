(() => {
  const API_BASE_URL =
    window.location.port === '3000'
      ? `${window.location.origin}/api`
      : 'http://localhost:3000/api';

  const IMAGEM_PADRAO =
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80';

  const CATEGORIAS_META = {
    gastronomia: {
      tituloPainel: 'Gastronomia Tradicional',
      rota: 'gastronomia',
      aba: 'gastronomia',
      iconePadrao: '🔥',
      subtituloPadrao: 'Saberes Culinários Macuxi',
    },
    oficinas: {
      tituloPainel: 'Oficinas & Saberes Práticos',
      rota: 'oficinas',
      aba: 'oficinas',
      iconePadrao: '🏺',
      subtituloPadrao: 'Vivência Ancestral Macuxi',
    },
    entidades: {
      tituloPainel: 'Entidades Lendárias & Cosmologia',
      rota: 'entities',
      aba: 'entidades',
      iconePadrao: '✨',
      subtituloPadrao: 'Cosmovisão e Narrativas Macuxi',
    },
  };

  let categoriaAtivaAdmin = 'gastronomia';
  let editandoId = null;
  let albumFotosAdmin = [];
  let enviandoFotos = false;

  function obterHeadersAuth() {
    const headers = { 'Content-Type': 'application/json' };
    const jwt = localStorage.getItem('strapi_jwt');
    if (jwt) {
      headers.Authorization = `Bearer ${jwt}`;
    }
    return headers;
  }

  function escaparHtml(texto) {
    return String(texto ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function obterListaFotosItem(item) {
    if (Array.isArray(item?.imagens) && item.imagens.length > 0) {
      return item.imagens.filter(Boolean);
    }
    if (item?.imagem) {
      return [item.imagem];
    }
    return [];
  }

  function renderizarAlbumAdmin() {
    const gridAlbum = document.getElementById('admin-album-grid');
    if (!gridAlbum) return;

    if (!albumFotosAdmin.length) {
      gridAlbum.innerHTML =
        '<p class="col-span-full text-[11px] text-stone-400">Nenhuma foto acumulada ainda (se vazio, usará a imagem padrão).</p>';
      return;
    }

    gridAlbum.innerHTML = albumFotosAdmin
      .map(
        (url, idx) => `
        <div class="relative group rounded-lg overflow-hidden border border-[#354f43] bg-[#1f2e27] h-20">
          <img src="${escaparHtml(url)}" alt="Foto ${idx + 1}" class="w-full h-full object-cover" />
          <span class="absolute bottom-1 left-1 bg-black/75 text-[10px] text-stone-200 px-1.5 py-0.5 rounded">
            ${idx === 0 ? 'Capa' : `#${idx + 1}`}
          </span>
          <button type="button" data-remover-foto="${idx}" title="Remover foto"
            class="absolute top-1 right-1 bg-red-700/90 hover:bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            &times;
          </button>
        </div>
      `
      )
      .join('');

    gridAlbum.querySelectorAll('button[data-remover-foto]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const indice = Number(btn.getAttribute('data-remover-foto'));
        albumFotosAdmin.splice(indice, 1);
        renderizarAlbumAdmin();
      });
    });
  }

  function criarModalAdminSeNaoExistir() {
    if (document.getElementById('modal-gestor-crud')) return;

    const modalHtml = `
      <div id="modal-gestor-crud" class="hidden fixed inset-0 bg-black/75 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
        <div class="bg-[#263831] text-stone-100 p-6 sm:p-7 rounded-2xl border border-[#354f43] shadow-2xl w-full max-w-2xl my-auto">
          <div class="flex items-center justify-between border-b border-[#354f43] pb-4 mb-5">
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Gestão de Conteúdo • Modo Gestor
              </span>
              <h3 id="admin-modal-titulo" class="text-xl font-bold text-white mt-0.5">
                Gerenciar Categoria
              </h3>
            </div>
            <button type="button" id="fechar-modal-admin" class="text-stone-400 hover:text-white text-2xl leading-none">
              &times;
            </button>
          </div>

          <div class="mb-6">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-semibold text-stone-200">Itens cadastrados nesta seção</h4>
              <button type="button" id="btn-novo-item-admin" class="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg font-medium transition">
                + Novo Item
              </button>
            </div>
            <div id="lista-itens-admin" class="max-h-40 overflow-y-auto space-y-2 pr-1">
              <!-- Preenchido dinamicamente -->
            </div>
          </div>

          <form id="form-item-admin" class="space-y-4 border-t border-[#354f43] pt-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="admin-titulo" class="block text-xs font-medium text-stone-300 mb-1">
                  Título *
                </label>
                <input type="text" id="admin-titulo" required placeholder="Ex.: Damurida"
                  class="w-full px-3 py-2 rounded-lg bg-[#1f2e27] border border-[#354f43] text-sm text-stone-100 focus:outline-none focus:border-brand-ochre" />
              </div>

              <div>
                <label for="admin-subtitulo" class="block text-xs font-medium text-stone-300 mb-1">
                  Subtítulo
                </label>
                <input type="text" id="admin-subtitulo" placeholder="Ex.: A Iguaria Principal Macuxi"
                  class="w-full px-3 py-2 rounded-lg bg-[#1f2e27] border border-[#354f43] text-sm text-stone-100 focus:outline-none focus:border-brand-ochre" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <div>
                <label for="admin-icone" class="block text-xs font-medium text-stone-300 mb-1">
                  Ícone / Emoji
                </label>
                <input type="text" id="admin-icone" placeholder="Ex.: 🔥 ou 🏺"
                  class="w-full px-3 py-2 rounded-lg bg-[#1f2e27] border border-[#354f43] text-sm text-stone-100 focus:outline-none focus:border-brand-ochre" />
              </div>

              <div class="sm:col-span-2">
                <label for="admin-arquivo-imagem" class="block text-xs font-medium text-stone-300 mb-1">
                  Adicionar fotos ao álbum (você pode selecionar várias ou enviar uma por vez)
                </label>
                <input type="file" id="admin-arquivo-imagem" accept="image/*" multiple
                  class="w-full text-xs text-stone-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#1f2e27] file:text-amber-300 hover:file:bg-[#354f43] cursor-pointer" />
                <div id="admin-album-grid" class="mt-2.5 grid grid-cols-3 sm:grid-cols-4 gap-2"></div>
              </div>
            </div>

            <div>
              <label for="admin-descricao" class="block text-xs font-medium text-stone-300 mb-1">
                Descrição resumida (exibida no card) *
              </label>
              <textarea id="admin-descricao" rows="2" required placeholder="Resumo curto do item..."
                class="w-full px-3 py-2 rounded-lg bg-[#1f2e27] border border-[#354f43] text-sm text-stone-100 focus:outline-none focus:border-brand-ochre"></textarea>
            </div>

            <div>
              <label for="admin-lenda" class="block text-xs font-medium text-stone-300 mb-1">
                Lenda / História Completa (exibida ao clicar no card)
              </label>
              <textarea id="admin-lenda" rows="3" placeholder="História detalhada, contexto ou significado..."
                class="w-full px-3 py-2 rounded-lg bg-[#1f2e27] border border-[#354f43] text-sm text-stone-100 focus:outline-none focus:border-brand-ochre"></textarea>
            </div>

            <div class="flex items-center justify-between pt-2">
              <span id="admin-feedback" class="text-xs text-amber-300"></span>
              <div class="flex items-center gap-3">
                <button type="button" id="cancelar-modal-admin" class="px-4 py-2 rounded-lg bg-[#1f2e27] hover:bg-[#354f43] text-stone-300 text-sm transition">
                  Fechar
                </button>
                <button type="submit" id="btn-salvar-admin" class="px-5 py-2 rounded-lg bg-brand-clay hover:bg-brand-ochre text-white text-sm font-semibold transition">
                  Salvar Item
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document
      .getElementById('fechar-modal-admin')
      .addEventListener('click', fecharModalAdmin);
    document
      .getElementById('cancelar-modal-admin')
      .addEventListener('click', fecharModalAdmin);
    document
      .getElementById('btn-novo-item-admin')
      .addEventListener('click', () => prepararFormularioNovo());
    document
      .getElementById('form-item-admin')
      .addEventListener('submit', salvarItemAdmin);

    const inputArquivo = document.getElementById('admin-arquivo-imagem');
    if (inputArquivo) {
      inputArquivo.addEventListener('change', async () => {
        const arquivos = Array.from(inputArquivo.files || []);
        if (!arquivos.length) return;

        const feedbackEl = document.getElementById('admin-feedback');
        const btnSalvar = document.getElementById('btn-salvar-admin');
        enviandoFotos = true;
        if (btnSalvar) btnSalvar.disabled = true;

        try {
          for (let i = 0; i < arquivos.length; i++) {
            if (feedbackEl) {
              feedbackEl.textContent = `Enviando foto ${i + 1} de ${arquivos.length}...`;
            }
            const urlSalva = await enviarArquivoUnico(arquivos[i]);
            if (!albumFotosAdmin.includes(urlSalva)) {
              albumFotosAdmin.push(urlSalva);
            }
            renderizarAlbumAdmin();
          }
          if (feedbackEl) {
            feedbackEl.textContent = `${arquivos.length} foto(s) adicionada(s) ao álbum. Clique em salvar para confirmar.`;
          }
        } catch (err) {
          if (feedbackEl) {
            feedbackEl.textContent = err.message || 'Erro ao enviar foto.';
          }
        } finally {
          enviandoFotos = false;
          if (btnSalvar) btnSalvar.disabled = false;
          inputArquivo.value = '';
        }
      });
    }

    const modalEl = document.getElementById('modal-gestor-crud');
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) fecharModalAdmin();
    });
  }

  function limparFormulario() {
    editandoId = null;
    albumFotosAdmin = [];
    const meta = CATEGORIAS_META[categoriaAtivaAdmin];
    const inputArquivo = document.getElementById('admin-arquivo-imagem');
    if (inputArquivo) inputArquivo.value = '';

    document.getElementById('admin-titulo').value = '';
    document.getElementById('admin-subtitulo').value = meta?.subtituloPadrao || '';
    document.getElementById('admin-icone').value = meta?.iconePadrao || '✨';
    document.getElementById('admin-descricao').value = '';
    document.getElementById('admin-lenda').value = '';
    document.getElementById('admin-feedback').textContent = '';
    document.getElementById('btn-salvar-admin').textContent = 'Salvar Novo Item';
    renderizarAlbumAdmin();
  }

  function prepararFormularioNovo() {
    limparFormulario();
    document.getElementById('admin-titulo').focus();
  }

  function preencherFormularioEdicao(item) {
    editandoId = item.id;
    const inputArquivo = document.getElementById('admin-arquivo-imagem');
    if (inputArquivo) inputArquivo.value = '';

    albumFotosAdmin = [...obterListaFotosItem(item)];

    document.getElementById('admin-titulo').value =
      item.titulo || item.title || item.name || '';
    document.getElementById('admin-subtitulo').value = item.subtitulo || '';
    document.getElementById('admin-icone').value = item.icone || item.icon || '✨';
    document.getElementById('admin-descricao').value =
      item.descricao || item.description || item.desc || '';
    document.getElementById('admin-lenda').value =
      item.lenda || item.descricao || item.description || '';
    document.getElementById('admin-feedback').textContent = `Editando item #${item.id}`;
    document.getElementById('btn-salvar-admin').textContent = 'Salvar Alterações';
    renderizarAlbumAdmin();
  }

  function renderizarListaItensModal(itens) {
    const container = document.getElementById('lista-itens-admin');
    if (!container) return;

    if (!Array.isArray(itens) || itens.length === 0) {
      container.innerHTML = `<p class="text-xs text-stone-400 py-2">Nenhum item encontrado nesta categoria.</p>`;
      return;
    }

    container.innerHTML = itens
      .map((item) => {
        const titulo = item.titulo || item.title || item.name || 'Sem título';
        const subtitulo = item.subtitulo || '';
        const qtdFotos = obterListaFotosItem(item).length;
        return `
          <div class="flex items-center justify-between gap-3 bg-[#1f2e27] border border-[#354f43] rounded-lg px-3 py-2">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-stone-100 truncate">
                ${escaparHtml(item.icone || '•')} ${escaparHtml(titulo)}
                <span class="text-[11px] font-normal text-amber-300/80 ml-1">(${qtdFotos} foto${qtdFotos === 1 ? '' : 's'})</span>
              </p>
              <p class="text-xs text-stone-400 truncate">${escaparHtml(subtitulo)}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button type="button" data-acao="editar" data-id="${escaparHtml(item.id)}"
                class="px-2.5 py-1 text-xs rounded bg-brand-clay hover:bg-brand-ochre text-white transition">
                Editar
              </button>
              <button type="button" data-acao="excluir" data-id="${escaparHtml(item.id)}"
                class="px-2.5 py-1 text-xs rounded bg-red-900/60 hover:bg-red-700 text-red-200 border border-red-700/50 transition">
                Excluir
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('button[data-acao]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const acao = btn.getAttribute('data-acao');
        const id = btn.getAttribute('data-id');
        const itemAlvo = itens.find((it) => String(it.id) === String(id));

        if (acao === 'editar' && itemAlvo) {
          preencherFormularioEdicao(itemAlvo);
        } else if (acao === 'excluir') {
          await excluirItemAdmin(id);
        }
      });
    });
  }

  async function carregarItensCategoria(categoria) {
    const meta = CATEGORIAS_META[categoria];
    if (!meta) return [];

    try {
      const res = await fetch(`${API_BASE_URL}/${meta.rota}?t=${Date.now()}`);
      if (!res.ok) throw new Error('Falha ao buscar itens');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (_) {
      return Array.isArray(window.dadosLocais?.[categoria])
        ? window.dadosLocais[categoria]
        : [];
    }
  }

  async function abrirModalAdmin(categoria) {
    if (!localStorage.getItem('strapi_jwt')) {
      alert('Faça login como gestor para gerenciar conteúdos.');
      return;
    }

    criarModalAdminSeNaoExistir();
    categoriaAtivaAdmin = CATEGORIAS_META[categoria] ? categoria : 'gastronomia';
    const meta = CATEGORIAS_META[categoriaAtivaAdmin];

    document.getElementById('admin-modal-titulo').textContent =
      `Gerenciar — ${meta.tituloPainel}`;
    limparFormulario();

    document.getElementById('modal-gestor-crud').classList.remove('hidden');

    const itens = await carregarItensCategoria(categoriaAtivaAdmin);
    renderizarListaItensModal(itens);
  }

  function fecharModalAdmin() {
    const modal = document.getElementById('modal-gestor-crud');
    if (modal) modal.classList.add('hidden');
  }

  async function enviarArquivoUnico(arquivo) {
    const formData = new FormData();
    formData.append('imagem', arquivo);

    const headers = {};
    const jwt = localStorage.getItem('strapi_jwt');
    if (jwt) {
      headers.Authorization = `Bearer ${jwt}`;
    }

    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      throw new Error(data.error || 'Erro ao enviar imagem para o servidor.');
    }

    return data.url;
  }

  async function salvarItemAdmin(e) {
    e.preventDefault();
    const meta = CATEGORIAS_META[categoriaAtivaAdmin];
    const feedbackEl = document.getElementById('admin-feedback');

    if (enviandoFotos) {
      feedbackEl.textContent = 'Aguarde o envio das fotos terminar antes de salvar.';
      return;
    }

    const titulo = document.getElementById('admin-titulo').value.trim();
    const descricao = document.getElementById('admin-descricao').value.trim();

    if (!titulo || !descricao) {
      feedbackEl.textContent = 'Preencha ao menos o título e a descrição.';
      return;
    }

    feedbackEl.textContent = 'Salvando...';

    try {
      const inputArquivo = document.getElementById('admin-arquivo-imagem');
      const pendentes = Array.from(inputArquivo?.files || []);
      for (const arq of pendentes) {
        const urlSalva = await enviarArquivoUnico(arq);
        if (!albumFotosAdmin.includes(urlSalva)) {
          albumFotosAdmin.push(urlSalva);
        }
      }

      const galeriaFinal =
        albumFotosAdmin.length > 0 ? [...albumFotosAdmin] : [IMAGEM_PADRAO];

      const payload = {
        titulo,
        subtitulo:
          document.getElementById('admin-subtitulo').value.trim() ||
          meta.subtituloPadrao,
        icone:
          document.getElementById('admin-icone').value.trim() || meta.iconePadrao,
        imagem: galeriaFinal[0],
        imagens: galeriaFinal,
        descricao,
        lenda:
          document.getElementById('admin-lenda').value.trim() || descricao,
        cat: categoriaAtivaAdmin,
      };

      const url =
        editandoId !== null
          ? `${API_BASE_URL}/${meta.rota}/${encodeURIComponent(editandoId)}`
          : `${API_BASE_URL}/${meta.rota}`;
      const method = editandoId !== null ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: obterHeadersAuth(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao salvar no servidor.');
      }

      const itensAtualizados = await carregarItensCategoria(categoriaAtivaAdmin);
      renderizarListaItensModal(itensAtualizados);

      if (typeof window.sincronizarCategoriaNaTela === 'function') {
        window.sincronizarCategoriaNaTela(categoriaAtivaAdmin, itensAtualizados);
      }

      limparFormulario();
      feedbackEl.textContent = 'Salvo com sucesso!';
      if (typeof window.openTab === 'function') {
        window.openTab(meta.aba);
      }
    } catch (err) {
      feedbackEl.textContent = err.message || 'Erro ao salvar no servidor.';
    }
  }

  async function excluirItemAdmin(id) {
    const meta = CATEGORIAS_META[categoriaAtivaAdmin];
    const feedbackEl = document.getElementById('admin-feedback');

    try {
      const res = await fetch(
        `${API_BASE_URL}/${meta.rota}/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: obterHeadersAuth(),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao excluir item.');
      }

      const itensAtualizados = await carregarItensCategoria(categoriaAtivaAdmin);
      renderizarListaItensModal(itensAtualizados);

      if (typeof window.sincronizarCategoriaNaTela === 'function') {
        window.sincronizarCategoriaNaTela(categoriaAtivaAdmin, itensAtualizados);
      }

      if (String(editandoId) === String(id)) {
        limparFormulario();
      }
      feedbackEl.textContent = 'Item excluído.';
    } catch (err) {
      feedbackEl.textContent = err.message;
    }
  }

  function configurarBotoesPainelGestor() {
    const painel = document.getElementById('painel-gestor');
    if (!painel) return;

    const cards = painel.querySelectorAll('.grid > div');
    const chaves = ['gastronomia', 'oficinas', 'entidades'];

    cards.forEach((card, idx) => {
      const categoria = chaves[idx];
      if (!categoria || card.querySelector('.btn-gerenciar-categoria')) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Gerenciar / Editar';
      btn.className =
        'btn-gerenciar-categoria mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 text-xs font-semibold transition';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirModalAdmin(categoria);
      });

      card.appendChild(btn);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', configurarBotoesPainelGestor);
  } else {
    configurarBotoesPainelGestor();
  }

  const observadorPainel = new MutationObserver(() => {
    configurarBotoesPainelGestor();
  });

  observadorPainel.observe(document.body, {
    childList: true,
    subtree: true,
  });

  window.abrirModalAdmin = abrirModalAdmin;
  window.fecharModalAdmin = fecharModalAdmin;
})();