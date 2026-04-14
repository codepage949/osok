import { useRef, useState } from "react";
import {
  createUploadFillController,
  type UploadFillController,
} from "../lib/uploadFill";
import { createZip } from "../lib/zip";

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

const STATUS = {
  CREATING_SESSION:
    '<span class="status-uploading"><span class="spinner"></span> 세션 생성 중...</span>',
  WAITING_CLIENT: "수신자가 연결되기를 기다리는 중...",
  UPLOADING:
    '<span class="status-uploading"><span class="spinner"></span> 업로드 중...</span>',
  ZIPPING:
    '<span class="status-uploading"><span class="spinner"></span> ZIP 압축 중...</span>',
  SUCCESS: '<span class="status-ok">✅ 전송 완료!</span>',
  ERROR_UPLOAD:
    '<span class="status-err">❌ 연결이 끊겼거나 업로드에 실패했습니다</span>',
  ERROR_TIMEOUT:
    '<span class="status-err">❌ 수신자가 응답하지 않아 시간 초과되었습니다</span>',
  ERROR_ZIP: '<span class="status-err">ZIP 압축 실패</span>',
};

function uploadWithProgress(
  url: string,
  body: File | Blob | string,
  onProgress: (fraction: number) => void,
): Promise<{ result: boolean }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(event.loaded / event.total);
    };
    xhr.onerror = () => reject(new Error("upload request failed"));
    xhr.onabort = () => reject(new Error("upload request aborted"));
    xhr.onload = () => {
      let fallback = null;
      try {
        fallback = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        fallback = null;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`upload request failed: ${xhr.status}`));
        return;
      }
      resolve(xhr.response ?? fallback ?? { result: false });
    };
    xhr.send(body);
  });
}

const POLL_TIMEOUT_MS = 120_000;

async function waitForClient(key: string) {
  await new Promise<void>((ok, fail) => {
    const timer = setTimeout(
      () => fail(new Error("timeout")),
      POLL_TIMEOUT_MS,
    );
    const lp = async () => {
      const resp = (await (await fetch(`/status?key=${key}`)).json()) as {
        result: boolean;
      };
      if (!resp.result) {
        setTimeout(lp, 300);
      } else {
        clearTimeout(timer);
        ok();
      }
    };
    setTimeout(lp, 300);
  });
}

export interface FileItem {
  name: string;
  size: number;
}

export function useUpload(fillLayerRef: React.RefObject<HTMLDivElement | null>) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [statusHtml, setStatusHtml] = useState("");
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const isUploadingRef = useRef(false);
  const isBusyRef = useRef(false);
  const fillRef = useRef<UploadFillController | null>(null);

  function getFill(): UploadFillController {
    if (!fillRef.current) {
      fillRef.current = createUploadFillController(fillLayerRef.current ?? null);
    }
    return fillRef.current;
  }

  function lockUploading(locked: boolean) {
    isUploadingRef.current = locked;
    setIsUploading(locked);
  }

  function lockBusy(locked: boolean) {
    isBusyRef.current = locked;
    setIsBusy(locked);
  }

  async function upload(
    body: File | Blob | string,
    name?: string,
    alreadyBusy = false,
  ) {
    if (isBusyRef.current && !alreadyBusy) return;
    if (!alreadyBusy) lockBusy(true);
    const isTxt = typeof body === "string";

    if (isTxt) setFiles([]);
    setSessionKey(null);
    setStatusHtml(STATUS.CREATING_SESSION);

    let key: string;
    try {
      const resp = (await (await fetch("/new-session")).json()) as {
        result: string;
      };
      key = resp.result;
    } catch {
      setStatusHtml(STATUS.ERROR_UPLOAD);
      setSessionKey(null);
      setFiles([]);
      lockBusy(false);
      return;
    }

    if (name === undefined) name = `${key}.txt`;

    setSessionKey(key);
    setStatusHtml(STATUS.WAITING_CLIENT);

    try {
      await waitForClient(key);
    } catch {
      setStatusHtml(STATUS.ERROR_TIMEOUT);
      setSessionKey(null);
      setFiles([]);
      lockBusy(false);
      return;
    }

    lockUploading(true);
    setStatusHtml(STATUS.UPLOADING);

    const fill = getFill();
    fill.start();

    let uploadResp: { result: boolean };
    try {
      uploadResp = await uploadWithProgress(
        `/upload?key=${key}&fileName=${encodeURIComponent(name)}${isTxt ? "&isTxt" : ""}`,
        body,
        (fraction) => fill.setProgress(fraction),
      );
    } catch {
      uploadResp = { result: false };
    } finally {
      await fill.complete();
    }

    if (!uploadResp!.result) {
      setStatusHtml(STATUS.ERROR_UPLOAD);
      setSessionKey(null);
      setFiles([]);
      lockUploading(false);
      lockBusy(false);
    } else {
      setStatusHtml(STATUS.SUCCESS);
      setSessionKey(null);
      setTimeout(() => {
        setStatusHtml("");
        setFiles([]);
        lockUploading(false);
        lockBusy(false);
      }, 3000);
    }
  }

  async function handleFilesReady(rawFiles: File[]) {
    if (isBusyRef.current) return;
    lockBusy(true);
    let body: File | Blob;
    let name: string;

    if (rawFiles.length === 1) {
      body = rawFiles[0]!;
      name = rawFiles[0]!.name;
    } else {
      setStatusHtml(STATUS.ZIPPING);
      try {
        body = await createZip(rawFiles);
        name = "files.zip";
      } catch {
        setStatusHtml(STATUS.ERROR_ZIP);
        lockBusy(false);
        return;
      }
    }

    await upload(body, name, true);
  }

  return {
    files,
    setFiles: (rawFiles: File[]) =>
      setFiles(rawFiles.map((f) => ({ name: f.name, size: f.size }))),
    statusHtml,
    sessionKey,
    isUploading,
    isBusy,
    upload,
    handleFilesReady,
    formatSize,
  };
}
