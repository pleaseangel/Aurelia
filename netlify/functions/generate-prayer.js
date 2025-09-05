// Replace your existing prayer generation logic with this enhanced version

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

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

    // Get emotional context for enhanced personalization
    const emotionalContext = getEmotionalContext(feeling, challenge);
    
    // Get authentic religious structure
    const religiousGreeting = getReligiousGreeting(religion, emotionalContext, timeOfDay);
    const religiousEnding = getReligiousEnding(religion, emotionalContext, timeOfDay);
    const religiousGuidance = getReligiousSystemInstruction(religion, emotionalContext);
    const transitionPhrases = getReligiousTransitionPhrases(religion);
    
    // Generate enhanced, contextual prompt
    const enhancedPrompt = generateEnhancedPrompt(role, feeling, timeOfDay, religion, challenge, emotionalContext);
    
    // Determine prayer length based on emotional context
    const prayerStructures = {
        short: '2-3 sentences',
        medium: '4-6 sentences', 
        long: '6-8 sentences'
    };
    const prayerLength = prayerStructures[emotionalContext.config.length];

    // Enhanced system instruction with religious authenticity
    const systemInstruction = {
        parts: [{ 
            text: `You are a deeply compassionate spiritual guide with authentic knowledge of ${religion} prayer traditions.

RELIGIOUS AUTHENTICITY REQUIREMENTS:
${religiousGuidance}

STRUCTURAL REQUIREMENTS:
- Begin with: "${religiousGreeting}"
- End with: "${religiousEnding}"
- Length: ${prayerLength}
- Tone: ${emotionalContext.config.tone}
- Focus: ${emotionalContext.config.focus}

QUALITY STANDARDS:
- Use authentic religious language and concepts appropriate to ${religion}
- Address their specific role as ${role} and their feeling of ${feeling}
- Directly address the challenge: "${challenge}"
- Include appropriate transitional phrases that sound natural in ${religion} prayers
- Avoid generic spiritual language - be specifically ${religion} in approach
- Balance formal religious structure with personal, heartfelt content
- Ensure the prayer would be recognized as authentically ${religion} by practitioners

The prayer should sound like it came from someone deeply familiar with ${religion} prayer traditions, not a generic spiritual template.`
        }]
    };

    // Step 1: Generate Prayer Text with enhanced prompt
    const textPayload = {
      contents: [{ parts: [{ text: enhancedPrompt }] }],
      tools: [{ "google_search": {} }],
      systemInstruction: systemInstruction,
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

    // Ensure proper religious structure (fallback in case AI doesn't follow instructions exactly)
    if (!prayerText.startsWith(religiousGreeting.split(',')[0])) {
        prayerText = religiousGreeting + '\n\n' + prayerText;
    }
    if (!prayerText.includes(religiousEnding.split('.')[0])) {
        prayerText = prayerText.trim() + '\n\n' + religiousEnding;
    }

    // Voice configuration with emotional pacing
    const voices = {
      'en-US': 'Kore',
      'es-US': 'Puck', 
      'fr-FR': 'Zephyr',
      'pt-BR': 'Iapetus',
      'it-IT': 'Orus',
      'de-DE': 'Leda'
    };

    // Adjust audio pacing based on emotional context
    const audioPacing = determineAudioPacing(emotionalContext);
    
    // Step 2: Generate Prayer Audio with appropriate pacing
    const audioPayload = {
      contents: [{ parts: [{ text: prayerText }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { 
                voiceName: voices[language] || 'Kore'
                // Note: Add speaking rate and pause duration if supported by your TTS API
            }
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

    // Return enhanced response with metadata
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        prayerText, 
        audioData,
        metadata: {
          emotionalCategory: emotionalContext.category,
          prayerLength: emotionalContext.config.length,
          tone: emotionalContext.config.tone,
          religion: religion,
          timeOfDay: timeOfDay
        }
      }),
    };

  } catch (error) {
    console.error('Error in enhanced Netlify function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};

// Helper function to include the enhanced prompt generation
const generateEnhancedPrompt = (role, feeling, timeOfDay, religion, challenge, emotionalContext) => {
    const prayerStructures = {
        short: {
            sentences: '2-3 sentences',
            structure: 'Opening acknowledgment + Core request/gratitude + Closing affirmation'
        },
        medium: {
            sentences: '4-6 sentences', 
            structure: 'Opening + Personal acknowledgment + Specific request + Comfort/strength + Hope + Closing'
        },
        long: {
            sentences: '6-8 sentences',
            structure: 'Opening + Deep acknowledgment + Specific situation + Multiple requests + Comfort + Future hope + Trust affirmation + Closing'
        }
    };
    
    const structure = prayerStructures[emotionalContext.config.length];
    
    return `Generate a deeply personal and authentic ${religion} prayer for someone in this exact situation:

PERSONAL CONTEXT:
- Role: ${role}
- Current feeling: ${feeling}
- Time: ${timeOfDay}
- Specific challenge: "${challenge}"

EMOTIONAL & SPIRITUAL GUIDANCE:
- Primary emotional need: ${emotionalContext.category}
- Prayer approach: ${emotionalContext.config.focus}
- Required tone: ${emotionalContext.config.tone}
- Spiritual intensity needed: ${emotionalContext.config.intensity}

PRAYER STRUCTURE REQUIREMENTS:
- Length: ${structure.sentences}
- Follow this structure: ${structure.structure}
- Must authentically reflect ${religion} prayer traditions
- Address their specific challenge and role directly
- Appropriate for ${timeOfDay} spiritual reflection

AUTHENTICITY REQUIREMENTS:
- Sound like a prayer that would be offered by someone deeply rooted in ${religion}
- Use language and concepts familiar to ${religion} practitioners
- Include appropriate religious concepts and worldview
- Balance formal religious structure with deeply personal content
- Avoid generic spiritual language - be specifically ${religion}

The prayer should feel both traditionally ${religion} and perfectly tailored to this person's exact situation.`;
};
