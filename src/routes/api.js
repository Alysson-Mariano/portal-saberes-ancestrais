const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const pastaUploads = path.join(__dirname, '../../public/uploads');
fs.mkdirSync(pastaUploads, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, pastaUploads);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const nomeBase = path
      .basename(file.originalname || 'imagem', ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .slice(0, 40);
    cb(null, `${Date.now()}-${nomeBase || 'item'}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // até 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Envie apenas um ficheiro de imagem válido.'));
    }
  },
});

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const TOKEN_GESTOR_FIXO = process.env.GESTOR_TOKEN || '';

function usuarioEhGestor(usuario) {
  if (!usuario) return false;
  const papelStrapi =
    typeof usuario.role === 'string'
      ? usuario.role
      : usuario?.role?.name || usuario?.role?.type || '';

  const papelNormalizado = String(papelStrapi).toLowerCase();
  if (papelNormalizado === 'gestor' || papelNormalizado === 'manager') {
    return true;
  }

  const username = String(usuario.username || '').toLowerCase();
  const email = String(usuario.email || '').toLowerCase();
  return username === 'alysson' || email === 'alyssonqwerty@gmail.com';
}

async function exigirGestorAutenticado(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1].trim() : '';

  if (!token) {
    return res.status(401).json({
      error: 'Autenticação necessária. Faça login como gestor para realizar esta ação.',
    });
  }

  if (TOKEN_GESTOR_FIXO && token === TOKEN_GESTOR_FIXO) {
    req.gestor = { modo: 'token-env', role: 'Gestor' };
    return next();
  }

  try {
    const respostaStrapi = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!respostaStrapi.ok) {
      return res.status(401).json({
        error: 'Sessão inválida ou expirada. Faça login novamente como gestor.',
      });
    }

    let usuario = await respostaStrapi.json().catch(() => ({}));

    if (!usuario?.role && usuario?.id) {
      try {
        const detalheRes = await fetch(
          `${STRAPI_URL}/api/users/${usuario.id}?populate=role`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (detalheRes.ok) {
          const fullUser = await detalheRes.json().catch(() => ({}));
          usuario = { ...usuario, ...fullUser };
        }
      } catch (_) {}
    }

    if (!usuarioEhGestor(usuario)) {
      return res.status(403).json({
        error: 'Acesso negado. Apenas usuários com papel Gestor podem alterar ou enviar arquivos.',
      });
    }

    req.gestor = usuario;
    return next();
  } catch (_) {
    return res.status(403).json({
      error: 'Não foi possível validar a credencial de gestor no servidor de autenticação.',
    });
  }
}

async function exigirUsuarioAutenticado(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1].trim() : '';

  if (!token) {
    return res.status(401).json({
      error: 'Faça login ou crie uma conta para enviar mensagens no chat.',
    });
  }

  if (TOKEN_GESTOR_FIXO && token === TOKEN_GESTOR_FIXO) {
    req.usuarioLogado = {
      id: 'gestor-env',
      username: 'Gestor',
      roleName: 'Gestor',
      ehGestor: true,
    };
    return next();
  }

  try {
    const respostaStrapi = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!respostaStrapi.ok) {
      return res.status(401).json({
        error: 'Sessão inválida ou expirada. Faça login novamente.',
      });
    }

    let usuario = await respostaStrapi.json().catch(() => ({}));

    if (!usuario?.role && usuario?.id) {
      try {
        const detalheRes = await fetch(
          `${STRAPI_URL}/api/users/${usuario.id}?populate=role`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (detalheRes.ok) {
          const fullUser = await detalheRes.json().catch(() => ({}));
          usuario = { ...usuario, ...fullUser };
        }
      } catch (_) {}
    }

    const ehGestor = usuarioEhGestor(usuario);
    const papelStrapi =
      typeof usuario.role === 'string'
        ? usuario.role
        : usuario?.role?.name || usuario?.role?.type || 'Turista';

    req.usuarioLogado = {
      id: usuario.id,
      username: usuario.username || usuario.email || 'Turista',
      roleName: ehGestor ? 'Gestor' : papelStrapi,
      ehGestor,
    };
    return next();
  } catch (_) {
    return res.status(403).json({
      error: 'Não foi possível validar sua sessão no servidor de autenticação.',
    });
  }
}

router.post('/upload', exigirGestorAutenticado, (req, res) => {
  upload.single('imagem')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err.message || 'Erro ao processar o envio da imagem.',
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum ficheiro de imagem enviado.' });
    }

    return res.status(201).json({
      url: `/uploads/${req.file.filename}`,
    });
  });
});

const mockInicial = require('../data/mockData');
const caminhoDbJson = path.join(__dirname, '../data/db.json');

function carregarEstadoPersistido() {
  const base = {
    entities: Array.isArray(mockInicial.entities) ? [...mockInicial.entities] : [],
    saberes: Array.isArray(mockInicial.saberes) ? [...mockInicial.saberes] : [],
    vivencias: Array.isArray(mockInicial.vivencias) ? [...mockInicial.vivencias] : [],
    bookings: Array.isArray(mockInicial.bookings) ? [...mockInicial.bookings] : [],
    comentarios: Array.isArray(mockInicial.comentarios) ? [...mockInicial.comentarios] : [],
  };

  if (!fs.existsSync(caminhoDbJson)) {
    fs.writeFileSync(caminhoDbJson, JSON.stringify(base, null, 2), 'utf8');
    return base;
  }

  try {
    const bruto = fs.readFileSync(caminhoDbJson, 'utf8');
    const parseado = JSON.parse(bruto);
    return {
      entities: Array.isArray(parseado.entities) ? parseado.entities : base.entities,
      saberes: Array.isArray(parseado.saberes) ? parseado.saberes : base.saberes,
      vivencias: Array.isArray(parseado.vivencias) ? parseado.vivencias : base.vivencias,
      bookings: Array.isArray(parseado.bookings) ? parseado.bookings : base.bookings,
      comentarios: Array.isArray(parseado.comentarios)
        ? parseado.comentarios
        : base.comentarios,
    };
  } catch (err) {
    console.error('Erro ao ler db.json, usando dados iniciais:', err.message);
    return base;
  }
}

const estadoDb = carregarEstadoPersistido();
const { entities, saberes, vivencias, bookings, comentarios } = estadoDb;

function salvarEstadoPersistido() {
  try {
    fs.writeFileSync(
      caminhoDbJson,
      JSON.stringify(
        {
          entities,
          saberes,
          vivencias,
          bookings,
          comentarios,
        },
        null,
        2
      ),
      'utf8'
    );
  } catch (err) {
    console.error('Erro ao salvar db.json:', err.message);
  }
}

const IMAGEM_PADRAO =
  'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80';

function resolverColecao(categoria) {
  switch (String(categoria || '').toLowerCase()) {
    case 'entities':
    case 'entidades':
      return { lista: entities, chave: 'entities' };
    case 'saberes':
    case 'gastronomia':
      return { lista: saberes, chave: 'saberes' };
    case 'vivencias':
    case 'oficinas':
      return { lista: vivencias, chave: 'vivencias' };
    default:
      return null;
  }
}

function normalizarGaleria(payload, imagemPrincipal) {
  const rawList = Array.isArray(payload.imagens)
    ? payload.imagens
    : Array.isArray(payload.images)
    ? payload.images
    : [];

  const limpas = rawList
    .map((u) => (typeof u === 'string' ? u.trim() : ''))
    .filter(Boolean);

  if (limpas.length > 0) {
    return [...new Set(limpas)];
  }
  return [imagemPrincipal || IMAGEM_PADRAO];
}

function normalizarItem(payload, idFallback, categoria) {
  const titulo =
    payload.titulo ||
    payload.title ||
    payload.name ||
    payload.nome ||
    'Novo Registro';
  const subtitulo =
    payload.subtitulo ||
    payload.subtitle ||
    payload.categoriaLabel ||
    'Saber Tradicional Macuxi';
  const descricao =
    payload.descricao ||
    payload.description ||
    payload.desc ||
    '';
  const lenda =
    payload.lenda ||
    payload.historia ||
    payload.story ||
    descricao;
  const icone = payload.icone || payload.icon || '✨';

  const imagens = normalizarGaleria(
    payload,
    payload.imagem || payload.image || IMAGEM_PADRAO
  );
  const imagem = payload.imagem || payload.image || imagens[0] || IMAGEM_PADRAO;

  return {
    id: idFallback,
    cat: payload.cat || payload.category || categoria,
    titulo,
    title: titulo,
    name: titulo,
    subtitulo,
    icone,
    icon: icone,
    descricao,
    description: descricao,
    desc: descricao,
    lenda,
    imagem,
    imagens,
  };
}

function encontrarIndice(lista, idParam) {
  const alvo = String(idParam);
  let idx = lista.findIndex((item) => String(item.id) === alvo);
  if (idx !== -1) return idx;

  const num = Number(idParam);
  if (Number.isInteger(num) && num >= 0 && num < lista.length) {
    return num;
  }
  return -1;
}

// Rotas do chat geral (antes de /:categoria)
router.get('/comentarios', (_req, res) => {
  return res.json(comentarios);
});

router.post('/comentarios', exigirUsuarioAutenticado, (req, res) => {
  const mensagem = String(req.body?.mensagem || '').trim();

  if (!mensagem) {
    return res.status(400).json({ error: 'Escreva uma mensagem antes de enviar.' });
  }

  if (mensagem.length > 600) {
    return res
      .status(400)
      .json({ error: 'A mensagem deve ter no máximo 600 caracteres.' });
  }

  const maxId = comentarios.reduce(
    (maior, item) => Math.max(maior, Number(item.id) || 0),
    0
  );

  const novaMensagem = {
    id: maxId + 1,
    autorId: req.usuarioLogado.id,
    autor: req.usuarioLogado.username,
    papel: req.usuarioLogado.roleName,
    mensagem,
    criadoEm: new Date().toISOString(),
  };

  comentarios.push(novaMensagem);
  salvarEstadoPersistido();
  return res.status(201).json(novaMensagem);
});

router.delete('/comentarios/:id', exigirUsuarioAutenticado, (req, res) => {
  const idx = comentarios.findIndex((c) => String(c.id) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Mensagem não encontrada.' });
  }

  const alvo = comentarios[idx];
  const ehAutor = String(alvo.autorId) === String(req.usuarioLogado.id);
  if (!req.usuarioLogado.ehGestor && !ehAutor) {
    return res.status(403).json({
      error: 'Apenas a gestão ou o autor podem excluir esta mensagem.',
    });
  }

  const [removido] = comentarios.splice(idx, 1);
  salvarEstadoPersistido();
  return res.json({ message: 'Mensagem removida.', item: removido });
});

// Leitura pública - Entidades Lendárias
router.get('/entities', (req, res) => {
  const { category } = req.query;
  if (category && category !== 'todos') {
    const filtered = entities.filter((e) => e.cat === category);
    return res.json(filtered);
  }
  res.json(entities);
});

// Leitura pública - Gastronomia
router.get('/saberes', (req, res) => {
  res.json(saberes);
});

router.get('/gastronomia', (req, res) => {
  res.json(saberes);
});

// Leitura pública - Oficinas
router.get('/vivencias', (req, res) => {
  res.json(vivencias);
});

router.get('/oficinas', (req, res) => {
  res.json(vivencias);
});

// Criar item (agendamento público ou conteúdo restrito a gestor)
router.post('/:categoria', (req, res) => {
  if (req.params.categoria === 'bookings') {
    const novoAgendamento = {
      id: bookings.length + 1,
      dataRegistro: new Date().toISOString(),
      ...req.body,
    };
    bookings.push(novoAgendamento);
    salvarEstadoPersistido();
    console.log('Novo agendamento recebido:', novoAgendamento);
    return res.status(201).json({
      message: 'Agendamento pré-registrado com sucesso!',
      agendamento: novoAgendamento,
    });
  }

  return exigirGestorAutenticado(req, res, () => {
    const col = resolverColecao(req.params.categoria);
    if (!col) {
      return res.status(404).json({ error: 'Coleção não encontrada.' });
    }

    const maxId = col.lista.reduce(
      (maior, item) => Math.max(maior, Number(item.id) || 0),
      0
    );
    const novoItem = normalizarItem(req.body || {}, maxId + 1, col.chave);
    col.lista.push(novoItem);
    salvarEstadoPersistido();

    return res.status(201).json(novoItem);
  });
});

// Atualizar item existente (somente gestor autenticado)
router.put('/:categoria/:id', exigirGestorAutenticado, (req, res) => {
  const col = resolverColecao(req.params.categoria);
  if (!col) {
    return res.status(404).json({ error: 'Coleção não encontrada.' });
  }

  const idx = encontrarIndice(col.lista, req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Item não encontrado.' });
  }

  const atual = col.lista[idx];
  const body = req.body || {};

  const dadosMesclados = {
    ...atual,
    ...body,
    imagens: Array.isArray(body.imagens) ? body.imagens : atual.imagens,
    imagem:
      body.imagem ||
      (Array.isArray(body.imagens) && body.imagens[0]) ||
      atual.imagem,
  };

  const atualizado = normalizarItem(dadosMesclados, atual.id, col.chave);
  col.lista[idx] = atualizado;
  salvarEstadoPersistido();

  return res.json(atualizado);
});

// Excluir item (somente gestor autenticado)
router.delete('/:categoria/:id', exigirGestorAutenticado, (req, res) => {
  const col = resolverColecao(req.params.categoria);
  if (!col) {
    return res.status(404).json({ error: 'Coleção não encontrada.' });
  }

  const idx = encontrarIndice(col.lista, req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Item não encontrado.' });
  }

  const [removido] = col.lista.splice(idx, 1);
  salvarEstadoPersistido();
  return res.json({ message: 'Item removido com sucesso.', item: removido });
});

module.exports = router;