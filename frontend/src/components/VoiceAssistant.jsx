import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../context/LanguageContext";

/**
 * Intent definitions — maps spoken keywords (Hindi + English) to app actions.
 * Each intent has trigger words and an action (navigate or speak).
 */
const INTENTS = [
  {
    id: "go_dashboard",
    keywords: ["dashboard", "home", "main", "होम", "डैशबोर्ड", "मुख्य"],
    action: "navigate", path: "/",
    responseEn: "Opening Dashboard.",
    responseHi: "डैशबोर्ड खोल रहे हैं।",
  },
  {
    id: "go_loss",
    keywords: ["loss", "crop loss", "harvest loss", "नुकसान", "फसल नुकसान", "कटाई नुकसान", "loss prediction"],
    action: "navigate", path: "/loss",
    responseEn: "Opening Crop Loss Prediction.",
    responseHi: "फसल नुकसान पूर्वानुमान खोल रहे हैं।",
  },
  {
    id: "go_price",
    keywords: ["price", "market price", "mandi", "daam", "bhav", "कीमत", "दाम", "भाव", "मंडी", "मूल्य", "price forecast"],
    action: "navigate", path: "/price",
    responseEn: "Opening Price Forecasting.",
    responseHi: "मूल्य पूर्वानुमान खोल रहे हैं।",
  },
  {
    id: "go_supply",
    keywords: ["supply", "transport", "logistics", "truck", "supply chain", "आपूर्ति", "परिवहन", "ट्रक"],
    action: "navigate", path: "/supply",
    responseEn: "Opening Supply Chain Analysis.",
    responseHi: "आपूर्ति श्रृंखला विश्लेषण खोल रहे हैं।",
  },
  {
    id: "go_history",
    keywords: ["history", "past", "record", "इतिहास", "रिकॉर्ड", "पिछले"],
    action: "navigate", path: "/history",
    responseEn: "Opening Prediction History.",
    responseHi: "पूर्वानुमान इतिहास खोल रहे हैं।",
  },
  {
    id: "go_schemes",
    keywords: ["scheme", "yojana", "subsidy", "government", "sarkari", "योजना", "सरकारी", "सब्सिडी", "pm kisan", "पीएम किसान"],
    action: "navigate", path: "/schemes",
    responseEn: "Opening Government Schemes.",
    responseHi: "सरकारी योजनाएँ खोल रहे हैं।",
  },
  {
    id: "go_soil",
    keywords: ["soil", "mitti", "fertilizer", "npk", "urvarak", "मिट्टी", "उर्वरक", "खाद", "soil health"],
    action: "navigate", path: "/soil",
    responseEn: "Opening Soil Health Analyzer.",
    responseHi: "मिट्टी स्वास्थ्य विश्लेषक खोल रहे हैं।",
  },
  {
    id: "go_profile",
    keywords: ["profile", "account", "my profile", "प्रोफ़ाइल", "खाता", "मेरा"],
    action: "navigate", path: "/profile",
    responseEn: "Opening your Profile.",
    responseHi: "आपकी प्रोफ़ाइल खोल रहे हैं।",
  },
  {
    id: "help",
    keywords: ["help", "what can you do", "kya kar sakte", "madad", "मदद", "सहायता", "क्या कर सकते"],
    action: "speak",
    responseEn: "I can help you navigate: say Dashboard, Price, Loss, Supply Chain, Schemes, or History.",
    responseHi: "मैं आपकी मदद कर सकता हूँ: डैशबोर्ड, मूल्य, नुकसान, आपूर्ति, योजनाएँ या इतिहास बोलें।",
  },
];

/**
 * Finds the best matching intent from a transcript string.
 */
function matchIntent(transcript) {
  const lower = transcript.toLowerCase().trim();
  // Try exact keyword match first, then substring
  for (const intent of INTENTS) {
    for (const kw of intent.keywords) {
      if (lower.includes(kw.toLowerCase())) return intent;
    }
  }
  return null;
}

/**
 * Speaks text aloud using the browser's SpeechSynthesis API.
 */
function speakText(text, langCode = "hi-IN") {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = langCode;
  utter.rate = 0.95;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
}

export default function VoiceAssistant() {
  const navigate = useNavigate();
  const { lang, t } = useLang();

  const [isOpen, setIsOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef(null);

  // Check browser support once
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = lang === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      setTranscript("");
      setFeedback(lang === "hi" ? "🎤 सुन रहा हूँ..." : "🎤 Listening...");
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      setTranscript(finalText || interimText);
    };

    recognition.onend = () => {
      setListening(false);
      // Process the final transcript
      const finalTranscript = transcript || "";
      if (finalTranscript.trim()) {
        processTranscript(finalTranscript.trim());
      } else {
        setFeedback(lang === "hi" ? "कुछ सुनाई नहीं दिया। फिर से बोलें।" : "Didn't catch that. Try again.");
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "no-speech") {
        setFeedback(lang === "hi" ? "कुछ सुनाई नहीं दिया।" : "No speech detected.");
      } else if (event.error === "not-allowed") {
        setFeedback(lang === "hi" ? "माइक्रोफ़ोन की अनुमति दें।" : "Please allow microphone access.");
      } else {
        setFeedback(lang === "hi" ? "कोई त्रुटि हुई।" : "An error occurred.");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang, transcript]);

  // We need a ref-based approach so onend has access to the latest transcript
  const latestTranscript = useRef("");
  useEffect(() => { latestTranscript.current = transcript; }, [transcript]);

  // Override the onend to use the ref
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => {
        setListening(false);
        const finalText = latestTranscript.current;
        if (finalText.trim()) {
          processTranscript(finalText.trim());
        } else {
          setFeedback(lang === "hi" ? "कुछ सुनाई नहीं दिया। फिर से बोलें।" : "Didn't catch that. Try again.");
        }
      };
    }
  });

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const processTranscript = (text) => {
    const intent = matchIntent(text);
    if (intent) {
      const response = lang === "hi" ? intent.responseHi : intent.responseEn;
      setFeedback(`✅ ${response}`);
      speakText(response, lang === "hi" ? "hi-IN" : "en-IN");

      if (intent.action === "navigate") {
        setTimeout(() => {
          navigate(intent.path);
          setIsOpen(false);
        }, 1200);
      }
    } else {
      const noMatch = lang === "hi"
        ? `"${text}" — समझ नहीं आया। कृपया डैशबोर्ड, मूल्य, नुकसान, योजनाएँ बोलें।`
        : `"${text}" — I didn't understand. Try saying Dashboard, Price, Loss, or Schemes.`;
      setFeedback(noMatch);
      speakText(
        lang === "hi"
          ? "समझ नहीं आया। कृपया फिर से बोलें।"
          : "I didn't understand. Please try again.",
        lang === "hi" ? "hi-IN" : "en-IN"
      );
    }
  };

  if (!supported) return null;

  return (
    <>
      {/* Floating Mic Button */}
      <button
        className="voice-fab"
        onClick={() => { setIsOpen(!isOpen); setFeedback(""); setTranscript(""); }}
        title={t("voice.title")}
        id="voice-assistant-btn"
      >
        🎙️
      </button>

      {/* Voice Panel */}
      {isOpen && (
        <div className="voice-panel fade-in">
          <div className="voice-panel-header">
            <h4>{t("voice.title")}</h4>
            <button className="voice-close" onClick={() => { setIsOpen(false); stopListening(); }}>✕</button>
          </div>

          <div className="voice-panel-body">
            {/* Visual Indicator */}
            <div className={`voice-indicator ${listening ? "active" : ""}`}>
              <div className="voice-ring"></div>
              <div className="voice-ring delay"></div>
              <span className="voice-mic-icon">{listening ? "🎤" : "🎙️"}</span>
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="voice-transcript">
                "{transcript}"
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div className="voice-feedback">
                {feedback}
              </div>
            )}

            {/* Action Button */}
            <button
              className={`btn ${listening ? "btn-danger" : "btn-primary"} btn-lg w-full`}
              onClick={listening ? stopListening : startListening}
              style={{ marginTop: 12, borderRadius: 30 }}
            >
              {listening
                ? (lang === "hi" ? "⏹ रोकें" : "⏹ Stop")
                : (lang === "hi" ? "🎤 बोलें" : "🎤 Tap to Speak")
              }
            </button>

            {/* Quick Hints */}
            <div className="voice-hints">
              <p style={{ fontWeight: 600, marginBottom: 6 }}>{t("voice.tryTitle")}</p>
              <div className="voice-hint-chips">
                {(lang === "hi"
                  ? ["डैशबोर्ड खोलो", "मूल्य पूर्वानुमान", "फसल नुकसान", "सरकारी योजनाएँ", "मदद"]
                  : ["Open Dashboard", "Price Forecast", "Crop Loss", "Government Schemes", "Help"]
                ).map((hint) => (
                  <span
                    key={hint}
                    className="voice-chip"
                    onClick={() => {
                      setTranscript(hint);
                      processTranscript(hint);
                    }}
                  >
                    {hint}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
