const axios = require('axios');

const jsonPayload = {
  contact_email: "victormachadogp+1@gmail.com",
  github_url: "https://gist.github.com/victormachadogp/953c868719f7493e9d67c41c551e682d",
  solution_framework: "vue"
};

axios.post('https://api.challenge.hennge.com/challenges/004', jsonPayload, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${Buffer.from("victormachadogp+1@gmail.com:HENNGECHALLENGE").toString('base64')}`
  }
})
.then(response => {
  console.log(response.data);
})
.catch(error => {
  console.error(error.response.data);
});
