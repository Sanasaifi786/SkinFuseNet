// All 13 localization options from HAM10000 dataset
const LOCALIZATIONS = [
  "back", "lower extremity", "trunk", "upper extremity",
  "abdomen", "face", "hand", "foot", "scalp",
  "neck", "ear", "genital", "acral",
]

function MetadataForm({ values, onChange }) {
  function handleChange(field, value) {
    onChange({ ...values, [field]: value })
  }

  return (
    <div className="w-full space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Patient Information</h3>

      {/* Age */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Age <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="1"
          max="120"
          placeholder="e.g. 45"
          value={values.age}
          onChange={(e) => handleChange("age", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2
                     text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Sex */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Sex <span className="text-red-500">*</span>
        </label>
        <select
          value={values.sex}
          onChange={(e) => handleChange("sex", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2
                     text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Select sex</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      {/* Localization */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Lesion Location <span className="text-red-500">*</span>
        </label>
        <select
          value={values.localization}
          onChange={(e) => handleChange("localization", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2
                     text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Select location</option>
          {LOCALIZATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc.charAt(0).toUpperCase() + loc.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default MetadataForm
