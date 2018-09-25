const axios = require('axios');

module.exports = verify;

function verify(credentials, callback) {
    (async () => {
        let result;
        let token;
        let username = credentials.username;
        let password = credentials.password;
        let integrationToken = credentials.integrationToken;
        if (!(username && password && integrationToken)) {
            try {
                if (username && password) {
                    result = await axios.post(
                        `${credentials.url}/rest/V1/integration/admin/token`, {
                            username: username,
                            password: password
                        }
                    );
                    console.log('result.data', result.data);

                    if (!result || !result.data) {
                        return callback(new Error('creds are not valid'));
                    }
                    token = result.data;
                } else if (integrationToken) {
                    token = integrationToken;
                }
                // testing api url, trying to retrieve a list of customers
                const baseUrl = `${credentials.url}/rest/all/V1`;

                const service = await axios.create({
                    baseUrl,
                    validateStatus: status => [200, 201, 404].includes(status),
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const response = await service.get(`${baseUrl}/customers/search?searchCriteria[pageSize]=1`);

                callback(null, response.statusText === 'OK');
            } catch (e) {
                console.error(e);

                callback(e);
            }
        } else {
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
