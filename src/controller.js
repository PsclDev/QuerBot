import fs from "fs";
import client from "./client.js";

async function getUserID(userHandle) {
	let user = await client.v2.userByUsername(userHandle);
	if (user.hasOwnProperty("data")) {
		let id = user.data.id;
		return id;
	} else {
		return console.log(`${userHandle} ist entweder falsch, gesperrt oder existiert nicht.`);
	}
}

async function getFollowings(userID) {
	const followings = await client.v2.following(userID, { asPaginator: true, max_results: 1000 });
	let followingList = [];
	for await (const follows of followings) {
		followingList.push(follows);
	}
	return followingList;
}

async function getMentions(botID) {
	let timeline = await client.v2.userMentionTimeline(botID, {
		max_results: 100,
	});
	let tweets = timeline.data.data;
	for (const tweet of tweets) {
		let tweetText = tweet.text;
		let tweetID = tweet.id;
		if (tweetText.includes("check")) {
			let userArr = tweetText.match(/@\w+/g).map((x) => x.substring(1));
			let getUser = userArr.filter((user) => user !== process.env.BOT_HANDLE).toString();
			getUserID(getUser);
		}
	}
}

async function checkFollowers(userHandle, checkList) {
	const userID = await getUserID(userHandle);
	const userFollowings = await getFollowings(userID);
	let positives = 0;
	let followingsLength = userFollowings.length;
	let percentage = 0;
	for await (const follow of userFollowings) {
		let getFollow = follow.username;
		getFollow = getFollow.toLowerCase();
		let userDoesFollow = checkList.filter((userObj) => userObj.userName === getFollow).length;
		if (userDoesFollow) {
			positives++;
			console.log(getFollow);
		}
	}

	percentage = positives / (followingsLength / 100);
	console.log("- - - - - - - - - - - - - - - - - - - - - - - -");
	console.log("- - - - - - - - - - - - - - - - - - - - - - - -");
	console.log("- - - - - - - - - - - - - - - - - - - - - - - -");
	console.log("- - - - - - - - - - - - - - - - - - - - - - - -");
	console.log(`Mindestens ${positives} von ${followingsLength} Accounts (${percentage}%) denen ${userHandle} folgt,`);
	console.log("weisen Querdenkernähe auf oder sind Querdenker.");
	console.log("- - - - - - - - - - - - - - - - - - - - - - - -");
	console.log("- - - - - - - - - - - - - - - - - - - - - - - -");
	console.log("- - - - - - - - - - - - - - - - - - - - - - - -");
	console.log("- - - - - - - - - - - - - - - - - - - - - - - -");

	if (followingsLength <= 10) {
		if (percentage >= 50) {
			await addToList(userHandle, userID, checkList);
		} else {
			await threshholdNotReachedMsg(userHandle);
		}
	} else if (followingsLength <= 20) {
		if (percentage >= 25) {
			await addToList(userHandle, userID, checkList);
		} else {
			await threshholdNotReachedMsg(userHandle);
		}
	} else if (followingsLength <= 50) {
		if (percentage >= 15) {
			await addToList(userHandle, userID, checkList);
		} else {
			await threshholdNotReachedMsg(userHandle);
		}
	} else {
		if (positives >= 15 || percentage >= 10) {
			await addToList(userHandle, userID, checkList);
		} else {
			await threshholdNotReachedMsg(userHandle);
		}
	}
}

async function threshholdNotReachedMsg(userHandle) {
	return console.log(`${userHandle} folgt zu wenigen querdenkernahen/Querdenker Accounts und wird daher nicht zur Liste hinzugefügt`);
}

async function addToList(userHandle, userID, list) {
	let checkUserHandle = list.filter((userObj) => userObj.userName === userHandle.toLowerCase()).length;
	let checkUserID = list.filter((userObj) => userObj.userID === parseInt(userID)).length;

	if (checkUserHandle === 0 || checkUserID === 0) {
		let userList = list;
		let userObj = await makeUserObject(userHandle, userID);
		userList.push(userObj);
		let jsonContent = JSON.stringify(userList);
		fs.writeFile("./assets/accounts.json", jsonContent, "utf-8", function (e) {
			if (e) {
				return console.log(e);
			}
			return console.log(`${userObj.userName} mit der ID ${userObj.userID} wurde erfolgreich zur Liste hinzugefügt`);
		});
	} else {
		return console.log(`${userHandle} mit der ID ${userID} ist schon Teil der Liste und wurde nicht hinzugefügt`);
	}
}

async function makeUserObject(userName, userID) {
	let userObject = {};
	userObject.userID = parseInt(userID);
	userObject.userName = userName.toLowerCase();
	return userObject;
}

export { getMentions, checkFollowers };
