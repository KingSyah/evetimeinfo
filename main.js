document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const themeToggle = document.getElementById('theme-toggle');
    const formatToggle = document.getElementById('format-toggle');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const timezoneSelects = document.querySelectorAll('.timezone-select');

    // --- State ---
    let is24HourFormat = localStorage.getItem('is24HourFormat') === 'true';
    let currentTheme = localStorage.getItem('theme') || 'light';
    let worldTimezones = JSON.parse(localStorage.getItem('worldTimezones')) || {
        tz1: 'America/New_York', // EST
        tz2: 'America/Los_Angeles', // PST
        tz3: 'Europe/Paris', // CET
        tz4: 'Asia/Tokyo' // JST
    };

    // --- Timezones for World Clock ---
    const availableTimezones = {
        'UTC': 'UTC',
        'EST (US East)': 'America/New_York',
        'PST (US West)': 'America/Los_Angeles',
        'CET (Central Europe)': 'Europe/Paris',
        'JST (Japan)': 'Asia/Tokyo',
        'AEST (Australia East)': 'Australia/Sydney',
        'GMT (London)': 'Europe/London'
    };

    // --- EVE API ---
    const ESI_STATUS_URL = 'https://esi.evetech.net/latest/status/?datasource=tranquility';

    const fetchEveStatus = () => {
        fetch(ESI_STATUS_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                document.getElementById('server-status').textContent = data.vip ? 'Online (VIP)' : 'Online';
                document.getElementById('player-count').textContent = data.players.toLocaleString();
            })
            .catch(error => {
                console.error("Failed to fetch EVE status:", error);
                document.getElementById('server-status').textContent = 'Offline/Error';
                document.getElementById('player-count').textContent = 'N/A';
            });
    };

    // --- Time Formatting ---
    const formatDate = (date, timeZone) => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone,
        }).format(date);
    };

    const formatTime = (date, timeZone, use24HourFormat = is24HourFormat) => {
        return new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: !use24HourFormat,
            timeZone,
        }).format(date);
    };

    // --- Clock Update ---
    const updateClocks = () => {
        const now = new Date();

        // EVE Time (UTC)
        document.getElementById('eve-time').textContent = formatTime(now, 'UTC');
        document.getElementById('eve-date').textContent = formatDate(now, 'UTC');

        // Downtime Countdown
        const nowUTC = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
        const downtime = new Date(nowUTC);
        downtime.setUTCHours(18, 0, 0, 0);
        if (nowUTC > downtime) {
            downtime.setUTCDate(downtime.getUTCDate() + 1);
        }
        const diff = downtime - nowUTC;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        document.getElementById('downtime-countdown').textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // Indonesia Times
        document.getElementById('wib-time').textContent = formatTime(now, 'Asia/Jakarta');
        document.getElementById('wib-date').textContent = formatDate(now, 'Asia/Jakarta');
        document.getElementById('wita-time').textContent = formatTime(now, 'Asia/Makassar');
        document.getElementById('wita-date').textContent = formatDate(now, 'Asia/Makassar');
        document.getElementById('wit-time').textContent = formatTime(now, 'Asia/Jayapura');
        document.getElementById('wit-date').textContent = formatDate(now, 'Asia/Jayapura');

        // User's Local Time
        document.getElementById('user-time').textContent = formatTime(now);
        document.getElementById('user-date').textContent = formatDate(now);

        // World Clocks
        for (let i = 1; i <= 4; i++) {
            const tz = worldTimezones[`tz${i}`];
            if (tz) {
                document.getElementById(`world-time-${i}`).textContent = formatTime(now, tz);
                document.getElementById(`world-date-${i}`).textContent = formatDate(now, tz);
            }
        }
    };

    // --- UI & Preferences ---
    const applyTheme = (theme) => {
        document.body.classList.remove('light-mode', 'dark-mode');
        document.body.classList.add(`${theme}-mode`);
        themeToggle.textContent = theme === 'light' ? 'Dark Mode' : 'Light Mode';
        localStorage.setItem('theme', theme);
        currentTheme = theme;
    };

    const toggleTheme = () => {
        applyTheme(currentTheme === 'light' ? 'dark' : 'light');
    };

    const applyFormat = (is24) => {
        formatToggle.textContent = is24 ? '12-Hour Format' : '24-Hour Format';
        localStorage.setItem('is24HourFormat', is24);
        is24HourFormat = is24;
        updateClocks(); // Re-render clocks with new format
    };

    const toggleFormat = () => {
        applyFormat(!is24HourFormat);
    };

    const handleTabClick = (e) => {
        tabButtons.forEach(button => button.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        e.currentTarget.classList.add('active');
        const tabId = e.currentTarget.getAttribute('data-tab');
        document.getElementById(`${tabId}-clocks`).classList.add('active');
        localStorage.setItem('activeTab', tabId);
    };
    
    const populateTimezoneSelects = () => {
        timezoneSelects.forEach((select, index) => {
            const key = `tz${index + 1}`;
            for (const [name, value] of Object.entries(availableTimezones)) {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = name;
                if (value === worldTimezones[key]) {
                    option.selected = true;
                }
                select.appendChild(option);
            }
            select.addEventListener('change', (e) => {
                worldTimezones[key] = e.target.value;
                localStorage.setItem('worldTimezones', JSON.stringify(worldTimezones));
                updateClocks();
            });
        });
    };

    // --- Initialization ---
    const init = () => {
        // Apply saved preferences
        applyTheme(currentTheme);
        applyFormat(is24HourFormat);
        
        // Restore active tab
        const activeTab = localStorage.getItem('activeTab') || 'indonesia';
        const activeButton = document.querySelector(`.tab-button[data-tab="${activeTab}"]`);
        if (activeButton) {
            activeButton.click();
        }


        // Populate world clock dropdowns
        populateTimezoneSelects();

        // Set up intervals
        fetchEveStatus();
        setInterval(fetchEveStatus, 5 * 60 * 1000); // every 5 minutes
        updateClocks();
        setInterval(updateClocks, 1000); // every second

        // Add event listeners
        themeToggle.addEventListener('click', toggleTheme);
        formatToggle.addEventListener('click', toggleFormat);
        tabButtons.forEach(button => button.addEventListener('click', handleTabClick));
    };

    init();
}); 