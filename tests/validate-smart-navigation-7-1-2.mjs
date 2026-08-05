import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

function classList(initial = []) {
  const set = new Set(initial);
  return {
    add(...items) { items.forEach(item => set.add(item)); },
    remove(...items) { items.forEach(item => set.delete(item)); },
    contains(item) { return set.has(item); },
    toggle(item, value) {
      if (value === undefined) value = !set.has(item);
      value ? set.add(item) : set.delete(item);
      return value;
    }
  };
}

const button = {
  setAttribute() {},
  querySelector() { return { textContent: "" }; },
  focus() {}
};

const details = {
  prepend() {},
  append() {}
};

const subject = {
  classList: classList(),
  querySelector(selector) {
    if (selector.includes("subjectHead span")) return { textContent: "Biologia" };
    if (selector.includes("button")) return button;
    return null;
  }
};
const group = {
  classList: classList(),
  querySelector(selector) {
    if (selector.includes("groupHead span")) return { textContent: "Corpo humano" };
    if (selector.includes("button")) return button;
    return null;
  }
};
const card = {
  dataset: {
    topicId: "biologia-sistema-locomotor-e-nervoso",
    topicTitle: "Sistema locomotor e nervoso",
    discipline: "Biologia",
    contentFile: "topics/biologia/sistema-locomotor-e-nervoso.json",
    recurrence: "8"
  },
  classList: classList(["topicCard"]),
  closest(selector) {
    if (selector === ".subject") return subject;
    if (selector === ".group") return group;
    return null;
  },
  querySelector(selector) {
    if (selector === ".topicName") return { textContent: "Sistema locomotor e nervoso" };
    if (selector.includes("topicDetails")) return details;
    if (selector.includes("topicSummary")) return button;
    return null;
  },
  scrollIntoView() {}
};

const local = {};
const document = {
  body: { appendChild() {} },
  querySelectorAll(selector) {
    if (selector === ".topicCard") return [card];
    return [];
  },
  getElementById() { return null; },
  createElement() {
    return {
      className: "",
      setAttribute() {},
      innerHTML: ""
    };
  },
  addEventListener() {}
};

const context = {
  console,
  addEventListener() {},
  confirm: () => false,
  window: {},
  document,
  setTimeout,
  clearTimeout,
  requestAnimationFrame: callback => callback()
};
context.window = context;
context.ONC = {
  Storage: {
    get(key, fallback) { return local[key] ?? fallback; },
    set(key, value) { local[key] = value; }
  },
  Users: { current: { name: "Teste" } },
  Classroom: { currentId: "teste" },
  UI: { showSection() {} },
  Study: { ensureTopicLoaded: async () => {} },
  Notifications: { announce() {} },
  StudyHistory: { recordTopicEvent() {} }
};

vm.createContext(context);

for (const file of [
  "js/core/content-index.js",
  "js/core/navigation-history.js",
  "js/core/focus-mode.js",
  "js/core/smart-navigator.js"
]) {
  vm.runInContext(
    fs.readFileSync(path.join(process.cwd(), file), "utf8"),
    context,
    { filename: file }
  );
}

context.ONC.ContentIndex.init();

const exact = context.ONC.ContentIndex.get("biologia-sistema-locomotor-e-nervoso");
if (!exact) throw new Error("Índice não localizou o tópico por ID.");

const fuzzy = context.ONC.ContentIndex.resolve("Sistema locomotor e nervoso");
if (!fuzzy || fuzzy.id !== exact.id) {
  throw new Error("Índice não localizou o tópico por título.");
}

context.ONC.NavigationHistory.init();
context.ONC.FocusMode.init();
context.ONC.SmartNavigator.init();

const opened = await context.ONC.SmartNavigator.goToTopic(exact.id, {
  source: "diagnostic",
  focus: false,
  smooth: false,
  highlight: false
});

if (!opened) throw new Error("SmartNavigator não abriu o tópico.");

if (!context.ONC.NavigationHistory.state.events.some(event => event.type === "open")) {
  throw new Error("Histórico não registrou a navegação.");
}

console.log("Smart Navigation Engine validado.");
