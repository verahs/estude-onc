# Sprint 8 — UX Rebuild / Central de Inteligência

## Objetivo
Substituir a página longa de Relatórios por uma arquitetura modular, preservando as funcionalidades existentes.

## Módulos
- Dashboard;
- Aprendizagem;
- IA Pedagógica;
- Medalhas;
- Evolução;
- Responsável;
- Sistema.

## Recursos
- navegação lateral;
- breadcrumb;
- troca instantânea;
- busca global;
- favoritos;
- últimos acessos;
- cards recolhíveis;
- persistência do último módulo;
- tema escuro;
- responsividade;
- renderização sob demanda;
- camada de compatibilidade.

## Estratégia técnica
Os componentes existentes são realocados em tempo de execução para módulos especializados. Seus identificadores são preservados, permitindo que os motores e interfaces anteriores continuem renderizando sem alteração estrutural destrutiva.

## Limite
A sprint reorganiza a experiência. Não altera critérios pedagógicos, históricos, XP, níveis, medalhas ou dados dos estudantes.
