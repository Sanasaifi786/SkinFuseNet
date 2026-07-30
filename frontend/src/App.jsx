import { useState } from "react"
import DisclaimerBanner from "./components/DisclaimerBanner"
import ImageUpload from "./components/ImageUpload"
import MetadataForm from "./components/MetadataForm"

function App() {
  const [imageFile, setImageFile] = useState(null)
  const [metadata, setMetadata]   = useState({
    age: "",
    sex: "",
    localization: "",
  })

  // Check if form is complete enough to submit
  const isReady = imageFile && metadata.age && metadata.sex && metadata.localization

  function handleSubmit() {
    // For now — just log values to verify everything is collected
    console.log("Image file:", imageFile.name, imageFile.size)
    console.log("Metadata:", metadata)
    console.log("Ready to send to API ✅")
    alert(`Ready!\nImage: ${imageFile.name}\nAge: ${metadata.age}\nSex: ${metadata.sex}\nLocation: ${metadata.localization}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky disclaimer at top */}
      <DisclaimerBanner />

      {/* Main content */}
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">SkinFuseNet</h1>
        <p className="text-gray-500 text-sm mb-8">
          Multimodal skin lesion classification · Research prototype
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Step 1: Upload */}
          <ImageUpload onFileSelect={setImageFile} />

          {/* Divider */}
          <hr className="border-gray-100" />

          {/* Step 2: Metadata */}
          <MetadataForm values={metadata} onChange={setMetadata} />

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!isReady}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors
              ${isReady
                ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            {isReady ? "Analyse Lesion →" : "Complete all fields to analyse"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
