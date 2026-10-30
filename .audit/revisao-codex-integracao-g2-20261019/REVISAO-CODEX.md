# Revisão independente da integração, 19/10/2026

Resultado: devolvido para correção de G2-I1, benefício de Fonte Externa ignorado pela ficha clássica. A interface clássica continua padrão, conforme o chat Restaurar versão antiga do localhost consultado na revisão. Nenhuma fonte de produto foi alterada pelo Codex.

## Evidências finais

- `auditoria.json`: consolidado, decisões do chat consultado, testes e limites.
- `complemento-final.json`: Ataque Concentrado nas duas larguras e reprodução final da Fonte Externa.
- `browser-final.json`: Golpe denso e preferências. Os dois casos AC e a fonte foram repetidos no complemento final.
- `linha-tempo-corrigida.json`: quatro colunas e três viradas reais, Invencível com zero PE principal. Onze verificações passando.
- `asserts-focados.json`: 244 asserts passando em seis arquivos.
- `proveniencia.json`: 84 hashes da entrega iguais aos atuais, no começo e no fim da revisão.
- `desempenho-final-5310.json` e `desempenho-final-5311.json`: 36 encerramentos individuais em dev/produção e três fichas, clássica/G2.
- `ativacoes-5310.json` e `ativacoes-5311.json`: seis confirmações do Ataque Concentrado no G2.
- `ativacao-calamidade.cpuprofile`: perfil independente de uma ativação, separado da medição principal.
- `fonte-g2.png` e `fonte-classica.png`: Defesa 89 e 82 para o mesmo registro +7.

Somente os arquivos finais indicados acima compõem a conclusão. Relatórios anteriores foram preservados com erros de verificador documentados em auditoria.json: espera por rede externa, rótulos de botões, timestamps e normalização de reservas vazias, comparação da ordem de chaves e seleção acidental de Desligar Tudo/CSS nas primeiras medições clássicas.

## Conclusão limitada

Oito percursos funcionais, 53 verificações, 52 passaram. Uma falha material de compatibilidade. Build e lint reexecutados passaram. Não houve repetição independente da suíte geral inteira nem aprovação visual.

Nas 42 operações medidas da versão atual não houve o congelamento de dois segundos. Tarefas longas de 57 a 80 ms ainda ocorreram em alguns casos. A duração de 30 ms do gerador não preempta um derive atômico. O antes da correção não foi reexecutado, portanto os números de antes pertencem ao relato do desenvolvedor.

A devolutiva executável está em `C:/Projetos/Grimorio/DEVOLUTIVA-CLAUDE-INTEGRACAO-G2.md`. Nenhuma mudança de interface, sessão do autor, commit ou merge feita nesta revisão.
