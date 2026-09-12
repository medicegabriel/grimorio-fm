/**
 * ============================================================
 * ADDONS — biblioteca e o que esta criatura usa
 * ============================================================
 * ⚠ NÃO É MAIS UMA ABA. Desde 2026-09-05 este painel é renderizado no FIM da
 * aba Cálculos, nos dois sistemas (autor: *"passe a parte dos Addons para
 * Cálculos em ambos os lados"*). O componente não mudou, e o nome do arquivo e
 * o do export ficaram como estavam: renomear os dois só trocaria o lugar em que
 * a palavra "aba" mente.
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
import { AlertTriangle, Trash2, Plus, RefreshCw, Package, Download, Copy, Check, Lock } from "lucide-react";
import { Card } from "./ui/primitivos";
import PainelDoCofre from "./ui/PainelDoCofre";
import { cofreTrancado, destrancarDeVez } from "./afty-cofre";
import {
  lerBiblioteca, instalarDeTexto, instalarPacote, removerPacote, compararComBiblioteca,
} from "./afty-addons-biblioteca";
import { familiasDeAddon } from "./afty-addons";
import { sistemaDaFicha, palavrasDoSistema } from "./afty-sistema";

/* Quantas entradas o pacote acrescenta, por família, para o chip da linha. */
function resumoDoPacote(p) {
  const rotulos = Object.fromEntries(familiasDeAddon().map((f) => [f.id, f.rotulo]));
  const conteudo = Object.entries(p.acrescenta || {})
    .filter(([, lista]) => Array.isArray(lista) && lista.length)
    .map(([familia, lista]) => `${lista.length} ${rotulos[familia] ?? familia}`);
  const ciclos = Array.isArray(p.adaptacoes) && p.adaptacoes.length
    ? [`${p.adaptacoes.length} ${p.adaptacoes.length === 1 ? "ciclo" : "ciclos"}`]
    : [];
  const funcionamentos = Array.isArray(p.funcionamentos) && p.funcionamentos.length
    ? [`${p.funcionamentos.length} ${p.funcionamentos.length === 1 ? "funcionamento" : "funcionamentos"}`]
    : [];
  const feiticos = Array.isArray(p.feiticos) && p.feiticos.length
    ? [`${p.feiticos.length} ${p.feiticos.length === 1 ? "Feitiço" : "Feitiços"}`]
    : [];
  const estados = Array.isArray(p.estadosCombate) && p.estadosCombate.length
    ? [`${p.estadosCombate.length} ${p.estadosCombate.length === 1 ? "estado" : "estados"}`]
    : [];
  /* ⚠ REMENDO, LIBERAÇÃO E PRIMITIVA TAMBÉM VIRAM CHIP (2026-09-07). O resumo só
     contava o que o pacote ACRESCENTA, e por isso um pacote que só remenda, só
     destrava ou só mostra aparecia na lista com o nome, a versão e mais nada:
     três formas de pacote que o validador aceita e a linha não descrevia. O
     caso que achou isto foi o Estilo Marcial, que é uma linha de `libera` e
     nada mais. */
  const remendos = Object.values(p.substitui || {})
    .reduce((n, lista) => n + (Array.isArray(lista) ? lista.length : 0), 0);
  const remendados = remendos ? [`${remendos} ${remendos === 1 ? "remendo" : "remendos"}`] : [];
  const libera = Array.isArray(p.libera) && p.libera.length
    ? [`${p.libera.length} ${p.libera.length === 1 ? "liberação" : "liberações"}`]
    : [];
  const permite = Array.isArray(p.permite) && p.permite.length
    ? [`${p.permite.length} ${p.permite.length === 1 ? "primitiva" : "primitivas"}`]
    : [];
  return [...conteudo, ...ciclos, ...funcionamentos, ...feiticos, ...estados,
    ...remendados, ...libera, ...permite];
}

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
  const ligar = (p) => setAddons([...naFicha.filter((x) => x.id !== p.id), p]);
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

      {mortas.length > 0 && (
        <Card title="Problemas">
          <div className="space-y-2">
            {mortas.map((m) => (
              <div key={`${m.familia}:${m.id}`} className="space-y-0.5">
                <Aviso>{m.motivo}</Aviso>
                <p className="text-[11px] text-slate-500 pl-4">{m.saida}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card
        title="Biblioteca de Addons"
        headerRight={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => { setColando((v) => !v); setProblemas([]); }}
              className="text-[11px] px-2 py-1 rounded border border-slate-700 bg-slate-950 text-slate-300 hover:border-purple-600 flex items-center gap-1"
              title="Colar o JSON de um addon para instalar nesta máquina"
            >
              <Plus className="w-3 h-3" aria-hidden="true" />
              Instalar
            </button>
          </div>
        }
      >
        {colando && (
          <div className="mb-3 space-y-2">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={8}
              spellCheck={false}
              placeholder='{"id": "minha-mesa", "nome": "Regras da Mesa", "versao": "1.0.0", "acrescenta": {...}}'
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

        {biblioteca.length === 0 ? (
          <p className="text-xs text-slate-500">Nenhum addon instalado.</p>
        ) : (
          <div className="space-y-1">
            {biblioteca.map((p) => {
              const ligado = idsNaFicha.has(p.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-2 min-h-[36px] px-2 rounded bg-slate-950/50 border border-slate-800"
                >
                  <button
                    type="button"
                    onClick={() => (ligado ? desligar(p.id) : ligar(p))}
                    aria-pressed={ligado}
                    title={ligado
                      ? `Tirar ${pal.g("deste", "desta")} ${pal.nome}`
                      : `Usar ${pal.g("neste", "nesta")} ${pal.nome}`}
                    className={`w-4 h-4 rounded border flex-shrink-0 ${
                      ligado ? "bg-purple-600 border-purple-500" : "border-slate-600 hover:border-purple-600"
                    }`}
                  />
                  <span className="text-xs text-slate-200 truncate">{p.nome}</span>
                  <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">{p.versao}</span>
                  <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                    {resumoDoPacote(p).map((r) => <Chip key={r}>{r}</Chip>)}
                    <button
                      type="button"
                      onClick={() => copiar(p)}
                      title="Copiar o JSON deste addon"
                      className="p-1 rounded text-slate-500 hover:text-purple-300"
                    >
                      {copiado === p.id
                        ? <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                        : <Copy className="w-3 h-3" aria-hidden="true" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => remover(p.id)}
                      title="Remover da biblioteca desta máquina"
                      className="p-1 rounded text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card
        title={`${pal.g("Neste", "Nesta")} ${pal.Nome}`}
        headerRight={
          naFicha.length > 0 && (
            <span className="text-[10px] font-mono text-slate-500 tabular-nums">
              {naFicha.length} {naFicha.length === 1 ? "addon" : "addons"}
            </span>
          )
        }
      >
        {naFicha.length === 0 ? (
          <p className="text-xs text-slate-500">{pal.g("Este", "Esta")} {pal.nome} usa só o raw.</p>
        ) : (
          <div className="space-y-1">
            {naFicha.map((p) => {
              const est = estadoDe[p.id];
              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex items-center gap-2 min-h-[36px] px-2 rounded bg-slate-950/50 border border-slate-800">
                    <Package className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" aria-hidden="true" />
                    <span className="text-xs text-slate-200 truncate">{p.nome}</span>
                    <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">{p.versao}</span>
                    <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                      {est?.estado === "desatualizado" && (
                        <>
                          <Chip tom="amber">{est.versaoBiblioteca} na biblioteca</Chip>
                          <button
                            type="button"
                            onClick={() => atualizar(p.id)}
                            title={`Trocar pela versão ${est.versaoBiblioteca} da biblioteca`}
                            className="p-1 rounded text-slate-500 hover:text-purple-300"
                          >
                            <RefreshCw className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </>
                      )}
                      {est?.estado === "só na ficha" && (
                        <>
                          <Chip tom="amber">Fora da biblioteca</Chip>
                          <button
                            type="button"
                            onClick={() => guardar(p)}
                            title="Guardar este addon na biblioteca desta máquina"
                            className="p-1 rounded text-slate-500 hover:text-purple-300"
                          >
                            <Download className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => pedirSenhaParaDesligar(p)}
                        title={`Tirar ${pal.g("deste", "desta")} ${pal.nome}${protegido(p) ? " (pede a senha do Cofre)" : ""}`}
                        className="p-1 rounded text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
