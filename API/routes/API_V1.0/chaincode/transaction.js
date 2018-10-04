var express = require('express');
var router = express.Router();


var query = require('../../../utils/query')
var invoke = require('../../../utils/invoke')

// 토큰 전송
router.post('/', async(req, res) => {
    let { 
        from,
        to,
        value
    } = req.body;

    if (!from) {
        return res.status(404).json({msg: "from이 비었습니다."})
    } else if (!to) {
        return res.status(404).json({msg: "to가 비었습니다."})
    } else if (!value) {
        return res.status(404).json({msg: "value가 비었습니다."})
    }

    let fcn = "transfer"
    let args = [from, to, value]

	invoke({fcn: fcn, args: args}, (err, result) => {
		if (err) {
			return res.status(500).json({msg: `토큰전송 중 문제발생`, err: result})
		}	
		
		return res.status(201).json(JSON.parse(result))
	})

	/*
    try {
        let transferId = await invoke({fcn: fcn, args: args}) // 전송이 됬으면 txId 반환, 해당 txId는 체인코드에서 임으로 만든 txId임.
		console.log(transferId)
        return res.status(201).json(JSON.parse(transferId))
    } catch (err) {
        return res.status(500).json({msg: "토큰 전송중 문제발생", err: err})
    }
	*/
});
  
// 토큰전송 내역 조회
// transfer 호출시 임의로 만든 txId 사용
router.get('/', async(req, res) => {
    let { 
        txId
    } = req.query;
    
    if (!txId) {
        return res.status(404).json({msg: "txId가 비었습니다."})
    }

    let fcn = "get_tx"
    let args = [txId]

    try {
        let data = await query({fcn: fcn, args: args})
        return res.status(200).json(JSON.parse(data))
    } catch(err) {
        return res.status(500).json({msg: `${txId} 조회중 문제발생`, err: err})
    }

})

module.exports = router;

