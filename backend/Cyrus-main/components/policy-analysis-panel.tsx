"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle, Zap, Loader2, FileText, BarChart3, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface PolicyAnalysisPanelProps {
    documentId: string;
    fileName: string;
    initialStatus: "pending" | "processing" | "completed" | "failed";
    initialResult?: any;
    onStatusChange?: (status: string) => void;
}

export function PolicyAnalysisPanel({
    documentId,
    fileName,
    initialStatus,
    initialResult,
    onStatusChange
}: PolicyAnalysisPanelProps) {
    const [status, setStatus] = useState(initialStatus);
    const [result, setResult] = useState(initialResult);
    const [isTriggering, setIsTriggering] = useState(false);

    const handleAnalyze = async () => {
        setIsTriggering(true);
        setStatus("processing");
        onStatusChange?.("processing");

        try {
            const response = await fetch("/api/analyze-policy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Analysis failed to start");
            }

            toast.success("AI Analysis triggered successfully");
        } catch (error: any) {
            toast.error(error.message);
            setStatus("failed");
            onStatusChange?.("failed");
        } finally {
            setIsTriggering(false);
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case "processing": return <Loader2 className="h-5 w-5 animate-spin text-blue-400" />;
            case "completed": return <CheckCircle className="h-5 w-5 text-emerald-400" />;
            case "failed": return <AlertTriangle className="h-5 w-5 text-red-500" />;
            default: return <BarChart3 className="h-5 w-5 text-slate-400" />;
        }
    };

    return (
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-xl overflow-hidden">
            <CardHeader className="border-b border-slate-800/50 bg-slate-800/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-100 uppercase tracking-wider">AI Policy Analysis</CardTitle>
                            <CardDescription className="text-slate-400 text-xs">Deep forensics for: {fileName}</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`
                            px-3 py-1 text-[10px] font-bold uppercase tracking-tighter
                            ${status === 'completed' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 
                              status === 'processing' ? 'border-blue-500/30 bg-blue-500/10 text-blue-400 animate-pulse' : 
                              status === 'failed' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 
                              'border-slate-700 bg-slate-800 text-slate-400'}
                        `}>
                            {status}
                        </Badge>
                        {(status === 'pending' || status === 'failed') && (
                            <Button 
                                onClick={handleAnalyze} 
                                disabled={isTriggering}
                                size="sm"
                                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs px-4"
                            >
                                {isTriggering ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Zap className="h-3 w-3 mr-2" />}
                                RUN FORENSICS
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <AnimatePresence mode="wait">
                    {status === 'completed' && result ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Executive Summary */}
                            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                                <h4 className="text-indigo-400 flex items-center gap-2 font-bold text-xs uppercase mb-3">
                                    <FileText className="h-3 w-3" /> Executive Summary
                                </h4>
                                <p className="text-slate-300 text-sm leading-relaxed italic">"{result.executiveSummary}"</p>
                            </div>

                            {/* Controls Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <h4 className="text-emerald-400 flex items-center gap-2 font-bold text-xs uppercase mb-1">
                                        <CheckCircle className="h-3 w-3" /> Identified Controls
                                    </h4>
                                    <div className="space-y-2">
                                        {result.identifiedControls?.map((control: any, i: number) => (
                                            <div key={i} className="group p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-emerald-500/30 transition-colors">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-slate-200 text-sm font-medium">{control.name}</span>
                                                    <Badge className={control.status === 'Implemented' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}>
                                                        {control.status}
                                                    </Badge>
                                                </div>
                                                {control.details && <p className="text-slate-500 text-xs leading-tight group-hover:text-slate-400">{control.details}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-amber-400 flex items-center gap-2 font-bold text-xs uppercase mb-1">
                                        <AlertTriangle className="h-3 w-3" /> Maturity Gaps
                                    </h4>
                                    <div className="space-y-2">
                                        {result.maturityGaps?.map((gap: string, i: number) => (
                                            <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                                                <p className="text-slate-300 text-sm">{gap}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="space-y-3">
                                <h4 className="text-violet-400 flex items-center gap-2 font-bold text-xs uppercase">
                                    <Zap className="h-3 w-3" /> Risk Recommendations
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {result.recommendations?.map((rec: any, i: number) => (
                                        <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-indigo-500/5 to-violet-500/5 border border-indigo-500/10">
                                            <div className={`p-2 rounded-lg shrink-0 ${
                                                rec.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                                                rec.priority === 'High' ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-indigo-500/20 text-indigo-400'
                                            }`}>
                                                <Shield className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-slate-100 text-sm font-bold truncate">{rec.action}</span>
                                                    <Badge variant="outline" className="text-[9px] uppercase tracking-tighter">{rec.priority}</Badge>
                                                </div>
                                                <p className="text-slate-400 text-xs">{rec.impact}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : status === 'processing' ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-12 flex flex-col items-center justify-center space-y-4"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                                <Loader2 className="h-12 w-12 text-indigo-400 animate-spin relative" />
                            </div>
                            <div className="text-center">
                                <h5 className="text-slate-200 font-bold uppercase tracking-widest text-sm">AI Agent Analysis in Progress</h5>
                                <p className="text-slate-500 text-xs mt-1 italic">"Scanning for hidden risk vectors and control gaps..."</p>
                            </div>
                            <Progress value={45} className="w-64 h-1 bg-slate-800" />
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-12 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center opacity-60"
                        >
                            <FileText className="h-12 w-12 text-slate-700 mb-4" />
                            <h5 className="text-slate-400 font-bold uppercase text-xs">Awaiting Analysis Command</h5>
                            <p className="text-slate-600 text-[10px] mt-1 max-w-xs uppercase">Run the AI forensic sweep to extract security controls and maturity gaps from this policy document.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
