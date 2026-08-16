import React, { useCallback, useMemo, useState } from "react";
import { Heart, Zap, Sparkles, Skull, EyeOff, Moon, Swords, Shield, BookOpen, Backpack, Wand2 } from "lucide-react";

import { funcionamentosDaFicha } from "../afty-schema";
import { NumeroComFontes } from "../ui/fontes";
import { numeroBr } from "../ui/formato";
import { aplicaDano, aplicaCura, descansar, registraRolagem } from "../ficha/ficha-sessao";
import { rolarTeste, rolarDano, textoDaRolagem } from "../ficha/ficha-rolagem";
import { deltaDosEstados } from "../ficha/ficha-buffs";
import { conteudoDaFicha, equipamentosDaFicha } from "../ficha/ficha-conteudo";
import AbaAcoes from "../ficha/abas/AbaAcoes";
import AbaBuffs from "../ficha/abas/AbaBuffs";
import AbaPericias from "../ficha/abas/AbaPericias";
import AbaHabilidades from "../ficha/abas/AbaHabilidades";
import AbaEquipamentos from "../ficha/abas/AbaEquipamentos";
import AbaInvocacoes from "../ficha/abas/AbaInvocacoes";

/**
 * ============================================================
 * PAINEL DO COMBATENTE — a ficha de combate dentro do encontro
 * ============================================================
 * O equivalente do `CombatantPanel` da 2.5.2, e ele **reusa as abas da Ficha
 * Final**: Ações, Perícias e Buffs são exatamente os mesmos componentes.
 *
 * Isso é possível porque o estado de combate de um combatente É uma sessão do
 * Afty (ver `afty-encontro.js`), que é o mesmo objeto que a Ficha manipula. O
 * mestre e o jogador leem a mesma tela, com os mesmos números e os mesmos
 * hovers de fonte.
 *
 * ⚠ O QUE NÃO É REUSADO é o cabeçalho: a Ficha tem tema do usuário, retrato,
 * busca global e histórico de rolagens, e nada disso cabe numa coluna dividida
 * com a lista de iniciativa. Os vitais aqui são uma versão enxuta do `Vital`
 * dela, com as mesmas classes `afty-vital-*` para o CSS personalizado continuar
 * valendo.
 *
 * ⚠ O DANO ENTRA CRU, sem abater RD, pela mesma decisão da Ficha: o Afty tem RD
 * Geral, Específica, Física e a da Alma, e qual delas vale depende do TIPO do
 * dano que chegou. Abater a errada é pior que não abater nenhuma, então as RDs
 * ficam à vista na fileira de números e o mestre desconta.
 * ============================================================
 */

/* ⚠ HABILIDADES E EQUIPAMENTOS entraram em 2026-08-08, a pedido do autor:
   *"preciso conseguir ver o que meus Feitiços e derivados fazem, sem precisar ir
   na aba de Edição para saber."* Com Ações, Perícias e Buffs só, o mestre tinha
   os NÚMEROS da criatura e nenhum dos TEXTOS — e ler o que uma Aptidão faz
   exigia sair do encontro e abrir o criador.

   ⚠ INVOCAÇÕES entrou em 2026-08-16, e a falta dela era grave: o encontro é
   exatamente onde um Controlador usa a especialização inteira, e o painel não
   tinha como rolar o ataque de um shikigami nem ver o PV dele. Agora são as
   MESMAS SEIS abas da Ficha Final. */
const ABAS = [
  { id: "acoes", rotulo: "Ações", icone: Swords },
  { id: "habilidades", rotulo: "Habilidades", icone: BookOpen },
  { id: "pericias", rotulo: "Perícias", icone: Shield },
  { id: "equipamentos", rotulo: "Equipamentos", icone: Backpack },
  { id: "invocacoes", rotulo: "Invocações", icone: Sparkles },
  { id: "buffs", rotulo: "Buffs", icone: Wand2 },
];

/* Um vital com barra, campo digitável e passos. Enxuto em relação ao da Ficha:
   sem hover de fontes no máximo, porque a coluna é estreita. */
function Vital({ tipo, icone: Icone, rotulo, atual, max, temp = 0, onSet, onDelta }) {
  const [rascunho, setRascunho] = useState(null);
  const teto = Math.max(1, max);
  const pctVida = Math.min(100, (Math.max(0, atual) / teto) * 100);
  const pctTemp = Math.min(100 - pctVida, (Math.max(0, temp) / teto) * 100);
  const pct = max > 0 ? (atual / max) * 100 : 100;
  const nivel = pct <= 25 ? "critico" : pct <= 50 ? "baixo" : "normal";

  // ⚠ Campo VAZIO não vale zero: limpar para redigitar e sair sem terminar
  // zeraria o PV no meio da luta. Vazio e lixo devolvem o que estava. `+5` e
  // `-3` são delta, e o número seco é valor absoluto. Mesma regra da Ficha.
  const confirma = (texto) => {
    const cru = String(texto).trim();
    setRascunho(null);
    if (!cru) return;
    const n = Math.trunc(Number(cru.replace(",", ".")));
    if (!Number.isFinite(n)) return;
    if (/^[+-]/.test(cru)) onDelta(n); else onSet(n);
  };

  return (
    <div className="afty-vital" data-afty-vital={tipo} data-afty-nivel={nivel}>
      <div className="flex items-center gap-2">
        <Icone className="afty-vital-icone" aria-hidden="true" />
        <span className="afty-vital-rotulo flex-1 min-w-0 truncate">{rotulo}</span>
        <input
          type="text"
          inputMode="numeric"
          className="afty-vital-numero"
          value={rascunho ?? String(atual)}
          onChange={(e) => setRascunho(e.target.value)}
          onBlur={(e) => confirma(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          aria-label={`${rotulo} atual`}
        />
        <span className="afty-vital-max">/ {max}</span>
        {temp > 0 && <span className="afty-vital-temp" title="PV Temporário">+{temp}</span>}
        <span className="flex items-center gap-0.5 flex-shrink-0">
          <button type="button" className="afty-passo" onClick={() => onDelta(-1)} aria-label={`${rotulo} menos 1`}>−</button>
          <button type="button" className="afty-passo" onClick={() => onDelta(1)} aria-label={`${rotulo} mais 1`}>+</button>
        </span>
      </div>
      <div className="afty-vital-trilho mt-2 flex">
        <span className="afty-vital-barra" style={{ width: `${pctVida}%` }} />
        {pctTemp > 0 && (
          <span
            className="afty-vital-barra"
            style={{ width: `${pctTemp}%`, "--afty-vital-cor": "var(--afty-pvtemp)" }}
          />
        )}
      </div>
    </div>
  );
}

/* Dano e cura rápidos: um campo, dois botões. É o gesto mais repetido de uma
   luta inteira, e mandá-lo pelo campo do PV obrigaria a lembrar do sinal. */
function DanoRapido({ onDano, onCura }) {
  const [valor, setValor] = useState("");
  const numero = Math.max(0, Math.trunc(Number(valor) || 0));
  const dispara = (fn) => {
    if (!numero) return;
    fn(numero);
    setValor("");
  };
  return (
    <div className="afty-linha px-2.5 py-2 flex items-center gap-2">
      <input
        type="text"
        inputMode="numeric"
        value={valor}
        onChange={(e) => setValor(e.target.value.replace(/[^\d]/g, ""))}
        onKeyDown={(e) => { if (e.key === "Enter") dispara(onDano); }}
        placeholder="0"
        aria-label="Quantidade de dano ou cura"
        className="afty-campo bg-transparent outline-none w-20 text-center"
        style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)" }}
      />
      <button type="button" className="afty-botao" onClick={() => dispara(onDano)} disabled={!numero}>
        Dano
      </button>
      <button type="button" className="afty-botao" onClick={() => dispara(onCura)} disabled={!numero}>
        Cura
      </button>
      <span className="afty-rotulo text-[10px] flex-1 text-right">
        O dano entra cru, sem abater RD
      </span>
    </div>
  );
}

export default function PainelDeCombatente({
  combatente, derived, sessao, onSessao, onFlag, ativo,
}) {
  const [aba, setAba] = useState("acoes");
  const [abertos, setAbertos] = useState(() => new Set());
  const [destaque, setDestaque] = useState(null);

  const alternaItem = useCallback((chave) => {
    setDestaque(null);
    setAbertos((s) => {
      const n = new Set(s);
      if (n.has(chave)) n.delete(chave); else n.add(chave);
      return n;
    });
  }, []);

  /* Rola e registra no log DA SESSÃO daquele combatente. Devolve a rolagem,
     porque a linha de dano usa o crítico do Acerto para dobrar os dados. */
  const rolar = useCallback((desc) => {
    const r = desc.tipo === "dano" ? rolarDano(desc) : rolarTeste(desc);
    onSessao((s) => registraRolagem(s, r));
    return r;
  }, [onSessao]);

  /* Os textos do livro e o inventário, montados como a Ficha monta. ⚠ Ficam
     ANTES do retorno antecipado lá embaixo, porque hook não pode ser
     condicional — daí os guardas de `null` aqui dentro. */
  const itens = useMemo(
    () => (combatente.ficha && derived ? conteudoDaFicha(combatente.ficha, derived) : []),
    [combatente.ficha, derived],
  );
  const equipamentos = useMemo(() => (derived ? equipamentosDaFicha(derived) : []), [derived]);

  /* ⚠ Mesmo `useMemo` da Ficha, e pelo mesmo motivo: o delta roda um
     `deriveAfty` por estado LIGADO, e sem a memória ele recalcularia a cada
     tecla digitada num campo de PV. */
  const deltaPorEstado = useMemo(
    () => (combatente.ficha
      ? deltaDosEstados(
        combatente.ficha, sessao?.combate,
        { almaAtual: sessao?.almaAtual, buffs: sessao?.buffs },
        derived,
      )
      : {}),
    [combatente.ficha, sessao?.combate, sessao?.almaAtual, sessao?.buffs, derived],
  );

  // Jogador: nada de ficha, nada de painel. A ficha dele está na mão dele.
  if (!combatente.ficha || !sessao || !derived) {
    return (
      <section className="afty-card p-8 text-center">
        <div className="afty-rotulo text-[12px]">
          {combatente.ficha
            ? "Esta criatura não pôde ser calculada. A ficha dela pode ser de uma versão anterior."
            : "Combatente de jogador. A ficha dele está com o jogador, e aqui só entram nome e iniciativa."}
        </div>
      </section>
    );
  }

  const stats = [
    { k: "Defesa", v: derived.defesa, p: "defesa" },
    { k: "CD", v: derived.cd, p: "cd" },
    { k: "RD", v: derived.rdGeral, p: "rdGeral" },
    ...(derived.rdEspecifico > 0 ? [{ k: "RD Espec.", v: derived.rdEspecifico, p: "rdEspecifico" }] : []),
    ...(derived.rdAlma > 0 ? [{ k: "RD Alma", v: derived.rdAlma, p: "rdAlma" }] : []),
    { k: "Mov.", v: `${numeroBr(derived.movimento)}m`, p: "movimento" },
    { k: "Atenção", v: derived.atencao, p: "atencao" },
    { k: "Res. Parcial", v: derived.resParcial, p: "resParcial" },
  ];

  const ultima = sessao.log?.[0] ?? null;

  return (
    <div className="space-y-3">
      {/* ---------- cabeçalho do combatente ---------- */}
      <section className="afty-card p-3 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="afty-card-titulo flex-1 min-w-0 truncate">
            {combatente.nome}
          </h2>
          {ativo && <span className="afty-chip" data-afty-tom="destaque">Turno</span>}
          <button
            type="button"
            className="afty-botao"
            data-afty-tom={combatente.flags.abatido ? "aviso" : undefined}
            aria-pressed={combatente.flags.abatido}
            onClick={() => onFlag("abatido", !combatente.flags.abatido)}
            title="Sai da ordem de iniciativa"
          >
            <Skull className="w-3.5 h-3.5" /> Abatido
          </button>
          <button
            type="button"
            className="afty-botao"
            data-afty-tom={combatente.flags.oculto ? "destaque" : undefined}
            aria-pressed={combatente.flags.oculto}
            onClick={() => onFlag("oculto", !combatente.flags.oculto)}
            title="Sai da ordem sem estar abatido (emboscada, fora de cena)"
          >
            <EyeOff className="w-3.5 h-3.5" /> Oculto
          </button>
          <button
            type="button"
            className="afty-botao"
            onClick={() => onSessao((s) => descansar(s, derived))}
            title="Recursos cheios, usos zerados e durações limpas"
          >
            <Moon className="w-3.5 h-3.5" /> Descansar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Vital
            tipo="pv" icone={Heart} rotulo="PV"
            atual={sessao.hpAtual} max={derived.hp} temp={sessao.pvTempAtual}
            onSet={(v) => onSessao((s) => ({ ...s, hpAtual: v }))}
            onDelta={(d) => onSessao((s) => ({ ...s, hpAtual: s.hpAtual + d }))}
          />
          <Vital
            tipo="pe" icone={Zap} rotulo={derived.recursoLabel}
            atual={sessao.peAtual} max={derived.pe}
            onSet={(v) => onSessao((s) => ({ ...s, peAtual: v }))}
            onDelta={(d) => onSessao((s) => ({ ...s, peAtual: s.peAtual + d }))}
          />
          <Vital
            tipo="alma" icone={Sparkles} rotulo="Alma"
            atual={sessao.almaAtual} max={derived.almaMax}
            onSet={(v) => onSessao((s) => ({ ...s, almaAtual: v }))}
            onDelta={(d) => onSessao((s) => ({ ...s, almaAtual: s.almaAtual + d }))}
          />
          <DanoRapido
            onDano={(n) => onSessao((s) => aplicaDano(s, n))}
            onCura={(n) => onSessao((s) => aplicaCura(s, n, derived.hp))}
          />
        </div>

        {/* Mesma célula de tamanho fixo da Ficha (`afty-stat`), e não uma
            fileira `flex-wrap`: com caixas do tamanho do próprio texto, "CD"
            minúscula ao lado de "Res. Parcial" larga faz a fileira virar uma
            serra. O autor apontou isso na Ficha em 2026-08-05. */}
        <div className="afty-stats grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
          {stats.map((s) => (
            <span key={s.k} className="afty-stat" data-afty-stat={s.p ?? s.k}>
              <span className="afty-stat-rotulo" title={s.k}>{s.k}</span>
              <NumeroComFontes
                valor={s.v}
                partes={s.p ? derived.partes?.[s.p] : null}
                total={s.v}
                formatar={false}
                className="afty-stat-valor"
              />
            </span>
          ))}
        </div>

        {ultima && (
          <div className="afty-linha px-2.5 py-1.5 flex items-center gap-2">
            <span className="afty-rotulo text-[10px] flex-shrink-0">Última rolagem</span>
            <span className="flex-1 min-w-0 truncate text-[12px]">{ultima.rotulo}</span>
            <span className="afty-valor text-[13px]">{textoDaRolagem(ultima)}</span>
          </div>
        )}
      </section>

      {/* ---------- abas ---------- */}
      {/* A barra de abas É a da Ficha (`afty-abas` / `afty-aba`), e não uma
          fileira de botões: o painel do combatente é a mesma ferramenta, e duas
          gramáticas de aba na mesma sessão de jogo confundem quem alterna entre
          a tela do mestre e a do jogador. */}
      <div className="afty-abas afty-encontro-abas" role="tablist" aria-label="Seções do combatente">
        {ABAS.map((a) => {
          const Icone = a.icone;
          return (
            <button
              key={a.id}
              type="button"
              role="tab"
              className="afty-aba flex items-center gap-1.5"
              aria-selected={aba === a.id}
              onClick={() => setAba(a.id)}
            >
              <Icone className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              {a.rotulo}
            </button>
          );
        })}
      </div>

      {aba === "acoes" && (
        <AbaAcoes
          derived={derived}
          rolar={rolar}
          destaque={destaque}
          rapido={[]}
          abertos={abertos}
          onAberto={alternaItem}
          onFavorito={() => {}}
        />
      )}
      {aba === "habilidades" && (
        <AbaHabilidades
          funcionamentos={funcionamentosDaFicha(combatente.ficha)}
          itens={itens}
          abertos={abertos}
          onAberto={alternaItem}
          favoritos={[]}
          onFavorito={() => {}}
          destaque={destaque}
        />
      )}
      {aba === "pericias" && (
        <AbaPericias derived={derived} rolar={rolar} destaque={destaque} />
      )}
      {aba === "equipamentos" && (
        <AbaEquipamentos
          derived={derived}
          itens={equipamentos}
          abertos={abertos}
          onAberto={alternaItem}
          favoritos={[]}
          onFavorito={() => {}}
          destaque={destaque}
        />
      )}
      {aba === "invocacoes" && (
        <AbaInvocacoes derived={derived} rolar={rolar} destaque={destaque} />
      )}
      {aba === "buffs" && (
        <AbaBuffs
          derived={derived}
          sessao={sessao}
          deltaPorEstado={deltaPorEstado}
          onPatchCombate={(parcial) => onSessao((s) => ({ ...s, combate: { ...s.combate, ...parcial } }))}
          onBuffs={(buffs) => onSessao((s) => ({ ...s, buffs }))}
          onCondicoes={(condicoes) => onSessao((s) => ({ ...s, condicoes }))}
        />
      )}
    </div>
  );
}
