import React, { useState } from "react";
import { Plus, Trash2, Star } from "lucide-react";
import { TextInput, TextArea, SmallButton } from "../builder-controls";

export const DOTES_OFICIAIS = [
  {
    nome: "Abençoado pela Sorte",
    descricao:
      "Você tem 3 pontos de sorte. Sempre que fizer uma rolagem, você pode gastar um ponto de sorte para rolar outro d20, podendo escolher o resultado. Recupera 1 ponto ao receber um crítico contra.",
  },
  {
    nome: "Aparar Ataque",
    descricao:
      "Uma vez por rodada, como reação, você realiza uma jogada de ataque contra quem o atacou corpo-a-corpo para evitar o golpe ou redirecioná-lo gastando 2 PE.",
  },
  {
    nome: "Assumir Postura",
    descricao:
      "Como Ação Bônus, entra em posturas de combate. Fortuna: Permite re-rolar dados menores que o BT. Tempestade: Derruba ou imobiliza alvos acertados. [Requisito: ND 10]",
  },
  {
    nome: "Atração em Combate",
    descricao:
      "Criaturas provocadas por você só podem atacá-lo até passarem em um teste para escapar. [Requisito: 20 Presença e Intimidação]",
  },
  {
    nome: "Bela Tentativa",
    descricao:
      "Ao desarmar um alvo, pode gastar 2 PE para realizar um ataque como reação. Pode também tentar quebrar a arma inimiga.",
  },
  {
    nome: "Destruindo Tudo",
    descricao:
      "Uma vez por rodada, empurra o alvo ao acertá-lo, causando dano adicional e possível colisão com objetos.",
  },
  {
    nome: "Domínio dos Fundamentos",
    descricao:
      "Permite gastar PE para aumentar a CD de feitiços (Feitiço Cruel) ou para duplicar um feitiço de alvo único (Feitiço Duplicado).",
  },
  {
    nome: "Estudo Amaldiçoado",
    descricao:
      "Escolha dois Níveis de Aptidão diferentes para serem aumentados em 1. [Requisito: ND 10]",
  },
  {
    nome: "Expansão Maestral",
    descricao:
      "Permite utilizar expansão de domínio com apenas uma mão livre e sem causar ataques de oportunidade. [Requisito: Expansão Completa]",
  },
  {
    nome: "Explosão em Cadeia",
    descricao:
      "Ao rolar o dano máximo em um dado de feitiço, rola-se mais um dado do mesmo valor. Permite gastar PE para aumentar a CD de resistências inimigas.",
  },
  {
    nome: "Fúria Berserker",
    descricao:
      "Fica imune a imobilização/inconsciência, mas deve focar em um único alvo. Ganha facilidade em pontos cegos e chance de fazer ataques inimigos falharem.",
  },
  {
    nome: "Imitação",
    descricao:
      "Reproduz técnicas inimigas com bônus de acerto e dano. Adiciona dado extra em ataques surpresa.",
  },
  {
    nome: "Membro Fantasma",
    descricao:
      "Ignora meia e 3/4 de cobertura. Pode receber penalidade no ataque para desabilitar o membro do alvo por 1 rodada. Ignora desvantagem em tiro à queima-roupa. [Requisito: ND 10]",
  },
  {
    nome: "Mente e Corpo em Equilíbrio",
    descricao:
      "Recebe vantagens igual ao BT para resistir a condições mentais e físicas.",
  },
  {
    nome: "Posicionamento Ameaçador",
    descricao:
      "Reduz em 2 a defesa de criaturas a 3 metros (salvo furtivo). Ataques de oportunidade zeram o movimento do alvo.",
  },
  {
    nome: "Presença Aterrorizante",
    descricao:
      "Inimigos que o veem pela primeira vez devem fazer um TR de Vontade ou ficam apavorados/amedrontados. [Requisito: Calamidade de Grau 1]",
  },
  {
    nome: "Purificação da Alma",
    descricao:
      "Ao realizar cura, pode abdicar de metade para recuperar pontos de Integridade (uma vez por descanso longo).",
  },
  {
    nome: "Reação Necessária",
    descricao:
      "Pode gastar 3 PE para realizar uma reação extra. Ao receber dano corpo a corpo, pode gastar 2 PE para revidar.",
  },
  {
    nome: "Sentidos Afiados",
    descricao:
      "Soma a ND na Atenção e ganha bônus em Percepção. Pode usar PE para andar no ar ou anular dano de queda. [Requisito: Não ter Sentidos Atentos]",
  },
  {
    nome: "Sentidos Atentos",
    descricao:
      "+5 em Atenção, imunidade a surpresa, +5 de Iniciativa e re-rolagem na iniciativa. [Requisito: Não ter Sentidos Afiados]",
  },
  {
    nome: "Última Investida",
    descricao:
      "Ao cair a 0 PV, pode usar uma reação para realizar um ataque de dano máximo em até 6m. [Requisito: Não possuir Desafiando a Morte]",
  },
  {
    nome: "Voto Malevolente",
    descricao:
      "Ao realizar votos emergenciais, o benefício não precisa ser obrigatoriamente menor que o malefício. [Requisito: ND 8]",
  },
];

const CUSTOM_KEY = "__custom__";

const DOTE_BY_NOME = Object.fromEntries(DOTES_OFICIAIS.map((d) => [d.nome, d]));

export default function SectionDotes({ draft, actions }) {
  const dotes = draft.dotes || [];
  const addedNomes = new Set(dotes.map((d) => d.nome));

  const [selecao, setSelecao] = useState("");
  const [nomeCustom, setNomeCustom] = useState("");
  const [descCustom, setDescCustom] = useState("");

  const oficialSelecionado = DOTE_BY_NOME[selecao];

  const handleAdd = () => {
    if (selecao === CUSTOM_KEY) {
      if (!nomeCustom.trim()) return;
      actions.addDote({
        tipo: "custom",
        nome: nomeCustom.trim(),
        descricao: descCustom.trim(),
      });
    } else if (oficialSelecionado) {
      actions.addDote({
        tipo: "oficial",
        nome: oficialSelecionado.nome,
        descricao: oficialSelecionado.descricao,
      });
    }
    setSelecao("");
    setNomeCustom("");
    setDescCustom("");
  };

  const podeAdicionar =
    selecao === CUSTOM_KEY ? !!nomeCustom.trim() : !!oficialSelecionado;

  return (
    <div className="space-y-4">
      {/* Aviso sobre escolha pelo Mestre */}
      <div className="flex items-start gap-2 bg-amber-950/30 border border-amber-900/50 rounded px-3 py-2">
        <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300/80">
          Dotes Gerais são concedidos pelo Mestre conforme a narrativa e regras da mesa.
          Adicione livremente os dotes permitidos para esta criatura.
        </p>
      </div>

      {/* Lista de dotes adicionados */}
      {dotes.length === 0 ? (
        <div className="text-center py-5 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded">
          Nenhum dote adicionado
        </div>
      ) : (
        <div className="space-y-2">
          {dotes.map((d) => (
            <div
              key={d.id}
              className="flex items-start gap-2.5 bg-slate-950/40 border border-slate-800 rounded p-3"
            >
              <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-semibold text-white">{d.nome}</span>
                  {d.tipo === "custom" && (
                    <span className="text-[9px] uppercase tracking-wide text-amber-400 border border-amber-800/60 rounded px-1 py-0.5">
                      Custom
                    </span>
                  )}
                </div>
                {d.descricao && (
                  <p className="text-xs text-slate-400 leading-relaxed">{d.descricao}</p>
                )}
              </div>
              <SmallButton
                onClick={() => actions.removeDote(d.id)}
                variant="danger"
                title="Remover dote"
              >
                <Trash2 className="w-3 h-3" />
              </SmallButton>
            </div>
          ))}
        </div>
      )}

      {/* Formulário de adição */}
      <div className="pt-3 border-t border-slate-800 space-y-3">
        <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          Adicionar Dote
        </h3>

        <select
          value={selecao}
          onChange={(e) => setSelecao(e.target.value)}
          className="w-full h-9 bg-slate-950 border border-slate-700 rounded px-2 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        >
          <option value="">Escolha um dote...</option>
          {DOTES_OFICIAIS.filter((d) => !addedNomes.has(d.nome)).map((d) => (
            <option key={d.nome} value={d.nome}>
              {d.nome}
            </option>
          ))}
          <option value={CUSTOM_KEY}>✦ Dote Customizado</option>
        </select>

        {/* Preview da descrição oficial */}
        {oficialSelecionado && (
          <div className="bg-slate-900/50 border border-slate-800 rounded p-3">
            <p className="text-xs text-slate-400 leading-relaxed">{oficialSelecionado.descricao}</p>
          </div>
        )}

        {/* Campos para dote customizado */}
        {selecao === CUSTOM_KEY && (
          <div className="space-y-2">
            <TextInput
              value={nomeCustom}
              onChange={setNomeCustom}
              placeholder="Nome do Dote"
            />
            <TextArea
              value={descCustom}
              onChange={setDescCustom}
              rows={3}
              placeholder="Descreva os efeitos deste dote..."
            />
          </div>
        )}

        <SmallButton onClick={handleAdd} variant="primary" disabled={!podeAdicionar}>
          <Plus className="w-3 h-3" /> Adicionar
        </SmallButton>
      </div>
    </div>
  );
}
