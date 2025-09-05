const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Set up CORS headers for the Netlify function
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  // Ensure it's a POST request
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }
  
  try {
    const { role, feeling, timeOfDay, language, religion, challenge } = JSON.parse(event.body);

    const apiKey = process.env.GEMINI_API_KEY;
    const apiBaseUrl = "https://generativelanguage.googleapis.com/v1beta/models/";

    const getReligiousGreeting = (religion) => {
        switch(religion.toLowerCase()) {
            case 'christian':
            case 'protestant':
                return 'Dear Heavenly Father,';
            case 'catholic':
                return 'In the name of the Father, and of the Son, and of the Holy Spirit.';
            case 'orthodox':
                return 'Lord Jesus Christ, Son of God,';
            case 'jewish':
                return 'Adonai,';
            case 'muslim':
            case 'islamic':
                return 'Bismillahir Rahmanir Rahim.';
            case 'buddhist':
                return 'May I find peace in this moment,';
            case 'hindu':
                return 'Om Namah Shivaya.';
            case 'interfaith':
            case 'spiritual':
                return 'Divine Source,';
            case 'secular':
                return 'In this moment of reflection,';
            default:
                return 'To the Divine,';
        }
    };

    const getReligiousEnding = (religion) => {
        switch(religion.toLowerCase()) {
            case 'christian':
            case 'protestant':
                return 'In Jesus\' name, Amen.';
            case 'catholic':
                return 'Through Christ our Lord, Amen.';
            case 'orthodox':
                return 'Through the prayers of our holy fathers, Lord Jesus Christ our God, have mercy on us. Amen.';
            case 'jewish':
                return 'Amen.';
            case 'muslim':
            case 'islamic':
                return 'Ameen.';
            case 'buddhist':
                return 'May all beings be happy and free from suffering.';
            case 'hindu':
                return 'Om Shanti Shanti Shanti.';
            case 'interfaith':
            case 'spiritual':
                return 'And so it is.';
            case 'secular':
                return 'With gratitude and intention.';
            default:
                return 'Amen.';
        }
    };

    const religiousGreeting = getReligiousGreeting(religion);
    const religiousEnding = getReligiousEnding(religion);

    const promptText = `Generate a heartfelt, calm, and uplifting prayer in the ${religion} tradition. The person is a ${role} feeling ${feeling}. It is ${timeOfDay}.
    The person has the following specific challenges or needs: "${challenge}".
    The prayer should offer comfort, guidance, and hope, ending with: "${religiousEnding}"
    Make it authentic to the ${religion} tradition while being personal and meaningful.`;

    // Step 1: Generate Prayer Text with Gemini
    const textPayload = {
      contents: [{ parts: [{ text: promptText }] }],
      tools: [{ "google_search": {} }],
      systemInstruction: {
        parts: [{ text: `You are a kind and compassionate spiritual guide. Your sole purpose is to generate beautiful and personal prayers that offer comfort and hope. The prayers should be gentle and supportive, and reflect a tone of faith and trust, specifically in the ${religion} tradition. The prayer should be 5 to 7 sentences long and always begin with the greeting: "${religiousGreeting}" and end with: "${religiousEnding}".` }]
      },
      model: "gemini-2.5-flash-preview-05-20"
    };

    const textResponse = await fetch(apiBaseUrl + textPayload.model + ':generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(textPayload)
    });

    const textResult = await textResponse.json();
    let prayerText = textResult?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!prayerText) {
      return {
        statusCode: textResponse.status,
        headers,
        body: JSON.stringify({ error: 'Failed to generate prayer text.' }),
      };
    }

    // Ensure proper religious structure
    if (!prayerText.startsWith(religiousGreeting)) {
        prayerText = religiousGreeting + '\n\n' + prayerText;
    }
    if (!prayerText.includes(religiousEnding.split('.')[0])) {
        prayerText = prayerText.trim() + '\n\n' + religiousEnding;
    }

    // A simple mapping for voices, you can expand this.
    const voices = {
      'en-US': 'Kore',
      'es-US': 'Puck',
      'fr-FR': 'Zephyr',
      'pt-BR': 'Iapetus',
      'it-IT': 'Orus',
      'de-DE': 'Leda'
    };

    // Step 2: Generate Prayer Audio with Gemini TTS
    const audioPayload = {
      contents: [{ parts: [{ text: prayerText }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voices[language] || 'Kore' }
          }
        }
      },
      model: "gemini-2.5-flash-preview-tts"
    };

    const audioResponse = await fetch(apiBaseUrl + audioPayload.model + ':generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(audioPayload)
    });

    const audioResult = await audioResponse.json();
    const audioData = audioResult?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      return {
        statusCode: audioResponse.status,
        headers,
        body: JSON.stringify({ error: 'Failed to generate audio.' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ prayerText, audioData }),
    };

  } catch (error) {
    console.error('Error in Netlify function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};
