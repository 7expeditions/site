// Фото по прежнему адресу сайта: '/expeditions/x/img/a.jpg' → src/media/expeditions/x/img/a.jpg
import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

const files = import.meta.glob<ImageMetadata>('/src/media/**/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });

export function media(url: string): ImageMetadata {
  const meta = files['/src/media' + url.split('?')[0]];
  if (!meta) throw new Error(`Нет файла src/media${url}`);
  return meta;
}

export const isRaster = (url: string) => /\.(jpe?g|png|webp)$/i.test(url.split('?')[0]);

const QUALITY = 75;
// Ширины для srcset; оригинал больше не увеличиваем.
export const WIDTHS = { wide: [640, 960, 1280, 1600, 1920], tall: [480, 720, 960, 1280] };

export async function srcset(url: string, widths: number[]): Promise<string> {
  const meta = media(url);
  const ws = widths.filter(w => w < meta.width);
  ws.push(Math.min(meta.width, Math.max(...widths)));
  const out = await Promise.all(ws.map(w => getImage({ src: meta, width: w, format: 'webp', quality: QUALITY })));
  return out.map((im, i) => `${im.src} ${ws[i]}w`).join(', ');
}

export const ratio = (url: string) => { const m = media(url); return m.width / m.height; };
