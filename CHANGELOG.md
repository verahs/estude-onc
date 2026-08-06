# Changelog

## [8.0.0] — 2026-08-05 — UX Rebuild / Central de Inteligência

### Reestruturação
- Relatórios renomeado para Central de Inteligência.
- Shell modular com navegação lateral.
- Dashboard executivo.
- Módulos Aprendizagem, IA Pedagógica, Medalhas, Evolução, Responsável e Sistema.
- Compatibilidade com todos os relatórios anteriores.
- Troca instantânea de conteúdo sem recarregar a página.
- Breadcrumb e persistência do último módulo.
- Busca global entre painéis.
- Favoritos e histórico de acesso.
- Cards recolhíveis.
- Renderização sob demanda por módulo.
- Tema claro e escuro.
- Layout responsivo para desktop, tablet e celular.
- Visão simplificada para o responsável.
- Camada de compatibilidade para evitar regressões.

### Resultado de UX
- Eliminação do relatório contínuo com rolagem excessiva.
- Separação clara por finalidade.
- Menor carga cognitiva.
- Base escalável para novas sprints.

## [7.3.3.10] — 2026-08-05 — Integração de Medalhas com IA

### Adicionado
- Cruzamento entre medalhas e prioridades do Recommendation Engine.
- Compatibilidade pedagógica por categoria, tópico e disciplina.
- Ajuste de segurança por fadiga e concentração de carga.
- Sugestões explicáveis.
- Integração opcional ao plano diário.
- Ação direta para revisão, conteúdo ou coleção.
- Mensagens para o Coach Diário.
- Preferências por estudante.
- Relatório da integração.

### Regra central
- Medalhas funcionam como reforço secundário.
- Recuperação, aprendizagem, descanso e carga cognitiva têm prioridade.
- A IA não recomenda tarefas apenas para desbloquear medalhas.

## [7.3.3.9] — 2026-08-05 — Relatório de Medalhas

### Adicionado
- Relatório executivo da coleção.
- Filtros por período e categoria.
- Resumo geral e por categoria.
- Conquistas recentes.
- Próximas medalhas.
- Conquistas de maior raridade.
- Pontos positivos baseados em evidências.
- Pontos de atenção baseados em progresso.
- Tendência mensal.
- Integração com marcos e notificações.
- Exportação em texto.
- Impressão.
- Relatório detalhado na área de Relatórios.

### Limites
- O relatório não mede capacidade intelectual.
- Medalhas não equivalem a nota ou resultado oficial da ONC.
- Pontos positivos e de atenção não descrevem traços de personalidade.

## [7.3.3.8] — 2026-08-05 — Notificações Inteligentes

### Adicionado
- Central de notificações.
- Alertas de medalhas conquistadas.
- Alertas de medalhas próximas.
- Alertas de marcos da coleção.
- Integração com o Coach Diário.
- Alertas de mudança de nível.
- Chaves únicas contra duplicidade.
- Horário silencioso configurável.
- Limite diário.
- Preferências por tipo.
- Leitura, dispensa e limpeza.
- Ações diretas para medalhas e áreas da plataforma.
- Relatório de notificações.

### Proteções
- Notificações comuns respeitam o horário de descanso.
- Limite diário reduz excesso de interrupções.
- Medalhas não são apresentadas como objetivo principal do estudo.

## [7.3.3.7] — 2026-08-05 — Linha do Tempo de Medalhas

### Adicionado
- Histórico cronológico agrupado por dia.
- Filtros por categoria e período.
- Ordenação crescente e decrescente.
- Evolução mensal.
- Marcos automáticos da coleção.
- Primeira conquista e primeira medalha secreta.
- Marcos de 5, 10, 20, 30 e 50 medalhas.
- Identificação de categorias completas.
- Melhor sequência de dias com conquistas.
- Exportação em texto.
- Relatório temporal consolidado.
- Integração com os detalhes da Coleção de Medalhas.

## [7.3.3.6] — 2026-08-05 — Coleção de Medalhas

### Adicionado
- Catálogo unificado de todas as medalhas.
- Filtros por categoria e status.
- Busca textual.
- Ordenação por progresso, data, nome e raridade.
- Medalhas favoritas.
- Modal de detalhes e evidências.
- Linha do tempo das conquistas.
- Progresso por categoria.
- Relatório consolidado da coleção.
- Proteção dos nomes e critérios das medalhas secretas.
- Preferências separadas por estudante.

## [7.3.3.5] — 2026-08-05 — Medalhas Secretas

### Adicionado
- Catálogo independente de medalhas secretas.
- Motor de descoberta e dicas em três estágios.
- Sistema anti-spoiler.
- Coleção secreta e linha do tempo.
- Metadados de raridade.
- Critérios seguros, sem premiar privação de sono, velocidade excessiva ou carga desproporcional.
- Curiosidade Científica, Observador do Céu, Laboratório Oculto, Explorador Total, Precisão Sustentada, Polímata, Imparável, Cientista Lendário e Cientista Supremo.

### Revisão crítica
- A proposta de premiar estudo após 22h ou antes das 6h foi descartada.
- A proposta de premiar velocidade foi substituída por precisão válida e sustentada.
- O sistema privilegia exploração, domínio, consistência saudável e coleção.

## [7.3.3.4] — 2026-08-05 — Medalhas de Recuperação

### Adicionado
- Fênix.
- Recomeço.
- Resiliência.
- Segunda Tentativa.
- Virada Científica.
- Memória Recuperada.
- Erro Transformado.
- Retorno ao Ritmo.
- Recuperação Consistente.
- Superação Total (secreta).
- Painel e relatório próprios.
- Evidências por tópico, questão, revisão, disciplina e rotina.
- Catálogo modular independente.

### Critério pedagógico
- A conquista exige melhora observável.
- Repetição isolada não gera medalha.
- Recuperação é reconhecida sem rotular o estudante.

## [7.3.3.3] — 2026-08-05 — Medalhas Comportamentais

### Adicionado
- Persistência.
- Disciplina.
- Memória.
- Regularidade.
- Foco.
- Equilíbrio.
- Planejamento.
- Organização.
- Cientista Consistente.
- Mestre da Rotina.
- Painel próprio de progresso.
- Relatório comportamental de medalhas.
- Indicação da medalha comportamental mais próxima no Coach Diário.
- Catálogo modular reutilizável pelas próximas famílias de medalhas.

### Proteções
- Abrir a plataforma sem interação válida não gera progresso.
- Os critérios usam eventos persistidos e motores existentes.
- As medalhas não avaliam personalidade, moral, saúde mental ou contexto familiar.

## [7.3.3.2] — 2026-08-05 — Medalhas de Aprendizagem

### Adicionado
- Newton: domínio e cobertura completos em Física.
- Darwin: domínio e cobertura completos em Biologia.
- Lavoisier: domínio e cobertura completos em Química.
- Galileu: Astronomia completa com domínio médio mínimo de 85%.
- Marie Curie: evolução de pelo menos 30 pontos em um tópico.
- Einstein: dez questões difíceis corretas em três ou mais tópicos.
- Método Científico: domínio mínimo em todas as disciplinas.
- Domínio Crescente: tendência positiva em cinco tópicos.
- Metadados e evidências específicas por medalha.
- Catálogo modular separado do motor central.

### Critérios
- Medalhas de disciplina exigem cobertura, não apenas média.
- Progresso parcial permanece visível.
- Nenhuma medalha é concedida somente por volume de respostas.

## [7.3.3.1] — 2026-08-05 — Motor de Regras de Medalhas

### Adicionado
- Registro modular de regras.
- Avaliação automática por estudante.
- Progresso, meta e percentual por medalha.
- Evidência textual do critério.
- Desbloqueio sem duplicidade.
- Regras visíveis e ocultas.
- Histórico de avaliações.
- Notificação de conquista.
- Catálogo inicial de regras.
- Relatório por categoria.

### Base preparada
- Medalhas de aprendizagem.
- Medalhas comportamentais.
- Medalhas de recuperação.
- Medalhas secretas.
- Coleção e linha do tempo.

## [7.3.2] — 2026-08-05 — Sistema de Níveis

### Adicionado
- Oito níveis progressivos vinculados ao XP Inteligente.
- Linha de progressão completa.
- Barra até o próximo nível.
- Modal de subida de nível.
- Desbloqueios cosméticos por etapa.
- Resgate de recompensas.
- Histórico de níveis atingidos.
- Estado separado por estudante.
- Relatório de progressão.

### Regra de equidade
- Recompensas de nível são cosméticas.
- Nenhum nível altera respostas, notas ou acesso pedagógico essencial.
- Nível não equivale a classificação oficial ou capacidade intelectual.

## [7.3.1] — 2026-08-05 — XP Inteligente

### Adicionado
- Livro-razão de XP por estudante.
- Recompensas por aprendizagem, revisão, recuperação de erro, missão e consistência.
- Multiplicador por dificuldade e origem da atividade.
- Marcos de domínio e ritmo cuidadoso.
- Limite pedagógico diário.
- Redução de recompensa para repetição e respostas muito rápidas.
- Átomos acumulados como prévia da futura economia virtual.
- Níveis iniciais e progresso até o próximo nível.
- Painel e relatório da origem do XP.

### Regra pedagógica
- Respostas incorretas não retiram XP.
- Procrastinação não gera punição financeira.
- Comportamentos artificiais reduzem ou anulam somente o novo ganho.
- XP já conquistado nunca é confiscado.

## [7.2.5] — 2026-08-05 — Painel do Responsável

### Adicionado
- Resumo semanal executivo do estudante.
- Indicadores de atividade, aprendizagem, memória e preparação.
- Pontos positivos e pontos de atenção.
- Orientações práticas para apoio sem pressão excessiva.
- Integração de predição, comportamento e métodos de aprendizagem.
- Exportação em texto e impressão.
- Exibição específica para responsável e professor.
- Atualização dos módulos ao alternar estudante.

### Transparência
- A faixa de desempenho é interna e não representa nota oficial ou medalha.
- O painel não deve ser usado para rotular, punir ou comparar o estudante.
- Os dados não substituem avaliação escolar, pedagógica, psicológica ou médica.

## [7.2.4] — 2026-08-05 — Coach de Aprendizagem

### Adicionado
- Comparação de resultados por estratégia.
- Identificação de padrões por tópico.
- Recomendação entre leitura orientada, prática, prática guiada e revisão espaçada.
- Passos objetivos para cada método.
- Integração do método ao Coach Diário.
- Acesso direto ao conteúdo ou às questões.
- Confiança da recomendação.
- Painel metodológico nos relatórios.

### Transparência
- O sistema não classifica o aluno em um estilo fixo de aprendizagem.
- Resultados observados não comprovam causalidade nem preferência permanente.
- O módulo não determina capacidade intelectual ou diagnóstico pedagógico.

## [7.2.3.5] — 2026-08-05 — Painel Comportamental

### Adicionado
- Índice integrado de rotina.
- Consolidação de hábitos, conclusão, consistência e carga sustentável.
- Tendência recente e confiança da leitura.
- Priorização dos três principais ajustes.
- Destaque de padrões positivos.
- Resumo semanal executivo.
- Ação direta sobre a prioridade principal.
- Painel detalhado para aluno e responsável.
- Pontos observados recolhidos por padrão.

### Transparência
- O painel descreve apenas padrões operacionais de uso.
- Não avalia personalidade, motivação, saúde mental, condição médica ou contexto familiar.

## [7.2.3.4] — 2026-08-05 — Coach de Fadiga Cognitiva

### Adicionado
- Índice operacional de carga cognitiva.
- Detecção de queda de precisão durante a sequência.
- Aumento progressivo do tempo de resposta.
- Erros consecutivos e erros muito rápidos.
- Carga de estudo nas últimas quatro horas.
- Trocas frequentes entre tópicos.
- Recomendação proporcional: continuar, reduzir carga ou pausar.
- Temporizador de pausa.
- Alternativa de revisão leve.
- Relatório detalhado dos componentes.

### Transparência
- O módulo não diagnostica fadiga, condição médica, transtorno do sono ou estado psicológico.
- Dificuldade do conteúdo, interrupções e condições externas podem produzir sinais semelhantes.

## [7.2.3.3] — 2026-08-05 — Coach de Consistência

### Adicionado
- Índice geral de consistência.
- Meta semanal dinâmica de dias ativos.
- Equilíbrio de atividades entre disciplinas.
- Detecção de carga concentrada em um único dia.
- Plano prático para distribuir sessões.
- Recomendação da disciplina menos atendida.
- Relatório de distribuição por disciplina.
- Integração com o banco de questões.

### Transparência
- O módulo descreve regularidade e distribuição do uso.
- Não avalia disciplina pessoal, motivação, personalidade ou saúde mental.

## [7.2.3.2] — 2026-08-05 — Detector de Procrastinação

### Adicionado
- Índice operacional de adiamento.
- Detecção de missão antiga ainda pendente.
- Acúmulo de revisões vencidas.
- Aberturas sem conclusão.
- Sessões encerradas em menos de um minuto.
- Trocas rápidas entre tópicos.
- Períodos prolongados sem atividade.
- Menor próxima ação para facilitar o início.
- Confiança da análise e decomposição do índice.
- Painel detalhado nos relatórios.

### Transparência
- O módulo não diagnostica procrastinação como traço psicológico.
- O índice descreve apenas eventos observados no uso da plataforma.
- Causas externas, técnicas ou familiares podem produzir padrões semelhantes.

## [7.2.3.1] — 2026-08-05 — Detector de Hábitos de Estudo

### Adicionado
- Dias ativos em 7, 14 e 30 dias.
- Sequência atual e maior sequência observada.
- Índice de consistência.
- Horário e período do dia mais frequentes.
- Duração média e mediana das sessões.
- Distribuição por dia da semana e por hora.
- Sinais de concentração, baixa frequência e sessões excessivamente curtas ou longas.
- Recomendações objetivas de rotina.
- Painel detalhado nos relatórios.

### Transparência
- O detector descreve padrões de uso da plataforma.
- Os indicadores não constituem diagnóstico comportamental, psicológico ou clínico.
- Amostras pequenas são apresentadas como evidência insuficiente.

## [7.2.2] — 2026-08-05 — Predição de Desempenho

### Adicionado
- Estimativa central de desempenho interno.
- Faixa de incerteza e confiança declarada.
- Estimativas por disciplina.
- Cenário condicionado à conclusão do Coach Diário.
- Riscos que ampliam a incerteza.
- Oportunidades de ganho por disciplina.
- Calibração retrospectiva com erro absoluto médio.
- Atualização após questões e simulados.

### Transparência
- A estimativa não representa nota oficial, corte, classificação ou medalha.
- Amostras pequenas ampliam a faixa de incerteza.
- A calibração só aparece após histórico mínimo de simulados.

## [7.2.1] — 2026-08-05 — Coach Diário

### Adicionado
- Saudação e orientação diária individualizada.
- Seleção de tempo disponível entre 5 e 30 minutos.
- Plano otimizado conforme prioridade, confiança e diversidade de disciplinas.
- Mensagens motivacionais baseadas em evidências reais.
- Detecção de inatividade, concentração de estudos, pressa, abandono e excesso de simulados.
- Impacto potencial apresentado como índice interno, com limite de interpretação.
- Aplicação do plano diretamente à missão diária.
- Painel executivo nos relatórios.

### Transparência
- O Coach não prevê nota, classificação ou medalha.
- O impacto é uma estimativa interna de priorização, com confiança declarada.
- As orientações comportamentais são sugestões de rotina, não diagnósticos.

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
