# Sprint 7.1.2 — Smart Navigation Engine

## Fluxo
```text
recomendação
  → ContentIndex
  → SmartNavigator
  → disciplina
  → grupo
  → tópico
  → carregamento
  → foco
  → scroll
  → destaque
  → histórico
```

## APIs
- SmartNavigator.goToTopic()
- SmartNavigator.goToPrerequisite()
- SmartNavigator.goToWeakness()
- SmartNavigator.goToMission()
- SmartNavigator.goToRevision()
- SmartNavigator.goToFavorite()
- SmartNavigator.goToLastTopic()
- SmartNavigator.returnToOrigin()

## Analytics
- aberturas;
- conclusões;
- tempo registrado;
- origem do acesso;
- taxa de conclusão.

## Compatibilidade
Attention.openTopic() continua disponível, mas delega ao SmartNavigator.
