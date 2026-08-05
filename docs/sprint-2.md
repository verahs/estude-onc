# Sprint 2 — Arquitetura do conteúdo

## Objetivo
Reduzir acoplamento e melhorar manutenção e desempenho do módulo Estudar.

## Entregas
- um arquivo JSON por tópico;
- catálogo mestre em `data/catalog.json`;
- carregamento sob demanda;
- cache e deduplicação de requisições;
- pré-carregamento de tópicos vizinhos;
- expansão em lote com limite de concorrência;
- changelog;
- teste automatizado de integridade.

## Resultado
A página inicial carrega apenas o catálogo e os dados essenciais. O texto completo de cada tema é baixado quando o estudante abre o tópico.
