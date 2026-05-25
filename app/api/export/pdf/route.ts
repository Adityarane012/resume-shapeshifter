import { NextRequest, NextResponse } from 'next/server';
import { compileSideBySidePDF } from '../../../../lib/pdf-generator';

export async function POST(request: NextRequest) {
  try {
    const runData = await request.json();

    if (!runData || !runData.targetJobDescription || !runData.tailoredResume) {
      return NextResponse.json(
        { error: 'Valid TailoringRun data manifest is required in request payload.' },
        { status: 400 }
      );
    }

    // Compile A4 landscape comparison proof PDF via Puppeteer
    const pdfBuffer = await compileSideBySidePDF(runData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="shapeshifter_proof_${runData.runId.substring(0, 8)}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF export service endpoint failure:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal failure during PDF generation.' },
      { status: 500 }
    );
  }
}
