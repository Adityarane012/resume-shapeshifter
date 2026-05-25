import { NextRequest, NextResponse } from 'next/server';
import { compileCleanResumePDF } from '../../../../lib/pdf-generator';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const runData = await request.json();

    if (!runData || !runData.targetJobDescription || !runData.tailoredResume) {
      return NextResponse.json(
        { error: 'Valid TailoringRun data manifest is required in request payload.' },
        { status: 400 }
      );
    }

    // Compile clean portrait recruiter-ready PDF via Puppeteer
    const pdfBuffer = await compileCleanResumePDF(runData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="tailored_resume_${runData.runId.substring(0, 8)}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Clean PDF export service endpoint failure:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal failure during clean PDF generation.' },
      { status: 500 }
    );
  }
}
