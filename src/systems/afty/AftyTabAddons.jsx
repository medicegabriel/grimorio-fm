/**
 * ============================================================
 * ADDONS — biblioteca e o que esta criatura usa
 * ============================================================
 * Em 2026-09-13, Addons passou a ser uma opção própria dentro de Outros no
 * criador dos dois sistemas. O conteúdo e o export deste componente continuam
 * os mesmos.
 * ============================================================
 * A fase 1 dos Addons (`docs/afty-addons.md`): **acrescentar por JSON colado**,
 * sem tela de autoria. A Oficina, que é a tela para quem NÃO escreve JSON, é a
 * fase 2 e está condicionada a aparecer alguém que precise dela.
 *
 * ⚠ ARQUIVO PRÓPRIO, e não uma seção do AftyCreatureBuilder.jsx. Aquele
 * arquivo tem 12 mil linhas e o Babel já avisa que passou dos 500KB ao
 * processá-lo. As outras abas nasceram lá dentro, e esta não segue o exemplo de
 * propósito.
 *
 * ------------------------------------------------------------
 * AS DUAS MORADAS, NA TELA
 * ------------------------------------------------------------
 * O card de cima é a BIBLIOTECA (global, `fm_addons_afty_v1`): o que a pessoa
 * instalou na máquina dela. O de baixo é O QUE ESTA CRIATURA USA
 * (`creature.addons`), que é CÓPIA congelada e viaja no export da ficha.
 *
 * Ligar um addon nesta criatura COPIA o pacote da biblioteca para dentro dela.
 * Por isso a ficha continua funcionando na mão de quem não tem o addon, e por
 * isso o addon mudar depois não mexe sozinho no que já foi jogado: aparece o
 * aviso de versão nova, e atualizar é um clique.
 *
 * ⚠ Regras de UI do autor valendo aqui: nada de texto explicativo, só resultado
 * e AVISO. Aviso usa `<AlertTriangle/>`, nunca o caractere. Explicação de item
 * vai no `title`.
 * ============================================================
 */

import { useState } from "react";
import { AlertTriangle, Trash2, RefreshCw, Download, Copy, Check, Lock } from "lucide-react";
import { Card } from "./ui/primitivos";
import PainelDoCofre from "./ui/PainelDoCofre";
import { cofreTrancado, destrancarDeVez } from "./afty-cofre";
import {
  lerBiblioteca, instalarDeTexto, instalarPacote, removerPacote, compararComBiblioteca,
} from "./afty-addons-biblioteca";
import { familiasDeAddon, incompativeisCom, problemasDaAplicacao, LIBERACOES, PRIMITIVAS } from "./afty-addons";
import ListaLateral from "./ui/ListaLateral";
import {
  CATEGORIAS_DE_ADDON, FILTROS_DE_ADDON, montarItens, textoDeBuscaDoAddon, oQueMuda, blocosDaDescricao, recortaBlocos,
} from "./afty-addons-lista";
import { sistemaDaFicha, palavrasDoSistema } from "./afty-sistema";
import {
  EMBUTIDOS, fonteEmbutida, ajustesDoSistema, ajustesEfetivos, ligarEmbutido, desligarEmbutido, definirAjuste,
  avisosDosEmbutidos, compor,
} from "./afty-addons-compostos";

function Aviso({ children }) {
  return (
    <p className="text-[11px] text-amber-400 flex items-start gap-1">
      <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-px" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

function Chip({ children, tom = "slate" }) {
  const cor = tom === "amber"
    ? "border-amber-700 bg-amber-950/40 text-amber-300"
    : "border-slate-700 bg-slate-950 text-slate-400";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${cor} whitespace-nowrap`}>
      {children}
    </span>
  );
}

function CampoTalentosIniciais({ valor, onChange }) {
  const [digitado, setDigitado] = useState(null);
  const confirmar = () => {
    const numero = digitado === null || digitado.trim() === "" ? valor : Number(digitado);
    const quantidade = Number.isInteger(numero) ? Math.min(4, Math.max(1, numero)) : valor;
    onChange(quantidade);
    setDigitado(null);
  };
  return (
    <label className="flex items-center gap-2 px-2 pb-1 text-xs text-slate-400">
      Talentos
      <input
        type="number" min={1} max={4} step={1}
        aria-label="Quantidade de Talentos Iniciais"
        title="De 1 a 4 Talentos adicionais para esta ficha"
        className="afty-campo afty-linha w-16 px-2 py-1 tabular-nums"
        value={digitado ?? valor}
        onChange={(e) => {
          const texto = e.target.value;
          setDigitado(texto);
          const numero = Number(texto);
          if (texto !== "" && Number.isInteger(numero) && numero >= 1 && numero <= 4) onChange(numero);
        }}
        onBlur={confirmar}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }}
      />
    </label>
  );
}

/* A linha da lista: só o nome, a versão e as duas marcas que pedem atenção (ligado nesta
   ficha e aviso). A descrição NÃO entra aqui (autor, 2026-10-29): ela pesava demais com
   dezenas de pacotes, e fica no painel de detalhe, que abre ao clicar. */
function LinhaDoAddon({ item }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 flex items-center justify-center ${
          item.ligado ? "bg-purple-600 border-purple-500" : "border-slate-600"}`}
        aria-hidden="true"
      >
        {item.ligado && <Check className="w-2.5 h-2.5 text-white" />}
      </span>
      <span className="text-[12px] text-slate-100 truncate min-w-0">{item.nome}</span>
      {item.avisos.length > 0 && (
        <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" aria-label="Com Aviso" />
      )}
      <span className="ml-auto font-mono text-[9px] tabular-nums text-slate-500 flex-shrink-0">{item.versao}</span>
    </span>
  );
}

/* Uma seção do painel: o rótulo pequeno em cima e uma linha fina separando da anterior. */
function SecaoDoPainel({ titulo, children }) {
  return (
    <section className="space-y-1.5 border-t border-slate-800/80 pt-3">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 m-0!">{titulo}</h4>
      {children}
    </section>
  );
}

/* Os blocos da descrição: parágrafo curto por vez e, onde o autor fez lista com "-", lista de verdade. */
function BlocosDeTexto({ blocos }) {
  const nos = [];
  let itens = [];
  const fecha = () => {
    if (!itens.length) return;
    nos.push(
      <ul key={`l${nos.length}`} className="list-disc pl-4 space-y-1 m-0!">
        {itens.map((x, i) => <li key={i} className="text-[12px] leading-relaxed text-slate-300">{x}</li>)}
      </ul>,
    );
    itens = [];
  };
  blocos.forEach((b, i) => {
    if (b.tipo === "item") { itens.push(b.texto); return; }
    fecha();
    nos.push(<p key={`p${i}`} className="text-[12px] leading-relaxed text-slate-300 m-0!">{b.texto}</p>);
  });
  fecha();
  return nos;
}

/* O painel do pacote escolhido: o interruptor, os ajustes, o resumo, a descrição e
   o que ele muda. As ações de biblioteca ficam no fim, porque se usam bem menos que
   ligar e desligar. */
function DetalheDoAddon({
  item, pal, secoes, controles, onAlternar, onAtualizar, onGuardar, onCopiar, onRemover, copiado,
}) {
  const [aberta, setAberta] = useState(false);
  const categoria = CATEGORIAS_DE_ADDON.find((c) => c.value === item.tipo)?.label ?? "Outros";
  /* Com resumo declarado, ele abre o painel e a primeira frase da descrição que só o repete
     sai. Sem resumo declarado a primeira frase da descrição É o resumo, então não há abertura:
     mostrá-lo duas vezes era o defeito que o autor apontou. */
  const blocos = blocosDaDescricao(item.pacote.descricao, { resumo: item.resumoDeclarado ? item.resumo : "" });
  const { visiveis, resto } = recortaBlocos(blocos);
  const bloqueado = !item.ligado && item.barrado.length > 0;
  return (
    <div className="space-y-4 leading-tight">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h3 className="text-sm font-semibold text-slate-100 m-0!">{item.nome}</h3>
        <span className="font-mono text-[10px] tabular-nums text-slate-500">{item.versao}</span>
        <span className="text-[11px] text-slate-500">{categoria}{item.autor ? ` · ${item.autor}` : ""}</span>
        <span className="ml-auto flex items-center gap-1">
          {item.embutido && <Chip>Atualiza Sozinho</Chip>}
          {item.foraDaBiblioteca && <Chip tom="amber">Fora da Biblioteca</Chip>}
        </span>
      </div>

      <button
        type="button"
        onClick={onAlternar}
        disabled={bloqueado}
        aria-pressed={item.ligado}
        className={`w-full flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors ${
          item.ligado
            ? "border-purple-500 bg-purple-950/40 text-white"
            : bloqueado
              ? "border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed"
              : "border-slate-700 text-slate-300 hover:border-purple-600"}`}
      >
        <span
          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
            item.ligado ? "bg-purple-600 border-purple-500" : "border-slate-600"}`}
          aria-hidden="true"
        >
          {item.ligado && <Check className="w-3 h-3 text-white" />}
        </span>
        {item.ligado ? "Ligado" : "Desligado"} {pal.g("Neste", "Nesta")} {pal.Nome}
      </button>

      {controles}

      {item.avisos.length > 0 && (
        <div className="space-y-1">
          {item.avisos.map((a) => <Aviso key={a}>{a}</Aviso>)}
        </div>
      )}

      {item.resumoDeclarado && <p className="text-[13px] leading-snug text-slate-100 m-0!">{item.resumo}</p>}

      {blocos.length > 0 && (
        <SecaoDoPainel titulo="Descrição">
          <div className="space-y-2.5 max-w-[68ch]">
            <BlocosDeTexto blocos={aberta ? blocos : visiveis} />
          </div>
          {resto && (
            <button
              type="button"
              onClick={() => setAberta((v) => !v)}
              className="text-[11px] text-purple-300 hover:text-purple-200"
            >
              {aberta ? "Ver Menos" : "Ver a Descrição Completa"}
            </button>
          )}
        </SecaoDoPainel>
      )}

      {secoes.map((s) => (
        <SecaoDoPainel key={s.titulo} titulo={s.titulo}>
          <ul className="space-y-1 m-0! p-0! list-none">
            {s.linhas.map((l) => <li key={l} className="text-[12px] leading-snug text-slate-300">{l}</li>)}
          </ul>
        </SecaoDoPainel>
      ))}

      <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-800/80">
        <button type="button" onClick={onCopiar} className="afty-botao px-2 py-1 inline-flex items-center gap-1.5 text-[11px]">
          {copiado ? <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />}
          Copiar JSON
        </button>
        {item.estado === "desatualizado" && !item.copia?.composicao && (
          <button type="button" onClick={onAtualizar} className="afty-botao px-2 py-1 inline-flex items-center gap-1.5 text-[11px]">
            <RefreshCw className="w-3 h-3" aria-hidden="true" />
            Atualizar Pela Biblioteca
          </button>
        )}
        {item.foraDaBiblioteca && (
          <button type="button" onClick={onGuardar} className="afty-botao px-2 py-1 inline-flex items-center gap-1.5 text-[11px]">
            <Download className="w-3 h-3" aria-hidden="true" />
            Guardar na Biblioteca
          </button>
        )}
        {item.naBiblioteca && (
          <button type="button" onClick={onRemover} className="afty-botao px-2 py-1 inline-flex items-center gap-1.5 text-[11px] hover:text-rose-300">
            <Trash2 className="w-3 h-3" aria-hidden="true" />
            Remover da Biblioteca
          </button>
        )}
      </div>
    </div>
  );
}

/* Número inteiro de um ajuste de pacote composto. Confirma ao sair do campo, e
   valor fora da faixa volta ao que estava. */
function CampoInteiro({ rotulo, min, max, valor, onChange }) {
  const [digitado, setDigitado] = useState(null);
  const confirmar = () => {
    const numero = digitado === null || digitado.trim() === "" ? valor : Number(digitado);
    onChange(Number.isInteger(numero) ? Math.min(max, Math.max(min, numero)) : valor);
    setDigitado(null);
  };
  return (
    <label className="flex items-center gap-2 px-2 pb-1 text-xs text-slate-400">
      {rotulo}
      <input
        type="number" min={min} max={max} step={1}
        aria-label={rotulo}
        className="afty-campo afty-linha w-16 px-2 py-1 tabular-nums"
        value={digitado ?? valor}
        onChange={(e) => {
          const texto = e.target.value;
          setDigitado(texto);
          const numero = Number(texto);
          if (texto !== "" && Number.isInteger(numero) && numero >= min && numero <= max) onChange(numero);
        }}
        onBlur={confirmar}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }}
      />
    </label>
  );
}

/* Os ajustes de um pacote composto que esta ficha mostra, com o valor de hoje. */
function ControlesDoPacoteComposto({ draft, pacote, onAjuste }) {
  const fonte = fonteEmbutida(pacote.composicao?.fonte);
  if (!fonte) return null;
  const sistema = sistemaDaFicha(draft);
  const valores = ajustesEfetivos(fonte, sistema, draft.addonAjustes?.[fonte.id]);
  return ajustesDoSistema(fonte, sistema).map((a) => (a.tipo === "interruptor" ? (
    <label key={a.id} className="flex items-center gap-2 px-2 pb-1 text-xs text-slate-400">
      <input
        type="checkbox"
        checked={valores[a.id] === true}
        onChange={(e) => onAjuste(fonte.id, a.id, e.target.checked)}
      />
      {a.rotulo}
    </label>
  ) : (
    <CampoInteiro
      key={a.id} rotulo={a.rotulo} min={a.min} max={a.max} valor={valores[a.id]}
      onChange={(v) => onAjuste(fonte.id, a.id, v)}
    />
  )));
}

export default function TabAddons({ draft, derived, setAddons, trocarFicha }) {
  const [biblioteca, setBiblioteca] = useState(() => lerBiblioteca());
  const [texto, setTexto] = useState("");
  const [problemas, setProblemas] = useState([]);
  const [colando, setColando] = useState(false);
  // Qual pacote acabou de ser copiado, para o ícone virar um certo por um
  // instante. Sem isso, clicar em copiar não dá retorno nenhum.
  const [copiado, setCopiado] = useState(null);
  /* Qual pacote está esperando a senha para ser desligado, e o que foi digitado.
     Ver `pedirSenhaParaDesligar`, mais abaixo. */
  const [saindo, setSaindo] = useState(null);
  const [senhaSaida, setSenhaSaida] = useState("");
  const [erroSaida, setErroSaida] = useState(null);
  const [escolhido, setEscolhido] = useState(null);

  const naFicha = Array.isArray(draft.addons) ? draft.addons : [];
  // "Nesta Criatura" num lado e "Neste Personagem" no outro: a palavra sai da ficha.
  const pal = palavrasDoSistema(sistemaDaFicha(draft));
  const idsNaFicha = new Set(naFicha.map((p) => p.id));
  const comparacao = compararComBiblioteca(naFicha, biblioteca);
  const estadoDe = Object.fromEntries(comparacao.map((c) => [c.id, c]));

  const instalar = () => {
    const r = instalarDeTexto(texto, { substituir: true });
    setProblemas(r.problemas);
    if (!r.ok) return;
    setBiblioteca(r.biblioteca);
    setTexto("");
    setColando(false);
  };

  const remover = (id) => {
    setBiblioteca(removerPacote(id));
    setProblemas([]);
  };

  // Ligar COPIA o pacote da biblioteca para dentro da criatura. Desligar tira a
  // cópia, e não a biblioteca.
  const ligar = (p) => {
    const outros = naFicha.filter((x) => x.id !== p.id);
    // Só barra quem ENTRA. Atualizar um pacote que já está na ficha passa, e o
    // conflito que a versão nova trouxer vira aviso em Problemas.
    if (!idsNaFicha.has(p.id) && incompativeisCom(p, outros).length > 0) return;
    setAddons([...outros, p]);
  };
  const desligar = (id) => setAddons(naFicha.filter((x) => x.id !== id));

  /* ⚠ DESLIGAR O ADDON DO COFRE PEDE A SENHA (autor, 2026-09-08: *"você precisa
     colocar a senha para poder desativar esse ADDON"*). Sem isto qualquer um
     tira o addon e a proteção some junto.

     ⚠ E desligar DESTRANCA no mesmo ato, de propósito. O addon É a proteção:
     deixar o cofre trancado sem o painel que o abre deixaria o texto preso sem
     porta, e o dono teria de reinstalar o addon para recuperar a própria ficha.
     Quem sabe a senha pode desfazer tudo, e quem não sabe não desfaz nada. */
  const protegido = (p) => (p?.permite ?? []).includes("cofre") && cofreTrancado(draft);

  const pedirSenhaParaDesligar = (p) => {
    if (!protegido(p)) { desligar(p.id); return; }
    setSaindo(p.id);
    setSenhaSaida("");
    setErroSaida(null);
  };

  const confirmarSaida = async () => {
    try {
      const aberta = await destrancarDeVez(draft, senhaSaida);
      trocarFicha?.({ ...aberta, addons: (aberta.addons ?? []).filter((x) => x.id !== saindo) });
      setSaindo(null);
      setSenhaSaida("");
      setErroSaida(null);
    } catch (e) {
      setErroSaida(e?.message || "Não deu certo.");
    }
  };
  const atualizar = (id) => {
    const daBiblioteca = biblioteca.find((p) => p.id === id);
    if (daBiblioteca) ligar(daBiblioteca);
  };

  /* Os pacotes EMBUTIDOS não passam pela biblioteca: a cópia sai do app, já
     filtrada pelo sistema desta ficha e pelos ajustes dela. Ver
     afty-addons-compostos.js. As três operações são puras e devolvem a ficha. */
  const ligarEmbutidoNaFicha = (id) => trocarFicha?.((d) => ligarEmbutido(d, id));
  const desligarEmbutidoDaFicha = (id) => trocarFicha?.((d) => desligarEmbutido(d, id));
  const mudarAjuste = (id, ajusteId, valor) => trocarFicha?.((d) => definirAjuste(d, id, ajusteId, valor));

  /* Guardar na biblioteca um addon que veio DENTRO de uma ficha de fora.
     Sem isto, "só na ficha" é um beco: a pessoa recebe a criatura funcionando,
     vê o nome do addon, e não tem como usá-lo em mais nada. */
  const guardar = (p) => {
    const r = instalarPacote(p, { substituir: true });
    setProblemas(r.problemas);
    if (r.ok) setBiblioteca(r.biblioteca);
  };

  /* O caminho de SAÍDA do addon. Ele entra por texto colado, então sai por
     texto copiado: é o mesmo formato, e é o que permite mandar um addon para
     outra pessoa sem mandar uma criatura junto. */
  const copiar = (p) => {
    try {
      navigator.clipboard.writeText(JSON.stringify(p, null, 2));
      setCopiado(p.id);
      setTimeout(() => setCopiado((atual) => (atual === p.id ? null : atual)), 1500);
    } catch {
      setProblemas(["Não foi possível copiar. O navegador bloqueou o acesso à área de transferência."]);
    }
  };

  // LINHA MORTA: o que a ficha cita e o mundo não tem (decisão 4 do autor).
  // Aparece PRIMEIRO, porque é a única coisa aqui que exige ação.
  const mortas = derived?.addonProblemas ?? [];
  /* O que os validadores reclamaram ao APLICAR os pacotes desta ficha (2026-09-23).
     É o caso do addon que o app não entende: o pacote entra, o item aparece, e sem
     este aviso a pessoa fica sem saber por que nada funciona. O pacote recusado
     leva o id na frente, e o relato de um validador de família já diz o nome da
     entrada. */
  const relatados = problemasDaAplicacao().flatMap((r) => r.problemas
    .map((texto) => (r.pacote.startsWith("(") ? texto : `${r.pacote}: ${texto}`)));
  /* Pacote antigo que o embutido cobre só em parte e que continua ligado: soma por
     cima, e a pessoa precisa saber. Ver `avisosDosEmbutidos`. */
  const parciais = avisosDosEmbutidos(draft);

  /* A lista unificada: embutidos, biblioteca e o que a ficha carrega, cada pacote uma
     vez. O aviso de parcial vai para o item do pacote antigo que ficou ligado. */
  const sistemaDaTela = sistemaDaFicha(draft);
  const avisosDe = {};
  for (const a of parciais) (avisosDe[a.id] ||= []).push(a.texto);
  const itens = montarItens({
    biblioteca, naFicha, embutidos: EMBUTIDOS, estadoDe, avisosDe,
    barradoDe: (pacote) => incompativeisCom(pacote, naFicha).map((o) => o.nome || o.id),
  });
  const item = itens.find((i) => i.id === escolhido)
    ?? itens.find((i) => i.ligado) ?? itens[0] ?? null;
  const ligados = itens.filter((i) => i.ligado).length;
  const rotulos = {
    familia: (id) => familiasDeAddon().find((f) => f.id === id)?.rotulo ?? id,
    liberacao: (id) => LIBERACOES.find((l) => l.id === id)?.rotulo ?? id,
    primitiva: (id) => PRIMITIVAS.find((x) => x.id === id)?.rotulo ?? id,
  };
  /* O que o pacote muda NESTA ficha: a cópia que ela carrega, ou, desligado, a que ela
     receberia. Um pacote composto muda de uma ficha para outra. */
  const pacoteParaExibir = (i) => i.copia ?? (i.embutido ? compor(i.pacote, sistemaDaTela, {}) : i.pacote);

  const alternar = (i) => {
    if (i.ligado) {
      if (i.embutido) desligarEmbutidoDaFicha(i.id);
      else pedirSenhaParaDesligar(i.copia);
    } else if (i.embutido) ligarEmbutidoNaFicha(i.id);
    else ligar(i.pacote);
  };

  /* Os controles que moram dentro do pacote ligado: os ajustes de um composto, e o
     campo de Talentos e a Guarda Alta dos pacotes antigos. */
  const controlesDe = (i) => {
    if (!i.ligado || !i.copia) return null;
    const p = i.copia;
    if (p.composicao) return <ControlesDoPacoteComposto draft={draft} pacote={p} onAjuste={mudarAjuste} />;
    return (
      <>
        {p.regrasAfty?.talentosIniciais != null && (
          <CampoTalentosIniciais
            valor={p.regrasAfty.talentosIniciais}
            onChange={(quantidade) => setAddons(naFicha.map((addon) => addon.id === p.id
              ? { ...addon, regrasAfty: { ...addon.regrasAfty, talentosIniciais: quantidade } }
              : addon))}
          />
        )}
        {typeof p.regrasAfty?.guardaComoCalamidade === "boolean" && (
          <label
            className="flex items-center gap-2 px-2 text-xs text-slate-400"
            title="Guarda Inabalável com os números de uma Calamidade de mesmo ND"
          >
            <input
              type="checkbox"
              checked={p.regrasAfty.guardaComoCalamidade}
              onChange={(e) => setAddons(naFicha.map((addon) => addon.id === p.id
                ? { ...addon, regrasAfty: { ...addon.regrasAfty, guardaComoCalamidade: e.target.checked } }
                : addon))}
            />
            Guarda Alta
          </label>
        )}
      </>
    );
  };

  /* O Cofre aparece para quem instalou um addon que o PEDIU, e some para todo o
     resto. Mesmo portão das outras primitivas, e pela mesma lição escrita no
     topo de `PRIMITIVAS`: acrescentar o verbo ao motor não é a tarefa inteira,
     falta dizer quem enxerga. Aqui a fonte é lida da própria criatura em vez do
     contexto de React, porque esta aba já tem a criatura na mão. */
  const temCofre = naFicha.some((p) => (p?.permite ?? []).includes("cofre"));

  return (
    <div className="space-y-4">
      {temCofre && (
        <Card title="Cofre de Texto">
          <PainelDoCofre creature={draft} modo="criador" onFicha={trocarFicha} />
        </Card>
      )}

      {saindo && (
        <Card title="Senha para desligar">
          <div className="space-y-2">
            <p className="text-[11px] text-slate-400">
              Este addon está trancando o texto desta ficha. Desligar devolve o texto e tira o
              Cofre, então precisa da senha.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="password"
                className="afty-campo afty-linha px-2 py-1.5 flex-1 min-w-[12rem]"
                placeholder="Senha do Cofre"
                value={senhaSaida}
                autoComplete="current-password"
                onChange={(e) => setSenhaSaida(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || senhaSaida.length < 1) return;
                  e.preventDefault();
                  confirmarSaida();
                }}
              />
              <button
                type="button"
                className="afty-botao px-2.5 py-1.5 inline-flex items-center gap-1.5"
                onClick={confirmarSaida}
                disabled={senhaSaida.length < 1}
              >
                <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                Desligar
              </button>
              <button
                type="button"
                className="afty-botao px-2.5 py-1.5"
                onClick={() => { setSaindo(null); setSenhaSaida(""); setErroSaida(null); }}
              >
                Cancelar
              </button>
            </div>
            {erroSaida && <p className="text-[11px] text-rose-300">{erroSaida}</p>}
          </div>
        </Card>
      )}

      {(mortas.length > 0 || relatados.length > 0 || parciais.length > 0) && (
        <Card title="Problemas">
          <div className="space-y-2">
            {mortas.map((m) => (
              <div key={`${m.familia}:${m.id}`} className="space-y-0.5">
                <Aviso>{m.motivo}</Aviso>
                <p className="text-[11px] text-slate-500 pl-4">{m.saida}</p>
              </div>
            ))}
            {relatados.map((texto) => <Aviso key={texto}>{texto}</Aviso>)}
            {parciais.map((a) => <Aviso key={a.id}>{a.texto}</Aviso>)}
          </div>
        </Card>
      )}

      <Card
        title="Addons"
        headerRight={(
          <span className="text-[10px] font-mono text-slate-500 tabular-nums">
            {ligados} {ligados === 1 ? "ligado" : "ligados"} de {itens.length}
          </span>
        )}
      >
        {colando && (
          <div className="mb-3 space-y-2">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={8}
              spellCheck={false}
              placeholder='{"id": "minha-mesa", "nome": "Regras da Mesa", "versao": "1.0.0", "resumo": "O que ele faz em uma linha", "acrescenta": {...}}'
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[11px] font-mono text-slate-200 placeholder-slate-600 focus:border-purple-600 focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={instalar}
                className="text-[11px] px-2 py-1 rounded border border-purple-700 bg-purple-950/50 text-purple-200 hover:border-purple-500"
              >
                Instalar
              </button>
              <button
                type="button"
                onClick={() => { setColando(false); setTexto(""); setProblemas([]); }}
                className="text-[11px] px-2 py-1 rounded border border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600"
              >
                Cancelar
              </button>
            </div>
            {problemas.length > 0 && (
              <div className="space-y-1 pt-1">
                {problemas.map((p) => <Aviso key={p}>{p}</Aviso>)}
              </div>
            )}
          </div>
        )}
        {!colando && problemas.length > 0 && (
          <div className="mb-3 space-y-1">
            {problemas.map((p) => <Aviso key={p}>{p}</Aviso>)}
          </div>
        )}

        <ListaLateral
          itens={itens}
          tipos={CATEGORIAS_DE_ADDON}
          selecionadoId={item?.id ?? null}
          onSelecionar={setEscolhido}
          renderItem={(i) => <LinhaDoAddon item={i} />}
          onNova={() => { setColando((v) => !v); setProblemas([]); }}
          rotuloNovo="Instalar Addon"
          rotuloBusca="Buscar Addon"
          rotuloVazio="Nenhum addon encontrado."
          textoDeBusca={textoDeBuscaDoAddon}
          filtros={FILTROS_DE_ADDON.map((f) => (f.id === "ligados" ? { ...f, rotulo: `Ligados ${pal.g("Neste", "Nesta")} ${pal.Nome}` } : f))}
          destaqueDe={(i) => i.ligado}
          rotuloDestaque={`Ligados ${pal.g("Neste", "Nesta")} ${pal.Nome}`}
          ordens={[{ value: "criacao", label: "Lista" }, { value: "nome", label: "Nome" }]}
          rotuloTipo="Categoria"
        >
          {item && (
            <DetalheDoAddon
              key={item.id}
              item={item}
              pal={pal}
              secoes={oQueMuda(pacoteParaExibir(item), rotulos)}
              controles={controlesDe(item)}
              onAlternar={() => alternar(item)}
              onAtualizar={() => atualizar(item.id)}
              onGuardar={() => guardar(item.copia)}
              onCopiar={() => copiar(item.embutido ? item.pacote : (item.copia ?? item.pacote))}
              onRemover={() => remover(item.id)}
              copiado={copiado === item.id}
            />
          )}
        </ListaLateral>
      </Card>
    </div>
  );
}
