"use strict"

const koa    = require('koa');
const r      = require('rethinkdb');
const parse   = require('co-body');
const config = require('./config/config.json');

let app = koa();
let conn = null;

async function setup() {
  try {
    // connect to rethinkdb
    conn = await r.connect(config);
    // create table authors
    // let result = await r.db('test').tableCreate('authors').run(conn);
    // console.log(JSON.stringify(result));
    // start web server
    app.listen(3000);
  } catch(err) {
    console.error(err.stack);
  }

}

// query all records in authors tables
app.use(function* (next) {
  if(this.path !== '/' || this.method !== 'GET') return yield next;
  try {
    let cursor = yield r.table('authors').run(conn);
    let result = yield cursor.toArray();
    this.body = JSON.stringify(result);
  } catch(err) {
    console.error(err.stack);
    this.response.status = 500;
    return yield next;
  }
});

// insert a record to authors table
app.use(function* (next) {
  if(this.path !== '/authors' || this.method !== 'POST') return yield next;
  try {
    let body = yield parse(this, {limit: '1kb'});
    let result = yield r.table('authors').insert([body]).run(conn);
    this.body = JSON.stringify(result);
  } catch(err) {
    console.error(err.stack);
    this.response.status = 500;
    return yield next;
  }
});

// run
setup()
.then( result => console.log('server is listening on port 3000.') )
.catch( err => console.error(err.stack) );
