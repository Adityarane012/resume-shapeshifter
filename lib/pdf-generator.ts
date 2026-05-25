import { TailoringRun } from './types';

/**
 * Dynamically launches a headless browser instance.
 * - In Vercel serverless nodes (production environment), it utilizes puppeteer-core
 *   and @sparticuz/chromium to load a compressed, optimized binary within function size bounds.
 * - In local development, it falls back to standard puppeteer using your auto-downloaded browser.
 */
async function getBrowser() {
  const isServerless = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

  if (isServerless) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const puppeteerCore = require('puppeteer-core');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const chromium = require('@sparticuz/chromium');

    return await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const puppeteer = require('puppeteer');
    return await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
  }
}

/**
 * Renders a side-by-side landscape comparison PDF from tailoring execution data.
 * Guarantees proper cleanup of headless browser sessions on exit.
 */
export async function compileSideBySidePDF(runData: TailoringRun): Promise<Buffer> {
  let browser;
  try {
    browser = await getBrowser();

    const page = await browser.newPage();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { 
              size: A4 landscape; 
              margin: 10mm; 
            }
            body { 
              font-family: 'Inter', system-ui, -apple-system, sans-serif; 
              color: #334155; 
              line-height: 1.5; 
              font-size: 10px; 
              margin: 0; 
              background: #ffffff; 
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center;
              border-bottom: 2px solid #f1f5f9; 
              padding-bottom: 10px; 
              margin-bottom: 15px; 
            }
            .title { 
              font-size: 18px; 
              font-weight: 800; 
              color: #0f172a; 
              letter-spacing: -0.5px; 
            }
            .subtitle {
              margin-top: 4px; 
              font-weight: 500; 
              color: #64748b;
              font-size: 11px;
            }
            .scores-container {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .score-badge { 
              font-weight: 700; 
              padding: 4px 8px; 
              border-radius: 6px; 
              background: #f8fafc; 
              border: 1px solid #e2e8f0; 
              font-size: 10px;
            }
            .score-badge-tailored {
              background: #ecfdf5; 
              color: #065f46; 
              border-color: #a7f3d0;
            }
            .grid { 
              display: flex; 
              gap: 15px; 
            }
            .pane { 
              flex: 1; 
              border: 1px solid #e2e8f0; 
              border-radius: 10px; 
              padding: 12px; 
              background: #f8fafc; 
            }
            .pane-tailored { 
              background: #ffffff; 
              border-color: #d1fae5; 
            }
            .pane-title {
              margin-top: 0; 
              margin-bottom: 10px;
              color: #475569; 
              font-size: 12px; 
              border-bottom: 1px solid #cbd5e1; 
              padding-bottom: 4px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .pane-title-tailored {
              color: #059669; 
              border-bottom-color: #a7f3d0;
            }
            .job-block { 
              margin-bottom: 12px; 
            }
            .job-block:last-child {
              margin-bottom: 0;
            }
            .job-header {
              font-size: 11px;
              color: #1e293b;
              margin-bottom: 6px;
            }
            .job-company {
              color: #64748b;
              font-weight: normal;
            }
            .bullet-list {
              margin: 0; 
              padding-left: 12px;
            }
            .bullet-item {
              margin-bottom: 4px; 
              color: #475569;
              font-size: 10px;
            }
            .bullet-block { 
              margin-bottom: 8px; 
              border-bottom: 1px dashed #e2e8f0; 
              padding-bottom: 6px; 
            }
            .bullet-block:last-child { 
              border: none; 
              padding-bottom: 0;
              margin-bottom: 0;
            }
            .deleted { 
              text-decoration: line-through; 
              color: #94a3b8; 
              display: block; 
              margin-bottom: 2px; 
              font-size: 9.5px;
            }
            .added { 
              font-weight: 500; 
              color: #065f46; 
              background: #ecfdf5; 
              padding: 2px 5px; 
              border-radius: 4px; 
              display: block; 
              font-size: 10px;
            }
            .disclaimer { 
              font-size: 8px; 
              color: #ef4444; 
              border-top: 1px solid #fee2e2; 
              margin-top: 15px; 
              padding-top: 6px; 
              text-align: center; 
              font-weight: 500; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Resume Shapeshifter: Comparison Proof</div>
              <div class="subtitle">Job Title: ${runData.targetJobDescription.jobTitle} at ${runData.targetJobDescription.company || 'Not Specified'}</div>
            </div>
            <div class="scores-container">
              <span class="score-badge">Original Score: ${runData.originalScore.overallScore}/100</span>
              <span style="font-weight:bold; color:#64748b;">→</span>
              <span class="score-badge score-badge-tailored">Tailored Score: ${runData.tailoredScore.overallScore}/100</span>
            </div>
          </div>
          
          <div class="grid">
            <div class="pane">
              <h3 class="pane-title">Original Experience</h3>
              ${runData.originalResume.experience.map(job => `
                <div class="job-block">
                  <div class="job-header">
                    <strong>${job.title}</strong> <span class="job-company">at ${job.company}</span>
                  </div>
                  <ul class="bullet-list">
                    ${job.bullets.map(b => `<li class="bullet-item">${b}</li>`).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>
            
            <div class="pane pane-tailored">
              <h3 class="pane-title pane-title-tailored">Tailored Experience</h3>
              ${runData.tailoredResume.tailoredExperience.map(job => `
                <div class="job-block">
                  <div class="job-header">
                    <strong>${job.title}</strong> <span class="job-company" style="color:#059669;">at ${job.company}</span>
                  </div>
                  <div style="margin-top: 4px;">
                    ${job.bullets.map(b => `
                      <div class="bullet-block">
                        <span class="deleted">${b.original}</span>
                        <span class="added">${b.tailored}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="disclaimer">
            TRUTHFULNESS COMPLIANCE STATEMENT: This tailored profile aligns phrasing to job context using existing resume evidence.
            Experience details, credentials, and achievements must be manually verified by the candidate before submission.
          </div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({ 
      format: 'A4', 
      landscape: true, 
      printBackground: true,
      preferCSSPageSize: true
    });
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    throw new Error(`Failed to compile comparison PDF: ${(error as Error).message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Renders a clean, ATS-optimized, recruiter-ready Portrait A4/Letter PDF of the tailored resume.
 * Hides all tracking scores, strike-throughs, and rationale, formatting a highly professional, ready-to-submit layout.
 */
export async function compileCleanResumePDF(runData: TailoringRun): Promise<Buffer> {
  let browser;
  try {
    browser = await getBrowser();

    const page = await browser.newPage();
    const contact = runData.originalResume.contact;
    const skills = runData.tailoredResume.tailoredSkills || runData.originalResume.skills || [];
    const experiences = runData.tailoredResume.tailoredExperience || [];
    const projects = runData.originalResume.projects || [];
    const education = runData.originalResume.education || [];
    const certifications = runData.originalResume.certifications || [];
    const summary = runData.tailoredResume.tailoredSummary || runData.originalResume.summary || "";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { 
              size: A4 portrait; 
              margin: 15mm; 
            }
            body { 
              font-family: 'Inter', system-ui, -apple-system, sans-serif; 
              color: #1e293b; 
              line-height: 1.4; 
              font-size: 10px; 
              margin: 0; 
              background: #ffffff; 
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
            }
            .name {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 5px 0;
              letter-spacing: -0.5px;
              text-transform: uppercase;
            }
            .contact-info {
              font-size: 9px;
              color: #475569;
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 8px;
              margin: 0;
              padding: 0;
              list-style: none;
            }
            .contact-item:not(:last-child)::after {
              content: "•";
              margin-left: 8px;
              color: #94a3b8;
            }
            .section {
              margin-bottom: 15px;
            }
            .section-title {
              font-size: 11px;
              font-weight: 700;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 3px;
              margin: 0 0 8px 0;
            }
            .summary-text {
              color: #334155;
              text-align: justify;
              margin: 0;
            }
            .skills-list {
              display: flex;
              flex-wrap: wrap;
              gap: 5px;
              margin: 0;
              padding: 0;
              list-style: none;
            }
            .skill-item {
              background: #f1f5f9;
              color: #334155;
              padding: 3px 6px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 500;
            }
            .job-block {
              margin-bottom: 12px;
            }
            .job-block:last-child {
              margin-bottom: 0;
            }
            .job-header {
              display: flex;
              justify-content: space-between;
              font-weight: 700;
              color: #0f172a;
              font-size: 10px;
              margin-bottom: 3px;
            }
            .job-meta {
              display: flex;
              justify-content: space-between;
              color: #475569;
              font-size: 9px;
              font-weight: 500;
              margin-bottom: 4px;
            }
            .bullet-list {
              margin: 0;
              padding-left: 15px;
              list-style-type: disc;
            }
            .bullet-item {
              margin-bottom: 3px;
              color: #334155;
              text-align: justify;
            }
            .bullet-item:last-child {
              margin-bottom: 0;
            }
            .edu-block {
              margin-bottom: 8px;
            }
            .edu-block:last-child {
              margin-bottom: 0;
            }
            .certs-list {
              margin: 0;
              padding-left: 15px;
            }
            .cert-item {
              margin-bottom: 3px;
              color: #334155;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="name">${contact.fullName}</h1>
            <ul class="contact-info">
              ${contact.email ? `<li class="contact-item">${contact.email}</li>` : ''}
              ${contact.phone ? `<li class="contact-item">${contact.phone}</li>` : ''}
              ${contact.location ? `<li class="contact-item">${contact.location}</li>` : ''}
              ${contact.websiteUrls && contact.websiteUrls.length > 0 
                ? contact.websiteUrls.map(url => `<li class="contact-item">${url}</li>`).join('') 
                : ''}
            </ul>
          </div>

          ${summary ? `
            <div class="section">
              <h2 class="section-title">Professional Summary</h2>
              <p class="summary-text">${summary}</p>
            </div>
          ` : ''}

          ${skills.length > 0 ? `
            <div class="section">
              <h2 class="section-title">Technical Skills</h2>
              <ul class="skills-list">
                ${skills.map(s => `<li class="skill-item">${s}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${experiences.length > 0 ? `
            <div class="section">
              <h2 class="section-title">Professional Experience</h2>
              ${experiences.map((job, idx) => {
                const origJob = runData.originalResume.experience[idx] || {};
                return `
                  <div class="job-block">
                    <div class="job-header">
                      <span>${job.title}</span>
                      <span>${job.company}</span>
                    </div>
                    <div class="job-meta">
                      <span>${origJob.location || 'Not Specified'}</span>
                      <span>${origJob.startDate || ''} – ${origJob.endDate || 'Present'}</span>
                    </div>
                    <ul class="bullet-list">
                      ${job.bullets.map(b => `<li class="bullet-item">${b.tailored}</li>`).join('')}
                    </ul>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}

          ${projects.length > 0 ? `
            <div class="section">
              <h2 class="section-title">Projects</h2>
              ${projects.map(p => `
                <div class="job-block">
                  <div class="job-header">
                    <span>${p.name}</span>
                    ${p.technologiesUsed && p.technologiesUsed.length > 0 
                      ? `<span style="font-weight: 500; font-size: 8.5px; color: #475569;">[${p.technologiesUsed.join(', ')}]</span>` 
                      : ''}
                  </div>
                  ${p.description ? `<p class="summary-text" style="font-size: 9px; margin-bottom: 4px; color: #475569;">${p.description}</p>` : ''}
                  ${p.bullets && p.bullets.length > 0 ? `
                    <ul class="bullet-list">
                      ${p.bullets.map(b => `<li class="bullet-item">${b}</li>`).join('')}
                    </ul>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${education.length > 0 ? `
            <div class="section">
              <h2 class="section-title">Education</h2>
              ${education.map(e => `
                <div class="edu-block">
                  <div class="job-header">
                    <span>${e.degree} ${e.fieldOfStudy ? `in ${e.fieldOfStudy}` : ''}</span>
                    <span>${e.institution}</span>
                  </div>
                  <div class="job-meta">
                    <span></span>
                    <span>Graduated: ${e.graduationDate}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${certifications.length > 0 ? `
            <div class="section">
              <h2 class="section-title">Certifications</h2>
              <ul class="certs-list">
                ${certifications.map(c => `<li class="cert-item">${c}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({ 
      format: 'A4', 
      landscape: false, 
      printBackground: true,
      preferCSSPageSize: true
    });
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    throw new Error(`Failed to compile recruiter-ready resume PDF: ${(error as Error).message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
