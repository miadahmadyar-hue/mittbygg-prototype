// PDFs remain on this device; IndexedDB avoids localStorage's small text quota.
export interface SavedDocument { id: string; propertyId: string; filename: string; created: string; blob: Blob }
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("soknadsklar-documents", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("documents", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function saveDocument(blob: Blob, filename: string): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("documents", "readwrite");
      tx.objectStore("documents").put({ id: window.location.pathname, propertyId: window.location.pathname.split("/")[2], filename, created: new Date().toISOString(), blob });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
export async function listDocuments(propertyId: string): Promise<SavedDocument[]> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("documents").objectStore("documents").getAll();
      request.onsuccess = () => resolve((request.result as SavedDocument[]).filter((d) => d.propertyId === propertyId));
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
