# SkinFuseNet — Week 1 Guide
### Setup, Foundations & First Steps

> **Who this is for:** All 3 team members · Windows machines · VS Code  
> **Time required:** 10–15 hrs across the week  
> **Goal by end of week:** Monorepo on GitHub, all 3 laptops synced, HAM10000 loaded, EDA notebook running, API contract written

---

## 📋 Table of Contents

- [Before You Start — Install Everything](#before-you-start--install-everything)
- [Day 1 — Git & GitHub Setup](#day-1--git--github-setup)
- [Day 2 — Create the Monorepo](#day-2--create-the-monorepo)
- [Day 3 — ML Track: Python & PyTorch Basics](#day-3--ml-track-python--pytorch-basics)
- [Day 4 — Backend Track: FastAPI Basics](#day-4--backend-track-fastapi-basics)
- [Day 5 — Frontend Track: React Basics](#day-5--frontend-track-react-basics)
- [Day 6 — Download HAM10000 & Run EDA](#day-6--download-ham10000--run-eda)
- [Day 7 — Cross-teach + Write API Contract](#day-7--cross-teach--write-api-contract)
- [Week 1 Checklist](#week-1-checklist)
- [Common Errors & Fixes](#common-errors--fixes)
- [Resources](#resources)

---

## Before You Start — Install Everything

Do this **before Day 1**. All 3 people must have every tool installed and verified.

### 1. Git

Download from: https://git-scm.com/download/win  
Install with all default options. When asked about default editor, pick VS Code.

Open **Command Prompt** and verify:
```
git --version
```
Expected output: `git version 2.x.x`

Set your identity (do this on every laptop):
```
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

---

### 2. Python 3.10+

Download from: https://www.python.org/downloads/  
⚠️ During install — **check the box that says "Add Python to PATH"** — this is critical.

Verify in Command Prompt:
```
python --version
pip --version
```
Expected: `Python 3.10.x` and `pip 23.x`

If `python` gives an error but `py` works, use `py` instead of `python` in all commands below.

---

### 3. Node.js 18+

Download from: https://nodejs.org/en (LTS version)  
Install with default options.

Verify:
```
node --version
npm --version
```
Expected: `v18.x.x` and `9.x.x`

---

### 4. VS Code

Download from: https://code.visualstudio.com/

Install these extensions (Ctrl+Shift+X → search and install):
- **Python** (by Microsoft)
- **Pylance** (by Microsoft)
- **ES7+ React/Redux/React-Native snippets** (by dsznajder)
- **Tailwind CSS IntelliSense** (by Tailwind Labs)
- **Thunder Client** (REST API tester — replaces Postman)
- **GitLens** (see who wrote what line)
- **Prettier** (auto code formatting)

---

### 5. Docker Desktop

Download from: https://www.docker.com/products/docker-desktop/  
Install and start Docker Desktop. You won't use it heavily this week but it needs to be installed.

Verify:
```
docker --version
```
Expected: `Docker version 24.x.x`

---

### 6. Anaconda (for Jupyter notebooks — ML track)

Download from: https://www.anaconda.com/download  
This installs Jupyter Notebook, which you need for the EDA on Day 6.

After install, verify in **Anaconda Prompt**:
```
jupyter --version
```

---

## Day 1 — Git & GitHub Setup

**All 3 people do this together — ~2 hrs**  
One person creates the repo, the other two get added as collaborators.

---

### Step 1 — Create GitHub repo (Person A does this)

1. Go to https://github.com and sign in
2. Click **New repository**
3. Name it: `skinfusenet`
4. Set to **Public**
5. Check **Add a README file**
6. Check **Add .gitignore** → select **Python** from the dropdown
7. Click **Create repository**

---

### Step 2 — Add collaborators (Person A does this)

1. Go to your repo → **Settings** → **Collaborators**
2. Click **Add people**
3. Add Person B and Person C by their GitHub usernames
4. They will get an email — they must accept the invite

---

### Step 3 — Clone the repo (All 3 people)

Open Command Prompt, navigate to where you want the project:
```
cd C:\Users\YourName\Documents
git clone https://github.com/PERSON_A_USERNAME/skinfusenet.git
cd skinfusenet
```

Open in VS Code:
```
code .
```

---

### Step 4 — Understand the .gitignore

Open `.gitignore` in VS Code. It already ignores common Python files. Add these lines at the bottom:

```
# Dataset and model files — too large for GitHub
ml/data/raw/
ml/data/processed/
ml/data/masks/
ml/checkpoints/
*.pth
*.pt
*.h5

# Environment folders
venv/
node_modules/
__pycache__/
.env

# Jupyter checkpoints
.ipynb_checkpoints/

# OS files
.DS_Store
Thumbs.db
```

Save the file, then commit:
```
git add .gitignore
git commit -m "docs: update gitignore for ML and node files"
git push
```

---

### Step 5 — Practice Git basics (All 3 people individually)

Each person creates their own branch, makes a small change, and pushes it.

**Person A:**
```
git checkout -b setup/person-a-intro
```
Create a file `team/person_a.md` with your name and role.
```
git add team/person_a.md
git commit -m "docs: add Person A intro"
git push origin setup/person-a-intro
```
Then go to GitHub → open a Pull Request → merge it.

**Person B and C** do the same with `setup/person-b-intro` and `setup/person-c-intro`.

After all 3 are merged:
```
git checkout main
git pull
```
All 3 people now have the same codebase on their laptops. ✅

---

### What you learned today
- How to create a repo and add collaborators
- How to clone, branch, commit, push, and pull
- What .gitignore does and why large files must not be committed
- How to open a Pull Request and merge it

---

## Day 2 — Create the Monorepo

**All 3 people do this together — ~2 hrs**  
One person creates the folder structure, commits it, everyone pulls.

---

### Step 1 — Create all folders (Person B does this)

Open VS Code terminal (Ctrl+` ) and run:

```
# Make all ML folders
mkdir ml
mkdir ml\src
mkdir ml\src\branches
mkdir ml\src\preprocess
mkdir ml\data
mkdir ml\data\raw
mkdir ml\data\processed
mkdir ml\data\masks
mkdir ml\checkpoints
mkdir ml\logs
mkdir ml\notebooks

# Make all Backend folders
mkdir backend
mkdir backend\app
mkdir backend\app\routers
mkdir backend\app\services
mkdir backend\app\schemas
mkdir backend\app\core
mkdir backend\models

# Make all Frontend folders
mkdir frontend
mkdir frontend\src
mkdir frontend\src\components
mkdir frontend\src\hooks
mkdir frontend\src\api
mkdir frontend\src\pages

# Make paper folder
mkdir paper

# Make team folder
mkdir team
```

---

### Step 2 — Create placeholder files

Git doesn't track empty folders, so create a `.gitkeep` file in each data folder:

```
type nul > ml\data\raw\.gitkeep
type nul > ml\data\processed\.gitkeep
type nul > ml\data\masks\.gitkeep
type nul > ml\checkpoints\.gitkeep
type nul > backend\models\.gitkeep
```

Create empty Python files so the structure is visible:
```
type nul > ml\src\dataset.py
type nul > ml\src\train.py
type nul > ml\src\evaluate.py
type nul > ml\src\export.py
type nul > ml\src\gradcam.py
type nul > ml\src\fusion.py
type nul > ml\src\model.py
type nul > ml\src\loss.py
type nul > ml\src\branches\cnn.py
type nul > ml\src\branches\vit.py
type nul > ml\src\branches\bert.py
type nul > ml\src\preprocess\sam_preprocess.py
type nul > ml\src\preprocess\clahe.py
type nul > ml\src\preprocess\augmentation.py
type nul > backend\app\main.py
type nul > backend\app\routers\predict.py
type nul > backend\app\services\inference.py
type nul > backend\app\services\preprocess.py
type nul > backend\app\services\image_utils.py
type nul > backend\app\schemas\predict.py
type nul > backend\app\core\model_loader.py
```

---

### Step 3 — Commit and push (Person B)

```
git add .
git commit -m "feat: create full monorepo folder structure"
git push
```

**Person A and C pull:**
```
git pull
```

Everyone opens VS Code and confirms they see the same folder structure. ✅

---

### Step 4 — Set up Python virtual environment (All 3 independently)

Each person sets up their own local virtual environment. This is NOT committed to Git.

**ML environment:**
```
cd ml
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` appear at the start of your terminal line.

Create `ml\requirements.txt`:
```
torch==2.0.1
torchvision==0.15.2
transformers==4.35.0
segment-anything
opencv-python==4.8.0.76
albumentations==1.3.1
grad-cam==1.4.8
wandb
pyyaml
scikit-learn
pandas
matplotlib
seaborn
tqdm
numpy
timm
jupyter
ipykernel
```

Install everything:
```
pip install -r requirements.txt
```
⚠️ This will take 10–15 minutes. The PyTorch install is large.

**Backend environment (do this separately):**
```
cd ..\backend
python -m venv venv
venv\Scripts\activate
```

Create `backend\requirements.txt`:
```
fastapi==0.104.0
uvicorn[standard]
python-multipart
pydantic==2.4.2
pillow
numpy
torch==2.0.1
torchvision==0.15.2
transformers==4.35.0
opencv-python-headless==4.8.0.76
grad-cam==1.4.8
```

Install:
```
pip install -r requirements.txt
```

---

## Day 3 — ML Track: Python & PyTorch Basics

**All 3 people · self-study + hands-on · ~3 hrs**

---

### Concepts to understand first (30 mins)

Read these short explanations before touching any code:

**What is a tensor?**  
A tensor is just a multi-dimensional array with a data type and a device (CPU or GPU).
- A single number → shape `[]`
- A list of 5 numbers → shape `[5]`
- A grayscale image (256×256) → shape `[256, 256]`
- An RGB image → shape `[3, 256, 256]` (channels first in PyTorch)
- A batch of 32 RGB images → shape `[32, 3, 256, 256]`

Shape is everything. If shapes don't match, the code crashes. Print shapes constantly.

**What is a forward pass?**  
You feed an image tensor into a model. The model does a series of mathematical operations and outputs a prediction. This is called the forward pass.

**What is loss?**  
A number that measures how wrong the model's prediction was. Lower = better. 0 = perfect.

**What is backpropagation?**  
After computing loss, PyTorch traces back through every operation and figures out how much each weight contributed to the error. This is automatic — you just call `loss.backward()`.

**What is an optimizer?**  
It reads the gradients computed by backprop and nudges the weights slightly in the direction that reduces loss. AdamW is the optimizer we use.

**One training step in plain English:**
1. Load a batch of images
2. Forward pass → get predictions
3. Compute loss vs true labels
4. Backward pass → compute gradients
5. Optimizer step → update weights
6. Repeat for all batches = 1 epoch

---

### Hands-on practice (open Jupyter Notebook)

Activate ML venv, then:
```
cd ml
venv\Scripts\activate
jupyter notebook
```

Create a new notebook in `ml\notebooks\` called `pytorch_basics.ipynb`

**Exercise 1 — Create and inspect tensors:**
```python
import torch

# Create tensors
a = torch.tensor([1.0, 2.0, 3.0])
b = torch.zeros(3, 256, 256)       # blank grayscale image
c = torch.randn(32, 3, 256, 256)   # batch of 32 random RGB images

# Always print shape
print(a.shape)    # torch.Size([3])
print(b.shape)    # torch.Size([3, 256, 256])
print(c.shape)    # torch.Size([32, 3, 256, 256])
print(c.dtype)    # torch.float32
```

**Exercise 2 — Load a real image as a tensor:**
```python
from PIL import Image
import torchvision.transforms as T

# Use any .jpg image from HAM10000 (or any image for now)
img = Image.open(r"C:\path\to\any\image.jpg")
print("Original size:", img.size)   # (width, height)

transform = T.Compose([
    T.Resize((256, 256)),
    T.ToTensor(),           # converts to [3, 256, 256] and scales to 0-1
])

tensor = transform(img)
print("Tensor shape:", tensor.shape)   # torch.Size([3, 256, 256])
print("Min value:", tensor.min())      # ~0.0
print("Max value:", tensor.max())      # ~1.0
```

**Exercise 3 — Load a pretrained model and run a forward pass:**
```python
import timm

# Load EfficientNetV2 pretrained on ImageNet
model = timm.create_model('efficientnetv2_s', pretrained=True)
model.eval()

# Create a fake batch of 1 image
x = torch.randn(1, 3, 256, 256)

with torch.no_grad():
    output = model(x)

print("Output shape:", output.shape)   # torch.Size([1, 1000])
# 1000 classes = ImageNet classes
# We will change this to 7 classes later
```

**Exercise 4 — Understand class imbalance:**
```python
import pandas as pd
import matplotlib.pyplot as plt

# Load metadata CSV (update path to where you downloaded it)
df = pd.read_csv(r"C:\path\to\HAM10000_metadata.csv")

print(df.head())
print(df.columns.tolist())
print(df['dx'].value_counts())

# Plot class distribution
df['dx'].value_counts().plot(kind='bar', color='steelblue')
plt.title("HAM10000 Class Distribution")
plt.xlabel("Lesion Class")
plt.ylabel("Number of Images")
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

# What accuracy does a dumb model get?
most_common_count = df['dx'].value_counts().iloc[0]
total = len(df)
print(f"\nDumb model accuracy (always predict NV): {most_common_count/total*100:.1f}%")
```

---

### What you learned today
- Tensors have shapes — print shapes constantly
- One image = `[3, 256, 256]`, one batch = `[32, 3, 256, 256]`
- A pretrained model outputs `[1, 1000]` — we'll change 1000 to 7
- NV has 6705 images, DF has 115 — a dumb model gets 67% by cheating

---

## Day 4 — Backend Track: FastAPI Basics

**All 3 people · self-study + hands-on · ~2.5 hrs**

---

### Concepts to understand first (20 mins)

**What is a web server?**  
A program that runs on a port (like 8000) and waits for requests. When a request arrives, it does something and sends back a response.

**What is HTTP?**  
The language browsers and apps use to talk to servers. Two main methods:
- `GET` — fetch data (no body, just a URL)
- `POST` — send data to the server (has a body with data attached)

**What is JSON?**  
A text format for structured data. Looks like a Python dictionary:
```json
{ "name": "Sameer", "age": 21, "class": "MEL" }
```

**What is a status code?**
- `200` — OK, worked
- `400` — Bad request (your fault — wrong data sent)
- `422` — Unprocessable entity (FastAPI specific — missing field)
- `500` — Server error (server's fault)

**What is CORS?**  
Your React app runs on port 5173. Your backend runs on port 8000. Browsers block requests between different ports by default for security. CORS (Cross-Origin Resource Sharing) is a setting on the backend that says "I allow requests from port 5173." Without this, every axios call from React will fail with a network error.

---

### Hands-on practice

Open a new VS Code terminal, activate backend venv:
```
cd backend
venv\Scripts\activate
```

Create `backend\app\main.py` and write this from scratch (don't copy-paste — type it out):

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SkinFuseNet API", version="1.0.0")

# Allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "SkinFuseNet API is running"}

@app.get("/hello/{name}")
def say_hello(name: str):
    return {"message": f"Hello {name}!"}
```

Run the server:
```
uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Test it:**

Open browser → `http://localhost:8000/health`  
You should see: `{"status":"ok","message":"SkinFuseNet API is running"}`

Open browser → `http://localhost:8000/hello/Sameer`  
You should see: `{"message":"Hello Sameer!"}`

Open browser → `http://localhost:8000/docs`  
You should see the Swagger UI — an interactive API tester.

---

### Add a POST endpoint that accepts JSON

Add this to `main.py`:

```python
from pydantic import BaseModel

class PatientData(BaseModel):
    age: int
    sex: str
    localization: str

@app.post("/test-patient")
def test_patient(data: PatientData):
    return {
        "received": {
            "age": data.age,
            "sex": data.sex,
            "localization": data.localization
        },
        "message": "Data received successfully"
    }
```

Go to `http://localhost:8000/docs` → click `POST /test-patient` → click **Try it out** → enter:
```json
{
  "age": 45,
  "sex": "male",
  "localization": "back"
}
```
Click **Execute** → you should see your data echoed back.

---

### What you learned today
- How to create a FastAPI app with 3 lines
- Difference between GET and POST
- How to test endpoints in Swagger UI without writing any frontend code
- What CORS is and why it's needed
- How Pydantic validates incoming data automatically

---

## Day 5 — Frontend Track: React Basics

**All 3 people · self-study + hands-on · ~3 hrs**

---

### Concepts to understand first (20 mins)

**What is a component?**  
A reusable piece of UI. A button, a form, a card — each is its own component. Components are just JavaScript functions that return HTML-like code (called JSX).

**What is JSX?**  
HTML written inside JavaScript. Looks familiar but has small differences — `class` becomes `className`, all tags must be closed.

**What is useState?**  
React's way of storing values that can change. When the value changes, the component re-renders (updates on screen) automatically.

```jsx
const [count, setCount] = useState(0)
// count = current value
// setCount = function to update it
// 0 = starting value
```

**What is props?**  
Data you pass from a parent component to a child component. Like function arguments but for components.

**What is Tailwind CSS?**  
Instead of writing CSS files, you add class names directly to HTML elements. `bg-blue-500` = blue background. `p-4` = padding. `rounded-lg` = rounded corners.

---

### Hands-on practice

Open a new VS Code terminal:
```
cd frontend
npm create vite@latest . -- --template react
npm install
npm install axios recharts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Update `tailwind.config.js`:
```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

Replace the contents of `src\index.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Run the dev server:
```
npm run dev
```

Open browser → `http://localhost:5173` → you should see the default Vite + React page.

---

### Exercise 1 — Build a counter component

Replace `src\App.jsx` with:
```jsx
import { useState } from "react"

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 shadow text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          SkinFuseNet
        </h1>
        <p className="text-gray-500 mb-6">Count: {count}</p>
        <button
          onClick={() => setCount(count + 1)}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Click me
        </button>
      </div>
    </div>
  )
}

export default App
```

Save → browser auto-updates. Click the button and watch count increase.

---

### Exercise 2 — Build a file input with preview

Create `src\components\ImageUpload.jsx`:
```jsx
import { useState } from "react"

function ImageUpload() {
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return

    // Validate type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Only JPEG and PNG files allowed")
      setPreview(null)
      return
    }

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB")
      setPreview(null)
      return
    }

    setError(null)
    setPreview(URL.createObjectURL(file))
  }

  return (
    <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl text-center">
      <input type="file" accept=".jpg,.jpeg,.png" onChange={handleFile} />

      {error && (
        <p className="text-red-500 mt-2 text-sm">{error}</p>
      )}

      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="mt-4 mx-auto max-h-48 rounded-lg"
        />
      )}
    </div>
  )
}

export default ImageUpload
```

Import and use it in `App.jsx`:
```jsx
import ImageUpload from "./components/ImageUpload"

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">SkinFuseNet</h1>
      <ImageUpload />
    </div>
  )
}

export default App
```

Try uploading an image — see the preview. Try a non-image file — see the error.

---

### Exercise 3 — Make a fake API call with axios

Create `src\api\predict.js`:
```js
import axios from "axios"

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

export async function callHealthCheck() {
  const { data } = await axios.get(`${BASE}/health`)
  return data
}
```

Create `.env` in the `frontend` folder:
```
VITE_API_URL=http://localhost:8000
```

Update `App.jsx` to call the health endpoint:
```jsx
import { useState } from "react"
import axios from "axios"
import ImageUpload from "./components/ImageUpload"

function App() {
  const [apiStatus, setApiStatus] = useState(null)

  async function checkAPI() {
    try {
      const { data } = await axios.get("http://localhost:8000/health")
      setApiStatus(data.status)
    } catch (e) {
      setApiStatus("error — is the backend running?")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">SkinFuseNet</h1>
      <ImageUpload />
      <button
        onClick={checkAPI}
        className="mt-4 bg-green-500 text-white px-6 py-2 rounded-lg"
      >
        Check Backend
      </button>
      {apiStatus && (
        <p className="mt-2 text-gray-700">Backend status: {apiStatus}</p>
      )}
    </div>
  )
}

export default App
```

Make sure backend is running in a separate terminal (`uvicorn app.main:app --reload`), then click the button.  
You should see: `Backend status: ok`

---

### What you learned today
- Components are functions that return JSX
- useState stores values that update the UI when they change
- Axios makes HTTP calls from the browser
- Tailwind CSS = utility classes directly on elements

---

## Day 6 — Download HAM10000 & Run EDA

**All 3 people · ~2.5 hrs**

---

### Step 1 — Set up Kaggle API

1. Go to https://www.kaggle.com → sign in → click your profile picture → **Settings**
2. Scroll to **API** section → click **Create New Token**
3. A file called `kaggle.json` downloads
4. Move it to: `C:\Users\YourName\.kaggle\kaggle.json`

If `.kaggle` folder doesn't exist, create it:
```
mkdir C:\Users\YourName\.kaggle
```

Install Kaggle CLI (in ML venv):
```
cd ml
venv\Scripts\activate
pip install kaggle
```

---

### Step 2 — Download the dataset

```
kaggle datasets download -d kmader/skin-lesion-analysis-toward-melanoma-detection -p data\raw
```

This downloads a .zip file (~3.5GB). Extract it:
```
cd data\raw
tar -xf skin-lesion-analysis-toward-melanoma-detection.zip
```

After extraction you should have:
```
ml\data\raw\
├── HAM10000_images_part_1\     ← 5000 images
├── HAM10000_images_part_2\     ← 5015 images
└── HAM10000_metadata.csv       ← labels and patient data
```

Verify the count:
```python
import os
part1 = len(os.listdir(r"ml\data\raw\HAM10000_images_part_1"))
part2 = len(os.listdir(r"ml\data\raw\HAM10000_images_part_2"))
print(f"Part 1: {part1} images")
print(f"Part 2: {part2} images")
print(f"Total: {part1 + part2} images")
# Expected: Total: 10015 images
```

---

### Step 3 — Run the EDA notebook

Open Jupyter:
```
cd ml
venv\Scripts\activate
jupyter notebook
```

Create `notebooks\week1_eda.ipynb` and run each cell:

**Cell 1 — Load metadata:**
```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

df = pd.read_csv(r"data\raw\HAM10000_metadata.csv")
print("Shape:", df.shape)
print("\nColumns:", df.columns.tolist())
print("\nFirst 5 rows:")
df.head()
```

**Cell 2 — Class distribution:**
```python
class_counts = df['dx'].value_counts()
print("Class distribution:")
print(class_counts)
print(f"\nTotal images: {len(df)}")
print(f"\nMost common: {class_counts.index[0]} ({class_counts.iloc[0]} images, {class_counts.iloc[0]/len(df)*100:.1f}%)")
print(f"Least common: {class_counts.index[-1]} ({class_counts.iloc[-1]} images, {class_counts.iloc[-1]/len(df)*100:.1f}%)")
```

**Cell 3 — Plot class distribution:**
```python
plt.figure(figsize=(10, 5))
colors = ['#e74c3c' if c in ['MEL', 'BCC', 'AKIEC'] else '#3498db' for c in class_counts.index]
class_counts.plot(kind='bar', color=colors)
plt.title("HAM10000 Class Distribution\n(Red = Malignant/High-risk, Blue = Benign)")
plt.xlabel("Lesion Class")
plt.ylabel("Number of Images")
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig("notebooks\class_distribution.png")
plt.show()
```

**Cell 4 — Patient metadata stats:**
```python
print("Age distribution:")
print(df['age'].describe())

print("\nSex distribution:")
print(df['sex'].value_counts())

print("\nLocalization distribution:")
print(df['localization'].value_counts())
```

**Cell 5 — Display sample images:**
```python
from PIL import Image
import matplotlib.pyplot as plt

# Find image paths
def find_image(image_id):
    for folder in ['HAM10000_images_part_1', 'HAM10000_images_part_2']:
        path = fr"data\raw\{folder}\{image_id}.jpg"
        if os.path.exists(path):
            return path
    return None

# Show 2 images from each class
classes = df['dx'].unique()
fig, axes = plt.subplots(len(classes), 2, figsize=(8, 20))

for i, cls in enumerate(classes):
    samples = df[df['dx'] == cls].head(2)
    for j, (_, row) in enumerate(samples.iterrows()):
        img_path = find_image(row['image_id'])
        if img_path:
            img = Image.open(img_path)
            axes[i, j].imshow(img)
            axes[i, j].set_title(f"{cls}\nAge:{row['age']} Sex:{row['sex']}", fontsize=8)
            axes[i, j].axis('off')

plt.tight_layout()
plt.savefig("notebooks\sample_images.png")
plt.show()
```

Save the notebook. This is your EDA — keep it in the repo.

---

## Day 7 — Cross-teach + Write API Contract

**All 3 people together — ~3 hrs**

---

### Step 1 — Cross-teaching (1.5 hrs)

Each person has 20 minutes to teach the other two what they explored this week. No slides needed — just open your code and explain it.

**Questions each person should be able to answer:**

Person A explains ML:
- What is the shape of one HAM10000 image as a tensor?
- Why does NV having 6705 images cause a problem?
- What does `model.eval()` do vs `model.train()`?

Person B explains Backend:
- What happens when the frontend sends a POST request to `/predict`?
- What does the `@app.post` decorator do?
- Why do we need CORS middleware?

Person C explains Frontend:
- What does `useState` return and what are the two parts?
- Why do we NOT set `Content-Type` manually in axios?
- What does `npm run dev` do?

---

### Step 2 — Write the API Contract (30 mins)

Create `team\API_CONTRACT.md` together — all 3 people agree on every field:

```markdown
# SkinFuseNet API Contract
## Agreed by all 3 team members — DO NOT CHANGE without team discussion

### POST /predict

**Request** — multipart/form-data

| Field        | Type   | Required | Validation          | Example         |
|--------------|--------|----------|---------------------|-----------------|
| image        | File   | Yes      | JPEG/PNG, max 10MB  | lesion.jpg      |
| age          | int    | Yes      | 1 to 120            | 45              |
| sex          | string | Yes      | "male" or "female"  | "male"          |
| localization | string | Yes      | see 13 options below| "back"          |

**Valid localization values:**
back, lower extremity, trunk, upper extremity, abdomen,
face, hand, foot, scalp, neck, ear, genital, acral

**Response** — application/json 200 OK

{
  "predicted_class": "MEL",
  "confidence": 0.87,
  "probabilities": {
    "MEL": 0.87,
    "NV": 0.06,
    "BKL": 0.03,
    "BCC": 0.02,
    "AKIEC": 0.01,
    "DF": 0.005,
    "VASC": 0.005
  },
  "gradcam_image": "<base64 encoded PNG string>"
}

**Error responses:**
400 — image is not JPEG or PNG
413 — image exceeds 10MB
422 — missing required field
500 — model inference failed

### GET /health

**Response** — 200 OK
{ "status": "ok", "model_loaded": true }
```

Commit this:
```
git add team\API_CONTRACT.md
git commit -m "docs: add agreed API contract"
git push
```

---

### Step 3 — Week 1 review (30 mins)

Each person answers these 3 questions out loud:
1. What did I actually finish this week?
2. What am I still confused about?
3. What do I need to understand better before week 2?

Write the answers in `team\week1_review.md` and commit it. This becomes your record of progress.

---

## Week 1 Checklist

Go through every item. All must be ticked before starting Week 2.

### Git & Setup
- [ ] GitHub repo created and all 3 people have push access
- [ ] All 3 laptops have the repo cloned
- [ ] .gitignore is correct — data and model files excluded
- [ ] All 3 people have done at least one commit, push, and pull
- [ ] Monorepo folder structure is on GitHub

### Environment
- [ ] Python 3.10+ installed and in PATH
- [ ] Node 18+ installed
- [ ] ML virtual environment created with all packages installed
- [ ] Backend virtual environment created with all packages installed
- [ ] `torch.cuda.is_available()` returns True (if you have a GPU)
- [ ] All VS Code extensions installed

### ML
- [ ] HAM10000 downloaded — 10,015 images + CSV
- [ ] EDA notebook runs without errors
- [ ] Class distribution chart saved
- [ ] Sample images from all 7 classes displayed
- [ ] Can load one image as a tensor with correct shape `[3, 256, 256]`
- [ ] Can pass a tensor through pretrained EfficientNetV2 and get output shape `[1, 1000]`

### Backend
- [ ] FastAPI server starts with `uvicorn app.main:app --reload`
- [ ] `/health` endpoint returns `{"status": "ok"}`
- [ ] Swagger UI loads at `http://localhost:8000/docs`
- [ ] Can send a POST request from Swagger and get a response

### Frontend
- [ ] React app runs at `http://localhost:5173`
- [ ] ImageUpload component shows a thumbnail preview
- [ ] File type and size validation works with error messages
- [ ] Clicking "Check Backend" button shows `Backend status: ok`

### Team
- [ ] API contract written and committed to `team\API_CONTRACT.md`
- [ ] Week 1 review written in `team\week1_review.md`
- [ ] Each person can explain their track to the other two

---

## Common Errors & Fixes

### Python not found
```
'python' is not recognized as an internal or external command
```
**Fix:** Python was not added to PATH during install. Uninstall Python and reinstall — on the first screen, check **"Add Python to PATH"** before clicking Install.

---

### pip install fails with SSL error
```
SSL: CERTIFICATE_VERIFY_FAILED
```
**Fix:**
```
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt
```

---

### PyTorch CUDA not available
```python
torch.cuda.is_available()  # returns False
```
**Fix:** You installed the CPU version of PyTorch. Reinstall with CUDA:
```
pip uninstall torch torchvision
pip install torch==2.0.1 torchvision==0.15.2 --index-url https://download.pytorch.org/whl/cu118
```

---

### uvicorn not found
```
'uvicorn' is not recognized
```
**Fix:** Your backend virtual environment is not activated.
```
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

---

### npm run dev fails — ENOENT
```
Error: ENOENT: no such file or directory, open 'package.json'
```
**Fix:** You are not inside the frontend folder.
```
cd frontend
npm run dev
```

---

### Axios call fails with CORS error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Fix:** Backend CORS middleware is not set up correctly, or backend is not running. Check that `allow_origins` includes `"http://localhost:5173"` in `main.py`.

---

### Git push rejected
```
error: failed to push some refs
```
**Fix:** Someone else pushed first. Pull their changes first:
```
git pull
git push
```

---

## Resources

### ML / PyTorch
| Resource | Link | What it covers |
|----------|------|----------------|
| PyTorch in 100 seconds | https://youtu.be/ORMx45xqWkA | Quick intuition |
| CampusX PyTorch (Hindi) | YouTube → search "CampusX PyTorch" | Full course in Hindi |
| HAM10000 paper | https://arxiv.org/abs/1803.10417 | Dataset background |
| timm documentation | https://timm.fast.ai | EfficientNetV2 pretrained models |

### Backend / FastAPI
| Resource | Link | What it covers |
|----------|------|----------------|
| FastAPI official tutorial | https://fastapi.tiangolo.com/tutorial | Best beginner docs |
| Traversy FastAPI crash course | YouTube → search "Traversy FastAPI" | 1 hr practical intro |

### Frontend / React
| Resource | Link | What it covers |
|----------|------|----------------|
| React official docs | https://react.dev/learn | Official beginner guide |
| Traversy React crash course | YouTube → search "Traversy React 2024" | Practical intro |
| Tailwind CSS docs | https://tailwindcss.com/docs | All utility classes |

### Git
| Resource | Link | What it covers |
|----------|------|----------------|
| Git in 100 seconds | https://youtu.be/hwP7WQkmECE | Quick overview |
| GitHub Skills | https://skills.github.com | Interactive practice |

---

> **Next up → Week 2:** PyTorch deep dive, write `dataset.py`, class imbalance handling, SAM preprocessing on first image, mock `/predict` endpoint, React upload + form components.

---

<p align="center">SkinFuseNet · Week 1 · All 3 team members</p>