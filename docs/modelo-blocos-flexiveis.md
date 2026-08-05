# Modelo de blocos flexíveis

Cada tópico possui um vetor `blocks`. Nenhum bloco deve ser incluído apenas para completar um template.

Exemplo:

```json
{
  "schemaVersion": "2.0",
  "blocks": [
    {
      "id": "rotacao-concept",
      "type": "concept",
      "label": "Entenda a ideia",
      "content": "..."
    },
    {
      "id": "rotacao-observe",
      "type": "observe",
      "label": "Observe antes de responder",
      "content": "..."
    }
  ]
}
```

O renderizador está em `js/components.js`.
