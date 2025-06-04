// ShoreSquad JavaScript - Interactive Beach Cleanup Community App
// Author: ShoreSquad Development Team
// Description: Core functionality for weather tracking, event management, and interactive features

'use strict';

// App Configuration
const CONFIG = {
    WEATHER_API_KEY: 'demo_key', // Replace with actual OpenWeatherMap API key
    WEATHER_API_URL: 'https://api.openweathermap.org/data/2.5/weather',
    GEOLOCATION_OPTIONS: {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000 // 10 minutes
    },
    ANIMATION_DELAY: 100,
    STATS_ANIMATION_DURATION: 2000
};

// Global State Management
const AppState = {
    currentLocation: null,
    weatherData: null,
    events: [],
    userPreferences: {
        notifications: true,
        location: false,
        theme: 'light'
    },
    isLoading: false
};

// DOM Elements Cache
const Elements = {
    // Navigation
    navToggle: null,
    navMenu: null,
    navLinks: null,
    bottomNavItems: null,
    
    // Loading
    loadingSpinner: null,
    
    // Hero Section
    joinSquadBtn: null,
    createEventBtn: null,
    
    // Stats
    statNumbers: null,
    
    // Events
    eventsContainer: null,
    loadMoreEventsBtn: null,
    
    // Weather
    weatherWidget: null,
    
    // Map
    interactiveMap: null,
    enableLocationBtn: null,
    
    // Initialize DOM elements
    init() {
        this.navToggle = document.querySelector('.nav-toggle');
        this.navMenu = document.querySelector('.nav-menu');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.bottomNavItems = document.querySelectorAll('.bottom-nav-item');
        
        this.loadingSpinner = document.getElementById('loading-spinner');
        
        this.joinSquadBtn = document.getElementById('joinSquadBtn');
        this.createEventBtn = document.getElementById('createEventBtn');
        
        this.statNumbers = document.querySelectorAll('.stat-number');
        
        this.eventsContainer = document.getElementById('eventsContainer');
        this.loadMoreEventsBtn = document.getElementById('loadMoreEvents');
        
        this.weatherWidget = document.getElementById('weatherWidget');
        
        this.interactiveMap = document.getElementById('interactive-map');
        this.enableLocationBtn = document.getElementById('enableLocation');
    }
};

// Utility Functions
const Utils = {
    // Debounce function for performance optimization
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Format date for display
    formatDate(date) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(date).toLocaleDateString('en-US', options);
    },
    
    // Generate unique ID
    generateId() {
        return 'id-' + Math.random().toString(36).substr(2, 9);
    },
    
    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close" aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
        
        // Handle close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
};

// Navigation Controller
const NavigationController = {
    init() {
        this.setupMobileNavigation();
        this.setupSmoothScrolling();
        this.setupActiveStates();
    },
    
    setupMobileNavigation() {
        if (Elements.navToggle) {
            Elements.navToggle.addEventListener('click', this.toggleMobileMenu);
        }
    },
    
    toggleMobileMenu() {
        const navMenu = Elements.navMenu;
        const isExpanded = Elements.navToggle.getAttribute('aria-expanded') === 'true';
        
        navMenu.classList.toggle('nav-menu-open');
        Elements.navToggle.setAttribute('aria-expanded', !isExpanded);
        Elements.navToggle.innerHTML = !isExpanded ? 
            '<i class="fas fa-times"></i>' : 
            '<i class="fas fa-bars"></i>';
    },
    
    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    },
    
    setupActiveStates() {
        // Update active states on scroll
        const sections = document.querySelectorAll('section[id]');
        const navLinks = [...Elements.navLinks, ...Elements.bottomNavItems];
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, { threshold: 0.6 });
        
        sections.forEach(section => observer.observe(section));
    }
};

// Stats Animation Controller
const StatsController = {
    init() {
        this.setupCounterAnimation();
    },
    
    setupCounterAnimation() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounters();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        const statsSection = document.querySelector('.stats');
        if (statsSection) {
            observer.observe(statsSection);
        }
    },
    
    animateCounters() {
        Elements.statNumbers.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = CONFIG.STATS_ANIMATION_DURATION;
            const increment = target / (duration / 16); // 60fps
            let current = 0;
            
            const updateCounter = () => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target.toLocaleString();
                } else {
                    counter.textContent = Math.floor(current).toLocaleString();
                    requestAnimationFrame(updateCounter);
                }
            };
            
            updateCounter();
        });
    }
};

// Events Controller
const EventsController = {
    sampleEvents: [
        {
            id: 'event-1',
            title: 'Sunrise Beach Cleanup',
            location: 'Santa Monica Beach, CA',
            date: new Date(Date.now() + 86400000), // Tomorrow
            participants: 23,
            organizer: 'EcoWarriors Squad',
            difficulty: 'Easy',
            description: 'Join us for an early morning beach cleanup as the sun rises over the Pacific!'
        },
        {
            id: 'event-2',
            title: 'Pier Cleanup Challenge',
            location: 'Venice Beach Pier, CA',
            date: new Date(Date.now() + 172800000), // Day after tomorrow
            participants: 45,
            organizer: 'Ocean Guardians',
            difficulty: 'Medium',
            description: 'Tackle the pier area and make it sparkle! Free breakfast for all volunteers.'
        },
        {
            id: 'event-3',
            title: 'Family Fun Cleanup',
            location: 'Manhattan Beach, CA',
            date: new Date(Date.now() + 259200000), // 3 days from now
            participants: 67,
            organizer: 'Beach Families United',
            difficulty: 'Easy',
            description: 'Bring the whole family for a fun-filled cleanup with games and prizes!'
        }
    ],
    
    init() {
        this.loadEvents();
        this.setupEventListeners();
    },
    
    loadEvents() {
        AppState.events = [...this.sampleEvents];
        this.renderEvents();
    },
    
    renderEvents() {
        if (!Elements.eventsContainer) return;
        
        Elements.eventsContainer.innerHTML = '';
        
        AppState.events.forEach(event => {
            const eventCard = this.createEventCard(event);
            Elements.eventsContainer.appendChild(eventCard);
        });
    },
    
    createEventCard(event) {
        const card = document.createElement('div');
        card.className = 'event-card fade-in';
        card.innerHTML = `
            <div class="event-header">
                <div class="event-date">
                    <span class="month">${event.date.toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span class="day">${event.date.getDate()}</span>
                </div>
                <div class="event-info">
                    <h3 class="event-title">${event.title}</h3>
                    <p class="event-location">
                        <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                        ${event.location}
                    </p>
                </div>
            </div>
            <div class="event-details">
                <div class="event-meta">
                    <span class="event-participants">
                        <i class="fas fa-users" aria-hidden="true"></i>
                        ${event.participants} joined
                    </span>
                    <span class="event-difficulty difficulty-${event.difficulty.toLowerCase()}">
                        ${event.difficulty}
                    </span>
                </div>
                <p class="event-description">${event.description}</p>
                <div class="event-organizer">
                    <small>Organized by <strong>${event.organizer}</strong></small>
                </div>
            </div>
            <div class="event-actions">
                <button class="btn btn-primary" onclick="EventsController.joinEvent('${event.id}')">
                    <i class="fas fa-plus" aria-hidden="true"></i>
                    Join Squad
                </button>
                <button class="btn btn-outline" onclick="EventsController.shareEvent('${event.id}')">
                    <i class="fas fa-share" aria-hidden="true"></i>
                    Share
                </button>
            </div>
        `;
        
        return card;
    },
    
    setupEventListeners() {
        if (Elements.createEventBtn) {
            Elements.createEventBtn.addEventListener('click', this.openCreateEventModal);
        }
        
        if (Elements.loadMoreEventsBtn) {
            Elements.loadMoreEventsBtn.addEventListener('click', this.loadMoreEvents);
        }
    },
    
    joinEvent(eventId) {
        const event = AppState.events.find(e => e.id === eventId);
        if (event) {
            event.participants += 1;
            this.renderEvents();
            Utils.showNotification(`Successfully joined "${event.title}"!`, 'success');
        }
    },
    
    shareEvent(eventId) {
        const event = AppState.events.find(e => e.id === eventId);
        if (event && navigator.share) {
            navigator.share({
                title: event.title,
                text: `Join me at ${event.title} on ${Utils.formatDate(event.date)}`,
                url: window.location.href
            });
        } else {
            // Fallback for browsers without Web Share API
            const shareText = `Check out this beach cleanup: ${event.title} on ${Utils.formatDate(event.date)}`;
            navigator.clipboard.writeText(shareText).then(() => {
                Utils.showNotification('Event details copied to clipboard!', 'success');
            });
        }
    },
    
    openCreateEventModal() {
        Utils.showNotification('Create Event feature coming soon! 🚀', 'info');
    },
    
    loadMoreEvents() {
        Utils.showNotification('More events loading...', 'info');
        // Simulate API call delay
        setTimeout(() => {
            Utils.showNotification('No more events available right now!', 'info');
        }, 1000);
    }
};

// Weather Controller
const WeatherController = {
    init() {
        this.setupWeatherWidget();
        this.loadWeatherData();
    },
    
    setupWeatherWidget() {
        if (!Elements.weatherWidget) return;
        
        // Add refresh button
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'weather-refresh';
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        refreshBtn.setAttribute('aria-label', 'Refresh weather data');
        refreshBtn.addEventListener('click', () => this.loadWeatherData());
        
        Elements.weatherWidget.appendChild(refreshBtn);
    },
    
    async loadWeatherData() {
        try {
            AppState.isLoading = true;
            this.showWeatherLoading();
            
            // Get user location
            const position = await this.getCurrentPosition();
            AppState.currentLocation = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            };
            
            // In a real app, you would make an API call here
            // const weatherData = await this.fetchWeatherData();
            
            // For demo purposes, using mock data
            const weatherData = this.getMockWeatherData();
            AppState.weatherData = weatherData;
            
            this.renderWeatherWidget(weatherData);
            
        } catch (error) {
            this.showWeatherError(error.message);
        } finally {
            AppState.isLoading = false;
        }
    },
    
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                resolve,
                (error) => {
                    let message = 'Unable to get location';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message = 'Location access denied';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = 'Location unavailable';
                            break;
                        case error.TIMEOUT:
                            message = 'Location request timeout';
                            break;
                    }
                    reject(new Error(message));
                },
                CONFIG.GEOLOCATION_OPTIONS
            );
        });
    },
    
    getMockWeatherData() {
        return {
            location: 'Santa Monica, CA',
            temperature: 75,
            condition: 'Sunny',
            icon: 'fas fa-sun',
            humidity: 65,
            windSpeed: 8,
            uvIndex: 6,
            tideInfo: {
                nextHigh: '3:45 PM',
                nextLow: '9:22 PM'
            },
            forecast: [
                { day: 'Today', high: 75, low: 62, icon: 'fas fa-sun' },
                { day: 'Tomorrow', high: 73, low: 60, icon: 'fas fa-cloud-sun' },
                { day: 'Friday', high: 71, low: 58, icon: 'fas fa-cloud-rain' }
            ]
        };
    },
    
    renderWeatherWidget(data) {
        Elements.weatherWidget.innerHTML = `
            <div class="weather-current">
                <div class="weather-main">
                    <div class="weather-icon">
                        <i class="${data.icon}" aria-hidden="true"></i>
                    </div>
                    <div class="weather-info">
                        <h3 class="weather-location">${data.location}</h3>
                        <div class="weather-temp">${data.temperature}°F</div>
                        <div class="weather-condition">${data.condition}</div>
                    </div>
                </div>
                <div class="weather-details">
                    <div class="weather-detail">
                        <i class="fas fa-tint" aria-hidden="true"></i>
                        <span>Humidity: ${data.humidity}%</span>
                    </div>
                    <div class="weather-detail">
                        <i class="fas fa-wind" aria-hidden="true"></i>
                        <span>Wind: ${data.windSpeed} mph</span>
                    </div>
                    <div class="weather-detail">
                        <i class="fas fa-sun" aria-hidden="true"></i>
                        <span>UV Index: ${data.uvIndex}</span>
                    </div>
                </div>
            </div>
            <div class="weather-tides">
                <h4>Tide Information</h4>
                <div class="tide-info">
                    <span>High: ${data.tideInfo.nextHigh}</span>
                    <span>Low: ${data.tideInfo.nextLow}</span>
                </div>
            </div>
            <div class="weather-forecast">
                <h4>3-Day Forecast</h4>
                <div class="forecast-grid">
                    ${data.forecast.map(day => `
                        <div class="forecast-item">
                            <div class="forecast-day">${day.day}</div>
                            <i class="${day.icon}" aria-hidden="true"></i>
                            <div class="forecast-temps">
                                <span class="high">${day.high}°</span>
                                <span class="low">${day.low}°</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <button class="weather-refresh" aria-label="Refresh weather data">
                <i class="fas fa-sync-alt"></i>
            </button>
        `;
        
        // Re-attach refresh event listener
        const refreshBtn = Elements.weatherWidget.querySelector('.weather-refresh');
        refreshBtn.addEventListener('click', () => this.loadWeatherData());
    },
    
    showWeatherLoading() {
        Elements.weatherWidget.innerHTML = `
            <div class="weather-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading weather data...</p>
            </div>
        `;
    },
    
    showWeatherError(message) {
        Elements.weatherWidget.innerHTML = `
            <div class="weather-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Weather unavailable</p>
                <small>${message}</small>
                <button class="btn btn-outline btn-sm" onclick="WeatherController.loadWeatherData()">
                    Try Again
                </button>
            </div>
        `;
    }
};

// Map Controller
const MapController = {
    init() {
        this.setupMapPlaceholder();
        this.setupLocationButton();
    },
    
    setupMapPlaceholder() {
        if (!Elements.interactiveMap) return;
        
        // Add some interactive elements to the map placeholder
        Elements.interactiveMap.innerHTML = `
            <div class="map-placeholder-content">
                <i class="fas fa-map" aria-hidden="true"></i>
                <h3>Interactive Map</h3>
                <p>Discover beach cleanup locations near you</p>
                <div class="map-features">
                    <div class="map-feature">
                        <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                        <span>Cleanup Locations</span>
                    </div>
                    <div class="map-feature">
                        <i class="fas fa-users" aria-hidden="true"></i>
                        <span>Squad Meetups</span>
                    </div>
                    <div class="map-feature">
                        <i class="fas fa-route" aria-hidden="true"></i>
                        <span>Best Routes</span>
                    </div>
                </div>
                <button class="btn btn-primary" id="enableLocation">
                    <i class="fas fa-location-arrow" aria-hidden="true"></i>
                    Enable Location
                </button>
            </div>
        `;
        
        // Update the enable location button reference
        Elements.enableLocationBtn = Elements.interactiveMap.querySelector('#enableLocation');
        this.setupLocationButton();
    },
    
    setupLocationButton() {
        if (Elements.enableLocationBtn) {
            Elements.enableLocationBtn.addEventListener('click', this.enableLocation);
        }
    },
    
    async enableLocation() {
        try {
            const position = await WeatherController.getCurrentPosition();
            AppState.currentLocation = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            };
            
            Elements.enableLocationBtn.innerHTML = `
                <i class="fas fa-check" aria-hidden="true"></i>
                Location Enabled
            `;
            Elements.enableLocationBtn.disabled = true;
            
            Utils.showNotification('Location enabled! Map features coming soon.', 'success');
            
            // In a real app, you would initialize a map here (Google Maps, Mapbox, etc.)
            setTimeout(() => {
                MapController.showMapComingSoon();
            }, 1000);
            
        } catch (error) {
            Utils.showNotification(`Location error: ${error.message}`, 'error');
        }
    },
    
    showMapComingSoon() {
        Elements.interactiveMap.innerHTML = `
            <div class="map-coming-soon">
                <i class="fas fa-rocket" aria-hidden="true"></i>
                <h3>Interactive Map Coming Soon!</h3>
                <p>We're working on an awesome map feature with:</p>
                <ul>
                    <li>Real-time cleanup locations</li>
                    <li>Squad meetup points</li>
                    <li>Beach condition reports</li>
                    <li>Navigation assistance</li>
                </ul>
                <p>Stay tuned for updates! 🌊</p>
            </div>
        `;
    }
};

// Animation Controller
const AnimationController = {
    init() {
        this.setupScrollAnimations();
        this.setupWaveAnimation();
    },
    
    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });
        
        animatedElements.forEach(el => observer.observe(el));
    },
    
    setupWaveAnimation() {
        const waveElement = document.querySelector('.wave-animation');
        if (waveElement) {
            // Wave animation is handled by CSS, but we could add dynamic effects here
        }
    }
};

// Loading Controller
const LoadingController = {
    init() {
        this.hideLoadingSpinner();
    },
    
    hideLoadingSpinner() {
        setTimeout(() => {
            if (Elements.loadingSpinner) {
                Elements.loadingSpinner.style.opacity = '0';
                setTimeout(() => {
                    Elements.loadingSpinner.style.display = 'none';
                }, 300);
            }
        }, 1000); // Show spinner for at least 1 second
    },
    
    show() {
        if (Elements.loadingSpinner) {
            Elements.loadingSpinner.style.display = 'flex';
            Elements.loadingSpinner.style.opacity = '1';
        }
    },
    
    hide() {
        if (Elements.loadingSpinner) {
            Elements.loadingSpinner.style.opacity = '0';
            setTimeout(() => {
                Elements.loadingSpinner.style.display = 'none';
            }, 300);
        }
    }
};

// Hero Actions Controller
const HeroController = {
    init() {
        this.setupHeroActions();
    },
    
    setupHeroActions() {
        if (Elements.joinSquadBtn) {
            Elements.joinSquadBtn.addEventListener('click', this.handleJoinSquad);
        }
    },
    
    handleJoinSquad() {
        Utils.showNotification('Join Squad feature coming soon! Get ready to make waves! 🌊', 'info');
    }
};

// PWA Controller (Progressive Web App features)
const PWAController = {
    init() {
        this.setupServiceWorker();
        this.setupInstallPrompt();
    },
    
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('SW registered: ', registration);
                    })
                    .catch((registrationError) => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    },
    
    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button
            this.showInstallButton(deferredPrompt);
        });
    },
    
    showInstallButton(deferredPrompt) {
        const installBtn = document.createElement('button');
        installBtn.className = 'install-btn';
        installBtn.innerHTML = `
            <i class="fas fa-download" aria-hidden="true"></i>
            Install App
        `;
        installBtn.addEventListener('click', async () => {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                Utils.showNotification('Thanks for installing ShoreSquad!', 'success');
            }
            installBtn.remove();
        });
        
        document.querySelector('.hero-actions').appendChild(installBtn);
    }
};

// Main App Initialization
class ShoreSquadApp {
    constructor() {
        this.initialized = false;
    }
    
    async init() {
        if (this.initialized) return;
        
        try {
            // Initialize DOM elements
            Elements.init();
            
            // Initialize all controllers
            await Promise.all([
                NavigationController.init(),
                StatsController.init(),
                EventsController.init(),
                WeatherController.init(),
                MapController.init(),
                AnimationController.init(),
                LoadingController.init(),
                HeroController.init(),
                PWAController.init()
            ]);
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Mark as initialized
            this.initialized = true;
            
            console.log('🌊 ShoreSquad app initialized successfully!');
            
        } catch (error) {
            console.error('Error initializing ShoreSquad app:', error);
            Utils.showNotification('App initialization failed. Please refresh the page.', 'error');
        }
    }
    
    setupGlobalEventListeners() {
        // Handle online/offline status
        window.addEventListener('online', () => {
            Utils.showNotification('You\'re back online!', 'success');
        });
        
        window.addEventListener('offline', () => {
            Utils.showNotification('You\'re offline. Some features may be limited.', 'info');
        });
        
        // Handle resize events
        window.addEventListener('resize', Utils.debounce(() => {
            // Handle responsive adjustments if needed
        }, 250));
        
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // App became visible, could refresh data here
            }
        });
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new ShoreSquadApp();
    app.init();
});

// Export for testing purposes (if running in Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ShoreSquadApp,
        Utils,
        CONFIG,
        AppState
    };
}
