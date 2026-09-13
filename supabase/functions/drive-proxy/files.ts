const GOOGLE_DOCUMENTS = new Set([
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
]);

export function disposition(filename: string, attachment: boolean) {
  const clean = filename.replace(/[\u0000-\u001f\u007f"\\/]/g, '_');
  const ascii = clean.replace(/[^\x20-\x7e]/g, '_');
  const encoded = encodeURIComponent(clean).replace(/['()*]/g, c => '%' + c.charCodeAt(0).toString(16));
  return `${attachment ? 'attachment' : 'inline'}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

// Native Google documents require files.export. Office/PDF files use alt=media.
export async function readDriveFile(id: string, google: (path: string) => Promise<Response>) {
  if (!/^[A-Za-z0-9_-]{8,200}$/.test(id)) throw new Error('Ugyldig Drive-fil.');
  const filePath = `files/${encodeURIComponent(id)}`;
  const metadata = await google(`${filePath}?supportsAllDrives=true&fields=name,mimeType,size,capabilities(canDownload),trashed`);
  if (!metadata.ok) throw new Error('Filen er ikke tilgjengelig i den tilkoblede Google-kontoen.');
  const info = await metadata.json();
  if (info.trashed || info.capabilities?.canDownload === false) throw new Error('Filen kan ikke lastes ned fra Google Drive.');
  if (info.mimeType === 'application/vnd.google-apps.folder') throw new Error('Velg et dokument, ikke en mappe.');
  const permissions = await google(`${filePath}/permissions?supportsAllDrives=true&fields=permissions(type),nextPageToken&pageSize=100`);
  if (!permissions.ok) throw new Error('Kunne ikke kontrollere delingen av Drive-filen.');
  const sharing = await permissions.json();
  if (!Array.isArray(sharing.permissions) || sharing.nextPageToken || sharing.permissions.some((p: { type: string }) => p.type === 'anyone' || p.type === 'domain')) {
    throw new Error('Filen er delt offentlig eller med et helt domene i Google Drive. Endre til Begrenset før publisering.');
  }
  const exported = GOOGLE_DOCUMENTS.has(info.mimeType);
  const response = await google(exported
    ? `${filePath}/export?mimeType=application%2Fpdf`
    : `${filePath}?alt=media&supportsAllDrives=true`);
  if (!response.ok || !response.body) throw new Error(exported
    ? 'Google kunne ikke eksportere dokumentet. Prøv å laste det opp som PDF.'
    : 'Google kunne ikke levere filen. Koble til Google Drive på nytt og prøv igjen.');
  const mime = exported ? 'application/pdf' : info.mimeType || 'application/octet-stream';
  const name = exported ? String(info.name).replace(/\.pdf$/i, '') + '.pdf' : String(info.name || 'dokument');
  // Stream bytes directly from Drive; no Supabase Storage copy or full-file buffer.
  return { response, name, mime, size: exported ? null : Number(info.size) || null };
}
