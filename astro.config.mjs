// Сборка статического сайта 7expeditions.com.
// src/media повторяет адреса сайта: фото обрабатываются Astro (webp, srcset),
// а оригиналы после сборки копируются в dist по прежним адресам
// (og:image, «открыть карту крупно», внешние ссылки на фото).
// После сборки: вес каждого лендинга и примера ≤ 10 МБ; примеры убираются из dist.
import { defineConfig } from 'astro/config';
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { pageWeight, MAX_BYTES } from './src/lib/weight.mjs';

const mb = b => (b / 1024 / 1024).toFixed(1) + ' МБ';

export default defineConfig({
  site: 'https://7expeditions.com',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [{
    name: 'media-originals-and-checks',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        cpSync(new URL('./src/media/', import.meta.url), dir, { recursive: true });
        const dist = fileURLToPath(dir);
        const pages = [];
        for (const f of readdirSync('src/content/landings').filter(f => f.endsWith('.yaml')))
          pages.push(['лендинг ' + f.slice(0, -5), join(dist, 'expeditions', f.slice(0, -5), 'index.html')]);
        if (existsSync(join(dist, 'x-examples')))
          for (const d of readdirSync(join(dist, 'x-examples')))
            pages.push(['пример ' + d, join(dist, 'x-examples', d, 'index.html')]);
        const heavy = [];
        for (const [name, html] of pages) {
          const w = pageWeight(dist, html);
          logger.info(`${name}: ${mb(w)}`);
          if (w > MAX_BYTES) heavy.push(`[${name}] вес страницы ${mb(w)} больше ${mb(MAX_BYTES)} (HTML + самый крупный вариант каждого фото). Уберите или замените часть фото.`);
        }
        if (!process.env.KEEP_EXAMPLES) rmSync(join(dist, 'x-examples'), { recursive: true, force: true });
        if (heavy.length) throw new Error(heavy.join('\n'));
      },
    },
  }],
});
