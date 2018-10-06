/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode Invoke
 */


// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting

var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');

var fabric_client;
var channel;
var peer;
var order;

var member_user = null;
var store_path = path.join(__dirname, '../hfc-key-store');
console.log('Store path:'+store_path);
var tx_id;

fabric_client = new Fabric_Client()
channel = fabric_client.newChannel('ydp');
peer = fabric_client.newPeer('grpc://127.0.0.1:7051');
channel.addPeer(peer);
order = fabric_client.newOrderer('grpc://127.0.0.1:7050')
channel.addOrderer(order);

async function invoke ({
	fcn,
	args
}) {

	let data;	

	let result = await Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
			// assign the store to the fabric client
			fabric_client.setStateStore(state_store);
			var crypto_suite = Fabric_Client.newCryptoSuite();
			// use the same location for the state store (where the users' certificate are kept)
			// and the crypto store (where the users' keys are kept)
			var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
			crypto_suite.setCryptoKeyStore(crypto_store);
			fabric_client.setCryptoSuite(crypto_suite);
		
			// get the enrolled user from persistence, this user will sign all requests
			return fabric_client.getUserContext('user2', true);
		}).then((user_from_store) => {
			if (user_from_store && user_from_store.isEnrolled()) {
				console.log('Successfully loaded user from persistence');
				member_user = user_from_store;
			} else {
				throw new Error('Failed to get user.... run registerUser.js');
			}
		
			// get a transaction id object based on the current user assigned to fabric client
			tx_id = fabric_client.newTransactionID();
			console.log("Assigning transaction_id: ", tx_id._transaction_id);
		
			var request = {
				chaincodeId: 'token', // -n 이름옵션
				fcn: fcn,
				args: args,
				chainId: 'ydp',  // -C 채널옵션
				txId: tx_id
			};
			// send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
		}).then((results) => {

		var proposalResponses = results[0];
		var proposal = results[1];
		let isProposalGood = false;
		if (proposalResponses && proposalResponses[0].response &&
			proposalResponses[0].response.status === 200) {
				isProposalGood = true;
				console.log('Transaction proposal was good');
				data = proposalResponses[0].response.payload.toString()
			} else {
				console.error('Transaction proposal was bad');
				data = proposalResponses[0].details
			}
		if (isProposalGood) {
			console.log(util.format(
				'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
				proposalResponses[0].response.status, proposalResponses[0].response.message));
	
			// build up the request for the orderer to have the transaction committed
			var request = {
				proposalResponses: proposalResponses,
				proposal: proposal
			};
	
			var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
			var promises = [];

			var sendPromise = channel.sendTransaction(request);
			promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
	
			let event_hub = channel.newChannelEventHub(peer);
	
			let txPromise = new Promise((resolve, reject) => {
				let handle = setTimeout(() => {
					event_hub.unregisterTxEvent(transaction_id_string);
					event_hub.disconnect();
					resolve('TIMEOUT'); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
				}, 3000);
				event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
					// this is the callback for transaction event status
					// first some clean up of event listener
					clearTimeout(handle);
	
					// now let the application know what happened
					var return_status = {event_status : code, tx_id : transaction_id_string};
					if (code !== 'VALID') {
						console.error('The transaction was invalid, code = ' + code);
						resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
					} else {
						console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
						resolve(return_status);
					}
				}, (err) => {
					//this is the callback if something goes wrong with the event registration or processing
					reject(new Error('There was a problem with the eventhub ::'+err));
				},
					{disconnect: true} //disconnect when complete
				);
				event_hub.connect();

			});
			promises.push(txPromise);

			return Promise.all(promises);
		} else {
			throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		}
	}).then((results) => {
		console.log('Send transaction promise and event listener promise have completed');
		// check the results in the order the promises were added to the promise all list
		if (results && results[0] && results[0].status === 'SUCCESS') {
			console.log('Successfully sent transaction to the orderer.');
			return { code: 201, data: data}
		} else {
			console.error('Failed to order the transaction. Error code: ' + response.status);
		}
	
		if(results && results[1] && results[1].event_status === 'VALID') {
			console.log('Successfully committed the change to the ledger by the peer');
		} else {
			console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
		}
	}).catch((err) => {
		console.error('Failed to invoke successfully :: ' + err);
		return { code: 500, data: data || err}
	});

	return result	
}

module.exports = invoke