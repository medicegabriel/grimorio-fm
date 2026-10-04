import fs from 'node:fs';
const arquivo = '.audit/lote06-browser-complemento.mjs';
let atual = fs.readFileSync(arquivo, 'utf8');
atual = atual.replace("if (largura === 390) await valor.tap(); else await valor.hover();", `if (largura === 390) {
      const caixa = await valor.boundingBox();
      const toque = await context.newCDPSession(page);
      await toque.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: caixa.x + caixa.width / 2, y: caixa.y + caixa.height / 2 }] });
      await page.waitForTimeout(700);
      await toque.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await toque.detach();
    } else await valor.hover();`);
atual = atual.replace("if (largura === 390) await valor.tap(); else await page.mouse.move(0, 0);", "if (largura === 390) await page.touchscreen.tap(5, 5); else await page.mouse.move(0, 0);");
fs.writeFileSync(arquivo, atual);
