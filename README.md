# 디렉터리 구조

```
hyperledger-fabric-token
├── chaincode/
│ └── token.go
├── chaincode-docker-devmode/
│ ├── docker-compose-simple.yaml
│ └── . . . 생 략 . . .
├── API/
└── README.md
```

# 체인코드 개발



* network up (첫 번째 터미널)

```bash
$ cd chaincode-docker-devmode
$ docker-compose -f docker-compose-simple.yaml up
```



* chaincode build (두 번째 터미널)

```bash
$ docker exec -it chaincode bash
$ cd token
$ go build
$ CORE_PEER_ADDRESS=peer:7052 CORE_CHAINCODE_ID_NAME=token:0 ./token
```





* chaincode 설치 및 실행 (세 번째 터미널)

```- 설치```

```bash
$ docker exec -it cli bash

$ peer chaincode install -p chaincodedev/chaincode/token -n token -v 0
$ peer chaincode instantiate -n token -v 0 -c '{"Args":["init","ParkJeongTae","PJT","10000000"]}' -C myc
```



```- 업그레이드```

업그레이드할 땐 버전을 잘 맞춰준다.

```bash
$ peer chaincode install -p chaincodedev/chaincode/token -n token -v 1
$ peer chaincode upgrade -n token -v 1 -c '{"Args":["init","ParkJeongTae","PJT","10000000"]}' -C myc
```



* 예시 호출

```bash
# 토큰정보 조회
$ peer chaincode query -n token -c '{"Args":["get_token_info"]}' -C myc

# 어카운트 생성 1
$ peer chaincode invoke -n token -c '{"Args":["create_account", "1", "100"]}' -C myc
# 어카운트 생성 2
$ peer chaincode invoke -n token -c '{"Args":["create_account", "2", "300"]}' -C myc

# 어카운트1 정보 조회
$ peer chaincode query -n token -c '{"Args":["get_account", "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b"]}' -C myc
# 어카운트2 정보 조회
$ peer chaincode query -n token -c '{"Args":["get_account", "d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35"]}' -C myc

# 토큰전송 어카운트1 -> 어카운트2
$ peer chaincode invoke -n token -c '{"Args":["transfer", "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b","d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35","30"]}' -C myc
# 토큰전송 어카운트2 -> 어카운트1
$ peer chaincode invoke -n token -c '{"Args":["transfer", "d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35","6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b","10"]}' -C myc

# root receipt account1 조회
$ peer chaincode query -n token -c '{"Args":["get_root_receipt", "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b"]}' -C myc
# root receipt account2 조회
$ peer chaincode query -n token -c '{"Args":["get_root_receipt", "d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35"]}' -C myc

# last receipt account1 조회
$ peer chaincode query -n token -c '{"Args":["get_last_receipt", "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b"]}' -C myc
# last receipt account2 조회
$ peer chaincode query -n token -c '{"Args":["get_last_receipt", "d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35"]}' -C myc

# 특정 receipt 조회
$ peer chaincode query -n token -c '{"Args":["get_receipt", "acf6aad4d454a9a80ef1c32231f6ff4728d982a66b877b156f168bb693596020"]}' -C myc

# tx 조회
$ peer chaincode query -n token -c '{"Args":["get_receipt", "e445b62fafae008942acdedb2f5043889b5692d3fcb757d5e5743d7ee516d90c"]}' -C myc
```



여기에 나오는 해시된 tx나 receipt는 **timestamp** 때문에 실제 결과와 다를 수 있음. 



* Todo List

1. 아직, receipt(어카운트에서 발생된 내역) 리스트 출력 부분은 구현하지 않음. 

2. tx, receipt는 account 구조체에 의해서 관리할 것(상태 관리가 용이해짐).

3. 모듈화

4. 샘플 API 코드를 추가한다
    
    4.1 API 코드

    4.2 샘플 요청파일(vs code REST client 플러그인에서 동작되는 파일: [사용법 알아보러 GoGo~](https://blog.naver.com/pjt3591oo/221346544567))



>  [golang으로 작성된 코드 보러가기](https://github.com/pjt3591oo/go-token) 해당 코드는 leveldb를 적용하여 cli 형태로 실행 가능하도록 수정작업이 필요함



