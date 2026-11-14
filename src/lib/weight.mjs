// Вес страницы после сборки — худший случай: HTML + самый крупный вариант каждого фото
// (то, что скачает экран с высокой плотностью пикселей). Шрифты Google не считаются.
import { readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const MAX_BYTES = 10 * 1024 * 1024;

export function pageWeight(dist, htmlPath) {
  const html = readFileSync(htmlPath, 'utf8');
  const size = u => {
    const f = join(dist, decodeURI(u.split('?')[0]));
    return existsSync(f) ? statSync(f).size : 0;
  };
  let total = Buffer.byteLength(html);
  const seen = new Set();
  for (const pic of html.match(/<picture>[\s\S]*?<\/picture>/g) ?? []) {
    if (seen.has(pic)) continue;
    seen.add(pic);
    const urls = [];
    for (const [, set] of pic.matchAll(/srcset="([^"]*)"/g))
      for (const c of set.split(',')) urls.push(c.trim().split(/\s+/)[0]);
    const img = pic.match(/<img[^>]*\ssrc="([^"]*)"/);
    // без srcset браузер берёт файл из <img>
    if (!urls.some(u => /\.(webp|avif|jpe?g|png)$/i.test(u)) && img) urls.push(img[1]);
    total += Math.max(0, ...urls.map(size));
  }
  return total;
}
