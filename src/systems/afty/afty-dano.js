const inteiro = (valor, min = 0) => Math.max(min, Math.trunc(Number(valor) || 0));
const fixoDe = (grupo) => Math.trunc(Number(grupo?.fixo) || 0);

export function gruposDaLinha(linha = {}) {
  if (Array.isArray(linha.gruposDano) && linha.gruposDano.length) return linha.gruposDano;
  return [{
    nome: linha.nome || "Ataque",
    dados: inteiro(linha.dados),
    faces: inteiro(String(linha.dado ?? linha.faces ?? 6).replace(/^d/i, ""), 2),
    fixo: Math.trunc(Number(linha.fixo) || 0),
    momento: "durante",
    multiplica: true,
  }];
}

/* CRITÁVEL: os DADOS do grupo dobram no crítico. O fixo nunca dobra (autor,
   2026-08-05, e de novo em 2026-09-15: "O Dano Fixo não é Critável"). */
export const grupoMultiplicavel = (grupo) =>
  grupo?.momento !== "apos" && grupo?.multiplica !== false;

/* ⚠ O RAIO NEGRO MULTIPLICA O MESMO CONJUNTO QUE O CRÍTICO DOBRA (autor,
   2026-09-15): *"Raio Negro multiplica por 1.5 somente os DADOS e Danos
   Critáveis."* Até aqui existia uma segunda marca, `entraRaioNegro`, que deixava
   o Atroz de fora e punha Destruidora, Fatal e Mortal dentro sem dobrar, e o fixo
   inteiro ia junto para o 1,5x. As duas listas agora são uma só. */
export const grupoNoRaioNegro = grupoMultiplicavel;

const facesNoModo = (grupo, modo) =>
  inteiro(modo !== "normal" && grupo?.facesCritico ? grupo.facesCritico : grupo?.faces, 2);

const juntar = (termos) => termos.filter(Boolean).join(" + ").replace(/\+ -/g, "− ");

/* Os dados de uma pilha, somados por FACE (autor, 2026-09-15): *"Some os danos
   como 20d12 + 2d12 + 2d12 em 24d12. Os dados de face igual que forem Critaveis
   vc soma. Os que não foram você soma fora no calculo de Raio Negro."*

   Uma linha por grupo ficava ilegível: sete termos só dentro do parêntese do
   Raio Negro. Quem diz de onde cada dado veio é o hover, que continua listando
   fonte por fonte. */
const dadosDaPilha = (lista, modo, dobrar) =>
  textoDosDados(lista.map((g) => ({
    dados: inteiro(g?.dados) * (dobrar && grupoMultiplicavel(g) ? 2 : 1),
    faces: facesNoModo(g, modo),
  })));

const fixoDaPilha = (lista) => lista.reduce((s, g) => s + fixoDe(g), 0);
const textoDoFixo = (fixo) => (fixo ? String(fixo) : "");

export function formulaModoDano(grupos, modo = "normal") {
  const lista = (Array.isArray(grupos) ? grupos : [])
    .filter((g) => ["critico", "raio_negro"].includes(modo) || !g.apenasCritico);
  if (modo === "raio_negro") {
    // Só os dados critáveis (já dobrados pelo crítico) entram no 1,5x. O fixo de
    // TODO grupo e os dados que não são critáveis ficam fora e somam uma vez.
    const dentro = dadosDaPilha(lista.filter(grupoNoRaioNegro), modo, true);
    const fora = dadosDaPilha(lista.filter((g) => !grupoNoRaioNegro(g)), "normal", false);
    return juntar([dentro ? `(${dentro}) × 1,5` : "", fora, textoDoFixo(fixoDaPilha(lista))]) || "0";
  }
  const dobra = modo === "critico";
  return juntar([dadosDaPilha(lista, modo, dobra), textoDoFixo(fixoDaPilha(lista))]) || "0";
}

/** Os dados de vários grupos somados por tamanho, do maior para o menor: `12d12 + 8d10`. */
export function textoDosDados(grupos, modo = "normal") {
  const porFaces = new Map();
  for (const g of Array.isArray(grupos) ? grupos : []) {
    const dados = inteiro(g?.dados);
    if (!dados) continue;
    const faces = facesNoModo(g, modo);
    porFaces.set(faces, (porFaces.get(faces) ?? 0) + dados);
  }
  return [...porFaces.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([faces, qtd]) => `${qtd}d${faces}`)
    .join(" + ");
}

const comSinal = (n) => (n < 0 ? `−${Math.abs(n)}` : `+${n}`);

/**
 * O HOVER DE DANO EM TRÊS PILHAS (autor, 2026-09-15): *"Separando o quê é
 * critável, o quê não é critável e o fixo."* Cada pilha abre com o subtotal dela,
 * e o rodapé é a rolagem inteira que o clique faz no modo normal.
 *
 * As parcelas vêm de dois lugares, e a marca `naPartes` é o que impede a mesma
 * coisa de aparecer duas vezes:
 *   • `linha.partes`, montadas no `resolveDano`, com a `categoria` de cada uma.
 *     O dado da arma, os Níveis de Dano e os dados extras são critáveis, e os
 *     bônus somados são fixos.
 *   • os grupos que chegaram DEPOIS (Aptidões, Auxiliares, Imbuição, Fatal,
 *     Mortal, Destruidora, Crítico Potente). Esses não têm parcela, então viram
 *     uma linha pelo nome do grupo.
 *
 * ⚠ NA CRIATURA O NÚMERO NASCE AO CONTRÁRIO. As parcelas dela compõem o Dano
 * TOTAL (`categoria: "total"`), e é o total que vira dados mais fixo. Por isso
 * ela ganha uma pilha própria com a conta do total, e as pilhas de dados e fixo
 * mostram o resultado dessa conta.
 */
export function hoverDoDano(linha = {}) {
  const grupos = gruposDaLinha(linha);
  const partes = (Array.isArray(linha.partes) ? linha.partes : []).filter(Boolean);
  const categoriaDe = (p) => p.categoria ?? (p.texto != null ? "critavel" : "fixo");
  const doTotal = partes.filter((p) => categoriaDe(p) === "total");
  const critaveis = partes.filter((p) => categoriaDe(p) === "critavel");
  const naoCritaveis = partes.filter((p) => categoriaDe(p) === "naoCritavel");
  const fixos = partes.filter((p) => categoriaDe(p) === "fixo");

  if (doTotal.length) {
    if (inteiro(linha.dadosBase) > 0) critaveis.unshift({ label: "Dados Base", texto: `${linha.dadosBase}${linha.dado}` });
    fixos.unshift({ label: "Dano Fixo", valor: Math.trunc(Number(linha.fixo) || 0) });
  }

  for (const g of grupos) {
    if (g.naPartes) continue;
    const nome = `${g.nome || "Dano Adicional"}${g.apenasCritico ? " (Só no Crítico)" : ""}`;
    if (inteiro(g.dados) > 0) {
      (grupoMultiplicavel(g) ? critaveis : naoCritaveis).push({ label: nome, texto: `${g.dados}d${g.faces}` });
    }
    if (fixoDe(g)) fixos.push({ label: nome, valor: fixoDe(g) });
  }

  // O subtotal é da rolagem NORMAL: o que só existe no crítico aparece na pilha,
  // marcado, e fica fora da conta.
  const normais = grupos.filter((g) => !g.apenasCritico);
  const fixoTotal = normais.reduce((s, g) => s + fixoDe(g), 0);
  const saida = [];
  if (doTotal.length) saida.push({ secao: "Dano Total", texto: String(linha.total ?? 0) }, ...doTotal);
  if (critaveis.length) {
    saida.push({ secao: "Critável", texto: textoDosDados(normais.filter(grupoMultiplicavel)) || "0" }, ...critaveis);
  }
  if (naoCritaveis.length) {
    saida.push({ secao: "Não Critável", texto: textoDosDados(normais.filter((g) => !grupoMultiplicavel(g))) || "0" },
      ...naoCritaveis);
  }
  if (fixos.length) saida.push({ secao: "Fixo", texto: comSinal(fixoTotal) }, ...fixos);

  const dados = textoDosDados(normais);
  const total = dados
    ? `${dados}${fixoTotal ? ` ${fixoTotal < 0 ? "−" : "+"} ${Math.abs(fixoTotal)}` : ""}`
    : String(fixoTotal);
  return { partes: saida, total };
}

export function comFormulasDeDano(linha) {
  const gruposDano = gruposDaLinha(linha);
  return {
    ...linha,
    gruposDano,
    formulaNormal: formulaModoDano(gruposDano, "normal"),
    formulaCritico: formulaModoDano(gruposDano, "critico"),
    formulaRaioNegro: formulaModoDano(gruposDano, "raio_negro"),
    hoverDano: hoverDoDano({ ...linha, gruposDano }),
  };
}
