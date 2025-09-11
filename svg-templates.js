// svg-templates.js
// Arquivo completo — substitua tudo por este conteúdo

const svgTemplates = {
  /**
   * WhatsApp (pílula limpa)
   * - Mantém o visual de pílula arredondada
   * - Cores e texto editáveis no painel
   * - Usa apenas {PRIMARY} e {TEXT} (compatível com o app.js atual)
   */
  "whatsapp-pill": {
    title: "WhatsApp (pílula)",
    svg: `
<svg width="320" height="56" viewBox="0 0 320 56" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{LABEL}">
  <!-- Fundo arredondado com cor principal -->
  <rect x="0" y="0" width="320" height="56" rx="14" fill="{PRIMARY}"/>

  <!-- Texto central editável -->
  <text x="50%" y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Inter, Arial, sans-serif"
        font-weight="700"
        font-size="18"
        fill="{TEXT}">{LABEL}</text>
</svg>`
  }
};
