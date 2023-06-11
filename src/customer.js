const express = require('express')
const { RPC_Observer, RPC_Request } = require('./RPC')
const PORT = 9000

const app = express()
app.use(express.json())


const fakeCustomerResponse = {
    _id: 'ythvchv34hvh3c5h78345',
    name: 'John Doe',
    country: 'Sweden'
}

RPC_Observer('CUSTOMER_RPC', fakeCustomerResponse)

app.get('/wishlist', async (req, res) => {
    const requestPayload = {
        productId: '123',
        customerId: 'ythvchv34hvh3c5h78345'
    }
    
    try {
        const responseData = await RPC_Request('PRODUCT_RPC', requestPayload)
        return res.status(200).json(responseData)
    }
    catch (err) {
        return res.status(500).json(err)

    }
})

app.get('/', (req, res) => {
    return res.json('Customer Service')
})

app.listen(PORT, () => {
    console.log(`Customer Service : ${PORT}`)
    console.clear()
})