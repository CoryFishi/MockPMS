import { useState } from "react";
import toast from "react-hot-toast";
import { MdOutlineImage } from "react-icons/md";
import ModalContainer from "@components/ui/ModalContainer";
import ModalButton from "@components/ui/ModalButton";
import { uploadBackground } from "@hooks/sitePlans";
import type { PlanBackground } from "@views/smartspace/mapping/model/types";

const MAX_SIDE = 6000;
const MAX_BYTES = 15 * 1024 * 1024;

interface Rendered {
  blob: Blob;
  width: number;
  height: number;
  previewUrl: string;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode the image."))), type, 0.9),
  );
}

async function loadPdf(file: File) {
  const [pdfjs, worker] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
}

type PdfDocument = Awaited<ReturnType<typeof loadPdf>>;

async function renderPdfPage(pdf: PdfDocument, pageNumber: number): Promise<Rendered> {
  const page = await pdf.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: MAX_SIDE / Math.max(base.width, base.height) });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  await page.render({ canvas, viewport, background: "#ffffff" }).promise;
  const blob = await canvasToBlob(canvas, "image/png");
  return { blob, width: canvas.width, height: canvas.height, previewUrl: URL.createObjectURL(blob) };
}

async function renderImage(file: File): Promise<Rendered> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * ratio);
  const height = Math.round(bitmap.height * ratio);
  if (ratio === 1 && file.size <= MAX_BYTES && (file.type === "image/png" || file.type === "image/jpeg")) {
    bitmap.close();
    return { blob: file, width, height, previewUrl: URL.createObjectURL(file) };
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await canvasToBlob(canvas, file.type === "image/png" ? "image/png" : "image/jpeg");
  return { blob, width, height, previewUrl: URL.createObjectURL(blob) };
}

export default function BackgroundModal({
  planId,
  replacing,
  onDone,
  onClose,
}: {
  planId: string;
  replacing: boolean;
  onDone: (background: PlanBackground) => void;
  onClose: () => void;
}) {
  const [pdf, setPdf] = useState<PdfDocument | null>(null);
  const [page, setPage] = useState(1);
  const [rendered, setRendered] = useState<Rendered | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const setPreview = (next: Rendered | null) => {
    setRendered((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return next;
    });
  };

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    try {
      await fn();
    } catch (e) {
      toast.error((e as Error).message || "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setPdf(null);
    setPreview(null);
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      run("Rendering PDF...", async () => {
        const doc = await loadPdf(file);
        setPdf(doc);
        setPage(1);
        setPreview(await renderPdfPage(doc, 1));
      });
    } else {
      run("Loading image...", async () => setPreview(await renderImage(file)));
    }
  };

  const choosePage = (n: number) => {
    if (!pdf) return;
    setPage(n);
    run("Rendering page...", async () => setPreview(await renderPdfPage(pdf, n)));
  };

  const upload = () => {
    if (!rendered || busy) return;
    if (rendered.blob.size > MAX_BYTES) {
      toast.error("The image is larger than 15 MB. Try a smaller file or a JPEG.");
      return;
    }
    run("Uploading...", async () => {
      const path = await uploadBackground(planId, rendered.blob);
      onDone({ path, width: rendered.width, height: rendered.height });
      setPreview(null);
    });
  };

  return (
    <ModalContainer
      title={replacing ? "Replace Site Plan Image" : "Upload Site Plan Image"}
      icon={<MdOutlineImage />}
      onClose={onClose}
      mainContent={
        <div className="flex w-xl flex-col gap-3 pt-5 text-sm">
          <p>PDF, PNG or JPEG. PDFs are converted to an image; pick the page with the site plan.</p>
          {replacing && (
            <p className="rounded bg-amber-100 p-2 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              Devices keep their positions in image pixels. If the new image is framed differently, move them and set
              the scale again.
            </p>
          )}
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="text-sm file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-zinc-200 file:px-3 file:py-1.5 dark:file:bg-zinc-700"
          />
          {pdf && pdf.numPages > 1 && (
            <label className="flex items-center gap-2">
              Page
              <select
                value={page}
                onChange={(e) => choosePage(Number(e.target.value))}
                className="rounded border border-zinc-400 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              >
                {Array.from({ length: pdf.numPages }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} of {pdf.numPages}
                  </option>
                ))}
              </select>
            </label>
          )}
          {busy && <p className="text-zinc-500">{busy}</p>}
          {rendered && (
            <div>
              <img src={rendered.previewUrl} alt="Site plan preview" className="max-h-80 w-full border border-zinc-300 object-contain dark:border-zinc-700" />
              <p className="mt-1 text-xs text-zinc-500">
                {rendered.width} × {rendered.height} px · {(rendered.blob.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          )}
        </div>
      }
      responseContent={
        <>
          <ModalButton onclick={onClose} text="Cancel" />
          <ModalButton
            onclick={upload}
            text="Use This Image"
            className={rendered && !busy ? "bg-green-500 hover:bg-green-600" : "bg-zinc-400 cursor-not-allowed"}
          />
        </>
      }
    />
  );
}
