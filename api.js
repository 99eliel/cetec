// api.js
// Camada de comunicação do sistema CETEC com o Cloud Firestore.
// Mantém o contrato window.api usado pelas telas e centraliza validações, filtros e relatórios.

import { db } from "./firebase-config.js?v=20260708-final-4";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const alunosRef = collection(db, "alunos");
const cursosRef = collection(db, "cursos");

const STATUS_PADRAO = [
  "Em Espera",
  "Chamado",
  "Matriculado",
  "Em Curso",
  "Concluído",
  "Desistente",
  "Cancelado"
];

const TURNOS_PADRAO = ["Manhã", "Tarde", "Noite"];

function limparNumeros(valor = "") {
  return String(valor).replace(/\D/g, "");
}

function normalizarBusca(valor = "") {
  return String(valor)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function limparObjeto(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, valor]) => valor !== undefined));
}

function dataISO(valor = "") {
  if (!valor) return "";
  if (typeof valor === "string") return valor.split(" ")[0].slice(0, 10);
  if (valor?.toDate) {
    const data = valor.toDate();
    data.setMinutes(data.getMinutes() - data.getTimezoneOffset());
    return data.toISOString().slice(0, 10);
  }
  return String(valor).split(" ")[0].slice(0, 10);
}

function formatarDataBR(valor = "") {
  const iso = dataISO(valor);
  if (!iso || !iso.includes("-")) return valor || "-";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function escapeHTML(valor = "") {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function prepararAluno(dados, modo = "create") {
  const cpfLimpo = limparNumeros(dados.cpf);
  const telefoneLimpo = limparNumeros(dados.telefone);
  const dataMatricula = dataISO(dados.data_matricula);

  const aluno = {
    nome: String(dados.nome || "").trim(),
    nomeBusca: normalizarBusca(dados.nome),
    cpf: String(dados.cpf || "").trim(),
    cpfLimpo,
    nascimento: dataISO(dados.nascimento),
    telefone: String(dados.telefone || "").trim(),
    telefoneLimpo,
    endereco: String(dados.endereco || "").trim(),
    enderecoBusca: normalizarBusca(dados.endereco),
    curso: String(dados.curso || "").trim(),
    cursoBusca: normalizarBusca(dados.curso),
    turno: String(dados.turno || "").trim(),
    status: String(dados.status || "Em Espera").trim(),
    data_matricula: dataMatricula,
    atualizadoEm: serverTimestamp()
  };

  if (modo === "create") aluno.criadoEm = serverTimestamp();

  return limparObjeto(aluno);
}

async function cpfJaExiste(cpfLimpo, idIgnorado = null) {
  if (!cpfLimpo) return false;
  const q = query(alunosRef, where("cpfLimpo", "==", cpfLimpo), limit(2));
  const snap = await getDocs(q);
  return snap.docs.some((documento) => documento.id !== idIgnorado);
}

async function cursoJaExiste(nomeBusca) {
  if (!nomeBusca) return false;
  const q = query(cursosRef, where("nomeBusca", "==", nomeBusca), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}

function ordenarPorNome(lista) {
  return lista.sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR"));
}

function ordenarAlunos(lista, ordenacao = "data-asc") {
  const ordenado = [...lista];
  ordenado.sort((a, b) => {
    if (ordenacao === "data-desc") {
      const data = dataISO(b.data_matricula).localeCompare(dataISO(a.data_matricula));
      if (data !== 0) return data;
      return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
    }

    if (ordenacao === "nome") return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
    if (ordenacao === "curso") {
      const curso = String(a.curso || "").localeCompare(String(b.curso || ""), "pt-BR");
      return curso || String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
    }
    if (ordenacao === "status") {
      const status = String(a.status || "").localeCompare(String(b.status || ""), "pt-BR");
      return status || String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
    }

    const data = dataISO(a.data_matricula).localeCompare(dataISO(b.data_matricula));
    if (data !== 0) return data;
    return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
  });
  return ordenado;
}

function filtrarAlunos(lista, filtros = {}) {
  const busca = normalizarBusca(filtros.busca || filtros.texto || "");
  const buscaNumerica = limparNumeros(filtros.busca || filtros.texto || "");
  const curso = filtros.curso || "";
  const turno = filtros.turno || "";
  const status = filtros.status || "";
  const inicio = dataISO(filtros.dataInicio || filtros.inicio || "");
  const fim = dataISO(filtros.dataFim || filtros.fim || "");

  return lista.filter((aluno) => {
    const textoAluno = normalizarBusca([
      aluno.nome,
      aluno.cpf,
      aluno.telefone,
      aluno.endereco,
      aluno.curso,
      aluno.turno,
      aluno.status,
      aluno.data_matricula,
      aluno.nascimento
    ].join(" "));

    const numerosAluno = limparNumeros([aluno.cpf, aluno.telefone, aluno.nascimento, aluno.data_matricula].join(" "));
    const dataMatricula = dataISO(aluno.data_matricula);

    if (busca && !textoAluno.includes(busca) && !(buscaNumerica && numerosAluno.includes(buscaNumerica))) return false;
    if (curso && aluno.curso !== curso) return false;
    if (turno && aluno.turno !== turno) return false;
    if (status && aluno.status !== status) return false;
    if (inicio && (!dataMatricula || dataMatricula < inicio)) return false;
    if (fim && (!dataMatricula || dataMatricula > fim)) return false;

    return true;
  });
}

function montarResumo(lista, campo) {
  const contagem = {};
  lista.forEach((item) => {
    const chave = item[campo] || "Não informado";
    contagem[chave] = (contagem[chave] || 0) + 1;
  });
  return Object.keys(contagem)
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((chave) => ({ [campo]: chave, count: contagem[chave] }));
}

function montarResumoStatus(lista) {
  const contagem = Object.fromEntries(STATUS_PADRAO.map((status) => [status, 0]));
  lista.forEach((aluno) => {
    const status = aluno.status || "Não informado";
    contagem[status] = (contagem[status] || 0) + 1;
  });
  return Object.keys(contagem)
    .filter((status) => contagem[status] > 0 || STATUS_PADRAO.includes(status))
    .map((status) => ({ status, count: contagem[status] }));
}

function montarResumoMes(lista) {
  const meses = {};
  lista.forEach((aluno) => {
    const iso = dataISO(aluno.data_matricula);
    if (!iso || iso.length < 7) return;
    const chave = iso.slice(0, 7);
    meses[chave] = (meses[chave] || 0) + 1;
  });

  return Object.keys(meses)
    .sort()
    .map((chave) => {
      const [ano, mes] = chave.split("-");
      return { mes: `${mes}/${ano}`, count: meses[chave] };
    });
}

function montarLinkWhatsApp(aluno) {
  const numero = limparNumeros(aluno.telefone || aluno.telefoneLimpo || "");
  if (!numero) return null;

  const numeroComPais = numero.startsWith("55") ? numero : `55${numero}`;
  const mensagem = `Olá ${aluno.nome || ""}, tudo bem? Aqui é do CETEC. Estamos entrando em contato sobre sua matrícula.`;
  return `https://wa.me/${numeroComPais}?text=${encodeURIComponent(mensagem)}`;
}

async function carregarTodosAlunos() {
  const snap = await getDocs(alunosRef);
  return snap.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
}

window.api = {
  STATUS_PADRAO,
  TURNOS_PADRAO,
  limparNumeros,
  normalizarBusca,
  dataISO,
  formatarDataBR,
  escapeHTML,
  filtrarAlunos,

  getAlunos: async (filtros = {}) => {
    try {
      const alunos = await carregarTodosAlunos();
      const filtrados = filtrarAlunos(alunos, filtros);
      return { success: true, data: ordenarAlunos(filtrados, filtros.ordenacao || "data-asc") };
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
      return { success: false, message: "Erro ao buscar alunos no Firebase.", error };
    }
  },

  getAlunoById: async (id) => {
    try {
      const ref = doc(db, "alunos", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return { success: false, message: "Aluno não encontrado." };
      return { success: true, data: { id: snap.id, ...snap.data() } };
    } catch (error) {
      console.error("Erro ao buscar aluno:", error);
      return { success: false, message: "Erro ao buscar aluno no Firebase.", error };
    }
  },

  salvarMatricula: async (dados) => {
    try {
      const cpfLimpo = limparNumeros(dados.cpf);
      if (!String(dados.nome || "").trim()) return { success: false, message: "Informe o nome do aluno." };
      if (!cpfLimpo) return { success: false, message: "Informe o CPF do aluno." };
      if (!dados.curso) return { success: false, message: "Selecione o curso." };
      if (!dados.turno) return { success: false, message: "Selecione o turno." };
      if (await cpfJaExiste(cpfLimpo)) return { success: false, message: "Já existe uma matrícula com este CPF." };

      await addDoc(alunosRef, prepararAluno(dados, "create"));
      return { success: true, message: "Matrícula salva com sucesso!" };
    } catch (error) {
      console.error("Erro ao salvar matrícula:", error);
      return { success: false, message: "Erro ao salvar matrícula no Firebase.", error };
    }
  },

  updateAluno: async (id, dados) => {
    try {
      const cpfLimpo = limparNumeros(dados.cpf);
      if (!id) return { success: false, message: "ID do aluno não informado." };
      if (!cpfLimpo) return { success: false, message: "Informe o CPF do aluno." };
      if (await cpfJaExiste(cpfLimpo, id)) return { success: false, message: "Já existe outra matrícula com este CPF." };

      const ref = doc(db, "alunos", id);
      await updateDoc(ref, prepararAluno(dados, "update"));
      return { success: true, message: "Matrícula atualizada!" };
    } catch (error) {
      console.error("Erro ao atualizar matrícula:", error);
      return { success: false, message: "Erro ao atualizar matrícula no Firebase.", error };
    }
  },

  updateStatusAluno: async (id, status) => {
    try {
      if (!id) return { success: false, message: "ID do aluno não informado." };
      if (!status) return { success: false, message: "Status não informado." };
      await updateDoc(doc(db, "alunos", id), { status, atualizadoEm: serverTimestamp() });
      return { success: true, message: "Status atualizado!" };
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      return { success: false, message: "Erro ao atualizar status no Firebase.", error };
    }
  },

  deleteAluno: async (id) => {
    try {
      await deleteDoc(doc(db, "alunos", id));
      return { success: true, message: "Aluno excluído!" };
    } catch (error) {
      console.error("Erro ao excluir aluno:", error);
      return { success: false, message: "Erro ao excluir aluno no Firebase.", error };
    }
  },

  getCursos: async () => {
    try {
      const snap = await getDocs(cursosRef);
      const cursos = snap.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
      return { success: true, data: ordenarPorNome(cursos) };
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
      return { success: false, message: "Erro ao buscar cursos no Firebase.", error };
    }
  },

  addCurso: async (nome) => {
    try {
      const nomeTratado = String(nome || "").trim();
      const nomeBusca = normalizarBusca(nomeTratado);
      if (!nomeTratado) return { success: false, message: "Informe o nome do curso." };
      if (await cursoJaExiste(nomeBusca)) return { success: false, message: "Este curso já existe." };

      await addDoc(cursosRef, { nome: nomeTratado, nomeBusca, criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp() });
      return { success: true, message: "Curso adicionado!" };
    } catch (error) {
      console.error("Erro ao adicionar curso:", error);
      return { success: false, message: "Erro ao adicionar curso no Firebase.", error };
    }
  },

  deleteCurso: async (id) => {
    try {
      await deleteDoc(doc(db, "cursos", id));
      return { success: true, message: "Curso excluído!" };
    } catch (error) {
      console.error("Erro ao excluir curso:", error);
      return { success: false, message: "Erro ao excluir curso no Firebase.", error };
    }
  },

  getDashboardStats: async (filtros = {}) => {
    try {
      const alunos = await carregarTodosAlunos();
      const filtrados = ordenarAlunos(filtrarAlunos(alunos, filtros), filtros.ordenacao || "data-asc");
      const porStatus = montarResumoStatus(filtrados);
      const porCurso = montarResumo(filtrados, "curso").map((item) => ({ curso: item.curso, count: item.count }));
      const porTurno = montarResumo(filtrados, "turno").map((item) => ({ turno: item.turno, count: item.count }));
      const porMes = montarResumoMes(filtrados);
      const contagemStatus = Object.fromEntries(porStatus.map((item) => [item.status, item.count]));

      return {
        success: true,
        data: {
          totalAlunos: { count: filtrados.length },
          porStatus,
          porCurso,
          porTurno,
          porMes,
          contagemStatus,
          alunos: filtrados
        }
      };
    } catch (error) {
      console.error("Erro ao gerar dashboard:", error);
      return { success: false, message: "Erro ao carregar dashboard.", error };
    }
  },

  chamarWhatsApp: async (id) => {
    const res = await window.api.getAlunoById(id);
    if (!res.success) return res;
    const link = montarLinkWhatsApp(res.data);
    if (!link) return { success: false, message: "Este aluno não possui telefone cadastrado." };
    window.open(link, "_blank");
    return { success: true, message: "WhatsApp aberto." };
  },

  showMessage: async (msg) => alert(msg),

  generatePdf: async (id) => {
    const res = await window.api.getAlunoById(id);
    if (!res.success) return res;
    const a = res.data;
    const janela = window.open("", "_blank", "width=850,height=700");
    if (!janela) return { success: false, message: "Permita pop-ups para gerar o PDF." };

    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt-br">
      <head>
        <meta charset="UTF-8">
        <title>Matrícula - ${escapeHTML(a.nome || "Aluno")}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 35px; color: #222; }
          .topo { border-bottom: 4px solid #005a9c; padding-bottom: 15px; margin-bottom: 25px; }
          h1 { color: #005a9c; margin: 0; }
          h2 { margin: 5px 0 0; font-size: 18px; color: #555; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          td { padding: 12px; border: 1px solid #ddd; }
          td:first-child { width: 32%; font-weight: bold; background: #f3f7fb; }
          .assinatura { margin-top: 70px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; text-align: center; }
          .linha { border-top: 1px solid #222; padding-top: 8px; }
          .rodape { margin-top: 35px; font-size: 12px; color: #777; }
          button { background: #005a9c; color: white; border: 0; border-radius: 6px; padding: 10px 14px; cursor: pointer; }
          @media print { button { display: none; } body { padding: 15px; } }
        </style>
      </head>
      <body>
        <button onclick="window.print()">Imprimir / Salvar em PDF</button>
        <div class="topo">
          <h1>CETEC</h1>
          <h2>Ficha de Matrícula</h2>
        </div>
        <table>
          <tr><td>Data da Matrícula</td><td>${escapeHTML(formatarDataBR(a.data_matricula))}</td></tr>
          <tr><td>Nome</td><td>${escapeHTML(a.nome || "-")}</td></tr>
          <tr><td>CPF</td><td>${escapeHTML(a.cpf || "-")}</td></tr>
          <tr><td>Nascimento</td><td>${escapeHTML(formatarDataBR(a.nascimento))}</td></tr>
          <tr><td>Telefone</td><td>${escapeHTML(a.telefone || "-")}</td></tr>
          <tr><td>Endereço</td><td>${escapeHTML(a.endereco || "-")}</td></tr>
          <tr><td>Curso</td><td>${escapeHTML(a.curso || "-")}</td></tr>
          <tr><td>Turno</td><td>${escapeHTML(a.turno || "-")}</td></tr>
          <tr><td>Status</td><td>${escapeHTML(a.status || "-")}</td></tr>
        </table>
        <div class="assinatura">
          <div class="linha">Assinatura do Aluno/Responsável</div>
          <div class="linha">Responsável CETEC</div>
        </div>
        <div class="rodape">Documento gerado pelo Sistema de Matrículas CETEC.</div>
      </body>
      </html>
    `);
    janela.document.close();
    return { success: true, message: "Ficha aberta. Use o botão para imprimir ou salvar em PDF." };
  }
};
