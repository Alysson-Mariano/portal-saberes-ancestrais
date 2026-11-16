<<<<<<< HEAD
const entities = [
  {
    id: 1,
    titulo: 'Parixara',
    descricao:
      'Ritual sagrado de agradecimento em forma de dança e oração pela terra, pelos alimentos e pelo ciclo natural da vida.',
  },
  {
    id: 2,
    titulo: 'Serra do Arco-Íris',
    descricao:
      'Formação natural de grande importância cultural, onde condutores locais compartilham histórias ancestrais do povo Macuxi.',
  },
  {
    id: 3,
    titulo: 'Espíritos da Mata e das Águas',
    descricao:
      'Entidades que zelam pela conservação dos rios, lagos e áreas verdes, protegendo a biodiversidade da região.',
  },
];

const saberes = [
  {
    id: 1,
    titulo: 'Damurida',
    descricao:
      'Prato típico tradicional à base de pimenta com folhas, tucupi e peixe, considerado a grande iguaria da culinária Macuxi.',
  },
  {
    id: 2,
    titulo: 'Caxiri',
    descricao:
      'Bebida fermentada tradicional feita à base de milho cozido, essencial nos rituais e na união para os trabalhos comunitários.',
  },
  {
    id: 3,
    titulo: 'Beiju e Farinha de Mandioca',
    descricao:
      'Iguarias fundamentais preparadas de forma artesanal em tachos quentes e finalizadas com técnicas tradicionais no telhado.',
  },
];

const vivencias = [
  {
    id: 1,
    titulo: 'Panela de Barro: A Alma Macuxi',
    descricao:
      'Oficina de moldagem e queima de barro com as artesãs da associação local, utilizando areias vermelha e branca.',
  },
  {
    id: 2,
    titulo: 'Trilha Cultural da Cachoeira',
    descricao:
      'Caminhada guiada por condutores locais com paradas para banho, contemplação da paisagem e resgate histórico.',
  },
  {
    id: 3,
    titulo: 'Tradição do Arco e Flecha',
    descricao:
      'Vivência sobre a confecção de hastes, penas estabilizadoras e prática de tiro ao alvo tradicional.',
  },
];

const bookings = [];

module.exports = {
  entities,
  saberes,
  vivencias,
  bookings,
  gastronomia: saberes,
  oficinas: vivencias,
};
=======
const mockData = {
  entities: [
    {
      id: 1,
      titulo: 'Parixara',
      descricao:
        'Ritual sagrado de agradecimento em forma de dança e oração pela terra, pelos alimentos e pelo ciclo natural da vida[cite: 8, 33].',
    },
    {
      id: 2,
      titulo: 'Serra do Arco-Íris',
      descricao:
        'Formação natural de grande importância cultural, onde condutores locais compartilham histórias ancestrais do povo Macuxi[cite: 14].',
    },
    {
      id: 3,
      titulo: 'Espíritos da Mata e das Águas',
      descricao:
        'Entidades que zelam pela conservação dos rios, lagos e áreas verdes, protegendo a biodiversidade da região[cite: 8].',
    },
  ],
  gastronomia: [
    {
      id: 1,
      titulo: 'Damurida',
      descricao:
        'Prato típico tradicional à base de pimenta com folhas, tucupi e peixe, considerado a grande iguaria da culinária Macuxi[cite: 45, 47].',
    },
    {
      id: 2,
      titulo: 'Caxiri',
      descricao:
        'Bebida fermentada tradicional feita à base de milho cozido, essencial nos rituais e na união para os trabalhos comunitários[cite: 31, 33].',
    },
    {
      id: 3,
      titulo: 'Beiju e Farinha de Mandioca',
      descricao:
        'Iguarias fundamentais preparadas de forma artesanal em tachos quentes e finalizadas com técnicas tradicionais no telhado[cite: 27].',
    },
  ],
  oficinas: [
    {
      id: 1,
      titulo: 'Panela de Barro: A Alma Macuxi',
      descricao:
        'Oficina de moldagem e queima de barro com as artesãs da associação local, utilizando areias vermelha e branca[cite: 9, 23].',
    },
    {
      id: 2,
      titulo: 'Trilha Cultural da Cachoeira',
      descricao:
        'Caminhada guiada por condutores locais com paradas para banho, contemplação da paisagem e resgate histórico[cite: 9, 15].',
    },
    {
      id: 3,
      titulo: 'Tradição do Arco e Flecha',
      descricao:
        'Vivência sobre a confecção de hastes, penas estabilizadoras e prática de tiro ao alvo tradicional[cite: 38, 43].',
    },
  ],
};

module.exports = mockData;
>>>>>>> 2ccced2f1ec2bccd372a2437cb0714b90be3e1fa
