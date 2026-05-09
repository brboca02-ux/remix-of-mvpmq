/** Cada bloco marca o nível mínimo onde aparece (low ⊂ medium ⊂ high). */
export type Tier = 'low' | 'medium' | 'high';

export interface PoolItem {
  text: string;
  tier: Tier;
}

export const OPENINGS: PoolItem[] = [
  { text: 'Oi, tudo bem?', tier: 'low' },
  { text: 'Olá! Tudo certo por aí?', tier: 'low' },
  { text: 'Fala, [nome]!', tier: 'low' },
  { text: 'Oi, [nome]! Posso te fazer uma pergunta rápida?', tier: 'medium' },
  { text: 'Tudo certo? Passando aqui rapidinho…', tier: 'medium' },
  { text: 'Oi! Espero que esteja tudo bem por aí.', tier: 'medium' },
  { text: 'Bom te encontrar por aqui, [nome].', tier: 'medium' },
  { text: 'Eaí, [nome], beleza?', tier: 'high' },
  { text: 'Oi! Só uma mensagem rápida pra te chamar.', tier: 'high' },
  { text: 'Bom dia! Espero não estar incomodando.', tier: 'high' },
  { text: 'Oi, [nome] — tô passando aqui rapidinho.', tier: 'high' },
  { text: 'Olá! Pode me ouvir 30 segundos?', tier: 'high' },
];

export const CONTEXTS: PoolItem[] = [
  { text: 'dei uma olhada no seu negócio', tier: 'low' },
  { text: 'vi que você atua em [nicho]', tier: 'low' },
  { text: 'encontrei sua empresa por aqui', tier: 'low' },
  { text: 'notei seu perfil e gostei do que vi', tier: 'medium' },
  { text: 'estava pesquisando sobre [nicho] em [cidade]', tier: 'medium' },
  { text: 'cheguei até você procurando referências em [nicho]', tier: 'medium' },
  { text: 'tô estudando o mercado de [nicho] e seu nome apareceu', tier: 'medium' },
  { text: 'olhei algumas empresas em [cidade] e a sua chamou atenção', tier: 'high' },
  { text: 'percebi alguns detalhes interessantes no seu perfil', tier: 'high' },
  { text: 'venho acompanhando o que você faz em [nicho]', tier: 'high' },
  { text: 'curti o jeito que você posiciona seu trabalho', tier: 'high' },
];

export const HOOKS: PoolItem[] = [
  { text: 'e achei que dá pra melhorar a captação de clientes', tier: 'low' },
  { text: 'e vi uma oportunidade interessante pra você', tier: 'low' },
  { text: 'e pensei em algo que pode te ajudar', tier: 'low' },
  { text: 'e queria te mostrar uma ideia que pode aumentar seus resultados', tier: 'medium' },
  { text: 'e tenho uma sugestão simples que costuma trazer mais agendamentos', tier: 'medium' },
  { text: 'e acho que tem espaço pra fechar mais clientes sem aumentar custo', tier: 'medium' },
  { text: 'e enxerguei um ponto que poderia destravar mais vendas', tier: 'medium' },
  { text: 'e percebi um detalhe que costuma fazer diferença grande', tier: 'high' },
  { text: 'e queria comentar algo que talvez você ainda não tenha testado', tier: 'high' },
  { text: 'e separei uma ideia que se encaixa bem no seu momento', tier: 'high' },
  { text: 'e tô vendo um caminho rápido pra mais resultado', tier: 'high' },
];

export const CTAS: PoolItem[] = [
  { text: 'posso te explicar em 1 minuto?', tier: 'low' },
  { text: 'faz sentido pra você?', tier: 'low' },
  { text: 'quer ver como funciona?', tier: 'low' },
  { text: 'te mostro rapidinho?', tier: 'medium' },
  { text: 'topa eu te enviar um exemplo curto?', tier: 'medium' },
  { text: 'posso mandar dois prints aqui mesmo?', tier: 'medium' },
  { text: 'me responde só "pode" que eu te explico', tier: 'medium' },
  { text: 'qual o melhor horário pra te explicar?', tier: 'high' },
  { text: 'se fizer sentido, te conto em 2 mensagens', tier: 'high' },
  { text: 'quer que eu te mande os detalhes?', tier: 'high' },
  { text: 'me avisa se valer a pena seguir.', tier: 'high' },
];

export function filterByLevel(pool: PoolItem[], level: Tier): string[] {
  if (level === 'low') return pool.filter((p) => p.tier === 'low').map((p) => p.text);
  if (level === 'medium')
    return pool.filter((p) => p.tier === 'low' || p.tier === 'medium').map((p) => p.text);
  return pool.map((p) => p.text);
}