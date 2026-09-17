import { AFTY_APTIDOES, getAptidao } from "./afty-aptidoes";
import { TIPOS_DANO, tiposDeDanoDaCategoria } from "./afty-equipamentos";
import { comFormulasDeDano, gruposDaLinha } from "./afty-dano";

const tem = (ids, id) => Array.isArray(ids) && ids.includes(id);
const lista = (valor) => (Array.isArray(valor) ? valor : []);

const AURAS_GOLPE = new Set([
  "aura_chamativa",
  "enganacao_projetada",
  "aura_lacerante",
  "aura_macabra",
]);

export function aptidoesAuraDesabilitadas(creature, aptidoesIds) {
  if (!creature?.combate?.ativo || !tem(aptidoesIds, "concentrar_aura")) return [];
  const escolhidas = new Set(aptidoesIds);
  return [...new Set(lista(creature?.combate?.concentrarAura))]
    .filter((id) => escolhidas.has(id) && getAptidao(id)?.categoria === "aura")
    .slice(0, 1 + Math.max(0, Math.trunc(Number(creature?.aptidoes?.au) || 0)));
}

export function estadosCombateAptidoes({ aptidoesIds = [], au = 0, cl = 0 } = {}) {
  const estados = [];
  if (tem(aptidoesIds, "aura_embacada")) {
    estados.push({
      id: "auraEmbacada",
      label: "Aura Embaçada",
      tipo: "bool",
      custoPE: 2,
    });
  }
  if (tem(aptidoesIds, "aura_elemental")) {
    estados.push({
      id: "auraElemental",
      label: "Aura Elemental",
      tipo: "bool",
      padrao: true,
      foraCombate: true,
    });
  }
  if (tem(aptidoesIds, "concentrar_aura")) {
    const opcoes = AFTY_APTIDOES
      .filter((a) => a.categoria === "aura" && a.id !== "concentrar_aura" && tem(aptidoesIds, a.id))
      .map((a) => ({ id: a.id, label: a.nome }));
    if (opcoes.length) {
      estados.push({
        id: "concentrarAura",
        label: "Concentrar Aura",
        tipo: "multi",
        opcoes,
        maxSelecionados: 1 + Math.max(0, Math.trunc(Number(au) || 0)),
      });
    }
  }
  /* O bônus que fica DEPOIS do Kokusen, ligado à mão: quem sabe se o Raio Negro
     acertou nesta cena é a mesa. Autor, 2026-09-15: *"precisa de um botão para
     ativar. Aonde quando ativado (Após dar um Raio Negro na sessão) você recebe
     Metade do seu nivel de Controle e Leitura arredondado pra cima como Acerto e
     Nivel de Controle e Leitura como Dano Fixo."* */
  if (tem(aptidoesIds, "abencoado_pelas_faiscas_negras")) {
    estados.push({
      id: "faiscasNegras",
      label: "Abençoado pelas Faíscas Negras",
      tipo: "bool",
    });
  }
  if (tem(aptidoesIds, "golpe_com_aura")) {
    const opcoes = aptidoesIds
      .filter((id) => AURAS_GOLPE.has(id))
      .map((id) => ({ id, label: getAptidao(id)?.nome ?? id }));
    if (opcoes.length) {
      estados.push({
        id: "golpeComAura",
        label: "Golpe com Aura",
        tipo: "opcao",
        opcoes,
        custoPE: 1,
      });
    }
  }
  /* ⚠ OS DOIS CANALIZAR SÃO EXCLUSIVOS: "Não é possível utilizar Canalizar em
     Golpe e Canalizar Energia Reversa simultaneamente, podendo aplicar apenas um
     deles em um mesmo ataque." Ligar um desliga o outro (autor, 2026-09-15). Quem
     escreve o estado lê `exclusivoCom`: o `alteraEstadoCombate` na Ficha e o
     `patchCombate` na bancada do criador. */
  const temCanalizar = tem(aptidoesIds, "canalizar_em_golpe");
  const temCanalizarER = tem(aptidoesIds, "canalizar_energia_reversa");
  if (temCanalizar) {
    estados.push({
      id: "canalizarEmGolpe",
      label: "Canalizar em Golpe",
      tipo: "bool",
      custoPE: Math.max(0, Math.trunc(Number(cl) || 0)),
      ...(temCanalizarER ? { exclusivoCom: ["canalizarEnergiaReversa"] } : {}),
    });
  }
  if (temCanalizarER) {
    estados.push({
      id: "canalizarEnergiaReversa",
      label: "Canalizar Energia Reversa",
      tipo: "bool",
      ...(temCanalizar ? { exclusivoCom: ["canalizarEmGolpe"] } : {}),
    });
  }
  if (tem(aptidoesIds, "canalizacao_maxima")) {
    estados.push({
      id: "canalizacaoMaxima",
      label: "Canalização Máxima",
      tipo: "bool",
      custoPE: 1,
      requerEstado: "canalizarEmGolpe",
    });
  }
  return estados;
}

/* O tipo escolhido na aptidão, saneado contra o que ela PODE oferecer.
   As duas donas (Aura Elemental e Afinidade Ampliada) pedem um tipo ELEMENTAL,
   e até 2026-08-31 o saneamento olhava a tabela inteira. Isso bastava enquanto
   a tabela tinha quatro entradas e o card oferecia as quatro, mas uma ficha
   antiga pode ter Cortante gravado aí, e o card não oferece mais. Sanear pela
   categoria da própria aptidão faz as duas telas dizerem a mesma coisa.

   Sem `categoria` declarada, a tabela inteira segue valendo. */
const escolhaDano = (creature, id) => {
  const escolha = creature?.aptidaoOpcoes?.[id];
  if (!escolha) return null;
  const categoria = getAptidao(id)?.opcoes?.categoria;
  const valido = categoria
    ? tiposDeDanoDaCategoria(categoria).some((x) => x.id === escolha)
    : Object.prototype.hasOwnProperty.call(TIPOS_DANO, escolha);
  return valido ? escolha : null;
};

export function aplicarAptidoesNoDano(dano, creature, combate, ctx = {}) {
  const aptidoesIds = ctx.aptidoesIds ?? [];
  const au = Math.max(0, Math.trunc(Number(ctx.au) || 0));
  const cl = Math.max(0, Math.trunc(Number(ctx.cl) || 0));
  const tipoAura = escolhaDano(creature, "aura_elemental");
  const tipoAfinidade = escolhaDano(creature, "afinidade_ampliada");
  const concentradas = lista(combate?.concentrarAura);
  const desabilitadas = new Set(concentradas);
  const auraAtiva = tem(aptidoesIds, "aura_elemental")
    && !desabilitadas.has("aura_elemental") && !!combate?.auraElemental && !!tipoAura;
  const golpeAuraId = desabilitadas.has("golpe_com_aura") || desabilitadas.has(combate?.golpeComAura)
    ? null
    : combate?.golpeComAura;
  const canaliza = tem(aptidoesIds, "canalizar_em_golpe") && !!combate?.canalizarEmGolpe;
  const maxima = canaliza && tem(aptidoesIds, "canalizacao_maxima") && !!combate?.canalizacaoMaxima;
  // Os dois Canalizar não valem no mesmo ataque. A tela já os troca, e a conta
  // guarda a regra para um estado antigo gravado com os dois ligados.
  const canalizaER = !canaliza && tem(aptidoesIds, "canalizar_energia_reversa") && !!combate?.canalizarEnergiaReversa;
  const bt = Math.max(0, Math.trunc(Number(ctx.bt) || 0));

  return {
    ...dano,
    entradas: lista(dano?.entradas).map((entrada) => {
      const gruposDano = [...gruposDaLinha(entrada)];
      for (const extra of lista(entrada.danoAuxiliar)) {
        gruposDano.push({
          nome: extra.nome,
          dados: extra.dados,
          faces: extra.faces,
          fixo: extra.fixo ?? 0,
          momento: extra.momento ?? "durante",
          multiplica: extra.multiplica !== false && extra.momento !== "apos",
        });
      }
      for (const extra of lista(entrada.imbuir?.escolhido?.rolagens)) {
        gruposDano.push({
          nome: entrada.imbuir.escolhido.nome || "Feitiço Sem Nome",
          dados: extra.dados,
          faces: extra.faces,
          fixo: extra.fixo ?? 0,
          momento: "apos",
          multiplica: false,
        });
      }
      const tipoDano = auraAtiva ? tipoAura : entrada.tipoDano;
      if (auraAtiva) {
        const faces = au >= 5 ? 10 : au >= 3 ? 8 : au >= 2 ? 6 : 4;
        gruposDano.push({
          nome: "Aura Elemental", dados: 1, faces, fixo: 0,
          momento: "durante", multiplica: true, tipoDano: tipoAura,
        });
      }
      if (tem(aptidoesIds, "afinidade_ampliada") && !desabilitadas.has("afinidade_ampliada")
        && tipoAfinidade && tipoDano === tipoAfinidade) {
        gruposDano.push({
          nome: "Afinidade Ampliada", dados: 0, faces: 6, fixo: 1 + au,
          momento: "durante", multiplica: true, tipoDano: tipoAfinidade,
        });
      }
      if (concentradas.length) {
        gruposDano.push({
          nome: "Concentrar Aura", dados: concentradas.length, faces: 8, fixo: 0,
          momento: "apos", multiplica: false,
        });
      }
      /* ⚠ CANALIZAR EM GOLPE NÃO É APÓS ATAQUE (autor, 2026-09-15). O texto é
         "seu próximo ataque causa 1d6 de dano adicional", e ele entrou como Após
         Ataque no commit 93a186c. Rola junto do golpe, dobra no crítico e entra no
         Raio Negro. O fixo da Máxima (o Nível em Aura) segue fixo: não dobra.

         A MÁXIMA COMPRA UM DADO: "Você pode gastar 1PE adicional para Canalizar em
         Golpe", e cada PE gasto é um dado (autor, 2026-09-15). Com CL 5 são 6 PE
         e 6d10. */
      if (canaliza && cl > 0) {
        gruposDano.push({
          nome: maxima ? "Canalização Máxima" : "Canalizar em Golpe",
          dados: cl + (maxima ? 1 : 0),
          faces: maxima ? 10 : tem(aptidoesIds, "canalizacao_avancada") ? 8 : 6,
          fixo: maxima ? au : 0,
          momento: "durante",
          multiplica: true,
        });
      }
      /* "gastar uma quantidade de pontos de energia reversa igual ao seu bônus de
         treinamento [...] para cada ponto gasto, você causa 2d6 de dano de energia
         reversa adicional". Critável e no Raio Negro, como o Canalizar em Golpe
         (autor, 2026-09-15). O alvo ser uma maldição é da mesa: o interruptor só
         liga quando é. */
      if (canalizaER && bt > 0) {
        gruposDano.push({
          nome: "Canalizar Energia Reversa",
          dados: 2 * bt,
          faces: 6,
          fixo: 0,
          momento: "durante",
          multiplica: true,
          tipoDano: "energia_reversa",
        });
      }
      if (golpeAuraId === "aura_lacerante") {
        gruposDano.push({
          nome: "Aura Lacerante", dados: au, faces: au >= 5 ? 10 : au >= 3 ? 8 : 6,
          fixo: Math.trunc(Number(ctx.modTecnica) || 0), momento: "apos", multiplica: false,
        });
      }
      return comFormulasDeDano({
        ...entrada,
        gruposDano,
        tipoDano,
        tipoDanoLabel: tipoDano ? TIPOS_DANO[tipoDano] ?? tipoDano : null,
        golpeComAura: golpeAuraId ? {
          id: golpeAuraId,
          nome: getAptidao(golpeAuraId)?.nome ?? golpeAuraId,
          cd: Math.trunc(Number(ctx.cd) || 0) + au,
        } : null,
      });
    }),
  };
}
