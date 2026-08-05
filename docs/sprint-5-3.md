# Sprint 5.3 — Consolidação e Portabilidade

## Backup
O usuário pode baixar todos os dados locais da plataforma em um arquivo JSON.

## Restauração
Antes de restaurar:
- o arquivo é validado;
- apenas chaves internas `onc_` são aceitas;
- um backup temporário de segurança é criado na sessão.

## Exclusão
A exclusão do histórico exige digitar `APAGAR`. O usuário, a turma e as preferências são preservados.

## Migração
A estrutura de dados possui versão própria. Isso permite atualizar dados antigos sem quebrar o histórico.

## Acessibilidade
Preferências disponíveis:
- texto padrão ou ampliado;
- contraste padrão ou alto;
- animações padrão ou reduzidas.

## Relatório
O painel do responsável pode ser impresso ou baixado como texto.
