import Plotly from "plotly.js-dist";
import { appendText, fileNameEditor, graphEditor, regexEditor } from "./Editors";
import { editor } from 'monaco-editor';


appendText('\\b(?!return\\b|auto\\b|int\\b)[A-Za-z_][A-Za-z0-9_:]*\\b', regexEditor.getModel());

export const drawHistogram = () => {
	const file = fileNameEditor.getModel().getValue();
	const regex = regexEditor.getModel().getValue();
	fetch('http://localhost:5000/histogram?text=' + file + '&regex=' + regex)
		.then(response => response.json())
		.then(data => {
 			const selectEl = (document.getElementById("selectHistOrder")as HTMLSelectElement);
			const order = selectEl.value === "locale" ?
				(a: any, b: any) => b[0].localeCompare(a[0]) :
				(a: any, b: any) => b[1] - a[1];
			// Convert data to arrays for Plotly.js and sort by count in descending order
			let sortedData = Object.entries(data).sort(order);
			let x = sortedData.map(entry => entry[1]);
			let y = sortedData.map(entry => entry[0]);

			// Create Plotly.js histogram trace
			let trace = {
				x: x,
				y: y,
				type: 'histogramgl',
				// histfunc: 'sum',
				// histnorm: "count",
				hovertemplate: '%{x} occurrences of "%{y}"',
				marker: {
					color: 'pink',
					// line: {
					// color: '#000000',
					// width: 1
					// }
				}
			};

			// Create Plotly.js layout with zooming enabled
			let layout = {
				// title: 'Histogram of Text String',
				// xaxis: {
				// 	title: 'Substring',
				// 	fixedrange: true // disable panning in x direction
				// },
				yaxis: {
					// 	title: 'Count',
					// 	fixedrange: true // disable panning in y direction

				},
				// dragmode: 'pan', // enable panning
				// hovermode: 'closest', // show hover info for closest point
				// updatemenus: [{ // add zoom mode button
				// 	type: 'buttons',
				// 	showactive: false,
				// 	buttons: [{
				// 		label: 'Zoom',
				// 		method: 'zoom',
				// 		args: [
				// 			null, // zoom all directions
				// 			{
				// 				mode: 'xy' // zoom in both x and y directions
				// 			}
				// 		]
				// 	}]
				// }]
				margin: {
					r: 0,
					l: 220,
					t: 0,
					b: 10,
				},
				plot_bgcolor: 'black',
				paper_bgcolor: 'black',
				font: {
					color: 'white',
					size: 9
				},
			};

			// Draw Plotly.js histogram in WebGL canvas
			Plotly.newPlot('plot', [trace], layout, { renderer: 'webgl', responsive: true });

			appendText(sortedData.map((a) => a[1].toString() + ": " + a[0]).join("\n"), graphEditor.getModel());
		});
}
