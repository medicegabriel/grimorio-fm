# Refinamento visual de Agora na Mesa, 22/10/2026

Autor considerou a aparência desta faixa abaixo do restante da ficha.
O ajuste ficou restrito a abas-g2.css, preservando os componentes,
descritores, verbos, regras e persistência existentes.

Mudanças: cartões com mínimo de 300 px na grade e auto-fit, nomes com a
tipografia normal de 15 px usada nas linhas da ficha, leitura de nome e
estado à esquerda, ação centralizada à direita dos dois. A seta de expansão
fica no fim do nome. Botões têm 32 px no ponteiro fino e mantêm 40 px no toque.
O foco do nome recebe contorno visível, e a borda acompanha hover e foco.
As curvas de 12 px do retoque anterior continuam preservadas.

Na largura da imagem do autor, 1064 px, os nove cartões passaram de quatro
para três colunas, sem uma última fileira com apenas Treinos. A altura da
faixa caiu de 207,09 para 192,55 px. Olhinhos Lu passou de três para duas
linhas. Nomes e estados seguem completos. Nenhum rótulo ou texto de regra mudou.

## Verificação

- Build exclusivo da prévia aprovado e lint de Afty com saída 0.
- Roteiro existente de leiaute, SO_ALTURA=1: 94/94, incluindo S1, S2,
  quatro fichas em 331 px, telefone e Quad HD. Logs e JSON próprios nesta pasta.
- S1 com compacta e barra real: Dano termina em 788/800, como antes.
  Na coluna efetiva de 331 px termina em 962/1024, antes 956/1024.
- S2 continua abaixo da dobra em 1280 com compacta. Os cartões mais largos
  deixam a grade com duas colunas nessa largura, e a faixa passa de 201
  para 302 px. Esse aumento é localizado na ficha densa com nove condicionais.
  Em 1440 a faixa passa de 189 para 195 px, em Quad HD de 133 para 131 px.
- Inspeção própria de escuro e claro, com capturas também em Minamoto.
  Os três temas mediram 1064 por 192,55 px, sem estouro lateral.
- No navegador interno: Bloodfeast abriu e fechou, preservando o rascunho
  Ações 3. Descobrir/Cobrir, Fechar/Abrir Olhos e Ligar/Desligar Aura
  atualizaram seus estados e retornaram à seleção inicial. Treinos ligou e
  desligou. Montar Golpe abriu a Preparação, e Voltar saiu sem confirmar.
- Não foi repetida a suíte completa de lógica em uma alteração apenas de CSS.
  As duas falhas históricas da reconferência anterior continuam registradas.

Somente abas-g2.css mudou entre os 331 arquivos de src conferidos por hash.
Os 14 arquivos do dist diário continuam iguais. Cópia anterior do CSS,
manifestos, medidas, capturas e logs estão nesta pasta. Dados reais, App,
rotas normais e 5173 preservados. Prévia atualizada na 5330.
Integração segue sem autorização própria, barra antiga 9/10 intacta.
Sem commit, push, merge ou deploy.
