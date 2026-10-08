import { useState, useRef } from "react"
import { UploadCloud, CheckCircle2 } from "lucide-react"

const MAX_FILE_SIZE = 10 * 1024 * 1024   // 10MB in bytes
const VALID_TYPES   = ["image/jpeg", "image/png"]

function ImageUpload({ onFileSelect }) {
  const [preview, setPreview] = useState(null)
  const [error, setError]     = useState(null)
  const [filename, setFilename] = useState(null)
  const inputRef = useRef(null)

  function validateAndSet(file) {
    setError(null)
    setPreview(null)
    setFilename(null)

    if (!file) return

    if (!VALID_TYPES.includes(file.type)) {
      setError("Only JPEG and PNG images are accepted.")
      onFileSelect(null)
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`File is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum allowed is 10MB.`)
      onFileSelect(null)
      return
    }

    setPreview(URL.createObjectURL(file))
    setFilename(file.name)
    onFileSelect(file)
  }

  function handleInputChange(e) {
    validateAndSet(e.target.files[0])
  }

  function handleDrop(e) {
    e.preventDefault()
    validateAndSet(e.dataTransfer.files[0])
  }

  function handleDragOver(e) {
    e.preventDefault()    
  }

  return (
    <div className="w-full bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Current Dermoscopic Scan
        </span>
      </div>

      {preview ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-4/3 flex items-center justify-center group"
        >
          <img
            src={preview}
            alt="Selected lesion"
            className="w-full h-full object-contain"
          />
          <div className="absolute bottom-3 left-3 right-3 p-3 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {filename}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ready for analysis
              </p>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current.click()}
              className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold hover:bg-blue-100 transition-colors"
            >
              Change Image
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 text-center cursor-pointer transition-all aspect-4/3 flex flex-col items-center justify-center p-6"
        >
          <div className="text-sm text-slate-700 font-medium flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center">
              <UploadCloud className="w-6 h-6 text-blue-600" />
            </div>
            <span>Drag & drop or click to upload any custom skin photograph</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            JPG, PNG, or mobile dermatoscope camera photos supported (Max 10MB)
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <p className="mt-2 text-sm text-rose-600 flex items-center gap-1.5 bg-rose-50 p-2 rounded-lg border border-rose-100">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  )
}

export default ImageUpload
