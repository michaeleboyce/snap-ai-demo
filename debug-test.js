const { extractInterviewData } = require('./lib/interview-extractor.ts');

// Test the specific failing case
const transcript1 = 'I earn $2000 per month from my job at the store.';
console.log('Test 1:', transcript1);
console.log('Result:', extractInterviewData(transcript1));

const transcript2 = 'My rent is $1000, utilities are $100, and medical costs are $50.';  
console.log('\nTest 2:', transcript2);
console.log('Result:', extractInterviewData(transcript2));