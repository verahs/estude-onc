window.ONC = window.ONC || {};

window.ONC = window.ONC || {};
ONC.Classroom = {
  students: [],
  currentId: null,
  init(){
    this.students=ONC.Storage.get("onc_class_students",[]);
    this.currentId=ONC.Storage.get("onc_class_current",null);
    this.renderSwitcher();
  },
  addFromCurrentUser(){
    if(!ONC.Users.current || ONC.Users.current.role!=="aluno") return;
    const name=ONC.Users.current.name;
    if(this.students.some(s=>s.name===name)) return;
    if(this.students.length>=20) return;
    const id="st-"+Date.now()+"-"+Math.random().toString(16).slice(2);
    this.students.push({id,name});
    this.currentId=id;
    ONC.Storage.set("onc_class_students",this.students);
    ONC.Storage.set("onc_class_current",id);
    this.renderSwitcher();
  },
  switchStudent(id){
    const student=this.students.find(s=>s.id===id);
    if(!student) return;
    this.currentId=id;
    ONC.Storage.set("onc_class_current",id);
    ONC.Users.current={name:student.name,role:"aluno",studentId:id};
    ONC.Storage.set("onc_user",ONC.Users.current);
    ONC.Users.updateChip();
    ONC.Study.progress=ONC.Storage.get("onc_progress_"+id,{});
    ONC.Study.render();
    [
      "StudyHistory","LearningEngine","DailyCoachEngine",
      "PerformancePredictionEngine","StudyHabitEngine",
      "ProcrastinationDetector","ConsistencyCoach",
      "CognitiveFatigueCoach","BehavioralDashboardEngine",
      "LearningCoach","GuardianDashboardEngine"
    ].forEach(name => {
      const module = ONC[name];
      module?.load?.();
      module?.refresh?.("student-switch");
    });
    ONC.GuardianDashboardUI?.render?.();
    ONC.Reports.render();
  },
  renderSwitcher(){
    const select=document.getElementById("studentSwitcher");
    if(!select) return;
    if(!this.students.length){select.classList.add("hidden");return;}
    select.innerHTML='<option value="">Selecionar aluno</option>'+this.students.map(s=>`<option value="${s.id}" ${s.id===this.currentId?"selected":""}>${s.name}</option>`).join("");
    select.classList.remove("hidden");
  }
};
