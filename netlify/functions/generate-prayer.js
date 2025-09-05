const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

exports.handler = async (event, context) => {
  // Enable CORS
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
    const { profile } = JSON.parse(event.body);
    
    const languageNames = {
      english: 'English',
      french: 'French',
      spanish: 'Spanish',
      portuguese: 'Portuguese',
      italian: 'Italian',
      german: 'German'
    };

    const religionContext = {
      christian: 'Christian faith tradition, addressing God/Jesus',
      muslim: 'Islamic faith tradition, addressing Allah',
      jewish: 'Jewish faith tradition, addressing Hashem/Adonai',
      hindu: 'Hindu tradition, addressing the Divine/Brahman',
      buddhist: 'Buddhist tradition, focusing on mindfulness and compassion',
      interfaith: 'interfaith/spiritual approach, addressing the Divine/Universe',
      secular: 'secular/mindful approach, focusing on inner strength and wisdom'
    };

    const prompt = `Create a heartfelt, personalized prayer for someone with this profile:
- Role: ${profile.role || 'individual'}
- Current feeling: ${profile.feeling || 'seeking guidance'}
- Time of day: ${profile.timeOfDay}
- Religious/spiritual background: ${religionContext[profile.religion]}
- Specific challenge/need: ${profile.challenge}

The prayer should be:
- Written in ${languageNames[profile.language]}
- 3-4 sentences long
- Appropriate for ${profile.timeOfDay} time
- Respectful of ${profile.religion} tradition
- Directly addressing their challenge: "${profile.challenge}"
- Offering comfort, guidance, and hope
- Ending appropriately for the tradition (Amen, Inshallah, etc.)

Please write only the prayer text, no additional commentary.`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a compassionate spiritual assistant that creates meaningful, respectful prayers for people of all faith backgrounds. Your prayers should be comforting, hopeful, and appropriate to each person\'s religious or spiritual tradition.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 250,
      temperature: 0.8,
    });

    const prayer = completion.data.choices[0].message.content.trim();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ prayer }),
    };

  } catch (error) {
    console.error('Error generating prayer:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate prayer',
        details: error.message 
      }),
    };
  }
};
