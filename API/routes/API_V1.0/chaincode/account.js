var express = require('express');
var router = express.Router();

let invoke = require('../../../utils/invoke')
let query= require('../../../utils/query.js')

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


    try {
		let {code, data} = await invoke({fcn: fcn, args: args}) // 정상적으로 생성되면 data는 생성된 address, 에러발생시 err

		if (code == 201) {
			return res.status(201).json({Address: data})
		} else if (code == 500) {
			return res.status(500).json({msg: `address 생성중 문제발생(사용키: ${key})`, err: data.toString()})
		}

    } catch(err) {
		let {code, data} = err
        return res.status(500).json({msg: `address 생성중 문제발생(사용키: ${key})`, err: err})
    }
})

module.exports = router;

