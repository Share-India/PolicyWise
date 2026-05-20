"use client"

import { useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2, ShieldCheck } from "lucide-react"

interface PolicyUploadProps {
    assessmentId?: string
    userId: string
    documentType?: 'policy' | 'audit_report'
    onUploadComplete?: (filePath: string, fileName: string) => void
}

const ACCEPTED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
]
const MAX_SIZE_MB = 10
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export function PolicyUpload({ assessmentId, userId, documentType = 'policy', onUploadComplete }: PolicyUploadProps) {
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadedFile, setUploadedFile] = useState<{ name: string; path: string } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'completed' | 'error'>('idle')

    const validateFile = (file: File): string | null => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            return "Invalid file type. Please upload a PDF, Word document, or image."
        }
        if (file.size > MAX_SIZE_BYTES) {
            return `File too large. Maximum size is ${MAX_SIZE_MB}MB.`
        }
        return null
    }

    const handleUpload = useCallback(async (file: File) => {
        const validationError = validateFile(file)
        if (validationError) {
            setError(validationError)
            return
        }

        setError(null)
        setIsUploading(true)
        setUploadProgress(10)
        setAnalysisStatus('idle')

        try {
            const timestamp = Date.now()
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
            const filePath = `${userId}/${timestamp}_${sanitizedName}`

            setUploadProgress(30)

            // Upload to Supabase Storage
            const { error: storageError } = await supabase.storage
                .from("policy-documents")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false,
                })

            if (storageError) {
                throw new Error(storageError.message)
            }

            setUploadProgress(70)

            // Insert metadata record
            const { data: insertedDoc, error: dbError } = await supabase
                .from("policy_documents")
                .insert({
                    user_id: userId,
                    assessment_id: assessmentId || null,
                    document_type: documentType,
                    file_name: file.name,
                    file_path: filePath,
                    file_size: file.size,
                })
                .select()
                .single()

            if (dbError) {
                throw new Error(dbError.message)
            }

            setUploadProgress(100)
            setUploadedFile({ name: file.name, path: filePath })
            onUploadComplete?.(filePath, file.name)

            // Trigger AI Analysis automatically
            if (documentType === 'policy' && insertedDoc?.id) {
                setAnalysisStatus('analyzing')
                try {
                    const analysisResponse = await fetch('/api/analyze-policy', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ documentId: insertedDoc.id })
                    })

                    if (analysisResponse.ok) {
                        setAnalysisStatus('completed')
                    } else {
                        setAnalysisStatus('error')
                    }
                } catch (e) {
                    console.error("Analysis trigger failed", e)
                    setAnalysisStatus('error')
                }
            }

        } catch (err: any) {
            setError(err.message || "Upload failed. Please try again.")
        } finally {
            setIsUploading(false)
        }
    }, [supabase, userId, assessmentId, documentType, onUploadComplete])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleUpload(file)
    }

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) handleUpload(file)
    }, [handleUpload])

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => setIsDragging(false)

    return (
        <div className="w-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-si-blue-primary/10 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-si-blue-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-si-navy font-outfit tracking-tight">
                        IT / Cyber Security Policy
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Upload your company policy document
                    </p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {uploadedFile ? (
                    /* Success State */
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-50 border border-emerald-200 rounded-[24px] p-6 flex items-center gap-4"
                    >
                        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-emerald-800 truncate">{uploadedFile.name}</p>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
                                Policy document uploaded successfully
                            </p>
                        </div>
                        <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                    </motion.div>
                ) : isUploading ? (
                    /* Upload Progress State */
                    <motion.div
                        key="uploading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-slate-50 border border-slate-200 rounded-[24px] p-8 flex flex-col items-center gap-4"
                    >
                        <Loader2 className="w-8 h-8 text-si-blue-primary animate-spin" />
                        <div className="w-full max-w-xs">
                            <div className="flex justify-between mb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uploading...</span>
                                <span className="text-[10px] font-black text-si-blue-primary">{uploadProgress}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-si-blue-primary rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* Upload Zone */
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-[24px] p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 group ${isDragging
                                ? "border-si-blue-primary bg-si-blue-primary/5 scale-[1.01]"
                                : "border-slate-200 bg-slate-50 hover:border-si-blue-primary/50 hover:bg-si-blue-primary/[0.02]"
                                }`}
                        >
                            <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center transition-all duration-300 ${isDragging ? "bg-si-blue-primary text-white" : "bg-white border border-slate-100 text-slate-300 group-hover:border-si-blue-primary/30 group-hover:text-si-blue-primary"
                                }`}>
                                <Upload className="w-7 h-7" />
                            </div>

                            <div className="text-center">
                                <p className="text-sm font-black text-si-navy mb-1">
                                    {isDragging ? "Drop your file here" : "Drag & drop or click to upload"}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    PDF, DOCX, PNG, JPG · Max {MAX_SIZE_MB}MB
                                </p>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mt-3 flex items-center gap-2 px-4 py-3 bg-si-red/5 border border-si-red/20 rounded-2xl"
                                >
                                    <AlertCircle className="w-4 h-4 text-si-red shrink-0" />
                                    <p className="text-xs font-bold text-si-red flex-1">{error}</p>
                                    <button onClick={() => setError(null)}>
                                        <X className="w-4 h-4 text-si-red/50 hover:text-si-red transition-colors" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
