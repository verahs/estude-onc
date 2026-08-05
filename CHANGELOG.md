# Changelog

## [4.0] — 2026-08-05

### Adicionado
- Motor independente de prioridade dinâmica.
- Índice de domínio por tópico, em percentual e estrelas.
- Missão diária automática com três tarefas.
- Próxima melhor ação recomendada.
- Índice de preparação estimada.
- Histórico estruturado de estudo e desempenho.
- Contadores de tópicos estudados e dominados.
- Dashboard orientado à ação.

### Arquitetura
- `priority-engine.js` não depende da interface e pode ser reutilizado por revisões, simulados adaptativos e futuras integrações.
- `progress-engine.js` concentra o cálculo de domínio.
- `mission-engine.js` gera e persiste a missão diária.
- `study-history.js` centraliza eventos, tentativas, sessões e resultados.
- `smart-tutor.js` atua como camada de apresentação e orquestração.

## [3.1] — 2026-08-05

### Adicionado
- Sistema automático de atenção baseado em erros.
- Índice interno de risco que combina quantidade de erros, taxa de erro, recorrência e tempo desde o último erro.
- Painel “Conteúdos que merecem atenção”.
- Filtro “Apenas atenção”.
- Sinalização de atenção diretamente nos cards.
- Registro de desempenho no banco de questões e nos simulados.

### Alterado
- O ranking de recorrência fica recolhido por padrão.
- A recorrência, isoladamente, não gera alerta.
- Filtros reorganizados em um painel único.
- Banner atualizado para a versão 3.1.
- Home reorganizada para priorizar ação, progresso e revisão.

## [3.0-sprint-3] — 2026-08-05

### Adicionado
- Busca instantânea com atalho `/`.
- Sistema de favoritos por estudante.
- Retomada automática do último tópico.
- Progresso por disciplina.
- Tempo estimado de leitura.
- Revisão espaçada com agenda básica.
- Estatísticas dos últimos sete dias.
- Registro de sessões de estudo.
- Atalho `Esc` para sair do modo de foco.

Todas as mudanças relevantes do Estude ONC serão registradas neste arquivo.

## [3.0-sprint-2] — 2026-08-05

### Adicionado
- 141 tópicos separados em arquivos JSON individuais.
- Catálogo mestre de conteúdos.
- Carregamento sob demanda ao abrir um tópico.
- Cache em memória para evitar downloads repetidos.
- Pré-carregamento dos tópicos vizinhos.
- Estados visuais de carregamento e recuperação de erro.
- Arquivo de teste de integridade da arquitetura.

### Alterado
- O módulo Estudar não baixa mais todo o conteúdo na abertura da página.
- O botão “Expandir conteúdos” carrega tópicos com concorrência controlada.
- Manifesto atualizado para `contentSchemaVersion 2.1`.

## [3.0-sprint-1] — 2026-08-05

### Adicionado
- Blocos pedagógicos flexíveis.
- Modo de leitura focada.
- Impressão por tópico.
- Melhorias de acessibilidade.
