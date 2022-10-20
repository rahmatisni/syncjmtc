require('dotenv').config();
var moment = require('moment'); // require

var mysql = require('mysql');
const cron = require('node-cron');

var conn = mysql.createConnection({
  host: '20.10.20.116',
  user: 'root',
  password: 'Jmtc2021!',
  database: 'chatbot_jmtc'
});
const express = require('express');
const { google } = require('googleapis');
const app = express();

// const spreadsheetId = '1ZTKPiA5gmKNHSy3C9QM6Rje_uRHvLOxyXt2r2u8tjkI';
const spreadsheetId = '10CBKG87B0jD26J2xuhZP7vxKTcX9g1Vp_TPj4hm0urc';


// --- helper functions ---
// get auth token
function getAuth() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });
  return auth;
}

// proccure googleSheet method
async function getGoogleSheet(auth) {
  const client = await auth.getClient();
  const googleSheet = google.sheets({ version: 'v4', auth: client });
  return googleSheet;
}
// --- helper functions ---

//fetches data from the spreadsheet
app.get('/', async (req, res) => {

  function formatDate(userDate) {

    var date = moment(userDate, 'DD/MM/YYYY HH:mm:ss');
    var train_date = date.format('YYYY-MM-DD HH:mm:ss');
    // var dateObj = new Date(userDate);
    // var year = dateObj.getFullYear();
    // var date = ('0' + (dateObj.getDate())).slice(-2);
    // var month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
    // var timeParts = ('0' + (dateObj.getHours())).slice(-2);
    // var timeParts1 = ('0' + (dateObj.getMinutes())).slice(-2);
    // var timeParts2 = ('0' + (dateObj.getSeconds())).slice(-2);


    // console.log(train_date);// 20120412

    // return year + '-' + month + '-' + date + ' ' + timeParts + ':' + timeParts1 + ':' + timeParts2;
    return train_date;
    // return userDate;


  }


  const auth = getAuth();
  const googleSheet = await getGoogleSheet(auth);

  // const getMetaData = await googleSheet.spreadsheets.get({
  //   auth,
  //   spreadsheetId,
  // });

  const getSheetData = await googleSheet.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: 'Form Responses 1!A2:G',
  });



  // res.send(getSheetData.data.values);
  // console.log(getSheetData.data.values.length);
  // console.log(getSheetData.data.values[0][5]);
  var querry = [];
  var index = [];
  var fixed = [];

  async function getready() {
    for (i = 0; i < getSheetData.data.values.length; i++) {
      if (getSheetData.data.values[i][6]) {
      }

      else if (!getSheetData.data.values[i][6] && getSheetData.data.values[i][3].charAt(0) == '0') {
        index.push(i + 2);
        var userDate = getSheetData.data.values[i][0];
        var fix_tgl = formatDate(userDate);
        // console.log(fix_tgl);
        // console.log(userDate);
        querry.push([fix_tgl, getSheetData.data.values[i][1], getSheetData.data.values[i][2], getSheetData.data.values[i][3], getSheetData.data.values[i][4], getSheetData.data.values[i][5]]);

        // querry.push(getSheetData.data.values[i]);
      }
      else {

      }
    }
    console.log("Fetch From Google Sheet is Done")
  }

  async function run() {
    for (z = 0; z < 30; z++) {
      try {
        await googleSheet.spreadsheets.values.update({
          auth,
          spreadsheetId,
          range: 'Form Responses 1!G' + index[z],
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [['Done By Bot JMTC']],
          },
        });

        fixed.push(querry[z]);

      } catch (e) {
        // console.error(e);
        console.log('None on Index ', z + 1);
      } finally {
        // console.log('We do clenup here', z);
      }
    }
    console.log("Marking On Google Sheet is Done")

  }

  async function qsql() {
    console.log("Insert To DB is done")

    var sql = "INSERT INTO kirim_kuisioner (Timestamp, Agent, Nama_Pelanggan, Nomor_Handphone, Permintaan_Bantuan, Ruas_Tol) VALUES ? ";
    var querrys = [fixed];
    conn.query(sql, querrys, function (err) {
      if (err) {
        console.log("data kosong");
      }
      // conn.end();
    });
    // console.log(querry);

    res.send(querry);

  }

  getready().then(run().finally(qsql));
  // getready().then(run());

  // getready();





  // for (i = 0; i < getSheetData.data.values.length; i++) {
  //   if (getSheetData.data.values[i][6] == 'Waiting') {
  //     fixed.push(querry[z]);
  //   }
  //   else {
  //   }
  // }

  // var sql = "INSERT INTO kirim_kuisioner (Timestamp, Agent, Nama_Pelanggan, Nomor_Handphone, Permintaan_Bantuan, Ruas_Tol) VALUES ? ";
  // var querrys = [fixed];
  // conn.query(sql, querrys, function (err) {
  //   if (err) throw err;
  //   conn.end();
  // });
  // console.log(querry);


});


app.get('/cek_data', async (req, res) => {

  const auth = getAuth();
  const googleSheet = await getGoogleSheet(auth);

  // const getMetaData = await googleSheet.spreadsheets.get({
  //   auth,
  //   spreadsheetId,
  // });

  const getSheetData = await googleSheet.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: 'Form Responses 1!A2:G',
  });

  var count_sheet;

  async function ceksheet() {
    let y = 0;
    for (i = 0; i < getSheetData.data.values.length; i++) {
      if (getSheetData.data.values[i][6] == 'Done By Bot JMTC') {
        y = y + 1;
      }
      else {

      }
    }
    count_sheet = y;
  }

  async function ceksql() {
    // var count_sql;

    conn.query("SELECT * FROM kirim_kuisioner", function (err, result, fields) {
      if (err) throw err;
      var count_sql = result.length;
      if (count_sheet == count_sql) {
        // res.end("Data Sinkron");
        res.end("Data Sinkron");

      }
      else {
        res.end("Data Tidak Sinkron");
        // console.log("Data Tidak Sinkron");
      }
    });
  }

  ceksheet().then(ceksql());
});

app.listen(3000 || process.env.PORT, () => {
  console.log('Up and running!!');
});

cron.schedule("0 */2 * * * *", function () {
  // var d = new Date();
  // localtime = d.toLocaleTimeString('en-US', { hour12: false });
  // console.log(localtime);  
  console.log("running a task every 2 minute", new Date());
  const request = require('request');

  request('http://localhost:3000/', { json: true }, (err, res, body) => {
    if (err) { return console.log(err); }
    // console.log(body.url);
    // console.log(body.explanation);
  });

})