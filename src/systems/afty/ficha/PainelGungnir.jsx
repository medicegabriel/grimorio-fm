import { useState } from "react";
import {
  normalizaGungnir, adicionarAlvoGungnir, confirmarAcertoGungnir,
  aplicarPerfuracaoGungnir, afastarGungnir, recuperarGungnir, consumirRessonanciaGungnir,
  configurarModoGungnir,
} from "../afty-gungnir";

export default function PainelGungnir({ derived, sessao, onSessao }) {
  const [nome, setNome] = useState("");
  if (!derived?.gungnir?.ativo) return null;
  const estado = normalizaGungnir(sessao.gungnir);
  const ativo = !!sessao.combate?.ativo;
  const disponivel = ativo && derived.gungnir.disponivel;
  const feiticoCravado = derived.feiticos?.lista?.find((f) => ["vespa-crabro:beesting", "vespa-crabro:waspsting"].includes(f.id) && !f.bloqueado);
  const botao = "afty-botao px-2 py-1 text-xs disabled:opacity-40";
  const perfuracao = (a, tipo) => ativo && (disponivel || estado.cravadaEm === a.id) && estado.acerto?.alvo === a.id
    && estado.acerto?.rodada === sessao.rodada
    && derived.feiticos?.lista?.some((f) => f.id === `vespa-crabro:${tipo}` && !f.bloqueado);
  return <section className="afty-card p-3 space-y-3" aria-label="Gungnir">
    <div className="flex gap-2 items-center flex-wrap">
      <h2 className="afty-card-titulo flex-1">Gungnir</h2>
      <select aria-label="Manejo de Gungnir" className="afty-campo bg-transparent px-2 py-1 text-xs"
        value={estado.modo} disabled={!ativo} onChange={(ev) => { const modo = ev.target.value; onSessao((s) => configurarModoGungnir(s, derived, modo)); }}>
        <option value="corpo">Corpo a corpo</option><option value="arremesso">Arremesso</option>
      </select>
      <span className="afty-chip">{estado.posicao === "maos" ? "Em mãos" : estado.posicao === "cravada" ? `Cravada: ${estado.alvos.find((a) => a.id === estado.cravadaEm)?.nome ?? ""}` : "Afastada"}</span>
      <button type="button" className={botao} disabled={!disponivel}
        title="Registra a lança afastada após resolver o arremesso. O encantamento Retorno recupera normalmente a lança que não ficou presa"
        onClick={() => onSessao((s) => afastarGungnir(s, derived))}>Afastar</button>
      <button type="button" className={botao} disabled={!ativo || !derived.gungnir.inventariada || estado.posicao === "maos"}
        title="Harpoon Recall: Ação Comum para retirar a lança presa, sem dano ou consumo de ressonância"
        onClick={() => onSessao((s) => recuperarGungnir(s, derived))}>Recuperar</button>
      <button type="button" className={botao} disabled={!ativo || !derived.gungnir.inventariada || estado.posicao === "maos"}
        title="Ação Atacar. Recupera a lança e disponibiliza sua linha de ataque. Resolva um ataque nativo para o retorno e só então confirme eventual acerto. Não causa dano automaticamente"
        onClick={() => onSessao((s) => recuperarGungnir(s, derived))}>Retorno ofensivo</button>
    </div>
    <form className="flex gap-2" onSubmit={(ev) => {
      ev.preventDefault();
      const id = globalThis.crypto.randomUUID();
      onSessao((s) => adicionarAlvoGungnir(s, derived, id, nome)); setNome("");
    }}>
      <input aria-label="Nome do alvo de Gungnir" className="afty-campo bg-transparent px-2 py-1 min-w-0 flex-1 text-xs"
        placeholder="Alvo" value={nome} onChange={(ev) => setNome(ev.target.value)} />
      <button className={botao} disabled={!ativo || !nome.trim()}>Adicionar alvo</button>
    </form>
    {estado.alvos.map((a) => <div key={a.id} className="flex gap-2 items-center flex-wrap border-t pt-2" style={{ borderColor: "var(--afty-borda)" }}>
      <span className="flex-1 font-semibold text-xs">{a.nome}</span>
      <span className="afty-chip" title="Uma carga por acerto confirmado de Gungnir, até o Bônus de Treinamento. Dura até encerrar o combate">
        Ressonância {Math.min(a.cargas, derived.maestria)}/{derived.maestria}
      </span>
      {a.beesting > 0 && <span className="afty-chip" title="Lento, condicionado ao TR falho do Feitiço. Resolva a condição na ficha do alvo">Beesting {a.beesting}</span>}
      {a.waspsting > 0 && <span className="afty-chip" title="Imóvel e Sangramento Forte, condicionados ao TR falho do Feitiço. Resolva as condições na ficha do alvo">Waspsting {a.waspsting}</span>}
      <button type="button" className={botao} disabled={!disponivel && !(ativo && estado.cravadaEm === a.id && feiticoCravado)}
        title="Confirma um acerto já resolvido com Gungnir. Uma rolagem ou um erro não contam. Cada golpe acertado de Ferrão Amarelo é uma confirmação separada. Com a lança cravada, confirme somente acertos de Beesting ou Waspsting pagos e resolvidos nesse alvo"
        onClick={() => { const evento = globalThis.crypto.randomUUID(); onSessao((s) => confirmarAcertoGungnir(s, derived, { alvo: a.id, evento, feiticoId: !disponivel ? feiticoCravado?.id : null })); }}>Confirmar acerto</button>
      <button type="button" className={botao} disabled={!perfuracao(a, "beesting")}
        title="Após adquirir, pagar e resolver Beesting, confirme aqui somente se o alvo falhou no TR. Sem gerar carga adicional"
        onClick={() => onSessao((s) => aplicarPerfuracaoGungnir(s, derived, a.id, "beesting"))}>Beesting</button>
      <button type="button" className={botao} disabled={!perfuracao(a, "waspsting")}
        title="Após adquirir, pagar e resolver Waspsting, confirme aqui somente se o alvo falhou no TR. Sem gerar carga adicional"
        onClick={() => onSessao((s) => aplicarPerfuracaoGungnir(s, derived, a.id, "waspsting"))}>Waspsting</button>
      <button type="button" className={botao} disabled={!ativo || !derived.gungnir.zumbido || !a.cargas
        || estado.zumbidoRodada === sessao.rodada || estado.acerto?.alvo !== a.id || estado.acerto?.rodada !== sessao.rodada}
        title="Zumbido: uma vez por rodada após acertar Gungnir, consome todas as cargas deste alvo e rola 1d12 perfurante por carga. Não multiplica no crítico"
        onClick={() => onSessao((s) => consumirRessonanciaGungnir(s, derived, a.id))}>Zumbido</button>
    </div>)}
  </section>;
}
