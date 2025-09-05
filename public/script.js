// Aurelia Prayer App - Main JavaScript File

// Firebase configuration - replace with your actual config
const firebaseConfig = {
    apiKey: "AIzaSyBW_0cdfNx4KpRxHZH5psSqb8kw4Qrvycw",
    authDomain: "aurelia-79f90.firebaseapp.com",
    projectId: "yaurelia-79f90",
    storageBucket: "aurelia-79f90.firebasestorage.app",
    messagingSenderId: "311469964403",
    appId: "1:311469964403:web:fa01f619f9e62b62ad7e06"
};

// Global variables
let app, db, auth, user;
let recognition = null;
let isRecording = false;
let currentPrayer = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize Firebase and app
async function initializeApp() {
    try {
        // Import Firebase modules
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, connectFirestoreEmulator } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const { getAuth, connectAuthEmulator } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        
        // Initialize Firebase
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        
        // Connect to emulators in development
        if (location.hostname === 'localhost') {
            try {
                connectFirestoreEmulator(db, 'localhost', 8080);
                connectAuthEmulator(auth, 'http://localhost:9099');
            } catch (e) {
                console.log('Emulators may already be connected');
            }
        }
        
        // Initialize speech recognition
        initializeSpeechRecognition();
        
        // Set up auto time detection
        autoSetTimeOfDay();
        
        // Hide loading screen and show main container
        hideLoadingScreen();
        
        // Set up Firebase setup notice
        showFirebaseSetup();
        
        console.log('Aurelia initialized successfully');
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize app. Please refresh the page.');
        hideLoadingScreen();
    }
}

// Hide loading screen
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContainer = document.getElementById('main-container');
    
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainContainer.style.display = 'block';
            mainContainer.classList.add('fade-in');
        }, 500);
    }, 1500); // Show loading for at least 1.5 seconds
}

// Show Firebase setup
function showFirebaseSetup() {
    const firebaseSetup = document.getElementById('firebase-setup');
    const mainApp = document.getElementById('main-app');
    
    setTimeout(() => {
        firebaseSetup.classList.add('hidden');
        mainApp.classList.remove('hidden');
        mainApp.classList.add('slide-up');
    }, 2000);
}

// Initialize speech recognition
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = function() {
            isRecording = true;
            updateButtonState('listening');
        };
        
        recognition.onend = function() {
            isRecording = false;
            updateButtonState('ready');
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            handleSpeechResult(transcript);
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            showError('Voice recognition failed. Please try again or type your request.');
            updateButtonState('ready');
        };
        
        console.log('Speech recognition initialized');
    } else {
        console.log('Speech recognition not supported');
        // Update button to show typing only
        document.getElementById('button-text').textContent = 'Generate Prayer';
        document.getElementById('mic-icon').style.display = 'none';
    }
}

// Handle speech recognition result
function handleSpeechResult(transcript) {
    const challengeField = document.getElementById('challenge');
    
    // If challenge field is empty, fill it; otherwise append
    if (!challengeField.value.trim()) {
        challengeField.value = transcript;
    } else {
        challengeField.value += ' ' + transcript;
    }
    
    // Auto-generate prayer after speech input
    setTimeout(() => generatePrayer(), 1000);
}

// Update button state
function updateButtonState(state) {
    const button = document.querySelector('.start-button');
    const spinner = document.getElementById('spinner');
    const micIcon = document.getElementById('mic-icon');
    const buttonText = document.getElementById('button-text');
    
    switch(state) {
        case 'listening':
            micIcon.classList.add('recording');
            buttonText.textContent = 'Listening...';
            button.disabled = false;
            break;
            
        case 'generating':
            button.disabled = true;
            spinner.style.display = 'inline-block';
            micIcon.style.display = 'none';
            buttonText.textContent = 'Generating Prayer...';
            break;
            
        case 'ready':
        default:
            button.disabled = false;
            spinner.style.display = 'none';
            micIcon.style.display = 'inline-block';
            micIcon.classList.remove('recording');
            buttonText.textContent = recognition ? 'Start Speaking' : 'Generate Prayer';
            break;
    }
}

// Auto-set time of day
function autoSetTimeOfDay() {
    const now = new Date();
    const hour = now.getHours();
    const timeSelect = document.getElementById('time-of-day');
    
    if (hour < 12) {
        timeSelect.value = 'morning';
    } else if (hour < 17) {
        timeSelect.value = 'afternoon';
    } else if (hour < 21) {
        timeSelect.value = 'evening';
    } else {
        timeSelect.value = 'night';
    }
}

// Anonymous sign in
async function signInAnonymously() {
    try {
        const { signInAnonymously: firebaseSignInAnonymously } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        
        const result = await firebaseSignInAnonymously(auth);
        user = result.user;
        
        // Hide auth section and show form
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('prayer-form').classList.remove('hidden');
        document.getElementById('prayer-history').classList.remove('hidden');
        
        showSuccess('Secure session started. Your prayers are private.');
        
        // Load prayer history
        await loadPrayerHistory();
        
    } catch (error) {
        console.error('Anonymous sign in failed:', error);
        // Continue without authentication
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('prayer-form').classList.remove('hidden');
        showError('Continuing without cloud sync. Prayers will be stored locally.');
    }
}

// Generate prayer
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
        const prayer = await callPrayerAPI(userProfile);
        
        currentPrayer = {
            prayer,
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
        showError('Failed to generate prayer. Please try again.');
    } finally {
        updateButtonState('ready');
    }
}

// Get user profile from form
function getUserProfile() {
    return {
        role: document.getElementById('role').value.trim(),
        feeling: document.getElementById('feeling').value.trim(),
        timeOfDay: document.getElementById('time-of-day').value,
        language: document.getElementById('language').value,
        religion: document.getElementById('religion').value,
        challenge: document.getElementById('challenge').value.trim()
    };
}

// Call prayer generation API
async function callPrayerAPI(profile) {
    try {
        const response = await fetch('/.netlify/functions/generate-prayer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ profile })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.prayer;
        
    } catch (error) {
        console.error('API call failed:', error);
        // Fallback to local generation
        return generateFallbackPrayer(profile);
    }
}

// Fallback prayer generation
function generateFallbackPrayer(profile) {
    const templates = {
        english: "Divine presence, as I face the challenges of {challenge}, grant me strength and wisdom. Guide my path as a {role} feeling {feeling} in this {timeOfDay} time. May peace fill my heart. Amen.",
        french: "Présence divine, alors que je fais face aux défis de {challenge}, accorde-moi force et sagesse. Guide mon chemin en tant que {role} me sentant {feeling} en ce moment de {timeOfDay}. Que la paix remplisse mon cœur. Amen.",
        spanish: "Presencia divina, mientras enfrento los desafíos de {challenge}, concédeme fuerza y sabiduría. Guía mi camino como {role} sintiéndome {feeling} en este tiempo de {timeOfDay}. Que la paz llene mi corazón. Amén."
    };
    
    let template = templates[profile.language] || templates.english;
    
    // Replace placeholders
    template = template
        .replace('{challenge}', profile.challenge || 'life\'s journey')
        .replace('{role}', profile.role || 'individual')
        .replace('{feeling}', profile.feeling || 'hopeful')
        .replace('{timeOfDay}', profile.timeOfDay);
    
    return template;
}

// Display prayer
function displayPrayer(prayerData) {
    const { prayer, profile, timestamp } = prayerData;
    
    // Generate title
    let title = 'Your Personal Prayer';
    if (profile.role && profile.timeOfDay) {
        title = `${capitalizeFirst(profile.timeOfDay)} Prayer for ${profile.role}`;
    } else if (profile.timeOfDay) {
        title = `${capitalizeFirst(profile.timeOfDay)} Prayer`;
    } else if (profile.role) {
        title = `Prayer for ${profile.role}`;
    }
    
    // Update display
    document.getElementById('prayer-title').textContent = title;
    document.getElementById('prayer-text').textContent = prayer;
    document.getElementById('prayer-timestamp').textContent = formatTimestamp(timestamp);
    document.getElementById('prayer-display').classList.remove('hidden');
    
    // Smooth scroll to prayer
    document.getElementById('prayer-display').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
    
    // Clear the form
    document.getElementById('challenge').value = '';
    
    // Auto-speak prayer if supported
    if ('speechSynthesis' in window) {
        setTimeout(() => speakPrayer(), 1000);
    }
}

// Speak prayer using text-to-speech
function speakPrayer() {
    if (!('speechSynthesis' in window)) {
        showError('Text-to-speech not supported in your browser.');
        return;
    }
    
    if (!currentPrayer) {
        showError('No prayer to speak.');
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
    
    utterance.onstart = function() {
        showSuccess('Prayer is being spoken...');
    };
    
    utterance.onend = function() {
        console.log('Prayer speech completed');
    };
    
    utterance.onerror = function(event) {
        console.error('Speech error:', event.error);
        showError('Failed to speak prayer.');
    };
    
    speechSynthesis.speak(utterance);
}

// Save prayer (main function)
async function savePrayer() {
    if (!currentPrayer) {
        showError('No prayer to save.');
        return;
    }
    
    try {
        if (user) {
            await savePrayerToFirebase(currentPrayer);
            showSuccess('Prayer saved to your account.');
        } else {
            savePrayerLocally(currentPrayer);
            showSuccess('Prayer saved locally.');
        }
        
        await loadPrayerHistory();
        
    } catch (error) {
        console.error('Error saving prayer:', error);
        showError('Failed to save prayer.');
    }
}

// Save prayer to Firebase
async function savePrayerToFirebase(prayerData) {
    try {
        const { doc, setDoc, collection } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const prayerRef = doc(collection(db, 'prayers'), prayerData.id);
        await setDoc(prayerRef, {
            ...prayerData,
            userId: user.uid
        });
        
    } catch (error) {
        console.error('Error saving to Firebase:', error);
        throw error;
    }
}

// Save prayer locally
function savePrayerLocally(prayerData) {
    try {
        const prayers = getLocalPrayers();
        prayers.unshift(prayerData);
        
        // Keep only last 50 prayers
        prayers.splice(50);
        
        localStorage.setItem('aurelia_prayers', JSON.stringify(prayers));
        
    } catch (error) {
        console.error('Error saving locally:', error);
        throw error;
    }
}

// Get local prayers
function getLocalPrayers() {
    try {
        const stored = localStorage.getItem('aurelia_prayers');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error reading local prayers:', error);
        return [];
    }
}

// Load prayer history
async function loadPrayerHistory() {
    try {
        let prayers = [];
        
        if (user) {
            prayers = await loadPrayersFromFirebase();
        } else {
            prayers = getLocalPrayers();
        }
        
        displayPrayerHistory(prayers);
        
    } catch (error) {
        console.error('Error loading prayer history:', error);
    }
}

// Load prayers from Firebase
async function loadPrayersFromFirebase() {
    try {
        const { collection, query, where, orderBy, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const prayersQuery = query(
            collection(db, 'prayers'),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc'),
            limit(20)
        );
        
        const querySnapshot = await getDocs(prayersQuery);
        const prayers = [];
        
        querySnapshot.forEach((doc) => {
            prayers.push({ id: doc.id, ...doc.data() });
        });
        
        return prayers;
        
    } catch (error) {
        console.error('Error loading from Firebase:', error);
        return [];
    }
}

// Display prayer history
function displayPrayerHistory(prayers) {
    const historyList = document.getElementById('history-list');
    
    if (prayers.length === 0) {
        historyList.innerHTML = '<p style="color: var(--text-light); text-align: center;">No prayers yet. Generate your first prayer!</p>';
        return;
    }
    
    historyList.innerHTML = prayers.map(prayer => `
        <div class="history-item" onclick="loadHistoryPrayer('${prayer.id}')">
            <div class="history-date">${formatTimestamp(prayer.timestamp)}</div>
            <div class="history-preview">${truncateText(prayer.prayer, 100)}</div>
        </div>
    `).join('');
}

// Load prayer from history
function loadHistoryPrayer(prayerId) {
    // Implementation for loading and displaying historical prayer
    console.log('Loading prayer:', prayerId);
}

// Share prayer
async function sharePrayer() {
    if (!currentPrayer) {
        showError('No prayer to share.');
        return;
    }
    
    const shareData = {
        title: 'My Prayer from Aurelia',
        text: currentPrayer.prayer,
        url: window.location.href
    };
    
    try {
        if (navigator.share && navigator.canShare(shareData)) {
            await navigator.share(shareData);
        } else {
            // Fallback to clipboard
            await navigator.clipboard.writeText(currentPrayer.prayer);
            showSuccess('Prayer copied to clipboard!');
        }
    } catch (error) {
        console.error('Error sharing:', error);
        showError('Failed to share prayer.');
    }
}

// Utility functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
    
    // Scroll error into view
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

// Export functions for global access
window.generatePrayer = generatePrayer;
window.signInAnonymously = signInAnonymously;
window.speakPrayer = speakPrayer;
window.savePrayer = savePrayer;
window.sharePrayer = sharePrayer;
