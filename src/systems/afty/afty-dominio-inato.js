import { configuracaoServo, tamanhoDominioInato } from "./afty-servos";
import { efeitosDoDominio, validarDominio, maxEfeitos, vagasUsadas } from "./afty-dominios";

const natural = (n) => Number.isFinite(Number(n)) ? Math.max(0, Math.floor(Number(n))) : 0;
export function estadoDominioInato(estado = {}) {
  return { criado: estado?.criado === true, dentro: estado?.dentro === true,
    dias: natural(estado?.dias), local: String(estado?.local ?? "") };
}

export function resolverDominioInato(ficha, { nivel = 0, estado, canalPermitido = null, condicoesValidas = null } = {}) {
  const servo = configuracaoServo(ficha);
  if (!servo?.regras.classes[servo.classe]?.dominioInato) return null;
  const config = ficha.servosGuerra?.dominio ?? {};
  const sessao = estadoDominioInato(estado ?? config.estado);
  const escolhidos = Array.isArray(config.efeitos) ? config.efeitos : [];
  const restricoes = (Array.isArray(config.restricoes) ? config.restricoes : [])
    .filter((r) => r && typeof r === "object");
  const deRestricao = restricoes.filter((r) => r.tipo === "efeito" && r.efeito && String(r.descricao ?? "").trim());
  const aumentoPorRestricao = restricoes.filter((r) => r.tipo === "tamanho" && String(r.descricao ?? "").trim())
    .reduce((n, r) => n + natural(r.quantidade), 0);
  const aumentos = natural(config.aumentos);
  const base = { id: "servos-da-guerra:dominio-inato", nome: config.nome || "Domínio Inato", versao: "completa", regra: "oficial", efeitos: escolhidos };
  const validar = (efeitos, vagas, repeticoes) => validarDominio({ ...base, efeitos }, {
    dom: nivel, versao: "completa", maxEfeitos: vagas, repeticoes, canalPermitido, condicoesValidas,
  });
  const validacao = validar(escolhidos, Math.max(0, maxEfeitos(nivel) - aumentos), 2);
  if (aumentos + vagasUsadas(escolhidos) > maxEfeitos(nivel)) {
    validacao.push({ nivel: "erro", codigo: "vagas", texto: "Limite de Efeitos do Domínio Inato Excedido" });
  }
  validacao.push(...validar(deRestricao.map((r) => r.efeito), vagasUsadas(deRestricao.map((r) => r.efeito)), Math.max(2, deRestricao.length)));
  if (restricoes.some((r) => !String(r.descricao ?? "").trim())) {
    validacao.push({ nivel: "erro", codigo: "restricao", texto: "Descreva a Restrição" });
  }
  if (aumentos > 2) validacao.push({ nivel: "erro", codigo: "tamanho", texto: "Máximo de Dois Efeitos de Tamanho" });
  const valido = !validacao.some((v) => v.nivel === "erro");
  const ativo = valido && sessao.criado && sessao.dentro;
  return { ...base, ...tamanhoDominioInato({ nivel, dias: sessao.dias, aumentos: aumentos + aumentoPorRestricao }),
    local: sessao.criado ? sessao.local : String(config.local ?? ""), estado: sessao, ativo, valido, validacao, restricoes, vagas: maxEfeitos(nivel),
    usadas: vagasUsadas(escolhidos) + aumentos,
    efeitosMotor: ativo ? [
      ...efeitosDoDominio(ficha, { dom: nivel, canalPermitido, dominioInato: base }),
      ...deRestricao.flatMap((r) => efeitosDoDominio(ficha, { dom: nivel, canalPermitido,
        dominioInato: { ...base, nome: String(r.descricao), efeitos: [r.efeito] } })
        .map((e) => ({ ...e, expr: `(${e.expr}) * ${natural(r.quantidade)}` }))),
    ] : [],
  };
}
