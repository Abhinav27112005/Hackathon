# 🎬 NitiSetu — Video Presentation Guide

> A step-by-step script to record a polished, professional demo video covering every feature of NitiSetu.

---

## 🛠️ Setup Before Recording

### Tools You'll Need
| Tool | Purpose | Free? |
|------|---------|-------|
| **OBS Studio** | Screen recording + mic | ✅ Free |
| **Loom** | Quick browser recording with face cam | ✅ Free (basic) |
| **DaVinci Resolve** | Video editing, cuts, captions | ✅ Free |
| **Canva** | Intro/Outro slide | ✅ Free |

### Before You Hit Record
1. Start both servers: `npm run dev` in `frontend/` and `backend/`
2. Make sure the DB has at least **1–2 scheme PDFs** uploaded and processed
3. Have a test user account ready (or pre-register during the video)
4. Set your browser zoom to **90%** for a comfortable view
5. Close all notifications (Do Not Disturb mode)
6. Use **1920×1080** resolution, **16:9** aspect ratio
7. Prepare a quiet room — voiceover adds huge value

---

## 🎥 Video Structure (Target: 5–8 minutes)

---

### 🟢 SEGMENT 1 — Intro & Problem Statement (30 sec)

**What to show:** A screen with your Canva intro slide, or just the NitiSetu landing page.

**Script:**
> *"India has over 5,000 government schemes for farmers — but most farmers don't even know what they're eligible for, because the application process is complex, documents are in PDF format, and often in English. NitiSetu solves this using AI."*

**Actions:**
- Show the **Landing Page** (`/`)
- Scroll slowly through the features section
- Click the **"Get Started"** CTA button

---

### 🟢 SEGMENT 2 — Registration & Login (45 sec)

**What to show:** Register page → OTP/password login → redirect to profile setup.

**Script:**
> *"A farmer can register with just their phone number. OTP verification ensures security without needing an email address."*

**Actions:**
1. Navigate to `/register`
2. Enter name, phone number, create account
3. Show the OTP verification step
4. Log in at `/login` with the same credentials

---

### 🟢 SEGMENT 3 — Profile Setup (Voice + Form) (60 sec)


**What to show:** The multi-step profile form, highlighting the Voice Input feature.

**Script:**
> *"Now here's where NitiSetu gets powerful. A farmer can simply speak their details in Hindi or English — our AI extracts all the structured data automatically."*

**Actions:**
1. Navigate to `/profile-setup`
2. Click **🎤 Speak Your Details** 
3. Say something like: *"My name is Ramesh Kumar, age 42, from Jhansi district in Uttar Pradesh, OBC category, I have 2 acres of land, I grow wheat and rice, my annual income is 80,000 rupees"*
4. Show the AI pre-filling the form fields after voice input
5. Walk through the 4 steps: **Personal → Location → Farm → Financial**
6. Click **Save Profile** and show the redirect to Dashboard

---

### 🟢 SEGMENT 4 — Dashboard Overview (45 sec)

**What to show:** The main dashboard with stats and eligibility results.

**Script:**
> *"The dashboard gives a farmer their complete picture at a glance — eligible schemes, potential benefit amounts, and recent activity."*

**Actions:**
1. Show the **Welcome Banner** with name and profile completeness bar
2. Point to the **Stat Cards** (Eligible Schemes, Potential Benefit, Total Checks)
3. Show the **Quick Links** grid at the bottom
4. Click **🤖 Check All Schemes** and show the loading animation

---

### 🟢 SEGMENT 5 — Scheme Browser (60 sec)

**What to show:** The schemes list page with search, filter, and status indicators.

**Script:**
> *"Admins can upload government scheme PDFs. NitiSetu's AI pipeline automatically processes them — chunking the text and building a searchable knowledge base."*

**Actions:**
1. Navigate to `/schemes`
2. Show the scheme cards with processing status badges (✅ Ready / ⚙️ Processing)
3. Type a search query like **"PM Kisan"** — show live filter
4. Click the **status filter chips** (Ready / Processing / Failed)
5. Click **View Details** on a scheme

---

### 🟢 SEGMENT 6 — Scheme Detail & Eligibility Check (60 sec)

**What to show:** The scheme detail page and the one-click eligibility button.

**Script:**
> *"On the scheme details page, we can see the PDF metadata — pages, AI chunks, the official document itself. And with one click, the AI reads the scheme PDF and checks if this specific farmer qualifies."*

**Actions:**
1. Show the `/schemes/:id` page
2. Point to: name, ministry, status, pages, chunks
3. Click the **"Check My Eligibility"** button
4. Show the loading spinner (AI work happening)
5. Navigate to the Results page automatically

---

### 🟢 SEGMENT 7 — Eligibility Results (45 sec)

**What to show:** The results page with eligibility decision, confidence score, and documents needed.

**Script:**
> *"The AI returns a clear decision — Eligible, Likely Eligible, or Not Eligible — along with reasoning, required documents, and next steps. No jargon, just actionable information."*

**Actions:**
1. Show the Results hero card (green/red gradient based on result)
2. Point to **Confidence Score** and **Eligibility Reason**
3. Show the **Required Documents** list
4. Show the **Application Form** button if eligible

---

### 🟢 SEGMENT 8 — Applications Page (30 sec)

**What to show:** The auto-filled application form, print functionality.

**Script:**
> *"If eligible, NitiSetu auto-fills the government application form using the farmer's profile data. They can print it and submit it at their nearest Common Service Centre."*

**Actions:**
1. Navigate to `/applications`
2. Show applications listed with status chips (Draft / Submitted / Approved)
3. Click **View Form** on a draft application
4. Show the auto-filled form at `/applications/:id`
5. Click **🖨️ Print / Save PDF**

---

### 🟢 SEGMENT 9 — Upload Scheme PDF (30 sec)

**What to show:** The upload interface and the real-time processing status.

**Script:**
> *"Government officials or administrators can upload any scheme PDF. Our system automatically processes it in the background."*

**Actions:**
1. Navigate to `/upload-scheme`
2. Drag and drop a PDF file (or click to browse)
3. Fill scheme name and short name
4. Click Upload — show the progress and toast notification
5. Show the scheme appearing in the list below with status "⏳ Queued" → then "⚙️ Processing"

---

### 🟢 SEGMENT 10 — Tech Stack Slide / Closing (30 sec)

**What to show:** A simple slide or bullet list on screen.

**Script:**
> *"NitiSetu is built with React + TypeScript on the frontend, Node.js + Express + MongoDB on the backend, and uses a RAG (Retrieval-Augmented Generation) pipeline with vector embeddings for AI accuracy. It supports voice input in Hindi and English via the Web Speech API."*

- Show the **Architecture** briefly
- End with the landing page
- Fade to Outro

---

## 🎙️ Recording Tips

### Audio
- Use a headset or clip-on mic (avoid laptop mic — too much echo)
- Record in a quiet room
- Speak slowly and clearly — ~120 words per minute

### Video
- Use **1080p @ 30fps** minimum
- Keep the window maximized
- In OBS: add a crop filter to remove taskbar

### Editing Checklist
- [ ] Cut out long loading waits
- [ ] Add **zoom-in** on important buttons/text
- [ ] Add **lower thirds** (text labels) for page names
- [ ] Add background music (soft, low volume) — search "royalty free lo-fi" on YouTube
- [ ] Add **intro slide** (Canva template) and **outro** with your name

### Ideal Video Length
| For... | Target Duration |
|--------|----------------|
| Hackathon demo (judges) | **5–7 minutes** |
| YouTube / LinkedIn showcase | **8–12 minutes** |
| Quick explainer | **2–3 minutes** (demo reel only) |

---

## 📋 Feature Checklist (tick off as you demo each one)

- [ ] Landing page with CTA
- [ ] User Registration (`/register`)
- [ ] OTP Login (`/login`)
- [ ] **Voice Profile Input** (🎤 biggest differentiator — show first!)
- [ ] Manual Profile Form (4 steps)
- [ ] Dashboard (stats, quick links, check-all)
- [ ] Schemes Browser (search + filter)
- [ ] Scheme Detail page
- [ ] **One-click Eligibility Check** (AI core feature)
- [ ] Results page (eligibility decision + docs needed)
- [ ] Applications page (list + status)  
- [ ] Auto-filled Application Form
- [ ] Print to PDF
- [ ] Upload Scheme PDF
- [ ] Real-time processing status (auto-polling)

---

*Good luck with your presentation! 🚀 — Remember: lead with the Voice Input and AI features, as those are your biggest differentiators.*
