const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./AftyFichaG2-CsGJ7v13.js","./jsx-runtime-BE5SQqEd.js","./EspinhoCard-igRVfu0g.js","./EspinhoCard-D6ZtfUT1.css","./AftyFichaG2-BeAIPXjg.css","./AftyFichaClassica-1FtNy9p2.js"])))=>i.map(i=>d[i]);
import{Fr as e,In as t,Ir as n,Lr as r,Pr as i,t as a}from"./jsx-runtime-BE5SQqEd.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var o=`/* DEMO PAPEL DE ARROZ v1 (revisão G2, 2026-11-05): identidade clara, papel quente com tinta e vermelhão, cantos retos e números em mono.
   Sem !important. Mesma receita do G2: tokens no bloco forte e cada seletor com o prefixo .e-g2. */
:scope#afty-ficha,
#afty-ficha#afty-ficha {
  --afty-fundo: #f3ecdc;
  --afty-fundo-brilho: none;
  --afty-card: #fbf7ec;
  --afty-poco: #ece3cd;
  --afty-borda: #cfc3a4;
  --afty-borda-forte: #2b2418;
  --afty-texto: #1f1a10;
  --afty-texto-suave: #5a4f38;
  --afty-texto-fraco: #7d7156;
  --afty-destaque: #c0391b;
  --afty-destaque-texto: #8f2610;
  --afty-destaque-fundo: #f0c9bd99;
  --afty-pv: #b3261e;
  --afty-pe: #1d5f8a;
  --afty-alma: #6a3c8f;
  --afty-cura: #2f6f3a;
  --afty-aviso: #9a5b00;
  --afty-veu: rgb(40 30 15 / 0.4);
  --afty-sombra: none;
  --afty-raio: 0px;
  --afty-raio-peq: 0px;
  --afty-fonte: ui-sans-serif, system-ui, "Segoe UI", sans-serif;
  --afty-fonte-num: ui-monospace, Consolas, monospace;
}
:scope { color: var(--afty-texto); color-scheme: light; }

.e-g2 { --e-display: ui-monospace, Consolas, "Courier New", monospace; }

/* a placa e os cartões: traço de tinta, sem sombra, sem canto */
.e-g2 .e-cabeca { border: 2px solid var(--afty-borda-forte); border-radius: 0; box-shadow: 4px 4px 0 var(--afty-borda-forte); background: var(--afty-card); }
.e-g2 .afty-nome { color: var(--afty-texto); font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
.e-g2 .afty-card { border: 1.5px solid var(--afty-borda-forte); border-radius: 0; background: var(--afty-card); }
.e-g2 .afty-card-titulo { color: var(--afty-destaque-texto); border-bottom: 2px solid var(--afty-destaque); display: inline-block; padding-bottom: 2px; }
.e-g2 .afty-linha { border-radius: 0; border-color: var(--afty-borda); }

/* números: mono, e o vermelhão marca só o que rola */
.e-g2 .afty-valor { font-family: var(--afty-fonte-num); }
.e-g2 .afty-rolavel { color: var(--afty-destaque-texto); }

/* abas como etiquetas de arquivo */
.e-g2 .afty-aba { text-transform: uppercase; letter-spacing: .08em; font-size: 12px; }
.e-g2 .afty-aba[aria-selected="true"] { color: var(--afty-texto); background: var(--afty-destaque-fundo); box-shadow: inset 0 -3px 0 var(--afty-destaque); }

/* botões e acessos */
.e-g2 .afty-botao { border: 1.5px solid var(--afty-borda-forte); border-radius: 0; }
.e-g2 .f-acesso { border-radius: 0; }
.e-g2 .e-agora { border-radius: 0; }
`,s=`/* DEMO VITRAL v1 (revisão G2, 2026-11-05): identidade escura, índigo profundo com ouro e fonte serifada. Sem !important.
   Segue a receita do G2: tokens no bloco forte, depois cada seletor com o prefixo .e-g2 para empatar a especificidade das regras do G2. */
:scope#afty-ficha,
#afty-ficha#afty-ficha {
  --afty-fundo: #0a0820;
  --afty-fundo-brilho: radial-gradient(90% 55% at 50% -8%, #6d3fd455, transparent 70%);
  --afty-card: #15113a;
  --afty-poco: #0c0a28;
  --afty-borda: #3b2f78;
  --afty-borda-forte: #6a56c4;
  --afty-texto: #f4eefc;
  --afty-texto-suave: #b9aee0;
  --afty-texto-fraco: #8f84bd;
  --afty-destaque: #e6b84a;
  --afty-destaque-texto: #ffd978;
  --afty-destaque-fundo: #5b46108c;
  --afty-pv: #ff5d73;
  --afty-pe: #6fd3ff;
  --afty-alma: #d78cff;
  --afty-cura: #5fe3a8;
  --afty-aviso: #ffcc4d;
  --afty-raio: 4px;
  --afty-raio-peq: 3px;
  --afty-fonte: Georgia, "Times New Roman", serif;
  --afty-fonte-num: "Palatino Linotype", Georgia, serif;
}
:scope { color: var(--afty-texto); color-scheme: dark; }

/* a fonte de títulos e números do G2 nasce de --e-display, que ainda não é um token documentado */
.e-g2 { --e-display: Georgia, "Times New Roman", serif; }

/* cabeçalho e placa: moldura dourada fina */
.e-g2 .e-cabeca { border: 1px solid var(--afty-borda-forte); border-radius: 4px; box-shadow: 0 0 0 3px #0a0820, 0 0 0 4px #e6b84a55; }
.e-g2 .afty-nome { color: var(--afty-destaque-texto); letter-spacing: .02em; font-weight: 700; }

/* cartões: borda com fio dourado em cima, cantos retos */
.e-g2 .afty-card { border: 1px solid var(--afty-borda); border-top: 2px solid var(--afty-destaque); border-radius: 4px; background: color-mix(in srgb, var(--afty-card) 92%, transparent); }
.e-g2 .afty-card-titulo { color: var(--afty-destaque-texto); text-transform: uppercase; letter-spacing: .14em; font-size: 12px; }
.e-g2 .afty-linha { border-radius: 3px; }

/* números: dourado só nos que rolam, para o resto continuar legível */
.e-g2 .afty-rolavel { color: var(--afty-destaque-texto); }

/* abas: sublinhado em ouro */
.e-g2 .afty-aba { letter-spacing: .06em; }
.e-g2 .afty-aba[aria-selected="true"] { color: var(--afty-destaque-texto); box-shadow: inset 0 -2px 0 var(--afty-destaque); }

/* o Agora na Mesa e o Rápido, que não estão no contrato */
.e-g2 .e-agora { border-radius: 4px; }
.e-g2 .f-acesso[aria-pressed="true"] { background: var(--afty-destaque-fundo); border-color: var(--afty-destaque); }

/* impressão: o reset do app NÃO cobre destaque nem recursos, então cada tema escuro refaz os seus */
@media print {
  :scope#afty-ficha, #afty-ficha#afty-ficha {
    --afty-fundo: #fff; --afty-fundo-brilho: none; --afty-card: #fff; --afty-poco: #f4f1ea; --afty-borda: #999; --afty-borda-forte: #666;
    --afty-texto: #000; --afty-texto-suave: #333; --afty-texto-fraco: #555;
    --afty-destaque: #7a5a00; --afty-destaque-texto: #4a3600; --afty-destaque-fundo: #eee;
    --afty-pv: #a00; --afty-pe: #005b99; --afty-alma: #6b2d91; --afty-cura: #0a6b3f; --afty-aviso: #7a5a00;
  }
}
`,c=`:scope#afty-ficha, #afty-ficha#afty-ficha {
  --afty-fundo:#ff00ff; --afty-fundo-brilho:none; --afty-card:#00ff00; --afty-poco:#ffff00; --afty-borda:#ff8800; --afty-borda-forte:#00ffff;
  --afty-texto:#0000ff; --afty-texto-suave:#ff0000; --afty-texto-fraco:#880000; --afty-destaque:#8800ff; --afty-destaque-texto:#ff0088;
  --afty-destaque-fundo:#00880066; --afty-pv:#aa0000; --afty-pe:#0000aa; --afty-pvtemp:#aaaa00; --afty-alma:#00aaaa; --afty-cura:#00aa00;
  --afty-aviso:#aa5500; --afty-raio:0px; --afty-raio-peq:0px; --afty-fonte: Georgia, serif; --afty-fonte-titulo: Georgia, serif; --afty-fonte-num: "Courier New", monospace;
}
`,l=`/* A receita: o MESMO CSS do teste, sem !important, com o prefixo .e-g2 em cada seletor para empatar a especificidade das regras do G2. */
.e-g2 .afty-card { border-color: #e11d48; }
.e-g2 .afty-valor { color: #22d3ee; }
.e-g2 .afty-aba[aria-selected="true"] { color: #22d3ee; }
.e-g2 .afty-nome { color: #22d3ee; }
.e-g2 .afty-cabecalho { border-color: #e11d48; }
`,u=`/* A receita universal: prefixo :is(.e-g2, :scope), que casa qualquer descendente da raiz, com ou sem ancestral .e-g2, e vale (0,2,0). */
:is(.e-g2, :scope) .afty-card { border-color: #e11d48; }
:is(.e-g2, :scope) .afty-valor { color: #22d3ee; }
:is(.e-g2, :scope) .afty-aba[aria-selected="true"] { color: #22d3ee; }
:is(.e-g2, :scope) .afty-nome { color: #22d3ee; }
:is(.e-g2, :scope) .afty-botao { border-color: #e11d48; }
.afty-abas.e-g2 { border-bottom: 2px solid #e11d48; }
`,d=n((e=>{var t=i();e.createRoot=t.createRoot,e.hydrateRoot=t.hydrateRoot})),f=r(e(),1),p=d(),m=a(),h={geradoEm:`2026-10-21T18:05:19.512Z`,origem:`sintéticas, criadas do zero por gerar-fichas.mjs`,fichas:JSON.parse(`{"arsenal":{"system":"afty","rulesVersion":"player","name":"Arsenal (Teste Abas)","portraitUrl":null,"portraitFocus":{"x":50,"y":50},"core":{"tipo":"combatente","patamar":"comum","nd":20,"tamanho":"medio","tecnicaAttr":"inteligencia","tecnicaDescricao":"","tecnicaEfeitos":[],"funcionamentosAdicionais":[],"origem":{"id":"inato"}},"alma":{"atual":100,"max":100},"qntPE":"normal","attrMethod":"fixos","attrLimite":{"forca":20,"destreza":20,"constituicao":20,"inteligencia":20,"sabedoria":20,"presenca":20},"attributes":{"forca":16,"destreza":16,"constituicao":14,"inteligencia":10,"sabedoria":12,"presenca":10},"attrNivel":{"forca":0,"destreza":0,"constituicao":0,"inteligencia":0,"sabedoria":0,"presenca":0},"pericias":{"atletismo":"treinado","percepcao":"mestre","furtividade":"treinado","intuicao":"treinado"},"periciasOrdem":null,"periciasPersonalizadas":[{"id":"custom_navegacao","nome":"Navegação Astral por Constelações Esquecidas","atributo":"sabedoria"}],"periciaOficio":"","periciaOficios":{"oficio":["Ferreiro","Alquimista"],"oficio__2":["Canalizador"]},"periciasOficiosExtras":["oficio__2"],"periciaAtributoManual":{},"periciasBonus":0,"resistenciasProf":{},"trDaClasse":[],"trSegundo":null,"trAtributoManual":{},"ataquesProf":{"corpo":true,"distancia":true},"ataqueFineza":false,"ataqueBasicoId":"corpo","ataqueAtributoManual":{},"armasDedicadas":[],"defesasDano":{},"catarse":{"saldo":0,"compras":[]},"carteira":{"entradas":[],"gastos":[]},"espinho":{"almas":0,"outros":0,"compras":{},"equipamentos":[]},"tecnicasCombate":{"armas":[],"atributo":"inteligencia"},"talentosConfig":{"tal_mestre_das_armas":{"modo":"armas","armas":[],"grupo":null},"tal_tempestade_de_ideias":{"pericia":null,"ferramenta":"","vantagemPericia":null},"tal_artesao_amaldicoado":{"ferramenta":null}},"combate":{"ativo":false,"empolgacao":1,"insistenciaUsada":false,"manobraAjuste":false,"manobraDesarme":false,"manobraEsquiva":false,"manobraTrabalhoDePes":false,"manobraFinalizadora":null,"brutalidade":false,"brutalidadePE":0,"brutalidadePilha":0,"ataqueInconsequente":false,"impactoMisto":false,"resistirPE":0,"furiaVinganca":false,"imprudenciaMotivadora":false,"machucado":false,"abates":0,"armasAbsolutas":null,"auraElemental":true,"concentrarAura":[],"golpeComAura":null,"canalizarEmGolpe":false,"canalizacaoMaxima":false},"equipamentos":{"itens":[{"uid":"abas-besta","tipo":"arma","refId":"armc_besta","qtd":1,"equipado":true},{"uid":"abas-oscilante","tipo":"arma","refId":"armc_oscilante","qtd":1,"equipado":true},{"uid":"abas-ampla","tipo":"arma","refId":"armc_ampla","qtd":1,"equipado":true},{"uid":"abas-modular","tipo":"arma","refId":"armc_modular","qtd":1,"equipado":true},{"uid":"abas-katana-afiada","tipo":"arma","refId":"arm_katana","qtd":1,"equipado":false,"fa":{"grau":"terceiro","encantamentos":["enc_arma_afiada"],"habilidadeUnica":""}},{"uid":"abas-katana-defensora","tipo":"arma","refId":"arm_katana","qtd":1,"equipado":false,"fa":{"grau":"terceiro","encantamentos":["enc_arma_defensora"],"habilidadeUnica":""}},{"uid":"abas-robusto","tipo":"uniforme","refId":"unif_revestimento_robusto","qtd":1,"equipado":true},{"uid":"abas-medio","tipo":"uniforme","refId":"unif_revestimento_medio","qtd":1,"equipado":true},{"uid":"abas-escudo","tipo":"escudo","refId":"esc_medio","qtd":1,"equipado":false},{"uid":"abas-antidoto","tipo":"item","refId":"it_antidoto_simples","qtd":6,"equipado":false},{"uid":"abas-oleo","tipo":"item","refId":"it_oleo_flamejante","qtd":4,"equipado":false},{"uid":"abas-injecao","tipo":"item","refId":"it_injecao_estimulante","qtd":5,"equipado":false},{"uid":"abas-mix","tipo":"item","refId":"it_mix_energetico_pequeno","qtd":8,"equipado":false},{"uid":"abas-brinco","tipo":"item","refId":"it_brinco_da_comunicacao","qtd":1,"equipado":false}]},"armasCustom":[{"id":"armc_besta","nome":"Besta de Repetição de Teste","classe":"simples","categoria":"distancia","dano":{"dado":"1d10","tipo":"pf"},"critico":19,"custo":1,"grupo":"besta","props":{"recarga":1,"emperrar":true}},{"id":"armc_oscilante","nome":"Lâmina Oscilante de Teste","classe":"simples","categoria":"corpo","dano":{"dado":"1d8","tipo":"ct"},"critico":20,"custo":1,"grupo":"espada","props":{"oscilante":true,"energica":true}},{"id":"armc_ampla","nome":"Machado de Guerra Amplo de Teste com um Nome Bem Comprido para Quebrar a Linha","classe":"simples","categoria":"corpo","dano":{"dado":"1d12","tipo":"ct"},"critico":20,"custo":1,"grupo":"machado","props":{"ampla":true,"pesada":18}},{"id":"armc_modular","nome":"Rapieira Modular de Teste","classe":"simples","categoria":"corpo","dano":{"dado":"1d8","tipo":"pf"},"critico":19,"custo":1,"grupo":"espada","props":{"modular":"ct","aparar":true,"apunhaladora":true}}],"forjas":[],"especializacoes":[{"id":"combatente","nivel":20}],"feiticos":[],"reducoesCustoFeitico":{"dominancia":null,"manipulacao":[]},"estilosSombra":[],"estiloFuncionamento":{"texto":"","durabilidadeTrilha":null},"habilidadesGerais":[],"focosLivres":0,"periciaAtributo":"inteligencia","habilidades":["cmb_golpe_especial","cmb_assumir_postura","cmb_ataque_concentrado"],"escolhasHabilidade":{},"especializacaoConfig":{},"escolhasTalento":{},"talentos":[],"invocacoes":[],"origemContadores":{},"hordas":[],"quimeras":[],"fundamentosPerdidos":[],"aptidoes":{"au":0,"cl":0,"bar":0,"dom":0,"er":0},"aptidoesAmaldicoadas":[],"aptidaoOpcoes":{},"aptidaoOpcoesRepetidas":{},"dominios":[],"dominioAtivoId":null,"treinamentos":{},"treinamentoAlvos":{},"treinamentoEscolhas":{},"treinoEscolhaFeiticos":{},"votos":{"contratuais":[],"mecanicos":[]},"pacto":{"nome":"","descricao":"","maleficios":[],"beneficios":[]},"modificacoesCorporais":{"descricao":"","efeitosBase":[],"limite":0,"enxertos":[]},"tita":{"ativo":false,"membros":5},"caracteristicasAmaldicoadas":[],"caracteristicasAmaldicoadasAlvos":{},"treinosEspeciais":[],"treinoEspecialProgresso":{},"focosBonus":0,"statOverrides":{},"melhoriasSuperiores":[],"habilidadesLendarias":[],"escolhasAltoNivel":{},"aparencia":null,"preferenciasFicha":null,"addons":[],"narratorNotes":"","combatState":{"isActive":false,"hpCurrent":0,"peCurrent":0,"almaCurrent":100,"activeConditions":[],"customCounters":[],"combatLog":[]},"id":"teste-abas-arsenal"},"conjurador":{"system":"afty","rulesVersion":"player","name":"Conjurador (Teste Abas)","portraitUrl":null,"portraitFocus":{"x":50,"y":50},"core":{"tipo":"conjurador","patamar":"comum","nd":20,"tamanho":"medio","tecnicaAttr":"inteligencia","tecnicaDescricao":"","tecnicaEfeitos":[],"funcionamentosAdicionais":[],"origem":{"id":"herdado"}},"alma":{"atual":100,"max":100},"qntPE":"normal","attrMethod":"fixos","attrLimite":{"forca":20,"destreza":20,"constituicao":20,"inteligencia":20,"sabedoria":20,"presenca":20},"attributes":{"forca":10,"destreza":10,"constituicao":14,"inteligencia":18,"sabedoria":16,"presenca":12},"attrNivel":{"forca":0,"destreza":0,"constituicao":0,"inteligencia":0,"sabedoria":0,"presenca":0},"pericias":{"feiticaria":"mestre","historia":"treinado","prestidigitacao":"treinado","medicina":"treinado"},"periciasOrdem":null,"periciasPersonalizadas":[],"periciaOficio":"","periciaOficios":{},"periciasOficiosExtras":[],"periciaAtributoManual":{},"periciasBonus":0,"resistenciasProf":{},"trDaClasse":[],"trSegundo":null,"trAtributoManual":{},"ataquesProf":{},"ataqueFineza":false,"ataqueBasicoId":"corpo","ataqueAtributoManual":{},"armasDedicadas":[],"defesasDano":{},"catarse":{"saldo":0,"compras":[]},"carteira":{"entradas":[],"gastos":[]},"espinho":{"almas":0,"outros":0,"compras":{},"equipamentos":[]},"tecnicasCombate":{"armas":[],"atributo":"inteligencia"},"talentosConfig":{"tal_mestre_das_armas":{"modo":"armas","armas":[],"grupo":null},"tal_tempestade_de_ideias":{"pericia":null,"ferramenta":"","vantagemPericia":null},"tal_artesao_amaldicoado":{"ferramenta":null}},"combate":{"ativo":false,"empolgacao":1,"insistenciaUsada":false,"manobraAjuste":false,"manobraDesarme":false,"manobraEsquiva":false,"manobraTrabalhoDePes":false,"manobraFinalizadora":null,"brutalidade":false,"brutalidadePE":0,"brutalidadePilha":0,"ataqueInconsequente":false,"impactoMisto":false,"resistirPE":0,"furiaVinganca":false,"imprudenciaMotivadora":false,"machucado":false,"abates":0,"armasAbsolutas":null,"auraElemental":true,"concentrarAura":[],"golpeComAura":null,"canalizarEmGolpe":false,"canalizacaoMaxima":false},"equipamentos":{"itens":[]},"armasCustom":[],"forjas":[],"especializacoes":[{"id":"conjurador","nivel":10},{"id":"suporte","nivel":10}],"feiticos":[{"id":"tf1","nome":"Lança de Gelo de Teste","tipo":"dano","nivel":3,"conjuracaoTexto":"","descricao":"Texto de teste da prévia (Lança de Gelo de Teste). **Negrito** de marcação rica, e uma segunda frase para medir a leitura.","variacaoDeTecnica":false,"variacaoDe":null,"resolucao":"ataque","alvo":"unico","formaArea":"esfera","acao":"comum","subtipo":"nenhum","trocas":{"dados":0,"acerto":0,"cd":0,"alcance":0,"area":0,"empurraoDados":0},"condicoes":[],"sangramento":null,"requisito":null,"focoCondicao":false,"disparos":2,"continuoModo":"sustentado","ignorarResistencias":false,"morteDireta":false,"remocao":"nenhuma","especialSubtipo":"golpeador","golpesGolpeador":1,"tecnicaInvisibilidade":false,"fraquezaInvis":"","itemCusto":1,"itemGrauTroca":0,"tecnicaFocoItens":false,"itemNatureza":"consumivel","itemDescricao":"","shikigamiInvocacaoId":null,"transfAcao":"comum","transfDuracao":"sustentada","transfNivelTroca":0,"transfCustoVida":false,"transfEfeitos":[],"efeitoAux":"defesa","alvoAuxAtributo":"forca","alvoAuxTR":"reflexos","alvoAuxPericia":null,"permuta":null,"duracaoAux":"imediata","rodadasDur":1,"alvosAux":1,"concentracaoAux":false,"concUsoAux":"alvos","acaoAux":"padrao","umGolpe":false,"tiposDanoExtra":0,"alcancePropria":false,"multiplosAtivo":false,"duracaoMult":"imediata","rodadasMult":1,"acaoMult":"padrao","alvosMult":1,"efeitosMult":[],"categoriaPassivo":"","alvoPassivoAtributo":"forca","alvoPassivoTR":"reflexos","alvoPassivoPericia":"percepcao","tiposDanoExtraPassivo":0,"efeitosPassivo":[],"acaoPersonalizada":"","alcanceTexto":"","alvoTexto":"","duracaoTexto":"","resolucaoTexto":"","comCd":true,"rolagens":[],"custoPETexto":"","custoVidaAtivacao":null},{"id":"tf2","nome":"Tempestade Contínua de Teste","tipo":"dano","nivel":4,"conjuracaoTexto":"","descricao":"Texto de teste da prévia (Tempestade Contínua de Teste). **Negrito** de marcação rica, e uma segunda frase para medir a leitura.","variacaoDeTecnica":false,"variacaoDe":null,"resolucao":"tr","alvo":"unico","formaArea":"esfera","acao":"comum","subtipo":"continuo","trocas":{"dados":0,"acerto":0,"cd":0,"alcance":0,"area":0,"empurraoDados":0},"condicoes":[],"sangramento":null,"requisito":null,"focoCondicao":false,"disparos":2,"continuoModo":"sustentado","ignorarResistencias":false,"morteDireta":false,"remocao":"nenhuma","especialSubtipo":"golpeador","golpesGolpeador":1,"tecnicaInvisibilidade":false,"fraquezaInvis":"","itemCusto":1,"itemGrauTroca":0,"tecnicaFocoItens":false,"itemNatureza":"consumivel","itemDescricao":"","shikigamiInvocacaoId":null,"transfAcao":"comum","transfDuracao":"sustentada","transfNivelTroca":0,"transfCustoVida":false,"transfEfeitos":[],"efeitoAux":"defesa","alvoAuxAtributo":"forca","alvoAuxTR":"reflexos","alvoAuxPericia":null,"permuta":null,"duracaoAux":"imediata","rodadasDur":1,"alvosAux":1,"concentracaoAux":false,"concUsoAux":"alvos","acaoAux":"padrao","umGolpe":false,"tiposDanoExtra":0,"alcancePropria":false,"multiplosAtivo":false,"duracaoMult":"imediata","rodadasMult":1,"acaoMult":"padrao","alvosMult":1,"efeitosMult":[],"categoriaPassivo":"","alvoPassivoAtributo":"forca","alvoPassivoTR":"reflexos","alvoPassivoPericia":"percepcao","tiposDanoExtraPassivo":0,"efeitosPassivo":[],"acaoPersonalizada":"","alcanceTexto":"","alvoTexto":"","duracaoTexto":"","resolucaoTexto":"","comCd":true,"rolagens":[],"custoPETexto":"","custoVidaAtivacao":null},{"id":"tf3","nome":"Disparos Múltiplos de Teste","tipo":"dano","nivel":2,"conjuracaoTexto":"","descricao":"Texto de teste da prévia (Disparos Múltiplos de Teste). **Negrito** de marcação rica, e uma segunda frase para medir a leitura.","variacaoDeTecnica":false,"variacaoDe":null,"resolucao":"ataque","alvo":"unico","formaArea":"esfera","acao":"comum","subtipo":"multiplos","trocas":{"dados":0,"acerto":0,"cd":0,"alcance":0,"area":0,"empurraoDados":0},"condicoes":[],"sangramento":null,"requisito":null,"focoCondicao":false,"disparos":3,"continuoModo":"sustentado","ignorarResistencias":false,"morteDireta":false,"remocao":"nenhuma","especialSubtipo":"golpeador","golpesGolpeador":1,"tecnicaInvisibilidade":false,"fraquezaInvis":"","itemCusto":1,"itemGrauTroca":0,"tecnicaFocoItens":false,"itemNatureza":"consumivel","itemDescricao":"","shikigamiInvocacaoId":null,"transfAcao":"comum","transfDuracao":"sustentada","transfNivelTroca":0,"transfCustoVida":false,"transfEfeitos":[],"efeitoAux":"defesa","alvoAuxAtributo":"forca","alvoAuxTR":"reflexos","alvoAuxPericia":null,"permuta":null,"duracaoAux":"imediata","rodadasDur":1,"alvosAux":1,"concentracaoAux":false,"concUsoAux":"alvos","acaoAux":"padrao","umGolpe":false,"tiposDanoExtra":0,"alcancePropria":false,"multiplosAtivo":false,"duracaoMult":"imediata","rodadasMult":1,"acaoMult":"padrao","alvosMult":1,"efeitosMult":[],"categoriaPassivo":"","alvoPassivoAtributo":"forca","alvoPassivoTR":"reflexos","alvoPassivoPericia":"percepcao","tiposDanoExtraPassivo":0,"efeitosPassivo":[],"acaoPersonalizada":"","alcanceTexto":"","alvoTexto":"","duracaoTexto":"","resolucaoTexto":"","comCd":true,"rolagens":[],"custoPETexto":"","custoVidaAtivacao":null},{"id":"tf4","nome":"Muralha Sagrada de Teste","tipo":"auxiliar","nivel":2,"conjuracaoTexto":"","descricao":"Texto de teste da prévia (Muralha Sagrada de Teste). **Negrito** de marcação rica, e uma segunda frase para medir a leitura.","variacaoDeTecnica":false,"variacaoDe":null,"resolucao":"tr","alvo":"unico","formaArea":"esfera","acao":"comum","subtipo":"nenhum","trocas":{"dados":0,"acerto":0,"cd":0,"alcance":0,"area":0,"empurraoDados":0},"condicoes":[],"sangramento":null,"requisito":null,"focoCondicao":false,"disparos":2,"continuoModo":"sustentado","ignorarResistencias":false,"morteDireta":false,"remocao":"nenhuma","especialSubtipo":"golpeador","golpesGolpeador":1,"tecnicaInvisibilidade":false,"fraquezaInvis":"","itemCusto":1,"itemGrauTroca":0,"tecnicaFocoItens":false,"itemNatureza":"consumivel","itemDescricao":"","shikigamiInvocacaoId":null,"transfAcao":"comum","transfDuracao":"sustentada","transfNivelTroca":0,"transfCustoVida":false,"transfEfeitos":[],"efeitoAux":"defesa","alvoAuxAtributo":"forca","alvoAuxTR":"reflexos","alvoAuxPericia":null,"permuta":null,"duracaoAux":"imediata","rodadasDur":1,"alvosAux":1,"concentracaoAux":false,"concUsoAux":"alvos","acaoAux":"padrao","umGolpe":false,"tiposDanoExtra":0,"alcancePropria":false,"multiplosAtivo":false,"duracaoMult":"imediata","rodadasMult":1,"acaoMult":"padrao","alvosMult":1,"efeitosMult":[],"categoriaPassivo":"","alvoPassivoAtributo":"forca","alvoPassivoTR":"reflexos","alvoPassivoPericia":"percepcao","tiposDanoExtraPassivo":0,"efeitosPassivo":[],"acaoPersonalizada":"","alcanceTexto":"","alvoTexto":"","duracaoTexto":"","resolucaoTexto":"","comCd":true,"rolagens":[],"custoPETexto":"","custoVidaAtivacao":null},{"id":"tf5","nome":"Bênção Restauradora de Teste","tipo":"curativo","nivel":3,"conjuracaoTexto":"","descricao":"Texto de teste da prévia (Bênção Restauradora de Teste). **Negrito** de marcação rica, e uma segunda frase para medir a leitura.","variacaoDeTecnica":false,"variacaoDe":null,"resolucao":"tr","alvo":"unico","formaArea":"esfera","acao":"comum","subtipo":"nenhum","trocas":{"dados":0,"acerto":0,"cd":0,"alcance":0,"area":0,"empurraoDados":0},"condicoes":[],"sangramento":null,"requisito":null,"focoCondicao":false,"disparos":2,"continuoModo":"sustentado","ignorarResistencias":false,"morteDireta":false,"remocao":"nenhuma","especialSubtipo":"golpeador","golpesGolpeador":1,"tecnicaInvisibilidade":false,"fraquezaInvis":"","itemCusto":1,"itemGrauTroca":0,"tecnicaFocoItens":false,"itemNatureza":"consumivel","itemDescricao":"","shikigamiInvocacaoId":null,"transfAcao":"comum","transfDuracao":"sustentada","transfNivelTroca":0,"transfCustoVida":false,"transfEfeitos":[],"efeitoAux":"defesa","alvoAuxAtributo":"forca","alvoAuxTR":"reflexos","alvoAuxPericia":null,"permuta":null,"duracaoAux":"imediata","rodadasDur":1,"alvosAux":1,"concentracaoAux":false,"concUsoAux":"alvos","acaoAux":"padrao","umGolpe":false,"tiposDanoExtra":0,"alcancePropria":false,"multiplosAtivo":false,"duracaoMult":"imediata","rodadasMult":1,"acaoMult":"padrao","alvosMult":1,"efeitosMult":[],"categoriaPassivo":"","alvoPassivoAtributo":"forca","alvoPassivoTR":"reflexos","alvoPassivoPericia":"percepcao","tiposDanoExtraPassivo":0,"efeitosPassivo":[],"acaoPersonalizada":"","alcanceTexto":"","alvoTexto":"","duracaoTexto":"","resolucaoTexto":"","comCd":true,"rolagens":[],"custoPETexto":"","custoVidaAtivacao":null},{"id":"tf6","nome":"Ruptura Vital de Teste","tipo":"dano","nivel":"max","conjuracaoTexto":"","descricao":"Texto de teste da prévia (Ruptura Vital de Teste). **Negrito** de marcação rica, e uma segunda frase para medir a leitura.","variacaoDeTecnica":false,"variacaoDe":null,"resolucao":"tr","alvo":"area","formaArea":"cone","acao":"completa","subtipo":"nenhum","trocas":{"dados":0,"acerto":0,"cd":0,"alcance":0,"area":0,"empurraoDados":0},"condicoes":[],"sangramento":null,"requisito":null,"focoCondicao":false,"disparos":2,"continuoModo":"sustentado","ignorarResistencias":false,"morteDireta":false,"remocao":"nenhuma","especialSubtipo":"golpeador","golpesGolpeador":1,"tecnicaInvisibilidade":false,"fraquezaInvis":"","itemCusto":1,"itemGrauTroca":0,"tecnicaFocoItens":false,"itemNatureza":"consumivel","itemDescricao":"","shikigamiInvocacaoId":null,"transfAcao":"comum","transfDuracao":"sustentada","transfNivelTroca":0,"transfCustoVida":false,"transfEfeitos":[],"efeitoAux":"defesa","alvoAuxAtributo":"forca","alvoAuxTR":"reflexos","alvoAuxPericia":null,"permuta":null,"duracaoAux":"imediata","rodadasDur":1,"alvosAux":1,"concentracaoAux":false,"concUsoAux":"alvos","acaoAux":"padrao","umGolpe":false,"tiposDanoExtra":0,"alcancePropria":false,"multiplosAtivo":false,"duracaoMult":"imediata","rodadasMult":1,"acaoMult":"padrao","alvosMult":1,"efeitosMult":[],"categoriaPassivo":"","alvoPassivoAtributo":"forca","alvoPassivoTR":"reflexos","alvoPassivoPericia":"percepcao","tiposDanoExtraPassivo":0,"efeitosPassivo":[],"acaoPersonalizada":"","alcanceTexto":"","alvoTexto":"","duracaoTexto":"","resolucaoTexto":"","comCd":true,"rolagens":[],"custoPETexto":"","custoVidaAtivacao":{"modo":"percentualAtual","percentual":50,"minimo":1,"somaAoDano":true},"regraTecnicaMaxima":"oficial"}],"reducoesCustoFeitico":{"dominancia":null,"manipulacao":[]},"estilosSombra":[],"estiloFuncionamento":{"texto":"","durabilidadeTrilha":null},"habilidadesGerais":[],"focosLivres":0,"periciaAtributo":"inteligencia","habilidades":["cnj_dominio_dos_fundamentos","cnj_conjuracao_aprimorada","cnj_adiantar_a_evolucao","cnj_foco_amaldicoado","cnj_abastecido_pelo_sangue","cnj_conhecimento_aplicado","cnj_conjuracao_defensiva","cnj_economia_de_energia","cnj_explosao_encadeada","cnj_finta_amaldicoada","cnj_mente_placida","cnj_nova_habilidade","cnj_perturbacao_amaldicoada","cnj_reacao_rapida","cnj_reforco_amaldicoado","cnj_sobrecarregar","cnj_tecnicas_de_combate","cnj_zelo_recompensador","cnj_ate_a_ultima_gota","cnj_ciclagem_maldita","cnj_determinacao_energizada","cnj_energia_focalizada","cnj_energia_inacabavel","cnj_epifania_amaldicoada","cnj_explosao_defensiva","cnj_feitico_favorito","cnj_feiticos_refinados","cnj_movimentos_imprevisiveis","cnj_naturalidade_com_rituais","cnj_preparacao_de_tecnicas","cnj_olhar_preciso","cnj_sacrificio_pela_energia","cnj_versatilidade_em_fundamentos","cnj_agilidade_no_campo_de_batalha","cnj_bastiao_interior","cnj_combate_amaldicoado","cnj_correcao","cnj_dominancia_em_feitico","cnj_elevar_aptidao","cnj_especializacao","cnj_incapaz_de_falhar","cnj_mente_repartida","cnj_nivel_perfeito","cnj_passo_rapido","cnj_potencia_concentrada","cnj_ritualista","cnj_expansao_dos_fundamentos","cnj_fisico_amaldicoado_defensivo","cnj_imbuir_com_tecnica","cnj_mira_aperfeicoada","cnj_primeiro_disparo","cnj_revestimento_constante","cnj_sustentacao_avancada","cnj_destruicao_ampla","cnj_destruicao_focada","cnj_economia_de_energia_avancada","cnj_sentidos_agucados","sup_suporte_em_combate","sup_presenca_inspiradora","sup_versatilidade","sup_energia_reversa","sup_liberacao_de_energia_reversa","sup_medicina_infalivel","sup_amizade_inquebravel","sup_analise_profunda","sup_apoio_avancado","sup_conceder_outra_chance","sup_comando_motivador","sup_desvendar_terreno","sup_expandir_repertorio","sup_mobilidade_avancada","sup_otimizacao_de_espaco","sup_pronto_para_agir","sup_protetor","sup_tecnicas_de_combate","sup_transmitir_conhecimento","sup_apoios_versateis","sup_guarda_sincronizada","sup_inspirar_aliados","sup_intervencao","sup_negacao_critica","sup_no_ultimo_segundo","sup_pre_analise","sup_recompensa_pelo_sucesso","sup_sintonizacao_vital","sup_contra_ataque","sup_cura_avancada_em_grupo","sup_devolver_na_mesma_moeda","sup_disseminar_cura","sup_incitar_vigor","sup_inimigo_comum","sup_posicionamento_estrategico","sup_aptidoes_de_suporte","sup_contaminar_com_determinacao","sup_criar_medicina","sup_cura_aperfeicoada","sup_elevar_sucesso","sup_fisico_controlado","sup_motivacao_pelo_triunfo","sup_pressao_do_medico","sup_sustentacao_avancada","sup_descarga_reanimadora","sup_necessidade_de_continuar","sup_olhar_agucado","sup_taticas_defensivas"],"escolhasHabilidade":{},"especializacaoConfig":{},"escolhasTalento":{},"talentos":[],"invocacoes":[],"origemContadores":{},"hordas":[],"quimeras":[],"fundamentosPerdidos":[],"aptidoes":{"au":2,"cl":3,"bar":4,"dom":4,"er":3},"aptidoesAmaldicoadas":["tecnicas_de_barreira","expansao_de_dominio_incompleta","expansao_de_dominio_completa","tecnica_maxima","energia_reversa","cortina"],"aptidaoOpcoes":{},"aptidaoOpcoesRepetidas":{},"dominios":[{"id":"abas-d1","nome":"Jardim das Mil Lâminas de Teste","versao":"completa","regra":"oficial","efeitos":[]},{"id":"abas-d2","nome":"Recinto Incompleto de Teste","versao":"incompleta","regra":"oficial","efeitos":[]}],"dominioAtivoId":null,"treinamentos":{},"treinamentoAlvos":{},"treinamentoEscolhas":{},"treinoEscolhaFeiticos":{},"votos":{"contratuais":[],"mecanicos":[]},"pacto":{"nome":"","descricao":"","maleficios":[],"beneficios":[]},"modificacoesCorporais":{"descricao":"","efeitosBase":[],"limite":0,"enxertos":[]},"tita":{"ativo":false,"membros":5},"caracteristicasAmaldicoadas":[],"caracteristicasAmaldicoadasAlvos":{},"treinosEspeciais":[],"treinoEspecialProgresso":{},"focosBonus":0,"statOverrides":{},"melhoriasSuperiores":[],"habilidadesLendarias":[],"escolhasAltoNivel":{},"aparencia":null,"preferenciasFicha":null,"addons":[],"narratorNotes":"","combatState":{"isActive":false,"hpCurrent":0,"peCurrent":0,"almaCurrent":100,"activeConditions":[],"customCounters":[],"combatLog":[]},"id":"teste-abas-conjurador"},"mesa":{"system":"afty","rulesVersion":"player","name":"Mesa Cheia (Teste Abas)","portraitUrl":null,"portraitFocus":{"x":50,"y":50},"core":{"tipo":"conjurador","patamar":"comum","nd":20,"tamanho":"medio","tecnicaAttr":"inteligencia","tecnicaDescricao":"","tecnicaEfeitos":[],"funcionamentosAdicionais":[],"origem":{"id":"herdado"},"olhosAgulhaRestantes":2},"alma":{"atual":100,"max":100},"qntPE":"normal","attrMethod":"fixos","attrLimite":{"forca":20,"destreza":20,"constituicao":20,"inteligencia":20,"sabedoria":20,"presenca":20},"attributes":{"forca":14,"destreza":14,"constituicao":14,"inteligencia":10,"sabedoria":14,"presenca":10},"attrNivel":{"forca":0,"destreza":0,"constituicao":0,"inteligencia":0,"sabedoria":0,"presenca":0},"pericias":{},"periciasOrdem":null,"periciasPersonalizadas":[],"periciaOficio":"","periciaOficios":{},"periciasOficiosExtras":[],"periciaAtributoManual":{},"periciasBonus":0,"resistenciasProf":{},"trDaClasse":[],"trSegundo":null,"trAtributoManual":{},"ataquesProf":{},"ataqueFineza":false,"ataqueBasicoId":"corpo","ataqueAtributoManual":{},"armasDedicadas":[],"defesasDano":{},"catarse":{"saldo":0,"compras":[]},"carteira":{"entradas":[],"gastos":[]},"espinho":{"almas":0,"outros":0,"compras":{},"equipamentos":[]},"tecnicasCombate":{"armas":[],"atributo":"inteligencia"},"talentosConfig":{"tal_mestre_das_armas":{"modo":"armas","armas":[],"grupo":null},"tal_tempestade_de_ideias":{"pericia":null,"ferramenta":"","vantagemPericia":null},"tal_artesao_amaldicoado":{"ferramenta":null}},"combate":{"ativo":false,"empolgacao":1,"insistenciaUsada":false,"manobraAjuste":false,"manobraDesarme":false,"manobraEsquiva":false,"manobraTrabalhoDePes":false,"manobraFinalizadora":null,"brutalidade":false,"brutalidadePE":0,"brutalidadePilha":0,"ataqueInconsequente":false,"impactoMisto":false,"resistirPE":0,"furiaVinganca":false,"imprudenciaMotivadora":false,"machucado":false,"abates":0,"armasAbsolutas":null,"auraElemental":true,"concentrarAura":[],"golpeComAura":null,"canalizarEmGolpe":false,"canalizacaoMaxima":false},"equipamentos":{"itens":[{"uid":"abas-azamaru","tipo":"arma","refId":"azamaru:azamaru","qtd":1,"equipado":true}]},"armasCustom":[],"forjas":[],"especializacoes":[{"id":"conjurador","nivel":10},{"id":"combatente","nivel":10}],"feiticos":[{"id":"manipulacao-do-ceu:refletir_imagem","nome":"Refletir Imagem","tipo":"personalizado","nivel":5,"descricao":"Você altera o tecido do céu, alterando a forma como a luz se propaga em si próprio, fazendo ela refletir duas imagens perfeitamente idênticas a você, como clones, que perturbam a percepção de inimigos sobre o real. Essa habilidade não afeta alvos cegos ou que não dependam dos olhos para enxergar. Ao criar os dois clones eles duram enquanto você se mantiver concentrando a habilidade, sempre que for alvo de um efeito que cause dano o oponente deve realizar um TR de Astúcia, num fracasso ele acerta uma de suas cópias e você anula o ataque, com o céu sendo distorcido e a cópia atingida sendo dissipada. Além de serem dissipadas caso você pare de se concentrar ou caso falhem no TR, você precisa gastar 2 PE no início de cada um de seus turnos para manter as imagens, se durante o intervalo entre turnos você receber um ataque, ambas as cópias são desfeitas e a habilidade se encerra, caso seja alvo de um efeito em área, ambas as cópias são desfeitas e a habilidade se encerra.","resolucao":"tr","acaoPersonalizada":"Comum","alcanceTexto":"Pessoal","alvoTexto":"Próprio","duracaoTexto":"Sustentado, Concentração","resolucaoTexto":"","comCd":true},{"id":"olhos-de-agulha:olhar","nome":"Olhar que Não Falha","tipo":"passivo","nivel":4,"descricao":"A quantidade de Vantagens passa a ser BT vezes por descanso longo, pode realizar um teste de percepção com vantagem. Seu PE Máximo diminui em 8.","efeitosPassivo":[],"variacaoDe":null},{"id":"tf7","nome":"Dardo Simples de Teste","tipo":"dano","nivel":1,"conjuracaoTexto":"","descricao":"Texto de teste da prévia (Dardo Simples de Teste). **Negrito** de marcação rica, e uma segunda frase para medir a leitura.","variacaoDeTecnica":false,"variacaoDe":null,"resolucao":"ataque","alvo":"unico","formaArea":"esfera","acao":"comum","subtipo":"nenhum","trocas":{"dados":0,"acerto":0,"cd":0,"alcance":0,"area":0,"empurraoDados":0},"condicoes":[],"sangramento":null,"requisito":null,"focoCondicao":false,"disparos":2,"continuoModo":"sustentado","ignorarResistencias":false,"morteDireta":false,"remocao":"nenhuma","especialSubtipo":"golpeador","golpesGolpeador":1,"tecnicaInvisibilidade":false,"fraquezaInvis":"","itemCusto":1,"itemGrauTroca":0,"tecnicaFocoItens":false,"itemNatureza":"consumivel","itemDescricao":"","shikigamiInvocacaoId":null,"transfAcao":"comum","transfDuracao":"sustentada","transfNivelTroca":0,"transfCustoVida":false,"transfEfeitos":[],"efeitoAux":"defesa","alvoAuxAtributo":"forca","alvoAuxTR":"reflexos","alvoAuxPericia":null,"permuta":null,"duracaoAux":"imediata","rodadasDur":1,"alvosAux":1,"concentracaoAux":false,"concUsoAux":"alvos","acaoAux":"padrao","umGolpe":false,"tiposDanoExtra":0,"alcancePropria":false,"multiplosAtivo":false,"duracaoMult":"imediata","rodadasMult":1,"acaoMult":"padrao","alvosMult":1,"efeitosMult":[],"categoriaPassivo":"","alvoPassivoAtributo":"forca","alvoPassivoTR":"reflexos","alvoPassivoPericia":"percepcao","tiposDanoExtraPassivo":0,"efeitosPassivo":[],"acaoPersonalizada":"","alcanceTexto":"","alvoTexto":"","duracaoTexto":"","resolucaoTexto":"","comCd":true,"rolagens":[],"custoPETexto":"","custoVidaAtivacao":null}],"reducoesCustoFeitico":{"dominancia":null,"manipulacao":[]},"estilosSombra":[],"estiloFuncionamento":{"texto":"","durabilidadeTrilha":null},"habilidadesGerais":[],"focosLivres":0,"periciaAtributo":"inteligencia","habilidades":["cmb_golpe_especial","cmb_assumir_postura","cmb_ataque_concentrado","cmb_repertorio_do_especialista","cmb_artes_do_combate"],"escolhasHabilidade":{},"especializacaoConfig":{},"escolhasTalento":{},"talentos":[],"invocacoes":[],"origemContadores":{},"hordas":[],"quimeras":[],"fundamentosPerdidos":[],"aptidoes":{"au":2,"cl":4,"bar":0,"dom":3,"er":0},"aptidoesAmaldicoadas":["aura_embacada"],"aptidaoOpcoes":{},"aptidaoOpcoesRepetidas":{},"dominios":[],"dominioAtivoId":null,"treinamentos":{"sombras:treino_escudo_protetor":1},"treinamentoAlvos":{},"treinamentoEscolhas":{},"treinoEscolhaFeiticos":{},"votos":{"contratuais":[],"mecanicos":[]},"pacto":{"nome":"","descricao":"","maleficios":[],"beneficios":[]},"modificacoesCorporais":{"descricao":"","efeitosBase":[],"limite":0,"enxertos":[]},"tita":{"ativo":false,"membros":5},"caracteristicasAmaldicoadas":[],"caracteristicasAmaldicoadasAlvos":{},"treinosEspeciais":[],"treinoEspecialProgresso":{},"focosBonus":0,"statOverrides":{},"melhoriasSuperiores":[],"habilidadesLendarias":[],"escolhasAltoNivel":{},"aparencia":null,"preferenciasFicha":null,"addons":[{"id":"the-crimsom-queen","nome":"The Crimsom Queen","versao":"1.0.0","autor":"Afty, O Sem Sombras","paraRaw":"afty","descricao":"Restrição Congênita: Bloodfeast","permite":["bloodfeast"],"bloodfeast":{"descricao":"Restrição Congênita: Bloodfeast Você é uma maldição, um ser feito inteiramente de energia. Ou, pelo menos deveria ser assim! A combinação de técnicas e raças de seus pais criaram algo único, um ser completamente diferente dos demais. Seu corpo é feito inteiramente de energia, porém sua energia é sangue e sangue é sua energia, em um mix perfeito entre humanidade e maldição. Malefícios Como uma maldição vampírica, seu corpo tem as seguintes limitações: - Você se torna vulnerável a dano de Energia Reversa e Radiante. - Enquanto em contato direto com Água Corrente ou Chuva, você fica sobre a condição \\"Exposto\\" e “Abalado”. - Você não pode ser curada por nenhuma fonte externa que não seja sua, fazendo com que itens como 'Pote do Espírito Curandeiro' e 'Laço da Vida' não tenham efeitos em seu corpo, e que suportes não possam te curar. Benefícios Seu corpo funciona de forma diferente do normal, gastando sangue ao invés de energia. Fazendo com que sua energia seja sempre convertida em sangue . - Você converte todos os seus pontos de energia amaldiçoada para pontos de vida (3 PVs equivalem a 1 PM). Todos os seus gastos de energia são convertidos para gastos de vida e qualquer forma de regeneração de pontos de energia que você fosse ter, é convertido em recuperação de vida. - Você recebe acesso às Aptidões de Anatomia, e recebe uma Aptidão de Anatomia. - Você recebe vantagem nos Portões da Morte. ","passivas":[{"id":"ultima_gota","nome":"Até a Última Gota","nivel":0,"custoPV":0,"descricao":"Até a Última Gota Habilidade Passiva de Nível 0 A falta de sangue pode ser nociva e mortal para maioria dos seres, porém você consegue continuar mesmo em casos extremos. Seus pontos de vida não podem ser baixados para abaixo de 1 por uso de suas Habilidades e Aptidões. Entretanto, para cada 3 Pontos de Vida consumidos além do limite desta forma você recebe 1 Ponto de Sanidade. Além disso, você soma seu modificador de Constituição em Testes no Portão da Morte."},{"id":"bloodfeast","nome":"Bloodfeast","nivel":0,"custoPV":0,"descricao":"Bloodfeast Habilidade Passiva de Nível 0 Para cada Ponto de Vida perdido na cena por Bleed, você recebe uma carga de Bloodfeast. Todas as suas habilidades de técnica consomem obrigatoriamente uma quantidade de Bloodfeast igual a (Nível da Habilidade * Maestria). Caso você não tenha Bloodfeast o suficiente a Habilidade é usada indiferentemente, porém você recebe o Nível da Habilidade como Cargas de Bleed em si mesmo."},{"id":"hardblood","nome":"Hardblood","nivel":0,"custoPV":0,"descricao":"Hardblood Habilidade Passiva de Nível 0 Para cada vez que você consumir uma quantidade de Bloodfeast igual ou maior que seu bônus de maestria, você recebe uma carga de Hardblood, que dura até o final da cena. Ao conjurar uma Habilidade de Técnica, você pode gastar uma quantidade Hardblood limitada ao seu bônus de maestria para aplicar os seguintes efeitos: • Aumento de Dano: Para cada ponto de Hardblood consumido, você pode adicionar 1 dado de dano à habilidade. • Aumento de Alcance ou Área: Para cada ponto de Hardblood consumido, você pode aumentar o alcance em 3 metros ou a área em 1,5 metros. • Bônus em Acerto: Para cada ponto de Hardblood consumido, você pode adicionar +1 na rolagem de acerto com a habilidade. • Aumento de CD: Para cada ponto de Hardblood consumido, você pode aumentar a CD da habilidade em 1. • Bônus em Auxiliar: Para cada ponto de Hardblood consumida, você pode aumentar os benefícios numéricos da habilidade (aumento de CA, RD, bônus em rolagem etc.) aumentado em um valor igual a 1. Algumas habilidades específicas podem também utilizar Hardblood em seu funcionamento."},{"id":"robustez","nome":"Robustez","nivel":0,"custoPV":0,"descricao":"Robustez Habilidade Passiva de Nível 0 Sua robustez é muito acima do comum, fazendo com que você tenha uma vitalidade muito maior do que qualquer humano ou maldição. Você recebe o talento “Robustez Aprimorada”."},{"id":"pureza","nome":"Pureza Sanguínea","nivel":1,"custoPV":6,"descricao":"Pureza Sanguínea Habilidade Passiva de Nível 1 Seu sangue cristalizado segue um fluxo quase perfeito dentro do seu corpo, sendo capaz de expulsar e remover a maioria das impurezas. Você se torna imune a condição Envenenado e passa a ter resistência contra dano Venenoso. Seus Pontos de Vida máximo diminuem em 6."},{"id":"mais_sangue","nome":"Mais Sangue","nivel":4,"custoPV":24,"descricao":"Mais Sangue Habilidade Passiva de Nível 1 Suas marcas de Bleed já são extremamente letais, porém você aprendeu como intensificar isso ainda mais. Quando aplica Bleed a inimigos com Sangramento Leve, você causa uma carga de Bleed adicional. Seus Pontos de Vida máximo diminuem em 6. - Nível 2: Assim como acima, porém adicionar “Quando ataca inimigos com Sangramento Médio, você causa duas cargas de Bleed adicionais. Seus Pontos de Vida Máximo diminuem em 12.” - Nível 3: Assim como acima, porém adicionar “Quando ataca inimigos com Sangramento Forte, você causa três cargas de Bleed adicionais. Seus Pontos de Vida Máximo diminuem em 18.” - Nível 4: Assim como acima, porém adicionar “Quando ataca inimigos com Sangramento Extremo, você causa quatro cargas de Bleed adicionais. Seus Pontos de Vida Máximo diminuem em 24.”"},{"id":"hemofagia","nome":"Hemofagia","nivel":5,"custoPV":30,"descricao":"Hemofagia Habilidade Passiva de Nível 1 As feridas de seus oponentes mexem com você, te fortalecem e recuperam parte dos danos sofridos em combate. Sempre que causar dano a um oponente com uma Habilidade de Técnica, você recupera 1d6 Pontos de Vida. Seus Pontos de Vida máximo diminuem em 6. - Nível 2: Assim como acima, porém recupera 2d6 Pontos de Vida. Seus Pontos de Vida máximo diminuem em 12. - Nível 3: Assim como acima, porém recupera 2d10 Pontos de Vida. Seus Pontos de Vida máximo diminuem em 18. - Nível 4: Assim como acima, porém recupera 4d8 Pontos de Vida. Seus Pontos de Vida máximo diminuem em 24. - Nível 5: Assim como acima, porém recupera 7d8 Pontos de Vida. Seus Pontos de Vida máximo diminuem em 30."},{"id":"mircalla_passiva","nome":"Yearning Mircalla","nivel":4,"custoPV":24,"descricao":"Yearning Mircalla Habilidade Passiva de Nível 2 Uma quantidade de vezes igual ao seu bônus de maestria por descanso, caso você vá perder a concentração da habilidade Yearning Mircalla, você consegue manter a concentração de maneira forçada. Seus Pontos de Vida máximo diminuem em 12. - Nível 4: A habilidade Yearning Mircalla deixa de precisar ser concentrada, só mantendo o preço da sustentação e você pode invocá-la como Ação Livre. Seus Pontos de Vida máximo diminuem em 24."},{"id":"ciclagem","nome":"Ciclagem Sanguínea","nivel":2,"custoPV":12,"descricao":"Ciclagem Sanguínea Habilidade Passiva de Nível 2 Você se torna capaz de manter uma ciclagem do seu sangue que está fora do seu corpo, reduzindo as perdas ao utilizar habilidades. Sempre que usar uma habilidade de técnica você pode realizar um teste de Fortitude com CD igual a 10 + 4 para cada nível da habilidade e, caso suceda, você consegue manter uma quantidade de sangue equivalente à metade dos pontos de vida gastos na habilidade ao seu redor, reutilizando-os em outras habilidades de técnica. Por ser um processo exaustivo, caso reutilize uma quantidade de pontos de vida igual ao seu modificador de Constituição multiplicado por 10, sem realizar um descanso, você recebe 1 ponto de exaustão cada vez que reutilizar sangue com esta habilidade. Seu máximo de Pontos de Vida é reduzido em 12 pontos."},{"id":"reacoes","nome":"Reação Sanguínea","nivel":3,"custoPV":18,"descricao":"Reação Sanguínea Habilidade Passiva de Nível 3 Sua manipulação sanguínea apurada permite que seu corpo reaja muito mais rapidamente. Você passa a ser capaz de utilizar duas reações por rodada. Seu máximo de Pontos de Vida é reduzido em 18 pontos."},{"id":"regeneracao","nome":"Regeneração Constante","nivel":3,"custoPV":18,"descricao":"Regeneração Constante Habilidade Passiva de Nível 3 Sua regeneração sanguínea é gravemente aumentada enquanto em perigo de vida. Sempre que estiver com menos de 50% de sua vida máxima, no início de todas as suas rodadas você recupera 2d8 + Mod de Constituição. Seu máximo de Pontos de Vida é reduzido em 18 pontos."},{"id":"cristalizacao","nome":"Cristalização Corporal","nivel":3,"custoPV":18,"descricao":"Cristalização Corporal Habilidade Passiva de Nível 3 Você criou uma camada de sangue cristalizado em volta do seu corpo natural. Você recebe RD contra todo tipo de dano, exceto psíquico e alma, igual ao seu bônus de maestria. Seu máximo de Pontos de Vida é reduzido em 18 pontos."},{"id":"poder","nome":"Poder do Sangue","nivel":4,"custoPV":24,"descricao":"Poder do Sangue Habilidade Passiva de Nível 4 Conseguindo reutilizar a vitalidade em seu sangue por conta da propriedade que o impede de liberá-la, você reduz a perda da vitalidade contida na carne e no sangue perdido em um golpe drasticamente, reaproveitando dela para fortalecer seu físico. Quando abaixo de metade dos seus pontos de vida máximo, você recebe metade do seu bônus de maestria em todos os testes de atributos físicos, e enquanto abaixo de ¼ dos seus pontos de vida máximos, muda o bônus para seu bônus de maestria total. Seu máximo de Pontos de Vida é reduzido em 24 pontos."},{"id":"pureza_refinada","nome":"Pureza Sanguínea Refinada","nivel":4,"custoPV":24,"descricao":"Pureza Sanguínea Refinada Habilidade Passiva de Nível 4 Aprimorando e refinando ainda mais seu sangue, você faz com que ele flua de maneira realmente perfeita dentro de seu corpo. Condições negativas não perduram por mais de uma rodada em seu corpo e você se torna imune a dano Venenoso e a todo tipo de veneno e toxina. Seu máximo de Pontos de Vida é reduzido em 24 pontos. [Requer: Regeneração Corporal e Pureza Sanguínea]"}]},"feiticos":[{"id":"sancho_1","nome":"Variante Sancho Hardblood Arts 1","tipo":"personalizado","nivel":4,"acaoPersonalizada":"Ação Comum","alcanceTexto":"Corpo-a-Corpo","alvoTexto":"Uma Criatura","duracaoTexto":"Imediata","resolucaoTexto":"","descricao":"Variante Sancho Hardblood Arts 1 Habilidade de Técnica de Nível 1 Conjuração: Ação Comum Alcance: Corpo-a-Corpo Alvo: Uma Criatura Duração: Imediata Você golpeia seu inimigo com brutalidade anormal. Realize um Teste de Acerto contra a Classe de Armadura adversária. Em um acerto o alvo recebe 5d8 de Dano Cortante e o alvo deve realizar um TR de Fortitude, recebendo a condição Sangramento Leve em uma falha. - Nível 2: Muda o dano para 8d8 e a condição para Sangramento Médio. - Nível 3: Muda o dano para 13d8 e a condição para Sangramento Forte. - Nível 4: Muda o dano para 13d10 e a condição para Sangramento Extremo.","comCd":true,"rolagens":[{"rotulo":"Dano Cortante","dados":13,"faces":10}],"bloodfeastTecnica":{"id":"sancho_1","ataques":1,"bonusCD":0,"sustentacaoPE":0}},{"id":"sancho_2","nome":"Variante Sancho Hardblood Arts 2","tipo":"personalizado","nivel":5,"acaoPersonalizada":"Ação Bônus","alcanceTexto":"Corpo-a-Corpo","alvoTexto":"Uma Criatura","duracaoTexto":"Imediata","resolucaoTexto":"Fortitude","descricao":"Variante Sancho Hardblood Arts 2 Habilidade de Técnica de Nível 1 Conjuração: Ação Bônus Alcance: Corpo-a-Corpo Alvo: Uma Criatura Duração: Imediata Você canaliza sua energia e começa a cristalizar o sangue do adversário, fazendo com que sangre de dentro para fora. Escolha uma criatura, ela deve realizar um TR de Fortitude com a CD aumentada em +2. Recebendo a condição “Sangramento Leve” em uma falha. - Nível 2: Muda o aumento de CD para +3. Recebendo a condição “Sangramento Médio” em uma falha ou a condição “Sangramento Leve” em um sucesso. - Nível 3: Muda o aumento de CD para +4. Recebendo a condição “Sangramento Forte” em uma falha ou a condição “Sangramento Médio” em um sucesso. - Nível 4: Muda o aumento de CD para +5. Recebendo a condição “Sangramento Extremo” em uma falha ou a condição “Sangramento Leve” em um sucesso. - Nível 5: Muda o aumento de CD para +6. Recebendo a condição “Sangramento Extremo” em uma falha ou as condições “Sangramento Forte”, “Caído” e “Desorientado” por três rodadas em um sucesso.","comCd":true,"rolagens":[],"bloodfeastTecnica":{"id":"sancho_2","ataques":1,"bonusCD":6,"sustentacaoPE":0}},{"id":"defesa","nome":"Defensive Sancho Hardblood Arts 1","tipo":"personalizado","nivel":5,"acaoPersonalizada":"Ação Comum","alcanceTexto":"Próprio","alvoTexto":"Próprio","duracaoTexto":"Sustentada","resolucaoTexto":"","descricao":"Defensive Sancho Hardblood Arts 1 Habilidade de Técnica de Nível 1 Conjuração: Ação Comum Alcance: Próprio Duração: Sustentada Você canaliza seu sangue em volta do seu corpo, criando uma camada protetiva fazendo com que os danos gerados contra seu corpo sejam reduzidos. Você recebe 4 de RD Geral, exceto alma. - Nível 2: Assim como acima, porém muda o bônus para 7 de RD Geral. - Nível 3: Assim como acima, porém muda o bônus para 10 de RD Geral. - Nível 4: Assim como acima, porém muda o bônus para 12 de RD Geral. - Nível 5: Assim como acima, porém muda o bônus para 18 de RD Geral.","comCd":false,"rolagens":[],"bloodfeastTecnica":{"id":"defesa","ataques":1,"bonusCD":0,"sustentacaoPE":2}},{"id":"sancho_3","nome":"Variante Sancho Hardblood Arts 3","tipo":"personalizado","nivel":4,"acaoPersonalizada":"Ação Completa","alcanceTexto":"Restante do Seu Movimento + 9 Metros","alvoTexto":"Uma Criatura","duracaoTexto":"Imediata","resolucaoTexto":"","descricao":"Variante Sancho Hardblood Arts 3 Habilidade de Técnica de Nível 2 Conjuração: Ação Completa Alcance: Restante do Seu Movimento + 3 Metros Alvo: Uma Criatura Duração: Imediata Você dispara em direção a uma criatura de maneira feroz e focada. Realizando dois ataques consecutivos, que recebem um bônus em acerto equivalente ao grau de Sangramento do alvo. (Leve +1, Médio +2, Forte +3, Extremo +4) - Nível 3: Muda para três ataques consecutivos e o deslocamento para 4,5 Metros. - Nível 3: Muda para quatro ataques consecutivos e o deslocamento para 6 Metros. - Nível 4: Muda para cinco ataques consecutivos e o deslocamento para 9 Metros.","comCd":false,"rolagens":[],"bloodfeastTecnica":{"id":"sancho_3","ataques":5,"bonusCD":0,"sustentacaoPE":0}},{"id":"reacao","nome":"Defensive Sancho Hardblood Arts 2","tipo":"personalizado","nivel":5,"acaoPersonalizada":"Reação","alcanceTexto":"Próprio","alvoTexto":"Próprio","duracaoTexto":"Imediata","resolucaoTexto":"","descricao":"Defensive Sancho Hardblood Arts 2 Habilidade de Técnica de Nível 2 Conjuração: Reação Alcance: Próprio Alvo: Próprio Duração: Imediata Você endurece grandemente o seu sangue em resposta a um golpe, absorvendo o dano dele grandemente. Ao receber um ataque, você pode usar sua reação para reduzir o dano. Faça um Teste de Fortitude contra o Acerto ou CD do Ataque. Em um sucesso você evita completamente o ataque, em uma falha você recebe somente metade do dano. Após utilizar essa habilidade, você também recebe sua maestria como redução de danos contra danos físicos até o final da rodada. - Nível 3: Você desvia automaticamente do ataque, sem precisar realizar qualquer rolagem. - Nível 4: Assim como acima, porém você realiza um ataque como parte da reação. - Nível 5: Assim como acima, porém você realiza dois ataques como parte da reação.","comCd":false,"rolagens":[],"bloodfeastTecnica":{"id":"reacao","ataques":2,"bonusCD":0,"sustentacaoPE":0}},{"id":"mircalla","nome":"Yearning Mircalla","tipo":"personalizado","nivel":5,"acaoPersonalizada":"Ação Bônus","alcanceTexto":"Próprio","alvoTexto":"Próprio","duracaoTexto":"Concentrada","resolucaoTexto":"","descricao":"Yearning Mircalla Habilidade de Técnica de Nível 2 Conjuração: Ação Bônus Alcance: Próprio Duração: Concentrada Você forma uma Alabarda de sangue, mantendo sempre uma alta concentração afiando a ponta, atingindo assim uma grande letalidade. Ao utilizar a habilidade, você cria uma Alabarda de sangue, o qual possui as propriedades Adaptada (Constituição) e Potente (já contabilizado), margem de crítico 18 e causa 2d10 de Dano Cortante. Você possui maestria na Alabarda e ela não pode ser desarmada. Ela dura até que você perca a sua concentração. Qualquer Habilidade ou Aptidão que afete armas de qualquer forma, afeta a Alabarda. - Nível 3: Adiciona a propriedade Afiada e reduz a margem de crítico para 17. - Nível 4: Adiciona as propriedades Catalisadora, Canalizadora e Harmonizada. - Nível 5: Adiciona a propriedade de Grau Especial “ Yearning Mircalla ” e tem seu nível de dano aumentado em dois. Yearning Mircalla : Coming soon. Mudar descrição para “Sempre que causar dano em um oponente com uma habilidade de técnica”. Mudar cura para Xd10. Onde X é igual a (Nível da Habilidade ÷ 2).","comCd":false,"rolagens":[],"bloodfeastTecnica":{"id":"mircalla","ataques":1,"bonusCD":0,"sustentacaoPE":2}}],"acrescenta":{"armas":[{"id":"alabarda_mircalla","nome":"Yearning Mircalla","classe":"complexa","categoria":"corpo","grupo":"haste","dano":{"dado":"2d10","tipo":"ct"},"critico":17,"espacos":0,"custo":1,"props":{"duas_maos":true},"atributoAtaque":"constituicao","usarDadoArma":true,"treinadaPadrao":true,"descricao":"Yearning Mircalla Habilidade de Técnica de Nível 2 Conjuração: Ação Bônus Alcance: Próprio Duração: Concentrada Você forma uma Alabarda de sangue, mantendo sempre uma alta concentração afiando a ponta, atingindo assim uma grande letalidade. Ao utilizar a habilidade, você cria uma Alabarda de sangue, o qual possui as propriedades Adaptada (Constituição) e Potente (já contabilizado), margem de crítico 18 e causa 2d10 de Dano Cortante. Você possui maestria na Alabarda e ela não pode ser desarmada. Ela dura até que você perca a sua concentração. Qualquer Habilidade ou Aptidão que afete armas de qualquer forma, afeta a Alabarda. - Nível 3: Adiciona a propriedade Afiada e reduz a margem de crítico para 17. - Nível 4: Adiciona as propriedades Catalisadora, Canalizadora e Harmonizada. - Nível 5: Adiciona a propriedade de Grau Especial “ Yearning Mircalla ” e tem seu nível de dano aumentado em dois. Yearning Mircalla : Coming soon. Mudar descrição para “Sempre que causar dano em um oponente com uma habilidade de técnica”. Mudar cura para Xd10. Onde X é igual a (Nível da Habilidade ÷ 2)."}]}},{"id":"ciclo-adaptacao-mahoraga","nome":"Ciclo de Adaptação do Mahoraga","versao":"1.0.0","autor":"Afty","descricao":"Roda de adaptação progressiva por rodada.","paraRaw":"afty","permite":["adaptacao"],"adaptacoes":[{"id":"roda","nome":"Roda de Adaptação","intervalo":5,"ganho":"habilidades_bonus_acerto","mecanica":"auxiliar_acerto_progressivo"}],"acrescenta":{}},{"id":"vislumbre-celeste","nome":"Vislumbre Celeste","versao":"1.0.0","autor":"Afty","paraRaw":"afty","descricao":"A Condição Corporal dos Seis Olhos, com outro nome. Ela é ganha de graça: não gasta vaga de Origem, Talento, Aptidão nem o contador da aba Habilidades, e o card dela fica na aba Habilidades, entre o Funcionamento Básico e os Feitiços. Com os olhos cobertos você reduz todo gasto em PE pela metade do seu Nível de Aptidão em Controle e Leitura, recebe percepção às cegas de 9m mais 4,5m por nível e +1 em Percepção e Feitiçaria por nível. Descobrir os olhos é uma Ação Livre que troca esses benefícios pelos plenos: a redução passa a ser o nível inteiro, a visão vai a 18m mais 9m por nível e o bônus de perícia dobra, ao preço de 1 Ponto de Fadiga no fim de cada turno. Quatro pontos viram um Nível de Exaustão. Por cima dos dois blocos, a Compreensão do Jujutsu dá quatro Níveis de Aptidão ao longo da vida do personagem, um já na criação e mais um nos Níveis 5, 15 e 25. Como Condição Corporal, tudo isso SOMA com Feitiços e com o resto da ficha, em vez de disputar o maior valor.","permite":["vislumbreCeleste"]},{"id":"olhinhos-lu","nome":"Olhinhos Lu( Corpo Principal )","versao":"1.1.0","autor":"Afty","paraRaw":"afty","descricao":"Enquanto de olhos estiverem fechados de alguma forma, o Coded Gigas fornece os seguintes efeitos:\\n\\nPRO:\\n- Enquanto com os olhos fechados Ciel recebe 3x seu Nível de Controle e Leitura em Intuição. (Arredondado para Cima)\\n\\n- Pode mudar o Calculo de Atenção para usar Intuição, além de poder trocar Testes de Percepção por Intuição.\\n\\n- Consegue enxergar por Técnicas de Barreiras, além de conseguir ativamente ver os Limites de um Domínio e enxergar o Domínio Inato das pessoas.","permite":["olhinhosLu"]},{"id":"olhos-de-agulha","nome":"Olhos de Agulha","versao":"1.0.0","autor":"Afty","paraRaw":"afty","descricao":"Condição corporal intrínseca do Clã Akutame.","permite":["olhosDeAgulha"]},{"id":"manipulacao-do-ceu","nome":"Manipulação do Céu","versao":"1.0.0","autor":"Afty","paraRaw":"afty","descricao":"Refletir Imagem e Duplicata Perfeita.","feiticos":[{"id":"refletir_imagem","nome":"Refletir Imagem","tipo":"personalizado","nivel":5,"descricao":"Você altera o tecido do céu, alterando a forma como a luz se propaga em si próprio, fazendo ela refletir duas imagens perfeitamente idênticas a você, como clones, que perturbam a percepção de inimigos sobre o real. Essa habilidade não afeta alvos cegos ou que não dependam dos olhos para enxergar. Ao criar os dois clones eles duram enquanto você se mantiver concentrando a habilidade, sempre que for alvo de um efeito que cause dano o oponente deve realizar um TR de Astúcia, num fracasso ele acerta uma de suas cópias e você anula o ataque, com o céu sendo distorcido e a cópia atingida sendo dissipada. Além de serem dissipadas caso você pare de se concentrar ou caso falhem no TR, você precisa gastar 2 PE no início de cada um de seus turnos para manter as imagens, se durante o intervalo entre turnos você receber um ataque, ambas as cópias são desfeitas e a habilidade se encerra, caso seja alvo de um efeito em área, ambas as cópias são desfeitas e a habilidade se encerra.","resolucao":"tr","acaoPersonalizada":"Comum","alcanceTexto":"Pessoal","alvoTexto":"Próprio","duracaoTexto":"Sustentado, Concentração","resolucaoTexto":"","comCd":true},{"id":"duplicata_perfeita","nome":"Duplicata perfeita","tipo":"passivo","nivel":5,"descricao":"Enquanto estiver com as duplicatas em campo, o valor de sua Aura embaça aumenta em +1 para ataques corpo a corpo e ataques a distancia","efeitoPassivo":"personalizado","efeitosPassivo":[]}]},{"id":"azamaru","nome":"Azamaru","versao":"1.0.0","paraRaw":"afty","descricao":"A arma de duas formas. Dividida são duas lâminas de Fineza; reunida vira uma espada colossal que ignora RD, imunidade e resistência, e cria clones ilusórios iguais ao Bônus de Maestria. O painel de combate da Ficha e do Encontro controla as duas formas, os clones e a reserva.","permite":["armaTransformavel"],"acrescenta":{"armas":[{"id":"azamaru","nome":"Azamaru","titulo":"O Fim de Todas as Coisas","classe":"complexa","categoria":"corpo","grupo":"espada","custo":4,"espacos":2,"critico":18,"dano":{"dado":"1d12 + 1d4","tipo":"ct"},"props":{"fineza":true,"marcial":true,"dupla":true,"apunhaladora":true,"energica":true,"mortal":"d12","oscilante":true},"unico":true,"equipadoPadrao":true,"faFixa":true,"faPadrao":{"grau":"especial","encantamentos":[],"habilidadeUnica":""},"ilusoes":true,"descricao":"O Fim de Todas as Coisas\\nSua habilidade especial é Azamaru:\\nTécnica Base: –\\nCom uma ação bônus, você junta ambas as lâminas, as transformando em uma única espada colossal, a qual não possui as propriedades Pesada nem Especial. Enquanto transformada, a lâmina é imbuída com uma maldição capaz de romper conceitos enquanto abastecida pela sua fúria, fazendo com que seus ataques feitos com ela ignorem imunidade, resistência e RD, além disso, no momento da ativação, você cria clones ilusórios igual ao seu bônus de maestria, recebendo +2 de Defesa para cada um, até um máximo de 8. A cada ataque que errar contra você, um dos clones é dissipado, e caso você seja atingido por um ataque, todos eles são dissipados; efeitos em área que afetem os clones fazem com que eles sejam dissipados automaticamente, mas caso ele afete o usuário, todos só serão dissipados caso ele falhe no TR. A cada clone dissipar, a energia dele é canalizada na lâmina, fazendo com que seu próximo ataque que acertar cause 1 dado de dano adicional para cada 2 de Defesa dissipada, até um máximo de 4 dados; você também pode dissipar clones voluntariamente com uma ação livre. Dividir a espada custa uma ação bônus, e ela não pode ser reunida na mesma rodada em que foi dividida, exigindo um gasto de PE igual ao seu bônus de maestria em todo o uso após o primeiro.","formas":{"reunida":{"props":{"fineza":true,"marcial":true,"ampla":true,"duas_maos":true,"energica":true,"mortal":"d12","oscilante":true}}},"criacao":{"classificacao":"tatica","deTecnica":true,"pcBase":12,"pcCusto":8,"pcEspaco":1,"pcTotal":21,"pcDano":6,"pcCritico":6,"pcPropriedades":9,"limiteDano":8,"limitePropriedades":10,"habilidadeForaDoOrcamento":true}}]}},{"id":"sombras","nome":"Estilo das Sombras — Reforço Corporal e Pacto","versao":"1.1.0","autor":"Templas","paraRaw":"afty","descricao":"Addon do Estilo das Sombras. Libera Aura Excessiva, Aura Impenetrável e Casulo de Energia sem pré-requisito (só zera os requisitos). Bancada: Reforço Corporal (+6 PV/nível, +2 RD física, +BT RD Geral com Aura Excessiva) e duas seções de exemplo com campos de valor — 'Resistir a Manobra · nova regra' (troca o valor atual por Fortitude + Aura) e 'RD de Aura · dobrar' (você digita a RD atual e o addon soma de novo = dobra). Pacto e Cura Corporal são só sinalizadores. Três Linhas de Treinamento (Escudo Protetor, Firmeza, Treinamento Corporal) — as condicionais usam os interruptores de sessão 'Escudo erguido' e 'Firmeza · em Postura da Terra', que você liga junto com a condição real. ⚠ Ligue 'Em Combate'. Itens [REFERÊNCIA] não têm canal.","substitui":{"aptidoes":[{"id":"aura_excessiva","requisitos":[]},{"id":"aura_impenetravel","requisitos":[]},{"id":"casulo_de_energia","requisitos":[]}]},"estadosCombate":[{"id":"reforco","label":"Reforço Corporal","tipo":"bool","title":"Enquanto ativo: +6 PV por nível; +2 de RD física (o '2 +' de Aura Reforçada); com o interruptor Aura Excessiva ligado e Aura ≥ 3, +BT de RD Geral. O dobrar da RD e a nova Resistir a Manobra têm seções próprias abaixo. ⚠ Precisa de 'Em Combate' ligado."},{"id":"rm_ativo","label":"Resistir a Manobra · nova regra","tipo":"bool","requerEstado":"reforco","title":"SEÇÃO DE EXEMPLO — Aura ≥ 4 com Aura Impenetrável: 'Resistir a Manobra se torna Fortitude + Aura'. O motor não sabe substituir sozinho, então preencha os dois campos abaixo e o addon troca: ele tira o valor atual e põe (Fortitude + Nível de Aptidão em Aura). O número novo aparece na linha de Manobras da ficha."},{"id":"rm_base","label":"Resistir a Manobra · valor atual","tipo":"faixa","requerEstado":"rm_ativo","min":0,"max":40,"passo":1,"title":"O valor de Resistir a Manobra que a ficha mostra HOJE (Acrobacia/Atletismo + bônus). O addon subtrai este número."},{"id":"rm_fort","label":"Resistir a Manobra · Fortitude","tipo":"faixa","requerEstado":"rm_ativo","min":0,"max":40,"passo":1,"title":"O seu bônus total de TR de Fortitude. O addon soma este número + o Nível de Aptidão em Aura no lugar do valor atual."},{"id":"rd_dobrar","label":"RD de Aura · dobrar","tipo":"bool","requerEstado":"reforco","title":"SEÇÃO DE EXEMPLO — 'a RD de Aura Reforçada e as demais dobram após todos os cálculos'. O motor não dobra um total já fechado, então preencha abaixo o valor de RD de Aura que a ficha mostra e o addon adiciona o mesmo valor de novo (= dobra)."},{"id":"rd_fis_val","label":"RD de Aura · física atual","tipo":"faixa","requerEstado":"rd_dobrar","min":0,"max":80,"passo":1,"title":"O total de RD física vindo de Aura (Aura Reforçada + Aura Elemental Reforçada + Casulo...) que a ficha mostra. O addon soma este valor de novo."},{"id":"rd_ger_val","label":"RD de Aura · geral atual","tipo":"faixa","requerEstado":"rd_dobrar","min":0,"max":80,"passo":1,"title":"O total de RD Geral vindo de Aura (Aura Excessiva...) que a ficha mostra. O addon soma este valor de novo."},{"id":"pacto","label":"Pacto (referência)","tipo":"bool","title":"Enquanto NÃO ativo, sua Energia Amaldiçoada máxima é 40% do total. Enquanto ativo, é 140% do total, e você recupera o ganho adicional. ⚠ REFERÊNCIA: o motor não tem canal para porcentagem do PE máximo — ajuste o PE na mão. Este interruptor só marca o estado."},{"id":"cura_ref","label":"Cura Corporal +2 / +5 (referência)","tipo":"bool","title":"REFERÊNCIA — Treinamento Corporal etapas 1 e 3: 'ao recuperar PV (não PVT), +2 PV; 1x por rodada, +5 PV'. O motor não tem canal de bônus de cura recebida. Este interruptor só lembra — some os PV na mão."}],"funcionamentos":[{"id":"reforco_motor","nome":"Reforço Corporal (bancada)","descricao":"Bônus do Reforço Corporal conforme o Nível de Aptidão em Aura. Só vale com 'Em Combate' e o interruptor Reforço Corporal ligados.","efeitos":[{"canal":"hp","expr":"6 * (nd - 1)","quando":"sombras_reforco","duracao":"temporaria"},{"canal":"rdFisico","expr":"2 * (au >= 1) + sombras_rd_dobrar * sombras_rd_fis_val","quando":"sombras_reforco","duracao":"temporaria"},{"canal":"rdGeral","expr":"aura_excessiva * bt * (au >= 3) + sombras_rd_dobrar * sombras_rd_ger_val","quando":"sombras_reforco","duracao":"temporaria"},{"canal":"resistirManobra","expr":"(sombras_rm_fort + au) - sombras_rm_base","quando":"sombras_reforco && sombras_rm_ativo && au >= 4","duracao":"temporaria"}]}],"acrescenta":{"treinamentos":[{"id":"treino_escudo_protetor","nome":"Escudo Protetor","lore":"Você se especificou totalmente na utilização de escudos, seja para proteger você ou aos outros; seu objetivo é sempre visando a proteção.","gatilhoSessao":{"id":"escudo_erguido","label":"Escudo erguido"},"etapas":[{"n":1,"focos":1,"requisito":null,"beneficio":"A sua CA aumenta em +1 enquanto estiver empunhando um escudo. [Ligue o interruptor 'Escudo erguido' quando estiver com o escudo.]","efeitos":[{"canal":"defesa","expr":"1","gatilhoSessao":"escudo_erguido"}]},{"n":2,"focos":1,"requisito":null,"beneficio":"Você recebe +1 de Fortitude.","efeitos":[{"canal":"bonusTR","alvo":"fortitude","expr":"1"}]},{"n":3,"focos":2,"requisito":null,"beneficio":"Seu escudo aumenta a RD física dele em 5. [Interruptor 'Escudo erguido'.]","efeitos":[{"canal":"rdFisico","expr":"5","gatilhoSessao":"escudo_erguido"}]},{"n":4,"focos":2,"requisito":null,"beneficio":"Você recebe +1 encantamento adicional em seu escudo — aqui vale +2 de RD Geral enquanto o escudo estiver erguido.","efeitos":[{"canal":"rdGeral","expr":"2","gatilhoSessao":"escudo_erguido"}]}],"completo":{"beneficio":"Firmeza Absoluta\\nSeu escudo passa a conceder RD contra uma quantidade de tipos de dano igual ao seu BT (exceto etéreos). [REFERÊNCIA: RD por tipo à escolha — resolvida na mesa.]","efeitos":[]}},{"id":"treino_firmeza","nome":"Firmeza","lore":"Stark e inabalável para proteger seus aliados, seu corpo é forte o suficiente para se manter assim; ele foca em manter o corpo da maneira mais potente possível — afinal, seu treino o fez resistir a qualquer momento.","gatilhoSessao":{"id":"postura_terra_firmeza","label":"Firmeza · em Postura da Terra"},"etapas":[{"n":1,"focos":1,"requisito":null,"beneficio":"Adiciona +2 no PV Temporário da sua Postura da Terra. [Ligue 'Firmeza · em Postura da Terra' junto com a Postura.]","efeitos":[{"canal":"pvTemporario","expr":"2","gatilhoSessao":"postura_terra_firmeza"}]},{"n":2,"focos":1,"requisito":null,"beneficio":"Enquanto em Postura da Terra, recebe +1 de Fortitude.","efeitos":[{"canal":"bonusTR","alvo":"fortitude","expr":"1","gatilhoSessao":"postura_terra_firmeza"}]},{"n":3,"focos":1,"requisito":null,"beneficio":"Adiciona +3 no PV Temporário da sua Postura da Terra.","efeitos":[{"canal":"pvTemporario","expr":"3","gatilhoSessao":"postura_terra_firmeza"}]},{"n":4,"focos":2,"requisito":null,"beneficio":"Ao adentrar em Postura da Terra, recebe o bônus de PV Temporário dobrado no seu primeiro uso. [REFERÊNCIA: 'primeiro uso' não é rastreado — role dobrado na mesa.]","efeitos":[]}],"completo":{"beneficio":"Inabalável\\nAo adentrar em postura, seu corpo se mantém extremamente firme. Uma quantidade de vezes igual a 1 + metade do BT, por descanso curto, ao ser forçado a realizar uma TR de Reflexos durante a Postura da Terra, você pode alterar para Fortitude. [REFERÊNCIA: troca limitada por usos — resolvida na mesa.]","efeitos":[]}},{"id":"treino_corporal","nome":"Treinamento Corporal","lore":"Após anos de treino, seu corpo se moldou de forma que aparenta ter um potencial quase ilimitado; receber ataques é algo normal para ele. Sofrendo estes danos e se recuperando rapidamente, com um vigor sobrenatural.","etapas":[{"n":1,"focos":1,"requisito":null,"beneficio":"Sempre que for recuperar vida (PV Temporário não conta), você se recupera +2 PV adicionais. [REFERÊNCIA — sinalizado pelo interruptor 'Cura Corporal +2 / +5' na bancada; some os PV na mão.]","efeitos":[]},{"n":2,"focos":1,"requisito":null,"beneficio":"Nada.","efeitos":[]},{"n":3,"focos":1,"requisito":null,"beneficio":"1x por rodada, caso recupere seus PV por qualquer meio, você recupera +5 PV adicionais. [REFERÊNCIA — sinalizado pelo interruptor 'Cura Corporal +2 / +5' na bancada; some os PV na mão.]","efeitos":[]},{"n":4,"focos":2,"requisito":null,"beneficio":"Passa a adicionar 1 + metade do BT em rolagens no portão da morte. [REFERÊNCIA: o motor não tem canal de portão da morte — some na mesa.]","efeitos":[]}],"completo":{"beneficio":"Vigor Sobrenatural\\nSeu corpo se desenvolve de maneira mais otimizada e natural, capaz de usar seu potencial melhorado para resistir a golpes. Recebe +1 PV por nível, além de adicionar seu maior modificador de atributo físico como bônus de vida máxima adicional.","efeitos":[{"canal":"hp","expr":"(nd - 1) + max(mod_forca, mod_destreza, mod_constituicao)"}]}}]}}],"narratorNotes":"","combatState":{"isActive":false,"hpCurrent":0,"peCurrent":0,"almaCurrent":100,"activeConditions":[],"customCounters":[],"combatLog":[]},"id":"teste-abas-mesa","aptidoesEscolhidas":["dominio_simples"]},"tipica":{"system":"afty","rulesVersion":"player","name":"Mesa Típica (Teste Abas)","portraitUrl":null,"portraitFocus":{"x":50,"y":50},"core":{"tipo":"conjurador","patamar":"comum","nd":20,"tamanho":"medio","tecnicaAttr":"inteligencia","tecnicaDescricao":"","tecnicaEfeitos":[],"funcionamentosAdicionais":[],"origem":{"id":"herdado"}},"alma":{"atual":100,"max":100},"qntPE":"normal","attrMethod":"fixos","attrLimite":{"forca":20,"destreza":20,"constituicao":20,"inteligencia":20,"sabedoria":20,"presenca":20},"attributes":{"forca":14,"destreza":14,"constituicao":14,"inteligencia":10,"sabedoria":14,"presenca":10},"attrNivel":{"forca":0,"destreza":0,"constituicao":0,"inteligencia":0,"sabedoria":0,"presenca":0},"pericias":{},"periciasOrdem":null,"periciasPersonalizadas":[],"periciaOficio":"","periciaOficios":{},"periciasOficiosExtras":[],"periciaAtributoManual":{},"periciasBonus":0,"resistenciasProf":{},"trDaClasse":[],"trSegundo":null,"trAtributoManual":{},"ataquesProf":{},"ataqueFineza":false,"ataqueBasicoId":"corpo","ataqueAtributoManual":{},"armasDedicadas":[],"defesasDano":{},"catarse":{"saldo":0,"compras":[]},"carteira":{"entradas":[],"gastos":[]},"espinho":{"almas":0,"outros":0,"compras":{},"equipamentos":[]},"tecnicasCombate":{"armas":[],"atributo":"inteligencia"},"talentosConfig":{"tal_mestre_das_armas":{"modo":"armas","armas":[],"grupo":null},"tal_tempestade_de_ideias":{"pericia":null,"ferramenta":"","vantagemPericia":null},"tal_artesao_amaldicoado":{"ferramenta":null}},"combate":{"ativo":false,"empolgacao":1,"insistenciaUsada":false,"manobraAjuste":false,"manobraDesarme":false,"manobraEsquiva":false,"manobraTrabalhoDePes":false,"manobraFinalizadora":null,"brutalidade":false,"brutalidadePE":0,"brutalidadePilha":0,"ataqueInconsequente":false,"impactoMisto":false,"resistirPE":0,"furiaVinganca":false,"imprudenciaMotivadora":false,"machucado":false,"abates":0,"armasAbsolutas":null,"auraElemental":true,"concentrarAura":[],"golpeComAura":null,"canalizarEmGolpe":false,"canalizacaoMaxima":false},"equipamentos":{"itens":[{"uid":"abas-tip-azamaru","tipo":"arma","refId":"azamaru:azamaru","qtd":1,"equipado":true}]},"armasCustom":[],"forjas":[],"especializacoes":[{"id":"conjurador","nivel":10},{"id":"combatente","nivel":10}],"feiticos":[{"id":"tf8","nome":"Dardo Simples de Teste","tipo":"dano","nivel":1,"conjuracaoTexto":"","descricao":"Texto de teste da prévia (Dardo Simples de Teste). **Negrito** de marcação rica, e uma segunda frase para medir a leitura.","variacaoDeTecnica":false,"variacaoDe":null,"resolucao":"ataque","alvo":"unico","formaArea":"esfera","acao":"comum","subtipo":"nenhum","trocas":{"dados":0,"acerto":0,"cd":0,"alcance":0,"area":0,"empurraoDados":0},"condicoes":[],"sangramento":null,"requisito":null,"focoCondicao":false,"disparos":2,"continuoModo":"sustentado","ignorarResistencias":false,"morteDireta":false,"remocao":"nenhuma","especialSubtipo":"golpeador","golpesGolpeador":1,"tecnicaInvisibilidade":false,"fraquezaInvis":"","itemCusto":1,"itemGrauTroca":0,"tecnicaFocoItens":false,"itemNatureza":"consumivel","itemDescricao":"","shikigamiInvocacaoId":null,"transfAcao":"comum","transfDuracao":"sustentada","transfNivelTroca":0,"transfCustoVida":false,"transfEfeitos":[],"efeitoAux":"defesa","alvoAuxAtributo":"forca","alvoAuxTR":"reflexos","alvoAuxPericia":null,"permuta":null,"duracaoAux":"imediata","rodadasDur":1,"alvosAux":1,"concentracaoAux":false,"concUsoAux":"alvos","acaoAux":"padrao","umGolpe":false,"tiposDanoExtra":0,"alcancePropria":false,"multiplosAtivo":false,"duracaoMult":"imediata","rodadasMult":1,"acaoMult":"padrao","alvosMult":1,"efeitosMult":[],"categoriaPassivo":"","alvoPassivoAtributo":"forca","alvoPassivoTR":"reflexos","alvoPassivoPericia":"percepcao","tiposDanoExtraPassivo":0,"efeitosPassivo":[],"acaoPersonalizada":"","alcanceTexto":"","alvoTexto":"","duracaoTexto":"","resolucaoTexto":"","comCd":true,"rolagens":[],"custoPETexto":"","custoVidaAtivacao":null}],"reducoesCustoFeitico":{"dominancia":null,"manipulacao":[]},"estilosSombra":[],"estiloFuncionamento":{"texto":"","durabilidadeTrilha":null},"habilidadesGerais":[],"focosLivres":0,"periciaAtributo":"inteligencia","habilidades":["cmb_golpe_especial","cmb_assumir_postura","cmb_ataque_concentrado"],"escolhasHabilidade":{},"especializacaoConfig":{},"escolhasTalento":{},"talentos":[],"invocacoes":[],"origemContadores":{},"hordas":[],"quimeras":[],"fundamentosPerdidos":[],"aptidoes":{"au":2,"cl":4,"bar":0,"dom":3,"er":0},"aptidoesAmaldicoadas":[],"aptidaoOpcoes":{},"aptidaoOpcoesRepetidas":{},"dominios":[],"dominioAtivoId":null,"treinamentos":{"sombras:treino_escudo_protetor":1},"treinamentoAlvos":{},"treinamentoEscolhas":{},"treinoEscolhaFeiticos":{},"votos":{"contratuais":[],"mecanicos":[]},"pacto":{"nome":"","descricao":"","maleficios":[],"beneficios":[]},"modificacoesCorporais":{"descricao":"","efeitosBase":[],"limite":0,"enxertos":[]},"tita":{"ativo":false,"membros":5},"caracteristicasAmaldicoadas":[],"caracteristicasAmaldicoadasAlvos":{},"treinosEspeciais":[],"treinoEspecialProgresso":{},"focosBonus":0,"statOverrides":{},"melhoriasSuperiores":[],"habilidadesLendarias":[],"escolhasAltoNivel":{},"aparencia":null,"preferenciasFicha":null,"addons":[{"id":"vislumbre-celeste","nome":"Vislumbre Celeste","versao":"1.0.0","autor":"Afty","paraRaw":"afty","descricao":"A Condição Corporal dos Seis Olhos, com outro nome. Ela é ganha de graça: não gasta vaga de Origem, Talento, Aptidão nem o contador da aba Habilidades, e o card dela fica na aba Habilidades, entre o Funcionamento Básico e os Feitiços. Com os olhos cobertos você reduz todo gasto em PE pela metade do seu Nível de Aptidão em Controle e Leitura, recebe percepção às cegas de 9m mais 4,5m por nível e +1 em Percepção e Feitiçaria por nível. Descobrir os olhos é uma Ação Livre que troca esses benefícios pelos plenos: a redução passa a ser o nível inteiro, a visão vai a 18m mais 9m por nível e o bônus de perícia dobra, ao preço de 1 Ponto de Fadiga no fim de cada turno. Quatro pontos viram um Nível de Exaustão. Por cima dos dois blocos, a Compreensão do Jujutsu dá quatro Níveis de Aptidão ao longo da vida do personagem, um já na criação e mais um nos Níveis 5, 15 e 25. Como Condição Corporal, tudo isso SOMA com Feitiços e com o resto da ficha, em vez de disputar o maior valor.","permite":["vislumbreCeleste"]},{"id":"azamaru","nome":"Azamaru","versao":"1.0.0","paraRaw":"afty","descricao":"A arma de duas formas. Dividida são duas lâminas de Fineza; reunida vira uma espada colossal que ignora RD, imunidade e resistência, e cria clones ilusórios iguais ao Bônus de Maestria. O painel de combate da Ficha e do Encontro controla as duas formas, os clones e a reserva.","permite":["armaTransformavel"],"acrescenta":{"armas":[{"id":"azamaru","nome":"Azamaru","titulo":"O Fim de Todas as Coisas","classe":"complexa","categoria":"corpo","grupo":"espada","custo":4,"espacos":2,"critico":18,"dano":{"dado":"1d12 + 1d4","tipo":"ct"},"props":{"fineza":true,"marcial":true,"dupla":true,"apunhaladora":true,"energica":true,"mortal":"d12","oscilante":true},"unico":true,"equipadoPadrao":true,"faFixa":true,"faPadrao":{"grau":"especial","encantamentos":[],"habilidadeUnica":""},"ilusoes":true,"descricao":"O Fim de Todas as Coisas\\nSua habilidade especial é Azamaru:\\nTécnica Base: –\\nCom uma ação bônus, você junta ambas as lâminas, as transformando em uma única espada colossal, a qual não possui as propriedades Pesada nem Especial. Enquanto transformada, a lâmina é imbuída com uma maldição capaz de romper conceitos enquanto abastecida pela sua fúria, fazendo com que seus ataques feitos com ela ignorem imunidade, resistência e RD, além disso, no momento da ativação, você cria clones ilusórios igual ao seu bônus de maestria, recebendo +2 de Defesa para cada um, até um máximo de 8. A cada ataque que errar contra você, um dos clones é dissipado, e caso você seja atingido por um ataque, todos eles são dissipados; efeitos em área que afetem os clones fazem com que eles sejam dissipados automaticamente, mas caso ele afete o usuário, todos só serão dissipados caso ele falhe no TR. A cada clone dissipar, a energia dele é canalizada na lâmina, fazendo com que seu próximo ataque que acertar cause 1 dado de dano adicional para cada 2 de Defesa dissipada, até um máximo de 4 dados; você também pode dissipar clones voluntariamente com uma ação livre. Dividir a espada custa uma ação bônus, e ela não pode ser reunida na mesma rodada em que foi dividida, exigindo um gasto de PE igual ao seu bônus de maestria em todo o uso após o primeiro.","formas":{"reunida":{"props":{"fineza":true,"marcial":true,"ampla":true,"duas_maos":true,"energica":true,"mortal":"d12","oscilante":true}}},"criacao":{"classificacao":"tatica","deTecnica":true,"pcBase":12,"pcCusto":8,"pcEspaco":1,"pcTotal":21,"pcDano":6,"pcCritico":6,"pcPropriedades":9,"limiteDano":8,"limitePropriedades":10,"habilidadeForaDoOrcamento":true}}]}},{"id":"sombras","nome":"Estilo das Sombras — Reforço Corporal e Pacto","versao":"1.1.0","autor":"Templas","paraRaw":"afty","descricao":"Addon do Estilo das Sombras. Libera Aura Excessiva, Aura Impenetrável e Casulo de Energia sem pré-requisito (só zera os requisitos). Bancada: Reforço Corporal (+6 PV/nível, +2 RD física, +BT RD Geral com Aura Excessiva) e duas seções de exemplo com campos de valor — 'Resistir a Manobra · nova regra' (troca o valor atual por Fortitude + Aura) e 'RD de Aura · dobrar' (você digita a RD atual e o addon soma de novo = dobra). Pacto e Cura Corporal são só sinalizadores. Três Linhas de Treinamento (Escudo Protetor, Firmeza, Treinamento Corporal) — as condicionais usam os interruptores de sessão 'Escudo erguido' e 'Firmeza · em Postura da Terra', que você liga junto com a condição real. ⚠ Ligue 'Em Combate'. Itens [REFERÊNCIA] não têm canal.","substitui":{"aptidoes":[{"id":"aura_excessiva","requisitos":[]},{"id":"aura_impenetravel","requisitos":[]},{"id":"casulo_de_energia","requisitos":[]}]},"estadosCombate":[{"id":"reforco","label":"Reforço Corporal","tipo":"bool","title":"Enquanto ativo: +6 PV por nível; +2 de RD física (o '2 +' de Aura Reforçada); com o interruptor Aura Excessiva ligado e Aura ≥ 3, +BT de RD Geral. O dobrar da RD e a nova Resistir a Manobra têm seções próprias abaixo. ⚠ Precisa de 'Em Combate' ligado."},{"id":"rm_ativo","label":"Resistir a Manobra · nova regra","tipo":"bool","requerEstado":"reforco","title":"SEÇÃO DE EXEMPLO — Aura ≥ 4 com Aura Impenetrável: 'Resistir a Manobra se torna Fortitude + Aura'. O motor não sabe substituir sozinho, então preencha os dois campos abaixo e o addon troca: ele tira o valor atual e põe (Fortitude + Nível de Aptidão em Aura). O número novo aparece na linha de Manobras da ficha."},{"id":"rm_base","label":"Resistir a Manobra · valor atual","tipo":"faixa","requerEstado":"rm_ativo","min":0,"max":40,"passo":1,"title":"O valor de Resistir a Manobra que a ficha mostra HOJE (Acrobacia/Atletismo + bônus). O addon subtrai este número."},{"id":"rm_fort","label":"Resistir a Manobra · Fortitude","tipo":"faixa","requerEstado":"rm_ativo","min":0,"max":40,"passo":1,"title":"O seu bônus total de TR de Fortitude. O addon soma este número + o Nível de Aptidão em Aura no lugar do valor atual."},{"id":"rd_dobrar","label":"RD de Aura · dobrar","tipo":"bool","requerEstado":"reforco","title":"SEÇÃO DE EXEMPLO — 'a RD de Aura Reforçada e as demais dobram após todos os cálculos'. O motor não dobra um total já fechado, então preencha abaixo o valor de RD de Aura que a ficha mostra e o addon adiciona o mesmo valor de novo (= dobra)."},{"id":"rd_fis_val","label":"RD de Aura · física atual","tipo":"faixa","requerEstado":"rd_dobrar","min":0,"max":80,"passo":1,"title":"O total de RD física vindo de Aura (Aura Reforçada + Aura Elemental Reforçada + Casulo...) que a ficha mostra. O addon soma este valor de novo."},{"id":"rd_ger_val","label":"RD de Aura · geral atual","tipo":"faixa","requerEstado":"rd_dobrar","min":0,"max":80,"passo":1,"title":"O total de RD Geral vindo de Aura (Aura Excessiva...) que a ficha mostra. O addon soma este valor de novo."},{"id":"pacto","label":"Pacto (referência)","tipo":"bool","title":"Enquanto NÃO ativo, sua Energia Amaldiçoada máxima é 40% do total. Enquanto ativo, é 140% do total, e você recupera o ganho adicional. ⚠ REFERÊNCIA: o motor não tem canal para porcentagem do PE máximo — ajuste o PE na mão. Este interruptor só marca o estado."},{"id":"cura_ref","label":"Cura Corporal +2 / +5 (referência)","tipo":"bool","title":"REFERÊNCIA — Treinamento Corporal etapas 1 e 3: 'ao recuperar PV (não PVT), +2 PV; 1x por rodada, +5 PV'. O motor não tem canal de bônus de cura recebida. Este interruptor só lembra — some os PV na mão."}],"funcionamentos":[{"id":"reforco_motor","nome":"Reforço Corporal (bancada)","descricao":"Bônus do Reforço Corporal conforme o Nível de Aptidão em Aura. Só vale com 'Em Combate' e o interruptor Reforço Corporal ligados.","efeitos":[{"canal":"hp","expr":"6 * (nd - 1)","quando":"sombras_reforco","duracao":"temporaria"},{"canal":"rdFisico","expr":"2 * (au >= 1) + sombras_rd_dobrar * sombras_rd_fis_val","quando":"sombras_reforco","duracao":"temporaria"},{"canal":"rdGeral","expr":"aura_excessiva * bt * (au >= 3) + sombras_rd_dobrar * sombras_rd_ger_val","quando":"sombras_reforco","duracao":"temporaria"},{"canal":"resistirManobra","expr":"(sombras_rm_fort + au) - sombras_rm_base","quando":"sombras_reforco && sombras_rm_ativo && au >= 4","duracao":"temporaria"}]}],"acrescenta":{"treinamentos":[{"id":"treino_escudo_protetor","nome":"Escudo Protetor","lore":"Você se especificou totalmente na utilização de escudos, seja para proteger você ou aos outros; seu objetivo é sempre visando a proteção.","gatilhoSessao":{"id":"escudo_erguido","label":"Escudo erguido"},"etapas":[{"n":1,"focos":1,"requisito":null,"beneficio":"A sua CA aumenta em +1 enquanto estiver empunhando um escudo. [Ligue o interruptor 'Escudo erguido' quando estiver com o escudo.]","efeitos":[{"canal":"defesa","expr":"1","gatilhoSessao":"escudo_erguido"}]},{"n":2,"focos":1,"requisito":null,"beneficio":"Você recebe +1 de Fortitude.","efeitos":[{"canal":"bonusTR","alvo":"fortitude","expr":"1"}]},{"n":3,"focos":2,"requisito":null,"beneficio":"Seu escudo aumenta a RD física dele em 5. [Interruptor 'Escudo erguido'.]","efeitos":[{"canal":"rdFisico","expr":"5","gatilhoSessao":"escudo_erguido"}]},{"n":4,"focos":2,"requisito":null,"beneficio":"Você recebe +1 encantamento adicional em seu escudo — aqui vale +2 de RD Geral enquanto o escudo estiver erguido.","efeitos":[{"canal":"rdGeral","expr":"2","gatilhoSessao":"escudo_erguido"}]}],"completo":{"beneficio":"Firmeza Absoluta\\nSeu escudo passa a conceder RD contra uma quantidade de tipos de dano igual ao seu BT (exceto etéreos). [REFERÊNCIA: RD por tipo à escolha — resolvida na mesa.]","efeitos":[]}},{"id":"treino_firmeza","nome":"Firmeza","lore":"Stark e inabalável para proteger seus aliados, seu corpo é forte o suficiente para se manter assim; ele foca em manter o corpo da maneira mais potente possível — afinal, seu treino o fez resistir a qualquer momento.","gatilhoSessao":{"id":"postura_terra_firmeza","label":"Firmeza · em Postura da Terra"},"etapas":[{"n":1,"focos":1,"requisito":null,"beneficio":"Adiciona +2 no PV Temporário da sua Postura da Terra. [Ligue 'Firmeza · em Postura da Terra' junto com a Postura.]","efeitos":[{"canal":"pvTemporario","expr":"2","gatilhoSessao":"postura_terra_firmeza"}]},{"n":2,"focos":1,"requisito":null,"beneficio":"Enquanto em Postura da Terra, recebe +1 de Fortitude.","efeitos":[{"canal":"bonusTR","alvo":"fortitude","expr":"1","gatilhoSessao":"postura_terra_firmeza"}]},{"n":3,"focos":1,"requisito":null,"beneficio":"Adiciona +3 no PV Temporário da sua Postura da Terra.","efeitos":[{"canal":"pvTemporario","expr":"3","gatilhoSessao":"postura_terra_firmeza"}]},{"n":4,"focos":2,"requisito":null,"beneficio":"Ao adentrar em Postura da Terra, recebe o bônus de PV Temporário dobrado no seu primeiro uso. [REFERÊNCIA: 'primeiro uso' não é rastreado — role dobrado na mesa.]","efeitos":[]}],"completo":{"beneficio":"Inabalável\\nAo adentrar em postura, seu corpo se mantém extremamente firme. Uma quantidade de vezes igual a 1 + metade do BT, por descanso curto, ao ser forçado a realizar uma TR de Reflexos durante a Postura da Terra, você pode alterar para Fortitude. [REFERÊNCIA: troca limitada por usos — resolvida na mesa.]","efeitos":[]}},{"id":"treino_corporal","nome":"Treinamento Corporal","lore":"Após anos de treino, seu corpo se moldou de forma que aparenta ter um potencial quase ilimitado; receber ataques é algo normal para ele. Sofrendo estes danos e se recuperando rapidamente, com um vigor sobrenatural.","etapas":[{"n":1,"focos":1,"requisito":null,"beneficio":"Sempre que for recuperar vida (PV Temporário não conta), você se recupera +2 PV adicionais. [REFERÊNCIA — sinalizado pelo interruptor 'Cura Corporal +2 / +5' na bancada; some os PV na mão.]","efeitos":[]},{"n":2,"focos":1,"requisito":null,"beneficio":"Nada.","efeitos":[]},{"n":3,"focos":1,"requisito":null,"beneficio":"1x por rodada, caso recupere seus PV por qualquer meio, você recupera +5 PV adicionais. [REFERÊNCIA — sinalizado pelo interruptor 'Cura Corporal +2 / +5' na bancada; some os PV na mão.]","efeitos":[]},{"n":4,"focos":2,"requisito":null,"beneficio":"Passa a adicionar 1 + metade do BT em rolagens no portão da morte. [REFERÊNCIA: o motor não tem canal de portão da morte — some na mesa.]","efeitos":[]}],"completo":{"beneficio":"Vigor Sobrenatural\\nSeu corpo se desenvolve de maneira mais otimizada e natural, capaz de usar seu potencial melhorado para resistir a golpes. Recebe +1 PV por nível, além de adicionar seu maior modificador de atributo físico como bônus de vida máxima adicional.","efeitos":[{"canal":"hp","expr":"(nd - 1) + max(mod_forca, mod_destreza, mod_constituicao)"}]}}]}}],"narratorNotes":"","combatState":{"isActive":false,"hpCurrent":0,"peCurrent":0,"almaCurrent":100,"activeConditions":[],"customCounters":[],"combatLog":[]},"id":"teste-abas-tipica","aptidoesEscolhidas":["dominio_simples"]},"vazia":{"system":"afty","rulesVersion":"player","name":"Vazia (Teste Abas)","portraitUrl":null,"portraitFocus":{"x":50,"y":50},"core":{"tipo":"combatente","patamar":"comum","nd":1,"tamanho":"medio","tecnicaAttr":"inteligencia","tecnicaDescricao":"","tecnicaEfeitos":[],"funcionamentosAdicionais":[],"origem":{"id":"inato"}},"alma":{"atual":100,"max":100},"qntPE":"normal","attrMethod":"pontos","attrLimite":{"forca":20,"destreza":20,"constituicao":20,"inteligencia":20,"sabedoria":20,"presenca":20},"attributes":{"forca":10,"destreza":10,"constituicao":10,"inteligencia":10,"sabedoria":10,"presenca":10},"attrNivel":{"forca":0,"destreza":0,"constituicao":0,"inteligencia":0,"sabedoria":0,"presenca":0},"pericias":{},"periciasOrdem":null,"periciasPersonalizadas":[],"periciaOficio":"","periciaOficios":{},"periciasOficiosExtras":[],"periciaAtributoManual":{},"periciasBonus":0,"resistenciasProf":{},"trDaClasse":[],"trSegundo":null,"trAtributoManual":{},"ataquesProf":{},"ataqueFineza":false,"ataqueBasicoId":"corpo","ataqueAtributoManual":{},"armasDedicadas":[],"defesasDano":{},"catarse":{"saldo":0,"compras":[]},"carteira":{"entradas":[],"gastos":[]},"espinho":{"almas":0,"outros":0,"compras":{},"equipamentos":[]},"tecnicasCombate":{"armas":[],"atributo":"inteligencia"},"talentosConfig":{"tal_mestre_das_armas":{"modo":"armas","armas":[],"grupo":null},"tal_tempestade_de_ideias":{"pericia":null,"ferramenta":"","vantagemPericia":null},"tal_artesao_amaldicoado":{"ferramenta":null}},"combate":{"ativo":false,"empolgacao":1,"insistenciaUsada":false,"manobraAjuste":false,"manobraDesarme":false,"manobraEsquiva":false,"manobraTrabalhoDePes":false,"manobraFinalizadora":null,"brutalidade":false,"brutalidadePE":0,"brutalidadePilha":0,"ataqueInconsequente":false,"impactoMisto":false,"resistirPE":0,"furiaVinganca":false,"imprudenciaMotivadora":false,"machucado":false,"abates":0,"armasAbsolutas":null,"auraElemental":true,"concentrarAura":[],"golpeComAura":null,"canalizarEmGolpe":false,"canalizacaoMaxima":false},"equipamentos":{"itens":[]},"armasCustom":[],"forjas":[],"especializacoes":[],"feiticos":[],"reducoesCustoFeitico":{"dominancia":null,"manipulacao":[]},"estilosSombra":[],"estiloFuncionamento":{"texto":"","durabilidadeTrilha":null},"habilidadesGerais":[],"focosLivres":0,"periciaAtributo":"inteligencia","habilidades":[],"escolhasHabilidade":{},"especializacaoConfig":{},"escolhasTalento":{},"talentos":[],"invocacoes":[],"origemContadores":{},"hordas":[],"quimeras":[],"fundamentosPerdidos":[],"aptidoes":{"au":0,"cl":0,"bar":0,"dom":0,"er":0},"aptidoesAmaldicoadas":[],"aptidaoOpcoes":{},"aptidaoOpcoesRepetidas":{},"dominios":[],"dominioAtivoId":null,"treinamentos":{},"treinamentoAlvos":{},"treinamentoEscolhas":{},"treinoEscolhaFeiticos":{},"votos":{"contratuais":[],"mecanicos":[]},"pacto":{"nome":"","descricao":"","maleficios":[],"beneficios":[]},"modificacoesCorporais":{"descricao":"","efeitosBase":[],"limite":0,"enxertos":[]},"tita":{"ativo":false,"membros":5},"caracteristicasAmaldicoadas":[],"caracteristicasAmaldicoadasAlvos":{},"treinosEspeciais":[],"treinoEspecialProgresso":{},"focosBonus":0,"statOverrides":{},"melhoriasSuperiores":[],"habilidadesLendarias":[],"escolhasAltoNivel":{},"aparencia":null,"preferenciasFicha":null,"addons":[],"narratorNotes":"","combatState":{"isActive":false,"hpCurrent":0,"peCurrent":0,"almaCurrent":100,"activeConditions":[],"customCounters":[],"combatLog":[]},"id":"teste-abas-vazia"},"criatura":{"system":"afty","rulesVersion":"afty","name":"Criatura (Teste Abas)","portraitUrl":null,"portraitFocus":{"x":50,"y":50},"core":{"tipo":"combatente","patamar":"desafio","nd":14,"tamanho":"medio","tecnicaAttr":"inteligencia","tecnicaDescricao":"","tecnicaEfeitos":[],"funcionamentosAdicionais":[],"origem":{"id":"inato"}},"alma":{"atual":100,"max":100},"qntPE":"normal","attrMethod":"fixos","attrLimite":{"forca":20,"destreza":20,"constituicao":20,"inteligencia":20,"sabedoria":20,"presenca":20},"attributes":{"forca":18,"destreza":12,"constituicao":16,"inteligencia":10,"sabedoria":10,"presenca":10},"attrNivel":{"forca":0,"destreza":0,"constituicao":0,"inteligencia":0,"sabedoria":0,"presenca":0},"pericias":{},"periciasOrdem":null,"periciasPersonalizadas":[],"periciaOficio":"","periciaOficios":{},"periciasOficiosExtras":[],"periciaAtributoManual":{},"periciasBonus":0,"resistenciasProf":{},"trDaClasse":[],"trSegundo":null,"trAtributoManual":{},"ataquesProf":{},"ataqueFineza":false,"ataqueBasicoId":"corpo","ataqueAtributoManual":{},"armasDedicadas":[],"defesasDano":{},"catarse":{"saldo":0,"compras":[]},"carteira":{"entradas":[],"gastos":[]},"espinho":{"almas":0,"outros":0,"compras":{},"equipamentos":[]},"tecnicasCombate":{"armas":[],"atributo":"inteligencia"},"talentosConfig":{"tal_mestre_das_armas":{"modo":"armas","armas":[],"grupo":null},"tal_tempestade_de_ideias":{"pericia":null,"ferramenta":"","vantagemPericia":null},"tal_artesao_amaldicoado":{"ferramenta":null}},"combate":{"ativo":false,"empolgacao":1,"insistenciaUsada":false,"manobraAjuste":false,"manobraDesarme":false,"manobraEsquiva":false,"manobraTrabalhoDePes":false,"manobraFinalizadora":null,"brutalidade":false,"brutalidadePE":0,"brutalidadePilha":0,"ataqueInconsequente":false,"impactoMisto":false,"resistirPE":0,"furiaVinganca":false,"imprudenciaMotivadora":false,"machucado":false,"abates":0,"armasAbsolutas":null,"auraElemental":true,"concentrarAura":[],"golpeComAura":null,"canalizarEmGolpe":false,"canalizacaoMaxima":false},"equipamentos":{"itens":[{"uid":"abas-cria-katana","tipo":"arma","refId":"arm_katana","qtd":1,"equipado":true}]},"armasCustom":[],"forjas":[],"especializacoes":[{"id":"combatente","nivel":14}],"feiticos":[],"reducoesCustoFeitico":{"dominancia":null,"manipulacao":[]},"estilosSombra":[],"estiloFuncionamento":{"texto":"","durabilidadeTrilha":null},"habilidadesGerais":[],"focosLivres":0,"periciaAtributo":"inteligencia","habilidades":["cmb_golpe_especial"],"escolhasHabilidade":{},"especializacaoConfig":{},"escolhasTalento":{},"talentos":[],"invocacoes":[],"origemContadores":{},"hordas":[],"quimeras":[],"fundamentosPerdidos":[],"aptidoes":{"au":0,"cl":0,"bar":0,"dom":0,"er":0},"aptidoesAmaldicoadas":[],"aptidaoOpcoes":{},"aptidaoOpcoesRepetidas":{},"dominios":[],"dominioAtivoId":null,"treinamentos":{},"treinamentoAlvos":{},"treinamentoEscolhas":{},"treinoEscolhaFeiticos":{},"votos":{"contratuais":[],"mecanicos":[]},"pacto":{"nome":"","descricao":"","maleficios":[],"beneficios":[]},"modificacoesCorporais":{"descricao":"","efeitosBase":[],"limite":0,"enxertos":[]},"tita":{"ativo":false,"membros":5},"caracteristicasAmaldicoadas":[],"caracteristicasAmaldicoadasAlvos":{},"treinosEspeciais":[],"treinoEspecialProgresso":{},"focosBonus":0,"statOverrides":{},"melhoriasSuperiores":[],"habilidadesLendarias":[],"escolhasAltoNivel":{},"aparencia":null,"preferenciasFicha":null,"addons":[],"narratorNotes":"","combatState":{"isActive":false,"hpCurrent":0,"peCurrent":0,"almaCurrent":100,"activeConditions":[],"customCounters":[],"combatLog":[]},"id":"teste-abas-criatura"}}`),sessoes:{"teste-abas-arsenal":{bloodfeastRegras:[],energiaEmVida:0,bloodfeast:{cargas:0,hardblood:0,bleed:0,sanidade:0,sangue:0,reutilizado:0,agua:!1,ativos:{},ultima:null},hpAtual:166,peAtual:80,pvTempFontes:{},peTempFontes:{},almaAtual:166,almaMaxVisto:166,rodada:0,propriedadesArmas:{turno:0,porArma:{},oscilante:null,ultimoAtaque:null},ataqueBasicoId:null,guardaGolpes:0,guardaEncerrada:!1,exaustao:0,exaustaoTecnica:null,combate:{ativo:!0},condicoes:[],buffs:[],invocacoes:{},tita:{cabeca:null,membros:[]},preparoAtual:null,preparoTemp:0,golpeEspecial:{},reservaInvocacao:{usada:!1,modo:null,restantes:0},quimeraDaCena:null,lideresDeHordaDissolvida:[],concedido:[],adaptacoes:{},dharma:{entradas:[],alvo:``,fenomeno:``,existencia:``},treinosAtivos:{},usos:{},recargas:{},ultimoFeiticoDanoId:null,rituais:{},ritualAtual:null,favoritos:[`especializacao:cmb_ataque_concentrado`,`equipamento:abas-katana-afiada`,`chave:que-nao-existe`,`especializacao:cmb_assumir_postura`],log:[],atualizadoEm:null},"teste-abas-conjurador":{bloodfeastRegras:[],energiaEmVida:0,bloodfeast:{cargas:0,hardblood:0,bleed:0,sanidade:0,sangue:0,reutilizado:0,agua:!1,ativos:{},ultima:null},hpAtual:165,peAtual:121,pvTempFontes:{},peTempFontes:{},almaAtual:165,almaMaxVisto:165,rodada:0,propriedadesArmas:{turno:0,porArma:{},oscilante:null,ultimoAtaque:null},ataqueBasicoId:null,guardaGolpes:0,guardaEncerrada:!1,exaustao:0,exaustaoTecnica:null,combate:{ativo:!0},condicoes:[],buffs:[],invocacoes:{},tita:{cabeca:null,membros:[]},preparoAtual:null,preparoTemp:0,golpeEspecial:{},reservaInvocacao:{usada:!1,modo:null,restantes:0},quimeraDaCena:null,lideresDeHordaDissolvida:[],concedido:[],adaptacoes:{},dharma:{entradas:[],alvo:``,fenomeno:``,existencia:``},treinosAtivos:{},usos:{},recargas:{},ultimoFeiticoDanoId:null,rituais:{},ritualAtual:null,favoritos:[`feitico-passivo:inexistente`],log:[],atualizadoEm:null},"teste-abas-mesa":{bloodfeastRegras:[`ultima_gota`,`bloodfeast`,`hardblood`,`robustez`],energiaEmVida:3,bloodfeast:{cargas:0,hardblood:0,bleed:0,sanidade:0,sangue:0,reutilizado:0,agua:!1,ativos:{},ultima:null},hpAtual:451,peAtual:60,pvTempFontes:{},peTempFontes:{},almaAtual:175,almaMaxVisto:175,rodada:0,propriedadesArmas:{turno:0,porArma:{},oscilante:null,ultimoAtaque:null},ataqueBasicoId:null,guardaGolpes:0,guardaEncerrada:!1,exaustao:0,exaustaoTecnica:null,combate:{ativo:!0},condicoes:[],buffs:[],invocacoes:{},tita:{cabeca:null,membros:[]},preparoAtual:null,preparoTemp:0,golpeEspecial:{},reservaInvocacao:{usada:!1,modo:null,restantes:0},quimeraDaCena:null,lideresDeHordaDissolvida:[],concedido:[],adaptacoes:{},dharma:{entradas:[],alvo:``,fenomeno:``,existencia:``},treinosAtivos:{},usos:{},recargas:{},ultimoFeiticoDanoId:null,rituais:{},ritualAtual:null,favoritos:[`especializacao:cmb_golpe_especial`,`especializacao:cmb_assumir_postura`,`especializacao:cmb_ataque_concentrado`,`especializacao:cmb_repertorio_do_especialista`,`especializacao:cmb_artes_do_combate`,`equipamento:abas-azamaru`,`chave:que-nao-existe`],log:[],atualizadoEm:null},"teste-abas-tipica":{bloodfeastRegras:[],energiaEmVida:0,bloodfeast:{cargas:0,hardblood:0,bleed:0,sanidade:0,sangue:0,reutilizado:0,agua:!1,ativos:{},ultima:null},hpAtual:155,peAtual:100,pvTempFontes:{},peTempFontes:{},almaAtual:155,almaMaxVisto:155,rodada:0,propriedadesArmas:{turno:0,porArma:{},oscilante:null,ultimoAtaque:null},ataqueBasicoId:null,guardaGolpes:0,guardaEncerrada:!1,exaustao:0,exaustaoTecnica:null,combate:{ativo:!0},condicoes:[],buffs:[],invocacoes:{},tita:{cabeca:null,membros:[]},preparoAtual:null,preparoTemp:0,golpeEspecial:{},reservaInvocacao:{usada:!1,modo:null,restantes:0},quimeraDaCena:null,lideresDeHordaDissolvida:[],concedido:[],adaptacoes:{},dharma:{entradas:[],alvo:``,fenomeno:``,existencia:``},treinosAtivos:{},usos:{},recargas:{},ultimoFeiticoDanoId:null,rituais:{},ritualAtual:null,favoritos:[`especializacao:cmb_golpe_especial`,`especializacao:cmb_ataque_concentrado`,`equipamento:abas-tip-azamaru`],log:[],atualizadoEm:null},"teste-abas-vazia":{bloodfeastRegras:[],energiaEmVida:0,bloodfeast:{cargas:0,hardblood:0,bleed:0,sanidade:0,sangue:0,reutilizado:0,agua:!1,ativos:{},ultima:null},hpAtual:0,peAtual:60,pvTempFontes:{},peTempFontes:{},almaAtual:0,almaMaxVisto:0,rodada:0,propriedadesArmas:{turno:0,porArma:{},oscilante:null,ultimoAtaque:null},ataqueBasicoId:null,guardaGolpes:0,guardaEncerrada:!1,exaustao:0,exaustaoTecnica:null,combate:{ativo:!1,invencivelSobOSol:!1,invencivelRodadas:0,invencivelPendenteExaustao:!1,talismaApice:null,talismaApiceRodadas:0},condicoes:[],buffs:[],invocacoes:{},tita:{cabeca:null,membros:[]},preparoAtual:null,preparoTemp:0,golpeEspecial:{},reservaInvocacao:{usada:!1,modo:null,restantes:0},quimeraDaCena:null,lideresDeHordaDissolvida:[],concedido:[],adaptacoes:{},dharma:{entradas:[],alvo:``,fenomeno:``,existencia:``},treinosAtivos:{},usos:{},recargas:{},ultimoFeiticoDanoId:null,rituais:{},ritualAtual:null,favoritos:[],log:[],atualizadoEm:null},"teste-abas-criatura":{bloodfeastRegras:[],energiaEmVida:0,bloodfeast:{cargas:0,hardblood:0,bleed:0,sanidade:0,sangue:0,reutilizado:0,agua:!1,ativos:{},ultima:null},hpAtual:264,peAtual:60,pvTempFontes:{},peTempFontes:{},almaAtual:100,almaMaxVisto:100,rodada:0,propriedadesArmas:{turno:0,porArma:{},oscilante:null,ultimoAtaque:null},ataqueBasicoId:null,guardaGolpes:0,guardaEncerrada:!1,exaustao:0,exaustaoTecnica:null,combate:{ativo:!0},condicoes:[],buffs:[],invocacoes:{},tita:{cabeca:null,membros:[]},preparoAtual:null,preparoTemp:0,golpeEspecial:{},reservaInvocacao:{usada:!1,modo:null,restantes:0},quimeraDaCena:null,lideresDeHordaDissolvida:[],concedido:[],adaptacoes:{},dharma:{entradas:[],alvo:``,fenomeno:``,existencia:``},treinosAtivos:{},usos:{},recargas:{},ultimoFeiticoDanoId:null,rituais:{},ritualAtual:null,favoritos:[],log:[],atualizadoEm:null}}},g=`/* Minamoto no Flugel — Céu de Íris.\r
   Mistura a composição clara da referência com as cores do retrato.\r
   Cole em Aparência > CSS Personalizado. */\r
\r
:scope#afty-ficha,\r
#afty-ficha#afty-ficha {\r
  --afty-fundo: #e7e5ed;\r
  --afty-fundo-brilho: radial-gradient(ellipse 82% 42% at 50% -8%, #d9c7e8, transparent 72%), radial-gradient(ellipse 54% 46% at 88% 16%, #d8e8e9, transparent 78%), linear-gradient(180deg, #efedf3, #e7e5ed 66%);\r
  --afty-card: #fbfafc;\r
  --afty-poco: #f2eff6;\r
  --afty-borda: #ded8e7;\r
  --afty-borda-forte: #bcaecb;\r
  --afty-texto: #2e2840;\r
  --afty-texto-suave: #5b526a;\r
  --afty-texto-fraco: #665d72;\r
  --afty-destaque: #69458b;\r
  --afty-destaque-texto: #573878;\r
  --afty-destaque-fundo: #e8dcf2;\r
  --afty-pv: #a33f65;\r
  --afty-pe: #286c7a;\r
  --afty-pvtemp: #916a36;\r
  --afty-petemp: #447d84;\r
  --afty-alma: #71458f;\r
  --afty-cura: #2d735b;\r
  --afty-aviso: #916a36;\r
  --afty-veu: rgb(33 28 51 / 0.48);\r
  --afty-raio: 15px;\r
  --afty-raio-peq: 9px;\r
  --afty-sombra: 0 1px 2px rgb(35 27 50 / 0.05), 0 12px 28px -13px rgb(63 45 88 / 0.22);\r
  background-color: #e7e5ed;\r
  background-image: none;\r
  color: #2e2840;\r
  color-scheme: light;\r
  scrollbar-color: #bbaaca transparent;\r
}\r
\r
/* O brilho mora numa camada fixa própria. Como fundo \`fixed\` da raiz, ele\r
   obrigava o navegador a redesenhar os três gradientes a cada quadro de rolagem. */\r
@media screen {\r
  :scope#afty-ficha::before,\r
  #afty-ficha#afty-ficha::before {\r
    content: "";\r
    position: fixed;\r
    inset: 0;\r
    z-index: 0;\r
    pointer-events: none;\r
    background-image: var(--afty-fundo-brilho);\r
  }\r
}\r
\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) *:focus-visible {\r
  outline: 2px solid #69458b;\r
  outline-offset: 2px;\r
}\r
\r
/* Faixa de íris e azul, com controles em porcelana. */\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-cabecalho {\r
  --afty-texto: #fff9fd;\r
  --afty-texto-suave: #f2eaf7;\r
  --afty-texto-fraco: #ece3f1;\r
  --afty-destaque: #dfc9f0;\r
  --afty-destaque-texto: #fff9fd;\r
  --afty-destaque-fundo: #f3e9fa33;\r
  --afty-borda: #d9c8e7;\r
  --afty-borda-forte: #e7dbee;\r
  --afty-poco: #544574;\r
  color: #fff9fd;\r
  background: radial-gradient(ellipse 40% 118% at 82% -30%, #d2b6df55, transparent 68%), radial-gradient(ellipse 28% 110% at 13% 120%, #87b7c744, transparent 72%), linear-gradient(180deg, #71558f 0%, #5b4c82 48%, #365e78 100%);\r
  border-bottom-color: #b9a9d0;\r
  box-shadow: 0 11px 25px -12px rgb(39 30 61 / 0.42);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-cabecalho::after {\r
  height: 2px;\r
  opacity: 0.9;\r
  background: linear-gradient(90deg, transparent, #dfc9f0 35%, #a9d0d5 70%, #d7bd96 92%, transparent);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-nome {\r
  color: #fff9fd;\r
  font-family: Georgia, "Times New Roman", serif;\r
  font-size: clamp(1.3rem, 2.2vw, 1.7rem);\r
  font-weight: 600;\r
  letter-spacing: 0.015em;\r
  line-height: 1.15;\r
  text-shadow: 0 1px 12px rgb(31 22 51 / 0.3);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-cabecalho .afty-chip {\r
  background: #faf8fc;\r
  border-color: #faf8fc;\r
  color: #513a6e;\r
  box-shadow: 0 3px 10px -6px rgb(26 20 47 / 0.45);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-cabecalho .afty-chip[data-afty-tom="destaque"] {\r
  background: #f0e7f8;\r
  color: #573878;\r
  border-color: #f0e7f8;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-cabecalho .afty-botao,\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-cabecalho .afty-passo {\r
  background: #faf8fc;\r
  border-color: #faf8fc;\r
  color: #513a6e;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-cabecalho .afty-botao:hover,\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-cabecalho .afty-passo:hover {\r
  background: #e9f2f3;\r
  color: #245d6a;\r
  border-color: #e9f2f3;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-retrato-painel {\r
  border-color: #f7edf9;\r
  box-shadow: 0 0 0 3px rgb(246 233 250 / 0.19), 0 10px 22px -8px rgb(25 24 48 / 0.42);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-retrato-painel::after {\r
  background: linear-gradient(180deg, transparent 72%, #28243b4d), linear-gradient(90deg, #dbc7e42b, transparent 55%);\r
}\r
\r
/* Porcelana branca e cor concentrada nas barras e números dos recursos. */\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital {\r
  --afty-texto: #2e2840;\r
  --afty-texto-suave: #5b526a;\r
  --afty-texto-fraco: #665d72;\r
  color: #2e2840;\r
  background: #fbfafc;\r
  border-color: #f5f1f8;\r
  box-shadow: 0 7px 19px -11px rgb(25 22 45 / 0.39);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital[data-afty-vital="pv"] {\r
  box-shadow: inset 0 3px 0 #a33f65, 0 7px 19px -11px rgb(25 22 45 / 0.39);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital[data-afty-vital="pe"] {\r
  box-shadow: inset 0 3px 0 #286c7a, 0 7px 19px -11px rgb(25 22 45 / 0.39);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital[data-afty-vital="alma"] {\r
  box-shadow: inset 0 3px 0 #71458f, 0 7px 19px -11px rgb(25 22 45 / 0.39);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-rotulo,\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-max {\r
  color: #5b526a;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-trilho {\r
  background: #e6e1ec;\r
  box-shadow: inset 0 1px 2px rgb(40 31 54 / 0.13);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital .afty-passo {\r
  background: #f4eff8;\r
  border-color: #dcd0e5;\r
  color: #5b526a;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-numero:focus {\r
  background: #f4eff8;\r
  border-color: var(--afty-vital-cor);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-barra {\r
  background: linear-gradient(90deg, color-mix(in srgb, var(--afty-vital-cor) 70%, white), var(--afty-vital-cor));\r
  box-shadow: none;\r
}\r
\r
/* Defesa em ouro fosco, CD em íris e os demais números neutros. */\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-stat {\r
  --afty-texto: #2e2840;\r
  --afty-texto-fraco: #5b526a;\r
  background: #fbfafc;\r
  border-color: #ede6f1;\r
  box-shadow: 0 4px 12px -10px rgb(22 19 45 / 0.32);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-stat[data-afty-stat="defesa"] {\r
  --afty-texto: #916a36;\r
  --afty-texto-fraco: #715733;\r
  background: #fff8ec;\r
  border-color: #dbc297;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-stat[data-afty-stat="cd"] {\r
  --afty-texto: #69458b;\r
  background: #f4ecfa;\r
  border-color: #d9c7e6;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-stat-rotulo {\r
  font-size: 0.625rem;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-abas {\r
  gap: 0.35rem;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-aba {\r
  background: rgb(255 249 253 / 0.16);\r
  border: 1px solid rgb(255 249 253 / 0.22);\r
  border-bottom: 2px solid transparent;\r
  border-radius: 9px 9px 0 0;\r
  color: #f7eef9;\r
  font-weight: 650;\r
  letter-spacing: 0.025em;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-aba:hover {\r
  background: rgb(255 249 253 / 0.27);\r
  color: #ffffff;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-aba[aria-selected="true"] {\r
  background: #fbfafc;\r
  border-color: #fbfafc;\r
  border-bottom-color: #fbfafc;\r
  color: #573878;\r
  box-shadow: 0 -2px 12px -5px rgb(255 255 255 / 0.65);\r
}\r
\r
/* Corpo claro e macio: mais estrutura, menos massa lilás. */\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-card,\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-inv-ficha,\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-log,\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-fontes,\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-busca {\r
  color: #2e2840;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-card {\r
  background: #fbfafc;\r
  border-color: #ded8e7;\r
  box-shadow: var(--afty-sombra);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-card-titulo {\r
  display: flex;\r
  align-items: center;\r
  gap: 0.5rem;\r
  color: #3f3555;\r
  font-size: 0.75rem;\r
  letter-spacing: 0.1em;\r
  border-bottom: 1px solid #e4deeb;\r
  padding-bottom: 0.45rem;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-card-titulo::before {\r
  content: "";\r
  flex: 0 0 auto;\r
  width: 4px;\r
  height: 1.05em;\r
  border-radius: 999px;\r
  background: linear-gradient(180deg, #a283bc, #69458b);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-linha {\r
  background: #f2eff6;\r
  border-color: #e5dfec;\r
  color: #2e2840;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-linha:hover {\r
  background: #ece6f2;\r
  border-color: #c9b7d7;\r
  box-shadow: inset 3px 0 0 #69458b;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-linha[data-afty-destacada="sim"] {\r
  background: #eee6f5;\r
  border-color: #c7b2d9;\r
  box-shadow: inset 3px 0 0 #69458b;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-rotulo {\r
  color: #5b526a;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-valor {\r
  color: #2e2840;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-rolavel {\r
  color: #573878;\r
  background: #ebe2f3;\r
  border: 1px solid #cbb6dd;\r
  border-radius: 999px;\r
  padding: 0.05em 0.45em;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-rolavel:hover {\r
  color: #fff9fd;\r
  background: #69458b;\r
  border-color: #69458b;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-atributo {\r
  --afty-texto: #2e2840;\r
  --afty-texto-fraco: #5b526a;\r
  --afty-destaque-texto: #fff9fd;\r
  --afty-destaque-fundo: #69458b;\r
  color: #2e2840;\r
  background: linear-gradient(180deg, #faf8fc, #f2edf7);\r
  border-color: #ded3e8;\r
  box-shadow: 0 5px 13px -12px rgb(44 28 68 / 0.4);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-atributo-mod {\r
  background: #69458b;\r
  color: #fff9fd;\r
  border-radius: 999px;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-texto {\r
  color: #4b435c;\r
  background: #f7f4fa;\r
  border-left: 3px solid #c8b4d9;\r
  border-radius: 0 9px 9px 0;\r
  padding: 0.55rem 0.75rem;\r
  font-size: 0.875rem;\r
  line-height: 1.65;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-subaba[aria-selected="true"] {\r
  background: #69458b;\r
  border-color: #69458b;\r
  color: #fff9fd;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-ficha-corpo .afty-botao {\r
  background: #fbfafc;\r
  color: #513a6e;\r
  border-color: #cbbbd9;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-ficha-corpo .afty-botao:hover {\r
  background: #ede5f4;\r
  border-color: #8d6ba8;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-fontes,\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-busca,\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-log {\r
  background: #fbfafc;\r
  border-color: #d8cde3;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-log-topo {\r
  background: linear-gradient(100deg, #71558f, #3b617b);\r
  color: #fff9fd;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-log-topo .afty-log-modo {\r
  color: #f3e9f7;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-log-topo .afty-log-modo[aria-pressed="true"] {\r
  color: #573878;\r
  background: #fbfafc;\r
  border-color: #fbfafc;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-log-topo .afty-passo {\r
  color: #fff9fd;\r
  background: #fff9fd2b;\r
  border-color: #fff9fd82;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-rolagem {\r
  background: #f2eff6;\r
  border-color: #e2d9eb;\r
  color: #2e2840;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) ::selection {\r
  background: #d5bce7;\r
  color: #2e2840;\r
}\r
\r
/* Botões ativos: estado inequívoco em violeta. */\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) button.afty-botao[aria-pressed="true"] {\r
  color: #fff9fd;\r
  background: linear-gradient(180deg, #7d58a0, #69458b);\r
  border-color: #8e69aa;\r
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.18), 0 4px 12px -6px rgb(74 45 101 / 0.65);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) button.afty-botao[aria-pressed="true"]:hover {\r
  color: #ffffff;\r
  background: linear-gradient(180deg, #704a93, #593675);\r
  border-color: #9a76b5;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-log-topo .afty-log-modo[aria-pressed="true"] {\r
  color: #fff9fd;\r
  background: #69458b;\r
  border-color: #a98ac0;\r
  box-shadow: 0 3px 10px -5px rgb(45 27 68 / 0.72);\r
}\r
`,_=`/* Alter Lucielos: grafite profundo, violeta e ciano intenso.\r
   Cores guiadas pelas duas imagens enviadas pelo usuario. */\r
\r
:scope#afty-ficha,\r
#afty-ficha#afty-ficha {\r
  --afty-fundo: #0B0A10;\r
  --afty-fundo-brilho: radial-gradient(75% 55% at 84% -8%, rgb(97 28 145 / 0.2), transparent 72%), radial-gradient(80% 65% at 4% 68%, rgb(0 115 155 / 0.1), transparent 75%);\r
  --afty-card: #19171F;\r
  --afty-poco: #111016;\r
  --afty-borda: #37323F;\r
  --afty-borda-forte: #665C70;\r
  --afty-texto: #F2F1F4;\r
  --afty-texto-suave: #BDB9C3;\r
  --afty-texto-fraco: #9D97A5;\r
  --afty-destaque: #16C5E8;\r
  --afty-destaque-texto: #EDFCFF;\r
  --afty-destaque-fundo: #103542;\r
  --afty-pv: #DA4C89;\r
  --afty-pe: #16C5E8;\r
  --afty-pvtemp: #9F3E72;\r
  --afty-petemp: #EDFCFF;\r
  --afty-alma: #9B4BD2;\r
  --afty-cura: #0BB99F;\r
  --afty-aviso: #BA4BCC;\r
  --afty-veu: rgb(5 9 14 / 0.78);\r
  --afty-raio: 10px;\r
  --afty-raio-peq: 6px;\r
  --afty-sombra: 0 12px 28px rgb(0 0 0 / 0.2);\r
  --afty-fonte-titulo: Georgia, "Times New Roman", serif;\r
  background-color: var(--afty-fundo);\r
  color: var(--afty-texto);\r
  color-scheme: dark;\r
  scrollbar-color: #665C70 #111016;\r
}\r
\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) ::selection {\r
  background: #12627A;\r
  color: #F5FDFF;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) :focus-visible {\r
  outline: 3px solid #18CBEF;\r
  outline-offset: 3px;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-cabecalho {\r
  background-color: #111016;\r
  background-image: linear-gradient(110deg, rgb(44 25 59 / 0.7), transparent 58%, rgb(23 64 76 / 0.18));\r
  border-bottom-color: #4B3B5A;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-cabecalho::after {\r
  background: linear-gradient(90deg, transparent 3%, #8735C2 42%, #16C5E8 68%, transparent 97%);\r
  opacity: 0.65;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-nome {\r
  letter-spacing: 0.025em;\r
  text-shadow: 0 1px 0 #08070C;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-retrato-painel {\r
  border-color: #5D526A;\r
  box-shadow: 0 0 0 1px #26212D, 0 12px 30px rgb(0 0 0 / 0.38);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-retrato-painel::after {\r
  background: linear-gradient(180deg, transparent 55%, rgb(11 10 16 / 0.82));\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-chip {\r
  background: #211E29;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-chip[data-afty-tom="destaque"] {\r
  background: #103542;\r
  border-color: #149EBB;\r
  color: #E9FAFE;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital {\r
  padding-inline: 0.55rem;\r
  background: linear-gradient(145deg, #201D28, #15131C);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital .afty-base {\r
  gap: 0.3rem;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-rotulo {\r
  letter-spacing: 0.045em;\r
  color: #D8D4DC;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-numero:focus {\r
  outline: 3px solid #18CBEF;\r
  outline-offset: 2px;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-trilho {\r
  background: #09080D;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-barra {\r
  background: var(--afty-vital-cor);\r
  box-shadow: 0 0 8px color-mix(in srgb, var(--afty-vital-cor) 30%, transparent);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-stat,\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-atributo {\r
  background: #1A1821;\r
  border-color: #443D4E;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-stat-rotulo,\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-atributo-rotulo {\r
  color: #B8B2C1;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-atributo-mod {\r
  background: #372047;\r
  color: #C279EC;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-aba {\r
  border-radius: 6px 6px 0 0;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-aba:hover:not([aria-selected="true"]) {\r
  background: #2B2534;\r
  color: #F3EFF7;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-aba[aria-selected="true"] {\r
  background: #103542;\r
  border-bottom-color: #16C5E8;\r
  color: #E9FAFE;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-subaba[aria-selected="true"] {\r
  background: #103542;\r
  border-color: #149EBB;\r
  color: #E9FAFE;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-card {\r
  background: linear-gradient(155deg, #1E1B26, #17151E 65%);\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-card-titulo {\r
  color: #AD64DC;\r
  letter-spacing: 0.11em;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-linha {\r
  background: #131119;\r
  border-color: #37313F;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-linha:hover {\r
  background: #26212F;\r
  border-color: #685A78;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-linha[data-afty-destacada="sim"] {\r
  background: #23192E;\r
  border-color: #149EBB;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-botao:hover:not(:disabled) {\r
  background: #302936;\r
  color: #F3EFF7;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-botao[data-afty-tom="destaque"] {\r
  background: #103542;\r
  border-color: #149EBB;\r
  color: #E9FAFE;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-botao[data-afty-tom="destaque"]:hover:not(:disabled) {\r
  background: #135468;\r
  border-color: #16C5E8;\r
  color: #F3FDFF;\r
}\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-espinho {\r
  --espinho-texto-fraco: #B9A7C7;\r
}\r
@media (min-width: 1200px) and (max-width: 1399px) {\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital { padding-inline: 0.375rem; }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital .afty-base { gap: 0.18rem; }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-rotulo {\r
    font-size: 0.625rem;\r
    letter-spacing: 0.025em;\r
  }\r
}\r
@media print {\r
  :scope#afty-ficha,\r
  #afty-ficha#afty-ficha {\r
    --afty-fundo: #ffffff;\r
    --afty-fundo-brilho: none;\r
    --afty-card: #ffffff;\r
    --afty-poco: #ffffff;\r
    --afty-borda: #b8b5c2;\r
    --afty-borda-forte: #827e90;\r
    --afty-texto: #23212d;\r
    --afty-texto-suave: #464251;\r
    --afty-texto-fraco: #5c5767;\r
    --afty-destaque: #603b78;\r
    --afty-destaque-texto: #56366c;\r
    --afty-destaque-fundo: transparent;\r
    --afty-pv: #744969;\r
    --afty-pe: #16566c;\r
    --afty-pvtemp: #6e557d;\r
    --afty-petemp: #28637a;\r
    --afty-alma: #694485;\r
    --afty-cura: #31636a;\r
    --afty-aviso: #6e557d;\r
    --afty-sombra: none;\r
    --afty-imagem: none;\r
    background: #ffffff;\r
    color: #23212d;\r
    color-scheme: light;\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-cabecalho,\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-card,\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital,\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-stat,\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-atributo,\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-linha,\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-chip {\r
    background: #ffffff;\r
    background-image: none;\r
    box-shadow: none;\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-card-titulo,\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-atributo-mod {\r
    color: #56366c;\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-atributo-mod,\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-trilho {\r
    background: #ffffff;\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-barra {\r
    background: var(--afty-vital-cor);\r
    box-shadow: none;\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-retrato-painel { box-shadow: none; }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-retrato-painel::after { background: none; }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-espinho {\r
    --espinho-aviso: #6e557d;\r
    --espinho-texto-fraco: #5a5662;\r
  }\r
}\r
\r
/* Duas colunas no celular deixam as abas acessiveis sem um cabecalho gigante. */\r
@media (max-width: 600px) {\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-cabecalho-principal > .grid {\r
    grid-template-columns: repeat(2, minmax(0, 1fr));\r
    gap: 0.375rem;\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital {\r
    min-width: 0;\r
    padding: 0.4rem 0.45rem;\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital .afty-base {\r
    flex-wrap: wrap;\r
    column-gap: 0.18rem;\r
    row-gap: 0.1rem;\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-rotulo {\r
    flex: 1 0 calc(100% - 1.4rem);\r
    font-size: 0.625rem;\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-numero {\r
    width: 3.25rem;\r
    font-size: 1.25rem;\r
    text-align: left;\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-max {\r
    font-size: 0.625rem;\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-trilho {\r
    margin-top: 0.3rem;\r
  }\r
}\r
\r
@media print {\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-rotulo,\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-stat-rotulo,\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-atributo-rotulo {\r
    color: #464251;\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-chip[data-afty-tom="destaque"] {\r
    background: #ffffff;\r
    border-color: #603b78;\r
    color: #56366c;\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-guarda {\r
    opacity: 1;\r
  }\r
}\r
\r
@media (max-width: 340px) {\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-numero {\r
    width: 2.6rem;\r
    font-size: 1rem;\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital-max {\r
    font-size: 0.5625rem;\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital .afty-base {\r
    column-gap: 0.1rem;\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-stats {\r
    grid-template-columns: repeat(4, minmax(0, 1fr));\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-stat-rotulo {\r
    letter-spacing: 0.02em;\r
  }\r
}\r
\r
@media (max-width: 600px) {\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-cabecalho[data-afty-compacto="sim"] .afty-stats {\r
    display: none;\r
  }\r
}\r
\r
@media (max-width: 600px) {\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-item-lista button > span.truncate,\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-linha > span.truncate {\r
    white-space: normal;\r
    overflow: visible;\r
    text-overflow: clip;\r
    overflow-wrap: anywhere;\r
  }\r
}\r
\r
:is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital[data-afty-vital="preparo"] {\r
  --afty-vital-cor: #8A8294;\r
}\r
@media print {\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-vital[data-afty-vital="preparo"] {\r
    --afty-vital-cor: #5c5767;\r
  }\r
}\r
\r
@media print {\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-linha:hover,\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) .afty-linha[data-afty-destacada="sim"] {\r
    background: #ffffff;\r
    color: #23212d;\r
  }\r
  :is(:scope#afty-ficha, #afty-ficha#afty-ficha) :focus-visible {\r
    outline: none;\r
  }\r
}\r
`,v=`modulepreload`,y=function(e,t){return new URL(e,t).href},b={},x=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=y(t,n),t in b)return;b[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:v,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},S=(0,f.lazy)(()=>x(()=>import(`./AftyFichaG2-CsGJ7v13.js`),__vite__mapDeps([0,1,2,3,4]),import.meta.url)),C=(0,f.lazy)(()=>x(()=>import(`./AftyFichaClassica-1FtNy9p2.js`),__vite__mapDeps([5,1,2,3]),import.meta.url)),w=Object.assign({"./temas/demo-papel.css":o,"./temas/demo-vitral.css":s,"./temas/probe.css":c,"./temas/receita-g2.css":l,"./temas/receita-is.css":u}),T={minamoto:g,"alter-lucielos":_},E=e=>T[e]??w[`./temas/${e}.css`]??``,D=`
.afty-card { border-color: #e11d48 !important; }
.afty-linha:hover { outline: 1px dashed #f59e0b; }
.afty-valor { color: #22d3ee !important; }
[data-afty-aba="acoes"][aria-selected="true"] { color: #22d3ee !important; }
`,O=D.replace(/ !important/g,``),k={escuro:null,claro:{presetId:`pergaminho`},minamoto:{presetId:`padrao`,css:E(`minamoto`),ligado:!0},alter:{presetId:`padrao`,css:E(`alter-lucielos`),ligado:!0},"teste-important":{presetId:`padrao`,css:D,ligado:!0},teste:{presetId:`padrao`,css:O,ligado:!0},quebrado:{presetId:`padrao`,css:`.afty-busca, .afty-busca-fundo { display: none; } .afty-cabecalho { display: none; } main { visibility: hidden; }`,ligado:!0}},A=new URLSearchParams(location.search),j=A.get(`ficha`);window.__salvos=[];function M(){let e=A.get(`css`),t=A.get(`preset`);return e?{presetId:t||`padrao`,css:E(e),ligado:!0}:t?{presetId:t}:k[A.get(`tema`)]??null}var N=e=>`fm_ficha_sessao_afty_v1:${e}`;function P(){let e=h.fichas[j],t=M(),[n,r]=(0,f.useState)(()=>({...e,...t?{aparencia:t}:{}})),i=(0,f.useCallback)(e=>t=>{e===`aparencia`&&window.__salvos.push({em:Date.now(),valor:JSON.parse(JSON.stringify(t))}),r(n=>({...n,[e]:t}))},[]),a=A.get(`modo`);return(0,m.jsx)(a===`classica`?C:S,{creature:n,previaAbasG2:a!==`classica`&&a!==`g2-sem-previa`,onVoltar:()=>{location.href=location.pathname},onEditar:()=>window.alert(`O criador não faz parte deste executor.`),onSalvarTema:i(`aparencia`),onSalvarInvocacoes:i(`invocacoes`),onSalvarEspinho:i(`espinho`),onSalvarFundamentosPerdidos:i(`fundamentosPerdidos`),onSalvarPreferencias:i(`preferenciasFicha`),onSalvarPacotesAliados:i(`pacotesAliados`),onSalvarRecebidos:i(`pacotesRecebidos`)})}if(j&&h.fichas[j]){let e=h.fichas[j];try{localStorage.getItem(N(e.id))||localStorage.setItem(N(e.id),JSON.stringify(h.sessoes[e.id]))}catch{}t(e.addons??[]),document.title=`${e.name} · Revisão CSS`}(0,p.createRoot)(document.getElementById(`root`)).render((0,m.jsx)(f.StrictMode,{children:j&&h.fichas[j]?(0,m.jsx)(f.Suspense,{fallback:null,children:(0,m.jsx)(P,{})}):(0,m.jsx)(`main`,{style:{padding:24,color:`#e2e8f0`,font:`15px system-ui`},children:`Use ?ficha=mesa|tipica|arsenal|conjurador|vazia|criatura`})}));