# Changelog

## [7.1.2] — 2026-08-05 — Smart Navigation Engine

### Adicionado
- Índice global dos 141 tópicos.
- Localização por ID, título e correspondência aproximada.
- Navegação automática até disciplina, grupo e tópico.
- Modo foco para recomendações do tutor.
- Rolagem suave e destaque temporário.
- Banner explicando o motivo da recomendação.
- Conclusão de revisão e retorno ao diagnóstico.
- Histórico e analytics de navegação orientada.
- API única para diagnóstico, missão, revisão e pontos de atenção.

### Corrigido
- Botões de pré-requisito que não localizavam o tópico.
- Expansão incompleta de disciplina, grupo e conteúdo.

## [7.1.1] — 2026-08-05 — Motor de Diagnóstico

### Adicionado
- Taxonomia de dificuldades e misconceptions.
- Hipótese de causa provável para respostas incorretas.
- Evidências utilizadas na inferência.
- Índice de confiança do diagnóstico.
- Intervenção pedagógica sugerida.
- Indicação de fundamento ou pré-requisito relacionado.
- Agrupamento de causas por habilidade nos relatórios.
- Integração das causas prováveis com o Recommendation Engine.

### Salvaguardas
- O sistema usa linguagem probabilística.
- Baixa evidência reduz a confiança declarada.
- As hipóteses não equivalem a diagnóstico psicológico, médico ou pedagógico profissional.

## [7.0] — 2026-08-05 — IA Adaptativa e Motor Pedagógico

### Adicionado
- Learning Engine com eventos ricos de resposta.
- Perfil cognitivo por tópico.
- Classificação de erro: conceitual, recorrente, distração, pós-revisão e domínio instável.
- Índice de confiança estatística.
- Tendência de aprendizagem.
- Recommendation Engine explicável com fatores e pesos auditáveis.
- Missão diária recalculada após atividades.
- Knowledge Graph com pré-requisitos e propagação de risco.
- Painel adaptativo no estudo e nos relatórios.
- Auditoria das decisões do tutor.

### Transparência
- As recomendações são baseadas em regras estatísticas locais e explicáveis.
- O sistema não realiza diagnóstico psicológico ou pedagógico profissional.
- Baixa quantidade de tentativas reduz explicitamente a confiança da estimativa.

## [5.3.1] — 2026-08-05 — Biblioteca Visual Premium

### Adicionado
- Biblioteca própria com 141 ilustrações vetoriais SVG.
- Uma ilustração para cada tópico do catálogo.
- Identidade visual específica por disciplina.
- Profundidade, iluminação, gradientes e sombras vetoriais.
- Ampliação em tela cheia.
- Carregamento sob demanda.
- Integração das ilustrações com tópicos, banco de questões e simulados.

### Alterado
- Os desenhos básicos deixam de ser a visualização principal.
- Questões associadas a tópicos passam a usar a biblioteca premium.

### Observação
- O estilo é semirrealista e didático. SVGs permanecem leves, nítidos e adequados para impressão.

## [5.3] — 2026-08-05

### Adicionado
- Backup completo dos dados locais em JSON.
- Restauração validada de backup.
- Backup temporário de segurança antes da restauração.
- Exclusão protegida do histórico de aprendizagem.
- Migração versionada dos dados locais.
- Indicadores de integridade e uso do armazenamento.
- Preferências de tamanho do texto, contraste e movimento.
- Download do relatório do responsável em formato textual.

### Segurança
- A importação aceita apenas chaves internas `onc_`.
- A exclusão exige confirmação textual.
- Preferências e usuário podem ser preservados ao limpar o histórico.

## [5.2] — 2026-08-05

### Adicionado
- Dashboard avançado nos relatórios.
- Radar de aprendizagem por disciplina.
- Gráfico de atividade dos últimos sete dias.
- Cards de maior domínio, maior oportunidade e maior cobertura.
- Painel do responsável.
- Relatório imprimível do responsável.
- Resumo semanal com tempo, questões, precisão e dias ativos.

### Transparência
- O painel do responsável utiliza somente dados registrados no navegador.
- As métricas não substituem avaliação escolar ou orientação pedagógica.

## [5.1.1] — 2026-08-05 — Reestruturada

### Corrigido
- Restaurado o contrato `MasteryEngine.disciplineSummary()`.
- Eliminado o erro que interrompia o carregamento do mapa de aprendizagem.

### Arquitetura
- Criado `LearningAnalyticsEngine` como camada única de agregação.
- Assessment, Dashboard, Tutor e relatórios passaram a consultar a camada analítica.
- Adicionados contratos explícitos entre módulos.
- Inicialização tornou-se resiliente: a falha de um painel não interrompe toda a plataforma.
- Mantida compatibilidade com chamadas antigas do `MasteryEngine`.

### Qualidade
- Adicionado diagnóstico de arquitetura.
- Acrescentados testes de contrato e de integração estática.

## [5.1] — 2026-08-05

### Adicionado
- Simulado inteligente baseado em erros, domínio, memória e recorrência.
- Explicação personalizada após cada resposta.
- Indicador interno de desempenho com nível de confiança.
- Mapa de aprendizagem por disciplina.
- Identificação de simulados inteligentes no histórico.

### Nota metodológica
- O indicador de desempenho não é previsão de nota, classificação ou medalha.

## [5.0] — 2026-08-05

### Adicionado
- Motor de domínio com leitura, questões, revisões e memória.
- Curva de esquecimento e próxima revisão.
- Tutor explicável e meta diária de XP.
- Indicadores de domínio médio e memória consolidada.
- Detalhamento do domínio por tópico.

## [4.2.1] — 2026-08-05

### Corrigido
- Ao finalizar um simulado, a página agora rola automaticamente até o painel de resultado.
- O foco é direcionado ao resultado para melhorar a acessibilidade.
- Foi adicionado espaçamento de rolagem para impedir que o cabeçalho fixo cubra o painel.

## [4.2] — 2026-08-05

### Alterado
- O painel “Seus pontos de atenção” fica recolhido por padrão.
- Cada conteúdo de atenção tornou-se um item expansível.
- O estado fechado mostra apenas tema, disciplina e nível de prioridade.
- Os detalhes exibem desempenho, último erro, recorrência e motivo da recomendação.
- O botão de revisão aparece somente após a expansão do conteúdo.
- A lista mostra cinco itens inicialmente e permite consultar todos.

### UX
- Redução significativa da altura ocupada na Home.
- Linguagem visual alinhada aos acordes de disciplinas, grupos e tópicos.
- Melhor leitura em telas de celular e tablet.

## [4.1] — 2026-08-05

### Adicionado
- Níveis do estudante e barra de evolução por XP.
- Sequência diária calculada a partir da atividade real.
- Resumo inteligente do dia.
- Card de próxima revisão.
- Recompensa total e bônus por missão concluída.
- Componentes de interface separados em `js/ui`.

### Alterado
- Zero por cento de domínio agora exibe cinco estrelas vazias.
- A próxima melhor ação mostra a primeira tarefa pendente e o passo seguinte.
- Pontos de atenção explicam desempenho, último erro e prioridade.
- Preparação inicial mostra nível, tópicos iniciados, dominados e restantes.
- Botões de revisão receberam uma chamada de ação mais clara.

### Arquitetura
- Motores de domínio, prioridade e missão permanecem independentes da camada visual.
- A apresentação foi dividida em `level-ui.js`, `mission-ui.js`, `review-ui.js` e `dashboard-ui.js`.

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
