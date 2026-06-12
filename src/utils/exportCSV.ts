export const exportToCSV = (filename: string, rows: any[][]) => {
  const processRow = (row: any[]) => row.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',');
  const csvFile = rows.map(processRow).join('\n');
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvFile], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
