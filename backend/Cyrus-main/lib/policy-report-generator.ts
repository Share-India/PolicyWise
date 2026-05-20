import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { PolicyAnalysisResult } from "./policy-analyzer";

/**
 * Generates a professional PDF report from the Policy Analysis result.
 */
/**
 * Generates a professional, branded PDF report from the Policy Analysis result.
 */
export async function generatePolicyAnalysisPDF(analysis: PolicyAnalysisResult, organizationName: string) {
    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- Configuration & Colors ---
    const colors = {
        navy: [30, 41, 59],      // #1e293b (si-navy)
        blue: [59, 130, 246],    // #3b82f6 (si-blue-primary)
        red: [244, 63, 94],      // #f43f5e (si-red)
        gray: [100, 116, 139],   // #64748b (text-slate-400)
        lightGray: [248, 250, 252], // #f8fafc (slate-50)
        border: [226, 232, 240]  // #e2e8f0 (slate-200)
    };

    // Helper: Add Watermark
    const addWatermark = (pdfDoc: any) => {
        pdfDoc.saveGraphicsState();
        pdfDoc.setGState(new (pdfDoc as any).GState({ opacity: 0.05 }));
        pdfDoc.setFontSize(60);
        pdfDoc.setTextColor( ...colors.navy );
        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.text("SHARE INDIA - CONFIDENTIAL", pageWidth / 2, pageHeight / 2, {
            align: "center",
            angle: 45
        });
        pdfDoc.restoreGraphicsState();
    };

    // Helper: Add Header
    const addHeader = (pdfDoc: any, pageTitle: string) => {
        // Decorative Navy Banner
        pdfDoc.setFillColor(...colors.navy);
        pdfDoc.rect(0, 0, pageWidth, 35, 'F');
        
        // Accent Red Line
        pdfDoc.setFillColor(...colors.red);
        pdfDoc.rect(0, 35, pageWidth, 1.5, 'F');

        pdfDoc.setTextColor(255, 255, 255);
        pdfDoc.setFontSize(20);
        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.text(pageTitle, 15, 24);
        
        pdfDoc.setFontSize(8);
        pdfDoc.setFont("helvetica", "normal");
        pdfDoc.text("STRATEGIC CYBER RISK INTELLIGENCE BUREAU", 15, 30);

        // Metadata on right
        pdfDoc.setFontSize(9);
        pdfDoc.text(`Client: ${organizationName.toUpperCase()}`, pageWidth - 15, 20, { align: "right" });
        pdfDoc.text(`Ref: ${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-PA`, pageWidth - 15, 25, { align: "right" });
        pdfDoc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 15, 30, { align: "right" });
    };

    // Helper: Add Footer
    const addFooter = (pdfDoc: any, pageNum: number, totalPages: number) => {
        pdfDoc.setFontSize(7);
        pdfDoc.setTextColor(...colors.gray);
        pdfDoc.setDrawColor(...colors.border);
        pdfDoc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
        
        pdfDoc.text("CYRUS PRO v2.0 | POWERED BY SHARE INDIA", 15, pageHeight - 10);
        pdfDoc.text(`CONFIDENTIAL INTEL - PAGE ${pageNum} OF ${totalPages}`, pageWidth - 15, pageHeight - 10, { align: "right" });
    };

    // --- Cover Page / Title Section ---
    addHeader(doc, "Policy Analysis Report");
    addWatermark(doc);

    let yPos = 55;

    // --- Executive Summary Section ---
    doc.setTextColor(...colors.navy);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("EXECUTIVE ADVISORY SUMMARY", 15, yPos);
    
    // Bottom underline for Section Title
    doc.setDrawColor(...colors.blue);
    doc.setLineWidth(0.5);
    doc.line(15, yPos + 2, 80, yPos + 2);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    const summaryLines = doc.splitTextToSize(analysis.executiveSummary, pageWidth - 36);
    
    // Background box for summary
    doc.setFillColor(...colors.lightGray);
    doc.roundedRect(15, yPos - 5, pageWidth - 30, (summaryLines.length * 5.2) + 10, 3, 3, 'F');
    
    summaryLines.forEach((line: string, i: number) => {
        doc.text(line, 20, yPos + (i * 5.2));
    });
    yPos += (summaryLines.length * 5.2) + 18;

    // --- Identified Controls ---
    doc.setTextColor(...colors.navy);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("SECURITY CONTROL ASSESSMENT", 15, yPos);
    doc.setDrawColor(...colors.blue);
    doc.line(15, yPos + 2, 85, yPos + 2);
    yPos += 8;

    const controlsData = analysis.identifiedControls.map(c => [
        c.name,
        { content: c.status.toUpperCase(), styles: { textColor: c.status.toLowerCase().includes('fail') ? colors.red : [0, 150, 0] } },
        c.details || "N/A"
    ]);

    doc.autoTable({
        startY: yPos,
        head: [['Control Description', 'Maturity Status', 'Observation Details']],
        body: controlsData,
        headStyles: { fillColor: colors.navy, fontSize: 8, fontStyle: 'bold', halign: 'center' },
        columnStyles: { 0: { fontStyle: 'bold', width: 60 }, 1: { halign: 'center', width: 40 } },
        alternateRowStyles: { fillColor: colors.lightGray },
        styles: { fontSize: 8.5, cellPadding: 4, lineColor: colors.border, lineWidth: 0.1 },
        margin: { left: 15, right: 15 }
    });
    yPos = doc.lastAutoTable.finalY + 18;

    // --- Compliance Alignment ---
    if (yPos > pageHeight - 70) { doc.addPage(); yPos = 50; addHeader(doc, "Policy Analysis Report (Cont.)"); addWatermark(doc); }

    doc.setTextColor(...colors.navy);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("REGULATORY & STANDARDS ALIGNMENT", 15, yPos);
    doc.setDrawColor(...colors.blue);
    doc.line(15, yPos + 2, 95, yPos + 2);
    yPos += 8;

    const complianceData = analysis.complianceAlignment.map(c => [
        c.standard,
        { content: `${c.alignmentScore}%`, styles: { fontStyle: 'bold', textColor: c.alignmentScore > 80 ? [0, 150, 0] : colors.red } },
        c.notes || "No additional commentary."
    ]);

    doc.autoTable({
        startY: yPos,
        head: [['Compliance Standard', 'Alignment %', 'Auditor Notes']],
        body: complianceData,
        headStyles: { fillColor: colors.blue, fontSize: 8, fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'center', width: 30 } },
        styles: { fontSize: 8.5, cellPadding: 4, lineColor: colors.border, lineWidth: 0.1 },
        margin: { left: 15, right: 15 }
    });
    yPos = doc.lastAutoTable.finalY + 18;

    // --- Maturity Gaps ---
    if (yPos > pageHeight - 70) { doc.addPage(); yPos = 50; addHeader(doc, "Policy Analysis Report (Cont.)"); addWatermark(doc); }

    doc.setTextColor(...colors.navy);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("SURFACE VULNERABILITY & MATURITY GAPS", 15, yPos);
    doc.setDrawColor(...colors.red);
    doc.line(15, yPos + 2, 105, yPos + 2);
    yPos += 10;

    analysis.maturityGaps.forEach((gap, index) => {
        const gapLines = doc.splitTextToSize(`${index + 1}. ${gap}`, pageWidth - 36);
        
        // Bullet point icon
        doc.setFillColor(...colors.red);
        doc.circle(18, yPos - 1, 0.8, 'F');
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        gapLines.forEach((line: string, i: number) => {
            doc.text(line, 22, yPos + (i * 4.8));
        });
        yPos += (gapLines.length * 4.8) + 4;
    });
    yPos += 12;

    // --- Recommendations ---
    if (yPos > pageHeight - 100) { doc.addPage(); yPos = 50; addHeader(doc, "Strategic Recommendations"); addWatermark(doc); }

    doc.setTextColor(...colors.navy);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("STRATEGIC MITIGATION ROADMAP", 15, yPos);
    doc.setDrawColor(...colors.navy);
    doc.line(15, yPos + 2, 85, yPos + 2);
    yPos += 8;

    const recsData = analysis.recommendations.map(r => [
        r.action,
        { content: r.priority.toUpperCase(), styles: { fontStyle: 'bold', textColor: r.priority.toLowerCase() === 'high' ? colors.red : colors.blue } },
        r.impact
    ]);

    doc.autoTable({
        startY: yPos,
        head: [['Strategic Mitigation Action', 'Priority Tier', 'Projected Impact']],
        body: recsData,
        headStyles: { fillColor: colors.red, fontSize: 8, fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'center', width: 35 } },
        styles: { fontSize: 8.5, cellPadding: 5, lineColor: colors.border, lineWidth: 0.1 },
        margin: { left: 15, right: 15 }
    });

    // --- Footer Application ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(doc, i, totalPages);
    }

    return doc;
}

