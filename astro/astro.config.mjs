// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeRapide from 'starlight-theme-rapide';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    starlight({
      logo: {
        src: './src/assets/houston.webp',
      },
      defaultLocale: 'root',
      plugins: [starlightThemeRapide()],
      title: 'Kube Design',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
      // sidebar: [
      //   {
      //     label: 'Guides',
      //     items: [
      //       // Each item here is one entry in the navigation menu.
      //       { label: 'Example Guide', slug: 'guides/example' },
      //     ],
      //   },
      //   {
      //     label: 'Reference',
      //     autogenerate: { directory: 'reference' },
      //   },
      // ],
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
        'zh-cn': {
          label: '简体中文',
          lang: 'zh-CN',
        },
      },
      // components: {
      //   Header: './src/components/Header.astro',
      // },
    }),
  ],
});
