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
    // Default world timezones — reset if stale Etc/GMT values are stored
    const storedTz = JSON.parse(localStorage.getItem('worldTimezones'));
    const hasStaleValues = storedTz && Object.values(storedTz).some(v => v && v.startsWith('Etc/GMT-'));
    let worldTimezones = (!storedTz || hasStaleValues) ? {
        tz1: 'Asia/Jakarta',
        tz2: 'Europe/London',
        tz3: 'America/New_York',
        tz4: 'Asia/Tokyo'
    } : storedTz;
    if (hasStaleValues) localStorage.removeItem('worldTimezones');

    // --- Timezones (grouped, Indonesia first) ---
    const timezoneGroups = {
        '🇮🇩 Indonesia': {
            'WIB — UTC+7 (Jakarta, Sumatera, Kalimantan Barat/Tengah)': 'Asia/Jakarta',
            'WITA — UTC+8 (Makassar, Bali, Kalimantan Timur/Selatan)':  'Asia/Makassar',
            'WIT — UTC+9 (Jayapura, Maluku, Papua)':                     'Asia/Jayapura',
        },
        '🌏 Asia & Pasifik': {
            'UTC+05:30 Mumbai, New Delhi (IST)':     'Asia/Kolkata',
            'UTC+05:30 Colombo (Sri Lanka)':          'Asia/Colombo',
            'UTC+05:45 Kathmandu (Nepal)':            'Asia/Kathmandu',
            'UTC+06:00 Dhaka (Bangladesh)':           'Asia/Dhaka',
            'UTC+06:30 Yangon (Myanmar)':             'Asia/Yangon',
            'UTC+07:00 Bangkok, Ho Chi Minh':         'Asia/Bangkok',
            'UTC+08:00 Singapore, Kuala Lumpur':      'Asia/Singapore',
            'UTC+08:00 Beijing, Shanghai':            'Asia/Shanghai',
            'UTC+08:00 Hong Kong':                    'Asia/Hong_Kong',
            'UTC+08:00 Taipei':                       'Asia/Taipei',
            'UTC+08:00 Perth (Australia)':            'Australia/Perth',
            'UTC+09:00 Tokyo (Japan)':                'Asia/Tokyo',
            'UTC+09:00 Seoul (Korea)':                'Asia/Seoul',
            'UTC+09:30 Darwin (no DST)':              'Australia/Darwin',
            'UTC+09:30 Adelaide':                     'Australia/Adelaide',
            'UTC+10:00 Sydney, Melbourne':            'Australia/Sydney',
            'UTC+10:00 Brisbane (no DST)':            'Australia/Brisbane',
            'UTC+10:00 Port Moresby (PNG)':           'Pacific/Port_Moresby',
            'UTC+11:00 Solomon Islands':              'Pacific/Guadalcanal',
            'UTC+12:00 Auckland (New Zealand)':       'Pacific/Auckland',
            'UTC+12:00 Fiji':                         'Pacific/Fiji',
            'UTC+13:00 Nuku\'alofa (Tonga)':          'Pacific/Tongatapu',
            'UTC+14:00 Kiritimati (Line Islands)':    'Pacific/Kiritimati',
        },
        '🌍 Timur Tengah & Afrika': {
            'UTC+02:00 Johannesburg (no DST)':        'Africa/Johannesburg',
            'UTC+02:00 Cairo':                        'Africa/Cairo',
            'UTC+03:00 Riyadh, Kuwait':               'Asia/Riyadh',
            'UTC+03:00 Nairobi':                      'Africa/Nairobi',
            'UTC+03:30 Tehran (Iran)':                'Asia/Tehran',
            'UTC+04:00 Dubai, Abu Dhabi':             'Asia/Dubai',
            'UTC+04:30 Kabul (Afghanistan)':          'Asia/Kabul',
            'UTC+05:00 Karachi, Islamabad':           'Asia/Karachi',
        },
        '🌎 Eropa': {
            'UTC+00:00 London (GMT/BST)':             'Europe/London',
            'UTC+01:00 Paris, Berlin (CET)':          'Europe/Paris',
            'UTC+01:00 Rome, Madrid':                 'Europe/Rome',
            'UTC+02:00 Helsinki, Kyiv':               'Europe/Helsinki',
            'UTC+02:00 Athens, Bucharest':            'Europe/Athens',
            'UTC+03:00 Moscow (no DST)':              'Europe/Moscow',
            'UTC+03:00 Istanbul':                     'Europe/Istanbul',
        },
        '🌎 Amerika': {
            'UTC-03:00 Brasilia':                     'America/Sao_Paulo',
            'UTC-03:00 Buenos Aires (no DST)':        'America/Argentina/Buenos_Aires',
            'UTC-04:00 Atlantic (Halifax)':           'America/Halifax',
            'UTC-05:00 Eastern (New York)':           'America/New_York',
            'UTC-06:00 Central (Chicago)':            'America/Chicago',
            'UTC-07:00 Mountain (Denver)':            'America/Denver',
            'UTC-07:00 Arizona (no DST)':             'America/Phoenix',
            'UTC-08:00 Pacific (Los Angeles)':        'America/Los_Angeles',
            'UTC-09:00 Alaska':                       'America/Anchorage',
            'UTC-10:00 Hawaii (no DST)':              'Pacific/Honolulu',
        },
        '🕐 UTC & Lainnya': {
            'UTC+00:00 Reykjavik (no DST)':           'Atlantic/Reykjavik',
            'UTC-01:00 Azores':                       'Atlantic/Azores',
            'UTC-01:00 Cape Verde':                   'Atlantic/Cape_Verde',
            'UTC-11:00 Niue, Samoa':                  'Pacific/Niue',
            'UTC-12:00 Baker Island':                 'Etc/GMT+12',
        },
    };

    // Flat map for value→label lookup
    const availableTimezones = Object.values(timezoneGroups)
        .reduce((acc, group) => ({ ...acc, ...group }), {});

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

    const doConvert = (tzOverride) => {
        const raw = converterInput.value;
        const parsed = parseUtcInput(raw);
        const targetTz = tzOverride || converterTzSelect.value;

        // --- Invalid input ---
        if (!parsed || !targetTz) {
            converterIdleState.classList.remove('hidden');
            converterActiveState.classList.add('hidden');
            if (raw.trim().length > 0 && !parsed) {
                converterIdleState.innerHTML = '<span class="converter-idle-icon">⚠️</span><span>Format tidak valid — gunakan HH:MM atau HH:MM:SS</span>';
            } else {
                converterIdleState.innerHTML = '<span class="converter-idle-icon">⌨️</span><span>Masukkan waktu UTC di atas untuk dikonversi</span>';
            }
            return;
        }

        const now = new Date();

        // The input represents a UTC clock time — anchor it to today's UTC date
        const utcDate = new Date(Date.UTC(
            now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
            parsed.h, parsed.m, parsed.s
        ));

        // --- Converted time string ---
        const resultTime = new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: !is24HourFormat,
            timeZone: targetTz,
        }).format(utcDate);

        // --- TZ label ---
        let tzLabel = targetTz;
        for (const opt of converterTzSelect.options) {
            if (opt.value === targetTz) { tzLabel = opt.text; break; }
        }

        // --- Day shift ---
        // Compare the LOCAL calendar date of the converted time vs today's local date in target tz
        const toDateStr = (d, tz) => new Intl.DateTimeFormat('en-CA', {
            timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(d);

        const inputLocalDate = toDateStr(utcDate, targetTz);  // what day the input is in target tz
        const nowLocalDate   = toDateStr(now, targetTz);      // what day TODAY is in target tz

        let dayShift = 0; // -1 = yesterday, 0 = today, +1 = tomorrow
        if (inputLocalDate > nowLocalDate) dayShift = 1;
        else if (inputLocalDate < nowLocalDate) dayShift = -1;

        // --- Delta: ms from now to the input moment, adjusted for day shift ---
        // Base diff is purely UTC ms — accurate for same-day
        // For cross-day cases, add/subtract 24h so the badge reflects the local day context
        let diffMs = utcDate.getTime() - now.getTime();
        if (dayShift === 1)  diffMs += 86400000;  // tomorrow: add a day
        if (dayShift === -1) diffMs -= 86400000;  // yesterday: subtract a day

        const deltaStr = humanDelta(diffMs);

        // --- Badge ---
        let badgeClass, badgeText, relativeText;
        if (Math.abs(diffMs) < 60000) {
            badgeClass = 'now';
            badgeText = '⚡ Sekarang';
            relativeText = 'Waktu ini sedang berlangsung';
        } else if (diffMs > 0) {
            badgeClass = 'future';
            badgeText = `⏳ ${deltaStr} lagi`;
            relativeText = `Akan tiba dalam ${deltaStr}`;
        } else {
            badgeClass = 'past';
            badgeText = `⏪ ${deltaStr} lalu`;
            relativeText = `Sudah lewat ${deltaStr} yang lalu`;
        }

        // Day note shown only when cross-day
        let dayNote = '';
        if (dayShift === 1)  dayNote = '📅 Besok (+1 hari)';
        if (dayShift === -1) dayNote = '📅 Kemarin (-1 hari)';

        // --- Render ---
        const eveNow = formatTime(now, 'UTC');

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

    // Live update every second
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
    const buildOptgroups = (selectEl, selectedValue) => {
        for (const [groupLabel, entries] of Object.entries(timezoneGroups)) {
            const og = document.createElement('optgroup');
            og.label = groupLabel;
            for (const [name, value] of Object.entries(entries)) {
                const opt = document.createElement('option');
                opt.value = value;
                opt.textContent = name;
                if (value === selectedValue) opt.selected = true;
                og.appendChild(opt);
            }
            selectEl.appendChild(og);
        }
    };

    const populateTimezoneSelects = () => {
        timezoneSelects.forEach((select, index) => {
            const key = `tz${index + 1}`;
            buildOptgroups(select, worldTimezones[key]);
            select.addEventListener('change', (e) => {
                worldTimezones[key] = e.target.value;
                localStorage.setItem('worldTimezones', JSON.stringify(worldTimezones));
                updateClocks();
            });
        });

        // Converter timezone select
        const defaultConverterTz = localStorage.getItem('converterTz') || 'Asia/Jakarta';
        buildOptgroups(converterTzSelect, defaultConverterTz);
        converterTzSelect.addEventListener('change', (e) => {
            const selectedTz = e.target.value;
            localStorage.setItem('converterTz', selectedTz);
            if (converterInput.value.trim()) doConvert(selectedTz);
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
