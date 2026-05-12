/**
 * User-Friendly Error Messages
 * 
 * Maps technical error codes to user-friendly messages in Portuguese.
 * Provides actionable suggestions for error recovery.
 * 
 * Task 15.3 - Phase 3: Code Quality
 * 
 * @module lib/error-messages
 */

export type ErrorCode =
  // Authentication Errors
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_EMAIL_NOT_VERIFIED'
  
  // Network Errors
  | 'NETWORK_TIMEOUT'
  | 'NETWORK_OFFLINE'
  | 'NETWORK_SERVER_ERROR'
  | 'NETWORK_RATE_LIMIT'
  
  // Data Errors
  | 'DATA_NOT_FOUND'
  | 'DATA_VALIDATION_ERROR'
  | 'DATA_DUPLICATE'
  | 'DATA_CONFLICT'
  
  // API Errors
  | 'API_GOOGLE_PLACES_ERROR'
  | 'API_BRASIL_API_ERROR'
  | 'API_QUOTA_EXCEEDED'
  | 'API_INVALID_RESPONSE'
  
  // Import Errors
  | 'IMPORT_INVALID_FORMAT'
  | 'IMPORT_EMPTY_FILE'
  | 'IMPORT_TOO_LARGE'
  | 'IMPORT_PROCESSING_ERROR'
  
  // Lead Errors
  | 'LEAD_CREATION_FAILED'
  | 'LEAD_UPDATE_FAILED'
  | 'LEAD_DELETE_FAILED'
  | 'LEAD_INVALID_DATA'
  
  // Job Errors
  | 'JOB_CREATION_FAILED'
  | 'JOB_EXECUTION_FAILED'
  | 'JOB_TIMEOUT'
  | 'JOB_CANCELLED'
  
  // Generic Errors
  | 'UNKNOWN_ERROR'
  | 'PERMISSION_DENIED'
  | 'FEATURE_NOT_AVAILABLE';

export interface ErrorMessage {
  /** User-friendly title */
  title: string;
  /** Detailed message explaining what happened */
  message: string;
  /** Actionable suggestions for recovery */
  suggestions: string[];
  /** Whether this error is recoverable */
  recoverable: boolean;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Error message mappings
 */
export const ERROR_MESSAGES: Record<ErrorCode, ErrorMessage> = {
  // ============================================================================
  // Authentication Errors
  // ============================================================================
  
  AUTH_INVALID_CREDENTIALS: {
    title: 'Credenciais Inválidas',
    message: 'O email ou senha informados estão incorretos.',
    suggestions: [
      'Verifique se digitou o email corretamente',
      'Certifique-se de que a senha está correta',
      'Tente recuperar sua senha se esqueceu',
    ],
    recoverable: true,
    severity: 'medium',
  },
  
  AUTH_SESSION_EXPIRED: {
    title: 'Sessão Expirada',
    message: 'Sua sessão expirou por inatividade. Por favor, faça login novamente.',
    suggestions: [
      'Clique em "Fazer Login" para entrar novamente',
      'Seus dados foram salvos e estarão disponíveis após o login',
    ],
    recoverable: true,
    severity: 'medium',
  },
  
  AUTH_UNAUTHORIZED: {
    title: 'Acesso Não Autorizado',
    message: 'Você não tem permissão para acessar este recurso.',
    suggestions: [
      'Verifique se está logado com a conta correta',
      'Entre em contato com o administrador se precisar de acesso',
    ],
    recoverable: false,
    severity: 'high',
  },
  
  AUTH_EMAIL_NOT_VERIFIED: {
    title: 'Email Não Verificado',
    message: 'Você precisa verificar seu email antes de continuar.',
    suggestions: [
      'Verifique sua caixa de entrada',
      'Clique no link de verificação enviado por email',
      'Solicite um novo email de verificação se não recebeu',
    ],
    recoverable: true,
    severity: 'medium',
  },
  
  // ============================================================================
  // Network Errors
  // ============================================================================
  
  NETWORK_TIMEOUT: {
    title: 'Tempo Esgotado',
    message: 'A operação demorou muito tempo e foi cancelada.',
    suggestions: [
      'Verifique sua conexão com a internet',
      'Tente novamente em alguns instantes',
      'Se o problema persistir, entre em contato com o suporte',
    ],
    recoverable: true,
    severity: 'medium',
  },
  
  NETWORK_OFFLINE: {
    title: 'Sem Conexão',
    message: 'Você está offline. Verifique sua conexão com a internet.',
    suggestions: [
      'Verifique se o Wi-Fi ou dados móveis estão ativos',
      'Tente recarregar a página quando a conexão for restabelecida',
    ],
    recoverable: true,
    severity: 'high',
  },
  
  NETWORK_SERVER_ERROR: {
    title: 'Erro no Servidor',
    message: 'Ocorreu um erro no servidor. Nossa equipe foi notificada.',
    suggestions: [
      'Tente novamente em alguns minutos',
      'Se o problema persistir, entre em contato com o suporte',
    ],
    recoverable: true,
    severity: 'high',
  },
  
  NETWORK_RATE_LIMIT: {
    title: 'Muitas Requisições',
    message: 'Você fez muitas requisições em pouco tempo. Aguarde um momento.',
    suggestions: [
      'Aguarde alguns minutos antes de tentar novamente',
      'Evite clicar múltiplas vezes no mesmo botão',
    ],
    recoverable: true,
    severity: 'low',
  },
  
  // ============================================================================
  // Data Errors
  // ============================================================================
  
  DATA_NOT_FOUND: {
    title: 'Não Encontrado',
    message: 'O recurso solicitado não foi encontrado.',
    suggestions: [
      'Verifique se o link está correto',
      'O item pode ter sido removido',
      'Volte para a página anterior e tente novamente',
    ],
    recoverable: false,
    severity: 'medium',
  },
  
  DATA_VALIDATION_ERROR: {
    title: 'Dados Inválidos',
    message: 'Alguns campos contêm informações inválidas.',
    suggestions: [
      'Verifique os campos destacados em vermelho',
      'Certifique-se de preencher todos os campos obrigatórios',
      'Verifique o formato dos dados (email, telefone, etc.)',
    ],
    recoverable: true,
    severity: 'low',
  },
  
  DATA_DUPLICATE: {
    title: 'Registro Duplicado',
    message: 'Já existe um registro com essas informações.',
    suggestions: [
      'Verifique se o lead já foi cadastrado',
      'Use a busca para encontrar o registro existente',
      'Atualize o registro existente em vez de criar um novo',
    ],
    recoverable: true,
    severity: 'low',
  },
  
  DATA_CONFLICT: {
    title: 'Conflito de Dados',
    message: 'Os dados foram modificados por outro usuário.',
    suggestions: [
      'Recarregue a página para ver as alterações mais recentes',
      'Tente fazer suas alterações novamente',
    ],
    recoverable: true,
    severity: 'medium',
  },
  
  // ============================================================================
  // API Errors
  // ============================================================================
  
  API_GOOGLE_PLACES_ERROR: {
    title: 'Erro na Busca',
    message: 'Não foi possível buscar empresas no Google Places.',
    suggestions: [
      'Verifique se os termos de busca estão corretos',
      'Tente uma busca mais específica',
      'Aguarde alguns minutos e tente novamente',
    ],
    recoverable: true,
    severity: 'medium',
  },
  
  API_BRASIL_API_ERROR: {
    title: 'Erro na Validação',
    message: 'Não foi possível validar o CNPJ.',
    suggestions: [
      'Verifique se o CNPJ está correto',
      'Tente novamente em alguns instantes',
      'Prossiga sem validação se necessário',
    ],
    recoverable: true,
    severity: 'low',
  },
  
  API_QUOTA_EXCEEDED: {
    title: 'Limite Excedido',
    message: 'Você atingiu o limite de requisições para hoje.',
    suggestions: [
      'Aguarde até amanhã para fazer novas buscas',
      'Entre em contato para aumentar seu limite',
      'Use a importação manual de leads',
    ],
    recoverable: false,
    severity: 'high',
  },
  
  API_INVALID_RESPONSE: {
    title: 'Resposta Inválida',
    message: 'A API retornou uma resposta inesperada.',
    suggestions: [
      'Tente novamente em alguns instantes',
      'Se o problema persistir, entre em contato com o suporte',
    ],
    recoverable: true,
    severity: 'medium',
  },
  
  // ============================================================================
  // Import Errors
  // ============================================================================
  
  IMPORT_INVALID_FORMAT: {
    title: 'Formato Inválido',
    message: 'O arquivo não está no formato esperado.',
    suggestions: [
      'Certifique-se de que o arquivo é um CSV válido',
      'Verifique se as colunas estão corretas',
      'Baixe o template de exemplo e use-o como referência',
    ],
    recoverable: true,
    severity: 'medium',
  },
  
  IMPORT_EMPTY_FILE: {
    title: 'Arquivo Vazio',
    message: 'O arquivo não contém dados para importar.',
    suggestions: [
      'Verifique se o arquivo contém linhas de dados',
      'Certifique-se de que não está enviando apenas o cabeçalho',
    ],
    recoverable: true,
    severity: 'low',
  },
  
  IMPORT_TOO_LARGE: {
    title: 'Arquivo Muito Grande',
    message: 'O arquivo excede o tamanho máximo permitido.',
    suggestions: [
      'Divida o arquivo em partes menores',
      'O limite é de 1000 leads por importação',
      'Remova colunas desnecessárias para reduzir o tamanho',
    ],
    recoverable: true,
    severity: 'medium',
  },
  
  IMPORT_PROCESSING_ERROR: {
    title: 'Erro no Processamento',
    message: 'Ocorreu um erro ao processar o arquivo.',
    suggestions: [
      'Verifique se o arquivo não está corrompido',
      'Tente exportar novamente do Excel/Google Sheets',
      'Entre em contato com o suporte se o problema persistir',
    ],
    recoverable: true,
    severity: 'high',
  },
  
  // ============================================================================
  // Lead Errors
  // ============================================================================
  
  LEAD_CREATION_FAILED: {
    title: 'Erro ao Criar Lead',
    message: 'Não foi possível criar o lead.',
    suggestions: [
      'Verifique se todos os campos obrigatórios estão preenchidos',
      'Tente novamente em alguns instantes',
      'Entre em contato com o suporte se o problema persistir',
    ],
    recoverable: true,
    severity: 'high',
  },
  
  LEAD_UPDATE_FAILED: {
    title: 'Erro ao Atualizar Lead',
    message: 'Não foi possível salvar as alterações.',
    suggestions: [
      'Verifique sua conexão com a internet',
      'Tente novamente em alguns instantes',
      'Recarregue a página e tente novamente',
    ],
    recoverable: true,
    severity: 'medium',
  },
  
  LEAD_DELETE_FAILED: {
    title: 'Erro ao Excluir Lead',
    message: 'Não foi possível excluir o lead.',
    suggestions: [
      'Verifique se você tem permissão para excluir',
      'Tente novamente em alguns instantes',
      'Entre em contato com o suporte se o problema persistir',
    ],
    recoverable: true,
    severity: 'medium',
  },
  
  LEAD_INVALID_DATA: {
    title: 'Dados Inválidos',
    message: 'Os dados do lead contêm informações inválidas.',
    suggestions: [
      'Verifique o formato do email',
      'Verifique o formato do telefone/WhatsApp',
      'Certifique-se de que todos os campos obrigatórios estão preenchidos',
    ],
    recoverable: true,
    severity: 'low',
  },
  
  // ============================================================================
  // Job Errors
  // ============================================================================
  
  JOB_CREATION_FAILED: {
    title: 'Erro ao Criar Tarefa',
    message: 'Não foi possível iniciar o processamento em background.',
    suggestions: [
      'Tente novamente em alguns instantes',
      'Verifique se não há outras tarefas em execução',
      'Entre em contato com o suporte se o problema persistir',
    ],
    recoverable: true,
    severity: 'medium',
  },
  
  JOB_EXECUTION_FAILED: {
    title: 'Erro no Processamento',
    message: 'A tarefa em background falhou durante a execução.',
    suggestions: [
      'Verifique os logs para mais detalhes',
      'Tente executar a tarefa novamente',
      'Entre em contato com o suporte se o problema persistir',
    ],
    recoverable: true,
    severity: 'high',
  },
  
  JOB_TIMEOUT: {
    title: 'Tempo Esgotado',
    message: 'A tarefa demorou muito tempo e foi cancelada.',
    suggestions: [
      'Tente processar menos itens por vez',
      'Aguarde alguns minutos e tente novamente',
      'Entre em contato com o suporte se o problema persistir',
    ],
    recoverable: true,
    severity: 'medium',
  },
  
  JOB_CANCELLED: {
    title: 'Tarefa Cancelada',
    message: 'A tarefa foi cancelada pelo usuário ou sistema.',
    suggestions: [
      'Inicie uma nova tarefa se necessário',
      'Verifique se os dados parciais foram salvos',
    ],
    recoverable: true,
    severity: 'low',
  },
  
  // ============================================================================
  // Generic Errors
  // ============================================================================
  
  UNKNOWN_ERROR: {
    title: 'Erro Inesperado',
    message: 'Ocorreu um erro inesperado. Nossa equipe foi notificada.',
    suggestions: [
      'Tente recarregar a página',
      'Verifique sua conexão com a internet',
      'Entre em contato com o suporte se o problema persistir',
    ],
    recoverable: true,
    severity: 'high',
  },
  
  PERMISSION_DENIED: {
    title: 'Permissão Negada',
    message: 'Você não tem permissão para realizar esta ação.',
    suggestions: [
      'Verifique se está logado com a conta correta',
      'Entre em contato com o administrador para solicitar permissão',
    ],
    recoverable: false,
    severity: 'high',
  },
  
  FEATURE_NOT_AVAILABLE: {
    title: 'Recurso Indisponível',
    message: 'Este recurso não está disponível no seu plano atual.',
    suggestions: [
      'Faça upgrade do seu plano para acessar este recurso',
      'Entre em contato com o suporte para mais informações',
    ],
    recoverable: false,
    severity: 'medium',
  },
};

/**
 * Get user-friendly error message
 */
export function getErrorMessage(code: ErrorCode): ErrorMessage {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Format error for display
 */
export function formatError(code: ErrorCode, technicalDetails?: string): {
  title: string;
  message: string;
  suggestions: string[];
  technicalDetails?: string;
  recoverable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
} {
  const errorMessage = getErrorMessage(code);
  
  return {
    ...errorMessage,
    technicalDetails,
  };
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(code: ErrorCode): boolean {
  return getErrorMessage(code).recoverable;
}

/**
 * Get error severity
 */
export function getErrorSeverity(code: ErrorCode): 'low' | 'medium' | 'high' | 'critical' {
  return getErrorMessage(code).severity;
}
