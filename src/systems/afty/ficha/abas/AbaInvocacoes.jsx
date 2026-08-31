import React, { useState } from "react";
import {
  AlertTriangle, Heart, Image as ImageIcon, Palette, Shield, Sparkles, Wind,
} from "lucide-react";

import { AFTY_ATTRS } from "../../afty-schema";
import { NumeroComFontes } from "../../ui/fontes";
import { sinalDe } from "../../ui/formato";
import { Vital } from "../../ui/vital";
import { cssDaInvocacao, escopoDaInvocacao } from "../ficha-tema";
import { useDestaque } from "../usar-destaque";

/**
 * ============================================================
 * ABA SHIKIGAMIS — a peça central de um Controlador
 * ============================================================
 * ⚠ REFEITA EM 2026-08-31, e o pedido do autor é o resumo do que estava errado:
 *
 *   *"a aba de Shikigamis ficou horripilante de entender e usar tudo que eu
 *    tenho a dispor. A impressão que dá é que você fez Shikigamis como se fossem
 *    só mais uma habilidade qualquer, quando eles são a Peça CHAVE em um
 *    personagem Controlador. Eles que precisam de toda a atenção possível, já
 *    que são vários e precisam ser fáceis de consultar, e mexer nas suas barras
 *    de HP, Integridade, saber ativar e desativar seus bônus, isso tudo enquanto
 *    possuem uma Ficha entendível e bonita."*
 *
 * O desenho antigo era uma PILHA de cartões recolhidos, todos iguais, todos
 * fechados, cada um mostrando quatro números mortos. Com quatro invocações a
 * tela não cabia, e nada nela era clicável a não ser a setinha.
 *
 * O desenho de agora é MESTRE-DETALHE, e cada metade resolve uma frase do
 * pedido:
 *
 *   • a FILEIRA de cima ("são vários e precisam ser fáceis de consultar"): um
 *     cartão por Shikigami, com retrato, a barra de vida dele e o interruptor de
 *     campo. Dá para ver o estado de todos sem abrir nenhum.
 *   • a FICHA de baixo ("uma Ficha entendível e bonita"): UM Shikigami por vez,
 *     inteiro, com banner, vitais editáveis, bônus, testes e ações.
 *
 * ⚠ E A INVOCAÇÃO VIROU UM SER VIVO NA MESA. O comentário que estava aqui dizia
 * o contrário: *"o PV da Invocação NÃO entra na sessão. Ele é o MÁXIMO, e não um
 * recurso gasto"*. Era verdade porque o descanso não sabia o que fazer com eles.
 * Agora sabe (ver `descansar` em `ficha-sessao.js`), então o Controlador deixou
 * de anotar o PV dos shikigamis num papel ao lado do computador.
 * ============================================================
 */

/* Rótulos das escolhas que a Ação guarda. São de EXIBIÇÃO: o motor guarda a
   chave, a mesa lê o nome. */
const AUXILIO_ROTULO = {
  cura: "Cura", defesa: "Defesa", acerto: "Acerto", danoAdicional: "Dano Adicional", rd: "RD",
};
const CONDICAO_ROTULO = { fraca: "Fraca", media: "Média", forte: "Forte" };
const ALVO_AUXILIO_ROTULO = { invocacao: "Nela Mesma", aliados: "Aliados" };

/** A notação de uma lista de grupos de dado: `[{2,12},{1,6}]` vira "2d12 + 1d6". */
const notacaoDe = (grupos) => grupos.map((g) => `${g.dados}d${g.faces}`).join(" + ");

/** O que uma Característica resolvida CONCEDE, em uma linha curta. */
function resumoCaracteristica(c) {
  switch (c.subtipo) {
    case "vida": return `+${c.valor} PV`;
    case "rd": return `${c.valor} RD ${c.rdTipoLabel || ""}`.trim();
    case "teste": return `${c.valor >= 0 ? "+" : ""}${c.valor}`;
    case "tamanho": return c.tamanhoLabel || "";
    default: return "";
  }
}

/* ============================================================ */
/* RETRATO                                                       */
/* ============================================================ */
/**
 * ⚠ O RETRATO É POR SHIKIGAMI (autor, 2026-08-31: *"faça com que cada Shikigami
 * tenha direito a uma imagem própria na criação e na ficha final"*). Mesmo par
 * de campos do retrato da criatura, `portraitUrl` + `portraitFocus`, para o
 * seletor de foco do criador servir aos dois sem uma segunda cópia.
 *
 * ⚠ A URL QUE FALHA vira o ícone, e a marca fica presa ÀQUELA url: trocar a
 * imagem faz o retrato voltar sozinho. É o desenho da 2.5.2, e vale a pena.
 */
function Retrato({ inv, className }) {
  const [quebrada, setQuebrada] = useState(null);
  const url = inv.portraitUrl && quebrada !== inv.portraitUrl ? inv.portraitUrl : null;
  const f = inv.portraitFocus || {};
  if (!url) {
    return (
      <span className={`afty-inv-retrato afty-inv-retrato-vazio ${className || ""}`} aria-hidden="true">
        <ImageIcon className="w-1/3 h-1/3" />
      </span>
    );
  }
  return (
    <img
      src={url}
      alt=""
      className={`afty-inv-retrato ${className || ""}`}
      style={{ objectPosition: `${f.x ?? 50}% ${f.y ?? 50}%` }}
      onError={() => setQuebrada(inv.portraitUrl)}
      referrerPolicy="no-referrer"
      draggable={false}
    />
  );
}

/* ============================================================ */
/* A FILEIRA DE CIMA                                             */
/* ============================================================ */
/**
 * Um Shikigami na fileira: retrato, nome, grau, a barra de vida dele e o
 * interruptor de campo.
 *
 * ⚠ O CARTÃO INTEIRO SELECIONA, e o interruptor de campo é o único ponto que
 * não. Selecionar é a ação de leitura e acontece o tempo todo, então ela merece
 * o alvo grande. Invocar e dissipar são atos de mesa e ficam num alvo próprio.
 */
function CartaoDoRoster({ inv, estado, selecionado, aoSelecionar, aoEmCampo }) {
  const pvAtual = estado.pvAtual ?? inv.pv;
  const pct = inv.pv > 0 ? Math.max(0, Math.min(100, (pvAtual / inv.pv) * 100)) : 0;
  const nivel = pct <= 25 ? "critico" : pct <= 50 ? "baixo" : "normal";
  return (
    <div
      className="afty-inv-cartao"
      data-afty-alvo={selecionado ? "sim" : undefined}
      data-afty-campo={inv.emCampo ? "sim" : "nao"}
      data-afty-fora={estado.exorcizada ? "sim" : undefined}
    >
      <button
        type="button"
        className="afty-inv-cartao-corpo"
        onClick={aoSelecionar}
        aria-pressed={selecionado}
      >
        <span className="afty-inv-cartao-topo">
          <Retrato inv={inv} className="afty-inv-retrato-cartao" />
          <span className="afty-inv-cartao-texto">
            <span className="afty-inv-cartao-nome" title={inv.nome || "Invocação Sem Nome"}>
              {inv.nome || "Sem Nome"}
            </span>
            <span className="afty-inv-cartao-grau">{inv.grauLabel}</span>
          </span>
        </span>
        <span className="afty-inv-cartao-vida">
          <span className="afty-vital-trilho" data-afty-nivel={nivel}>
            <span className="afty-vital-barra" style={{ width: `${pct}%`, "--afty-vital-cor": "var(--afty-pv)" }} />
          </span>
          <span className="afty-inv-cartao-pv">{pvAtual} / {inv.pv}</span>
        </span>
        {inv.warnings?.length > 0 && (
          <AlertTriangle
            className="w-3.5 h-3.5 flex-shrink-0 absolute top-1.5 right-1.5"
            style={{ color: "var(--afty-aviso)" }}
            aria-hidden="true"
            title={inv.warnings.join("\n")}
          />
        )}
      </button>
      {/* ⚠ EXORCIZADA NÃO VOLTA: *"não pode ser recuperada por métodos
          convencionais, sendo perdida permanentemente"*. O botão morre no lugar
          de sumir, senão o cartão ficaria sem explicação nenhuma. */}
      <button
        type="button"
        className="afty-inv-campo"
        data-afty-tom={inv.emCampo ? "destaque" : undefined}
        onClick={aoEmCampo}
        disabled={estado.exorcizada}
        aria-pressed={inv.emCampo}
        title={estado.exorcizada
          ? `${inv.retirada === "destruída" ? "Destruída" : "Exorcizada"} por dano excedente`
          : inv.emCampo
            ? `Dissipar (${inv.retirada})`
            : estado.abatida
              ? `Invocar por ${inv.custo} PE, com metade da vida`
              : `Invocar por ${inv.custo} PE`}
      >
        {estado.exorcizada
          ? (inv.retirada === "destruída" ? "Destruída" : "Exorcizada")
          : inv.emCampo ? "Em Campo" : `${inv.custo} PE`}
      </button>
    </div>
  );
}

/* ============================================================ */
/* OS BÔNUS                                                      */
/* ============================================================ */
/**
 * ⚠ ESTE BLOCO É A RESPOSTA A *"saber ativar e desativar seus bônus"*, e ele
 * mexe no número de verdade: o autor decidiu em 2026-08-31 que o auxílio ligado
 * *"mexe na ficha do DONO de verdade e na ficha da INVOCAÇÃO de verdade"*. Ver
 * `auxiliosLigadosDa` e `efeitosDeInvocacao`.
 *
 * ⚠ SÓ TRÊS DOS CINCO SUB-TIPOS TÊM INTERRUPTOR, e não é recorte de tela: Cura
 * ROLA e Dano Adicional é *"um próximo ataque"*, um dado, uma vez. Os dois
 * aparecem na lista com o que entregam, sem interruptor, porque esconder a
 * existência deles seria pior que mostrá-los sem botão.
 */
function Bonus({ inv, aoAlternar }) {
  if (!inv.auxilios?.length) return null;
  return (
    <section className="afty-inv-bloco">
      <h3 className="afty-card-titulo mb-1.5">Bônus</h3>
      <div className="space-y-1">
        {inv.auxilios.map((a) => {
          const valor = a.sub === "rd" ? `${a.valor} RD`
            : a.sub === "danoAdicional" ? (a.dado || "")
              : a.valor != null ? sinalDe(a.valor) : "";
          const linha = (
            <>
              <span className="flex-1 min-w-0 text-[12px] truncate">{a.nome}</span>
              <span className="afty-rotulo text-[10px] whitespace-nowrap">{a.subLabel}</span>
              <span className="afty-rotulo text-[10px] whitespace-nowrap">{a.alvoLabel}</span>
              {a.custoPE > 0 && (
                <span className="afty-valor text-[11px]" data-afty-tom="custo">{a.custoPE} PE</span>
              )}
              {valor && <span className="afty-valor text-[13px] whitespace-nowrap">{valor}</span>}
            </>
          );
          if (!a.sustentavel) {
            return (
              <div key={a.id} className="afty-linha afty-inv-bonus px-2.5 py-1 flex items-center gap-2">
                {linha}
              </div>
            );
          }
          return (
            <button
              key={a.id}
              type="button"
              className="afty-linha afty-inv-bonus afty-inv-bonus-botao px-2.5 py-1 flex items-center gap-2 w-full text-left"
              data-afty-ligado={a.ligado ? "sim" : "nao"}
              onClick={() => aoAlternar(a.id, !a.ligado)}
              aria-pressed={a.ligado}
            >
              <span className="afty-inv-lampada" aria-hidden="true" />
              {linha}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================ */
/* TESTES E AÇÕES (mantidos do desenho antigo)                   */
/* ============================================================ */
/**
 * Uma linha de teste rolável (Teste de Resistência ou Perícia). As duas têm a
 * mesma anatomia: nome, o que é condicional, a proficiência e o número que rola.
 */
function LinhaDeTeste({ nome, bonus, comGatilho = 0, mestre = false, treinado = true, rotulo, rolar }) {
  return (
    <div className="afty-linha px-2.5 py-1 flex items-center gap-2">
      <span className="flex-1 min-w-0 text-[12px] truncate">{nome}</span>
      {/* Bônus de Característica em Ataque ou TR exige gatilho, então não entra
          no número que a linha rola. Em Perícia ele já está somado. */}
      {comGatilho > 0 && (
        <span className="afty-chip" title="Bônus de Característica, só quando o gatilho ocorre">
          +{comGatilho} com gatilho
        </span>
      )}
      {mestre
        ? <span className="afty-chip">Mestre</span>
        : !treinado && <span className="afty-rotulo text-[10px]">Não Treinado</span>}
      <NumeroComFontes
        valor={bonus}
        total={sinalDe(bonus)}
        className="afty-valor text-[13px] w-10 text-right"
        ancora="direita"
        onRolar={() => rolar({ tipo: "teste", rotulo, bonus })}
      />
    </div>
  );
}

/**
 * Os seis atributos da invocação. Ela É uma criatura, e a mesa pede o atributo
 * dela a toda hora (uma manobra de Agarrar, um teste improvisado, resistir a um
 * empurrão). Só o MODIFICADOR rola, como teste puro.
 */
function Atributos({ atributos, nomeDono, rolar }) {
  const valores = atributos?.valores;
  if (!valores) return null;
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
      {AFTY_ATTRS.map((a) => {
        const m = atributos.mods?.[a.key] ?? 0;
        return (
          <span key={a.key} className="afty-stat" title={a.label}>
            <span className="afty-stat-rotulo">{a.abbr}</span>
            <span className="afty-stat-valor">{valores[a.key]}</span>
            <NumeroComFontes
              valor={m}
              total={sinalDe(m)}
              className="afty-valor text-[11px]"
              ancora="direita"
              onRolar={() => rolar({ tipo: "teste", rotulo: `${nomeDono} · ${a.label}`, bonus: m })}
            />
          </span>
        );
      })}
    </div>
  );
}

/**
 * Uma AÇÃO da Invocação.
 *
 * ⚠ O dano vem ESTRUTURADO em `dano.grupos`, e a aba não lê a notação. Ele é uma
 * LISTA porque a escada de dano do Afty tem degraus de dois dados diferentes
 * ("2d12 + 1d6"), e o parser ingênuo que eu tinha escrito antes lia aquilo como
 * três dados de face inválida. Ver `dadosDaNotacao`.
 */
function Acao({ a, nomeDono, margemCritico = 20, rolar }) {
  /* ⚠ O dado extra da Melhoria Agressividade entra NA MESMA ROLAGEM. Ele é
     "dano adicional" em todo ataque da invocação, sem tipo próprio, então
     mostrá-lo numa linha separada e rolar só o dado da tabela entregaria menos
     dano do que a ficha promete. */
  const grupos = [...(a.dano?.grupos ?? []), ...(a.danoExtraAtaque?.grupos ?? [])];
  const rotulo = `${nomeDono} · ${a.nome || "Ação"}`;
  const chip = "afty-rotulo text-[10px] whitespace-nowrap";

  return (
    <div className="afty-linha px-2.5 py-1.5 space-y-1">
      {/* Linha 1: identidade e custo. A CLASSE importa na mesa, porque é ela que
          diz qual comando o dono gasta (Comum para Complexa, Bônus para Simples). */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex-1 min-w-0 text-[12px] font-semibold truncate" title={a.descricao || a.nome}>
          {a.nome || "Ação Sem Nome"}
        </span>
        {a.warnings?.length > 0 && (
          <AlertTriangle
            className="w-3.5 h-3.5 flex-shrink-0"
            style={{ color: "var(--afty-aviso)" }}
            aria-hidden="true"
            title={a.warnings.join("\n")}
          />
        )}
        <span className={chip}>{a.classe === "complexa" ? "Complexa" : "Simples"}</span>
        {a.familia === "auxilio" && a.auxilioSub && (
          <span className={chip}>{AUXILIO_ROTULO[a.auxilioSub] ?? a.auxilioSub}</span>
        )}
        {a.custoPE > 0 && (
          <span className="afty-valor text-[11px]" data-afty-tom="custo">{a.custoPE} PE</span>
        )}
      </div>

      {/* Linha 2: os números da mesa. Tudo que rola é clicável. */}
      <div className="flex items-center gap-2 flex-wrap">
        {a.alcance && <span className={chip}>{a.alcance}</span>}
        {a.area && <span className={chip}>Área {a.area}</span>}
        {a.familia === "auxilio" && a.alvoAuxilio && (
          <span className={chip}>{ALVO_AUXILIO_ROTULO[a.alvoAuxilio] ?? a.alvoAuxilio}</span>
        )}
        {a.tipoDano && <span className={chip}>{a.tipoDano}</span>}
        {(a.condicoes ?? []).map((c, i) => (
          <span key={i} className="afty-chip" data-afty-tom="destaque">
            {CONDICAO_ROTULO[c] ?? c}
          </span>
        ))}
        {a.prejuizoMultiplos && (
          <span className={chip} title={a.prejuizoMultiplos}>Prejuízo por Repetição</span>
        )}

        {/* Ataque por Jogada: o acerto rola. */}
        {a.familia === "ataque" && a.bonusAtaque != null && (
          <span className={chip}>
            Acerto{" "}
            <NumeroComFontes
              valor={a.bonusAtaque}
              total={sinalDe(a.bonusAtaque)}
              className="afty-valor text-[11px]"
              ancora="direita"
              /* Crítico Aprimorado (Controlador 10°) desce a margem das jogadas
                 dela para 19, e a rolagem precisa saber disso para marcar o
                 acerto crítico. */
              onRolar={() => rolar({ tipo: "teste", rotulo, bonus: a.bonusAtaque, margem: margemCritico })}
            />
          </span>
        )}

        {/* Ataque por Teste de Resistência: quem rola é o alvo, então a CD é um
            número de leitura e não um botão. Sem ela a ação é inutilizável. */}
        {a.familia === "ataque" && a.cd != null && (
          <span className="afty-valor text-[11px]" data-afty-tom="destaque" title="O alvo rola contra esta CD">
            CD {a.cd}{a.trTipoLabel ? ` ${a.trTipoLabel}` : ""}
          </span>
        )}

        {grupos.length > 0 && (
          <NumeroComFontes
            valor={`${notacaoDe(grupos)}${a.dano.bonus ? sinalDe(a.dano.bonus) : ""}`}
            formatar={false}
            className="afty-valor text-[13px] whitespace-nowrap"
            ancora="direita"
            titulo="Dano"
            onRolar={() => rolar({ tipo: "dano", rotulo, grupos, fixo: a.dano.bonus ?? 0 })}
          />
        )}

        {(a.cura?.grupos ?? []).length > 0 && (
          <NumeroComFontes
            valor={`${notacaoDe(a.cura.grupos)}${a.cura.bonus ? sinalDe(a.cura.bonus) : ""}`}
            formatar={false}
            className="afty-valor text-[13px] whitespace-nowrap"
            ancora="direita"
            titulo="Cura"
            onRolar={() => rolar({
              tipo: "dano", tom: "cura", rotulo,
              grupos: a.cura.grupos, fixo: a.cura.bonus ?? 0,
            })}
          />
        )}

        {(a.danoAdicional?.grupos ?? []).length > 0 && (
          <NumeroComFontes
            valor={notacaoDe(a.danoAdicional.grupos)}
            formatar={false}
            className="afty-valor text-[13px] whitespace-nowrap"
            ancora="direita"
            titulo="Dano Adicional"
            onRolar={() => rolar({ tipo: "dano", rotulo, grupos: a.danoAdicional.grupos })}
          />
        )}

        {/* Auxílio de valor fixo (Defesa, Acerto, RD): número, não rolagem. */}
        {a.familia === "auxilio" && a.valor != null && (
          <span className="afty-valor text-[13px]" data-afty-tom="destaque">
            {a.auxilioSub === "rd" ? `${a.valor} RD` : sinalDe(a.valor)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================ */
/* A FICHA DE UM SHIKIGAMI                                       */
/* ============================================================ */
/**
 * ⚠ ELA TEM `id` PRÓPRIO (`afty-inv-<id>`), e não é decoração: é a âncora do
 * CSS personalizado daquele Shikigami. Ver `escopoDaInvocacao`.
 */
function FichaDoShikigami({ inv, estado, rolar, acoes, aoTemar }) {
  const nome = inv.nome || "Invocação";
  const testes = inv.testes ?? {};
  const pvAtual = estado.pvAtual ?? inv.pv;
  const almaAtual = estado.almaAtual ?? inv.almaMax;
  const pvTemp = Object.values(estado.pvTempFontes || {}).reduce((s, v) => s + (v || 0), 0);

  return (
    <section
      className="afty-card afty-inv-ficha"
      id={escopoDaInvocacao(inv.id).slice(1)}
      data-afty-campo={inv.emCampo ? "sim" : "nao"}
    >
      {/* ---------- a cabeça ----------
          ⚠ ERA UM BANNER de largura inteira até 2026-08-31, e o autor cortou:
          *"as imagens dos Shikigamis ficaram super esticadas ao invés de serem
          um Icon"*. Retrato de shikigami é quase sempre quadrado ou em pé, e a
          faixa recortava uma tira do meio dele. Ícone ao lado do nome mostra a
          imagem inteira e devolve 6rem de altura para a ficha. */}
      <header className="afty-inv-cabeca">
        <Retrato inv={inv} className="afty-inv-retrato-icone" />
        <div className="afty-inv-cabeca-texto">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="afty-inv-titulo flex-1 min-w-0 truncate">{nome}</h2>
            {/* ⚠ SEM GANCHO, SEM BOTÃO. No painel de Encontros o combatente
                guarda uma CÓPIA congelada da ficha, e o editor de aparência
                grava na criatura: um botão ali seria um clique que não faz
                nada. */}
            {aoTemar && (
              <button
                type="button"
                className="afty-passo"
                onClick={aoTemar}
                title={`Aparência de ${nome}`}
                aria-label={`Aparência de ${nome}`}
              >
                <Palette className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 flex-wrap mt-1">
            <span className="afty-chip" data-afty-tom="destaque">{inv.grauLabel}</span>
            {inv.tipoLabel && (
              <span className="afty-chip" title={`Intermediário: ${inv.intermediario}. Retirada: ${inv.retirada}`}>
                {inv.tipoLabel}
              </span>
            )}
            <span className="afty-valor text-[11px]" data-afty-tom="custo" title="Custo em PE para invocar">
              {inv.custo} PE
            </span>
            {/* ⚠ SÓ A EXORCIZADA VIRA MARCA. A "Abatida" existia ao lado dela
                e o autor cortou em 2026-08-31: *"o símbolo de Abatido da ficha
                não sai quando o shikigami é reinvocado ou curado, e não é
                necessário"*. Ele está certo nas duas metades. Não sair É a
                regra (*"até que seja feito um descanso curto ou longo"*, e nem
                curar nem reinvocar são descanso), e uma marca de aviso que fica
                acesa a luta inteira deixa de ser aviso e vira ruído.

                A REGRA CONTINUA VALENDO, e quem a carrega agora é o `title` do
                botão de invocar, que já dizia "com metade da vida". Ali ela
                aparece no momento em que importa, que é o do clique, em vez de
                ficar pendurada no alto da ficha o tempo todo. */}
            {estado.exorcizada && (
              <span className="afty-chip" data-afty-tom="aviso" title="Recebeu dano excedente superior ao máximo de vida. Perdida permanentemente.">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                {inv.retirada === "destruída" ? "Destruída" : "Exorcizada"}
              </span>
            )}
            {/* Por que ESTE shikigami é diferente dos outros: o Feitiço que o
                criou e os marcadores ligados nele. */}
            {inv.shikigami && (
              <span className="afty-chip" title="Feitiço de Criação de Shikigamis que a criou">
                {inv.shikigami.fonte}
              </span>
            )}
            {(inv.marcadores ?? []).map((m) => (
              <span
                key={m.id}
                className="afty-chip"
                data-afty-tom={m.faltaOpcao ? "aviso" : "destaque"}
                title={m.faltaOpcao ? "Falta escolher a opção deste marcador" : undefined}
              >
                {m.faltaOpcao && <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
                {m.label}{m.opcao ? ` · ${m.opcao}` : ""}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="afty-inv-corpo">
        {/* ---------- vitais ---------- */}
        {/* ⚠ AS DUAS BARRAS SÃO O PEDIDO, palavra por palavra: "mexer nas suas
            barras de HP, Integridade". A Integridade da invocação tem máximo
            IGUAL AO PV (autor, 2026-08-31), que é a régua do livro do jogador. */}
        <div className="grid gap-2 sm:grid-cols-2">
          <Vital
            tipo="pv"
            icone={Heart}
            rotulo="Vida"
            atual={pvAtual}
            max={inv.pv}
            temp={pvTemp}
            onSet={(v) => acoes.vital(inv.id, "pv", v)}
            onDelta={(v) => (v < 0
              ? acoes.dano(inv.id, -v, inv.pv)
              : acoes.cura(inv.id, v, inv.pv))}
          />
          <Vital
            tipo="alma"
            icone={Sparkles}
            rotulo="Integridade"
            atual={almaAtual}
            max={inv.almaMax}
            onSet={(v) => acoes.vital(inv.id, "alma", v)}
            onDelta={(v) => acoes.vital(inv.id, "alma", almaAtual + v)}
          />
        </div>

        {/* ---------- stats ---------- */}
        <div className="afty-inv-stats">
          <span className="afty-stat" title="Defesa">
            <span className="afty-stat-rotulo">
              <Shield className="w-3 h-3 inline-block align-[-2px]" aria-hidden="true" /> Defesa
            </span>
            <span className="afty-stat-valor">{inv.defesa}</span>
          </span>
          <span className="afty-stat" title="Deslocamento">
            <span className="afty-stat-rotulo">
              <Wind className="w-3 h-3 inline-block align-[-2px]" aria-hidden="true" /> Desloc.
            </span>
            <span className="afty-stat-valor">{inv.deslocamento}m</span>
          </span>
          <span className="afty-stat" title="CD das habilidades dela">
            <span className="afty-stat-rotulo">CD</span>
            <span className="afty-stat-valor">{testes.cd}</span>
          </span>
          <span className="afty-stat" title="Redução de Dano contra todos os tipos">
            <span className="afty-stat-rotulo">RD</span>
            <span className="afty-stat-valor">{inv.rd?.geral ?? 0}</span>
          </span>
        </div>

        {/* Corpo: as RDs por tipo, o tamanho, as habilidades de uso e os traços. */}
        <div className="flex flex-wrap gap-1">
          {(inv.rd?.porTipo ?? []).map((l) => (
            <span key={l.chave} className="afty-chip" title="Redução de Dano contra este tipo">
              RD {l.label} {l.total}
            </span>
          ))}
          {inv.tamanhoLabel && <span className="afty-chip" title="Tamanho">{inv.tamanhoLabel}</span>}
          {(inv.opcoesDeUso ?? []).map((o) => (
            <span key={o.id} className="afty-chip" title={o.nome}>{o.nome} {o.valor}</span>
          ))}
          {inv.margemCritico < 20 && (
            <span className="afty-chip" title="Margem de acerto crítico das jogadas dela">
              Crítico {inv.margemCritico}+
            </span>
          )}
          {inv.criticoBrutal && <span className="afty-chip" title="Crítico Brutal">Crítico +1 dado</span>}
          {/* Regras do Shikigami de Técnica que não têm canal: turno próprio,
              retorno com vida cheia na primeira dissipação, desvantagem alheia e
              imunidade ao Prejuízo por Repetição. O texto vai no `title`. */}
          {(inv.tracos ?? []).map((t) => (
            <span key={t.id} className="afty-chip" data-afty-tom="destaque" title={t.regra}>{t.nome}</span>
          ))}
        </div>

        {inv.warnings?.length > 0 && (
          <ul className="space-y-0.5">
            {inv.warnings.map((w, i) => (
              <li key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: "var(--afty-aviso)" }}>
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" aria-hidden="true" /> {w}
              </li>
            ))}
          </ul>
        )}

        <Bonus inv={inv} aoAlternar={(acaoId, ligado) => acoes.auxilio(inv.id, acaoId, ligado)} />

        <section className="afty-inv-bloco">
          <h3 className="afty-card-titulo mb-1.5">Atributos</h3>
          <Atributos atributos={inv.atributos} nomeDono={nome} rolar={rolar} />
        </section>

        {/* Jogada de Ataque da criatura, fora de qualquer Ação. É o número de um
            ataque improvisado, e é o único lugar onde o bônus de Característica
            em Ataque (que exige gatilho) aparece. */}
        {testes.acerto && (
          <section className="afty-inv-bloco">
            <h3 className="afty-card-titulo mb-1.5">Ataque</h3>
            <div className="grid gap-1 sm:grid-cols-2">
              {[["corpo", "Corpo a Corpo"], ["distancia", "À Distância"]].map(([k, label]) => {
                const t = testes.acerto[k];
                return t ? (
                  <LinhaDeTeste
                    key={k}
                    nome={label}
                    bonus={t.bonus}
                    comGatilho={t.comGatilho}
                    treinado={t.treinado}
                    rotulo={`${nome} · ${label}`}
                    rolar={rolar}
                  />
                ) : null;
              })}
            </div>
          </section>
        )}

        {(testes.resistencias ?? []).length > 0 && (
          <section className="afty-inv-bloco">
            <h3 className="afty-card-titulo mb-1.5">Testes de Resistência</h3>
            <div className="grid gap-1 sm:grid-cols-2">
              {testes.resistencias.map((r) => (
                <LinhaDeTeste
                  key={r.value}
                  nome={r.label}
                  bonus={r.bonus}
                  comGatilho={r.comGatilho}
                  mestre={r.mestre}
                  treinado={r.treinado}
                  rotulo={`${nome} · ${r.label}`}
                  rolar={rolar}
                />
              ))}
            </div>
          </section>
        )}

        {(testes.pericias ?? []).length > 0 && (
          <section className="afty-inv-bloco">
            <h3 className="afty-card-titulo mb-1.5">Perícias</h3>
            <div className="grid gap-1 sm:grid-cols-2">
              {testes.pericias.map((p) => (
                <LinhaDeTeste
                  key={p.id}
                  nome={p.nome}
                  bonus={p.bonus}
                  mestre={p.mestre}
                  treinado={p.treinado}
                  rotulo={`${nome} · ${p.nome}`}
                  rolar={rolar}
                />
              ))}
            </div>
          </section>
        )}

        {(inv.acoes ?? []).length > 0 && (
          <section className="afty-inv-bloco">
            <h3 className="afty-card-titulo mb-1.5">Ações</h3>
            <div className="space-y-1">
              {inv.acoes.map((a, i) => (
                <Acao
                  key={a.id || `${a.nome}-${i}`}
                  a={a}
                  nomeDono={nome}
                  margemCritico={inv.margemCritico ?? 20}
                  rolar={rolar}
                />
              ))}
            </div>
          </section>
        )}

        {(inv.caracteristicas ?? []).length > 0 && (
          <section className="afty-inv-bloco">
            <h3 className="afty-card-titulo mb-1.5">Características</h3>
            <div className="space-y-1">
              {inv.caracteristicas.map((c, i) => (
                <div key={`${c.nome}-${i}`} className="afty-linha px-2.5 py-1 flex items-center gap-2 flex-wrap">
                  <span className="flex-1 min-w-0 text-[12px] truncate" title={c.descricao || undefined}>
                    {c.nome || "Característica"}
                  </span>
                  {c.requerGatilho && (
                    <span className="afty-rotulo text-[10px]" title="Exige um gatilho específico">Gatilho</span>
                  )}
                  {resumoCaracteristica(c) && (
                    <span className="afty-valor text-[12px] whitespace-nowrap">{resumoCaracteristica(c)}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}

/* ============================================================ */
/* HORDAS                                                        */
/* ============================================================ */
/**
 * Uma HORDA. Em combate ela é uma criatura só, e por isso tem PV, tamanho e as
 * ações do líder JÁ ESCALADAS pelo número de membros.
 */
function Horda({ h, rolar }) {
  const rotulo = h.nome || "Horda";
  return (
    <div className="afty-linha px-2.5 py-1.5 space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">{rotulo}</span>
        {h.warnings?.length > 0 && (
          <AlertTriangle
            className="w-3.5 h-3.5 flex-shrink-0"
            style={{ color: "var(--afty-aviso)" }}
            aria-hidden="true"
            title={h.warnings.join("\n")}
          />
        )}
        {/* `membros` é a lista de ids, e imprimi-la saía como "M1,M2 Membros".
            O número é o `membrosCount`. */}
        {h.membrosCount != null && (
          <span className="afty-rotulo text-[10px] whitespace-nowrap">{h.membrosCount} Membros</span>
        )}
        {h.custo != null && (
          <span className="afty-valor text-[11px]" data-afty-tom="custo">{h.custo} PE</span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {h.pv != null && <span className="afty-chip" title="Pontos de Vida da horda">PV {h.pv}</span>}
        {h.deslocamento != null && <span className="afty-chip" title="Deslocamento">{h.deslocamento}m</span>}
        {h.tamanhoLabel && <span className="afty-chip" title="Tamanho">{h.tamanhoLabel}</span>}
        {h.escala?.prejuizoExtra > 0 && (
          <span className="afty-chip" title="Usos adicionais antes do prejuízo por repetição">
            +{h.escala.prejuizoExtra} uso antes do prejuízo
          </span>
        )}
      </div>

      {/* As ações do LÍDER, com o escalonamento da horda já aplicado. */}
      {(h.acoes ?? []).map((a, i) => {
        /* O dado extra da Melhoria Agressividade entra aqui também: o
           escalonamento da horda mexe no dado da TABELA, e o extra continua
           somando por fora. Ler só o `danoGrupos` deixaria a horda batendo mais
           fraco que a mesma invocação sozinha. */
        const grupos = [
          ...(a.horda?.danoGrupos ?? a.base?.dano?.grupos ?? []),
          ...(a.base?.danoExtraAtaque?.grupos ?? []),
        ];
        const curaGrupos = a.horda?.curaGrupos ?? a.base?.cura?.grupos ?? [];
        const valor = a.horda?.valor ?? a.base?.valor;
        return (
          <div key={`${a.nome}-${i}`} className="flex items-center gap-2 flex-wrap pl-2">
            <span className="flex-1 min-w-0 text-[11px] truncate" title={a.nome}>{a.nome || "Ação"}</span>
            {grupos.length > 0 && (
              <NumeroComFontes
                valor={`${notacaoDe(grupos)}${a.base?.dano?.bonus ? sinalDe(a.base.dano.bonus) : ""}`}
                formatar={false}
                className="afty-valor text-[12px] whitespace-nowrap"
                ancora="direita"
                titulo="Dano da horda"
                onRolar={() => rolar({
                  tipo: "dano", rotulo: `${rotulo} · ${a.nome || "Dano"}`,
                  grupos, fixo: a.base?.dano?.bonus ?? 0,
                })}
              />
            )}
            {curaGrupos.length > 0 && (
              <NumeroComFontes
                valor={`${notacaoDe(curaGrupos)}${a.base?.cura?.bonus ? sinalDe(a.base.cura.bonus) : ""}`}
                formatar={false}
                className="afty-valor text-[12px] whitespace-nowrap"
                ancora="direita"
                titulo="Cura da horda"
                onRolar={() => rolar({
                  tipo: "dano", tom: "cura", rotulo: `${rotulo} · ${a.nome || "Cura"}`,
                  grupos: curaGrupos, fixo: a.base?.cura?.bonus ?? 0,
                })}
              />
            )}
            {grupos.length === 0 && curaGrupos.length === 0 && valor != null && (
              <span className="afty-valor text-[12px]">
                {a.auxilioSub === "rd" ? `${valor} RD` : sinalDe(valor)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================ */
/* A ABA                                                         */
/* ============================================================ */

export default function AbaInvocacoes({ derived, rolar, destaque, estadoDe, acoes, aoTemar, temaEmEdicao }) {
  const invocacoes = derived.invocacoes?.lista ?? [];
  const hordas = derived.hordas?.lista ?? [];
  const marcadores = derived.invocacoes?.marcadores ?? [];
  const controle = derived.invocacoes?.controle;

  /* ⚠ O ALVO DA BUSCA GLOBAL SELECIONA. Sem isto, ir a um Shikigami pela busca
     abria a aba certa e mostrava OUTRO shikigami, porque o selecionado é estado
     desta aba e a busca não o conhecia. */
  const alvoDaBusca = destaque?.startsWith("invocacao:") ? destaque.slice("invocacao:".length) : null;

  /* ⚠ O CLIQUE GRAVA QUAL BUSCA ELE JÁ VIU, e é o que faz as duas fontes de
     seleção conviverem sem um efeito que chama `setState` (o eslint reprova, e
     com razão: seria uma renderização em cascata para chegar num valor que dá
     para calcular de primeira). Uma busca NOVA vence o último clique, e um
     clique vence a busca que ele já tinha visto. */
  const [escolha, setEscolha] = useState({ id: null, buscaVista: null });
  const selecionar = (id) => setEscolha({ id, buscaVista: alvoDaBusca });

  /* O selecionado, com o cuidado de sobreviver a uma invocação removida no
     criador com a Ficha aberta: id que não existe mais cai no primeiro. */
  const buscaNova = alvoDaBusca && alvoDaBusca !== escolha.buscaVista
    ? invocacoes.find((i) => i.id === alvoDaBusca)
    : null;
  const selecionado = buscaNova
    ?? invocacoes.find((i) => i.id === escolha.id)
    ?? invocacoes[0]
    ?? null;
  const raiz = useDestaque(!!alvoDaBusca && selecionado?.id === alvoDaBusca);

  /* O CSS personalizado de CADA Shikigami, num bloco só. Fica na aba, e não
     dentro de cada ficha, porque só o selecionado é montado: com o `<style>`
     dentro dele, trocar de Shikigami removeria e recriaria a folha a cada
     clique. Ver `cssDaInvocacao`. */
  /* ⚠ O SHIKIGAMI EM EDIÇÃO PINTA PELO RASCUNHO, e não pelo que está gravado.
     A gravação tem debounce de 600ms (ver `rascunhoInv` na AftyFicha), e sem
     esta linha o CSS só apareceria 600ms depois de cada tecla, que é justamente
     a sensação que o debounce existe para evitar. */
  const cssDosShikigamis = invocacoes
    .map((inv) => (temaEmEdicao?.id === inv.id
      ? cssDaInvocacao({ ...inv, aparencia: temaEmEdicao.tema })
      : cssDaInvocacao(inv)))
    .filter(Boolean)
    .join("\n");

  const emCampo = invocacoes.filter((i) => i.emCampo).length;

  if (!invocacoes.length && !hordas.length) {
    return (
      <section className="afty-card p-3">
        <p className="afty-vazio">Nenhuma Invocação</p>
      </section>
    );
  }

  return (
    <div className="space-y-3" ref={raiz}>
      {cssDosShikigamis && <style>{cssDosShikigamis}</style>}

      {/* ---------- roster do Controlador ---------- */}
      {/* Números de COMBATE: sem eles a mesa decide de cabeça quantas invocações
          pode manter. O "Em Campo" é o único que conta o que está ligado AGORA,
          e por isso ele fica em primeiro e fica vermelho ao estourar. */}
      {(controle?.ativo || marcadores.length > 0) && (
        <section className="afty-card p-3 flex items-center gap-1.5 flex-wrap">
          {controle?.ativo && (
            <>
              <span
                className="afty-chip"
                data-afty-tom={emCampo > controle.limiteCampo ? "aviso" : "destaque"}
                title="Invocações em campo agora, e o limite"
              >
                {emCampo > controle.limiteCampo && (
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                )}
                Em Campo {emCampo} / {controle.limiteCampo}
              </span>
              <span className="afty-chip" title="Invocações que a ação Invocar traz">
                Por Invocar {controle.invocarPorAcao}
              </span>
              <span className="afty-chip" title="Comandos por Ação Comum e por Ação Bônus">
                Comandos {controle.comandos}
              </span>
              {controle.criarHorda && (
                <span className="afty-chip" title="Hordas que você pode manter em campo">
                  Hordas {controle.limiteHordas}
                </span>
              )}
              {controle.invocarAcaoLivre && (
                <span className="afty-chip" data-afty-tom="destaque">Invocar como Ação Livre</span>
              )}
            </>
          )}
          {marcadores.map((m) => (
            <span
              key={m.id}
              className="afty-chip"
              data-afty-tom={m.excedeu ? "aviso" : undefined}
              title="Invocações marcadas contra o limite"
            >
              {m.excedeu && <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
              {m.label} {m.marcadas} / {m.limite}
            </span>
          ))}
        </section>
      )}

      {/* ---------- a fileira ---------- */}
      {invocacoes.length > 0 && (
        <div className="afty-inv-fileira">
          {invocacoes.map((inv) => (
            <CartaoDoRoster
              key={inv.id}
              inv={inv}
              estado={estadoDe(inv.id)}
              selecionado={selecionado?.id === inv.id}
              aoSelecionar={() => selecionar(inv.id)}
              aoEmCampo={() => acoes.emCampo(inv.id, !inv.emCampo)}
            />
          ))}
        </div>
      )}

      {/* ---------- a ficha do selecionado ---------- */}
      {selecionado && (
        <FichaDoShikigami
          key={selecionado.id}
          inv={selecionado}
          estado={estadoDe(selecionado.id)}
          rolar={rolar}
          acoes={acoes}
          aoTemar={aoTemar ? () => aoTemar(selecionado.id) : null}
        />
      )}

      {hordas.length > 0 && (
        <section className="afty-card p-3">
          <h2 className="afty-card-titulo mb-2">Hordas</h2>
          <div className="space-y-2">
            {hordas.map((h) => <Horda key={h.id} h={h} rolar={rolar} />)}
          </div>
        </section>
      )}
    </div>
  );
}
