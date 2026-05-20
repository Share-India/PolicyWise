import { createClient } from '@/lib/supabase/server';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
export type LogSource = 'CLIENT' | 'SERVER' | 'API' | 'AUTH' | 'DB';

interface LogEntry {
    level: LogLevel;
    source: LogSource;
    message: string;
    metadata?: Record<string, any>;
    userId?: string;
}

/**
 * Log an event to the persistent logs table in Supabase.
 * Use this for critical errors, audit trails, and debugging info.
 */
export async function logEvent(entry: LogEntry) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('logs')
            .insert({
                level: entry.level,
                source: entry.source,
                message: entry.message,
                metadata: entry.metadata || {},
                user_id: entry.userId || null,
            });

        if (error) {
            console.error('Failed to write log to database:', error);
            // Fallback to console log if DB write fails
            console.error('Original Log Entry:', entry);
        }
    } catch (err) {
        console.error('Exception writing log to database:', err);
        console.error('Original Log Entry:', entry);
    }
}
