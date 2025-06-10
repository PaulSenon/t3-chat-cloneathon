"use client";

import React, { Component, ReactNode } from "react";
import { AlertCircle, RefreshCw, MessageCircle, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

// Main Error Boundary Component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Report to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      // Integration point for error reporting service
      this.reportError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange) {
      if (resetKeys) {
        const hasResetKeyChanged = resetKeys.some(
          (key, index) => prevProps.resetKeys?.[index] !== key
        );
        if (hasResetKeyChanged) {
          this.resetError();
        }
      }
    }
  }

  componentWillUnmount() {
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Integration point for error reporting services like Sentry
    console.error("Reporting error to monitoring service:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  };

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    });
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn("Max retries exceeded");
      return;
    }

    this.setState({ isRetrying: true });

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);

    const timeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
      }));
    }, delay);

    this.retryTimeouts.push(timeout);
  };

  render() {
    const { hasError, error, isRetrying } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorFallback
          error={error}
          onRetry={this.handleRetry}
          isRetrying={isRetrying}
        />
      );
    }

    return children;
  }
}

// Chat-specific Error Boundary
export function ChatErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      maxRetries={3}
      resetOnPropsChange={true}
      onError={(error, errorInfo) => {
        console.error("Chat Error:", error.message);
        // Track chat-specific errors
        if (error.message.includes("fetch")) {
          console.error("Network error in chat");
        }
      }}
      fallback={<ChatErrorFallback />}
    >
      {children}
    </ErrorBoundary>
  );
}

// Streaming Error Boundary for AI responses
export function StreamingErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      maxRetries={2}
      onError={(error) => {
        console.error("Streaming Error:", error.message);
        // Track streaming-specific errors
      }}
      fallback={<StreamingErrorFallback />}
    >
      {children}
    </ErrorBoundary>
  );
}

// Generic Error Fallback UI
interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
  isRetrying: boolean;
}

function ErrorFallback({ error, onRetry, isRetrying }: ErrorFallbackProps) {
  const isNetworkError = error?.message.includes("fetch") || error?.message.includes("network");

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="flex items-center justify-center w-16 h-16 mb-4 bg-red-100 dark:bg-red-900 rounded-full">
        {isNetworkError ? (
          <WifiOff className="w-8 h-8 text-red-600 dark:text-red-400" />
        ) : (
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        )}
      </div>
      
      <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {isNetworkError ? "Connection Error" : "Something went wrong"}
      </h2>
      
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 max-w-md">
        {isNetworkError
          ? "Unable to connect to the server. Please check your internet connection."
          : error?.message || "An unexpected error occurred. Please try again."
        }
      </p>
      
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className={cn(
          "flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
          isRetrying && "animate-pulse"
        )}
      >
        <RefreshCw className={cn("w-4 h-4 mr-2", isRetrying && "animate-spin")} />
        {isRetrying ? "Retrying..." : "Try Again"}
      </button>
    </div>
  );
}

// Chat-specific Error Fallback
function ChatErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="flex items-center justify-center w-12 h-12 mb-4 bg-orange-100 dark:bg-orange-900 rounded-full">
        <MessageCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
      </div>
      
      <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
        Chat Temporarily Unavailable
      </h3>
      
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        We&apos;re having trouble loading your chat. This usually resolves quickly.
      </p>
      
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      >
        Refresh Chat
      </button>
    </div>
  );
}

// Streaming-specific Error Fallback
function StreamingErrorFallback() {
  return (
    <div className="flex items-center p-3 mb-2 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-md">
      <AlertCircle className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          Message failed to stream
        </p>
        <p className="text-xs text-yellow-700 dark:text-yellow-300">
          The AI response was interrupted. Please try sending your message again.
        </p>
      </div>
    </div>
  );
}

// Network Status Error Boundary
export function NetworkErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      maxRetries={5}
      onError={(error) => {
        if (error.message.includes("fetch")) {
          console.error("Network error detected");
        }
      }}
      fallback={<NetworkErrorFallback />}
    >
      {children}
    </ErrorBoundary>
  );
}

function NetworkErrorFallback() {
  return (
    <div className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-md">
      <WifiOff className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
      <div>
        <p className="text-sm font-medium text-red-800 dark:text-red-200">
          Connection Lost
        </p>
        <p className="text-xs text-red-700 dark:text-red-300">
          Reconnecting automatically...
        </p>
      </div>
    </div>
  );
}

// Hook for programmatic error handling
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error("Manual error report:", error, errorInfo);
    
    // Report to monitoring service
    if (process.env.NODE_ENV === "production") {
      // Integration point for error reporting
    }
  };
}