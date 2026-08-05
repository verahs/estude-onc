# Arquitetura do Tutor Inteligente

```text
study-history.js
        ↓
progress-engine.js
        ↓
priority-engine.js
        ↓
mission-engine.js
        ↓
smart-tutor.js
```

`priority-engine.js` é deliberadamente independente da interface.

As próximas funcionalidades devem consumir seus métodos públicos:

```javascript
ONC.PriorityEngine.calculate(topicId)
ONC.PriorityEngine.rank(options)
ONC.PriorityEngine.nextBestAction()
```
