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
                return 'Dear Heavenly Father,';
            case 'jewish':
                return 'Adonai,';
            case 'muslim':
                return 'In the name of Allah, the Most Gracious, the Most Merciful.';
            case 'buddhist':
                return 'May I find peace in this moment,';
            case 'hindu':
                return 'Oh Divine One,';
            case 'interfaith/spiritual':
                return 'Oh Universe,';
            case 'secular/mindful':
                return 'May I find clarity and strength,';
            default:
                return 'To the Divine,';
        }
    };
    
    const getReligiousEnding = (religion) => {
        switch(religion.toLowerCase()) {
            case 'christian':
                return 'Amen.';
            case 'jewish':
                return 'Amen.';
            case 'muslim':
                return 'Ameen.';
            case 'buddhist':
                return 'May all beings be happy and free from suffering.';
            case 'hindu':
                return 'Om Shanti.';
            case 'interfaith/spiritual':
                return 'And so it is.';
            case 'secular/mindful':
                return 'With gratitude and intention.';
            default:
                return 'Amen.';
        }
    };
    
    // Determine prayer length based on keywords
    const isShortPrayer = ['grateful', 'thankful', 'happy', 'blessed', 'celebrating'].some(keyword => feeling.toLowerCase().includes(keyword));
    const prayerLength = isShortPrayer ? '2 to 3 sentences' : '5 to 7 sentences';

    const religiousGreeting = getReligiousGreeting(religion);
    const religiousEnding = getReligiousEnding(religion);

    const promptText = `Generate a heartfelt, calm, and uplifting prayer in the ${religion} tradition. The person is a ${role} feeling ${feeling}. It is ${timeOfDay}.
    The person has the following specific challenges or needs: "${challenge}".
    The prayer should offer comfort, guidance, and hope, be ${prayerLength} long, and end with the appropriate religious phrase.`;

    // Step 1: Generate Prayer Text with Gemini
    const textPayload = {
      contents: [{ parts: [{ text: promptText }] }],
      tools: [{ "google_search": {} }],
      systemInstruction: {
        parts: [{ text: `You are a kind and compassionate spiritual guide. Your sole purpose is to generate beautiful and personal prayers that offer comfort and hope. The prayers should be gentle and supportive, and reflect a tone of faith and trust, specifically in the ${religion} tradition. The prayer should be ${prayerLength} long, begin with "${religiousGreeting}", and end with "${religiousEnding}".` }]
      },
      model: "gemini-2.5-flash-preview-05-20"
    };

    const textResponse = await fetch(apiBaseUrl + textPayload.model + ':generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(textPayload)
    });

    const textResult = await textResponse.json();
    const prayerText = textResult?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!prayerText) {
      return {
        statusCode: textResponse.status,
        headers,
        body: JSON.stringify({ error: 'Failed to generate prayer text.' }),
      };
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
