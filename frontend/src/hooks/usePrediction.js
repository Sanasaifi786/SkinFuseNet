import { useState } from "react"
import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

// Helper to resize image on the client side using Canvas API
function resizeImageFile(file, maxWidth, maxHeight) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height *= maxWidth / width
            width = maxWidth
          } else {
            width *= maxHeight / height
            height = maxHeight
          }
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          }))
        }, file.type)
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

export function usePrediction() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function predict(imageFile, age, sex, localization) {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // 1. Resize image client-side to drastically reduce upload payload
      const resizedFile = await resizeImageFile(imageFile, 256, 256)

      // 2. Build FormData
      const form = new FormData()
      form.append("image", resizedFile)
      form.append("age", age)
      form.append("sex", sex)
      form.append("localization", localization)

      // 3. Submit
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
