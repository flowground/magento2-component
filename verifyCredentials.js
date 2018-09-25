const axios = require('axios');
const {getToken} = require('./lib/helpers');


module.exports = verify;

function verify(credentials, callback) {
    (async () => {
        if (!(credentials.username && credentials.password && credentials.integrationToken)) {
            try {
                let token = await getToken(credentials);
                if (token !== null) {
                    const baseUrl = `${credentials.url}/rest/all/V1`;

                    const service = await axios.create({
                        baseUrl,
                        validateStatus: status => [200, 201, 404].includes(status),
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    const response = await service.get(`${baseUrl}/customers/search?searchCriteria[pageSize]=1`);
                    console.log('Status Text', response.statusText);
                    callback(null, response.statusText === 'OK');
                } else {
                    console.error('Credentials are not valid');
                    return callback(new Error('Credentials are not valid'));
                }
            } catch (e) {
                console.error(e);
                callback(e);
            }
        } else {
            console.error('You need to use one of options: Username and Password or Integration Token');
            return callback(new Error('You need to use one of options: Username and Password or Integration Token'));
        }
    })();
}

// function verifyCredentials(cfg, params) {
//     function doVerification(verify) {
//         return new Promise((resolve, reject) => {
//             function legacyCallback(e, result) {
//                 if (e) {
//                     return reject(e);
//                 }
//                 resolve(result);
//             }
//             const result = verify(cfg, legacyCallback);
//
//             if (result) {
//                 resolve(result);
//             }
//         });
//     }
//
//     /**
//      * In will allow developers to return Promise.resolve(ANYTHING) in verifyCredentials.
//      */
//     function toVerifyCredentialsResponse(result) {
//         if (!_.has(result, 'verified')) {
//             return {
//                 verified: true
//             };
//         }
//
//         return result;
//     }
//
//     function error(e) {
//         return {
//             verified: false,
//             reason: e.message
//         };
//     }
//
//     return Promise.resolve(verify)
//         .then(doVerification)
//         .then(toVerifyCredentialsResponse)
//         .catch(error);
// }
//
// verifyCredentials({
//     username: '',
//     password: '',
//     url: ''
// });
