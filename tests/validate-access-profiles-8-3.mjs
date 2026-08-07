import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const store = {
  onc_class_students: [
    { id: "st-helena-existing", name: "Helena" },
    { id: "st-sofia-existing", name: "Sofia" }
  ],
  onc_class_current: "st-helena-existing",
  onc_user: { name: "Helena", role: "aluno", studentId: "st-helena-existing" },
  onc_progress_st_helena_existing: { astronomy: { done: true } }
};

const context = { console, window: {}, confirm: () => true, alert: () => {} };
context.window = context;
context.document = {
  getElementById: () => null,
  createElement: () => ({ set textContent(v){ this._text=v }, get innerHTML(){ return this._text || "" } })
};
context.ONC = {
  Storage: {
    get(k, f){ return store[k] === undefined ? f : JSON.parse(JSON.stringify(store[k])); },
    set(k, v){ store[k] = JSON.parse(JSON.stringify(v)); },
    remove(k){ delete store[k]; }
  },
  Users: { current: store.onc_user, initials: n => n[0], hideLogin(){}, updateChip(){}, login(){ return true; } },
  Classroom: { students: store.onc_class_students, currentId: "st-helena-existing" }
};

vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(process.cwd(),"js/access-profiles-8-3.js"),"utf8"), context);

const profiles = context.ONC.AccessProfiles;
profiles.load();
profiles.migrateLegacyData();

if (profiles.profiles.length !== 2) throw new Error("Migração não preservou os dois estudantes.");
const helena = profiles.profiles.find(p => p.name === "Helena");
if (!helena || helena.studentId !== "st-helena-existing") throw new Error("ID existente de Helena foi alterado.");
if (!store.onc_progress_st_helena_existing?.astronomy?.done) throw new Error("Progresso existente foi afetado.");

profiles.migrateLegacyData();
if (profiles.profiles.length !== 2) throw new Error("Migração duplicou perfis.");

console.log("Acesso e Perfis validado sem alteração do progresso.");
