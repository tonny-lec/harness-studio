import JSZip from "jszip";
import type { ExportBundle } from "./bundleTypes";

export async function downloadBundleZip(bundle: ExportBundle): Promise<void> {
  const zip = new JSZip();
  bundle.files.forEach((file) => {
    zip.file(file.path, file.content);
  });
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${bundle.name}.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
