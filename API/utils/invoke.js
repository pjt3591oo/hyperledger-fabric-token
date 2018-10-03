/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode Invoke
 */

var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');

//
var fabric_client = new Fabric_Client();

// setup the fabric network
var channel = fabric_client.newChannel('ydp');
var peer = fabric_client.newPeer('grpc://127.0.0.1:7051');
channel.addPeer(peer);
var order = fabric_client.newOrderer('grpc://127.0.0.1:7050')
channel.addOrderer(order);
console.log(channel)
//
var member_user = null;
var store_path = path.join(__dirname, '../hfc-key-store');
console.log('Store path:'+store_path);
var tx_id = null;

// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting

function invoke ({
	fcn,
	args
}) {

	let data;	

	return new Promise((resolve, reject) => {
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
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

				var sendPromise = channel.sendTransaction(request);

				return Promise.all( [sendPromise] );
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
			}
		}).then((results) => {
			console.log('Send transaction commited completed');
			// check the results in the order the promises were added to the promise all list
			resolve(data)	
		}).catch((err) => {
			console.log(`Send transaction commited failed: ${err}`)
			reject(data)
		})
	})	
}

module.exports = invoke