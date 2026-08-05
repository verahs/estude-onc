# Sprint 5.1.1 — Avaliação Inteligente Reestruturada

## Problema corrigido
A interface chamou `MasteryEngine.disciplineSummary()`, mas o pacote publicado não expunha esse método. Isso interrompia a inicialização.

## Solução estrutural
Foi criada uma camada única:

```text
LearningAnalyticsEngine
```

Ela centraliza:

- resumo por disciplina;
- domínio médio;
- memória média;
- cobertura;
- mapa de aprendizagem;
- indicador de desempenho;
- próxima revisão;
- tópicos prioritários.

## Dependências

```text
MasteryEngine ─┐
MemoryEngine  ─┼─> LearningAnalyticsEngine
PriorityEngine ┘              │
                              ├─> AssessmentEngine
                              ├─> DashboardEngine
                              ├─> TutorEngine
                              └─> AssessmentUI / Relatórios
```

## Compatibilidade
`MasteryEngine.disciplineSummary()` continua disponível como adaptador para código antigo.

## Resiliência
A inicialização registra erros por módulo. Um erro em relatório ou heatmap não derruba estudo, questões ou simulado.
