# Feitiços de Cura Aperfeiçoada

Pacote: [cura-aperfeicoada-feiticos.json](../addons/cura-aperfeicoada-feiticos.json), versão 1.0.0.
Homebrew solicitado pelo autor em 2026-10-12 para o Grimório do Afty.
São dois modelos de Feitiços Passivos de Nível 5. Nome e descrição usam
campos provisórios para o autor editar na ficha.

## Instalação e uso

Em `/Afty`, abra Outros > Addons, importe o JSON na biblioteca e ative o
pacote. Na aba de Feitiços da Técnica, copie os modelos para a ficha.
Ativar o addon somente disponibiliza os modelos. Cada cópia ocupa uma vaga
normal de Feitiço e permite editar nome, descrição e efeitos.
As cópias pertencem à ficha: desativar o pacote não apaga os Feitiços copiados.
Para retirar um benefício, remova a cópia ou seu efeito na ficha.

O primeiro modelo emite `rerrolaCura: 4`. Com Cura Aperfeiçoada, cada dado
que sair 1, 2, 3 ou 4 rola de novo uma vez, mantendo o melhor resultado.
O limite usa a maior fonte e não soma 4 ao limite 2 da habilidade.

O segundo modelo emite `rerrolaCuraContinua: 1`. Com Cura Aperfeiçoada,
repete a rerrolagem enquanto o dado mantido não superar o limite vigente.
Sozinho aceita 3 ou mais. Com o primeiro modelo aceita 5 ou mais. Um dado
alto não rola novamente. Os dois efeitos exigem `tem_sup_cura_aperfeicoada`.
Sem a habilidade não concedem rerrolagem.

No Afty esses modelos seguem o tratamento normal de Feitiços Passivos de
criatura, sem acrescentar redução de PE máximo ao JSON. No Player, o motor
aplica o custo normal do sistema, inclusive eventuais isenções da ficha.

## Motor e histórico

O canal genérico `rerrolaCuraContinua` aparece no editor de efeitos, no grupo
Cura e Regeneração. Sem alvo vale para as curas do usuário. Com alvo vale
somente para aquela fonte de cura. Valor positivo ativa a repetição, mas não
concede um limite sozinho nem acumula quantidades de tentativas.

`rerrolagemDeCura` resolve limite e repetição; `preparaRolagemCura` os aplica
às curas do usuário, incluindo Feitiços curativos. `rolarDano` repete cada
dado baixo e guarda todas as tentativas em `rerrolados`. A Ficha Final e o
Encontro mostram os descartes riscados e o valor final. Bônus por dado
continuam contando somente os dados originais, sem bônus pelas tentativas.
PV temporário e curas feitas por invocações não recebem a regra do dono.

Na repetição o limite deve ser menor que as faces de cada dado. Uma
configuração sem resultado possível é rejeitada antes do sorteio, evitando
um ciclo que não termina. O JSON usa limite 4, adequado aos d8 de Energia
Reversa com Cura Amplificada da ficha apresentada pelo autor.

## Fontes e validação

A repetição e o limite 4 são regras da casa, confirmadas pelo autor em
2026-10-12. A habilidade original permanece conforme o Livro de Regras
2.5.2, página impressa 109: rerrolar 1 e 2, ficando com o melhor resultado.
Fonte externa lida e SHA-256 conferido:
`1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`.

`asserts/t-cura-feiticos.mjs` cobre instalação e modelos, os quatro estados
dos Feitiços, falta da habilidade, cadeia longa, histórico, fontes com alvo,
limite impossível, bônus e dados por PER, exclusão de PV temporário e cura
de invocação, preservação do comportamento anterior de dano e os dois sistemas.

Validação em 2026-10-12: 115 asserts específicos, suíte completa com 167
arquivos e 9.854 asserts, lint dos cinco arquivos de código alterados e build
passaram. A Ficha Final e o Encontro foram conferidos no navegador. O lote
AD-53 registra 13 entradas do addon em NÃO REVISADO. M01 recebeu as duas
entradas do canal e quatro atualizações de catálogo, sem aprovar auditoria.
