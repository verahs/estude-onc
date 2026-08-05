import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const memory = new Map();

const localStorage = {
  get length() { return memory.size; },
  key(index) { return [...memory.keys()][index] ?? null; },
  getItem(key) { return memory.has(key) ? memory.get(key) : null; },
  setItem(key, value) { memory.set(key, String(value)); },
  removeItem(key) { memory.delete(key); }
};

const context = {
  console,
  window: {
    confirm: () => true,
    prompt: () => "APAGAR",
    location: { reload: () => {} }
  },
  document: {
    createElement: () => ({
      click() {},
      remove() {},
      set href(value) {},
      set download(value) {}
    }),
    body: { appendChild() {} },
    getElementById: () => null
  },
  localStorage,
  sessionStorage: {
    setItem() {},
    getItem() { return null; },
    removeItem() {}
  },
  Blob,
  URL: {
    createObjectURL: () => "blob:test",
    revokeObjectURL() {}
  }
};

context.window = context;
context.ONC = {
  Storage: {
    get(key, fallback) {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  },
  Users: { current: { name: "Teste", role: "aluno" } },
  DataMigration: { currentVersion: 1 }
};

vm.createContext(context);

for (const file of ["js/data-portability.js"]) {
  vm.runInContext(
    fs.readFileSync(path.join(process.cwd(), file), "utf8"),
    context,
    { filename: file }
  );
}

localStorage.setItem("onc_progress", JSON.stringify({ a: true }));
localStorage.setItem("external_key", JSON.stringify({ unsafe: true }));

const snapshot = context.ONC.DataPortability.snapshot();

if (!snapshot.data.onc_progress) {
  throw new Error("Backup não incluiu dado interno.");
}

if (snapshot.data.external_key) {
  throw new Error("Backup incluiu chave externa.");
}

context.ONC.DataPortability.validate(snapshot);

let rejected = false;
try {
  context.ONC.DataPortability.validate({
    product: "Estude ONC",
    data: { external_key: true }
  });
} catch {
  rejected = true;
}

if (!rejected) {
  throw new Error("Validação aceitou chave externa.");
}

console.log("Portabilidade de dados validada.");
