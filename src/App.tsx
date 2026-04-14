import { useEffect, useRef, useState } from "react";
import BgScene from "./BgScene";
import { useUpload } from "./hooks/useUpload";

export default function App() {
  const uploaderRef = useRef<HTMLInputElement>(null);
  const fillLayerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const [dragging, setDragging] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [textDraft, setTextDraft] = useState("");

  const {
    files,
    setFiles,
    statusHtml,
    sessionKey,
    isBusy,
    upload,
    handleFilesReady,
    formatSize,
  } = useUpload(fillLayerRef);

  function onDropZoneClick() {
    if (isBusy) return;
    uploaderRef.current?.click();
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (isBusy) return;
    setDragging(true);
  }

  function onDragLeave() {
    setDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (isBusy) return;
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) {
      setFiles(dropped);
      handleFilesReady(dropped);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (isBusy) {
      e.target.value = "";
      return;
    }
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) {
      setFiles(selected);
      handleFilesReady(selected);
    }
    e.target.value = "";
  }

  useEffect(() => {
    textInputRef.current?.focus();
  }, []);

  function onTextSubmitClick() {
    if (isBusy) return;
    const text = textDraft.trim();
    if (!text) {
      textInputRef.current?.focus();
      return;
    }
    setTextDraft("");
    upload(text);
  }

  function copyKey() {
    if (!sessionKey) return;
    const url = `${window.location.origin}/${sessionKey}`;
    navigator.clipboard.writeText(url).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
    });
  }

  return (
    <>
      <BgScene />
      <div className="container">
        <div ref={fillLayerRef} className="upload-fill-layer" />

        <div className="title">
          <span>osok</span>
        </div>

        <div
          className={`drop-zone${isBusy ? " disabled" : ""}${dragging ? " dragging" : ""}`}
          onClick={onDropZoneClick}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {files.length > 0 ? (
            <div className="file-list">
              {files.map((f, i) => (
                <div key={i} className="file-item">
                  <span className="file-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </span>
                  <span className="file-name">{f.name}</span>
                  <span className="file-size">{formatSize(f.size)}</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="drop-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div>파일을 드래그하거나 클릭해 선택</div>
              <div className="drop-hint">여러 파일 선택 시 ZIP으로 자동 압축</div>
            </>
          )}
        </div>

        <div id="msg" style={{ position: "relative" }}>
          {sessionKey && (
            <div
              className="session-key"
              id="sessionKey"
              title="클릭해서 복사"
              onClick={copyKey}
            >
              {sessionKey}
            </div>
          )}
          {showToast && <div className="copy-toast">복사됨!</div>}
        </div>

        <div className="text-compose">
          <textarea
            ref={textInputRef}
            value={textDraft}
            placeholder="텍스트를 입력하세요..."
            disabled={isBusy}
            onChange={(e) => setTextDraft(e.target.value)}
          />
          <div className="btn-group">
            <button
              type="button"
              className={`btn btn-upload${isBusy || !textDraft.trim() ? " disabled" : ""}`}
              onClick={onTextSubmitClick}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              전송
            </button>
          </div>
        </div>

        <div
          id="status"
          dangerouslySetInnerHTML={{ __html: statusHtml }}
        />
      </div>

      <input
        ref={uploaderRef}
        hidden
        type="file"
        accept="*"
        multiple
        onChange={onFileChange}
      />
    </>
  );
}
