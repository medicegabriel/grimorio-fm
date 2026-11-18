/* O ESPELHO DA FICHA LIGADA, NO APARELHO DO DONO (Encontro Unificado, etapa 7b, 2026-11-18).

   Durante a Sala, a fonte de verdade da sessão de um personagem é a linha `sessao` de `sala_fichas`. O aparelho do
   jogador a espelha para `fm_ficha_sessao_afty_v1:<id da ficha>` pela loja da sessão (`aplicarRemoto`), e a Ficha G2 dele,
   que lê da loja, mostra na hora o que o Mestre mudou. O caminho de volta: a loja avisa que o jogador mexeu, o espelho
   sobe a DIFERENÇA (`reaplicarSobre`) por cima da versão que está no banco, com a conferência de versão do cliente.

   ⚠ A FILA DA LOJA PRECISA ESTAR VAZIA ANTES DE SUBIR. `aplicarRemoto` reaplica a fila de edições ainda não gravadas por
   cima da versão que chegou. Se o espelho subisse a sessão com a fila dentro e depois a devolvesse à loja, a fila seria
   aplicada DUAS vezes (o dano entraria em dobro). Por isso a subida começa por `descarregar`, que grava a fila e a esvazia.

   ⚠ O ECO. A versão que o espelho aplicou (ou gravou) é a BASE. A loja avisa também quando o próprio espelho aplica, e a
   subida compara o texto com a base antes de gravar qualquer coisa.

   A ficha (a criação) sobe quando o dono a edita: a lista de fichas do aparelho é relida no evento `storage` (o criador
   aberto noutra aba) e a parte `ficha` é regravada se o texto mudou. O resumo do personagem (Vida, PE, Alma, condições,
   Efeitos), derivado aqui, é publicado pelo dono, que é quem consegue derivar. */

/* Os motores entram PRIMEIRO (ver o topo de encontros/modelo.js). */
import { MOTORES } from "../systems/afty/encontros/motores/index";
import { MOTOR } from "../systems/afty/encontros/modelo";
import { deriveAfty } from "../systems/afty/afty-derive";
import { unirAddons, aplicarAddons, epocaAddons } from "../systems/afty/afty-addons";
import { reaplicarSobre } from "../systems/afty/encontros/usar-encontro";
import {
  ler as lerDaLoja, ouvir as ouvirDaLoja, aplicarRemoto, descarregar,
} from "../systems/afty/ficha/sessao-loja";
import { estavel, parteDe, meusCombatentes } from "./sala-cliente";
import { fichaIdDoCombatente } from "./sala-oculto";
import { rolagensNovas, rolagemParaASala } from "./sala-telas";

const ATRASO_SUBIDA = 350;
const motorAfty = MOTORES[MOTOR.AFTY];

/** O resumo que o dono publica, do motor do Afty (a mesma forma que `sala_interno.resumo_saneado` aceita). */
export function resumoDoPersonagem(ficha, sessao) {
  if (!ficha || !sessao) return null;
  try {
    const { pacotes } = unirAddons([ficha]);
    aplicarAddons(pacotes);
    const d = motorAfty.derivar(ficha, sessao, epocaAddons());
    return motorAfty.resumo(sessao, d);
  } catch {
    return null;
  }
}

/**
 * Liga o espelho dos personagens desta conta na Sala do `cliente`. `fichasDoAparelho()` devolve as fichas do inventário
 * do grupo (as que o jogador pode ter posto). Devolve a função de desligar.
 */
export function ligarEspelho(cliente, { fichasDoAparelho, aoErro = null } = {}) {
  const ligados = new Map(); // combatente -> { fichaId, base: { dados, versao }, timer, sairLoja, textoFicha }
  let desligado = false;

  const fichaLocal = (fichaId) => (fichasDoAparelho() ?? []).find((f) => String(f?.id) === String(fichaId)) ?? null;
  /* A primeira leitura da loja decide os máximos da sessão nova (Vida e PE cheios): ela precisa do derive da ficha, como a
     Ficha faz na montagem. Sem ele a sessão nasceria com Vida 0 e subiria assim para a Sala. */
  const derivadoDe = (fichaId) => () => {
    const f = fichaLocal(fichaId);
    if (!f) return null;
    try {
      const { pacotes } = unirAddons([f]);
      aplicarAddons(pacotes);
      return deriveAfty(f);
    } catch { return null; }
  };
  const lerSessao = (fichaId) => lerDaLoja(fichaId, derivadoDe(fichaId));

  function avisarErro(e) {
    if (!desligado) aoErro?.(e);
    console.warn("[sala-espelho]", e?.codigo ?? e);
  }

  async function publicar(combatente, fichaId) {
    const ficha = fichaLocal(fichaId);
    const resumo = resumoDoPersonagem(ficha, lerSessao(fichaId));
    if (resumo) await cliente.publicarResumo(combatente, resumo);
  }

  /* A BASE é a última versão do banco COMO A LOJA A ENXERGA (já normalizada), com o número da versão. Comparar a sessão
     local com o texto cru do banco faria a normalização parecer edição do jogador, e essa "edição" voltaria por cima da
     versão do Mestre (o começo do combate sumia assim). Se o banco mudou decide-se pelo número da versão, nunca pelo texto.

     Receber: a versão do banco vira a base e a loja recebe. Se o jogador mexeu e a mudança ainda não subiu (a rede caiu,
     ou a subida está no caminho), as duas se juntam: a diferença local vai por cima da versão que chegou, e sobe depois.
     Trocar a sessão local pela remota perderia a edição do jogador. */
  function receber(combatente, linha) {
    const l = ligados.get(combatente);
    if (!l || !linha?.dados) return;
    if (l.base && Number(l.base.versao) >= Number(linha.versao)) return;
    // Durante a subida a base é dela: a versão nova entra quando ela termina.
    if (l.subindo) return;
    descarregar(l.fichaId);
    const local = lerSessao(l.fichaId);
    const antes = l.base?.dados ?? null;
    const temEdicao = !!antes && estavel(local) !== estavel(antes);
    const vista = aplicarRemoto(l.fichaId, linha.dados);
    l.base = { versao: linha.versao, dados: vista };
    if (temEdicao) {
      aplicarRemoto(l.fichaId, reaplicarSobre(vista, antes, local));
      agendarSubida(combatente);
    }
  }

  async function subir(combatente) {
    const l = ligados.get(combatente);
    if (!l || desligado) return;
    // Uma subida por vez: a segunda leria a base de antes da primeira.
    if (l.subindo) { l.denovo = true; return; }
    l.subindo = true;
    try {
      descarregar(l.fichaId);
      const local = lerSessao(l.fichaId);
      if (l.base && estavel(local) === estavel(l.base.dados)) return;
      const base = l.base;
      const r = await cliente.gravarParte(combatente, "sessao", (remota) => {
        if (!remota) return local;
        // Sem base e com versão no banco: a do banco manda (ela entra pelo receber).
        if (!base) return null;
        const agora = parteDe(cliente.ler(), combatente, "sessao");
        const mudou = !agora || Number(agora.versao) !== Number(base.versao);
        // Alguém gravou depois da base: a diferença da edição local vai por cima da versão de agora.
        return mudou ? reaplicarSobre(remota, base.dados, local) : local;
      });
      // O jogador pode ter mexido de novo enquanto a gravação ia e voltava: essa mudança vai por cima do que gravou.
      descarregar(l.fichaId);
      const depois = lerSessao(l.fichaId);
      const mexeu = estavel(depois) !== estavel(local);
      const vista = r.dados && estavel(r.dados) !== estavel(local) ? aplicarRemoto(l.fichaId, r.dados) : local;
      l.base = { versao: r.versao, dados: vista };
      /* As rolagens que o jogador fez na Ficha viram linha do Registro (autor, 2026-11-18, "Só as Rolagens"). Só quando já havia
         uma base: a primeira subida da sessão não republica as rolagens antigas. O id da linha é o da rolagem, então tentar de
         novo não repete. */
      if (base?.dados) {
        for (const rol of rolagensNovas(base.dados, local)) {
          cliente.registrar("rolagem", { id: `rol:${rol.id}`, combatente, rolagem: rolagemParaASala(rol) }).catch(avisarErro);
        }
      }
      if (mexeu) {
        aplicarRemoto(l.fichaId, reaplicarSobre(vista, local, depois));
        l.denovo = true;
      }
      await publicar(combatente, l.fichaId);
    } finally {
      l.subindo = false;
      // A versão que chegou durante a subida.
      const linha = parteDe(cliente.ler(), combatente, "sessao");
      if (linha) receber(combatente, linha);
      if (l.denovo) { l.denovo = false; agendarSubida(combatente); }
    }
  }

  function agendarSubida(combatente, atraso = ATRASO_SUBIDA) {
    const l = ligados.get(combatente);
    if (!l) return;
    clearTimeout(l.timer);
    l.timer = setTimeout(() => {
      subir(combatente).catch((e) => {
        avisarErro(e);
        // Sem rede: tenta de novo, e a edição continua na loja até subir.
        if (e?.rede && !desligado) agendarSubida(combatente, 3000);
      });
    }, atraso);
  }

  /* A ficha sobe quando o texto muda (o dono a editou noutra aba). */
  async function subirFicha(combatente) {
    const l = ligados.get(combatente);
    const ficha = l && fichaLocal(l.fichaId);
    if (!ficha) return;
    const texto = estavel(ficha);
    if (texto === l.textoFicha) return;
    l.textoFicha = texto;
    await cliente.gravarParte(combatente, "ficha", () => ficha);
    await publicar(combatente, l.fichaId);
  }

  async function ligar(combatente, fichaId) {
    if (ligados.has(combatente)) return;
    const l = { fichaId, base: null, timer: null, sairLoja: null, textoFicha: null };
    ligados.set(combatente, l);
    await subirFicha(combatente);
    const remota = parteDe(cliente.ler(), combatente, "sessao");
    if (remota) receber(combatente, remota);
    else await subir(combatente);
    l.sairLoja = ouvirDaLoja(fichaId, () => agendarSubida(combatente));
    await publicar(combatente, fichaId);
  }

  /* Cada mudança do retrato: personagem novo meu (pôr a ficha), sessão nova do banco. */
  function aoMudarSala() {
    if (desligado) return;
    const r = cliente.ler();
    const ids = (fichasDoAparelho() ?? []).map((f) => String(f?.id));
    for (const res of meusCombatentes(r)) {
      if (res.tipo !== "personagem") continue;
      const fichaId = fichaIdDoCombatente(res.combatente, ids) ?? parteDe(r, res.combatente, "ficha")?.dados?.id ?? null;
      if (!fichaId || !ids.includes(String(fichaId))) continue;
      if (!ligados.has(res.combatente)) { ligar(res.combatente, String(fichaId)).catch(avisarErro); continue; }
      const linha = parteDe(r, res.combatente, "sessao");
      if (linha) receber(res.combatente, linha);
    }
    // Tirado da Sala (pelo dono ou pelo Mestre): para de espelhar.
    for (const [combatente, l] of ligados) {
      if (r.resumos[combatente]?.dono === r.eu?.conta) continue;
      clearTimeout(l.timer);
      l.sairLoja?.();
      ligados.delete(combatente);
    }
  }

  const aoMudarArmazenamento = () => { for (const c of ligados.keys()) subirFicha(c).catch(avisarErro); };
  if (typeof window !== "undefined") window.addEventListener("storage", aoMudarArmazenamento);
  const sairCliente = cliente.ouvir(aoMudarSala);
  aoMudarSala();

  return {
    desligar() {
      desligado = true;
      sairCliente();
      if (typeof window !== "undefined") window.removeEventListener("storage", aoMudarArmazenamento);
      for (const l of ligados.values()) {
        clearTimeout(l.timer);
        l.sairLoja?.();
      }
      ligados.clear();
    },
    /** Sobe agora o que estiver esperando (sair da página). */
    async descarregar() {
      await Promise.all([...ligados.keys()].map((c) => { clearTimeout(ligados.get(c)?.timer); return subir(c).catch(avisarErro); }));
    },
    ligados: () => [...ligados.entries()].map(([combatente, l]) => ({ combatente, fichaId: l.fichaId })),
  };
}
