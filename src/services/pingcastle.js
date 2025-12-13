// PingCastle CSV Parser & Service
export const pingcastleService = {
  parseCSV(csvText) {
    const lines = csvText.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      const obj = {};
      headers.forEach((h, i) => {
        let val = values[i] || "";
        val = val.replace(/^"|"$/g, '').trim();
        obj[h] = val;
      });
      return obj;
    });
  },

  processRawData(data) {
    return data.map((row, index) => ({
      id: index,
      title: row.Title || row.Name || "Unknown Rule",
      score: parseInt(row.Risk || row.Score || "0", 10),
      description: row.Description || "No description",
      technical: row.Technical || row.Explanation || "No technical details",
      remediation: row.Remediation || row.Recommendation || "No remediation plan",
      mitre: "",
      nist: "",
      nist11: "",
      cis8: "",
      cis7: "",
      stig: "",
      iso: "",
      pci: "",
      custom: "",
      scope: ["Tout l'environnement"]
    }));
  }
};
