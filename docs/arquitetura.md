# Arquitetura da Sprint 0

## Interface
`index.html` contém apenas estrutura e referências.

## Estilos
Os estilos legados foram preservados em `css/layout.css` para reduzir risco. Os demais arquivos recebem evoluções incrementais nas próximas sprints.

## Dados
Cada disciplina possui um JSON próprio. O manifesto descreve os arquivos necessários.

## Lógica
Cada módulo funcional possui um arquivo JavaScript separado. `app.js` aguarda o carregamento dos dados antes de inicializar a aplicação.

## Armazenamento
A Sprint 0 mantém `localStorage`. Sincronização entre aparelhos exigirá backend futuro.
