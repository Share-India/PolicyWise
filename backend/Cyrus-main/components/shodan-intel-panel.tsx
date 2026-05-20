"use client";

import { motion } from "framer-motion";
import { 
    Globe, 
    ShieldAlert, 
    ShieldCheck, 
    Cpu, 
    Network, 
    Lock, 
    ExternalLink, 
    AlertTriangle,
    Zap
} from "lucide-react";

interface ShodanIntel {
    assetCount: number;
    openPorts: { port: number; risk: 'critical' | 'warning' | 'standard' }[];
    vulnerabilities: string[];
    techStack: string[];
}

interface ShodanIntelPanelProps {
    intel: ShodanIntel;
    organizationName: string;
}

export function ShodanIntelPanel({ intel, organizationName }: ShodanIntelPanelProps) {
    if (!intel || (!intel.assetCount && intel.openPorts.length === 0)) {
        return (
            <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 text-center">
                <Globe className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Technical Footprint Detected</p>
                <p className="text-[10px] text-slate-300 mt-2 font-bold leading-relaxed px-4">
                    The external reconnaissance scan for {organizationName} returned zero exposed assets or open ports.
                </p>
            </div>
        );
    }

    const criticalPortsCount = intel.openPorts.filter(p => p.risk === 'critical').length;

    return (
        <div className="space-y-6">
            {/* Summary Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-si-navy text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Total Exposed Assets</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black font-outfit">{intel.assetCount}</span>
                            <Globe className="h-4 w-4 text-si-blue-primary" />
                        </div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Network className="h-24 w-24" />
                    </div>
                </div>

                <div className={`p-6 rounded-3xl relative overflow-hidden group ${criticalPortsCount > 0 ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
                    <div className="relative z-10">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Critical Port Exposures</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black font-outfit">{criticalPortsCount}</span>
                            {criticalPortsCount > 0 ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        </div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Lock className="h-24 w-24" />
                    </div>
                </div>
            </div>

            {/* Open Ports Visualizer */}
            <div className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm">
                <h4 className="text-[10px] font-black text-si-navy/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Network className="h-3 w-3" /> Technical Asset Footprint
                </h4>
                
                <div className="flex flex-wrap gap-3">
                    {intel.openPorts.map((p, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`
                                px-4 py-2 rounded-xl flex items-center gap-2 border shadow-sm transition-all cursor-default
                                ${p.risk === 'critical' ? "bg-si-red/10 border-si-red/20 text-si-red" : 
                                  p.risk === 'warning' ? "bg-amber-100 border-amber-200 text-amber-700" : 
                                  "bg-slate-50 border-slate-100 text-slate-500"}
                            `}
                        >
                            <span className="text-xs font-black font-mono">PORT {p.port}</span>
                            {p.risk === 'critical' && <Zap className="h-3 w-3 animate-pulse" />}
                        </motion.div>
                    ))}
                    {intel.openPorts.length === 0 && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No open ports identified in baseline scan.</p>
                    )}
                </div>
            </div>

            {/* Vulnerability Feed */}
            {intel.vulnerabilities.length > 0 && (
                <div className="p-8 rounded-[32px] bg-si-red/[0.03] border border-si-red/10">
                    <h4 className="text-[10px] font-black text-si-red/60 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3" /> Detected CVE Forensics
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-2">
                        {intel.vulnerabilities.slice(0, 10).map((cve, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-si-red/5 rounded-xl group hover:border-si-red/20 transition-all">
                                <span className="text-xs font-black text-si-navy font-mono">{cve}</span>
                                <a 
                                    href={`https://nvd.nist.gov/vuln/detail/${cve}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-1.5 hover:bg-si-red/5 rounded-lg text-slate-400 hover:text-si-red transition-all"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        ))}
                        {intel.vulnerabilities.length > 10 && (
                            <p className="text-[9px] font-bold text-slate-400 text-center mt-2 uppercase tracking-widest">
                                + {intel.vulnerabilities.length - 10} additional vulnerabilities detected
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Tech Stack Chips */}
            <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Cpu className="h-3 w-3" /> Identified Infrastructure Layers
                </h4>
                
                <div className="flex flex-wrap gap-2">
                    {intel.techStack.length > 0 ? intel.techStack.map((tech, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
                            {tech}
                        </span>
                    )) : (
                        <p className="text-[10px] font-bold text-slate-400 italic">No specific products identified in banner responses.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
