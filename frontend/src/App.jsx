import { useState } from "react"
import DisclaimerBanner from "./components/DisclaimerBanner"
import ImageUpload from "./components/ImageUpload"
import MetadataForm from "./components/MetadataForm"
import { usePrediction } from "./hooks/usePrediction"
import ProbabilityChart from "./components/ProbabilityChart"
import GradCAMViewer from "./components/GradCAMViewer"

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
            <div className="space-y-6 pt-2">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Top Prediction</span>
                  <h2 className="text-xl font-bold text-blue-950">{result.predicted_class}</h2>
                </div>
                <div className="text-right">
                  <span className="text-xs text-blue-600 font-medium">Confidence</span>
                  <p className="text-lg font-bold text-blue-900">{(result.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>

              <ProbabilityChart
                probabilities={result.probabilities}
                predictedClass={result.predicted_class}
              />
              
              <GradCAMViewer
                originalImage={imageFile ? URL.createObjectURL(imageFile) : null}
                gradcamImage={result.gradcam_image}
              />

              <button
                onClick={reset}
                className="w-full py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                ← Analyze Another Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
