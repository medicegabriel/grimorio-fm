from pypdf import PdfReader
from pathlib import Path
r=PdfReader('public/docs/F&M 2.5.2 - Livro de Regras.pdf')
for i in range(290,min(350,len(r.pages))):
 t=r.pages[i].extract_text()
 if 'Farmac' in t and ('CD' in t or 'Criação de Itens' in t):
  Path(f'.audit/verificacao-evidencias/livro-tabela-p{i+1}.txt').write_text(t,encoding='utf8')
  print('TABLE_PAGE',i+1,t[-5500:])

