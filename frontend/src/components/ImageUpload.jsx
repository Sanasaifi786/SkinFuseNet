import { useState, useRef } from "react"

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
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Dermoscopic Image
      </label>

      <div
        onClick={() => inputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center
                   cursor-pointer hover:border-blue-400 hover:bg-blue-50
                   transition-colors duration-200"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={handleInputChange}
          className="hidden"
        />

        {preview ? (
          <div>
            <img
              src={preview}
              alt="Selected lesion"
              className="mx-auto max-h-48 rounded-lg object-contain"
            />
            <p className="mt-2 text-sm text-gray-500">{filename}</p>
            <p className="text-xs text-blue-500 mt-1">Click to change image</p>
          </div>
        ) : (
          <div>
            <p className="text-4xl mb-2">🔬</p>
            <p className="text-gray-600 font-medium">
              Drop image here or click to select
            </p>
            <p className="text-gray-400 text-sm mt-1">
              JPEG or PNG · max 10MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  )
}

export default ImageUpload
