window.ONC = window.ONC || {};
ONC.Quiz = {
  active: null,
  timer: null,
  seconds: 0,
  lastConfig:null,
  seen:{},
  init() {
    this.seen=ONC.Storage.get("onc_quiz_seen",{});
    const subjects = [...new Set(ONC_DATA.questions.map(q=>q.subject))];
    document.getElementById("quizSubject").innerHTML =
      '<option value="">Todas as disciplinas</option>' + subjects.map(s=>`<option>${s}</option>`).join("");
  },
  start() {
    const subject = document.getElementById("quizSubject").value;
    const count = Number(document.getElementById("quizCount").value);
    const minutes = Number(document.getElementById("quizMinutes").value);
    let pool=ONC_DATA.questions.filter(q=>!subject||q.subject===subject);
    const unseen=pool.filter(q=>!this.seen[q.id]);
    const source=unseen.length>=Math.min(count,pool.length)?unseen:pool;
    pool=[...source].sort(()=>Math.random()-.5).slice(0,Math.min(count,source.length));
    this.lastConfig={subject,count,minutes};
    this.active = { questions: pool, subject: subject || "Todas" };
    this.seconds = minutes*60;
    clearInterval(this.timer);
    this.timer = setInterval(()=> {
      this.seconds--;
      this.drawTimer();
      if (this.seconds <= 0) this.finish();
    },1000);
    document.getElementById("quizArea").innerHTML = `
      <div class="quizTop"><strong>${pool.length} questões</strong><div class="timerBox" id="quizTimer"></div></div>
      ${pool.map((q,i)=>this.card(q,i)).join("")}
      <button class="btn primary" onclick="ONC.Quiz.finish()">Finalizar e corrigir</button>`;
    this.drawTimer();
  },

  visual(type) {
    if (!type) return "";
    const visuals = {
      rotation:`<svg viewBox="0 0 640 220"><rect width="640" height="220" rx="18" fill="#eef6ff"/><circle cx="190" cy="110" r="72" fill="#4f8fd1"/><path d="M135 83c35-26 78-28 115-8M137 145c33 24 76 27 110 8" fill="none" stroke="#76bf73" stroke-width="16" stroke-linecap="round"/><path d="M95 42c-38 32-47 88-20 129" fill="none" stroke="#1f2a44" stroke-width="7"/><polygon points="67,164 87,168 72,183" fill="#1f2a44"/><circle cx="505" cy="65" r="40" fill="#ffd25a"/><text x="315" y="110" font-size="23">movimento de rotação</text></svg>`,
      moon_phases:`<svg viewBox="0 0 640 220"><rect width="640" height="220" rx="18" fill="#111a30"/><g fill="#f2f0d8"><circle cx="95" cy="95" r="42"/><circle cx="245" cy="95" r="42"/><circle cx="395" cy="95" r="42"/><circle cx="545" cy="95" r="42"/></g><circle cx="72" cy="95" r="42" fill="#111a30"/><circle cx="245" cy="95" r="26" fill="#111a30"/><circle cx="418" cy="95" r="42" fill="#111a30"/><text x="44" y="170" fill="white">crescente</text><text x="210" y="170" fill="white">quarto</text><text x="360" y="170" fill="white">minguante</text><text x="520" y="170" fill="white">cheia</text></svg>`,
      day_length_chart:`<svg viewBox="0 0 640 240"><rect width="640" height="240" rx="18" fill="#fbfdff"/><line x1="70" y1="190" x2="575" y2="190" stroke="#1f2a44" stroke-width="3"/><line x1="70" y1="35" x2="70" y2="190" stroke="#1f2a44" stroke-width="3"/><polyline points="90,155 220,135 350,95 480,60 560,45" fill="none" stroke="#2f6fb3" stroke-width="6"/><g fill="#2f6fb3"><circle cx="90" cy="155" r="7"/><circle cx="220" cy="135" r="7"/><circle cx="350" cy="95" r="7"/><circle cx="480" cy="60" r="7"/></g><text x="85" y="215">ago</text><text x="215" y="215">set</text><text x="345" y="215">out</text><text x="475" y="215">nov</text><text x="15" y="55">horas de luz</text></svg>`,
      gravity_compare:`<svg viewBox="0 0 640 220"><rect width="640" height="220" rx="18" fill="#f5f8fc"/><circle cx="175" cy="105" r="70" fill="#4f8fd1"/><circle cx="465" cy="105" r="48" fill="#b6b6b6"/><text x="132" y="195">Terra: maior peso</text><text x="410" y="180">Lua: menor peso</text><path d="M175 35v140M465 57v96" stroke="#c74b50" stroke-width="5"/><polygon points="175,175 165,156 185,156" fill="#c74b50"/><polygon points="465,153 455,134 475,134" fill="#c74b50"/></svg>`,
      cell:`<svg viewBox="0 0 640 240"><rect width="640" height="240" rx="18" fill="#effaf4"/><ellipse cx="320" cy="120" rx="190" ry="88" fill="#bde8d0" stroke="#2f8f65" stroke-width="7"/><circle cx="305" cy="120" r="45" fill="#7b68b3"/><g fill="#f2a76b"><ellipse cx="205" cy="90" rx="24" ry="11"/><ellipse cx="430" cy="145" rx="24" ry="11"/></g><text x="275" y="127" fill="white">núcleo</text></svg>`,
      reflex_arc:`<svg viewBox="0 0 640 220"><rect width="640" height="220" rx="18" fill="#fff8f2"/><circle cx="90" cy="110" r="35" fill="#ef7b55"/><path d="M125 110 C230 35,330 35,420 105" fill="none" stroke="#c74b50" stroke-width="8"/><path d="M420 105 C510 175,555 150,585 105" fill="none" stroke="#2f6fb3" stroke-width="8"/><text x="55" y="165">calor</text><text x="260" y="55">medula</text><text x="500" y="185">músculo</text></svg>`,
      vaccination_chart:`<svg viewBox="0 0 640 240"><rect width="640" height="240" rx="18" fill="#fbfdff"/><line x1="80" y1="190" x2="570" y2="190" stroke="#1f2a44" stroke-width="3"/><rect x="140" y="90" width="90" height="100" fill="#d0dceb"/><rect x="360" y="145" width="90" height="45" fill="#66b88a"/><text x="140" y="215">antes</text><text x="360" y="215">depois</text><text x="130" y="75">mais casos graves</text><text x="350" y="130">menos casos</text></svg>`,
      cerrado:`<svg viewBox="0 0 640 230"><rect width="640" height="230" rx="18" fill="#fff7df"/><circle cx="520" cy="55" r="35" fill="#ffd25a"/><path d="M0 190 Q180 120 350 185 T640 165 V230 H0Z" fill="#c9b45e"/><path d="M250 175 C240 130 280 110 267 70" stroke="#76512f" stroke-width="18" fill="none"/><circle cx="265" cy="62" r="50" fill="#6e9346"/><text x="40" y="210">raízes profundas • casca grossa • seca</text></svg>`,
      percentage_chart:`<svg viewBox="0 0 640 220"><rect width="640" height="220" rx="18" fill="#fbfdff"/><g transform="translate(80,65)"><rect x="80" y="80" width="100" height="100" fill="#2f6fb3"/><rect x="180" y="80" width="300" height="100" fill="#dfe6ee"/><text x="90" y="140" fill="white">25%</text><text x="235" y="140">75%</text></g><text x="90" y="45">25% = 25 de cada 100</text></svg>`,
      temperature_compare:`<svg viewBox="0 0 640 220"><rect width="640" height="220" rx="18" fill="#fff"/><rect x="120" y="70" width="130" height="100" rx="12" fill="#f3a47c"/><rect x="390" y="70" width="130" height="100" rx="12" fill="#8ebbe0"/><path d="M250 120 H390" stroke="#c74b50" stroke-width="10"/><polygon points="390,120 370,106 370,134" fill="#c74b50"/><text x="155" y="130">80 °C</text><text x="425" y="130">20 °C</text></svg>`,
      heat_conduction:`<svg viewBox="0 0 640 220"><rect width="640" height="220" rx="18" fill="#fff7ef"/><rect x="70" y="130" width="190" height="40" rx="8" fill="#777"/><path d="M260 150 H500" stroke="#e85d3f" stroke-width="14"/><polygon points="500,150 474,134 474,166" fill="#e85d3f"/><text x="285" y="115">energia térmica pelo metal</text></svg>`,
      triangle_area:`<svg viewBox="0 0 640 230"><rect width="640" height="230" rx="18" fill="#fbfdff"/><polygon points="120,185 500,185 310,45" fill="#dceafa" stroke="#2f6fb3" stroke-width="5"/><line x1="310" y1="45" x2="310" y2="185" stroke="#c74b50" stroke-width="4" stroke-dasharray="8 7"/><text x="280" y="215">base = 8 m</text><text x="320" y="115">altura = 5 m</text></svg>`,
      historical_sources:`<svg viewBox="0 0 640 220"><rect width="640" height="220" rx="18" fill="#fffaf2"/><rect x="75" y="55" width="110" height="125" rx="8" fill="#e6d1a9"/><circle cx="260" cy="115" r="48" fill="#c89450"/><rect x="350" y="65" width="160" height="105" fill="#dfe7ef"/><path d="M365 90h130M365 115h95M365 140h120" stroke="#7b8794" stroke-width="5"/><text x="70" y="205">carta</text><text x="235" y="205">moeda</text><text x="385" y="205">fotografia</text></svg>`,
      mesopotamia_irrigation:`<svg viewBox="0 0 640 230"><rect width="640" height="230" rx="18" fill="#fff7df"/><path d="M0 175 C170 120 320 210 640 135" fill="none" stroke="#4f8fd1" stroke-width="28"/><path d="M200 145 L200 75 L405 75 L405 150" fill="none" stroke="#7f8c5a" stroke-width="12"/><g stroke="#6e9346" stroke-width="8"><line x1="250" y1="95" x2="250" y2="135"/><line x1="300" y1="95" x2="300" y2="135"/><line x1="350" y1="95" x2="350" y2="135"/></g><text x="225" y="55">canais de irrigação</text></svg>`,
      physical_chemical:`<svg viewBox="0 0 640 220"><rect width="640" height="220" rx="18" fill="#fbfdff"/><rect x="60" y="70" width="130" height="95" rx="12" fill="#b9e2f7"/><path d="M260 95h90M260 135h90" stroke="#777" stroke-width="10"/><rect x="440" y="70" width="110" height="95" rx="12" fill="#a86843"/><g fill="#d17a45"><circle cx="455" cy="82" r="7"/><circle cx="520" cy="120" r="9"/><circle cx="485" cy="150" r="6"/></g><text x="75" y="190">derretimento</text><text x="260" y="190">corte</text><text x="445" y="190">ferrugem</text></svg>`,
      oil_water:`<svg viewBox="0 0 640 220"><rect width="640" height="220" rx="18" fill="#fbfdff"/><path d="M220 40h200l-20 145H240z" fill="#b9e2f7" stroke="#2f6fb3" stroke-width="5"/><path d="M232 72h176l-7 50H239z" fill="#f3d36b"/><text x="285" y="100">óleo</text><text x="285" y="155">água</text></svg>`,
      decantation:`<svg viewBox="0 0 640 220"><rect width="640" height="220" rx="18" fill="#eef8ff"/><rect x="190" y="45" width="260" height="135" rx="10" fill="#b9e2f7" stroke="#2f6fb3" stroke-width="5"/><path d="M205 145h230v30H205z" fill="#9b7b56"/><text x="225" y="205">partículas depositadas no fundo</text></svg>`,
      air_pie:`<svg viewBox="0 0 640 240"><rect width="640" height="240" rx="18" fill="#fbfdff"/><circle cx="220" cy="120" r="80" fill="#6e9fd0"/><path d="M220 120 L220 40 A80 80 0 0 1 296 143 Z" fill="#78bd8a"/><path d="M220 120 L296 143 A80 80 0 0 1 220 200 Z" fill="#dfe8f2"/><text x="340" y="90">Nitrogênio ≈ 78%</text><text x="340" y="125">Oxigênio ≈ 21%</text><text x="340" y="160">Outros ≈ 1%</text></svg>`,
      density_layers:`<svg viewBox="0 0 640 220"><rect width="640" height="220" rx="18" fill="#fbfdff"/><path d="M220 35h200l-20 150H240z" fill="#b9e2f7" stroke="#2f6fb3" stroke-width="5"/><path d="M230 75h180l-7 48H237z" fill="#f3d36b"/><text x="270" y="105">óleo menos denso</text><text x="270" y="160">água mais densa</text></svg>`,
      timezone:`<svg viewBox="0 0 640 220"><rect width="640" height="220" rx="18" fill="#eef6ff"/><circle cx="320" cy="110" r="85" fill="#4f8fd1"/><g stroke="#d7ebff" stroke-width="3"><line x1="320" y1="25" x2="320" y2="195"/><line x1="250" y1="50" x2="390" y2="170"/><line x1="390" y1="50" x2="250" y2="170"/></g><text x="80" y="115">45°</text><text x="455" y="115">3 horas</text></svg>`,
      inverse_proportion:`<svg viewBox="0 0 640 220"><rect width="640" height="220" rx="18" fill="#fbfdff"/><g fill="#4f8fd1"><rect x="100" y="65" width="50" height="90"/><rect x="170" y="65" width="50" height="90"/><rect x="240" y="65" width="50" height="90"/><rect x="310" y="65" width="50" height="90"/></g><text x="100" y="190">4 torneiras → 6 h</text><text x="400" y="120">8 torneiras → ?</text></svg>`,
      density_calc:`<svg viewBox="0 0 640 220"><rect width="640" height="220" rx="18" fill="#eef8ff"/><rect x="90" y="60" width="170" height="110" rx="12" fill="#dfe7ef"/><text x="125" y="105">massa</text><text x="125" y="140">120 g</text><rect x="380" y="60" width="170" height="110" rx="12" fill="#b9e2f7"/><text x="415" y="105">volume</text><text x="415" y="140">150 cm³</text></svg>`
    };
    return `<figure class="quizVisual">${visuals[type] || ""}</figure>`;
  },

  card(q,index) {
    return `<article class="qcard" id="quiz-card-${index}">
      <div class="qmeta"><span class="badge">${q.subject}</span><span class="badge">${q.topic}</span><span class="badge">${q.difficulty}</span></div>
      <div class="quizIntro">${q.intro || ""}</div>
      ${this.visual(q.visual)}
      <strong class="quizQuestion">Questão ${index+1} — ${q.q}</strong>
      <div class="qoptions">${q.options.map((o,i)=>`
        <label class="qoption"><input type="radio" name="quiz-${index}" value="${i}">
        <span><strong>${"ABCDE"[i]}.</strong> ${o}</span></label>`).join("")}</div>
    </article>`;
  },
  drawTimer() {
    const el = document.getElementById("quizTimer");
    if (!el) return;
    const m = String(Math.floor(this.seconds/60)).padStart(2,"0");
    const s = String(this.seconds%60).padStart(2,"0");
    el.textContent = `${m}:${s}`;
  },
  finish() {
    if (!this.active) return;
    clearInterval(this.timer);
    let hits = 0;
    this.active.questions.forEach((q,index)=>{
      const selected = document.querySelector(`input[name="quiz-${index}"]:checked`);
      const value = selected ? Number(selected.value) : null;
      const correct = value === q.answer;
      if (correct) hits++;
      this.seen[q.id]=true;
      ONC.Attention?.recordAttempt(q, correct, "simulado");
      document.querySelectorAll(`input[name="quiz-${index}"]`).forEach(input=>{
        const row = input.closest(".qoption");
        if (Number(input.value) === q.answer) row.classList.add("correct");
        else if (input.checked) row.classList.add("wrong");
        input.disabled = true;
      });
      document.getElementById(`quiz-card-${index}`).insertAdjacentHTML("beforeend",
        `<div class="feedback"><strong>Gabarito: ${"ABCDE"[q.answer]}</strong><br>${q.explanation}</div>`);
    });
    const total = this.active.questions.length;
    const pct = Math.round(hits/total*100);
    const history = ONC.Storage.get("onc_quiz_history", []);
    history.unshift({date:new Date().toLocaleString("pt-BR"),subject:this.active.subject,hits,total,pct});
    ONC.Storage.set("onc_quiz_history",history.slice(0,20));
    ONC.Storage.set("onc_quiz_seen",this.seen);
    document.getElementById("quizArea").insertAdjacentHTML("afterbegin",
      `<div class="resultPanel"><h2>Resultado</h2><p><strong>${hits}/${total}</strong> — ${pct}% — Nota ${(hits/total*10).toFixed(1).replace(".",",")}/10</p></div>`);
    this.active = null;
  },
  clearAnswers(){
    document.querySelectorAll("#quizArea input[type=radio]").forEach(i=>{i.checked=false;i.disabled=false;i.closest(".qoption").classList.remove("correct","wrong")});
    document.querySelectorAll("#quizArea .feedback,#quizArea .resultPanel").forEach(el=>el.remove());
  },
  restart(){
    if(!this.lastConfig){alert("Inicie um simulado primeiro.");return;}
    quizSubject.value=this.lastConfig.subject;quizCount.value=this.lastConfig.count;quizMinutes.value=this.lastConfig.minutes;this.start();
  },
  newUnanswered(){this.start();}
};
