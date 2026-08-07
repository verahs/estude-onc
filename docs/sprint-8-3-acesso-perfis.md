# Sprint 8.3 — Acesso e Perfis

A Sprint 8.3 substitui a entrada por nome/perfil por uma seleção de perfis locais.

## Regra principal
Nenhum identificador de estudante existente é alterado. A migração apenas cria uma camada visual apontando para os mesmos `studentId` já usados pelos motores pedagógicos.

## Privacidade e escopo
Não há conta online, autenticação remota ou senha. Os dados continuam no navegador/dispositivo.

## Fluxo
1. Escolher perfil existente.
2. Continuar com o mesmo `studentId`.
3. Criar novo perfil somente quando necessário.
4. Trocar de perfil clicando na identificação no cabeçalho.

## Compatibilidade
A API anterior de `ONC.Users` foi mantida para evitar regressões.
