/**
 * Function which guides user through the setup process in the specified language
 * @param  {String} lng the language to use (user will be asked for prefered language also in the setup process)
 */
function setup(lng) {
    swal({
        title: translate('LANGUAGE_SETUP', lng),
        input: 'select',
        animation: true,
        confirmButtonText: translate('NEXT', lng),
        cancelButtonText: translate('CANCEL', lng),
        allowOutsideClick: false,
        inputOptions: {en: translate('LNG_EN', lng), de: translate('LNG_DE', lng)}, // available languages
        showCancelButton: true,
        preConfirm: function (language) {
            return new Promise(function (resolve, reject) {
                lng = setValue('lng', language);
                translatePage(lng);
                resolve();
            });
        }
    }).then(function() {
        swal.setDefaults({
            confirmButtonText: translate('NEXT', lng),
            cancelButtonText: translate('CANCEL', lng),
            showCancelButton: true,
            allowOutsideClick: false,
            showLoaderOnConfirm: true,
            animation: true,
            progressSteps: ['1', '2', '3']
        });

        var steps = [
            {
                title: translate('WELCOME', lng),
                text: translate('WELCOME_TEXT', lng),
                input: 'select',
                inputOptions: {register: translate('LOGIN_TYPE_REGISTER', lng), login: translate('LOGIN_TYPE_LOGIN', lng)},
                preConfirm: function (loginType) {
                    return new Promise(function (resolve, reject) {
                        setTimeout(function() {
                            if(loginType === 'login') {
                                // login modal
                                var loginModal = {
                                    title: translate('LOGIN', lng),
                                    text: translate('LOGIN_TEXT', lng),
                                    input: 'text',
                                    inputValidator: function (input) {
                                        return new Promise(function (resolve, reject) {
                                            if (input.length === 6) resolve();
                                            else reject(translate('AKEY_LENGTH_ERROR', lng));
                                        });
                                    },
                                    preConfirm: function(akey) {
                                        return new Promise(function (resolve, reject) {
                                            // save entered akey
                                            setValue('akey', akey);
                                            // add password modal for login
                                            swal.insertQueueStep({
                                                title: translate('LOGIN_PASSWORD', lng),
                                                text: translate('LOGIN_PASSWORD_TEXT', lng),
                                                input: 'password',
                                                inputValidator: function (input) {
                                                    return new Promise(function (resolve, reject) {
                                                        if (input.length >= 6) resolve();
                                                        else reject(translate('PASSWORD_LENGTH_ERROR', lng));
                                                    });
                                                },
                                                preConfirm: function(password) {
                                                    return new Promise(function (resolve, reject) {
                                                        setTimeout(function () {
                                                            // login account
                                                            sendRequest('login', {akey: getValue('akey'), password: password}, function(err, regRes) {
                                                                if(!err && regRes) {
                                                                    setValue('token', regRes.token);
                                                                    resolve();
                                                                } else reject(translate('LOGIN_FAILED', lng));
                                                            });
                                                        }, 2000);
                                                    });
                                                }
                                            });
                                            resolve();
                                        });
                                    }
                                };
                                // steps.push(loginModal);
                                swal.insertQueueStep(loginModal);
                                resolve();
                            } else {
                                // get key for account to prepare registration
                                sendRequest('getkey', {}, function(err, keyRes) {
                                    if(!err && keyRes) {
                                        setValue('akey', keyRes.akey);
                                        // add password modal for register
                                        swal.insertQueueStep({
                                            title: translate('REGISTER', lng),
                                            text: translate('REGISTER_TEXT', lng),
                                            input: 'password',
                                            inputValidator: function (input) {
                                                return new Promise(function (resolve, reject) {
                                                    if (input.length >= 6) resolve();
                                                    else reject(translate('PASSWORD_LENGTH_ERROR', lng));
                                                });
                                            },
                                            preConfirm: function(password) {
                                                return new Promise(function (resolve, reject) {
                                                    setTimeout(function () {
                                                        // register account
                                                        sendRequest('register', {akey: getValue('akey'), password: password}, function(err, regRes) {
                                                            if(!err && regRes) {
                                                                setValue('token', regRes.token);
                                                                resolve();
                                                            } else reject(translate('CONNECTION_ERROR', lng));
                                                        });
                                                    }, 2000);
                                                });
                                            }
                                        });
                                        resolve();
                                    } else reject(translate('CONNECTION_ERROR', lng));
                                });
                            }
                        }, 2000)
                    });
                }
            }
        ];

        swal.queue(steps).then(function (result) {
            swal({
                title: translate('SETUP_COMPLETE', lng),
                text: translate('SETUP_COMPLETE_TEXT', lng),
                preConfirm: function() {
                    return new Promise(function (resolve, reject) {
                        swal.resetDefaults();
                        setValue('setupCompleted', true);
                        // go to settings page after successfull registration
                        window.location.href = './settings.html';
                    });
                }
            });
        }, function () {
            swal.resetDefaults();
        }).catch(function() {});
    },
    function(dismiss) {

    })
}

/**
 * Function which logins the user to retrieve token
 * NOTE: This function is normally not necessary because on setup the user retrieves a valid token
 * Will be useful later if user can change account to connect the account with multiple devices
 * @param  {String} lng the language to use for the login process
 */
function login(lng) {
    swal({
        title: translate('LOGIN', lng),
        text: translate('LOGIN_TEXT', lng),
        input: 'password',
        showCancelButton: true,
        cancelButtonText: translate('CANCEL', lng),
        confirmButtonText: translate('LOGIN', lng),
        showLoaderOnConfirm: true,
        inputValidator: function (input) {
            return new Promise(function (resolve, reject) {
                if (input.length >= 6) resolve();
                else reject(translate('PASSWORD_LENGTH_ERROR', lng));
            });
        },
        preConfirm: function (password) {
            return new Promise(function (resolve, reject) {
                setTimeout(function() {
                    sendRequest('login', {akey: getValue('akey'), password: password}, function(err, loginRes) {
                        if(!err && loginRes) {
                            setValue('token', loginRes.token);
                            resolve();
                        } else reject(translate('LOGIN_FAILED', lng));
                    });
                }, 2000)
            });
        },
        allowOutsideClick: false
    }).then(function () {
        swal({
            type: 'success',
            title: translate('LOGIN_SUCCESSFUL', lng)
        });
    }).catch(function() {});
}

/**
 * Function which changes the password for the account
 * @param  {String} lng the language to use for the change password process
 */
function changePW(lng) {
    swal.setDefaults({
        input: 'password',
        confirmButtonText: translate('NEXT', lng),
        cancelButtonText: translate('CANCEL', lng),
        showCancelButton: true,
        allowOutsideClick: false,
        inputValidator: function (input) {
            return new Promise(function (resolve, reject) {
                if (input.length >= 6) resolve();
                else reject(translate('PASSWORD_LENGTH_ERROR', lng));
            });
        },
        progressSteps: ['1', '2', '3']
    });

    var oldPW,
        pw1,
        steps = [
        {
            title: translate('OLD_PASSWORD', lng),
            text: translate('OLD_PASSWORD_TEXT', lng),
            preConfirm: function(password) {
                return new Promise(function (resolve, reject) {
                    oldPW = password;
                    resolve();
                });
            }
        },
        {
            title: translate('NEW_PASSWORD', lng),
            text: translate('NEW_PASSWORD_TEXT', lng),
            preConfirm: function(password) {
                return new Promise(function (resolve, reject) {
                    pw1 = password;
                    resolve();
                });
            }
        },
        {
            title: translate('NEW_PASSWORD_RETYPE', lng),
            text: translate('NEW_PASSWORD_RETYPE_TEXT', lng),
            showLoaderOnConfirm: true,
            preConfirm: function (password) {
                return new Promise(function (resolve, reject) {
                    setTimeout(function() {
                        if (password !== pw1) reject(translate('PASSWORD_MISMATCH', lng));
                        else {
                            sendRequest('changepw', {
                                akey: getValue('akey'),
                                token: getValue('token'),
                                password: oldPW,
                                newpassword: password
                            }, function(err, changeRes) {
                                if(!err && changeRes) resolve();
                                else reject(translate('CHANGE_PASSWORD_FAILED', lng));
                            });
                        }
                    }, 2000)
                });
            }
        }
    ];

    swal.queue(steps).then(function (result) {
        swal.resetDefaults()
        swal({
            title: translate('CHANGE_PASSWORD_SUCCESSFUL', lng),
            confirmButtonText: 'OK',
            type: 'success',
            showCancelButton: false
        }).catch(function() {});
    }, function () {
        swal.resetDefaults()
    }).catch(function() {});
}

/**
 * Function which shows consumption dialog to set consumption for estimated range calculation
 * @return {void}
 */
function consumption() {
    swal({
        title: translate('CONSUMPTION', getValue('lng', 'en')),
        text: translate('CONSUMPTION_TEXT', getValue('lng', 'en')),
        preConfirm: function(consumption) {
            return new Promise(function (resolve, reject) {
                setValue('consumption', consumption);
                resolve();
            });
        },
        type: 'question',
        input: 'range',
        inputAttributes: {
            min: 8,
            max: 25,
            step: 0.1
        },
        inputValue: getValue('consumption', 13)
    }, function() {
        console.log(arguments);
    }).catch(function() {});
}

/**
 * Function to remotely control the car
 */
function remoteControl() {
    var lng = getValue('lng', 'en');

    swal.setDefaults({
        confirmButtonText: translate('NEXT', lng),
        cancelButtonText: translate('CANCEL', lng),
        showCancelButton: true,
        allowOutsideClick: false,
        progressSteps: ['1', '2', '3', '4']
    });

    var steps = [
        {
            title: translate('REMOTE_CONTROL_1', lng),
            type: 'info',
            text: translate('REMOTE_CONTROL_1_TEXT', lng)
        },
        {
            title: translate('REMOTE_CONTROL_2', lng),
            type: 'warning',
            text: translate('REMOTE_CONTROL_2_TEXT', lng)
        },
        {
            title: translate('REMOTE_CONTROL_3', lng),
            text: translate('REMOTE_CONTROL_3_TEXT', lng),
            showLoaderOnConfirm: true,
            preConfirm: function () {
                return new Promise(function (resolve, reject) {
                    setTimeout(function() {
                        resolve();
                    }, 6789)
                });
            }
        },
        {
            title: translate('REMOTE_CONTROL_4', lng),
            text: translate('REMOTE_CONTROL_4_TEXT', lng),
            showLoaderOnConfirm: true,
            preConfirm: function () {
                return new Promise(function (resolve, reject) {
                    setTimeout(function() {
                        resolve();
                    }, 4567)
                });
            }
        }
    ];

    swal.queue(steps).then(function (result) {
        swal.resetDefaults()
        swal({
            title: translate('REMOTE_CONTROL_END', lng),
            text: translate('REMOTE_CONTROL_END_TEXT', lng),
            confirmButtonText: 'OK',
            type: 'error',
            showCancelButton: false
        }).then(function() {
            swal({
                title: translate('REMOTE_CONTROL_END_2', lng),
                html: translate('REMOTE_CONTROL_END_2_TEXT', lng),
                confirmButtonText: 'OK',
                type: 'info',
                showCancelButton: false
            }).catch(function() {});
        }).catch(function() {});
    }, function () {
        swal.resetDefaults()
    }).catch(function() {});
}