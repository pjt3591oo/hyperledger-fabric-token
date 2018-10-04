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
        return res.status(200).json(JSON.parse(data))
    } catch(err) {
        return res.status(500).json({msg: `${address} 조회중 문제발생`, err: err})
    }

});
  

// 계정 생성
router.post('/', async(req, res) => {
    let {
        key,
        alloc
    } = req.body

	console.log(key, alloc)

    let fcn = "create_account"
    let args = [key, alloc]

    if (!key) {
        return res.status(404).json({msg: "key가 비었습니다."})
    } 

    alloc = alloc || 0

	invoke({fcn: fcn, args: args}, (err, result) => {
		if (err) {
			return res.status(500).json({msg: `address 생성중 문제발생(사용키: ${key})`, err: result})
		}
		
		return res.status(201).json({Address: result})
	})

	/*
    try {
        let createdAddress = await invoke({fcn: fcn, args: args}) // 정상적으로 생성되면 account 반환
        return res.status(201).json({Address: createdAddress})

    } catch(err) {
		// 이미 계정이 존재한다면 에러처리가 된다
		console.log(err)
        return res.status(500).json({msg: `address 생성중 문제발생(사용키: ${key})`, err: err})
    }
	*/
})

module.exports = router;

