import React, { useState } from "react";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { Select, TextInput, TextArea, SmallButton } from "../builder-controls";

export const TREINAMENTOS_OFICIAIS = [
  {
    nome: "Treino de Agilidade",
    descricao:
      "Com grande velocidade e agilidade, você se torna rápido e capaz de um nível superior de mobilidade e esquivas. Sua margem necessária para conseguir um sucesso crítico em um TR de Reflexos reduz em 2.",
  },
  {
    nome: "Treino de Barreira",
    descricao:
      "Você domina a técnica de barreiras, conseguindo as conferir uma resistência elevada. Toda parede que você criar com Técnicas de Barreira recebe RD igual ao seu Nível de Aptidão em Barreiras, e você também recebe a capacidade de criar 2 barreiras adicionais e +1 Nível de Aptidão em Barreira.",
  },
  {
    nome: "Treino de Compreensão",
    descricao:
      "Você chega muito perto de compreender profundamente a energia amaldiçoada, tornando-se familiar com ela e entendendo melhor uma parte dela. Com isso, você aumenta um nível de aptidão a sua escolha em 1.",
  },
  {
    nome: "Treino de Domínio",
    descricao:
      "Você se torna um mestre das expansões, entendendo como conseguir moldá-las perfeitamente diante a sua vontade e necessidade do momento. Como resultado, você recebe a aptidão amaldiçoada Modificação Completa e recebe +4 em confrontos.",
  },
  {
    nome: "Treino de Energia",
    descricao:
      "Você já estabeleceu uma profunda conexão com a energia amaldiçoada, assim como a conhece cada vez mais completamente. Em uma situação de combate, imerso no fervor da batalha, você consegue gerar energia. Durante uma cena de combate, no começo de toda rodada, você ganha PE temporário igual a metade do seu BT.",
  },
  {
    nome: "Treino de Energia Reversa",
    descricao:
      "Sua maestria sobre a energia reversa te permite recuperar até mesmo aquilo que parece impossível. Você pode usar a aptidão amaldiçoada Regeneração Aprimorada para curar sua exaustão de técnica após usar expansão de domínio, reduzindo em um turno para 2 pontos de energia reversa gastos.",
  },
  {
    nome: "Treino de Inteligência",
    descricao:
      "Cálculos matemáticos, equações complexas e noções de espaço são meras conveniências para você. Sua margem necessária para conseguir um sucesso crítico em um TR de Astúcia reduz em 2.",
  },
  {
    nome: "Treino de Luta",
    descricao:
      "Você se torna altamente proficiente em luta, conseguindo extrair ao máximo de seu corpo e manobras. Você recebe acesso ao efeito de crítico de ataques desarmados, como pugilato. Além disso, você pode, uma vez por rodada, escolher realizar uma rolagem de Acrobacia ou Atletismo com vantagem.",
  },
  {
    nome: "Treino de Manejo de Arma",
    descricao:
      "Você se torna um mestre no manejo da arma para qual se dedicou a treinar e dominar. Enquanto estiver manuseando a arma escolhida, ela recebe um encantamento de ferramenta amaldiçoada adicional.",
  },
  {
    nome: "Treino de Perícia",
    descricao:
      "Você treinou e se dedicou tanto a uma perícia específica que ela se tornou algo no qual você é quase incapaz de falhar, mantendo uma consistência invejável. Caso realize um teste da perícia escolhida e obtenha um resultado menor do que 5 no d20, você pode rolar novamente e manter o melhor resultado. Você também pode suceder em um teste automaticamente caso não seja um teste competido.",
  },
  {
    nome: "Treino de Potencial Físico",
    descricao:
      "Você conseguiu chegar em um ponto onde seu corpo constantemente se renova e sua energia parece nunca ter fim. Durante uma cena de combate, no começo de toda rodada, você recebe uma quantidade de pontos de estamina temporários igual a metade do seu bônus de treinamento. Este treino é válido apenas para Restringidos Celestes.",
  },
  {
    nome: "Treino de Presença",
    descricao:
      "Você se torna uma celebridade. Toda vez que você começar uma conversa com alguém, uma vez por pessoa, role um 1d20. Caso caia 15 ou maior, a pessoa te conhece e todos os seus testes de carisma contra ela recebem +5.",
  },
  {
    nome: "Treino de Resistência",
    descricao:
      "Seu físico atinge um nível superior, concedendo-lhe uma grande resistência e vigor. Sua margem necessária para conseguir um sucesso crítico em um TR de Fortitude reduz em 2.",
  },
  {
    nome: "Treino de Vontade",
    descricao:
      "Seus estudos finalmente deram frutos. Sua margem necessária para conseguir um sucesso crítico em um TR de Vontade reduz em 2.",
  },
];

// 4° Grau é o mais fraco (0 bônus) → Grau Especial é o mais forte (4 bônus)
const GRAU_BONUS = { "4": 0, "3": 1, "2": 2, "1": 3, especial: 4 };

const CUSTOM_KEY = "__custom__";

export default function SectionTreinamentos({ draft, actions }) {
  const pontosTotal = 1 + (GRAU_BONUS[draft.core?.grau] ?? 0);
  const treinamentos = draft.treinamentos || [];
  const pontosUsados = treinamentos.length;
  const pontosDisponiveis = pontosTotal - pontosUsados;

  const [selecao, setSelecao] = useState("");
  const [nomeCustom, setNomeCustom] = useState("");
  const [descCustom, setDescCustom] = useState("");

  const addedNomes = new Set(treinamentos.map((t) => t.nome));
  const oficialSelecionado = TREINAMENTOS_OFICIAIS.find((t) => t.nome === selecao);

  const handleAdd = () => {
    if (selecao === CUSTOM_KEY) {
      if (!nomeCustom.trim()) return;
      actions.addTreinamento({ tipo: "custom", nome: nomeCustom.trim(), descricao: descCustom.trim() });
    } else if (oficialSelecionado) {
      actions.addTreinamento({ tipo: "oficial", nome: oficialSelecionado.nome, descricao: oficialSelecionado.descricao });
    }
    setSelecao("");
    setNomeCustom("");
    setDescCustom("");
  };

  const podeAdicionar =
    pontosDisponiveis > 0 &&
    (selecao === CUSTOM_KEY ? !!nomeCustom.trim() : !!oficialSelecionado);

  return (
    <div className="space-y-4">
      {/* Indicador de pontos */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400">Pontos de Treinamento</span>
          <div className="flex gap-1">
            {Array.from({ length: pontosTotal }).map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border transition-colors ${
                  i < pontosUsados
                    ? "bg-emerald-600 border-emerald-500"
                    : "bg-slate-800 border-slate-700"
                }`}
              />
            ))}
          </div>
        </div>
        <span
          className={`text-xs font-bold tabular-nums ${
            pontosDisponiveis === 0 ? "text-slate-500" : "text-emerald-400"
          }`}
        >
          {pontosDisponiveis}/{pontosTotal} disponíveis
        </span>
      </div>

      {/* Lista de treinamentos adicionados */}
      {treinamentos.length === 0 ? (
        <div className="text-center py-5 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded">
          Nenhum treinamento adicionado
        </div>
      ) : (
        <div className="space-y-2">
          {treinamentos.map((t) => (
            <div
              key={t.id}
              className="flex items-start gap-2.5 bg-slate-950/40 border border-slate-800 rounded p-3"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-white">{t.nome}</span>
                  {t.tipo === "custom" && (
                    <span className="text-[9px] uppercase tracking-wide text-amber-400 border border-amber-800/60 rounded px-1 py-0.5">
                      Custom
                    </span>
                  )}
                </div>
                {t.descricao && (
                  <p className="text-xs text-slate-400 leading-relaxed">{t.descricao}</p>
                )}
              </div>
              <SmallButton
                onClick={() => actions.removeTreinamento(t.id)}
                variant="danger"
                title="Remover treinamento"
              >
                <Trash2 className="w-3 h-3" />
              </SmallButton>
            </div>
          ))}
        </div>
      )}

      {/* Formulário de adição — só aparece quando há pontos disponíveis */}
      {pontosDisponiveis > 0 ? (
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            Adicionar Treinamento
          </h3>

          <Select
            value={selecao}
            onChange={setSelecao}
            options={[
              ...TREINAMENTOS_OFICIAIS.filter((t) => !addedNomes.has(t.nome)).map((t) => ({
                value: t.nome,
                label: t.nome,
              })),
              { value: CUSTOM_KEY, label: "✦ Treinamento Customizado" },
            ]}
            placeholder="Escolha um treinamento..."
          />

          {/* Preview da descrição do oficial selecionado */}
          {oficialSelecionado && (
            <div className="bg-slate-900/50 border border-slate-800 rounded p-3">
              <p className="text-xs text-slate-400 leading-relaxed">{oficialSelecionado.descricao}</p>
            </div>
          )}

          {/* Campos para treinamento customizado */}
          {selecao === CUSTOM_KEY && (
            <div className="space-y-2">
              <TextInput
                value={nomeCustom}
                onChange={setNomeCustom}
                placeholder="Nome do Treinamento"
              />
              <TextArea
                value={descCustom}
                onChange={setDescCustom}
                rows={3}
                placeholder="Descreva os efeitos deste treinamento..."
              />
            </div>
          )}

          <SmallButton onClick={handleAdd} variant="primary" disabled={!podeAdicionar}>
            <Plus className="w-3 h-3" /> Adicionar
          </SmallButton>
        </div>
      ) : (
        treinamentos.length > 0 && (
          <p className="text-xs text-slate-600 italic text-center pt-1">
            Todos os pontos de treinamento foram utilizados.
          </p>
        )
      )}
    </div>
  );
}
