/*
 * Copyright IBM Corp All Rights Reserved
 *
 * SPDX-License-Identifier: Apache-2.0
 */

package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

// Token implements a simple chaincode to manage an asset
type Token struct {
}

type TokenInfo struct {
	Name        string `json:"name"`       // 토큰이름
	Symbol      string `json:"symbol`      // 상징이름
	TotalSupply string `json:"totalSypply` // 전체 발행량
}

const TOKEN_INFO = "_TOKEN"

type Account struct {
	Value   int    `json:"value`   // 보유토큰
	Address string `json:"address` // 주소
}

type Transaction struct {
	TxId      string
	From      string
	To        string
	Value     int
	Timestamp string
}

type Receipt struct {
	ReceiptId     string `json:"receiptId"`
	TxId          string `json:"txId"`
	NextReceiptId string `json:"nextReceiptId"`
	PrevReceiptId string `json:"prevReceiptId"`
	Status        string `json:"status"`
}

type RootReceipt struct {
	ReceiptId string `json:"receiptId"`
}

type LastReceipt struct {
	ReceiptId string `json:"receiptId"`
}

const ROOT_RECEIPT = "ROOT_"
const NODE_RECEIPT = "NODE_"
const LAST_RECEIPT = "LAST_"
const RECEIPT = "RECEIPT"

// 체인코드 생성 시 토큰정보 생성
func (t *Token) Init(stub shim.ChaincodeStubInterface) peer.Response {
	_, args := stub.GetFunctionAndParameters()

	var tokenInfo = TokenInfo{
		Name:        args[0],
		Symbol:      args[1],
		TotalSupply: args[2],
	}

	tokenAsBytes, _ := json.Marshal(tokenInfo)
	stub.PutState(TOKEN_INFO, tokenAsBytes)

	return shim.Success(nil)
}

func (t *Token) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	fn, args := stub.GetFunctionAndParameters()

	if fn == "get_token_info" {
		return t.get_token_info(stub, args)
	} else if fn == "create_account" {
		return t.create_account(stub, args)
	} else if fn == "get_account" {
		return t.get_account(stub, args)
	} else if fn == "transfer" {
		return t.transfer(stub, args)
	} else if fn == "get_root_receipt" {
		return t.get_root_receipt(stub, args)
	} else if fn == "get_last_receipt" {
		return t.get_last_receipt(stub, args)
	} else if fn == "get_node_receipts" {
		return t.get_node_receipts(stub, args)
	} else if fn == "get_receipt" {
		return t.get_receipt(stub, args)
	} else if fn == "get_tx" {
		return t.get_tx(stub, args)
	}

	// Return the result as success payload
	fmt.Println("invoke did not find func: " + fn) //error
	return shim.Error("Received unknown function invocation")
}

// 체인코드 생성시 만들어진 토큰정보 조회
func (t *Token) get_token_info(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 0 {
		return shim.Error("Incorrect number of arguments. Expecting 0")
	}

	value, err := stub.GetState(TOKEN_INFO)

	if err != nil {
		return shim.Error("Failed to get asset: " + TOKEN_INFO)
	}

	if value == nil {
		return shim.Error("Asset not found: " + TOKEN_INFO)
	}

	return shim.Success(value)
}

// account 생성
// account 생성시 외부로부터 인자값 하나를 받아 timestamp와 hash 처리
// [0] 어카운트 생성시 필요한 key, [1] 초기할당 토큰량
func (t *Token) create_account(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	hash := sha256.New()

	hash.Write([]byte(args[0]))

	md := hash.Sum(nil)
	createdAccount := hex.EncodeToString(md)

	accountInfo, _ := stub.GetState(createdAccount)
	ai := Account{}
	json.Unmarshal([]byte(accountInfo), &ai)

	if (ai == (Account{})) == false {
		return shim.Error("already account address")
	}

	alloc, _ := strconv.Atoi(args[1])

	var account = Account{Value: alloc, Address: createdAccount}

	accountAsBytes, _ := json.Marshal(account)
	stub.PutState(createdAccount, accountAsBytes)

	return shim.Success([]byte(createdAccount))
}

// account 정보 가져오기
func (t *Token) get_account(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	account_address := args[0]
	addressInfo, err := stub.GetState(account_address)

	address := &Account{}
	json.Unmarshal([]byte(addressInfo), &address)

	if err != nil {
		return shim.Error("Failed to get asset: " + account_address)
	}

	if address == nil {
		return shim.Error("Asset not found: " + account_address)
	}

	return shim.Success([]byte(addressInfo))
}

// 토큰 전송
// from: 보내는사람, to: 받는사람, value: 토큰량
func (t *Token) transfer(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}

	from := args[0]
	to := args[1]
	value, _ := strconv.Atoi(args[2])
	timestamp := strconv.Itoa(int(time.Now().UnixNano()))

	hash := sha256.New()
	hash.Write([]byte(from + to + string(value) + timestamp))
	md := hash.Sum(nil)
	txId := hex.EncodeToString(md)

	// 1.1 각 account 정보 조회
	fromInfo, err := stub.GetState(from)
	if err != nil {
		return shim.Error("Failed to get asset: " + from)
	}
	if fromInfo == nil {
		return shim.Error("Asset not found: " + from)
	}
	fromAddress := &Account{}
	json.Unmarshal([]byte(fromInfo), &fromAddress)

	toInfo, err := stub.GetState(to)
	if err != nil {
		return shim.Error("Failed to get asset: " + to)
	}
	if toInfo == nil {
		return shim.Error("Asset not found: " + to)
	}
	toAddress := &Account{}
	json.Unmarshal([]byte(toInfo), &toAddress)

	// 1.2 to account value 확인
	if toAddress.Value < value {
		return shim.Error("잔액부족")
	}
	fromAddress.Value -= value // 보내는 사람 차감
	toAddress.Value += value   // 받는사람 증가

	// 1.3 account 정보 업데이트
	fromAddressAsBytes, _ := json.Marshal(fromAddress)
	stub.PutState(from, fromAddressAsBytes)
	toAddressAsBytes, _ := json.Marshal(toAddress)
	stub.PutState(to, toAddressAsBytes)

	// 2. transaction 기록
	var transaction = Transaction{
		TxId:      txId,
		From:      from,
		To:        to,
		Value:     value,
		Timestamp: timestamp,
	}
	transactionAsBytes, _ := json.Marshal(transaction)
	stub.PutState(txId, []byte(transactionAsBytes))

	// 3. receipt 기록
	inReceipt := addReceipt(stub, txId, toAddress.Address, "IN", timestamp)
	outReceipt := addReceipt(stub, txId, fromAddress.Address, "OUT", timestamp)

	fmt.Println("inReceipt : ", inReceipt)
	fmt.Println("outReceipt: ", outReceipt)
	fmt.Println("*************************")
	// 완료
	return shim.Success([]byte(transactionAsBytes))
}

func addReceipt(stub shim.ChaincodeStubInterface, txId string, toAccount string, status string, timestamp string) string {
	hash := sha256.New()
	hash.Write([]byte(txId + timestamp + status))
	md := hash.Sum(nil)
	receiptId := string(hex.EncodeToString(md))

	rr, _ := stub.GetState(ROOT_RECEIPT + toAccount + RECEIPT) // 첫 번째 노드
	rootReceipt := RootReceipt{}
	json.Unmarshal([]byte(rr), &rootReceipt)

	lr, _ := stub.GetState(LAST_RECEIPT + toAccount + RECEIPT) // 마지막 노드
	lastReceipt := LastReceipt{}
	json.Unmarshal([]byte(lr), &lastReceipt)

	e, _ := json.Marshal(lastReceipt)
	fmt.Println("lstReceipt: ", string(e))

	receipt := Receipt{
		ReceiptId:     receiptId,
		TxId:          txId,
		NextReceiptId: "",
		PrevReceiptId: lastReceipt.ReceiptId,
		Status:        status,
	}

	receiptAsBytes, _ := json.Marshal(receipt)

	if (rootReceipt == (RootReceipt{})) == true {
		rootReceipt.ReceiptId = receiptId
		rootReceiptAsBytes, _ := json.Marshal(receipt)

		fmt.Println("root receipt id", string(rootReceiptAsBytes))
		stub.PutState(ROOT_RECEIPT+toAccount+RECEIPT, rootReceiptAsBytes)
		stub.PutState(NODE_RECEIPT+receiptId+RECEIPT, receiptAsBytes)
	} else {
		prevReceiptId := lastReceipt.ReceiptId
		prevReceipt, _ := stub.GetState(NODE_RECEIPT + prevReceiptId + RECEIPT)
		pr := Receipt{}
		json.Unmarshal([]byte(prevReceipt), &pr)

		pr.NextReceiptId = receiptId
		prAsBytes, _ := json.Marshal(pr)
		stub.PutState(NODE_RECEIPT+prevReceiptId+RECEIPT, prAsBytes)

		stub.PutState(NODE_RECEIPT+receiptId+RECEIPT, receiptAsBytes)
	}

	lastReceipt.ReceiptId = receiptId
	lastReceiptAsBytes, _ := json.Marshal(lastReceipt)
	fmt.Println("last receipt id", string(lastReceiptAsBytes))
	stub.PutState(LAST_RECEIPT+toAccount+RECEIPT, lastReceiptAsBytes)

	return receiptId
}

func (t *Token) get_tx(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	txInfo, _ := stub.GetState(args[0])

	return shim.Success(txInfo)
}

// 가장 처음 발생한 내역 가져오기
// args[0] : address
func (t *Token) get_root_receipt(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}

	address := args[0]

	rr, _ := stub.GetState(ROOT_RECEIPT + address + RECEIPT)
	rootReceipt := RootReceipt{}
	json.Unmarshal([]byte(rr), &rootReceipt)

	receipt, _ := stub.GetState(NODE_RECEIPT + rootReceipt.ReceiptId + RECEIPT)

	return shim.Success([]byte(receipt))
}

// 가장 마지막에 발생한 내역 가져오기
// args[0] : address
func (t *Token) get_last_receipt(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}

	address := args[0]

	lr, _ := stub.GetState(LAST_RECEIPT + address + RECEIPT)
	lastReceipt := LastReceipt{}
	json.Unmarshal([]byte(lr), &lastReceipt)

	receipt, _ := stub.GetState(NODE_RECEIPT + lastReceipt.ReceiptId + RECEIPT)

	return shim.Success([]byte(receipt))
}

// 모든내역 가져오기
// args[0] : address
func (t *Token) get_node_receipts(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	return shim.Success(nil)
}

// 특정 receipt 정보 가져오기
func (t *Token) get_receipt(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}

	receiptId := args[0]

	receipt, _ := stub.GetState(NODE_RECEIPT + receiptId + RECEIPT)

	return shim.Success([]byte(receipt))
	return shim.Success(nil)
}

func main() {
	if err := shim.Start(new(Token)); err != nil {
		fmt.Printf("Error starting Token chaincode: %s", err)
	}
}
