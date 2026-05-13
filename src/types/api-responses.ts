/**
 * API Response Type Definitions
 * 
 * This file contains TypeScript interfaces for external API responses
 * used throughout the application. These types replace 'any' types
 * identified in the type audit (Task 14.1).
 * 
 * @module types/api-responses
 */

// ============================================================================
// Google Places API Types
// ============================================================================

/**
 * Google Places API search response
 * Used in: src/lib/places-bulk.functions.ts
 */
export interface GooglePlacesResponse {
  /** Status of the API request */
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
  /** Array of place results */
  results: GooglePlaceResult[];
  /** Token for fetching next page of results */
  next_page_token?: string;
  /** Error message if status is not OK */
  error_message?: string;
  /** HTML attributions required by Google */
  html_attributions?: string[];
}

/**
 * Individual place result from Google Places API
 */
export interface GooglePlaceResult {
  /** Unique identifier for the place */
  place_id: string;
  /** Human-readable name of the place */
  name: string;
  /** Formatted address string */
  formatted_address?: string;
  /** Geographic location */
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    viewport?: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };
  /** Business status */
  business_status?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';
  /** Place types (e.g., 'restaurant', 'cafe') */
  types?: string[];
  /** User rating (1-5) */
  rating?: number;
  /** Number of user ratings */
  user_ratings_total?: number;
  /** Price level (0-4) */
  price_level?: number;
  /** Opening hours information */
  opening_hours?: {
    open_now?: boolean;
    periods?: Array<{
      open: { day: number; time: string };
      close?: { day: number; time: string };
    }>;
    weekday_text?: string[];
  };
  /** Photos metadata */
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
    html_attributions: string[];
  }>;
  /** Icon URL */
  icon?: string;
  /** Icon background color */
  icon_background_color?: string;
  /** Vicinity (simplified address) */
  vicinity?: string;
  /** Plus code location */
  plus_code?: {
    compound_code?: string;
    global_code?: string;
  };
}

/**
 * Google Place Details API response
 * Used for fetching detailed information about a specific place
 */
export interface GooglePlaceDetails {
  /** Status of the API request */
  status: 'OK' | 'ZERO_RESULTS' | 'NOT_FOUND' | 'INVALID_REQUEST' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'UNKNOWN_ERROR';
  /** Detailed place information */
  result?: {
    place_id: string;
    name: string;
    formatted_address: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
    url?: string;
    rating?: number;
    user_ratings_total?: number;
    price_level?: number;
    business_status?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';
    types?: string[];
    geometry: {
      location: { lat: number; lng: number };
      viewport?: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
    opening_hours?: {
      open_now?: boolean;
      periods?: Array<{
        open: { day: number; time: string };
        close?: { day: number; time: string };
      }>;
      weekday_text?: string[];
    };
    photos?: Array<{
      photo_reference: string;
      height: number;
      width: number;
      html_attributions: string[];
    }>;
    reviews?: Array<{
      author_name: string;
      author_url?: string;
      language: string;
      profile_photo_url?: string;
      rating: number;
      relative_time_description: string;
      text: string;
      time: number;
    }>;
    address_components?: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    vicinity?: string;
    utc_offset?: number;
    icon?: string;
    icon_background_color?: string;
  };
  /** Error message if status is not OK */
  error_message?: string;
  /** HTML attributions required by Google */
  html_attributions?: string[];
}

// ============================================================================
// Brazilian API Types (BrasilAPI, ReceitaWS, RDAP)
// ============================================================================

/**
 * CNAE (Classificação Nacional de Atividades Econômicas) information
 */
export interface CNAE {
  /** CNAE code */
  codigo: string;
  /** CNAE description */
  descricao: string;
}

/**
 * QSA (Quadro de Sócios e Administradores) member information
 */
export interface QSA {
  /** Member name */
  nome: string;
  /** Member qualification/role */
  qualificacao?: string;
  /** Entry date */
  data_entrada?: string;
  /** CPF (masked) */
  cpf?: string;
  /** Representative name */
  nome_representante?: string;
  /** Representative qualification */
  qualificacao_representante?: string;
}

/**
 * BrasilAPI CNPJ response
 * Used in: src/lib/dd/providers.server.ts
 * API: https://brasilapi.com.br/api/cnpj/v1/{cnpj}
 */
export interface BrasilAPIResponse {
  /** CNPJ number */
  cnpj: string;
  /** Company legal name (razão social) */
  razao_social: string;
  /** Trade name (nome fantasia) */
  nome_fantasia?: string;
  /** Primary CNAE */
  cnae_fiscal: string;
  /** Primary CNAE description */
  cnae_fiscal_descricao?: string;
  /** Secondary CNAEs */
  cnaes_secundarios?: CNAE[];
  /** Legal nature code */
  natureza_juridica?: string;
  /** Legal nature description */
  descricao_natureza_juridica?: string;
  /** Registration status */
  situacao_cadastral?: string;
  /** Registration status date */
  data_situacao_cadastral?: string;
  /** Registration status reason */
  motivo_situacao_cadastral?: string;
  /** Company start date */
  data_inicio_atividade?: string;
  /** Company size (ME, EPP, etc.) */
  porte?: string;
  /** Street address */
  logradouro?: string;
  /** Address number */
  numero?: string;
  /** Address complement */
  complemento?: string;
  /** Neighborhood */
  bairro?: string;
  /** City */
  municipio?: string;
  /** State (UF) */
  uf?: string;
  /** Postal code (CEP) */
  cep?: string;
  /** Phone number (DDD + number) */
  ddd_telefone_1?: string;
  /** Secondary phone */
  ddd_telefone_2?: string;
  /** Email */
  email?: string;
  /** Partners and administrators */
  qsa?: QSA[];
  /** Share capital */
  capital_social?: number;
}

/**
 * ReceitaWS CNPJ response
 * Alternative API for CNPJ data
 * API: https://www.receitaws.com.br/v1/cnpj/{cnpj}
 */
export interface ReceitaWSResponse {
  /** CNPJ number */
  cnpj: string;
  /** Company legal name */
  nome: string;
  /** Trade name */
  fantasia?: string;
  /** Registration status */
  situacao: string;
  /** Registration type */
  tipo: string;
  /** Opening date */
  abertura: string;
  /** Legal nature */
  natureza_juridica: string;
  /** Street address */
  logradouro?: string;
  /** Address number */
  numero?: string;
  /** Address complement */
  complemento?: string;
  /** Neighborhood */
  bairro?: string;
  /** City */
  municipio?: string;
  /** State */
  uf?: string;
  /** Postal code */
  cep?: string;
  /** Email */
  email?: string;
  /** Phone */
  telefone?: string;
  /** Primary activity */
  atividade_principal?: Array<{
    code: string;
    text: string;
  }>;
  /** Secondary activities */
  atividades_secundarias?: Array<{
    code: string;
    text: string;
  }>;
  /** Partners and administrators */
  qsa?: Array<{
    nome: string;
    qual?: string;
  }>;
  /** Share capital */
  capital_social?: string;
  /** Last update date */
  ultima_atualizacao?: string;
  /** Status */
  status?: string;
  /** Error message if request failed */
  message?: string;
}

/**
 * RDAP (Registration Data Access Protocol) response
 * Used for domain registration information
 * API: https://rdap.registro.br/domain/{domain}
 */
export interface RDAPResponse {
  /** Object class name */
  objectClassName?: string;
  /** Domain name */
  ldhName?: string;
  /** Domain handle/ID */
  handle?: string;
  /** Status array */
  status?: string[];
  /** Entities (registrant, admin, tech contacts) */
  entities?: Array<{
    objectClassName?: string;
    handle?: string;
    roles?: string[];
    vcardArray?: Array<string | Array<string | Record<string, string>>>;
    publicIds?: Array<{
      type: string;
      identifier: string;
    }>;
  }>;
  /** Events (registration, expiration, etc.) */
  events?: Array<{
    eventAction: string;
    eventDate: string;
  }>;
  /** Nameservers */
  nameservers?: Array<{
    objectClassName?: string;
    ldhName?: string;
  }>;
  /** Links */
  links?: Array<{
    value?: string;
    rel?: string;
    href?: string;
    type?: string;
  }>;
  /** Port 43 WHOIS server */
  port43?: string;
  /** Notices */
  notices?: Array<{
    title?: string;
    description?: string[];
    links?: Array<{
      value?: string;
      rel?: string;
      href?: string;
      type?: string;
    }>;
  }>;
}

// ============================================================================
// PageSpeed API Types
// ============================================================================

/**
 * Google PageSpeed Insights API response
 * Used in: src/lib/pagespeed.functions.ts
 * API: https://www.googleapis.com/pagespeedonline/v5/runPagespeed
 */
export interface PageSpeedResponse {
  /** Analysis URL */
  id: string;
  /** Lighthouse result */
  lighthouseResult: {
    /** Requested URL */
    requestedUrl: string;
    /** Final URL after redirects */
    finalUrl: string;
    /** Lighthouse version */
    lighthouseVersion: string;
    /** User agent string */
    userAgent: string;
    /** Fetch time */
    fetchTime: string;
    /** Environment information */
    environment: {
      networkUserAgent: string;
      hostUserAgent: string;
      benchmarkIndex: number;
    };
    /** Run warnings */
    runWarnings?: string[];
    /** Configuration settings */
    configSettings: {
      emulatedFormFactor: 'mobile' | 'desktop';
      locale: string;
      onlyCategories?: string[];
    };
    /** Audit results */
    audits: Record<string, {
      id: string;
      title: string;
      description: string;
      score: number | null;
      scoreDisplayMode: 'binary' | 'numeric' | 'informative' | 'notApplicable' | 'error';
      displayValue?: string;
      explanation?: string;
      errorMessage?: string;
      warnings?: string[];
      details?: Record<string, unknown>;
    }>;
    /** Category scores */
    categories: {
      performance?: {
        id: string;
        title: string;
        score: number | null;
        auditRefs: Array<{
          id: string;
          weight: number;
          group?: string;
        }>;
      };
      accessibility?: {
        id: string;
        title: string;
        score: number | null;
        auditRefs: Array<{
          id: string;
          weight: number;
          group?: string;
        }>;
      };
      'best-practices'?: {
        id: string;
        title: string;
        score: number | null;
        auditRefs: Array<{
          id: string;
          weight: number;
          group?: string;
        }>;
      };
      seo?: {
        id: string;
        title: string;
        score: number | null;
        auditRefs: Array<{
          id: string;
          weight: number;
          group?: string;
        }>;
      };
      pwa?: {
        id: string;
        title: string;
        score: number | null;
        auditRefs: Array<{
          id: string;
          weight: number;
          group?: string;
        }>;
      };
    };
    /** Category groups */
    categoryGroups?: Record<string, {
      title: string;
      description?: string;
    }>;
    /** Timing information */
    timing: {
      total: number;
    };
    /** i18n information */
    i18n?: {
      rendererFormattedStrings: Record<string, string>;
    };
  };
  /** Loading experience data */
  loadingExperience?: {
    id: string;
    metrics: Record<string, {
      percentile: number;
      distributions: Array<{
        min: number;
        max?: number;
        proportion: number;
      }>;
      category: 'FAST' | 'AVERAGE' | 'SLOW';
    }>;
    overall_category: 'FAST' | 'AVERAGE' | 'SLOW';
    initial_url: string;
  };
  /** Origin loading experience */
  originLoadingExperience?: {
    id: string;
    metrics: Record<string, {
      percentile: number;
      distributions: Array<{
        min: number;
        max?: number;
        proportion: number;
      }>;
      category: 'FAST' | 'AVERAGE' | 'SLOW';
    }>;
    overall_category: 'FAST' | 'AVERAGE' | 'SLOW';
    initial_url: string;
  };
  /** Analysis UTC timestamp */
  analysisUTCTimestamp: string;
  /** Captcha result (if applicable) */
  captchaResult?: string;
  /** Kind (API resource type) */
  kind?: string;
}

// ============================================================================
// Lovable AI API Types
// ============================================================================

/**
 * Lovable AI synthesis response
 * Used in: src/lib/market-research-server/providers/lovableAi.provider.ts
 */
export interface LovableAIResponse {
  /** Success status */
  ok: boolean;
  /** AI-generated synthesis text */
  synthesis?: string;
  /** Confidence level of the synthesis */
  confidence?: 'high' | 'medium' | 'low';
  /** Sources used for synthesis */
  sources?: Array<{
    name: string;
    url?: string;
    relevance?: number;
  }>;
  /** Error message if request failed */
  error?: string;
  /** Additional metadata */
  metadata?: {
    model?: string;
    tokens?: number;
    processingTimeMs?: number;
  };
}
