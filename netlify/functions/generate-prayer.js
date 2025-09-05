const fetch = require('node-fetch');

// Enhanced emotional context detection
const getEmotionalContext = (feeling, challenge) => {
    const feelingLower = feeling.toLowerCase();
    const challengeLower = challenge.toLowerCase();
    
    const emotionalCategories = {
        gratitude: {
            keywords: ['grateful', 'thankful', 'blessed', 'happy', 'celebrating', 'joyful', 'appreciative'],
            intensity: 'light',
            length: 'short',
            tone: 'uplifting',
            focus: 'acknowledgment'
        },
        struggle: {
            keywords: ['anxious', 'worried', 'stressed', 'overwhelmed', 'struggling', 'difficult', 'hard', 'challenging'],
            intensity: 'medium',
            length: 'medium',
            tone: 'comforting',
            focus: 'strength_and_guidance'
        },
        grief: {
            keywords: ['grieving', 'mourning', 'loss', 'died', 'death', 'departed', 'miss', 'heartbroken', 'sorrow'],
            intensity: 'deep',
            length: 'long',
            tone: 'gentle_comfort',
            focus: 'healing_and_peace'
        },
        crisis: {
            keywords: ['desperate', 'hopeless', 'emergency', 'crisis', 'breaking', 'cant', 'suicide', 'ending'],
            intensity: 'urgent',
            length: 'medium',
            tone: 'immediate_comfort',
            focus: 'hope_and_stability'
        },
        guidance: {
            keywords: ['confused', 'lost', 'decision', 'unsure', 'direction', 'path', 'choice', 'wondering'],
            intensity: 'medium',
            length: 'medium',
            tone: 'wisdom_seeking',
            focus: 'clarity_and_direction'
        },
        celebration: {
            keywords: ['achievement', 'success', 'graduation', 'wedding', 'birth', 'promotion', 'victory'],
            intensity: 'light',
            length: 'short',
            tone: 'celebratory',
            focus: 'thanksgiving_and_sharing'
        },
        healing: {
            keywords: ['sick', 'illness', 'pain', 'hospital', 'surgery', 'recovery', 'healing', 'health'],
            intensity: 'medium',
            length: 'medium',
            tone: 'healing_comfort',
            focus: 'restoration_and_strength'
        }
    };
    
    let primaryCategory = 'general';
    let maxMatches = 0;
    
    for (const [category, config] of Object.entries(emotionalCategories)) {
        const matches = config.keywords.filter(keyword => 
            feelingLower.includes(keyword) || challengeLower.includes(keyword)
        ).length;
        
        if (matches > maxMatches) {
            maxMatches = matches;
            primaryCategory = category;
        }
    }
    
    return {
        category: primaryCategory,
        config: emotionalCategories[primaryCategory] || {
            intensity: 'medium',
            length: 'medium',
            tone: 'general_comfort',
            focus: 'peace_and_guidance'
        }
    };
};

// Enhanced religious structures with Catholic support
const getReligiousGreeting = (religion, emotionalContext, timeOfDay) => {
    const structures = {
        christian: {
            formal: ["Dear Heavenly Father,", "Almighty God,", "Lord Jesus Christ,", "Gracious God,"],
            intimate: ["Dear Jesus,", "Lord,", "Father,", "Abba Father,"],
            crisis: ["Lord Jesus, I cry out to You,", "Heavenly Father, I need You now,"]
        },
        catholic: {
            formal: [
                "In the name of the Father, and of the Son, and of the Holy Spirit.",
                "Heavenly Father,",
                "Most Sacred Heart of Jesus,",
                "Dear Mother Mary, pray for us. Dear Jesus,"
            ],
            marian: [
                "Holy Mary, Mother of God, intercede for me. Dear Jesus,",
                "Blessed Virgin Mary, pray for us. Lord,",
                "Mother of Mercy, lead me to your Son. Jesus,"
            ],
            crisis: [
                "Jesus, I trust in You.",
                "Sacred Heart of Jesus, I place my trust in You.",
                "Mary, Help of Christians, pray for me in this hour of need."
            ]
        },
        muslim: {
            formal: [
                "Bismillahir Rahmanir Rahim. (In the name of Allah, the Most Gracious, the Most Merciful.)",
                "Allahumma (O Allah),",
                "Ya Allah (O Allah),"
            ]
        },
        jewish: {
            formal: ["Adonai,", "Ribbono shel Olam (Master of the Universe),", "Avinu Malkeinu (Our Father, Our King),"]
        },
        hindu: {
            formal: ["Om Namah Shivaya.", "Om Gam Ganapataye Namaha.", "Paramatma (O Supreme Soul),"]
        },
        buddhist: {
            formal: ["May I find peace in this moment,", "With compassionate awareness,", "In the spirit of loving-kindness,"]
        },
        interfaith: {
            formal: ["Divine Source,", "Sacred One,", "Universal Love,"]
        },
        secular: {
            formal: ["In this moment of reflection,", "With intention and mindfulness,", "Seeking inner strength,"]
        }
    };

    const religionStructure = structures[religion] || structures.interfaith;
    let category = 'formal';
    
    if (emotionalContext.config.intensity === 'urgent' && religionStructure.crisis) {
        category = 'crisis';
    } else if (religion === 'catholic' && emotionalContext.config.intensity === 'light' && religionStructure.marian) {
        category = 'marian';
    } else if (emotionalContext.config.intensity === 'light' && religionStructure.intimate) {
        category = 'intimate';
    }
    
    const options = religionStructure[category] || religionStructure.formal;
    return options[Math.floor(Math.random() * options.length)];
};

const getReligiousEnding = (religion, emotionalContext) => {
    const endings = {
        christian: {
            standard: ["In Jesus' name, Amen.", "Through Christ our Lord, Amen.", "Amen."],
            trust: ["I trust in Your perfect will, Amen.", "According to Your will, Amen."]
        },
        catholic: {
            standard: [
                "Through Christ our Lord, Amen.",
                "In the name of the Father, and of the Son, and of the Holy Spirit, Amen.",
                "We ask this through Christ our Lord, Amen."
            ],
            marian: [
                "Mary, Mother of God, pray for us sinners, now and at the hour of our death, Amen.",
                "Through the intercession of the Blessed Virgin Mary, Amen."
            ],
            trust: ["Jesus, I trust in You. Amen.", "Thy will be done on earth as it is in Heaven. Amen."],
            liturgical: [
                "Through Christ our Lord, who lives and reigns with You and the Holy Spirit, one God, forever and ever. Amen."
            ]
        },
        muslim: ["Ameen.", "Hasbunallahu wa ni'mal wakeel. Ameen."],
        jewish: ["Amen.", "Ken yehi ratzon. (May it be Your will.) Amen."],
        hindu: ["Om Shanti Shanti Shanti.", "Sarve bhavantu sukhinah. (May all beings be happy.) Om Shanti."],
        buddhist: ["May all beings be happy and free from suffering.", "Gate gate pāragate pārasaṃgate bodhi svāhā."],
        interfaith: ["And so it is.", "In love and light.", "May it be so."],
        secular: ["With gratitude and intention.", "In hope and determination.", "With mindful awareness."]
    };

    const religionEndings = endings[religion] || endings.interfaith;
    
    let category = 'standard';
    if (emotionalContext.config.focus === 'hope_and_stability' && religionEndings.trust) {
        category = 'trust';
    } else if (religion === 'catholic' && emotionalContext.config.intensity === 'light' && religionEndings.marian) {
        category = 'marian';
    } else if (religion === 'catholic' && emotionalContext.config.intensity === 'deep' && religionEndings.liturgical) {
        category = 'liturgical';
    }
    
    const options = religionEndings[category] || religionEndings.standard || religionEndings;
    return Array.isArray(options) ? options[Math.floor(Math.random() * options.length)] : options;
};

// Enhanced prompt generation
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

// Religion-specific guidance
const getReligiousSystemInstruction = (religion, emotionalContext) => {
    const guidance = {
        christian: `Follow Protestant Christian prayer traditions: Use biblical language when appropriate, reference God's love and Jesus' sacrifice, emphasize faith and trust in God's plan, include references to scripture principles without direct quotes.`,

        catholic: `Follow Catholic prayer traditions: May include Marian intercession (asking Mary to pray for us), reference to saints as intercessors, Trinitarian structure, liturgical language, concepts of grace and mercy, the Sacred Heart devotion, and eucharistic spirituality. Use formal liturgical language when appropriate. Include phrases like "through Christ our Lord" and proper Trinitarian formulations. Consider devotional elements like "Sacred Heart of Jesus" or "Holy Mary, Mother of God."`,
        
        muslim: `Follow Islamic prayer etiquette: Begin with Bismillah, use Arabic phrases appropriately, emphasize Allah's mercy and guidance, reference Islamic principles of patience (sabr) and trust in Allah (tawakkul).`,
        
        jewish: `Follow Jewish prayer customs: Use Hebrew phrases respectfully, reference Jewish values of tikkun olam (repairing the world), emphasize learning and wisdom, respect Sabbath and holiday contexts.`,
        
        hindu: `Follow Hindu devotional traditions: Use Sanskrit phrases respectfully, reference dharma (righteous duty), emphasize the divine within and connection to universal consciousness, respect various deities as aspects of one Divine.`,
        
        buddhist: `Follow Buddhist mindfulness traditions: Emphasize compassion for all beings, reference the Four Noble Truths and Eightfold Path principles, focus on reducing suffering and cultivating wisdom and compassion.`,
        
        interfaith: `Use universal spiritual language that honors all faith traditions, focus on common spiritual values like love, compassion, wisdom, and service to others.`,
        
        secular: `Use mindful, philosophical language focused on human values, inner strength, community connection, and ethical living without religious references.`
    };
    
    return guidance[religion] || guidance.interfaith;
};

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

    // Get enhanced emotional context
    const emotionalContext = getEmotionalContext(feeling, challenge);
    
    // Get authentic religious structure
    const religiousGreeting = getReligiousGreeting(religion, emotionalContext, timeOfDay);
    const religiousEnding = getReligiousEnding(religion, emotionalContext);
    const religiousGuidance = getReligiousSystemInstruction(religion, emotionalContext);
    
    // Generate enhanced prompt
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

    // Voice configuration
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
          timeOfDay: timeOfDay,
          greeting: religiousGreeting,
          ending: religiousEnding
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
