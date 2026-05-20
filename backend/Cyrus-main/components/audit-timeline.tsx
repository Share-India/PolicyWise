"use client";

import { motion } from "framer-motion";
import { 
    Activity, 
    CheckCircle2, 
    XCircle, 
    Zap, 
    FileText, 
    ShieldCheck, 
    User, 
    Search, 
    ShieldAlert
} from "lucide-react";
import { format } from "date-fns";

interface AuditEvent {
    id: string;
    event_type: string;
    description: string;
    created_at: string;
    payload?: any;
}

interface AuditTimelineProps {
    events: AuditEvent[];
    loading?: boolean;
}

export function AuditTimeline({ events, loading }: AuditTimelineProps) {
    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-slate-800/20 rounded-xl" />
                ))}
            </div>
        );
    }

    if (!events || events.length === 0) {
        return (
            <div className="py-10 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                <Activity className="h-8 w-8 text-slate-700 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No forensic history found</p>
            </div>
        );
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'ADMIN_DECISION': return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
            case 'AI_ANALYSIS': return <Zap className="h-4 w-4 text-amber-400" />;
            case 'USER_UPDATE': return <User className="h-4 w-4 text-blue-400" />;
            case 'DOCUMENT_UPLOAD': return <FileText className="h-4 w-4 text-indigo-400" />;
            case 'KILLER_FAILURE': return <ShieldAlert className="h-4 w-4 text-red-500" />;
            default: return <Search className="h-4 w-4 text-slate-400" />;
        }
    };

    return (
        <div className="relative space-y-6">
            {/* Vertical Line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-500/30 via-slate-800 to-transparent" />

            {events.map((event, idx) => (
                <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex gap-6 group"
                >
                    {/* Icon Container */}
                    <div className="relative z-10 shrink-0">
                        <div className={`
                            h-10 w-10 rounded-xl flex items-center justify-center 
                            bg-slate-900 border border-slate-800 shadow-xl
                            group-hover:border-slate-700 transition-colors
                        `}>
                            {getIcon(event.event_type)}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    {event.event_type.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[9px] font-bold text-slate-600">
                                    {format(new Date(event.created_at), "MMM d, HH:mm")}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-slate-200 leading-relaxed">
                                {event.description}
                            </p>
                            {event.payload?.note && (
                                <div className="mt-3 p-3 rounded-lg bg-indigo-500/5 border-l-2 border-indigo-500/30">
                                    <p className="text-[11px] text-slate-400 italic">"{event.payload.note}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
