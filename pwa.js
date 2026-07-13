// pwa.js
// Registro do app instalável, atualização automática e botão de instalação para celular e PC.

const APP_VERSION = "20260713-pc-install-1";
let deferredPrompt = null;

function estaInstaladoComoApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function dispositivoDesktop() {
  return !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function textoBotaoInstalar() {
  return dispositivoDesktop() ? "💻 Instalar no PC" : "📲 Instalar app";
}

function mensagemAjudaInstalacao() {
  if (dispositivoDesktop()) {
    return "Para instalar no PC pelo Chrome ou Edge, clique no ícone de instalação na barra de endereço. Se não aparecer, abra o menu do navegador e procure por 'Instalar app', 'Instalar CETEC' ou 'Salvar e compartilhar > Instalar página como app'.";
  }

  return "No Android/Chrome, abra o menu do navegador e toque em 'Instalar app' ou 'Adicionar à tela inicial'. No iPhone, toque em Compartilhar e depois em 'Adicionar à Tela de Início'.";
}

function botoesInstalacao() {
  return Array.from(document.querySelectorAll("[data-install-button], #installButton, .js-install-app"));
}

function criarBotaoNaBarra() {
  if (estaInstaladoComoApp()) return;

  const nav = document.querySelector(".nav-pills");
  if (!nav || nav.querySelector(".nav-install-btn")) return;

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "nav-install-btn js-install-app";
  botao.setAttribute("data-install-button", "true");
  botao.textContent = textoBotaoInstalar();
  botao.title = dispositivoDesktop() ? "Instalar o sistema CETEC no computador" : "Instalar o sistema CETEC no celular";
  nav.appendChild(botao);
}

function prepararBotoesInstalacao() {
  if (estaInstaladoComoApp()) {
    botoesInstalacao().forEach((botao) => botao.classList.add("oculto"));
    return;
  }

  criarBotaoNaBarra();

  botoesInstalacao().forEach((botao) => {
    botao.classList.remove("oculto");
    botao.textContent = botao.classList.contains("install-btn") ? "Instalar aplicativo" : textoBotaoInstalar();

    if (botao.dataset.installBound === "true") return;
    botao.dataset.installBound = "true";

    botao.addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const escolha = await deferredPrompt.userChoice;
        deferredPrompt = null;

        if (escolha.outcome === "accepted") {
          botoesInstalacao().forEach((item) => item.classList.add("oculto"));
        }
        return;
      }

      alert(mensagemAjudaInstalacao());
    });
  });
}

async function registrarServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register(`./service-worker.js?v=${APP_VERSION}`);
    await registration.update();

    registration.addEventListener("updatefound", () => {
      const novoWorker = registration.installing;
      if (!novoWorker) return;

      novoWorker.addEventListener("statechange", () => {
        if (novoWorker.state === "installed" && navigator.serviceWorker.controller) {
          novoWorker.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });
  } catch (error) {
    console.warn("Service Worker não registrado:", error);
  }
}

document.addEventListener("DOMContentLoaded", prepararBotoesInstalacao);
window.addEventListener("load", () => {
  registrarServiceWorker();
  prepararBotoesInstalacao();
});

navigator.serviceWorker?.addEventListener("controllerchange", () => {
  if (!sessionStorage.getItem("cetec-pwa-reloaded-20260713-pc-install-1")) {
    sessionStorage.setItem("cetec-pwa-reloaded-20260713-pc-install-1", "1");
    window.location.reload();
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  prepararBotoesInstalacao();
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  botoesInstalacao().forEach((botao) => botao.classList.add("oculto"));
});
