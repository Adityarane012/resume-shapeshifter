/**
 * Opens styled HTML in a new browser window and triggers the native print dialog.
 * The user can then "Save as PDF" or print to a physical printer.
 * This approach works universally across all hosting platforms (Vercel, Netlify, etc.)
 * without requiring any server-side browser binaries.
 */
export function printHtmlToPDF(html: string): void {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    throw new Error('Pop-up blocked. Please allow pop-ups for this site to export PDFs.');
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for the content to fully render before triggering print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  // Fallback: if onload doesn't fire (some browsers), trigger after a delay
  setTimeout(() => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch {
      // Window may have been closed by user
    }
  }, 1000);
}
