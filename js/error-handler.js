window.addEventListener("error", function(event) {
  const box = document.getElementById("runtimeErrorBox");
  if (box) {
    box.classList.remove("hidden");
    box.textContent = "Erro ao carregar a plataforma: " + event.message;
  }
});
