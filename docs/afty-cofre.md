# Cofre de Texto

Como mandar uma ficha para avaliação pública sem mandar junto o conteúdo pago que ela usa.
Escrito em 2026-09-08, junto com o código. Leia com `afty-addons.md` (a tese das primitivas) e
`afty-ficha-final.md` (a tela de jogo).

> O Cofre não esconde o texto. Ele TIRA o texto da ficha e guarda um blob cifrado no lugar.
>
> Ele cobre o texto da ficha **e o texto do catálogo dos addons dela**. Os NOMES ficam à vista de
> propósito.

---

## O caso

Autor, 2026-09-08:

> *"Estou mandando minha Ficha para um servidor público para avaliação. Porém ela possui conteudo
> PAGO no qual eu preciso esconder... Preciso que as pessoas vejam minha ficha, porém elas não podem
> ver o conteudo dos feitiços. Faça um ADDON para isso, e faça com que o ADDON precise de SENHA para
> ser desativado também."*

Duas coisas ao mesmo tempo, e elas puxam para lados opostos: a ficha precisa ser **legível** por
quem vai avaliar, e o texto precisa ser **ilegível** para todo mundo.

---

## A decisão que manda em tudo: cifrar, e não esconder

O caminho óbvio é um interruptor que deixa de renderizar o texto. Ele foi recusado, e vale escrito
por quê: **é contornável em dez segundos.** Abrir o inspetor, ler o `localStorage`, ou abrir o JSON
exportado no bloco de notas. Em qualquer um dos três o texto está lá, em claro, dentro do arquivo
que o autor ia mandar para o servidor público. A proteção falharia sem ninguém perceber, que é o
pior jeito de falhar.

Então o Cofre **recolhe** o texto, cifra com AES-GCM 256, guarda o blob em base64 e escreve um
marcador no lugar. Sem a senha, o arquivo não contém o conteúdo. Não existe inspetor que ache o que
não está lá.

⚠ **A consequência disso é que NÃO EXISTE PORTÃO DE TELA em lugar nenhum.** Nenhuma aba ganhou um
`if (trancado)`. A Ficha e o criador desenham o que a ficha tem, e o que a ficha tem é o marcador. É
o que manteve a mudança pequena: seis arquivos, e cinco deles só de fiação.

---

## O que ele leva, e o que ele deixa

| Leva (texto) | Deixa (regra) |
|---|---|
| `nome` do Feitiço | `nivel`, `tipo`, `subtipo`, `acao` |
| `descricao` | `trocas`, `condicoes`, `disparos` |
| `conjuracaoTexto` | `resolucao`, `alvo`, `formaArea` |
| `alcanceTexto`, `alvoTexto`, `duracaoTexto`, `resolucaoTexto` | tudo que produz número |
| `core.tecnicaDescricao` | `core.tecnicaEfeitos` (o Motor) |
| `nome` e `descricao` de cada Funcionamento Básico | |
| `descricao`, `lore`, `texto`, `nota`, `preReq` e `restricoes` de toda entrada de addon | `nome` de toda entrada de addon |

⚠ **Só texto, e isso é a metade do pedido que quase se perde.** Quem recebe a ficha vai AVALIAR, e
avaliar sem os números é impossível. A ficha trancada continua somando PV, PE, CD, vagas de Feitiço
e tudo o mais, exatamente igual. Há assert medindo os dois lados.

⚠ **Os Funcionamentos de addon também entram**, e eles moram na cópia congelada do pacote dentro da
criatura. Numa ficha como a do Abe no Seimei os quatro Funcionamentos vêm todos de addon, e
deixá-los de fora esvaziaria o Cofre justamente do que ele existe para guardar. O preço é que a
cópia passa a divergir da biblioteca e a aba Addons vai dizer que o pacote está diferente. Está
mesmo: ele está censurado.

⚠ **Feitiço sem texto nenhum não entra.** O recém-criado nasce sem nome, e marcá-lo daria um nome
falso que destrancar não desfaz, porque ele não estaria no cofre. Era um bug real da primeira
versão, e quem o pegou foi o assert de ida e volta.

---

## A criptografia

| Peça | Escolha |
|---|---|
| Derivação | PBKDF2-SHA256, 310 mil iterações, salt de 16 bytes aleatório por ficha |
| Cifra | AES-GCM, chave de 256 bits, IV de 12 bytes aleatório |
| Formato | base64 dentro do JSON da criatura, no campo `cofre` |

⚠ **A SENHA NÃO É GRAVADA, nem em claro nem em hash.** O que fica é o material de derivação e o
blob. Senha errada é falha de decifragem: o AES-GCM autentica o que cifrou, e com a chave errada ele
recusa em vez de devolver lixo. Um campo "hash da senha" ao lado só daria mais uma coisa para atacar
offline.

⚠ **O número de iterações fica GRAVADO no cofre**, e não é lido da constante. Uma ficha trancada
hoje continua abrindo depois de o padrão subir.

### O catálogo dos addons, e por que o NOME fica

A primeira versão levava só o que a ficha tinha de próprio, e isso era um buraco: a origem e os
Feitiços do autor **vêm por addon**, e os dois são conteúdo pago. O texto ficava em claro no arquivo
enquanto o Cofre guardava outra coisa.

Agora o catálogo entra. A regra veio do autor (2026-09-08):

> *"Os nomes das habilidades e talentos de Origem não precisam ficar censurados, somente o texto de
> conteudo."*

É a regra certa: uma ficha que lista "Talento: Cultivador de Sonhos" com o texto guardado continua
**avaliável**, que é o motivo de ela estar sendo mandada. O que não pode sair de casa é a regra
escrita.

⚠ **O percorredor é RECURSIVO e por NOME DE CHAVE**, e não por família. O texto não está só no
primeiro nível: a origem tem `caracteristicas[].descricao`, e a característica tem
`escolhas[].opcoes[].descricao`. Um percorredor por família precisaria conhecer as quinze formas e
envelheceria na primeira família nova.

⚠ **E A LISTA DE CHAVES É FECHADA, e não "toda string longa".** Conferi o catálogo antes de
escrever: `bonus.entre` da origem é uma lista de chaves de atributo e `expr` é DSL do Motor, e as
duas passam de 40 caracteres. Censurar por tamanho quebraria a ficha em silêncio. Há assert medindo
que as duas saem inteiras.

⚠ **`restricoes` é lista de STRING**, e a primeira versão passava por cima dela porque só olhava
`typeof === "string"`. O comprimento é preservado para a entrada não mudar de forma.

⚠ **O preço é que a cópia congelada do pacote diverge da biblioteca**, e a aba Addons vai dizer que
ele está diferente. Está mesmo: ele está censurado. Vale menos que vazar o conteúdo.

### O vigia

A lista de chaves ser fechada tem um risco: uma família nova de addon pode chegar com um campo de
texto batizado de outro jeito, e ele vazaria calado, que é o modo de falhar que o Cofre existe para
não repetir.

`textoLongoRestante()` varre a ficha trancada atrás de string longa que sobrou em claro nos addons,
ignorando os marcadores e o `expr`. O painel mostra o caminho do que achar. Ele **avisa**, e não
censura: censurar por heurística é como quebrar `expr`.

### ⚠ O que ele NÃO protege

Ele protege o **texto**, não a ficha. Quem receber o arquivo pode atacar a senha **offline**, no
ritmo que quiser, sem limite de tentativas e sem ninguém para avisar. O PBKDF2 encarece cada
tentativa e é só isso que ele faz. **Senha curta cai.** A defesa real é uma frase longa.

Isto está na TELA e não só aqui, de propósito: esconder a frase daria uma sensação de segurança que
o mecanismo não sustenta.

---

## Os dois modos, e por que são dois

|  | Criador | Ficha Final |
|---|---|---|
| O que o botão faz | **Destranca de vez** | **Abre só para ler** |
| O cofre | sai da ficha | continua lá |
| Dura | para sempre | enquanto a aba viver |
| Onde o texto fica | na ficha | na memória de módulo do `afty-cofre.js` |

⚠ **Espiar sem tirar o cofre seria uma armadilha no criador.** Ele tem autosave que grava o rascunho
sozinho (`afty-rascunho.js`), e o texto revelado acabaria em claro no `localStorage`, que é
exatamente o que o Cofre existe para impedir. No criador o caminho é explícito e pedido pelo dono.

⚠ **Na Ficha o texto entra na MONTAGEM da ficha de tela**, antes do `mesclaFichaAfty`, e em lugar
nenhum mais. Tudo abaixo lê `ficha`, do derive às abas: um segundo caminho para o texto seria um
segundo lugar para alguém esquecer de aplicar.

⚠ **O cadeado da Ficha aparece por ESTADO, e não por `permite`.** Quem recebe a ficha pode não ter
addon nenhum instalado e ainda assim precisa da porta para digitar a senha. O `permite` governa o
card do criador, que é onde se TRANCA.

---

## Desinstalar o addon

Pedido do autor: *"você precisa colocar a senha para poder desativar esse ADDON"*.

Tirar o addon da criatura abre um portão que pede a senha, e **desligar destranca no mesmo ato**.

⚠ A segunda metade é decisão minha e vale o motivo: o addon **é** a proteção. Deixar o cofre
trancado sem o painel que o abre prenderia o texto sem porta, e o dono teria de reinstalar o addon
para recuperar a própria ficha. Do jeito que ficou, quem sabe a senha desfaz tudo e quem não sabe
não desfaz nada.

Addon sem cofre trancado sai sem perguntar nada.

---

## Onde está

| Peça | Arquivo |
|---|---|
| O verbo (cifra, marcador, memória de sessão) | `src/systems/afty/afty-cofre.js` (novo) |
| A tela dos dois modos | `src/systems/afty/ui/PainelDoCofre.jsx` (novo) |
| A primitiva `cofre` | `afty-addons.js`, na lista `PRIMITIVAS` |
| O pacote | `addons/cofre-de-feiticos.json` (novo) |
| Card no criador e portão de saída | `AftyTabAddons.jsx` |
| Cadeado e véu na Ficha | `ficha/AftyFicha.jsx`, `ficha/ficha.css` |
| Provas | `asserts/t-cofre.mjs` (61), `design.local/probe-cofre*.mjs` (23) |

---

## As provas

`asserts/t-cofre.mjs`, 61 asserts. O do meio é o que o Cofre existe para garantir:

```
o JSON trancado NÃO contém: descrição do Feitiço
o JSON trancado NÃO contém: nome do Feitiço
o JSON trancado NÃO contém: texto da Técnica
o JSON trancado NÃO contém: Funcionamento de addon
o JSON trancado NÃO contém: Funcionamento local
```

Mais a ida e volta exata (`trancar` e depois `destrancar` devolve a ficha byte a byte), os seis
números que não podem mudar, e a recusa de senha errada.

No navegador, `probe-cofre.mjs` (14) e `probe-cofre-criador.mjs` (9) medem o caminho inteiro:
trancar, o texto sumir da tela, senha errada ser recusada, senha certa abrir, o `localStorage`
**nunca** receber o texto aberto, recarregar trancar de novo, e o portão de desinstalação.

---

## O que ficou de fora

- **Os NOMES**, e é de propósito: o autor pediu assim, para a ficha continuar avaliável.
- **Trancar itens, habilidades ou perícias.** O pedido nomeou Feitiços e Funcionamento Básico. A
  lista de campos protegidos é uma constante em `afty-cofre.js` e crescer é acrescentar uma linha.
- **Uma senha por seção.** Uma senha por ficha. Duas senhas dariam dois cofres e duas telas para um
  caso que ainda não existe.
- **Trancar pela Ficha Final.** Trancar é ato de autoria, e autoria é o criador. A Ficha só abre.
