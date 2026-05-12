/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors in child component tree and displays fallback UI.
 * Prevents the entire app from crashing when errors occur.
 * 
 * Task 15.2 - Phase 3: Code Quality
 * 
 * @module components/ErrorBoundary
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';

interface ErrorBoundaryProps {
  /** Children to wrap with error boundary */
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Error handler callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Section name for error logging */
  section?: string;
  /** Whether to show reset button */
  showReset?: boolean;
  /** Whether to show home button */
  showHome?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * @example
 * ```tsx
 * <ErrorBoundary section="Dashboard">
 *   <Dashboard />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { section, onError } = this.props;

    // Log error with context
    logger.error(
      `Error caught in ErrorBoundary${section ? ` (${section})` : ''}`,
      error,
      {
        section,
        componentStack: errorInfo.componentStack,
      }
    );

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, showReset = true, showHome = true, section } = this.props;

    if (hasError && error) {
      // Custom fallback
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, this.handleReset);
        }
        return fallback;
      }

      // Default fallback UI
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="max-w-md w-full border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-destructive/10 p-2">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Ocorreu um Erro</CardTitle>
                  <CardDescription>
                    {section ? `Erro em: ${section}` : 'Algo deu errado'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium text-destructive mb-1">
                  {error.name || 'Erro'}
                </p>
                <p className="text-muted-foreground break-words">
                  {error.message || 'Erro desconhecido'}
                </p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Sugestões:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Tente recarregar a página</li>
                  <li>Verifique sua conexão com a internet</li>
                  <li>Se o problema persistir, entre em contato com o suporte</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                {showReset && (
                  <Button
                    onClick={this.handleReset}
                    variant="default"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                )}
                {showHome && (
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="flex-1"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Ir para Início
                  </Button>
                )}
              </div>

              {import.meta.env.DEV && error.stack && (
                <details className="mt-4">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    Detalhes técnicos (apenas em desenvolvimento)
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-48">
                    {error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * Higher-order component to wrap a component with ErrorBoundary
 * 
 * @example
 * ```tsx
 * const SafeDashboard = withErrorBoundary(Dashboard, { section: 'Dashboard' });
 * ```
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const WithErrorBoundary = (props: P): ReactNode => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithErrorBoundary;
}

/**
 * Simple minimal error fallback for inline use
 */
export function SimpleErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): ReactNode {
  return (
    <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Erro ao carregar</p>
          <p className="text-xs text-muted-foreground mt-1 break-words">
            {error.message || 'Erro desconhecido'}
          </p>
          <Button
            onClick={reset}
            variant="ghost"
            size="sm"
            className="mt-2 h-7 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Tentar novamente
          </Button>
        </div>
      </div>
    </div>
  );
}
