document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');
    const formatToggleCheckbox = document.getElementById('format-toggle-checkbox');
    const localTimeToggleCheckbox = document.getElementById('local-time-toggle-checkbox');
    const timezoneSelects = document.querySelectorAll('.timezone-select');
    const indonesiaClocksWrapper = document.getElementById('indonesia-clocks-wrapper');
    const deviceClockWrapper = document.getElementById('device-clock-wrapper');
    const downtimeCountdownElement = document.getElementById('downtime-countdown');
    const refreshStatusBtn = document.getElementById('refresh-status-btn');
    const serverStatusTextElement = document.getElementById('server-status-text');

    // --- State ---
    let is24HourFormat = localStorage.getItem('is24HourFormat') === 'true';
    let currentTheme = localStorage.getItem('theme') || 'light';
    let showDeviceTime = localStorage.getItem('showDeviceTime') === 'true';
    let isRefreshOnCooldown = false;
    let worldTimezones = JSON.parse(localStorage.getItem('worldTimezones')) || {
        tz1: 'Etc/GMT-7', // Default to WIB
        tz2: 'Etc/GMT+0', // Default to UTC
        tz3: 'America/New_York', // Default to ET
        tz4: 'Asia/Tokyo' // Default to JST
    };

    // --- Timezones for World Clock ---
    const availableTimezones = {
        'UTC-12:00 Baker Island': 'Etc/GMT+12',
        'UTC-11:00 Niue, Samoa': 'Etc/GMT+11',
        'UTC-10:00 Hawaii (HAST)': 'Pacific/Honolulu',
        'UTC-09:30 Marquesas Islands': 'Pacific/Marquesas',
        'UTC-09:00 Alaska (AKST)': 'America/Anchorage',
        'UTC-08:00 Pacific (PST)': 'America/Los_Angeles',
        'UTC-07:00 Mountain (MST)': 'America/Denver',
        'UTC-06:00 Central (CST)': 'America/Chicago',
        'UTC-05:00 Eastern (EST)': 'America/New_York',
        'UTC-04:00 Atlantic (AST)': 'America/Halifax',
        'UTC-03:30 Newfoundland': 'America/St_Johns',
        'UTC-03:00 Argentina, Brasilia': 'America/Sao_Paulo',
        'UTC-02:00 South Georgia': 'Atlantic/South_Georgia',
        'UTC-01:00 Cape Verde, Azores': 'Atlantic/Cape_Verde',
        'UTC+00:00 London (GMT/UTC)': 'Etc/GMT',
        'UTC+01:00 Berlin, Paris (CET)': 'Europe/Paris',
        'UTC+02:00 South Africa, Athens (EET)': 'Europe/Helsinki',
        'UTC+03:00 Moscow, Arab Standard': 'Europe/Moscow',
        'UTC+03:30 Iran (Tehran)': 'Asia/Tehran',
        'UTC+04:00 Dubai, Abu Dhabi': 'Asia/Dubai',
        'UTC+04:30 Afghanistan (Kabul)': 'Asia/Kabul',
        'UTC+05:00 Pakistan (Islamabad)': 'Asia/Tashkent',
        'UTC+05:30 India (IST)': 'Asia/Kolkata',
        'UTC+05:45 Nepal (Kathmandu)': 'Asia/Kathmandu',
        'UTC+06:00 Bangladesh, Bhutan': 'Asia/Dhaka',
        'UTC+06:30 Myanmar, Cocos Islands': 'Asia/Yangon',
        'UTC+07:00 Jakarta, Bangkok (WIB)': 'Asia/Jakarta',
        'UTC+08:00 Singapore, Perth, (WITA)': 'Asia/Makassar',
        'UTC+08:45 Eucla, Australia': 'Australia/Eucla',
        'UTC+09:00 Tokyo, Seoul, (WIT)': 'Asia/Jayapura',
        'UTC+09:30 Darwin, Adelaide': 'Australia/Darwin',
        'UTC+10:00 Sydney, Papua New Guinea': 'Australia/Sydney',
        'UTC+10:30 Lord Howe Island': 'Australia/Lord_Howe',
        'UTC+11:00 Solomon Islands': 'Pacific/Guadalcanal',
        'UTC+12:00 New Zealand, Fiji': 'Pacific/Auckland',
        'UTC+12:45 Chatham Islands': 'Pacific/Chatham',
        'UTC+13:00 Tonga, Samoa (DST)': 'Pacific/Tongatapu',
        'UTC+14:00 Line Islands': 'Pacific/Kiritimati',
    };

    // --- EVE API ---
    const ESI_STATUS_URL = 'https://esi.evetech.net/latest/status/?datasource=tranquility';

    const fetchEveStatus = () => {
        fetch(ESI_STATUS_URL, { headers: { 'Accept': 'application/json' } })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const playerCountElement = document.getElementById('player-count');
                const statusIconElement = document.getElementById('status-icon');
                
                if (data && typeof data.players !== 'undefined') {
                    serverStatusTextElement.textContent = data.vip ? 'Online (VIP)' : 'Online';
                    serverStatusTextElement.className = 'status-online';
                    playerCountElement.textContent = data.players.toLocaleString();
                    statusIconElement.textContent = '🟢';
                } else {
                    serverStatusTextElement.textContent = 'Offline';
                    serverStatusTextElement.className = 'status-offline';
                    playerCountElement.textContent = 'N/A';
                    statusIconElement.textContent = '🔴';
                }
            })
            .catch(error => {
                console.error("Failed to fetch EVE status:", error);
                serverStatusTextElement.textContent = 'Error';
                serverStatusTextElement.className = 'status-offline';
                document.getElementById('player-count').textContent = 'N/A';
                document.getElementById('status-icon').textContent = '🔴';
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
        const downtimeTarget = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 11, 0, 0, 0));
        if (now.getTime() > downtimeTarget.getTime()) {
            downtimeTarget.setUTCDate(downtimeTarget.getUTCDate() + 1);
        }
        const diff = downtimeTarget - now.getTime();
        
        if (diff <= 600000 && diff > 0) {
            downtimeCountdownElement.classList.add('blinking');
        } else {
            downtimeCountdownElement.classList.remove('blinking');
        }

        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        downtimeCountdownElement.textContent = 
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
        themeToggleCheckbox.checked = theme === 'dark';
        localStorage.setItem('theme', theme);
        currentTheme = theme;
    };

    const toggleTheme = () => {
        applyTheme(currentTheme === 'light' ? 'dark' : 'light');
    };

    const applyFormat = (is24) => {
        formatToggleCheckbox.checked = is24;
        localStorage.setItem('is24HourFormat', is24);
        is24HourFormat = is24;
        updateClocks(); // Re-render clocks with new format
    };

    const toggleFormat = () => {
        applyFormat(!is24HourFormat);
    };

    const applyLocalClockView = (showDevice) => {
        if (showDevice) {
            indonesiaClocksWrapper.classList.add('hidden');
            deviceClockWrapper.classList.remove('hidden');
        } else {
            indonesiaClocksWrapper.classList.remove('hidden');
            deviceClockWrapper.classList.add('hidden');
        }
        localTimeToggleCheckbox.checked = showDevice;
        localStorage.setItem('showDeviceTime', showDevice);
        showDeviceTime = showDevice;
    };

    const toggleLocalClockView = () => {
        applyLocalClockView(!showDeviceTime);
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

    const handleRefreshClick = () => {
        if (isRefreshOnCooldown) return;

        fetchEveStatus();
        isRefreshOnCooldown = true;
        refreshStatusBtn.disabled = true;

        let cooldown = 10;
        refreshStatusBtn.textContent = cooldown;

        const intervalId = setInterval(() => {
            cooldown--;
            refreshStatusBtn.textContent = cooldown;
            if (cooldown === 0) {
                clearInterval(intervalId);
                refreshStatusBtn.textContent = '🔄';
                refreshStatusBtn.disabled = false;
                isRefreshOnCooldown = false;
            }
        }, 1000);
    };

    // --- Initialization ---
    const init = () => {
        // Apply saved preferences
        applyTheme(currentTheme);
        applyFormat(is24HourFormat);
        applyLocalClockView(showDeviceTime);
        
        // Set footer year
        document.getElementById('footer-year').textContent = new Date().getFullYear();

        // Populate world clock dropdowns
        populateTimezoneSelects();

        // Set up intervals
        fetchEveStatus();
        setInterval(fetchEveStatus, 5 * 60 * 1000); // every 5 minutes
        updateClocks();
        setInterval(updateClocks, 1000); // every second

        // Add event listeners
        themeToggleCheckbox.addEventListener('change', toggleTheme);
        formatToggleCheckbox.addEventListener('change', toggleFormat);
        localTimeToggleCheckbox.addEventListener('change', toggleLocalClockView);
        refreshStatusBtn.addEventListener('click', handleRefreshClick);
    };

    init();
}); 