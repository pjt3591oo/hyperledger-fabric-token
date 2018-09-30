# version 1.0 API 목록

### 1. endPoint

* ip
```
52.231.158.69:3000 # 테스트 서버
98.19.10.119:3000  # 영등포 운영서버
```

* path

```
/api/v1.0/chaicode/proposalEvaluat
```

------

### 2. 평가결과 조회

* method: GET

* path

```
/
```

* rquest

```json
query string

{
    projId : projId,
    store: store,
}
```

* response

```json
정상적으로 조회사 됬을 때 : 200 코드
{
    "projId": "2",
    "entrprsMberId": "1",
    "evaluerId": "3",
    "itemScore0": "1",
    "itemScore1": "2",
    "itemScore2": "3",
    "itemScore3": "44",
    "sumScore": "0",
    "negoRank": "0"
}

projId가 비었을 때 : 404 코드
{
    message : "params is blank"
}

projId가 블록체인상에 없을 때 : 404 코드
{
    message : "data not exist about projId"
}

알수없는 에러발생 : 500코드
{
    message: "something error"
}
```



### 3. 평가결과 저장

* method: GET

* path

```
/save
```

* rquest

```json
query string

{
    projId : projId,
    store: store,
    entrprsMberId : entrprsMberId,
    itemScore0 : itemScore0,
    itemScore1 : itemScore1,
    itemScore2 : itemScore2,
    itemScore3 : itemScore3,
    sumScore : sumScore,
    negoRank : negoRank,
}
```

* response

```json
블록체인에 저장이 성공했을 때 : 201코드
{
    "message": "success"
}

body 데이터중 하나라도 비었을 때 : 404 코드
{
    message : "전달 인자중 비어있는 값 존재"
}

트랜잭션 처리중 문제발생할 때: 500 코드
{
    message : "transaction 처리 중 문제발생"
}


```