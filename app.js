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
    // console.log(result);
    // start web server
    app.listen(3000);
  } catch(err) {
    console.error(err.stack);
  }

}

// get records from authors table by author
app.use(function* (next) {
  if(this.path !== '/authors' || this.method !== 'GET') return yield next;
  try {
    let cursor = null;
    if(this.query.author) cursor = yield r.table('authors').filter({author: this.query.author}).run(conn);
    else cursor = yield r.table('authors').run(conn);
    let result = yield cursor.toArray();
    this.body = result;
  } catch(err) {
    console.error(err.stack);
    this.response.status = 500;
    return yield next;
  }
});

// insert a record to authors table
app.use(function* (next) {
  if(this.path !== '/authors/create' || this.method !== 'POST') return yield next;
  try {
    let body = yield parse(this, {limit: '1kb'});
    let result = yield r.table('authors').insert([body]).run(conn);
    this.body = result;
  } catch(err) {
    console.error(err.stack);
    this.response.status = 500;
    return yield next;
  }
});

// update a record from authors table by author
app.use(function* (next) {
  if(this.path !== '/authors/update' || this.method !== 'PUT') return yield next;
  try {
    let body = yield parse(this, {limit: '1kb'});
    let result = yield r.table('authors').filter({author: body.author}).update({author: body.author, tag: body.tag}).run(conn);
    this.body = result;
  } catch(err) {
    console.error(err.stack);
    this.response.status = 500;
    return yield next;
  }
});

// delete a record from authors table by author
app.use(function* (next) {
  if(this.path !== '/authors/delete' || this.method !== 'DELETE') return yield next;
  try {
    let body = yield parse(this, {limit: '1kb'});
    let result = yield r.table('authors').filter({author: body.author}).delete().run(conn);
    this.body = result;
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
