import { zip } from "fflate";

export function createZip(files: File[]): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const zipData: Record<string, Uint8Array> = {};
    let remaining = files.length;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        zipData[file.name] = new Uint8Array(e.target!.result as ArrayBuffer);
        remaining--;
        if (remaining === 0) {
          zip(zipData, (err, data) => {
            if (err) reject(err);
            else resolve(new Blob([data.buffer as ArrayBuffer], { type: "application/zip" }));
          });
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  });
}
