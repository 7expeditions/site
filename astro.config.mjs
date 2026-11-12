// Сборка статического сайта 7expeditions.com.
// src/media повторяет адреса сайта: фото обрабатываются Astro (webp, srcset),
// а оригиналы после сборки копируются в dist по прежним адресам
// (og:image, «открыть карту крупно», внешние ссылки на фото).
import { defineConfig } from 'astro/config';
import { cpSync } from 'node:fs';

export default defineConfig({
  site: 'https://7expeditions.com',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [{
    name: 'media-originals',
    hooks: {
      'astro:build:done': ({ dir }) => {
        cpSync(new URL('./src/media/', import.meta.url), dir, { recursive: true });
      },
    },
  }],
});
