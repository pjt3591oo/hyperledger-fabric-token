# 디렉터리 구조

```
hyperledger-fabric-token
├── chaincode/
│ └── token.go
├── chaincode-docker-devmode/
│ ├── docker-compose-simple.yaml
│ └── . . . 생 략 . . .
├── API/
├── network/
└── README.md
```

* chaincode

체인코드 파일이 저장되는 디렉터리 입니다. 해당 프로젝트는 go를 사용하여 체인코드 개발합니다.

* chaincode-docker-devmode

체인코드 개발가능한 환경을 배포하는 디렉터리입니다.

API와 연동하기 위해서는 개발 모드를 사용하면 안됩니다.

* API

배포된 체인코드를 연동한 서버측 코드입니다. 해당 서버는 chaincode-docker-devmode로 배포된 환경으로는 연결할 수 없습니다.

* network

peer 2개, ca 1개, orderer 1개의 노드로 구성된 네트워크를 생성합니다. 여기서 네트워크가 생성되면 API와 연동가능 합니다.

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
peer chaincode install -p chaincodedev/chaincode/token -n token -v 10
peer chaincode upgrade -n token -v 10 -c '{"Args":["init","ParkJeongTae","PJT","10000000"]}' -C myc

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
$ peer chaincode query -n token -c '{"Args":["get_receipt", "4b243d2f2681cb760e751b98f2d6b429f40fa146ce412eae0c7f2dbd2b06fe22"]}' -C myc

# 특정 account의 모든 receipt 조회
$ peer chaincode query -n token -c '{"Args":["get_receipts", "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b"]}' -C myc

# tx 조회
$ peer chaincode query -n token -c '{"Args":["get_tx", "91df96c07dd8ff65240ff47e788e2eea7a0c78e34764c901e3a34a4ab181ec02"]}' -C myc
```



여기에 나오는 해시된 tx나 receipt는 **timestamp** 때문에 실제 결과와 다를 수 있음. 



* Todo List


1. tx, receipt는 account 구조체에 의해서 관리할 것(상태 관리가 용이해짐).

2. 모듈화

3. 샘플 API 코드를 추가한다
  
    3.1 API 코드

    3.2 샘플 요청파일(vs code REST client 플러그인에서 동작되는 파일: [사용법 알아보러 GoGo~](https://blog.naver.com/pjt3591oo/221346544567))



>  [golang으로 작성된 코드 보러가기](https://github.com/pjt3591oo/go-token) 해당 코드는 leveldb를 적용하여 cli 형태로 실행 가능하도록 수정작업이 필요함



