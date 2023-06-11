const express = require('express')
const { RPC_Observer, RPC_Request } = require('./RPC')
const PORT = 8000

const app = express()
app.use(express.json())


const fakeProductResponse = {
    _id: 'ythvchv34hvh3c5h78345',
    name: 'iPhone',
    price: 600
}

RPC_Observer('PRODUCT_RPC', fakeProductResponse)


app.get('/customer', async (req, res) => {

    const requestPayload = {
        customerId: 'ythvchv34hvh3c5h78345'
    }
    try {
        const responseData = await RPC_Request('CUSTOMER_RPC', requestPayload)
        return res.status(200).json(responseData)
    }
    catch (err) {
        return res.status(500).json(err)
    }
})

app.get('/', (req, res) => {
    return res.json('Product Service')
})

app.listen(PORT, () => {
    console.log(`Product Service : ${PORT}`)
    console.clear()
})