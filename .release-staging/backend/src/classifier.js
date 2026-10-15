const rules = [
  { words: ['ransomware', 'extortion', 'encrypt'], label: 'Ransomware', weight: 30 },
  { words: ['zero-day', '0-day', 'exploit', 'remote code execution', 'rce'], label: 'Exploitation', weight: 28 },
  { words: ['phishing', 'credential', 'social engineering', 'quishing'], label: 'Phishing', weight: 22 },
  { words: ['malware', 'stealer', 'trojan', 'backdoor', 'botnet'], label: 'Malware', weight: 24 },
  { words: ['breach', 'leak', 'compromised', 'data theft'], label: 'Data Breach', weight: 20 },
  { words: ['ddos', 'denial of service'], label: 'DDoS', weight: 18 }
];

export function classifyThreat(input = '') {
  const text = input.toLowerCase();
  let score = 0;
  const reasons = [];
  const matches = [];

  for (const rule of rules) {
    const found = rule.words.find(w => text.includes(w));
    if (found) {
      score += rule.weight;
      matches.push(rule.label);
      reasons.push(`Matched ${rule.label.toLowerCase()} signal: ${found}`);
    }
  }

  score = Math.min(100, score + (text.length > 160 ? 5 : 0));
  const severity = score >= 70 ? 'critical' : score >= 45 ? 'high' : score >= 20 ? 'medium' : 'low';
  const label = matches[0] || 'Suspicious Activity';
  return { label, score, severity, reasons: reasons.length ? reasons : ['No strong rule-based indicator matched.'] };
}
