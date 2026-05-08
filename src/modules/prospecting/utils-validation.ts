export const normalizeInstagram = (input: string): { url: string; handle: string; isValid: boolean } => {
  if (!input) return { url: '', handle: '', isValid: false };
  
  let handle = input.trim();
  
  // Se for URL completa
  if (handle.includes('instagram.com/')) {
    try {
      const url = new URL(handle.startsWith('http') ? handle : `https://${handle}`);
      const pathParts = url.pathname.split('/').filter(Boolean);
      handle = pathParts[0] || '';
    } catch (e) {
      // Fallback simples se URL falhar
      handle = handle.split('instagram.com/')[1].split('/')[0];
    }
  }
  
  // Limpar @
  handle = handle.replace('@', '').split('?')[0].split('/')[0];
  
  const isValid = handle.length > 0 && /^[a-zA-Z0-9._]+$/.test(handle);
  
  return {
    url: handle ? `https://www.instagram.com/${handle}/` : '',
    handle,
    isValid
  };
};

export const normalizeGoogleMaps = (input: string): { url: string; isValid: boolean } => {
  if (!input) return { url: '', isValid: false };
  
  const googleMapsRegex = /^(https?:\/\/)?(www\.)?(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.[a-z.]+)\/.*$/;
  
  const isValid = googleMapsRegex.test(input.trim());
  
  return {
    url: input.trim(),
    isValid
  };
};

export const normalizeWhatsApp = (input: string): { normalized: string; display: string; isValid: boolean } => {
  if (!input) return { normalized: '', display: '', isValid: false };
  
  // Remover tudo que não for dígito
  let digits = input.replace(/\D/g, '');
  
  // Se não tem DDI e tem 10 ou 11 dígitos (padrão Brasil), assume 55
  if (digits.length === 10 || digits.length === 11) {
    digits = '55' + digits;
  }
  
  const isValid = digits.length >= 10; // Mínimo razoável para um número internacional com DDI
  
  // Formatação para exibição: +XX (XX) XXXXX-XXXX
  let display = digits;
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    const ddd = digits.substring(2, 4);
    const part1 = digits.length === 13 ? digits.substring(4, 9) : digits.substring(4, 8);
    const part2 = digits.length === 13 ? digits.substring(9) : digits.substring(8);
    display = `+55 (${ddd}) ${part1}-${part2}`;
  } else {
    display = `+${digits}`;
  }
  
  return {
    normalized: digits,
    display,
    isValid
  };
};

export const normalizeWebsite = (input: string): { url: string; isValid: boolean } => {
  if (!input) return { url: '', isValid: false };
  
  let url = input.trim().toLowerCase();
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  try {
    const parsed = new URL(url);
    const isValid = parsed.hostname.includes('.');
    return { url, isValid };
  } catch (e) {
    return { url, isValid: false };
  }
};
