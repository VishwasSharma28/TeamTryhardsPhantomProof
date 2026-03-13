from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet
import os

def generate_forensic_pdf(scan_result, lang="en"):
    # Ensure outputs directory exists
    current_dir = os.path.dirname(os.path.abspath(__file__))
    outputs_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "outputs"))
    os.makedirs(outputs_dir, exist_ok=True)
    
    file_id = scan_result.get("file_id", "scan")
    pdf_filename = f"forensic_report_{file_id}.pdf"
    pdf_path = os.path.join(outputs_dir, pdf_filename)
    
    doc = SimpleDocTemplate(pdf_path, pagesize=A4)
    story = []
    
    styles = getSampleStyleSheet()
    H1 = styles['Heading1']
    H2 = styles['Heading2']
    Normal = styles['Normal']
    
    verdict = scan_result.get('verdict', 'UNVERIFIED')
    confidence = scan_result.get('confidence', 50.0)
    
    # Cover page with verdict
    story.append(Paragraph(f"<b>{verdict} ({confidence:.1f}%)</b>", style=H1))
    
    exec_summary = scan_result.get('executive_summary', {})
    summary_text = exec_summary.get(lang, exec_summary.get('en', 'No summary available.'))
    story.append(Paragraph(summary_text, style=Normal))
    story.append(Spacer(1, 20))
    
    # Technical breakdown
    story.append(Paragraph("Technical Analysis:", style=H2))
    ela_score = scan_result.get('verdict_breakdown', {}).get('ela_contribution', 0)
    story.append(Paragraph(f"ELA Tampering: {ela_score:.1f}%", style=Normal))
    
    # Try to load heatmap if available
    try:
        heatmap_url = scan_result.get('visualizations', {}).get('ela_heatmap', '')
        # In a real scenario we might decode base64 or load from disk. 
        # For hackathon mockup, we'll draw a dummy if missing or skip.
        heatmap_filename = f"{file_id}_heatmap.png"
        heatmap_path = os.path.join(outputs_dir, heatmap_filename)
        if os.path.exists(heatmap_path):
            story.append(Image(heatmap_path, width=400, height=300))
    except Exception as e:
        print(f"Image load error: {e}")
        
    doc.build(story)
    return f"/reports/{pdf_filename}"
