// Схема содержания лендингов: src/content/landings/<адрес>.yaml
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Фото: src — кадр для компьютера, m — кадр для телефона (вертикальный экран).
// Пути — прежние адреса сайта (/expeditions/<адрес>/img/...), файлы лежат в src/media.
const pic = z.object({
  src: z.string(),
  m: z.string().optional(),
  alt: z.string().optional(),
  pos: z.string().optional(),   // object-position
  mpos: z.string().optional(),  // object-position на вертикальном экране
});

const block = z.discriminatedUnion('type', [
  // обязательные
  z.object({ type: z.literal('cover'), pic, title: z.string(), sub: z.string().optional(), caps: z.string().optional(),
    align: z.enum(['center', 'left']).optional(), mobileTop: z.boolean().optional() }),
  z.object({ type: z.literal('why'), title: z.string().default('Почему именно сюда'),
    items: z.array(z.object({ h: z.string(), html: z.string() })) }),
  // основные блоки образца
  z.object({ type: z.literal('lead'), text: z.string(), intro: z.string().optional() }),
  z.object({ type: z.literal('diptych'), full: z.boolean().optional(),
    panels: z.array(z.object({ pic: pic.optional(), num: z.string(), hero: z.string(), acc: z.string() })) }),
  z.object({ type: z.literal('map'), pic, href: z.string().optional(), cap: z.string().optional(), link: z.string().optional() }),
  z.object({ type: z.literal('day'), d: z.string().optional(), w: z.string().optional(), paras: z.array(z.string()),
    stay: z.string().optional(), compact: z.boolean().optional() }),
  z.object({ type: z.literal('photo'), pic, mods: z.array(z.enum(['portrait', 'fit', 'wide'])).optional(), cap: z.string().optional() }),
  z.object({ type: z.literal('notes'), title: z.string().optional(), paras: z.array(z.string()) }),
  // опциональные
  z.object({ type: z.literal('summary'), paras: z.array(z.string()) }),
  z.object({ type: z.literal('heading'), text: z.string() }),
  z.object({ type: z.literal('trio'), pics: z.array(pic).length(3), cap: z.string().optional() }),
  z.object({ type: z.literal('placeholder'), tag: z.string(), txt: z.string(), spec: z.string().optional(),
    map: z.boolean().optional(), cover: z.boolean().optional() }),
]);

const landings = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/landings' }),
  schema: z.object({
    head: z.string(),
    favicon: z.boolean().default(true),  // false — страница без фавикона (как была)  // title, description, og, canonical, robots, JSON-LD — как есть
    blocks: z.array(block).refine(b => b[0]?.type === 'cover', 'первый блок — cover'),
  }),
});

export const collections = { landings };
