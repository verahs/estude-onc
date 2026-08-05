import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const body = { dataset: {} };

const context = {
  console,
  window: {},
  document: {
    body,
    getElementById: () => null
  },
  setTimeout,
  clearTimeout
};

context.window = context;
context.ONC = {
  Storage: {
    state: {},
    get(key, fallback) { return this.state[key] ?? fallback; },
    set(key, value) { this.state[key] = value; }
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/preferences.js"), "utf8"),
  context,
  { filename: "js/preferences.js" }
);

context.ONC.Preferences.init();
context.ONC.Preferences.set("contrast", "high");

if (body.dataset.contrast !== "high") {
  throw new Error("Preferência de contraste não foi aplicada.");
}

console.log("Preferências de acessibilidade validadas.");
