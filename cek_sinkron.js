const request = require('request');
const cron = require('node-cron');

cron.schedule("*/5 * * * * *", function () {

  request('http://localhost:3000/cek_data', { json: true }, (err, res, body) => {
    if (err) { return console.log(err); }
    console.log(res.body);
    // console.log(body.explanation);
  });

})