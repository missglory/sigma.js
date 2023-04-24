import Surreal from 'surrealdb.js';
import { appendText, diffEditor, sortEditor } from './Editors';

export const db = new Surreal('http://127.0.0.1:8000/rpc');

export async function surrealConnect() {

	try {

// let token = await db.signup({
// 	NS: 'test',
// 	DB: 'test',
// 	SC: 'user',
// 	email: 'info@surrealdb.com',
// 	pass: '123456',
// });

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
		const created = await db.create("person", {
			title: 'Founder & CEO',
			name: {
				first: 'Tobie',
				last: 'Morgan Hitchcock',
			},
			marketing: true,
			identifier: Math.random().toString(36).substr(2, 10),
		});

		// Update a person record with a specific id
		const updated = await db.change("person:jaime", {
			marketing: false,
		});

		const upd = await db.change("person:xx", {
			marketing: false,
		});

		// Select all people records
		const people = await db.select("person");

		// Perform a custom advanced query
		const groups = await db.query('SELECT marketing, count() FROM type::table($tb) GROUP BY marketing', {
			tb: 'account',
		});

		console.log("test")
		console.log(people)
		console.log(groups);

	} catch (e) {

		console.error('ERROR', e);

	}

}

// export async function query
document.getElementById("queryButton").onclick = async (e) => {
	const val = diffEditor.getValue();
	console.log(val);
	const q = await db.query(val, {});
	// appendText(JSON.stringify(q[0].result[0]), sortEditor.getModel());
	console.log(q);
	sortEditor.getModel().setValue(JSON.stringify(q[0].result[0], null, 1));
	// sortEditor.getAction('editor.action.formatDocument').run();
}