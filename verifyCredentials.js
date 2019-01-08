const axios = require('axios');

module.exports = verify;

function verify(credentials, callback) {
    (async () => {
        let result;

        try {
            result = await axios.post(
                `${credentials.url}/rest/V1/integration/admin/token`, {
                    username: credentials.username,
                    password: credentials.password
                }
            );

            console.log('result.data', result.data);

            if (!result || !result.data) {
                return callback(new Error('creds are not valid'));
            }

            // testing api url, trying to retrieve a list of customers
            const baseUrl = `${credentials.url}/rest/V1`;

            const service = await axios.create({
                baseUrl,
                validateStatus: status => [200, 201, 404].includes(status),
                headers: {
                    Authorization: `Bearer ${result.data}`
                }
            });

            const response = await service.get(`${baseUrl}/customers/search?searchCriteria[pageSize]=1`);

            callback(null, response.statusText === 'OK');
        } catch (e) {
            console.error(e);

            callback(e);
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
