import { normalizeDiagnosis } from './src/lib/diagnosis';

// Sample from task
const sampleRaw = {
  crop: "",
  disease: "Squirrel Damage",
  type: "pest",
  severity: "medium",
  analysis_details: "The image clearly displays two developing walnut fruits with significant, irregular holes in their outer hulls."
};

const result = normalizeDiagnosis(sampleRaw);
console.log('Extracted crop:', result.crop); // Should be "Walnut"

const serverSample = {
  crop: "",
  analysis_details: "walnut fruits with squirrel damage"
};

console.log('Server extraction test:', normalizeDiagnosis(serverSample).crop);

