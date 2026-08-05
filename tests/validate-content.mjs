import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const catalogPath = path.join(root, "data", "catalog.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

let topics = 0;
const ids = new Set();
const files = new Set();

for (const subject of catalog.subjects) {
  for (const group of subject.groups) {
    for (const topic of group.topics) {
      topics += 1;
      if (ids.has(topic.id)) throw new Error(`ID duplicado: ${topic.id}`);
      if (files.has(topic.file)) throw new Error(`Arquivo duplicado: ${topic.file}`);
      ids.add(topic.id);
      files.add(topic.file);

      const filePath = path.join(root, "data", topic.file);
      if (!fs.existsSync(filePath)) throw new Error(`Arquivo ausente: ${topic.file}`);

      const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (content.id !== topic.id) throw new Error(`ID divergente em ${topic.file}`);
      if (!Array.isArray(content.blocks) || content.blocks.length === 0) {
        throw new Error(`Tópico sem blocos: ${topic.file}`);
      }
    }
  }
}

if (topics !== catalog.topicCount) {
  throw new Error(`Contagem divergente: catálogo=${catalog.topicCount}, real=${topics}`);
}

console.log(`OK: ${topics} tópicos individuais validados.`);
