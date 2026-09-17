# Manipulação do Céu

## Conteúdo

O addon `addons/manipulacao-do-ceu.json` entrega dois modelos que o jogador copia para a ficha pela
área de Feitiços do criador.

- Refletir Imagem: Feitiço Personalizado de Nível 5, Ação Comum, alcance Pessoal, alvo Próprio,
  duração Sustentado, Concentração e custo base padrão de 20 PE.
- Duplicata Perfeita: Passivo / Característica de Nível 5, com redução de 10 no PE máximo.

Os textos de regra ficam verbatim no JSON. A estrutura não reescreve o que acontece quando uma
cópia é atingida, quando o personagem recebe um ataque entre turnos ou quando entra numa área.
Esses eventos continuam sendo decisões da mesa.

## Estado de combate

`afty-combate-aptidoes.js` oferece o interruptor `auraEmbacada` somente para fichas que possuem a
Aptidão Aura Embaçada. O interruptor fica na aba Buffs e exibe custo de 2 PE.

`afty-manipulacao-ceu.js` cria o contador `manipulacao-do-ceu:copias_refletidas` somente quando a
ficha conhece Refletir Imagem. O contador vai de zero a dois e fica oculto na lista comum de Buffs e
na Simulação de Combate do criador. Seu controle mora no card próprio da aba Ações.

A ficha existente de Argalia usa ids locais gerados pelo criador, `feit_mu4mq62a_4` e
`feit_mu4qjlpf_1`, em vez dos ids do addon. Por isso a integração reconhece os dois Feitiços pelo id
do addon ou pela combinação exata de nome, tipo e Nível 5. Assim a ficha exportada continua
funcionando sem duplicar os Feitiços que ela já possui.

O resultado resolvido é:

| Aura Embaçada | Duplicata Perfeita | Cópias | Resultado |
|---|---|---:|---:|
| desligada | qualquer | qualquer | inativa |
| ligada | sem Duplicata Perfeita | 0 a 2 | 20%, 1 a 2 em 1d10 |
| ligada | com Duplicata Perfeita | 0 | 20%, 1 a 2 em 1d10 |
| ligada | com Duplicata Perfeita | 1 | 30%, 1 a 3 em 1d10 |
| ligada | com Duplicata Perfeita | 2 | 40%, 1 a 4 em 1d10 |

O contador é estado de sessão. Fora de combate ele resolve como zero, igual aos demais estados de
combate.

## Tela

`PainelManipulacaoCeu.jsx` aparece como card separado na aba Ações da Ficha Final e do painel de
Encontros. Ele reúne o controle Ativa ou Inativa da Aura Embaçada, a chance percentual, a margem
atual em 1d10, o custo de Sustentação e o contador de cópias. A explicação permanece nos `title` dos
elementos e no texto dos Feitiços.

## Verificação

`asserts/t-manipulacao-ceu.mjs` mede:

- validação e instalação do pacote
- tipo, nível, ação, alvo, duração e custo dos dois modelos
- redução de PE máximo da Característica
- faixa de zero a duas cópias
- resultados de 20%, 30% e 40%
- perda do bônus quando Duplicata Perfeita não está na ficha
- desligamento da Aura e zeragem fora de combate
- reconhecimento dos Feitiços já existentes na ficha de Argalia
- ativação da Aura Embaçada diretamente no painel principal
