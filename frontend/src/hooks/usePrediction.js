import { useState } from "react"
import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export function usePrediction() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function predict(imageFile, age, sex, localization) {
    setLoading(true)
    setError(null)
    setResult(null)

    // Build FormData — DO NOT set Content-Type manually
    // Axios sets it automatically with the correct boundary string
    const form = new FormData()
    form.append("image", imageFile)
    form.append("age", age)
    form.append("sex", sex)
    form.append("localization", localization)

    try {
      const response = await axios.post(`${BASE_URL}/predict`, form)
      setResult(response.data)
      console.log("API response:", response.data)
    } catch (err) {
      const message = err.response?.data?.detail || "Something went wrong. Is the backend running?"
      setError(message)
      console.error("API error:", err)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setLoading(false)
    setResult(null)
    setError(null)
  }

  return { predict, loading, result, error, reset }
}
