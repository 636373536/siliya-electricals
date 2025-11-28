require('dotenv').config();
const { sendEmail } = require('./utils/email.js');

sendEmail({
  to: 'mtenjeinnocent96@example.com',
  subject: 'Test from Siliya',
  html: '<h1>It works!</h1>'
}).then(console.log);