import { useState } from "react"
import DisclaimerBanner from "./components/DisclaimerBanner"
import ImageUpload from "./components/ImageUpload"
import MetadataForm from "./components/MetadataForm"
import { usePrediction } from "./hooks/usePrediction"

function App() {
  const [imageFile, setImageFile] = useState(null)
  const [metadata, setMetadata]   = useState({ age: "", sex: "", localization: "" })
  const { predict, loading, result, error, reset } = usePrediction()

  const isReady = imageFile && metadata.age && metadata.sex && metadata.localization

  async function handleSubmit() {
    await predict(imageFile, metadata.age, metadata.sex, metadata.localization)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DisclaimerBanner />

      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">SkinFuseNet</h1>
        <p className="text-gray-500 text-sm mb-8">Multimodal skin lesion classification</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          <ImageUpload onFileSelect={setImageFile} />
          <hr className="border-gray-100" />
          <MetadataForm values={metadata} onChange={setMetadata} />

          <button
            onClick={handleSubmit}
            disabled={!isReady || loading}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors
              ${isReady && !loading
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            {loading ? "Analysing..." : isReady ? "Analyse Lesion →" : "Complete all fields"}
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">⚠️ {error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold mb-2">
                ✅ Prediction: {result.predicted_class} ({(result.confidence * 100).toFixed(1)}% confidence)
              </p>
              <details>
                <summary className="text-xs text-green-600 cursor-pointer">Show full API response</summary>
                <pre className="text-xs text-gray-600 mt-2 overflow-auto">
                  {JSON.stringify({ ...result, gradcam_image: "[base64 string]" }, null, 2)}
                </pre>
              </details>
              <button
                onClick={reset}
                className="mt-3 text-xs text-green-700 underline"
              >
                Try another image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
