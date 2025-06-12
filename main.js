document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const themeToggle = document.getElementById('theme-toggle');
    const formatToggle = document.getElementById('format-toggle');
    const timezoneSelects = document.querySelectorAll('.timezone-select');

    // --- State ---
    let is24HourFormat = localStorage.getItem('is24HourFormat') === 'true';
    let currentTheme = localStorage.getItem('theme') || 'light';
    let worldTimezones = JSON.parse(localStorage.getItem('worldTimezones')) || {
        tz1: 'Etc/GMT-7', // Default to WIB
        tz2: 'Etc/GMT+0', // Default to UTC
        tz3: 'America/New_York', // Default to ET
        tz4: 'Asia/Tokyo' // Default to JST
    };

    // --- Timezones for World Clock ---
    const availableTimezones = {
        'UTC-12:00': 'Etc/GMT+12',
        'UTC-11:00': 'Etc/GMT+11',
        'UTC-10:00': 'Etc/GMT+10',
        'UTC-09:30': 'Pacific/Marquesas',
        'UTC-09:00': 'Etc/GMT+9',
        'UTC-08:00': 'America/Los_Angeles', // PST
        'UTC-07:00': 'America/Denver',      // MST
        'UTC-06:00': 'America/Chicago',     // CST
        'UTC-05:00': 'America/New_York',    // EST
        'UTC-04:00': 'America/Halifax',     // AST
        'UTC-03:30': 'America/St_Johns',
        'UTC-03:00': 'America/Sao_Paulo',
        'UTC-02:00': 'Etc/GMT+2',
        'UTC-01:00': 'Etc/GMT+1',
        'UTC+00:00': 'Etc/GMT+0',
        'UTC+01:00': 'Europe/Paris',
        'UTC+02:00': 'Europe/Helsinki',
        'UTC+03:00': 'Europe/Moscow',
        'UTC+03:30': 'Asia/Tehran',
        'UTC+04:00': 'Asia/Dubai',
        'UTC+04:30': 'Asia/Kabul',
        'UTC+05:00': 'Asia/Tashkent',
        'UTC+05:30': 'Asia/Kolkata',
        'UTC+05:45': 'Asia/Kathmandu',
        'UTC+06:00': 'Asia/Dhaka',
        'UTC+06:30': 'Asia/Yangon',
        'UTC+07:00': 'Asia/Jakarta',    // WIB
        'UTC+08:00': 'Asia/Makassar',   // WITA
        'UTC+08:45': 'Australia/Eucla',
        'UTC+09:00': 'Asia/Jayapura',   // WIT
        'UTC+09:30': 'Australia/Darwin',
        'UTC+10:00': 'Australia/Sydney',
        'UTC+10:30': 'Australia/Lord_Howe',
        'UTC+11:00': 'Pacific/Guadalcanal',
        'UTC+12:00': 'Pacific/Auckland',
        'UTC+12:45': 'Pacific/Chatham',
        'UTC+13:00': 'Pacific/Tongatapu',
        'UTC+14:00': 'Pacific/Kiritimati',
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
        downtime.setUTCHours(11, 0, 0, 0); // EVE DT is at 11:00 UTC
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

    const populateTimezoneSelects = () => {
        timezoneSelects.forEach((select, index) => {
            const key = `tz${index + 1}`;
            // Use a sorted list of timezone keys for display
            const sortedTimezones = Object.keys(availableTimezones).sort((a, b) => {
                const offsetA = parseFloat(a.replace('UTC', '').replace(':', '.'));
                const offsetB = parseFloat(b.replace('UTC', '').replace(':', '.'));
                return offsetA - offsetB;
            });

            for (const name of sortedTimezones) {
                const value = availableTimezones[name];
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
    };

    init();
}); 