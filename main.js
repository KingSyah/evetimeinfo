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
    const playerCountElement = document.getElementById('player-count');
    const statusIconElement = document.getElementById('status-icon');

    // Converter
    const converterInput = document.getElementById('converter-input');
    const converterTzSelect = document.getElementById('converter-tz-select');
    const converterResult = document.getElementById('converter-result');

    // --- State ---
    let is24HourFormat = localStorage.getItem('is24HourFormat') === 'true';
    let currentTheme = localStorage.getItem('theme') || 'light';
    let showDeviceTime = localStorage.getItem('showDeviceTime') === 'true';
    let isRefreshOnCooldown = false;
    let worldTimezones = JSON.parse(localStorage.getItem('worldTimezones')) || {
        tz1: 'Asia/Jakarta',
        tz2: 'Etc/GMT',
        tz3: 'America/New_York',
        tz4: 'Asia/Tokyo'
    };

    // --- Timezones ---
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
        'UTC+02:00 South Africa, Athens': 'Europe/Helsinki',
        'UTC+03:00 Moscow, Riyadh': 'Europe/Moscow',
        'UTC+03:30 Iran (Tehran)': 'Asia/Tehran',
        'UTC+04:00 Dubai, Abu Dhabi': 'Asia/Dubai',
        'UTC+04:30 Afghanistan (Kabul)': 'Asia/Kabul',
        'UTC+05:00 Pakistan': 'Asia/Tashkent',
        'UTC+05:30 India (IST)': 'Asia/Kolkata',
        'UTC+05:45 Nepal': 'Asia/Kathmandu',
        'UTC+06:00 Bangladesh': 'Asia/Dhaka',
        'UTC+06:30 Myanmar': 'Asia/Yangon',
        'UTC+07:00 Jakarta, Bangkok (WIB)': 'Asia/Jakarta',
        'UTC+08:00 Singapore, Perth (WITA)': 'Asia/Makassar',
        'UTC+08:45 Eucla, Australia': 'Australia/Eucla',
        'UTC+09:00 Tokyo, Seoul (WIT)': 'Asia/Jayapura',
        'UTC+09:30 Darwin, Adelaide': 'Australia/Darwin',
        'UTC+10:00 Sydney, PNG': 'Australia/Sydney',
        'UTC+10:30 Lord Howe Island': 'Australia/Lord_Howe',
        'UTC+11:00 Solomon Islands': 'Pacific/Guadalcanal',
        'UTC+12:00 New Zealand, Fiji': 'Pacific/Auckland',
        'UTC+12:45 Chatham Islands': 'Pacific/Chatham',
        'UTC+13:00 Tonga, Samoa (DST)': 'Pacific/Tongatapu',
        'UTC+14:00 Line Islands': 'Pacific/Kiritimati',
    };

    // --- Matrix Rain ---
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');
    let drops = [];
    let matrixAnimId = null;
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()01';

    const initMatrix = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const cols = Math.floor(canvas.width / 14);
        drops = Array(cols).fill(1).map(() => Math.random() * -canvas.height / 14);
    };

    const drawMatrix = () => {
        ctx.fillStyle = 'rgba(10, 15, 10, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = '13px Share Tech Mono, monospace';
        const cols = drops.length;

        for (let i = 0; i < cols; i++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            const x = i * 14;
            const y = drops[i] * 14;

            // Leading char brighter
            ctx.fillStyle = `rgba(180, 255, 180, ${0.5 + Math.random() * 0.5})`;
            ctx.fillText(char, x, y);

            // Dim trail
            if (y > 14) {
                ctx.fillStyle = `rgba(0, 180, 44, ${0.08 + Math.random() * 0.12})`;
                const trailChar = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(trailChar, x, y - 14);
            }

            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i] += 0.4;
        }

        matrixAnimId = requestAnimationFrame(drawMatrix);
    };

    const startMatrix = () => {
        if (matrixAnimId) return;
        initMatrix();
        drawMatrix();
    };

    const stopMatrix = () => {
        if (matrixAnimId) {
            cancelAnimationFrame(matrixAnimId);
            matrixAnimId = null;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    window.addEventListener('resize', () => {
        if (currentTheme === 'dark') {
            stopMatrix();
            startMatrix();
        }
    });

    // --- EVE API ---
    const ESI_STATUS_URL = 'https://esi.evetech.net/latest/status/?datasource=tranquility';

    const fetchEveStatus = () => {
        if (!serverStatusTextElement) return;

        fetch(ESI_STATUS_URL, { headers: { 'Accept': 'application/json' } })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => {
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
            .catch(() => {
                serverStatusTextElement.textContent = 'Error';
                serverStatusTextElement.className = 'status-offline';
                playerCountElement.textContent = 'N/A';
                statusIconElement.textContent = '🔴';
            });
    };

    // --- Time Formatting ---
    const formatDate = (date, timeZone) => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone,
        }).format(date);
    };

    const formatTime = (date, timeZone, use24 = is24HourFormat) => {
        return new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: !use24,
            timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        }).format(date);
    };

    // --- Clock Update ---
    const updateClocks = () => {
        const now = new Date();

        document.getElementById('eve-time').textContent = formatTime(now, 'UTC');
        document.getElementById('eve-date').textContent = formatDate(now, 'UTC');

        // Downtime countdown (11:00 UTC)
        const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 11, 0, 0, 0));
        if (now.getTime() > target.getTime()) target.setUTCDate(target.getUTCDate() + 1);
        const diff = target - now;

        if (diff <= 600000 && diff > 0) {
            downtimeCountdownElement.classList.add('blinking');
        } else {
            downtimeCountdownElement.classList.remove('blinking');
        }

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        downtimeCountdownElement.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;

        // Indonesia
        document.getElementById('wib-time').textContent = formatTime(now, 'Asia/Jakarta');
        document.getElementById('wib-date').textContent = formatDate(now, 'Asia/Jakarta');
        document.getElementById('wita-time').textContent = formatTime(now, 'Asia/Makassar');
        document.getElementById('wita-date').textContent = formatDate(now, 'Asia/Makassar');
        document.getElementById('wit-time').textContent = formatTime(now, 'Asia/Jayapura');
        document.getElementById('wit-date').textContent = formatDate(now, 'Asia/Jayapura');

        // Device
        document.getElementById('user-time').textContent = formatTime(now, null);
        document.getElementById('user-date').textContent = formatDate(now, Intl.DateTimeFormat().resolvedOptions().timeZone);

        // World
        for (let i = 1; i <= 4; i++) {
            const tz = worldTimezones[`tz${i}`];
            if (tz) {
                document.getElementById(`world-time-${i}`).textContent = formatTime(now, tz);
                document.getElementById(`world-date-${i}`).textContent = formatDate(now, tz);
            }
        }
    };

    const pad = (n) => String(n).padStart(2, '0');

    // --- UTC Time Converter ---
    const converterIdleState = document.getElementById('converter-idle-state');
    const converterActiveState = document.getElementById('converter-active-state');
    const converterResultPanel = document.getElementById('converter-result-panel');
    const converterResultTz = document.getElementById('converter-result-tz');
    const converterDeltaBadge = document.getElementById('converter-delta-badge');
    const converterDayNote = document.getElementById('converter-day-note');
    const converterUtcNow = document.getElementById('converter-utc-now');
    const converterRelative = document.getElementById('converter-relative');

    const parseUtcInput = (raw) => {
        raw = raw.trim();
        let h, m, s = 0;
        const colonMatch = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        const noColon = raw.match(/^(\d{2})(\d{2})(\d{2})?$/);

        if (colonMatch) {
            h = parseInt(colonMatch[1]);
            m = parseInt(colonMatch[2]);
            s = colonMatch[3] ? parseInt(colonMatch[3]) : 0;
        } else if (noColon) {
            h = parseInt(noColon[1]);
            m = parseInt(noColon[2]);
            s = noColon[3] ? parseInt(noColon[3]) : 0;
        } else {
            return null;
        }

        if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) return null;
        return { h, m, s };
    };

    const humanDelta = (diffMs) => {
        const absDiff = Math.abs(diffMs);
        const totalSecs = Math.floor(absDiff / 1000);
        const totalMins = Math.floor(absDiff / 60000);
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;

        let deltaStr = '';
        if (totalSecs < 60) {
            deltaStr = 'kurang dari 1 menit';
        } else if (hours === 0) {
            deltaStr = `${mins} menit`;
        } else if (mins === 0) {
            deltaStr = `${hours} jam`;
        } else {
            deltaStr = `${hours} jam ${mins} menit`;
        }

        return deltaStr;
    };

    const doConvert = () => {
        const raw = converterInput.value;
        const parsed = parseUtcInput(raw);
        const targetTz = converterTzSelect.value;

        if (!parsed) {
            converterIdleState.classList.remove('hidden');
            converterActiveState.classList.add('hidden');
            converterResultPanel.classList.remove('error');
            if (raw.trim().length > 0) {
                converterIdleState.innerHTML = '<span class="converter-idle-icon">⚠️</span><span>Format tidak valid — gunakan HH:MM atau HH:MM:SS</span>';
            } else {
                converterIdleState.innerHTML = '<span class="converter-idle-icon">⌨️</span><span>Masukkan waktu UTC di atas untuk dikonversi</span>';
            }
            return;
        }

        if (!targetTz) return;

        const now = new Date();

        // Build the UTC target datetime (today's date + input time)
        const utcDate = new Date(Date.UTC(
            now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
            parsed.h, parsed.m, parsed.s
        ));

        // Converted time in target tz
        const resultTime = new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: !is24HourFormat,
            timeZone: targetTz,
        }).format(utcDate);

        // TZ display label
        const tzLabel = [...converterTzSelect.options].find(o => o.value === targetTz)?.text || targetTz;

        // Day shift detection
        const utcDay = utcDate.getUTCDate();
        const localDayStr = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: targetTz }).format(utcDate);
        const dayDiff = parseInt(localDayStr) - utcDay;
        let dayNote = '';
        if (dayDiff === 1 || dayDiff <= -27) dayNote = '📅 +1 hari (besok)';
        else if (dayDiff === -1 || dayDiff >= 27) dayNote = '📅 -1 hari (kemarin)';

        // Delta from NOW (in ms)
        const diffMs = utcDate.getTime() - now.getTime();
        const deltaStr = humanDelta(diffMs);

        let badgeClass, badgeText, relativeText;
        if (Math.abs(diffMs) < 60000) {
            // Within 1 minute = "now"
            badgeClass = 'now';
            badgeText = '⚡ Sekarang';
            relativeText = 'Waktu ini sedang berlangsung';
        } else if (diffMs > 0) {
            badgeClass = 'future';
            badgeText = `⏳ ${deltaStr} lagi`;
            relativeText = `Waktu ini akan tiba dalam ${deltaStr}`;
        } else {
            badgeClass = 'past';
            badgeText = `⏪ ${deltaStr} lalu`;
            relativeText = `Waktu ini sudah lewat ${deltaStr} yang lalu`;
        }

        // EVE now in UTC
        const eveNow = formatTime(now, 'UTC');

        // Show active state
        converterIdleState.classList.add('hidden');
        converterActiveState.classList.remove('hidden');
        converterResultPanel.classList.remove('error');

        converterResult.textContent = resultTime;
        converterResultTz.textContent = tzLabel;
        converterDayNote.textContent = dayNote;
        converterDeltaBadge.className = `converter-delta-badge ${badgeClass}`;
        converterDeltaBadge.textContent = badgeText;
        converterUtcNow.textContent = `EVE now: ${eveNow}`;
        converterRelative.textContent = relativeText;
    };

    // Live update the relative time every second so it stays accurate
    const tickConverter = () => {
        if (!converterActiveState.classList.contains('hidden') && converterInput.value.trim().length >= 4) {
            doConvert();
        }
    };

    // Live conversion as user types
    converterInput.addEventListener('input', () => {
        if (converterInput.value.trim().length >= 4) doConvert();
        else {
            converterIdleState.innerHTML = '<span class="converter-idle-icon">⌨️</span><span>Masukkan waktu UTC di atas untuk dikonversi</span>';
            converterIdleState.classList.remove('hidden');
            converterActiveState.classList.add('hidden');
        }
    });

    converterInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doConvert();
    });

    converterTzSelect.addEventListener('change', (e) => {
        localStorage.setItem('converterTz', e.target.value);
        if (converterInput.value.trim()) doConvert();
    });

    // --- Theme ---
    const applyTheme = (theme) => {
        document.documentElement.classList.remove('light-mode', 'dark-mode');
        document.documentElement.classList.add(`${theme}-mode`);
        themeToggleCheckbox.checked = theme === 'dark';
        localStorage.setItem('theme', theme);
        currentTheme = theme;

        if (theme === 'dark') {
            startMatrix();
        } else {
            stopMatrix();
        }
    };

    const toggleTheme = () => applyTheme(currentTheme === 'light' ? 'dark' : 'light');

    // --- Format ---
    const applyFormat = (is24) => {
        formatToggleCheckbox.checked = is24;
        localStorage.setItem('is24HourFormat', is24);
        is24HourFormat = is24;
        updateClocks();
        if (converterInput.value.trim()) doConvert();
    };

    const toggleFormat = () => applyFormat(!is24HourFormat);

    // --- Local Clock View ---
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

    const toggleLocalClockView = () => applyLocalClockView(!showDeviceTime);

    // --- Populate Selects ---
    const populateTimezoneSelects = () => {
        timezoneSelects.forEach((select, index) => {
            const key = `tz${index + 1}`;
            for (const [name, value] of Object.entries(availableTimezones)) {
                const opt = document.createElement('option');
                opt.value = value;
                opt.textContent = name;
                if (value === worldTimezones[key]) opt.selected = true;
                select.appendChild(opt);
            }
            select.addEventListener('change', (e) => {
                worldTimezones[key] = e.target.value;
                localStorage.setItem('worldTimezones', JSON.stringify(worldTimezones));
                updateClocks();
            });
        });

        // Populate converter timezone select
        const defaultConverterTz = localStorage.getItem('converterTz') || 'Asia/Jakarta';
        for (const [name, value] of Object.entries(availableTimezones)) {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = name;
            if (value === defaultConverterTz) opt.selected = true;
            converterTzSelect.appendChild(opt);
        }
        converterTzSelect.addEventListener('change', (e) => {
            localStorage.setItem('converterTz', e.target.value);
        });
    };

    // --- Refresh Button ---
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

    // --- Init ---
    const init = () => {
        applyTheme(currentTheme);
        applyFormat(is24HourFormat);
        applyLocalClockView(showDeviceTime);

        document.getElementById('footer-year').textContent = new Date().getFullYear();

        populateTimezoneSelects();

        fetchEveStatus();
        setInterval(fetchEveStatus, 5 * 60 * 1000);

        updateClocks();
        setInterval(() => { updateClocks(); tickConverter(); }, 1000);

        themeToggleCheckbox.addEventListener('change', toggleTheme);
        formatToggleCheckbox.addEventListener('change', toggleFormat);
        localTimeToggleCheckbox.addEventListener('change', toggleLocalClockView);
        refreshStatusBtn.addEventListener('click', handleRefreshClick);
    };

    init();
});
