# Portal Saberes Ancestrais Macuxi

Portal web voltado à valorização, registro e divulgação cultural da **Comunidade Indígena Raposa I** (povo Macuxi), reunindo informações históricas e orientações de visitação, gastronomia tradicional, oficinas, entidades lendárias, galeria de fotos com ampliação, chat geral e área de gestão de conteúdos.

## Arquitetura do Projeto

O sistema opera com dois serviços locais que trabalham em conjunto:

- **Portal / API Express (`porta 3000`)**:
  - `index.js`: inicializa o servidor Express, serve os arquivos estáticos de `public/` e expõe as rotas sob `/api`.
  - `src/routes/api.js`: implementa rotas para entidades, gastronomia, oficinas, upload de imagens (`multer`), chat (`comentarios`), agendamentos e persistência em `src/data/db.json`.
  - `public/`: interface principal (`index.html`), autenticação e sessão (`login.js`), painel CRUD do gestor (`admin.js`) e imagens enviadas em `public/uploads/`.
- **Backend Strapi (`porta 1337`)**:
  - `backend/`: serviço Strapi responsável pela autenticação de usuários, verificação de papéis (`role`) e armazenamento local em `backend/.tmp/`.

## Pré-requisitos

- **Node.js** instalado na máquina.
- Dependências instaladas na raiz do projeto e na pasta `backend/`.

## Como Rodar Localmente

1. Instale as dependências da raiz:
   ```bash
   npm install
   ```

2. Instale as dependências do backend Strapi:
   ```bash
   cd backend
   npm install
   ```

3. Inicie o **Strapi** (em um terminal, dentro de `backend/`):
   ```bash
   npx strapi develop
   ```
   Aguarde o serviço iniciar na porta `1337`.

4. Inicie o **Portal Express** (em outro terminal, na raiz do projeto):
   ```bash
   node index.js
   ```
   O servidor ficará disponível na porta `3000`.

5. Acesse o portal no navegador:
   ```text
   http://localhost:3000
   ```

## Principais Funcionalidades

- **Navegação por abas**: Início (história e guia da comunidade), Gastronomia, Oficinas, Entidades Lendárias e visualização detalhada de cada item.
- **Álbum de fotos e Lightbox**: suporte a múltiplas imagens por registro, troca de fotos no detalhe e ampliação em tela cheia.
- **Autenticação e papéis**: login e cadastro de turistas integrados ao Strapi, com liberação de recursos específicos para usuários com papel de **Gestor**.
- **Chat geral**: leitura aberta para visitantes e envio/exclusão de mensagens para usuários autenticados conforme permissões.
- **Gestão de conteúdo e uploads**: criação, edição e exclusão de itens nas categorias e envio de imagens para `public/uploads/`.

## Levar para Outra Máquina (Apresentação)

Ao mover o projeto para outro computador para apresentação ou demonstração, além do código-fonte, mantenha os dados e arquivos persistentes abaixo para não perder registros, mídias e configurações locais:

- `src/data/db.json`
- `public/uploads/`
- `backend/.tmp/`

## Observações Técnicas e Evolução

- A API Express utiliza arquivo JSON local (`src/data/db.json`) para persistência e o Strapi é executado em modo de desenvolvimento em `localhost`.
- Para ambientes de produção ou maior concorrência, recomenda-se migrar para um banco de dados relacional, configurar variáveis de ambiente (URLs e tokens), utilizar HTTPS e reforçar as regras de autorização e validação de uploads.
