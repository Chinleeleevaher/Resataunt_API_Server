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
                        'INSERT INTO tbusers (username, email, password) VALUES (?, ?, ?)',
                        [req.body.username, req.body.email, hash ],
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

//----of upload image of product------
const upload = multer({
 storage: storage,
 limits: {fileSize:10000000}
})
app.use('/profile', express.static('upload/images'));

app.post("/upload", upload.single('profile'), (req, res) => {
  res.json({
    success:1,
    profile_url:`http://192.168.59.84:3005/profile/${req.file.filename}`  
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

//...............Add table..............

app.post('/Addtable', jsonParser, function (req, res, next) {
    const { tablename, tabletypeId , tableSize } = req.body; // Destructure tablename and tabletypeId from req.body
    
    // Default values for table_size and table_status
    
    const tableStatus = 0;
  
    // Insert query with fixed values for table_size and table_status
    db.query(
      'INSERT INTO tbtable (table_name, table_size, tabletype_id, table_status) VALUES (?, ?, ?, ?)',
      [tablename, tableSize, tabletypeId, tableStatus], // Use tablename and tabletypeId
      function (err, results, fields) {
        if (err) {
          console.error('Error inserting data:', err);
          res.status(500).json({ status: 'error', message: 'Error inserting data' });
          return;
        }
  
        res.status(200).json({ status: 'success', data: results, message: 'Data added successfully' });
      }
    );
  });
  ///....................... get table.........................
  app.get('/tables', jsonParser, function (req, res, next) {
        db.query(
            'SELECT * FROM tbtable',
            function (err, results, fields) {
                if (err) {
                    res.json({ status: 'error', message: err })
                    return
                }
                res.json({ status: 200, data: results, message: err })
            }
        );
   
})
 //..........delete table............
 app.delete('/delete-table', jsonParser, function (req, res, next) {
    db.query(
      'DELETE FROM tbtable WHERE table_id = ?',
      [req.body.tableId],
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
//..........update table..............

app.put('/updateTable', jsonParser, function (req, res, next) {
    const { tableName, tabletypeId, tablesize, tableId } = req.body;
  
    db.query(
      'UPDATE tbtable SET table_name = ?, tabletype_id = ?, table_size = ? WHERE table_id = ?',
      [tableName, tabletypeId, tablesize, tableId],
      function (err, results, fields) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ status: 'error', message: 'Database error occurred' });
        }
  
        let message = "";
        if (results.affectedRows === 0) {
          message = "Table not found";
        } else {
          message = "Table updated successfully";
        }
        
        res.status(200).json({ status: 200, data: results, message: message });
      }
    );
  });
  
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
///............of order detail......................
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
//......post reject order...............
// app.post('/postrejectorder', jsonParser, function (req, res, next) {
//     ///console.log('body====',req.body);
//         db.query(
//             'INSERT INTO `tbrejectorder`(`table_id`,`or_id`, `product_id`, `qty`, `amount`, `status`) VALUES (?,?,?,?,?,?)',
//             [req.body.table_id, req.body.or_id, req.body.product_id, req.body.qty, req.body.amount, req.body.status],
//             function (err, results, fields) {
//                 console.log('result=====',results);
//                 if (err) {
//                     console.log('error',err);
//                     res.json({ status: 'error', message: err })
//                     return
//                 }
//             }
//         );
    
// });
app.post('/postrejectorder', jsonParser, function (req, res, next) {
    ///console.log('body====',req.body);
        db.query(
            'INSERT INTO `tbrejectorder`(`or_id`, `product_id`, `qty`, `amount`,`table_id`,`status`) VALUES (?,?,?,?,?,1)',
            [ req.body.or_id, req.body.product_id, req.body.qty, req.body.amount,req.body.table_id,],
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
//...select reject order....
// app.post('/getrejectorder', jsonParser, function (req, res, next) {
    
//     db.query(
//         'SELECT * FROM tbrejectorder WHERE table_id = ? AND status = 1',[req.body.tableId],
//         function (err, results, fields) {
//             if (err) {
//                 res.json({ status: 'error', message: err })
//                 return
//             }
//             res.json({ status: 200, data: results, message: err })
//         }
//     );

// })
app.post('/getrejectorder', jsonParser, function (req, res, next) {
    const { tableId } = req.body;

    // Ensure tableId is provided
    if (!tableId) {
        return res.status(400).json({ status: 'error', message: 'tableId is required' });
    }

    // Query to get reject orders and join with tbProduct to get product names
    db.query(
        `SELECT tbrejectorder.*, tbproduct.product_name 
         FROM tbrejectorder 
         JOIN tbproduct ON tbrejectorder.product_id = tbproduct.product_id 
         WHERE tbrejectorder.table_id = ? AND tbrejectorder.status = 1`,
        [tableId],
        function (err, results) {
            if (err) {
                console.error('Error fetching from tbrejectorder:', err);
                return res.status(500).json({ status: 'error', message: err.message });
            }

            // Respond with the fetched data
            res.status(200).json({ status: 200, data: results });
        }
    );
});




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
                + 'WHERE tbtable.table_id = ? AND tblorder.or_status = 2;'
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

//.........get order by table for make check bill( specail for collect or_id)..............
app.post('/getOrderBytable', jsonParser, function (req, res, next) {
    
        db.query(
            'SELECT * FROM tblOrder WHERE table_id = ? AND or_status = 2',[req.body.tableId],
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

////..........................
app.post('/update-move-tables', jsonParser, function (req, res, next) {
    const { or_id, product_id, qty, amount, ord_date, table_id } = req.body;

    // Check if the combination of or_id and product_id already exists in tborderdetail
    db.query(
        'SELECT * FROM tborderdetail WHERE or_id = ? AND product_id = ?',
        [or_id, product_id],
        function (err, rows, fields) {
            if (err) {
                console.log('error', err);
                res.json({ status: 'error', message: err });
                return;
            }

            if (rows.length > 0) {
                // If record exists, update the qty
                db.query(
                    'UPDATE tborderdetail SET qty = ?, amount = ?, ord_date = ?, table_id = ? WHERE or_id = ? AND product_id = ?',
                    [qty, amount, ord_date, table_id, or_id, product_id],
                    function (err, results, fields) {
                        if (err) {
                            console.log('error', err);
                            res.json({ status: 'error', message: err });
                            return;
                        }

                        // Return updated data
                        db.query('SELECT * FROM tborderdetail WHERE ord_id = ?', results.insertId, function (err, updatedRows, fields) {
                            if (err) {
                                res.json({ status: 'error', message: err });
                                return;
                            }
                            res.json({ status: 200, data: updatedRows[0] });
                        });
                    }
                );
            } else {
                // If record does not exist, insert a new record
                db.query(
                    'INSERT INTO tborderdetail (or_id, product_id, qty, amount, ord_date, table_id) VALUES (?, ?, ?, ?, ?, ?)',
                    [or_id, product_id, qty, amount, ord_date, table_id],
                    function (err, results, fields) {
                        if (err) {
                            console.log('error', err);
                            res.json({ status: 'error', message: err });
                            return;
                        }

                        // Return inserted data
                        db.query('SELECT * FROM tborderdetail WHERE ord_id = ?', results.insertId, function (err, insertedRows, fields) {
                            if (err) {
                                res.json({ status: 'error', message: err });
                                return;
                            }
                            res.json({ status: 200, data: insertedRows[0] });
                        });
                    }
                );
            }
        }
    );
});

//.........get order by order_status in kitchen..............
app.post('/getOrderstatus', jsonParser, function (req, res, next) {
        db.query(
            'SELECT * FROM tblOrder WHERE or_status = ? AND or_qty > 0', [req.body.orStatus],
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
//.........get order by order_status in kitchen..............
app.post('/getOrderstatus', jsonParser, function (req, res, next) {
        db.query(
            'SELECT * FROM tblOrder WHERE or_status = ? AND or_qty > 0', [req.body.orStatus],
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
//.........select order in today.............
app.post('/getOrdertoday', jsonParser, function (req, res, next) {
    // Get today's date in 'YYYY-MM-DD' format
    const today = new Date().toISOString().split('T')[0];

    db.query(
        'SELECT * FROM tblOrder WHERE DATE(or_date) = ?',
        [today],
        function (err, results, fields) {
            if (err) {
                res.json({ status: 'error', message: err });
                return;
            }
            res.json({ status: 200, data: results });
        }
    );
});

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
//..reject order..........
app.delete('/rejectorder', jsonParser, function (req, res, next) {
    const { or_id, product_id } = req.body;

    // Validate input
    if (!or_id || !product_id) {
        return res.status(400).json({ status: false, message: "or_id and product_id are required" });
    }

    // Begin a transaction
    db.beginTransaction(function (err) {
        if (err) {
            return res.status(500).json({ status: false, message: err.message });
        }

        // Step 1: Delete from tbOrderDetail
        db.query(
            'DELETE FROM tbOrderDetail WHERE or_id = ? AND product_id = ?',
            [or_id, product_id],
            function (err, results) {
                if (err) {
                    return db.rollback(function() {
                        res.json({ status: false, message: err.message });
                    });
                }

                if (results.affectedRows === 0) {
                    const message = "Order detail not found";
                    return db.rollback(function() {
                        res.json({ status: false, message: message });
                    });
                }

                // Step 2: Get the current quantity and amount from tbOrderDetail
                db.query(
                    'SELECT SUM(qty) AS totalQty, SUM(amount) AS totalAmount FROM tbOrderDetail WHERE or_id = ?',
                    [or_id],
                    function (err, results) {
                        if (err) {
                            return db.rollback(function() {
                                res.json({ status: false, message: err.message });
                            });
                        }

                        // Calculate the updated quantity and amount
                        const totalQty = results[0].totalQty || 0;
                        const totalAmount = results[0].totalAmount || 0;

                        // Step 3: Update tblOrder with the corrected quantity and amount
                        db.query(
                            'UPDATE tblOrder SET or_qty = ?, or_amount = ? WHERE or_id = ?',
                            [totalQty, totalAmount, or_id],
                            function (err, results) {
                                if (err) {
                                    return db.rollback(function() {
                                        res.json({ status: false, message: err.message });
                                    });
                                }

                                // Commit the transaction
                                db.commit(function (err) {
                                    if (err) {
                                        return db.rollback(function() {
                                            res.json({ status: false, message: err.message });
                                        });
                                    }

                                    res.json({ status: true, message: "Order detail deleted and quantities and amounts updated successfully" });
                                });
                            }
                        );
                    }
                );
            }
        );
    });
});


/// ..........update table status and order status in kitchen.....................


app.post('/updateTables-orderstatus', jsonParser, function (req, res, next) {
    const tableId = req.body.tableId;
    const tableStatus = req.body.tableStatus;
    const orderId = req.body.orderId;
    const orderStatus = req.body.orderStatus;

    db.beginTransaction(function (err) {
        if (err) {
            return res.json({ status: 'error', message: err });
        }

        // Update table status
        db.query(
            'UPDATE tbTable SET table_status = ? WHERE table_id = ?',
            [tableStatus, tableId],
            function (err, results) {
                if (err) {
                    return db.rollback(function () {
                        res.json({ status: 'error', message: err });
                    });
                }

                // Update order status
                db.query(
                    'UPDATE tblOrder SET or_status = ? WHERE or_id = ?',
                    [orderStatus, orderId],
                    function (err, results) {
                        if (err) {
                            return db.rollback(function () {
                                res.json({ status: 'error', message: err });
                            });
                        }

                        // Update reject order status
                        db.query(
                            'UPDATE tbrejectorder SET status = ? WHERE or_id = ?',
                            [orderStatus, orderId],
                            function (err, results) {
                                if (err) {
                                    return db.rollback(function () {
                                        res.json({ status: 'error', message: err });
                                    });
                                }

                                db.commit(function (err) {
                                    if (err) {
                                        return db.rollback(function () {
                                            res.json({ status: 'error', message: err });
                                        });
                                    }

                                    res.json({ status: 200, message: 'Tables and order status updated successfully' });
                                });
                            }
                        );
                    }
                );
            }
        );
    });
});

// ............update tblOrder when make payment.................
// app.patch('/update-Order_payment', jsonParser, function (req, res, next) {
//     db.query(
//       'UPDATE tblOrder SET receives = ?, returns = ?, payment = ?, or_status = ? WHERE or_id = ?',
//       [req.body.receives, req.body.returns, req.body.payment, req.body.orStatus, req.body.orId],
//       function (err, results, fields) {
//         if (err) {
//           res.json({ status: 'error', message: err.sqlMessage })
//           return
//         }
//         let message = "";
//         if (results.affectedRows === 0) {
//           message = "Order not found"
//         } else {
//           message = "Order updated successfully";
//         }
//         return res.json({ status: 200, data: results, message: message })
//       }
//     );
//   });

app.patch('/update-Order_payment', jsonParser, function (req, res, next) {
    const { tableId, orStatus, receives, returns, payment, newOrStatus } = req.body;

    // Step 1: Check if a record with the given table_id and or_status exists
    db.query(
        'SELECT or_id FROM tblOrder WHERE table_id = ? AND or_status = ?',
        [tableId, orStatus],
        function (err, results) {
            if (err) {
                res.json({ status: 'error', message: err.sqlMessage });
                return;
            }

            if (results.length === 0) {
                // No record found
                return res.json({ status: 404, message: "Order with the specified table_id and or_status not found" });
            }

            // Step 2: Proceed with the update if record exists
            db.query(
                'UPDATE tblOrder SET receives = ?, returns = ?, payment = ?, or_status = ? WHERE table_id = ? AND or_status = ?',
                [receives, returns, payment, newOrStatus, tableId, orStatus],
                function (err, results) {
                    if (err) {
                        res.json({ status: 'error', message: err.sqlMessage });
                        return;
                    }

                    let message = "";
                    if (results.affectedRows === 0) {
                        message = "No changes made";
                    } else {
                        message = "Order updated successfully";
                    }

                    return res.json({ status: 200, data: results, message: message });
                }
            );
        }
    );
});

/// ............of order list for report...............
app.post('/getOrderDateRange', jsonParser, function (req, res, next) {
    db.query(
      'SELECT * FROM tblOrder WHERE or_date BETWEEN ? AND ? AND or_status = 0',
      [req.body.startDate, req.body.endDate],
      function (err, results, fields) {
        console.log('Start Date: ' + req.body.startDate + ', End Date: ' + req.body.endDate);
        if (err) {
          res.json({ status: 'error', message: err })
          return
        }
        console.log(results);
        res.json({ status: 200, data: results, message: err })
      }
    );
  });
  //.........get orderdetail by order id for report.............
  app.post('/getOrderDetailReport', jsonParser, function (req, res, next) {
    db.query(
      'SELECT od.*, p.product_name ' +
      'FROM tborderdetail od ' +
      'JOIN tblOrder o ON od.or_id = o.or_id ' +
      'JOIN tbProduct p ON od.product_id = p.product_id ' +
      'WHERE o.or_id = ?',
      [req.body.or_id],
      function (err, results, fields) {
        console.log('Order ID: ' + req.body.or_id);
        if (err) {
          res.json({ status: 'error', message: err })
          return
        }
        console.log(results);
        res.json({ status: 200, data: results, message: err })
      }
    );
  });
///.........get products for report.............

app.get('/products', jsonParser, function (req, res, next) {
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
///..........for product report............
app.post('/getOrderDetailforProductReport', jsonParser, function (req, res, next) {
    db.query(
      'SELECT od.*, o.or_date, p.product_name ' +
      'FROM tbOrderDetail od ' +
      'JOIN tblOrder o ON od.or_id = o.or_id ' +
      'JOIN tbProduct p ON od.product_id = p.product_id ' +
      'WHERE o.or_date BETWEEN ? AND ?',
      [req.body.startDate, req.body.endDate],
      function (err, results, fields) {
        console.log('Start Date: ' + req.body.startDate + ', End Date: ' + req.body.endDate);
        if (err) {
          res.json({ status: 'error', message: err })
          return
        }
        console.log(results);
        res.json({ status: 200, data: results, message: err })
      }
    );
  });

  ///.........get icome for report.............

  app.post('/income', jsonParser, function (req, res, next) {
    db.query(
      'SELECT * FROM tbOrderDetail WHERE ord_date BETWEEN ? AND ?',
      [req.body.startDate, req.body.endDate],
      function (err, results, fields) {
        console.log('Start Date: ' + req.body.startDate + ', End Date: ' + req.body.endDate);
        if (err) {
          res.json({ status: 'error', message: err });
          return;
        }
        console.log(results);
        res.json({ status: 200, data: results, message: 'Amount fetched successfully' });
      }
    );
  });
 ///.........get icome  month and year for report.............
 app.post('/incomeyear', jsonParser, function (req, res, next) {
    db.query(
      'SELECT * FROM tbOrderDetail WHERE YEAR(ord_date) = ?',
      [req.body.year],
      function (err, results, fields) {
        console.log('Year: ' + req.body.year);
        if (err) {
          res.json({ status: 'error', message: err });
          return;
        }
        console.log(results);
        res.json({ status: 200, data: results, message: 'Data fetched successfully' });
      }
    );
  });
  ////...................get product that have low quantity................
  app.get('/Pquantity', jsonParser, function (req, res, next) {
    db.query(
        'SELECT DISTINCT quantity FROM tbproduct WHERE protype_id = 2 ORDER BY quantity ASC LIMIT 3',
        function (err, quantityResults, fields) {
            if (err) {
                res.json({ status: 'error', message: err });
                return;
            }

            // Extract the 3 lowest unique quantities from the results
            const quantities = quantityResults.map(row => row.quantity);

            // Query the products that match these quantities and protype_id = 2
            db.query(
                'SELECT * FROM tbproduct WHERE quantity IN (?) AND protype_id = 2 ORDER BY quantity ASC',
                [quantities],
                function (err, productResults, fields) {
                    if (err) {
                        res.json({ status: 'error', message: err });
                        return;
                    }

                    // Return product results
                    res.json({ status: 'ok', products: productResults });
                }
            );
        }
    );
});




  
  //-------------------< Add Order product >-----------------------------------

  app.post('/add-OrderProduct', jsonParser, function(req, res, next) {
    db.beginTransaction(function(err) {
        if (err) {
            res.status(500).json({ status: false, message: err.message });
            return;
        }
        // Insert into tbOrderProduct
        db.query(
            'INSERT INTO tbOrderProduct (product_id, orpName, orpQty, orpPrice, orCost, status, billnumber, orp_date, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.body.product_id, req.body.product_name, req.body.product_Qty, req.body.product_price,req.body.product_cost, req.body.status, req.body.billnumber, req.body.orp_date, req.body.product_image],
            function(err, insertResults, fields) {
                if (err) {
                    db.rollback(function() {
                        res.status(500).json({ status: false, message: err.message });
                    });
                    return;
                }
                // Select data with status = 1
                db.query(
                    'SELECT * FROM tbOrderProduct WHERE status = 1',
                    function(err, selectResults, fields) {
                        if (err) {
                            db.rollback(function() {
                                res.status(500).json({ status: false, message: err.message });
                            });
                            return;
                        }

                        db.commit(function(err) {
                            if (err) {
                                db.rollback(function() {
                                    res.status(500).json({ status: false, message: err.message });
                                });
                                return;
                            }

                            res.status(201).json({ status: true, data: selectResults, message: 'Order product inserted successfully' });
                        });
                    }
                );
            }
        );
    });
});
///...........update orderProduct status.................
  app.patch('/update-OrderProduct', jsonParser, function (req, res, next) {
    db.query(
        'UPDATE tbOrderProduct SET status = ? WHERE product_id = ? AND status != 0',
        [req.body.status, req.body.pID],
        function (err, results, fields) {
            if (err) {
                res.status(500).json({ status: 'error', message: err.sqlMessage });
                return;
            }
            let message = "";
            if (results.affectedRows === 0) {
                message = "Order not found";
            } else {
                message = "Order updated successfully";
            }
            return res.status(200).json({ status: 'success', data: results, message: message });
        }
    );
});

 ///.........Select from tbOrderProduct for bill list id.............
 app.post('/orderProductBillList', jsonParser, function (req, res, next) {
    db.query(
      'SELECT * FROM tbOrderProduct WHERE billnumber = ?',
      [req.body.billnumber],
      function (err, results, fields) {
        console.log('Year: ' + req.body.year);
        if (err) {
          res.json({ status: 'error', message: err });
          return;
        }
        console.log(results);
        res.json({ status: 200, data: results, message: 'Data fetched successfully' });
      }
    );
  });

///...............select order product for improt product.............
app.post('/OrderProduct_for_improt', jsonParser, function (req, res, next) {
    
    db.query(
        'SELECT * FROM tbOrderProduct WHERE product_id = ? AND status = 2',
        [req.body.productId],
        function (err, results, fields) {
            if (err) {
                res.json({ status: 'error', message: err })
                return
            }
            res.json({ status: 200, data: results[0], message: err })
        }
    );

})

////..............update product quantity of import...............

app.patch('/update-product-quantity-import', jsonParser, function (req, res, next) {
    const quantity = req.body.quantity;
    const product_id = req.body.product_id;
    const billnameber = req.body.billnameber;

    db.beginTransaction(function (err) {
        if (err) {
            res.status(500).json({ status: 'error', message: 'Error starting transaction', error: err });
            return;
        }

        // Update tbProduct table
        db.query(
            'UPDATE tbProduct SET quantity = quantity + ? WHERE product_id = ?',
            [quantity, product_id],
            function (err, results, fields) {
                if (err) {
                    return db.rollback(function () {
                        res.status(500).json({ status: 'error', message: 'Error updating tbProduct', error: err });
                    });
                }

                if (results.affectedRows === 0) {
                    return db.rollback(function () {
                        res.status(404).json({ status: 'error', message: 'Product not found' });
                    });
                }

                // Update tbOrderProduct table
                db.query(
                    'UPDATE tbOrderProduct SET status = 0 WHERE billnumber = ?',
                    [billnameber],
                    function (err, results, fields) {
                        if (err) {
                            return db.rollback(function () {
                                res.status(500).json({ status: 'error', message: 'Error updating tbOrderProduct', error: err });
                            });
                        }

                        db.commit(function (err) {
                            if (err) {
                                return db.rollback(function () {
                                    res.status(500).json({ status: 'error', message: 'Error committing transaction', error: err });
                                });
                            }

                            res.status(200).json({ status: 'success', message: 'Product quantity and order status updated successfully' });
                        });
                    }
                );
            }
        );
    });
});

///...............select order product for List bill.............
app.get('/OrderProductListBill', function (req, res, next) {
    db.query(
        `SELECT * FROM tbOrderProduct
         GROUP BY billnumber`,
        function (err, results, fields) {
            if (err) {
                res.json({ status: 'error', message: err });
                return;
            }
            res.json({ status: 200, data: results, message: 'Data retrieved successfully' });
        }
    );
});

//.............get user...............
app.get('/getuser', jsonParser, function (req, res, next) {
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
///.........upload image of user..............
const uploads = multer({
    storage: storage,
    limits: {fileSize:10000000}
   })
   app.use('/profile', express.static('upload/images'));
   
   app.post("/uploads", uploads.single('profile'), (req, res) => {
     res.json({
       success:1,
       profile_url:`http://192.168.59.84:3005/profile/${req.file.filename}`  
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
   

//.............of add user..........................
app.post('/AddUser', jsonParser, function (req, res, next) {
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
                        'INSERT INTO `tbusers`(`image`, `username`, `password`, `email`, `phone`, `gender`, `address`, `status`) VALUES (?,?,?,?,?,?,?,?)',
                        [
                              req.body.image, 
                              req.body.username, 
                              hash,
                              req.body.email, 
                              req.body.phone, 
                              req.body.gender, 
                              req.body.address, 
                              req.body.status
                        ],
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

//..........delete user..................
app.delete('/delete-user', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'DELETE FROM tbUsers WHERE uid=?',
            [req.body.uid],
            function (err, results, fields) {
                if (err) {
                    res.json({ status: false, message: err })
                    return
                }
                let message = "";
                if(results.affectedRows === 0){
                  message = "User not found"
                }else{
                  message = "User Deleted Successfully";
                }
                return res.json({ status: true, data: results, message: message })
            }
        );
    });
})
//.......update user......................
app.put('/update-user', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        db.query(
            'UPDATE tbusers SET image=?, username=?, password=?, email=?, phone=?, gender=?, address=?, status=? WHERE uid=?',
            [
                req.body.image,
                req.body.username,
                hash,
                req.body.email,
                req.body.phone,
                req.body.gender,
                req.body.address,
                req.body.status,
                req.body.uid
            ],
            function (err, userData, fields) {
                if (err) {
                    res.json({ status: 'error', message: err })
                    return
                }
                if (userData.affectedRows === 0) {
                    res.json({ status: false, message: 'User not found' })
                } else {
                    res.json({ status: true, data: userData, message: 'User updated successfully' })
                }
            }
        );
    });
});
///.....select tbTable for make order from menu page..............
app.get('/menutable', function (req, res, next) {
    var sql = 'SELECT * FROM tbtable WHERE table_status = 0';
    db.query(sql, function (err, results, fields) {
        if (err) {
            res.status(500).json({ status: 'error', message: err });
            return;
        }
        res.status(200).json({ status: 'success', data: results });
    });
});


app.listen(port,"192.168.59.84", function () {
    console.log('CORS-enabled web server listening on port'+port)
})
