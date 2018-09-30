var express = require('express');
var router = express.Router();


var query = require('../../../utils/query')
var invoke = require('../../../utils/invoke')

// 특정계정 조회
router.get('/', async (req, res) => {
    let { 
        address
    } = req.query

    let fcn = "get_account"
    let args = [address]

    if (!address) {
        return res.status(404).json({msg: "address가 비었습니다."})
    }

    try {
        let data = await query({fcn: fcn, args: args})
        return res.status(200).json(data)
    } catch(err) {
        return res.status(500).json({msg: `${address} 조회중 문제발생`, err: err})
    }

});
  

// 계정 생성
router.post('/', async (req, res) => {
    let {
        key
    } = req.body

    let fcn = "create_account"
    let args = [address]

    if (!key) {
        return res.status(404).json({msg: "key가 비었습니다."})
    }

    try {
        let data = await invoke({fcn: fcn, args: args}) // 정상적으로 생성되면 account 반환
        
        // TODO: 계정이 이미 존재해서 만들어진 유무 확인
        return res.status(201).json(data)

    } catch(err) {
        return res.status(500).json({msg: `${address} 생성중 문제발생`, err: err})
    }
})

module.exports = router;

