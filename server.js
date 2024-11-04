/** @format */

// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000 || process.env.PORT;

// Middleware
app.use(cors());
app.use(bodyParser.json());

const apiKey = process.env.REVOLUT_API_KEY;
const baseURL = 'https://sandbox-merchant.revolut.com'; // Use 'https://merchant.revolut.com' for live

// Create a new payment order
app.post('/api/create-payment', async (req, res) => {
	const { amount, currency, description, customer_email } = req.body;

	// Ensure all required fields are provided
	if (!amount || !currency || !description || !customer_email) {
		return res.status(400).json({ error: 'Missing required fields' });
	}

	console.log(amount, currency);

	try {
		// Prepare the request payload
		const data = {
			amount: amount * 100, // Convert to smallest currency units (e.g., pence)
			currency: currency,
			capture_mode: 'AUTOMATIC', // Use 'MANUAL' for delayed capture
			merchant_order_ext_ref: `order-${Date.now()}`, // Unique order reference
			description: description,
			customer_email: customer_email,
		};

		// Make the request to Revolut's API to create an order
		const config = {
			method: 'post',
			url: `${baseURL}/api/1.0/orders`,
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
				'Accept': 'application/json', // Accept JSON response
			},
			data: JSON.stringify(data), // Convert data object to JSON string
		};

		// Send the request using Axios
		const response = await axios(config);
		console.log('Payment created:', response.data);

		// Return the checkout URL to the frontend
		res.status(200).json({ paymentUrl: response.data.checkout_url });
	} catch (error) {
		console.error(
			'Error creating payment:',
			error.response ? error.response.data : error.message
		);
		res.status(500).json({
			error: 'Failed to create payment',
			details: error.response ? error.response.data : error.message,
		});
	}
});

// Example endpoint to handle refunds
app.post('/api/refund', async (req, res) => {
	const { order_id, amount, currency } = req.body;

	// Ensure all required fields are provided
	if (!order_id || !amount || !currency) {
		return res.status(400).json({ error: 'Missing required fields' });
	}

	try {
		// Prepare the request payload for refund
		const data = {
			amount: amount * 100, // Convert to smallest currency units
			currency: currency,
		};

		const config = {
			method: 'post',
			url: `${baseURL}/api/1.0/order/${order_id}/refund`,
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			data: JSON.stringify(data),
		};

		// Send the request using Axios
		const response = await axios(config);

		res.status(200).json({ message: 'Refund successful', data: response.data });
	} catch (error) {
		console.error(
			'Error processing refund:',
			error.response ? error.response.data : error.message
		);
		res.status(500).json({
			error: 'Failed to process refund',
			details: error.response ? error.response.data : error.message,
		});
	}
});

app.get('/', async (req, res) => {
	res.send('Welcome to the Revolut Payment Integration Server!');
});

// Start the server
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
