export interface VCardInput {
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  site?: string;
  cidade?: string;
  uf?: string;
}

function esc(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

export function buildVCard(input: VCardInput): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${esc(input.nome)}`, `ORG:${esc(input.nome)}`];
  if (input.telefone) lines.push(`TEL;TYPE=WORK,VOICE:${esc(input.telefone)}`);
  if (input.email) lines.push(`EMAIL;TYPE=WORK:${esc(input.email)}`);
  if (input.site) lines.push(`URL:${esc(input.site)}`);
  if (input.cidade || input.uf)
    lines.push(`ADR;TYPE=WORK:;;;${esc(input.cidade ?? "")};${esc(input.uf ?? "")};;BR`);
  if (input.cnpj) lines.push(`NOTE:CNPJ ${esc(input.cnpj)}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function downloadVCard(input: VCardInput) {
  const vcf = buildVCard(input);
  const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = input.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  a.href = url;
  a.download = `${slug || "contato"}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}
