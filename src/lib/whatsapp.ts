export function whatsappLink(telefone: string | undefined | null, nome?: string): string | null {
  if (!telefone) return null;
  const digits = telefone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const text = nome
    ? `Olá ${nome}, vim pela MarketScope. Posso falar com vocês sobre uma oportunidade?`
    : "Olá, vim pela MarketScope.";
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
}
