import React, { useMemo, useState } from "react";
import { Plus, X, AlertTriangle } from "lucide-react";

import { COMBATE_ESTADOS } from "../../afty-combate";
import { CONDICOES_CATALOGO } from "../../afty-feiticos";
import { getCanal } from "../../afty-efeitos";
import { sinalDe } from "../../ui/formato";
import CanalPicker from "../CanalPicker";
import PainelDeConcessao from "../PainelDeConcessao";
import { usePrimitiva } from "../../ui/usar-primitiva";
import { estadoUsadoNestaRodada } from "../ficha-sessao";

/**
 * ============================================================
 * ABA BUFFS — o que está ligado agora
 * ============================================================
 * Três camadas, na mesma tela e nesta ordem:
 *
 *   1. CATALOGADOS  os estados que o sistema já conhece (`COMBATE_ESTADOS`).
 *      Nada disso precisou ser construído: cada estado já é variável do DSL e o
 *      `quando` de cada habilidade liga e desliga sozinho desde 2026-07-28.
 *   2. AD-HOC       "+2 de Defesa por 3 rodadas", escrito na hora. É uma linha
 *      do Motor com duração, no mesmo shape do Funcionamento Básico.
 *   3. TEMPORÁRIOS  o que a própria criatura concede com `duracao: "temporaria"`
 *      (Feitiço Auxiliar, Habilidade Única, linha do Funcionamento Básico). Só
 *      LISTA, e não liga nem desliga: ver o aviso abaixo.
 *   4. CONDIÇÕES    marcadores com duração.
 *
 * ⚠ OS TEMPORÁRIOS SÃO SÓ LEITURA, e isso segue a assunção do Motor (ver
 * `afty-efeitos.js`): efeito temporário fica sempre ligado na ficha. Eles já
 * estavam entrando na conta desde sempre, o que faltava era APARECER — sem a
 * lista, um +4 de Força temporário e um permanente eram o mesmo número, e o
 * jogador não tinha como saber qual dos dois ele perde no fim da cena.
 *
 * ⚠ AS CONDIÇÕES SÃO SÓ MARCADORES, e isso é honestidade e não preguiça: o
 * `CONDICOES_CATALOGO` tem as 26 condições em quatro forças, e NENHUMA tem
 * efeito mecânico modelado no Afty. Marcar "Cego" e inventar um -4 seria número
 * saído do nada. Qualquer número que a condição imponha entra como buff ad-hoc,
 * que é onde ele fica visível e rastreável. Ver a pergunta D6.
 * ============================================================
 */

const TODAS_CONDICOES = Object.entries(CONDICOES_CATALOGO)
  .flatMap(([forca, nomes]) => nomes.map((nome) => ({ nome, forca })));

function Secao({ titulo, children, direita }) {
  return (
    <section className="afty-card p-3">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="afty-card-titulo flex-1">{titulo}</h2>
        {direita}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

/* Uma linha do catálogo de estados. `delta` é o que ligar este estado muda na
   ficha, calculado por fora (ver `deltaDosEstados`).

   Ela NÃO desenha a própria caixa: quem desenha é o `GrupoDeEstados`, para o
   estado e os que dependem dele lerem como uma coisa só. A classe
   `afty-estado-linha` é o gancho estável do CSS do usuário e da densidade
   compacta, que antes apertava a `.afty-linha` de cada estado. */
function LinhaEstado({ estado, valor, delta, opcoes, onValor, derived, bloqueado }) {
  const teto = typeof estado.max === "function" ? estado.max(derived) : estado.max;
  return (
    <div className="afty-estado-linha px-2.5 py-1.5 flex items-center gap-2 flex-wrap">
      <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">{estado.label}</span>

      {delta.length > 0 && (
        <span className="flex items-center gap-1 flex-wrap justify-end">
          {delta.map((d) => (
            <span key={d.rotulo} className="afty-chip" data-afty-tom="destaque">
              {d.rotulo} {d.texto}
            </span>
          ))}
        </span>
      )}
      {estado.custoPE != null && valor && (
        <span className="afty-valor text-[11px]" data-afty-tom="custo">{estado.custoPE} PE</span>
      )}

      {estado.tipo === "bool" ? (
        <button
          type="button"
          className="afty-botao"
          data-afty-tom={valor ? "destaque" : undefined}
          aria-pressed={!!valor}
          disabled={bloqueado && !valor}
          title={bloqueado && !valor ? "Já usada nesta rodada" : undefined}
          onClick={() => onValor(estado, !valor)}
        >
          {valor ? "Ativa" : bloqueado ? "Usada" : "Inativa"}
        </button>
      ) : ["opcao", "dominio"].includes(estado.tipo) ? (
        <span className="flex items-center gap-1 flex-wrap justify-end">
          {opcoes.map((o) => (
            <button
              key={o.id}
              type="button"
              className="afty-botao"
              data-afty-tom={valor === o.id ? "destaque" : undefined}
              aria-pressed={valor === o.id}
              onClick={() => onValor(estado, valor === o.id ? null : o.id)}
            >
              {o.label}
            </button>
          ))}
        </span>
      ) : (
        <span className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button" className="afty-passo"
            onClick={() => onValor(estado, Math.max(estado.min ?? 0, (valor || 0) - 1))}
            aria-label={`${estado.label} menos 1`}
          >
            −
          </button>
          <span className="afty-valor text-[13px] w-8 text-center">{valor || 0}</span>
          <button
            type="button" className="afty-passo"
            onClick={() => onValor(estado, Math.min(teto ?? 0, (valor || 0) + 1))}
            aria-label={`${estado.label} mais 1`}
          >
            +
          </button>
        </span>
      )}
    </div>
  );
}

/* Um estado e os que DEPENDEM dele, numa caixa só.

   `requerEstado` sempre significou "esta linha só existe com aquela ligada", mas
   a lista era achatada e as duas liam como assuntos separados: o autor apontou
   isso na imbuição das Técnicas de Estilo, que apareciam soltas embaixo do
   interruptor do Novo Estilo das Sombras (2026-08-10). Vale igual para as pilhas
   da Brutalidade e para o PE Extra dela, que declaram a mesma dependência.

   O pai desenha a caixa, os filhos entram dentro dela recuados e com um fio
   correndo ao lado. Nenhum estado precisou de campo novo. */
function GrupoDeEstados({ pai, filhos, children }) {
  return (
    <div className="afty-linha afty-estado-caixa" data-afty-estado={pai.id}>
      {children}
      {filhos.length > 0 && <div className="afty-estado-filhos">{filhos}</div>}
    </div>
  );
}

/* O formulário do buff ad-hoc. Reusa o vocabulário do Motor: canal, alvo
   opcional e uma expressão do DSL (que na prática costuma ser só um número). */
function NovoBuff({ onCriar }) {
  const [nome, setNome] = useState("");
  const [canal, setCanal] = useState("defesa");
  const [expr, setExpr] = useState("");
  const [rodadas, setRodadas] = useState("");

  const def = getCanal(canal);
  const cria = () => {
    const valor = expr.trim();
    if (!valor) return;
    onCriar({
      id: `buff_${Date.now().toString(36)}`,
      nome: nome.trim() || def?.label || "Buff",
      canal,
      expr: valor,
      rodadas: rodadas.trim() ? Math.max(1, Math.trunc(Number(rodadas)) || 1) : null,
    });
    setNome(""); setExpr(""); setRodadas("");
  };

  return (
    <div className="afty-linha px-2.5 py-2 flex items-center gap-1.5 flex-wrap">
      <input
        type="text" value={nome} onChange={(e) => setNome(e.target.value)}
        placeholder="Nome" aria-label="Nome do buff"
        className="afty-campo bg-transparent outline-none flex-1 min-w-[6rem]"
      />
      {/* ⚠ Era um `<select>` com os canais numa lista corrida, e o autor pediu o
          do Motor em 2026-08-06: são dezenas de canais, e o nativo os despeja
          num tubo sem grupo nenhum. Ver `CanalPicker`. */}
      <CanalPicker value={canal} onChange={setCanal} />
      <input
        type="text" value={expr} onChange={(e) => setExpr(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") cria(); }}
        placeholder="+2" aria-label="Valor ou expressão"
        className="afty-campo bg-transparent outline-none w-16 text-center"
        style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)" }}
      />
      <input
        type="text" inputMode="numeric" value={rodadas} onChange={(e) => setRodadas(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => { if (e.key === "Enter") cria(); }}
        placeholder="∞" aria-label="Duração em rodadas"
        className="afty-campo bg-transparent outline-none w-12 text-center"
        style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)" }}
      />
      <button type="button" className="afty-botao" onClick={cria} aria-label="Adicionar o buff">
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function AbaBuffs({
  derived, sessao, onPatchCombate, onEstado, onBuffs, onCondicoes, deltaPorEstado,
  onConceder, onRemoverConcessao,
}) {
  const combate = derived.combate ?? {};
  const [novaCondicao, setNovaCondicao] = useState("");

  /* ⚠ A CONCESSÃO É RECURSO DE ADDON, e não do raw (autor, 2026-08-20, vendo o
     card aparecer na tela de quem não usa addon nenhum). Só enxerga quem
     instalou um pacote com `permite: ["concessao"]`.

     O `|| já tem alguma coisa` não é folga: sem ele, desinstalar o addon
     deixaria a linha morta presa na sessão sem botão de tirar. */
  const concedido = derived.concedido ?? [];
  const mostraConcessao = usePrimitiva("concessao") || concedido.length > 0;

  /* Os estados que ESTA criatura alcança. Mesma filtragem da bancada do
     criador: quem não pegou a habilidade não vê a linha.

     ⚠ As listas são lidas DENTRO do memo, e não fora: `derived.x ?? []` cria um
     array novo a cada render, e como dependência ele invalidaria o memo sempre.
     Depender do `derived` inteiro é o certo, porque é ele que muda de verdade. */
  const linhas = useMemo(() => {
    const escolhidas = derived.habilidades?.escolhidas ?? [];
    const talentos = derived.talentos?.escolhidas ?? [];
    const aptidoes = derived.aptidoesEscolhidas ?? [];
    const opcoesEscolhidas = Object.values(derived.habilidades?.escolhas?.mapa ?? {}).flat();
    const temHabilidade = (req) =>
      (Array.isArray(req) ? req : [req]).some((id) => escolhidas.includes(id));
    const opcoesDe = (e) => {
      if (e.tipo === "dominio") {
        return (derived.dominios?.lista ?? []).map((d) => ({
          id: d.id,
          label: d.nome || "Domínio Sem Nome",
        }));
      }
      return (e.opcoes ?? [])
        .filter((o) => !o.requerEscolha || opcoesEscolhidas.includes(o.requerEscolha));
    };
    return [
      ...COMBATE_ESTADOS.filter((e) => {
        const temDono = e.requerEscolha ? opcoesEscolhidas.includes(e.requerEscolha)
          : e.requerTalento ? talentos.includes(e.requerTalento)
          : e.requerAptidao ? aptidoes.includes(e.requerAptidao)
          : temHabilidade(e.requerHabilidade);
        return temDono && (!["opcao", "dominio"].includes(e.tipo) || opcoesDe(e).length > 0);
      }),
      // ⚠ O `tipo` vem antes do espalhamento: a imbuição de Técnica de Estilo é
      // `faixa`, e o extra que não declara nada continua caindo em `bool`.
      ...(derived.combate?.estadosExtras ?? []).map((e) => ({ tipo: "bool", ...e })),
    ].map((e) => ({ ...e, opcoesVisiveis: opcoesDe(e) }));
  }, [derived]);

  /* As linhas em ÁRVORE: quem declara `requerEstado` apontando para outra linha
     desta mesma lista é filho dela, e desenha dentro da caixa do pai. Um
     `requerEstado` que aponta para fora da lista NÃO vira raiz por acidente: ele
     continua caindo no `visivel` abaixo, que é o comportamento de sempre. */
  const grupos = useMemo(() => {
    const existe = new Set(linhas.map((e) => e.id));
    const filhosDe = new Map();
    const raizes = [];
    for (const e of linhas) {
      if (e.requerEstado && existe.has(e.requerEstado)) {
        filhosDe.set(e.requerEstado, [...(filhosDe.get(e.requerEstado) ?? []), e]);
      } else {
        raizes.push(e);
      }
    }
    return raizes.map((pai) => ({ pai, filhos: filhosDe.get(pai.id) ?? [] }));
  }, [linhas]);

  /* Os efeitos TEMPORÁRIOS que a criatura carrega, tirados dos `detalhes` do
     Motor (é lá que cada efeito aplicado deixa rastro, com origem e valor).

     ⚠ Desduplica por (nome, canal, alvo, valor): o `ef` é a mescla de vários
     estágios, e um efeito que apareça em dois deles viraria duas linhas iguais
     na tela sem estar contando duas vezes na ficha. */
  const temporarios = useMemo(() => {
    const vistos = new Set();
    const out = [];
    for (const d of derived.efeitos?.detalhes ?? []) {
      if (d.duracao !== "temporaria" || !d.valor) continue;
      // ⚠ Buff ad-hoc da SESSÃO fica de fora (2026-08-10). O `efeitosDaSessao`
      // carimba `duracao: "temporaria"` em tudo que o jogador cria na seção de
      // cima desta mesma aba, então o mesmo +2 saía duas vezes: uma editável,
      // com botão de apagar, e outra aqui em só leitura. Lido de cima a baixo
      // aquilo são dois bônus, e o segundo parece não ser dele para desligar.
      if (d.origem === "sessao") continue;
      const chave = `${d.nome}|${d.canal}|${d.alvo ?? ""}|${d.valor}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      const def = getCanal(d.canal);
      out.push({
        chave,
        nome: d.nome || d.origem || "Efeito",
        origem: d.origem || null,
        canalLabel: (def?.label ?? d.canal) + (d.alvo ? ` (${d.alvo})` : ""),
        valor: d.valor,
        suplantado: !!d.suplantado,
      });
    }
    return out;
  }, [derived]);

  const visivel = (e) => !e.requerEstado || combate[e.requerEstado];
  const buffs = sessao.buffs ?? [];
  const condicoes = sessao.condicoes ?? [];

  return (
    <div className="space-y-3">
      {/* ---------- concedido pelo mestre (Addons 8.3) ----------
          Primeiro da aba quando aparece, e de propósito: é o único bloco daqui
          em que a criatura na mesa passa a ser diferente da criatura no papel.

          Some inteiro para quem só usa o raw. Ver `mostraConcessao`. */}
      {mostraConcessao && (
        <PainelDeConcessao
          concedido={concedido}
          onConceder={onConceder}
          onRemover={onRemoverConcessao}
        />
      )}

      {/* ---------- catalogados ---------- */}
      {linhas.length > 0 && (
        <Secao
          titulo="Estados"
          direita={
            <button
              type="button"
              className="afty-botao"
              data-afty-tom={combate.ativo ? "destaque" : undefined}
              aria-pressed={!!combate.ativo}
              onClick={() => onPatchCombate({ ativo: !combate.ativo })}
            >
              Em Combate
            </button>
          }
        >
          {/* ⚠ Fora de combate TUDO zera, e é por isso que a lista fica apagada
              em vez de sumir: o jogador precisa ver o que existe para saber que
              tem de entrar em combate primeiro. */}
          <div className={combate.ativo ? "space-y-1" : "space-y-1 opacity-40 pointer-events-none"}>
            {grupos.filter(({ pai }) => visivel(pai)).map(({ pai, filhos }) => {
              const linha = (e) => (
                <LinhaEstado
                  key={e.id}
                  estado={e}
                  valor={combate[e.id]}
                  opcoes={e.opcoesVisiveis}
                  delta={deltaPorEstado[e.id] ?? []}
                  onValor={onEstado}
                  derived={derived}
                  bloqueado={e.umaVezPorRodada && estadoUsadoNestaRodada(sessao, e.id)}
                />
              );
              return (
                <GrupoDeEstados key={pai.id} pai={pai} filhos={filhos.filter(visivel).map(linha)}>
                  {linha(pai)}
                </GrupoDeEstados>
              );
            })}
          </div>
        </Secao>
      )}

      {/* ---------- ad-hoc ---------- */}
      <Secao titulo="Buffs">
        {buffs.map((b) => (
          <div key={b.id} className="afty-linha px-2.5 py-1.5 flex items-center gap-2">
            <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">{b.nome}</span>
            <span className="afty-rotulo text-[10px] truncate">{getCanal(b.canal)?.label ?? b.canal}</span>
            <span className="afty-valor text-[12px]">{b.expr}</span>
            {b.rodadas != null && (
              <span className="afty-chip" title="Rodadas restantes">{b.rodadas}</span>
            )}
            <button
              type="button" className="afty-passo"
              onClick={() => onBuffs(buffs.filter((x) => x.id !== b.id))}
              aria-label={`Remover ${b.nome}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <NovoBuff onCriar={(b) => onBuffs([...buffs, b])} />
      </Secao>

      {/* ---------- temporários da própria criatura ---------- */}
      {temporarios.length > 0 && (
        <Secao titulo="Temporários">
          {temporarios.map((t) => (
            <div key={t.chave} className="afty-linha px-2.5 py-1.5 flex items-center gap-2">
              <span className="flex-1 min-w-0 text-[12px] font-semibold truncate" title={t.nome}>{t.nome}</span>
              {t.origem && t.origem !== t.nome && (
                <span className="afty-rotulo text-[10px] truncate max-w-[8rem] hidden sm:block">{t.origem}</span>
              )}
              <span className="afty-rotulo text-[10px] truncate">{t.canalLabel}</span>
              <span className="afty-valor text-[12px]">{sinalDe(t.valor)}</span>
              {t.suplantado && (
                <span className="afty-chip" title="Perdeu o pool exclusivo para uma fonte maior: não está somando">
                  Suplantado
                </span>
              )}
            </div>
          ))}
          <div className="afty-chip mt-1" data-afty-tom="aviso">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            Já estão somados. Duram até o fim do efeito que os concedeu
          </div>
        </Secao>
      )}

      {/* ---------- condições ---------- */}
      <Secao titulo="Condições">
        {condicoes.map((c) => (
          <div key={c.id} className="afty-linha px-2.5 py-1.5 flex items-center gap-2">
            <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">{c.nome}</span>
            <span className="afty-chip">{c.forca}</span>
            {c.rodadas != null && <span className="afty-chip">{c.rodadas}</span>}
            <button
              type="button" className="afty-passo"
              disabled={c.id === "ritual:desprevenido"}
              title={c.id === "ritual:desprevenido" ? "Ritual Estendido" : undefined}
              onClick={() => onCondicoes(condicoes.filter((x) => x.id !== c.id))}
              aria-label={`Remover ${c.nome}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <div className="afty-linha px-2.5 py-2 flex items-center gap-1.5">
          <select
            value={novaCondicao}
            onChange={(e) => setNovaCondicao(e.target.value)}
            aria-label="Condição"
            className="afty-campo bg-transparent outline-none flex-1 min-w-0"
            style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)", padding: "2px 4px" }}
          >
            <option value="" style={{ background: "var(--afty-card)" }}>Escolher</option>
            {TODAS_CONDICOES.map((c) => (
              <option key={c.nome} value={c.nome} style={{ background: "var(--afty-card)" }}>{c.nome}</option>
            ))}
          </select>
          <button
            type="button"
            className="afty-botao"
            disabled={!novaCondicao}
            onClick={() => {
              const def = TODAS_CONDICOES.find((c) => c.nome === novaCondicao);
              if (!def) return;
              onCondicoes([...condicoes, {
                id: `cond_${Date.now().toString(36)}`, nome: def.nome, forca: def.forca, rodadas: null,
              }]);
              setNovaCondicao("");
            }}
            aria-label="Adicionar a condição"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {condicoes.length > 0 && (
          <div className="afty-chip mt-1" data-afty-tom="aviso">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            Condição não muda número, resolve na mesa
          </div>
        )}
      </Secao>
    </div>
  );
}
