import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const uiDir = path.join(rootDir, 'src', 'data', 'lang');
const kbDir = path.join(rootDir, 'src', 'data', 'kb');

const newUiKeys = {
  en: {
    status_online: "Online",
    status_offline_mode: "Offline mode",
    voice_guide_btn: "Voice guide",
    voice_guide_loading: "Preparing audio...",
    voice_guide_speaking: "Speaking...",
    voice_guide_stop: "Stop voice guide",
    voice_guide_error: "Audio error",
    voice_guide_scan_home: "Check your crop. Take one clear photo of a single leaf. Phyto tells you what is wrong and what to do.",
    voice_guide_photo_check: "Photo check page. Please verify sharpness, daylight, and distance before analyzing.",
    voice_guide_analyzing: "Analyzing leaf cells and spotting fungal lesions offline.",
    voice_result_template: "Tomato diagnosis: {disease_name}. Severity is {severity_word}. Confidence is {confidence_word}. Tap View Treatment to see recommendations.",
    voice_guide_result_uncertain: "The photo is too blurry to diagnose accurately. Please retake photo in bright daylight holding the phone one hand-span away.",
    voice_guide_history: "This is your scan history. All leaf diagnoses are saved on this phone.",
    voice_guide_schemes: "Government schemes page. Browse agricultural subsidies and plant protection grants for vegetable farmers.",
    voice_guide_settings: "Settings and farmer assistant. You can switch language, download offline packages, and adjust voice speed.",
    auto_translation_disclaimer: "Automatic translation - not verified. Confirm with your agriculture officer.",
    download_offline_btn: "Download for offline use",
    downloaded_badge: "Downloaded",
    downloading_badge: "Downloading...",
    speak_slowly_label: "Speak slowly",
    speak_slowly_desc: "Play voice guides at a slower rate for clearer listening",
    offline_pack_size_approx: "Approx. {size} MB",
    offline_pack_success: "Offline package for {lang} downloaded successfully."
  },
  ml: {
    status_online: "ഓൺലൈൻ ബന്ധം സജീവം",
    status_offline_mode: "ഓഫ്‌ലൈൻ മോഡ്",
    voice_guide_btn: "ശബ്ദ സഹായി",
    voice_guide_loading: "ശബ്ദം തയ്യാറാക്കുന്നു...",
    voice_guide_speaking: "വായിച്ചുകേൾപ്പിക്കുന്നു...",
    voice_guide_stop: "ശബ്ദം നിർത്തുക",
    voice_guide_error: "ശബ്ദ തടസ്സം",
    voice_guide_scan_home: "നിങ്ങളുടെ വിള പരിശോധിക്കുക. ഒരൊറ്റ ഇലയുടെ വ്യക്തമായ ഫോട്ടോയെടുക്കുക. പ്രശ്നവും പരിഹാരവും ഫൈറ്റോ പറയും.",
    voice_guide_photo_check: "ഫോട്ടോ പരിശോധന. വ്യക്തതയും വെളിച്ചവും അകലവും നല്ലതാണെന്ന് ഉറപ്പുവരുത്തുക.",
    voice_guide_analyzing: "ഇലയിലെ കോശഘടനകളും കുമിൾ ലക്ഷണങ്ങളും ഓഫ്‌ലൈനായി വിശകലനം ചെയ്യുന്നു.",
    voice_result_template: "തക്കാളി പരിശോധനാ ഫലം: {disease_name}. രോഗബാധ {severity_word}. വിശ്വാസ്യത {confidence_word}. ചികിത്സ കാണാൻ താഴെ അമർത്തുക.",
    voice_guide_result_uncertain: "ഫോട്ടോ അവ്യക്തമായതിനാൽ രോഗനിർണ്ണയം സാധ്യമല്ല. നല്ല വെളിച്ചത്തിൽ ഒരു ചാൺ അകലെ നിന്ന് വീണ്ടും ഫോട്ടോയെടുക്കുക.",
    voice_guide_history: "സ്കാൻ ചരിത്രം. ഫോണിൽ സൂക്ഷിച്ചിരിക്കുന്ന മുൻകാല പരിശോധനാ ഫലങ്ങൾ ഇവിടെ കാണാം.",
    voice_guide_schemes: "സർക്കാർ പദ്ധതികൾ. പച്ചക്കറി കർഷകർക്കുള്ള സബ്സിഡികളും കാർഷിക ആനുകൂല്യങ്ങളും ഇവിടെ കാണാം.",
    voice_guide_settings: "സെറ്റിംഗ്സും കർഷക സഹായിയും. ഭാഷ മാറ്റാനും ഓഫ്‌ലൈൻ പാക്ക് ഡൗൺലോഡ് ചെയ്യാനും ശബ്ദവേഗത ക്രമീകരിക്കാനും സാധിക്കും.",
    auto_translation_disclaimer: "ഓട്ടോമാറ്റിക് പരിഭാഷ - സ്ഥിരീകരിച്ചിട്ടില്ല. കൃഷി ഓഫീസറോട് ചോദിച്ച് ഉറപ്പുവരുത്തുക.",
    download_offline_btn: "ഓഫ്‌ലൈൻ ഉപയോഗത്തിനായി ഡൗൺലോഡ് ചെയ്യുക",
    downloaded_badge: "ഡൗൺലോഡ് ചെയ്തു",
    downloading_badge: "ഡൗൺലോഡ് ചെയ്യുന്നു...",
    speak_slowly_label: "പതുക്കെ സംസാരിക്കുക",
    speak_slowly_desc: "വ്യക്തമായി മനസ്സിലാക്കാൻ ശബ്ദ സഹായിയുടെ വേഗത കുറയ്ക്കുക",
    offline_pack_size_approx: "ഏകദേശം {size} MB",
    offline_pack_success: "{lang} ഓഫ്‌ലൈൻ പാക്കേജ് വിജയകരമായി ഡൗൺലോഡ് ചെയ്തു."
  },
  ta: {
    status_online: "ஆன்லைன்",
    status_offline_mode: "ஆஃப்லைன் முறை",
    voice_guide_btn: "குரல் வழிகாட்டி",
    voice_guide_loading: "ஆடியோ தயாராகிறது...",
    voice_guide_speaking: "பேசுகிறது...",
    voice_guide_stop: "ஆடியோவை நிறுத்து",
    voice_guide_error: "ஆடியோ பிழை",
    voice_guide_scan_home: "உங்கள் பயிரை சோதிக்கவும். ஒரே ஒரு இலையின் தெளிவான புகைப்படத்தை எடுக்கவும். என்ன பிரச்சனை மற்றும் என்ன செய்ய வேண்டும் என்பதை பைட்டோ கூறும்.",
    voice_guide_photo_check: "புகைப்பட சோதனை பக்கம். தெளிவு, வெளிச்சம் மற்றும் தூரத்தை சரிபார்த்து பகுப்பாய்வு செய்யவும்.",
    voice_guide_analyzing: "இலை செல்களை ஸ்கேன் செய்து ஆஃப்லைனில் பூஞ்சை அறிகுறிகளை கண்டறிகிறது.",
    voice_result_template: "தக்காளி நோயறிதல்: {disease_name}. தீவிரம் {severity_word}. நம்பகத்தன்மை {confidence_word}. சிகிச்சையைக் காண கீழே தட்டவும்.",
    voice_guide_result_uncertain: "துல்லியமான நோயறிதலுக்கு புகைப்படம் மிகவும் மங்கலாக உள்ளது. நல்ல பகல் வெளிச்சத்தில் மீண்டும் படம் எடுக்கவும்.",
    voice_guide_history: "இது உங்கள் ஸ்கேன் வரலாறு. போனில் சேமிக்கப்பட்ட அனைத்து பரிசோதனைகளும் இங்கு உள்ளன.",
    voice_guide_schemes: "அரசு திட்டங்கள். காய்கறி விவசாயிகளுக்கான மானியங்கள் மற்றும் பயிர் பாதுகாப்பு உதவிகளை காண்க.",
    voice_guide_settings: "அமைப்புகள் மற்றும் விவசாயி உதவியாளர். மொழியை மாற்றவும், ஆஃப்லைன் தொகுப்புகளை பதிவிறக்கவும், குரல் வேகத்தை மாற்றவும் முடியும்.",
    auto_translation_disclaimer: "தானியங்கி மொழிபெயர்ப்பு - சரிபார்க்கப்படவில்லை. உங்கள் வேளாண்மை அலுவலரிடம் உறுதிப்படுத்தவும்.",
    download_offline_btn: "ஆஃப்லைன் பயன்பாட்டிற்கு பதிவிறக்கவும்",
    downloaded_badge: "பதிவிறக்கப்பட்டது",
    downloading_badge: "பதிவிறக்குகிறது...",
    speak_slowly_label: "மெதுவாக பேசவும்",
    speak_slowly_desc: "தெளிவாக கேட்க குரல் வழிகாட்டியை மெதுவான வேகத்தில் இயக்கவும்",
    offline_pack_size_approx: "சுமார் {size} MB",
    offline_pack_success: "{lang} ஆஃப்லைன் தொகுப்பு வெற்றிகரமாக பதிவிறக்கப்பட்டது."
  },
  hi: {
    status_online: "ऑनलाइन",
    status_offline_mode: "ऑफ़लाइन मोड",
    voice_guide_btn: "आवाज़ सहायता",
    voice_guide_loading: "ऑडियो तैयार हो रहा है...",
    voice_guide_speaking: "बोल रहा है...",
    voice_guide_stop: "ऑडियो रोकें",
    voice_guide_error: "ऑडियो त्रुटि",
    voice_guide_scan_home: "अपनी फसल की जांच करें। एक पत्ती की स्पष्ट फोटो लें। फाइटो बताएगा कि क्या समस्या है और क्या उपाय करना है।",
    voice_guide_photo_check: "फोटो जांच पृष्ठ। कृपया विश्लेषण से पहले स्पष्टता, रोशनी और दूरी की पुष्टि करें।",
    voice_guide_analyzing: "पत्ती की कोशिकाओं को स्कैन कर ऑफ़लाइन फंगल लक्षणों की पहचान की जा रही है।",
    voice_result_template: "टमाटर निदान परिणाम: {disease_name}। गंभीरता {severity_word} है। विश्वसनीयता {confidence_word} है। उपचार देखने के लिए नीचे टैप करें।",
    voice_guide_result_uncertain: "सटीक निदान के लिए फोटो बहुत धुंधली है। कृपया दिन के उजाले में एक बालिश्त दूर से दोबारा फोटो लें।",
    voice_guide_history: "यह आपका स्कैन इतिहास है। आपके फोन में सुरक्षित सभी फसल जांच रिकॉर्ड यहाँ हैं।",
    voice_guide_schemes: "सरकारी योजनाएं। सब्जी उत्पादकों के लिए सब्सिडी और पादप संरक्षण अनुदान देखें।",
    voice_guide_settings: "सेटिंग्स और किसान सहायक। आप भाषा बदल सकते हैं, ऑफ़लाइन पैकेज डाउनलोड कर सकते हैं और आवाज़ की गति समायोजित कर सकते हैं।",
    auto_translation_disclaimer: "स्वचालित अनुवाद - सत्यापित नहीं। अपने कृषि अधिकारी से पुष्टि करें।",
    download_offline_btn: "ऑफ़लाइन उपयोग के लिए डाउनलोड करें",
    downloaded_badge: "डाउनलोड किया गया",
    downloading_badge: "डाउनलोड हो रहा है...",
    speak_slowly_label: "धीमी गति से बोलें",
    speak_slowly_desc: "स्पष्ट सुनने के लिए आवाज़ गाइड को धीमी गति से चलाएं",
    offline_pack_size_approx: "लगभग {size} MB",
    offline_pack_success: "{lang} ऑफ़लाइन पैकेज सफलतापूर्वक डाउनलोड हो गया।"
  },
  te: {
    status_online: "ఆన్‌లైన్",
    status_offline_mode: "ఆఫ్‌లైన్ మోడ్",
    voice_guide_btn: "వాయిస్ గైడ్",
    voice_guide_loading: "ఆడియో సిద్ధమవుతోంది...",
    voice_guide_speaking: "మాట్లాడుతోంది...",
    voice_guide_stop: "ఆడియో ఆపండి",
    voice_guide_error: "ఆడియో లోపం",
    voice_guide_scan_home: "మీ పంటను తనిఖీ చేయండి. ఒకే ఒక ఆకు స్పష్టమైన ఫోటో తీయండి. సమస్య ఏమిటో, ఏం చేయాలో ఫైటో చెబుతుంది.",
    voice_guide_photo_check: "ఫోటో తనిఖీ పేజీ. విశ్లేషణకు ముందు స్పష్టత, వెలుతురు మరియు దూరాన్ని నిర్ధారించుకోండి.",
    voice_guide_analyzing: "ఆకు కణజాలాన్ని స్కాన్ చేస్తూ ఆఫ్‌లైన్‌లో శిలీంధ్ర లక్షణాలను గుర్తిస్తోంది.",
    voice_result_template: "టమోటా వ్యాధి నిర్ధారణ: {disease_name}. తీవ్రత {severity_word}. విశ్వసనీయత {confidence_word}. సిఫార్సులను చూడటానికి చికిత్సపై నొక్కండి.",
    voice_guide_result_uncertain: "ఖచ్చితమైన నిర్ధారణకు ఫోటో చాలా మసకగా ఉంది. దయచేసి మంచి వెలుతురులో ఒక జానెడు దూరం నుండి మళ్ళీ ఫోటో తీయండి.",
    voice_guide_history: "ఇది మీ స్కాన్ చరిత్ర. ఫోన్‌లో భద్రపరచబడిన పంట నిర్ధారణ రికార్డులన్నీ ఇక్కడ ఉంటాయి.",
    voice_guide_schemes: "ప్రభుత్వ పథకాలు. కూరగాయల రైతుల కోసం రాయితీలు మరియు సస్యరక్షణ సహాయాలను చూడండి.",
    voice_guide_settings: "సెట్టింగ్‌లు మరియు రైతు సహాయకుడు. మీరు భాష మార్చుకోవచ్చు, ఆఫ్‌లైన్ ప్యాక్‌లను డౌన్‌లోడ్ చేయవచ్చు మరియు వాయిస్ వేగాన్ని మార్చవచ్చు.",
    auto_translation_disclaimer: "ఆటోమేటిక్ అనువాదం - ధృవీకరించబడలేదు. మీ వ్యవసాయ అధికారితో నిర్ధారించుకోండి.",
    download_offline_btn: "ఆఫ్‌లైన్ ఉపయోగం కోసం డౌన్‌లోడ్ చేయండి",
    downloaded_badge: "డౌన్‌లోడ్ అయింది",
    downloading_badge: "డౌన్‌లోడ్ అవుతోంది...",
    speak_slowly_label: "నెమ్మదిగా మాట్లాడండి",
    speak_slowly_desc: "స్పష్టంగా వినడానికి వాయిస్ గైడ్‌ను తక్కువ వేగంతో ప్లే చేయండి",
    offline_pack_size_approx: "సుమారు {size} MB",
    offline_pack_success: "{lang} ఆఫ్‌లైన్ ప్యాకేజీ విజయవంతంగా డౌన్‌లోడ్ చేయబడింది."
  }
};

const kbVoiceContent = {
  en: {
    tomato_early_blight: {
      voice_treatment: "Step 1: Remove and burn the infected lower leaves. Step 2: Spray a neem-based solution in the evening. Step 3: Water at the base, not over the leaves. If it keeps spreading, use a fungicide registered for tomato. Follow the label exactly and wear gloves and a mask when spraying.",
      voice_prevention: "Step 1: Mulch the soil around plants to prevent soil spores splashing onto lower leaves. Step 2: Maintain 45–60 cm distance between tomato plants for healthy air circulation. Step 3: Practice 3-year crop rotation; avoid planting tomatoes after potatoes or eggplants. Farmer pro tip: Thoroughly destroy crop residue after harvest to break the fungal pathogen cycle for the next season."
    },
    tomato_late_blight: {
      voice_treatment: "Step 1: Prune severely affected stems and bury them deeply away from farm. Step 2: Apply 1% Bordeaux mixture on clear mornings on both leaf surfaces. Step 3: Ensure quick drainage and avoid overhead sprinkler irrigation. If it keeps spreading, use systemic fungicide Metalaxyl + Mancozeb. Do not harvest within 7 days of application.",
      voice_prevention: "Step 1: Use certified disease-resistant tomato varieties for rainy season planting. Step 2: Stake and trellis plants to keep leaves clean and off damp soil. Step 3: Sanitize pruning shears with spirit or bleach between plants. Farmer pro tip: Thoroughly destroy crop residue after harvest to break the fungal pathogen cycle for the next season."
    },
    tomato_healthy: {
      voice_treatment: "No disease treatment required. Continue regular maintenance. Step 2: Apply organic compost or vermicompost every 3 weeks at plant base. Step 3: Inspect the undersides of leaves weekly for early signs of whiteflies or aphids. No chemicals recommended.",
      voice_prevention: "Step 1: Spray mild diluted cow urine or Panchagavya monthly to boost natural immunity. Step 2: Install yellow sticky traps to catch flying sucking pests early. Step 3: Keep field perimeter free of wild solanaceous weeds. Farmer pro tip: Regular inspection in early morning helps spot any pest or fungus before it establishes."
    }
  },
  ml: {
    tomato_early_blight: {
      voice_treatment: "ഘട്ടം 1: രോഗബാധയുള്ള അടിയിലെ ഇലകൾ പറിച്ച് നശിപ്പിക്കുക. ഘട്ടം 2: വൈകുന്നേരങ്ങളിൽ വേപ്പെണ്ണ അധിഷ്ഠിത മിശ്രിതം തളിക്കുക. ഘട്ടം 3: ചെടിയുടെ ചുവട്ടിൽ മാത്രം വെള്ളമൊഴിക്കുക. രോഗം പടരുകയാണെങ്കിൽ തക്കാളിക്ക് അംഗീകൃത കുമിൾനാശിനി ഉപയോഗിക്കുക. കൈയ്യുറകളും മാസ്കും ധരിക്കുക.",
      voice_prevention: "ഘട്ടം 1: മണ്ണിലെ കുമിൾ ബീജങ്ങൾ തെറിക്കാതിരിക്കാൻ ചുവട്ടിൽ പുതയിടുക. ഘട്ടം 2: കാറ്റോട്ടത്തിനായി തൈകൾ തമ്മിൽ 45–60 cm അകലം പാലിക്കുക. ഘട്ടം 3: 3 വർഷ വിളപരിക്രമണം നടത്തുക. കർഷക ശ്രദ്ധയ്ക്ക്: വിളവെടുപ്പിന് ശേഷം രോഗബാധയുള്ള അവശിഷ്ടങ്ങൾ പൂർണ്ണമായി നശിപ്പിക്കുക."
    },
    tomato_late_blight: {
      voice_treatment: "ഘട്ടം 1: രോഗം ബാധിച്ച കമ്പുകൾ മുറിച്ച് കുഴിച്ചുമൂടുക. ഘട്ടം 2: തെളിഞ്ഞ പ്രഭാതത്തിൽ 1% Bordeaux mixture തളിക്കുക. ഘട്ടം 3: നീർവാർച്ച ഉറപ്പാക്കുക. രോഗം പടരുകയാണെങ്കിൽ Metalaxyl + Mancozeb ഉപയോഗിക്കുക. മരുന്ന് തളിച്ച് 7 days വരെ വിളവെടുക്കരുത്.",
      voice_prevention: "ഘട്ടം 1: മഴക്കാലത്ത് രോഗപ്രതിരോധ ശേഷിയുള്ള സർട്ടിഫൈഡ് വിത്തുകൾ തിരഞ്ഞെടുക്കുക. ഘട്ടം 2: ഇലകൾ മണ്ണിൽ തട്ടാതിരിക്കാൻ താങ്ങുകാലുകൾ നൽകുക. ഘട്ടം 3: ഉപകരണങ്ങൾ അണുവിമുക്തമാക്കുക. കർഷക ശ്രദ്ധയ്ക്ക്: വിളവെടുപ്പിന് ശേഷം രോഗബാധയുള്ള അവശിഷ്ടങ്ങൾ പൂർണ്ണമായി നശിപ്പിക്കുക."
    },
    tomato_healthy: {
      voice_treatment: "രോഗചികിത്സ ആവശ്യമില്ല. പതിവ് പരിചരണം തുടരുക. ഘട്ടം 2: 3 ആഴ്ചയിലൊരിക്കൽ ചെടിയുടെ ചുവട്ടിൽ മണ്ണിര കമ്പോസ്റ്റോ ജൈവവളമോ നൽകുക. ഘട്ടം 3: ആഴ്ചയിലൊരിക്കൽ ഇലകളുടെ അടിഭാഗം പരിശോധിക്കുക. രാസവസ്തുക്കൾ ആവശ്യമില്ല.",
      voice_prevention: "ഘട്ടം 1: പ്രതിരോധശേഷി കൂട്ടാൻ മാസത്തിലൊരിക്കൽ നേർപ്പിച്ച പഞ്ചഗവ്യം തളിക്കുക. ഘട്ടം 2: മഞ്ഞക്കെണികൾ സ്ഥാപിക്കുക. ഘട്ടം 3: കാട്ടു കളകൾ വെട്ടി വൃത്തിയാക്കുക. കർഷക ശ്രദ്ധയ്ക്ക്: അതിരാവിലെയുള്ള പരിശോധന രോഗങ്ങളെ തുടക്കത്തിലേ തടയും."
    }
  },
  ta: {
    tomato_early_blight: {
      voice_treatment: "படி 1: பாதிக்கப்பட்ட கீழ் இலைகளை அகற்றி எரிக்கவும். படி 2: மாலையில் வேப்ப எண்ணெய் கலவையைத் தெளிக்கவும். படி 3: இலைகளின் மேல் தெளிக்காமல் வேர்ப்பகுதியில் மட்டுமே நீர் பாய்ச்சவும். நோய் பரவினால் தக்காளிக்கு அங்கீகரிக்கப்பட்ட பூஞ்சைக்கொல்லியை பயன்படுத்தவும். கையுறைகள் மற்றும் முகக்கவசம் அணியவும்.",
      voice_prevention: "படி 1: மண் வித்துக்கள் தெறிப்பதைத் தடுக்க செடியின் அடியில் தழைக் கூளம் இடவும். படி 2: காற்றோட்டத்திற்கு தக்காளிச் செடிகளுக்கு இடையே 45–60 cm இடைவெளி பராமரிக்கவும். படி 3: 3 ஆண்டு பயிர் சுழற்சி முறையைக் கடைப்பிடிக்கவும். விவசாயிக்கு முக்கிய குறிப்பு: அறுவடைக்குப் பிறகு பாதிக்கப்பட்ட பயிர்க் கழிவுகளை முழுமையாக அழிக்கவும்."
    },
    tomato_late_blight: {
      voice_treatment: "படி 1: பாதிக்கப்பட்ட கிளைகளை வெட்டி பண்ணையிலிருந்து தூரமாக ஆழமாக புதைக்கவும். படி 2: காலை வேளையில் இலைகளின் இருபுறமும் 1% Bordeaux mixture தெளிக்கவும். படி 3: விரைவான வடிகால் வசதியை உறுதி செய்யவும். நோய் பரவினால் Metalaxyl + Mancozeb பயன்படுத்தவும். மருந்து தெளித்த 7 days வரை அறுவடை செய்யக்கூடாது.",
      voice_prevention: "படி 1: சான்றளிக்கப்பட்ட நோய் எதிர்ப்பு தக்காளி வகைகளைப் பயன்படுத்தவும். படி 2: இலைகள் ஈர மண்ணில் படாமல் இருக்க ஊன்றுகோல் கட்டவும். படி 3: கருவிகளை கிருமி நீக்கம் செய்யவும். விவசாயிக்கு முக்கிய குறிப்பு: அறுவடைக்குப் பிறகு பாதிக்கப்பட்ட பயிர்க் கழிவுகளை முழுமையாக அழிக்கவும்."
    },
    tomato_healthy: {
      voice_treatment: "நோய் சிகிச்சை எதுவும் தேவையில்லை. வழக்கமான பராமரிப்பைத் தொடரவும். படி 2: 3 வாரங்களுக்கு ஒருமுறை செடியின் அடியில் மண்புழு உரம் இடவும். படி 3: வெள்ளை ஈக்கள் அல்லது அசுவினிகள் உள்ளனவா என்று வாரந்தோறும் இலையின் அடிப்பகுதியை பரிசோதிக்கவும். ரசாயனங்கள் தேவையில்லை.",
      voice_prevention: "படி 1: இயற்கை நோய் எதிர்ப்பு சக்தியை அதிகரிக்க மாதந்தோறும் பஞ்சகவ்யம் தெளிக்கவும். படி 2: மஞ்சள் ஒட்டும் பொறிகளை நிறுவவும். படி 3: காட்டு களைகளை சுத்தமாக வைக்கவும். விவசாயிக்கு முக்கிய குறிப்பு: அதிகாலையில் ஆய்வு செய்வது பூச்சிகளை தொடக்கத்திலேயே கட்டுப்படுத்த உதவுகிறது."
    }
  },
  hi: {
    tomato_early_blight: {
      voice_treatment: "चरण 1: संक्रमित निचली पत्तियों को तोड़कर नष्ट कर दें। चरण 2: शाम के समय नीम आधारित घोल का छिड़काव करें। चरण 3: केवल पौधे की जड़ में पानी दें। यदि रोग बढ़ता है, तो टमाटर के लिए पंजीकृत कवकनाशी का उपयोग करें। दस्ताने और मास्क अवश्य पहनें।",
      voice_prevention: "चरण 1: मिट्टी के बीजाणुओं को रोकने के लिए पौधे के चारों ओर पुआल की मल्चिंग करें। चरण 2: पौधों के बीच 45–60 cm की दूरी बनाए रखें। चरण 3: 3 वर्ष का फसल चक्र अपनाएं। किसान के लिए खास सलाह: कटाई के बाद संक्रमित फसल अवशेषों को पूरी तरह नष्ट कर दें।"
    },
    tomato_late_blight: {
      voice_treatment: "चरण 1: प्रभावित तनों को छांटें और उन्हें खेत से दूर गहराई में दबा दें। चरण 2: सुबह पत्तियों के दोनों किनारों पर 1% Bordeaux mixture का छिड़काव करें। चरण 3: त्वरित जल निकासी सुनिश्चित करें। यदि रोग बढ़ता है, तो Metalaxyl + Mancozeb का उपयोग करें। दवा छिड़कने के 7 days के भीतर कटाई न करें।",
      voice_prevention: "चरण 1: प्रमाणित रोग प्रतिरोधी टमाटर की किस्मों का चयन करें। चरण 2: पौधों को सहारा (स्टेकिंग) दें। चरण 3: औजारों को कीटाणुरहित करें। किसान के लिए खास सलाह: कटाई के बाद संक्रमित फसल अवशेषों को पूरी तरह नष्ट कर दें।"
    },
    tomato_healthy: {
      voice_treatment: "किसी रोग उपचार की आवश्यकता नहीं है। नियमित देखभाल जारी रखें। चरण 2: हर 3 सप्ताह में पौधे की जड़ में वर्मीकम्पोस्ट डालें। चरण 3: साप्ताहिक रूप से पत्तियों के नीचे कीटों की जांच करें। किसी रसायन की आवश्यकता नहीं है।",
      voice_prevention: "चरण 1: रोग प्रतिरोधक क्षमता बढ़ाने के लिए महीने में एक बार पतला पंचगव्य छिड़कें। चरण 2: पीले चिपचिपे जाल लगाएं। चरण 3: जंगली खरपतवारों को साफ रखें। किसान के लिए खास सलाह: सुबह नियमित निरीक्षण से रोगों का शुरुआत में ही पता चल जाता है।"
    }
  },
  te: {
    tomato_early_blight: {
      voice_treatment: "దశ 1: తెగులు సోకిన దిగువ ఆకులను తొలగించి కాల్చివేయండి. దశ 2: సాయంత్రం వేళల్లో వేపనూనె ద్రావణాన్ని పిచికారీ చేయండి. దశ 3: మొక్క మొదట్లోనే నీరు పోయండి. తెగులు మరింత వ్యాపిస్తే టమోటాకు సిఫార్సు చేసిన శిలీంధ్ర సంహారిణిని వాడండి. చేతి తొడుగులు మరియు మాస్క్ ధరించండి.",
      voice_prevention: "దశ 1: నేలలోని కణాలు ఆకులపై పడకుండా మొక్కల మొదట్లో ఎండుటాకులతో కప్పండి. దశ 2: మొక్కల మధ్య 45–60 cm దూరం పాటించండి. దశ 3: 3 సంవత్సరాల పంట మార్పిడి విధానాన్ని పాటించండి. రైతుకు ముఖ్య గమనిక: పంట కోత తర్వాత తెగులు సోకిన అవశేషాలను పూర్తిగా నాశనం చేయండి."
    },
    tomato_late_blight: {
      voice_treatment: "దశ 1: తీవ్రంగా తెగులు సోకిన కొమ్మలను కత్తిరించి దూరంగా పూడ్చిపెట్టండి. దశ 2: ఉదయపు వేళల్లో ఆకులపై 1% Bordeaux mixture పిచికారీ చేయండి. దశ 3: నీరు నిలవకుండా చూడండి. తెగులు వ్యాపిస్తే Metalaxyl + Mancozeb వాడండి. మందు పిచికారీ చేసిన 7 days వరకు పంట కోయకూడదు.",
      voice_prevention: "దశ 1: ధృవీకరించబడిన తెగులు నిరోధక టమోటా రకాలను ఎంచుకోండి. దశ 2: మొక్కలకు కర్రల సాయం అందించండి. దశ 3: కత్తిరింపు సాధనాలను శుభ్రం చేయండి. రైతుకు ముఖ్య గమనిక: పంట కోత తర్వాత తెగులు సోకిన అవశేషాలను పూర్తిగా నాశనం చేయండి."
    },
    tomato_healthy: {
      voice_treatment: "ఎటువంటి వ్యాధి చికిత్స అవసరం లేదు. సాధారణ సంరక్షణ కొనసాగించండి. దశ 2: ప్రతి 3 వారాలకు ఒకసారి మొక్క మొదట్లో వర్మీకంపోస్ట్ వేయండి. దశ 3: వారానికోసారి ఆకుల అడుగుభాగాన్ని తనిఖీ చేయండి. రసాయనాలు ఏవీ అవసరం లేదు.",
      voice_prevention: "దశ 1: రోగనిరోధక శక్తిని పెంచడానికి నెలకు ఒకసారి పంచగవ్యను పిచికారీ చేయండి. దశ 2: పసుపు రంగు జిగురు ఉచ్చులను అమర్చండి. దశ 3: కలుపు మొక్కలను ఎప్పటికప్పుడు తొలగించండి. రైతుకు ముఖ్య గమనిక: ఉదయపు వేళల్లో పరిశీలించడం వల్ల తెగుళ్లను ప్రారంభంలోనే నియంత్రించవచ్చు."
    }
  }
};

const languages = ['en', 'ml', 'ta', 'hi', 'te'];

for (const lang of languages) {
  // Update UI files
  const uiFilePath = path.join(uiDir, `ui_${lang}.json`);
  const uiContent = JSON.parse(fs.readFileSync(uiFilePath, 'utf-8'));
  const updatedUi = { ...uiContent, ...newUiKeys[lang] };
  fs.writeFileSync(uiFilePath, JSON.stringify(updatedUi, null, 2), 'utf-8');

  // Copy to public
  const publicUiPath = path.join(rootDir, 'public', 'assets', 'lang', `ui_${lang}.json`);
  fs.writeFileSync(publicUiPath, JSON.stringify(updatedUi, null, 2), 'utf-8');

  // Update KB files
  const kbFilePath = path.join(kbDir, `${lang}.json`);
  const kbContent = JSON.parse(fs.readFileSync(kbFilePath, 'utf-8'));
  for (const classId of Object.keys(kbVoiceContent[lang])) {
    if (kbContent[classId]) {
      kbContent[classId].voice_treatment = kbVoiceContent[lang][classId].voice_treatment;
      kbContent[classId].voice_prevention = kbVoiceContent[lang][classId].voice_prevention;
      if (lang !== 'en') {
        kbContent[classId].review_status = "draft_needs_native_and_expert_review";
      }
    }
  }
  fs.writeFileSync(kbFilePath, JSON.stringify(kbContent, null, 2), 'utf-8');

  // Copy to public
  const publicKbPath = path.join(rootDir, 'public', 'assets', 'kb', `${lang}.json`);
  fs.writeFileSync(publicKbPath, JSON.stringify(kbContent, null, 2), 'utf-8');

  console.log(`Updated UI & KB files for ${lang}`);
}

console.log('Update finished.');
