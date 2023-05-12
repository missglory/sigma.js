import Surreal from 'surrealdb.js';
import { appendText, diffEditor, nameEditor, sortEditor } from './Editors';

export const db = new Surreal('http://localhost:8000/rpc');

export async function surrealConnect() {

	try {

		// Signin to a scope from the browser
		await db.signin({
			// NS: 'test',
			// DB: 'test',
			// SC: 'user',
			user: 'root',
			pass: 'root',
		});

		// Select a specific namespace / database
		await db.use('test', 'test');

		// Create a new person with a random id
		// const created = await db.create("person", {
		// 	title: 'Founder & CEO',
		// 	name: {
		// 		first: 'Tobie',
		// 		last: 'Morgan Hitchcock',
		// 	},
		// 	marketing: true,
		// 	identifier: Math.random().toString(36).substr(2, 10),
		// });

		// Update a person record with a specific id
		// const updated = await db.change("person:jaime", {
		// 	marketing: false,
		// });

		// const upd = await db.change("person:xx", {
		// 	marketing: false,
		// });

		// // Select all people records
		// const people = await db.select("person");

		// // Perform a custom advanced query
		// const groups = await db.query('SELECT marketing, count() FROM type::table($tb) GROUP BY marketing', {
		// 	tb: 'account',
		// });

		// console.log("test")
		// console.log(people)
		// console.log(groups);

	} catch (e) {
		console.error('ERROR', e);
		alert("connection error");
	}
}

appendText("select * from node", diffEditor.getModel());
appendText("node", nameEditor.getModel());

// export async function query
document.getElementById("queryButton").onclick = async (e) => {
	const val = diffEditor.getValue();
	console.log(val);
	const q = await db.query(val, {});
	// appendText(JSON.stringify(q[0].result[0]), sortEditor.getModel());
	console.log(q);

	// let i = 0;
	// let resultString = "";
	// for (let res of q[0].result) {
	// 	// appendText(JSON.stringify(res), sortEditor.getModel());
	// 	resultString += JSON.stringify(res)
	// 	if (i++ > 1000) { break; }
	// }

	const resultString = q[0].result
		.filter((n, i) => { return i < 1000; })
		.map(n => { return JSON.stringify(n, null, 1); })
		.join('\n');

	appendText(resultString, sortEditor.getModel());
	// sortEditor.getAction('editor.action.formatDocument').run();
}

document.getElementById("deleteButton").onclick = async (e) => {
	const val = nameEditor.getValue();
	console.log(val);
	const q = await db.delete(val);
	console.log(q);
	// sortEditor.getAction('editor.action.formatDocument').run();
}

document.getElementById("selectButton").onclick = async (e) => {
	const val = nameEditor.getValue();
	console.log(val);
	const q = await db.select(val);

	console.log(q)
	let resultString = ''
	if (q["length"] > 0) {
		resultString = q
			.filter((n, i) => { return i < 1000; })
			.map(n => { return JSON.stringify(n, null, 1); })
			.join('\n');
	} else {
		resultString = JSON.stringify(q);
	}

	appendText(resultString, sortEditor.getModel());
	sortEditor.getAction('editor.action.formatDocument').run();
}


document.getElementById("createButton").onclick = async (e) => {
	try {
		const val = JSON.parse(diffEditor.getValue());
		// console.log(val);
		// const val = diffEditor.getValue();
		const name = nameEditor.getValue();
		let q;
		// if (val.length > 0) {
			console.log("create with val");
			console.log(val);
			q = await db.create(name, val);
		// } else {
		// 	q = await db.create(name);
		// }
		// console.log(q);
		let resultString = ''
		if (q["length"] > 0) {
			resultString = q
				.filter((n, i) => { return i < 1000; })
				.map(n => { return JSON.stringify(n, null, 1); })
				.join('\n');
		} else {
			resultString = JSON.stringify(q, null, 1);
		}

		appendText(resultString, sortEditor.getModel());
	} catch (e) {
		alert("create error parse JSON");
	}
	// sortEditor.getAction('editor.action.formatDocument').run();
}


document.getElementById("updateButton").onclick = async (e) => {
	const val = JSON.parse(diffEditor.getValue());
	console.log(val);
	const name = nameEditor.getValue();
	console.log("update with value");
	console.log(val);
	let q = await db.update(name, val);
	console.log(q);
	let resultString = ''
	if (q["length"] > 0) {
		resultString = q
		.filter((n, i) => { return i < 1000; })
		.map(n => { return JSON.stringify(n, null, 1); })
		.join('\n');
	} else {
			resultString = JSON.stringify(q, null, 1);
	}

	appendText(resultString, sortEditor.getModel());
	// sortEditor.getAction('editor.action.formatDocument').run();
}

