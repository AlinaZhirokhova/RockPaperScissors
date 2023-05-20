const noop = () => { };
const NO_PARAMS = {};
const NO_HEADERS = {};
const OK_200 = [200];

function request({
    method = 'GET',
    login,
    url,
    params = NO_PARAMS,
    headers = NO_HEADERS,
    body,
    responseType = 'json',
    requestType = 'json',
    okResponces = OK_200,
    checkStatusInResponse = false,
    onSuccess = noop,
    onError = noop,
    corsSimpleRequest = false
}) {
    const req = new XMLHttpRequest();

    const urlParams = new URLSearchParams(params);
    const queryString = urlParams.toString();

    req.open(method, url + (queryString ? `?${queryString}` : ''));

    Object.keys(headers).forEach((key) => {
        req.setRequestHeader(key, headers[key]);
    })



    if (!corsSimpleRequest) {
        req.responseType = responseType;

        req.onload = function (event) {
            const target = event.target;

            if (!okResponces.includes(target.status)) {
                onError(target.statusText);

                return;
            }

            if (checkStatusInResponse && target.response.status !== 'ok') {
                onError(target.statusText);

                return;
            }

            onSuccess(target.response);
        }

        req.onerror = function () {
            onError();
        }
    } else {
        req.onreadystatechange = function (event) {
            const target = event.target;

            if (target.readyState === 4) {
                if (!okResponces.includes(target.status)) {
                    onError(target.statusText);
    
                    return;
                }
    
                if (checkStatusInResponse && target.response.status !== 'ok') {
                    onError(target.statusText);
    
                    return;
                }
    
                onSuccess(JSON.parse(target.response));
            }
        }
    }



    let dataBody = body;

    if (!corsSimpleRequest && requestType === 'urlencoded') {
        req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

        const bodyParams = new URLSearchParams(body);

        dataBody = bodyParams.toString();
    }

    if (!corsSimpleRequest && requestType === 'json') {
        req.setRequestHeader('Content-type', 'application/json');

        dataBody = JSON.stringify(body);
    }

    req.send(corsSimpleRequest ? null : dataBody);
}