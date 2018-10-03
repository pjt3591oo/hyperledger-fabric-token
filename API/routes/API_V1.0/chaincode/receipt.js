var express = require('express');
var router = express.Router(); 


var query = require('../../../utils/query') 
var invoke = require('../../../utils/invoke')

// receiptId로 receipt 조회    
router.get('/', async (req, res) => {
    let {                      
        receiptId              
    } = req.query;             
    
    if (!receiptId) {          
        return res.status(404).json({msg: "receiptId가 비었습니다."})
    } 

    let fcn = "get_receipt"    
    let args = [receiptId]     

    try {
        let data = await query({fcn: fcn, args: args})
        return res.status(200).json(data)
    } catch(err) {             
        return res.status(500).json({msg: `${receiptId} 조회중 문제발생`, err: err})
    }
})
  
// 특정 account의 모든 receipt 조회
router.get('/all', async (req, res) => {
    let { 
        address
    } = req.query;

    if (!address) {
        return res.status(404).json({msg: "address가 비었습니다."})
    } 

    let fcn = "get_receipts"
    let args = [address]

    try {
        let data = await query({fcn: fcn, args: args})
        return res.status(200).json(JSON.parse(data))
    } catch(err) {
        return res.status(500).json({msg: `${address} 조회중 문제발생`, err: err})
    }
});
  


module.exports = router;