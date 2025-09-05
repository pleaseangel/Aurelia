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

    const promptText = `Generate a heartfelt, calm, and uplifting prayer in the ${religion} tradition in ${new Intl.DisplayNames(['en'], { type: 'language' }).of(language)}.
    The person is a ${role} feeling ${feeling}. It is ${timeOfDay}. 
    The person has the following specific challenges or needs: "${challenge}".
    Keep the prayer concise and comforting, directly addressing the provided feelings and challenges.`;

    // Step 1: Generate Prayer Text with Gemini
    const textPayload = {
      contents: [{ parts: [{ text: promptText }] }],
      tools: [{ "google_search": {} }],
      systemInstruction: {
        parts: [{ text: `You are a kind and compassionate spiritual guide. Your sole purpose is to generate beautiful and personal prayers that offer comfort and hope. The prayers should be gentle and supportive, especially for a mother, and reflect a tone of faith and trust, specifically in the ${religion} tradition.` }]
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
      'ja-JP': 'Orus',
      'hi-IN': 'Laomedeia'
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
