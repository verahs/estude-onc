window.ONC = window.ONC || {};

ONC.TopicRepository = {
  cache: new Map(),
  pending: new Map(),

  async get(file) {
    if (!file) throw new Error("Arquivo de conteúdo não informado.");
    if (this.cache.has(file)) return this.cache.get(file);
    if (this.pending.has(file)) return this.pending.get(file);

    const request = fetch(`./data/${file}`, { cache: "no-cache" })
      .then(response => {
        if (!response.ok) throw new Error(`Não foi possível carregar ${file}.`);
        return response.json();
      })
      .then(data => {
        this.cache.set(file, data);
        this.pending.delete(file);
        return data;
      })
      .catch(error => {
        this.pending.delete(file);
        throw error;
      });

    this.pending.set(file, request);
    return request;
  },

  has(file) {
    return this.cache.has(file);
  },

  async prefetch(files = [], concurrency = 4) {
    const queue = [...new Set(files.filter(Boolean))]
      .filter(file => !this.cache.has(file) && !this.pending.has(file));

    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length) {
        const file = queue.shift();
        try {
          await this.get(file);
        } catch (error) {
          console.warn("Falha no pré-carregamento:", file, error);
        }
      }
    });

    await Promise.all(workers);
  },

  clear() {
    this.cache.clear();
    this.pending.clear();
  }
};
