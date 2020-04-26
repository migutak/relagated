'use strict';

const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');
oracledb.outFormat = oracledb.OBJECT;
oracledb.autoCommit = true;
const axios = require('axios');
const URL = dbConfig.EXTERNALURL

async function run() {

    let connection;

    try {
        // Get a non-pooled connection
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            // The statement to execute
            `SELECT *
       FROM tqall
       where daysinarr = :idbv`,
            [90],
            {
                maxRows: 3
                , outFormat: oracledb.OBJECT  // query result format
                , extendedMetaData: true                 // get extra metadata
                , fetchArraySize: 100                    // internal buffer allocation size for tuning
            });

        const DATA = result.rows;
        for (var i = 0; i < DATA.length; i++) {
            // generate auth
            const tokenBody = {
                "grant_type": "password",
                "scope": "*",
                "client_id": "GMZXWMGXVPXDHSIKADKQVBJNSJMRYNMI",
                "client_secret": "3403119695e68332f07d878068047494",
                "username": "admin",
                "password": "admin"
            }
            const token = await axios.post(URL + '/workflow/oauth2/token', tokenBody);
            const access_token = token.data.access_token;

            // add new case
            const new_case = {
                "pro_uid": "8205775405e4a5988583577039544223",
                "tas_uid": "4555717315e4a5a0116c3e8079046002",
                "variables": [{
                    "accountNumber": DATA[i].ACCNUMBER,
                    "customerNumber": DATA[i].CUSTNUMBER,
                    "requestDate": new Date(),
                    "customerName": DATA[i].CLIENT_NAME,
                    "phoneNumber": DATA[i].CUSTNUMBER,
                    "emailAddress": DATA[i].EMAILADDRESS,
                    "accountBalance": DATA[i].OUSTBALANCE,
                    "arrearsAmount": DATA[i].INSTAMOUNT,
                    "daysInArrears": DATA[i].DAYSINARR,
                    "arocode": DATA[i].AROCODE,
                    "productCode": DATA[i].PRODUCTCODE,
                    "productName": DATA[i].SECTION,
                    "aroName": "",
                    "aroEmail": "",
                    "rrocode": DATA[i].RROCODE,
                    "rrcode_new": "",
                    "rrocode_final": ""
                }]
            }

            const newcaseR = await axios.post(URL + '/api/1.0/workflow/cases', new_case, {
                headers: { Authorization: "Bearer " + access_token }
            });
            // console.log(newcaseR.data.app_uid);
            const app_uid = newcaseR.data.app_uid;

            // re assign to team leader
            const reassignBody = {
                "usr_uid_source": "00000000000000000000000000000001",
                "usr_uid_target": "1959800345e5bd4c172dca3041767725"
            }

            const reassignR = await axios.put(URL + '/api/1.0/workflow/cases/' + app_uid + '/reassign-case', reassignBody, {
                headers: { Authorization: "Bearer " + access_token }
            });
            console.log(reassignR.response);
            console.log('case reassigned');
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (connection) {
            try {
                // Connections should always be released when not needed
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

run();