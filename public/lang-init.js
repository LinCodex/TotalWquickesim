(() => {
  try {
    const savedLanguage = localStorage.getItem('totalw-language');
    if (savedLanguage === 'en' || savedLanguage === 'zh-Hans') {
      document.documentElement.lang = savedLanguage;
      return;
    }
  } catch {
    // Use the browser's preferences when storage is unavailable.
  }

  const locales = [...(navigator.languages ?? []), navigator.language];
  const supportedLocale = locales.find((locale) => /^(en|zh)(?:[-_]|$)/i.test(locale));
  document.documentElement.lang = /^zh(?:[-_]|$)/i.test(supportedLocale ?? '') ? 'zh-Hans' : 'en';
})();
