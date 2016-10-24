/* eslint-env mocha */

'use strict';

const Q       = require('q');
const Promise = require('bluebird');

const factory = function (status, done) {
    const resolve = function (resolved) {
        console.log(`resolved ${resolved}`);
        done();
    };

    const reject = function (rejected) {
        console.log(`rejected ${rejected}`);
        done(rejected);
    };

    if (status === 'resolved') {
        return resolve;
    }
    if (status === 'rejected') {
        return reject;
    }

    throw new Error('wrong');
};

function onlyOnce(targetFunc) {
    return (function () {
        let executed = false;
        return function () {
            if (!executed) {
                executed = true;
                targetFunc();
            }
        };
    }());
}

describe(
    'Promises test: ', () => {
        it(
            'exception q', (done) => {

                Q.longStackSupport = true;
                const p            = Q.resolve(2);

                const doneOnlyOnce = onlyOnce(done);

                const newP = p.then(() => { return 2; })
                    .then(() => { throw new Error('exception thrown'); })
                    .catch(
                        () => {
                            console.log('in catch');
                            return 2;
                        }
                    )
                    .then(
                        () => {
                            console.log('then after catch');
                            const defer = Q.defer();
                            defer.resolve(2);
                            return defer.promise;
                        }
                    )
                    .then(
                        () => {
                            console.log('throwing error show be unhandled');
                            // throw new Error('promise exception');
                            throw new Error('error 13');
                        }
                    )
                    .then(factory('resolved', doneOnlyOnce), factory('rejected', doneOnlyOnce));

                Q.all([newP])
                    .then(factory('resolved', doneOnlyOnce), factory('rejected', doneOnlyOnce));

            }
        );

        it(
            'bluebird', (done) => {

                const doneOnlyOnce = onlyOnce(done);

                Promise.resolve(55).then(
                    () => {
                        console.log('then after catch');

                        return Promise.resolve(100);
                    }
                ).then(
                    () => {
                        console.log('throwing error');
                        // throw new Error('promise exception');
                        throw new Error('error 3');
                    }
                ).then(factory('resolved', doneOnlyOnce), factory('rejected', doneOnlyOnce));
            }
        );

        it(
            'Q should expose unhandled exceptions', (done) => {

                const doneOnlyOnce = onlyOnce(done);

                // As explained here: https://github.com/kriskowal/q/wiki/API-Reference#qonerror
                Q.onerror = (error) => {
                    console.error(`Q: caught unhandled exception ${error}`);
                    doneOnlyOnce();
                };

                try {

                    const myPromise = Q.resolve();

                    myPromise
                        .then(
                            () => {
                                console.log('Step 1');
                            }
                        )
                        .then(
                            () => {
                                console.log('Step 2', thisNameDoesNotExist); // eslint-disable-line
                            }
                        );

                    // The programmer forgot catch and done.

                    Q.resolve(myPromise);

                } catch (err) {
                    console.log(`Synchronous exception: ${err.stack}`);
                } finally {
                    Q.onerror = () => {};
                }
            }
        );

        it(
            'Q should expose unhandled exceptions #2', (done) => {

                const doneOnlyOnce = onlyOnce(done);

                // As explained here: https://github.com/kriskowal/q/wiki/API-Reference#qonerror
                Q.onerror = (error) => {
                    console.error(`Q: caught unhandled exception ${error}`);
                    doneOnlyOnce();
                };

                try {

                    const myPromise = Q.resolve();

                    const someFailingAsyncFunc = function () {
                        const resultPromise = Q.defer();

                        setTimeout(
                            () => {
                                resultPromise.reject('rejected with timer');
                            }, 100
                        );

                        return resultPromise;
                    };

                    myPromise
                        .then(
                            () => {
                                console.log('Step 1');
                            }
                        )
                        .then(
                            () => {
                                someFailingAsyncFunc().then(
                                    () => {
                                        //
                                    }
                                );
                            }
                        );

                    // The programmer forgot catch and done.

                    Q.resolve(myPromise);

                } catch (err) {
                    console.log(`Synchronous exception: ${err.stack}`);
                } finally {
                    Q.onerror = () => {};
                }
            }
        );


        it(
            'Bluebird should expose unhandled exceptions', (done) => {

                const doneOnlyOnce = onlyOnce(done);

                // As explained here: http://bluebirdjs.com/docs/api/error-management-configuration.html
                process.on('unhandledRejection', (error, promise) => {
                    console.error(`Bluebird: caught unhandled exception from ${promise}: ${error.name}`);
                    doneOnlyOnce();
                });

                try {

                    const myPromise = Promise.resolve();

                    myPromise
                        .then(
                            () => {
                                // console.log('Step 1');
                            }
                        )
                        .then(
                            () => {
                                console.log('Step 2', thisNameDoesNotExist); // eslint-disable-line
                            }
                        );

                    // The programmer forgot catch and done.

                    Promise.resolve(myPromise);

                } catch (err) {
                    console.log(`Synchronous exception: ${err.stack}`);
                } finally {
                    process.on('unhandledRejection', () => {});
                }

            }
        );

        it(
            'Bluebird should expose unhandled exceptions #2', (done) => {

                const doneOnlyOnce = onlyOnce(done);

                // As explained here: http://bluebirdjs.com/docs/api/error-management-configuration.html
                process.on('unhandledRejection', (error, promise) => {
                    console.error(`Bluebird: caught unhandled exception from ${promise}: ${error.name}`);
                    doneOnlyOnce();
                });

                try {
                    const myPromise = Promise.resolve();

                    const someFailingAsyncFunc2 = function () {
                        const resultPromise = new Promise((resolve, reject) => {
                            setTimeout(
                                () => {
                                    console.log('rejecting promise!');
                                    reject('rejected with timer');
                                }, 100
                            );
                        });


                        return resultPromise;
                    };

                    myPromise
                        .then(
                            () => {
                                // console.log('Step 1');
                            }
                        )
                        .then(
                            () => {
                                someFailingAsyncFunc2().then(
                                    () => {
                                        //
                                    }
                                );
                            }
                        );

                    // The programmer forgot catch and done.

                    Promise.resolve(myPromise);

                } catch (err) {
                    console.log(`Synchronous exception: ${err.stack}`);
                } finally {
                    process.on('unhandledRejection', () => {});
                }
            }
        );
    }
);
