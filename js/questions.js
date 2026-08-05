window.ONC = window.ONC || {};
ONC.Questions = {
  answered: {},
  shownAt: {},
  init() {
    this.answered = ONC.Storage.get("onc_question_answered", {});
    const subjects = [...new Set(ONC_DATA.questions.map(q=>q.subject))];
    document.getElementById("bankSubject").innerHTML =
      '<option value="">Todas as disciplinas</option>' + subjects.map(s=>`<option>${s}</option>`).join("");
    this.render();
  },
  render() {
    const subject = document.getElementById("bankSubject").value;
    const difficulty = document.getElementById("bankDifficulty").value;
    const term = document.getElementById("bankSearch").value.trim().toLowerCase();
    const list = ONC_DATA.questions.filter(q =>
      (!subject || q.subject === subject) &&
      (!difficulty || q.difficulty === difficulty) &&
      (!term || `${q.topic} ${q.q}`.toLowerCase().includes(term))
    ).sort((a,b)=>{
      const ar=this.answered[a.id]?1:0, br=this.answered[b.id]?1:0;
      return ar-br || Math.random()-.5;
    });
    document.getElementById("questionBank").innerHTML =
      list.map(q=>this.card(q)).join("") || '<div class="card">Nenhuma questão encontrada.</div>';
  },
  card(q) {
    this.shownAt[q.id] = performance.now();
    return `<article class="qcard" id="bank-${q.id}">
      <div class="qmeta"><span class="badge">${q.subject}</span><span class="badge">${q.topic}</span><span class="badge">${q.difficulty}</span></div>
      <div class="quizIntro">${q.intro || ""}</div>
      ${ONC.VisualLibrary?.questionFigure?.(q) || ONC.Quiz.visual(q.visual)}
      <strong class="quizQuestion">${q.q}</strong>
      <div class="qoptions">${q.options.map((o,i)=>`
        <label class="qoption"><input type="radio" name="bank-${q.id}-opt" value="${i}">
        <span><strong>${"ABCDE"[i]}.</strong> ${o}</span></label>`).join("")}</div>
      <button class="btn primary" onclick="ONC.Questions.check('${q.id}')">Verificar resposta</button>
      <div id="feedback-${q.id}"></div>
    </article>`;
  },
  check(id) {
    const q = ONC_DATA.questions.find(x=>x.id===id);
    const selected = document.querySelector(`input[name="bank-${id}-opt"]:checked`);
    if (!selected) return alert("Selecione uma alternativa.");
    const value = Number(selected.value);
    document.querySelectorAll(`input[name="bank-${id}-opt"]`).forEach(input => {
      const row = input.closest(".qoption");
      if (Number(input.value) === q.answer) row.classList.add("correct");
      else if (input.checked) row.classList.add("wrong");
      input.disabled = true;
    });
    this.answered[id]=true;
    ONC.Storage.set("onc_question_answered",this.answered);
    ONC.Attention?.recordAttempt(q, value === q.answer, "question-bank");
    ONC.LearningEngine?.recordResponse?.(q, value, {
      source: "question-bank",
      responseTimeMs: performance.now() - (this.shownAt[id] || performance.now())
    });
    const diagnostic = ONC.AssessmentEngine.diagnostic(q, value);
    document.getElementById(`feedback-${id}`).innerHTML =
      `<div class="feedback personalizedFeedback ${diagnostic.correct ? "is-correct" : "is-wrong"}">
        <strong>${diagnostic.title}</strong>
        <div><b>Sua resposta:</b> ${diagnostic.selectedText}</div>
        <div><b>Resposta correta:</b> ${diagnostic.correctText}</div>
        <p>${diagnostic.message}</p>
        <small>${diagnostic.action}</small>
        ${ONC.DiagnosticUI?.feedback?.(diagnostic.causeDiagnosis) || ""}
      </div>`;
    ONC.DiagnosticUI?.renderReports?.();
  },
  clearCurrent(){
    document.querySelectorAll("#questionBank input[type=radio]").forEach(i=>{i.checked=false;i.disabled=false;i.closest(".qoption").classList.remove("correct","wrong")});
    document.querySelectorAll("#questionBank [id^=feedback-]").forEach(el=>el.innerHTML="");
  },
  restartUnanswered(){
    const left=ONC_DATA.questions.filter(q=>!this.answered[q.id]);
    if(!left.length){alert("Todas as questões já foram respondidas. Use Reiniciar banco.");return;}
    this.render();
  },
  resetAll(){
    if(!confirm("Apagar o histórico de questões respondidas?"))return;
    this.answered={};ONC.Storage.remove("onc_question_answered");this.render();
  }
};
