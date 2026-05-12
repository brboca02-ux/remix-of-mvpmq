# Requirements Document

## Introduction

O **Lead Intelligence Engine** é um sistema de enriquecimento automático de leads e inteligência comercial que transforma dados básicos de empresas (nome, telefone, endereço, rating) em perfis completos com presença digital, scoring de oportunidade, identificação de vulnerabilidades comerciais e recomendações de abordagem personalizadas. O sistema integra-se ao módulo `/prospecting` existente, adicionando capacidades de análise profunda, detecção de sinais de timing (empresas recém abertas, em crescimento), avaliação de maturidade digital e automação de prospecção multi-canal.

O sistema utiliza **múltiplas fontes de dados** incluindo APIs oficiais (Google Places, BrasilAPI, PageSpeed Insights), pools de API keys com rotação automática (Hunter.io, Snov.io, Apollo.io, BuiltWith, Wappalyzer), scraping avançado com proxies rotativos (Apify, Bright Data, ScraperAPI), bases governamentais públicas (Portal da Transparência, Jucesp, Jucerja, ViaCEP, IBGE) e fontes alternativas (Telegram, fóruns, bases de dados) para **máxima capacidade de enriquecimento**.

O sistema implementa **enriquecimento sob demanda** para APIs com quotas limitadas, solicitando aprovação do usuário antes de consumir créditos pagos. Leads com score alto recebem enriquecimento automático completo, enquanto leads com score médio/baixo são enriquecidos apenas quando o usuário solicitar explicitamente.

## Glossary

- **Lead_Intelligence_Engine**: Sistema responsável por enriquecimento automático de leads e geração de insights comerciais
- **Lead_Enricher**: Componente que captura dados adicionais de leads (Instagram, WhatsApp, Google Maps, presença digital)
- **Digital_Maturity_Analyzer**: Componente que avalia a maturidade digital de um lead (site, SEO, automação, IA, branding)
- **Opportunity_Scorer**: Componente que calcula score de oportunidade (0-100) baseado em múltiplos fatores
- **Vulnerability_Detector**: Componente que identifica sinais de vulnerabilidade comercial (site ruim, sem automação, branding fraco)
- **Timing_Signal_Detector**: Componente que identifica sinais de timing favorável (empresa recém aberta, em crescimento, expansão física)
- **Sales_Intelligence_Generator**: Componente que gera insights de vendas (dores prováveis, ofertas personalizadas, scripts de abordagem)
- **Prospecting_Automator**: Componente que automatiza prospecção (rotas de visita, disparo WhatsApp, cold email)
- **CNPJ_Enricher**: Componente que enriquece dados via CNPJ (data de abertura, porte, atividade econômica)
- **Social_Media_Enricher**: Componente que captura dados de redes sociais (Instagram, Facebook, seguidores, engajamento)
- **Google_Maps_Enricher**: Componente que captura dados do Google Maps (avaliações, fotos, horários, categoria)
- **Website_Analyzer**: Componente que analisa websites (velocidade, SEO, tecnologias, design)
- **Email_Discovery_Service**: Componente que descobre e valida emails de leads usando múltiplas fontes
- **Competitor_Analyzer**: Componente que analisa concorrentes locais e gera inteligência competitiva
- **Review_Analyzer**: Componente que analisa sentimento de reviews e extrai pain points
- **Advanced_Data_Integrator**: Componente que integra fontes de dados avançadas (scraping, bases alternativas, proxies)
- **Lead_Score**: Pontuação de 0-100 que indica a qualidade e probabilidade de conversão de um lead
- **Digital_Maturity_Score**: Pontuação de 0-100 que indica o nível de maturidade digital de um lead
- **Vulnerability_Score**: Pontuação de 0-100 que indica o nível de vulnerabilidade comercial de um lead
- **Timing_Score**: Pontuação de 0-100 que indica o timing favorável para abordagem
- **Data_Confidence_Score**: Pontuação de 0-100 que indica a confiabilidade dos dados enriquecidos de um lead
- **Sentiment_Score**: Pontuação de 0-100 que indica o sentimento geral dos reviews (% positivos)
- **Competitive_Pressure_Score**: Pontuação de 0-100 que indica o nível de pressão competitiva na região
- **Identity_Status**: Status de verificação de identidade legal da empresa (verified, invalid_cnpj, not_found)
- **Data_Confidence**: Nível de confiabilidade dos dados operacionais (high, medium, low, unknown)
- **Field_Confidence**: Nível de confiabilidade de um campo individual (high, medium, low, unknown)
- **Email_Confidence**: Nível de confiabilidade de email descoberto (high=verificado, medium=inferido, low=padrão comum)
- **Pain_Point**: Dor ou problema identificado no lead que pode ser resolvido com produtos/serviços
- **Personalized_Offer**: Oferta personalizada gerada com base no perfil e dores do lead
- **Approach_Script**: Script de abordagem personalizado para o lead
- **Smart_Route**: Rota otimizada para visitas porta a porta baseada em geolocalização e priorização
- **Enrichment_Job**: Job em background que executa enriquecimento de leads em lote
- **On_Demand_Enrichment**: Enriquecimento sob demanda solicitado explicitamente pelo usuário
- **API_Key_Pool**: Pool de múltiplas API keys com rotação automática para maximizar quotas gratuitas
- **Proxy_Rotator**: Sistema de rotação de proxies para evitar bloqueios em scraping
- **Free_API**: API gratuita utilizada para enriquecimento de dados
- **Alternative_Data_Source**: Fonte de dados alternativa (bases vazadas, Telegram, fóruns) para uso pessoal

## Requirements

### Requirement 1: Enriquecimento Automático de Leads

**User Story:** Como vendedor, eu quero que o sistema enriqueça automaticamente meus leads com dados de redes sociais e presença digital, para que eu tenha informações completas sem precisar pesquisar manualmente.

#### Acceptance Criteria

1. WHEN um lead é criado ou importado, THE Lead_Enricher SHALL iniciar enriquecimento automático em background
2. THE Social_Media_Enricher SHALL capturar Instagram handle, URL, número de seguidores e data do último post
3. THE Social_Media_Enricher SHALL capturar WhatsApp business se disponível publicamente
4. THE Google_Maps_Enricher SHALL capturar rating, número de reviews, fotos, horários de funcionamento e categoria
5. THE Website_Analyzer SHALL detectar se o lead possui website e capturar URL
6. WHEN o enriquecimento é concluído, THE Lead_Intelligence_Engine SHALL atualizar o lead com os dados capturados
7. THE Lead_Intelligence_Engine SHALL registrar timestamp de última atualização e fonte dos dados
8. IF o enriquecimento falhar para alguma fonte, THEN THE Lead_Intelligence_Engine SHALL registrar erro e continuar com outras fontes

### Requirement 2: Análise de Presença Digital

**User Story:** Como vendedor, eu quero que o sistema avalie a presença digital dos meus leads, para que eu identifique oportunidades de melhoria que posso oferecer.

#### Acceptance Criteria

1. THE Digital_Maturity_Analyzer SHALL avaliar se o lead possui website ativo
2. WHEN um website é detectado, THE Website_Analyzer SHALL analisar velocidade de carregamento usando métricas públicas
3. THE Website_Analyzer SHALL detectar tecnologias utilizadas no site (WordPress, Wix, custom, etc)
4. THE Website_Analyzer SHALL avaliar qualidade de SEO básico (meta tags, títulos, descrições)
5. THE Digital_Maturity_Analyzer SHALL verificar presença em redes sociais (Instagram, Facebook, LinkedIn)
6. THE Digital_Maturity_Analyzer SHALL avaliar frequência de postagens nas redes sociais
7. THE Digital_Maturity_Analyzer SHALL detectar uso de tráfego pago (Google Ads, Facebook Ads) quando possível
8. THE Digital_Maturity_Analyzer SHALL calcular Digital_Maturity_Score de 0-100 baseado nos fatores avaliados
9. THE Digital_Maturity_Analyzer SHALL categorizar maturidade como "Inexistente", "Básica", "Intermediária" ou "Avançada"

### Requirement 3: Detecção de Vulnerabilidades Comerciais

**User Story:** Como vendedor, eu quero que o sistema identifique vulnerabilidades comerciais nos meus leads, para que eu saiba quais problemas posso resolver com meus serviços.

#### Acceptance Criteria

1. THE Vulnerability_Detector SHALL identificar ausência de website como vulnerabilidade crítica
2. THE Vulnerability_Detector SHALL identificar website lento (>3s) como vulnerabilidade alta
3. THE Vulnerability_Detector SHALL identificar SEO fraco como vulnerabilidade média
4. THE Vulnerability_Detector SHALL identificar ausência de redes sociais ativas como vulnerabilidade média
5. THE Vulnerability_Detector SHALL identificar branding inconsistente entre canais como vulnerabilidade baixa
6. THE Vulnerability_Detector SHALL identificar ausência de automação (chatbot, formulários) como vulnerabilidade média
7. THE Vulnerability_Detector SHALL calcular Vulnerability_Score de 0-100 baseado nas vulnerabilidades detectadas
8. THE Vulnerability_Detector SHALL gerar lista priorizada de vulnerabilidades com descrição e impacto

### Requirement 4: Enriquecimento via CNPJ

**User Story:** Como vendedor, eu quero que o sistema enriqueça leads com dados de CNPJ, para que eu tenha informações sobre porte, data de abertura e atividade econômica.

#### Acceptance Criteria

1. WHEN um CNPJ é fornecido ou detectado, THE CNPJ_Enricher SHALL consultar BrasilAPI ou API gratuita equivalente
2. THE CNPJ_Enricher SHALL capturar razão social, nome fantasia e data de abertura
3. THE CNPJ_Enricher SHALL capturar porte da empresa (MEI, ME, EPP, Grande)
4. THE CNPJ_Enricher SHALL capturar CNAE principal e atividade econômica
5. THE CNPJ_Enricher SHALL capturar endereço completo e situação cadastral
6. THE CNPJ_Enricher SHALL calcular idade da empresa em meses
7. THE CNPJ_Enricher SHALL separar identity_status (verified, invalid_cnpj, not_found) de data_confidence (high, medium, low, unknown)
8. WHEN o CNPJ é válido mas dados associados estão incompletos, THE CNPJ_Enricher SHALL marcar identity_status como "verified" e data_confidence como "low" ou "medium"
9. THE CNPJ_Enricher SHALL marcar campos individuais como unverified quando dados são incompletos, inconsistentes, desatualizados ou derivados de fontes de baixa confiança
10. IF o CNPJ for inválido ou não encontrado, THEN THE CNPJ_Enricher SHALL marcar identity_status como "invalid_cnpj" ou "not_found"

### Requirement 5: Data Confidence Scoring

**User Story:** Como vendedor, eu quero que o sistema avalie a confiabilidade dos dados enriquecidos, para que eu saiba quais informações são confiáveis e quais precisam de verificação manual.

#### Acceptance Criteria

1. THE Lead_Intelligence_Engine SHALL calcular Data_Confidence_Score de 0-100 para cada lead enriquecido
2. THE Lead_Intelligence_Engine SHALL ponderar completude de campos (campos preenchidos vs campos totais) com peso de 30%
3. THE Lead_Intelligence_Engine SHALL ponderar recência dos dados (timestamp de última atualização) com peso de 25%
4. THE Lead_Intelligence_Engine SHALL ponderar concordância entre fontes (dados consistentes entre APIs) com peso de 25%
5. THE Lead_Intelligence_Engine SHALL ponderar confiabilidade da fonte (API oficial vs scraping) com peso de 20%
6. THE Lead_Intelligence_Engine SHALL categorizar confiança como "High" (80-100), "Medium" (50-79), "Low" (20-49) ou "Unknown" (0-19)
7. THE Lead_Intelligence_Engine SHALL marcar campos individuais com field_confidence (high, medium, low, unknown)
8. WHEN dados de múltiplas fontes conflitam, THE Lead_Intelligence_Engine SHALL marcar field_confidence como "low" e registrar conflito
9. WHEN dados têm mais de 90 dias, THE Lead_Intelligence_Engine SHALL reduzir field_confidence em um nível
10. THE Lead_Intelligence_Engine SHALL exibir indicador visual de confiança na UI (badge ou ícone) para cada campo enriquecido

### Requirement 6: Detecção de Sinais de Timing

**User Story:** Como vendedor, eu quero que o sistema identifique sinais de timing favorável para abordagem, para que eu priorize leads com maior probabilidade de conversão.

#### Acceptance Criteria

1. THE Timing_Signal_Detector SHALL identificar empresas abertas há menos de 12 meses como "timing quente"
2. THE Timing_Signal_Detector SHALL identificar crescimento de seguidores nas redes sociais (>20% em 3 meses) como sinal positivo
3. THE Timing_Signal_Detector SHALL identificar aumento de reviews no Google Maps como sinal de crescimento
4. THE Timing_Signal_Detector SHALL identificar mudança de endereço ou expansão física como sinal de crescimento
5. THE Timing_Signal_Detector SHALL identificar aumento de menções online como sinal de crescimento
6. THE Timing_Signal_Detector SHALL calcular Timing_Score de 0-100 baseado nos sinais detectados
7. THE Timing_Signal_Detector SHALL categorizar timing como "Frio", "Morno", "Quente" ou "Urgente"

### Requirement 7: Sistema de Scoring Unificado

**User Story:** Como vendedor, eu quero que o sistema calcule um score unificado de oportunidade, para que eu priorize meus esforços nos leads mais promissores.

#### Acceptance Criteria

1. THE Opportunity_Scorer SHALL calcular Lead_Score de 0-100 combinando múltiplos fatores
2. THE Opportunity_Scorer SHALL ponderar Digital_Maturity_Score com peso de 25%
3. THE Opportunity_Scorer SHALL ponderar Vulnerability_Score com peso de 30%
4. THE Opportunity_Scorer SHALL ponderar Timing_Score com peso de 25%
5. THE Opportunity_Scorer SHALL ponderar dados de engajamento (reviews, seguidores) com peso de 20%
6. THE Opportunity_Scorer SHALL categorizar leads como "Baixa", "Média", "Alta" ou "Muito Alta" oportunidade
7. THE Opportunity_Scorer SHALL recalcular score automaticamente quando novos dados são adicionados
8. THE Opportunity_Scorer SHALL registrar histórico de mudanças de score com timestamp

### Requirement 8: Geração de Inteligência de Vendas

**User Story:** Como vendedor, eu quero que o sistema gere insights de vendas personalizados, para que eu saiba como abordar cada lead de forma efetiva.

#### Acceptance Criteria

1. THE Sales_Intelligence_Generator SHALL identificar até 5 Pain_Points prováveis baseados no perfil do lead
2. THE Sales_Intelligence_Generator SHALL gerar até 3 Personalized_Offers baseadas nas dores identificadas
3. THE Sales_Intelligence_Generator SHALL gerar Approach_Script personalizado para cada canal (WhatsApp, Email, Presencial)
4. THE Sales_Intelligence_Generator SHALL sugerir melhor horário de abordagem baseado em padrões do nicho
5. THE Sales_Intelligence_Generator SHALL sugerir melhor canal de abordagem baseado em presença digital
6. THE Sales_Intelligence_Generator SHALL gerar objeções prováveis e respostas sugeridas
7. THE Sales_Intelligence_Generator SHALL estimar valor potencial do negócio baseado em porte e nicho
8. THE Sales_Intelligence_Generator SHALL calcular probabilidade de fechamento (0-100%)

### Requirement 9: Rotas Inteligentes de Prospecção

**User Story:** Como vendedor, eu quero que o sistema gere rotas otimizadas para visitas porta a porta, para que eu maximize meu tempo e eficiência.

#### Acceptance Criteria

1. WHEN o usuário solicita rota de visitas, THE Prospecting_Automator SHALL agrupar leads por proximidade geográfica
2. THE Prospecting_Automator SHALL priorizar leads com Lead_Score mais alto na rota
3. THE Prospecting_Automator SHALL calcular distância e tempo estimado entre pontos
4. THE Prospecting_Automator SHALL gerar sequência otimizada de visitas minimizando deslocamento
5. THE Prospecting_Automator SHALL considerar horários de funcionamento dos estabelecimentos
6. THE Prospecting_Automator SHALL exportar rota para Google Maps ou Waze
7. THE Prospecting_Automator SHALL permitir ajuste manual da ordem de visitas
8. THE Prospecting_Automator SHALL salvar rotas criadas para reutilização

### Requirement 10: Automação de Prospecção via WhatsApp

**User Story:** Como vendedor, eu quero que o sistema automatize disparos via WhatsApp, para que eu alcance mais leads em menos tempo.

#### Acceptance Criteria

1. THE Prospecting_Automator SHALL gerar mensagens personalizadas de WhatsApp baseadas no perfil do lead
2. THE Prospecting_Automator SHALL criar links de WhatsApp Web pré-preenchidos com a mensagem
3. THE Prospecting_Automator SHALL permitir disparo em lote com intervalo configurável entre mensagens
4. THE Prospecting_Automator SHALL registrar timestamp de cada disparo
5. THE Prospecting_Automator SHALL marcar lead como "WhatsApp Enviado" após disparo
6. THE Prospecting_Automator SHALL agendar follow-up automático após período configurável sem resposta
7. IF o número de WhatsApp não for válido, THEN THE Prospecting_Automator SHALL marcar lead para revisão manual

### Requirement 11: Automação de Cold Email

**User Story:** Como vendedor, eu quero que o sistema gere e envie cold emails personalizados, para que eu alcance leads que não respondem via WhatsApp.

#### Acceptance Criteria

1. THE Prospecting_Automator SHALL gerar assunto de email personalizado baseado no perfil do lead
2. THE Prospecting_Automator SHALL gerar corpo de email consultivo com até 150 palavras
3. THE Prospecting_Automator SHALL incluir call-to-action claro no email
4. THE Prospecting_Automator SHALL permitir preview e edição antes do envio
5. THE Prospecting_Automator SHALL registrar timestamp de envio
6. THE Prospecting_Automator SHALL marcar lead como "Cold Email Enviado" após envio
7. THE Prospecting_Automator SHALL agendar follow-up email após 3 dias sem resposta

### Requirement 12: Gestão de Objeções

**User Story:** Como vendedor, eu quero que o sistema me ajude a lidar com objeções comuns, para que eu aumente minha taxa de conversão.

#### Acceptance Criteria

1. THE Sales_Intelligence_Generator SHALL identificar objeções prováveis baseadas no perfil do lead
2. THE Sales_Intelligence_Generator SHALL gerar respostas sugeridas para cada objeção
3. THE Sales_Intelligence_Generator SHALL categorizar objeções por tipo (preço, timing, confiança, necessidade)
4. THE Sales_Intelligence_Generator SHALL sugerir provas sociais relevantes para cada objeção
5. THE Sales_Intelligence_Generator SHALL sugerir estratégia de contorno para objeções críticas
6. THE Prospecting_Automator SHALL permitir registro de objeções reais encontradas
7. THE Lead_Intelligence_Engine SHALL aprender com objeções registradas para melhorar sugestões futuras

### Requirement 13: Processamento em Background

**User Story:** Como vendedor, eu quero que o enriquecimento de leads aconteça em background, para que eu não precise esperar e possa continuar trabalhando.

#### Acceptance Criteria

1. WHEN múltiplos leads são importados, THE Lead_Intelligence_Engine SHALL criar Enrichment_Job em background
2. THE Enrichment_Job SHALL processar leads em lotes de até 10 simultaneamente
3. THE Enrichment_Job SHALL exibir progresso em tempo real (X de Y processados)
4. THE Enrichment_Job SHALL permitir cancelamento pelo usuário
5. THE Enrichment_Job SHALL registrar erros sem interromper processamento de outros leads
6. WHEN o Enrichment_Job é concluído, THE Lead_Intelligence_Engine SHALL notificar usuário
7. THE Enrichment_Job SHALL gerar relatório de conclusão com estatísticas (sucessos, falhas, tempo total)
8. THE Lead_Intelligence_Engine SHALL permitir retry de leads que falharam

### Requirement 14: Integração com Módulo Prospecting

**User Story:** Como desenvolvedor, eu quero que o Lead Intelligence Engine se integre perfeitamente ao módulo prospecting existente, para que não haja duplicação de código ou conflitos.

#### Acceptance Criteria

1. THE Lead_Intelligence_Engine SHALL estender o tipo ProspectLead existente sem modificar campos atuais
2. THE Lead_Intelligence_Engine SHALL adicionar novos campos opcionais ao ProspectLead para dados enriquecidos
3. THE Lead_Intelligence_Engine SHALL utilizar o prospecting-store existente para persistência
4. THE Lead_Intelligence_Engine SHALL emitir eventos que o prospecting-store possa consumir
5. THE Lead_Intelligence_Engine SHALL respeitar o fluxo de qualificação existente (opportunityScore)
6. THE Lead_Intelligence_Engine SHALL adicionar novos serviços sem modificar serviços existentes
7. THE Lead_Intelligence_Engine SHALL adicionar novos componentes UI na estrutura existente de components/buscador

### Requirement 15: Uso de APIs Gratuitas

**User Story:** Como desenvolvedor, eu quero que o sistema utilize APIs gratuitas sempre que possível, para que os custos operacionais sejam minimizados.

#### Acceptance Criteria

1. THE CNPJ_Enricher SHALL utilizar BrasilAPI (gratuita) para dados de CNPJ
2. THE Social_Media_Enricher SHALL utilizar scraping ético ou APIs públicas gratuitas para Instagram
3. THE Google_Maps_Enricher SHALL utilizar Google Places API com quota gratuita
4. THE Website_Analyzer SHALL utilizar ferramentas open-source para análise de velocidade
5. THE Lead_Intelligence_Engine SHALL implementar cache para evitar chamadas duplicadas de API
6. THE Lead_Intelligence_Engine SHALL implementar rate limiting para respeitar limites de APIs gratuitas
7. IF uma API gratuita não estiver disponível, THEN THE Lead_Intelligence_Engine SHALL degradar graciosamente sem falhar

### Requirement 16: Dashboard de Inteligência

**User Story:** Como vendedor, eu quero visualizar insights agregados de todos os meus leads, para que eu entenda padrões e oportunidades no meu pipeline.

#### Acceptance Criteria

1. THE Lead_Intelligence_Engine SHALL exibir distribuição de leads por Digital_Maturity_Score
2. THE Lead_Intelligence_Engine SHALL exibir distribuição de leads por Vulnerability_Score
3. THE Lead_Intelligence_Engine SHALL exibir distribuição de leads por Timing_Score
4. THE Lead_Intelligence_Engine SHALL exibir distribuição de leads por Data_Confidence_Score
5. THE Lead_Intelligence_Engine SHALL exibir top 5 vulnerabilidades mais comuns
6. THE Lead_Intelligence_Engine SHALL exibir top 5 Pain_Points mais frequentes
7. THE Lead_Intelligence_Engine SHALL exibir valor total estimado do pipeline
8. THE Lead_Intelligence_Engine SHALL exibir taxa de conversão por canal de prospecção
9. THE Lead_Intelligence_Engine SHALL exibir métricas de qualidade de dados (% high confidence, % low confidence)
10. THE Lead_Intelligence_Engine SHALL permitir filtros por nicho, cidade, score e data_confidence

### Requirement 17: Importação de Arquivo de Exemplo

**User Story:** Como vendedor, eu quero importar o arquivo estetica.txt com leads de clínicas de estética, para que eu possa testar o sistema com dados reais.

#### Acceptance Criteria

1. THE Lead_Intelligence_Engine SHALL suportar importação de arquivo TXT com formato customizado
2. THE Lead_Intelligence_Engine SHALL parsear campos: nome, telefone, rating, reviews, categoria, endereço
3. THE Lead_Intelligence_Engine SHALL validar dados durante importação
4. THE Lead_Intelligence_Engine SHALL criar leads no sistema com status "Novo"
5. THE Lead_Intelligence_Engine SHALL iniciar enriquecimento automático após importação
6. THE Lead_Intelligence_Engine SHALL exibir preview dos dados antes de confirmar importação
7. THE Lead_Intelligence_Engine SHALL reportar erros de parsing com linha e campo específicos
8. THE Lead_Intelligence_Engine SHALL permitir mapeamento customizado de campos

### Requirement 18: Parser de Dados de Leads

**User Story:** Como desenvolvedor, eu quero um parser robusto para dados de leads, para que o sistema suporte múltiplos formatos de entrada.

#### Acceptance Criteria

1. THE Lead_Parser SHALL parsear formato CSV com delimitadores configuráveis
2. THE Lead_Parser SHALL parsear formato TXT com padrões regex customizáveis
3. THE Lead_Parser SHALL parsear formato JSON com schema validation
4. THE Lead_Parser SHALL detectar automaticamente encoding (UTF-8, ISO-8859-1)
5. THE Lead_Parser SHALL normalizar telefones para formato brasileiro (+55)
6. THE Lead_Parser SHALL normalizar endereços removendo caracteres especiais
7. THE Lead_Parser SHALL validar campos obrigatórios (nome, telefone ou email)
8. FOR ALL formatos suportados, parsear e depois serializar SHALL produzir dados equivalentes (round-trip property)

### Requirement 19: Pretty Printer de Leads

**User Story:** Como desenvolvedor, eu quero um pretty printer para leads, para que eu possa exportar dados em formatos legíveis.

#### Acceptance Criteria

1. THE Lead_Pretty_Printer SHALL formatar leads para CSV com headers
2. THE Lead_Pretty_Printer SHALL formatar leads para JSON indentado
3. THE Lead_Pretty_Printer SHALL formatar leads para TXT com template customizável
4. THE Lead_Pretty_Printer SHALL incluir todos os campos enriquecidos na exportação
5. THE Lead_Pretty_Printer SHALL permitir seleção de campos a exportar
6. THE Lead_Pretty_Printer SHALL aplicar formatação de moeda para valores monetários
7. THE Lead_Pretty_Printer SHALL aplicar formatação de data para timestamps

### Requirement 20: Validação de Dados Enriquecidos

**User Story:** Como desenvolvedor, eu quero validar dados enriquecidos antes de persistir, para que o sistema mantenha integridade de dados.

#### Acceptance Criteria

1. THE Lead_Intelligence_Engine SHALL validar que Lead_Score está entre 0 e 100
2. THE Lead_Intelligence_Engine SHALL validar que Digital_Maturity_Score está entre 0 e 100
3. THE Lead_Intelligence_Engine SHALL validar que Vulnerability_Score está entre 0 e 100
4. THE Lead_Intelligence_Engine SHALL validar que Timing_Score está entre 0 e 100
5. THE Lead_Intelligence_Engine SHALL validar que Data_Confidence_Score está entre 0 e 100
6. THE Lead_Intelligence_Engine SHALL validar que Identity_Status é um dos valores válidos (verified, invalid_cnpj, not_found)
7. THE Lead_Intelligence_Engine SHALL validar que Data_Confidence é um dos valores válidos (high, medium, low, unknown)
8. THE Lead_Intelligence_Engine SHALL validar que Field_Confidence é um dos valores válidos (high, medium, low, unknown)
9. THE Lead_Intelligence_Engine SHALL validar que URLs de redes sociais são válidas
10. THE Lead_Intelligence_Engine SHALL validar que timestamps são datas válidas
11. THE Lead_Intelligence_Engine SHALL validar que valores monetários são números positivos
12. IF validação falhar, THEN THE Lead_Intelligence_Engine SHALL registrar erro e não persistir dados inválidos

### Requirement 21: Monitoramento e Logs

**User Story:** Como desenvolvedor, eu quero logs estruturados de todas as operações de enriquecimento, para que eu possa debugar problemas e monitorar performance.

#### Acceptance Criteria

1. THE Lead_Intelligence_Engine SHALL registrar log de início e fim de cada enriquecimento
2. THE Lead_Intelligence_Engine SHALL registrar tempo de execução de cada etapa de enriquecimento
3. THE Lead_Intelligence_Engine SHALL registrar erros com stack trace completo
4. THE Lead_Intelligence_Engine SHALL registrar chamadas de API com status code e tempo de resposta
5. THE Lead_Intelligence_Engine SHALL registrar estatísticas agregadas (taxa de sucesso, tempo médio)
6. THE Lead_Intelligence_Engine SHALL utilizar níveis de log apropriados (debug, info, warn, error)
7. THE Lead_Intelligence_Engine SHALL incluir leadId em todos os logs para rastreabilidade
8. THE Lead_Intelligence_Engine SHALL permitir configuração de nível de log via variável de ambiente

### Requirement 22: Email Discovery & Validation

**User Story:** Como vendedor, eu quero que o sistema descubra e valide emails de leads automaticamente, para que eu possa fazer cold email outreach efetivo.

#### Acceptance Criteria

1. THE Email_Discovery_Service SHALL implementar pool de API keys com rotação automática para Hunter.io (mínimo 10 contas)
2. THE Email_Discovery_Service SHALL implementar pool de API keys com rotação automática para Snov.io (mínimo 10 contas)
3. THE Email_Discovery_Service SHALL implementar pool de API keys com rotação automática para Apollo.io (mínimo 10 contas)
4. WHEN quota de API gratuita é atingida, THE Email_Discovery_Service SHALL solicitar aprovação do usuário para usar conta paga
5. THE Email_Discovery_Service SHALL fazer scraping de websites para extrair emails de páginas de contato
6. THE Email_Discovery_Service SHALL tentar padrões comuns (contato@, vendas@, comercial@, atendimento@, sac@)
7. THE Email_Discovery_Service SHALL validar formato de email usando regex
8. THE Email_Discovery_Service SHALL validar existência de email usando EmailListVerify API ou SMTP check
9. THE Email_Discovery_Service SHALL marcar email_confidence como "high" (verificado), "medium" (inferido) ou "low" (padrão comum)
10. THE Email_Discovery_Service SHALL registrar fonte de descoberta (hunter, snov, apollo, scraping, pattern)
11. WHEN múltiplos emails são encontrados, THE Email_Discovery_Service SHALL priorizar emails genéricos (contato@) sobre pessoais
12. THE Email_Discovery_Service SHALL implementar cache de 30 dias para emails descobertos

### Requirement 23: Competitive Intelligence Local

**User Story:** Como vendedor, eu quero que o sistema analise concorrentes locais do lead, para que eu possa usar inteligência competitiva no pitch.

#### Acceptance Criteria

1. THE Competitor_Analyzer SHALL buscar concorrentes usando Google Places API com mesmo nicho e raio de 5km
2. THE Competitor_Analyzer SHALL capturar até 20 concorrentes diretos por lead
3. THE Competitor_Analyzer SHALL calcular posição relativa do lead (ranking por rating e reviews)
4. THE Competitor_Analyzer SHALL identificar concorrentes com rating superior (ameaça competitiva)
5. THE Competitor_Analyzer SHALL identificar concorrentes com rating inferior (oportunidade de diferenciação)
6. THE Competitor_Analyzer SHALL calcular rating médio do nicho na região
7. THE Competitor_Analyzer SHALL calcular número médio de reviews do nicho na região
8. THE Competitor_Analyzer SHALL identificar concorrentes com website (gap de maturidade digital)
9. THE Competitor_Analyzer SHALL identificar concorrentes com Instagram ativo (gap de presença social)
10. THE Competitor_Analyzer SHALL gerar competitive_insight com mensagem para pitch (ex: "3 de 5 concorrentes diretos já investem em marketing digital")
11. THE Competitor_Analyzer SHALL calcular competitive_pressure_score de 0-100 baseado em maturidade dos concorrentes
12. THE Competitor_Analyzer SHALL implementar cache de 7 dias para análise competitiva

### Requirement 24: Review Sentiment Analysis

**User Story:** Como vendedor, eu quero que o sistema analise sentimento de reviews do lead, para que eu identifique pain points reais dos clientes.

#### Acceptance Criteria

1. THE Review_Analyzer SHALL capturar até 50 reviews mais recentes do Google Maps
2. THE Review_Analyzer SHALL usar IA local (Gemini/GPT) para análise de sentimento
3. THE Review_Analyzer SHALL categorizar sentimento como "positivo", "neutro" ou "negativo"
4. THE Review_Analyzer SHALL extrair pain_points de reviews negativos (até 10)
5. THE Review_Analyzer SHALL extrair strengths de reviews positivos (até 10)
6. THE Review_Analyzer SHALL identificar temas recorrentes (atendimento, preço, qualidade, localização, etc)
7. THE Review_Analyzer SHALL calcular sentiment_score de 0-100 (% de reviews positivos)
8. THE Review_Analyzer SHALL identificar tendência de sentimento (melhorando, piorando, estável)
9. THE Review_Analyzer SHALL gerar review_insight para pitch (ex: "Clientes reclamam de demora no atendimento - oportunidade para chatbot")
10. WHEN reviews mencionam concorrentes, THE Review_Analyzer SHALL extrair nomes e contexto
11. THE Review_Analyzer SHALL implementar cache de 14 dias para análise de reviews
12. THE Review_Analyzer SHALL processar análise em background para não bloquear enriquecimento

### Requirement 25: Advanced Data Sources Integration

**User Story:** Como desenvolvedor, eu quero integrar fontes de dados avançadas e bases alternativas, para que o sistema tenha máxima capacidade de enriquecimento.

#### Acceptance Criteria

1. THE Advanced_Data_Integrator SHALL implementar pool de API keys para BuiltWith (mínimo 5 contas) para detecção de tecnologias
2. THE Advanced_Data_Integrator SHALL implementar pool de API keys para Wappalyzer (mínimo 10 contas) para detecção de stack tecnológico
3. THE Advanced_Data_Integrator SHALL integrar com Apify para scraping de Instagram (100 perfis/dia por conta)
4. THE Advanced_Data_Integrator SHALL integrar com Apify para scraping de Google Maps (500 lugares/dia por conta)
5. THE Advanced_Data_Integrator SHALL integrar com Apify para scraping de Facebook Pages (50 páginas/dia por conta)
6. THE Advanced_Data_Integrator SHALL implementar scraping de Portal da Transparência para detectar empresas que vencem licitações
7. THE Advanced_Data_Integrator SHALL implementar scraping de Jucesp/Jucerja para dados de empresas estaduais
8. THE Advanced_Data_Integrator SHALL integrar com ViaCEP para enriquecimento de endereços
9. THE Advanced_Data_Integrator SHALL integrar com IBGE API para dados demográficos da região
10. THE Advanced_Data_Integrator SHALL implementar acesso a bases de dados alternativas (Telegram, fóruns, grupos) para telefones e emails validados
11. THE Advanced_Data_Integrator SHALL implementar sistema de proxies rotativos (Bright Data, ScraperAPI) para evitar bloqueios
12. THE Advanced_Data_Integrator SHALL implementar anti-detecção (user-agent rotation, headers randomization, delays aleatórios)
13. WHEN quota de serviço gratuito é atingida, THE Advanced_Data_Integrator SHALL solicitar aprovação do usuário para continuar
14. THE Advanced_Data_Integrator SHALL registrar fonte de cada dado (api_oficial, scraping_legal, base_alternativa)
15. THE Advanced_Data_Integrator SHALL implementar fallback automático entre fontes quando uma falha
16. THE Advanced_Data_Integrator SHALL respeitar rate limits e implementar exponential backoff em caso de erro 429

### Requirement 26: On-Demand Enrichment

**User Story:** Como vendedor, eu quero solicitar enriquecimento sob demanda para leads específicos, para que eu não desperdice quotas de APIs em leads de baixa prioridade.

#### Acceptance Criteria

1. THE Lead_Intelligence_Engine SHALL implementar modo de enriquecimento "on-demand" além do automático
2. WHEN modo é "on-demand", THE Lead_Intelligence_Engine SHALL enriquecer apenas quando usuário solicitar explicitamente
3. THE Lead_Intelligence_Engine SHALL exibir botão "Enriquecer Agora" na UI do lead
4. WHEN usuário clica em "Enriquecer Agora", THE Lead_Intelligence_Engine SHALL exibir preview de quotas disponíveis por serviço
5. THE Lead_Intelligence_Engine SHALL permitir seleção de quais fontes usar (email, competitor, reviews, social, etc)
6. THE Lead_Intelligence_Engine SHALL exibir custo estimado em quotas para enriquecimento selecionado
7. THE Lead_Intelligence_Engine SHALL solicitar confirmação antes de executar enriquecimento
8. THE Lead_Intelligence_Engine SHALL exibir progresso em tempo real durante enriquecimento on-demand
9. THE Lead_Intelligence_Engine SHALL permitir cancelamento de enriquecimento em andamento
10. THE Lead_Intelligence_Engine SHALL priorizar leads com Lead_Score alto para enriquecimento automático
11. THE Lead_Intelligence_Engine SHALL sugerir enriquecimento on-demand para leads com score médio/baixo
12. THE Lead_Intelligence_Engine SHALL implementar sistema de créditos para controlar uso de APIs pagas
