# Treino Guarda da Lâmina Divina

## Texto do autor

**Etapa 1 (1 Foco)** = Você recebe **+1 Nível de dano** enquanto estiver empunhando uma arma do grupo espada.

**Etapa 2 (1 Foco)** = Você recebe **+2 de Percepção** enquanto estiver empunhando uma arma do grupo espada.

**Etapa 3 (2 Focos)** = *[Sabedoria 14]* Você se torna mestre em **Percepção** enquanto estiver empunhando uma arma do grupo espada. Caso já seja, adicione +2 em testes nessa perícia.

**Etapa 4 (3 Focos)** = *[Pré-requisito: Destreza 22 e Sabedoria 14]* Você recebe **+3 de Defesa** enquanto estiver empunhando uma arma do grupo espada.

**Treinamento Completo:** Enquanto uma criatura estiver sob o efeito de **Ler intenções** usado por você, ela recebe desvantagem em jogadas de ataque contra você.

## Integração

Addon `guarda-da-lamina-divina`, linha `guarda-da-lamina-divina:guarda`.
Custos 1, 1, 2 e 3 Focos, total 7. Completo acompanha a etapa 4 sem cobrança
adicional, no padrão dos treinamentos anteriores da sessão.

Etapas condicionadas a entrada válida de tipo `arma`, equipada e com grupo
`espada`. Arma desconhecida, addon removido, espada guardada, faca ou escudo
não ativam bônus. Duas espadas não duplicam o benefício do treinamento.

Etapa 3 reutiliza o mecanismo do Treino de Perícia: concessão de Mestre
com `semCredito`, sem devolver vagas da faixa já comprada. Bônus de +2
do "Caso já seja" consulta a faixa escolhida `prof_percepcao`, seguindo
o comportamento existente desse treino. Não concede +2 pela própria
concessão de Mestre. Faixa escolhida não é alterada ao equipar ou guardar.

Requisitos de Sabedoria 14 e Destreza 22 são exibidos e avaliados pelos
controles existentes de aquisição de etapas. Não aumentam o limite de
atributos para permitir cumprir um requisito.

Completo permanece como regra na ficha, com controle na mesa, seguindo
as decisões anteriores de Ler intenções. Não aplica desvantagem global
nem afeta ataques contra outras criaturas. O texto não exige uma espada
empunhada no Completo, ao contrário das etapas.

Autor confirmou que etapa 1 aumenta apenas ataques com espadas.
Usa o alvo existente `grupo:espada`, não aumenta dano de faca ou desarmado.
Nenhum progresso foi comprado ou gravado no export de Ryuma.

## Validação

70 asserts específicos passaram. Suíte completa: 166 arquivos, 9059 asserts,
todos passaram. ESLint e Vite build passaram. Conferência visual pendente
pelo problema de acesso do navegador ao servidor local registrado na sessão.
Nenhuma pergunta sobre esta regra permanece aberta na fila de tarefas.
