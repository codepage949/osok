import { useRef, useState } from "react";
import BgScene from "./BgScene";
import { useUpload } from "./hooks/useUpload";

export default function App() {
  const uploaderRef = useRef<HTMLInputElement>(null);
  const fillLayerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const [dragging, setDragging] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const {
    files,
    setFiles,
    statusHtml,
    sessionKey,
    isUploading,
    textVisible,
    setTextVisible,
    upload,
    handleFilesReady,
    formatSize,
  } = useUpload(fillLayerRef);

  function onDropZoneClick() {
    if (isUploading) return;
    uploaderRef.current?.click();
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (isUploading) return;
    setDragging(true);
  }

  function onDragLeave() {
    setDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (isUploading) return;
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) {
      setFiles(dropped);
      handleFilesReady(dropped);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (isUploading) {
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

  function onBtnFileClick() {
    if (isUploading) return;
    uploaderRef.current?.click();
  }

  function onBtnTextClick() {
    if (isUploading) return;
    const text = textInputRef.current?.value.trim() ?? "";
    if (textVisible && text) {
      upload(text);
    } else {
      setTextVisible(!textVisible);
      if (!textVisible) {
        setTimeout(() => textInputRef.current?.focus(), 0);
      }
    }
  }

  function copyKey() {
    if (!sessionKey) return;
    navigator.clipboard.writeText(sessionKey).then(() => {
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
          ✈️ <span>osok</span>
        </div>

        <div
          className={`drop-zone${isUploading ? " disabled" : ""}${dragging ? " dragging" : ""}`}
          onClick={onDropZoneClick}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="drop-icon">📂</div>
          <div>파일을 여기에 드래그하거나 클릭하세요</div>
          <div className="drop-hint">여러 파일 선택 시 ZIP으로 자동 압축</div>
        </div>

        {files.length > 0 && (
          <div className="file-list">
            {files.map((f, i) => (
              <div key={i} className="file-item">
                <span className="file-icon">📄</span>
                <span className="file-name">{f.name}</span>
                <span className="file-size">{formatSize(f.size)}</span>
              </div>
            ))}
          </div>
        )}

        <div id="msg" style={{ position: "relative" }}>
          {sessionKey && (
            <div
              className="session-key"
              id="sessionKey"
              title="클릭해서 복사"
              onClick={copyKey}
            >
              {sessionKey}
              {showToast && <div className="copy-toast">복사됨!</div>}
            </div>
          )}
        </div>

        <textarea
          ref={textInputRef}
          className={textVisible ? "visible" : ""}
          placeholder="텍스트를 입력하세요..."
          disabled={isUploading}
        />

        <div className="btn-group">
          <a
            className={`btn${isUploading ? " disabled" : ""}`}
            onClick={onBtnFileClick}
          >
            📎 파일
          </a>
          <a
            className={`btn btn-text${isUploading ? " disabled" : ""}`}
            onClick={onBtnTextClick}
          >
            📝 텍스트
          </a>
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
