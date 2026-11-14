// Схема содержания лендингов: src/content/landings/<адрес>.yaml
// и примеров для агента: src/content/examples/*.yaml (проверяются, на сайт не попадают).
// Жёсткие правила: здесь (форма, файлы фото) и в src/lib/rules.ts (абзацы, шапка),
// вес страницы — после сборки в astro.config.mjs.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { existsSync } from 'node:fs';

// Файл по адресу сайта: src/media (фото, которые обрабатывает Astro) или public (как есть).
const fileExists = (url: string) => {
  const p = url.replace(/^https:\/\/7expeditions\.com/, '').split('?')[0];
  return p.startsWith('/') && (existsSync('src/media' + p) || existsSync('public' + p));
};
const file = z.string().superRefine((v, ctx) => {
  if (!fileExists(v)) ctx.addIssue({ code: 'custom', message: `нет файла ${v} (ищу в src/media и public)` });
});

// Фото: src — кадр для компьютера, m — кадр для телефона (вертикальный экран).
// Пути — адреса сайта (/expeditions/<адрес>/img/...), файлы лежат в src/media.
const pic = z.object({
  src: file,
  m: file.optional(),
  alt: z.string().optional(),
  pos: z.string().optional(),   // object-position
  mpos: z.string().optional(),  // object-position на вертикальном экране
});

const panel = z.object({ pic: pic.optional(), num: z.string(), hero: z.string(), acc: z.string() });

const block = z.discriminatedUnion('type', [
  // обязательные
  z.object({ type: z.literal('cover'), pic, title: z.string(), sub: z.string().optional(), caps: z.string().optional(),
    align: z.enum(['center', 'left']).optional(), mobileTop: z.boolean().optional() }),
  z.object({ type: z.literal('why'), title: z.string().default('Почему именно сюда'),
    items: z.array(z.object({ h: z.string(), html: z.string() })) }),
  // основные блоки образца
  z.object({ type: z.literal('lead'), text: z.string(), intro: z.string().optional() }),
  // места: от одной до трёх панелей
  z.object({ type: z.literal('diptych'), full: z.boolean().optional(),
    panels: z.array(panel)
      .min(1, 'в блоке diptych нужна хотя бы одна панель')
      .max(3, 'в блоке diptych не больше трёх панелей (мест)') }),
  z.object({ type: z.literal('map'), pic, href: z.string().optional(), cap: z.string().optional(), link: z.string().optional() }),
  z.object({ type: z.literal('day'), d: z.string().optional(), w: z.string().optional(), paras: z.array(z.string()),
    stay: z.string().optional(), compact: z.boolean().optional() }),
  z.object({ type: z.literal('photo'), pic, mods: z.array(z.enum(['portrait', 'fit', 'wide'])).optional(), cap: z.string().optional() }),
  z.object({ type: z.literal('notes'), title: z.string().optional(), paras: z.array(z.string()) }),
  // опциональные
  z.object({ type: z.literal('summary'), paras: z.array(z.string()) }),
  z.object({ type: z.literal('heading'), text: z.string() }),
  z.object({ type: z.literal('trio'), pics: z.array(pic).length(3, 'в блоке trio ровно три фото'), cap: z.string().optional() }),
  z.object({ type: z.literal('placeholder'), tag: z.string(), txt: z.string(), spec: z.string().optional(),
    map: z.boolean().optional(), cover: z.boolean().optional() }),
]);

const page = z.object({
  // шапка: HTML собирает шаблон (src/components/landing/Head.astro)
  title: z.string(),
  description: z.string().optional(),
  robots: z.string().optional(),            // например: noindex, nofollow
  canonical: z.string().url().optional(),   // он же og:url
  og: z.object({
    title: z.string().optional(),           // при нём шаблон ставит og:type website
    description: z.string().optional(),
    image: file.optional(),                 // полный адрес картинки превью
    locale: z.string().optional(),          // например: ru_RU
  }).optional(),
  jsonld: z.union([z.record(z.string(), z.any()), z.array(z.record(z.string(), z.any()))]).optional(),
  favicon: z.boolean().default(true),       // false — страница без фавикона (как была)
  blocks: z.array(block).refine(b => b[0]?.type === 'cover', 'первый блок страницы должен быть cover'),
});

const landings = defineCollection({ loader: glob({ pattern: '*.yaml', base: './src/content/landings' }), schema: page });
const examples = defineCollection({ loader: glob({ pattern: '*.yaml', base: './src/content/examples' }), schema: page });

export const collections = { landings, examples };
