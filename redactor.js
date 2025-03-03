'use strict';

const stringify = require('json-stringify-safe');
const { isEmpty } = require('lodash');

const REDACT = '************';

const redactableKeys = [
    'password',
    'access_token',
    'refresh_token',
    'accessToken',
    'authorization',
    'newPassword',
    'confirmNewPassword',
    'confirmPassword',
    'currentPassword',
    'user_pass',
    'new_user_pass',
    'otp',
    'pan',
    'aadhaar',
    'aadhaar_no',
    'email_id',
    'mobile_no',
    'phone_no',
    'fp_aadhaar_no',
    'fp_mobile_no',
    'fp_pan',
    'account_no',
    'captcha'
];

const shouldRedact = key => redactableKeys.includes(key);

const checkAndMaskValues = (key, value) => {
    if (value) {
        value = value.toString();
        const len = value.length;
        if (len > 4) {
            return `${value.substring(0, 4)}${REDACT}${value.substring(len - 4, len)}`;
        }
        return REDACT;
    } else {
        return value;
    }

};

const circularReplacer = () => {
    return (key, value) => {
        if (shouldRedact(key)) {
            return checkAndMaskValues(key, value);
        }
        return value;
    };
};

const parser = replacer => o => !isEmpty(o) ? JSON.parse(stringify(o, replacer)) : o;

const redactor = parser(circularReplacer());


function maskMobileNumber(mobileNumber) {
    // Check if the mobile number is at least 4 digits long
    if (mobileNumber.length < 4) {
        return "****"
    }

    // Extract the first 2 letters and last 2 letters of the mobile number
    var firstTwoLetters = mobileNumber.slice(0, 2);
    var lastTwoLetters = mobileNumber.slice(-2);

    // Concatenate the first 2 letters and last 2 letters
    var maskedMobileNumber = firstTwoLetters + "*****" + lastTwoLetters;

    return maskedMobileNumber;
}

const maskValue = (value, suffixCount = 0, prefixCount = 0) => {
    try {
        const length = Number(suffixCount) + Number(prefixCount);
        if (length < value.length) {
            if (value) {
                value = value.toString();
                const len = value.length;
                if (len > length) {
                    return `${value.substring(0, suffixCount)}${REDACT.repeat(len - length)}${value.substring(len - suffixCount, len)}`;
                }
            }
            return value || '';
        } else {
            return value || "";
        }
    } catch (error) {
        return '';
    }
}

function removeNullvaluesFromResponse(response) {
    try {
        if (response && typeof response === 'object') {
            if (Array.isArray(response)) {
                if (response.length === 1 && response[0] === null) {
                    return [];
                } else {
                    return response.map(item => removeNullvaluesFromResponse(item));
                }
            } else {
                for (const key in response) {
                    if (response[key] === null) {
                        response[key] = '';
                    } else if (typeof response[key] === 'object') {
                        response[key] = removeNullvaluesFromResponse(response[key]);
                    }
                }
                return response;
            }
        } else {
            return response;
        }
    } catch (error) {
        return response;
    }
}

module.exports = { redactor, maskMobileNumber, maskValue, removeNullvaluesFromResponse };
