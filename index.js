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
    database: "restaurant"

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
    profile_url:`http://192.168.1.4:3005/profile/${req.file.filename}`  
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
            'INSERT INTO tbProduct (product_id,product_name,protype_id,unit_id,quantity,price,cost,image) VALUES (?,?,?,?,?,?,?,?)',
            [req.body.product_id, req.body.product_name, req.body.protype_id, req.body.unit_id,req.body.quantity, req.body.price, req.body.cost,req.body.image],
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
    db.query(
      'UPDATE tbProduct SET product_name=?, protype_id=?, unit_id=?, quantity=?, price=?, cost=?, image=? WHERE product_id=?',
      [req.body.product_name, req.body.protype_id, req.body.unit_id, req.body.quantity, req.body.price, req.body.cost, req.body.image, req.body.product_id],
      function (err, results, fields) {
        if (err) {
          res.json({ status: false, message: err.sqlMessage })
          return
        }
        let message = "";
        if (results.affectedRows === 0) {
          message = "Product not found"
        } else {
          message = "Product updated successfully";
        }
        return res.json({ status: true, data: results, message: message })
      }
    );
  });
//-------------------< delete product >-----------------------------------
app.delete('/delete-product', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'DELETE FROM tbProduct WHERE product_id=?',
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
//........get product...........
app.get('/product', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'SELECT * FROM tbProduct',
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
//-----add product type --------------------
app.post('/product-types', jsonParser, function (req, res, next) {
    db.query(
        'INSERT INTO tbProductType (protype_name) VALUES (?)',
        [req.body.protype_name],
        function (err, results, fields) {
            if (err) {
                res.json({ status: false, message: err })
                return
            }
            res.json({ status: true, data: results, message: "Product type added successfully" })
        }
    );
})
//-----delete product type --------------------
app.delete('/delete-product-type', jsonParser, function (req, res, next) {
    db.query(
      'DELETE FROM tbProductType WHERE protype_id = ?',
      [req.body.protype_id],
      function (err, results, fields) {
        if (err) {
          res.json({ status: 'error', message: err.sqlMessage })
          return
        }
        let message = "";
        if (results.affectedRows === 0) {
          message = "Product type not found"
        } else {
          message = "Product type deleted successfully";
        }
        return res.json({ status: 200, data: results, message: message })
      }
    );
  });

//................upadte product type...........................

  app.put('/update-product-type', jsonParser, function (req, res, next) {
    db.query(
      'UPDATE tbProductType SET protype_name = ? WHERE protype_id = ?',
      [req.body.protype_name, req.body.protype_id],
      function (err, results, fields) {
        if (err) {
          res.json({ status: 'error', message: err.sqlMessage })
          return
        }
        let message = "";
        if (results.affectedRows === 0) {
          message = "Product type not found"
        } else {
          message = "Product type updated successfully";
        }
        return res.json({ status: 200, data: results, message: message })
      }
    );
  });

//.............get unit............

app.get('/Unit', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'SELECT * FROM tbUnit',
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

//...............Add Unit...............

app.post('/Unit', jsonParser, function (req, res, next) {
    const { unitName } = req.body;
  
    db.query(
      'INSERT INTO tbUnit (unit_name) VALUES (?)',
      [unitName],
      function (err, results, fields) {
        if (err) {
          res.json({ status: 'error', message: err });
          return;
        }
  
        res.json({ status: 200, data: results, message: 'Unit added successfully' });
      }
    );
  });

  //..........delete unit............
  app.delete('/delete-Unit', jsonParser, function (req, res, next) {
    db.query(
      'DELETE FROM tbUnit WHERE unit_id = ?',
      [req.body.unitId],
      function (err, results, fields) {
        if (err) {
          res.json({ status: 'error', message: err.sqlMessage })
          return
        }
        let message = "";
        if (results.affectedRows === 0) {
          message = "Product type not found"
        } else {
          message = "Product type deleted successfully";
        }
        return res.json({ status: 200, data: results, message: message })
      }
    );
  });

//..........update unit..............

app.put('/update-Unit', jsonParser, function (req, res, next) {
    db.query(
      'UPDATE tbUnit SET unit_name = ? WHERE unit_id = ?',
      [req.body.unitName, req.body.unitId],
      function (err, results, fields) {
        if (err) {
          res.json({ status: 'error', message: err.sqlMessage })
          return
        }
        let message = "";
        if (results.affectedRows === 0) {
          message = "Unit not found"
        } else {
          message = "unit updated successfully";
        }
        return res.json({ status: 200, data: results, message: message })
      }
    );
  });

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
  var sql = "SELECT * FROM tbProduct WHERE 1=1";
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
//...................//.......................
app.post('/order', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'INSERT INTO `tblOrder`( `or_date`, `or_qty`, `or_amount`, `or_status`, `table_id`,`receives`,`returns`,`payment`) VALUES (?,?,?,?,?,?,?,?)',
            [ req.body.or_date, req.body.or_qty, req.body.or_amount, req.body.or_status, req.body.table_id, req.body.receives, req.body.returns, req.body.payment],
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
    ///console.log('body====',req.body);
        db.query(
            'INSERT INTO `tborderdetail`(`or_id`, `product_id`, `qty`, `amount`, `ord_date`,`table_id`) VALUES (?,?,?,?,?,?)',
            [ req.body.or_id, req.body.product_id, req.body.qty, req.body.amount, req.body.ord_date,req.body.table_id,],
            function (err, results, fields) {
                console.log('result=====',results);
                if (err) {
                    console.log('error',err);
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
  
        db.query(
            'SELECT tborderdetail.ord_id, tborderdetail.qty, tborderdetail.amount, tbproduct.product_name, tbproduct.price, '
            + 'tblorder.or_date, tblorder.or_amount, tbtable.table_id, tborderdetail.or_id, tbproduct.product_id '
            + 'FROM tblorder '
            + 'INNER JOIN tborderdetail ON tborderdetail.or_id = tblorder.or_id '
            + 'INNER JOIN tbproduct ON tborderdetail.product_id = tbproduct.product_id '
            + 'INNER JOIN tbtable ON tblorder.table_id = tbtable.table_id '
            + 'WHERE tbtable.table_id = ? AND tblorder.or_status = ?;',
            [req.body.tableId, req.body.or_status],
            function (err, results, fields) {
                if (err) {
                    res.json({ status: false, code: res.statusCode, message: err });
                    return;
                }
                res.json({ status: true, code: res.statusCode, data: results, message: err });
            }
        );
    });

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

//.........get order by table..............
app.post('/getOrderBytable', jsonParser, function (req, res, next) {
    
        db.query(
            'SELECT * FROM tblOrder where table_id=?',[req.body.tableId],
            function (err, results, fields) {
                if (err) {
                    res.json({ status: 'error', message: err })
                    return
                }
                res.json({ status: 200, data: results[0], message: err })
            }
        );
    
})
//......................upadte table id and table status in tbOrder , qty, amount...................
app.patch('/update_tableID_status_tbOrder', jsonParser, function (req, res, next) {
    const { tableId, orqty, orAmount, orId, TableId, OrStatus, TableStatus } = req.body;

    db.beginTransaction(function (err) {
        if (err) {
            res.json({ status: 'error', message: err });
            return;
        }

        db.query(
            'UPDATE tblOrder SET or_qty= ?, or_amount = ?, table_id = ?, or_status = ? WHERE or_id = ?',
            [orqty, orAmount, TableId, OrStatus, orId],
            function (err, results, fields) {
                if (err) {
                    db.rollback(function () {
                        res.json({ status: 'error', message: err });
                    });
                    return;
                }

                db.query(
                    'UPDATE tbTable SET table_status = ? WHERE table_id = ?',
                    [TableStatus, tableId],
                    function (err, results, fields) {
                        if (err) {
                            db.rollback(function () {
                                res.json({ status: 'error', message: err });
                            });
                            return;
                        }

                        db.commit(function (err) {
                            if (err) {
                                db.rollback(function () {
                                    res.json({ status: 'error', message: err });
                                });
                            } else {
                                res.json({ status: 200, message: 'Order and table updated successfully.' });
                            }
                        });
                    }
                );
            }
        );
    });
});
//...............to delete order from table that i move already..........
app.delete('/delete-move-order-getFromtable', jsonParser, function (req, res, next) {
    const table_id = req.body.table_id;

    db.query(
        'DELETE FROM tblOrder WHERE table_id = ?',
        [table_id],
        function (err, results, fields) {
            if (err) {
                res.json({ status: 'error', message: err.sqlMessage });
                return;
            }

            db.query(
                'DELETE FROM tbOrderDetail WHERE table_id = ?',
                [table_id],
                function (err, results, fields) {
                    if (err) {
                        res.json({ status: 'error', message: err.sqlMessage });
                        return;
                    }

                    let message = "";
                    if (results.affectedRows === 0) {
                        message = "Order not found.";
                    } else {
                        message = "Order and corresponding details deleted successfully.";
                    }

                    return res.json({ status: 200, message: message });
                }
            );
        }
    );
});

// app.delete('/delete-move-order-getTotable', jsonParser, function (req, res, next) {
//     db.query(
//       'DELETE FROM tbOrderDetail WHERE table_id = ?',
//       [req.body.table_id],
//       function (err, results, fields) {
//         if (err) {
//           res.json({ status: 'error', message: err.sqlMessage })
//           return
//         }
//         let message = "";
//         if (results.affectedRows === 0) {
//           message = "Product type not found"
//         } else {
//           message = "Product type deleted successfully";
//         }
//         return res.json({ status: 200, data: results, message: message })
//       }
//     );
//   });

app.post('/update-move-table', jsonParser, function (req, res, next) {
    ///console.log('body====',req.body);
        db.query(
            'INSERT INTO `tborderdetail`(`or_id`, `product_id`, `qty`, `amount`, `ord_date`, `table_id`) VALUES (?,?,?,?,?,?)',
            [req.body.or_id, req.body.product_id, req.body.qty, req.body.amount, req.body.ord_date, req.body.table_id],
            function (err, results, fields) {
                console.log('result=====',results);
                if (err) {
                    console.log('error',err);
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


//.........get order by order_status in kitchen..............
app.post('/getOrderstatus', jsonParser, function (req, res, next) {
        db.query(
            'SELECT * FROM tblOrder WHERE or_status = ?', [req.body.orStatus],
            function (err, results, fields) {
                console.log('id=' + req.body.orStatus);
                if (err) {
                    res.json({ status: 'error', message: err })
                    return
                }
                console.log(results);
                res.json({ status: 200, data: results, message: err })
            }
        );
   
})
//.........get orderdetail by order id for kitchen..............
app.post('/getOrderDetail_Kitchen', jsonParser, function (req, res, next) {
    db.query(
        'SELECT * FROM tborderdetail WHERE or_id = ?',
        [req.body.or_id],
        function (err, results, fields) {
            console.log('id=' + req.body.or_id);
            if (err) {
                res.json({ status: 'error', message: err });
                return;
            }
            
            // Array to store the final results with product names
            let orderDetails = [];

            // Iterate through each result
            for (let i = 0; i < results.length; i++) {
                let orderDetail = results[i];
                let productId = orderDetail.product_id;

                // Fetch product name from tbProduct based on product_id
                db.query(
                    'SELECT product_name FROM tbProduct WHERE product_id = ?',
                    [productId],
                    function (err, productResult, fields) {
                        if (err) {
                            res.json({ status: 'error', message: err });
                            return;
                        }

                        // Add the product name to the order detail
                        orderDetail.product_name = productResult[0].product_name;

                        // Add the updated order detail to the array
                        orderDetails.push(orderDetail);

                        // Check if all order details have been processed
                        if (orderDetails.length === results.length) {
                            // Send the final results with product names
                            console.log(orderDetails);
                            res.json({ status: 200, data: orderDetails, message: err });
                        }
                    }
                );
            }
        }
    );
});

/// ..........update table status and order status in kitchen.....................
app.post('/updateTables-orderstatus', jsonParser, function (req, res, next) {
    const tableId = req.body.tableId;
    const tableStatus = req.body.tableStatus;
    const orderId = req.body.orderId;
    const orderStatus = req.body.orderStatus;

    db.beginTransaction(function (err) {
        if (err) {
            res.json({ status: 'error', message: err });
            return;
        }

        // Update table status
        db.query(
            'UPDATE tbTable SET table_status = ? WHERE table_id = ?',
            [tableStatus, tableId],
            function (err, results, fields) {
                if (err) {
                    db.rollback(function () {
                        res.json({ status: 'error', message: err });
                    });
                    return;
                }

                // Update order status
                db.query(
                    'UPDATE tblOrder SET or_status = ? WHERE or_id = ?',
                    [orderStatus, orderId],
                    function (err, results, fields) {
                        if (err) {
                            db.rollback(function () {
                                res.json({ status: 'error', message: err });
                            });
                            return;
                        }

                        db.commit(function (err) {
                            if (err) {
                                db.rollback(function () {
                                    res.json({ status: 'error', message: err });
                                });
                                return;
                            }

                            res.json({ status: 200, message: 'Tables and order status updated successfully' });
                        });
                    }
                );
            }
        );
    });
});
// ............update tblOrder when make payment.................
app.patch('/update-Order_payment', jsonParser, function (req, res, next) {
    db.query(
      'UPDATE tblOrder SET receives = ?, returns = ?, payment = ?, or_status = ? WHERE or_id = ?',
      [req.body.receives, req.body.returns, req.body.payment, req.body.orStatus, req.body.orId],
      function (err, results, fields) {
        if (err) {
          res.json({ status: 'error', message: err.sqlMessage })
          return
        }
        let message = "";
        if (results.affectedRows === 0) {
          message = "Order not found"
        } else {
          message = "Order updated successfully";
        }
        return res.json({ status: 200, data: results, message: message })
      }
    );
  });
app.listen(port,"192.168.1.4", function () {
    console.log('CORS-enabled web server listening on port'+port)
})