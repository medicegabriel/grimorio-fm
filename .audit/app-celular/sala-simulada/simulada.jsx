/* A SALA SIMULADA (etapa E7 do app, 2026-11-20). Só para o `npm run dev`, fora de `src/`: o build nunca a vê.

   As telas da Sala só aparecem com a nuvem ligada e uma conta. Para medir o leiaute delas no celular sem tocar o Supabase, esta
   página monta as mesmas telas com um retrato de mentira (o mesmo do `asserts/t-sala-telas.mjs`) e um cliente que não grava
   nada. Abra `http://localhost:5173/.audit/app-celular/sala-simulada/?tela=jogador` (ou login, entrada, painel, codigo).

   O que ela NÃO prova: login, senha, tempo real, espelho, e o Editar de verdade. Isso é o protocolo no aparelho. */
import "/src/systems/afty/afty-derive.js";
import "/src/index.css";
// A mesma ordem do app: a Ficha (e o ficha.css dela) entra na abertura, antes do CSS do Encontro e da Sala.
import "/src/systems/afty/ficha/AftyFicha.jsx";
import React from "react";
import { createRoot } from "react-dom/client";
import TelaDoJogador from "/src/nuvem/sala-ui/TelaDoJogador.jsx";
import { FormularioDeEntrada, Login } from "/src/nuvem/sala-ui/EntradaNaSala.jsx";
import BotaoEntrarNaSala from "/src/nuvem/sala-ui/EntrarPorCodigo.jsx";
import "/src/nuvem/sala-ui/sala-ui.css";
import "/src/systems/afty/encontros/encontro-g2.css";

const EU = "conta-lia";
const RUI = "conta-rui";
const resumo = (combatente, extra = {}) => ({
  id: `r_${combatente}`, combatente, tipo: "criatura", dono: null, visao: "oculta", nome: combatente, lado: "inimigo",
  posicao: null, na_vez: false, publico: {}, ...extra,
});
const retrato = (papel) => ({
  fase: "conectada",
  salaId: "s1",
  eu: { conta: EU, papel, nome: "Lia" },
  sala: { id: "s1", codigo: "K7QX2M", dono: "conta-mestre", nome: "Mesa de Sexta" },
  membros: {
    "conta-mestre": { conta: "conta-mestre", papel: "mestre", nome: "Gabi" },
    [EU]: { conta: EU, papel, nome: "Lia" },
    [RUI]: { conta: RUI, papel: "jogador", nome: "Rui Fernandes de Albuquerque" },
  },
  estado: { status: "ativo", rodada: 3 },
  online: ["conta-mestre", EU],
  resumos: {
    pj_lia: resumo("pj_lia", { tipo: "personagem", dono: EU, visao: null, nome: "Lia Tsukino", lado: "jogador", posicao: 1, na_vez: true,
      publico: { pv: 40, pvMax: 60, pe: 8, peMax: 10, condicoes: ["Sangrando"], efeitos: [] } }),
    gob1: resumo("gob1", { visao: "barra", nome: "Goblin 1", posicao: 2, publico: { faixa: "ate_a_metade" } }),
    pj_rui: resumo("pj_rui", { tipo: "personagem", dono: RUI, visao: null, nome: "Rui", lado: "jogador", posicao: 3,
      publico: { pv: 20, pvMax: 20, pe: 4, peMax: 4 } }),
    gob2: resumo("gob2", { visao: "nome", nome: "Goblin 2", posicao: 4 }),
    boss: resumo("boss", { visao: "aberta", nome: "Ogro das Montanhas Geladas", posicao: 5, publico: { pv: 90, pvMax: 120, pe: 0, peMax: 0, condicoes: ["Lento"], efeitos: [] } }),
  },
  compartilhamentos: [],
  operacoes: {},
  publicas: {},
  fichas: {},
});

/* Um cliente que responde a tudo e não grava nada. */
const clienteDeMentira = (r) => new Proxy({}, {
  get: (_, nome) => {
    if (nome === "ler") return () => r;
    if (nome === "ouvir") return () => () => {};
    if (nome === "js") return undefined;
    return async () => ({});
  },
});

const tela = new URLSearchParams(location.search).get("tela") ?? "jogador";
const voltar = () => {};
const raiz = createRoot(document.getElementById("root"));

async function montar() {
  const ficha = await fetch("/previas/satoru-gojo-player.json").then((x) => x.json()).then((j) => (Array.isArray(j) ? j[0] : j.creatures?.[0] ?? j)).catch(() => null);
  const personagens = ficha ? [{ ...ficha, id: "lia", mesa: "eradeouro" }] : [];
  if (tela === "login") raiz.render(<Login codigo="K7QX2M" onVoltar={voltar} entrar={async () => {}} />);
  else if (tela === "entrada") raiz.render(<FormularioDeEntrada codigo="K7QX2M" nome="Mesa de Sexta" trancada onVoltar={voltar} onEntrou={() => {}} />);
  else if (tela === "codigo") raiz.render(<div style={{ padding: 16, display: "flex", justifyContent: "flex-end", background: "#020617", minHeight: "100dvh" }}><BotaoEntrarNaSala /></div>);
  else {
    const papel = tela === "espectador" ? "espectador" : "jogador";
    const r = retrato(papel);
    raiz.render(<TelaDoJogador cliente={clienteDeMentira(r)} retrato={r} grupo="eradeouro" personagens={personagens} onVoltar={voltar} />);
  }
}
montar();
