function getCurrentJulianDay() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();
    const second = now.getUTCSeconds();
    const millisecond = now.getUTCMilliseconds();
  
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    const JDN = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    const JD = JDN + (hour - 12) / 24 + minute / 1440 + second / 86400 + millisecond / 86400000;
  
    return JD;
  }
  
  function getGMST() {
    const JDT = getCurrentJulianDay();
    const Dtt = JDT - 2451545.0;
    const t = Dtt / 36525.0;
    const GMST = 280.46061837 + 360.98564736629 * Dtt + 0.000387933 * Math.pow(t, 2) - (t * t * t) / 38710000;
    const GMST_hours = (GMST / 15) % 24;
    const GMST_minutes = Math.floor((GMST_hours - Math.floor(GMST_hours)) * 60);
    const GMST_seconds = Math.floor((((GMST_hours - Math.floor(GMST_hours)) * 60) - GMST_minutes) * 60);
  
    return `${Math.floor(GMST_hours)}:${GMST_minutes}:${GMST_seconds}`;
  }
  function getMeanObliquityOfEcliptic(T) {
    const U = T / 100;
    const epsilon_0 = 23 + 26 / 60 + 21.448 / 3600;
    const epsilon = epsilon_0 - 46.815 * U - 0.00059 * Math.pow(U, 2) + 0.001813 * Math.pow(U, 3);
  
    return epsilon;
  }
  
  function getNutationInLongitudeAndObliquity(T) {
    const D = 297.85036 + 445267.11148 * T - 0.0019142 * Math.pow(T, 2) + Math.pow(T, 3) / 189474;
    const M = 357.52772 + 35999.05034 * T - 0.0001603 * Math.pow(T, 2) - Math.pow(T, 3) / 300000;
    const M_prime = 134.96298 + 477198.867398 * T + 0.0086972 * Math.pow(T, 2) + Math.pow(T, 3) / 56250;
    const F = 93.27191 + 483202.017538 * T - 0.0036825 * Math.pow(T, 2) + Math.pow(T, 3) / 327270;
    const omega = 125.04452 - 1934.136261 * T + 0.0020708 * Math.pow(T, 2) + Math.pow(T, 3) / 450000;
    const delta_psi = (-17.20 / 3600) * Math.sin(omega * Math.PI / 180) - (1.32 / 3600) * Math.sin(2 * F * Math.PI / 180) - (0.23 / 3600) * Math.sin(2 * M_prime * Math.PI / 180) + (0.21 / 3600) * Math.sin(2 * omega * Math.PI / 180);
    const delta_epsilon = (9.20 / 3600) * Math.cos(omega * Math.PI / 180) + (0.57 / 3600) * Math.cos(2 * F * Math.PI / 180) + (0.10 / 3600) * Math.cos(2 * M_prime * Math.PI / 180) - (0.09 / 3600) * Math.cos(2 * omega * Math.PI / 180);
  
    return { delta_psi, delta_epsilon };
  }

  function getGAST() {
    const JDT = getCurrentJulianDay();
    const Dtt = JDT - 2451545.0;
    const t = Dtt / 36525.0;
    const GMST = 280.46061837 + 360.98564736629 * Dtt + 0.000387933 * Math.pow(t, 2) - (t * t * t) / 38710000;
    const GMST_hours = (GMST / 15) % 24;
    const GMST_minutes = Math.floor((GMST_hours - Math.floor(GMST_hours)) * 60);
    const GMST_seconds = Math.floor((((GMST_hours - Math.floor(GMST_hours)) * 60) - GMST_minutes) * 60);
    const GMST_milliseconds = Math.floor((((((GMST_hours - Math.floor(GMST_hours)) * 60) - GMST_minutes) * 60) - GMST_seconds) * 1000);
    return GMST_hours;
  }

  function longitudeToHours(longitude) {
    return longitude / 15;
  }

  function getLocalTime(longitude, offset) {
    const GAST = getGAST();
    const long = longitudeToHours(longitude);
    return GAST + long;
  }

  function formatHours(fractionalHours) {
    const hours = Math.floor(fractionalHours);
    const minutes = Math.floor((fractionalHours - hours) * 60);
    const seconds = Math.floor((((fractionalHours - hours) * 60) - minutes) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  // Example usage:
  const LMST = formatHours(getLocalTime(19,1));
  console.log(`Local: ${JSON.stringify(LMST)}`);