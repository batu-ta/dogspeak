# DogSpeak 🐾

An immersive, interactive web application designed for the **DEV.to Weekend Challenge: Dog Days Edition**. 

DogSpeak combines **Vanilla CSS Art** and real-time **Web Audio API sound synthesis** to create an engaging, educational sandbox demonstrating dog body language, emotional signals, and vocalizations.

---

## 🌟 Key Features

### 1. Interactive CSS Art Dog
The main viewport displays a dog designed entirely with semantic CSS shapes and keyframe animations.
- **Dynamic Ears:** Hovering or clicking on the ears perks them up or folds them back based on the dog's state.
- **Blinking Eyes:** Built-in organic blinking cycle using CSS `@keyframes scaleY` transformations.
- **Barking Mouth:** The mouth scales up dynamically when a bark vocalization is triggered.

### 2. Tail Physics Sandbox
Adjust the excitement slider (0% to 100%) to observe calculated tail postures:
- **0% - 20%:** Tucked / Fearful (Tail curves inward, ears fold back).
- **21% - 50%:** Relaxed / Friendly (Slow, gentle side-to-side wag).
- **51% - 80%:** Excited / Playful (Medium wagging speed, perked ears, starts panting).
- **81% - 100%:** Pure Joy / Helicopter (Rapid helicopter-rotation wag, fast panting).

### 3. Procedural Audio Engine (Web Audio API)
No heavy audio files (`.mp3` or `.wav`) are loaded. All canine vocalizations are synthesized procedurally in real-time in the browser:
- **Happy Bark:** Synthesized using a triangle wave with a fast pitch decay envelope, mixed with bandpass-filtered white noise.
- **Playful Growl:** A deep sawtooth wave modulated by an LFO (vibrato) and filtered to create a deep chesty rumble.
- **Whimper / Whine:** High-pitched sine wave with a crying LFO frequency vibrato and volume envelopes.
- **Panting:** Loop of rapid white noise bursts modulated by dynamic interval timers connected to the excitement slider.

### 4. Canine Matcher Quiz
An interactive questionnaire that analyzes your weekend lifestyle, space constraints, and bonding preferences to match you with your ideal dog breed (Golden Retriever, French Bulldog, Shiba Inu, or Border Collie).

### 5. Color Themes
Includes three canine-inspired HSL presets:
- **☀️ Sunny Park:** Golden yellow tones with warm park green accents.
- **🏡 Cozy Rug:** Warm biscuit creams with deep chocolate browns.
- **🌙 Twilight Walk:** Deep night indigos with amber streetlamp accents.

---

## 📂 Project Structure
- `index.html` - Layout structure, sliders, buttons, and CSS art divs.
- `style.css` - HSL theme variables, CSS Art, keyframes, and responsiveness.
- `app.js` - Web Audio API synthesizers, interactive state machine, and quiz engine.

---

## 🚀 Run Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/batu-ta/dogspeak.git
   ```
2. Open `index.html` directly in any modern browser!
