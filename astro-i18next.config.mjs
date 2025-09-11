/** @type {import('astro-i18next').AstroI18nextConfig} */
export default {
  defaultLocale: "en",
  locales: ["en", "es", "fr", "ar", "zh"],
  routes: {
    fr: {
      "about": "a-propos",
      "contact": "contactez-nous",
      "donate": "faire-un-don",
      "news": "actualites",
      "shop": "boutique",
      "pianos": "pianos"
    },
    es: {
      "about": "acerca-de",
      "contact": "contacto", 
      "donate": "donar",
      "news": "noticias",
      "shop": "tienda",
      "pianos": "pianos"
    },
    ar: {
      "about": "حول",
      "contact": "اتصال",
      "donate": "تبرع", 
      "news": "أخبار",
      "shop": "متجر",
      "pianos": "بيانو"
    },
    zh: {
      "about": "关于我们",
      "contact": "联系我们",
      "donate": "捐赠",
      "news": "新闻",
      "shop": "商店", 
      "pianos": "钢琴"
    }
  },
  showDefaultLocale: false,
  i18nextServer: {
    debug: false,
    backend: {
      loadPath: "./public/locales/{{lng}}/{{ns}}.json",
    },
  },
  i18nextClient: {
    debug: false,
  },
};