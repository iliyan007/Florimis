document.addEventListener('DOMContentLoaded', () => {
    console.log('Florimis website loaded');

    const header = document.querySelector('.main-header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > 50) {
            header.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.15)';
        } else {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
        }
        lastScroll = currentScroll;
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 90;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-section, .rent-section, .weather-card, .gallery-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    fetchWeather();
});

async function fetchWeather() {
    const container = document.getElementById('weather-container');
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=42.3667&longitude=23.0167&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=precipitation_probability&timezone=auto';

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data || !data.daily) {
            throw new Error('Invalid data');
        }

        container.innerHTML = '';

        const daily = data.daily;
        const hourly = data.hourly;

        const days = daily.time;
        const codes = daily.weathercode;
        const maxTemps = daily.temperature_2m_max;
        const minTemps = daily.temperature_2m_min;
        const rainProbs = daily.precipitation_probability_max;

        for (let i = 0; i < 7; i++) {
            const date = new Date(days[i]);
            const dayName = date.toLocaleDateString('bg-BG', { weekday: 'short', day: 'numeric', month: 'numeric' });
            const code = codes[i];
            const max = Math.round(maxTemps[i]);
            const min = Math.round(minTemps[i]);
            const icon = getWeatherIcon(code);
            const rainProb = rainProbs ? rainProbs[i] : 0;

            let rainTimeStr = '';
            if (rainProb > 0 && hourly && hourly.precipitation_probability) {
                const startIndex = i * 24;
                const endIndex = startIndex + 24;
                let maxHourlyProb = -1;
                let maxHourlyIndex = -1;

                for (let h = startIndex; h < endIndex; h++) {
                    if (h < hourly.precipitation_probability.length) {
                        if (hourly.precipitation_probability[h] > maxHourlyProb) {
                            maxHourlyProb = hourly.precipitation_probability[h];
                            maxHourlyIndex = h;
                        }
                    }
                }

                if (maxHourlyProb > 0) {
                    const hour = maxHourlyIndex % 24;
                    rainTimeStr = `${hour}:00 ч.`;
                }
            }

            const card = document.createElement('div');
            card.className = 'weather-card';

            let rainHtml = '';
            if (rainProb > 0) {
                rainHtml = `
                    <div class="rain-info">
                        <span class="rain-icon">💧</span>
                        <span class="rain-text">${rainProb}%</span>
                        ${rainTimeStr ? `<span class="rain-time">(${rainTimeStr})</span>` : ''}
                    </div>
                `;
            } else {
                rainHtml = `
                    <div class="rain-info" style="opacity: 0.5;">
                        <span class="rain-icon">💧</span>
                        <span class="rain-text">0%</span>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="weather-date">${dayName}</div>
                <div class="weather-icon-main">${icon}</div>
                ${rainHtml}
                <div class="weather-temps">
                    <div class="temp-box">
                        <span class="temp-icon-small">☀️</span>
                        <span class="temp-value temp-day">${max}°</span>
                    </div>
                    <div class="temp-box">
                        <span class="temp-icon-small">🌑</span>
                        <span class="temp-value temp-night">${min}°</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        }

    } catch (error) {
        console.error('Weather fetch error:', error);
        container.innerHTML = '<p style="text-align: center; color: #e67e22;">Неуспешно зареждане на прогнозата. Моля, опитайте по-късно.</p>';
    }
}

function getWeatherIcon(code) {
    if (code === 0) return '☀️';
    if (code >= 1 && code <= 3) return '⛅';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 85 && code <= 86) return '🌨️';
    if (code >= 95) return '⛈️';
    return '🌡️';
}