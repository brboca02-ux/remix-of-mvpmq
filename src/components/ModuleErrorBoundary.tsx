/**
 * Module-Specific Error Boundaries
 * 
 * Specialized error boundaries for different modules with custom fallback UIs.
 * 
 * @module components/ModuleErrorBoundary
 */

import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorBoundary } from './ErrorBoundary';

interface ModuleErrorFallbackProps {
  moduleName: string;
  error?: Error;
  onReset?: () => void;
  onGoBack?: () => void;
}

/**
 * Generic Module Error Fallback UI
 */
function ModuleErrorFallback({ moduleName, error, onReset, onGoBack }: ModuleErrorFallbackProps): JSX.Element {
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <CardTitle>Erro no módulo {moduleName}</CardTitle>
              <CardDescription>
                Não foi possível carregar este módulo. Tente novamente ou volte para a página anterior.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {error && (
          <CardContent>
            <div className="p-3 bg-gray-100 rounded-md">
              <p className="text-sm text-gray-600">{error.message}</p>
            </div>
          </CardContent>
        )}

        <CardContent className="flex gap-3">
          {onReset && (
            <Button onClick={onReset} variant="default" size="sm" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
          {onGoBack && (
            <Button onClick={onGoBack} variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Prospecting Module Error Boundary
 */
export function ProspectingErrorBoundary({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ErrorBoundary
      fallback={
        <ModuleErrorFallback
          moduleName="Prospecção"
          onReset={() => window.location.reload()}
          onGoBack={() => window.history.back()}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * CRM Module Error Boundary
 */
export function CRMErrorBoundary({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ErrorBoundary
      fallback={
        <ModuleErrorFallback
          moduleName="CRM"
          onReset={() => window.location.reload()}
          onGoBack={() => window.history.back()}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Market Research Module Error Boundary
 */
export function MarketResearchErrorBoundary({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ErrorBoundary
      fallback={
        <ModuleErrorFallback
          moduleName="Pesquisa de Mercado"
          onReset={() => window.location.reload()}
          onGoBack={() => window.history.back()}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Services Module Error Boundary
 */
export function ServicesErrorBoundary({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ErrorBoundary
      fallback={
        <ModuleErrorFallback
          moduleName="Serviços"
          onReset={() => window.location.reload()}
          onGoBack={() => window.history.back()}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Data Loading Error Boundary
 * For components that load data from APIs
 */
export function DataLoadingErrorBoundary({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center p-8">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Erro ao carregar dados
              </CardTitle>
              <CardDescription>
                Não foi possível carregar os dados. Verifique sua conexão e tente novamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Form Error Boundary
 * For form components with specific error handling
 */
export function FormErrorBoundary({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border border-destructive rounded-md bg-destructive/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Erro no formulário</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ocorreu um erro ao processar o formulário. Por favor, recarregue a página e tente novamente.
              </p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Recarregar Página
              </Button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
