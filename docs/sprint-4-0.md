# Sprint 4.0 — Tutor Inteligente

## Objetivo
Fazer a plataforma orientar a próxima ação do estudante.

## Motores

### Priority Engine
Calcula prioridade usando:
- recorrência histórica;
- erros e taxa de erro;
- tempo sem atividade;
- domínio atual;
- tempo de estudo.

O módulo não depende da interface.

### Progress Engine
Calcula domínio de 0 a 100 usando:
- conclusão;
- leitura e visitas;
- tempo de estudo;
- desempenho em questões;
- revisão;
- perda gradual por inatividade.

### Mission Engine
Gera uma missão diária com:
- uma revisão baseada em erro, quando houver;
- um conteúdo prioritário;
- uma tarefa de cinco questões.

### Smart Tutor
Renderiza:
- missão do dia;
- próxima melhor ação;
- preparação estimada;
- domínio e progresso.

## Limites
A preparação estimada não representa previsão de nota ou probabilidade estatística de aprovação. É um índice interno de cobertura e domínio.
