const mysql=require('mysql2')
var pool;
try{
    pool=mysql.createPool({
        host:'localhost',
        user:'root',
        password:'Coli@12345',
        database:'listed'
    })
    console.log('Database connection successfully established')
}catch(err){
    console.log('Database connection fail')
}

module.export=pool.promise();