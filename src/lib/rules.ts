// Жёсткие правила лендинга, которые зависят от всей страницы.
// Нарушение — ошибка сборки. У страниц из LEGACY — предупреждение (их тексты ещё переделываются).
export const LEGACY = ['tuna-redfish-2027', 'tuna-chinook-2027', 'bc-canada-sturgeon-salmon', 'zambia-tigerfish-2027'];

export const MAX_PARAS = 2;  // абзацев текста между двумя фото-блоками
// Фото-блоки. placeholder — место под фото, считается фото-блоком.
const PHOTO = new Set(['cover', 'photo', 'trio', 'diptych', 'map', 'placeholder']);
// Абзацы: дни, быт, анонс по дням, lead. Не считаются: заголовки, подписи, строка ночёвки,
// эссе «Почему именно сюда» (why).
const paras = (b: any): number => {
  switch (b.type) {
    case 'day': case 'notes': case 'summary': return b.paras.length;
    case 'lead': return 1 + (b.intro ? 1 : 0);
    default: return 0;
  }
};

export function check(slug: string, page: any): { errors: string[]; warnings: string[] } {
  const problems: string[] = [];
  // абзацы между фото-блоками
  let run = 0, from = -1;
  page.blocks.forEach((b: any, i: number) => {
    if (PHOTO.has(b.type)) {
      if (from >= 0 && run > MAX_PARAS)
        problems.push(`между фото-блоками №${from + 1} (${page.blocks[from].type}) и №${i + 1} (${b.type}) ${run} абзаца(ев) текста, можно не больше ${MAX_PARAS}`);
      run = 0; from = i;
    } else run += paras(b);
  });
  // шапка
  const need: [string, unknown][] = [['description', page.description], ['canonical', page.canonical],
    ['og.title', page.og?.title], ['og.description', page.og?.description], ['og.image', page.og?.image]];
  const missing = need.filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) problems.push(`в шапке не заполнены: ${missing.join(', ')}`);

  const legacy = LEGACY.includes(slug);
  return { errors: legacy ? [] : problems, warnings: legacy ? problems : [] };
}

export function enforce(where: string, slug: string, page: any) {
  const { errors, warnings } = check(slug, page);
  for (const w of warnings) console.warn(`\x1b[33m[${where}${slug}] ${w}\x1b[0m`);
  if (!page.blocks.some((b: any) => b.type === 'why'))
    console.warn(`\x1b[33m[${where}${slug}] нет блока «Почему именно сюда» (type: why) — нужен текст от владельца\x1b[0m`);
  if (errors.length) throw new Error(`[${where}${slug}] страница нарушает правила шаблона:\n- ${errors.join('\n- ')}`);
}
