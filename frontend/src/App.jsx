import { useState, useEffect } from "react"
import DisclaimerBanner from "./components/DisclaimerBanner"
import ImageUpload from "./components/ImageUpload"
import MetadataForm from "./components/MetadataForm"
import { usePrediction } from "./hooks/usePrediction"
import ResultsPanel from "./components/ResultsPanel"
import { Header } from "./components/Header"
import { SkinFuseNetDashboard } from './components/SkinFuseNetDashboard';
import { PatientRecordsPage } from './components/PatientRecordsPage';
import { PatientView } from './components/PatientView';
import { OntologyPage } from './components/OntologyPage';
import { INITIAL_PATIENT_RECORDS, HAM10000_CLASSES } from './data/lesionData';
import { Stethoscope, Heart, CheckCircle2 } from 'lucide-react';

function App() {
  // Page Navigation State
  const [activePage, setActivePage] = useState('scan');

  // Real Backend Scanner State
  const [imageFile, setImageFile] = useState(null)
  const [metadata, setMetadata] = useState({ age: "", sex: "", localization: "" })
  const { predict, loading, result, error, reset } = usePrediction()
  const isReady = imageFile && metadata.age && metadata.sex && metadata.localization

  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('skinfusenet_patient_records_v3');
    return saved ? JSON.parse(saved) : INITIAL_PATIENT_RECORDS;
  });
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    localStorage.setItem('skinfusenet_patient_records_v3', JSON.stringify(records));
  }, [records]);

  async function handleSubmit() {
    await predict(imageFile, metadata.age, metadata.sex, metadata.localization)
  }

  // Map the backend result into the patient-facing view model.
  const mappedPrediction = result ? {
    topClass: result.predicted_class,
    topConfidence: (result.confidence * 100).toFixed(1),
    classProbabilities: result.probabilities,
    recommendedAction: HAM10000_CLASSES[result.predicted_class]?.clinicalProtocol || 'Review clinically',
    urgencyLevel: HAM10000_CLASSES[result.predicted_class]?.severity === 'malignant' ? 'critical' : 'low'
  } : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100 animate-fadeIn">
      <DisclaimerBanner />
      <Header
        activePage={activePage}
        onSelectPage={setActivePage}
        totalRecords={records.length}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900 text-white shadow-2xl backdrop-blur-md animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* PAGE: SCANNER (Our Real Backend) */}
        {activePage === 'scan' && (
          <>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-slate-900">Skin Lesion Diagnostic Assistant</h1>
                  <p className="text-xs text-slate-500">Upload a clinical photo and patient details to generate an instant multi-modal diagnosis.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 space-y-4">
                <ImageUpload onFileSelect={setImageFile} />
              </div>
              <div className="lg:col-span-7 space-y-6">
                <MetadataForm values={metadata} onChange={setMetadata} />

                <button
                  onClick={handleSubmit}
                  disabled={!isReady || loading}
                  className={`w-full py-3 rounded-xl font-bold text-sm shadow-sm transition-all flex justify-center items-center gap-2
                    ${isReady && !loading ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"}`}
                >
                  {loading ? (
                    <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Analyzing Lesion...</>
                  ) : isReady ? "Analyze Lesion →" : "Complete all fields to begin"}
                </button>
                {error && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm text-rose-700 font-medium text-sm">⚠️ {error}</div>
                )}
                {result && (
                  <div className="space-y-4">
                    <ResultsPanel result={result} originalImage={imageFile ? URL.createObjectURL(imageFile) : null} />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={reset} className="w-full py-2.5 text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200">
                        Evaluate Another Lesion
                      </button>
                      <button onClick={() => {
                        const newRecord = {
                          id: `rec-${Date.now().toString().slice(-4)}`,
                          patientId: `PT-${Math.floor(10000 + Math.random() * 90000)}`,
                          patientName: `Patient`,
                          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
                          doctorNotes: `Predicted ${result.predicted_class} with ${(result.confidence * 100).toFixed(1)}% confidence.`,
                          imageSrc: URL.createObjectURL(imageFile),
                          metadata,
                          prediction: mappedPrediction,
                          status: 'monitoring'
                        };
                        setRecords([newRecord, ...records]);
                        showToast("Saved to Patient Records");
                      }} className="w-full py-3.5 text-base font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-2xl transition-all hover:shadow-lg">
                        Save to Records
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* PAGE: MODELS */}
        {activePage === 'models' && <SkinFuseNetDashboard isClinical={false} />}

        {/* PAGE: RECORDS */}
        {activePage === 'records' && (
          <PatientRecordsPage
            records={records}
            onSelectRecord={(r) => { showToast("Cannot load historical images into live scanner yet."); }}
            onDeleteRecord={(id) => { setRecords(records.filter(r => r.id !== id)); showToast("Record deleted."); }}
            onNewScan={() => setActivePage('scan')}
          />
        )}

        {/* PAGE: PATIENT VIEW */}
        {activePage === 'patient' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-sm gap-4">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-emerald-600" />
                <span className="font-semibold text-sm sm:text-base">Patient Consultation View: Plain-English terminology, visual ABCDE self-check, and take-home leaflet.</span>
              </div>
              <button onClick={() => setActivePage('scan')} className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-100 font-bold shadow-sm transition-all whitespace-nowrap">
                Back to Scanner
              </button>
            </div>
            {mappedPrediction ? (
              <PatientView prediction={mappedPrediction} metadata={metadata} imageSrc={imageFile ? URL.createObjectURL(imageFile) : null} onSwitchToClinical={() => setActivePage('scan')} />
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-lg mb-6">Please scan a lesion first to generate a patient consultation view.</p>
                <button onClick={() => setActivePage('scan')} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all">Go to Scanner</button>
              </div>
            )}
          </div>
        )}

        {/* PAGE: ONTOLOGY */}
        {activePage === 'ontology' && <OntologyPage isClinical={false} />}

      </main>
    </div>
  )
}

export default App