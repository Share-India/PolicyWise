import * as XLSX from "xlsx"
import type { Domain, ScoringResult } from "./scoring-engine"

export function downloadAssessmentReport(
    result: ScoringResult,
    domains: Domain[],
    clientName: string = '',
    industryName: string = '',
    clientEmail: string = '',
    submissionDate: string = '',
    protocolId: string = ''
) {
    const workbook = XLSX.utils.book_new()

    // Format date for display
    const formattedDate = submissionDate
        ? new Date(submissionDate).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

    // 1. Summary Sheet
    const summaryData: any[][] = [
        ["SHARE INDIA INSURANCE BROKERS - CYBER RISK PROTOCOL v2.0"],
        ['"YOU GENERATE, WE MULTIPLY"'],
        ["An IRDAI Licensed Direct Insurance Broker (Composite)"],
        [],
        ["CLIENT INFORMATION"],
        ["-------------------------------------------------"],
        ...(clientName ? [["Organization Name:", clientName]] : []),
        ...(clientEmail ? [["Client Email:", clientEmail]] : []),
        ...(industryName ? [["Industry Type:", industryName]] : []),
        ...(protocolId ? [["Protocol ID:", protocolId]] : []),
        ["Report Generated:", formattedDate],
        ...(submissionDate ? [["Original Submission:", new Date(submissionDate).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })]] : []),
        [],
        ["ASSESSMENT SUMMARY"],
        ["-------------------------------------------------"],
        ["OVERALL RISK SCORE", result.totalScore.toFixed(2) + "%"],
        ["ASSIGNED RISK TIER", result.riskTier],
        ["AUTO-DECLINE STATUS", result.autoDeclined ? "TRIGGERED (POLICY INELIGIBLE)" : "CLEAR"],
        ["NORMALIZED SCORE", result.normalizedScore.toFixed(2)],
        ["VOLATILITY SCORE", result.volatilityScore.toFixed(2)],
        [],
        ["UNDERWRITING LOGIC & NARRATIVE"],
        ...summaryToRows(result.declineNarrative || "Standard Risk Assessment - Policy Eligible for Underwriting"),
        [],
        ["DOMAIN-LEVEL ACHIEVEMENT"],
        ["Domain", "Score %", "Earned pts", "Max pts", "Weight %", "Contribution"],
        ...result.domainScores.map((ds) => [
            ds.domain,
            ds.score.toFixed(2) + "%",
            ds.earnedScore.toFixed(1),
            ds.maxScore,
            ds.activeWeight + "%",
            ds.contribution.toFixed(2),
        ]),
        [],
        ["DISCLAIMER: This report is a simulation based on self-attested controls. Final underwriting is subject to Share India's verification and approval."]
    ]
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)

    // Set column widths for summary
    summarySheet["!cols"] = [
        { wch: 40 }, // Domain / Label
        { wch: 20 }, // Score / Value
        { wch: 15 }, // Earned
        { wch: 10 }, // Max
        { wch: 12 }, // Weight
        { wch: 15 }  // Contribution
    ]

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Assessment Summary")

    // 2. Detailed Controls Sheet
    const controlsData: any[][] = [
        ["SHARE INDIA INSURANCE - DETAILED CONTROL AUDIT"],
        ["Confidential Risk Assessment Data"],
        [],
        ["ID", "Domain", "Control Text", "Assessment Detail", "Response Value", "Killer Control"],
    ]

    domains.forEach((domain) => {
        domain.questions.forEach((q) => {
            const selectedOption = q.options?.find((o) => o.value === q.response)
            controlsData.push([
                q.id,
                q.domain,
                q.text,
                selectedOption ? selectedOption.label : q.response === 0 ? "Non-Complying / Pending" : "Complying / Validated",
                q.response.toString(),
                q.isKiller ? "YES" : "NO",
            ])
        })
    })
    const controlsSheet = XLSX.utils.aoa_to_sheet(controlsData)

    // Set column widths for controls
    controlsSheet["!cols"] = [
        { wch: 15 }, // ID
        { wch: 30 }, // Domain
        { wch: 60 }, // Control Text
        { wch: 30 }, // Assessment Detail
        { wch: 15 }, // Response
        { wch: 15 }  // Killer
    ]

    XLSX.utils.book_append_sheet(workbook, controlsSheet, "Detailed Audit")

    // 3. Critical Failures Sheet
    if (result.failedKillers.length > 0) {
        const killerData: any[][] = [
            ["SHARE INDIA INSURANCE - CRITICAL CONTROL FAILURES"],
            ["THE FOLLOWING CONTROLS ARE MANDATORY FOR COVERAGE"],
            [],
            ["CONTROL ID", "DOMAIN", "DESCRIPTION"],
            ...result.failedKillers.map((k) => [k.id, k.domain, k.text]),
        ]
        const killerSheet = XLSX.utils.aoa_to_sheet(killerData)
        killerSheet["!cols"] = [{ wch: 20 }, { wch: 40 }, { wch: 80 }]
        XLSX.utils.book_append_sheet(workbook, killerSheet, "Critical Failures")
    }

    // Generate and download
    const date = new Date().toISOString().split("T")[0]
    XLSX.writeFile(workbook, `ShareIndia_CyberRisk_Report_${date}.xlsx`)
}

function summaryToRows(narrative: string) {
    return narrative.split(". ").map((line) => [line])
}
