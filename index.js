'use strict'
var Q = require('q');
var Promise = require('bluebird');


const factory  = function (status, done){
  const resolve = function (resolved){
    console.log(`resolved ${resolved}`);
    done()};

    const reject = function (rejected){
      console.log(`rejected ${rejected}`);
      done(rejected)};

  if (status === 'resolved') return resolve;
  if (status === 'rejected') return reject;

  throw new Error('wrong');
}
describe('promised test', ()=>{
  it.only('exception q', (done)=>{
    
      Q.longStackSupport = true;
      var p  = Q(2);
      var newP = p.then(()=>{return 2}).then(()=>{throw new Error('exception thrown')}).catch(()=>{
        console.log('in catch');
        return 2;
      }).then(()=>{
        console.log('then after catch');
        var defer = Q.defer();
        defer.resolve(2);
        return defer.promise;
      }).then(()=>{
        console.log('throwing error show be unhandled');
        //throw new Error('promise exception');
        throw 13;
      }).then(factory('resolved', done), factory('rejected', done));

    Q.all([newP]).then(factory('resolved', done), factory('rejected', done));

  })

  it('bluebird', (done)=>{
     var p = Promise.resolve(55).then(()=>{
       console.log('then after catch');

       return  Promise.resolve(100);
     }).then(()=>{
       console.log('throwing error');
       //throw new Error('promise exception');
       throw 3;
     }).then(factory('resolved', done), factory('rejected', done));
  })


})
