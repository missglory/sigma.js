import Surreal from 'surrealdb.js';
import { appendText, diffEditor, nameEditor, sortEditor } from './Editors';

export const db = new Surreal('http://127.0.0.1:8000/rpc');

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

diffEditor.getModel().setValue("select * from node");
nameEditor.getModel().setValue("node")

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

	sortEditor.getModel().setValue(resultString);
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
	const resultString = q
	.filter((n, i) => { return i < 1000; })
	.map(n => { return JSON.stringify(n, null, 1); })
	.join('\n');

	sortEditor.getModel().setValue(resultString);
	// sortEditor.getAction('editor.action.formatDocument').run();
}


document.getElementById("createButton").onclick = async (e) => {
	try {
		const val = JSON.parse(diffEditor.getValue());
		console.log(val);
	} catch(e) {
		alert("create error parse JSON");
	}
	const name = nameEditor.getValue();
	const q = await db.create(name, val);
	console.log(q);
	const resultString = q[0].result
	.filter((n, i) => { return i < 1000; })
	.map(n => { return JSON.stringify(n, null, 1); })
	.join('\n');

	sortEditor.getModel().setValue(resultString);
	// sortEditor.getAction('editor.action.formatDocument').run();
}


document.getElementById("updateButton").onclick = async (e) => {
	const val = diffEditor.getValue();
	console.log(val);
	const name = nameEditor.getValue();
const q = await db.update(name, val);
	console.log(q);
	const resultString = q[0].result
	.filter((n, i) => { return i < 1000; })
	.map(n => { return JSON.stringify(n, null, 1); })
	.join('\n');

	sortEditor.getModel().setValue(resultString);
	// sortEditor.getAction('editor.action.formatDocument').run();
}

