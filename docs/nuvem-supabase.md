# Nuvem (Supabase), Login e Mudança de Endereço

Implementado em 2026-11-16. O código fica INERTE até as variáveis de ambiente existirem: sem elas o
site é o de sempre, só com localStorage, e a biblioteca do Supabase nem é baixada.

## Como funciona

- O localStorage continua sendo a cópia de trabalho. Criar e usar ficha nunca espera a rede.
- `src/nuvem/nuvem-sync.js` intercepta as gravações em chaves `fm_*` e `afty_*` e sobe as mudanças
  3 segundos depois da última. Vale para as quatro rotas (`/`, `/Player`, `/Afty`, `/EraDeOuro`).
- Ficha vai uma linha por ficha na tabela `fichas`, com apagamento marcado. O resto (encontros,
  modelos, addons, temas, pastas) vai inteiro na tabela `chaves`.
- Ao abrir o site com conta, o `main.jsx` lê a nuvem antes de montar o React (no máximo 2,5 s). Se
  a rede atrasar, o site abre com o local e a leitura tardia recarrega a página uma vez.
- Nada sobe antes da primeira leitura da sessão.
- Só o primeiro login de um aparelho baixa tudo. Depois o site baixa só o que mudou desde o cursor
  guardado em `nuvem_estado_v1`, que é hora do servidor (gatilho `carimbar_atualizado_em`).
- Linha recusada pelo banco (grande demais) não trava a fila: as outras sobem, o ícone da Conta
  fica âmbar e a recusada só é tentada de novo quando mudar. Limite de 1,9 MB por linha.
- Uma chave inteira apagada em outro aparelho não some deste (a tabela `chaves` não marca
  apagamento). Fichas marcam.
- Conflito: ficha igual nos dois lados fica a de `updatedAt` mais novo. Ficha apagada em outro
  aparelho sai daqui, salvo se foi editada aqui depois do apagamento.
- Sair da conta mantém as fichas no aparelho.
- Ficam no aparelho: `fm_last_error_v1`, `fm_storage_limit_v1`, `fm_dashboard_view*`.
- Login só com Google ou Discord (OAuth), sem senha. Google e Discord com e-mails diferentes viram
  duas contas separadas.
- Num computador compartilhado, entrar com outra conta junta as fichas locais à conta nova.

## Passo a passo (o autor)

Domínio escolhido em 2026-11-16: **`fichafm.com.br`**. Onde aparece `<ref>`, use o código do
projeto Supabase (o pedaço antes de `.supabase.co` na Project URL).

**A ordem importa.** O `VITE_DOMINIO_NOVO` liga a faixa do endereço antigo, então ele entra por
último, só depois de `https://fichafm.com.br` abrir com cadeado de HTTPS.

### 1. Comprar o domínio (Registro.br)

1. Entre em registro.br e crie a conta com o seu CPF (botão Entrar, depois Criar Conta).
2. Na busca da página inicial, digite `fichafm.com.br` e clique em Registrar.
3. Escolha o prazo (1 ano custa R$ 40; prazos maiores saem mais baratos por ano).
4. Em servidores DNS, deixe **"Utilizar os servidores DNS do Registro.br"**.
5. Pague por PIX (libera em minutos), cartão ou boleto (até 3 dias úteis). O domínio só passa a
   existir depois do pagamento confirmado.
6. Ligue a **renovação automática** no painel do domínio, senão ele expira daqui a um ano.

### 2. Ligar o domínio na Vercel

1. vercel.com, projeto `grimorio-fm`, Settings, Domains, Add.
2. Digite `fichafm.com.br` e aceite a sugestão de também adicionar `www.fichafm.com.br`
   redirecionando para o principal.
3. A Vercel mostra os registros DNS que faltam (em geral um `A` para o domínio raiz e um `CNAME`
   para o `www`). **Copie os valores que ela mostrar**, eles podem mudar por projeto.
4. No registro.br, abra o domínio, DNS, Editar Zona (ou Configurar Endereçamento, Modo Avançado) e
   crie esses mesmos registros. Salve.
5. Volte à Vercel e espere o domínio ficar com "Valid Configuration" (de minutos a algumas horas).
   O certificado HTTPS sai sozinho.
6. **Não mexa** no `grimorio-fm.vercel.app`: ele segue no ar e não deve redirecionar.

### 3. Criar o Supabase

1. supabase.com, Start your project, entre com o GitHub.
2. New project: organização pessoal, nome `fichafm`, **Region South America (São Paulo)**, plano
   Free. Gere uma senha do banco e guarde num gerenciador de senhas (o site não usa essa senha).
3. Espere o projeto subir (1 a 2 minutos).
4. SQL Editor, New query, cole o arquivo `supabase/esquema.sql` inteiro e clique em Run. Tem de
   terminar com "Success. No rows returned".
5. Table Editor: as tabelas `fichas` e `chaves` aparecem com o selo **RLS enabled**.
6. Project Settings, API Keys: copie a **Project URL** e a chave **publishable**
   (`sb_publishable_...`). **Nunca** use a `secret` nem a `service_role`.
7. Authentication, Sign In / Providers, abra Google: ali aparece a **Callback URL**
   (`https://<ref>.supabase.co/auth/v1/callback`). Copie, ela serve para o Google e o Discord.

### 4. Login com Google

1. console.cloud.google.com, seletor de projeto no topo, New Project, nome `Ficha FM`.
2. Menu, Google Auth Platform (ou APIs e Serviços, Tela de Consentimento OAuth), Get Started:
   - App name: `Ficha F&M`. Support email: o seu.
   - Audience: **External**.
   - Contact: o seu e-mail. Aceite os termos e crie.
3. Clients, Create Client, tipo **Web application**, nome `Supabase`:
   - Authorized JavaScript origins: `https://fichafm.com.br`, `https://grimorio-fm.vercel.app` e
     `http://localhost:5173`.
   - Authorized redirect URIs: a Callback URL do Supabase.
   - Create. Copie o **Client ID** e o **Client Secret**.
4. Audience, **Publish App** (Em produção). Em modo teste, só os e-mails de teste entram. O site só
   pede nome, e-mail e foto, que não exigem verificação do Google.
5. No Supabase, Providers, Google: ligue, cole o Client ID e o Secret, Save.

### 5. Login com Discord

1. discord.com/developers/applications, New Application, nome `Ficha F&M`.
2. OAuth2: em Redirects, Add Redirect com a Callback URL do Supabase. Save Changes.
3. Copie o **Client ID**. Em Client Secret, Reset Secret e copie (ele só aparece uma vez).
4. No Supabase, Providers, Discord: ligue, cole os dois, Save.

### 6. Endereços de retorno no Supabase

Authentication, URL Configuration:

- Site URL: `https://fichafm.com.br`
- Redirect URLs (Add URL, uma por vez):
  - `https://fichafm.com.br/**`
  - `https://www.fichafm.com.br/**`
  - `https://grimorio-fm.vercel.app/**`
  - `http://localhost:5173/**`

### 7. Variáveis na Vercel

Projeto, Settings, Environment Variables. Marque Production e Preview em cada uma:

| Nome | Valor |
|---|---|
| `VITE_SUPABASE_URL` | a Project URL (`https://<ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | a chave publishable (`sb_publishable_...`) |
| `VITE_DOMINIO_NOVO` | `https://fichafm.com.br` (**só quando o passo 2 estiver verde**) |

Variável `VITE_` entra no build. Depois de salvar: Deployments, último deploy, menu, **Redeploy**.

Para testar no computador antes de publicar, crie `grimorio-tracker/.env.local` (já ignorado pelo
git) com as duas primeiras linhas e rode `npm run dev`.

### 8. Conferir depois do deploy

1. Abra `https://fichafm.com.br/Player`, Entrar, Google. Volta logado, com o ícone de nuvem verde.
2. Crie uma ficha, espere 5 segundos e veja a linha nova no Table Editor, tabela `fichas`.
3. Entre com a mesma conta no celular: a ficha aparece.
4. Repita com o Discord.
5. Abra `https://grimorio-fm.vercel.app`: a faixa "O Grimório Mudou para fichafm.com.br" aparece.
   Clique em "Levar Minhas Fichas" e confira as fichas no endereço novo.

## Mudança de endereço

No host `grimorio-fm.vercel.app` exato, com `VITE_DOMINIO_NOVO` definido, aparece uma faixa fixa
no rodapé com "Levar Minhas Fichas". O botão abre o endereço novo numa janela e manda todas as
chaves da pessoa por `postMessage`, com a origem conferida nas duas pontas. O novo mescla sem apagar
nada: ficha igual fica a mais nova, chave que só existe lá entra, lista com id é unida.

Quem tiver conta também pode só entrar nos dois endereços: o antigo sobe, o novo desce.

## Custos a acompanhar

O banco só pesa para quem entra. Meça o tamanho de uma ficha real em Supabase, Table Editor, e
confira o limite do plano grátis (banco e usuários ativos por mês) na página de preços atual.
