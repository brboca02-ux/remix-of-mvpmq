import { OPENINGS, CONTEXTS, HOOKS, CTAS, filterByLevel, type Tier } from './message-pools';

export type VariationLevel = Tier;

export interface MessageLead {
  name?: string;
  niche?: string;
  city?: string;
}

export interface GenerateOpts {
  variationLevel?: VariationLevel;
  seed?: number;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickAvoidRecent<T>(
  pool: T[],
  recent: T[],
  rand: () => number,
  windowSize = 3
): T {
  if (pool.length === 0) throw new Error('empty pool');
  const blocked = new Set(recent.slice(-windowSize));
  const available = pool.filter((x) => !blocked.has(x));
  const src = available.length > 0 ? available : pool;
  return src[Math.floor(rand() * src.length)];
}

function firstName(name?: string): string | null {
  if (!name) return null;
  const trimmed = name.trim().split(/\s+/)[0];
  return trimmed || null;
}

function applyPlaceholders(template: string, lead: MessageLead): string {
  let out = template;
  // [nome]
  const fn = firstName(lead.name);
  if (out.includes('[nome]')) {
    if (fn) out = out.replaceAll('[nome]', fn);
    else out = out.replaceAll(', [nome]', '').replaceAll(' [nome]', '').replaceAll('[nome]', '');
  }
  // [nicho]
  if (out.includes('[nicho]')) {
    out = out.replaceAll('[nicho]', (lead.niche && lead.niche.trim()) || 'seu segmento');
  }
  // [cidade]
  if (out.includes('[cidade]')) {
    if (lead.city && lead.city.trim()) out = out.replaceAll('[cidade]', lead.city.trim());
    else out = out.replaceAll(' em [cidade]', '').replaceAll('[cidade]', '');
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

function joinParts(parts: string[]): string {
  // garante que cada parte termine com uma pontuação e quebra natural
  const cleaned = parts.map((p) => p.trim().replace(/[.,;!?]+$/, ''));
  const [open, ctx, hook, cta] = cleaned;
  // Frase principal (contexto + hook) com vírgula natural
  const middle = `${ctx} ${hook.startsWith('e ') ? hook : 'e ' + hook}`.replace(/\s+/g, ' ');
  // CTA termina com '?' se for pergunta, senão '.'
  const ctaPunct = /[?!.]$/.test(cta) ? cta : (cta.endsWith('?') ? cta : cta + (looksLikeQuestion(cta) ? '?' : '.'));
  return `${open} ${middle}. ${ctaPunct}`.replace(/\s+/g, ' ').trim();
}

function looksLikeQuestion(s: string): boolean {
  return /\b(posso|quer|topa|qual|faz sentido|valer)/i.test(s);
}

/** Gera N mensagens com rotação anti-repetição. */
export function generateMessages(leads: MessageLead[], opts: GenerateOpts = {}): string[] {
  const level: VariationLevel = opts.variationLevel ?? 'medium';
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9);
  const rand = mulberry32(seed);

  const openings = filterByLevel(OPENINGS, level);
  const contexts = filterByLevel(CONTEXTS, level);
  const hooks = filterByLevel(HOOKS, level);
  const ctas = filterByLevel(CTAS, level);

  const recentOpen: string[] = [];
  const recentCtx: string[] = [];
  const recentHook: string[] = [];
  const recentCta: string[] = [];

  const out: string[] = [];
  for (const lead of leads) {
    let opening = pickAvoidRecent(openings, recentOpen, rand);
    // Se template tem [nome] e não há nome → tenta outro
    if (opening.includes('[nome]') && !firstName(lead.name)) {
      const noNameOpts = openings.filter((o) => !o.includes('[nome]'));
      if (noNameOpts.length) opening = pickAvoidRecent(noNameOpts, recentOpen, rand);
    }
    const context = pickAvoidRecent(contexts, recentCtx, rand);
    const hook = pickAvoidRecent(hooks, recentHook, rand);
    const cta = pickAvoidRecent(ctas, recentCta, rand);

    recentOpen.push(opening);
    recentCtx.push(context);
    recentHook.push(hook);
    recentCta.push(cta);

    const filled = [opening, context, hook, cta].map((t) => applyPlaceholders(t, lead));
    out.push(joinParts(filled));
  }
  return out;
}