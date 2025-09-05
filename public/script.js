// Updated API call function to match your Netlify function structure
async function callPrayerAPI(profile) {
    try {
        // Map language values to match your Netlify function expectations
        const languageMap = {
            'english': 'en-US',
            'french': 'fr-FR', 
            'spanish': 'es-US',
            'portuguese': 'pt-BR',
            'italian': 'it-IT',
            'german': 'de-DE'
        };

        const requestBody = {
            role: profile.role || 'person seeking prayer',
            feeling: profile.feeling || 'in need of guidance',
            timeOfDay: profile.timeOfDay,
            language: languageMap[profile.language] || 'en-US',
            religion: profile.religion,
            challenge: profile.challenge
        };

        console.log('Sending prayer request:', requestBody);

        const response = await fetch('/.netlify/functions/generate-prayer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }
        
        const data = await response.json();
        
        // Return the complete response for enhanced functionality
        return {
            text: data.prayerText,
            audio: data.audioData,
            metadata: data.metadata || {}
        };
        
    } catch (error) {
        console.error('API call failed:', error);
        throw error; // Let the calling function handle the fallback
    }
}

// Updated generate prayer function to handle the enhanced response
async function generatePrayer() {
    try {
        // Check if challenge is provided
        const challenge = document.getElementById('challenge').value.trim();
        if (!challenge) {
            if (recognition && !isRecording) {
                recognition.start();
                return;
            } else {
                showError('Please describe what you need prayer for.');
                return;
            }
        }
        
        updateButtonState('generating');
        
        const userProfile = getUserProfile();
        
        // Validate required fields
        if (!userProfile.role.trim()) {
            showError('Please enter your role (e.g., Mother, Student, etc.)');
            updateButtonState('ready');
            return;
        }
        
        if (!userProfile.feeling.trim()) {
            showError('Please describe how you are feeling.');
            updateButtonState('ready');
            return;
        }
        
        let prayerResponse;
        
        try {
            prayerResponse = await callPrayerAPI(userProfile);
        } catch (apiError) {
            console.warn('API call failed, using fallback:', apiError);
            showError('Using offline prayer generation...');
            prayerResponse = {
                text: generateFallbackPrayer(userProfile),
                audio: null,
                metadata: { offline: true }
            };
        }
        
        currentPrayer = {
            prayer: prayerResponse.text,
            audio: prayerResponse.audio,
            metadata: prayerResponse.metadata,
            profile: userProfile,
            timestamp: new Date().toISOString(),
            id: generateId()
        };
        
        displayPrayer(currentPrayer);
        
        // Save prayer if user is authenticated
        if (user) {
            await savePrayerToFirebase(currentPrayer);
        } else {
            savePrayerLocally(currentPrayer);
        }
        
    } catch (error) {
        console.error('Error generating prayer:', error);
        showError('Failed to generate prayer. Please check your connection and try again.');
    } finally {
        updateButtonState('ready');
    }
}

// Enhanced fallback prayer generation with Catholic support
function generateFallbackPrayer(profile) {
    // Basic religious greetings and endings for fallback
    const religiousStructures = {
        christian: {
            greeting: "Dear Heavenly Father,",
            ending: "In Jesus' name, Amen."
        },
        catholic: {
            greeting: "In the name of the Father, and of the Son, and of the Holy Spirit.",
            ending: "Through Christ our Lord, Amen."
        },
        muslim: {
            greeting: "Bismillahir Rahmanir Rahim. Ya Allah,",
            ending: "Ameen."
        },
        jewish: {
            greeting: "Adonai,",
            ending: "Amen."
        },
        hindu: {
            greeting: "Om Namah Shivaya.",
            ending: "Om Shanti Shanti Shanti."
        },
        buddhist: {
            greeting: "May I find peace in this moment,",
            ending: "May all beings be happy and free from suffering."
        },
        interfaith: {
            greeting: "Divine Source,",
            ending: "And so it is."
        },
        secular: {
            greeting: "In this moment of reflection,",
            ending: "With gratitude and intention."
        }
    };

    const structure = religiousStructures[profile.religion] || religiousStructures.interfaith;
    
    // Enhanced template based on religion
    let prayerBody;
    
    if (profile.religion === 'catholic') {
        prayerBody = `As I come before You as a ${profile.role} feeling ${profile.feeling} in this ${profile.timeOfDay} time, I humbly ask for Your grace and guidance with ${profile.challenge}. Through Your infinite mercy, grant me strength and peace. Holy Mary, Mother of God, pray for me in this time of need.`;
    } else if (profile.religion === 'muslim') {
        prayerBody = `Ya Rahman Ya Raheem, as Your servant facing ${profile.challenge}, I seek Your guidance as a ${profile.role} feeling ${profile.feeling}. Grant me patience and strength in this ${profile.timeOfDay} hour. You are the best of planners, and I trust in Your wisdom.`;
    } else if (profile.religion === 'jewish') {
        prayerBody = `Ribbono shel Olam, Master of the Universe, hear my prayer as a ${profile.role} feeling ${profile.feeling}. In this ${profile.timeOfDay} time, I bring before You my struggle with ${profile.challenge}. Grant me wisdom and strength to face each day with faith.`;
    } else {
        // Generic Christian or interfaith
        prayerBody = `As I face the challenges of ${profile.challenge}, grant me strength and wisdom. Guide my path as a ${profile.role} feeling ${profile.feeling} in this ${profile.timeOfDay} time. Fill my heart with Your peace and love.`;
    }
    
    return `${structure.greeting}\n\n${prayerBody}\n\n${structure.ending}`;
}

// Enhanced speakPrayer function to use generated audio if available
function speakPrayer() {
    if (!currentPrayer) {
        showError('No prayer to speak.');
        return;
    }
    
    // Use generated audio if available
    if (currentPrayer.audio) {
        try {
            // Convert base64 to audio blob and play
            const audioBlob = base64ToBlob(currentPrayer.audio, 'audio/mp3');
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            audio.onplay = () => showSuccess('Prayer audio is playing...');
            audio.onended = () => URL.revokeObjectURL(audioUrl);
            audio.onerror = (e) => {
                console.error('Audio playback failed:', e);
                fallbackToTTS();
            };
            
            audio.play();
            return;
        } catch (error) {
            console.error('Error playing generated audio:', error);
            fallbackToTTS();
            return;
        }
    }
    
    // Fallback to browser TTS
    fallbackToTTS();
}

// Fallback text-to-speech function
function fallbackToTTS() {
    if (!('speechSynthesis' in window)) {
        showError('Text-to-speech not supported in your browser.');
        return;
    }
    
    // Stop any current speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(currentPrayer.prayer);
    utterance.rate = 0.8;
    utterance.pitch = 0.9;
    utterance.volume = 0.9;
    
    // Set language if available
    const languageMap = {
        english: 'en-US',
        french: 'fr-FR',
        spanish: 'es-ES',
        portuguese: 'pt-PT',
        italian: 'it-IT',
        german: 'de-DE'
    };
    
    if (currentPrayer.profile && languageMap[currentPrayer.profile.language]) {
        utterance.lang = languageMap[currentPrayer.profile.language];
    }
    
    utterance.onstart = () => showSuccess('Prayer is being spoken...');
    utterance.onerror = (event) => {
        console.error('Speech error:', event.error);
        showError('Failed to speak prayer.');
    };
    
    speechSynthesis.speak(utterance);
}

// Utility function to convert base64 to blob
function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}
