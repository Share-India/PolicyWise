import { NextRequest, NextResponse } from 'next/server';
import { logEvent, LogLevel, LogSource } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { level, source, message, metadata } = body;

        // Basic validation
        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const validLevels: LogLevel[] = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
        const logLevel: LogLevel = validLevels.includes(level) ? level : 'INFO';
        const logSource: LogSource = source || 'CLIENT';

        // Get user if authenticated
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        await logEvent({
            level: logLevel,
            source: logSource,
            message,
            metadata: metadata || {},
            userId: user?.id,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in log API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
