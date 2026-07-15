# Fórmulas base — Grimório Afty (cálculos de criatura)

Fonte da verdade das fórmulas reais do Afty, enviadas pelo autor em 2026-07-15, no
formato de planilha (funções em PT-BR: `SWITCH`, `SE`=IF, `IFS`, `ARREDONDAR.PARA.BAIXO`=
FLOOR, `INT`=parte inteira, `MAIOR(intervalo;k)`=k-ésimo maior, `VERDADEIRO`=TRUE).

> ⚠️ O motor atual `src/systems/afty/afty-derive.js` usa coeficientes PLACEHOLDER. Ele
> deve ser substituído por estas fórmulas **depois** que as perguntas em aberto (fim do
> arquivo) forem respondidas. Não implementar antes de confirmar.

---

## Correções estruturais ao que estava assumido

O que estas fórmulas revelam e que contradiz o esquema v0 (`createBlankAfty`):

1. **A criatura Afty usa ND + Patamar + Tipo** — não só "nível + tipo".
   - **ND** (Nível de Desafio) é o driver numérico. 1 → ∞ (aparece `ND>=26`, `ND>=30`).
     Provável que "Nível" (falado antes) == **ND**. Confirmar.
   - **Patamar**: `Lacaio | Comum | Desafio | Calamidade | Maldição` (multiplica HP, libera
     Guarda/Resistência, escala atributos). Note: difere da 2.5.2 (que tinha capanga; aqui
     não, e ganhou "Maldição").
   - **Tipo**: `Combatente | Misto | Conjurador | Restringido` (arquétipo → coeficientes).
2. **Atributos = Força, Destreza, Constituição, Inteligência, Sabedoria, CARISMA** (`Mod.Car`).
   O v0 usou "Presença" — provável que seja **Carisma**. Confirmar.
3. **Alma / Integridade (0–100)** escala TODO o HP: `HP × (Alma.Atual/100)`.
4. **Treinamentos** alimentam pesado quase todo stat (por isso é aba própria, "diferente da
   2.5.2"). O mapa célula→treino está tabelado abaixo.
5. **Inventário** (grau de item equipado) entra em Defesa e RD.
6. **Maestria == Treinamento** (mesmo valor), derivado do ND.

---

## Variáveis de entrada (inputs)

| Variável | Origem | Valores / notas |
|---|---|---|
| `ND` | escolha | inteiro 1 → ∞ |
| `Patamar` | escolha | Lacaio, Comum, Desafio, Calamidade, Maldição |
| `Tipo` | escolha | Combatente, Misto, Conjurador, Restringido |
| `Alma.Atual` / `Alma.Max` | Integridade | 0–100, Max=100 |
| `Mod.For/Dex/Con/Int/Sab/Car` | derivado dos atributos | modificador |
| `Qnt.PE` | escolha | Muito Pouca, Pouca, Normal, Grande, Muito Grande |
| `Mod.Tecnica` | escolha? | qual atributo a técnica usa (Força/…/Carisma) — **?** |
| `Mod.Tecnica.Numerico` | ? | valor numérico da técnica — **origem?** |
| `Maestria` = `Treinamento` | derivado | ver fórmula abaixo |
| `Percepção` | perícia | (perícias virão depois) |
| `Inventario!AQ14` | item equipado | grau que dá bônus de **Defesa** |
| `Inventario!AQ24` | item equipado | grau que dá bônus de **RD** |
| `Criatura!CN7`, `Criatura!CU9` | ? | usados em Guarda — **origem?** |
| `Z8:Z9`, `Z8:Z13` | ? | `MAIOR()` em Movimento/RD — **conteúdo?** |
| Treinamentos!… (checkboxes) | aba Treinamentos | ver tabela de mapeamento |

> Os termos `+ SE(A1=VERDADEIRO;"Nome do Treino";0)` nas fórmulas **sempre valem 0** — são
> auto-documentação (rótulo que diz qual treino cada célula representa). Podem ser ignorados
> no cálculo; foram usados para montar a tabela de mapeamento abaixo.

---

## Fórmulas (verbatim + decodificadas)

### Alma / Integridade
`Alma.Max = 100`. `Alma.Atual` = valor corrente (0–100). Escala o HP.

### HP.Max
```
=(Alma.Atual/100)*((
  SWITCH(Tipo;"Combatente";12 + ((ND-1)*6);"Misto";10 + ((ND-1)*5);"Conjurador";10 + ((ND-1)*5);"Restringido";12 * ND)
  +(ND * Mod.Con)
  +SE(Treinamentos!AS17;4;0)   // Treino de Resistência - 1ª Etapa
  +SE(Treinamentos!AS18;5;0)   // Treino de Resistência - 2ª Etapa
  +SE(Treinamentos!AS20;6;0)   // Treino de Resistência - 4ª Etapa
  +SE(Treinamentos!AS20;10;0)  // Treino de Resistência - Completo  ⚠ AS20 repetido
)*2)*SWITCH(Patamar;"Calamidade";1,5;"Maldição";2;1)
```
Decodificado:
```
base = Tipo==Combatente ? 12+(ND-1)*6
     : Tipo∈{Misto,Conjurador} ? 10+(ND-1)*5
     : Restringido ? 12*ND
treinoRes = 4·[Res1ª] + 5·[Res2ª] + 6·[Res4ª] + 10·[ResCompleto]
patamarMult = Calamidade?1.5 : Maldição?2 : 1
HP = (Alma.Atual/100) × ((base + ND·Mod.Con + treinoRes) × 2) × patamarMult
```

### PE.Max
```
=SWITCH(Tipo;"Combatente";4*ND;"Misto";5*ND;"Conjurador";6*ND;"Restringido";4*ND)
+SWITCH(Qnt.PE;"Muito Pouca";-ND;"Pouca";-ARREDONDAR.PARA.BAIXO(ND/2);"Normal";0;"Grande";+ARREDONDAR.PARA.BAIXO(ND/2);"Muito Grande";+ND)
+Mod.Tecnica.Numerico
+SE(Treinamentos!AA5;1;0)   // Compreensão 1ª
+SE(Treinamentos!AA7;2;0)   // Compreensão 3ª
+SE(Treinamentos!AJ5;2;0)   // Controle de Energia 1ª
+SE(Treinamentos!AJ7;3;0)   // Controle de Energia 3ª
+SE(Treinamentos!AJ17;2;0)  // Potencial Físico 1ª
+SE(Treinamentos!AJ19;4;0)  // Potencial Físico 3ª
```

### Maestria / Treinamento (mesmo valor)
```
=IFS(ND>=26;8;ND>=21;7;ND>=17;6;ND>=13;5;ND>=9;4;ND>=5;3;ND>=1;2)
```

### Guarda
```
=SWITCH(Patamar;
 "Lacaio";0;"Comum";0;"Desafio";0;
 "Calamidade";SE(Criatura!CN7>=0;SWITCH(Criatura!CU9;0;5;1;3;2;1;3;0;4;0;5;0);0);
 "Maldição";  SE(Criatura!CN7>=0;SWITCH(Criatura!CU9;0;10;1;8;2;6;3;4;4;2;5;0);0))
```
Decodificado: só Calamidade/Maldição têm Guarda; se `CN7>=0`, valor por índice `CU9` (0–5):
- Calamidade: [5,3,1,0,0,0]; Maldição: [10,8,6,4,2,0].

### Resistência Parcial  *(autor: "melhore, fiz na gambiarra")*
```
=SWITCH(Patamar;"Lacaio";0;"Comum";0;"Desafio";0;
 "Calamidade";2 + SE(ND>=15;1;0)+SE(ND>=20;1;0)+SE(ND>=25;1;0)+SE(ND>=30;1;0);
 "Maldição";  4 + SE(ND>=15;1;0)+SE(ND>=20;1;0)+SE(ND>=25;1;0)+SE(ND>=30;1;0))
```
Decodificado (limpo): base (Calamidade 2 / Maldição 4) + 1 por limiar de ND {15,20,25,30}.

### Movimento
```
=9 + (MAIOR(Z8:Z9;1) * 1,5)
+SE(Treinamentos!I5;1,5;0)   // Agilidade 1ª
+SE(Treinamentos!I8;4,5;0)   // Agilidade Completo
```

### RD.Geral
```
=SWITCH(Tipo;
 "Conjurador";SE(ND>=10;ARREDONDAR.PARA.BAIXO(ND/2);0);
 "Misto";SE(ND>=10;ND;ARREDONDAR.PARA.BAIXO(ND/2));
 "Combatente";SE(ND>=10;MAIOR(Z8:Z13;1);0) + ND;
 "Restringido";SE(ND>=10;MAIOR(Z8:Z13;1);0) + ND)
+SWITCH(Inventario!AQ24;"Sem Grau";0;"Quarto Grau";1;"Terceiro Grau";2;"Segundo Grau";3;"Primeiro Grau";4;"Grau Zero";5;"Grau Especial";10)
```

### RD.Específico
```
=SWITCH(Tipo;
 "Conjurador";Mod.Tecnica.Numerico;
 "Misto";SE(ND>=10;2*Mod.Tecnica.Numerico;Mod.Tecnica.Numerico);
 "Combatente";0;"Restringido";0)
```

### CD
```
=10 + SWITCH(Tipo;"Combatente";INT(ND/1,75);"Misto";INT(ND/1,5);"Conjurador";INT(ND/1,25);"Restringido";INT(ND/1,75))
   + (SWITCH(Mod.Tecnica;"Força";Mod.For;"Destreza";Mod.Dex;"Constituição";Mod.Con;"Inteligência";Mod.Int;"Sabedoria";Mod.Sab;"Carisma";Mod.Car) + Maestria)
```

### Atenção
`= 10 + Percepção`  *(perícias virão depois)*

### Defesa / CA (mesmo valor)
```
=10 + SWITCH(Tipo;"Combatente";INT(ND/1,25);"Misto";INT(ND/1,5);"Conjurador";INT(ND/1,75);"Restringido";INT(ND/1,25))
   + Mod.Dex + Maestria
+SWITCH(Inventario!AQ14;"Sem Grau";0;"Quarto Grau";1;"Terceiro Grau";2;"Segundo Grau";3;"Primeiro Grau";4;"Grau Zero";5;"Grau Especial";6)
+SE(Treinamentos!I17;3;0)   // Luta 2ª
```

### Total.Aptidão (nº de níveis de Aptidão)
```
=SE(ND>=2;1;0)+SE(ND>=4;1;0)+SE(ND>=6;1;0)+SE(ND>=8;1;0)+SE(ND>=10;2;0)
+SE(ND>=12;1;0)+SE(ND>=14;1;0)+SE(ND>=16;1;0)+SE(ND>=18;1;0)+SE(ND>=20;2;0)
+SE(Qnt.PE="Muito Grande";1;0)   // Raio Negro
+SE(Treinamentos!R6;1;0)    // Barreiras 2ª
+SE(Treinamentos!AA6;1;0)   // Compreensão 2ª
+SE(Treinamentos!AA8;1;0)   // Compreensão Completo
+SE(Treinamentos!AJ8;1;0)   // Controle de Energia 4ª
+SE(Treinamentos!AA18;1;0)  // Energia Reversa 2ª
```

### Total.Atributos (pontos de atributo)
```
=76 + SWITCH(Patamar;"Maldição";4;3)
   + (ARREDONDAR.PARA.BAIXO(ND/4) * SWITCH(Patamar;"Lacaio";1;"Comum";2;"Desafio";2;"Calamidade";3;"Maldição";3))
+SE(Treinamentos!AJ18;2;0)   // Potencial Físico 2ª
+SE(Treinamentos!AJ29;1;0)+SE(Treinamentos!AJ30;1;0)+SE(Treinamentos!AJ31;1;0)+SE(Treinamentos!AJ32;1;0)  // Treino de Atributo 1 (1ª–4ª)
+SE(Treinamentos!AS29;1;0)+SE(Treinamentos!AS30;1;0)+SE(Treinamentos!AS31;1;0)+SE(Treinamentos!AS32;1;0)  // Treino de Atributo 1 (1ª–4ª) ⚠ 2º bloco também rotulado "Atributo 1"
```

---

## Mapa célula → Treinamento (extraído dos rótulos `A1`)

| Célula | Treino | Efeito |
|---|---|---|
| AS17 | Resistência 1ª | +4 HP |
| AS18 | Resistência 2ª | +5 HP |
| AS20 | Resistência 4ª | +6 HP |
| AS20 ⚠ | Resistência Completo | +10 HP (célula repetida — provável typo) |
| AA5 | Compreensão 1ª | +1 PE |
| AA6 | Compreensão 2ª | +1 Aptidão |
| AA7 | Compreensão 3ª | +2 PE |
| AA8 | Compreensão Completo | +1 Aptidão |
| AA18 | Energia Reversa 2ª | +1 Aptidão |
| AJ5 | Controle de Energia 1ª | +2 PE |
| AJ7 | Controle de Energia 3ª | +3 PE |
| AJ8 | Controle de Energia 4ª | +1 Aptidão |
| AJ17 | Potencial Físico 1ª | +2 PE |
| AJ18 | Potencial Físico 2ª | +2 Atributos |
| AJ19 | Potencial Físico 3ª | +4 PE |
| AJ29–32 | Atributo 1 (1ª–4ª) | +1 Atributo cada |
| AS29–32 | "Atributo 1" (1ª–4ª) ⚠ | +1 Atributo cada (2º bloco, rótulo duplicado — Atributo 2?) |
| I5 | Agilidade 1ª | +1,5 Movimento |
| I8 | Agilidade Completo | +4,5 Movimento |
| I17 | Luta 2ª | +3 Defesa |
| R6 | Barreiras 2ª | +1 Aptidão |

---

## Respostas do autor (2026-07-15) — RESOLVIDO

1. **Nível == ND** (Nível de Desafio). ✅
2. **Patamares = {Comum, Desafio, Calamidade, Maldição}** — **SEM Lacaio** (corrigido; a
   fórmula da Guarda ainda cita Lacaio, mas ele não existe no modelo final). ✅
3. **6º atributo = Presença** (`Mod.Car` é só o nome antigo — usar `presenca`). ✅
4. **Alma/Integridade** = "Integridade da Alma". Vai de 0 a **100+** (poderes aumentam).
   Multiplicador linear de HP: `HP × (Alma.Atual/100)`. 50 → metade; 150 → 1,5×. Default 100. ✅
5. **Mod.Técnica** = modificador do **atributo de CD**, escolhido por ficha. **Mod.Técnica.Numérico**
   era gambiarra (texto→número); no app é só `mod(atributo_da_técnica)`. ✅
6. **Qnt.PE** = escolha por ficha (Muito Pouca…Muito Grande). ✅
7. **Z8:Z9** = maior entre Mod.Força e Mod.Destreza. **Z8:Z13** = maior modificador de atributo
   geral (dos 6). ✅
8. **`Inventario!AQ14`/`AQ24`** = grau do item equipado (Defesa/RD). ✅

### ADIADO (anotado, não implementar ainda)

- **Todas as contribuições de TREINAMENTO** (todos os termos `Treinamentos!…`). Marcadas `TODO`
  em `afty-derive.js`.
- **GUARDA** (`CU9` = contador de ataques consecutivos; a Guarda aumenta Defesa e TRs até ser
  quebrada). Lembrar o autor depois. `derived.guarda = null` por ora.
- **Perícias** → Atenção usa Percepção = 0 provisoriamente.
- **Grau de item** vem do Inventário (ainda não construído): lido de
  `creature.inventario.{defesaGrau,rdGrau}`, default "Sem Grau" (0).
- Typos (AS20 duplicado; 2º bloco AS29–32) — irrelevantes por ora (são de Treinamento).

> **Status:** `afty-derive.js` e `createBlankAfty` já implementam TODAS as fórmulas acima
> (menos os itens ADIADOS). Verificado com valores conferidos à mão.
