# Contratos de arquitetura

## MasteryEngine
- get(topicId)
- average()
- disciplineSummary(discipline)

## MemoryEngine
- status(topicId)
- averageMemory()

## PriorityEngine
- rank(options)
- calculate(topicId)

## LearningAnalyticsEngine
- topic(topicId)
- subjectSummary(discipline)
- overview()
- performanceEstimate()
- heatmap()

## AssessmentEngine
- adaptivePool(options)
- diagnostic(question, selectedValue)

## TutorEngine
- nextBestAction()
- why(topicId)
