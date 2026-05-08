export const validatePremiumInput = (field: string, value: any) => {
  switch (field) {
    case 'whatsapp':
      if (value && !/^\d{10,11}$/.test(value.replace(/\D/g, ''))) {
        return "Informe um WhatsApp válido com DDD.";
      }
      break;
    case 'address':
      if (value && value.length < 10) {
        return "O endereço parece incompleto.";
      }
      break;
    case 'instagram':
      if (value && !value.startsWith('@') && !value.includes('instagram.com')) {
        return "Use @usuario ou um link válido do Instagram.";
      }
      break;
    case 'instagramImages':
      if (value && Array.isArray(value)) {
        if (value.length > 12) {
          return "Limite máximo de 12 prints.";
        }
      }
      break;
  }
  return null;
};

export const checkFileValid = (file: File) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return "Envie imagens JPG, PNG ou WEBP.";
  }
  if (file.size > 5 * 1024 * 1024) {
    return "O tamanho máximo por imagem é 5MB.";
  }
  return null;
};
