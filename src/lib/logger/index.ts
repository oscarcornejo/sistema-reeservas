/**
 * @fileoverview Logger estructurado con salida JSON Lines.
 * Compatible con Vercel Log Dashboard. Zero dependencias externas.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
    userId?: string;
    email?: string;
    ip?: string;
    action?: string;
    resourceId?: string;
    resourceType?: string;
    metadata?: Record<string, unknown>;
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    category: string;
    message: string;
    context?: LogContext;
    error?: {
        message: string;
        stack?: string;
    };
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (IS_PRODUCTION ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

function formatError(err: unknown): { message: string; stack?: string } | undefined {
    if (!err) return undefined;
    if (err instanceof Error) {
        return { message: err.message, stack: err.stack };
    }
    return { message: String(err) };
}

function emit(entry: LogEntry) {
    const output = JSON.stringify(entry);

    switch (entry.level) {
        case 'error':
            console.error(output);
            break;
        case 'warn':
            console.warn(output);
            break;
        case 'debug':
            console.debug(output);
            break;
        default:
            console.log(output);
    }
}

export interface CategoryLogger {
    debug: (message: string, context?: LogContext) => void;
    info: (message: string, context?: LogContext) => void;
    warn: (message: string, context?: LogContext) => void;
    error: (message: string, errorOrContext?: unknown, context?: LogContext) => void;
}

/**
 * Crea un logger con categoría fija para agrupar logs relacionados.
 */
export function createCategoryLogger(category: string): CategoryLogger {
    function log(level: LogLevel, message: string, context?: LogContext, err?: unknown) {
        if (!shouldLog(level)) return;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            category,
            message,
        };

        if (context && Object.keys(context).length > 0) {
            entry.context = context;
        }

        const errorInfo = formatError(err);
        if (errorInfo) {
            entry.error = errorInfo;
        }

        emit(entry);
    }

    return {
        debug: (message, context?) => log('debug', message, context),
        info: (message, context?) => log('info', message, context),
        warn: (message, context?) => log('warn', message, context),
        error: (message, errorOrContext?, context?) => {
            // Si el segundo argumento parece un LogContext (tiene keys conocidas), tratarlo como contexto
            if (
                errorOrContext &&
                typeof errorOrContext === 'object' &&
                !(errorOrContext instanceof Error) &&
                ('userId' in errorOrContext || 'email' in errorOrContext || 'ip' in errorOrContext || 'action' in errorOrContext)
            ) {
                log('error', message, errorOrContext as LogContext);
            } else {
                log('error', message, context, errorOrContext);
            }
        },
    };
}

/** Logger de autenticación */
export const authLogger = createCategoryLogger('auth');
/** Logger de seguridad (rate limiting, firmas, etc.) */
export const securityLogger = createCategoryLogger('security');
/** Logger de auditoría */
export const auditLogger = createCategoryLogger('audit');
/** Logger general de la aplicación */
export const appLogger = createCategoryLogger('app');
/** Logger de pagos */
export const paymentLogger = createCategoryLogger('payment');
