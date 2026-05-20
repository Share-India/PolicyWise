import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { type Domain, type ScoringResult, getCurrentPremiumLoading } from "./scoring-engine"
import type { RemediationPlan } from "./recommendation-engine"
import { siteConfig } from "./site-config"

// Extend jsPDF type to include autoTable
declare module "jspdf" {
    interface jsPDF {
        autoTable: typeof autoTable
    }
}

export async function downloadPDFSummary(
    result: ScoringResult,
    domains: Domain[],
    clientName: string = '',
    industryName: string = '',
    clientEmail: string = '',
    submissionDate: string = '',
    protocolId: string = '',
    remediationPlan: RemediationPlan | null = null,
    modelVersion: string = '1.0.0',
    timestamp: string = new Date().toISOString(),
    approvalStatus: string = 'pending',
    underwriterNotes: string = ''
) {
    const doc = new jsPDF()

    // Share India Brand Colors
    const NAVY = [26, 35, 50] as [number, number, number]
    const BLUE = [42, 126, 254] as [number, number, number]
    const LIGHT_GRAY = [241, 245, 249] as [number, number, number]
    const DARK_GRAY = [71, 85, 105] as [number, number, number]

    let yPosition = 20
    const startY = yPosition

    // Add Share India Logo with proper aspect ratio
    let logoHeight = 0
    const logoWidth = 35 // Slightly smaller width for better proportion

    try {
        const { dataUrl, width, height } = await loadImage('/share-india-logo.png')
        logoHeight = (height / width) * logoWidth
        doc.addImage(dataUrl, 'PNG', 15, yPosition, logoWidth, logoHeight)
    } catch (error) {
        console.warn('Logo not loaded, continuing without it')
    }

    // Company Header - Positioned to the right of the logo
    const textX = 15 + logoWidth + 8
    let textY = yPosition + 8 // Optical alignment with logo top

    doc.setFontSize(12) // Slightly larger company name
    doc.setTextColor(...NAVY)
    doc.setFont('helvetica', 'bold')
    doc.text(siteConfig.company.toUpperCase(), textX, textY)

    textY += 6
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK_GRAY)
    doc.text('An IRDAI Licensed Direct Insurance Broker (Composite)', textX, textY)

    textY += 5
    doc.setFont('helvetica', 'italic')
    doc.text(`"${siteConfig.tagline.toUpperCase()}"`, textX, textY)

    // Update yPosition to be below the tallest element (logo or text) + padding
    yPosition = Math.max(startY + logoHeight, textY) + 20

    // Title
    doc.setFontSize(22) // Larger title
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    doc.text('CYBER RISK ASSESSMENT SUMMARY', 15, yPosition)
    yPosition += 15

    // Client Information Section - Always show with all available details
    const hasClientInfo = clientName || industryName || clientEmail || submissionDate || protocolId
    if (hasClientInfo) {
        // Calculate height based on number of fields
        let infoHeight = 12 // Base height
        if (clientName) infoHeight += 5
        if (clientEmail) infoHeight += 5
        if (industryName) infoHeight += 5
        if (submissionDate) infoHeight += 5
        if (protocolId) infoHeight += 5
        infoHeight += 3 // Padding

        doc.setFillColor(245, 247, 250) // Light blue-gray background
        doc.roundedRect(15, yPosition, 180, infoHeight, 2, 2, 'F')

        yPosition += 7
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...NAVY)
        doc.text('CLIENT INFORMATION', 20, yPosition)
        yPosition += 6

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...DARK_GRAY)
        doc.setFontSize(8)

        if (clientName) {
            doc.setFont('helvetica', 'bold')
            doc.text('Organization:', 20, yPosition)
            doc.setFont('helvetica', 'normal')
            doc.text(clientName, 55, yPosition)
            yPosition += 5
        }

        if (clientEmail) {
            doc.setFont('helvetica', 'bold')
            doc.text('Email:', 20, yPosition)
            doc.setFont('helvetica', 'normal')
            doc.text(clientEmail, 55, yPosition)
            yPosition += 5
        }

        if (industryName) {
            doc.setFont('helvetica', 'bold')
            doc.text('Industry Type:', 20, yPosition)
            doc.setFont('helvetica', 'normal')
            doc.text(industryName, 55, yPosition)
            yPosition += 5
        }

        if (submissionDate) {
            doc.setFont('helvetica', 'bold')
            doc.text('Submission Date:', 20, yPosition)
            doc.setFont('helvetica', 'normal')
            doc.text(submissionDate, 55, yPosition)
            yPosition += 5
        }

        if (protocolId) {
            doc.setFont('helvetica', 'bold')
            doc.text('Protocol ID:', 20, yPosition)
            doc.setFont('helvetica', 'normal')
            doc.text(protocolId, 55, yPosition)
            yPosition += 5
        }

        yPosition += 5
    }

    // Horizontal line
    doc.setDrawColor(...BLUE)
    doc.setLineWidth(0.5)
    doc.line(15, yPosition, 195, yPosition)
    yPosition += 10

    // Assessment Summary Box
    doc.setFillColor(...LIGHT_GRAY)
    doc.roundedRect(15, yPosition, 180, 52, 3, 3, 'F')

    yPosition += 8
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    doc.text('ASSESSMENT OVERVIEW', 20, yPosition)
    yPosition += 8

    // Risk Score
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Overall Risk Score:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BLUE)
    doc.text(result.totalScore.toFixed(2), 70, yPosition)
    yPosition += 6

    // Risk Tier with color coding
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    doc.text('Risk Tier:', 20, yPosition)

    // Color code based on tier
    const tierColors: Record<string, [number, number, number]> = {
        'A': [16, 185, 129] as [number, number, number], // Green
        'B': [59, 130, 246] as [number, number, number], // Blue
        'C': [251, 146, 60] as [number, number, number], // Orange
        'D': [239, 68, 68] as [number, number, number]   // Red
    }
    doc.setTextColor(...(tierColors[result.riskTier] || BLUE))
    doc.setFontSize(12)
    doc.text(result.riskTier, 70, yPosition)
    doc.setFontSize(9)
    yPosition += 8

    // Auto-Decline Status
    doc.setFont('helvetica', 'bold')
    doc.text('Status:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    if (result.autoDeclined) {
        doc.setTextColor(239, 68, 68) // Red
        doc.text('DECLINED - Critical Controls Failed', 70, yPosition)
    } else {
        doc.setTextColor(16, 185, 129) // Green
        doc.text('ELIGIBLE FOR UNDERWRITING', 70, yPosition)
    }
    yPosition += 6

    // Normalized Score
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    doc.text('Normalized Score:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK_GRAY)
    doc.text(result.normalizedScore.toFixed(2), 70, yPosition)
    yPosition += 6

    // Volatility Score
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK_GRAY)
    doc.text(result.volatilityScore.toFixed(2), 70, yPosition)

    yPosition += 12

    // Institutional Decision Block (New)
    if (approvalStatus !== 'pending') {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...NAVY)
        doc.text('OFFICIAL UNDERWRITING DECISION:', 20, yPosition)
        
        doc.setFontSize(11)
        const statusColor = approvalStatus === 'approved' ? [16, 185, 129] : [239, 68, 68];
        doc.setTextColor(...(statusColor as [number, number, number]))
        doc.text(approvalStatus.toUpperCase(), 85, yPosition)
        
        yPosition += 6
        
        if (underwriterNotes) {
            doc.setFontSize(8)
            doc.setFont('helvetica', 'italic')
            doc.setTextColor(...DARK_GRAY)
            const noteLines = doc.splitTextToSize(`Notes: ${underwriterNotes}`, 130)
            doc.text(noteLines, 20, yPosition)
            yPosition += (noteLines.length * 4)
        }
    }

    // Risk Executive Summary
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    doc.text('RISK EXECUTIVE SUMMARY', 15, yPosition)
    yPosition += 6

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK_GRAY)

    const summaryText = result.autoDeclined
        ? "The assessment has identified critical control failures. Underwriting is currently declined pending remediation of 'Killer' controls. The overall risk posture is High (Tier D)."
        : `Based on the evaluated controls, the organization demonstrates a ${result.riskTier === 'A' ? 'Superior' : result.riskTier === 'B' ? 'Good' : 'Moderate'} risk profile. The calculated risk tier is ${result.riskTier} with a normalized score of ${result.normalizedScore.toFixed(2)}.`

    const summaryLines = doc.splitTextToSize(summaryText, 180)
    doc.text(summaryLines, 15, yPosition)
    yPosition += (summaryLines.length * 5) + 5

    yPosition += 15

    // Domain Scores Table
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    doc.text('DOMAIN-LEVEL PERFORMANCE', 15, yPosition)
    yPosition += 5

    const tableData = result.domainScores.map(ds => [
        ds.domain,
        ds.score.toFixed(1) + '%',
        ds.earnedScore.toFixed(1),
        ds.maxScore.toString(),
        ds.activeWeight.toFixed(1) + '%',
        ds.contribution.toFixed(2)
    ])

    autoTable(doc, {
        startY: yPosition,
        head: [['Domain', 'Score %', 'Earned', 'Max', 'Weight %', 'Contribution']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: NAVY,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
            font: 'helvetica'
        },
        bodyStyles: {
            fontSize: 7,
            textColor: DARK_GRAY,
            font: 'helvetica'
        },
        alternateRowStyles: {
            fillColor: LIGHT_GRAY
        },
        columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 15, halign: 'center' },
            4: { cellWidth: 20, halign: 'center' },
            5: { cellWidth: 25, halign: 'center' }
        },
        margin: { left: 15, right: 15 }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 10

    // Failed Killer Questions (if any)
    if (result.failedKillers.length > 0) {
        // Check if we need a new page
        if (yPosition > 240) {
            doc.addPage()
            yPosition = 20
        }

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(239, 68, 68) // Red
        doc.text('CRITICAL CONTROL FAILURES', 15, yPosition)
        yPosition += 5

        const killerData = result.failedKillers.map(k => [
            k.id,
            k.domain,
            k.text
        ])

        autoTable(doc, {
            startY: yPosition,
            head: [['ID', 'Domain', 'Failed Control']],
            body: killerData,
            theme: 'striped',
            headStyles: {
                fillColor: [239, 68, 68], // Red
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                font: 'helvetica'
            },
            bodyStyles: {
                fontSize: 7,
                textColor: DARK_GRAY,
                font: 'helvetica'
            },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 50 },
                2: { cellWidth: 110 }
            },
            margin: { left: 15, right: 15 }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 10
    }

    // Decline Narrative (if present)
    if (result.declineNarrative && result.declineNarrative.trim() !== '') {
        // Check if we need a new page
        if (yPosition > 240) {
            doc.addPage()
            yPosition = 20
        }

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...NAVY)
        doc.text('UNDERWRITING NARRATIVE', 15, yPosition)
        yPosition += 8

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...DARK_GRAY)

        const paragraphs = result.declineNarrative.split('\n\n')
        paragraphs.forEach((paragraph: string) => {
            const lines = doc.splitTextToSize(paragraph, 180)
            lines.forEach((line: string) => {
                if (yPosition > 275) {
                    doc.addPage()
                    yPosition = 20
                }
                doc.text(line, 15, yPosition)
                yPosition += 6
            })
            yPosition += 4 // Extra space between paragraphs
        })
    }

    // AI Remediation Plan (if available)
    if (remediationPlan) {
        doc.addPage()
        yPosition = 20

        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...BLUE)
        doc.text('AI-DRIVEN REMEDIATION ROADMAP', 15, yPosition)
        yPosition += 8

        // Exec Summary
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...NAVY)
        doc.text('EXECUTIVE SUMMARY', 15, yPosition)
        yPosition += 6

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...DARK_GRAY)
        
        const execLines = doc.splitTextToSize(remediationPlan.executiveSummary, 180)
        doc.text(execLines, 15, yPosition)
        yPosition += (execLines.length * 5) + 8

        // Steps Table
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...NAVY)
        doc.text('ACTIONABLE STEPS', 15, yPosition)
        yPosition += 5

        const steps = Array.isArray(remediationPlan.steps) ? remediationPlan.steps : []
        const planData = steps.map(step => [
            step.domain,
            step.impact?.toUpperCase() || 'MODERATE',
            step.action,
            step.rationale
        ])

        autoTable(doc, {
            startY: yPosition,
            head: [['Domain', 'Priority', 'Action Required', 'Risk Rationale']],
            body: planData,
            theme: 'grid',
            headStyles: {
                fillColor: NAVY,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                font: 'helvetica'
            },
            bodyStyles: {
                fontSize: 7,
                textColor: DARK_GRAY,
                font: 'helvetica'
            },
            columnStyles: {
                0: { cellWidth: 35, fontStyle: 'bold' },
                1: { cellWidth: 20, fontStyle: 'bold' },
                2: { cellWidth: 60 },
                3: { cellWidth: 65 }
            },
            margin: { left: 15, right: 15 },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 1) {
                    if (data.cell.raw === 'CRITICAL') {
                        data.cell.styles.textColor = [239, 68, 68]
                    } else if (data.cell.raw === 'HIGH') {
                        data.cell.styles.textColor = [245, 158, 11]
                    } else {
                        data.cell.styles.textColor = BLUE
                    }
                }
            }
        })
        
        yPosition = (doc as any).lastAutoTable.finalY + 10
    }

    // Footer - Disclaimer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)

        // Footer line
        doc.setDrawColor(...LIGHT_GRAY)
        doc.setLineWidth(0.5)
        doc.line(15, 285, 195, 285)

        doc.setFontSize(7)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(...DARK_GRAY)
        doc.text(
            `DISCLAIMER: This report is based on self-attested controls. Final underwriting is subject to ${siteConfig.company}'s verification and approval.`,
            15,
            290
        )

        // Page number and date
        doc.setFont('helvetica', 'normal')
        const formattedTimestamp = new Date(timestamp).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
        doc.text(`Generated: ${formattedTimestamp} | System v${modelVersion}`, 15, 294)
        doc.text(`Page ${i} of ${pageCount}`, 180, 294)
    }

    // Download the PDF
    const filename = `${siteConfig.company.replace(/\\s+/g, '')}_CyberRisk_Summary_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
}

// Helper function to load image
interface ImageInfo {
    dataUrl: string
    width: number
    height: number
}

function loadImage(url: string): Promise<ImageInfo> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.drawImage(img, 0, 0)
                resolve({
                    dataUrl: canvas.toDataURL('image/png'),
                    width: img.width,
                    height: img.height
                })
            } else {
                reject(new Error('Could not get canvas context'))
            }
        }
        img.onerror = () => reject(new Error('Could not load image'))
        img.src = url
    })
}
