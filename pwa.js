// pwa.js
// Registro do app instalável e controle do botão "Instalar aplicativo".

let deferredPrompt = null;
const installButton = document.getElementById("installButton");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("Service Worker não registrado:", error);
    });
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  if (installButton) installButton.classList.remove("oculto");
});

if (installButton) {
  installButton.addEventListener("click", async () => {
    if (!deferredPrompt) {
      alert("No iPhone, toque em Compartilhar e depois em Adicionar à Tela de Início.");
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installButton.classList.add("oculto");
  });
}

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  if (installButton) installButton.classList.add("oculto");
});
