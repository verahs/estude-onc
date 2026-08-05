window.ONC = window.ONC || {};
ONC.Search = {
  normalize(value = "") {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }
};
