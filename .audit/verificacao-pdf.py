from pypdf import PdfReader
from pathlib import Path
r=PdfReader('public/docs/F&M 2.5.2 - Livro de Regras.pdf')
out=Path('.audit/verificacao-evidencias')
for i in [34,35]:
 t=r.pages[i].extract_text(extraction_mode='layout')
 (out/f'livro-p{i+1}.txt').write_text(t,encoding='utf8')
 print(f'PAGINA {i+1}\n{t}')

