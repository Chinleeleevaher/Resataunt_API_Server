var express = require('express')
var cors = require('cors')
const mysql = require('mysql');
var app = express();
const port = process.env.PORT || 3005;
var bodyParser = require('body-parser');
const { json } = require('express/lib/response');
var jsonParser = bodyParser.json();
const bcrypt = require('bcrypt');
const saltRounds = 10;
var jwt = require('jsonwebtoken');
const secret = 'toulao'
const multer = require("multer");
const path = require("path");

const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "",
    database: "dbRestaurant"

    // user: "a6ba34_dbtest",
    // host: "mysql5040.site4now.net",
    // password: "db123456",
    // database: "db_a6ba34_dbtest"
})

app.use(cors())

app.listen(8080, () => {
    console.log('Go to http://localhost:3306/User');
   });


app.post('/register', jsonParser, function (req, res, next) {
    db.query(
        'Select username from tbusers where username=?',
        [req.body.username],
        function (err, results, fields) {
            if (err) {
                res.json({ status: 'error', message: err })
                return
            }
            // var user = res.json({ status: 'ok',data:results })
            if(Object.keys(results).length){
                console.log('data ='+results.length);
                res.json({ status: false,message:'user already exit',data:[] });
                return
            }else{
                //res.json({ status: 'data is null',data:results })
                bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
                    db.query(
                        'INSERT INTO tbusers (username, password, email) VALUES (?, ?, ?)',
                        [req.body.username, hash, req.body.email],
                        function (err, userData, fields) {
                            if (err) {
                                res.json({ status: 'error', message: err })
                                return
                            }
                            res.json({ status: true,data:userData,message:'sucess' })
                        }
                    );
                });
            }
            
        }
    );

})

app.get('/load', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'SELECT * FROM tbusers',
            function (err, results, fields) {
                if (err) {
                    res.json({ status: 'error', message: err })
                    return
                }
                res.json({ status: 'ok', data: results })
            }
        );
    });
})

app.post('/login', jsonParser, function (req, res, next) {
    db.query(
        'SELECT * FROM tbusers WHERE username=?',
        [req.body.username],
        function (err, users, fields) {
            if (err) {
                res.json({ status: 'error', message: err })
                return
            }
            if (users.length == 0) {
                res.json({ status: 'error', message: 'Not found user' })
                return
            }
            bcrypt.compare(req.body.password, users[0].password, function (err, isLogin) {
                if (isLogin) {
                    var token = jwt.sign({ username: users[0].username }, secret, { expiresIn: '1h' });
                    res.json({ status: true, message: 'login success',data:users, token })
                }
                else {
                    res.json({ status: 'error', message: 'login faild' })
                }

            });

        }
    );

})

app.post('/authen', jsonParser, function (req, res, next) {
    try {
        const token = req.headers.authorization.split(' ')[1]
        var decoded = jwt.verify(token, secret);
        res.json({ status: 'ok', decoded })
    } catch (err) {
        res.json({ status: 'error', message: err.message })
    }
})

app.get('/tableType', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'SELECT * FROM tbTableType',
            function (err, results, fields) {
                if (err) {
                    res.json({ status: 'error', message: err })
                    return
                }
                res.json({ status: 200, data: results, message: err })
            }
        );
    });
})

app.post('/table', jsonParser, function (req, res, next) {
    
    var sql = '';
    if(req.body.typeId!="" || req.body.typeId !=0){
        sql = 'SELECT * FROM tbTable where tabletype_id=?'
    }else{
        sql ='SELECT * FROM tbTable'
    }
    db.query(
        sql, [req.body.typeId],
        function (err, results, fields) {
            if (err) {
                res.json({ status: 'error', message: err })
                return
            }
            res.json({ status: 200, data: results, message: err })
        }
    );

})

// app.post('/table', jsonParser, function (req, res, next) {
//     bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
//         db.query(
//             'SELECT * FROM tbTable where tabletype_id=?', [req.body.tabletype_id],
//             function (err, results, fields) {
//                 console.log('id=' + req.body.tabletype_id);
//                 if (err) {
//                     res.json({ status: 'error', message: err })
//                     return
//                 }
//                 console.log(results);
//                 res.json({ status: 200, data: results, message: err })
//             }
//         );
//     });
// })

//---------of add table------------------------
app.post('/add-table', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'INSERT INTO tbTable (table_name, table_size, tabletype_id,table_status) VALUES (?, ?, ?,?)',
            [req.body.table_name, req.body.table_size, req.body.tabletype_id, req.body.table_status],
            function (err, results, fields) {
                if (err) {
                    res.json({ status: 'error', message: err })
                    return
                }
                res.json({ status: 200, data: results, message: err })
            }
        );
    });
})
//----------------of update table -----------------------------
// app.put('/update-table', jsonParser, function (req, res, next) {
//     db.query(
//         'UPDATE tbtable SET table_status=? WHERE table_id=?',
//         [req.body.table_status, req.body.table_id],
//         function (err, results, fields) {
//             if (err) {
//                 res.json({ status: 'error', message: err })
//                 return
//             }
//             res.json({ status: 200, data: results, message: err })
//         }
//     );
// })
app.put('/update-table', jsonParser, function (req, res, next) {
    db.query(
        'UPDATE tbtable SET table_status=? WHERE table_id=?',
        [req.body.table_status, req.body.table_id],
        function (err, results, fields) {
            if (err) {
                res.json({ status: 'error', message: err })
                return
            }
            db.query(
                'SELECT * FROM tbtable WHERE table_id=?',
                [req.body.table_id],
                function (err, results, fields) {
                    if (err) {
                        res.json({ status: 'error', message: err })
                        return
                    }
                    res.json({ status: 200, data: results[0], message: 'Table updated successfully' })
                }
            );
        }
    );
})
//-------------of table type---------------
app.post('/add-table-type', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'INSERT INTO tbTableType (tabletype_name) VALUES (?)',
            [req.body.type_name],
            function (err, results, fields) {
                if (err) {
                    res.json({ status: 'error', message: err })
                    return
                }
                res.json({ status: 200, data: results, message: err })
            }
        );
    });
})

//--------of image storage engine--------
const storage = multer.diskStorage({
  destination:'./upload/images',
  filename: (req, file,  cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
  }
})

//----of upload image ------
const upload = multer({
 storage: storage,
 limits: {fileSize:10000000}
})
app.use('/profile', express.static('upload/images'));
app.post("/upload", upload.single('profile'), (req, res) => {
  res.json({
    success:1,
    profile_url:`http://192.168.251.61:3005/profile/${req.file.filename}`  
  })
  console.log(req.file);
})
function errHandler(err, req, res,next){
  if (err instanceof multer.MulterError){
    res.json({
      success: 0,
      message: err.message
    })
  }
}
app.use(errHandler)


//-------------------< Add product >-----------------------------------
app.post('/add-product', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'INSERT INTO tbproduct (product_id,product_name,protype_id,unit_id,price,cost,image) VALUES (?,?,?,?,?,?,?)',
            [req.body.product_id, req.body.product_name, req.body.protype_id, req.body.unit_id, req.body.price, req.body.cost,req.body.image],
            function (err, results, fields) {
                if (err) {
                    res.json({ status: false, message: err })
                    return
                }
                res.json({ status: true, data: results, message: err })
            }
        );
    });
})
//-------------------< update product >-----------------------------------
app.patch('/update-product', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'UPDATE tbproduct SET product_name=?, protype_id=?, unit_id=?, price=?, cost=?, image=? WHERE product_id=?',
            [req.body.product_name, req.body.protype_id, req.body.unit_id, req.body.price, req.body.cost, req.body.image, req.body.product_id],
            
            function (err, results, fields) {
                if (err) {
                    res.json({ status: false, message: err })
                    return
                }
                let message = "";
                if(results.changeRows === 0){
                  message = "Product not found"
                }else{
                  message = "Update product successfully ";
                }
                return res.json({ status: true, data: results, message: message })
            }
        );
    });
})
//-------------------< delete product >-----------------------------------
app.delete('/delete-product', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'DELETE FROM tbproduct WHERE product_id=?',
            [req.body.product_id],
            
            function (err, results, fields) {
                if (err) {
                    res.json({ status: false, message: err })
                    return
                }
                let message = "";
                if(results.affectedRows === 0){
                  message = "Product not found"
                }else{
                  message = " Deleted Product Successfully";
                }
                return res.json({ status: true, data: results, message: message })
            }
        );
    });
})
//-----of product --------------------
app.post('/product', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'SELECT * FROM tbProduct where protype_id=?', [req.body.protype_id],
            function (err, results, fields) {
                console.log('id=' + req.body.tabletype_id);
                if (err) {
                    res.json({ status: 'error', message: err })
                    return
                }
                console.log(results);
                res.json({ status: 200, data: results, message: err })
            }
        );
    });
})

app.get('/product', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'SELECT * FROM tbproduct',
            function (err, results, fields) {
                if (err) {
                    res.json({ status: 'error', message: err })
                    return
                }
                res.json({ status: 200, data: results, message: err })
            }
        );
    });
})

app.get('/product-type', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'SELECT * FROM tbProductType',
            function (err, results, fields) {
                if (err) {
                    res.json({ status: 'error', message: err })
                    return
                }
                res.json({ status: 200, data: results, message: err })
            }
        );
    });
})

app.get('/Unit', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'SELECT * FROM tbunit',
            function (err, results, fields) {
                if (err) {
                    res.json({ status: 'error', message: err })
                    return
                }
                res.json({ status: 200, data: results, message: err })
            }
        );
    });
})


// app.post('/food', jsonParser, function (req, res, next) {
    
//         var sql = '';
//         if(req.body.typeIds!="" || req.body.typeId !=0){
//             sql = 'SELECT * FROM tbProduct where protype_id = ?'
//         }
//         else{
//             sql ='SELECT * FROM tbProduct'
//         }
//         db.query(
//             sql, [req.body.typeId],
//             function (err, results, fields) {
//                 if (err) {
//                     res.json({ status: 'error', message: err })
//                     return
//                 }
//                 res.json({ status: 200, data: results, message: err })
//             }
//         );
    
// })

//----for select and serch------
app.post('/food', jsonParser, function (req, res, next) {
  var sql = "SELECT * FROM tbproduct WHERE 1=1";
  var params = [];

  if (req.body.typeId !== "" && req.body.typeId !== 0) {
    sql += " AND protype_id = ?";
    params.push(req.body.typeId);
  }

  if (req.body.unitId !== "" && req.body.unitId !== 0) {
    sql += " AND unit_id = ?";
    params.push(req.body.unitId);
  }
console.log('hello world ' + sql);// just make log

  db.query(sql, params, function (err, results, fields) {
    if (err) {
      res.json({ status: 'error', message: err });
      return;
    }
    res.json({ status: 200, data: results, message: err });
  });
});

app.post('/order', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'INSERT INTO `tblOrder`( `or_date`, `or_qty`, `or_amount`, `or_status`, `table_id`) VALUES (?,?,?,?,?)',
            [ req.body.or_date, req.body.or_qty, req.body.or_amount, req.body.or_status, req.body.table_id],
            function (err, results, fields) {
                if (err) {
                    res.json({ status: 'error', message: err })
                    return
                }
                db.query('SELECT * FROM tblOrder WHERE or_id = ?', results.insertId, function (err, rows, fields) {
                    if (err) {
                        res.json({ status: 'error', message: err })
                        return
                    }
                    res.json({ status: 200, data: rows[0] })
                });
            }
        );
    });
});

app.post('/order-details', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'INSERT INTO `tborderdetail`(`or_id`, `product_id`, `product_name`, `qty`, `amount`, `ord_date`) VALUES (?,?,?,?,?,?)',
            [ req.body.or_id, req.body.product_id,req.body.product_name, req.body.qty, req.body.amount, req.body.ord_date,],
            function (err, results, fields) {
                if (err) {
                    res.json({ status: 'error', message: err })
                    return
                }
                db.query('SELECT * FROM tborderdetail WHERE ord_id = ?', results.insertId, function (err, rows, fields) {
                    if (err) {
                        res.json({ status: 'error', message: err })
                        return
                    }
                    res.json({ status: 200, data: rows[0] })
                });
            }
        );
    });
});

// app.post('/order', jsonParser, function (req, res, next) {
//     bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
//         db.query(
//             'INSERT INTO `tblOrder`( `or_date`, `or_qty`, `or_amount`, `or_status`, `table_id`) VALUES (?,?,?,?,?)',
//             [ req.body.or_date, req.body.or_qty, req.body.or_amount, req.body.or_status, req.body.table_id],
//             function (err, results, fields) {
//                 if (err) {
//                     res.json({ status: 'error', message: err })
//                     return
//                 }
//                 res.json({ status: 200, data: results, message: err })
//             }
//         );
//     });
// })
// app.post('/order-detail', jsonParser, function (req, res, next) {
//     bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
//         let orderlist=[];
//         let list=[];
//          list=req.body;
//          console.log(list)
//         for (let item =0;item< list.length;item++) {
//             console.log(`Cache item: ${JSON.stringify(item)}`)
//             console.log(`productId: ${list[item].productId}`)
//             orderlist.push([
//                     list[item].order_Id,
//                     list[item].product_Id,
//                     // list[item].product_name,
//                     list[item].qty,
//                     list[item].amount,
//                     list[item].date,
//             ])
//         }
//         //return;
//         console.log(orderlist)
//         db.query(
//             'INSERT INTO `tborderdetail`(`or_id`, `product_id`, `qty`, `amount`, `ord_date`) VALUES ?',
//             [orderlist],
//             function (err, results, fields) {
//                 if (err) {
//                     res.json({ status: 'error', message: err })
//                     return
//                 }
//                 res.json({ status: 200, data: results, message: err })
//             }
//         );

//     });
// })

// app.post('/order-detail', jsonParser, function (req, res, next) {
//     bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
//         let orderlist=[];
//         let list=[];
//         if (!req.body) {
//             res.json({ status: 'error', message: 'Request body is empty' })
//             return
//         }
//         list=req.body;
//         console.log(list)
//         if (!list || list.length === 0) {
//             res.json({ status: 'error', message: 'No order details found in request body' })
//             return
//         }
//         for (let item =0;item< list.length;item++) {
//             console.log(`Cache item: ${JSON.stringify(item)}`)
//             console.log(`productId: ${list[item].productId}`)
//             orderlist.push([
//                 list[item].order_Id,
//                 list[item].product_Id,
//                 // list[item].product_name,
//                 list[item].qty,
//                 list[item].amount,
//                 list[item].date,
//             ])
//         }
//         console.log(orderlist)
//         db.query(
//             'INSERT INTO `tborderdetail`(`ord_id`, `or_id`, `product_id`, `qty`, `amount`, `ord_date`) VALUES ?',
//             [orderlist],
//             function (err, results, fields) {
//                if (err) {
//                     console.log(err)
//                     res.json({ status: 'error', message: err })
//                     return
//                 }
//                 console.log(results)
//                 res.json({ status: 200, data: results, message: 'Order details inserted successfully' })
//             }
//         );
//     });
// })
//-----nomore use---------------
app.get('/max-order-id', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'SELECT MAX(or_id)+1 as newId FROM `tblOrder`',
            function (err, results, fields) {
                if (err) {
                    res.json({ status: 'error', message: err })
                    return
                }
                res.json({ status: 200, data: results, message: err })
            }
        );
    });
})

// ------here is select data to reshow in the order status. i use post because i need to send the table id to compaire and seletet data
app.post('/order-by-table', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query( 
    ' SELECT tborderdetail.ord_id,tborderdetail.qty,tborderdetail.amount,tbproduct.product_name,tbproduct.price,'
            +' tblorder.or_date,tblorder.or_amount, tbtable.table_id FROM tblorder INNER JOIN tborderdetail on tborderdetail.or_id=tblorder.or_id'
            +' INNER JOIN tbproduct on tborderdetail.product_id=tbproduct.product_id'
            +' INNER JOIN tbtable on tblorder.table_id=tbtable.table_id'
            +' WHERE tbtable.table_id=? and tblorder.or_status=1;'
            ,[req.body.tableId],
            function (err, results, fields) {
                if (err) {
                    res.json({ status: false,code:res.statusCode, message: err })
                    return
                }
                res.json({ status: true,code:res.statusCode, data: results, message: err })
            }
        );
    });
})

//------cut stock-------------------------
app.post('/cut-stock', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'UPDATE tbproduct '
                + 'INNER JOIN tborderdetail ON tborderdetail.product_id = tbproduct.product_id '
                + 'INNER JOIN tblorder ON tblorder.or_id = tborderdetail.or_id '
                + 'INNER JOIN tbtable ON tbtable.table_id = tblorder.table_id '
                + 'SET tbproduct.quantity = tbproduct.quantity - tborderdetail.qty '
                + 'WHERE tbtable.table_id = ? AND tblorder.or_status = 1;'
            , [req.body.tableId],
            function (err, result) {
                if (err) {
                    res.json({ status: false, code: res.statusCode, message: err })
                    return
                }
                res.json({ status: true, code: res.statusCode, message: 'Stocks updated' })
            }
        );
    });
})

// app.listen(port,"172.16.40.141", function () {
//     console.log('CORS-enabled web server listening on port 3002')
// })

app.listen(port,"192.168.251.61", function () {
    console.log('CORS-enabled web server listening on port'+port)
})
